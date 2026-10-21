import type { CommandInterceptor, CommandInterceptorContext } from '@open-mercato/shared/lib/commands/command-interceptor'
import { parseSubject } from '@open-mercato/shared/lib/auth/principal'
import { createLogger } from '@open-mercato/shared/lib/logger'
import { CrudHttpError } from '@open-mercato/shared/lib/crud/errors'
import type { AuthorityEnforcementService } from '@open-mercato/core/modules/auth/services/authorityEnforcementService'
import {
  APPROVED_ACT_REPLAY,
  type ActReviewService,
  type PendingActService,
} from '@open-mercato/core/modules/auth/services/pendingActService'
import type { Decision } from '@open-mercato/shared/lib/authority/decision'
import { authorityDependencyVerdict } from '@open-mercato/shared/lib/authority/dependency'

const logger = createLogger('authority').child({ component: 'command-gate' })

/**
 * Raised when the resolver holds an act instead of letting it run.
 *
 * A distinct error type, and not a generic block, because the caller has to be
 * able to tell three things apart: *you may not do this*, *this failed*, and
 * **this has not happened yet and here is where it went**. Collapsing the third
 * into either of the others is how an approval queue becomes invisible.
 *
 * Thrown rather than returned: the interceptor runner reduces a returned block
 * to a message string, and the pending-act id has to survive.
 */
export class ActHeldForApprovalError extends CrudHttpError {
  readonly pendingActId: string
  readonly gate: string
  readonly bindingRule: string
  readonly because: string | null

  constructor(params: { pendingActId: string; gate: string; bindingRule: string; because: string | null }) {
    // **202, not 403 and not 500.** The request was understood and accepted; the
    // act has not happened *yet*. A 403 would say "you may not", which is false
    // — the same person may well end up performing it. A 500 says "something
    // broke", which is what the caller saw before this extended `CrudHttpError`
    // and is the worst of the three: it invites a retry, and each retry queues
    // another copy.
    super(202, {
      error: 'This act needs approval before it can run.',
      code: 'authority_act_held',
      pendingActId: params.pendingActId,
      gate: params.gate,
      bindingRule: params.bindingRule,
      because: params.because,
    })
    this.name = 'ActHeldForApprovalError'
    this.pendingActId = params.pendingActId
    this.gate = params.gate
    this.bindingRule = params.bindingRule
    this.because = params.because
  }
}

/**
 * Raised when the resolver refuses an act outright.
 *
 * The first of the three outcomes the caller has to be able to tell apart —
 * *you may not do this* (this), *this failed* (500), and *not yet, and here is
 * where it went* ({@link ActHeldForApprovalError}, 202). A refusal carries the
 * same explainability a hold does: which rule bound it, and why.
 *
 * **Why the gate refuses at all, when the route guard already does.** For a
 * *capability* refusal it does — `RbacService` answers before the command bus
 * runs, so the gate never sees one. But a **record lock** is a refusal the route
 * guard *cannot* make: `refusalFor` threads no record id, and this gate is the
 * only production path that does. Before `T-45` the gate passed every `A0`
 * through on the belief that the route guard had already refused it — so a
 * locked record was writable by any actor holding the capability.
 */
export class AuthorityRefusedError extends CrudHttpError {
  readonly gate: string
  readonly bindingRule: string
  readonly because: string | null

  constructor(params: { gate: string; bindingRule: string; because: string | null }) {
    // 403 — "you may not", distinct from 202 ("not yet") and 500 ("it broke").
    super(403, {
      error: 'This act is refused.',
      code: 'authority_act_refused',
      gate: params.gate,
      bindingRule: params.bindingRule,
      because: params.because,
    })
    this.name = 'AuthorityRefusedError'
    this.gate = params.gate
    this.bindingRule = params.bindingRule
    this.because = params.because
  }
}

/** Gates below this are refusals, above are permissions. `A1`/`A2` are "not yet". */
const HELD_GATES = new Set(['A1', 'A2'])

/** `A0` — a refusal: the act may not happen at all, here or later. */
const REFUSAL_GATE = 'A0'

/** `A3` — the act waits, then runs itself unless somebody objects. */
const COMMIT_GATE = 'A3'

/** `A4` — the act happens now, and somebody looks at it afterwards. */
const REVIEWED_GATE = 'A4'

/**
 * Holds a command the resolver is not willing to let run unattended.
 *
 * This is what makes an obligation bind. Before it, enforcement could only
 * refuse (`A0`); `A1` and `A2` were recorded and ignored, so *"a person must
 * approve before this executes"* was a sentence in a log while the act executed
 * anyway.
 *
 * ## What it does not gate, deliberately
 *
 * - **Commands that declare no `capability`.** The resolver is keyed by
 *   capability and the bus by command; a command that has not been mapped is not
 *   gated, and the gap is visible rather than guessed at.
 * - **Tenants not in `enforce`.** Shadow mode observes and changes nothing.
 * - **Nothing that is a refusal.** An `A0` is *refused* here, not passed through
 *   (T-45). For a *capability* refusal `RbacService` has already answered at the
 *   route guard, so this gate never sees one — but a **record-lock** `A0` is a
 *   refusal the route guard *cannot* make, because `refusalFor` threads no record
 *   id and this gate is the only path that does. Passing it through (which this
 *   gate did until T-45) let a locked record be written by any holder of the
 *   capability.
 * `A3` **is** held, but it ends differently: nobody has to answer it. A scheduled
 * sweep runs it once its window passes, and only a veto stops it.
 *
 * `A4` **is** covered too, and holds nothing — the act runs and `afterExecute`
 * files it for review, which is why this hook records the decision in the
 * interceptor metadata on its way past.
 * - **Replays of an already-approved act**, which would otherwise be held again
 *   and produce a queue that cannot be emptied.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * The id of the record a command acts on, when it names one.
 *
 * Requires a well-formed UUID rather than accepting any `id`, because a lock is
 * keyed on the id alone: a slug or a numeric id from some other command's
 * payload could otherwise collide with a genuine record's lock and constrain the
 * wrong thing. A create has no id, and nothing is looked up for it.
 *
 * **Shape only — no version or variant constraint** (T-32). The pattern this
 * replaced demanded an RFC-4122 v1–v5 id: every v4 id passes and every v7 id
 * fails, so a v7-id record reached the resolver with `recordId: null`,
 * `resourceCeilingFor` returned early on `!recordId`, and no lock was looked up
 * at all. Version and variant are properties of the *generator* — the `uuid`
 * column accepts any version, `gen_random_uuid()` merely defaults to v4 — while
 * the shape is what keeps a slug from colliding with a lock. Same shape as
 * `sync-run-service.ts` and `grantChecks.ts`.
 */
function readRecordId(input: unknown): string | null {
  if (!input || typeof input !== 'object') return null
  const candidate = (input as { id?: unknown }).id
  if (typeof candidate !== 'string') return null
  return UUID_PATTERN.test(candidate) ? candidate : null
}

export const authorityCommandGate: CommandInterceptor = {
  id: 'auth.authority-command-gate',
  targetCommand: '*',
  // Early: an act that is not going to run should not first be rewritten by
  // interceptors that assume it will.
  priority: 10,

  async beforeExecute(input: unknown, context: CommandInterceptorContext) {
    // Debug rather than silence: a gate that declines to act should be able to
    // say which of its many deliberate exits it took. Every `return` below is a
    // decision, and without this the only observable difference between "not
    // gated on purpose" and "never ran" is the absence of a log line.
    logger.debug('Command gate reached', { commandId: context.commandId })

    const replayId = (context as unknown as Record<symbol, unknown>)[APPROVED_ACT_REPLAY]
    if (replayId) return

    const auth = context.auth
    const tenantId = (auth?.tenantId as string | null | undefined) ?? null
    const subject = (auth?.sub as string | undefined) ?? null
    if (!tenantId || !subject) return

    const capability = context.capability ?? null
    if (!capability) {
      logger.debug('Command declares no capability; not gated', { commandId: context.commandId })
      return
    }

    let enforcement: AuthorityEnforcementService | null = null
    let pendingActs: PendingActService | null = null
    try {
      enforcement = context.container.resolve('authorityEnforcement') as AuthorityEnforcementService
      pendingActs = context.container.resolve('pendingActService') as PendingActService
    } catch {
      // T-16 — this door always answered "not registered" correctly, and it now
      // says so through the shared rule rather than in a comment of its own. A
      // deployment that did not register the authority module chose not to gate,
      // so the act is permitted. The tool door used to refuse on this exact state,
      // which is the disagreement this row is about.
      logger.debug('Command declares a capability but authority is not registered; not gated', {
        commandId: context.commandId,
        verdict: authorityDependencyVerdict('not_registered'),
      })
      return
    }
    if (!enforcement || !pendingActs) return

    const mode = await enforcement.modeFor(tenantId)
    if (mode !== 'enforce') {
      logger.debug('Tenant is not enforcing; not gated', { commandId: context.commandId, mode })
      return
    }

    const organizationId = context.selectedOrganizationId ?? (auth?.orgId as string | null | undefined) ?? null
    // Who this actor is acting *for*. An API key carries its owner; a person
    // acting as themselves carries nobody. Invariant I4 caps the act at whatever
    // that person could have done.
    const onBehalfOfUserId = (auth?.principal as { onBehalfOfUserId?: string | null } | undefined)?.onBehalfOfUserId
      ?? (auth?.userId as string | null | undefined)
      ?? null
    // The record being acted on, when the command names one.
    //
    // `payload.id` rather than an entity type plus an id: the bus carries a
    // capability and no entity type, so keying a lock on both would need a
    // per-command declaration across every command. Record ids are UUIDs —
    // today v4 (`gen_random_uuid()`), and the `uuid` column accepts any
    // version — so the id alone identifies a record in any practical sense —
    // see PROGRESS under *G5, the blocking design question*.
    const recordId = readRecordId(input)
    const decision = await enforcement.decideFor(
      subject,
      capability,
      { tenantId, organizationId },
      { onBehalfOfUserId, recordId },
    )

    // A refusal stops here. It is the one answer the caller must not be able to
    // reach past, and the record lock — which only this path threads — is a
    // refusal no other caller makes (T-45).
    if (decision?.gate === REFUSAL_GATE) {
      const refusal = decision.reasons.find((reason) => reason.rule === decision.bindingRule) ?? null
      logger.warn('Command refused instead of executing', {
        commandId: context.commandId,
        capability,
        gate: decision.gate,
      })
      throw new AuthorityRefusedError({
        gate: decision.gate,
        bindingRule: decision.bindingRule,
        because: refusal?.detail ?? null,
      })
    }

    if (!decision || !HELD_GATES.has(decision.gate)) {
      logger.debug('Gate permits the act to run now', {
        commandId: context.commandId,
        gate: decision?.gate ?? 'undescribed',
      })
      // A4 runs now and is filed afterwards. Carrying the decision forward means
      // `afterExecute` files the reason the act was reviewable, not a fresh
      // resolution that might answer a different question by then.
      if (decision?.gate === COMMIT_GATE) {
        const held = await pendingActs.holdUntilCommit({
          tenantId,
          organizationId,
          commandId: context.commandId,
          capabilityId: capability,
          commandInput: input,
          actorId: parseSubject(subject).id,
          actorKind: parseSubject(subject).kind,
          decision,
        })
        const holdBinding = decision.reasons.find((reason) => reason.rule === decision.bindingRule) ?? null
        throw new ActHeldForApprovalError({
          pendingActId: held.id,
          gate: decision.gate,
          bindingRule: decision.bindingRule,
          because: holdBinding?.detail ?? null,
        })
      }

      if (decision?.gate === REVIEWED_GATE) {
        return {
          metadata: {
            reviewAfterExecute: { decision, capability, tenantId, organizationId },
          },
        }
      }
      return
    }

    const principal = parseSubject(subject)
    const act = await pendingActs.hold({
      tenantId,
      organizationId,
      commandId: context.commandId,
      capabilityId: capability,
      commandInput: input,
      actorId: principal.id,
      actorKind: principal.kind,
      decision,
    })

    const binding = decision.reasons.find((reason) => reason.rule === decision.bindingRule) ?? null
    logger.warn('Command held for approval instead of executing', {
      commandId: context.commandId,
      capability,
      gate: decision.gate,
      pendingActId: act.id,
    })

    throw new ActHeldForApprovalError({
      pendingActId: act.id,
      gate: decision.gate,
      bindingRule: decision.bindingRule,
      because: binding?.detail ?? null,
    })
  },
}

/**
 * Files an act that ran at `A4` for review.
 *
 * Runs after the command, because there is nothing to file until the act has
 * happened. It never throws: the write has already committed, and failing the
 * request now would tell the caller their change did not land when it did. A
 * missing review row is a real gap; lying about a successful write to report it
 * is a worse one.
 */
async function fileForReview(
  context: CommandInterceptorContext,
  result: unknown,
): Promise<void> {
  const carried = (context.metadata as { reviewAfterExecute?: {
    decision: Decision
    capability: string
    tenantId: string
    organizationId: string | null
  } } | undefined)?.reviewAfterExecute
  if (!carried) return

  try {
    const reviews = context.container.resolve('actReviewService') as ActReviewService
    const principal = parseSubject((context.auth?.sub as string | undefined) ?? '')
    // The command bus returns the action log alongside the result, which is what
    // lets a reviewer read the change itself rather than a description of it.
    const actionLogId = (result as { logEntry?: { id?: string } } | null)?.logEntry?.id ?? null

    await reviews.record({
      tenantId: carried.tenantId,
      organizationId: carried.organizationId,
      commandId: context.commandId,
      capabilityId: carried.capability,
      actionLogId,
      actorId: principal.id,
      actorKind: principal.kind,
      decision: carried.decision,
    })
  } catch (error) {
    logger.error('An act ran at A4 and could not be filed for review', {
      commandId: context.commandId,
      err: error,
    })
  }
}

export const authorityReviewFiler: CommandInterceptor = {
  id: 'auth.authority-review-filer',
  targetCommand: '*',
  // Late: everything that could still fail the act should have run first, so a
  // review is filed for something that actually happened.
  priority: 90,

  async afterExecute(_input: unknown, result: unknown, context: CommandInterceptorContext) {
    await fileForReview(context, result)
  },
}

export const interceptors: CommandInterceptor[] = [authorityCommandGate, authorityReviewFiler]
