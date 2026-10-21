# PLAN-T-28 — the PUT command path skips its guard set when the id is not on the parsed input

**Status:** requirement written 2026-10-21. **No code yet.** §3 is the requirement, §4 the proof.
**Row:** `T-28` in `PREVIEW-AUDIT-TRIAGE.md` §6, carried as `MASTER-CHECKLIST.md` §9.4.
**Slot:** 0, before `CC-121` re-keys every `principal_id` through this gate.
**Measurement:** read from source on 2026-10-21 at `packages/shared/src/lib/crud/factory.ts`.

---

## 1. The defect, measured

**Two paths derive the same thing two different ways.**

```ts
// DELETE, command path — factory.ts:2948-2953
const candidateId = normalizeIdentifierValue(
  (input as …)?.id
    ?? (raw.query as …)?.id
    ?? (raw.body as …)?.id
)

// PUT, command path — factory.ts:2571
const candidateId = normalizeIdentifierValue((input as …)?.id)
```

And `candidateId` gates the whole guard set:

```ts
// factory.ts:2601
if (updateAllGuards.length && ctx.auth.tenantId && candidateId) {
```

So a PUT whose id is not on the parsed input runs **no mutation guard and no optimistic-lock check**
before `commandBus.execute`. `updateAllGuards` is `getAllMutationGuardInstances()` plus the legacy bridge,
and the legacy bridge resolves `crudMutationGuardService` — which is `createOptimisticLockGuardService`
(`di/container.ts:203`). **The lock is inside the guard set, so skipping the set skips the lock.**

**Why `input.id` can be absent.** Several enabled routes declare `const rawBodySchema = z.object({}).passthrough()`
(`auth/api/roles`, `auth/api/users`, `catalog/api/{categories,offers,option-schemas,price-kinds,prices,…}`),
so the schema passes anything through and nothing is required — including `id`.

## 2. What the audit says, and where it overstates

The audit: *"Two concurrent tab-saves both succeed."* **That is true of a route shaped this way, and I could
not show that an enabled route is shaped this way today.** Every command-update route I checked takes its id
in the **body** (`mapInput` returns `parsed`, and the collection route's body carries `id`), so `input.id`
is populated and the guards run.

**So the honest severity is: the shape is real, reachable by the next route, and not currently demonstrated
on a live one.** That is `CC-101`'s class exactly — *a control that is not called is not a control* — and it
is why the fix is not "close a live hole" but "stop the hole from being openable silently".

**The stronger reason to fix it here anyway:** `candidateId` also feeds `baseMetadata.resourceId` and every
sync event's `resourceId` (`:2637`, `:2585`, `:2680`). A PUT that silently loses its id loses its audit
address too, and `T-33` is about the ledger naming what was touched.

## 3. The requirement

**R1 — the PUT path derives the candidate id the way DELETE already does.** `input.id ?? query.id ?? body.id`.
One rule for both verbs, so the asymmetry cannot come back by accident.

**R2 — a skipped guard set is no longer silent.** When guards are registered and the request is
authenticated but no candidate id can be derived, the factory **logs** that the update ran unguarded, naming
the command and the method. The guards still do not run — a guard that needs a record id cannot be run
meaningfully without one — but the limitation becomes observable instead of invisible. **This is the part
that stops the next route from opening the hole quietly.**

**R3 — the log does not fire on the normal path.** A PUT that carries its id logs nothing, so the signal
means what it says.

**R4 — no behaviour change for a PUT with no id anywhere.** It still executes, as today; only the log is new.

## 4. The proof

| # | Test | Asserts |
|---|---|---|
| 1 | a PUT with the id **only in the query string**, an escalating guard registered for `update` | the guard holds the write (202), and the guard saw that id |
| 2 | a PUT with the id **only in the body** | the guard still runs (the fallback did not break the normal shape) |
| 3 | a PUT with **no id anywhere** | it executes, and the skip is logged |
| 4 | a PUT with an id | no skip log |

**Mutations, each RED then restored byte-identical** (checksums first — `L187`; restore by copy):

| # | Mutation | Result |
|---|---|---|
| M1 | drop the query fallback (the row's own defect) | **RED** — 1 failed |
| M2 | derive the id from the query **only**, dropping `input` and the body | **RED** — 2 failed |
| M3 | silence the skip log | **RED** — 1 failed |
| M4 | log the skip **unconditionally**, so the signal fires on a normal PUT too | **RED** — 3 failed |

**Runs:** the factory suite **37 tests** (33 pre-existing + 4 new) · `tsc --noEmit` on `packages/shared`
exit **0** · full shared **212 suites / 2,624 tests, 0 failures** (with the harness's delete guard off, per
`CC-19`). *(Rule 13: this paragraph first said 210 / 2,613, which was the count from two days earlier —
re-measured, and the fix is by name.)*

**★ One measurement that changed the fix's shape, not just its wording.** My first M2 was *"drop the body
fallback"*, which **stayed green** — because `input` is derived from the body, so removing the third term
changes nothing a test can see. The honest mutation is *"derive from the query only"*, which drops the two
terms that actually carry the value. A mutation that cannot fail is not a proof, and this one could not.

## 5. What this does not do

- **It does not run guards without an id.** `resourceId` is what a guard reasons about; inventing one would
  be worse than skipping. The row's own fix sentence does not ask for it either.
- **It does not change the non-command PUT path**, which derives its id through `updateConfig.getId` — a
  different mechanism with its own contract, and not what this row measured.
- **It does not fix `T-33`** (the ledger's unhashed resource fields) even though R1 improves the value that
  reaches them.
