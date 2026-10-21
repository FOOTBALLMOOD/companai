import type { FilterQuery } from '@mikro-orm/core'
import type { EntityManager } from '@mikro-orm/postgresql'
import { sql } from 'kysely'
import { ActionLog } from '@open-mercato/core/modules/audit_logs/data/entities'
import { DEFAULT_VISIBILITY_SCOPE } from '@open-mercato/shared/modules/visibility'
import {
  actionLogCreateSchema,
  actionLogListSchema,
  type ActionLogCreateInput,
  type ActionLogListQuery,
} from '@open-mercato/core/modules/audit_logs/data/validators'
import { isRecord } from '@open-mercato/core/modules/audit_logs/lib/changeRows'
import {
  ACTION_LOG_FILTER_TYPES,
  type ActionLogFilterType,
  deriveActionLogProjection,
} from '@open-mercato/core/modules/audit_logs/lib/projections'
import { decryptWithAesGcm } from '@open-mercato/shared/lib/encryption/aes'
import {
  TenantDataEncryptionService,
  parseDecryptedFieldValue,
} from '@open-mercato/shared/lib/encryption/tenantDataEncryptionService'
import { toOptionalString } from '@open-mercato/shared/lib/string/coerce'
import { createLogger } from '@open-mercato/shared/lib/logger'
import { parseSubject } from '@open-mercato/shared/lib/auth/principal'
import { digestOpaque } from '@open-mercato/shared/lib/ledger/canonical'
import type { LedgerService } from '@open-mercato/core/modules/audit_logs/services/ledgerService'

const logger = createLogger('audit_logs').child({ component: 'action-log-service' })

let validationWarningLogged = false
let runtimeValidationAvailable: boolean | null = null
let decryptionWarningLogged = false

/**
 * What kind of principal acted, from the subject as the caller supplied it.
 *
 * Deliberately does not fall back to `human` for an unknown subject shape: null
 * means *we do not know*, and a journal that guesses is worse than one that
 * admits a gap. The only safe inference is the absence of any actor at all,
 * which is the system acting.
 */
function resolveActorKind(rawSubject: string | null, storedActorId: string | null): string | null {
  if (rawSubject) return parseSubject(rawSubject).kind
  // No subject at all: nothing to attribute this to but the platform itself.
  if (!storedActorId) return 'system'
  return null
}

const isZodRuntimeMissing = (err: unknown) => err instanceof TypeError && typeof err.message === 'string' && err.message.includes('_zod')

const SORT_FIELDS = {
  createdAt: 'action_logs.created_at',
} as const
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

type ActionLogProjectionBackfillOptions = {
  batchSize?: number
  force?: boolean
  logger?: (message: string) => void
  organizationId?: string | null
  tenantId?: string | null
}

export type ActionLogProjectionBackfillResult = {
  errors: number
  scanned: number
  skipped: number
  updated: number
}

type BackfillRow = {
  action_label: string | null
  action_type: string | null
  actor_user_id: string | null
  changed_fields: string[] | null
  changes_json: Record<string, unknown> | null
  command_id: string
  context_json: Record<string, unknown> | null
  created_at: Date
  id: string
  organization_id: string | null
  primary_changed_field: string | null
  snapshot_before: unknown | null
  source_key: string | null
  tenant_id: string | null
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.length > 0) return value
  }

  return null
}

function readRecord(record: Record<string, unknown>, ...keys: string[]): Record<string, unknown> | null {
  for (const key of keys) {
    const value = record[key]
    if (isRecord(value)) return value
  }

  return null
}

function readValue(record: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) return record[key]
  }

  return undefined
}

function readStringArray(record: Record<string, unknown>, ...keys: string[]): string[] | null {
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) {
      return value.filter((entry): entry is string => typeof entry === 'string')
    }
  }

  return null
}

function stringArraysEqual(left: string[] | null, right: string[]): boolean {
  if (!Array.isArray(left)) return false
  if (left.length !== right.length) return false

  return left.every((value, index) => value === right[index])
}

export class ActionLogService {
  constructor(
    private readonly em: EntityManager,
    private readonly tenantEncryptionService?: TenantDataEncryptionService,
    /**
     * Optional so that constructing this service by hand — as several tests and
     * any downstream app running without the ledger do — keeps working. When it
     * is present, every journal entry also extends the hash chain.
     */
    private readonly ledgerService?: LedgerService,
  ) {}

  private async decryptEntryPayload<T extends Record<string, unknown>>(entry: T): Promise<T> {
    if (!this.tenantEncryptionService?.isEnabled()) return entry

    try {
      const tenantId = readString(entry, 'tenantId', 'tenant_id')
      const organizationId = readString(entry, 'organizationId', 'organization_id')
      const dek = await this.tenantEncryptionService.getDek(tenantId)
      const deepDecrypt = (value: unknown): unknown => {
        if (!dek) return value
        if (typeof value === 'string' && value.split(':').length === 4 && value.endsWith(':v1')) {
          const decrypted = decryptWithAesGcm(value, dek.key)
          if (decrypted === null) return value
          return parseDecryptedFieldValue(decrypted)
        }
        if (Array.isArray(value)) return value.map((item) => deepDecrypt(item))
        if (value && typeof value === 'object') {
          const copy: Record<string, unknown> = {}
          for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
            copy[key] = deepDecrypt(item)
          }
          return copy
        }
        return value
      }

      const decrypted = await this.tenantEncryptionService.decryptEntityPayload(
        'audit_logs:action_log',
        entry,
        tenantId,
        organizationId,
      )

      const merged = {
        ...entry,
        ...decrypted,
      } as Record<string, unknown>

      // Audit log jsonb columns are encrypted as JSON-stringified payloads. After the
      // service-level `decryptEntityPayload` call (which now returns raw strings —
      // see issue #1810 follow-up), reattach the structured shape via
      // `parseDecryptedFieldValue` before running the recursive `deepDecrypt` walk
      // so nested encrypted strings inside payload objects/arrays are handled.
      const restoreJson = (value: unknown): unknown =>
        typeof value === 'string' ? parseDecryptedFieldValue(value) : value

      merged.changesJson = deepDecrypt(restoreJson(merged.changesJson ?? merged.changes_json ?? entry.changesJson ?? entry.changes_json))
      merged.changes_json = merged.changesJson
      merged.snapshotBefore = deepDecrypt(restoreJson(merged.snapshotBefore ?? merged.snapshot_before ?? entry.snapshotBefore ?? entry.snapshot_before))
      merged.snapshot_before = merged.snapshotBefore
      merged.snapshotAfter = deepDecrypt(restoreJson(merged.snapshotAfter ?? merged.snapshot_after ?? entry.snapshotAfter ?? entry.snapshot_after))
      merged.snapshot_after = merged.snapshotAfter
      merged.commandPayload = deepDecrypt(restoreJson(merged.commandPayload ?? merged.command_payload ?? entry.commandPayload ?? entry.command_payload))
      merged.command_payload = merged.commandPayload
      merged.contextJson = deepDecrypt(restoreJson(merged.contextJson ?? merged.context_json ?? entry.contextJson ?? entry.context_json))
      merged.context_json = merged.contextJson

      return merged as T
    } catch (err) {
      if (!decryptionWarningLogged) {
        decryptionWarningLogged = true
        logger.warn('Failed to decrypt action log entry', { err })
      }
      return entry
    }
  }

  private async decryptEntries(entries: ActionLog | ActionLog[] | null | undefined): Promise<void> {
    if (!entries) return

    const list = Array.isArray(entries) ? entries : [entries]
    for (const entry of list) {
      Object.assign(entry as unknown as Record<string, unknown>, await this.decryptEntryPayload(entry as unknown as Record<string, unknown>))
    }
  }

  /**
   * Writes an audit entry on the caller's EntityManager (R2b).
   *
   * **It must not fork.** A fork gets its own connection and its own
   * transaction, so a log written on one could commit while the business write
   * that caused it rolled back — or, as happened before R2b, the business write
   * could commit while the log was lost. The command bus now opens a transaction
   * around the write and this call; persisting on `this.em` is what puts them
   * in the same one.
   *
   * When no transaction is open this behaves exactly as the fork did: an
   * immediate, independent write.
   */
  async log(input: ActionLogCreateInput): Promise<ActionLog | null> {
    const data = this.parseCreateInput(input)
    const rawSubject = typeof input?.actorUserId === 'string' ? input.actorUserId : null
    const log = this.createLogEntity(this.em, data)
    // U7 — from the RAW subject, before it was narrowed to a uuid. The stored
    // `actor_user_id` cannot answer this: `api_key:<uuid>` has already become
    // `<uuid>` by the time it reaches the column.
    log.actorKind = resolveActorKind(rawSubject, data.actorUserId ?? null)
    await this.em.persist(log).flush()
    await this.appendToLedger(log, data, rawSubject)
    await this.decryptEntries(log)
    return log
  }

  /**
   * Extends the tenant's hash chain with the entry just written (R3).
   *
   * **Here, rather than at the call sites**, because both write paths already
   * funnel through `log()`: the command bus reaches it via `persistLog`, and
   * every custom route via `writeDirectWriteAuditLog`. Hooking the ledger to the
   * journal means the chain cannot fall behind the record it proves — a module
   * cannot audit something and forget to chain it.
   *
   * Runs on `this.em`, so it commits in the caller's transaction alongside the
   * journal entry and the business write (planning 06 §3.3). A failure
   * propagates and rolls all three back: a chain with a hole is a chain nobody
   * can rely on, and an unprovable record is the failure this batch exists to
   * remove.
   *
   * Skipped when no tenant is known. Chains are partitioned per tenant, and a
   * tenant-less event has no chain to join.
   */
  private async appendToLedger(
    log: ActionLog,
    data: ActionLogCreateInput,
    rawActorSubject: string | null,
  ): Promise<void> {
    if (!this.ledgerService || typeof this.ledgerService.append !== 'function') return
    if (!log.tenantId) return

    // Derived from the raw subject, because the stored one cannot answer the
    // question. `action_logs.actor_user_id` is a uuid column, and the normaliser
    // strips `api_key:` before writing it — so a key acting and a person acting
    // look identical in the journal (upstream-issues U7).
    //
    // The chain must not inherit that. Whether an actor was human or machine is
    // the distinction this whole platform is built to make, and it is recorded
    // here where nothing narrows it away.
    const subject = rawActorSubject ?? log.actorUserId
    const principal = subject ? parseSubject(subject) : null
    const context = isRecord(data.context) ? data.context : null
    const correlationId = context && typeof context.correlationId === 'string' ? context.correlationId : null
    const causationId = context && typeof context.causationId === 'string' ? context.causationId : null
    // T-06: a reversal must be readable as one. The trace row already carries
    // these two (`buildUndoTraceLog`), and the chain has to say what the record
    // says: an undo whose event type is the original command id is otherwise
    // indistinguishable from the act it reverses.
    const historyAction = context && typeof context.historyAction === 'string' ? context.historyAction : null
    const sourceLogId = context && typeof context.sourceLogId === 'string' ? context.sourceLogId : null

    await this.ledgerService.append({
      tenantId: log.tenantId,
      eventType: data.commandId,
      actorKind: principal ? principal.kind : (log.actorUserId ? 'human' : 'system'),
      actorId: principal ? principal.id : log.actorUserId,
      organizationId: log.organizationId,
      resourceKind: log.resourceKind,
      resourceId: log.resourceId,
      correlationId,
      causationId,
      // The chain records that a change happened and proves the journal entry
      // describing it has not been altered. It never copies the content: the
      // snapshots are customer data, subject to erasure, and a chain holding
      // them could not honour a deletion request without destroying its own
      // proof (planning 06 §5).
      payload: {
        actionLogId: log.id,
        actionLabel: data.actionLabel ?? null,
        snapshotBeforeDigest: data.snapshotBefore === undefined ? null : digestOpaque(data.snapshotBefore),
        snapshotAfterDigest: data.snapshotAfter === undefined ? null : digestOpaque(data.snapshotAfter),
        // Absent on an ordinary write, so those events stay byte-identical.
        ...(historyAction ? { historyAction } : {}),
        ...(sourceLogId ? { sourceLogId } : {}),
      },
    })
  }

  private parseCreateInput(input: ActionLogCreateInput): ActionLogCreateInput {
    let data: ActionLogCreateInput
    const schema = actionLogCreateSchema as typeof actionLogCreateSchema & { _zod?: unknown }
    const canValidate = Boolean(schema && typeof schema.parse === 'function')
    const shouldValidate = canValidate && runtimeValidationAvailable !== false

    if (shouldValidate) {
      try {
        data = schema.parse(input)
        runtimeValidationAvailable = true
      } catch (err) {
        if (isZodRuntimeMissing(err)) {
          // The runtime is genuinely unavailable — a build-shape problem, not a
          // caller's mistake. Warn once and stop trying.
          runtimeValidationAvailable = false
          if (!validationWarningLogged) {
            validationWarningLogged = true
            logger.warn('Falling back to permissive action log payload parser', { err })
          }
        } else {
          // A payload that fails validation is a caller's bug, and it was being
          // reported once per process — so the first bad write warned and every
          // one after it was silent. Every occurrence is logged now: this is the
          // audit trail, and a defect in it that reports itself once is a defect
          // nobody will find.
          logger.warn('Action log payload failed validation; falling back to the permissive parser', {
            err,
            commandId: typeof input?.commandId === 'string' ? input.commandId : null,
          })
        }
        data = this.normalizeInput(input)
      }
    } else {
      data = this.normalizeInput(input)
    }

    this.assertScopeSurvived(input, data)
    return data
  }

  /**
   * Refuses to write an entry whose scope was silently discarded.
   *
   * `normalizeInput` nulls any tenant, organization or actor id that is not a
   * uuid. That is reasonable for a value nobody supplied and **data loss** for
   * one somebody did: the entry lands with no tenant, the tenant-scoped list
   * never shows it, and — since R3 — the hash chain is partitioned by tenant, so
   * it is never chained either. The write appears to succeed and the record is
   * unreachable and unprovable.
   *
   * Fail-closed, matching the rest of this path: an action that happened without
   * a record is worse than an action that did not happen. A caller passing a
   * malformed scope is a bug, and it should stop the write rather than quietly
   * produce an orphan.
   */
  private assertScopeSurvived(input: ActionLogCreateInput, data: ActionLogCreateInput): void {
    const fields: Array<keyof ActionLogCreateInput> = ['tenantId', 'organizationId', 'actorUserId']
    const dropped = fields.filter((field) => {
      const supplied = input?.[field]
      return typeof supplied === 'string' && supplied.length > 0 && data[field] == null
    })

    if (dropped.length === 0) return

    throw new Error(
      `[internal] Action log entry would lose ${dropped.join(', ')}: the value supplied is not a uuid. ` +
      'Writing it would create an entry that no tenant-scoped query returns and no hash chain covers.',
    )
  }

  private createLogEntity(fork: EntityManager, data: ActionLogCreateInput): ActionLog {
    const projection = deriveActionLogProjection({
      actorUserId: data.actorUserId ?? null,
      actionLabel: data.actionLabel ?? null,
      changes: isRecord(data.changes) ? data.changes : null,
      commandId: data.commandId,
      context: isRecord(data.context) ? data.context : null,
      snapshotBefore: data.snapshotBefore,
    })

    return fork.create(ActionLog, {
      tenantId: data.tenantId ?? null,
      organizationId: data.organizationId ?? null,
      actorUserId: data.actorUserId ?? null,
      commandId: data.commandId,
      actionLabel: data.actionLabel ?? null,
      actionType: projection.actionType,
      resourceKind: data.resourceKind ?? null,
      resourceId: data.resourceId ?? null,
      parentResourceKind: data.parentResourceKind ?? null,
      parentResourceId: data.parentResourceId ?? null,
      relatedResourceKind: toOptionalString(data.relatedResourceKind) ?? null,
      relatedResourceId: toOptionalString(data.relatedResourceId) ?? null,
      executionState: data.executionState ?? 'done',
      undoToken: data.undoToken ?? null,
      commandPayload: data.commandPayload ?? null,
      snapshotBefore: data.snapshotBefore ?? null,
      snapshotAfter: data.snapshotAfter ?? null,
      changesJson: isRecord(data.changes) ? data.changes : null,
      changedFields: projection.changedFields,
      primaryChangedField: projection.primaryChangedField,
      contextJson: isRecord(data.context) ? data.context : null,
      sourceKey: projection.sourceKey,
      // Recorded at write time by the code that knows what the act was. A reader
      // inferring this later from the payload is exactly the leak G6 removes.
      visibilityScope: data.visibilityScope ?? DEFAULT_VISIBILITY_SCOPE,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  private normalizeInput(input: Partial<ActionLogCreateInput> | null | undefined): ActionLogCreateInput {
    if (!input) {
      return {
        tenantId: null,
        organizationId: null,
        actorUserId: null,
        commandId: 'unknown',
        actionLabel: undefined,
        resourceKind: undefined,
        resourceId: undefined,
        relatedResourceKind: null,
        relatedResourceId: null,
        executionState: 'done',
        undoToken: undefined,
        commandPayload: undefined,
        snapshotBefore: undefined,
        snapshotAfter: undefined,
        changes: undefined,
        context: undefined,
      }
    }

    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
    const toNullableUuid = (value: unknown) => {
      if (typeof value !== 'string' || value.length === 0) return null
      const candidate = parseSubject(value).id
      return UUID_REGEX.test(candidate) ? candidate : null
    }

    const normalizeRecordLike = (value: unknown): ActionLogCreateInput['changes'] => {
      if (value === null) return null
      if (Array.isArray(value)) return value
      if (typeof value === 'object') return value as Record<string, unknown>
      return undefined
    }

    const normalizeContext = (value: unknown) => (
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? value as Record<string, unknown>
        : undefined
    )

    return {
      tenantId: toNullableUuid(input.tenantId),
      organizationId: toNullableUuid(input.organizationId),
      actorUserId: toNullableUuid(input.actorUserId),
      commandId: typeof input.commandId === 'string' && input.commandId.length > 0 ? input.commandId : 'unknown',
      actionLabel: toOptionalString(input.actionLabel) ?? undefined,
      resourceKind: toOptionalString(input.resourceKind) ?? undefined,
      resourceId: toOptionalString(input.resourceId) ?? undefined,
      parentResourceKind: toOptionalString(input.parentResourceKind) ?? null,
      parentResourceId: toOptionalString(input.parentResourceId) ?? null,
      relatedResourceKind: toOptionalString(input.relatedResourceKind) ?? null,
      relatedResourceId: toOptionalString(input.relatedResourceId) ?? null,
      executionState: input.executionState === 'undone' || input.executionState === 'failed' ? input.executionState : 'done',
      undoToken: toOptionalString(input.undoToken) ?? undefined,
      commandPayload: input.commandPayload,
      snapshotBefore: input.snapshotBefore,
      snapshotAfter: input.snapshotAfter,
      changes: normalizeRecordLike(input.changes),
      context: normalizeContext(input.context),
    }
  }

  private parseListQuery(query: Partial<ActionLogListQuery>) {
    return actionLogListSchema.parse({
      ...query,
    })
  }

  private resolveActorUserIds(parsed: ActionLogListQuery): string[] {
    const values = [...(parsed.actorUserIds ?? [])]
    if (parsed.actorUserId) values.push(parsed.actorUserId)

    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
  }

  private resolveFieldNames(parsed: ActionLogListQuery): string[] {
    const values = [...(parsed.fieldNames ?? [])]
    if (parsed.fieldName) values.push(parsed.fieldName)

    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
  }

  private resolveActionTypes(parsed: ActionLogListQuery): ActionLogFilterType[] {
    const values = [...(parsed.actionTypes ?? [])]
    if (parsed.actionType) values.push(parsed.actionType)

    return Array.from(new Set(values))
      .filter((value): value is ActionLogFilterType => ACTION_LOG_FILTER_TYPES.includes(value as ActionLogFilterType))
  }

  private resolvePagination(parsed: ActionLogListQuery): { page: number; pageSize: number; offset: number; limit: number } {
    const pageSize =
      typeof parsed.pageSize === 'number' && parsed.pageSize > 0
        ? parsed.pageSize
        : typeof parsed.limit === 'number' && parsed.limit > 0
          ? parsed.limit
          : 50
    const page = typeof parsed.page === 'number' && parsed.page > 0 ? parsed.page : 1
    const offset =
      typeof parsed.offset === 'number' && parsed.offset >= 0
        ? parsed.offset
        : (page - 1) * pageSize
    return { page, pageSize, offset, limit: pageSize }
  }

  private async loadEntries(parsed: ActionLogListQuery, options?: { paginate?: boolean }) {
    let query = (this.buildListQuery(parsed) as any).select('action_logs.id as id')

    if (options?.paginate !== false) {
      const { limit, offset } = this.resolvePagination(parsed)
      query = query.limit(limit).offset(offset)
    }

    const rows = await query.execute()
    const ids = rows.map((row: any) => row.id).filter(Boolean)
    if (ids.length === 0) return []

    const results = await this.em.find(ActionLog, {
      id: { $in: ids } as any,
      deletedAt: null,
    })
    await this.decryptEntries(results)

    const byId = new Map(results.map((entry: any) => [entry.id, entry]))
    return ids
      .map((id: any) => byId.get(id))
      .filter((entry: any): entry is ActionLog => Boolean(entry))
  }

  private buildListQuery(parsed: ActionLogListQuery): any {
    let query = (this.em.getKysely<any>() as any)
      .selectFrom('action_logs')
      .selectAll()
      .where('action_logs.deleted_at', 'is', null) as any

    // Audience, pushed into SQL rather than filtered afterwards.
    //
    // Discarding rows in JavaScript would still leak through everything that
    // counts, pages or exports them -- and this route does all three. An empty
    // list means the caller may read nothing, which is why it filters on an
    // impossible value rather than skipping the clause: a missing filter must
    // never be the same as an unrestricted one.
    if (parsed.visibilityScopes) {
      const scopes = parsed.visibilityScopes
      const ownActorUserId = parsed.visibilityActorUserId
      query = query.where((eb: any) => {
        const clauses: any[] = []
        // Fail closed: an empty list is "may read nothing", which must not
        // collapse into the same SQL as "no restriction".
        if (scopes.length) clauses.push(eb('action_logs.visibility_scope', 'in', scopes))
        // Nobody is locked out of their own history. Readable because of who
        // performed the act, which is a per-row fact and cannot live in the
        // scope list.
        if (ownActorUserId) {
          clauses.push(eb.and([
            eb('action_logs.visibility_scope', '=', 'private'),
            eb('action_logs.actor_user_id', '=', ownActorUserId),
          ]))
        }
        return clauses.length ? eb.or(clauses) : eb('action_logs.visibility_scope', '=', '__none__')
      })
    }

    if (parsed.tenantId) query = query.where('action_logs.tenant_id', '=', parsed.tenantId)
    // Include tenant-scoped entries alongside the requested organization's.
    //
    // Some records have no organization by design — an API key declares
    // `orgField: null`, so its audit entry is scoped to the tenant only. An
    // equality filter hid every such entry from everyone, whatever organization
    // they were viewing, which is why the Action Log looked empty even for
    // actions that had been recorded (R2a; upstream-issues.md → U1).
    //
    // Tenant scoping above still applies, so this widens visibility within a
    // tenant and never across tenants.
    if (parsed.organizationId) {
      const organizationId = parsed.organizationId
      // `eb: any` matches the existing expression-builder callbacks in this file
      // (see the includeRelated branch below); the query object is not typed
      // narrowly enough for the builder to infer.
      query = query.where((eb: any) =>
        eb.or([
          eb('action_logs.organization_id', '=', organizationId),
          eb('action_logs.organization_id', 'is', null),
        ]),
      )
    }

    const actorUserIds = this.resolveActorUserIds(parsed)
    if (actorUserIds.length === 1) query = query.where('action_logs.actor_user_id', '=', actorUserIds[0])
    if (actorUserIds.length > 1) query = query.where('action_logs.actor_user_id', 'in', actorUserIds)

    if (parsed.includeRelated && parsed.resourceKind && parsed.resourceId) {
      query = query.where((eb: any) =>
        eb.or([
          eb.and([
            eb('action_logs.resource_kind', '=', parsed.resourceKind),
            eb('action_logs.resource_id', '=', parsed.resourceId),
          ]),
          eb.and([
            eb('action_logs.parent_resource_kind', '=', parsed.resourceKind),
            eb('action_logs.parent_resource_id', '=', parsed.resourceId),
          ]),
          eb.and([
            eb('action_logs.related_resource_kind', '=', parsed.resourceKind),
            eb('action_logs.related_resource_id', '=', parsed.resourceId),
          ]),
        ])
      )
    } else {
      if (parsed.resourceKind) query = query.where('action_logs.resource_kind', '=', parsed.resourceKind)
      if (parsed.resourceId) query = query.where('action_logs.resource_id', '=', parsed.resourceId)
    }

    if (parsed.undoableOnly) query = query.where('action_logs.undo_token', 'is not', null)
    if (parsed.before) query = query.where('action_logs.created_at', '<', parsed.before)
    if (parsed.after) query = query.where('action_logs.created_at', '>', parsed.after)

    const fieldNames = this.resolveFieldNames(parsed)
    if (fieldNames.length === 1) query = query.where('action_logs.primary_changed_field', '=', fieldNames[0])
    if (fieldNames.length > 1) query = query.where('action_logs.primary_changed_field', 'in', fieldNames)

    const actionTypes = this.resolveActionTypes(parsed)
    if (actionTypes.length === 1) query = query.where('action_logs.action_type', '=', actionTypes[0])
    if (actionTypes.length > 1) query = query.where('action_logs.action_type', 'in', actionTypes)

    if (parsed.sortField === 'user') {
      query = query.leftJoin('users as audit_actor', 'audit_actor.id', 'action_logs.actor_user_id')
    }

    const sortDir = parsed.sortDir === 'asc' ? 'asc' : 'desc'
    switch (parsed.sortField) {
      case 'user':
        query = query.orderBy(sql`coalesce(nullif(audit_actor.name, ''), audit_actor.email, '')`, sortDir)
        break
      case 'action':
        query = query.orderBy(sql`coalesce(action_logs.action_type, '')`, sortDir)
        break
      case 'field':
        query = query.orderBy(sql`coalesce(action_logs.primary_changed_field, '')`, sortDir)
        break
      case 'source':
        query = query.orderBy(sql`coalesce(action_logs.source_key, '')`, sortDir)
        break
      case 'createdAt':
      default:
        query = query.orderBy(SORT_FIELDS.createdAt, sortDir)
        query = query.orderBy('action_logs.id', sortDir)
        return query
    }

    query = query.orderBy('action_logs.created_at', 'desc')
    query = query.orderBy('action_logs.id', 'desc')
    return query
  }

  async count(query: Partial<ActionLogListQuery>) {
    const parsed = this.parseListQuery(query)
    const row = await (this.buildListQuery(parsed) as any)
      .clearSelect()
      .clearOrderBy()
      .select(sql<string>`count(*)`.as('count'))
      .executeTakeFirst()

    if (!row) return 0
    const rawCount = row.count ?? 0
    return typeof rawCount === 'number' ? rawCount : Number.parseInt(rawCount, 10) || 0
  }

  async list(query: Partial<ActionLogListQuery>) {
    const parsed = this.parseListQuery(query)
    const { page, pageSize } = this.resolvePagination(parsed)
    const [items, total] = await Promise.all([
      this.loadEntries(parsed),
      this.count(parsed),
    ])
    const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)))
    return { items, total, page, pageSize, totalPages }
  }

  async latestUndoableForActor(actorUserId: string, scope: { tenantId?: string | null; organizationId?: string | null }) {
    const where: FilterQuery<ActionLog> = {
      actorUserId,
      undoToken: { $ne: null } as any,
      executionState: 'done',
      deletedAt: null,
    }
    if (scope.tenantId) where.tenantId = scope.tenantId
    if (scope.organizationId) where.organizationId = scope.organizationId

    const entry = await this.em.findOne(ActionLog, where, { orderBy: { createdAt: 'desc' } })
    await this.decryptEntries(entry)
    return entry
  }

  async claimForUndo(id: string): Promise<boolean> {
    const affected = await this.em.nativeUpdate(
      ActionLog,
      { id, executionState: 'done', deletedAt: null },
      { executionState: 'undoing' },
    )
    return affected === 1
  }

  async releaseUndoClaim(id: string): Promise<boolean> {
    const affected = await this.em.nativeUpdate(
      ActionLog,
      { id, executionState: 'undoing', deletedAt: null },
      { executionState: 'done' },
    )
    return affected === 1
  }

  /**
   * Records that an act was reversed (T-06).
   *
   * **The trace is chained, exactly like every other journal row.** Before this,
   * the trace was created with `createLogEntity` on a forked EntityManager and
   * flushed, and `appendToLedger` was never called: the one record saying "this
   * was undone" lived only in the editable journal, so deleting it left the chain
   * intact and still verifying. A ledger with a known gap stops being evidence.
   *
   * Two things changed, and both are the rule rather than the symptom:
   *
   * - **`this.em`, not `this.em.fork()`.** The state change, the trace row and
   *   its chain event must commit with the reversal that produced them, or not at
   *   all. `appendToLedger` already states that requirement; a fork was the one
   *   thing that could break it.
   * - **`appendToLedger` runs**, with the trace's own context, so the event
   *   carries `historyAction: 'undo'` and `sourceLogId` and is distinguishable
   *   from the act it reverses.
   *
   * Redo needed no change: it re-executes through the command bus, which reaches
   * `log()` and chains. This makes undo agree with it.
   */
  async markUndone(id: string, traceInput?: ActionLogCreateInput) {
    const log = await this.em.findOne(ActionLog, { id, deletedAt: null })
    if (!log) return null

    log.executionState = 'undone'
    log.undoToken = null

    const parsed = traceInput ? this.parseCreateInput(traceInput) : null
    const traceLog = parsed ? this.createLogEntity(this.em, parsed) : null
    if (traceLog) {
      this.em.persist(traceLog)
    }

    await this.em.flush()
    await this.decryptEntries(log)
    if (traceLog && parsed) {
      await this.decryptEntries(traceLog)
      // The raw subject, not the stored one: `actor_user_id` is a uuid column
      // and cannot say whether the actor was human or a machine.
      await this.appendToLedger(traceLog, parsed, parsed.actorUserId ?? null)
    }

    return log
  }

  async findByUndoToken(undoToken: string) {
    const entry = await this.em.findOne(ActionLog, { undoToken, deletedAt: null })
    await this.decryptEntries(entry)
    return entry
  }

  async findById(id: string) {
    const entry = await this.em.findOne(ActionLog, { id, deletedAt: null })
    await this.decryptEntries(entry)
    return entry
  }

  async latestUndoableForResource(params: {
    actorUserId: string
    tenantId?: string | null
    organizationId?: string | null
    resourceKind?: string | null
    resourceId?: string | null
  }) {
    const where: FilterQuery<ActionLog> = {
      actorUserId: params.actorUserId,
      undoToken: { $ne: null } as any,
      executionState: 'done',
      deletedAt: null,
    }
    if (params.tenantId) where.tenantId = params.tenantId
    if (params.organizationId) where.organizationId = params.organizationId
    if (params.resourceKind) where.resourceKind = params.resourceKind
    if (params.resourceId) where.resourceId = params.resourceId

    const entry = await this.em.findOne(ActionLog, where, { orderBy: { createdAt: 'desc' } })
    await this.decryptEntries(entry)
    return entry
  }

  async latestUndoneForActor(actorUserId: string, scope: { tenantId?: string | null; organizationId?: string | null }) {
    const where: FilterQuery<ActionLog> = {
      actorUserId,
      executionState: 'undone',
      deletedAt: null,
    }
    if (scope.tenantId) where.tenantId = scope.tenantId
    if (scope.organizationId) where.organizationId = scope.organizationId

    const entry = await this.em.findOne(ActionLog, where, { orderBy: { updatedAt: 'desc' } })
    await this.decryptEntries(entry)
    return entry
  }

  async markRedone(id: string) {
    const log = await this.em.findOne(ActionLog, { id, deletedAt: null })
    if (!log) return null

    log.executionState = 'redone'
    log.undoToken = null
    await this.em.flush()
    return log
  }

  async backfillProjections(options: ActionLogProjectionBackfillOptions = {}): Promise<ActionLogProjectionBackfillResult> {
    const batchSize = Math.min(Math.max(Math.trunc(options.batchSize ?? 250), 1), 1000)
    const logger = options.logger ?? (() => {})
    const result: ActionLogProjectionBackfillResult = {
      errors: 0,
      scanned: 0,
      skipped: 0,
      updated: 0,
    }

    let cursorCreatedAt: Date | null = null
    let cursorId: string | null = null

    while (true) {
      const rowsQuery = (this.em.getKysely<any>() as any)
        .selectFrom('action_logs')
        .select([
          'action_logs.id',
          'action_logs.tenant_id',
          'action_logs.organization_id',
          'action_logs.actor_user_id',
          'action_logs.command_id',
          'action_logs.action_label',
          'action_logs.snapshot_before',
          'action_logs.changes_json',
          'action_logs.context_json',
          'action_logs.action_type',
          'action_logs.source_key',
          'action_logs.changed_fields',
          'action_logs.primary_changed_field',
          'action_logs.created_at',
        ])
        .where('action_logs.deleted_at', 'is', null) as any

      if (options.tenantId) rowsQuery.where('action_logs.tenant_id', '=', options.tenantId)
      if (options.organizationId) rowsQuery.where('action_logs.organization_id', '=', options.organizationId)

      if (!options.force) {
        rowsQuery.where((eb: any) =>
          eb.or([
            eb('action_logs.action_type', 'is', null),
            eb('action_logs.source_key', 'is', null),
            eb('action_logs.changed_fields', 'is', null),
          ])
        )
      }

      if (cursorCreatedAt && cursorId) {
        rowsQuery.where((eb: any) =>
          eb.or([
            eb('action_logs.created_at', '>', cursorCreatedAt),
            eb.and([
              eb('action_logs.created_at', '=', cursorCreatedAt),
              eb('action_logs.id', '>', cursorId),
            ]),
          ])
        )
      }

      const rows = await rowsQuery
        .orderBy('created_at', 'asc')
        .orderBy('id', 'asc')
        .limit(batchSize)

      if (rows.length === 0) break

      for (const row of rows) {
        result.scanned += 1

        try {
          const decrypted = await this.decryptEntryPayload(row as unknown as Record<string, unknown>)
          const projection = deriveActionLogProjection({
            actorUserId: readString(decrypted, 'actorUserId', 'actor_user_id'),
            actionLabel: readString(decrypted, 'actionLabel', 'action_label'),
            changes: readRecord(decrypted, 'changesJson', 'changes_json'),
            commandId: readString(decrypted, 'commandId', 'command_id') ?? 'unknown',
            context: readRecord(decrypted, 'contextJson', 'context_json'),
            snapshotBefore: readValue(decrypted, 'snapshotBefore', 'snapshot_before'),
          })

          const needsUpdate = options.force === true
            || row.action_type !== projection.actionType
            || row.source_key !== projection.sourceKey
            || row.primary_changed_field !== projection.primaryChangedField
            || !stringArraysEqual(row.changed_fields, projection.changedFields)

          if (!needsUpdate) {
            result.skipped += 1
            continue
          }

          await (this.em.getKysely<any>() as any)
            .updateTable('action_logs')
            .set({
              action_type: projection.actionType,
              changed_fields: projection.changedFields,
              primary_changed_field: projection.primaryChangedField,
              source_key: projection.sourceKey,
            })
            .where('id', '=', row.id)
            .execute()

          result.updated += 1
        } catch (err) {
          result.errors += 1
          logger(`[backfill] Failed for action log ${row.id}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      const lastRow = rows[rows.length - 1]
      cursorCreatedAt = lastRow.created_at
      cursorId = lastRow.id

      logger(
        `[backfill] Processed ${result.scanned} action logs (updated: ${result.updated}, skipped: ${result.skipped}, errors: ${result.errors})`,
      )

      if (rows.length < batchSize) break
    }

    return result
  }
}
