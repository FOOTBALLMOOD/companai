# PLAN-CC-109 — the one-truth check's SKIP exits 0, its registry is hand-kept, and the doc it guards is not registered

**Status:** BUILT AND CLOSED 2026-10-21. §3 is the requirement, §4 the proof with the run recorded.
**Row:** `CC-109` in `MASTER-CHECKLIST.md` §5. **Route:** `ROUTE.md` step `W0.2` — **now closed**.
**Measurement:** read from source 2026-10-21 at `workspace/starting-kit/scripts/check-one-truth.mjs` (211
lines) and the pin's copies in both repos.
**Files changed:** `scripts/check-one-truth.mjs` (three fixes) · `scripts/__tests__/check-one-truth.test.mjs`
(one rewritten, four added) · `docker/README.md` (the stale value the guard found).

---

## 1. The three defects, measured

**D1 — SKIP exits 0.** `main()` (`:210`) returns `failed.length > 0 ? 1 : 0`, and `failed` counts only
`verdict === 'FAIL'`. A fact with **one** readable representation is `SKIP`, and SKIP **exits 0** — a green.
The docstring at `:29-30` calls silence *"a false green"* and the SKIP report at `:171-176` says *"one copy
is not a one-truth problem, but it is also not a green."* **The report says it is not a green; the exit code
calls it one.** The row prescribes: **SKIP exits 2 unless `--allow-skip`.**

**D2 — the registry is hand-kept.** `FACTS` (`:53`) is an array a human extends. The day somebody adds a
fourth copy of the digest, the check still reads 3/3 and passes. Nothing compares the registry against the
tree. The row prescribes zulip's **residue guard** (~15 lines, `tools/check-feature-level-updated:26`).

**D3 — the one copy a human reads is not registered.** `HERMES-PIN.md` is excluded by a `note` on the
`hermes-pin-digest` fact which says it *"carries TWO different 32-hex digests for the same tree … and never
says which is the pin digest."*

**★ That note is wrong, and it is what keeps the doc unguarded.** Measured: the doc carries **seven**
32-hex values, and it says **exactly** which one is the pin — `:183` *"**The pinned digest — this is the value
the harness enforces:**"* followed by `:186` `07ee857b…`. The other six are the §1 history table, the upstream
git revision, and a superseded comparison. A pattern anchored on the declaration (`^\s*digest\s*:`) picks the
pin and nothing else.

## 2. What the residue guard actually found — and why the row's version of it is wrong

**The row prescribes "fail on any 32-hex hit outside registered paths". Measured, that fails immediately:**
`library/development/` contains 32-hex in `BACKLOG.md`, `BUILD-ORDER.md`, `COMPLETION-CALLBACKS.md`,
`DEPLOY-2026-10-20.md`, `HANDOVER.md`, `MASTER-CHECKLIST.md` and more — **prose quoting hashes for reasons
that have nothing to do with the pin.** A guard that reddens the build for a commit SHA in a changelog is
exactly the control CC-101's close record warns about: *"a control that fires so loudly it gets switched off
is the failure mode this register exists to prevent."*

**So the guard is scoped to the pin's declaration surface, not to every 32-hex in the tree.** And scoping it
found real drift the check cannot see:

> **`docker/README.md:65` declares `ca760e97ff1ef1f0e2ed3deb0dfc2923` as *"The digest the mounted tree must
> produce"*.** Measured against `HERMES-PIN.md:191`: that is the **2026-10-12 pin, superseded** by
> `07ee857b…` in the 2026-10-16 re-pin. **A fourth copy of the fact, unregistered, and stale by one re-pin.**
> The check reads 3/3 and passes, because it has never looked at that file.

**★ That is the whole argument for D2, and it is not hypothetical.** The registry being hand-kept is not a
latent risk here; it has already lost a copy.

## 3. The requirement

**R1 — SKIP exits 2 unless `--allow-skip`.** The exit code must agree with the report.

**R2 — `HERMES-PIN.md` is registered**, with the pattern anchored on its declaration line, and the wrong
`note` is replaced by what the file actually contains.

**R3 — a residue guard scoped to the declaration surface.** Scan the paths where the pin is *declared as a
value* — `docker/hermes/**`, the repo root's `docker-compose*.hermes.yml`, and the docs repo's
`library/.hermes_pin.py` — for a 32-hex that is not in a registered representation, and fail. **Prose is
excluded by scope, not by an ever-growing allowlist, and the reason is written into the script.**

**R4 — `docker/README.md`'s stale value is corrected** to the current pin, because the guard found real drift
and a guard that only reports is D1 again.

## 4. The proof

| # | Test | Asserts |
|---|---|---|
| 1 | a fact with one readable representation | exit **2**, and `--allow-skip` exits 0 |
| 2 | `HERMES-PIN.md` registered | it is read, and its value agrees with the other three |
| 3 | a 32-hex in `docker/` outside the registered paths | the residue guard fails, naming the file |
| 4 | a 32-hex in prose under `library/development/` | **not** a residue failure — the guard is scoped |

**Mutations, each RED then restored byte-identical:**

| # | Mutation | Must go RED |
|---|---|---|
| M1 | SKIP returns to exit 0 | 1 |
| M2 | `HERMES-PIN.md` removed from the registry | 2 |
| M3 | the residue guard's scan narrowed to nothing | 3 |
| M4 | the residue guard widened to the row's literal prescription — any 32-hex anywhere | 4 |

## 4.1 The run

**4/4 RED, the file restored checksum-verified** (`L187`).

| # | Mutation | Result |
|---|---|---|
| M1 | SKIP returns to exit 0 | **RED** — 1 failed |
| M2 | `HERMES-PIN.md`'s registration removed | **RED** — 2 failed |
| M3 | the residue scan narrowed to nothing | **RED** — 1 failed |
| M4 | the guard widened to "any 32-hex anywhere" | **RED** — 1 failed |

**Runs:** `scripts/__tests__/check-one-truth.test.mjs` **8 tests, 0 failures** (3 pre-existing, 5 new or
rewritten) · `node scripts/check-one-truth.mjs` **exit 0**, five copies reading one value, no residue.

**★ And the guard earned itself on its first run.** It found `docker/README.md:65` declaring
`ca760e97…` as *"the digest the mounted tree must produce"* — **the superseded 2026-10-12 pin, stale by one
whole re-pin**, invisible to the one-truth check because nothing had ever read that file. The row's D2 was
not a latent risk; the hand-kept registry had already lost a copy. It is registered now, so the next re-pin
cannot miss it, and the stale value is corrected with a note saying how it got there.

**★ Four things the build found, and three of them are mine.**

1. **My first pattern used `^`, and the checker compiles patterns with `new RegExp(source, 'g')` and no `m`
   flag** (`:199`). `^` would only ever match the start of the file, so the new representation would have read
   NO-MATCH forever — a registered copy that silently contributes nothing, which is worse than not
   registering it. Caught by running the checker, not by reading it.
2. **My first residue scan was `docker/hermes` only**, which would have missed the very file it was built to
   catch — `docker/README.md` is one level up.
3. **My first M4 could not fail.** I widened the scan to `.` and it stayed green, because the fixture's docs
   repo is a *sibling* of the code repo, so a scan of the code tree can never see prose in the docs tree. The
   faithful mutation scans the shared parent (`../..`), and it goes red. **A mutation that cannot fail is
   not a proof** — the third time today.
4. **And an existing test's comment was already right.** `SKIPs loudly when fewer than two copies are
   readable` asserted `status === 0` under the comment *"a SKIP is not a failure — but it is not a green
   either."* The comment stated the rule; the assertion pinned the opposite. Same shape as `T-16`, `T-17`
   and `T-30` — the fourth time this month.

## 5. What this does not do

- **It does not generate the digest.** `verify_pin.py` stays independent of the tree it verifies — generating
  the pin from a sibling makes it agree by construction, which is the exact failure it exists to detect. The
  row's refusal is kept and re-stated.
- **The checker stays read-only.** A tool that edits the tree can silently "fix" drift into agreement.
- **`CC-110` and `CC-114`** are the next two steps in W0, not part of this one.
