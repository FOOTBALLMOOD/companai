# PLAN — `T-05`: an act is approved once

**Status: CLOSED 2026-10-20 — built, proven, and the build record is §6.**

The audit's sentence was *"the approvals queue can approve the same act twice — read-then-act, no
compare-and-set"* (`PREVIEW-AUDIT-TRIAGE.md` §6, `08 §4`, HIGH, Slot 0). It is correct, and measuring it
found the same shape **three times in one file**, not once.

---

## 1. The defect, measured

`pendingActService.approve` was:

```
findById → if (status !== 'pending') return → bus.execute(...) → status = 'approved' → flush
```

Two approvers — a double-click, two administrators, a retry after a timeout — both read `pending`, both
pass the check, **both run the command**, both write `approved`. The window is not the gap between two
adjacent statements: it is the **execution time of the command**, which is exactly as long as the work
takes. The act's own purpose (an accountable human approves a consequential act) is defeated by an
approval that happens twice.

**The same shape, measured in two more places in the same file:**

| Method | The sequence | What two callers do |
|---|---|---|
| `approve` | read `pending` → execute → write `approved` | run the act twice |
| `reject` | read `pending`/`holding` → write `rejected`/`vetoed` | both report success; the second overwrites the first's note and actor |
| `commitDue` (the A3 sweep) | read `holding` → execute → write `committed` | two overlapping sweeps run it twice — *and a sweep that read `holding` can run an act a veto has just stopped* |

The audit named the first. A fix for only the first would leave two identical holes in the file that
carries the guarantee, which is the *"a half-built control is the defect"* rule this project applies to
dead controls.

## 2. The requirement

**No act's command may run more than once, whatever the concurrency.** And the loser of any race must be
told what happened — *already-approving*, *already-approved* — never silently succeed.

## 3. The design

**One compare-and-set claim, used by both executing paths, and a conditional write for the veto.**

- `claim(tenantId, id, from[], to)` is a single `em.nativeUpdate(AuthorityAct, { id, tenantId, status:
  { $in: from } }, { status: to })`. `nativeUpdate` returns **matched rows**: `1` means this caller owns
  the act, `0` means somebody else moved it first. The condition and the write are one statement, so
  there is no read-then-write to race.
- **`approve`** claims `pending → approving`, then executes, then writes `approved` or `failed`. A caller
  that loses the claim re-reads and returns `already-<status>`.
- **`commitDue`** claims `holding → committing` per act; a lost claim **skips** the act (another sweep or
  a veto got there first) and is not counted.
- **`reject`** does not need a claim — it has no side effect between read and write — so its write is
  itself conditional: `UPDATE … WHERE status IN ('pending','holding')`. `0` rows means the act moved,
  and the caller reports it.
- **The expiry write is conditional too**: two readers who both see an overdue act must not both
  "expire" it.

**Two new states, `approving` and `committing`, because a lock nobody can see is not evidence.** The claim
is recorded in the row: an approval interrupted mid-execution is a fact on record, not an invisible
mutex. `status` is a plain string with a union (`PENDING_ACT_STATUSES`), so the addition is type-safe and
the compiler checked every consumer (`tsc` 0).

**What was deliberately not done, and why:**

- **No `SELECT … FOR UPDATE` around the command.** Holding a row lock for the duration of arbitrary
  business work turns one slow command into a locked queue, and the command bus resolves its own `em`
  from the container — running it inside a transaction would need a container-level change well beyond
  this row.
- **No optimistic-lock column.** A `version` column plus migration buys the same guarantee the CAS
  already gives, at the cost of a schema change and a deploy.
- **No sweeper for stuck claims in this row.** A crash between claim and finalise leaves `approving` /
  `committing` forever. That is **not** a re-run risk — the guarantee holds — but it is a lifecycle gap,
  and it is registered as **`CC-147`** with the fix named (fail claims older than a threshold, on read).

## 4. The proof

- **The race is tested as a race**: `Promise.all` of two `approve` calls started before either can
  finish, asserting **one execution** and exactly one success; the same for two `commitDue` sweeps.
- **The veto test interleaves for real**: an approval is blocked inside its command (a gate promise),
  a rejection is issued while the row says `approving`, and the test asserts the rejection is refused
  **and the row is untouched**.
- **Four mutations**, each RED then restored checksum-identical:
  - **M1** — `claim` always returns `true` → the double-approve test fails (**1**).
  - **M2** — `claim` always returns `false` → 11 tests fail (the guard is load-bearing, not decorative).
  - **M3** — both of `reject`'s protections removed → the veto test fails (**2**).
  - **M4** — the sweep never claims → 4 tests fail.
- **★ The first M3 SURVIVED, and that is the useful part.** The mutation removed the early status check
  but the sed did not match the one-line `WHERE`, so the compare-and-set was still there — and the test
  stayed green. **The survival proved which guard was actually doing the work**: the CAS alone refuses
  the veto, and the early check is a fast path, not the control. A mutation that is not the mutation you
  meant is indistinguishable from a guard that does nothing, so the corrected M3 removed both and went
  RED. Banked as `LESSONS.md` **L198**.
- `tsc --noEmit` on `core`: **exit 0**.

## 5. What this does not do

- It does not make the queue **fast** under contention — it makes it **correct**. The loser pays a
  re-read and gets a sentence.
- It does not resolve the new intermediate states if the process dies (`CC-147`).

## 6. The build record

**Files.** `services/pendingActService.ts` — the `claim` helper, the three call sites, the conditional
expiry and veto writes, and the two new statuses. `services/__tests__/pendingActService.test.ts` — the
fake gained a `nativeUpdate` that models the one property the claim depends on (condition and write in
one statement, matched-row count returned), plus three tests: two approvals racing, a veto against a
claimed approval, two sweeps racing.

**Proof.** `pendingActService` **29/29**; the neighbouring suites (`pendingActService.di`,
`pendingActService.ttl`, `authorityApprovalsPage`) **50/50 across 4 suites**; `tsc` **0**; four
mutations RED with the file restored (sha256 `86fb354e…`). The machine's `errno=1455` memory ceiling hit
the first `tsc` run — the same environment failure `CC-141` recorded — and the retry was clean; that is
an environment fact, not a code result.
