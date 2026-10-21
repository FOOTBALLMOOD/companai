/**
 * Wire constants for the OSS opt-in optimistic-locking guard.
 *
 * The header name follows the project's extension-header convention
 * (`x-om-ext-<moduleId>-<key>`, see `umes/extension-headers.ts`). The
 * module id used by env opt-in is `optimistic_lock` (snake_case), but
 * the HTTP header itself uses dash-separated `optimistic-lock` because
 * many HTTP intermediaries (nginx, some fetch implementations) strip
 * underscored header names — see RFC 7230 §3.2.6.
 *
 * Spec: .ai/specs/implemented/2026-05-25-oss-optimistic-locking.md §3.2
 */
export const OPTIMISTIC_LOCK_MODULE_ID = 'optimistic_lock'

export const OPTIMISTIC_LOCK_HEADER_NAME = 'x-om-ext-optimistic-lock-expected-updated-at'

export const OPTIMISTIC_LOCK_CONFLICT_CODE = 'optimistic_lock_conflict'

export const OPTIMISTIC_LOCK_CONFLICT_ERROR = 'record_modified'

/**
 * `T-30` — a lock token was **sent** and could not be read.
 *
 * Distinct from `optimistic_lock_conflict` on purpose: a conflict means the client's token was valid and
 * stale (retry with fresh data), while this means the token could not be used at all (fix the client). One
 * code for both would make a broken client look like a race.
 */
export const OPTIMISTIC_LOCK_TOKEN_UNREADABLE_CODE = 'optimistic_lock_token_unreadable'

export const OPTIMISTIC_LOCK_TOKEN_UNREADABLE_ERROR = 'lock_token_unreadable'

export const OPTIMISTIC_LOCK_ENV_VAR = 'OM_OPTIMISTIC_LOCK'

export const OPTIMISTIC_LOCK_DEFAULT_PRIORITY = 50

export type OptimisticLockConflictBody = {
  error: typeof OPTIMISTIC_LOCK_CONFLICT_ERROR
  code: typeof OPTIMISTIC_LOCK_CONFLICT_CODE
  currentUpdatedAt: string
  expectedUpdatedAt: string
}
