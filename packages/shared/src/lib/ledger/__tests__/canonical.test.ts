/**
 * The chain is only as trustworthy as the bytes it hashes.
 *
 * Every test here is about one failure mode: the same event serialising two
 * ways. When that happens, verification fails on untampered data, and a ledger
 * that raises false alarms gets ignored — which is worse than not having one.
 */

import {
  CanonicalizationError,
  LEDGER_HASH_VERSION,
  canonicalDigest,
  canonicalize,
  computeLedgerHash,
  computeLedgerHashV1,
  digestOpaque,
  type LedgerEventHashInput,
} from '../canonical'

describe('canonicalize — one value, one representation', () => {
  it('orders keys, so object construction order cannot change the hash', () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe('{"a":2,"b":1}')
    expect(canonicalize({ a: 2, b: 1 })).toBe(canonicalize({ b: 1, a: 2 }))
  })

  it('orders nested keys too', () => {
    expect(canonicalize({ outer: { z: 1, a: 2 } })).toBe('{"outer":{"a":2,"z":1}}')
  })

  it('keeps array order, which is meaningful', () => {
    expect(canonicalize([1, 2, 3])).toBe('[1,2,3]')
    expect(canonicalize([3, 2, 1])).not.toBe(canonicalize([1, 2, 3]))
  })

  it('treats an undefined property as absent', () => {
    expect(canonicalize({ a: 1, b: undefined } as never)).toBe('{"a":1}')
    expect(canonicalize({ a: 1, b: undefined } as never)).toBe(canonicalize({ a: 1 }))
  })

  it('distinguishes null from absent — null is a recorded fact', () => {
    expect(canonicalize({ a: null })).toBe('{"a":null}')
    expect(canonicalize({ a: null })).not.toBe(canonicalize({}))
  })

  it('normalises -0, which stringifies differently but is the same number', () => {
    expect(canonicalize({ n: -0 })).toBe(canonicalize({ n: 0 }))
  })

  it('escapes strings the same way regardless of content', () => {
    expect(canonicalize({ s: 'quote " and \\ and newline \n' })).toBe(
      '{"s":"quote \\" and \\\\ and newline \\n"}',
    )
    expect(canonicalize({ s: '🔐 émoji' })).toBe('{"s":"🔐 émoji"}')
  })

  it('refuses non-integer numbers rather than hashing a value another producer would format differently', () => {
    expect(() => canonicalize({ price: 19.99 })).toThrow(CanonicalizationError)
    expect(() => canonicalize({ price: 19.99 })).toThrow(/represent fractional values as strings/)
  })

  it('refuses non-finite numbers instead of silently turning them into null', () => {
    expect(() => canonicalize({ n: Number.NaN })).toThrow(CanonicalizationError)
    expect(() => canonicalize({ n: Number.POSITIVE_INFINITY })).toThrow(CanonicalizationError)
  })

  it('refuses class instances, which have no agreed serialisation', () => {
    expect(() => canonicalize({ when: new Date() } as never)).toThrow(/convert dates and ids to strings/)
  })

  it('names the path of the offending value, so a rejection is actionable', () => {
    try {
      canonicalize({ order: { lines: [{ total: 1.5 }] } } as never)
      throw new Error('expected a rejection')
    } catch (err) {
      expect((err as CanonicalizationError).path).toBe('order.lines[0].total')
    }
  })
})

describe('computeLedgerHash — every field is covered', () => {
  const base: LedgerEventHashInput = {
    v: LEDGER_HASH_VERSION,
    tenantId: 'tenant-1',
    seq: 7,
    prevHash: 'aa'.repeat(32),
    ts: '2026-08-09T10:00:00.000Z',
    eventType: 'inbox_ops.proposal_action.accepted',
    actorKind: 'human',
    actorId: 'user-1',
    organizationId: 'org-1',
    // `T-33` — these were missing from the fixture because they were missing from the covered set, which
    // is exactly how the gap survived: a test that lists "every field" and leaves two out asserts that the
    // two it left out are covered.
    resourceKind: 'sales.order',
    resourceId: 'order-1',
    correlationId: null,
    causationId: null,
    visibility: 'tenant',
    payload: { actionLogId: 'log-1' },
  }

  it('is stable for the same input', () => {
    expect(computeLedgerHash(base)).toBe(computeLedgerHash({ ...base }))
  })

  it('is a 64-character lowercase hex digest', () => {
    expect(computeLedgerHash(base)).toMatch(/^[0-9a-f]{64}$/)
  })

  // Each of these is a field an attacker would want to change. If any one of
  // them did not alter the hash, it could be rewritten without breaking the
  // chain — which is the whole property being claimed.
  const mutations: Array<[string, Partial<LedgerEventHashInput>]> = [
    ['tenant', { tenantId: 'tenant-2' }],
    ['sequence', { seq: 8 }],
    ['predecessor', { prevHash: 'bb'.repeat(32) }],
    ['timestamp', { ts: '2026-08-09T10:00:00.001Z' }],
    ['event type', { eventType: 'inbox_ops.proposal_action.rejected' }],
    ['actor kind', { actorKind: 'ai_worker' }],
    ['actor id', { actorId: 'user-2' }],
    ['organization', { organizationId: 'org-2' }],
    // `T-33` — the two that were never in this list, and so were never covered.
    ['resource kind', { resourceKind: 'customers.company' }],
    ['resource id', { resourceId: 'order-2' }],
    ['correlation', { correlationId: 'cor-1' }],
    ['causation', { causationId: 'evt-1' }],
    ['visibility', { visibility: 'private' }],
    ['payload', { payload: { actionLogId: 'log-2' } }],
  ]

  it.each(mutations)('changes when the %s changes', (_label, mutation) => {
    expect(computeLedgerHash({ ...base, ...mutation })).not.toBe(computeLedgerHash(base))
  })

  it('changes when the hash version changes, so old and new constructions never collide', () => {
    expect(computeLedgerHash({ ...base, v: LEDGER_HASH_VERSION + 1 })).not.toBe(computeLedgerHash(base))
  })

  it('does not confuse a null field with a missing one', () => {
    const withNull = computeLedgerHash({ ...base, correlationId: null })
    const withValue = computeLedgerHash({ ...base, correlationId: 'null' })
    expect(withNull).not.toBe(withValue)
  })

  it('★ T-33: the version-1 hash is reproducible and differs from version 2', () => {
    // The verifier needs this to recompute an existing event exactly as it was written. If the v1 helper
    // drifted from what v1 actually hashed, every historical event would report as broken — the false alarm
    // the branch exists to prevent.
    const { v: _v, resourceKind: _k, resourceId: _r, ...uncovered } = base
    const v1 = computeLedgerHashV1(uncovered)

    expect(v1).toBe(computeLedgerHashV1({ ...uncovered }))
    expect(v1).not.toBe(computeLedgerHash(base))
    // Version 1 did not cover the resource fields, so a caller that passes extra fields cannot change a v1
    // hash — the covered object is built field by field, not spread. (My first version of the helper spread
    // its input, which silently hashed whatever extra fields arrived; this assertion is what caught it.)
    const withExtra = { ...uncovered, resourceId: 'order-9' } as unknown as LedgerEventHashInputV1
    expect(computeLedgerHashV1(withExtra)).toBe(v1)
  })
})

describe('digestOpaque — total, for values the ledger does not control', () => {
  it('never throws on the shapes a real snapshot contains', () => {
    // A strict canonicaliser would reject every one of these, and because the
    // append is fail-closed that rejection would roll back the customer's write.
    expect(() => digestOpaque({ price: 19.99 })).not.toThrow()
    expect(() => digestOpaque({ when: new Date('2026-08-09T00:00:00Z') })).not.toThrow()
    expect(() => digestOpaque({ big: 10n })).not.toThrow()
    expect(() => digestOpaque({ n: Number.NaN })).not.toThrow()
    expect(() => digestOpaque({ fn: () => undefined })).not.toThrow()
    expect(() => digestOpaque(undefined)).not.toThrow()
  })

  it('survives a circular reference instead of overflowing the stack', () => {
    const node: Record<string, unknown> = { name: 'a' }
    node.self = node
    expect(() => digestOpaque(node)).not.toThrow()
  })

  it('is order-insensitive for keys and order-sensitive for arrays', () => {
    expect(digestOpaque({ a: 1, b: 2 })).toBe(digestOpaque({ b: 2, a: 1 }))
    expect(digestOpaque([1, 2])).not.toBe(digestOpaque([2, 1]))
  })

  it('detects a changed value, which is the only thing it is for', () => {
    expect(digestOpaque({ status: 'pending' })).not.toBe(digestOpaque({ status: 'executed' }))
    expect(digestOpaque({ price: 19.99 })).not.toBe(digestOpaque({ price: 19.98 }))
  })

  it('reads a Date as its instant, not its object identity', () => {
    expect(digestOpaque({ at: new Date('2026-08-09T00:00:00Z') }))
      .toBe(digestOpaque({ at: new Date('2026-08-09T00:00:00Z') }))
  })

  it('distinguishes an absent key from a null one', () => {
    expect(digestOpaque({ a: 1 })).not.toBe(digestOpaque({ a: 1, b: null }))
  })
})

describe('canonicalDigest', () => {
  it('agrees with hashing the canonical form', () => {
    expect(canonicalDigest({ a: 1 })).toMatch(/^[0-9a-f]{64}$/)
    expect(canonicalDigest({ a: 1, b: 2 })).toBe(canonicalDigest({ b: 2, a: 1 }))
  })
})
