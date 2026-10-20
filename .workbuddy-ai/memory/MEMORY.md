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

## FRONTIER (2026-10-20)
**The spine:** `PLAN-2026-10-18-one-agent.md`, W1–W8. **Register 83 · 61 · 144.** Docs checker PASS
(36 checks, 14/14 mutations RED); `derive-counts` 78/321.
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

**★ IN HAND — `CC-92` Slot 0: 10 of 13 left, before `CC-121` starts.** Closed: `T-27`, `T-35`, `T-04`.
Remaining, in order: `T-05` (double approve, no compare-and-set) · `T-06` (the record the chain misses) ·
`T-07` (7 modules' commands invisible; 15 have `commands/`, 8 declare a capability) · `T-08` · `T-15` ·
`T-16` · `T-17` · `T-28` · `T-30` · `T-33`. **Measure each from source first** — `T-27`, `T-35` and `T-04`
all needed the audit's sentence corrected. Schedule: `PREVIEW-AUDIT-TRIAGE.md` §6 = checklist §9.4.
**★ WHY SLOT 0 BEFORE W1:** `CC-121` re-keys every `principal_id` through a gate that cannot see seven
modules' commands and once accepted a missing identity. **The spine is repaired before it is re-keyed.**

**AFTER IT:** `CC-121` (behind `CC-119`, the DB rebuild) → `CC-122` · `CC-138` rides `W3` · `CC-133`
deferred by the owner's trigger. **REMOTE (2026-10-20): `https://github.com/FOOTBALLMOOD/companai`** —
`main` = the docs repo (`821938b`), `code` = the codebase (`a807fda3`); one repo, two unrelated branches,
each with its own workflow naming its branch. The checkers can now be called by a runner; **what is not
yet observed is a green run.**

**DEBTS NAMED:** `ai_agent_types` migration → `CC-119` · per-agent manage routes have no version pinner
(`CC-122`) · a tool requiring `customers.people.view` from a parked module (`CC-132` plan §6) ·
platform-ceiling changes are not hash-chained (tenant-less events are skipped).
