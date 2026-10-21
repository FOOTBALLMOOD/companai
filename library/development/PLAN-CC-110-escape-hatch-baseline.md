# PLAN-CC-110 — the escape-hatch gate: a baseline so it can exist, and a reason that means something

**Status:** BUILT AND CLOSED 2026-10-21. §3 is the requirement, §4.1 the run.
**Row:** `CC-110` in `MASTER-CHECKLIST.md` §5. **Route:** `ROUTE.md` step `W0.3`.
**Measurement:** `node scripts/check-escape-hatches.mjs --json`, run 2026-10-21 (29 s, 203 holes).

---

## 1. What is measured, today

| | |
|---|---|
| **total holes** | **203** (the row said 202 — it moved) |
| unnamed | **169** |
| named | **34** |
| by kind | `eslint-disable` 168 (160 unnamed) · `ts-expect-error` 23 (0 unnamed) · `ts-ignore` 2 (0 unnamed) · `@ts-nocheck` 10 (9 unnamed) |
| block-form / blanket disables among the unnamed | **11** |
| `reportUnusedDisableDirectives` in `eslint.config.mjs` | **absent** (grep count 0) |
| `--fail` exits 1, and **nothing calls it** | confirmed — the npm script is `check:escape-hatches`, CI calls the plain form |

**The row's own diagnosis, and it is the one that matters:** *"Ours is all-or-nothing `:fail` against 169
items, which is why it can never be turned on."* A gate that would fail 169 times on the day it is switched on
is not a gate; it is a build-breaker nobody will merge. **So the first job is not to clear the backlog — it is
to make the backlog pinnable.**

## 2. The three defects, and the harvest

**D1 — there is no baseline, so the gate cannot exist.** The row prescribes the donor's instrument: *exact-line
allowlists … a count lets one hole in for one hole out; an exact-string allowlist pins identity, fails on new
AND on stale, so it can only shrink.* Ours is a count, and an all-or-nothing `:fail`.

**D2 — `-- x` passes as a reason.** `isNamed` for `eslint-disable` is `/--\s*\S/` (`:83`), so any single
non-space character after `--` is a reason. The row: *"the rule id is never required and no TS `<digits>` is
ever demanded."* The donor (`custom_check.py:325`) requires **code AND reason in one regex**, with `' +# +\S'`
closing the empty-reason loophole.

**D3 — the census can be defeated by one comment.** *"'/* eslint-disable -- legacy */' atop a file turns 160
unnamed into 0 while exempting the whole file, and the checker scores it as a single hole."* Measured: **11
block-form disables exist in the unnamed set right now**, so this is not hypothetical — a file-level disable is
already being counted as one hole while it silences the file.

**D4 — a dead disable is free.** The donor sets `reportUnusedDisableDirectives: true`, *"so a DEAD disable
errors and writing a reason on dead code buys nothing."* Ours does not set it.

## 3. The requirement

**R1 — a committed baseline that pins identity.** `scripts/escape-hatches.baseline.json`, one
`{file, line, kind, text}` per hole. In `--fail` mode the checker fails on a hole **not** in the baseline
(new) and on a baseline entry **no longer present** (stale). `--update-baseline` rewrites it deliberately, and
it is a reviewed commit like any other. **The backlog is pinned the day this lands; it shrinks one entry at a
time thereafter, and the gate can be switched on immediately because the pinned state passes.**

**R2 — a reason must be a reason.** `isNamed` requires the reason to contain at least one **alphabetic run of
three or more characters**. `-- x`, `-- ??` and `-- 1` stop passing; `-- legacy` still does. The threshold is
written into the code with the donor's reasoning, so the next person can argue with a number rather than a
vibes.

**R3 — a block-form disable is counted for what it is.** A `/* eslint-disable … */` that is not scoped to the
next line silences the **whole file**, so it is reported as a file-level exemption with its own kind, not as
one line-shaped hole. That closes the census defeat without banning the form.

**R4 — dead disables are reported.** `linterOptions.reportUnusedDisableDirectives` is added to
`eslint.config.mjs`. **If it floods, the number is published and the ratchet is `R1`'s, not this row's** — the
same discipline `CC-101`'s close record states.

## 4. The proof

| # | Test | Asserts |
|---|---|---|
| 1 | the committed baseline, unchanged tree | `--fail` exits 0 |
| 2 | a **new** hole appears | `--fail` exits 1 and names the file and line |
| 3 | a baseline entry is **removed** (the hole was fixed) without updating the baseline | `--fail` exits 1 and names it as stale |
| 4 | `--update-baseline` | rewrites the file, and the next `--fail` passes |
| 5 | `-- x` as a reason | unnamed |
| 6 | a block-form file-level disable | reported as a file-level exemption, not one line |
| 7 | the baseline is regenerated after `R2` | the named/unnamed split moves, and the checker says by how much |

**Mutations, each RED then restored byte-identical:**

| # | Mutation | Must go RED |
|---|---|---|
| M1 | `--fail` ignores holes not in the baseline | 2 |
| M2 | `--fail` ignores stale baseline entries | 3 |
| M3 | `isNamed` back to `/--\s*\S/` | 5 |
| M4 | a block-form disable counted as one line-hole again | 6 |

## 4.1 The run

`4/4 RED, the file restored checksum-verified` (`L187`).

| # | Mutation | Result |
|---|---|---|
| M1 | `--fail` ignores holes not in the baseline | **RED** — 1 failed |
| M2 | `--fail` ignores stale baseline entries | **RED** — 1 failed |
| M3 | `isNamed` back to one character | **RED** — 1 failed |
| M4 | the file-level form counted as a line hole again | **RED** — 5 failed |

**Runs:** the two escape-hatch suites **14 tests** (5 pre-existing, 9 new) · `--fail` exits **0** on the
pinned state — 190 holes, 26 named, 164 unnamed, 10 file-level · the unused-disable report prints **129**
across 98 files.

**★ And the census got SMALLER without a line of product code changing.** The checker was counting its own
docblock examples and its test fixtures’ string literals as holes; `startsComment` now rejects a directive
preceded by a block-comment `*` or a quote, which removed **13 false positives** (203 → 190). Three holes
remain under `scripts/` and all three are real. A census that counts the instrument is not a census.

**★ And the bigger finding, which reframes the rest of the wave:** `reportUnusedDisableDirectives` reports
**129 unused directives** across the 98 files that carry a pinned hole — roughly one dead hole per file. So
the backlog is not 164 holes to name; it is **~129 to delete** and ~35 to name. That is a much smaller job
than the register implied, and it was invisible until the option was turned on.

**★ Four things the build found, three of them mine:** the baseline path was script-relative so a fixture
could not pin its own (the NEW and STALE paths would have been unprovable) · I rendered `entry.line`
instead of `entry.hole.line`, printing `b.ts:undefined` · I compared `text` before `named`, so every act of
progress was filed as STALE and the ratchet could never record an improvement — a hole that gains a reason
necessarily changes its text · and `--update-baseline` wrote to stdout under `--json`, breaking every
caller that pipes it.
## 5. What this does not do

- **It does not clear the 169.** That is 169 separate decisions, each "name it or remove it", and none of them
  is this row's. This row makes them *pinnable* so they can be cleared one at a time without a big-bang PR.
- **It does not refuse whole-directory exclusion** (`custom_check.py:326`) — the row's refusal is kept: 160 of
  the 169 are test-adjacent, so excluding directories would legalise exactly the backlog.
- **`CC-114`** (two-reads, 89 settings) is `W0.4`, not part of this step.
