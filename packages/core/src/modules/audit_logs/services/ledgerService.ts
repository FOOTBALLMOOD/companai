import type { EntityManager } from '@mikro-orm/postgresql'
import { LedgerEvent, type LedgerVisibility } from '@open-mercato/core/modules/audit_logs/data/entities'
import {
  LEDGER_HASH_VERSION,
  canonicalDigest,
  computeLedgerHash,
  type CanonicalValue,
} from '@open-mercato/shared/lib/ledger/canonical'
import { createLogger } from '@open-mercato/shared/lib/logger'

const logger = createLogger('audit_logs').child({ component: 'ledger' })

export type LedgerAppendInput = {
  tenantId: string
  eventType: string
  actorKind?: string | null
  actorId?: string | null
  organizationId?: string | null
  resourceKind?: string | null
  resourceId?: string | null
  correlationId?: string | null
  causationId?: string | null
  visibility?: LedgerVisibility
  /** Pointers and digests only — never customer content. */
  payload?: Record<string, CanonicalValue>
  ts?: Date
}

export type LedgerVerificationResult = {
  ok: boolean
  tenantId: string
  checked: number
  /** The first position whose stored hash disagrees with a recomputation. */
  brokenAtSeq: string | null
  reason: string | null
}

/**
 * Whether the journal's reversals and the chain agree (T-06).
 *
 * A missing undo event is invisible to the hash walk, which is why this is a
 * separate answer rather than another field on the walk's result.
 */
export type UndoCoverageResult = {
  ok: boolean
  tenantId: string
  /** Journal rows claiming `undone` with no chained undo event naming them. */
  undoneWithoutEvent: string[]
  /** Chained undo events whose source row is not `undone`. */
  eventWithoutUndone: string[]
}

/**
 * Turns a UUID into the two 32-bit integers `pg_advisory_xact_lock` wants.
 *
 * The lock only needs to be *consistent* per tenant, not collision-free across
 * tenants: a collision costs two tenants a moment of serialisation, never
 * correctness — the unique constraint on `(tenant_id, seq)` is what guarantees
 * correctness.
 */
function advisoryLockKeys(tenantId: string): [number, number] {
  const digest = canonicalDigest({ ledgerTenant: tenantId })
  const high = Number.parseInt(digest.slice(0, 8), 16) | 0
  const low = Number.parseInt(digest.slice(8, 16), 16) | 0
  return [high, low]
}

/**
 * The hash-chained ledger (R3, Tier 1).
 *
 * `ActionLogService` writes the journal — queryable and, being an ordinary
 * table, editable. This writes the proof: each event carries the hash of its
 * predecessor within its tenant, so altering any row invalidates every hash
 * after it.
 *
 * **Appends must run inside the caller's transaction.** The ledger event and the
 * business change it describes commit together or not at all (planning 06 §3.3).
 * This service therefore never opens or commits a transaction of its own — it
 * writes on the EntityManager it was constructed with, which is the container's,
 * which is the one the caller's transaction is bound to.
 */
export class LedgerService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Appends one event to a tenant's chain and returns it.
   *
   * Serialisation is by advisory lock, held for the rest of the caller's
   * transaction. Without it, two concurrent appends could read the same head and
   * both claim `seq = n + 1`; with it they queue, and if the lock is ever
   * bypassed the unique constraint turns a forked chain into a failed write.
   */
  async append(input: LedgerAppendInput): Promise<LedgerEvent> {
    if (!input.tenantId) {
      // A chain needs a partition. Writing tenant-less events would put every
      // deployment's records on one contended chain and make "verify this
      // tenant's history" unanswerable.
      throw new Error('[internal] Ledger append requires a tenantId')
    }

    // Both statements must run on the connection that owns the caller's
    // transaction. `getConnection().execute(...)` without a transaction context
    // may take a different pooled connection — in which case
    // `pg_advisory_xact_lock` commits and releases immediately, serialising
    // nothing, and the head read sees a snapshot outside the transaction.
    //
    // That is not theoretical: it produced a duplicate-key violation on
    // `ledger_events_tenant_seq_uq` in ordinary use, when a second process
    // appended between this read and the insert. The constraint did exactly what
    // it was put there for — a race failed loudly rather than forking the chain —
    // but the append should not have raced in the first place.
    const [lockHigh, lockLow] = advisoryLockKeys(input.tenantId)
    const connection = this.em.getConnection()
    const transaction = this.em.getTransactionContext()

    await connection.execute('select pg_advisory_xact_lock(?, ?)', [lockHigh, lockLow], 'all', transaction)

    // `as seq_text`, never `as seq`.
    //
    // PostgreSQL resolves `ORDER BY seq` to the *output column* when one shares
    // the name — so `select seq::text as seq ... order by seq desc` sorts
    // lexicographically: '9' beats '10'. This query computed a head of 9 when
    // the chain was at 10, the next append claimed a position that already
    // existed, and the unique constraint rejected it. The user-visible symptom
    // was a 500 on an ordinary write; the cause was an alias.
    const head = await connection.execute<Array<{ seq_text: string; hash: string }>>(
      'select seq::text as seq_text, hash from ledger_events where tenant_id = ? order by seq desc limit 1',
      [input.tenantId],
      'all',
      transaction,
    )

    const previous = head[0] ?? null
    const seq = previous ? BigInt(previous.seq_text) + 1n : 1n
    const prevHash = previous ? previous.hash : null
    const ts = input.ts ?? new Date()
    const visibility: LedgerVisibility = input.visibility ?? 'tenant'
    const payload = (input.payload ?? {}) as CanonicalValue

    const hash = computeLedgerHash({
      v: LEDGER_HASH_VERSION,
      tenantId: input.tenantId,
      seq: Number(seq),
      prevHash,
      ts: ts.toISOString(),
      eventType: input.eventType,
      actorKind: input.actorKind ?? null,
      actorId: input.actorId ?? null,
      organizationId: input.organizationId ?? null,
      correlationId: input.correlationId ?? null,
      causationId: input.causationId ?? null,
      visibility,
      payload,
    })

    const event = this.em.create(LedgerEvent, {
      tenantId: input.tenantId,
      seq: seq.toString(),
      prevHash,
      hash,
      hashVersion: LEDGER_HASH_VERSION,
      ts,
      eventType: input.eventType,
      actorKind: input.actorKind ?? null,
      actorId: input.actorId ?? null,
      organizationId: input.organizationId ?? null,
      resourceKind: input.resourceKind ?? null,
      resourceId: input.resourceId ?? null,
      correlationId: input.correlationId ?? null,
      causationId: input.causationId ?? null,
      visibility,
      payload: (input.payload ?? {}) as Record<string, unknown>,
      createdAt: new Date(),
    })

    await this.em.persist(event).flush()
    return event
  }

  /**
   * Walks a tenant's chain and reports the first position that does not verify.
   *
   * Stops at the first break by design: after a break every subsequent hash is
   * expected to disagree, and a report listing thousands of consequential
   * failures buries the one that matters.
   */
  async verifyTenantChain(tenantId: string, options?: { batchSize?: number }): Promise<LedgerVerificationResult> {
    const batchSize = options?.batchSize ?? 500
    const connection = this.em.getConnection()

    let checked = 0
    let expectedSeq = 1n
    let expectedPrevHash: string | null = null
    let afterSeq = 0n

    for (;;) {
      const rows = await connection.execute<Array<{
        seq_text: string
        prev_hash: string | null
        hash: string
        hash_version: number
        ts: Date
        event_type: string
        actor_kind: string | null
        actor_id: string | null
        organization_id: string | null
        correlation_id: string | null
        causation_id: string | null
        visibility: string
        payload: Record<string, unknown>
      }>>(
        // Same alias trap as the head query: ordering by a text output column
        // returned 1, 10, 2, 3 — and the verifier reported a perfectly intact
        // chain as broken at position 2. A false alarm from an integrity tool is
        // the worst outcome it has: it is exactly the thing nobody will believe
        // the second time.
        `select seq::text as seq_text, prev_hash, hash, hash_version, ts, event_type, actor_kind, actor_id,
                organization_id, correlation_id, causation_id, visibility, payload
           from ledger_events
          where tenant_id = ? and seq > ?
          order by seq asc
          limit ?`,
        [tenantId, afterSeq.toString(), batchSize],
      )

      if (rows.length === 0) break

      for (const row of rows) {
        const seq = BigInt(row.seq_text)

        if (seq !== expectedSeq) {
          return {
            ok: false,
            tenantId,
            checked,
            brokenAtSeq: row.seq_text,
            reason: `Sequence gap: expected ${expectedSeq}, found ${seq}. An event was deleted, or one was never written.`,
          }
        }

        if (row.prev_hash !== expectedPrevHash) {
          return {
            ok: false,
            tenantId,
            checked,
            brokenAtSeq: row.seq_text,
            reason: 'Predecessor hash does not match the previous event — the chain was re-linked.',
          }
        }

        if (row.hash_version !== LEDGER_HASH_VERSION) {
          return {
            ok: false,
            tenantId,
            checked,
            brokenAtSeq: row.seq_text,
            reason: `Unknown hash version ${row.hash_version}; this build verifies version ${LEDGER_HASH_VERSION}.`,
          }
        }

        const recomputed = computeLedgerHash({
          v: LEDGER_HASH_VERSION,
          tenantId,
          seq: Number(seq),
          prevHash: row.prev_hash,
          ts: new Date(row.ts).toISOString(),
          eventType: row.event_type,
          actorKind: row.actor_kind,
          actorId: row.actor_id,
          organizationId: row.organization_id,
          correlationId: row.correlation_id,
          causationId: row.causation_id,
          visibility: row.visibility,
          payload: (row.payload ?? {}) as CanonicalValue,
        })

        if (recomputed !== row.hash) {
          return {
            ok: false,
            tenantId,
            checked,
            brokenAtSeq: row.seq_text,
            reason: 'Stored hash does not match the event content — this row was modified after it was written.',
          }
        }

        checked += 1
        expectedSeq = seq + 1n
        expectedPrevHash = row.hash
        afterSeq = seq
      }
    }

    return { ok: true, tenantId, checked, brokenAtSeq: null, reason: null }
  }

  /** Every tenant that has at least one event, oldest chain first. */
  async listTenantsWithEvents(): Promise<string[]> {
    const rows = await this.em.getConnection().execute<Array<{ tenant_id: string }>>(
      'select distinct tenant_id from ledger_events order by tenant_id',
    )
    return rows.map((row) => row.tenant_id)
  }

  /**
   * Whether the journal's reversals and the chain agree (T-06, R3).
   *
   * The hash walk above cannot answer this question. A missing event is not a
   * broken link: the chain stays internally consistent and simply never mentions
   * the undo, so deleting the trace row from the journal leaves a chain that
   * still verifies. This check compares the two records against each other.
   *
   * Both directions are reported, because either one alone can be satisfied by
   * editing the other: a row claiming `undone` with no event, and an event whose
   * source row is not `undone`.
   */
  async verifyUndoCoverage(tenantId: string): Promise<UndoCoverageResult> {
    const connection = this.em.getConnection()

    const undone = await connection.execute<Array<{ id: string }>>(
      `select id from action_logs
        where tenant_id = ? and execution_state = 'undone' and deleted_at is null`,
      [tenantId],
    )

    const reversed = await connection.execute<Array<{ source_id: string | null }>>(
      `select payload->>'sourceLogId' as source_id from ledger_events
        where tenant_id = ? and payload->>'historyAction' = 'undo'`,
      [tenantId],
    )

    const undoneIds = new Set(undone.map((row) => row.id))
    const eventSourceIds = new Set(reversed.map((row) => row.source_id).filter((id): id is string => Boolean(id)))

    const undoneWithoutEvent = [...undoneIds].filter((id) => !eventSourceIds.has(id)).sort((a, b) => a.localeCompare(b))
    const eventWithoutUndone = [...eventSourceIds].filter((id) => !undoneIds.has(id)).sort((a, b) => a.localeCompare(b))

    return {
      ok: undoneWithoutEvent.length === 0 && eventWithoutUndone.length === 0,
      tenantId,
      undoneWithoutEvent,
      eventWithoutUndone,
    }
  }
}

/**
 * Appends to the ledger without letting a ledger problem take down a write that
 * has no ledger to write to.
 *
 * The distinction mirrors the journal's: a **missing** service is legitimate (a
 * downstream app may run without `audit_logs`), a **failing** append is not and
 * propagates so the caller's transaction rolls back.
 */
export async function appendLedgerEvent(
  container: { resolve: (name: string) => unknown },
  input: LedgerAppendInput,
): Promise<LedgerEvent | null> {
  let service: LedgerService | null = null
  try {
    service = container.resolve('ledgerService') as LedgerService
  } catch {
    service = null
  }
  if (!service || typeof service.append !== 'function') {
    logger.debug('Ledger service unavailable; skipping append', { eventType: input.eventType })
    return null
  }
  return service.append(input)
}
