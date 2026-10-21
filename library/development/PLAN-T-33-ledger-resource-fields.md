# PLAN-T-33 — the ledger's pointer to the business object sits outside the hash

**Status:** BUILT AND CLOSED 2026-10-21. §3 is the requirement, §4 the proof with the run recorded.
**Row:** `T-33` in `PREVIEW-AUDIT-TRIAGE.md` §6, carried as `MASTER-CHECKLIST.md` §9.4.
**Slot:** 0 — **the last one**. `CC-121` is startable now that it is closed.
**Measurement:** read from source on 2026-10-21.
**Files changed:** `packages/shared/src/lib/ledger/canonical.ts` (the two fields, version 2, the v1 helper) ·
`packages/core/src/modules/audit_logs/services/ledgerService.ts` (the append input, the select, the two
verifier branches) · two test files.

---

## 1. The measurement — and there are two defects, not one

**Defect A, the one the audit names.** `LedgerEventHashInput`
(`packages/shared/src/lib/ledger/canonical.ts:204-218`) covers `tenantId`, `seq`, `prevHash`, `ts`,
`eventType`, `actorKind`, `actorId`, `organizationId`, `correlationId`, `causationId`, `visibility`,
`payload`. It does **not** cover `resourceKind` / `resourceId` — which are written to the row
(`ledgerService.ts:161-162`) and are **the chain's only pointer to the business object**. Rewriting them
breaks nothing, so the chain can prove "an event happened" while being unable to prove "about what".

**The file's own docblock states the opposite:** *"Every field the event carries is covered. A field left out
of this input is a field an attacker may change without breaking the chain."* The second sentence is true and
is the defect; the first is false. A guarantee asserted in a comment and not held by the code is worse than no
comment, because it is what a reviewer reads instead of the field list.

**Defect B, which the audit does not name, and which decides the shape of the fix.** The docblock says:

> *"Adding a field here changes every future hash and none of the past ones, which is correct — but it also
> means an old event can no longer be re-verified with the new code unless the version is recorded. That is
> what `v` is for: bump it when the covered set changes, **and keep the old branch in the verifier**."*

**There is no old branch.** `verifyTenantChain` (`ledgerService.ts:251-258`) refuses any row whose
`hash_version` is not the current constant:

```ts
if (row.hash_version !== LEDGER_HASH_VERSION) {
  return { ok: false, …, reason: `Unknown hash version ${row.hash_version}; this build verifies version …` }
}
```

So the mechanism the docblock describes **does not exist**, and a naive fix — add the fields, bump to 2 —
would make **every existing ledger event report as broken**. For a tamper-evidence tool that is the worst
possible failure: a false alarm from an integrity check is the thing nobody believes the second time (the
same lesson already written at `ledgerService.ts:216`).

**★ And the verifier cannot see the fields at all.** Its `select` does not fetch `resource_kind` or
`resource_id`, so even a correct hash comparison could not include them.

## 2. Why this is Slot 0

`CC-121` re-keys every `principal_id`. The ledger is the record of what happened to whom, and its pointer to
the object is currently mutable without detection. Re-keying through a chain that cannot name its own subject
produces a clean answer about a partial system.

## 3. The requirement

**R1 — the two resource fields join the hash, at version 2.** `LedgerEventHashInput` gains `resourceKind` and
`resourceId`; `LEDGER_HASH_VERSION` becomes **2**; the append path passes the values it already writes.

**R2 — the verifier keeps the v1 branch, because the version exists for exactly this.** A row at version 1 is
recomputed with the **v1 covered set** (no resource fields), so every existing event still verifies. Bumping
the version without this branch is not a fix, it is an outage.

**R3 — an unknown version still fails closed.** v3 and above are refused with the same sentence as today.
The old branch must not become a wildcard that accepts anything it does not recognise.

**R4 — the docblock stops asserting a guarantee the code did not hold.** It states what v2 covers, what v1
did not, and that the verifier has both branches.

**R5 — a tampered resource id is a broken chain at version 2.** The proof is a mutation, not a sentence.

## 4. The proof

| # | Test | Asserts |
|---|---|---|
| 1 | a **v2** event whose `resource_id` is rewritten | verification fails, naming the sequence |
| 2 | an **existing v1** event | still verifies — the old branch works |
| 3 | a **v3** event | fails closed with "unknown hash version" |
| 4 | a v2 event with its resource id intact | verifies (the fix did not make every event red) |

**Mutations, each RED then restored byte-identical** (checksums first — `L187`; restore by copy):

| # | Mutation | Must go RED |
|---|---|---|
| M1 | drop the resource fields from the v2 covered set | 1 |
| M2 | remove the v1 branch (the naive bump) | 2 |
| M3 | let the unknown-version branch fall through to v2 | 3 |
| M4 | hash the resource fields but never write them to the row | 1, 4 |

## 4.1 The run

**4/4 RED, every file restored checksum-verified** (`L187`).

| # | Mutation | Result |
|---|---|---|
| M1 | drop the resource fields from the v2 covered set | **RED** — 1 failed |
| M2 | remove the v1 branch (the naive bump) | **RED** — 1 failed |
| M3 | remove the unknown-version gate | **RED** — 2 failed |
| M4 | hash the resource fields as `null` while the row keeps its values | **RED** — 1 failed |

**Runs:** shared **212 suites / 2,630 tests, 0 failures** · `tsc --noEmit` exit **0** for `packages/shared`
and `packages/core`.

**★ Three things the build found, and two of them are mine.**

1. **My own v1 helper spread its input, so it hashed whatever extra fields the caller passed.** A v1 hash
   changed when the resource fields changed — which would have made the old branch produce *different* hashes
   from the ones actually written, i.e. the exact false alarm the branch exists to prevent. The covered
   object is now built field by field, and the test that caught it says so in its name.
2. **A mutation that could not fail, aimed at dead code.** My first M3 widened the *recompute branch*
   (`row.hash_version === 2 || row.hash_version > 2`) and it stayed **green**, because the version **gate**
   above it decides first. The mutation was aimed at a line that cannot be reached with a v3 row. The honest
   mutation removes the gate itself, and it goes red — 2 tests.
3. **An existing test's forged hash broke, and the fixture was the defect.** `detects a re-linked chain`
   rebuilds row 2's hash with the **v1 field set**, so after the version bump row 2 failed its own hash check
   and the break was reported at sequence **2** instead of **3** — a different defect wearing that test's
   name. The fixture now forges with the same covered set the verifier uses, including the two fields.

**★ And the gap the audit did not see, which decided the whole shape.** `LedgerEventHashInput`'s docblock has
always said to bump `v` when the covered set changes **and keep the old branch in the verifier**. There was
no old branch: `verifyTenantChain` refused any row whose version was not the current constant. A fix that
added the fields and bumped the version — the obvious fix, the one the row's own sentence describes — would
have reported **every historical ledger event as broken**. For a tamper-evidence tool, a false alarm is the
worst outcome it has: it is the thing nobody believes the second time.

## 5. What this does not do

- **It does not re-hash existing events.** A v1 row stays v1 and keeps verifying; the chain is not rewritten,
  which is the one thing a ledger must never do.
- **It does not make `verifyTenantChain` scheduled.** The audit's related note — `appendLedgerEvent` and
  `ledger:verify` have no callers, so nothing runs the verification — is `CC-64`'s subject, a different row.
  A verifier that nothing calls is `CC-101`'s class again, and this row does not pretend to close it.
- **It does not touch the undo path's coverage** (`T-06`, closed).
