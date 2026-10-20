/**
 * Acts the resolver held.
 *
 * The claim this file has to keep honest is narrow and load-bearing: **an act
 * gated at A1 or A2 does not happen until somebody approves it.** So the tests
 * are about what *runs*, not about what is stored — a queue that records
 * everything and executes at the wrong moment is worse than no queue, because it
 * looks like a control.
 */

import { ActReviewService, COMMIT_WINDOW_MS, PendingActService, PENDING_ACT_TTL_MS } from '../pendingActService'

const TENANT = 'tenant-1'
const ORG = 'org-1'

type Row = Record<string, unknown>

function createFakeEm(rows: Row[] = []) {
  const flush = jest.fn(async () => {})
  const em = {
    create: jest.fn((_entity: unknown, data: Row) => ({ id: `act-${rows.length + 1}`, ...data })),
    persist: jest.fn((row: Row) => {
      rows.push(row)
      return { flush }
    }),
    flush,
    findOne: jest.fn(async (_entity: unknown, where: Row) =>
      rows.find((row) => row.id === where.id && row.tenantId === where.tenantId) ?? null,
    ),
    find: jest.fn(async (_entity: unknown, where: Row) =>
      rows.filter((row) => {
        if (row.tenantId !== where.tenantId) return false
        if (where.status && row.status !== where.status) return false
        const expiryBound = (where.expiresAt as { $lte?: Date } | undefined)?.$lte
        if (expiryBound && !((row.expiresAt as Date) <= expiryBound)) return false
        const commitBound = (where.commitAt as { $lte?: Date } | undefined)?.$lte
        if (commitBound && !(row.commitAt && (row.commitAt as Date) <= commitBound)) return false
        return true
      }),
    ),
    /**
     * `T-05` — the fake models the ONE thing the claim relies on: the condition and the write are a
     * single statement. It matches against the rows as they are **now**, applies the data to every
     * match, and returns how many matched — exactly what MikroORM's `nativeUpdate` returns. A fake
     * that ignored the condition would make the race test green for the wrong reason.
     */
    nativeUpdate: jest.fn(async (_entity: unknown, where: Row, data: Row) => {
      const condition = where.status as string | { $in?: string[] } | undefined
      const matches = rows.filter((row) => {
        if (row.id !== where.id || row.tenantId !== where.tenantId) return false
        if (typeof condition === 'string') return row.status === condition
        if (condition && Array.isArray(condition.$in)) return condition.$in.includes(row.status as string)
        return true
      })
      for (const row of matches) Object.assign(row, data)
      return matches.length
    }),
  }
  return { em, rows, flush }
}

const decision = {
  gate: 'A2',
  allowed: true,
  bindingRule: 'effect-class-floor',
  reasons: [{ rule: 'effect-class-floor', ceiling: 'A2', detail: 'E5 act on G1 work permits at most A2' }],
  obligations: [{ kind: 'approval', detail: 'A person must approve before the act executes' }],
  alternatives: [],
} as never

function holdInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    tenantId: TENANT,
    organizationId: ORG,
    commandId: 'directory.organizations.update',
    capabilityId: 'directory.organizations.manage',
    commandInput: { id: 'org-9', name: 'Renamed' },
    actorId: 'user-1',
    actorKind: 'human',
    decision,
    ...overrides,
  } as never
}

function makeContainer(execute: jest.Mock) {
  return { resolve: () => ({ execute }) } as never
}

describe('holding an act', () => {
  it('records it as pending with a deadline', async () => {
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)

    await service.hold(holdInput())

    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe('pending')
    // Mandatory expiry (planning 02 §7.2): a request that can sit forever is a
    // refusal nobody had to justify.
    const expiresAt = rows[0].expiresAt as Date
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now())
    expect(expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + PENDING_ACT_TTL_MS + 1000)
  })

  it('keeps the whole decision, not just the gate', async () => {
    // The queue has to say *why* an act was held. Re-resolving at display time
    // would answer what the rules say now, and quietly disagree with the reason
    // the act was actually held.
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)

    await service.hold(holdInput())

    expect(rows[0].decision).toBe(decision)
    expect(rows[0].bindingRule).toBe('effect-class-floor')
  })
})

describe('approving a held act', () => {
  it('runs the command that was held', async () => {
    const execute = jest.fn(async () => ({}))
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.hold(holdInput())

    const result = await service.approve({
      tenantId: TENANT,
      id: rows[0].id as string,
      approverUserId: 'approver-1',
      container: makeContainer(execute),
      auth: { sub: 'approver-1' },
    })

    expect(result.ok).toBe(true)
    expect(execute).toHaveBeenCalledWith('directory.organizations.update', expect.objectContaining({
      input: { id: 'org-9', name: 'Renamed' },
    }))
    expect(rows[0].status).toBe('approved')
    expect(rows[0].resolvedByUserId).toBe('approver-1')
  })

  it('runs it in the organization it was proposed for, not the approver\'s', async () => {
    // An act proposed for one organization must not land in another because the
    // approver happened to be looking somewhere else.
    const execute = jest.fn(async () => ({}))
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.hold(holdInput())

    await service.approve({
      tenantId: TENANT,
      id: rows[0].id as string,
      approverUserId: 'approver-1',
      container: makeContainer(execute),
      auth: { sub: 'approver-1' },
    })

    expect(execute.mock.calls[0][1].ctx.selectedOrganizationId).toBe(ORG)
  })

  it('marks the replay so the gate does not hold it again', async () => {
    // Without this an approval re-resolves the act, holds it, and queues a second
    // copy — a queue that cannot be emptied.
    const execute = jest.fn(async () => ({}))
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.hold(holdInput())

    await service.approve({
      tenantId: TENANT,
      id: rows[0].id as string,
      approverUserId: 'approver-1',
      container: makeContainer(execute),
      auth: { sub: 'approver-1' },
    })

    const ctx = execute.mock.calls[0][1].ctx as Record<symbol, unknown>
    expect(Object.getOwnPropertySymbols(ctx)).toContain(Symbol.for('open-mercato.authority.approvedActReplay'))
  })

  it('refuses an act past its deadline, and does not run it', async () => {
    const execute = jest.fn(async () => ({}))
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.hold(holdInput())
    rows[0].expiresAt = new Date(Date.now() - 1000)

    const result = await service.approve({
      tenantId: TENANT,
      id: rows[0].id as string,
      approverUserId: 'approver-1',
      container: makeContainer(execute),
      auth: { sub: 'approver-1' },
    })

    expect(result).toMatchObject({ ok: false, reason: 'expired' })
    expect(execute).not.toHaveBeenCalled()
    expect(rows[0].status).toBe('expired')
  })

  it('refuses to run the same act twice', async () => {
    const execute = jest.fn(async () => ({}))
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.hold(holdInput())
    const id = rows[0].id as string
    const container = makeContainer(execute)

    await service.approve({ tenantId: TENANT, id, approverUserId: 'a', container, auth: {} })
    const second = await service.approve({ tenantId: TENANT, id, approverUserId: 'a', container, auth: {} })

    expect(second).toMatchObject({ ok: false, reason: 'already-approved' })
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('T-05 — two approvers at the same instant run it ONCE, and the claim decides which', async () => {
    // The sequential test above passes even without a claim, because the first call has already
    // written `approved` before the second reads. The race is two reads that both see `pending`, so
    // both approvals are started before either can finish — the shape a real double-click or two
    // administrators produce. Without the compare-and-set both execute the command.
    const execute = jest.fn(async () => ({}))
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.hold(holdInput())
    const id = rows[0].id as string
    const container = makeContainer(execute)

    const [first, second] = await Promise.all([
      service.approve({ tenantId: TENANT, id, approverUserId: 'a', container, auth: {} }),
      service.approve({ tenantId: TENANT, id, approverUserId: 'b', container, auth: {} }),
    ])

    expect(execute).toHaveBeenCalledTimes(1)
    expect([first.ok, second.ok].sort()).toEqual([false, true])
    const loser = first.ok ? second : first
    expect(loser.ok).toBe(false)
    expect((loser as { reason: string }).reason).toMatch(/^already-/)
    expect(rows[0].status).toBe('approved')
  })

  it('T-05 — a veto cannot overwrite an approval that has already claimed the row', async () => {
    // The rejection reads `pending`, then writes. If an approval claims the row between those two
    // moments, an unconditional write would replace `approving` with `rejected` while the command is
    // already running — the act would execute and be recorded as vetoed.
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => { release = resolve })
    const execute = jest.fn(async () => { await gate; return {} })
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.hold(holdInput())
    const id = rows[0].id as string

    const approving = service.approve({ tenantId: TENANT, id, approverUserId: 'a', container: makeContainer(execute), auth: {} })
    // Let the approval reach the claim and block inside the command.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(rows[0].status).toBe('approving')

    const rejected = await service.reject({ tenantId: TENANT, id, approverUserId: 'b', note: 'no' })
    expect(rejected).toMatchObject({ ok: false, reason: 'already-approving' })
    expect(rows[0].status).toBe('approving')

    release()
    await approving
    expect(rows[0].status).toBe('approved')
  })

  it('records a failure instead of leaving the act approvable again', async () => {
    // An act that was authorised and then broke is not an unapproved one, and
    // showing it as pending would invite somebody to approve it repeatedly.
    const execute = jest.fn(async () => { throw new Error('constraint violated') })
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.hold(holdInput())

    const result = await service.approve({
      tenantId: TENANT,
      id: rows[0].id as string,
      approverUserId: 'approver-1',
      container: makeContainer(execute),
      auth: {},
    })

    expect(result).toMatchObject({ ok: false, reason: 'execution-failed' })
    expect(rows[0].status).toBe('failed')
    expect(rows[0].failureReason).toContain('constraint violated')
  })

  it('does not resolve an act belonging to another tenant', async () => {
    const execute = jest.fn(async () => ({}))
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.hold(holdInput())

    const result = await service.approve({
      tenantId: 'tenant-2',
      id: rows[0].id as string,
      approverUserId: 'approver-1',
      container: makeContainer(execute),
      auth: {},
    })

    expect(result).toMatchObject({ ok: false, reason: 'not-found' })
    expect(execute).not.toHaveBeenCalled()
  })
})

describe('rejecting a held act', () => {
  it('never runs the command', async () => {
    const execute = jest.fn(async () => ({}))
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.hold(holdInput())

    const result = await service.reject({
      tenantId: TENANT,
      id: rows[0].id as string,
      approverUserId: 'approver-1',
      note: 'not this one',
    })

    expect(result.ok).toBe(true)
    expect(rows[0].status).toBe('rejected')
    expect(rows[0].resolutionNote).toBe('not this one')
    expect(execute).not.toHaveBeenCalled()
  })

  it('cannot reject an act that already ran', async () => {
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.hold(holdInput())
    rows[0].status = 'approved'

    await expect(service.reject({
      tenantId: TENANT,
      id: rows[0].id as string,
      approverUserId: 'approver-1',
    })).resolves.toMatchObject({ ok: false, reason: 'already-approved' })
  })
})

describe('the queue', () => {
  it('expires overdue acts before showing anybody a list', async () => {
    // Expiry on read rather than by a scheduler: deadlines that only apply when
    // background workers are healthy are not deadlines.
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.hold(holdInput())
    rows[0].expiresAt = new Date(Date.now() - 1000)

    const items = await service.list(TENANT, 'all')

    expect(items[0].status).toBe('expired')
  })

  it('carries the reason and the obligations out to the reader', async () => {
    const { em } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.hold(holdInput())

    const items = await service.list(TENANT, 'all')

    expect(items[0].because).toContain('permits at most A2')
    expect(items[0].obligations).toContain('A person must approve before the act executes')
  })
})

/**
 * `A4` — execute and review.
 *
 * The opposite shape from a held act: this one already happened. What binds is
 * not a block but a record somebody still has to close, and the tests are about
 * the two ways that goes wrong — losing the record, or letting a failure to file
 * it look like a failure of the act itself.
 */
describe('filing an act for review after it ran', () => {
  const reviewInput = {
    tenantId: TENANT,
    organizationId: ORG,
    commandId: 'currencies.currencies.update',
    capabilityId: 'currencies.manage',
    actionLogId: 'log-1',
    actorId: 'key-1',
    actorKind: 'service',
    decision,
  } as never

  it('records what ran, with the reason it was reviewable', async () => {
    const { em, rows } = createFakeEm()
    const service = new ActReviewService(em as never)

    await service.record(reviewInput)

    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe('awaiting')
    expect(rows[0].actionLogId).toBe('log-1')
    expect(rows[0].decision).toBe(decision)
  })

  it('has no deadline, unlike a held act', async () => {
    // An approval nobody answers has work blocked behind it and must expire. A
    // review nobody does blocks nothing, and an unreviewed act is exactly what
    // somebody should still be able to find next quarter.
    const { em, rows } = createFakeEm()
    const service = new ActReviewService(em as never)

    await service.record(reviewInput)

    expect(rows[0].expiresAt).toBeUndefined()
  })

  it('never throws at the caller, because the act already committed', async () => {
    // Failing the request now would tell somebody their write did not land when
    // it did. A missing review row is a real gap; lying about a successful write
    // to report it is a worse one.
    const em = {
      create: () => { throw new Error('[internal] boom') },
      persist: () => ({ flush: async () => {} }),
      flush: async () => {},
      find: async () => [],
      findOne: async () => null,
    }
    const service = new ActReviewService(em as never)

    await expect(service.record(reviewInput)).resolves.toBeNull()
  })

  it('closes a review once, and not twice', async () => {
    const { em, rows } = createFakeEm()
    const service = new ActReviewService(em as never)
    await service.record(reviewInput)
    const id = rows[0].id as string

    const first = await service.markReviewed({ tenantId: TENANT, id, reviewerUserId: 'r-1', note: 'looks fine' })
    const second = await service.markReviewed({ tenantId: TENANT, id, reviewerUserId: 'r-1' })

    expect(first).toEqual({ ok: true })
    expect(rows[0].status).toBe('reviewed')
    expect(rows[0].reviewNote).toBe('looks fine')
    expect(second).toMatchObject({ ok: false, reason: 'already-reviewed' })
  })

  it('does not close a review belonging to another tenant', async () => {
    const { em, rows } = createFakeEm()
    const service = new ActReviewService(em as never)
    await service.record(reviewInput)

    const outcome = await service.markReviewed({
      tenantId: 'tenant-2',
      id: rows[0].id as string,
      reviewerUserId: 'r-1',
    })

    expect(outcome).toMatchObject({ ok: false, reason: 'not-found' })
    expect(rows[0].status).toBe('awaiting')
  })
})

/**
 * `A3` — hold and commit unless vetoed.
 *
 * The difference from an approval is not the waiting, it is what the waiting
 * ends in. An unanswered approval **expires** and never happens; an unopposed
 * hold **commits** and does. Getting those two the wrong way round would either
 * run things nobody sanctioned or silently drop work, so the tests are about
 * which end each one reaches.
 */
describe('an act held until its window passes', () => {
  const a3Decision = { ...(decision as object), gate: 'A3' } as never

  it('commits rather than expires, and says when', async () => {
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)

    await service.holdUntilCommit(holdInput({ decision: a3Decision }))

    expect(rows[0].status).toBe('holding')
    const commitAt = rows[0].commitAt as Date
    expect(commitAt.getTime()).toBeGreaterThan(Date.now())
    expect(commitAt.getTime()).toBeLessThanOrEqual(Date.now() + COMMIT_WINDOW_MS + 1000)
  })

  it('runs when the window has passed', async () => {
    const execute = jest.fn(async () => ({}))
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.holdUntilCommit(holdInput({ decision: a3Decision }))
    rows[0].commitAt = new Date(Date.now() - 1000)

    const outcome = await service.commitDue({ tenantId: TENANT, container: makeContainer(execute), systemAuth: {} })

    expect(outcome).toEqual({ committed: 1, failed: 0 })
    expect(execute).toHaveBeenCalledTimes(1)
    expect(rows[0].status).toBe('committed')
  })

  it('T-05 — two sweeps that both saw the same due act run it ONCE', async () => {
    // The sweep reads the due list and then acts on it. Two overlapping sweeps (or a sweep and a
    // manual approval) both see `holding`; without a claim both execute the command, and "commits
    // unless vetoed" stops being true.
    const execute = jest.fn(async () => ({}))
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.holdUntilCommit(holdInput({ decision: a3Decision }))
    rows[0].commitAt = new Date(Date.now() - 1000)
    const container = makeContainer(execute)

    const [a, b] = await Promise.all([
      service.commitDue({ tenantId: TENANT, container, systemAuth: {} }),
      service.commitDue({ tenantId: TENANT, container, systemAuth: {} }),
    ])

    expect(execute).toHaveBeenCalledTimes(1)
    expect(a.committed + b.committed).toBe(1)
    expect(rows[0].status).toBe('committed')
  })

  it('does not run before the window has passed', async () => {
    const execute = jest.fn(async () => ({}))
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.holdUntilCommit(holdInput({ decision: a3Decision }))

    await service.commitDue({ tenantId: TENANT, container: makeContainer(execute), systemAuth: {} })

    expect(execute).not.toHaveBeenCalled()
    expect(rows[0].status).toBe('holding')
  })

  it('records no approver, because nobody made this decision', async () => {
    // It committed because a window passed, not because a person decided.
    // Recording an approver here would attribute a choice that was never made.
    const execute = jest.fn(async () => ({}))
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.holdUntilCommit(holdInput({ decision: a3Decision }))
    rows[0].commitAt = new Date(Date.now() - 1000)

    await service.commitDue({ tenantId: TENANT, container: makeContainer(execute), systemAuth: {} })

    expect(rows[0].resolvedByUserId).toBeUndefined()
    expect(rows[0].resolvedAt).toBeInstanceOf(Date)
  })

  it('a veto stops it permanently', async () => {
    const execute = jest.fn(async () => ({}))
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.holdUntilCommit(holdInput({ decision: a3Decision }))

    const vetoed = await service.reject({
      tenantId: TENANT,
      id: rows[0].id as string,
      approverUserId: 'objector-1',
      note: 'not this one',
    })
    rows[0].commitAt = new Date(Date.now() - 1000)
    await service.commitDue({ tenantId: TENANT, container: makeContainer(execute), systemAuth: {} })

    expect(vetoed.ok).toBe(true)
    expect(rows[0].status).toBe('vetoed')
    expect(execute).not.toHaveBeenCalled()
  })

  it('one act that throws does not freeze every other hold behind it', async () => {
    const execute = jest.fn()
      .mockImplementationOnce(async () => { throw new Error('constraint violated') })
      .mockImplementationOnce(async () => ({}))
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.holdUntilCommit(holdInput({ decision: a3Decision }))
    await service.holdUntilCommit(holdInput({ decision: a3Decision }))
    for (const row of rows) row.commitAt = new Date(Date.now() - 1000)

    const outcome = await service.commitDue({ tenantId: TENANT, container: makeContainer(execute), systemAuth: {} })

    expect(outcome).toEqual({ committed: 1, failed: 1 })
    expect(rows[0].status).toBe('failed')
    expect(rows[1].status).toBe('committed')
  })

  it('does not sweep another tenant’s acts', async () => {
    // The schedule is per tenant. A sweep that reached across them would run one
    // customer's work on another customer's timer.
    const execute = jest.fn(async () => ({}))
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.holdUntilCommit(holdInput({ decision: a3Decision, tenantId: 'tenant-2' }))
    rows[0].commitAt = new Date(Date.now() - 1000)

    const outcome = await service.commitDue({ tenantId: TENANT, container: makeContainer(execute), systemAuth: {} })

    expect(outcome).toEqual({ committed: 0, failed: 0 })
    expect(rows[0].status).toBe('holding')
  })

  it('does not touch acts that are waiting for a person', async () => {
    // An A1/A2 act has no commit window. Committing one would run something
    // nobody approved, which is the exact failure this whole layer exists to
    // prevent.
    const execute = jest.fn(async () => ({}))
    const { em, rows } = createFakeEm()
    const service = new PendingActService(em as never)
    await service.hold(holdInput())
    rows[0].expiresAt = new Date(Date.now() - 1000)

    const outcome = await service.commitDue({ tenantId: TENANT, container: makeContainer(execute), systemAuth: {} })

    expect(outcome).toEqual({ committed: 0, failed: 0 })
    expect(execute).not.toHaveBeenCalled()
    expect(rows[0].status).toBe('pending')
  })
})

