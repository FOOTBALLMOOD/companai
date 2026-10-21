/**
 * Canonical serialisation for the hash-chained ledger (R3, Tier 1).
 *
 * A hash chain is only as trustworthy as the bytes it hashes. If two runs can
 * serialise the same event differently — a reordered key, a `2` where there was
 * a `2.0`, a lost `-0` — verification fails on untampered data, and a ledger
 * that cries wolf is worse than no ledger: people learn to ignore it.
 *
 * So serialisation here is deliberately narrow and total. Every value either has
 * exactly one representation or is rejected outright. Nothing is coerced
 * silently, because a silent coercion is a hash that cannot be reproduced from
 * the original input.
 *
 * This is close to RFC 8785 (JCS) in spirit. It does not claim to be JCS: JCS
 * inherits JavaScript's number formatting, and we reject the ambiguous cases
 * instead of encoding them.
 */

import { createHash } from 'node:crypto'

export class CanonicalizationError extends Error {
  constructor(message: string, public readonly path: string) {
    super(`[internal] ${message} at ${path || '<root>'}`)
    this.name = 'CanonicalizationError'
  }
}

/** Values a ledger event may carry. Anything else is a bug at the call site. */
export type CanonicalValue =
  | string
  | number
  | boolean
  | null
  | CanonicalValue[]
  | { [key: string]: CanonicalValue }

/**
 * Key order for the canonical form: UTF-16 code unit, the same comparison
 * `Array.prototype.sort` uses for strings by default.
 *
 * Spelled out rather than left implicit because the obvious "improvement" —
 * `localeCompare` — would be a serious bug here. Locale collation differs by
 * environment and ICU build, so two servers could serialise the same event
 * differently and each would consider the other's chain broken. The hash needs
 * an order that is fixed everywhere, not one that reads nicely.
 */
function byCodeUnit(left: string, right: string): number {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

function encodeString(value: string): string {
  // JSON.stringify escapes exactly what the JSON grammar requires and is stable
  // across Node versions. Hand-rolling this is how you get a chain that breaks
  // on the first emoji in a resource name.
  return JSON.stringify(value)
}

function encodeNumber(value: number, path: string): string {
  if (!Number.isFinite(value)) {
    // NaN and +/-Infinity have no JSON representation; JSON.stringify turns them
    // into `null`, which would silently hash a different value than the caller
    // passed.
    throw new CanonicalizationError(`Non-finite number ${String(value)}`, path)
  }
  if (Number.isInteger(value)) {
    // `-0` and `0` are the same number but stringify differently. Normalise, so
    // the same event never hashes two ways.
    return String(value === 0 ? 0 : value)
  }
  // A non-integer's shortest round-trip representation is what `String` gives,
  // and it is stable — but it is also the one place where a float could be
  // written differently by a different producer (another language, say). Ledger
  // payloads should carry integers or strings; reject the rest so the constraint
  // is enforced rather than documented.
  throw new CanonicalizationError(
    `Non-integer number ${String(value)} — represent fractional values as strings so every producer agrees on the bytes`,
    path,
  )
}

function encode(value: unknown, path: string): string {
  if (value === null) return 'null'

  const type = typeof value
  if (type === 'string') return encodeString(value as string)
  if (type === 'boolean') return value ? 'true' : 'false'
  if (type === 'number') return encodeNumber(value as number, path)

  if (Array.isArray(value)) {
    // Array order is meaningful and preserved. Callers that want order-insensitive
    // content must sort before passing it in — this cannot decide that for them.
    return `[${value.map((entry, index) => encode(entry, `${path}[${index}]`)).join(',')}]`
  }

  if (type === 'object') {
    const record = value as Record<string, unknown>
    if (Object.getPrototypeOf(record) !== Object.prototype && Object.getPrototypeOf(record) !== null) {
      throw new CanonicalizationError(
        `Unsupported object type ${record.constructor?.name ?? 'unknown'} — convert dates and ids to strings before appending`,
        path,
      )
    }
    const keys = Object.keys(record)
      .filter((key) => record[key] !== undefined) // absent and undefined are the same fact
      .sort(byCodeUnit)
    const parts = keys.map((key) => `${encodeString(key)}:${encode(record[key], path ? `${path}.${key}` : key)}`)
    return `{${parts.join(',')}}`
  }

  throw new CanonicalizationError(`Unsupported value of type ${type}`, path)
}

/**
 * Serialises a value to the one byte sequence the chain agrees on.
 *
 * Keys sorted, no whitespace, `undefined` treated as absent, non-integer numbers
 * and non-plain objects rejected.
 */
export function canonicalize(value: CanonicalValue): string {
  return encode(value, '')
}

/** SHA-256 of the canonical form, lowercase hex. */
export function canonicalDigest(value: CanonicalValue): string {
  return createHash('sha256').update(canonicalize(value), 'utf8').digest('hex')
}

/**
 * Digest of a value the ledger does **not** control the shape of.
 *
 * `canonicalize` is deliberately strict: it rejects floats, dates and class
 * instances so the event envelope has exactly one representation. Snapshots of
 * business records are the opposite — they contain prices, timestamps and
 * whatever an entity happens to hold, and none of that is negotiable.
 *
 * Running a strict canonicaliser over them would throw. Since a ledger append is
 * fail-closed, that throw would roll back the customer's write: the audit
 * mechanism would become the thing that breaks the business. So values of
 * unknown shape get this instead — total, never throwing, and deterministic for
 * the same input:
 *
 * - object keys sorted, `undefined` and functions dropped
 * - `Date` as its ISO string, `BigInt` as decimal digits
 * - non-finite numbers as their names, so they hash rather than vanish
 * - anything else stringified rather than refused
 *
 * The trade-off is explicit: this digest is reproducible by another JavaScript
 * runtime, not necessarily by another language, because it inherits JS number
 * formatting. That is acceptable here — the digest proves a snapshot has not
 * changed, and the party checking that is the platform. The envelope hash, which
 * an outside auditor verifies, uses the strict encoder.
 */
export function digestOpaque(value: unknown): string {
  return createHash('sha256').update(stringifyOpaque(value), 'utf8').digest('hex')
}

function stringifyOpaque(value: unknown, seen: WeakSet<object> = new WeakSet()): string {
  if (value === null || value === undefined) return 'null'

  const type = typeof value
  if (type === 'string') return JSON.stringify(value)
  if (type === 'boolean') return value ? 'true' : 'false'
  if (type === 'bigint') return `"${(value as bigint).toString()}"`
  if (type === 'number') {
    const numeric = value as number
    if (!Number.isFinite(numeric)) return `"${String(numeric)}"`
    return String(numeric === 0 ? 0 : numeric)
  }
  if (type === 'function' || type === 'symbol') return 'null'

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '"Invalid Date"' : JSON.stringify(value.toISOString())
  }

  if (typeof value === 'object') {
    const object = value as object
    if (seen.has(object)) return '"[circular]"'
    seen.add(object)

    if (Array.isArray(value)) {
      return `[${value.map((entry) => stringifyOpaque(entry, seen)).join(',')}]`
    }

    const record = value as Record<string, unknown>
    const keys = Object.keys(record)
      .filter((key) => record[key] !== undefined && typeof record[key] !== 'function')
      .sort(byCodeUnit)
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stringifyOpaque(record[key], seen)}`).join(',')}}`
  }

  return JSON.stringify(String(value))
}

/**
 * The fields a ledger event's hash covers, in the order the chain fixes them.
 *
 * Adding a field here changes every future hash and none of the past ones, which
 * is correct — but it also means an old event can no longer be re-verified with
 * the new code unless the version is recorded. That is what `v` is for: bump it
 * when the covered set changes, **and keep the old branch in the verifier**
 * (`computeLedgerHashV1` below, called by `verifyTenantChain` for version-1 rows).
 *
 * **`T-33` — what version 2 changed, and why the note above had to become true.** `resourceKind` and
 * `resourceId` were written to the row but were **not** covered by this type, so they were the chain's only
 * pointer to the business object and could be rewritten without breaking anything. This docblock used to
 * say *"Every field the event carries is covered"* — which was false, and was the sentence a reviewer read
 * instead of the field list. Version 2 covers them; version 1 did not, and the verifier still has both
 * branches so existing events keep verifying.
 */
export type LedgerEventHashInput = {
  v: number
  tenantId: string
  seq: number
  prevHash: string | null
  ts: string
  eventType: string
  actorKind: string | null
  actorId: string | null
  organizationId: string | null
  correlationId: string | null
  causationId: string | null
  visibility: string
  /** `T-33` — the business object this event is about. Covered from version 2. */
  resourceKind: string | null
  /** `T-33` — the business object this event is about. Covered from version 2. */
  resourceId: string | null
  payload: CanonicalValue
}

/** The version-1 covered set: everything above **except** the two resource fields. */
export type LedgerEventHashInputV1 = Omit<
  LedgerEventHashInput,
  'v' | 'resourceKind' | 'resourceId'
>

export const LEDGER_HASH_VERSION = 2

/**
 * The hash of an event, given its content and its predecessor.
 *
 * Every field the event carries is covered **from version 2**. A field left out of this input is a field an
 * attacker may change without breaking the chain — which is exactly what `resourceKind`/`resourceId` were
 * before `T-33`.
 */
export function computeLedgerHash(input: LedgerEventHashInput): string {
  return canonicalDigest(input as unknown as CanonicalValue)
}

/**
 * `T-33` — the **version-1** hash, kept so existing events keep verifying.
 *
 * The docblock on `LedgerEventHashInput` has always said to bump `v` when the covered set changes *and keep
 * the old branch in the verifier*. There was no old branch, and `verifyTenantChain` refused any row whose
 * version was not the current constant — so adding the resource fields without this function would have
 * reported **every historical event as broken**, which is the one failure an integrity tool cannot afford.
 *
 * **The covered object is built field by field, not by spreading the input.** My first version spread it,
 * which silently hashed whatever extra fields the caller happened to pass — so a v1 hash would have changed
 * with the resource fields, defeating the point of having a version at all. The test
 * *"the version-1 hash is reproducible and differs from version 2"* caught it, which is the only reason it
 * is written that way now.
 */
export function computeLedgerHashV1(input: LedgerEventHashInputV1): string {
  return canonicalDigest({
    v: 1,
    tenantId: input.tenantId,
    seq: input.seq,
    prevHash: input.prevHash,
    ts: input.ts,
    eventType: input.eventType,
    actorKind: input.actorKind,
    actorId: input.actorId,
    organizationId: input.organizationId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    visibility: input.visibility,
    payload: input.payload,
  } as unknown as CanonicalValue)
}
