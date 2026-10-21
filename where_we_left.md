# Where we left off

**Read this file first.** It is the resume recipe: how to pick this project back up from any
interruption, in six steps. **It is not a status view** — the single source of truth for status is
`library/development/MASTER-CHECKLIST.md` (rule 2: one roadmap, never a second view that competes
with it). Where this file states a position, it states it as a pointer with the live value quoted
once, so a reader is never sent in a circle.

The parts below §0 — the traps, the things that look broken and are not, how to work here — were
written for the 2026-08 pause and are still accurate. They are kept because they are the expensive
knowledge, and a new agent that has not been bitten by them will be.

---

## 0. RESUMING RIGHT NOW — the six steps, in order

### Step 1 — set up

| | |
|---|---|
| Docs repo | `C:/Users/Ramzi/Downloads/companai` — branch **`main`** → remote **`main`**, author `scout` |
| Code repo | `C:/Users/Ramzi/Downloads/companai/workspace/starting-kit` — branch **`main`** → remote **`code`** |
| Remote | `https://github.com/FOOTBALLMOOD/companai` — **one repository, two unrelated branches** (2026-10-20) |
| Node | `C:/Users/Ramzi/Downloads/companai/workspace/.toolchain/node24/node.exe` — **v24.19.0, mandatory** |

**The code repo is a subdirectory of the docs repo but is its own git repository** (the docs
`.gitignore` line 15 excludes `workspace/starting-kit/`). Every command has to be run from the right
one, and a commit belongs in **both**. `git add -A` is banned in both repos — stage explicit paths.
One wildcard add once swept 10,448 of the owner's unrelated files into a commit.

**The remote layout, and why it is two branches.** The two local repositories have unrelated
histories, so they cannot share one branch. `main` carries the documentation repository (it is the
GitHub default, because that is the project's front door) and `code` carries the codebase. Both were
pushed on 2026-10-20; each branch carries its own workflow, and each workflow names the branch it
runs on — `docs.yml` on `main`, `ci.yml` on `code`. A push from either local repository is one
command:

```bash
cd C:/Users/Ramzi/Downloads/companai                    && git push    # main -> origin/main
cd C:/Users/Ramzi/Downloads/companai/workspace/starting-kit && git push    # main -> origin/code
```

The docs branch was renamed `master` → **`main`** on 2026-10-20 so that a plain `git push` works in both
repositories (`push.default=simple` refuses when the local and upstream names differ — it refused the
first push after the remote was added).

**If a push ever dies mid-transfer** (`RPC failed; curl 55 Send failure: Connection was reset`), the
cause here was **18,016 loose objects** — 313 MB on disk, **10.8 MiB** once `git gc` packed them.
Run `git gc --prune=now` first; the settings `http.postBuffer=524288000` and `http.version=HTTP/1.1`
are already set in the docs repository and were part of the fix.

### Step 2 — read the live position

In the **docs repo**, in this order:

1. `.workbuddy-ai/memory/MEMORY.md` — the long-term memory. Its tail holds **LAST DONE** and **NEXT**;
   that is the fastest true statement of where things stand.
2. `.workbuddy-ai/memory/YYYY-MM-DD.md` — the most recent daily log or two. Newest work is at the
   **bottom** of the file.
3. `library/development/MASTER-CHECKLIST.md` **§2** — the canonical "LAST DONE" and "NEXT" lines,
   and §5's register for every open item with its trigger.

**As of 2026-10-21 (night), the position is:** register at **90 closed · 66 open · 156 total**; the
frontier is the agent spine (`PLAN-2026-10-18-one-agent.md`); **`CC-92` Slot 0 is COMPLETE — all thirteen
spine findings are built** (the last, `T-33`, on 2026-10-21), so **`CC-121` (the authority re-key) is
startable behind `CC-119`** (the database rebuild milestone), and `CC-119` is the next row to measure.
Behind it: `CC-122`; `CC-138` rides `W3`; `CC-133` stays deferred by the owner's trigger. **Two rows found
while measuring Slot 0 and startable now:** `CC-156` (three endpoints are authenticated but not authorised,
so any signed-in user may assign labels or edit sales notes) and `CC-157` (six commands nothing can invoke).
**The authority family is complete and closed:** `CC-125` (the
floor), `CC-128` (the ceiling), `CC-134` (the superadmin read), `CC-135` (the ceiling's door), `CC-136` (a
platform act is a platform act), `CC-137` (one capability means one door), `CC-139` (the ceiling's screen),
`CC-140` (its write refuses a stale view). **No row on the authority path is waiting on the owner** — the
tenancy ruling of 2026-10-21 emptied the owner queue for the first time since the register was built.
**`CC-121` does not start until `CC-92` Slot 0 lands** — the remaining 4 findings, because that migration
re-keys every principal through the authority gate (`PREVIEW-AUDIT-TRIAGE.md` §6.2,
`MASTER-CHECKLIST.md` §9.4). **Two live rows are worth knowing before anything else:** `CC-156` (three
endpoints are authenticated but not authorised, so any signed-in user may assign labels or edit sales
notes) and `CC-157` (six commands nothing can invoke). Both are startable now.

**Treat that paragraph as a signpost, not as the answer.** It was last right on the date it names, and
it has been wrong before — on 2026-10-19 it still read `63 · 54 · 117` and named a closed item as next.
Re-read the files; if this paragraph disagrees with `MASTER-CHECKLIST.md` §2, **§2 is right and this is
stale** — and refreshing it is part of closing a batch, not a courtesy.

### Step 3 — VERIFY BEFORE YOU BELIEVE

This step is not optional and skipping it is the single most expensive mistake available here.

- **Docs are claims; the code is the authority.** A green glyph in the register means *the code was
  checked and is fully done for that row*. Confirm it from the source before relying on it.
- **The roadmap has been wrong about what was already done — three times.** Items marked "not
  started" that were finished, and marked urgent on premises that were false. Verify against the
  code before starting any item.
- **Re-measure any number you are about to repeat.** Two wrong figures were found on 2026-10-17 by
  re-measuring numbers inherited from a previous session: an "77/77 tests" that was really 93/93, and
  a mutation count of "2 fail" that was really one test. **An inherited number is a claim with no
  author in the room** (L181 rule 6). `git log --oneline -30` in both repos tells you what actually
  landed.
- **A number can be measured wrongly by your own instrument.** On the same day, two of a proof
  script's own queries were broken — one of them silently reported the opposite of the truth
  (`array_position` returns **NULL** for `int2vector`, so a sort-direction check read `ASC` for both
  columns). Read the raw value, not a derived one. See **L181**.

### Step 4 — get the plan

If the item has a `PLAN-*.md` in `library/development/`, read it before writing code. Each holds the
measured inventory, the requirement, the donor harvest/refuse, the design and the proof plan.

For any `SR-*` item the **donor re-read is mandatory**
(`library/architecture/mapping/00-PIN-AND-METHOD.md` §4.1): read the donor's **source** at the cited
line, never the digest. §4.2 adds the **chain rule** — read who **creates** the thing the control
examines, who **checks** it, who **consumes** the answer, and who **deletes** it (and whether that
invalidates a cache). Most of the defects found in this project were on the creator side of a gate.

### Step 5 — work, proving as you go

```bash
NODE="/c/Users/Ramzi/Downloads/companai/workspace/.toolchain/node24/node.exe"
COREPACK="/c/Users/Ramzi/Downloads/companai/workspace/.toolchain/node24/node_modules/corepack/dist/corepack.js"
```

Run every code command from `workspace/starting-kit/`:

| Task | Command |
|---|---|
| Anything via yarn | `"$NODE" "$COREPACK" yarn <cmd>` — resolves to the pinned 4.17.1 |
| One package's tests | `cd packages/ai-assistant && "$NODE" ../../node_modules/jest/bin/jest.js --config jest.config.cjs` |
| Typecheck a package | `cd packages/ai-assistant && "$NODE" ../../node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` |
| Docs checkers | from the docs root: `node scripts/check-master-checklist.mjs`, `node scripts/derive-counts.mjs`, `node scripts/__tests__/check-master-checklist.mutations.mjs` |

**Three rules about proof, learned the hard way:**

- **Capture an exit code directly** — `cmd > file 2>&1; echo $?`. Never through a pipe. `tail`'s
  status is not the suite's status, and this has produced a false green twice.
- **A suite that fails to load reports zero failures.** "1 failed, 0 total" is a load failure, not a
  pass. Read the suite names before reading the counts.
- **A fake is not a database.** A test suite with a fake passed 24/24 while real PostgreSQL refused
  every write the code made, because the fake had no database to refuse them. When a change is SQL,
  prove it against a real database — Docker is available; check before claiming it is not
  (`docker run -d --name <name> -e POSTGRES_PASSWORD=probe -e POSTGRES_DB=probe postgres:16-alpine`).
  Commit the probe next to the change with its run command, and remove the container afterwards.

### Step 6 — close the batch

- **Commit to both repos**, staging explicit paths.
- **Re-run all three docs checkers** and report them by true exit code. They are the tripwire: a
  typed count that drifts from its table fails the build.
- Update `.workbuddy-ai/memory/` (MEMORY.md pointer + the daily log), `MASTER-CHECKLIST.md` §2, and
  the plan file's progress section.
- **Bank any lesson in `LESSONS.md`** — one line, what happened and what it changed. Then say it in
  the reply. A lesson claimed in chat but not in the file does not exist.

### What is NOT yet proven against a real database

**`CC-119` — the database rebuild milestone.** The migrations for `CC-103` and `CC-102` are proven
only against throwaway containers, never applied to a project-shaped database, and `CC-100` records
that the MikroORM snapshot is stale and consumed. The milestone is defined in the register; do not
start it early, and do not assume the migration chain is sound because the individual SQL was.

---

## 1. What this is, in one paragraph

**Companai** — an operating system where human and AI employees work under one org model, one task
model, and one authority system. **The differentiator is the governance layer, not the AI**: every
act is checked against a ceiling, and the answer is always the *minimum* of everything that applies —
nothing anywhere can raise a gate. That property is the product. It is built and it works.

The codebase is a fork of **Open Mercato 0.6.7**, rebranded to Companai. The governance layer
(authority, approvals, delegations, denials, trust, projects, record locks, the ledger) is ours and
does not exist upstream.

---

## 2. Where things stand

**Read the register.** `library/development/MASTER-CHECKLIST.md` is the single source of truth; its §2
carries the two-line position and its §5 the full register with each open item's trigger. The counts
in it are derived and checker-verified, so they cannot drift from the tables.

The "Starting Kit" milestone language and the item list that used to live in this section moved to
git history when the register was consolidated into one file (2026-10-17) — it is in `JOURNAL.md` if
you need the reasoning, and the checklist rows in `MASTER-CHECKLIST.md` §3 if you need the shape.

---

## 3. What is left

The open work is enumerated in `MASTER-CHECKLIST.md` §4 (all open register rows, grouped by trigger)
and §5 (the full register, every open item with what is unfinished and what would start it). Do not
copy them here; a copy is how the old version of this file went stale.

---

## 4. How to pick the work back up

Everything runs from `workspace/starting-kit/`. Node 24 is mandatory and project-local — every shell
must use the absolute path from §0, or you will get confusing failures. **Postgres** must be running
at `postgres://postgres:postgres@localhost:5432/open-mercato` for anything database-backed; there is
no Redis in this setup.

**Admin login** is `admin@local.test` at `http://localhost:3000/backend`. The owner holds the password
and types it. **Never write it to a file and never type it into a login form** — this was committed to
and honoured throughout; do not quietly relax it.

**Before anything risky:** `./workspace/scripts/checkpoint.sh <label>` backs up the database and
`.env` (not source — git has that).

---

## 5. Traps that will cost you hours

These are the ones that actually bit, not hypotheticals. Full list in `LESSONS.md` (L1–L181); these
are the expensive ones.

**Turbo caches everything, including the things you use to check your work.** `yarn typecheck`
reported clean for 16 of 20 packages *from cache*, hiding a real error for weeks. `yarn build:app` can
be a cache hit serving stale code. **Always read the `Cached:` line before believing a green result.**
Use `--force` for the verification you are about to make a claim about (L38, L45).

**The app serves `packages/*/dist`, and `next start` serves a frozen build.** A source change is
invisible until you rebuild *and* restart. Three separate times this looked like a bug in the code.

**Awilix runs in CLASSIC injection mode.** The constructor parameter *name* is the DI registration
name. `asClass(Foo)` where a parameter is `moduleConfig` but the registration is `moduleConfigService`
injects `undefined` — silently, with nothing going red, and the feature simply does nothing. Use
`asFunction(...).proxy()` and write a test that fails if the wiring is undone (L37).

**A wildcard ACL grant validates a permission that does not exist.** `admin` holds `auth.*`, which
matches `auth.trust.manage` — an invented name — exactly as happily as a real one. So a typo in
`requireFeatures` produces a page that loads, renders and looks correctly gated *when tested as an
administrator*, which is how it will be tested. `require-features-declared.test.ts` now guards this
(L46).

**Jest must be run from inside the package, not from the repo root.** Running
`node ./node_modules/.bin/jest` from `starting-kit/` with the root `jest.config.cjs` fails the suite
with `TS5011: The common source directory of 'tsconfig.json' is ... The 'rootDir' setting must be
explicitly set` — **and reports "1 failed, 0 total", which reads as nothing rather than as a load
failure.** The package config sets `rootDir: '.'`, so the suite loads when run from the package
directory. (2026-10-17, found while proving `CC-102`.)

**`.bin/*` entries are shell scripts and node cannot run them.** `node ./node_modules/.bin/jest`
dies with `SyntaxError: missing ) after argument list` on the shebang line. Call the real entry:
`node ./node_modules/jest/bin/jest.js`. Same for corepack — call
`node_modules/corepack/dist/corepack.js`. (2026-10-17.)

**`array_position()` returns NULL for `int2vector`.** Any catalog query that derives an index key's
sort direction from `indoption` through `array_position` silently yields the `ELSE` branch for every
row. Read the raw value. (2026-10-17, L181.)

**ON CONFLICT cannot infer a partial index's predicate.** `insert ... on conflict (a, b, c)` where
the unique index is partial fails with *"there is no unique or exclusion constraint matching the ON
CONFLICT specification"*. The predicate must be spelled: `on conflict (a, b, c) where org_id is not
null and deleted_at is null`. (2026-10-17, `CC-102`.)

**Reading code tells you what it would do, not which state the system is in.** The empty-dashboard
bug produced three confident wrong diagnoses from reading, and a four-minute diagnostic route answered
it in one request. **If you are about to say "the cause is X" and have not observed X, you are
guessing** (L47).

**The roadmap has been wrong about what is already done — three times.** Items were marked "not
started" that were finished, and marked urgent on premises that were false. **Verify against the code
before starting any item** (L42).

---

## 6. Things that look broken and are not

**The admin dashboard is empty.** Deliberate. All ten of upstream's widgets read sales orders,
customers and deals; those modules are parked, so `apps/mercato/src/modules.ts` disables the widgets
rather than render ten red "Failed to load" panels. The empty state now says so honestly. Fixing this
properly is item 27.

**Fourteen modules are parked, not deleted.** `sales`, `customers` and others are switched off in
`modules.ts`. `customers` in particular is upstream's CRUD reference module and stays readable on
purpose. See `workspace/references/parked-modules.md`.

**The domain is `corprorate.com`.** The spelling is deliberate and owner-confirmed. **Do not "fix"
it.**

**`example` modules exist and are gated behind `OM_ENABLE_EXAMPLES`.** Kept as working reference
code, off by default.

---

## 7. How to work here

Nine standing rules govern this project. They are in `workspace/COOKBOOK.md` in full; this is what
they amount to.

1. **Never assume a decision the owner did not make.** A direction counts only when they were asked
   plainly and answered. If a better way exists, come back with a labelled **COUNTER-OPINION**. When
   the right answer is clear, just do it — consulting too much is its own failure.
2. **One roadmap.** Never a second view that competes with it.
3. **No bandages.** Production and security standards, or it goes on the list.
4. **Fix small risk-free things immediately** — but establish the size *before* deciding, not after.
5. **Checkpoint before risky work.**
6. **Capture know-how in `workspace/knowledge/`** every batch. It becomes the agent's brain.
7. **Found issues go on the roadmap**, in the same edit that discovers them.
8. **Use the waiting time.** While builds run, use the platform in the browser. Find, record, keep
   going — never derail the main task.
9. **Testing instructions are click-by-click**, with verified URLs and expected results. Say plainly
   when a change is invisible.

**Every batch ends with a commit in both repositories.** Stage explicitly — `git add -A` swept
10,448 of the owner's unrelated files into a commit once.

---

## 8. Where everything else lives

| Question | File |
|---|---|
| Where does the project stand? | `library/development/MASTER-CHECKLIST.md` — **the single source of truth** |
| What is the long-term memory? | `.workbuddy-ai/memory/MEMORY.md`, then the daily logs |
| The paste-ready resume prompt | `library/development/RESUME-PROMPT.md` |
| What did we learn the hard way? | `LESSONS.md` (L1–L181) |
| How did we get here? | `JOURNAL.md` (newest first) |
| How does the governance layer work? | `workspace/knowledge/authority-overview.md` — **start here** |
| How does one specific piece work? | `workspace/knowledge/` — 20 files, one per concept |
| What did we already do, and why? | `workspace/references/completed-work.md` |
| What is wrong with the forked platform? | `workspace/references/upstream-issues.md` (U1–U19) |
| What looks or reads badly? | `workspace/references/ux-findings.md` |
| What still shows the original product? | `workspace/references/whitelabel.md` |
| How do I test a change by hand? | `workspace/references/how-to-test.md` |
| How do I deploy it? | `workspace/references/deployment.md` |
| The rules for an `SR-*` build, incl. the donor re-read and the chain rule | `library/architecture/mapping/00-PIN-AND-METHOD.md` §4 |

---

## 9. What not to trust

**`workspace/PROGRESS.md` has three overlapping views of the same work** — a phase-by-phase set of
tables, a section called *"The finish line — a checklist"*, and a newer one called *"The list"*. They
accumulated across sessions and they do not agree with each other. That is a real defect in the
documentation and it is mine.

**`MASTER-CHECKLIST.md` supersedes it for status.** Use PROGRESS.md only for the *reasoning* behind an
individual item.

**First job on return, before any feature work:** collapse PROGRESS.md down to one view, or delete it
and let the register carry the plan. Do not add a fourth checklist to it — that is how it got here.

Two more honest warnings about the record:

- **`upstream-issues.md` headings do not consistently say whether an issue was fixed.** Some say
  FIXED, some do not, and at least one entry with no marker was in fact resolved. Read the body, not
  the heading.
- **The item numbers are not a sequence.** They grew by insertion — 15b, 21b, 21c, 24b — so a gap does
  not mean something is missing.

---

## 10. The single most useful thing to know

Every claim in this project should come with an observation attached, not an argument. The work that
held up was verified by *watching it happen* — loading the page, breaking the test to see it fail,
reading the database, reading the `Cached:` line, running the SQL against a real server. The work that
had to be retracted was reasoned from reading code.

That distinction is the whole difference between the parts of this codebase you can trust and the
parts that wasted a day.
