# Start prompt — paste this to the agent that takes over

> **★★ THE ROUTE IS THE ENTRY POINT — read `ROUTE.md` before anything else (2026-10-21).**
> [`ROUTE.md`](ROUTE.md) is the one document that says **what to build next and in what order**, and it is
> the only one that is *checked*: `scripts/check-route.mjs` reads its step marker and fails the build when
> the marker and the register disagree. **You do not choose the next step. The route does.** **★ And if you
> disagree with the route, CHALLENGE it — do not drift around it** (owner, 2026-10-21): write the
> disagreement down with the measurement that produced it, and report back. Quietly working a different step
> is the one behaviour that has cost this project the most. §0 of the route lists what drift has already
> cost. **Then** the `★ ACTIVE TASK` box at the top of [`../../JOURNAL.md`](../../JOURNAL.md) for the step
> in hand. The route names the wave; the box names the step.

> **WHERE THE ACTIVE TASK LIVES (read this first, it is the one live fact).**
> **The task being worked on right now is named in ONE place, and it is not this prompt:** the
> **`★ ACTIVE TASK` box at the top of [`../../JOURNAL.md`](../../JOURNAL.md)**. Open it to see the
> module in hand, its plain-English description, the exact six steps to do it, and the current queue.
> **That box is the single source of truth for "what is being worked on now".** No other document —
> not this prompt, not HANDOVER, not README, not BOOKMARKS, not BACKLOG — may state a live task; they
> all point to the box. (Owner's instruction, 2026-10-06. If you are reading this months later, the
> task will have changed many times — **go to the box**, do not trust this line.)

> **★★ CURRENT STATE — 2026-10-19 (revision 37).** The development pause is **over**. The **build
> frontier is the authority family, and it is complete and closed**: `CC-125` (the machine floor) ·
> `CC-128` (the tenant ceiling) · `CC-134` (the superadmin read, scoped to the foundational tenant) ·
> `CC-135` (the ceiling's route) · `CC-136` (a platform act is a platform act) · `CC-137` (one capability
> means one door) · `CC-139` (the ceiling's screen) · `CC-140` (its write refuses a stale view).
> **Register: 92 closed · 64 open · 156 total**, counted from `MASTER-CHECKLIST.md` §5 by
> `scripts/check-master-checklist.mjs`. **`CC-92` Slot 0 is COMPLETE — all thirteen spine findings are
> built**, so **`CC-121` (the authority re-key) is startable behind `CC-119`** (the database rebuild
> milestone), which is the next row to measure — and the queue behind it is named, with its steps, in the
> **`★ ACTIVE TASK`
> box at the top of [`../../JOURNAL.md`](../../JOURNAL.md)**, which is where you should look next.
> *(The box had gone missing; it was restored on 2026-10-19. If it is missing again, restoring it is the
> fix — this prompt is not allowed to state a task, and that rule is what made its absence a dead end for
> two documents at once.)*
> **★ START WITH THE MASTER CHECKLIST** —
> [`library/development/MASTER-CHECKLIST.md`](MASTER-CHECKLIST.md): the one plain-English index over the
> whole lifecycle — every checklist row, every open item with its trigger, the platform study, and the
> requirements, so you never hunt to learn what a code-name means or where it sits. **It is one file and
> it is the only one:** the old `MASTER-CHECKLIST.html` — a second, hand-synced copy of the same content —
> was retired on 2026-10-17, after its open-work view was measured 25 of 54 rows behind while its headline
> counts stayed right (the headline was computed, the list was typed; two mirrors cannot hold one truth).
> **Every count in it is measured, not typed:** `scripts/check-master-checklist.mjs` checks its tables
> against its own numbers (and has its own 14-mutation proof), and `scripts/derive-counts.mjs` re-derives
> **78 / 321 = 24.3%** from the appendix boxes. **What is open for the owner:** the four long-standing
> decisions in §4 — none of them on the authority path.

**What this file is.** The ready-to-paste first message for the agent that inherits this project and
continues the development. It is short on purpose: it tells the agent what to read, how to set up,
and the rules it may not break — and **nothing about "what is next", because what is next changes
every session.** The live task lives in **one place only: the `★ ACTIVE TASK` section at the top of
[`../../JOURNAL.md`](../../JOURNAL.md)**. This prompt sends the agent there.
*(Last refreshed 2026-10-11 — the reading tiers gained the second live track (**`library/workspace-architecture/`
+ its bridge `04-BRIDGE.md`**, Tier A `j2`), and the "context that shaped the order" block was updated for the
**supplementary core queue** (`NOW = CC-59`, `ALSO NOW = G-22`) and the `B-WS` design track. **The task still
lives only in the box.**)*

**How to use it.** Copy everything between the two `═══` rules below and send it as the first
message of the new session. Nothing else is needed. If the project has moved, change the two paths
at the top first.

**Why it is written this way.** A handover that is read *after* the agent has already formed a
picture is a handover half-wasted. So the prompt's job is to make reading the handover the **first
action**, and to send the agent to the one live task — not to summarise the project, and not to
carry a task list that is stale by the time it is read (owner's instruction, 2026-10-06).

---

═══════════════════════════════════════════════════════════════════════════════════════════

You are taking over an existing project and will continue its development. Everything is at

    C:\Users\Ramzi\Downloads\companai

You know nothing about it yet, and that is expected — it is written down for you.

**1. Read in this order, and do not start work until you have.** There are three tiers. Read tier A
and tier B; open tier C only when the task in front of you touches it — the library holds about twenty
times more imported material than our own writing, and reading it "for context" is exactly how the
direction gets buried.

**Tier A — the ones that fix the direction, the live decisions, and where we actually are:**

    a. library/WHAT-WE-ARE-BUILDING.md        <- the product in plain English. START HERE.
    a2. library/development/MASTER-CHECKLIST.md
                                              <- THE ONE INDEX (owner asked for it 2026-10-16): every
                                                 checklist row, every open item with its trigger, the
                                                 platform study, and the SR requirements -- in plain
                                                 English, with tick-boxes. THIS IS THE ONLY COPY: the
                                                 MASTER-CHECKLIST.html that used to sit beside it was
                                                 retired 2026-10-17 (it drifted -- 25 of 54 open rows
                                                 missing). Its typed counts are re-measured by
                                                 scripts/check-master-checklist.mjs and the 78/321 unit
                                                 count by scripts/derive-counts.mjs. Use it to resolve any
                                                 code-name (CC-nn, G-nn, SR-nn) to what it means and
                                                 where it sits, without hunting across files
    b. INDEX.md                               <- the map of every folder
    c. library/development/HANDOVER.md        <- written for you: what exists, the traps, the rules
    d. library/development/BACKLOG.md         <- what is left, in order. The one plan
    d2. library/development/platform_points.md
                                              <- THE SCOREBOARD (owner's 2026-10-09 ruling): one number
                                                 derived from the ticked boxes, and one plain-English
                                                 list sorted in the vision's Phase 0 -> Phase 10 order.
                                                 Its top box, the "▶ FRONTIER", is the AUTHORITATIVE
                                                 statement of what is being built now (BACKLOG's box
                                                 points here, not the reverse)
    d3. library/development/BUILD-ORDER.md    <- the order the work must be done in (contracts, then
                                                 foundation, then the stack). Phase 0 = the foundation
                                                 completion -- now COMPLETE
    e. library/development/ARCHITECTURE-request-outcomes.md
                                              <- the owner's core features_pack: the three things a
                                                 prompt can become (a one-time answer, a model proposal,
                                                 a saved Function), the triage, and the gate that stops
                                                 the AI reshaping the database on its own (G-21)
    f. compai/planning/00-product-thesis.md   <- what we are building, and the 15 rules never to break
    g. library/development/WORKING-RULES.md   <- the owner's standing rules in one page (incl. rule 10)
    h. library/development/STATE-OF-PLAY-2026-10-07.md
                                              <- where the project really is, and what is next. A DATED
                                                 snapshot (2026-10-07) measured two ways — re-measure it
    i. library/development/RESUME-POINT.md    <- where the last session stopped, and the honest open list
                                                 (a parking space, not a roadmap)
    j. library/development/COMPLETION-CALLBACKS.md
                                              <- EVERY partial build: its gap, its prerequisite, and the
                                                 callback to run when the prerequisite lands (rule 8).
                                                 Read this before you assume "done" means done
    j2. library/workspace-architecture/README.md
                                              <- A **SECOND LIVE TRACK: the workspace-architecture
                                                 workstream (`B-WS`)** -- the design of the dashboard &
                                                 workspace widget architecture (the owner's Message 6).
                                                 **It is DESIGN, never code** (BR-4): its outputs are
                                                 `CC-*` items in the spine, not builds. Read it with its
                                                 **contract**, `library/workspace-architecture/04-BRIDGE.md`
                                                 -- the four rules (BR-1 one live task / BR-2 one
                                                 numbering `B-WS/Bn` / BR-3 every plan item registered /
                                                 BR-4 a design is never a build) that bind it to the
                                                 spine, plus `WORKING-RULES.md` **Rule 16**. **04-BRIDGE.md
                                                 §4 answers *"which document do I trace?"*.** State:
                                                 `B-WS/B1-B-WS/B8` of 10 done, next `B-WS/B9`; then
                                                 WS-1 B-perms / WS-2 B-studio -- **but the live task is
                                                 still whatever the box says (BR-1)**

**Tier B — the spine: how it runs, how the work is done, and the plan:**

    k. library/development/SPECIFICATIONS-DICTIONARY.md   <- THE STANDARD every change is checked
                                                              against (the project's "MVC"). Read before
                                                              any architectural change; S2 + tiers bind
    l. library/development/BUILD-ORDER.md     <- the order: contracts, then foundation, then the stack.
                                                 Phase 0 = the foundation completion (D0-D3 + the
                                                 Metadata Registry) — now COMPLETE
    m. library/development/CORE-BOUNDARY.md   <- what is UNCUSTOMISABLE core vs configurable vs packs
    n. library/development/CORE-MODULES-REGISTER.md  <- what core modules exist and whether they are
                                                 REALLY built (two-route verified)
    o. library/development/BLUEPRINT-GAP-ANALYSIS.md <- what the universal blueprint exposed in our plan
    p. library/development/ARCHITECTURE.md
    q. library/development/ARCHITECTURE-hermes-integration.md    (the B-05 runtime boundary, §11)
    r. library/development/ARCHITECTURE-hermes-service-map.md    <- the per-item service map: how Hermes
                                                 serves or is served by every AI-touching piece
    s. library/development/ARCHITECTURE-model-server-integration.md   (the model-default, §9)
    t. library/development/ARCHITECTURE-structure-permissions.md  <- object × verb × actor grammar (S11/S12)
    u. library/development/SPEC-business-model-kernel.md
    v. workspace/COOKBOOK.md                  <- how the work is done. Read before touching code
    w. LESSONS.md                             <- mistakes already made. **Read before you start, and
                                                 add to it before you finish** — see the binding rule
                                                 below. Every entry is a trap you would otherwise
                                                 walk into
    x. library/development/JOURNEY.md         <- how the project got here, in order. Read it to
                                                 follow the project as if you had been here since day
                                                 one — the arc, the turning points, the reversals.
                                                 (JOURNAL.md is the same story newest-first, with dates.)

**Tier C — open only where the work needs it:** `AGENT-HALF.md` (before any agent-half work),
`THREAD-2026-10-05.md` (why the session decided what it did), `NEEDS-YOU.md` / `BLOCKERS.md`,
the `RUNBOOK-*.md` files (hosting, deployment, domains — **`RUNBOOK-companai-platform.md` is the
Companai app's own deployment at `https://companai.corprorate.com`: what runs where, its accounts,
and how to deploy a new version**), `library/ai/ai-first/` (the vision itself —
read its `README.md` first, the numbers are offset by one), and the study syntheses under
`library/paperclip-value-study/` and `library/paperclip-hermes-study/`.

**Read [`WHAT-WE-ARE-BUILDING.md`](../WHAT-WE-ARE-BUILDING.md) first of all.** It tells you
what we are building (the AI builds a capability once, then it runs with no AI), the loop that makes it
work, the three things a prompt can become, what the platform is *not*, and — most importantly — **which
documents in the library are ours and which are only imported study material.** `HANDOVER.md` then gives
you the detail, and **§2 step 1 lays out these same three tiers**. **In a hurry,
`library/development/BOOKMARKS.md` is the one-page short list.**

**2. Then set up your shell. This is mandatory in every terminal, every session:**

    export PATH="/c/Users/Ramzi/Downloads/companai/workspace/.toolchain/node24:$PATH"

The system Node is 22 and the platform refuses to run on it. Without this export you will get
failures that describe the laptop, not the project.

**The commands you will actually use** (all from `workspace/starting-kit`, after the export above):

    npx tsc --noEmit -p packages/core/tsconfig.json       # typecheck the core package
    npx tsc --noEmit -p packages/shared/tsconfig.json     # typecheck the shared package
    cd packages/core   && npx jest --config jest.config.cjs <path>   # run one core test file
    cd packages/shared && npx jest --config jest.config.cjs <path>   # run one shared test file
    cd packages/core   && npx jest --config jest.config.cjs          # the full core suite

The full `core` suite takes roughly **4–5 minutes**; run it in the background rather than blocking on
it, and read the final `Tests:` / `Test Suites:` lines, not the scroll.

**3. Confirm the state before you trust it.** Run these and read the output:

    cd /c/Users/Ramzi/Downloads/companai && git status --short          # thinking + docs
    cd workspace/starting-kit && git status --short                      # the code
    docker ps                                                            # is the stack up?

There are **two** git repositories, and both should be clean. If a tree is dirty, find out whose
changes they are before you touch anything. **Read the `Status` column, not the line count** — once
`docker ps` showed eight rows while a container had exited and another was unhealthy behind it.

**A live database is available — use it, and do not claim something about the database is unprovable.**
A **Postgres 17** runs in the container `mercato-postgres-local` (database `open-mercato`); measure
against it directly with
`docker exec -i mercato-postgres-local psql -U postgres -d open-mercato` (the connection string is in
`workspace/starting-kit/apps/mercato/.env`). **This is how the 2026-10-08 database defect was settled**
— the index shape and the `ON CONFLICT` behaviour were *measured*, not inferred, and two written
premises were corrected as a result. Work in a throwaway schema and drop it when you are done.

**THE RULES THAT BIND.** Full engineering text is in `workspace/COOKBOOK.md`. **The owner's standing
rules, in one page, are [`library/development/WORKING-RULES.md`](WORKING-RULES.md)** — read it once.
These are the ones that have already cost this project time:

- **Every claim comes with an observation attached, not an argument.** Measure from the artefact,
  never from a description of it. If you are about to say "the cause is X" and you have not watched
  X happen, you are guessing.
- **Reach every important answer by two genuinely different routes**, and make them agree.
  Re-running your own check is not a second route.
- **Bounce every conclusion off a critic whose only job is to prove it wrong.** A review that says
  "looks good" without naming what it tried to break has not done its job.
- **Never `git add -A`.** Stage by explicit path. A wildcard once swept 10,448 unrelated files into
  a commit. Every batch ends with a commit **in both repositories**.
- **`LESSONS.md` binds, both ways.** **Read it before you start** — every entry is a mistake this
  project already made, each with the general form, so you do not repeat it. **And add to it**: when
  you are caught by a mistake that was invisible from the code, append a numbered lesson (the next
  number, with the symptom, the general form, and how it was caught) **in the same change as the
  work** — that file is how the next agent learns from yours. A session that hit a new trap and
  wrote nothing to `LESSONS.md` is not finished.
- **Never write the admin password to a file, and never type it into a login form.** It is the
  owner's, and he types it.
- **Take a checkpoint before anything you could not undo:** `./workspace/scripts/checkpoint.sh <label>`
- **Update the documentation in the same change as the work.** A batch that leaves the docs stale is
  not finished.
- **A decision that is the owner's is not yours to close.** Ask, or leave it explicitly open.
- **Rule zero-zero-one: the dictionary binds.** No architectural change without checking
  `SPECIFICATIONS-DICTIONARY.md`. The permissions question (S2) and the tier question (S4/`S2`/`SD-1` (was “item 17”)) may
  never be skipped. Where a doc and the code disagree, the **disagreement is the defect** — fix it, do
  not pick a side.
- **A module is not "built" because a file exists.** Mark nothing COMPLETE without the **two-route
  check** (read the artefact, and reach the same fact by an independent path). The guard engine proved
  this: it *looked* built and its central registry was **empty** (D0).
- **Do not stack on an unfinished foundation.** Follow `BUILD-ORDER.md`; the foundation gaps close
  first, and the **Active-task box in `JOURNAL.md` names which one is in hand**.
- **If it is ready to be switched on in the front end, switch it on** — once a piece can be *fully*
  functional, wire it up even if the parts that still need work are locked or hidden (**the owner's
  rule, 2026-10-06**; full text in [`WORKING-RULES.md`](WORKING-RULES.md)). The owner tests the
  platform as it is built; a feature nobody can reach is a feature nobody can check.
- **Never grep a *rendered* diff, and never compare bytes across the worktree↔git boundary.** Ask the
  object store for the file (`git show <rev>:<path>`) instead of reading `git show <rev> -- <path>`;
  a rendered diff cannot tell an *added* line from a *context* line, and this line of reasoning has
  produced a false finding more than once. Line endings are normalised on the git side
  (`core.autocrlf=true`), so a byte comparison that spans the boundary is meaningless — compare lines.
- **When a measurement falsifies a premise, correct it *everywhere it was copied*.** A premise written
  into one document gets copied into others; fixing only the one you found leaves the falsehood live.
  (2026-10-08: two forensic premises were corrected this way, and the copies were hunted down by hand.)

**HOW TO TALK TO THE OWNER.** Reply in **English**, always. Plain, everyday words — he is not a
developer, so no jargon. One specific thing at a time, answerable in a word or a sentence. **Do not
ask him to adjudicate technical decisions:** when a problem has an obvious safe default, take it, do
the work, and tell him what changed and how to undo it. Reserve his judgment for what is genuinely
his — a name, a domain, a cost, a preference.

**4. Your task — do not look for a task list in this prompt.** Open
`JOURNAL.md` and read the **`★ ACTIVE TASK`** section at the very top. That is the **one** place that
says what is being worked on now. It also carries the convention you must follow: when the task is
finished, **tick it done and move it down, then post the next one there** — never in this file.

`library/development/BACKLOG.md` is the full list of what is left, and
`library/development/BUILD-ORDER.md` is the order it must be done in; the Active-task box always names
which of them is in hand and why. **A task stated in a handover document other than the Active-task box
is stale by definition** — trust the box, and if you find "what is next" written anywhere else, move it
to the box and delete it where you found it (owner's instruction, 2026-10-06).

**Context that shaped the order** (read it, it is why the order is what it is): the four-item critical
path `spec ✅ → G-01 ✅ → G-02 ✅ → G-03 ✅` is complete; `G-07`, `G-17` and `G-21` are done as recorded
in `BACKLOG.md`. What was first was not a feature but a **defect family**: the platform *looked*
finished in the guard layer and was not. That family's **`D2-gap` sweep is COMPLETE** — every write
route that reached **no guard of any kind** was found and closed (**0 unguarded across the 35 enabled
modules**, 2026-10-07), including a class the scanner could not see (a **GET that writes**).

**The foundation that followed is COMPLETE (2026-10-07), and the build on top of it is well under way.**
The four named guard-engine gaps are built and proven: **`D0`** (the registry is populated and
delivers guards from an enabled module, proven by mutation), **`D1`** (the tier/defaults/fallbacks
settings table exists — rules are no longer `.ts` code alone), **`D3`** (the guard result has a third
outcome, `escalate`, treated as *not performed*), and **`GAP A`'s registry half** — the read-only
**Metadata Registry** (`59ab859`), the service that lets the gate *enumerate* what it is gating. The
first build slice past the foundation, **`SD-1` Phase 1** (the **S2 structure-change gate** — a new data
structure may not be applied until its permissions are decided, by a person or by the default), is built
and mutation-proven across **every create path**, with its remaining paths scheduled in
`COMPLETION-CALLBACKS.md`. **The only guard work left is `D2-wide`** (106 call sites, all in parked
modules — recorded, not migrated), and **`GAP A`'s `Resource` envelope** is a Phase −1 contract,
deliberately unbuilt.

**The order changed on 2026-10-09, and this is the shape you inherit.** The owner ruled: **build order =
the vision's order** — finish the architectural skeleton (vision **Phase 3** policy kernel → **Phase 4**
classification → **Phase 5** enforcement → **Phase 6** audit → **Phase 7** gateway) **before** any
business-module work; and the task list became **one plain-English scoreboard**,
[`platform_points.md`](platform_points.md), sorted in the vision's Phase 0 → Phase 10 order, opening with
**one number derived from the ticked boxes** (never typed). **As of revision 19 of the handover
(2026-10-11): PHASE 3 is COMPLETE** — rows 7, 8, 9, 13, **14 and 15** are ✅; **row 14 is ✅** (its **server**
export leg was CLOSED by `CC-45`, its custom-entity **client `view`** export by `CC-48`, and its
**customer-tasks** alias export by `CC-49` — the export funnel now masks every marked field on all three
paths); and **row 15 is ✅** — its ACL-coverage half (`CC-46`) and its human-CRUD-list half (`CC-47`) are both
closed. **THE PHASE-5 BATCH (rows 16 → 17 → 18) IS COMPLETE, and row 22 is now COMPLETE too.**
**Row 16 (own / team row scope) is 🟡** — its **own-leg** is BUILT (**Option A**, opt-in per entity, `CC-50`
CLOSED); the row stays 🟡 only because its text names *own **and** team* and the **team-leg** is
`CC-51` (deferred by the owner's ruling; **Option B**, a real `team` entity, is documented as a **future
addition** — `PLAN-ROW16-own-team-row-scope.md` §7.2). **Rows 17 (`CC-52`), 18 (`CC-53`) and 22 (`CC-27` core +
`CC-55` narrowing + `CC-56` confirm-path + `CC-57` in-process) are ✅ DONE.** **The named `CC-` queue is now
EXHAUSTED** — the last named leg (`CC-57`) landed 2026-10-11. **So the live task is now a *supplementary* core
queue** ([`PLAN-SUPPLEMENTARY-CORE-QUEUE.md`](PLAN-SUPPLEMENTARY-CORE-QUEUE.md); the owner's 2026-10-11 go-ahead
was *execute it*): **NOW = `CC-59`** (one caller for the **already-built** Business-IR compile+execute chain),
**ALSO NOW = `G-22`**. **A second, *design* track is also live: `B-WS`** (the workspace-architecture workstream),
bound to this spine by the bridge (`04-BRIDGE.md`, Rule 16) — **`B-WS/B1–B-WS/B8` of 10 done, next `B-WS/B9`**.
**A design is never a build (BR-4), so the design track moves no box and does not change the ONE NUMBER.**
**RULE-13 CORRECTION:** the earlier wording here
("the **human CRUD *list* path** has no per-entity permission filter — that last leg is open as `CC-47`") was
**FALSE** — the human CRUD `GET`/list path IS gated by `metadata.GET.requireFeatures`, enforced **403** by the
dispatcher; `CC-47` added `crud-read-gate-coverage.test.ts` so a new list route cannot be added un-gated. **The
live FRONTIER is re-derived from `platform_points.md` (the ONE NUMBER) + the `★ ACTIVE TASK` box — with the
named queue exhausted, the next task is the first startable item of the supplementary core queue.**
**Do not re-derive the order from this prompt** — read the
`★ ACTIVE TASK` box for *what is in hand*, `BUILD-ORDER.md` for the *order*, and `platform_points.md`
for *the one number*. **One trap worth keeping, measured 2026-10-08: `SD-3` (the tier mapping as a
superadmin setting) is ALREADY BUILT (2026-10-06) — several documents still call it "the next slice",
which is stale.** `library/development/BLUEPRINT-GAP-ANALYSIS.md` explains the rest of
the receiving plan, and `CORE-MODULES-REGISTER.md` says honestly which modules are truly built.

**Keep the eye on the prize while you build.** The whole product is one loop: *a need → the AI
understands it → the AI writes a **Business IR** → the platform **validates** it → it **runs** → the
person **confirms** it → it ends as one of **three things** → and a saved Function, from then on, runs
with **zero AI**. The three endings are the owner's core features_pack and they are written up in
`ARCHITECTURE-request-outcomes.md`: a **one-time answer** (nothing saved), a **model proposal** (the
prompt needs new structure — and it only changes the database through the gate, never on the AI's own
initiative), or a **saved Function** (walked to provable correctness, named, grouped). When you build a
feature, ask which part of that loop it serves. **Consult the imported material in the library
(`ai/` except `ai-first/`, `ai/source-docs/`) only when the specific feature in front of you can learn
something from it** — never "for context". Our direction is `ai/ai-first/`, and
`WHAT-WE-ARE-BUILDING.md` explains the split.

**Two things are now decided, and they shape what you build next.** **B-05, the Hermes runtime
boundary:** one product, one repository, one deployment, one interface (ours), with Hermes as a
**supervised private runtime process behind the internal port**, and Hermes **headless**. **The
long-term model default (`ML-1`, was “item 13”): per-tenant policy is the destination, cloud-first is the
interim.** The second turns three pieces of work from *nice* to *required* — the model registry, the
Hermes **agent / persona / profile** mapping, and platform-managed local models — tracked as the
**`ML-`** items in `BACKLOG.md`. Two further owner requirements are recorded in
`library/development/ARCHITECTURE-model-server-integration.md`: the open-source lane must **not
reserve a vendor's settings** (§4.2), and the platform must be able to **choose which local model
runs** (§6.4).

**Items left deliberately undone, each with a named trigger** — read them in `BACKLOG.md` before
planning anything adjacent: a Function's **database row** (trigger: `G-09`, to be built in one
migration with the registry's own row), a verified Function's definition being editable without
invalidating its verification (trigger: the first editing operation), and the Widget registry's
**database row** (trigger: `G-09`).

Work it as a **package** — the standing **rule 10** in
[`WORKING-RULES.md`](WORKING-RULES.md) is the current process, and it supersedes the older narrative
four-step sprint below where they differ. **No code before the requirement is written and the
prerequisites are proven in code.** The six steps of rule 10:

1. **Study the references** for this task.
2. **Pick the relevant points** from `library/development/platform_points.md` that bear on it.
3. **Write the combined requirement** — the task, in one place.
4. **Prove the prerequisites flawless FIRST, in code** — not in a document. Fix them before building on
   top.
5. **Trace the impact** — what else your change can reach — and update the development plans.
6. **Execute under the TOTAL quality protocol** — a hostile critic as a **separate agent**, a
   RED-then-GREEN mutation proof with **md5-verified restores**, a two-route re-measure, a green gate,
   then the docs.

The older four-step sprint (still the right shape for a fresh feature) was: **1 Research** — what
already exists for this, in Hermes, in the Starting Kit, in the `V`-register? **2 Validate** — is this
the best approach, and what would break it? **3 Write the cookbook steps** for this sprint only, in
`workspace/COOKBOOK.md` — the exact commands, the files to touch, and the "done when" test. **4 Build**
it, test it against the running stack, and record it.

**5. Before you finish your turn, tell the owner, in plain English:**

- what you did, and what you measured to prove it;
- what you could not do, and why;
- what needs him specifically, and nothing else.

Every point you raise carries a status: **FIXED** (and how you re-checked) · **WILL DO X** ·
**OPEN — needs you** · **NOT AN ISSUE** (raised, then measured false).

═══════════════════════════════════════════════════════════════════════════════════════════

---

## Maintaining this file

- **If the project moves**, update the two paths at the top — they are the only absolute paths.
- **Never add a task to this file.** The task lives in the `★ ACTIVE TASK` box at the top of
  `JOURNAL.md` (owner's instruction, 2026-10-06). This file sends the agent there and nothing else.
  That is why the reading list and the rules can stay stable while the task changes every session.
- **Keep the reading list current, but keep it task-free.** When a *front-door* document is added,
  renamed or superseded (a new scoreboard, a moved plan), update the tiers — that is maintenance, not a
  task list. The last such maintenance was **2026-10-11** (following the handover's revision 28): **the
  workspace-architecture workstream (`B-WS`) was added to Tier A (`j2`)** — the design of the dashboard &
  workspace widget architecture, bound to the spine by its bridge (`04-BRIDGE.md` + `WORKING-RULES.md`
  **Rule 16**; `B-WS/B1–B-WS/B8` of 10 done, next `B-WS/B9`) — and the "context that shaped the order" block
  was refreshed to name the **supplementary core queue** as the live frontier (`NOW = CC-59`, `ALSO NOW =
  G-22`) now that the named `CC-` queue is exhausted, and to record that **`B-WS` is a *design* track that
  moves no box**. *(Prior maintenance, revision 19: the FRONTIER was rolled to the **PHASE-5 batch — rows 16 →
  17 → 18**, with **row 16 (own/team row scope) 🟡 IN PROGRESS** under **Option A** (owner's `NY-20`); **Option
  B** is documented as a future addition. Also recorded this revision: **rule 9(a) strengthened** (own the
  **full codebase**, not just your diff — two "pre-existing, not mine" findings are now scheduled as
  `N-20`/`N-21`), and a **rule-13 correction** (the CC-47 honest-bound count was `163`/pre-fix and is measured
  at **161**). *(Prior
  maintenance, revision 18: the FRONTIER was
  rolled past **`CC-47`** (the `CC-47` close — the human-CRUD-list read gate is now structurally enforced
  by `crud-read-gate-coverage.test.ts`, so **row 15 is ✅ and PHASE 3 is COMPLETE** on rows 7–9, 13–15), and
  the scoreboard's one number was re-derived (row 15 is a new tick — see `platform_points.md` §L
  `derive-counts`, never typed here). *(Prior
  maintenance, revision 17: the FRONTIER was rolled from `CC-47`/`CC-49` to **`CC-47` only** (the `CC-49`
  close — the customer-tasks export rerouted through the server with an additive alias map, so row 14 is
  now ✅). Prior
  maintenance, revision 16: the FRONTIER was rolled from `CC-47`/`CC-48` to `CC-47`/`CC-49` — the `CC-48`
  close + the customer-tasks alias leak its critic found and two routes reproduced. Prior
  maintenance, revision 15: `platform_points.md`
  and `BUILD-ORDER.md` were promoted into tier A, and the "context that shaped the order" block was
  refreshed for the owner's 2026-10-09 ruling ("the order is the vision's order") and PHASE 3's completion.)*
- **If a new rule costs real time**, add it to the list — but only if it is the kind of mistake that
  is invisible from the code. Everything else belongs in `LESSONS.md`.
- **The standing working rules are also gathered in one place:**
  [`WORKING-RULES.md`](WORKING-RULES.md) — the owner's rules that apply to every session, kept
  beside this prompt so they are not scattered.
