/**
 * D0 — the generated guard registry must actually DELIVER guards.
 *
 * This is the proof that closes D0. Before the fix, `guards.generated.ts`
 * exported `guardEntries = []` in the running app, because the only modules
 * that shipped a `data/guards.ts` were parked (`customers`, `customer_accounts`)
 * and the example module is off by default. The generator worked; nothing was
 * being delivered.
 *
 * THE POINT OF THIS TEST — it must not be able to pass vacuously:
 *
 *   - It imports the REAL generated file (no `jest.doMock` on guards.generated),
 *     so if the generator stops emitting entries, the assertion fails.
 *   - It pushes the entries through the REAL store the app uses
 *     (`registerMutationGuards` / `getAllMutationGuardInstances`), which is the
 *     same pair `bootstrap/factory.ts` calls — so if the store wiring breaks,
 *     the assertion fails.
 *   - It runs a REAL mutation through `runMutationGuards` for a reserved key and
 *     asserts it is blocked, and for a legitimate key and asserts it is allowed.
 *     A registry that delivers guards but a runner that ignores them fails here.
 *
 * If the generated file has no entries, the whole chain is dead and this test
 * reports it — it does not silently pass on an empty registry.
 */
import { guardEntries } from '@/.mercato/generated/guards.generated'
import {
  registerMutationGuards,
  getAllMutationGuardInstances,
} from '@open-mercato/shared/lib/crud/mutation-guard-store'
import { runMutationGuards, type MutationGuardInput } from '@open-mercato/shared/lib/crud/mutation-guard-registry'

const FIELD_DEFINITION = 'entities.field_definition'

function fieldDefInput(key: string): MutationGuardInput {
  return {
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    userId: 'user-1',
    resourceKind: FIELD_DEFINITION,
    resourceId: 'probe',
    operation: 'create',
    requestMethod: 'POST',
    requestHeaders: new Headers(),
    mutationPayload: { entityId: 'demo:thing', key, kind: 'text' },
  }
}

describe('D0 — generated guard registry delivers guards', () => {
  it('the generated file contains at least one module entry', () => {
    // The raw delivery artefact is non-empty. If a future park or rename empties
    // this again, the test names the defect instead of a runtime mystery.
    expect(guardEntries.length).toBeGreaterThan(0)
    expect(guardEntries.some((entry) => entry.guards.length > 0)).toBe(true)
  })

  it('delivers guards into the live store through the real registration path', () => {
    registerMutationGuards(guardEntries)
    const instances = getAllMutationGuardInstances()

    expect(instances.length).toBeGreaterThan(0)
    // The structural guards must be among them — this is the set the entity
    // definition path will run once D2 routes it through the registry.
    const ids = instances.map((guard) => guard.id)
    expect(ids).toContain('entities.field_definition.no-reserved-key')
    expect(ids).toContain('entities.field_definition.key-shape')
  })

  it('blocks a field definition that claims a reserved system column', async () => {
    registerMutationGuards(guardEntries)
    const result = await runMutationGuards(
      getAllMutationGuardInstances(),
      fieldDefInput('created_at'),
      { userFeatures: [] },
    )

    expect(result.ok).toBe(false)
    expect(result.errorStatus).toBe(422)
    // The reason must say WHY (dictionary standard S3) — not a bare refusal.
    // `runMutationGuards` wraps a guard's `message` into `errorBody.error`
    // when no explicit `body` is supplied.
    expect(String(result.errorBody?.error ?? '')).toContain('system column')
  })

  it('allows a legitimate field key — the guard is not a blanket refusal', async () => {
    registerMutationGuards(guardEntries)
    const result = await runMutationGuards(
      getAllMutationGuardInstances(),
      fieldDefInput('invoice_number'),
      { userFeatures: [] },
    )

    expect(result.ok).toBe(true)
  })

  it('rejects a malformed field key', async () => {
    registerMutationGuards(guardEntries)
    const result = await runMutationGuards(
      getAllMutationGuardInstances(),
      fieldDefInput('Invoice Number'),
      { userFeatures: [] },
    )

    expect(result.ok).toBe(false)
    // The reason must say WHY (dictionary standard S3) — not a bare refusal.
    // It names the rule the key broke, in the words the gate uses; the assertion is on that rule,
    // not on a stale adjective. (`field-definitions.sd1.test.ts:183` matches the same sentence
    // with a looser regex — this one pins it exactly, which is the difference between a test that
    // documents and a test that merely passes.)
    expect(String(result.errorBody?.error ?? '')).toContain('not a readable permission-surface id')
  })
})
