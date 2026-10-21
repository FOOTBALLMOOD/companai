# Project memory — Companai / open-mercato

**Rewritten 2026-10-20, shorter on purpose.** The injection truncates this file and cuts the *tail* —
which is the position. History lives in `JOURNAL.md`, the `PLAN-*` files and `LESSONS.md`; this keeps
rules, hazards and where we are.

## RULES (owner)
- **Rule 1: docs are claims, code is the authority. Rule 13: a re-measured number that changed gets its fix committed *by name*.**
- **No code before a written requirement.** Hermes is never forked.
- **DONOR RE-READ on every `SR-*`** — `library/architecture/mapping/00-PIN-AND-METHOD.md` §4.1.
- **CHAIN RULE** — same file §4.2: who CREATES · CHECKS · CONSUMES · DELETES.
- **GLYPHS**: ✅ code fully done; 🟡 partly. **No remote = deployment state. No caller = defect.**
- **STANDING FORMAT**: (1) what is exactly done, (2) its address, (3) what is next — and update the top
  section. Address = `MASTER-CHECKLIST.md` §2 (frontier) and §5/§9.4 (the row).
- **THE FIVE-SLOT SHAPE** (`WORKING-RULES.md` §2.0): what changed · why it matters · how I checked ·
  waiting on you · next. **No identifiers in slots 1–2.**
- **QUESTIONS: the 14-year-old test** — one example, no jargon, ONE per turn; if a default exists, take it.
- **Commits are mine to manage** — both repos, explicit paths, **and push after each slice** (remote
  since 2026-10-20: `main` = docs, `code` = codebase).

## HAZARDS
- Pure LF, no BOM. **Never `git add -A`.**
- **A checker is not a control until something calls it** (`CC-101`). Same for a workflow with no remote (`CC-116`).
- **A repo that has never been packed makes its first push a coin toss** — `git gc --prune=now` first (docs: 313 MB loose → 10.8 MiB).
- **A newline OR an unescaped `|` inside a register row splits the table.** The checker catches both.
- **§4's state cell reads exactly four strings** — `startable now` · `startable, needs a live DB` · `needs you` · `blocked on its trigger`.
- Suites run on **node24** (`workspace/.toolchain/node24/node.exe`). Jest needs the **package** dir and its `jest.config.cjs`.
- **A suite that deletes >50 files in one turn fails to RUN** — `SAFE_DELETE_BULK_CONFIRM_REQUIRED count:59 threshold:50`. Harness, not code. Prove with `CODEBUDDY_SAFE_DELETE_ENABLED=0`. **A suite that fails to load reports no failing tests** (`CC-99`).
- **A row's prescribed FIX can be wrong — re-measure it first** (`CC-123`, `CC-129`, `CC-125`).
- **A mutation whose target text moved reports GREEN** — "DID NOT APPLY" is not a pass; the docs mutation suite now fails on a no-op (`M8`, 2026-10-19).
- **Jest reads a positional suite arg as a REGEX** — escape `\[key\]`; assert the denominator (L21).
- **Python `open(p,'w')` converts the file to CRLF on Windows** (L22). A mock that ignores its `where` proves nothing (L23).
- **`git checkout --` is not a restore while work is uncommitted** — checksum + copy (L187).
- **A test that spells its own input tests a string, not the code** (L186). **The stage before the one you test answers first** (L196).
- **A status line written before the evidence is a false claim** (L194). **A test written against an imagined signature tests the imagination** (L195).
- **`default: false` in an entity decorator does not make the property optional** — `[OptionalProps]` must say so (L185).
- **★ MEMORY IS SPLIT ACROSS TWO TREES AND THIS ONE CAN LAG.** Sessions whose cwd is the WorkBuddy worktree write to `C:\Users\Ramzi\WorkBuddy\Worktrees\companai\master-7662cc8f\.workbuddy-ai\memory\`; the resume recipe and this file live in `Downloads\companai`. On 2026-10-21 this copy was **a day behind** while the worktree held all of that day. **Check both before trusting either**; write to this one.
- **A new file in a scanned directory is a change to that directory's checks.** A measurement script shipped with a bare `.sort()` and turned `explicit-sort-comparators.test.ts` red on the next full run, because only the guard's own suite was run before the commit.
- **`tsc --noEmit` does not type-check test files** — every package's tsconfig excludes `**/__tests__/**`, so "tsc 0" says nothing about a test file. Judge tests by their own run and their mutations.
- **A parser narrower than the source loses rows silently.** Two of the T-07 instrument's own bugs: single-quote-only ids lost 24 of 128 handlers; knowing two export forms reported 40 "no route" instead of 19.

## FRONTIER (2026-10-21)
**The spine:** `PLAN-2026-10-18-one-agent.md`, W1–W8. **Register 90 closed · 64 open · 154 total**;
§4 **20 startable · 1 needs a live DB · 0 need the owner · 43 blocked**. Docs checker PASS (474 table
rows, 14/14 mutations RED); `derive-counts` 78/321.
**★ THE PLATFORM IS AN ARCHITECTURE, NOT A VERTICAL.** A type is a role for agents; chain ceiling → type
→ instance → binding, each a subset above; an agent is always inside a tenant.

**THE AUTHORITY FAMILY IS COMPLETE:** `CC-125` (the floor, code not config) · `CC-128` (the ceiling, a
third input to the resolver) · `CC-134` (the superadmin read, scoped to the foundational tenant) ·
`CC-135` (the ceiling's door + `set-foundation`, the only `invalidateAllCache()` caller) · `CC-136`
(`system:` is a principal kind, in the parser **and** in `derivePrincipal`) · `CC-137` (roles have one
door; the floor's `auth.roles.manage` is finally asked) · `CC-139` (the ceiling's screen + a catalogue
route gated like the ceiling) · `CC-140` (the write refuses a stale view, 409, fingerprint of the set —
**not a lock**).

**★ CI (2026-10-20): the remote exists and the first run found three real defects** — the build
(`CC-141`, fixed+guarded), i18n drift that blocks the whole unit suite (`CC-142`, open), and an
integration probe that 404s so no Playwright test has ever run (`CC-143`, closed — the probe read a route from a **parked** module; it now reads
`/api/auth/profile` and a guard checks module-enabled + file-exists, because one alone passes); i18n closed by
hand-translating 258 strings (`CC-142`), and the checker covers 3 of 5 offered locales — Arabic is 337
keys short (`CC-144`). Coverage guards re-measured after 75 commits (`CC-145`) — and one
of them was a **false red**: a shared `requireFeatures` constant read as ungated.

**★ THE TENANCY RULING (2026-10-21) EMPTIED THE OWNER QUEUE.** One Hermes serves every tenant of one
deployment, deliberately (a deployment is one company, tenants are its branches), and the separation
guarantee is the platform's job while deployment-per-company is the owner's business layer on top. The
four "needs you" rows became work by Rule 13: **`CC-11`** arms the structural guard by default on new
tenants and on a scheduled pass for existing ones · **`CC-51`** team leg has its go-ahead, built on the
existing `StaffTeam` entities · **`CC-65`** `action_logs` retention is **12 months**, configurable per
deployment, the hash-chained ledger **never purged**, the purge itself recorded · **`CC-120`** the
machine read axis is the SET of registry agents bound to the calling credential, consumed by the
transcript route only.

**★ THE CI CHAIN IS FINISHED AND GREEN (2026-10-21):** `CC-148`…`CC-155` closed, run **`39555453111`**
green end to end (15 shards + test/lint/prepare/docker-build). Every fix was forced by the run before
it. `CC-154` (the template's app tests run nowhere: root jest TS5011, the template's own ts-jest
ConfigSet error) and `CC-155` (the example todo command drifted between app and template, no parity
test) are **open and startable**.

**★ `CC-92` SLOT 0 IS COMPLETE (2026-10-21) — all thirteen spine findings built: `T-27`, `T-35`, `T-04`,
`T-05`, `T-06`, `T-07`, `T-08`, `T-15`, `T-16`, `T-17`, `T-28`, `T-30`, `T-33`.**
**★ THE ROUTE IS `library/development/ROUTE.md` — THE ENTRY POINT, AND IT IS CHECKED (2026-10-21).**
`START-PROMPT.md` points at it and at nothing else. `scripts/check-route.mjs` reads its step marker and
fails the build when the marker and the register disagree; `scripts/__tests__/check-route.mutations.mjs`
proves that check can fail (5 mutations, all red); both run in `docs.yml`. **The rule: when the marker and
the register disagree, the register wins and the marker is wrong.** Waves: **W0 the three inert ratchets**
(`CC-109` ✅ closed · `CC-110` 202 holes/169 unnamed · `CC-114` 89 settings read twice) —
`CC-101` already wired 5 checker steps but only 2 as gates, so W0 is "turn reports into gates by shrinking
the number to zero" · **W0b the Business IR gets a Function** — **measured: the IR IS wired
(`business-ir-pack` is in `aiTools`) but a Function is NEVER SAVED — no entity, no registry; the pipeline
ends at "run"** (`CC-13` is the closest row) · **W1 the core** (`CC-119` checks → `CC-121` → `CC-122` →
`SR-02` slice2 + `SR-07` → `SR-13`) · **W2 authority as data** · **W3 tenancy** · **W4 durability** ·
**W5 surfaces: chat → workspaces (does not exist) → automation → widgets** · **W6 Hermes (`P2-9b`)** ·
**W7 ratchets wired**. **One wave at a time; STOP after each; the front-end acceptance test is part of
"done" — the owner will test prompts, saving functions and database changes through the UI.**
**★ `CC-109` CLOSED 2026-10-21 (`53ffdcf5`) — and the guard earned itself on its first run.** SKIP exited 0
(a false green its own docstring warned about); it now exits **2** unless `--allow-skip`. The residue guard —
scoped to the pin's **declaration surface**, NOT the row's literal "any 32-hex outside registered paths",
which fails at once on prose quoting commit SHAs — found **`docker/README.md` declaring the superseded
2026-10-12 pin, stale by one whole re-pin**, because the hand-kept registry had already lost a copy. And
`HERMES-PIN.md` was excluded by a **wrong note** (it said the doc had two digests and never said which was
the pin; it has seven and says exactly which). **Register now 92 closed · 64 open · 156 total.**
**★ Four defects of mine caught only by RUNNING the thing, in one day:** a `^` anchor in a pattern compiled
without the `m` flag (would have read NO-MATCH forever) · a residue scan scoped one directory too narrow,
missing the file it was built to catch · **a mutation that could not fail** (widened to `.` when the fixture's
docs repo is a *sibling*, so the scan could never see it) · and a fixture using `value ?? template` as a
whole-content override, so passing a value wrote a file with no table row. **Run it; do not read it and
believe it.**
**★ `CC-110` CLOSED 2026-10-21 — the escape-hatch gate exists because a BASELINE replaced a COUNT.**
The row’s own diagnosis was the problem: *"all-or-nothing `:fail` against 169 items, which is why it can
never be turned on."* `scripts/escape-hatches.baseline.json` pins every hole by `file:line:kind`; `--fail`
fails on a hole **not** in the baseline (new) and on a baseline entry no longer present (stale), so the count
can only shrink. A hole that gains a reason is PROGRESS and does not fail; one that loses it is a REGRESSION.
**The gate passes on today’s 190 pinned holes (26 named, 164 unnamed, 10 file-level) — that is the point.**
Also: `isNamed` was `/--\s*\S/` so `-- x` was a reason (now needs an alphabetic run of 3+); a file-level
block disable was counted as one line-hole while exempting the whole file (12 of them — now its own kind);
`reportUnusedDisableDirectives` is now set.
**★ TWO NUMBERS THAT CHANGE THE REMAINING WORK: (1) 129 DEAD HOLES** — `reportUnusedDisableDirectives`
reports 129 unused directives across the 98 files with a pinned hole, so the escape-hatch backlog is ~129
**deletions**, not 164 namings. **(2) THE CHECKER WAS COUNTING ITSELF** — its docblock examples and its test
fixtures’ string literals were holes; fixing that took the census 203 → 190 with no product code changed.
**Register now 92 closed · 64 open · 156 total.**
**★ Six defects of mine caught only by RUNNING the thing, across two steps:** a `^` anchor in a pattern
compiled without the `m` flag · a residue scan one directory too narrow · **a mutation that could not fail**
(widened to `.` when the docs repo is a *sibling*) · a fixture using `value ?? template` as a content
override · a baseline path resolved from the script instead of `--root`, so a fixture could not pin its own ·
and comparing `text` before `named`, which filed **every act of progress as STALE**. **Run it; do not read it
and believe it.**

**★ THE LESSON OF THE SLOT — ten of thirteen rows needed the audit's sentence corrected, and the corrections
were never pedantry.** `T-28`: the shape was real, the reachability was not. `T-30`: it reported a
**designed, documented, tested** contract as a fail-open; fixing that branch would have made a safety
mechanism mandatory. `T-33`: it named one defect, and the half it omitted (the hash-version bump) would have
reported **every historical ledger event as broken**. **A row's prescribed FIX can be wrong — measure from
source, every time.** And three of my own defects were caught only by running the mutation: a helper that
spread its input and hashed extra fields, a mutation aimed at dead code, and a test fixture that forged a
hash with the old field set.
**★ `T-07` CLOSED 2026-10-21 (`3b633189`/`9fd67e90`/`80bc4c0`), and the row was wrong in two ways.** The
seven modules are **parked** (only `communication_channels` is enabled and it has no commands), so the
gap was prospective; and the guard meant to catch it carried a **hardcoded parked list** naming six of
them, with a docblock promising un-parking would make it fail, which it cannot. **The guard now checks
every module**, reads the command's own block (not a 400-char window) and both quote styles (24 handlers
use double quotes). **115 commands declare a capability**, 13 have a recorded reason, 6/6 mutations.
**★ And nothing compiled the 115 lines**: `tsc` excludes parked modules and no suite runs them, so they
were verified structurally (bracket counts identical to HEAD) and by two independent parsers.
**★ WHY SLOT 0 BEFORE W1:** `CC-121` re-keys every `principal_id` through a gate that cannot see seven
modules' commands and once accepted a missing identity. **The spine is repaired before it is re-keyed.**

**★ `T-06` CLOSED 2026-10-21 (`6e5da887`/`2879a92`):** the undo record now extends the chain. `markUndone`
appends (it never did), the event carries `historyAction: 'undo'` + `sourceLogId` (an undo whose event
type was the original command id was indistinguishable from the act), it writes on `this.em` not a fork,
and `commandBus.undo` runs inside `runInTransaction`. **Redo was already covered** because it re-executes
through the bus — the asymmetry is what made it a defect. `verifyUndoCoverage` is a **separate answer**
from the hash walk, because a missing event is not a broken link. Proof: 12 tests, 5/5 mutations,
core 663/5,839, shared 211/2,613, tsc 0. **Two things the build caught:** `tsc` found `TS2722` when the
narrowing on `handler.undo` was lost inside the closure (hoisted, not asserted); and
`explicit-sort-comparators` caught a bare `.sort()` in **production** code, one day after catching a
script. **★ And `T-05`'s triage rows were still open a day after it closed** — its close updated the
checklist and journal but not the register it is counted in (L184 again).

**AFTER IT:** `CC-121` (behind `CC-119`, the DB rebuild) → `CC-122` · `CC-138` rides `W3` · `CC-133`
deferred by the owner's trigger. **REMOTE (2026-10-20): `https://github.com/FOOTBALLMOOD/companai`** —
`main` = the docs repo (`821938b`), `code` = the codebase (`a807fda3`); one repo, two unrelated branches,
each with its own workflow naming its branch. The checkers can now be called by a runner; **what is not
yet observed is a green run.**

**DEBTS NAMED:** `ai_agent_types` migration → `CC-119` · per-agent manage routes have no version pinner
(`CC-122`) · a tool requiring `customers.people.view` from a parked module (`CC-132` plan §6) ·
platform-ceiling changes are not hash-chained (tenant-less events are skipped).
