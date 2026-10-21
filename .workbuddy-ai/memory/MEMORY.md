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

**★ IN HAND — `CC-92` Slot 0: 8 of 13 left, before `CC-121` starts.** Closed: `T-27`, `T-35`, `T-04`,
`T-05`, `T-06`. **Next by rank: `T-07`**, and it is **measured** (`scripts/measure-t07-command-capabilities.mjs`,
2026-10-21): 128 command handlers with no capability across 7 modules, **109 mappable**, **19 needing a
decision** (9 no route, 7 route declares no feature, 3 route declares two). One cross-module oddity:
`catalog.offers.*` is gated by `sales.channels.manage`, a feature `catalog` does not declare. Then
`T-08`, `T-15`, `T-16`, `T-17`, `T-28`, `T-30`, `T-33`. **Measure each from source first**: `T-27`,
`T-35`, `T-04` and `T-06` all needed the audit's sentence corrected. Schedule:
`PREVIEW-AUDIT-TRIAGE.md` §6 = checklist §9.4.
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
