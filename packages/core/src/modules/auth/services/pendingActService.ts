import type { EntityManager } from '@mikro-orm/postgresql'
import type { AwilixContainer } from 'awilix'
import type { Decision } from '@open-mercato/shared/lib/authority/decision'
import { createLogger } from '@open-mercato/shared/lib/logger'
import { AuthorityAct, AuthorityActReview } from '@open-mercato/core/modules/auth/data/entities'

const logger = createLogger('authority').child({ component: 'pending-acts' })

/**
 * How long a held act stays approvable.
 *
 * Mandatory expiry is a design requirement, not a tidiness measure (planning 02
 * §7.2): *"expiry escalates rather than silently blocking work forever"*. An act
 * that can sit in a queue indefinitely turns into a queue nobody trusts, and a
 * request nobody answers is a refusal that never had to be justified.
 */
export const PENDING_ACT_TTL_MS = 24 * 60 * 60 * 1000

/** Where a tenant's own approval window lives, beside its enforcement mode. */
export const PENDING_ACT_TTL_CONFIG_MODULE = 'auth'
export const PENDING_ACT_TTL_CONFIG_KEY = 'authority.pending_act_ttl_hours'

/**
 * The range a tenant may choose within, and why it is a range rather than a
 * free number.
 *
 * **The floor exists because the setting can stop work.** A TTL near zero
 * expires acts faster than anyone can answer them, which does not look like a
 * misconfiguration to the person affected — it looks like the platform
 * refusing their work for no stated reason. One hour is the shortest window in
 * which a human can plausibly be asked and reply.
 *
 * **The ceiling exists because the setting can defeat its own purpose.**
 * Expiry is a design requirement (planning 02 §7.2) precisely so that an
 * unanswered request escalates instead of blocking forever; a tenant setting
 * ninety days would technically satisfy "has an expiry" while restoring the
 * failure the requirement forbids. Thirty days is generous for a slow approval
 * chain and still finite.
 *
 * A value outside the range is clamped rather than refused: refusing would
 * leave the tenant on a default they did not choose and did not know they were
 * on, whereas clamping moves them to the nearest thing they can have and says
 * so in the log.
 */
export const PENDING_ACT_TTL_MIN_HOURS = 1
export const PENDING_ACT_TTL_MAX_HOURS = 24 * 30

type ModuleConfigReader = {
  getValue: <T>(
    moduleId: string,
    name: string,
    options?: { defaultValue?: T | null; scope?: { tenantId?: string | null } },
  ) => Promise<T | null>
}

/**
 * A stored TTL turned into milliseconds, or the default when it cannot be.
 *
 * Exported because the clamping is the interesting part and deserves testing
 * without a database behind it.
 */
export function resolveTtlMs(stored: unknown, tenantId: string): number {
  if (stored == null) return PENDING_ACT_TTL_MS

  const hours = typeof stored === 'number' ? stored : Number(stored)
  if (!Number.isFinite(hours)) {
    // Unreadable means the default, never zero. Coercing junk to 0 would expire
    // every act the moment it was held.
    logger.warn('Unreadable pending-act TTL; using the default', {
      tenantId,
      stored,
      usingHours: PENDING_ACT_TTL_MS / 3_600_000,
    })
    return PENDING_ACT_TTL_MS
  }

  const clamped = Math.min(Math.max(hours, PENDING_ACT_TTL_MIN_HOURS), PENDING_ACT_TTL_MAX_HOURS)
  if (clamped !== hours) {
    logger.warn('Pending-act TTL outside the permitted range; clamped', {
      tenantId,
      requestedHours: hours,
      usingHours: clamped,
      minHours: PENDING_ACT_TTL_MIN_HOURS,
      maxHours: PENDING_ACT_TTL_MAX_HOURS,
    })
  }
  return clamped * 3_600_000
}

/**
 * How long an `A3` act sits before it runs itself.
 *
 * Planning 02 §8's worked example is a fifteen-minute hold on an internal
 * publish. Fifteen minutes is long enough for somebody watching to object and
 * short enough that the act is not effectively blocked — which is the whole
 * point of hold-and-commit as distinct from approve-first.
 */
export const COMMIT_WINDOW_MS = 15 * 60 * 1000

export const PENDING_ACT_STATUSES = [
  'pending', 'holding', 'approving', 'committing', 'approved', 'committed', 'rejected', 'vetoed', 'expired', 'failed',
] as const
export type PendingActStatus = (typeof PENDING_ACT_STATUSES)[number]

/**
 * Marks an execution as the replay of an already-approved act.
 *
 * The gate reads this and stands aside. Without it, approving an act would
 * re-resolve it, hold it again, and queue a second copy — an approval queue that
 * cannot be emptied.
 *
 * A symbol rather than a field: it must not be settable from request input.
 */
export const APPROVED_ACT_REPLAY = Symbol.for('open-mercato.authority.approvedActReplay')

export type HoldInput = {
  tenantId: string
  organizationId: string | null
  commandId: string
  capabilityId: string
  commandInput: unknown
  actorId: string
  actorKind: string
  decision: Decision
}

export type PendingActView = {
  id: string
  commandId: string
  capabilityId: string
  actorId: string
  actorKind: string
  gate: string
  bindingRule: string
  because: string | null
  obligations: string[]
  status: PendingActStatus
  expiresAt: string
  createdAt: string
  resolvedAt: string | null
  resolvedByUserId: string | null
  failureReason: string | null
}

type CommandBusLike = {
  execute: (commandId: string, options: {
    input: unknown
    ctx: Record<string, unknown>
  }) => Promise<unknown>
}

/**
 * The acts the resolver held, and what happens to them.
 *
 * An act reaches here when enforcement is on and the resolver gated the command
 * at `A1` or `A2` — *"the worker proposes; a human performs"* and *"prepared,
 * executes only after approval"*. Both mean the same thing to this service: the
 * command does not run now, and runs later only if somebody says so.
 *
 * **`A4` is handled here too, and differently.** *Execute and review* means the
 * act happens now and somebody looks at it afterwards, so it is filed rather than
 * held — a different table, `authority_act_reviews`, because a row that means
 * "already did" does not belong in one whose other rows mean "not yet".
 *
 * `A3` (hold-and-commit) is still not handled. It executes into a hold window and
 * **commits** when the window passes unless somebody objects — the opposite of
 * expiry, and it needs a scheduler rather than a queue. Calling it done because
 * it shares a surface would be the kind of claim this project exists not to
 * make.
 */
export class PendingActService {
  /**
   * `moduleConfig` is optional because the configs module can be absent, and an
   * approval queue that stops working when a *settings* module is missing would
   * be a worse failure than one that uses its default window.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly moduleConfig: ModuleConfigReader | null = null,
  ) {}

  /**
   * How long this tenant's held acts stay approvable.
   *
   * Per tenant because approval speed is a property of the organisation, not of
   * the platform: a four-person company answers in an hour, a regulated one may
   * need a week, and an instance-wide number makes whoever configures it first
   * decide for everybody.
   *
   * Read at hold time rather than cached. A tenant that shortens its window
   * should affect acts held from then on, and acts already waiting keep the
   * window they were promised — an approval deadline that moves under somebody
   * is not a deadline.
   */
  private async ttlMsFor(tenantId: string): Promise<number> {
    if (!this.moduleConfig) return PENDING_ACT_TTL_MS
    try {
      const stored = await this.moduleConfig.getValue<number>(
        PENDING_ACT_TTL_CONFIG_MODULE,
        PENDING_ACT_TTL_CONFIG_KEY,
        { defaultValue: null, scope: { tenantId } },
      )
      return resolveTtlMs(stored, tenantId)
    } catch (err) {
      // Fail to the default, never to no expiry: a config lookup that throws
      // must not be able to produce an act that waits forever.
      logger.warn('Could not read the pending-act TTL; using the default', { tenantId, err })
      return PENDING_ACT_TTL_MS
    }
  }

  /**
   * Records an act that will run **by itself** once its window passes.
   *
   * Gate `A3`. The difference from `hold` is not the waiting, it is what the
   * waiting ends in: an unanswered approval expires and never happens, while an
   * unopposed hold commits and does. Somebody has to object to stop it.
   */
  async holdUntilCommit(input: HoldInput): Promise<AuthorityAct> {
    const commitAt = new Date(Date.now() + COMMIT_WINDOW_MS)
    const act = this.em.create(AuthorityAct, {
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      commandId: input.commandId,
      capabilityId: input.capabilityId,
      commandInput: input.commandInput,
      actorId: input.actorId,
      actorKind: input.actorKind,
      gate: input.decision.gate,
      bindingRule: input.decision.bindingRule,
      decision: input.decision as unknown,
      status: 'holding',
      // Never reached for a holding act — the sweep commits it first. Set to the
      // same moment so a row that somehow escapes the sweep stops rather than
      // sitting approvable forever.
      expiresAt: commitAt,
      commitAt,
      createdAt: new Date(),
    })
    await this.em.persist(act).flush()

    logger.warn('Act held, and will commit unless somebody objects', {
      pendingActId: act.id,
      commandId: input.commandId,
      capability: input.capabilityId,
      gate: input.decision.gate,
      commitAt: commitAt.toISOString(),
      actorId: input.actorId,
    })
    return act
  }

  /** Records an act that will not run until somebody approves it. */
  async hold(input: HoldInput): Promise<AuthorityAct> {
    const ttlMs = await this.ttlMsFor(input.tenantId)
    const act = this.em.create(AuthorityAct, {
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      commandId: input.commandId,
      capabilityId: input.capabilityId,
      commandInput: input.commandInput,
      actorId: input.actorId,
      actorKind: input.actorKind,
      gate: input.decision.gate,
      bindingRule: input.decision.bindingRule,
      decision: input.decision as unknown,
      status: 'pending',
      expiresAt: new Date(Date.now() + ttlMs),
      createdAt: new Date(),
    })
    await this.em.persist(act).flush()

    logger.warn('Act held for approval', {
      pendingActId: act.id,
      commandId: input.commandId,
      capability: input.capabilityId,
      gate: input.decision.gate,
      bindingRule: input.decision.bindingRule,
      actorId: input.actorId,
      tenantId: input.tenantId,
    })
    return act
  }

  /**
   * The queue for one tenant.
   *
   * Expired rows are marked before they are listed, so nobody is shown an act
   * they cannot act on. Ordering is oldest-first; planning §7.2 wants grade then
   * deadline risk, and grade is not modelled yet — arrival order is at least an
   * order somebody can predict, rather than one that looks meaningful and is not.
   */
  async list(tenantId: string, status: PendingActStatus | 'all' = 'pending'): Promise<PendingActView[]> {
    await this.expireOverdue(tenantId)
    const where: Record<string, unknown> = { tenantId }
    if (status !== 'all') where.status = status
    const acts = await this.em.find(AuthorityAct, where, { orderBy: { createdAt: 'asc' }, limit: 200 })
    return acts.map((act) => toView(act))
  }

  async findById(tenantId: string, id: string): Promise<AuthorityAct | null> {
    return this.em.findOne(AuthorityAct, { id, tenantId })
  }

  /**
   * `T-05` — claim the row before doing anything irreversible with it.
   *
   * `findById` followed by `if (status !== 'pending')` is a **read-then-act**: two approvers both read
   * `pending`, both run the command, both write `approved`. The command is not instantaneous, so the
   * window is the execution time, not a race between two adjacent statements.
   *
   * This is a **compare-and-set**: the database decides which caller wins. `nativeUpdate` returns the
   * number of rows it matched — `1` means this caller owns the act from here; `0` means somebody else
   * moved it first, and the caller must report what happened rather than repeat the act. There is no
   * read-then-write between the check and the claim, which is the whole point: the condition and the
   * write are one statement.
   *
   * The claim is also a **state**: `approving` / `committing` are visible in the row, so an approval
   * interrupted mid-execution is a fact on record rather than an invisible lock. Resolving those rows
   * is a lifecycle concern with its own row (`CC-147`) — but they can never be re-run.
   */
  private async claim(
    tenantId: string,
    id: string,
    from: readonly PendingActStatus[],
    to: PendingActStatus,
  ): Promise<boolean> {
    const affected = await this.em.nativeUpdate(
      AuthorityAct,
      { id, tenantId, status: { $in: [...from] } },
      { status: to },
    )
    return affected === 1
  }

  /**
   * Runs a held act, with the approver accountable for it.
   *
   * The act executes **as the approver**, not as whoever proposed it. That is
   * what approval means — planning 02 §5.2 asks for *"an accountable human
   * approves, and that approval is a signed act"* — and reconstructing a
   * proposer's authentication context from two stored columns would be
   * fabricating a session rather than reproducing one.
   *
   * The *scope* is the proposer's, though: an act proposed for one organization
   * must not land in the approver's just because they happened to be looking at
   * a different one.
   */
  async approve(params: {
    tenantId: string
    id: string
    approverUserId: string | null
    container: AwilixContainer
    auth: unknown
    note?: string | null
  }): Promise<{ ok: true; act: AuthorityAct } | { ok: false; reason: string; act?: AuthorityAct }> {
    const act = await this.findById(params.tenantId, params.id)
    if (!act) return { ok: false, reason: 'not-found' }
    if (act.status !== 'pending') return { ok: false, reason: `already-${act.status}`, act }
    if (act.expiresAt.getTime() <= Date.now()) {
      // The expiry write is a compare-and-set too: two readers who both see an overdue act must not
      // both "expire" it — the second has nothing left to do and says so.
      const expired = await this.em.nativeUpdate(
        AuthorityAct,
        { id: act.id, tenantId: params.tenantId, status: 'pending' },
        { status: 'expired', resolvedAt: new Date() },
      )
      if (expired === 1) {
        act.status = 'expired'
        return { ok: false, reason: 'expired', act }
      }
      const current = await this.findById(params.tenantId, params.id)
      return { ok: false, reason: `already-${current?.status ?? 'gone'}`, act: current ?? act }
    }

    // The claim is what makes this an approval of ONE act rather than a race. Everything below may run
    // only for the caller that won it — and the loser is told what happened instead of repeating it.
    if (!(await this.claim(params.tenantId, params.id, ['pending'], 'approving'))) {
      const current = await this.findById(params.tenantId, params.id)
      return { ok: false, reason: `already-${current?.status ?? 'gone'}`, act: current ?? act }
    }
    act.status = 'approving'

    const bus = params.container.resolve('commandBus') as CommandBusLike
    try {
      await bus.execute(act.commandId, {
        input: act.commandInput,
        ctx: {
          container: params.container,
          auth: params.auth,
          selectedOrganizationId: act.organizationId ?? null,
          [APPROVED_ACT_REPLAY]: act.id,
        },
      })
    } catch (error) {
      // A failed act is not an unapproved one. It was authorised and then broke,
      // and hiding that behind `pending` would invite somebody to approve it
      // again and again.
      act.status = 'failed'
      act.resolvedAt = new Date()
      act.resolvedByUserId = params.approverUserId ?? null
      act.failureReason = error instanceof Error ? error.message : String(error)
      await this.em.flush()
      logger.error('An approved act failed when it ran', {
        pendingActId: act.id,
        commandId: act.commandId,
        err: error,
      })
      return { ok: false, reason: 'execution-failed', act }
    }

    act.status = 'approved'
    act.resolvedAt = new Date()
    act.resolvedByUserId = params.approverUserId ?? null
    act.resolutionNote = params.note ?? null
    await this.em.flush()

    logger.warn('Held act approved and executed', {
      pendingActId: act.id,
      commandId: act.commandId,
      approverUserId: params.approverUserId,
      proposedByActorId: act.actorId,
    })
    return { ok: true, act }
  }

  /**
   * Runs every act whose hold window has passed.
   *
   * Called by a scheduled sweep rather than on read, because *"commits unless
   * vetoed"* has to happen whether or not anybody is looking — that is the
   * difference between a hold window and a queue.
   *
   * Each act is committed independently: one that throws must not stop the rest,
   * or a single bad act freezes every A3 hold behind it.
   */
  async commitDue(params: {
    tenantId: string
    container: AwilixContainer
    systemAuth: unknown
    now?: Date
  }): Promise<{ committed: number; failed: number }> {
    // Scoped to one tenant, because the sweep is scheduled per tenant. A global
    // sweep run from a per-tenant schedule would do every tenant's work once per
    // tenant, and each extra pass would find the acts already committed — safe,
    // wasteful, and confusing to read in a log.
    const due = await this.em.find(AuthorityAct, {
      tenantId: params.tenantId,
      status: 'holding',
      commitAt: { $lte: params.now ?? new Date() },
    }, { limit: 100 })
    if (!due.length) return { committed: 0, failed: 0 }

    const bus = params.container.resolve('commandBus') as CommandBusLike
    let committed = 0
    let failed = 0

    for (const act of due) {
      // The sweep can overlap with a veto or with another sweep. Claim the row first: the loser skips
      // it without running the command, which is the only way "commits unless vetoed" stays true when
      // two of these run at once.
      if (!(await this.claim(params.tenantId, act.id, ['holding'], 'committing'))) continue
      act.status = 'committing'
      try {
        await bus.execute(act.commandId, {
          input: act.commandInput,
          ctx: {
            container: params.container,
            auth: params.systemAuth,
            selectedOrganizationId: act.organizationId ?? null,
            [APPROVED_ACT_REPLAY]: act.id,
          },
        })
        act.status = 'committed'
        act.resolvedAt = new Date()
        // No `resolvedByUserId`: nobody decided this. It happened because the
        // window passed and nobody objected, and recording a person here would
        // put somebody's name on a decision they never made.
        committed += 1
      } catch (error) {
        act.status = 'failed'
        act.resolvedAt = new Date()
        act.failureReason = error instanceof Error ? error.message : String(error)
        failed += 1
        logger.error('A held act failed when its window passed', {
          pendingActId: act.id,
          commandId: act.commandId,
          err: error,
        })
      }
    }
    await this.em.flush()

    logger.warn('Hold windows passed', { tenantId: params.tenantId, committed, failed })
    return { committed, failed }
  }

  /** Refuses a held act. The command never runs. */
  async reject(params: {
    tenantId: string
    id: string
    approverUserId: string | null
    note?: string | null
  }): Promise<{ ok: true; act: AuthorityAct } | { ok: false; reason: string }> {
    const act = await this.findById(params.tenantId, params.id)
    if (!act) return { ok: false, reason: 'not-found' }
    // A holding act can be stopped too — that is a veto, and it is the only thing
    // that prevents an A3 act from running.
    if (act.status !== 'pending' && act.status !== 'holding') {
      return { ok: false, reason: `already-${act.status}` }
    }

    // Compute the destination without touching the managed entity first: mutating it here would put
    // the new status in the unit of work *before* the compare-and-set, so a later flush could write it
    // even after the CAS said somebody else had moved the row.
    const finalStatus: PendingActStatus = act.status === 'holding' ? 'vetoed' : 'rejected'
    const resolvedAt = new Date()
    // One statement: the status that permits a veto is part of the WHERE, so an approval that claimed
    // the row a moment earlier cannot be overwritten by a rejection that read `pending` first.
    const stopped = await this.em.nativeUpdate(
      AuthorityAct,
      { id: act.id, tenantId: params.tenantId, status: { $in: ['pending', 'holding'] } },
      {
        status: finalStatus,
        resolvedAt,
        resolvedByUserId: params.approverUserId ?? null,
        resolutionNote: params.note ?? null,
      },
    )
    if (stopped !== 1) {
      const current = await this.findById(params.tenantId, params.id)
      return { ok: false, reason: `already-${current?.status ?? 'gone'}` }
    }
    act.status = finalStatus
    act.resolvedAt = resolvedAt
    act.resolvedByUserId = params.approverUserId ?? null
    act.resolutionNote = params.note ?? null

    logger.warn('Held act stopped before it ran', {
      pendingActId: act.id,
      commandId: act.commandId,
      approverUserId: params.approverUserId,
    })
    return { ok: true, act }
  }

  /**
   * Marks overdue acts expired.
   *
   * Called on read rather than by a scheduler, so expiry is correct without
   * requiring a worker to be running. A queue whose deadlines only apply when
   * background jobs are healthy has deadlines that are not deadlines.
   */
  async expireOverdue(tenantId: string): Promise<number> {
    const overdue = await this.em.find(AuthorityAct, {
      tenantId,
      status: 'pending',
      expiresAt: { $lte: new Date() },
    })
    if (!overdue.length) return 0
    for (const act of overdue) act.status = 'expired'
    await this.em.flush()
    logger.warn('Held acts expired without an answer', { tenantId, expired: overdue.length })
    return overdue.length
  }
}

function toView(act: AuthorityAct): PendingActView {
  const decision = act.decision as Decision | null
  const binding = decision?.reasons?.find((reason) => reason.rule === decision.bindingRule) ?? null
  return {
    id: act.id,
    commandId: act.commandId,
    capabilityId: act.capabilityId,
    actorId: act.actorId,
    actorKind: act.actorKind,
    gate: act.gate,
    bindingRule: act.bindingRule,
    because: binding?.detail ?? null,
    obligations: (decision?.obligations ?? []).map((obligation) => obligation.detail),
    status: act.status as PendingActStatus,
    expiresAt: act.expiresAt.toISOString(),
    createdAt: act.createdAt.toISOString(),
    resolvedAt: act.resolvedAt ? act.resolvedAt.toISOString() : null,
    resolvedByUserId: act.resolvedByUserId ?? null,
    failureReason: act.failureReason ?? null,
  }
}

export type ReviewInput = {
  tenantId: string
  organizationId: string | null
  commandId: string
  capabilityId: string
  actionLogId: string | null
  actorId: string
  actorKind: string
  decision: Decision
}

export type ActReviewView = {
  id: string
  commandId: string
  capabilityId: string
  actionLogId: string | null
  actorId: string
  actorKind: string
  gate: string
  bindingRule: string
  because: string | null
  status: string
  createdAt: string
  reviewedAt: string | null
  reviewedByUserId: string | null
  reviewNote: string | null
}

/**
 * Acts that already happened and still want a pair of eyes.
 *
 * Separate from `PendingActService` because the two answer different questions.
 * That one decides whether an act happens; this one records that one did and
 * that nobody has looked yet. Sharing a class would put "block this" and "note
 * this" behind the same method names, which is how the second quietly acquires
 * the urgency of the first, or loses its own.
 */
export class ActReviewService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Files an executed act for review.
   *
   * **Never throws into the caller.** The act has already happened and committed;
   * failing the request now would tell the caller their write did not land when
   * it did, which is worse than a missing review row. The failure is logged
   * loudly instead — an A4 act with no review record is a real gap, just not one
   * worth lying about a successful write to report.
   */
  async record(input: ReviewInput): Promise<AuthorityActReview | null> {
    try {
      const review = this.em.create(AuthorityActReview, {
        tenantId: input.tenantId,
        organizationId: input.organizationId,
        commandId: input.commandId,
        capabilityId: input.capabilityId,
        actionLogId: input.actionLogId,
        actorId: input.actorId,
        actorKind: input.actorKind,
        gate: input.decision.gate,
        bindingRule: input.decision.bindingRule,
        decision: input.decision as unknown,
        status: 'awaiting',
        createdAt: new Date(),
      })
      await this.em.persist(review).flush()
      logger.warn('Act executed and filed for review', {
        reviewId: review.id,
        commandId: input.commandId,
        capability: input.capabilityId,
        gate: input.decision.gate,
        actorId: input.actorId,
      })
      return review
    } catch (error) {
      logger.error('An act ran at A4 and could not be filed for review', {
        commandId: input.commandId,
        capability: input.capabilityId,
        err: error,
      })
      return null
    }
  }

  /**
   * The review queue for one tenant.
   *
   * No expiry sweep, unlike held acts. An approval nobody answers has work
   * blocked behind it and must expire; a review nobody does blocks nothing, and
   * an unreviewed act is exactly what somebody should still be able to find next
   * quarter.
   */
  async list(tenantId: string, status: string | 'all' = 'awaiting'): Promise<ActReviewView[]> {
    const where: Record<string, unknown> = { tenantId }
    if (status !== 'all') where.status = status
    const rows = await this.em.find(AuthorityActReview, where, { orderBy: { createdAt: 'desc' }, limit: 200 })
    return rows.map(toReviewView)
  }

  /** Marks an act as looked at. It does not undo anything. */
  async markReviewed(params: {
    tenantId: string
    id: string
    reviewerUserId: string | null
    note?: string | null
  }): Promise<{ ok: true } | { ok: false; reason: string }> {
    const review = await this.em.findOne(AuthorityActReview, { id: params.id, tenantId: params.tenantId })
    if (!review) return { ok: false, reason: 'not-found' }
    if (review.status !== 'awaiting') return { ok: false, reason: `already-${review.status}` }

    review.status = 'reviewed'
    review.reviewedAt = new Date()
    review.reviewedByUserId = params.reviewerUserId ?? null
    review.reviewNote = params.note ?? null
    await this.em.flush()

    logger.warn('Executed act reviewed', {
      reviewId: review.id,
      commandId: review.commandId,
      reviewerUserId: params.reviewerUserId,
    })
    return { ok: true }
  }
}

function toReviewView(review: AuthorityActReview): ActReviewView {
  const decision = review.decision as Decision | null
  const binding = decision?.reasons?.find((reason) => reason.rule === decision.bindingRule) ?? null
  return {
    id: review.id,
    commandId: review.commandId,
    capabilityId: review.capabilityId,
    actionLogId: review.actionLogId ?? null,
    actorId: review.actorId,
    actorKind: review.actorKind,
    gate: review.gate,
    bindingRule: review.bindingRule,
    because: binding?.detail ?? null,
    status: review.status,
    createdAt: review.createdAt.toISOString(),
    reviewedAt: review.reviewedAt ? review.reviewedAt.toISOString() : null,
    reviewedByUserId: review.reviewedByUserId ?? null,
    reviewNote: review.reviewNote ?? null,
  }
}

