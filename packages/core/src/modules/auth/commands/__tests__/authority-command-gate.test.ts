/**
 * The gate that makes an obligation bind.
 *
 * Enforcement could refuse an act (`A0`) and nothing else. `A1` and `A2` — *"the
 * worker proposes; a human performs"* and *"executes only after approval"* —
 * were recorded as obligations while the act ran anyway, which is a control in
 * name only.
 *
 * What these tests protect is the narrow claim: **a held act does not run, and a
 * refused act does not run either** — and everything the gate declines to gate,
 * it declines to gate on purpose.
 */

import { ActHeldForApprovalError, AuthorityRefusedError, authorityCommandGate } from '../interceptors'
import { APPROVED_ACT_REPLAY } from '@open-mercato/core/modules/auth/services/pendingActService'

const TENANT = 'tenant-1'
const GATED_COMMAND = 'directory.organizations.update'
const UNMAPPED_COMMAND = 'example.todo.update'
const CAPABILITY = 'directory.organizations.manage'

const hold = jest.fn(async () => ({ id: 'act-1' }))
const holdUntilCommit = jest.fn(async () => ({ id: 'act-2' }))

function makeContext(options: {
  mode?: string
  gate?: string | null
  commandId?: string
  markReplay?: boolean
  auth?: Record<string, unknown> | null
}) {
  const enforcement = {
    modeFor: jest.fn(async () => options.mode ?? 'enforce'),
    decideFor: jest.fn(async () => (options.gate
      ? {
          gate: options.gate,
          allowed: options.gate !== 'A0',
          bindingRule: 'effect-class-floor',
          reasons: [{ rule: 'effect-class-floor', ceiling: options.gate, detail: 'because' }],
          obligations: [],
          alternatives: [],
        }
      : null)),
  }
  const context: Record<string | symbol, unknown> = {
    commandId: options.commandId ?? GATED_COMMAND,
    capability: (options.commandId ?? GATED_COMMAND) === GATED_COMMAND ? CAPABILITY : null,
    auth: options.auth === undefined ? { sub: 'user-1', tenantId: TENANT, orgId: 'org-1' } : options.auth,
    selectedOrganizationId: 'org-1',
    container: {
      resolve: (name: string) => {
        if (name === 'authorityEnforcement') return enforcement
        if (name === 'pendingActService') return { hold, holdUntilCommit }
        return null
      },
    },
  }
  if (options.markReplay) context[APPROVED_ACT_REPLAY] = 'act-1'
  return { context, enforcement }
}

beforeEach(() => {
  hold.mockClear()
  holdUntilCommit.mockClear()
})

describe('what the gate holds', () => {
  it('holds an act at A2 and stops it running', async () => {
    const { context } = makeContext({ gate: 'A2' })

    await expect(authorityCommandGate.beforeExecute!({ id: 'org-9' }, context as never))
      .rejects.toBeInstanceOf(ActHeldForApprovalError)
    expect(hold).toHaveBeenCalledTimes(1)
  })

  it('holds an A3 act until its window passes, rather than until somebody answers', async () => {
    // The difference is what the waiting ends in: an unanswered approval expires
    // and never happens; an unopposed hold commits and does.
    const { context } = makeContext({ gate: 'A3' })

    await expect(authorityCommandGate.beforeExecute!({}, context as never))
      .rejects.toBeInstanceOf(ActHeldForApprovalError)
    expect(holdUntilCommit).toHaveBeenCalledTimes(1)
    expect(hold).not.toHaveBeenCalled()
  })

  it('holds an act at A1 too', async () => {
    const { context } = makeContext({ gate: 'A1' })

    await expect(authorityCommandGate.beforeExecute!({}, context as never)).rejects.toBeInstanceOf(ActHeldForApprovalError)
  })

  it('tells the caller where the act went', async () => {
    // Three outcomes have to stay distinguishable: you may not, it failed, and
    // *not yet — here is where it went*. Collapsing the third makes the queue
    // invisible.
    const { context } = makeContext({ gate: 'A2' })

    await expect(authorityCommandGate.beforeExecute!({}, context as never)).rejects.toMatchObject({
      pendingActId: 'act-1',
      gate: 'A2',
      because: 'because',
      // 202: understood and accepted, but not done yet. A 403 would claim the
      // caller may never do this; a 500 invites a retry, and each retry queues
      // another copy of the same act.
      status: 202,
    })
  })
})

describe('what the gate lets through, deliberately', () => {
  it('does nothing while the tenant is only observing', async () => {
    const { context, enforcement } = makeContext({ mode: 'shadow', gate: 'A2' })

    await expect(authorityCommandGate.beforeExecute!({}, context as never)).resolves.toBeUndefined()
    expect(enforcement.decideFor).not.toHaveBeenCalled()
    expect(hold).not.toHaveBeenCalled()
  })

  it('does not gate a command that declares no capability', async () => {
    // The resolver is keyed by capability and the bus by command. An unmapped
    // command is a visible gap, not a guess — deriving the mapping from the
    // naming convention would be a guess per command.
    const { context, enforcement } = makeContext({ gate: 'A2', commandId: UNMAPPED_COMMAND })

    await expect(authorityCommandGate.beforeExecute!({}, context as never)).resolves.toBeUndefined()
    expect(enforcement.modeFor).not.toHaveBeenCalled()
  })

  it('lets A5 through, which is the only gate with nothing to enforce', async () => {
    const { context } = makeContext({ gate: 'A5' })

    await expect(authorityCommandGate.beforeExecute!({}, context as never)).resolves.toBeUndefined()
    expect(hold).not.toHaveBeenCalled()
    expect(holdUntilCommit).not.toHaveBeenCalled()
  })

  it('does not hold A4 either — it runs, and carries its decision forward to be filed', async () => {
    // Execute-and-review binds, but not by blocking. The gate stands aside and
    // hands `afterExecute` the reason the act was reviewable, so what gets filed
    // is that reason and not a fresh resolution answering a later question.
    const { context } = makeContext({ gate: 'A4' })

    const result = await authorityCommandGate.beforeExecute!({}, context as never)

    expect(hold).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      metadata: { reviewAfterExecute: { capability: CAPABILITY, tenantId: TENANT } },
    })
  })

  it('does not hold the replay of an act somebody already approved', async () => {
    // Otherwise approving queues a second copy and the queue cannot be emptied.
    const { context, enforcement } = makeContext({ gate: 'A2', markReplay: true })

    await expect(authorityCommandGate.beforeExecute!({}, context as never)).resolves.toBeUndefined()
    expect(enforcement.modeFor).not.toHaveBeenCalled()
    expect(hold).not.toHaveBeenCalled()
  })

  it('does nothing without an authenticated tenant', async () => {
    const { context } = makeContext({ gate: 'A2', auth: null })

    await expect(authorityCommandGate.beforeExecute!({}, context as never)).resolves.toBeUndefined()
    expect(hold).not.toHaveBeenCalled()
  })

  it('does nothing when the services are not registered', async () => {
    // A lean bootstrap. An absent dependency is not evidence of a constraint.
    const context = {
      commandId: GATED_COMMAND,
      auth: { sub: 'user-1', tenantId: TENANT },
      selectedOrganizationId: null,
      container: { resolve: () => { throw new Error('not registered') } },
    }

    await expect(authorityCommandGate.beforeExecute!({}, context as never)).resolves.toBeUndefined()
  })
})

describe('what the gate refuses (T-45)', () => {
  it('refuses an A0 instead of passing it through', async () => {
    // The gate used to leave A0 to the route guard. That holds for a *capability*
    // refusal — the route guard answers before the bus runs — but not for a
    // *record lock*, which the route guard cannot make because `refusalFor`
    // threads no record id. So an A0 that reaches this gate must be refused here.
    const { context } = makeContext({ gate: 'A0' })

    await expect(authorityCommandGate.beforeExecute!({}, context as never))
      .rejects.toBeInstanceOf(AuthorityRefusedError)
    expect(hold).not.toHaveBeenCalled()
    expect(holdUntilCommit).not.toHaveBeenCalled()
  })

  it('refuses with a 403 and names the rule that refused it', async () => {
    // A refusal is "you may not" — distinct from "not yet" (202, the held case)
    // and from "it broke" (500). The rule and its reason ride out with it, the
    // same explainability a hold carries.
    const { context } = makeContext({ gate: 'A0' })

    await expect(authorityCommandGate.beforeExecute!({}, context as never)).rejects.toMatchObject({
      gate: 'A0',
      bindingRule: 'effect-class-floor',
      because: 'because',
      status: 403,
    })
  })
})

// T-16 — this door's answer to a missing authority dependency, stated as a test so
// the two doors cannot drift apart again. The tool door used to REFUSE on the same
// state, which is the contradiction this row is about.

describe('T-16 — a missing authority dependency', () => {
  it('permits when the authority module is NOT REGISTERED', async () => {
    const context = {
      commandId: GATED_COMMAND,
      capability: CAPABILITY,
      auth: { sub: 'user-1', tenantId: TENANT, orgId: 'org-1' },
      selectedOrganizationId: 'org-1',
      container: {
        resolve: (name: string) => {
          if (name === 'authorityEnforcement' || name === 'pendingActService') {
            throw new Error('not registered')
          }
          return null
        },
      },
    }

    // The deployment chose not to gate. The shared rule says permit, and this
    // door has always agreed with it.
    await expect(authorityCommandGate.beforeExecute!({}, context as never)).resolves.toBeUndefined()
  })

  it('fails the act when the authority module is registered but UNREACHABLE', async () => {
    const { context } = makeContext({ mode: 'enforce' })
    ;(context.container as { resolve: (n: string) => unknown }).resolve = (name: string) => {
      if (name === 'authorityEnforcement') {
        return {
          modeFor: jest.fn(async () => {
            throw new Error('resolver unreachable')
          }),
          decideFor: jest.fn(async () => null),
        }
      }
      if (name === 'pendingActService') return { hold, holdUntilCommit }
      return null
    }

    // The deployment meant to gate and cannot, so the act must not run ungoverned.
    await expect(authorityCommandGate.beforeExecute!({}, context as never)).rejects.toThrow()
  })
})
