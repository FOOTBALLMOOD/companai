# PLAN-T-30 — the optimistic lock is client-opt-in, and a malformed token is silently ignored

**Status:** BUILT AND CLOSED 2026-10-21. §3 is the requirement, §4 the proof with the run recorded.
**Row:** `T-30` in `PREVIEW-AUDIT-TRIAGE.md` §6, carried as `MASTER-CHECKLIST.md` §9.4.
**Slot:** 0, before `CC-121`.
**Measurement:** read from source on 2026-10-21 at `packages/shared/src/lib/crud/optimistic-lock.ts`.
**Files changed:** `optimistic-lock.ts` (the branch split, the stored-value log, the branch map) ·
`optimistic-lock-headers.ts` (two constants) · `__tests__/optimistic-lock.test.ts` (one rewritten,
three added).

---

## 1. The measurement — and the audit is wrong twice

The row says *"optimistic locking is client-opt-in **and the reader fails open** (five early `ok: true`
returns)"*, citing `optimistic-lock.ts:319-347`. There are **eight**, not five:

| # | Branch | Why it passes | Verdict |
|---|---|---|---|
| 1 | `config.mode === 'off'` | the operator turned it off | by design |
| 2 | operation is not `update`/`delete` | nothing to lock on a create | by design |
| 3 | entity is not on the allow-list | the allow-list's whole purpose | by design |
| 4 | **no reader registered for the entity** | *strict-additive opt-in* — an entity that does not register a reader is not locked | **by design, and documented** |
| 5 | **no header** *or* **header unparseable** | the client did not ask | **half by design, half a defect** |
| 6 | `expectedIso == null` | the header is not a date | same branch as 5 |
| 7 | `currentRaw == null` | the record is gone; the CRUD route's 404 should fire | by design, and documented |
| 8 | `currentIso == null` | the stored value is not a date | **silent** |

**Where the audit is wrong, and it matters for the fix:**

- **"the reader-null fail-open is not additive and is not [documented]" — both halves are false.** It is
  additive, and the contract is stated in this file's own docblock (*"strictly additive at runtime: clients
  that do not send the header pass through unchanged"*) **and** pinned by a test whose name says
  *"strict-additive opt-in"*. Reporting a designed, documented, tested contract as a fail-open is how a fix
  gets aimed at the wrong branch.
- **"five early returns" — there are eight.** Two of the eight the audit never names (`currentRaw == null`
  is a deliberate 404-passthrough; `currentIso == null` is genuinely silent).

## 2. The real defect, in one sentence

**Branch 5 merges two different requests into one answer.** A client that sends **no** token did not ask for
a conditional write — passing is correct and documented. A client that sends a token we **cannot parse**
*did* ask for one, and gets an unconditional write anyway, silently. That client believes it is protected at
exactly the moment it is not, and the only trace is a write that succeeded when it should have been refused.

**Why that is worse than it looks.** The 409 path is careful — it compares, it builds a structured conflict
body, it logs. The unparseable path is the one place where the guard's answer and the client's belief
diverge, and it produces no answer at all.

**And the test is complicit:** `it('passes when the client header is malformed (non-ISO)')` asserts the
defect **as intent**. A name that states a bug as a design decision is the reason nobody looked again — the
same shape as `T-16`'s two conflated test names and `T-17`'s empty-list test.

## 3. The requirement

**R1 — a token that is present but unparseable is a refusal (400), not a pass.** The client asked for a
conditional write and cannot be given one; refusing says so. A **absent** token keeps passing unchanged —
that is the documented opt-in and the whole additive contract.

**R2 — a stored value that is present but unparseable is logged** and still passes. Refusing would break
every entity whose `updated_at` column is not a date, which is a schema fact this guard does not own; but
the silent branch becomes findable.

**R3 — the eight branches each carry their reason in the code, and the docblock states the count.** A future
audit then counts eight and can tell the designed passes from the accidental one, instead of reporting both
as fail-opens.

**R4 — the test that asserts the defect as intent is rewritten and renamed.** It asserts the refusal, and its
name says so.

## 4. The proof

| # | Test | Asserts |
|---|---|---|
| 1 | a header with `not-a-date` | 400, and the body says the token is unreadable |
| 2 | **no** header | still passes — the additive contract survives the fix |
| 3 | a reader returning a non-date | passes, and logs |
| 4 | a mismatching token | still 409 (the refusal did not swallow the conflict path) |

**Mutations, each RED then restored byte-identical** (checksums first — `L187`; restore by copy):

| # | Mutation | Must go RED |
|---|---|---|
| M1 | an unparseable token passes again | 1 |
| M2 | an absent token is refused | 2 |
| M3 | the unparseable stored value stops logging | 3 |
| M4 | the refusal answers 409 instead of 400 | 1 |

## 4.1 The run

**4/4 RED, every file restored checksum-verified** (`L187`).

| # | Mutation | Result |
|---|---|---|
| M1 | an unparseable token passes again | **RED** — 1 failed |
| M2 | an absent token is refused | **RED** — 3 failed |
| M3 | the unparseable stored value stops logging | **RED** — 1 failed |
| M4 | the refusal answers 409 instead of 400 | **RED** — 1 failed |

**Runs:** the four lock suites **95 tests** · `tsc --noEmit` on `packages/shared` exit **0** · full shared
**212 suites / 2,627 tests, 0 failures**.

**★ M2 is the one that proves the boundary.** Refusing an absent token breaks **three** tests at once — the
documented opt-in, its allow-list twin, and the additive contract's own case. That is the evidence that the
split between *"did not ask"* and *"asked badly"* is load-bearing rather than cosmetic: without it the fix
would have turned a lenient guard into a mandatory one and 400'd every API consumer that never sent a
token.

## 5. What this does not do

- **It does not make the lock mandatory.** "Client-opt-in" is the design: a client that sends no token gets
  no lock, and that is stated, tested and additive. The row's title calls that a defect; it is a product
  decision, and this row fixes the part that is actually wrong.
- **It does not change `currentRaw == null`** (the 404 passthrough) or `!reader` (the additive opt-in).
- **`T-33`** (the ledger's unhashed resource fields) is untouched.
