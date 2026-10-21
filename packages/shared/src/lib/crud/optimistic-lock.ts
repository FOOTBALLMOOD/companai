/**
 * OSS optimistic-locking guard service.
 *
 * Registered as `crudMutationGuardService` (by the platform DI bootstrap and
 * by hand-wiring modules that override the default reader). Compares the
 * client-sent expected `updated_at` (carried via the extension header
 * defined in `optimistic-lock-headers.ts`) against the current DB
 * `updated_at` for the target entity; on mismatch returns HTTP 409 with the
 * structured `OptimisticLockConflictBody`.
 *
 * **Default ON** (Phase 14, 2026-05-27). Activate / scope / disable via
 * `OM_OPTIMISTIC_LOCK`:
 *   - unset / empty / whitespace    → ON for every CRUD entity (`{ mode: 'all' }`)
 *   - `all`                         → all entities (explicit form of the default)
 *   - `customers.company,sales.order` → allow-list (lowercased, trimmed, deduped)
 *   - `off` / `false` / `0` / `no` / `disabled` / `none` → fully disabled
 *
 * The guard is still strictly additive at runtime: clients that do not send
 * the `x-om-ext-optimistic-lock-expected-updated-at` header pass through
 * unchanged, so flipping the default to ON cannot introduce new 409s on
 * existing API consumers. Pages that opt into the round-trip (via
 * `CrudForm`'s `optimisticLockUpdatedAt` prop or by calling
 * `buildOptimisticLockHeader`) gain protection without any per-deployment
 * env change.
 *
 * **`T-30` — the eight branches that pass, and which of them are designed.** An
 * audit counted five and reported the designed ones as fail-opens, so the map is
 * here to be checked against the code:
 *   1. `mode === 'off'`                      — the operator disabled it
 *   2. operation is not update/delete        — nothing to lock on a create
 *   3. entity is not on the allow-list       — the allow-list's purpose
 *   4. no reader registered for the entity   — **strict-additive opt-in**, by design
 *   5. **no token sent at all**              — **the documented opt-in**, by design
 *   6. `currentRaw == null`                  — the record is gone; the CRUD route's 404 should fire
 *   7. stored value is not a date            — no comparison possible; **logged** (it used to be silent)
 *   8. ~~token sent but unreadable~~         — **no longer passes: 400** `optimistic_lock_token_unreadable`
 * Branch 8 was the defect: a client that sent a token asked for a conditional
 * write, and got an unconditional one in silence. Branches 5 and 8 shared one
 * answer, which is how the second hid behind the first.
 *
 * Cannot be registered as a static `data/guards.ts` `MutationGuard` because
 * the static `validate(input)` receives only `MutationGuardInput` — no
 * container / em access. Stateful checks that need to read current DB state
 * MUST go through the DI service path (this file).
 *
 * Spec: .ai/specs/implemented/2026-05-25-oss-optimistic-locking.md
 */
import type { EntityManager } from '@mikro-orm/postgresql'
import type {
  CrudMutationGuardValidateInput,
  CrudMutationGuardValidationResult,
  CrudMutationGuardAfterSuccessInput,
} from './mutation-guard'
import {
  OPTIMISTIC_LOCK_CONFLICT_CODE,
  OPTIMISTIC_LOCK_CONFLICT_ERROR,
  OPTIMISTIC_LOCK_ENV_VAR,
  OPTIMISTIC_LOCK_HEADER_NAME,
  OPTIMISTIC_LOCK_TOKEN_UNREADABLE_CODE,
  OPTIMISTIC_LOCK_TOKEN_UNREADABLE_ERROR,
  type OptimisticLockConflictBody,
} from './optimistic-lock-headers'
import { getAllOptimisticLockReaders } from './optimistic-lock-store'
import { createLogger } from '../logger'

const logger = createLogger('shared').child({ component: 'optimistic-lock' })

export type OptimisticLockConfig =
  | { mode: 'off' }
  | { mode: 'all' }
  | { mode: 'allowlist'; entities: ReadonlySet<string> }

/**
 * Tokens (case-insensitive, single-token-only) that explicitly disable the
 * guard. Spelled out as a fixed set so tests can pin them; deliberately the
 * same shape `parseBooleanToken` recognises so operators can mirror existing
 * habit. Mixing an off-token with other entities is invalid input — we treat
 * any presence of an off-token in the comma list as a request to disable.
 */
const OPTIMISTIC_LOCK_OFF_TOKENS: ReadonlySet<string> = new Set([
  'off',
  'false',
  '0',
  'no',
  'disabled',
  'none',
])

/**
 * Pure parser for `OM_OPTIMISTIC_LOCK`. Exported separately so tests can
 * exercise the grammar without spinning up the full service.
 *
 * Default is **ON** (`{ mode: 'all' }`) — unset / empty / whitespace input
 * activates the guard for every CRUD entity. Operators opt out via
 * `OM_OPTIMISTIC_LOCK=off` (or `false` / `0` / `no` / `disabled` / `none`).
 */
export function parseOptimisticLockEnv(raw: string | undefined | null): OptimisticLockConfig {
  if (raw == null) return { mode: 'all' }
  const trimmed = String(raw).trim()
  if (trimmed === '') return { mode: 'all' }

  const tokens = trimmed
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 0)

  if (tokens.length === 0) return { mode: 'all' }
  if (tokens.some((token) => OPTIMISTIC_LOCK_OFF_TOKENS.has(token))) return { mode: 'off' }
  if (tokens.includes('all')) return { mode: 'all' }

  return { mode: 'allowlist', entities: new Set(tokens) }
}

export type OptimisticLockResolverInput = {
  expectedFromHeader: string | null
  resourceKind: string
  resourceId: string
}

/**
 * Hook reserved for the enterprise `record_locks` module to override token
 * resolution (e.g. read the expected token from a lock record instead of
 * the request header). OSS keeps the default = "what the client sent".
 *
 * Documented as part of the enterprise extension contract; not used in OSS
 * itself.
 */
export type ResolveExpectedUpdatedAt = (
  input: OptimisticLockResolverInput,
) => Promise<string | null> | string | null

const defaultResolveExpectedUpdatedAt: ResolveExpectedUpdatedAt = ({ expectedFromHeader }) =>
  expectedFromHeader

export type OptimisticLockCurrentReader = (
  em: EntityManager,
  input: { resourceKind: string; resourceId: string; tenantId: string; organizationId: string | null },
) => Promise<string | null>

export type GenericOptimisticLockReaderOptions = {
  /** MikroORM entity class. */
  entity: unknown
  /** Primary key field. Defaults to `id`. */
  idField?: string
  /** Tenant scope field. Defaults to `tenantId`. Pass `null` to skip tenant scoping (rare — only when the entity itself has no `tenantId` column). */
  tenantField?: string | null
  /** Organization scope field. Defaults to `organizationId`. Pass `null` to skip organization scoping. */
  orgField?: string | null
  /** Soft-delete column. Defaults to `deletedAt`. Pass `null` to skip the implicit not-deleted filter. */
  softDeleteField?: string | null
  /** Optional fixed filter merged into every query (e.g. `{ kind: 'company' }` for a discriminated table). */
  extraFilter?: Record<string, unknown>
  /** Optional ORM field name carrying the timestamp. Defaults to `updatedAt`. */
  updatedAtField?: string
}

/**
 * Build a generic optimistic-lock reader for any ORM entity that follows the
 * platform conventions (`id` + `tenantId` + `organizationId` + `deletedAt` +
 * `updatedAt`). The reader projects only the timestamp column so PII never
 * materializes.
 *
 * Used by `makeCrudRoute` to auto-register one reader per CRUD route at
 * module-load time (see Phase 13 of the OSS optimistic-locking spec).
 * Module authors who need bespoke filtering (e.g. discriminator on a shared
 * table) keep registering their own reader via `registerOptimisticLockReaders`
 * — those hand-wired registrations win because they land first.
 *
 * Fail-open contract: if the underlying `findOne` throws (missing column,
 * schema drift, mid-migration) the reader returns `null`, which the guard
 * treats as "entity already gone" and lets the CRUD path's own 404 fire.
 * We MUST NOT throw out of the reader — that would 500 every mutation on
 * the affected entity instead of opting it out of the optimistic check.
 *
 * Because a genuine not-found resolves to `null` *without* throwing (MikroORM's
 * `findOne` returns `null`, it does not raise), the catch below only fires on a
 * real query failure — most commonly a `softDeleteField`/`tenantField`/`orgField`
 * misconfig that filters on a column the entity's table does not have. That class
 * of bug silently disables locking for the whole entity, so the catch logs loudly
 * with the `resourceKind` instead of swallowing the error. The control flow stays
 * fail-open (returns `null`) to honor the no-500 contract; the durable defense is
 * the static reader-resolution guard (`optimistic-lock-editable-entities.test.ts`)
 * which fails the build when a route would land in this path.
 */
export function createGenericOptimisticLockReader(
  opts: GenericOptimisticLockReaderOptions,
): OptimisticLockCurrentReader {
  const idField = opts.idField ?? 'id'
  const tenantField = opts.tenantField === null ? null : opts.tenantField ?? 'tenantId'
  const orgField = opts.orgField === null ? null : opts.orgField ?? 'organizationId'
  const softDeleteField = opts.softDeleteField === null ? null : opts.softDeleteField ?? 'deletedAt'
  const updatedAtField = opts.updatedAtField ?? 'updatedAt'
  const extraFilter = opts.extraFilter ?? {}

  return async (em, { resourceKind, resourceId, tenantId, organizationId }) => {
    const filter: Record<string, unknown> = { [idField]: resourceId }
    if (tenantField) filter[tenantField] = tenantId
    if (orgField && organizationId) filter[orgField] = organizationId
    if (softDeleteField) filter[softDeleteField] = null
    for (const [key, value] of Object.entries(extraFilter)) filter[key] = value

    try {
      const row = await em.findOne(opts.entity as never, filter as never, {
        fields: [updatedAtField] as never,
      })
      if (!row || typeof row !== 'object') return null
      const value = (row as Record<string, unknown>)[updatedAtField]
      if (value instanceof Date) return value.toISOString()
      if (typeof value === 'string' && value.length > 0) return value
      return null
    } catch (err) {
      // A genuine not-found returns null above without throwing; reaching here
      // means the query itself failed (most likely a softDeleteField/tenant/org
      // misconfig filtering on a column the table lacks), which silently disables
      // locking for `resourceKind`. Log loudly so the misconfig is visible.
      // Control flow stays fail-open (return null) to honor the no-500 contract.
      logger.error('Reader query failed — optimistic locking is DISABLED for this entity until fixed; most likely a softDeleteField/tenantField/orgField filters on a column the table does not have', { resourceKind, err })
      return null
    }
  }
}

export type OptimisticLockGuardOptions = {
  /** EntityManager resolver. Container-bound via DI in real usage. */
  getEm: () => EntityManager
  /**
   * Maps `resourceKind` → reader that returns the current
   * `updated_at` as an ISO string (or null when not found).
   *
   * The reader receives the EM so module authors can choose the
   * right `findOne` shape for their entity (`findOneWithDecryption`
   * when sensitive, plain `findOne` otherwise — but only requesting
   * `updated_at` so no PII materializes).
   *
   * When omitted, the service pulls readers from the shared
   * `optimistic-lock-store` (the recommended pattern for multi-module
   * deployments — each module registers its own readers via
   * `registerOptimisticLockReaders(...)` at module-load time).
   */
  readers?: Record<string, OptimisticLockCurrentReader>
  /** Override env source (mostly for tests). Defaults to `process.env`. */
  envValue?: string | null
  /** Override the token resolver. Defaults to "use the header value". */
  resolveExpected?: ResolveExpectedUpdatedAt
}

export type OptimisticLockGuardService = {
  validateMutation: (input: CrudMutationGuardValidateInput) => Promise<CrudMutationGuardValidationResult>
  afterMutationSuccess: (input: CrudMutationGuardAfterSuccessInput) => Promise<void>
  /** Exposed for tests / introspection. */
  getConfig: () => OptimisticLockConfig
}

function readHeader(headers: Headers, name: string): string | null {
  const direct = headers.get(name)
  if (typeof direct === 'string' && direct.trim().length > 0) return direct.trim()
  return null
}

/**
 * Normalize an `updated_at` token to a canonical ISO-8601 string, or `null`
 * when the input cannot be parsed. Exported so the command-level helper
 * (`optimistic-lock-command.ts`) compares timestamps with the EXACT same
 * normalization as the CRUD guard — otherwise the same instant could compare
 * unequal across the two paths.
 */
export function normalizeIsoToken(raw: string): string | null {
  const ms = Date.parse(raw)
  if (!Number.isFinite(ms)) return null
  return new Date(ms).toISOString()
}

function buildConflictBody(currentIso: string, expectedIso: string): OptimisticLockConflictBody {
  return {
    error: OPTIMISTIC_LOCK_CONFLICT_ERROR,
    code: OPTIMISTIC_LOCK_CONFLICT_CODE,
    currentUpdatedAt: currentIso,
    expectedUpdatedAt: expectedIso,
  }
}

/**
 * Factory for the optimistic-lock guard service.
 *
 * Usage from a module's `di.ts`:
 *
 * ```ts
 * import { asFunction } from 'awilix'
 * import { createOptimisticLockGuardService } from '@open-mercato/shared/lib/crud/optimistic-lock'
 *
 * container.register({
 *   crudMutationGuardService: asFunction((cradle) => createOptimisticLockGuardService({
 *     getEm: () => cradle.em,
 *     readers: {
 *       'customers.company': async (em, { resourceId, tenantId }) => {
 *         const row = await em.findOne(Company, { id: resourceId, tenantId }, { fields: ['updatedAt'] })
 *         return row?.updatedAt ? row.updatedAt.toISOString() : null
 *       },
 *     },
 *   })).singleton(),
 * })
 * ```
 */
export function createOptimisticLockGuardService(
  opts: OptimisticLockGuardOptions,
): OptimisticLockGuardService {
  const envValue = opts.envValue !== undefined ? opts.envValue : process.env[OPTIMISTIC_LOCK_ENV_VAR]
  const config = parseOptimisticLockEnv(envValue)
  const resolveExpected = opts.resolveExpected ?? defaultResolveExpectedUpdatedAt
  const debugEnabled = process.env.OM_OPTIMISTIC_LOCK_DEBUG === '1'

  function isEntityEnabled(resourceKind: string): boolean {
    if (config.mode === 'off') return false
    if (config.mode === 'all') return true
    return config.entities.has(resourceKind.toLowerCase())
  }

  async function validateMutation(
    input: CrudMutationGuardValidateInput,
  ): Promise<CrudMutationGuardValidationResult> {
    if (config.mode === 'off') {
      return { ok: true, shouldRunAfterSuccess: false }
    }
    if (input.operation !== 'update' && input.operation !== 'delete') {
      return { ok: true, shouldRunAfterSuccess: false }
    }
    if (!isEntityEnabled(input.resourceKind)) {
      return { ok: true, shouldRunAfterSuccess: false }
    }
    const readers = opts.readers ?? getAllOptimisticLockReaders()
    const reader = readers[input.resourceKind]
    if (!reader) {
      return { ok: true, shouldRunAfterSuccess: false }
    }

    const expectedRaw = readHeader(input.requestHeaders, OPTIMISTIC_LOCK_HEADER_NAME)
    // `T-30` — **branch 5 splits in two here, and that split is the whole fix.** These two requests used to
    // share one answer:
    //   • no token at all  → the client did not ask for a conditional write. Passing is the documented,
    //     additive contract (see this file's docblock, and the test named "strict-additive opt-in").
    //   • a token present but unreadable → the client DID ask for one, and was given an unconditional write
    //     in silence. That client believes it is protected at exactly the moment it is not.
    if (expectedRaw == null) {
      return { ok: true, shouldRunAfterSuccess: false }
    }

    const resolvedExpected = await resolveExpected({
      expectedFromHeader: expectedRaw,
      resourceKind: input.resourceKind,
      resourceId: input.resourceId,
    })
    const expectedIso = resolvedExpected == null ? null : normalizeIsoToken(resolvedExpected)
    if (expectedIso == null) {
      // A token was sent and cannot be turned into an instant — either the resolver produced nothing or the
      // value is not a date. Either way the conditional write the client asked for cannot be performed, so
      // the answer is a refusal that says so, not a silent unconditional write.
      return {
        ok: false,
        status: 400,
        body: {
          error: OPTIMISTIC_LOCK_TOKEN_UNREADABLE_ERROR,
          code: OPTIMISTIC_LOCK_TOKEN_UNREADABLE_CODE,
          header: OPTIMISTIC_LOCK_HEADER_NAME,
          received: expectedRaw,
        },
      }
    }

    const em = opts.getEm()
    const currentRaw = await reader(em, {
      resourceKind: input.resourceKind,
      resourceId: input.resourceId,
      tenantId: input.tenantId,
      organizationId: input.organizationId ?? null,
    })
    if (currentRaw == null) {
      return { ok: true, shouldRunAfterSuccess: false }
    }
    const currentIso = normalizeIsoToken(currentRaw)
    if (currentIso == null) {
      // `T-30` — branch 8, the other silent one. The record's stored value is not a date, so no comparison
      // is possible and the write proceeds. Refusing would break every entity whose timestamp column is a
      // string, which is a schema fact this guard does not own — but the branch stops being invisible.
      logger.warn('Optimistic lock could not compare: the stored value is not a date', {
        resourceKind: input.resourceKind,
        resourceId: input.resourceId,
        operation: input.operation,
      })
      return { ok: true, shouldRunAfterSuccess: false }
    }

    if (currentIso === expectedIso) {
      if (debugEnabled) {
        logger.info('Optimistic lock match', {
          resourceKind: input.resourceKind,
          resourceId: input.resourceId,
          operation: input.operation,
          currentIso,
          expectedIso,
        })
      }
      return { ok: true, shouldRunAfterSuccess: false }
    }

    if (debugEnabled) {
      logger.info('Optimistic lock conflict', {
        resourceKind: input.resourceKind,
        resourceId: input.resourceId,
        operation: input.operation,
        tenantId: input.tenantId,
        organizationId: input.organizationId ?? null,
        expectedRaw: resolvedExpected,
        expectedIso,
        currentRaw,
        currentIso,
      })
    }

    return {
      ok: false,
      status: 409,
      body: buildConflictBody(currentIso, expectedIso),
    }
  }

  async function afterMutationSuccess(_input: CrudMutationGuardAfterSuccessInput): Promise<void> {
    // no-op: optimistic check has no post-success cleanup
  }

  function getConfig(): OptimisticLockConfig {
    return config
  }

  return {
    validateMutation,
    afterMutationSuccess,
    getConfig,
  }
}
