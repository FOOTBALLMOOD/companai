# Journal

**What happened, in order, and why.** Newest first.

For *what to avoid*, read [`LESSONS.md`](LESSONS.md). For *where things are*,
read [`INDEX.md`](INDEX.md). This file answers **"how did we get here?"**

---

## ★ ACTIVE TASK — the one place that says what is being worked on now

**Read this box first. Nothing else may state a live task** — `HANDOVER.md`, `START-PROMPT.md`,
`BOOKMARKS.md`, `BACKLOG.md` and `README` all point here. If any of them seems to disagree with this
box, **the box wins** (owner's instruction, 2026-10-06).

> **★ THE BOX WENT MISSING AND IS RESTORED 2026-10-19.** It was the only pointer `HANDOVER.md` and
> `START-PROMPT.md` gave a newcomer, and neither document was allowed to state a task itself — so for
> however long it was absent, the two files a fresh agent is told to read first both sent it to a
> section that did not exist. If you are reading this and the box is gone again, **that is the defect,
> not a change of policy**: restore it here rather than adding a task line to one of the pointing files.

**IN HAND — `CC-92` Slot 0: 9 spine findings left, before `CC-121` starts.** The ceiling work is finished
as a unit — screen, token, refusal — and four Slot 0 findings are closed: **`T-27`** (the tenant-scope
helper that accepted a foreign tenant whenever the auth object was absent, silently), **`T-35`** (the
sandbox that advertised an api-call cap it did not enforce), **`T-04`** (a Function that asked for a
count and was answered with rows, verified green) and **`T-05`** (the queue that could approve one act
twice). **9 remain:** `T-06`, `T-07`, `T-08`,
`T-15`, `T-16`, `T-17`, `T-28`, `T-30`, `T-33`. `CC-121` re-keys every `principal_id` through the authority
gate, and that gate cannot yet see **seven modules' commands** (`T-07`) or refuse a missing identity. **The
spine is repaired before it is re-keyed:** a migration through a gate with holes produces a clean answer
about a partial system. The findings and their slots are `PREVIEW-AUDIT-TRIAGE.md` §6, carried in the
checklist as §9.4.

**The steps, in order:**

1. Read §9.4 / `PREVIEW-AUDIT-TRIAGE.md` §6 — each Slot 0 finding is numbered there, with what it measured
   and which gate it rides. They are the queue.
2. Each is a normal row: **measure it from source first** — the audit's wording is a claim, and both
   `T-27` and `T-35` needed corrections (`C-08`, `C-09`; and `T-35`'s own sentence understated where the
   protection actually was) — then write the requirement, build, prove with a mutation, close.
3. `CC-121` after the slot, behind `CC-119` (the database rebuild milestone). `CC-138` rides `W3`.

**THE QUEUE AFTER IT** — and the order is fixed, not a list:

1. **`W3`** — then `CC-138` (no route declares *human-only* / *machine-only*) rides it.
2. **`CC-121`** — behind `CC-119` (the database rebuild milestone), then **`CC-122`**.
3. **`CC-133`** — the platform above its tenants (option B). Deferred by the owner's trigger, not dropped.

**THE POSITION, MEASURED — 2026-10-21 (after `CC-153`):** register **90 closed · 62 open · 152
total**; §4's open rows **15 startable · 1 needs a live database · 4 need the owner · 42 blocked on a
trigger**.
`MASTER-CHECKLIST.md` §2 is the canonical last-done/next line and §5 is the register;
`where_we_left.md` §0 is the six-step resume recipe. **The authority family is complete and closed:**
`CC-125` (the floor) · `CC-128` (the ceiling) · `CC-134` (the superadmin read) · `CC-135` (the ceiling's
door) · `CC-136` (a platform act is a platform act) · `CC-137` (one capability means one door) ·
`CC-139` (the ceiling's screen) · `CC-140` (its write refuses a stale view). **No row on the authority
path is waiting on the owner.**

---

## 2026-10-21 — `CC-153`: the run that confirmed `CC-152` found four real defects, and none was a test

**The flag worked. That is how the module's own defects finally became visible.** Run `39504503223` —
the run for `CC-152`'s fix commit — came back **11 of 15 shards green**: the 404s were gone, and every
spec that had failed on a missing page passed. The 4 red shards carried **8 failures, and every one was
a defect the example module always had**, which CI could never see because the module had never run.
This is the pattern the register keeps meeting: **the fix that makes a thing run also makes it fail.**

**① The description on the one page every locale shares was frozen in English.** `layout.tsx` exported
a *static* `metadata` object. A static export is evaluated once, at build time, with no request
context — so `meta[name="description"]` carried the English text into every locale. `TC-APP-001`'s
German run asserted the de string and got English. `generateMetadata()` runs per request, after
`detectLocale()`, and reads the same dictionary the `html lang` attribute already resolves per
request; the Companai line now lives in `en.json`. **The critic pass over that fix found its own
dormant copy:** `resolveLocalizedAppMetadata`'s `t()` fallback still carried upstream's positioning —
nothing calls the helper, but the fallback fires when a locale's dictionary misses the key, so the
next caller would have shipped the exact description we had just removed (`0136e043`). **② Two committed bins had no execute bit.** Linux
refuses to spawn a `100644` bin, so `umes:list/inspect/check` exited 1 with **empty stdout and
stderr** — a status-null `spawnSync` — which reads like a crash. It was a permission bit, and
**Windows ignores the bit, so only the git index could answer**: `update-index --chmod=+x`, blob shas
unchanged, and a guard that asks `git ls-files -s` (`CC-146`'s rule, third place). **③ `TC-UMES-020`
needs routes that cannot exist.** The payment demo reads `payment_gateways` — parked by owner decision,
"an operating system, not an ERP" — so its pages and session API are generated for no configuration.
The spec now **declares** the dependency (`CC-151`'s fix), and discovery excludes it until the module
is un-parked. **④ The todo command validated nothing.** The CRUD form enforced `priority <= 5` on blur;
**the command — where every write funnels — enforced nothing**, so an API write stored 8. The rule was
declared in `ce.ts` all along; the create and update commands now read it, for the keys the caller
actually sent.

**Proof, two routes each.** Metadata: layout suite **5/5**, and restoring the static export goes
**3 RED** (sha256-identical restore). Exec bit: guard **5/5**, and the index read directly. Parked
dependency: discovery on the real repo **33 → 32 specs**, `TC-UMES-020` gone from both trees while its
`.spec.ts` still sits on disk, **0 real specs** with the flag unset, suite **10/10**. Validation:
**5 cases** (reject 8 with the declared 400 and no entity write · accept 5 · accept the sync shape ·
the update half of each), the pre-existing fixture that had asserted the **old defective behaviour**
amended, module **13 suites / 60 tests** with the sync bridge green, **two mutations RED individually**
(create-path call removed · update-path call removed).

**★ OBSERVATION TAKEN 2026-10-21 (run `39549013082`, both fix commits aboard; the run for the first
commit, `39548126543`, was cancelled by the follow-up push): all 15 shards success** — the four that
were red are green: de metadata, `umes:*` exit 0, `TC-UMES-020` excluded rather than failed, priority
400. The first green run since this chain began (`39357327101` → `39363070729` → `39418460891` →
`39429422803` → `39504503223` → cancelled → green). And a residual, recorded rather than hidden: `de`/`pl`/`es` still carry upstream's positioning at
`app.metadata.description` while `en` carries the Companai line — rewording them is a hand-translation
decision (`CC-142`'s rule), and `TC-APP-001` pins the German string, so the spec changes with it.
A second orphan, recorded not rewritten: the `app.page.subtitle` key carries upstream positioning in
all four catalogs of both trees and renders nowhere — the usage checker already counts it as unused.

---

## 2026-10-20 (night) — `CC-152`: discovery read a guard it could not see, and the flag was off

**The `CC-150`/`CC-151` fix commit's own CI run went red again — 7 of 15 shards, 56 failed tests — and
every failing test was an example-module spec failing on a 404.** The Playwright error-context snapshots
downloaded from the run say it plainly: `heading "404" — This page could not be found.` at
`/backend/mutation-lifecycle`, and `toHaveTitle … Received: "404: This page could not be found."` at
`/backend/example`. Of the 13 specs that ran, 10 files failed; the 3 that passed (`TC-CLI-001`,
`TC-UMES-010`, `TC-UMES-013`) never touch the module's pages or routes.

**The mechanism is a switch, not a folder.** `apps/mercato/src/modules.ts` pushes the example module
behind a guard — `if (parseBooleanWithDefault(process.env.OM_ENABLE_EXAMPLES, false)) { enabledModules.push({
id: 'example' … }) }` — because the module must never reach a customer's product. Its ~20 backend pages and
its API routes are **generated only for an enabled module**, and the integration job never sets the flag.
And **the reader I wrote for `CC-149` answered "enabled" from a line the runtime never executes**: the regex
`enabledModules\.push\(\s*\{\s*id:\s*'…'` matched the push and could not see the `if` above it. Same trap as
`CC-132`/`CC-149` (a denominator that cannot see the thing that decides), one layer deeper — the deciding
fact was neither a directory nor a declaration but a **guard around the declaration**.

**Two halves, because there are two truths to keep.** (1) Discovery now reads the guard with the push:
an env-guarded push counts only when its own flag parses on, with the same token table
`@open-mercato/shared/lib/boolean` uses; an `enabledModules.some((entry) => entry.id === 'OTHER')` guard
follows the module it names; **any other shape over-includes** — a wrong check must fail loud (the spec runs
and fails), never silently shrink the suite. (2) The `ephemeral-integration` job sets
`OM_ENABLE_EXAMPLES: 'true'`: CI works **on** the platform, so the module is enabled and its specs finally
cover the pages they were written for. Without (2), (1) alone would turn the suite hollow — 0 specs, 15
shards each passing having run nothing, which is exactly what 8 of today's shards did.

**Proof, by two different routes.** (a) Unit: two new tests — the env guard across `unset` / `0` / `yes`,
and the module guard following `example` — discovery suite **10/10**; the mutation neutralising the env
guard is **RED** (2 failed), the one neutralising the module guard is **RED** (1 failed), each file
restored **sha256-identical**; cli package **74 suites / 1,273 tests** 0 failures; `tsc --noEmit` clean.
(b) The **real repository** through the fixed code: flag unset (CI's default) → **0 specs discovered**;
flag `true` → **33** (13 `apps/mercato` + 20 template; the template's are ignored by the Playwright
config, which is why only the 13 ran).

**What is not claimed:** that CI is now green, or that the example specs pass with the module on. The run
carrying this commit is the end-to-end confirmation — that the flag reaches the in-shard build (the shard
rebuilds the app itself, so it should) and that the specs pass once the pages exist. The seeded `admin`
role receives `example.*` through the module's `defaultRoleFeatures`, so the pages' `requireFeatures`
gate should open for it. `CC-152`'s §5 row records this as an observation to take, not a fact.

---

## 2026-10-20 — `CC-150`/`CC-151`: the two debts the deploy exposed, closed the same day

**`CC-150` was not a test failure at all — it was my instrument.** I ran jest in `create-app` and got a
wall of syntax errors; the package's own command is `node --import tsx --test`, and jest was parsing
TypeScript as plain JavaScript. The real failure was the **template parity test**:
`create-app/template/src/app/api/[...slug]/route.ts` was **stale by the whole `CC-123` change** — the
`derivePrincipal` import and the invoker-ceiling block — and the test that demands byte-identity with
`apps/mercato` failed. Synced the template from the real file: **124 tests, 104 pass, 0 fail, 20 skipped**.
The lesson is `L186`'s, again: a test that fails on the wrong input proves nothing about the code.

**`CC-151`'s own diagnosis was half wrong, and measuring corrected it.** I had written "the specs call a
parked module" — but `CC-149` already excluded the parked modules' **own** specs. The failures were specs
in the **enabled** `example` module that *call* the parked CRM. Two halves: seven per-spec `*.meta.ts`
files declare `dependsOnModules: ['customers']`, and **the discovery's dependency check was still reading
the directory scan** — `resolveEnabledModuleIds` answers *exists*, and a parked module's directory exists.
That is the `CC-132` denominator trap in the **second half of the same filter**. `isModuleEnabled` now
prefers the app's declaration for both questions.

**Proof:** discovery on the real project **42 → 34 specs, 0 from enabled modules calling a parked route**;
discovery suite **8/8**; **two mutations RED** — the stale dispatcher (1 failed) and the dependency check
reverted to directories (2 failed) — both files restored sha256-identical.

**What is still not claimed:** that CI is green. These fixes are pushed; the run that proves it has not
finished at the time of writing. The claim waits for the observation.

---

## 2026-10-20 — deployed: a fresh Companai at `companai.corprorate.com`

**The owner's call, and it was better than the plan I had given him.** Instead of updating an old demo in
place, delete **this platform's** containers and volumes — never the other sites on the VM — and deploy
the latest codebase fresh. A fresh database has nothing to migrate, so the migration-rehearsal gate
disappears and `CC-119`'s first check stops being a rehearsal and becomes the real thing.

**What was done, in order.** A verified backup first (`pg_dump -Fc` + the deployment directory, 2.4 MB,
`pg_restore -l` readable) — so "delete everything" stayed reversible. Then commit **`86c2b1ed`** archived
with `git archive`, copied to `/home/ramzi/build-src`, built on the VM (`~15 min`, image
`sha256:ed7544dd…`), the `companai-platform` project removed with its six `mercato-*-wan` volumes, a fresh
`.env` generated, and `deploy.sh` — which created the schema **from zero** and seeded it. The outgoing
image is preserved as `open-mercato/app:wan-20261020T121954Z`.

**Verified, not assumed:** loopback and public both **307 → `/login` 200**; the seed's three users exist;
all three logins return **HTTP 200** (the login route reads **form data**, not JSON — a 400 that looked
like bad credentials was my request shape, not the password). Every other stack on the VM was checked
present after the removal: Cloudflare tunnel, Coolify, the apex PHP site, demo-site, Konsult.

**★ What this proved:** the schema builds from zero on a real PostgreSQL 17 + pgvector and the app serves.
`CC-119` said that had never happened; it has now, and the row is updated rather than closed — `down()` and
the schema-vs-entities diff were not run.

**★ What it exposed, recorded rather than smoothed over:** CI is **not** green on the deployed commit.
`CC-150` — `create-mercato-app`'s tests are the one failing unit package. `CC-151` — 12 of 15 integration
shards fail because the specs themselves call `/api/customers/people`, a **parked** module. Neither blocks
the build (the `docker-build` job passed); both are open, startable rows.

**Record:** `library/development/DEPLOY-2026-10-20.md` — the file that did not exist for the previous
deployment, which is why nobody could say what commit was live.

---

## 2026-10-20 — `CC-148`/`CC-149`: the first CI run that reached the tests found two denominators

**Both failures were in the measuring, not the measured.** `CC-142` had made the i18n *sync* check pass —
and it printed *"All translation files are in sync"* while four locales were **equally** missing the same
21 keys. The check that sees it is the other one: `i18n:check-usage`, code → English. It named screens
that would render raw key names in every locale: the authority graph (10 keys), the structural-permissions
settings (7), two phone-field labels, the Arabic language name, and the AI-worker hint. Fixed by hand in
en/pl/es/de across five catalogues — **96 entries**, English taken from each `t()` call's own default, not
invented. `i18n:check-usage` now reports **0 missing**; sync stays green (the 8 *"unsorted keys"* reports
were my own re-sort, and `--fix` was used only to sort — `CC-142`'s rule; a key-set comparison against
HEAD proved only the 3 new UI keys differ).

**`CC-149` is the same shape one layer down.** All 15 integration shards reported
`passed=0, failed=0, total=0` — **the harness had never run a single test**. Discovery filtered on a
spec's `requiredModules` but **not on the spec's own module**; `customers` is parked, its directory still
exists, so its specs were discovered, and loading one evaluates
`customers/commands/people.ts:197` → `E.customers.customer_person_profile`, which is **not generated for a
parked module**. A `TypeError` before the first test. **`CC-143` was the same parking decision asking for
a route; this asked for a module graph.** The fix reads the app's **own** enablement declaration
(`apps/mercato/src/modules.ts`) instead of the directory scan — because a parked module's directory still
exists, the `CC-132` denominator trap met a second time. Falls back to the old answer when no declaration
exists; overlays keep their rule.

**Proof:** `i18n:check-usage` 0 missing · `i18n:check-sync` in sync · discovery **7/7**, the real project
discovers **42 specs, 0 from `customers`**, the filter-disabled mutation **RED** and the file restored
sha256-identical. **The handover gained the section it was missing** — the remote, the two branches, how
`gh` is authenticated here, and the commands that read a run. **And the deploy question is answered in
`PLAN-next-deploy.md`: the last deployed commit is recorded nowhere, CI must be green, and `CC-119`'s
migration chain must run against a copy of the live database before anything is deployed.**

---

## 2026-10-20 — `T-05`: an act is approved once, whatever the concurrency

**The row was right, and the file was worse than the row said.** `approve` was `findById` → `if
(status !== 'pending')` → **run the command** → write `approved`. Two approvers both read `pending`,
both passed, **both ran the act** — and the window is the command's own execution time, not the gap
between two statements. **The same shape was in the file twice more:** `reject` wrote unconditionally
(two vetoes both "succeed"; the second overwrites the first's actor and note), and the A3 `commitDue`
sweep read `holding` → executed → wrote, so two overlapping sweeps ran it twice and a sweep could run
an act a veto had just stopped.

**The fix is one primitive.** A compare-and-set claim —
`nativeUpdate(… WHERE status IN (…))`, whose **matched-row count** is the answer: `1` means this caller
owns the act, `0` means somebody else moved it first. `approve` claims `pending → approving`, the sweep
claims `holding → committing`, `reject` writes conditionally on `pending|holding`, and the expiry write
is conditional too. **Two new states, because a lock nobody can see is not evidence:** an approval
interrupted mid-execution is a fact on record, and it can never be re-run.

**★ The first mutation survived, and that was the useful result.** It removed `reject`'s early status
check but the pattern missed the one-line `WHERE`, so the compare-and-set was still there — and the
veto test stayed green. **The survival proved which guard was actually doing the work:** the CAS alone
refuses the veto; the early check is a fast path, not the control. A mutation that is not the mutation
you meant looks exactly like a guard that does nothing. Corrected, it removed both and went RED.

**Proof:** `pendingActService` **29/29**; the neighbouring suites (`.di`, `.ttl`, the approvals page)
**50/50 across 4 suites**; `tsc` **0** (after the machine's `errno=1455` memory ceiling forced one
retry — an environment fact, recorded rather than hidden); **four mutations RED** — claim always true
(1) · claim always false (11) · both veto guards removed (2) · sweep never claims (4) — file restored
**sha256-identical**. **`CC-147` opened** for the lifecycle gap the claim creates. Record:
`PLAN-T05-approve-once.md`.

---

## 2026-10-20 — `CC-146`: two source files were in no checkout at all, and every local run was green

**The first CI run in this project's history found, in its second attempt, a hole that 2,600+ green
tests could not see.** The unit suite failed on `backend-sidebar-icons.test.ts` with *cannot find module
`…/attachments/backend/storage/attachments/page.meta`*. The file was on disk. It was **not in the
repository**.

**The cause is one character of a pattern.** `.gitignore` carried a bare `storage` rule. A bare
directory name matches **at every depth**, and one of those depths was
`packages/core/src/modules/attachments/backend/storage/**` — two real source files, an attachments page
and its `requireFeatures: ['attachments.view']` meta. **Three inventories each looked away:** the files
exist locally, so local runs pass; `git status` is clean because an *ignored* file never appears as
untracked; `git ls-files` lists only *tracked* files. Only a clean checkout sees it.

**The guard asks git, not the filesystem.** `no-ignored-source.test.ts` runs
`git ls-files --others --ignored --exclude-standard -- packages apps`, filters to `src/` and source
extensions, and asserts the list is empty — because a file-exists walker would find the file on the
developer's machine and pass. It also asserts its **denominator** (`ignoreCountEverything() > 0`:
uploads, dist and caches *are* ignored), so a run that found nothing ignored cannot pass by vacuity.
Proven red by restoring the bare rule and adding a new source file under it, then restored
sha256-identical.

**Also in the same commit:** `guard-registry-delivery.test.ts` was asserting the old wording
(*"snake_case"*) while the gate had moved to naming the rule it broke (*"not a readable
permission-surface id"*). The assertion now pins the reason, not a stale adjective — `ok: false` was
already the behaviour under test.

**Proof:** core 1/1 · apps/mercato 5/5 · cli **74 suites / 1,269 tests**, 0 failures. Commit `39dcef67`,
pushed to `code`. This closes the CI thread opened at 05:12 — `CC-141`, `CC-142`, `CC-143`, `CC-145` —
and leaves the run **one observation** from green, which is a thing to go and look at, not a thing to
assert.

---

## 2026-10-20 — `CC-145`: the coverage guards were pinned 75 commits ago, and one was a false red

The unit suite ran for the first time and three count-pinned guards failed — **the guards working**,
not a defect in them. Each number was traced to real work rather than bumped:

- **route files 458 → 464, GET routes 297 → 303** — the **six** files added since the pin
  (`3ba7b28f`, `CC-44`): agent-types ×2 and departures (`CC-127`), capability-ceiling ×3
  (`CC-135`/`CC-139`). 458 + 6 = 464, arithmetic that closes.
- **tables 234 → 237**, and two of the three were **unclassified** — the guard names them:
  `auth.TenantCapabilityCeiling` and `ai_assistant.AiAgentRuntime`. Both are on `INTERNAL_TABLES` now
  **with a reason**: one is configuration read through a single gated route, the other is the runtime
  registry. Neither is a business list surface.
- **write rows 170 → 175.**

**★ The valuable find was a false red.** The departure route declares
`requireFeatures: DEPARTURE_FEATURES` — a same-file constant shared by GET and POST, which is better
style than two literal arrays — and the walker matched only the literal form, so a **gated** route was
reported as ungated. **A guard that produces false reds is a guard that gets muted**, so `classify`
now resolves one same-file `const NAME = [ … ]` and counts it as the gate it is, with three cases
pinning it: non-empty resolves, empty does not, and a name from elsewhere does not.

Register **83 · 61 · 144**.

---

## 2026-10-20 — `CC-143` closed: the integration harness was asking a parked module for a route

Every integration shard failed, and **none of them ever ran a single test**. The probe logged in, got a
token, called `GET /api/customers/people?pageSize=1`, received **404**, waited its full **180 seconds**,
and reported "Application did not become ready".

**The cause was a parking decision nobody connected to the probe.** `customers` is disabled by design in
`apps/mercato/src/modules.ts` — *"upstream's reference module for CRUD patterns … parked, not deleted"* —
so its routes are never generated. The probe was asking for a route that cannot exist, in **every**
configuration of this app, from the day the module was parked.

**Fix:** `READINESS_PROBE_PATH = '/api/auth/profile'`. `auth` is core and always enabled, the route
declares `requireAuth: true` and nothing else, and a 200 still proves exactly what the probe exists to
prove: a token obtained by logging in can read an authenticated route. It no longer depends on any
business module being switched on.

**★ The guard needs two assertions, and the mutation shows why.** `readiness-probe-route.test.ts` checks
that the path's module is in `enabledModules` **and** that a route file exists. With the old path, the
module assertion goes red — and the route-file assertion stays **green**, because a parked module's source
file is still on disk. Either check alone would have called that path healthy. That is precisely why
nobody noticed for as long as the harness existed.

Register **82 · 61 · 143**.

---

## 2026-10-20 — `CC-142` closed: 258 strings translated, and the checker covers three of five locales

The `test` job's second step blocked everything behind it: `auth` was **86 keys short in `pl`, `es` and
`de`** — five features added in English only (`delegations` 19, `denials` 20, `projects` 17,
`recordLocks` 16, `trust` 14).

**They were translated by hand, not placeholdered.** Each locale keeps its own register (informal
address) and its own established terms — *uprawnienie* / *permiso* / *Berechtigung*, *rola* / *rol* /
*Rolle*, *rekord* / *registro* / *Datensatz*, *Superadministrator* — and every placeholder was asserted
to survive, because a translation that drops `{grantee}` renders a broken string and no test would
catch it.

**★ The trap in `--fix`, and why the order mattered.** `i18n-check-sync.ts:165` repairs a missing key
by **copying the English text into the locale** — a placeholder that makes the check green while a
Polish user reads English. So the keys were filled first, and `--fix` was then used **only to sort**
12 files across `apps/mercato/src`, `api_keys` and `audit_logs`. The check now prints **"All
translation files are in sync."**; `auth` **107 suites / 955 tests** green.

**Written down, because the next person will need it:** `library/development/I18N-CATALOGS.md` — the
rule, the enforcement, the `--fix` trap, the 258 strings, and the one debt they carry: **no native
speaker has reviewed them.**

**★ And the finding underneath the finding.** The app offers **five** locales
(`config.ts:14`: en, pl, es, de, ar) and renders Arabic right-to-left — but the checker reads
`TARGET_LOCALES = ['pl','es','de']`. `auth/i18n/ar.json` holds **40 of 377 keys**, so 337 strings
render as raw dotted keys in an Arabic UI while the checker reports "all in sync". That is `CC-144`,
and it is the same shape as everything else in this register: **a check that covers three of five
offered locales reports completion for a product that is two-fifths untranslated.**

Register **81 · 62 · 143**.

---

## 2026-10-20 — the run that is not green yet: two pre-existing failures, now rows

The build is fixed (`CC-141`), and the run still fails — for two reasons that predate the remote and
have nothing to do with the change that was pushed.

**`test` stops at its second step (`CC-142`).** `yarn i18n:check-sync` fails across **45 modules × 4
locales**: every catalog is **unsorted**, and `auth/pl.json` alone is **86 keys short**
(`auth.delegations.cappedAt`, `auth.delegations.createHint`, …). Because it is the second step,
**typecheck and the entire unit suite never run** — one formatting rule is currently worth more than
every test in the repository. `--fix` exists; the missing Polish keys are a product decision
(placeholders or real translations), which is why the row is open rather than repaired on the spot.

**The integration shards never boot (`CC-143`).** The app **does** serve (`GET /login returned healthy
HTML`), authentication **does** answer (`POST /api/auth/login returned 401` for the probe's
credentials), and the **authenticated `GET /api/customers/people` returns 404** — the probe waits 180 s
and gives up, so every Playwright test in the shard is skipped. Three readings are possible (probe
user, module enablement, route); the row's next act is a measurement, not a fix.

**What this says about the first run.** It found three real things in one hour — the build break, the
i18n drift, and a harness that has never once reached a test. That is the value `CC-116` predicted
when it argued that a workflow with no runner is a file, not a control.

Register **80 · 62 · 142**.

---

## 2026-10-20 — the first CI run found the build broken in 71 seconds

`CC-141`. Code `6e402313`.

The first GitHub Actions run on the new remote (`39357327101`) failed in `yarn build:app`:

```
Error: Turbopack build failed with 1 errors:
The export extensions was not found in module
  …/packages/ai-assistant/dist/modules/ai_assistant/data/extensions.js
```

**The cause is a convention that nothing checked.** `module-registry.ts:3163` emits, for every
module with a `data/extensions.ts`:

```ts
entityExtensions: ((X.default ?? X.extensions) as EntityExtension[]) || []
```

The `??` reads as a runtime fallback, and at runtime it is one — but the bundler resolves **both**
names **statically**. Six modules export `extensions`; `ai_assistant` exported a default and
`entityExtensions`, and it was the one that broke the build. **2,613 shared-package tests were green**
because none of them had ever asked whether the generated code's assumptions hold.

**The fix is one line; the guard is the real deliverable.**
`packages/cli/src/lib/generators/__tests__/extensions-export-convention.test.ts` walks every
`data/extensions.ts`, **strips comments** (a sentence that mentions the export cannot satisfy it),
and asserts its own **denominator** (a walker that finds nothing cannot pass by vacuity). Proven red
by removing the export, then restored sha256-identical.

**Verified twice.** Locally with CI's own sequence — `build:packages` 20/20 · `generate` ·
`build:app` → `✓ Compiled successfully in 2.0min`, `1 successful, 1 total` in 6m19s — and on the
runner: the next run's `prepare` job is **success**. The first local attempt died on this machine's
memory ceiling (`errno=1455`), not on code; `--concurrency=1` cleared it.

**The lesson is the project's oldest one in a new place:** a convention that nothing checks is a
convention one module away from breaking the build. The workflow had never run — and its first minute
found what the whole test suite could not see.

---

## 2026-10-20 — the repositories are on a remote: `main` is the docs, `code` is the codebase

The owner created `https://github.com/FOOTBALLMOOD/companai` and asked whether one repository was
enough for both halves. It is — as **two branches**, because the two local repositories have
**unrelated histories** and cannot share one:

| Branch | What it carries | Head |
|---|---|---|
| `main` (default) | the documentation repository | `821938b` |
| `code` | the codebase (`workspace/starting-kit`) | `a807fda3` |

Each branch carries its own workflow, and each workflow names the branch it runs on — `docs.yml` on
`main`, `ci.yml` on `main`/`code`/`develop`/`feat/wms`. **That last clause was a defect waiting to
happen:** `ci.yml` listed only `main`/`develop`/`feat/wms`, so pushing the code to `code` would have
carried a workflow that nothing calls — `CC-101`'s defect, committed by the change meant to fix it.
It now names `code`.

**★ The push failed first, and the reason is worth keeping.** `RPC failed; curl 55 Send failure:
Connection was reset` — the docs `.git` was **313 MB of 18,016 loose objects**, never packed. One
`git gc --prune=now` took it to **10.8 MiB**, and the same push succeeded. A repository that has never
been packed is a repository whose first push is a coin toss.

**What this changes.** `CC-113` and `CC-116` were closed on the owner's ruling that *"no remote is a
deployment state, not a defect"*. The deployment state has now moved: the checkers this project has
been verifying **by hand** can be called by a runner. **What it does not yet prove is a green run** —
that is the next observation, and it is the one that turns `✅ built` into `✅ enforced`.

---

## 2026-10-20 — `T-04` built: a question about a number is no longer answered with rows

**Slot 0, finding 3 of 13 → 10 left.** Code `6d7ef0ce`. Plan `PLAN-T04-count-returns-rows.md`.

**The defect, and why the gap was the whole of it.** The compiler emitted
`ROW_ORIENTED_TARGET` as a **gap** for any operation that was not `list`. `verifyFunction` filters
diagnostics to `severity === 'error'`, so a gap is excluded **by construction** — the check recorded
`passed` with *"The compiler resolved this against the model without error"*, a sentence that is
literally true and materially false, because the stage that emitted it had just said no physical
execution was possible. The Function saved, published, became runnable, and returned **a list of rows**
to somebody who asked for **a number**. Nothing downstream told the reader the count they inferred was
a fabrication.

**Three refusals, at three layers, because one is not enough.** The compiler's diagnostic is an
**error** now, so `compiled.ok` is false and the check records `failed` with the compiler's own sentence
— rewritten to say what the caller would have received (*"the run would return rows rather than the
requested count"*) rather than only what the compiler could not do. The passing message **names the gaps
that remain** (`OFFSET_NOT_SUPPORTED` is still a real gap: a list without an offset is still a real
list). And the runner asks the **IR's** operation at its own gate — gate 3 only ever asked the
Function's `operationType`, so a Function verified and saved *before* this change would have carried its
old green report straight past the compiler fix. The belt exists because the braces can be undone by
history.

**★ The existing test pinned the defect.** `compile.test.ts`'s *"an aggregate IR compiles logically and
reports the row-oriented gap"* asserted the exact behaviour this row removes, through `mustCompile`,
which throws on a refusal. A test that encodes a defect is not a test that needs updating in passing; it
is the defect, written down.

**Proof.** New suite `t04-count-returns-rows.test.ts` (5 tests: the compiler refuses · the report fails ·
the runner refuses and **never calls the engine** · a list IR still runs with the exact same
`QueryOptions` · the passing message names its gap). `scripts/verify-t04-mutations.mjs`: **5/5 RED**,
files restored byte-identical — severity back to a gap · the runner gate deleted · the old message
restored · **the gate refuses every IR including list** · **the gate reads `operationType` again**. The
last two exist because a gate that refuses everything passes all three refusals and destroys the only
query this module runs. `tsc` 0; `packages/shared` **211 suites / 2,613 tests, 0 failures**.

**Two traps, both worth keeping.** `VerificationCheck` carries `outcome`, not `status` — the scenario
test was written against an imagined signature. And a `$param` placeholder is refused at **stage 2**,
before the operation is ever looked at, so the compiler has to be asked through `bindParameters` — the
same step the runner uses — or the test proves a string instead of the path (L186). The first full run
also reported a suite that *"failed to run"*: the harness's bulk-delete guard (59 files > 50), not the
code — 8/8 with `CODEBUDDY_SAFE_DELETE_ENABLED=0`, and the whole package green under the same override.
A suite that fails to load reports no failing tests, which reads as a pass to anyone scanning totals.

---

## 2026-10-19 — `T-35` built: the sandbox enforces the cap it advertises

**Slot 0, finding 2 of 12 → 11 left.**

**What the audit said, and the correction.** *"The sandbox's `maxOutputSize` and `maxApiCalls` are declared
and dropped — two of three documented safety options are decorative."* Measured, that understates it in an
important way:

- **`maxApiCalls` was already enforced — in the caller, not the sandbox.** `codemode-tools.ts` counts inside
  its `apiRequestFn` callback, against the **observed HTTP method** (so a dynamically-built method cannot
  escape). So the sandbox — the component whose interface promises the limit — was the one component that
  could not enforce it. The defect is not "the cap is missing"; it is **"the sandbox's option is decorative
  and the safety depends on the caller remembering."**
- **`maxOutputSize` was implemented nowhere, and nothing wanted it.** The isolate's own memory limit already
  bounds a runaway result, and the console proxy caps entries and length. A second byte counter would be
  theatre.
- **`SandboxResult.apiCallCount` was a third decorative member the audit never named.** Declared since the
  file was written, never populated.

**What shipped.** The sandbox now wraps any injected `api.request` with its own counter and throws past the
cap, so the option is real and a caller that forgets gets the documented default of 50 instead of unlimited.
The result carries what the sandbox counted. `maxOutputSize` is **removed**, with the reason written at the
removal site, because an option that promises a limit nothing implements is worse than an absent one — the
next caller writes `{ maxOutputSize: 1024 }` and believes the run is bounded. And the caller stops passing a
value that was ignored.

**★ Two things the mutations caught, both in my own work, and both are why mutations exist:**

1. **My first M3 did not go red.** I aimed at the first matching `apiCallCount:` line — which was the
   **catch** block — and nothing asserted the count on a failed run. That is not a pass; it is an untested
   branch, and a failed run is exactly when the number matters, because it is the only place a caller learns
   the sandbox stopped the run rather than the code failing. Two new tests now hold that branch, and M5 is
   the mutation that proves it.
2. **M4 needed a type-level proof.** Re-adding an interface field is invisible to a runtime test, so the
   contract is pinned with `@ts-expect-error` — which fails the build when the expression stops being an
   error. Confirmed: re-adding the option yields `TS2578: Unused '@ts-expect-error' directive`.

**★ And one failure that is not mine, measured rather than assumed.** This package's full run shows
**27 failures in 5 suites** (`agent-runtime*`, `max-steps-budget.integration`, `ws-c-policy-and-tools`),
every one `AiModelFactoryError: … provider "openai" … is not configured`. Proven by stashing my change and
re-running: **the pristine tree fails the same 27 tests in the same 5 suites.** A missing provider key in
this environment. Left visible here because the next person to see a red `agent-runtime` suite would
otherwise start digging in the wrong place.

**Proof.** The sandbox suite is **74 tests** (66 pre-existing + 8 new) · **5/5 mutations RED**, files
restored checksum-verified: drop the throw (2) · off-by-one at `cap - 1` (3, which is the proof the boundary
is the cap itself) · the success-path count (1) · re-advertise `maxOutputSize` (`tsc`) · the error-path count
(2) · `tsc --noEmit` on `packages/ai-assistant` exit **0**.

**Records:** [`PLAN-T35-sandbox-caps-real.md`](library/development/PLAN-T35-sandbox-caps-real.md) ·
`PREVIEW-AUDIT-TRIAGE.md` §1.3, §6.2 · `MASTER-CHECKLIST.md` §9.4 (**Slot 0 = 11**).

---

## 2026-10-19 — `T-27` built: the tenant-scope helper stops passing in silence

**Slot 0, finding 1 of 12 remaining.**

**What the audit claimed, and what is actually true.** The line said *"`ensureOrganizationScope` and
`ensureTenantScope` fail open — log-only, default off … the `systemActor` flag exists and is never checked
here."* Measured, that sentence is half right and the wrong half is the interesting part.

**Right:** the deny branch is guarded by `ctx.auth &&`, so a caller with **no auth object at all** lands on
a silent `return`, and there is **no logging on that path** — the pass is invisible.

**Wrong, twice.** *"log-only, default off"* is the description of the **organisation** helper, which #2441
already hardened: it logs and can be turned into a deny with `OM_ENFORCE_ORG_SCOPE_STRICT`. The tenant helper
got none of that, so the finding reads the right way round as *"one of the pair is observable and
configurable, the other is silent and fixed open."* And *"`systemActor` is never checked here"* is simply
false — the flag does not appear in the function, and the test that looks like it checks this builds a context
where **`auth` exists with `tenantId: null`**, so the refusal fires on `ctx.auth` being truthy, not on the
flag. Both corrections are in `PREVIEW-AUDIT-TRIAGE.md` §1.5 as `C-08` and `C-09`.

**★ The defect, in one sentence:** the exemption is keyed on the **absence of the auth object**, so *no
context at all* was trusted more than a context with nothing in it — and the pass was silent, which is what
made it hard to act on.

**★ And what is deliberately NOT changed: the allow.** The HTTP path cannot reach this — the dispatcher
refuses a request with no session before any handler runs, the same argument `T-45` recorded — and the
scope-less branch is **load-bearing**: payment, scheduled-command and 415 call sites across 71 files ride on
it, and a test pins it by name (*"preserves legacy system contexts without an authenticated actor"*). Making
absent auth a 403 here would break those flows and turn a finding into a manufactured emergency. So the fix
is parity with the sibling, not a reversal: **observable now, closable by flag** (`OM_ENFORCE_TENANT_SCOPE_STRICT`,
default `false`). The organisation helper's line-128 branch had the identical asymmetry and is silent, so it
gets the same treatment.

**Proof.** The scope suite is **26 tests** (20 pre-existing, all still passing, + 6 new) · **4/4 mutations
RED**, files restored checksum-verified: drop the strict throw (2 failed) · default the flag to `true`
(3 failed — which is the proof the default is the load-bearing half) · drop the tenant log (4) · drop the org
log (1) · `tsc --noEmit` on `packages/shared` exit **0** · full shared **210 suites / 2,608 tests, 0
failures**.

**★ One flake, measured rather than assumed.** The first full run reported 209/210; the second reported no
failure at all. Running the suspect suite alone gives **13/13 green** and the full run with the sandbox's
delete guard switched off gives **210/210, 2,608 green** — which is `CC-19`'s recorded mechanism exactly
(that suite clears a 59-file temp cache, and this harness refuses any bulk delete above 50 in one turn).
Nothing about this change touches it, but *"a suite flaked"* is not a proof, so it was measured.

**★ And the test caught a fact worth keeping:** an auth object stripped of `isSuperAdmin` cannot claim
superadmin, so `auth: null` + a target tenant now logs even when the "real" caller was privileged. That is not
a regression — it is the finding in miniature. Every caller that forgot to wire auth is in exactly that
position, and it is now visible.

**Records:** [`PLAN-T27-tenant-scope-observability.md`](library/development/PLAN-T27-tenant-scope-observability.md) ·
`PREVIEW-AUDIT-TRIAGE.md` §1.3, §1.5 (`C-08`, `C-09`), §6, §6.2 · `MASTER-CHECKLIST.md` §9.4 (Slot 0 is
now **12**).

---

## 2026-10-19 — `CC-140` closed: the ceiling write refuses a stale view instead of silently discarding it

**The row came from `CC-139`'s own exemption comment** (`LESSONS.md` L192: the exemption's reason is a defect,
and a comment is where defects go to be forgotten).

**Built:** `ceilingRevision(capabilities)` — the fingerprint of the **set** (FNV-1a over the sorted,
length-escaped list, count alongside; not crypto, because the token protects nothing and its job is equality).
The read returns it beside `capabilities`; the write takes an optional `expectedRevision` and, when it
differs from what the table holds **now**, answers **409** before anything is written — asserted the way every
refusal in that file is asserted: the store is unchanged and nothing was recorded. A 409 rather than a 400,
because the request was right and the **view** was wrong; an operator who reads 400 tries again and loses
twice.

**★ And what it is NOT, written in the code, the plan and the register row:** the window between the
comparison and the write is **milliseconds, not zero**. This converts a silent overwrite into a refusal; it
does not make the write atomic, and a real lock would be a `SELECT … FOR UPDATE` over the rows being replaced.
A security control whose strength is overstated in its own comment is the defect, not the defence.

**★ L193 — the new test caught a defect in the new code.** The 409 branch set its message and then reloaded,
and the reload clears the notices and the error — so the screen would have reloaded **in silence**, which is
precisely the wrong `CC-139` shipped to repair. Repair first, then report; that order is now a test.

**Proof.** +5 route tests, +2 page tests; 3 ceiling suites / 32 tests; **4/4 mutations RED** (drop the
revision from the read → 3 · ignore the token → 2 · 400 instead of 409 → 2 · compare against the request's
set instead of the stored one → 1), files restored checksum-verified; `tsc` 0; full core **661 suites /
5,824 tests, 0 failures**.

**Register 79 closed · 60 open · 139 total.** The authority family is complete — `CC-125`, `CC-128`,
`CC-134`, `CC-135`, `CC-136`, `CC-137`, `CC-139`, `CC-140`.

---

## 2026-10-19 — `CC-139` closed: the ceiling has a screen, and the wildcard is not assumed on the way in

**What the row asked for.** A page over the route `CC-135` built — the one control that bounds every
tenant in the deployment was still changed from a terminal or by hand-written request.

**★ The question the row did not ask, and the measurement that answered it.** The feature tree comes from
`/api/auth/features`, gated by the **role-editing** capability. The ceiling is gated by the
**tenant-management** capability. The dispatcher's `requireFeatures` is **all-of** — measured, there is no
any-of form anywhere in `packages/shared` or `packages/core` — so the screen could not borrow the role
editor's endpoint. A platform administrator usually holds both, through `*`. **And that is exactly the
sentence `CC-134` already punished:** the wildcard must not be relied on to arrive at all, because the guy
`CC-135` chose to support — a tenant administrator narrowing **their own** ceiling — may hold the tenant
capability and nothing else, and would have been handed an empty tree with no explanation.

**So there is a read-only catalogue route in the same folder**, gated like the ceiling. Not a widening: a
capability that lets you **set** a list is strictly more powerful than one that lets you **see** it, and a
route that refuses the list to somebody who may rewrite it is a door with the handle on the wrong side. It
is a separate route — not a relaxed gate on `/api/auth/features` — because that endpoint also appends
**tenant-scoped synthesized entity features**, which must never enter a ceiling that sits above every
tenant. The row also said to reuse `AclEditor.tsx`; measured, the row is right about the **tree** and wrong
about the **component**: that is a role editor that also fetches roles, organisations and a target ACL.
What is reusable is the data shape and the grouping.

**★ And the build met a guard in the tree.** Two suites scan every backend screen for a mutating call
without the expected-version header, with a deliberately **empty** allowlist — *"wire it or exempt it
inline."* Both went red (2 of 5,818). The honest answer is not a header: the ceiling is a **set of rows**,
one per capability, so no version header means anything. The page carries an inline exemption — **and the
hole that exemption exposed is `CC-140`**, opened in the same change rather than left in a comment. Two
administrators who load the same ceiling and both save keep the last write; a screen makes that race
reachable by hand. `LESSONS.md` **L192**.

**What landed.** `backend/settings/capability-ceiling/` — a page and its metadata — plus
`api/capability-ceiling/catalogue/route.ts`. Scope selector, searchable module-grouped tree, save
disabled until something changed, every refusal shown as the route's **sentence**.

**The proof.** 3 suites / 26 tests, the page rendered under jsdom with a stubbed fetch that asserts on
**URLs and bodies** rather than call counts. **5/5 mutations RED**, files restored checksum-verified:
drop the page's capability · save to the platform URL for every scope · render the status instead of the
message · re-gate the catalogue route · call an inherited ceiling *this tenant's own*. `tsc` 0; full core
**661 suites / 5,818 tests**.

**One thing this costs, stated plainly:** the page is registered by a **generated** manifest
(`apps/mercato/.mercato/generated/backend-routes.generated.ts`, not in git), so it appears the next time
`mercato generate` runs — `yarn dev` runs it automatically. Nobody has to remember to do anything, but a
reader who greps for the file and does not find it in the manifest has not found a defect.

**Records:** [`PLAN-CC-139-ceiling-screen.md`](library/development/PLAN-CC-139-ceiling-screen.md) ·
`LESSONS.md` **L192** · `MASTER-CHECKLIST.md` §2, §4, §5 · **`CC-140` opened**.

---

## 2026-10-19 — `CC-137` closed: granting roles has one door, and the floor's answer is finally asked

**What the row asked for.** Close the third door onto the authority system. The direct ACL writer is
behind a floored capability; `POST`/`PUT /api/auth/users` is gated by two capabilities that were **not**
on the floor, and its `roles` array was checked only as a **subset** of the actor's own ACL — with an
early return for a superadmin. So a machine holding the users capability could pass on any role it
already held, and one holding it *and* a wildcard role could hand out any role to anybody.

**What measuring it found, and it is the reason the row was worth building.** The machine floor **already
listed `auth.roles.manage`** — live since `CC-125`, with its reason written beside it — and this route
**never asked a question the floor answers**, because it only ever asked *"do you hold the users
capability?"*. The control was correct, present, and unreachable: the same shape as a checker nothing
calls, one layer down. **So the fix is two halves and they are not alternatives.** The route now asks for
the capability that means *may you assign roles* whenever a request carries roles — that is what makes the
existing answer reachable — and the two user capabilities joined the floor — that is what refuses the
machine at the route's own gate, before the handler is entered at all.

**★ And the old check was worth nothing for the actor that mattered.** `assertActorCanGrantRoles` begins,
in effect, with *if you are a superadmin, return* — so the one actor able to pass on **any** role was
exempted by the check itself. That is not a typo: for the rule it implements (*you may pass on what you
hold*) the early return is right, and comparing `*` against a feature list is busywork. The defect is that
it was the **only** rule on that path — a **narrowing** rule doing duty as a **granting** rule, and the
two differ exactly at the top of the privilege range. `LESSONS.md` **L191**.

**What landed.** `assertCanAssignRoles` asks `userHasAllFeatures(actor, ['auth.roles.manage'], scope)` and
**fails closed** (`?? false`) when the answer cannot be obtained; the subset check stays, because *may you
assign roles* is not *may you assign a role wider than your own*. `MACHINE_FLOOR` grew **7 → 9**, and
every place that states the size moved with it — the docblock arithmetic, the size guard, and the comment
that had recorded this gap as open. **An empty `roles` array needs no capability:** it hands nobody a role,
the grant check already returns early for it, and narrowing is not widening — the same rule that keeps
`api_keys.delete` off the floor. `auth.users.list` and `auth.users.delete` stay off, asserted so a later
tidy-up cannot widen the floor by accident.

**The proof.** +5 route tests and +1 floor test. **5/5 mutations RED**, and two of them are the ones worth
reading: flipping `?? false` to `?? true` turns **exactly one** test red — the fail-closed case — which is
the whole justification for the `?.`; and removing the two ids from the floor turns three red across two
suites, including the belt-and-braces assertion inside the machine test, which asks the **real** floor
rather than a fixture told to say no. Every file restored **checksum-verified byte-identical**. Auth
**105 suites / 937 tests**; core **659 suites / 5,806 tests, 0 failures**; `tsc` 0.

**Why it matters beyond the row.** The authority system's four direct doors were shut by `CC-125`; this
was the fifth, through a route that looked like user administration. With it closed, the last *measured*
way a machine reaches the levers that define authority without touching a floored capability is gone —
what remains on that path is the owner's long-standing decisions about what a machine may hold at all
(`CC-120`) and whether the platform has an identity above its tenants (`CC-133`).

**Records:** [`PLAN-CC-137-role-assignment-door.md`](library/development/PLAN-CC-137-role-assignment-door.md) ·
`LESSONS.md` **L191** · `MASTER-CHECKLIST.md` §2 and §5.

---

## 2026-10-19 — `CC-136` closed: when the platform acts on its own behalf, it stops being filed as a person

**What the row asked for.** Teach the reader that `system:` marks the platform acting on its own behalf.
The owner ruled option (a) — teach the parser, and accept that the id columns then hold the bare id —
and the recommendation was made in plain terms: *a platform act is currently filed as if a person did
it; fix the reader.*

**What measuring the row found: it was wrong in two places, and the second one is the whole story.**

*The blast radius was overstated.* The row said a platform act was *"past both the floor and the
ceiling"*. The ceiling is resolved **by tenant** — `capabilityCeiling.refusalsFor(scope.tenantId, …)` —
so it applies identically to every principal and never looked at the kind at all. This was a **floor**
hole and only a floor hole. The overstatement is cheap here and expensive later: a row that claims two
gates sends the next reader to the file that was never involved.

*The fix was twice the size the row said.* The row's `FIX` line was *a parser edit*. But the parser is
not the only function that answers *what kind of actor is this*. The step that turns a login into a
principal **re-derives** the kind from two booleans — `isService`, `isAiWorker` — and its final ternary
ends in `'human'`. So a `system` subject fell through to *person* there as well. The parser is what the
gates read; the derivation is what the journal, the preferences read and `effectiveUserId` read. **A
parser-only change would have turned the gates green while the rest of the platform still believed a
platform act was a person.** Two functions, one fact, and the row named one of them.

**What landed.** One builder for the word that marks a platform act — the module's own docblock says
*"nothing outside this module should build or parse this string"*, and two template files did — plus the
reader taught to recognise it, the derivation taught to report it, and the write path taught that the
mark belongs to the same three rules the other two kinds already follow: an agreeing mark is stripped, a
disagreeing mark is refused with a message, a bare id is accepted with any declared kind. The machine
floor's docblock stopped apologising: its `system` entry said *"currently unreachable"* and *"must not
be read as coverage today"*, and both sentences are now false.

**The data question turned out to have an empty answer.** The row worried that returning the bare id
would change what stored `system:` rows contain. Measured: the column that would hold such an id —
`action_logs.actor_user_id` — is a **`uuid`**, so Postgres never accepted one; and nothing writes a
`system:` subject into a `text` principal column. **No migration.** The verification is a search.

**What the proof looks like.** The platform's own act is now refused `auth.roles.manage` **and** still
allowed an ordinary capability in the same test — a floor that refused a platform act everything would
be the platform unable to run. **5/5 mutations RED**, and the one worth keeping is M2: remove *only* the
derivation arm and exactly two tests go red while the parser tests stay green, which is the measurement
that proves the second half was not a theory. Shared **210 suites / 2,601 tests**; core **659 suites /
5,800 tests, 0 failures**; `tsc` 0 on both; every mutated file restored **checksum-verified
byte-identical**.

**★ And the run found an instrument that had quietly stopped working.** The checklist's own mutation
suite reported `GREEN M8 — DID NOT APPLY`: its target text (`the unaddressed count is **80**`) had moved
to `49` at an earlier close, so the mutation could no longer fire — and a mutation that cannot fire is
not a proof, in the suite's own words. Re-aimed at the text as it stands; 14/14 RED again.

**Why it matters beyond the row.** The platform now has four kinds of actor that can actually be
produced, and the one it uses when it acts by itself is the one no configuration may grant the
authority system's levers to. That closes the last measured fail-open in the identity layer that a
platform act could walk through — the remaining door is `CC-137`, where a machine holding
`auth.users.edit` can still hand out roles.

**Records:** [`PLAN-CC-136-system-subject.md`](library/development/PLAN-CC-136-system-subject.md) ·
`LESSONS.md` **L190** · `MASTER-CHECKLIST.md` §2 and §5.

---

## 2026-10-19 — `CC-135` closed: the ceiling has a door, and the platform has an administrator

**What the row asked for.** A route, so that a ceiling change stops being recorded as `system`. The
audit half was already built and correct — `CC-128` made the actor a **required** argument precisely so
that the day a route supplied a real principal the record would be real for free. The only caller was
`mercato auth ceiling`, and a CLI has no principal.

**★ What measuring the row's own `FIX` line found, and it is why this was not a transport change.**

*First: the platform administrator did not exist.* `CC-134` rewrote the cross-tenant read to ask *"is
this person an administrator of the **foundational** tenant?"* and to answer **false** when no such
tenant exists. Measured from source: `grep -rn isFoundational` over `packages` and `apps` returns **one
reader and no writer**. The column defaults to `false` and nothing sets it. So the fail-closed branch
was the only branch that could run, and a platform-scope route would have been a door nobody could open
— the same shape as `CC-136`'s "a kind with no producer", one layer up.

*Second: the capability is not the reach.* `directory.tenants.manage` says *may you manage tenants*. It
does not say *whose ceiling may you move*. Under `CC-134` every tenant's administrator holds that
capability legitimately, through the `*` that belongs to their position; and a tenant with no ceiling
rows **inherits** the platform's. Gating on the capability alone would therefore have handed **every
tenant administrator the platform ceiling** — the set that bounds every other tenant — which is
strictly worse than having no HTTP door at all.

**So the route asks two questions.** The capability, at the dispatcher's gate; and the **reach**: the
platform scope needs a platform administrator, a tenant scope needs the caller's own tenant or a
platform administrator, and narrowing your own tenant's ceiling is allowed — because `CC-128` already
refuses a non-subset, so the most a tenant can do to itself is reduce.

**And the flag gained its producer.** `mercato auth set-foundation --tenant <id> | --clear` — clear,
set, record, and then **invalidate the ACL cache**, which is `CC-134`'s named debt and now has its only
caller. `mercato setup` designates the tenant it creates, so a fresh install is born with a platform
administrator instead of needing a second command.

**★ The finding the route produced.** `crossTenant` was computed as *the actor stands in a tenant and
that tenant is not the target*, which reads correctly until the target is the **platform** ceiling —
`tenantId === null` — where it became `true`. So a platform administrator changing the platform ceiling
would have been recorded as a **cross-tenant act**. It is not: the platform ceiling belongs to no
tenant, and that act *is* the platform act. Nothing could have caught it before, because the only caller
was a CLI that always acted from `null`; the route is what put a tenant on both sides of the comparison.

**And one lesson about tests, from the test that passed.** The new suite imported `Tenant` from a module
that does not export it, so the symbol was `undefined` at runtime and every tenant lookup answered "not
found". Six tests failed — and the **404** test passed, because its entire content is *"the lookup finds
nothing"*. A green refusal test is the weakest witness in the suite. `LESSONS.md` **L189**.

**Proof.** 14 route tests driving the real handlers and the real library against a store that **applies
the filters it is handed**; 5 foundation tests; +2 setup tests; **6/6 mutations RED**, every file
restored checksum-verified byte-identical; auth **105 suites / 931 tests**; core **659 suites / 5,800
tests, 0 failures**; `tsc` 0. The **screen** is `CC-139`, opened in the same change — a closed row is
where a remaining half goes to be forgotten.

---

## 2026-10-19 — `CC-134` closed: an administrator of one tenant is no longer an administrator of every tenant

**The defect.** The read asked *"does this person hold a superadmin row anywhere?"* and the answer
promoted them above **every** tenant — and `loadAcl` acted on it before the requested scope was
consulted at all. `UserAcl.tenant_id` is `NOT NULL` with a comment saying tenant scope is mandatory
for ACL evaluation; the query had no tenant filter. `CC-128` bounded what the resulting `*` could
reach. This is the read itself.

**The measurement that made the fix small.** `loadAcl`'s **per-tenant** read already filters by
`tenantId` — so a superadmin of tenant B already gets `['*']` **inside B**, without this function's
help. That means the function is *only* the cross-tenant shortcut: its name was right and its question
was wrong. Under `CC-128` option A the right question is **"is this person an administrator of the
foundational tenant?"**, and `tenants.is_foundational` already exists.

**The fix asks it in both halves.** The per-user read gained `tenantId: <foundational>`; the role half,
which used to look for **tenant-less** links and then read `RoleAcl` with no tenant filter at all, now
points at the same tenant in both places — otherwise the function returns the union of two different
questions. No foundational tenant answers **false**: a deployment that has not designated a foundation
must not silently promote every tenant's superadmin.

**★ The finding the blast radius produced — and it is the part worth keeping.** Scoping the shortcut
turned the **existing** suite red, and the red was right. A tenant superadmin had been receiving `['*']`
as a **side effect** of the bug: the shortcut was not only answering the cross-tenant question, it was
also supplying the wildcard that spells "everything" in this codebase. So the fix, as first written,
**quietly demoted a tenant's own administrator to whatever their row happened to list** — a regression
in the opposite direction, invisible to the seven new tests, and one a customer would have found first.
**The wildcard belongs to the position, not to the row's stored contents**, so the per-tenant read now
produces it. `LESSONS.md` **L188**: *narrowing a shortcut can silently reduce a legitimate answer —
list everything it returns, not only what it decides.*

**A second, smaller correction in the same test file.** `expect(em.find).toHaveBeenCalledTimes(1)` was a
proxy for *"the per-user row won, so no role aggregation happened"* — and it also counted a lookup the
fix made conditional. The property survived; the proxy did not. It now asserts the property directly:
**no `RoleAcl` read at all**.

**Proof.** New suite **7/7** with a fake that **applies the filters it is handed** (a fake that ignores
its `where` cannot prove a filter — L23). **Four mutations, all RED**: drop the tenant filter from the
`UserAcl` read → 2 failed; look up a non-foundational tenant → 6; return true with no foundation → 1;
make the role half tenant-less again → 1. Every file restored and **checksum-verified byte-identical**
(backup by copy, never `git checkout` — L187). The whole `auth` module **103 suites / 910 tests** (was
102 / 903); the whole `core` package **657 suites / 5,779 tests, 0 failures** (was 656 / 5,772);
`tsc --noEmit` **0**. Register **74 closed · 63 open · 137 total**.

**Named, not implied:** moving the foundation does not invalidate `globalSuperAdminCache` (the fix is one
call in the tenant-update path, and `CC-135` is the nearest surface); and `CC-136` is adjacent but **not**
fixed here — a `system:` subject is still parsed as `human`.

---

## 2026-10-19 — `CC-92` scheduled: the preview audit's 45 findings get gates, and `CC-125`'s missing half gets a row

**The row had said "the rest are queued" since 16 October.** That is not a schedule — it named no slot,
so nothing in §4 could start any of the 37 pending findings. The owner asked for the revisit point to
be named and the findings spread into the pipeline and the register, so nothing is left as a hole.

**The schedule is by gate, not date** (`PREVIEW-AUDIT-TRIAGE.md` §6 = `MASTER-CHECKLIST.md` §9.4):
8 closed · **Slot 0 = 13 before `CC-121`** · Slot 1 = 10 with `W3` · Slot 2 = 1 with `W5` · Slot 3 = 4
with `W7` · Slot 4 = 3 with `W8` · Slot 5 = 2 with `P2-9b` · 4 deferred by name.

**★ Why Slot 0 sits before `W1` and not before the first surface.** `CC-121` re-keys every
`principal_id`. The gate it re-keys through cannot see **seven modules' commands** (`T-07`:
`catalog`, `communication_channels`, `customers`, `resources`, `sales`, `staff`, `wms`) and one scope
helper accepts a missing identity (`T-27`: `ctx.auth?.tenantId ?? null` then skips the refusal). So
W1's own gate — *rotate a key and every binding, role, delegation, denial and audit row survives* —
**cannot be proven for the modules the gate does not reach.** A migration through a gate with holes
produces a clean answer about a partial system. **The spine is repaired before it is re-keyed.**

**The gate is now in the pipeline, not only in the checklist** — `PLAN-2026-10-18-one-agent.md` §6 draws
`CC-92 Slot 0` before W1 and marks which slot rides which workstream, and W1's gate carries it as a
precondition. A schedule that lives in one document is a schedule the next reader of the other document
does not have.

**Two numbers re-measured, not inherited (Rule 13).** `T-36` is **closed by `CC-132`** — the coverage
guard's denominator now resolves through `enabledModules`, so it no longer excludes anything shipped
outside `packages/core`. And `T-07` is **seven** modules, not the audit's nine (the triage's own `C-02`
had already corrected it; today's census confirms: 15 core modules carry `commands/`, 8 declare a
capability). `scripts/check-declared-controls.mjs` re-run today: **6 controls — 1 covered, 4 uncovered,
1 dead-input**, which is the evidence that `T-08`, `T-22`, `T-29`, `T-34` and `T-43` still stand.

**★ A defect in the records, closed the same way.** `CC-125` was closed with its **surface half** — no
route declares human-only or machine-only — recorded only as prose *inside the closed row*. A closed row
is exactly where a remaining half goes to be forgotten, so that half is now **`CC-138`**, scheduled with
`W3` where the pipeline's own "Lands" line already named it. Register **73 · 64 · 137**.

**★ And the checker caught me repeating L24.** `CC-92`'s new state cell read *"scheduled — Slot 0
startable now"*, which is not one of §4's four strings — so the row counted as none of them and the
tally went wrong by one. Same class as the `☑ done` that hid `CC-126` for a day: **a status the checker
cannot read is a row it does not count.** The lesson was six hours old when it recurred; the fix is the
vocabulary, and the schedule detail moved to the trigger column.

**Also in this pass, five record defects found by auditing the uncommitted batch:** the `CC-127`
journal heading had been consumed by the new entry above it (its body was dangling under a separator);
`where_we_left.md` still read `71 · 61 · 132` and named `CC-128` as next; `MEMORY.md`'s frontier was a
day stale **and the file was long enough that the session-start injection truncated its tail — the part
that says where we are**, which is why this session opened believing it was 16 October (rewritten
shorter); `CC-133` was missing from `BACKLOG.md`'s deferred-by-decision table, which is the owner's
callback register for "not now, when the time is right"; and the route-classification half above.
**Checkers: PASS at 457 table rows · derive-counts MATCHES 78/321 (24.3 %).**

---

## 2026-10-19 — `CC-125` closed: the floor — seven capabilities no configuration may grant a machine

**The ruling became code, and the measurement found the floor is not five things.** The owner's answer
(*"we follow your recommendations"*, `PLAN-2026-10-18-one-agent.md` §4.5) made the five categories
the floor and nothing else. Mapping them onto real capability ids then measured **two of the five
wrong**: *granting* is expressed **four ways** (roles · delegations · ACL · **denials — lifting a
denial widens**, so the capability is symmetric and a machine must not hold either end), and *erasing
the audit ledger* has **no capability at all** — the audit capabilities are `view_*`, `undo_*`,
`redo_*`, so nothing can erase the ledger, which is the correct end state and is recorded as a finding
rather than left as an empty row. So the floor is **seven ids behind five categories** (1 + 4 + 1 + 1).

**Why code and not a row in the ceiling table.** `CC-128` made the ceiling configuration because that
is the right shape for business capabilities. It is the wrong shape here: a machine that could reach
the ceiling table could raise its own ceiling. The floor is a constant in `machineFloor.ts`, bound to
`ai_worker`, `service`, `system` — and **not `human`**, because somebody has to mint the keys and
grant the roles. In `decideFor` it is a third narrow input beside the ceiling, and when both refuse
the reason names the **floor**, because that is the one no configuration can lift — naming the ceiling
would send an operator to raise a ceiling that would not help.

**★ Two defects in the work itself, both caught at the close, both fixed.** (1) **A test wrote a
subject the platform cannot produce**: `decideFor('service:x')` is judged **human**, because
`service:` is not a prefix — a service principal is an `api_key:` subject and the parser decides the
kind — so the test claiming *"nothing can turn the floor off"* was red for the wrong reason. It now
builds its subjects through the platform's own encoders. (2) **The prose said six and the table held
seven** — typed-count drift, in the file being closed. The size guard is the pin.

**★ And the build documented a hole instead of hiding one: `system` is a principal kind with no
producer** (`CC-136`). `parseSubject` recognises `ai_worker:` and `api_key:` and calls everything else
`human`, so a platform act — and `example_customers_sync` builds the `system:` subject form today —
arrives as the **widest** kind, past both floor and ceiling. Asserted at the parser *and* the resolver
so it is red-green visible. It is not a one-line fix: `normalizePrincipalSubject` documents the
storage convention as *"no prefix is defined"* for `system`, so teaching the parser the prefix changes
what the id columns hold — a decision recorded as the owner's, with my recommendation attached.

**★ And the hostile pass over the closed floor found the one gap the ruling did not contemplate.**
*"Granting roles"* — the owner's second category — is covered for the four direct writers, but the
route that writes `isSuperAdmin` and the feature list (`PUT /api/auth/users/acl`) is behind
`auth.acl.manage`, which **is** on the floor, while `POST`/`PUT /api/auth/users` is behind
`auth.users.create` / `auth.users.edit` — **off the floor** — and its `roles` arrays are checked only
against the actor's own ACL (a subset check, `grantChecks.ts:58-90`). So a machine configured with
`auth.users.edit` can pass on the roles it already holds. The floor stays at the five categories the
owner ruled and the gap is **`CC-137`**, with (b) move role assignment behind `auth.roles.manage`
recommended over (a) add the two ids to the floor.

**Proof:** 16/16 in the two new suites; the full `auth` module **102 suites / 903 tests**; the full
`core` package **656 suites / 5,772 tests, 0 failures** (CC-128's close stood at 654 / 5,756 — the
delta is exactly this work); `tsc --noEmit` on `core` exit 0; **four mutations all RED** — floor
severed (3), `service` unbound (2), `human` bound (2), one id dropped (the size guard) — every file
restored and checksum-verified byte-identical. Register: 73 closed · 63 open · 136 total, checker
PASS, 14/14 checker mutations RED, `derive-counts` MATCHES. The record:
`library/development/PLAN-CC-125-machine-floor.md`.

---

## 2026-10-19 — `CC-127`'s build: the departure flow asks the question and records the answer

**The requirement became code, and the code settled four things the document could not.** The
preview (`GET /api/ai/departures/[userId]`) lists every live binding held by one of the person's
keys through **both** links — `session_user_id` *and* `created_by`, where the `api_keys` cascade
sees only the second — plus every delegation in **both** directions. The departure (`POST`) runs
`auth.users.delete` through the command bus and then applies the decision: **`deactivate`** revokes
bindings **tenant-wide** through a new `revokeForPrincipals` (the existing `revoke` narrows to one
organization, and a person leaves a *tenant*) and revokes delegations with `revoked_by_user_id`
naming the admin; **`leave`** writes nothing and says, per agent, that the row is preserved **and
inert** — because a binding's principal is an `api_keys` id and the key dies with its owner.

**★ The four corrections (Rule 13).**

1. **`CommandLogMetadata` has no free-form field.** The plan wrote `metadata: { departure: … }`,
   which does not type-check and would have meant editing the bus's vocabulary for one caller. The
   honest home is `metadata.context` — `mergeMetadata` keeps it because `auth.users.delete`'s own
   `buildLog` supplies no context — so `auth` records a decision about agents with **no type change
   and no schema change**. That is the whole point of putting the decision in the audit entry
   rather than in a new table: the module boundary is crossed in the audit record, not in the code.
2. **The partial-failure flag must live outside the `try`.** The first draft marked the thrown error
   with a symbol; a frozen error would have dropped the mark and a failed cascade would have read as
   "nothing happened". It is a `deleteCommitted` flag now, and the `catch` checks it **first** —
   because once the delete has committed, *every* later failure is `departure_partial`, whatever its
   class. A typed error answering with its own status would describe the second half of a two-step
   act as though the first never ran.
3. **The guard runs only for `deactivate` with at least one agent.** `leave` touches no binding, so
   guarding it would be theatre; an empty departure has nothing to guard.
4. **An empty POST body is the default; a malformed one is a 400.** Omitting the decision is not the
   same as mistyping it, and only the second is a client error.

**★ And the mutation proof caught the tests, not the code.** Its first run was one **PARTIAL** and
two **NOT PROVEN** — and in all three the defect was the suite: the fake `EntityManager` returned
every row it was constructed with, regardless of the `where` it was handed, so a dropped `$or`
changed nothing; and the "both key links" fixture used a session key **also minted by the same
person**, so the `created` clause still matched it after the `session` clause was removed. Fixed by
making the mock apply the filters it is given and minting that key from somebody else — and recorded
as `LESSONS.md` **L23**. The re-run is **19/19 PROVEN**.

**★ Closing the row also corrected the register itself (`L24`).** `CC-126` had been closed the day
before with `☑ done` in §5 — the *open-work* glyph — and the checker reads the word after `✅`/`☐`,
so that row had been counted as neither closed nor open ever since. The two mistakes cancelled
(a closed row the checker cannot see also does not trip the "§4 lists closed rows" check), which is
why it stayed green. Both closed rows now read `✅ closed` and have left §4: **69 closed · 61 open ·
130 total**, and the §4 tally is 61 rows.

**Proof:** 43 tests in 3 new suites (15 module · 18 route · 10 repository), 19/19 mutations, the
ai-assistant package green at **143 suites / 2,128 tests** (the `CC-126` close stood at 140 / 2,085),
and `tsc --noEmit` 0. **Next: `CC-123`** — both of its preconditions are now discharged.

---

## 2026-10-19 — `CC-127`'s requirement: the departure flow, and a row whose danger had already been disarmed

**D4 is answerable now.** The owner's ruling — *"the admin doing the deactivation decides, at that
moment, what happens to the related agents"* — becomes `PLAN-CC-127-departure-flow.md`. But the first
thing the measurement did was take the row's headline apart, and that is the entry's real content.

**The row said two things, and one of them is no longer true.** *"A demoted or offboarded user's
assistants keep working"* — measured: a role change runs through `auth.users.update`, which calls
`invalidateUserCache` **in the same request** (`commands/users.ts:650`), so the five-minute ACL TTL never
gets its window; and a departure kills the credential **twice over** — the `api_keys` subscriber revokes
by `createdBy` (`user-deleted-revoke-keys.ts:70`) and the auth lookup rejects any key that resolves
through a user row that is gone (`shared/lib/auth/server.ts:284`). *"Nothing cascades to bindings or
delegations"* — true, and **not an access hole**: `delegationCeilingFor` resolves the grantor as
themselves and takes their own gate as the ceiling (`:443-465`), so a grantor who no longer exists holds
nothing (`:511`) and the grant resolves to `A0`; a binding's principal is an `api_keys` id
(`data/entities.ts:1098-1100`), so it dies with the key. **The assistant stops.** The row was written
before three guards that landed later, and nobody had re-measured it.

**★ So the defect is not access — it is that nobody is asked and nothing is recorded.** D4's answer was
never built, and the platform's departure behaviour is an *accident of three unrelated guards*. What
survives a departure is rows: a binding pointing at a revoked credential, a delegation pointing at a
person who is gone, and no record that anybody decided anything. An admin cannot tell an orphan from a
live agent. That is `CC-101`'s class on the data side.

**★ And the donor vocabulary does not survive the identity model.** The bots analysis offered
*deactivate / leave / block*; measured here, `block` needs a policy store the platform does not have
(`CC-128`), and **"leave" cannot mean "keeps working"** — a binding's identity is a credential, and the
credential dies with its creator. So the flow offers **deactivate** (default) and **leave** (the row is
preserved, inert), and the receipt says the difference is *the record, not the capability*. An agent
that outlives its owner needs an identity of its own: `CC-121`'s instance, not a setting.

**The shape the requirement prescribes.** A preview (`GET /api/ai/departures/[userId]`) listing bindings
through **both** key links — `session_user_id` (the key *acts as* the person) and `created_by` (the key
was *minted by* them), where the existing cascade sees only the second. Then a departure (`POST`,
`{ decision }` defaulting to `deactivate`) that runs `auth.users.delete` through the command bus **with
the decision in its audit metadata**, so `auth` records a fact about agents without knowing what an agent
is. Then the cascade: bindings revoked **tenant-wide** — the existing `revoke` filters on
`organizationId` and would silently miss a binding in another organization of the same tenant, and a
person leaves a *tenant*, not an organization — and delegations revoked in **both** directions with
`revoked_by_user_id` naming the admin. `leave` writes nothing. Nothing is ever hard-deleted.

**The fail direction is the one that matters.** A cascade that throws *after* the delete returns
`departure_partial` and leaves orphan rows — **inert, never open**, because the credential was already
dead by two independent guards. A cascade that throws *before* it changes nothing. And the receipt is
built from the **write results**, not from the preview, so "deactivated" can never be printed over a
binding that is still live.

---

## 2026-10-18 (latest) — `CC-126`'s build: a tenant can create a type, and every refusal in the path has a mutation behind it

**The requirement was written in the previous phase; this phase built it.** The owner's *"bulk packaged
capabilities, so a standardised agent is cheap to create"* now has a tenant-side home: `AiAgentType`
(`ai_agent_types`, `tenant_id NOT NULL` always), a tenant-scoped repository, `lib/agent-type-catalog.ts`
as the single home for *"the catalogue in tenant T"*, the gate handed its subject at the five call sites,
routes at `api/ai/agent-types/`, and both read surfaces tagged. **Nineteen mutations, all proven** —
`scripts/verify-cc126-mutations.mjs` breaks the precedence, both PUT refusals, the collision mapping, the
retired-key rule, the picker's duplicate filter, the CHECKs, the unique index and the entity drift, and
the suites go red in the aimed case every time.

**★ Three things the build itself settled, recorded because the requirement could not:**

1. **Provenance is not derivable from a definition.** A tenant type carries `AGENT_TYPE_MODULE_ID` —
   `'ai_assistant'` — which is *also a real module id*, so `describe_agent` cannot tell a shipped agent
   from a tenant-authored one by reading the definition. `resolveAgentCatalogEntry` returns the layer
   alongside the definition and the precedence lives in that one function; `resolveAgentDefinition` is
   now a thin wrapper over it. One decision, one home.
2. **The read-surface policy on a shadowed row.** The catalogue lists it flagged; **a picker drops it.**
   Both pickers key their result by agent id, and a shadowed tenant row resolves to the platform's
   definition under that same id — listing both entries offers one id twice, which is a duplicate-key
   defect in the consumer. The shadow stays visible where it is actionable: `GET ...[key]` reports
   `shadowedByCode`, `PUT` refuses with *"Retire it to remove the shadow"*, and the list route shows the
   tombstone. Visibility belongs where a decision is possible.
3. **The five per-agent manage routes stay code-only, by decision rather than omission.** `bindings`,
   `loop-override`, `models`, `mutation-policy`, `prompt-override` each 404 an id neither layer holds —
   correct, and unchanged. A tenant type can be authored, resolved at the gate, picked and retired, but
   cannot yet be *bound or overridden* through its per-agent surface; that is `CC-122`'s build, and it is
   written into the requirement's §7 so it is a decision with a name.

**What the full suite caught, and the two traps it hid in.** The gate refactor broke one existing case:
`POST /api/ai/chat` returned 500 where it must return 404 for an unknown agent, because the route now
resolves its subject through the tenant layer and the test's container stubbed `em` as `{}` — a real
repository against a non-manager. Fixed the house way (the repository module joined the file's other
repository mocks) and a new test proves a tenant-authored type runs end-to-end through chat. Then the
mutation proof itself lied twice over: **jest reads a positional argument as a regex**, so the suite
pattern containing `[key]` matched nothing, ran zero tests, exited 0, and the harness reported "the
suite still passed" — two NOT PROVEN lines that were false. Escaping the brackets proved both mutations
red in three seconds. That is now `LESSONS.md` **L21** and the harness asserts the denominator
(`Test Suites: N passed, M total`) before it will call anything proven. A mutation proof's whole value is
"the suite noticed" — a suite that never executed has not noticed anything.

---
## 2026-10-18 (latest) — `CC-126`'s requirement is written: the owner's "cheap to create" needs a tenant to be able to *create*, and the row's own prescription was a sentinel in disguise

**No code this phase — the owner's rule is no code before a written requirement.** The deliverable is
`library/development/PLAN-CC-126-tenant-type-catalogue.md`, and what it records is a measurement, not a
design preference.

**The defect.** The type catalogue has one layer and it is code: `AiAgentDefinition` is an interface, the
registry is a module-level `Map` (`agent-registry.ts:16`) with `getAgent(id)` taking only an id (`:301`),
and every tenant-side row is an **override of a code-declared agent** — `AiAgentPromptOverride`,
`AiAgentRuntimeOverride`, `AiAgentMutationPolicyOverride`, `AiTenantModelAllowlist` — whose paired partial
unique indexes on `(tenant_id, [organization_id,] agent_id, …)` quietly assume the agent already exists in
code. So a tenant can narrow a type and cannot create one, which is exactly the owner's distinction: the
platform's *"bulk packaged capabilities, so a standardised agent is cheap to create"* works for the
platform and not for a tenant.

**★ What the measurement changed, twice over (Rule 13).**

1. **The row prescribes *"owning tenant or null for platform"* — and refuses the same shape one paragraph
   later.** `tenant_id IS NULL` meaning *platform level* is a value every query must remember to exclude:
   the `CC-103` class, a permit written as a default. The platform layer needs no row at all, because the
   code registry already *is* that layer — so the type row is `tenant_id NOT NULL`, always. That is the
   answer `RoleAcl.tenant_id` already gives (`NOT NULL`, *"Tenant scope is mandatory for ACL evaluation"*),
   including for system roles. The catalogue is the union of two homes, not one table with a magic value.
2. **The row's *"validated at write time as a subset of the platform ceiling"* cannot hold.** The ceiling
   has no store — that is `CC-128`'s own first measurement — and the tool registry is a mutable singleton
   (`registerTool`/`unregisterTool`), which is why the code catalogue itself tolerates unregistered names
   (`registered: Boolean(tool)`). So shape is validated at write and per-tool authority at run
   (`tool_unknown`). The ceiling check is named in `CC-128`, not faked here.

**Why the resolver is in the same change as the table.** `checkAgentPolicy` refuses an unknown id with
`agent_unknown` and `computeBoundRunScope` resolves `agent?.allowedTools ?? []` — an unknown id yields the
**empty** tool set. A type row without runtime resolution would be an agent that appears in the catalogue
and can never run: the `CC-101` shape, code that nothing calls. So the build is table + repository +
`lib/agent-type-catalog.ts` (code-first precedence, the key in the `ai_agent_bindings.agent_id` dialect so
it flows through the binding machinery unchanged, `layer: 'platform' | 'tenant'` tagging) + the gate handed
its subject at the five call sites + the routes + the read surfaces — and the instance/pin (`CC-122`), the
floor (`CC-125`) and the ceiling (`CC-128`) are refused by name.

**The security row in the requirement is the collision case.** A later platform deploy shipping a key a
tenant already squatted must resolve **code-first**: tenant-first precedence would hand a tenant a
wider-than-platform definition under the platform's own id, arriving silently at a deploy — D1's violation.
Code-first makes that unrepresentable, and the shadowed tenant row is *shown* shadowed in the catalogue
rather than silently inert.

**NEXT (register §2):** the build, in the plan's order — entity + migration → repository → resolver → the
gate's five call sites → routes → read surfaces → tests + mutation proof → record and commit.

---

## 2026-10-18 — `CC-129` closed: the row was half wrong, and the half it missed was the security half

**The defect, in one sentence:** the trust route took `principalId` as a free-form string while
`evidenceFor` joins `action_logs.actor_user_id`, which holds the **bare** id — so only the bare spelling
worked, and a caller who sent `ai_worker:<uuid>` (the spelling the principal's own `kind` field invites) had
its evidence look-up quietly return nothing.

**It fails closed, which is why nobody has reported it.** A promotion that requires evidence is refused, and
that looks exactly like *"this actor has not earned it yet"* rather than *"we asked the wrong question"*. The
first defect of the day failed the other way — `CC-124` permitted what it should have refused. Two failures
in one family, opposite directions, and the one that fails closed is the one that survives review.

**★ The chain rule earned its keep twice, and once by making the fix smaller.** Reading all four — CREATES ·
CHECKS · CONSUMES · DELETES — rather than the one the row named:

1. **The row's own prescription was half wrong.** It said to normalise `principalId` on the trust route
   *"and read with the same normaliser at `:426`"*. Measured: `decideFor` calls `parseSubject(subject)` at
   `authorityEnforcementService.ts:268` and passes `principal.id` at `:279`, and `parseSubject` **already
   strips any agreeing prefix**. So that reader is bare by construction, and a normaliser there would be a
   no-op that *implies* a guarantee the code already has. Rule 13 — the fix shipped is smaller than the
   record, and the record says why.
2. **The chain named the security half the row had not.** `promoteSchema` states the actor **twice** —
   `principalId` and `principalKind` — and **nothing ever checked the two halves against each other**. So
   `ai_worker:<id>` with `kind: human` names two different actors, and the platform trusted one of them
   silently: evidence looked up under the bare id, grant written with `principalKind: 'human'` on a row keyed
   by a machine's id. That is `CC-124`'s laundering shape arriving through a different door, and it was
   invisible in a row whose stated consequence was only "the promotion is refused".

**And grepping every caller, rather than trusting the one the row named, is what proved the two boundaries
are the only places a spelling enters.** `trust/route.ts:52,53` and `:91` (the boundaries);
`auth/di.ts:104`, a pass-through proxy whose consumer is `:426`; and `promote`/`demote`'s own internals. Four
methods, six call sites, two doors.

**Built:** both boundaries normalise. A disagreeing pair is refused **400 before the mutation guard is
asked** — ordering matters, because the guard records a resource, and recording one for a request that names
two actors would leave a trail for an act that should never have been attempted. The guard and audit
`resourceId` now use the normalised id, so a prefixed request and a bare one naming the same actor land on
**one** resource instead of two. **Refused by name:** a `kind` parameter on `tierFor`/`evidenceFor` — their
callers are already bare, and widening signatures to defend against a caller that does not exist is
speculative surface.

**Verified by mutation, not by confidence.** I reverted the route and re-ran the new tests: **7 of 9 went
RED**. The 2 that stayed green are the already-bare cases, which worked before the fix — that is the profile
a real test suite has, and a suite where all 9 fail on the defect would be asserting wiring rather than
behaviour. Auth module **96 suites / 840 tests green** (up from 95/831); core and shared typecheck clean.

**One thing is deliberately left open rather than closed:** `CC-124`'s migration rewrites three authority
tables, and **`authority_trust_grants` is not one of them**. A row written before this fix under a prefixed id
would still be unreadable. Measured: the route was the only writer and there is no evidence it was ever called
with a prefix — but *"no evidence"* is not *"no rows"*, so it is recorded as a follow-up, not a ✅.

---

## 2026-10-18 (last) — `CC-124` closed: a ban that did not ban, and the fix the donor reversed

**The defect, in one sentence:** the authority path's write side accepted any string while its read side
always passed the bare id, so a denial naming `ai_worker:<key>` was written, audited, listed and **never
applied**.

I measured it before touching it, and three consequences fell out rather than one:

1. **A machine was un-denyable** — fail-open. Write `ai_worker:<key>`, and the denial exists in every
   listing while `blocking()` matches `parseSubject(sub).id`.
2. **A machine-grantee delegation was inert** — fail-closed, which is why nobody had reported it.
3. **The self-delegation ceiling check could be walked past.** `delegations/route.ts:185` compared the raw
   request string to `principal.id`, so spelling your own key `ai_worker:<that key>` sailed through the
   authority-laundering guard.

**★ The donor re-read reversed the recorded fix, and this is the part worth keeping.** The row said
*"one canonical encoding, normalised at every write and read"* — which reads, on the page, as "store the
prefixed form". Then I opened the donor's source at the line the row pointed at: not the forensics digest,
the platform's own audit entity. `audit_logs.actor_user_id` is a **uuid** and states the rule on its own
column — *the subject is narrowed to one on the way in* — with the kind in a **sibling** column. And it is
not one table: `subject_kind`, `grantor_kind`, `grantee_kind`, `principal_kind` — the whole authority family
was built that way. So **the bare id is the convention, and the write path is what had drifted.** Had I
shipped the recorded version I would have added a *third* encoding while the correct columns sat unused.
The digest answered *"does the mechanism exist?"*; the source answered *"what is the best version of it?"* —
and the two answers were opposites.

The invariant that came out of it is the one to keep: **a prefix that disagrees with the declared kind must
throw, not be guessed.** A ban aimed at a machine must never land on a person because two spellings of one
string were accepted.

**Built:** `normalizePrincipalSubject` + `principalIdOf`; both routes refuse a disagreeing pair with a 400;
`withhold`/`grant` normalise on write; the ceiling check compares (id, kind); `rbacService` passes the kind,
so a machine's denial is filtered by what it *is*; and a migration that strips an agreeing prefix from every
existing row, raising a Postgres **warning** on a disagreeing one and **leaving the row** — the migration
does not guess either.

**★ The chain rule did the second half of the work.** Reading all four — who CREATES, who CHECKS, who
CONSUMES, who DELETES — instead of the one the bug report named found two more of the same defect in the
same pass: `CC-129` (trust evidence joins on the bare id, fails **closed**, so it is invisible until
somebody looks for it) and `CC-130` (a third free-form column, no production caller — blocked until it gets
one). Naming the row twice in one pass is cheaper than rediscovering it twice.

**And the second-order effect, re-derived rather than typed:** `CC-123`'s only trigger was `CC-124`, so
closing it makes `CC-123` startable. §4 is now **17 startable · 1 DB · 5 you · 41 blocked** across 64 rows.
While re-deriving I found §2 still carried a third hand-copied tally reading `16 · 1 · 5 · 40` — it had
**never moved when `CC-128` was added**, and §4's own counted line had already moved past it twice. Rule 13,
committed by name, with the note that §4's line is the only copy that is counted.

**Two things I would have missed without running the whole suite:**

- **`packages/core` was red, and not from my work.** `explicit-sort-comparators.test.ts` caught
  `scripts/check-two-reads.mjs:184` and `scripts/check-escape-hatches.mjs:186` doing a bare `files.sort()` —
  while the audit's own docstring forbids exactly that for `scripts/`. **Two declared controls violating
  themselves.** Two-line fix, no behaviour change (path arrays are strings). I had touched neither file,
  which is the point: a red build is a red build.
- **`packages/shared` reports one failed suite and zero failed tests.** Jest says `Tests: 2594 passed, 2594
  total`; the failure is an `afterAll` that removes the suite's own temp cache, blocked by this sandbox's
  delete guard. The suite is `dynamicLoader.tsconfig.test.ts`, which imports nothing this change touches
  (`dynamicLoader.ts` reaches `appResolver`, `entityIds`, `generatedCacheRecovery` — no `auth/`). So the
  honest record is *the assertion set is green; the cleanup step is blocked by the sandbox* — not "flaky".

**One more, measured while committing:** `.husky/pre-commit` exists and does i18n + template sync — and
`git config core.hooksPath` is **unset**, with `.git/hooks/` holding only `.sample` files. So the hook has
**never run in this clone**, even though `package.json` declares `"prepare": "husky"`. This commit touches
no i18n or template files, so nothing is hidden this time; but it is the same class as everything else
here — **a declared control that does nothing** — and it belongs beside `CC-115`'s census rather than being
noticed by luck.

**★ And the most consequential one of all, found while proving that commit had not corrupted a single
byte: `git config core.autocrlf` is `true` in this repo and there is no `.gitattributes`, so the NEXT
checkout would have rewritten every text file to CRLF.** That includes `MASTER-CHECKLIST.md`, whose whole
measurement discipline is byte truth — *"a bare-word grep is NOT a declaration census"*, and the check
behind it is `tr -cd '\r' < f | wc -c`. A CRLF checkout makes `grep -c` lie in exactly the way the
standing hazard warns about, and it would have done so **silently, on an ordinary `git checkout`**, long
after this session. **I measured before fixing, so the fix is provably inert:** not one **text** file in
HEAD contains a CR — the only five that do are binaries (`companai.ico`, `companai.png`, two PDFs, one
`.docx`), where a CR is data and not a line ending. So `.gitattributes` now pins `* text=auto eol=lf`, with
the binaries marked `binary` **afterwards** — order matters, because the last matching rule wins and a
trailing wildcard would erase the override. **Proof, not assertion:** `autocrlf` is still `true`, and a
forced `git checkout --` of the checklist now leaves **0 CR bytes** and a byte-identical file, while a
re-checkout of the `.png` leaves its **sha256 unchanged**. No blob moved. This is `CC-131`, and it is the
first defect I have found whose damage was scheduled for a moment nobody was watching.

---

## 2026-10-18 (later) — the owner found the layer that isn't there: no platform ceiling over tenants

The owner's sentence, after being told agents are always tenant-scoped: *"one architectural flaw this
discussion exposed, the lack of control of platform superadmins on what is allowed or not within each
tenant… If each tenant has its own superadmin, then later we will need to develop a control hub on the
top of all that."* He asked for it **documented as a note, to revisit**, then to proceed.

**He was right, and the measurement is worse than "no ceiling".** Four reads, none of which had been
taken before in this project:

1. **No place to store a ceiling.** `Tenant` is `name`, `is_active`, timestamps. No plan, feature, limit
   or settings table exists in `packages/` at all. So D1's answer — *the platform admin sets the ceiling,
   a tenant narrows it* — is correct and **has no column to live in**. `CC-125`'s ceiling now has an
   ordering constraint it did not have an hour ago.
2. **"Platform level" is a tenant row read globally.** `UserAcl.tenantId` and `RoleAcl.tenantId` are
   `uuid NOT NULL` — *"Tenant scope is mandatory for ACL evaluation"* — yet `isGlobalSuperAdmin` queries
   with **no tenant filter**, and `loadAcl` returns `features: ['*']` **before the requested scope is
   read**. A superadmin of one tenant is a superadmin of every tenant. **This is the second encoding of
   "platform level"** the red team counted in W8 check 1 — and it is the load-bearing one.
3. **The door is a cookie.** `applySuperAdminScope` overwrites `tenantId` from the tenant cookie and sets
   `isSuperAdmin = true`, with **no membership check** — there is nothing to check against, because no
   table records which tenants a person belongs to.
4. **The flag can be minted from inside.** `PUT /auth/users/acl` takes `isSuperAdmin` and, when the
   actor's ACL is superadmin, **skips every target guard** before writing. A tenant's superadmin can
   make more *global* superadmins.

**Why it is bigger than the agent spine, and why it was invisible from inside it:** an agent is always
inside a tenant (correctly), so *"an agent that serves the platform's superadmins"* has nowhere to live
until **the platform itself has a place to be**. The placement question and the control question are one
question. Every review in this session read the agent tables and the authority chokepoints; none of them
asked *"what limits a tenant"*, because none of them was asked to.

**Recorded, not built** — plan §4.6, register `CC-128`, and the owner's direction kept in his own words:
**instance 1 / a foundational tenant** where settings, templates and functionality are authored; other
tenants **inherit or are limited to what it allows**; a new capability needs **one place to be switched
on** plus a per-tenant free-vs-subscription answer; and *"changing platform architecture"* belongs at
platform level — i.e. on the **floor** (`CC-125`), not in a tenant bundle. **The decision left open, and
it must be made before `CC-125` is built rather than during it:** does the platform superadmin live *in*
the foundational tenant (a tenant with extra rights — two meanings of "tenant", which is this code's
current ambiguity) or *above* every tenant (the first genuinely platform-level table)? **Refused by
name:** a sentinel tenant id for "the platform" — a value every query must remember to exclude is a
latent cross-tenant read, the `CC-126` refusal for the same reason.

Register: **64 closed · 63 open · 127 total**; §4 tally **16 · 1 · 5 · 41**. Checker green.

## 2026-10-18 (earlier) — I read "types" as "agents", and explained an architecture with a business example

The owner's reply was blunt and correct: *"This makes absolutely no sense… what is on this platform I built
a school management system. How is any of what you said above stay relevant to anything? When we build we
don't build to serve a certain business case (like crm, sales, etc.), we are building an architecture."*

**Two errors, and they compounded.**

**1. I read the wrong noun.** His sentence was about **types** — *"all that can be on an overall platform
level or by tenant"*, said of *"all the types and settings of agents"*. I turned it into a question about
**agents**. So I went looking for a place to put a tenant-less agent, found that every table requires a
`tenant_id`, and reported that as a defect. **It is not a defect. It is the design working** — an agent is
a thing that acts inside somebody's data, so 12 of 12 agent tables requiring a tenant is exactly right.
I had written *"platform level has no schema home"* about a constraint that should have no exception.

**2. I explained a structural question with a business story.** "A support assistant every customer can
talk to" is a *product feature*. The owner is building an **architecture** — the school management system
is one tenant-shaped application on top of it, not the thing being designed. Using a vertical example made
a structural question look like a feature request, which is why it was unanswerable: **there was nothing
in it to decide.** The rule this produces, and it is now in the working rules: **when explaining a design
decision, the example must be structural, never a business case.**

**What is actually true, restated.** A **type** has two layers — shipped by the platform, or created by a
tenant from the same capability catalogue, exactly how roles already work. An **agent** is always inside a
tenant. **D3 is void; there was no question.**

**And the misreading surfaced a real gap, which is the only useful thing to come out of it.** The type
catalogue has **only a code layer**: `AiAgentDefinition` is global code from a generated registry, and the
only tenant-side rows are *overrides*. So a tenant can **narrow** a platform type and cannot **create**
one — which means the owner's *"bulk packaged capabilities, so a standardised agent is cheap to create"*
works for the platform and does not yet work for a tenant. **`CC-126` is rewritten to that**, and it needs
no ruling. Register §4 re-derived to **16 · 1 · 5 · 40**; the only question left on the whole spine is the
**floor** (`CC-125`).

---

## 2026-10-18 — the questions were the defect, and the owner's model was better than mine

Two things happened in one message, and the second is the more important.

**First, the questions.** I asked four rulings in one message, in this project's own vocabulary:
*"what may a machine never hold"*, *"live or frozen"*, *"what does platform-level own"*. The owner could
answer one, gave a general principle for two, and said of the third: *"I have absolutely no idea what you
are saying."* **That is a defect in the question.** And the worst part is that **`WORKING-RULES.md` §2.2
already said "at most ONE question"** — the rule was not missing, it was not followed. So the note is now
at the **top** of that file, where it cannot be missed: rewrite the question to the **14-year-old test** —
one everyday example, no project words, answerable in one sentence by somebody who has never opened this
codebase — and **if a sensible default exists, take it and say so** instead of spending his attention.

**Second, and this is the part worth keeping: the owner supplied the model I had been circling.**
*"Agent capabilities will be identified by what we select for this agent from the full capacity available
for AI agents. Types are like roles for permissions in human users — some sort of bulk packaged
capabilities that makes creating new AI agents with standardised capabilities possible."*

That is right, and it dissolves the tension I had turned into a false question. I had been asking "may a
type be a setting?", which conflates two different things that share the name:

- **a type as a bundle of capabilities** — a role for agents. Data. Good, and it is what makes
  "standardised agents" cheap to create.
- **a type as a selector of the permission rule** — the badge problem. Never a setting.

So the chain is `platform ceiling → type → instance → binding`, each a **subset** of the one above, and
one consequence of the role analogy has to be built in rather than discovered: **a role is edited and the
edit reaches everyone holding it**, so an instance must **pin the type version it was hired with**, or
"standardised capabilities" quietly becomes "re-standardised without asking" (`CC-122`).

**And his principle answered D1 and D2 without needing the question I had written.** *"Can't we dictate
such limitations across the platform by the platform superadmins (and tenants' admin capabilities to
decide on that gets inherited by superadmin allowed settings)? Instead of hardcoding it."* **Yes, and it
is better than a hardcoded list** — the same safety property with the control in the right hands. So D1
becomes configuration with one narrow remainder: the **floor**, the capabilities no configuration may
raise, because a machine that can grant itself authority makes every other control decoration.

**D2 I stopped asking.** "Live or frozen" has no legitimate setting on the frozen side — "keep the powers
my owner lost" is a defect, not a preference — so rule 2.2 applies: take the safe default, say so, let him
override. **D4 he answered himself:** the admin doing the deactivation decides about the related agents,
so `CC-127` becomes a **departure flow that lists them and asks**, defaulting to deactivate-never-delete.

**One question survives, and it is now written to the test he set** (`PLAN` §4.5): is a platform-level
agent a **job description** (a template a customer hires, so it only exists inside a customer) or a
**platform employee** (it exists on its own, and then whose ledger, who pays, who switches it off)?
Recommendation: the job description, because it is reversible and it already gives the employee what it
would need.

Register **64 closed · 62 open · 126**; §4 re-derived to **15 · 1 · 6 · 40**; checker PASS.

---

## 2026-10-18 — the strategy was right in direction, wrong in one field, and the donors I had left out were the two that mattered

The owner stated the agent strategy in full: **one agent**, whose behaviour differs by settings, covering
the types — **Aissistant** (an assistant hired by a user; one or many; authority is the intersection of the
user's and the assistant's), **Staiff** (an AI user with roles, behaving like a normal user) — at platform or
tenant level. Then: add it organically to core, adapting both sides, and do the same for workspaces,
workspaces↔ai_agents, Automation and widgets. He asked for a verdict on the strategy and a task breakdown
reviewed by seasoned experts, so that the work stops drifting.

He also caught a real omission: **Paperclip and Hermes were absent from my two analyses.** He was right, and
the reason matters. Those analyses answered *"what is a bot to a room"* — Zulip, Multica, Buzz, Slack. They
did not answer *"what is an agent"*, and the two donors that do are the ones I left out: Paperclip is our
**ancestor** (four separable layers, a gated hire, finite runs), Hermes is the **engine** (profile, soul,
skills, memory, tools). That was a scoping error and it is corrected in the plan, where they become the
primary donors for the spine.

**What I did before writing anything.** Four measurements of our own code, because the strategy's feasibility
is a fact about the codebase and not about the strategy:

1. **Agents are declared in code and never hired.** `AiAgentDefinition` is a code object loaded from a
   generated registry; the twelve DB entities are overrides, bindings, runtimes and conversations, and **not
   one is an instance**. So `agentId` is code-declared — two tenants' assistants are *the same object* — and
   "one user, many assistants" has no row to live in.
2. **The narrowing already exists and is the right shape.** `AiAgentBinding` narrows tools ("a binding can
   narrow, never widen", B3) and unions required features. That is the template, not the gap.
3. **A machine already resolves roles — from its credential.** `rbacService.loadAcl` reads
   `api_keys.roles_json` → `RoleAcl` for API-key-backed kinds. So a Staiff's *authority* is not missing;
   everything that makes it a *person* is.
4. **Delegation exists with a ceiling that narrows** — capability-scoped, non-null expiry and reason,
   revocable, never cached, and the grantor-holds check `CC-94` added.

**Then four independent reviewers, each given code paths rather than a summary.** What they changed:

- **The intersection, as stated, is unsound — and this is the largest correction.** "Keep what both have"
  only works if both sides are the same kind of thing. Ours are not: `*` means everything (so intersecting
  strings denies everything); `.own` is a **separate capability**, not a suffix (so merging it widens row
  scope); a superadmin short-circuits **before** features are read; a denial is **subtracted after** the
  grant; a delegation is **added after** the grant says no and does not re-check the grantor. **Intersect
  answers, never lists.** And the mechanism to do it already exists — `invokerCeilingFor` — reached only
  through `decideFor`, while the HTTP RBAC path is the one door that does not pass an invoker and
  `refusalFor` returns `null` unless the mode is `enforce` (armed for no tenant, `CC-11`). Built, proven,
  reached by nobody: the `CC-101` shape again.
- **A fail-open defect found while measuring, and re-verified at source.** `AuthorityDenial`'s own docblock
  says the encoding for a machine is `api_key:<id>`; `DenialService.blocking` matches the **bare** id and the
  route does not normalise. So **a denial written the way the schema documents is accepted, audited, and
  never applies — a ban that does not ban.** The same mismatch makes a machine-grantee delegation silently
  inert and lets a self-delegation slip past the ceiling check. `CC-124`, startable now.
- **Per-user instances are not viable**, with numbers: 200 users × 2 assistants = 400 homes, 2–8 GB per
  tenant, 400 SQLite files to back up and delete atomically on one shared volume with no per-tenant
  boundary. **Per-tenant home, per-user state.**
- **"Platform level" has no schema home** — `tenant_id` is NOT NULL everywhere, and a sentinel tenant id is
  refused by name: a value every query must remember to exclude is a latent cross-tenant read.
- **The avoided decision**, named by the hostile reviewer and the most useful sentence in the review: *is an
  agent a principal in its own right, or only ever a human's hands?* — and *"same agent, different settings"
  is the mechanism for not answering it.* That is why the four rulings come before any code.

**The verdict written down:** the direction is right; **"type" must not be a setting**, because a field that
selects the permission algorithm is the confused-deputy shape — the type is a **name for three facts set
once at hire** (identity · standing · placement), and every setting may only **narrow**. And the order is
wrong in one place: the four surfaces are not peers, so the spine lands first and **chat** proves it.

**Seven register rows, `CC-121`…`CC-127`** — all measured defects or missing prerequisites, none a wish.
Register **64 closed · 62 open · 126**. And one stale number fixed by name under rule 13: §4's prose said
*"14 … 3 need a decision"* while its table held *"13 … 4"*, typed and drifted in both directions.

**What this turn did not do:** no code. The four rulings are the owner's, and the plan says so.

---

## 2026-10-18 — the question I was asking was the wrong question, and the owner said so

The owner's message was, in effect: *I have no idea what any of that means, you are defying the rule of
explaining it so I can understand it.* That is correct, and the diagnosis is worth keeping.

**What I had been doing.** I reported `CC-120` as a choice between "the credential axis" and "the addressed
agent". Both are answers to *"which field feeds `ctx.agentId`?"*. Neither is the decision the product needs.
The owner could not decide because **there was nothing to decide** — the framing was a technical fork with no
consequence a person could weigh.

**What the decision actually is.** Whether a machine may hold access **in its own right**, or only ever as
somebody's hands. And the answer is not open: the code already chose the second, silently, because
`assertContext` requires `ctx.userId` unconditionally while the type's own comment (`:38-43`) says an agent
caller *"still carries the person it acts for in `userId`"*. **A default in a validator is an architecture
decision that nobody argued for.**

**What the research found.** Four donors, read at source, plus one standard:

- **Zulip** — the bot IS a `UserProfile` (`is_bot`, `bot_type`, `bot_owner`); access is a `Subscription`; the
  API key resolves straight to the identity because the key lives ON the identity row. No bridge, because no
  refusal.
- **Buzz** — *"AI agents and humans are first-class equals"*; the agent has its own keypair and
  `users.agent_owner_pubkey` links it to an owner.
- **Multica** — a `mat_` task token carries `(user_id, agent_id, task_id, workspace_id)`; the middleware
  **strips** client-sent `X-Agent-ID`/`X-Task-ID` and re-stamps them from the token row. The comment records
  why: both ids were readable by any workspace member, so a member could replay a live pair and be resolved
  as that agent (MUL-3428, fixed in #4313). **That is the exact bug shape the owner's ruling refused, found
  in the wild, in a donor.**
- **Slack** — bot tokens read only *"any conversation the relevant bot is a member of"*; `not_in_channel`
  otherwise. A bot is strictly less privileged than a person.
- **RFC 8693** — a delegation token carries `sub` (who it is for) and `act` (who is acting). Our
  `effectiveUserId` is `sub`; our `agentAxis` is `act`. We re-derived a standard, which is a good sign.

**And the measurement that made the whole framing moot.** `getTranscript` has exactly one caller — the
transcript route — and that route passes `userId: auth.sub` (`[conversationId]/route.ts:167`). For a machine
`auth.sub` is `ai_worker:<uuid>`, and `loadParticipantFlag` puts it into a **`uuid` column**. So a machine
caller gets `22P02` from Postgres — a 500 — **before** the access check runs. The one door an agent would use
is not missing a key; it is broken. Same class as the defect `CC-107` increment 1 fixed in the chat route,
in the route that was missed.

**Conclusion recorded, not acted on:** do not build the bot's door now (`SR-12` does not exist, so there is
no caller — the exact defect `CC-120` was opened to remove); fix the broken line; adopt Multica's hybrid as
the target shape when the daemon exists. Analysis: `ANALYSIS-2026-10-18-agent-identity.md`.

**Lesson.** *"Explain it so I can decide"* is a test of the analysis, not a request for a summary. If the
decision cannot be stated as a consequence a non-implementer can weigh, the analysis has not been done —
it has only been formatted.

## 2026-10-18 (early) — `CC-120`'s bridge, and the version of it I deleted before committing

The ruling was **the credential axis**: an `ai_worker` credential, not the agent a request happens to name.
So the first job was to find out what a credential actually carries — and the answer was that **the bridge
already existed**. `resolveAgentBinding` has always called `findBinding(principal.id, agentId, ctx)`, where
`principal.id` is the API-key id and `agentId` is the registry id; `ai_agent_bindings.principal_id` is
documented as *"the `api_keys` id of the AI-user principal"*. Nothing read it for this purpose, which is a
different defect from having no bridge at all.

**The donor, read at the line the row cites.** Zulip resolves an API key **straight to the identity**:
`get_user_profile_by_api_key(api_key)` then `request.user = user_profile`
(`zerver/decorator.py:313-334`). There is no bridge because the key lives **on** the identity row, and a bot
authenticates as itself. `bot_owner` is administration (`users.py:781`) and message routing
(`bot_owner_user_ids`), never *who the credential is*. We refuse "agents are rows in the auth User table",
so our credential is a separate object — **the bridge is the price of that refusal**, not an accident.

**What shipped:** `resolveAgentBinding`'s bound arm reports `agentAxis` — `agentId` for a bound
`ai_worker`, `null` for a human — so the function that *proves* the claim is the function that *reports* it.
One resolution, no second source of truth. Three mutations, three RED, including the negative that matters:
setting the axis for humans too fails the pre-existing exact-`toEqual` assertion on a human conversation
context, which is an independent confirmation that the human path was already pinned.

**Then I deleted the rest of it.** The obvious next step was to thread `binding.agentAxis` into the chat
route's two context builders, and I wrote it, ran it, and it was green. Then I checked what those contexts
*feed*: `createOrGet` and `appendMessage`, both of which are owner-only and **never consult the axis**. The
only readers are `loadParticipantFlag` — called from `getById` alone — and `list()`'s union, and **no
machine-facing route reaches either**. So the wiring would have been inert: a value produced into a context
whose consumers ignore it. That is `CC-101`, the row I opened six hours ago to remove exactly this. Reverted;
the chat route and its test are byte-identical to `HEAD`.

**The uncomfortable sentence, written down rather than softened:** `CC-120`'s original claim — *"the read
path is proven and unreachable"* — is **still true after the bridge lands**. The bridge closed the
**identity** half. The **surface** half is that a machine has no route to the read path at all.

**Why I did not just build the surface.** The requirement is written (`PLAN-CC-120` §7.1): the axis is a
**set** (a credential may hold several bindings, and `listForPrincipal` already exists), and the minimal
consumer is the transcript route. But that **expands what a machine credential can read over HTTP** — a
security-bearing change, and the same rule that made the producer a question in the first place. The cheap
version is refused by name: set the axis from the agent the request names, which needs no lookup and lets
any credential that can name an agent read that agent's conversations. Authorisation by request parameter.

**Measured after:** 135 suites / 1,996 tests, `tsc` 0, 3 mutations RED. `CC-120` stays open, half done, and
says which half.

---

## 2026-10-18 (early) — the read half proven, and the test that was green for the wrong reason

`CC-107` had been carrying the same sentence for a day: *"an agent can be **written** as a participant and
nothing proves it can **read**."* Two gaps, and closing them took six tests — of which the interesting one
was the gap that was **already closed and did not work**.

**Half 1, the missing test.** `GET /participants` serialises both axes, and nothing tested it: all four
tests added at `8c56428e` were POST-only. The new test fails unless the response carries `agentId` for an
agent row. That matters because `userId: null` alone cannot distinguish a bot from a malformed human row —
which is the entire reason the second axis exists.

**Half 2, the test that proved the wrong thing.** A block titled *"an agent caller reads through the agent
axis"* was already committed at `6b78a0ac`, and reading it was the useful part: its fake `findOne` returns a
membership row for **any** filter carrying an `agentId` key. So it proves the agent branch is *consulted*,
and it would stay green if the repository looked up the wrong agent, or no agent at all. **A test that is
green whether or not the control is right** — the failure mode this project has already paid for once, in
a mutation harness that could not see a red test.

The replacement runs over a store whose `findOne` matches real filter values, so the assertions can be
specific: the member agent reads; a **different** agent does not; no membership is refused; `list()`
surfaces it to the member and hides it from another (a separate code path — the axis union, not
`loadParticipantFlag`); a revoked membership stops granting. **4 mutations, 4 RED**, each on the test that
names it, every file restored byte-identical.

**What the tests found that they could not fix.** `ctx.agentId` **has no producer.** It is read in two
places and written by nobody: every `agentId` in the conversation routes is a *conversation field*, a
*target identity* being granted, or a *path parameter* — never the caller's machine axis. The chat route
builds its repository context with `{ tenantId, organizationId, userId }` and nothing else. So the read
half is **proven and unreachable**, which is `CC-101`'s shape exactly (*a checker nothing calls*). Opened as
**`CC-120`** rather than patched, because the two candidate producers claim different things: the credential
(`ai_worker:<uuid>`, with no bridge to a registry id like `catalog.assistant`) is the correct claim and needs
an identity mapping that does not exist; the agent being *addressed* is cheap and wrong, because it grants
on the strength of which agent the turn is for rather than who is calling. **No code before that ruling.**

**A smaller one, recorded not blessed:** `revokeParticipant` runs the *grant* validator, so it demands an
`agentOwnerUserId` for an identity it then discards — a revocation grants nothing. The HTTP route supplies
the acting user, so no caller breaks; if a second revoke caller ever appears it will trip on a requirement
with no reason behind it.

**The idle-pruning exemption is now recorded as the RULE it always was** (§10.9): a participant whose
`agent_id` is non-null is not a person and is exempt from human idle-pruning. It is a constraint on the
future prune, because there is no participant prune to exempt today.

**Measured after:** package **135 suites / 1,995 tests** (1,989 + 6), `tsc` 0. Register **64 · 55 · 119**;
`CC-107` closes, `CC-120` opens. Both checkers PASS. **The honest state of "a bot is a participant": the
participant machinery is complete and the caller that would use it does not exist yet.**

---

## 2026-10-17 (late night) — the red cleared, and the stale test was covering a duplicate index

The package had been red for hours: **4 suites / 25 tests**, and every commit since had measured a surface
that excluded them. Clearing it took two test-side changes — and the first one turned out to be the
interesting one.

**Class 1, the mocks.** `e8ecde6d` (`CC-103`) added `requirePrincipal` to `api/chat/route.ts:291`, and
three suites' `jest.mock('@open-mercato/shared/lib/auth/server')` factories still exported only
`getAuthFromRequest` — so every POST died with *"requirePrincipal is not a function"*, a 500-shaped symptom
of a mock that had fallen behind its module. The same route's **newer** suite already had the right
factory, so this was not an unknown pattern; it was three files nobody re-opened.

**Class 2, the index — and what it was hiding.** `schema-unique-indexes` pinned the column order of
`ai_chat_conv_participants_active_conv_user_idx`, and `6b78a0ac` had reordered that index to lead with
`user_id`. Reading the entity to fix the expectation showed why the reorder mattered more than it looked:
`tenant_org_user_conv_idx` **already** had exactly that column list and exactly the same
`where deleted_at is null` predicate, and neither index is unique. **The table now carries two identical
indexes**, both maintained on every insert, update and delete — and the migration is where it happened: it
drops and recreates `tenant_org_user_conv_idx` in the same identity-first order.

**The uncomfortable part is the ordering of events.** Had I "fixed" the test first and looked no further,
the red would have gone away and the duplicate would have stayed. **A stale assertion is evidence, not
noise** — it goes stale *because* something changed, and the job is to ask what.

**Not fixed, deliberately.** Dropping one of the two indexes needs a migration and a decision about which
name survives; `CC-119` (the database rebuild) is where the chain gets proven, so it is scheduled there
rather than bolted on. Recorded in `CC-107`'s row and the plan's §10.3/§10.7.

**Measured after:** 4 failed / 25 failed tests → **4 passed / 40**; full package **135 suites / 1,989
tests, all passing**; `tsc` 0. Register unchanged at 63 · 55 · 118 — `CC-107` stays open for its two
agent-axis tests and the idle-pruning rule.

---

## 2026-10-17 (night, later) — `8c56428e`'s docs pass: three documents that told the next agent to build what already existed

The code landed at 20:03 and the session died at 20:04, one sentence into the documentation. So for the
rest of the evening `PLAN-CC-107-bot-participant.md` §10.5, `MASTER-CHECKLIST.md` §2, the `CC-107` register
row and the memory all asserted the same false thing — *"the participants POST body still accepts only a
uuid, so adding an agent participant over HTTP is not yet reachable"* — while the route had accepted either
axis for hours. **That is the worst kind of stale doc: not vague, but confidently wrong in a direction that
costs work.**

**What the pass corrected, and why each correction is a different kind of defect:**

- **A missing item, not a stale one.** §8's progress table had no row for the POST body at all, so it read
  "7 of 8" while a whole surface was unreachable. Added as **7b**, with the reason written down: an item
  that never existed cannot go stale, and it is the harder one to notice.
- **A rule misclassified as code.** Item 8, "idle-pruning exemption", reads like pending work. There is
  **no participant pruning anywhere in the repo** — only run-registry pruning and OpenCode session-idle
  detection — so there is nothing to exempt. It is a **rule to record** for whoever builds pruning.
  Leaving it ⬜ implied code was owed that nobody could write.
- **A proof number that did not reproduce.** "105 suites / 1,553 tests" appears in §10.4, the register row
  and the memory. It is a **subset** — repositories + api + cli + lib — and `data/__tests__` was outside
  it. The package measures **135 suites / 1,989 tests and is RED**. Rule 13: the number was committed as a
  package claim, so the fix is committed by name rather than quietly replaced.
- **A sentence that had lost its subject.** §2's `▶ IN PROGRESS` paragraph carried a fragment — *"Then
  `SR-12` (per-tenant engine home). It is a bot-as-participant: two partial unique indexes, …"* — left
  behind by an earlier edit. Removed; the paragraph reads as one argument again.

**The red is recorded as NEXT, not as a footnote.** Two causes, neither from `8c56428e`: a stale
index-order assertion left by `6b78a0ac`'s deliberate symmetry change, and three chat-route suites whose
`jest.mock` factories never learned `requirePrincipal` when `e8ecde6d` added it. **A red tree makes every
later green claim untrustworthy**, so it is cleared before `SR-12`, not after.

Register unchanged at **63 closed · 55 open · 118 total** — `CC-107` stays open, because two agent-axis
tests and one rule are genuinely outstanding. Checker: PASS.

---

## 2026-10-17 (night) — `CC-102` closed, and the throwaway database caught a defect all 24 tests walked past

`SR-02` slice 2 is done. Slice 1 had shipped a table whose `deleted_at` column had **no writer at all**, a
`register()` that **threw on every daemon reboot** where the donor upserts, a caller-supplied-text
`daemon_id`, no liveness writer, and a null-org caller that slid silently to the deployment-wide engine
fallback the registry's own docblock forbids. All five gaps are closed across three increments
(`b36e4ffa`, `2f372248`, `cd1ec88e`), and the CLI gained the writer — `runtime:register`,
`runtime:retire`, `runtime:touch` — because a `retire()` with no caller is the same defect the row was
opened to remove.

**The thing worth recording is not the work, it is the proof running anyway.** The plan promised a
throwaway-PostgreSQL check for the liveness migration, and I had written off a previous batch's equivalent
as *"not applied to a database here (none available)"* — which was true of the project's own database and
false about what could be checked. Docker was there the whole time. So the probe ran, and its **first
write failed**:

```
null value in column "created_at" of relation "ai_agent_runtimes" violates not-null constraint
```

`register()` supplied `last_seen_at` but omitted `created_at` and `updated_at` — both `NOT NULL`, no
database default. The entity's `onCreate` default is ORM-level and never fires on a raw-SQL path. Real
Postgres would have refused **every first registration**, while all 24 tests passed, because a fake EM has
no database. Fixed, and the fake now enforces the same constraint so it cannot return silently — reverting
the INSERT turns 8 tests RED.

**Then the honest part.** Two of the probe's own queries were broken. One failed loudly (`indispartial`
does not exist in `pg_index`). The other **failed silently**: `array_position` returns NULL for
`int2vector`, so a key-direction `CASE` fell through to its `ELSE` and reported `ASC` for both columns —
the opposite of the truth for the one that mattered. It looked perfectly well-formed and it was wrong. The
truth was in a column I had not read because I had not needed to. Banked as **L181**: a proof instrument
that fails quietly hands you a confident wrong answer, and a tidy table is a claim rather than evidence.

**What closed:** register as the donor's upsert with the partial index's predicate spelled and
`(xmax = 0) AS inserted`; `retire()` idempotent and scoped like the reads; `touch()` setting
`last_seen_at` and nothing else so `updated_at` stays clean; uuid-validated `daemon_id`; and
`organizationScope()` widening an org caller to the tenant-level rows while **refusing** the ambiguity that
creates. The probe is committed beside the migration with its run command. Register moved **62 closed · 55
open · 117 total → 63 closed · 54 open · 117 total**, and `CC-107`'s trigger — *after `CC-102`* — has
fired, so `SR-07` is startable now.

---

## 2026-10-17 (late) — the master checklist became ONE file (owner ruling: no more two-mirror drift)

No code was written. The owner read the top of `MASTER-CHECKLIST.html` and asked whether it was really
still there and really updated — and in doing so found the defect this session had been walking past for
two days. **It was right, and the measurement backs it.**

**What was measured, not argued.** The same content lived in two hand-synced files. The
`MASTER-CHECKLIST.html`'s **"Open work — every unfinished item, with its trigger" view held 29 of the 54
open register rows — 25 behind**, and every one of the eleven new `CC-101`…`CC-111` findings was in the
missing 25. The markdown twin had caught up; the HTML had not. Meanwhile the *headline* numbers in both
files were correct — 47 rows, 12 phases, 32 done / 9 partial / 4 open / 2 absent, and 78 of 321 units —
because the HTML **computed** its headline and the twin **typed** it, and the typed copy carried exactly
one stale figure: *"11 phases"* where the truth is 12.

**★ That is the whole lesson in one sentence:** the drift was invisible because the *numbers that were
computed* looked maintained, so nobody re-read the *list that was typed* — and a quarter of the open
work had quietly fallen out of the view. **A typed count drifts; a counted one cannot.**

**What was built.**

1. **`library/development/MASTER-CHECKLIST.md` is now THE ONE document.** 485 lines, where the old twin
   was 1,072 — and **442 of those lines were the expanding frontier stack** the owner named as the thing
   that gets harder to track. §2 is now two lines: one LAST DONE, one NEXT, and a pointer to this file
   for the history. **§4 is a complete 54-row table** — every open register row, each with its trigger and
   its state (11 startable now · 1 needs only a live database · 3 need an owner decision · 39 blocked on
   a named trigger). §5 (the register), §6 (the platform study) and §7 (the SR requirements) carried over.
2. **`scripts/check-master-checklist.mjs`** — re-derives §1's headline from §3 row by row (the row total,
   the phase count, each status tally), requires §4 to list every open register row **in both
   directions** (an open row with no line is a defect; a line for a closed row is a defect), and checks
   §4's and §5's own count lines. **11 checks, all PASS.**
3. **`scripts/__tests__/check-master-checklist.mutations.mjs`** — **5 mutations, all RED**: flip a §3
   status while §1 keeps the old tally · delete a §4 open row · change §5's count line · invent a
   dangling `CC-999` · change §4's own count. The file is restored byte-identical after each run and the
   unmutated run re-passes.
4. **`scripts/derive-counts.mjs`** — re-derives the one number from `platform_points.md`'s appendix
   boxes under the rule already written there (A–K; `- ` is a whole point, `- ` **with** `▸ n/N` is a
   split parent, `-   - ` is a sub-point, and **a line with no box glyph is prose, not a unit** — that
   last clause is what stopped the over-count, because indented *"(was PART)"* notes all start with `- `).
   Measured: **A 11/31 · B 7/38 · C 14/28 · D 4/39 · E 2/18 · F 0/14 · G 33/74 · H 1/13 · I 5/35 ·
   J 0/18 · K 1/13 = 78 / 321 = 24.3 %**, reproducing the claimed figure exactly.
5. **`MASTER-CHECKLIST.html` was removed.** `HANDOVER.md` and `START-PROMPT.md` (two references each) now
   point at the markdown only. **It is in git history and should not be recreated** — the whole point is
   that there is one copy.

**★ And the lesson applied to my own tooling, deliberately:** both new scripts are recorded as **built
but NOT ENFORCED**, because nothing calls them — not CI, not `.husky/pre-commit`. That is the `CC-101`
defect in miniature, and naming it is cheaper than discovering it again in a fortnight.

**▶ NEXT:** unchanged — `CC-101` first (wire the four uncalled checkers into `ci.yml`, at which point
these two join them), then `CC-102`.

---

## 2026-10-17 (night) — the donor cross-check: ten hostile critics, nine REVISITs, and the discovery that four "done" claims were unenforceable

No code was written this session. Ten third-person hostile critics read the donors' **source** against our
ten delivered slices — one critic per slice, each re-reading the donor rather than trusting the digest —
and then **every load-bearing claim from all ten reports was re-verified by me against the real code
before it entered a register.** The consolidated record is
[`AUDIT-2026-10-17-donor-crosscheck.md`](library/development/AUDIT-2026-10-17-donor-crosscheck.md), 392
lines, every claim stamped **[V]** verified with file:line, **[A]** analyst-reported, or **[X]** refuted.
Eleven new register rows, all open: **`CC-101`…`CC-111`**. Register: **56 closed · 54 open · 110.**

**★ The verdict: nine of the ten slices are called REVISIT, one KEEP-partial.** Not because the code is
wrong — most of it is sound — but because in nine cases the *claim* about the code was stronger than the
code. The audit's whole value is that it separated those two things, slice by slice.

**★ Three failure modes, one per hour of the audit — and every one is a declared control that does
nothing.**

**(1) A check that never runs.** Measured: `.github/workflows/ci.yml` runs **two** of the repo's seven
drift checkers — `check:dep-versions` (`:499`) and `check:time-bombs:fail` (`:509`).
`check:digital-twins:fail` (`package.json:121`), `check:escape-hatches:fail` (`:115`),
`check:one-truth` (`:113`) and `check:two-reads:fail` (`:119`) are **called by nothing** — not CI, not
`.husky/pre-commit`. Run the escape-hatch one by hand and it prints *"169 unnamed escape hatch(s) of 202
— a hole must carry a reason"* and **exits 0** (only `--fail` exits 1, and nothing calls it). So
`SR-38`/`SR-39`/`SR-41`/`SR-46`, whose own requirement text says *"drift breaks the build"*, were met by
code that breaks nothing. **The artefacts are built, tested and mutation-proven; the claim about them was
the defect.** All four revert from ✅ to 🟡 *built but NOT ENFORCED* in the checklist twin — by name,
with the measurement quoted. This is the same defect class `SR-47` exists to catch (`CC-93`, a control
nobody reads), pointed at CI instead of at a function, and it is the cheapest instance of that class we
will ever get.

**(2) A control that discards its answer.** `authorizeEntityRead`
(`packages/ai-assistant/src/modules/ai_assistant/lib/business-ir-run.ts:214-251`) reads the entity's
search config and returns `{ ok: true } | { ok: false; reason }` — it throws away the object it just
read. The package it was copied from does not: `packages/search/src/modules/search/ai-tools.ts:86`
`authorizeEntityAccess` **returns the config** and its callers use it (`:125-126`, `:144-145`, `:148`
project `config.fieldPolicy`). So the column-level strip is **structurally impossible** at the current
return type, and a sensitive field is fetched and returned whenever the model names it as a dimension,
because `compile.ts:416` sets `fields` straight from the model-chosen `dimensionIds`. The compiler says so
out loud — `compile.ts:378-382` emits `AUTHORIZATION_NOT_IMPLEMENTED` as a *gap* ("no authorized
projection is injected. This compile is a plan, not a permission") while a missing tenant is an *error*
(`:387-392`). The same shape one layer up: authority obligations are computed at
`packages/shared/src/lib/authority/decision.ts:440-463` and only **rendered** at
`pendingActService.ts:506` — a grep for `obligation.kind` outside `__tests__` finds nothing.

**(3) A permit written as a default.** `interceptors.ts:246` — `if (!decision || !HELD_GATES.has(decision.gate))`
falls through to *"Gate permits the act to run now"*. **A gate value the interceptor does not recognise is
a permission**: a future gate, a typo, or a persisted decision written by a newer version all permit. And
`agent-binding.ts:52` returns `{bound: true}` for every principal whose `kind` is not `ai_worker` — the
fail-open is **one `!==` wide**. Eleven lines above the hole the same file refuses an
*unidentifiable* principal as fail-open and writes the reasoning out (`:41-49`); the same reasoning, one
branch over, is not applied.

**★ The security finding that changes the plan.** `principal.ts:127` —
`const isService = parsed.kind === 'service' || auth.isApiKey === true`, with the comment *"Honour either,
so a context built by an older path still resolves correctly"* — means an `ai_worker`-shaped key on a
legacy or cached envelope resolves as `service` and **passes the binding gate with its binding never read
at all**. The route above it requires only `ai_assistant.view` (`api/ai/chat/route.ts:191`).

**★ And the row that indicts slice 1.** `CC-99` removed a dead control — a `runtime` field nothing read —
and shipped another: **`deleted_at` has no writer**, so every `WHERE deleted_at IS NULL` predicate in the
slice is inert. Meanwhile the repository's own error text tells operators to *"retire it before
registering a replacement"* (`:253`) and *"retire the existing runtime first"* (`:260`) — with no API to
do either. **`retire()` does not exist.** The omission was applied to the wrong column: `status` and
`last_seen_at` were correctly held back as unwritable, and `deleted_at` was shipped unwritten. Four more
gaps measured beside it: `register()` **throws** `AiAgentRuntimeConflictError` where the donor
**upserts** (multica `UpsertAgentRuntime`, `runtime.sql:63-93` — `INSERT … ON CONFLICT … DO UPDATE … SET
last_seen_at = now() RETURNING *, (xmax = 0) AS inserted`, so restart updates the row and
first-registration stays distinguishable); `daemon_id` is **caller-supplied text** where the donor
migrated to a persistent daemon UUID (`048_runtime_daemon_uuid.up.sql:1` — a hostname change creates a
second live row with no binding, a permanent `AiAgentRuntimeAmbiguousError`); there is **no liveness
writer** where the donor's is one UPDATE on a request that already happens
(`TouchAgentRuntimeLastSeen`, `runtime.sql:178-193`, with a load-bearing `status = 'online'` predicate
that lets the caller detect a sweeper's race — no sweeper, no Redis, no lease); and a **null-org caller
cannot see a tenant-level runtime and the silence is a fallback** — `agent-runtime-registry.ts:41`
returns `NO_TENANT_RUNTIME` for an empty set and `resolve-ai-runtime-port.ts:184-189` then takes
`resolveAiRuntimeEngine(env)`, the exact failure the registry's own docblock forbids (*"a fallback … is
how an agent ends up served by the wrong engine"*, `:27`; *"Deliberately not a fallback"*, `:46`).

**★ Four of my own citations were wrong, and one of them nearly cost the most serious security finding.**
(1) I recorded the analyst's `derivePrincipal` claim as **unverifiable** because "`principal.ts` does not
exist". It does, at `packages/shared/src/lib/auth/principal.ts`, and the claim is **true** at `:28` and
`:127-137`. (2) I called `authorizeEntityAccess` "donor parity" — it is **ours**, in `packages/search`,
which makes `CC-106` sharper: the copy dropped a step the original still has. (3) The twin count is
**3**, not 4. (4) The file census is **4,832**, not 4,823 — the script is the authority. All four are
recorded by name in the audit's §14, because a wrong citation in a register is worse than no citation:
it looks like a measurement.

**★ What was deliberately NOT done.** The hosted-login defect (needs the owner's machine and a real
account) and the audit's green-suite claims (a full run was not in scope) are recorded **UNVALIDATED**
in the triage document — named as unverified rather than guessed or silently passed over. No code was
changed and no test was run against the suite: this pass was measurement, and it changed the plan rather
than the tree.

**▶ NEXT:** **`CC-101`** — wire the four uncalled checkers into `ci.yml`, so a declared control with no
reader arrives as a build failure instead of a discovery. **Then `CC-102`** — `SR-02` slice 2, re-scoped:
`retire()`, the registration upsert, a stable `daemon_id`, the `last_seen_at` writer, null-org
visibility, and the unbind/CHECK redesign, keeping the concurrency proof (two concurrent retires, the
second seeing the first's effect). Behind them the tooling set's remainder, then identity → `SR-12` →
`P2-9b`.

---

## 2026-10-17 (late) — the identity step opens: `SR-02` slice 1 (`CC-99` closed), `CC-100` found

The tooling set is closed, so the frontier moves to identity. The requirement was written before any code
(`PLAN-identity-SR-02-SR-07.md`), and the **measurement came before the design**.

**The measurement that decided the shape.** The kernel `Agent` object has carried a `runtime` field since
`AH-1` (`ce.ts:128-136`), described as *"a binding name, not an embedded runtime"* — and **nothing read
it**. Measured: `AiAgentDefinition` has no `runtime` field at all, and no module in `ai_assistant` reads
one. A declared binding with no reader is not a control; it is a comment with a type. So this slice's real
job was not "add a table" — it was to give that field its **first reader**, because a table nobody reads
would have been the same defect wearing a schema.

**`agent` ≠ `agent_runtime`.** `ai_agent_runtimes` is **the machine**: a daemon, on a host, for one
provider, inside one tenant. One runtime hosts many agents, and an agent does not own a process. And it is
**not** `ai_agent_runtime_overrides` — that existing table is per-tenant provider/model/baseURL
*configuration*; this is an *instance*. A setting says which model a tenant prefers; a runtime says which
process can serve it. Merging them would have repeated the conflation the slice exists to undo.

**★ Where we refused the donor, by name.** Multica writes `UNIQUE (workspace_id, daemon_id, provider)` over
a **nullable** `daemon_id`. In Postgres `NULL`s are distinct, so every null-daemon row falls **outside** its
own uniqueness: the constraint holds for daemons and evaporates for exactly the rows it cannot describe.
**A key with a hole is worse than no key** — ours is `daemon_id NOT NULL`. Four partial unique indexes on
the house nullable-`organization_id` pattern (`Migration20260512090000.ts:7-8`): daemon+provider, and
`name` — which the donor does not constrain at all, and which is load-bearing here because the kernel agent
stores its binding as **text** (custom-entity records live in `custom_entities_storage`, which cannot carry
a foreign key), so the binding resolves **by name**. Two rows with one name would make that resolution a
coin flip.

**★ Two omissions, held to the same standard as the object.** The donor's `status` / `last_seen_at` and
`runtime_mode` / `device_info` are all absent. `runtime_mode` has one inhabitant. But `status` and
`last_seen_at` are the interesting refusal: **they would have had no writer** — liveness is a heartbeat and
no probe in this codebase beats one — so a column claiming "online" that nothing sets is the *same*
dead-control defect this object exists to remove, pointed the other way. They land with the probe. And
`provider` carries **no CHECK**, because the vocabulary (`AiRuntimeEngine`) grows; it is validated at the
repository boundary against `lib/ai-runtime-engines.ts`, the same reasoning `Migration20260812180000.ts:24-27`
records for `principal_kind`.

**Three answers, two refusals.** `resolveTenantRuntime`: no tenant / no row → `null` (the caller keeps its
pre-`SR-02` path); exactly one row → that row; a named binding that matches → that row. A binding matching
**nothing throws**; several rows with **no** binding **throws**. Neither falls back and neither picks "the
first" — a silent answer is how an agent ends up served by a machine nobody registered. The selector gained
one rung: `engine` (caller override) → `tenantRuntime.provider` → `AI_RUNTIME_ENGINE` → `opencode`. A row
outranks the environment because a row is a fact about **this tenant** while the variable is a fact about
**the deployment**; an unknown provider read from a row **throws**, never falls through.

**Proof.** 64 tests across 4 suites (schema **9** · repository **19** · registry **11** · selector **25**,
6 of them new); **12/12 mutations PROVEN** with every file restored byte-identical; package
**133 suites / 1,943 tests, all green under the pinned Node 24**; `tsc` clean.

**★ The figure I first committed was wrong, and it was wrong in the most instructive way.** I ran the
package suite under the shell's node 22.22.2 and reported **1,834 / 1,834 pass · 131 suites · 2 suites
failing to *load***, on `isolated-vm`'s missing win32/abi=127 prebuild. Every part of that is true, and the
whole of it is misleading: **109 tests never ran** (`sandbox` 65 + `codemode-tools` 44). Under the pinned
toolchain — `workspace/.toolchain/node24`, v24.19.0 — it is **133 suites / 1,943 tests, all pass, nothing
failing to load**. **A suite that fails to load reports no failures**, which makes it the same defect class
as the mutation harness below: both produce green by not looking. And `BACKLOG.md:18` had already recorded
this exact trap (*"the same run under the shell's node 22.22.2 falsely showed 2 unloadable suites"*) — so I
walked into a documented trap by measuring with the wrong runtime, not by breaking the code. The correction
is the point: the pinned runtime is the only honest number.

**★ A harness bug found by the harness itself.** The first mutation run reported **0/12 PROVEN**. The
mutations had all worked — the *detector* looked for `✕` (U+2715) while this jest build prints `×`
(U+00D7), so twelve caught mutations read as twelve failures. **A mutation harness that cannot see a red
test is the most dangerous kind of green**, because it fails toward "everything is fine". Fixed, then 12/12.

**★ And a regression I caused, fixed honestly.** Wiring the read broke three chat-route suites (21 tests):
their container mock was the bare sentinel `{ identityCacheKey: 'em' }`, written when the route queried
nothing. The fix was **not** to weaken the route — the sentinel gained `find: async () => []`, which is the
"no runtime registered" answer, so those suites now *also* pin the byte-identical path and pass unmodified
in every assertion they make.

**★ Rule-13 corrections, five of them, all mine.** (1) **The package figure** — `1,834 / 1,834 pass, 2
suites failing to load` reads as green while **109 tests never ran**; under the pinned
`workspace/.toolchain/node24` (v24.19.0) it is **133 suites / 1,943 tests, all pass** (see above — a suite
that fails to load reports no failures). (2) The recorded `CC-73` figure *"92
pre-existing `tsc` errors"* no longer reproduces; this slice's first run reported **2,090**, all stale
diagnostics replayed from the gitignored `.tsbuildinfo`. Delete the cache and re-run: **0 errors**. Anyone
reading 2,090 as "the code got worse" would have been reading a cache. (3) **`CC-100` NEW & OPEN:** the
MikroORM snapshot lists **10** tables and contains **neither** `ai_agent_bindings` (`CC-27`'s slice)
**nor** `ai_agent_runtimes` (this one) — and it is **consumed** (`packages/cli/src/lib/db/commands.ts:100`
decides from its presence; MikroORM diffs entities against it), so the next `db migration:create` would
emit a `create table` for a table that already exists. The fix is a regeneration against a live database,
**not** a hand-edit: a snapshot that is *wrong* is worse than one that is *stale*. (4) The register header
in `MASTER-CHECKLIST.md` §5 read **52 closed · 44 open · 96 total**, a figure that corresponded to **no
state the table ever held** — measured at `HEAD`, the table already carried 97 rows (55 closed, 42 open).
(5) The §7 SR header read **53** / **10 BUILD** while the table holds **54** rows since `SR-47` was added.

**▶ NEXT:** `SR-02` slice 2 (the retire guard — the `ON DELETE RESTRICT` promise, held in code because our
agent is a custom-entity record and the store cannot carry a foreign key) and `SR-07` (a bot is a
participant), then `SR-12` → `P2-9b`. Also open and named: `CC-100`. Register: **56 closed · 43 open · 99
total.**

---

## 2026-10-17 (night, continued) — the tooling set is finished: `SR-38` + `SR-46` (`CC-91` closed)

The SRS's *"land FIRST; make everything after cheaper"* set is whole. Its last two slices land here; the
first two (`SR-39` one-truth, `SR-41` escape hatches) landed 2026-10-16.

**`SR-38` — the digital-twin harness.** The mechanism is the **type system**, not a runtime check:
`packages/core/src/testing/digital-twin/authority.ts` declares three twins — `RECORD_LOCK_CEILING_TWIN`,
`AUTONOMY_GATE_TWIN`, `ANONYMOUS_SCOPE_TWIN` — each `satisfies` a **REAL** type imported from the module
that owns it, so adding a record-lock state or an autonomy gate cannot be done without touching this file,
and a moved interface is a `tsc` error. `scripts/check-digital-twins.mjs` guards the **wiring** (six things
per twin: the file exists; imports the real types; declares the symbol; carries its `satisfies`; sits in a
`tsc`-visible location; names a semantic test that exists). **The split, named: the check guards
completeness, `tsc` guards correctness — neither alone is the mechanism.** 10/10 tests, 7/7 mutations
proven (each killing exactly its named case), checker restored byte-identical; `check:digital-twins` /
`:fail`.

**★ The half a `satisfies` cannot close — a twin's VALUES.** A shape check cannot tell `{locked:'A0'}` from
`{locked:'A1'}`: both compile, and the second is a lie about the control.
`record-lock-ceiling.twin.test.ts` pins every declared value to what `recordLockCeiling` actually returns —
**proven by mutation:** flipping `locked` to `'A1'` still compiles and turns the test red at exactly the
value assertion, while the other three tests pass. Restored byte-identical.

**`SR-46` — the two-reads lint.** `scripts/check-two-reads.mjs`, in the `scripts/check-*.mjs` family — **★
its home corrected by name:** the plan first put it on the ESLint surface (`packages/eslint-plugin-ds`),
which runs only on **backend-UI files** via `eslint.ds.config.mjs`, so a settings-read rule there would
never fire on the files that read settings. Lexical and strip-based; the trap is **a write is not a read**
and the precision case is **a read inside a string or comment is not a read**. 8/8 tests, 5/5 mutations
proven. **Measured on the real repo: 4,823 production files scanned · 3,153 test files skipped · 89 settings
read twice in 46 files.** `check:two-reads` / `:fail`.

**Shared foundation — extracted and proven.** The string/comment/template/regex lexer both checks need is
now one file, `scripts/lib/strip-code.mjs` (`strip` + `readStrippedLines`), extracted from
`check-declared-controls.mjs`. The extraction was **proven, not assumed**: the three lexer mutations in
`verify-declared-controls-mutations.mjs` were re-pointed at the new file and all still kill their named
tests, and the declared-controls census is byte-stable (6 controls, 1 covered). A real lexer defect was
found while extracting it — template-literal `${…}` interpolations left an **unbalanced `{`** — and fixed.

**★ A rule-13 correction (mine).** The frontier had recorded `workspace/.toolchain/node24` as **ABSENT**.
Measured: it is **PRESENT at v24.19.0**. Corrected in `MASTER-CHECKLIST.html` §2 and its `.md` twin.

**▶ NEXT:** identity (`SR-02` + `SR-07`) → `SR-12` (the per-tenant engine home, the fix for open `CC-84`) →
`P2-9b`. Register: **55 closed · 42 open · 97 total**.

---

## 2026-10-17 (night) — the urgent set closes: `T-13`, `T-14`, and `T-45`

**`T-13` / `T-14` — the two live compose defects (`CC-98`).** `--jinja` added to the llama.cpp `model`
service in `docker-compose.fullapp.yml` (the only file that runs it) — without it llama.cpp never applied
the model's own chat template, so tool calling was silently degraded. `OPENAI_BASE_URL` forwarded to the
`mcp` service in `docker-compose.fullapp.yml` and `docker-compose.fullapp.dev.yml`, mirroring
`docker-compose.hermes.yml:107` — without it the embedding lane silently called `api.openai.com`. Verified
**live, not just parsed**: both files pass `docker compose config`; the `model` and `mcp` containers were
recreated, and `docker inspect` reads back `--jinja` in the model's args and
`OPENAI_BASE_URL=http://model:8080/v1` in the mcp env; both healthy.

**`T-45` — a locked record is refused now (`CC-97` closed, Option A).** The command gate computed the
record lock's `A0` and then **ignored it** (`HELD_GATES = {A1,A2}`, `interceptors.ts:56`), so a locked
record was writable by any holder of the capability — the route guard cannot make that refusal, because
`refusalFor` threads no record id and the gate is the only production path that does. The owner chose
**Option A — the gate refuses** — over threading the recordId into the route guard. A new
`AuthorityRefusedError` (403 — "you may not", distinct from the held case's 202) carries the binding rule
and its reason; the gate's own docblock claim ("`A0` is left to the route guard") was corrected by name
(rule 13). Proof: the T-32 pin "still passes a locked record" is **flipped** to "refuses a locked record";
3 mutations run for real, each killing exactly its named tests, the file restored **byte-identical**
(`f3c1017b…`); **811 tests / 90 suites** across `src/modules/auth`; `tsc --noEmit --incremental false` and
eslint clean. Register: **54 closed · 43 open · 97 total**.

**▶ NEXT:** the tooling set's remainder (`CC-91` — `SR-38` digital-twin harness, `SR-46` two-reads lint) —
clear the missing `workspace/.toolchain/node24` first — then identity (`SR-02`/`SR-07`) → `SR-12` →
`P2-9b`.

---

## ★ ACTIVE TASK — what is being worked on right now

> ### 🔴 OWNER'S RULING 2026-10-09 — THE ORDER IS THE VISION'S ORDER, AND THE SCOREBOARD IS PLAIN ENGLISH
>
> The owner challenged the direction: *"If I am understanding what is happening now right, you flipped
> the development in a reverse order."* I measured it against the primitive vision
> (`library/ai/ai-first/06_Platform_Foundation_and_Security_Kernel_Specification.md` §222–232, the
> vision's own Phase 0 → Phase 10 build order, and §233 *"Do not start by building dozens of ERP
> screens … while the security model remains informal"*). **Honest verdict: the order document is not
> reversed, but the *measured* scoreboard and the queue had drifted — the skeleton (vision Phase 3, the
> policy kernel) sits at `§B P1`–`P18` = 0/36, while four business modules (vision Phase 10) are ticked
> DONE, and the next queued slice was a CRM pipeline. The owner is right about the direction of travel.**
>
> **Two rulings given (via the question card, 2026-10-09):**
> 1. **Build order = the vision's order.** Finish the architectural skeleton first (Phase 3 policy
>    kernel → Phase 4 classification → Phase 5 enforcement → Phase 6 audit → Phase 7 gateway), and only
>    build business capabilities (CRM/Sales/etc.) *after*. **No business-module work until then.**
> 2. **The task list = one plain-English scoreboard that REPLACES `platform_points.md`'s technical
>    view.** *Landed this change* — `platform_points.md` now opens with **one number** and **one list**
>    sorted in the vision's Phase 0 → Phase 10 order, each row written as *what the user can do after
>    it*; the old `§A`–`§L` view is kept **byte-identical** as an appendix (developer evidence, §L).
>
> **`G-22` Slice 2B is PAUSED, not cancelled** — it is the `customers` caller and therefore Phase-10
> (business) work. It stays scheduled as **`CC-42`**; it resumes only if the owner says so, or once
> Phase 3–7 are done (whichever comes first). **The queue now points at Phase 3 (the policy kernel).**

> ### 🟡 SECOND LIVE TRACK — **`B-WS` · the workspace-architecture workstream** (2026-10-11)
>
> **There are two live tracks, and this box owns both.** The **build track** is `CC-59` (the box's next
> block, *below*). The **design track** is **`B-WS`** — the workspace-architecture workstream in
> [`library/workspace-architecture/`](library/workspace-architecture/README.md): it answers the owner's
> Message 6 (*how the user↔AI interaction, the Business-IR display, the saved Functions, the menu
> grouping, the threads, the collaboration, and the widget architecture all fit together*).
>
> **State: B-WS/B1–B8 of 10 done** (B-WS/B1 recon · B-WS/B2 reference systems + verdict · B-WS/B3
> interaction/IR display · B-WS/B4 function lifecycle · B-WS/B5 naming/menus/grouping · B-WS/B6
> threads/collaboration · B-WS/B7 extensibility · B-WS/B8 the reference-system decision + the mapping
> draft + the bridge). **Next: B-WS/B9** (the widget architecture, end to
> end). **`B-WS` produces *design*, never code** (BR-4) — its builds are the `CC-*`/`G-*` items it maps
> in [`03-MAPPING.md`](library/workspace-architecture/03-MAPPING.md). **The bridge that binds these two
> tracks is [`04-BRIDGE.md`](library/workspace-architecture/04-BRIDGE.md)** — read it before touching
> either. **Its answers live in
> [`discussion_points.md`](library/workspace-architecture/discussion_points.md)** (open owner decisions:
> **DP-09/10/11/15**). *(Internal batch numbers are written `B-WS/Bn` everywhere in the spine — bridge
> rule BR-2.)*

---

### ✅ OWNER'S RULING 2026-10-12 — **the focus is the CORE ARCHITECTURE, and business modules are GENERATED, never hand-coded.**

> *"Go straight to Hermes Phase 2. If you review the rules we have you will see the focus is on the core
> architecture (like hermes, workspaces, etc...) over business modules. **We should not develop any business
> modules functionalities unless needed for testing. Business modules should be generated from the core
> workspace** where we send prompt to AI, get business IR, save the functions and categorize them as modules.
> **That's the main vision and logic for the whole product — not developing dummy coded modules, traditional
> ERP style."*

**What this settles.** The queue's frontier is **Hermes §9 Phase 2** — *one worker, one tenant, one tool*
(plan written first: [`PLAN-HERMES-PHASE2-one-tenant-one-tool.md`](library/development/PLAN-HERMES-PHASE2-one-tenant-one-tool.md)).
It also restates, in one sentence, the rule the 2026-10-09 ruling implied: **the product's centre is the
core (runtime, workspace, the prompt → business-IR → saved-Functions → module-categorisation loop), and a
business module is an OUTPUT of that loop, not something we write by hand.** Concretely, from here on:

- No CRM/Sales/WMS module functionality is built unless a core item genuinely needs it **for testing**.
- The Business-IR chain (`lib/business-ir-author.ts` · `lib/business-ir-run.ts` ·
  `ai-tools/business-ir-pack.ts`) **is** the spine, and it is the "one narrow tool" Phase 2 delivers to the
  worker — so the core build and the vision's loop are the same work, not two.
- `CC-51` (row 16 team-leg) stays parked: its real blocker is the **`staff` module being disabled** — a
  product decision, and enabling an HR module is exactly the kind of build this ruling stops.

---

### ✅ P2-2 DONE — **the Hermes gateway client, proven against the real wire: 21/21 tests, RED-then-GREEN, critic-hardened.** *(2026-10-12; code commit `f5f85064`)*

**What it is.** `packages/ai-assistant/src/modules/ai_assistant/lib/hermes-gateway-client.ts` (+ its suite) —
the transport-and-protocol layer for the pinned Hermes TUI gateway: spawn/supervise the worker, newline-JSON
framing both ways, id-correlated requests with timeouts, the measured handshake, `prompt.submit` +
the event stream, `session.interrupt`/`steer`, `process.stop`, and `-32601` for an unhandled server→client
request. Nothing in it knows about the port — that is `P2-3`.

**The finding that mattered.** A hostile critic (a separate agent, per rule 10f) proved the header claim
*"measured, not assumed"* was **true of the framing and false of the event stream**: the pinned gateway wraps
**every** notification in an envelope — `server.py::_event_frame` (`:701`) →
`{"jsonrpc":"2.0","method":"event","params":{"type":…,"session_id":…,"payload":{…}}}` — so the event's name is
`params.type` and its payload is `params.payload`. The first draft dispatched on `frame.method`, which would
have delivered every event to a listener for the literal string `"event"` and stalled `connect()` for the full
timeout. **Upstream asserts the same shape** (`tests/e2e/core/parity/test_boot_contract.py:115`:
`frame["method"] == "event"` and `params["type"] == "gateway.ready"`), so this is the protocol, not a reading.
Two further defects (a pino-style logger call on our message-first logger; an unguarded `stdin.write` that
throws on EPIPE) were verified against source and fixed with it — and the critic's finding **invalidated part of
the suite itself**, whose frames were the un-enveloped shape the real server never produces.

**The gates, with numbers.**
- **jest 21/21** (was 17): the envelope unwrapping and bare-notification tolerance are now **named regression
  tests**, plus a frame split mid-line and a CRLF-terminated frame. RED-then-GREEN: mutating the unwrapping turns
  **8 of 21 RED**; restored **md5-identical** (`4416a886…`) → 21 GREEN.
- **`tsc` clean — honestly qualified, and this is the honest part.** `P2-2`'s two files are error-free, but the
  package's **type gate did not exist**: `tsc -p .` returned **TS18003**, because its tsconfig extended the
  *root* config whose `exclude` swallows the package's own `src/**` — the only one of 21 configs not extending
  `tsconfig.base.json`. Fixing it surfaced **92 pre-existing errors in 27 other `__tests__` files** (jest here
  does not type-check: a file with 17 `tsc` errors runs 34/34 green). The tsconfig and a `typecheck` script are
  fixed **in the same change**; the 92 are scheduled as **`CC-73`**, and the two measurements (the native
  compiler needs an explicit `types` list; a stale `tsbuildinfo` reported 6,551 → 36 → 95 for one config) are
  **L138/L139**.
- **esbuild 238 entry points**; full package suite **117/119 suites / 1519 tests, 0 failures** — the 2 failing
  suites are `isolated-vm`'s missing native build, proven identical **with this change stashed**.

**Next: `P2-1` — and it is now buildable here.** The owner started Docker (`docker info` → **29.8.2**), so the
premise that made `P2-1`'s boot gate "UNPROVEN-HERE" is corrected in the plan (§2.2 + the row) rather than
carried forward. `P2-1` was built next and is now done (the block below); `P2-2`, `P2-3`, `P2-4` and `P2-5`
followed, all discharged (the blocks below); `P2-6` is now discharged (2026-10-13, §2.12) and **`P2-7` is discharged too (2026-10-14, §2.13)** — **Hermes SERVED A LIVE TURN through the pinned worker**, twice, the second **production-shaped** (the compose change alone: the forwarded `OPENAI_BASE_URL` + `HERMES_MODEL` + the measured prefill grace). The worker returned a **real model answer** and the adapter's ordered typed events ended on a real `done` — the gate §2.13 named, and the missing half of `P2-6`'s *stated* exit gate. **`P2-8` is discharged too (2026-10-14, §2.14.1)** — the worker's **ws door is mounted** (`docker/hermes/ws_host.py` + `ws_entry.py`, the pin's `handle_ws` behind the pin's ticket auth) and the client **connects** it through a **seam** (`lib/hermes-gateway-transport.ts`), with a **real turn served over the new transport and NO hand-spawned process** (183.4s, a real model answer, a typed `done`), the `ping` health gate green, and **`AI_RUNTIME_ENGINE` still defaulting to `opencode`**. **`P2-9a` is DISCHARGED 2026-10-14 (§2.15.1)** — the MCP bridge: the worker is pointed at the platform's own MCP server and a live Hermes turn called one of the 21 platform tools and read a real platform result back (`CC-79` discharged; the default did NOT move). **The frontier is now `P2-9b` — THE SWITCHOVER proper (ONE change):** the default-flip to Hermes + the OpenCode deletion (`R28-6`/`N-8`) + the `hermes-local` retirement (`CC-74` — trigger fully met since `P2-7`), carrying one recorded hazard — the **default** toolset set measures **~16,757 tokens**, whose cold prefill (~3000 s at the measured ~5.5 tok/s) exceeds the worker's own `HERMES_LOCAL_STREAM_STALE_TIMEOUT: 2400` ceiling. **The build track was PAUSED here, gated by the owner's decision on that hazard — ✅ RULED 2026-10-16: Option 1** — keep the 2,400 s ceiling; on-demand tool loading is the standard behavior (the pin ships progressive disclosure ON by default, proven live in the `P2-9a` turn; prompt-cache reuse measured ON in the deployed model server, 168.7 s cold → 1.5 s warm); `P2-9b` = measure-and-configure — the record is [`DECISION-p2-9b-stale-timeout-trade.md`](library/development/DECISION-p2-9b-stale-timeout-trade.md) §6, and the process failure became [`WORKING-RULES.md`](library/development/WORKING-RULES.md) **rule 18**. The next step is the one in-process re-measurement of the assembled prompt (the ~16,757 figure does not reconcile with the compose's own 10,988-token DEFAULT-toolsets measurement — rule 13), config tuning only if the numbers demand, then the switchover change itself. Measured: the app container has **no Python and no Docker socket**, so the harness's `docker exec` shape is unavailable to production and the connection the platform now owns mirrors OpenCode (a supervised service + a URL + a health gate). **▶ THE ARCHITECTURE WORKSHOP (the second track, `library/architecture/`) is at its MAPPING PASS — DONE:** nine platforms studied (Hermes ✅ · Paperclip ✅ · CrewAI ✅ · Multica ✅ · Gas Town ✅ · n8n ✅ · buzz ✅ · openrig ✅ · zulip ✅), each mapped across the three poles + widgets + the escape hatch, and the cross-platform mapping produced the requirement register **`08-THE-SRS.md` — 53 requirements (SR-01…SR-53)** with the synthesis (`07-SYNTHESIS.md`) and per-pole findings (`01`–`06`). **Two platform studies remain: `mattermost` + `activepieces`** (the 10th and 11th platforms — activepieces added by the owner 2026-10-16). The approved next move: the **tooling set** (`SR-38` digital-twin harness · `SR-39` one-truth check · `SR-41` escape hatches · `SR-46` two-reads lint) + **`SR-08`** (the triage-core production caller) — all sourced from **already-closed** platforms, so the two pending studies cannot rewrite them — with the two studies running in parallel. The one index over the whole lifecycle is **`library/development/MASTER-CHECKLIST.md`** (its HTML twin is the filterable view); the registers (`platform_points.md`, `BACKLOG.md`) stay the source of truth.

---

### ✅ P2-1 DONE — **the pinned Hermes worker boots as a real process and answers the measured handshake: GATE PASSED in 39.5s.** *(2026-10-12)*

**What it is.** `docker/hermes/` — `Dockerfile` (base `python:3.14-slim-bookworm`; `uv sync --frozen` from the
**pin's own** `uv.lock`, transferred through a **named build context** so the build never copies the tree) ·
`entrypoint.py` (digest-verify first, then `os.execvpe`) · `verify_pin.py` (the host harness's algorithm,
8 threads) · `handshake_gate.py` (the exit-gate driver) — plus the **separate, opt-in**
`docker-compose.hermes.yml`, per the owner's ruling. **Image 673 MB, built in 1m49s.**

**The exit gate, measured (no stub, no mock — the process under test is the image):**
`client.capabilities` → all **14** `server_requests` · `gateway.capabilities` →
`{'per_session_exclusive_submit': True}` · `ping` → `{'pong': True}` · `gateway.ready` →
`['change_events','replay_epoch','skin']` (so `P2-2`'s envelope unwrapping is now confirmed against the
**live worker**, not only the stub) · `process.stop` → answered, worker exits, **5 stdout frames, every one
JSON** → **GATE PASSED in 39.5s**. The compose cold start re-proves it: `PIN HOLDS — files 18248, digest
ca760e97ff1ef1f0e2ed3deb0dfc2923` → `exec: python3 -m tui_gateway.entry` → the real `gateway.ready` frame.

**The RED run.** The same gate pointed at `hermes-agent-main-older` was **refused** — `PIN BROKEN … actual
3e3b81f2ac67a13b76c08f5140d9efe6 files 17367`, exit 1, **0 stdout frames** — which also **cross-validates the
container's verifier against the host harness** (two implementations, two trees, identical digests).

**Three things the measurement changed after the build — the reason this block exists rather than the first
green log:**
1. **The network was wrong (L140).** The file copied `docker-compose.yml`'s hardcoded `mercato-network`; the
   running stack is on `mercato-network-local` and my worker sat **alone**. Fixed to
   `${HERMES_DOCKER_NETWORK:-mercato-network-local}` with **`external: true`** — this file can now neither
   create nor delete another stack's network — and proven both ways: `up` attaches beside the stack; `down`
   removed **only** `mercato-hermes-gateway` and left all 8 platform containers, the network and both
   `mercato-hermes-*` volumes intact. The stray empty network the first version created was removed.
2. **The stack already ran a Hermes (L141).** `hermes-local` — the **upstream** image `nousresearch/hermes-agent:latest`,
   `command: ["gateway","run"]`, HTTP on `127.0.0.1:8642`, from the owner's Sprint 0 step 3.5. A **different
   door**: floating `:latest`, HTTP, unverified. This row is the **pinned source over stdio** — the door the
   platform's own client speaks and `P2-3` fronts. The compose file's header now states the distinction, and
   the record states that **neither door is wired into the app** (measured: **zero** `HERMES*` references in
   `apps/mercato/src`).
3. **Two wire-discipline bugs the gate now catches (L142).** My entrypoint logged to **stdout** — the gateway's
   own JSON-RPC channel; moved to stderr. And the driver's first version omitted the JSON-RPC `id`, so it sent
   *notifications*, and the gateway **answered each with `"id": null`** — which the ordered reader
   read as a shifted wire. The gate now correlates by id and asserts **every stdout line parses as JSON**.

**What it does NOT claim:** the worker is not behind the door (`P2-3`), does not serve a chat (`P2-5`), and is
not `hermes-local`'s replacement. Full record: plan §2.7; lessons L140/L141/L142.

**Next: `P2-3` — the port adapter.** `lib/hermes-port-adapter.ts` implementing `AiRuntimePort`, with
`session.steer` settled **by measurement** before any capability is claimed for it.

---

### ✅ OWNER'S RULING 2026-10-12 — **the upstream `hermes-local` HTTP gateway STAYS until `P2-5` proves the pinned worker behind the port — then it is RETIRED.** *(registered as `CC-74`, and written into the compose file itself)*

> *"we follow your recommendation as long as you note in the documentations when to retire it so we do not
> forget that"*

**The question, in plain terms.** The measurement during `P2-1` found the operator's stack already running
**`hermes-local`** — the **upstream** Hermes image (`nousresearch/hermes-agent:latest`, a tag whose contents
can change under us), speaking HTTP on `127.0.0.1:8642`, added back in Sprint 0 step 3.4/3.5. This week's
`P2-1` added a **second** Hermes door — the **pinned source over stdio**, digest-verified at every boot —
which is the door the platform's own client speaks and `P2-3` fronts. So: two doors, one unverifiable. The
options were keep both / retire the old one now / retire it later.

**Ruled: leave `hermes-local` running until `P2-5` (engine selection at the door) has landed AND the pinned
worker has served a real chat run through it. Then retire it, in one change.**

**Why the old one may stay until then:** it is the owner's Sprint 0 scaffolding, something may still be
hitting port 8642 by hand, and removing it before the replacement is proven trades a working door for a
promised one. **Why it may not stay forever:** two Hermes doors is exactly the *"duplicate authority"* risk
the architecture's §10 table names — and only one of them is verifiable.

**Recorded so it cannot be forgotten** (the owner's condition, honoured in the same change): **`CC-74`** in
`COMPLETION-CALLBACKS.md` holds the full row (the two doors, the risk, the trigger, the five retirement
steps); a **retirement comment now sits on the `hermes:` service block in `docker-compose.fullapp.yml`**
itself; `docker/README.md` and `workspace/COOKBOOK.md` step 3.4 carry the pointer; plan §2.7.1 has the
ruling. **Retirement = five steps, one change:** confirm the trigger → stop/remove `hermes-local` (the
`mercato-hermes-data-local` volume **stays** — it is the owner's state) → delete the service block, the
`hermes_data` volume and the `HERMES_BIND`/`HERMES_PORT` wiring → update COOKBOOK + `docker/README.md` →
cross-ref §2.7/`CC-74`.

**Measured today, for the record:** the app calls **neither** door — `grep -rn "HERMES"` over
`apps/mercato/src` returns **zero** matches — so nothing breaks either way until `P2-5`.

---

### 🔍 MEASURED 2026-10-12 — **`CC-51` is smaller than documented, and its stated blocker is FALSE: the `team` concept already exists (but is parked).**

**(Owner's ask: *"if CC-51 is straightforward and small to fix, maybe better we fix that first — now that we
remembered it — so it is off the pipeline, then focus on phase 2"*.)**

**Measured first (rule 0b), before deciding.** `CC-51` is row 16's **team-leg**: the "own + team" row scope. Its
register entry and the plan's §7.2 both said B needs *"a real `team` concept the platform has never had — no team
entity, no membership, nothing on `auth` (measured 2026-10-11)."* **That premise is falsified.** Measured
2026-10-12 in the code repo:

- **The `team` entity EXISTS.** `packages/core/src/modules/staff/data/entities.ts` declares **`StaffTeam`**
  (`@Entity({ tableName: 'staff_teams' })`, `:5`), `StaffTeamRole` (`staff_team_roles`, `:36`) and
  **`StaffTeamMember`** (`staff_team_members`, `:73`) carrying **`team_id`** (`:85`) **and `user_id`** (`:94`) —
  the exact user↔team link B needs. Real API routes (`api/teams.ts` 214 lines, `api/team-members.ts` 305 lines),
  commands, backend pages, seeds — **236 files**.
- **Only ONE team concept exists** (all 7 `*team*` table names are in that one module) — so B would build on it,
  not duplicate it (L136).
- **What is genuinely missing** (B's real remainder): a `teamField`/`teamFeature` declaration pair (`OrmEntityConfig`
  has only `ownerField`/`ownerFeature`, `factory.ts:206`); the "my teams → member ids" expansion (the resolver at
  `factory.ts:1455-1483` resolves only the owner branch; `organizationScope.ts` has no team branch); and the third
  role mode (`all | own | team`).
- **A NEW blocker the register never named: the `staff` module is PARKED.** It sits in the reference section of
  `apps/mercato/src/modules.ts` (off unless a developer enables it, alongside `sales`). B's plumbing can be built
  without it, but **nothing can use team scope until teams are live — and enabling `staff` is a product
  decision** (rule 11).

**Verdict.** B's "large" half (entity + membership + schema + UI) is **already built**, so `CC-51` is *smaller*
than documented — but it is **not** the small, self-contained fix the owner's condition hoped for, because it now
gates on **enabling a parked module**, which is the owner's call, not a technical gap. **The register-entry
wording was corrected in the same change (rule 13)** — in `COMPLETION-CALLBACKS.md` (`CC-51`),
`PLAN-ROW16-own-team-row-scope.md` §1/§7.2, `PLAN-SUPPLEMENTARY-CORE-QUEUE.md`, `NEEDS-YOU.md`,
`platform_points.md` (NOW cell + LIST row 16).

**What this means for the order.** The honest reading of the owner's instruction: the condition ("straightforward
and small") is **not met in the form the register leads you to expect** — but the *remainder* is genuinely small
once the parked-module question is answered. So the answer is a question, not a build. (The memory file and this
box carry it.)

---

### ✅ THE TOOLING SET'S SECOND SLICE — **`SR-41` (named escape hatches) built, tested, and measured: 202 holes in the repo, 169 of them unnamed — and the gap is ONE-SIDED (TypeScript directives are all named; ESLint's are not). Plus a correction to `SR-46`'s stated home, found by measuring where the DS plugin actually runs.** *(2026-10-16, evening, third pass)*

**The requirement, in one line.** *"The lesson is not 'have escape hatches' — it is **name them**, so one search finds every one."* A hole with no reason is indistinguishable from an accident, and the next reader cannot tell whether it is still needed.

**★ THE CONVENTION — each tool's NATIVE reason form, so nothing new is learned or configured:**

```ts
// eslint-disable-next-line no-console -- the CLI's one legal writer (see logger.ts)
// @ts-expect-error: the upstream signature is wrong for the 3rd arg (fixed upstream in v5)
```

**Built:**

| Artefact (code repo `workspace/starting-kit`) | What it is |
|---|---|
| `scripts/check-escape-hatches.mjs` | The census: counts every directive hole, splits **named / unnamed**, and lists the unnamed ones with `file:line`. `--json`, `--fail`, `--root <dir>`, `--help`. |
| `scripts/__tests__/check-escape-hatches.test.mjs` | **5 / 5 pass** — including the **trap** (a bare rule list is *not* a reason) and the **precision case** (prose is *not* a hole). |
| `package.json` | `check:escape-hatches` (census) and `check:escape-hatches:fail` (enforcement). |

**★ THE MEASUREMENT (the real repo, 2026-10-16): 7,968 files scanned · 202 holes · 33 named · 169 unnamed.**

| kind | total | named | unnamed |
|---|---|---|---|
| `eslint-disable` | 168 | 8 | **160** |
| `ts-nocheck` | 10 | 1 | 9 |
| `ts-expect-error` | 22 | **22** | 0 |
| `ts-ignore` | 2 | **2** | 0 |

**★ THE FINDING — the backlog is ONE-SIDED, and that changes what it means.** Every `@ts-expect-error` and `@ts-ignore` in the repo already carries a reason (**24 of 24**); only **8 of 168** `eslint-disable`s do. So this is not a discipline failure — it is a **convention gap**: nobody was ever told to write a reason after ESLint's `--`. That reframes the work from *"people are careless"* to *"write the rule down"*, which is the difference between a useful check and a nagging one.

**Two design decisions worth naming.**
- **`--fail` is deliberately NOT the default.** The first job is to *answer a question* — "how many holes, and where?" — and a census that refuses to print when it finds something is useless. The report always prints and exits 0; `--fail` enforces, for once the backlog is cleared. This mirrors the repo's existing `check:time-bombs` / `check:time-bombs:fail` split rather than inventing one.
- **A directive counts only when it OPENS the comment.** Not a style choice — it is how *both* tools parse — and it removes a real false-positive class in this repo: `// TS2578 "Unused '@ts-expect-error' directive" …` is a *sentence about* a directive, not a hole. The rule was added **after the first run counted such a line** (23 → 22 `ts-expect-error`), and a regression test pins it. **This is the second time in two slices that running the thing on the real repo found a bug in the thing** (the one-truth slice's `--json` purity was the first).

**Deliberately excluded:** `as any` / `as unknown as` — type *assertions*, not guard bypasses, ~4.4k in `src`. Requiring a reason on each would bury the 202 real directive holes in noise. Recorded in the checker's header as an exclusion, not an oversight.

**★ A CORRECTION FOUND BY MEASURING — `SR-46`'s stated home does not work.** The plan (and the SRS) place the **two-reads lint** on `packages/eslint-plugin-ds`. Measured: that plugin runs only on **backend-UI files** — `eslint.ds.config.mjs` scopes it to `packages/{core,enterprise}/src/modules/**/backend/**` + `packages/ui/src/backend/**`, and `yarn lint:ds` targets the same. **A settings-read lint there would never fire on the files that read settings** (which are server/config modules). It belongs in the `scripts/check-*.mjs` family, where the **cross-file** drift is visible — and the target is real and large: `process.env` is read **718×** in `src`, with `NODE_ENV` ×205, `BASE_URL` ×114, `QUEUE_STRATEGY` ×72. Recorded, not worked around; the remaining slice is now `SR-38` + a re-homed `SR-46`.

**Also observed — NOT this slice's work.** `node --test scripts/__tests__/*.test.mjs` reports **7 pre-existing failures** (dev-splash / dev-memory-sampler / watch-packages) against a **326-pass** suite. Untouched here: the only shared file edited is `package.json`, and only to add two `check:*` keys. Recorded so a red suite is not mistaken for this slice. **And the not-committed note stands:** the code repo's new files (`scripts/check-one-truth.mjs`, `scripts/check-escape-hatches.mjs`, both `__tests__`, `package.json`) are still **unstaged** — explicit paths, both repos.

**Next:** `SR-38` (digital-twin harness — fixtures typechecked against the real interfaces) and the re-homed `SR-46`; then the critical path proper — identity (`SR-02`/`SR-07`) → **`SR-12` (per-tenant engine home, the fix for `CC-84`)** → `P2-9b` step (1).

---

### ✅ THE TOOLING SET BEGINS — **the next step was NOT the switchover: the SRS's own sequencing shows `SR-12` gates `P2-9b`, and `SR-12` is the fix for the open `CC-84` tenancy hole. So the tooling set lands first (it "makes everything after cheaper"), its first slice is built and tested, and `P2-9b` is split so the OpenCode deletion can be deferred.** *(2026-10-16, evening, second pass)*

**The decision, and the evidence that made it.** The owner delegated: *"Do what's best for the platform and development productivity."* Two candidates were on the table — the `P2-9b` switchover, or the architecture workshop's approved tooling set. **The SRS decided it, in a diagram the checklist had not surfaced** (`08-THE-SRS.md` §4):

```
SR-38, SR-39, SR-41, SR-46   ← tooling; land FIRST; no blockers; make everything after cheaper
        │
SR-02 + SR-07 (identity)     ← land together
        │
        └── SR-12 (per-tenant engine home = CC-84)   ← GATES P2-9b
```

**`P2-9b` is gated by `SR-12`** — the per-tenant engine home, which is the fix for **`CC-84`**, still **open**: the worker's tool calls all run as **one superadmin identity**, so a Hermes turn executes platform tools **outside the chat's own tenant**. **Flipping the default to Hermes before `SR-12` lands would make that hole the *default* path** — the one every tenant gets — instead of a path behind a non-default engine. The owner's own note sharpens this rather than softening it: *Hermes keeps its development skills and may be used for coding at some point.* A coding agent carrying broad file/terminal tools, running as a single superadmin identity, is exactly the shape `CC-84` names.

**★ THE OWNER'S RULING — `P2-9b` is now TWO steps, and the deletion is deferred.** *"if it is safer and not much more time and effort consuming, we can keep opencode aside and deploy our functionality on hermes and revisit deleting opencode later - if its presence creates no issues. so that deleting it doesnt crash something we are unaware of."* Adopted, because it **is** safer and costs nothing: **(1)** the default-flip to Hermes + the `hermes-local` retirement (`CC-74`) — after `SR-12`; **(2)** the OpenCode deletion (`R28-6`/`N-8`) — **DEFERRED**, OpenCode stays in place un-defaulted, revisited once its presence has proved harmless. A deletion is the one step that cannot be un-taken, so separating it from the flip is free risk reduction.

**★ THE FINDING THAT CHANGED THE DESIGN — the repo already runs the pattern.** The SRS marks all four tooling requirements **BORROW** (*"the mechanism comes from a platform study"*). **Measured in the code repo, that understates what exists:** `scripts/check-version-alignment.sh` *already is* one-truth (one fact, many representations, checked mechanically), and `scripts/check-agents-md-budget.mjs` + `scripts/agents-md-budget.baseline.json` *already is* the ratchet (`SR-40`) — *"a ratchet on the representative root-to-module chains recorded in the baseline: when a chain already exceeds the budget, the nested part may only shrink"*. So the work is to **generalise a pattern we run**, not import a foreign mechanism — and the repo's conventions (a `scripts/check-*.mjs` with `--json`, a `--root <dir>` override for testability, a `scripts/__tests__/*.test.mjs` run by `node --test`, a `package.json` `check:*` entry) are adopted rather than reinvented. Plan: [`PLAN-tooling-set-SR-38-39-41-46.md`](library/development/PLAN-tooling-set-SR-38-39-41-46.md).

**★ THE FIRST SLICE, BUILT AND TESTED — `SR-39`'s first instance: the Hermes pin digest.** Chosen because it is the fact that **actually drifted**, measured the same day (`CC-90`): the re-pin updated three of four copies and left `verify_pin.py` naming the previous revision.

| Artefact (code repo `workspace/starting-kit`) | What it is |
|---|---|
| `scripts/check-one-truth.mjs` | A **registry-driven** check: one fact, N representations, and a rule — ≥2 readable and all equal → PASS; any differ → FAIL **printing every copy so the stale one is named**; a copy that disagrees with itself → FAIL; fewer than 2 readable → SKIP **loudly**, because silence there would be a false green. |
| `scripts/__tests__/check-one-truth.test.mjs` | **4/4 pass**, including a **mutation proof** (one copy drifted → the check must FAIL and name it) and the self-conflict case. |
| `package.json` → `check:one-truth` | Joins the existing `check:*` family. |

**Verified** on the repo's own toolchain (`workspace/.toolchain/node24`, v24.19.0): the checker **PASSES against the real repo** (all three copies read `07ee857b…`), and `--json` is pure JSON. **The test caught a real bug in the checker** — the first run put the JSON report *plus* a human status line on stdout, so `--json` was unparseable; two tests failed and named it, and the status line now goes to stderr in that mode.

**A second finding, recorded rather than worked around.** `HERMES-PIN.md` holds **two different 32-hex digests for the same tree** — `f57f729d…` in its §1 table and `07ee857b…` in its "computed twice" note — and never says which is *the* pin digest. That is exactly what a one-truth check exists to remove, and it is why the document is **not** registered as a representation yet: a checker cannot demand agreement from a document that does not agree with itself. **Open sub-item.**

**⚠️ WHAT THIS PASS DID NOT DO.** No product behaviour changed — all four tools are development-time checks. Nothing was trimmed from Hermes, no Hermes file was edited, and **the switchover was not started** (it is gated on `SR-12`, which is gated on this tooling set). The code repo's three new files are **not committed** — the handover's rule is that a batch ends with an explicit-paths commit in **both** repos, and that is a separate, deliberate step.

---

### ✅ THE WARM-UP'S LAST LEG, THE HANDSHAKE GATE, AND TWO NUMBERS CORRECTED — **the cold fill was caught live (2,051 s → 4.1 s warm), the gate passes on the re-pinned worker (103.9 s), and running both surfaced two real defects: the CPU gain is +10 % on the whole fill (not the +56 % a segment suggested), and the container's pin verifier was still naming the PREVIOUS revision.** *(2026-10-16, evening)*

Three legs were open: the cold fill had never been seen live; the stdio handshake gate had not been re-run on the re-pinned worker; and the CPU change's effect was a *segment* measurement that had been reported as the fill's. All three are now measured — and each one corrected something already written down.

**1. ★ THE COLD FILL, CAUGHT LIVE AND UNATTENDED.** The owner's Docker restart emptied the model's RAM cache, and the warm-up loop engaged **by itself** — `docker logs mercato-hermes-warmup` shows `warming from session 20261016_100451_37afd4` followed by a 60 s heartbeat for **2,051 s**. The model's own log then gave the authoritative numbers:

| | measured |
|---|---|
| prompt eval (cold) | `2051115.42 ms / 16560 tokens` = **8.07 tok/s** |
| warm-up verdict | `DONE in 2051.4s — COLD -> prefilled all 16560 tokens` |
| **the NEXT probe (the proof)** | **`already WARM (16,559 of 16,560 tokens reused)` in 4.1 s** |

So **2,051 s → 4.1 s (≈500×)**, and the replay is byte-faithful to **1 token in 16,560**. The verdict reads `COLD -> prefilled` rather than `COLD -> warmed` deliberately: `usage.prompt_tokens_details.cached_tokens` reports the cache state **as the request STARTED**, so a cold cycle legitimately reports `0` even though it just filled the cache — the *next* request is what proves a fill (**LESSONS L175**). The message was rewritten so it states the moment rather than implying failure.

**2. ★ THE CPU GAIN, RE-MEASURED HONESTLY — +10 % on the fill, not +56 %.** The whole 16,560-token cold fill measured **8.07 tok/s at 8 CPUs** against the historical **7.32 tok/s at 4** — i.e. **+10 %** (2,264 s → 2,051 s), not the **+56 %** a same-progress-point sample suggested (7.81 → 12.18 tok/s at 2,048 tokens). Both are true; they answer different questions. The prefill rate is **length-dependent** (the same 4-CPU server ran **12.26 tok/s on 1,148 tokens** vs **7.32 on 16,572**), so a fixed *early* progress point samples the most favourable part of the curve for both conditions and flatters the change — the 8-CPU run degrades over the fill more steeply (12.18 → 8.07) than the 4-CPU one (7.81 → 7.32). **The whole-fill figure is what a first turn actually pays**, so it is the headline; the +56 % survives only as a labelled segment. Recorded as **LESSONS L174**, with an addendum in **L173** (whose headline number this supersedes) and the refinement in `CC-89`. *I had already predicted this in the daily log — "the CPU fix's gain on the real 16.6k prompt will be smaller than the short-prompt ratio suggests" — and the measurement confirmed it.*

**3. ★ THE HANDSHAKE GATE — and its first failure was the INSTRUMENT, not the worker.** The gate drives a real worker over stdio and waits for frames. Its first run failed five checks at once (`no frame within 60s` ×4, plus an "unexpected frame"). **Nothing was wrong with the worker:** the entrypoint digest-verifies **18,248 files** over a Docker Desktop bind mount and the worker imports **46 locked dependencies** before it emits anything — measured **~3–4 minutes** — so every "missing" frame was simply *late*, and the "unexpected frame" was the **correct answer to request id 1** arriving after the 60 s window had been declared a failure. The gate had one clock, sized for a *conversation* frame (~1 s warm), applied to a *boot*. Fixed by splitting them — `BOOT_TIMEOUT_S` (600 s) for the first frames, `FRAME_TIMEOUT_S` (60 s) after the handshake — and recorded as **LESSONS L176**. The re-run then passed:

```
ok  client.capabilities    -> {'server_requests': [16 methods]}
ok  gateway.capabilities   -> {'per_session_exclusive_submit': True}
ok  ping                   -> {'pong': True}
ok  gateway.ready          -> ['change_events', 'replay_epoch', 'skin']
ok  process.stop           -> answered
gate: worker stdout frames: 5 (every one is a JSON-RPC frame)
GATE PASSED in 103.9s — the pinned worker booted, answered the measured handshake, and stopped on process.stop.
```

**All 5 stdout frames are valid JSON-RPC** (the channel discipline the gate exists to keep honest), and the run took **103.9 s** on `hermes-gateway:p2-9a` / tree `07ee857b…`. **This closes `CC-86`'s last leg** — both its legs (the live turn and the handshake) are now re-proven on the new pin.

**4. ★ THE DEFECT THE GATE FOUND: the container's pin verifier was one re-pin behind.** The gate's *second* run failed before it reached the handshake, with a verdict that looked alarming and was not:

```
PIN BROKEN — the mounted tree is not the snapshot that was pinned.
  expected : ca760e97ff1ef1f0e2ed3deb0dfc2923
  actual   : 07ee857bdab59a875317035d8aaad4d6
  files    : 19728
```

The **tree was correct** — 19,728 files, `07ee857b…`, exactly what `HERMES-PIN.md` §1 and `library/.hermes_pin.py` record, and with **zero** `__pycache__`/`.pyc` files, so it is a genuine documented re-pin, not pollution. The **verifier was stale**: `docker/hermes/verify_pin.py`'s `DEFAULT_EXPECTED_DIGEST` still named the **previous** revision (`3569e846…`/`ca760e97…`), though its own docstring says to update it *"in the same change"*. The 2026-10-16 re-pin updated three of four copies — `library/.hermes_pin.py`, `HERMES-PIN.md`, and the compose's `HERMES_PIN_DIGEST` default — and **missed this one**. Effect: any invocation **without** `HERMES_PIN_DIGEST` (a manual `docker run`, a test, this gate) rejects a **correctly-pinned** tree. The live stack was unaffected *only* because `docker-compose.hermes.yml` injects the env. **Source corrected (the pin of record's value), and raised as `CC-90` — open, because the image must be rebuilt to carry it.** ⚠️ **`workspace/starting-kit/` is gitignored, so this fix is local-only — this entry and `CC-90` are its durable record.**

**5. A side-finding that corrects a justification: the worker runs `journal_mode=DELETE`, not WAL.** The gate's worker log carries `state.db: linked SQLite 3.40.1 … vulnerable to the WAL-reset corruption bug — using journal_mode=DELETE instead of enabling WAL`. That is the worker's own runtime choice, and it means the warm-up's stated reason for mounting the state volume **read-write** ("SQLite cannot read a WAL database through a read-only mount — the reader needs the `-shm`") **does not apply to this database**. The rw mount is harmless and the script still opens the DB `mode=ro`, so nothing is wrong; but the note as written justifies the mount with a mechanism the deployment does not use. *(The same log also flags the pin's bundled SQLite as WAL-reset-vulnerable with an upgrade path — a separate, recorded observation, not a defect we introduced.)*

**6. ★ THE MEASUREMENT THAT UNBLOCKS THE NEXT STEP — a turn-shaped request reuses 99.92 % of the turn prompt.** The switchover's last blocker was arithmetic: §4.3 of the decision record measured a real cold turn at **`usage.prompt = 16572` / 2,280.4 s — 95 % of the worker's own 2,400 s stale ceiling, ~120 s of headroom.** The warm-up *should* retire that, because it prefills the shared prefix outside any turn. But "the prefix request reuses 16,559 tokens" is **not** the same claim as "a turn reuses it" — a turn's prompt diverges after the tools block (a `user` block where the warm-up leaves the assistant generation prompt), and it would miss entirely if the worker assembled the system prompt per turn. So a **turn-shaped** request — the exact stored system text + the exact stored tools + one user message — was sent to the same endpoint the worker uses:

| | measured |
|---|---|
| `prompt_tokens` | **16,572** — *exactly* §4.3's live-turn `usage.prompt = 16572`, so the probe is faithfully turn-shaped |
| `cached_tokens` | **16,558** |
| reused | **99.92 %** |
| **tokens the turn must prefill** | **14** |

**So a turn's own prefill collapses from 2,280.4 s to ~14 tokens of work**, and the 2,400 s ceiling stops being marginal *for a turn* — the big prefill no longer happens inside one; the warm-up pays it once, in the background. **The honest caveat:** this holds for turns arriving *after* the warm-up has filled the prefix (the steady state — the loop engages within ~30 s and re-checks every 600 s); it does **not** abolish the cold-start window, where a turn still pays its own prefill. The warm-up converts a **per-conversation** cold cost into a **one-time** one. Recorded as **§4.6** of [`DECISION-p2-9b-stale-timeout-trade.md`](library/development/DECISION-p2-9b-stale-timeout-trade.md).

**⚠️ WHAT THIS PASS DID NOT DO.** No code was written for the product; no Hermes file was forked or edited; nothing was trimmed. The changes are the gate's two clocks, the warm-up's verdict wording, and one stale constant in a local verifier. **`P2-9b` (the switchover) has not started** — its measurement leg is now **done** and no tool-side config is demanded by it (the lever is the system prompt, which no toolset knob reaches), so what remains is the one-change switchover itself: the default-flip + the OpenCode deletion (`R28-6`/`N-8`) + the `hermes-local` retirement (`CC-74`). It **awaits the owner's explicit go**, and `CC-90`'s image rebuild is a build step that waits with it.

**★ STANDING FORMAT (the owner's instruction, 2026-10-16).** Every pass states **what was done**, **its address in `MASTER-CHECKLIST.html`**, and **what is next** — and the HTML's **top section** (the `FRONTIER` array) is updated to match. This entry's frontier rewrite carries: *LAST DONE* (`CC-88`, **`CC-86` closed**, `CC-89` refined, `CC-90` open) and *▶ NEXT* (`P2-9b`'s switchover). The `.md` twin's §2 carries the same.

---

### ✅ THE WARM-UP BUILT AND VERIFIED — **the first turn's ~38-minute read is now pre-paid by a service: the model's own DB already stores both halves of the exact prefix, so the warm-up REPLAYS it instead of rebuilding it — measured 16,559 of 16,560 tokens reused in 1.4 s.** *(2026-10-16)*

The owner approved the recommendation and set the constraint: *"we do not compromize or chop off anything from hermis… Apply the optimizations that you find fit most… Approve it is working or not and report back."* Two changes were applied; **nothing was trimmed.**

**1. The CPU ceiling raised (`.wslconfig`).** The host has 8 logical CPUs, but the Docker VM was capped at 4, so every container saw 4 (`nproc`=4, `Cpus_allowed_list: 0-3`, no cgroup limit). The model service is tuned for 8 (`-t 4 -tb 8`, and its own benchmark measured 19.3 tok/s at 4/8 vs 13.2 at 4/4) — so `-tb 8` was being **silently clamped**, and every cold prefill ran at the measured 7.32 tok/s. `processors` raised `4 → 8`. This is a CEILING, not a reservation; it takes effect on the next WSL/Docker start.

**2. ★ THE WARM-UP (`docker/hermes/warmup.py` + the `hermes-warmup` service).** The gap it closes is narrow and specific: the **first turn after the model process starts**. Everything else was already fine — two real sessions recorded `cache_read_tokens = 16,724`, and a live probe measured a cold call at 112.2 s followed by warm calls at 1.2 s / 0.9 s (`cache_n` 1142 of 1148) — a *different* conversation reusing the shared prefix, ~93× faster. But the cache lives in **process RAM**, so each of the four measured model loads emptied it, and the next human to open a chat paid all ~38 minutes.

- **★ THE DESIGN CHOICE THAT MAKES IT SAFE — replay, never rebuild.** A warm-up that *reconstructs* the prompt drifts the moment anything changes. It does not have to: the worker already persists **both halves of the exact request prefix** in its own `state.db` — `sessions.system_prompt_hash` → the system text (measured **26,549 chars** for the newest session) and `sessions.tool_names` → the tools array in **literal OpenAI wire JSON** (measured **42,619 chars**, `{"version": "0.0.0", "tools": [{"type": "function", …}]}`). **26,549 + 42,619 = 69,168 chars — exactly the figure the prompt audit measured.** The script reads those two rows and posts them back unchanged, to the **same endpoint the worker uses** (`/v1/chat/completions`, so the server applies the identical chat template), with `max_tokens: 1` — prefill happens before generation, so one token forces the whole prefix through the model. **Same bytes in, same tokens rendered, same prefix cached; nothing to keep in sync because nothing is derived.**
- **★ MEASURED — and the number proves the byte-fidelity.** First live run: **`DONE in 8.1s — 16558 of 16560 tokens reused`**. That single figure carries both results: (a) the replay matched the model's cached prefix to within **2 tokens out of 16,560**, so reading those two DB rows really does reproduce the exact request a real turn sends; and (b) **8.1 s instead of ~2,264 s**. The service's own cycles then read **1.9 s / 1.4 s, 16,559 of 16,560**. The 1-token shortfall is not a miss — llama.cpp always re-evaluates the LAST prompt token because it needs its logits to sample the first generated token. *(Verdict thresholds corrected after this: judging on `prompt_tokens - cached <= max(8, 1%)` stops a perfect hit being mislabelled "PARTIAL".)*
- **Why it LOOPS rather than running once.** The case that hurts is the model restarting **under** a long-lived worker, which a boot-time-only warm-up would miss entirely. Each cycle reads back `usage.prompt_tokens_details.cached_tokens` and reports **COLD → warmed** (it just filled the cache) or **already WARM** (the cycle was ~free), so the loop is self-healing with **no restart detection at all**. A SKIPPED cycle (model still starting, or no session has stored a prefix yet) retries in **30 s** instead of waiting out the 600 s interval, so the warm-up lands the moment the stack is ready.
- **Two design points that look wrong and are not.** The service runs on a bare `python:3.14-slim-bookworm` (already the worker image's own base, so already on the host — verified it carries `sqlite3` 3.40.1) with the script as a **read-only bind mount**, so changing the script needs no rebuild and no worker restart. And it mounts the state volume **read-write on purpose**: SQLite cannot read a WAL database through a read-only mount, because the reader needs write access to the `-shm` wal-index file — the script itself opens the DB `mode=ro` and only ever SELECTs.

**★ A REAL BUG FOUND BY RUNNING IT (the first attempt was useless).** The first live run printed `SKIP — the model server is not answering at http://model:8080/v1 yet`. The model was up: the probe had built `…/v1/props`, and **llama.cpp's control endpoints (`/props`, `/slots`, `/health`) live at the ROOT, not under `/v1`** — so every cycle 404'd and the service would have sat there reporting "not ready" forever while looking healthy. Fixed by deriving the root from the base URL; recorded as **LESSONS L171**. *A warm-up that silently never warms is worse than no warm-up, because it reads as green.*

**⚠️ WHAT IS MEASURED vs WHAT IS NOT.** Measured: the replay is byte-faithful (16,559/16,560); a warm cycle costs 1.4–1.9 s; the compose service starts, loops, and reports correctly; the DB replay reads the right rows. **Not yet measured live: the cold fill** — a warm-up request landing on a *fresh* model process. The mechanism itself is already proven by the session history (a cold turn populates the cache, and later turns reuse it: `37afd4` = 16,572 cached **0**, then sessions reusing 16,724), and the warm-up performs exactly that prefill. **The live confirmation is deliberately deferred to the owner's Docker restart**, which empties the cache anyway — restarting the model now would take the stack down twice for one answer. *Expect `COLD -> warmed` in `docker logs mercato-hermes-warmup` after the restart; that is the leg to check.*

**Nothing was trimmed** — the owner's rule (`"you can trim stuff that you shouldn't (like you almost did with skills)"`) stands, and the fix does not need it: the dominant cost was a **cold-process cache miss**, not prompt length.

**★ AND THE ARCHITECTURE QUESTION ANSWERED — the containers are ALREADY running in Linux, so "deploy it inside the environment" is what already happens.** The owner asked why Windows Docker Desktop runs the stack when a VM-like environment already exists and the cloud target is Ubuntu. Measured: `docker info` reports `OS=Docker Desktop`, **`Kernel=6.18.33.2-microsoft-standard-WSL2`**, `storage=overlayfs`, engine **29.8.2**, 4 CPUs / 16 GB — and inside any container, `/etc/os-release` says **`Ubuntu 24.04.5 LTS`**. **Docker Desktop is not "Windows Docker": it is a front end for a Linux VM, and the containers are Linux processes in it.** What Docker Desktop actually adds is convenience — the CLI, `C:\…` bind mounts translated into the VM, port forwarding, and a managed Engine version. Where it costs us is exactly the CPU cap that was just fixed, plus **Engine-version skew** against the cloud server and **slower I/O** for `C:\` bind mounts. The separate `Platform-Server` VM (also Ubuntu 24.04.5 LTS, with Coolify/Traefik — see `vm-setup.md`) is the better **staging** target because it matches production. **Ruling recorded: Docker Desktop stays for development velocity; migrate when integration testing against the deployment target begins — not now.** *(The migration trigger is the deployment story, not this optimisation.)*

---

### ✅ The "instruction sheet" traced — **it is mostly Hermes' own developer guide, loaded only because the worker runs inside the Hermes source tree; and the re-read is NOT inevitable (measured: sessions that read 1 token and reused 16,724).** *(2026-10-16)*

The owner pressed the follow-up: *"If the chat is empty, where does the istruction sheet per chat comes from? And if it is the same instructions for all chats then why reading it every time a new chat opens?"* Measured against the worker's own `state.db` (opened read-only) and `agent/system_prompt.py`.

- **Where it comes from.** It is not stored in the chat — `build_system_prompt()` assembles it fresh per conversation in three tiers (stable → context → volatile) from: `/var/lib/hermes/SOUL.md` (663 chars, the identity) · built-in guidance compiled into `agent/prompt_builder.py` (~11.7k chars) · **project context files from the working directory, and the cwd is `/hermes-src`, so it loads Hermes' OWN `AGENTS.md` (11,952 chars)** · workspace/git snapshot + env probe + profile line + date line + runtime block (~2.4k) · **plus the tool definitions as a separate JSON array (~42.6k chars, 20 generic developer tools — no business tool)**. `memories/` and `skills/` are empty. **Total ≈ 69k chars ≈ 16.6k tokens; the user's own message is a few tokens.**
- **★ The correction (rule 13, applied to my own earlier statement).** I had said *"the model must read the entire instruction sheet for every new chat."* **Too absolute.** Measured: the server **skips** the read when the sheet is still cached — sessions `503acd` and `a32218` (2026-10-14) recorded **`input_tokens = 1`, `cache_read_tokens = 16,724`**; `275de2` = 433 read / 33,481 reused. Full re-reads happen only when the sheet changed or was evicted (`a43f3d` = 16,725/0 after a different-toolset session; `37afd4` = 16,572/0 two days later).
- **And the sheet is not identical anyway.** Same-day prompts share **96.7%** (only the `Conversation started:` date line differs, near the end); the **tool block shares only 6%** (diverges at char 2,543, inside the first tool's description); across a build change the system prompt shares only **36%**.
- **Why turn 1 is the expensive one:** turn cost = reading whatever is not cached + generating. Turn 1 reads the whole sheet; turn 2+ reads only the new words (947 tokens, 946 reused, 1.5 s).

**Consequence for `P2-9b`:** the single biggest block of the "instruction sheet" is Hermes' own developer guide — present only because the worker's cwd is the Hermes source tree. **★ CORRECTION (same day, rule 13):** I first wrote *"most of it is scaffolding a business tenant never needs"* — **too strong.** Measured per block, the split is **≈52 % developer-only / ≈48 % needed in any chat**: developer-only = `AGENTS.md` 11,952 + the coding brief ~2,822 + the file/terminal/code/browser/skill tools ~21,365 (≈8,650 tokens); needed in any chat = the behaviour rules ~8,862 + identity/date/workspace ~2,900 + the general tools ~21,183 (`delegate_task`, `manage_connections`, `tool_search`, `memory`, `clarify`, `web_search`…) (≈7,900 tokens). **And the 21 business tools ARE in the block** — listed by name inside `tool_search`'s deferred catalog (27 deferred tools in all), schemas loaded on demand. So the split is **backwards** for a business tenant (developer tools always-on, business tools deferred) — but it is not "most". **No changes made** (owner: *"do not make any changes till we have this all clear"*).

---

### ✅ The "cold start" MEASURED — **nothing sleeps; the wait is the first turn of every new chat (16,572 tokens ≈ 38 min), and the model server is actually running FOUR slots, not the one the design doc claims.** *(2026-10-16)*

The owner asked two questions — *is the platform not running all the time, and if so when does a cold start happen and why (RAM?); and if a cold start is unavoidable, could the system ping first, wait for a pong in the background, then send the prompt, with a "we are calling the folks to serve you" status so the wait feels alive?* Both are answered from measurement, not assumption.

- **Nothing sleeps.** Every service is `restart: unless-stopped`; `docker ps` shows all ten containers up and `mercato-model-local` (llama.cpp) **up 15 h**. `git grep` for `prewarm|pre-warm|warmup|warm_up|keepalive|keep-alive` across `apps/**`, `workspace/**`, `docker/**` is **empty** — no warm-up mechanism exists anywhere.
- **The "cold" is the first turn of each new conversation, not a sleeping server.** Every new chat must read its whole prompt into an empty KV cache before it can answer. Measured on the live worker: **16,572 tokens at 7.32 tok/s = 2,262.8 s ≈ 38 min** (the model's own log line `prompt eval time = 2262809.92 ms / 16572 tokens`). It is identical whether the server booted a second ago or 15 hours ago.
- **★ Rule-13 correction — the server runs FOUR slots, not one.** `library/ai/PAPERCLIP_HERMES_LLAMA_SERVER_SSOT.md` states the production baseline as `--parallel 1` ("Parallel slots: 1"), but the compose passes **no** `--parallel` at all, and this build's flag default is `-1 = auto`, which chose **4**. Two routes agree: the startup log `srv load_model: initializing, n_slots = 4, n_ctx_slot = 65536, kv_unified = 'true'` and the live `/props` `"total_slots": 4`. Unified KV means the four slots **share** the one 65,536-token buffer (the budget is not multiplied four-fold), but they compete for the CPUs. The doc's section now carries the measured note.
- **Second finding:** the host has **8 logical CPUs** (4 physical cores) but the **container sees only 4** (`nproc`=4; `docker info` `NCPU=4`) — Docker is limiting it, so the compose's `-tb 8` is clamped and its own benchmark comment (comparing 8/8 and 4/8) does **not** describe the running config.
- **The ping/pong idea, evaluated honestly:** a generic probe builds a *different* cache key than the real turn (the system prompt and toolset are per-session), so the server's prefix match (`f_sim_best`) would miss and the real turn would still prefill from scratch — and while the probe ran it would occupy one of the four slots. The **UX half is sound and cheap** ("fetching your answer…" is honest); the **pre-warm half cannot remove the per-session cold turn**. The real levers are a smaller system prompt (~6.7k of the 16.6k tokens), faster/more hardware, or an exact-prefix warm-up per tenant.

**Records:** the SSOT doc annotated (rule 13), lesson **L170**.

---

### ✅ The Hermes pin RE-TAKEN — **the worker was crash-looping (1,834 restarts) on a half-done re-pin, and the new extract could not import at the depth it landed — both found by measurement and fixed.** *(2026-10-16)*

The owner renamed the previous Hermes snapshot aside and extracted a newer download under the standard name (*"I renamed older version of hermes and extracted a new version with the same standard name."*). Two failures followed, both caught by measuring rather than guessing:

- **The worker crash-looped 1,834 times.** `mercato-hermes-gateway` verifies the pin at boot and **refused to start**: *"PIN BROKEN — expected `ca760e97…` actual `84fb84bf…` files 19728."* The guard was **working** — the recorded digest had simply not moved with the folder. The old snapshot was not gone: it survived, renamed aside as `hermes-agent-main-newer/` (`3569e846…`, 18,248 files).
- **The new extract landed one level too deep** (`hermes-agent-main/hermes-agent-main/…`), and the worker's `PYTHONPATH=/hermes-src` cannot import it — measured both ways in a one-off container (`ModuleNotFoundError: No module named 'tui_gateway'` nested; `IMPORT OK` flattened). Flattened in place, then digested.

**The pin is now `hermes-agent-main/` — revision `db44c462…`, 19,728 files, digest `07ee857b…`** (two independent routes agree: the harness's `os.walk` and a separate `os.scandir` walk; the worker's own `verify_pin.py` is a third). Every key symbol was re-verified present, so there is **no compatibility debt** — but the `P2-1`…`P2-9a` live proofs ran against the previous revision and are re-scheduled as **`CC-86`**. The rename had also left the old copy **untracked and NOT ignored** (`.gitignore` fixed in the same change). **Record: `HERMES-PIN.md` §1.1.2; lesson L169.**

**And the re-pinned worker was proven live the same day** — a real turn driven end-to-end through the ws door (`TURN DONE in 2280.4 s`, `usage.prompt = 16572`, the model answering `"ready"`). That turn is also the confirming half of the `P2-9b` measurement: the true production prompt is **16,572–16,725 tokens** (not the compose's 10,988 — that was the *uncached* slice), and the cold turn **completes but uses 95% of the 2,400 s ceiling** (~120 s of headroom).

---

### ✅ P2-4 DONE — **the tool door opens: an admitted tool call now runs through the one door under two gates, and the agent — not the model — chooses the menu.** *(2026-10-13)*

`lib/ai-tool-call-gate.ts` (new, the pure decision) + `lib/hermes-port-adapter.ts` (`resolveToolCall` made real) + the runner agent in `ai-agents.ts`; requirement written BEFORE the code (plan §2.10), full discharge record in §2.10 + the §4 row.

**What it is, in plain terms.** Until today the Hermes engine behind the door could not run a business operation at all — the door said "not supported". Now it can, but only through **two gates that both must pass**, and the design answers the owner's own question (*"shouldn't the tool be selected based on the agent type?"*). A **built-in agent** (the query runner) is admitted with a **fixed menu of exactly one tool** — the Business-IR pack, the one it needs all the time; a **user-facing agent** will start with a menu shaped by the task in hand (`CC-78`). The **model never picks the menu**: the agent declares it, admission records it on the run, and the door enforces it. A tool call runs only if **(1) the call belongs to this run** and **(2) the tool is in the menu the agent was admitted with** — and a valid grant does **not** buy a tool the menu never named. That is the difference between "the model chooses its tools" (forbidden) and "the agent chooses, the door enforces" (built).

**The evidence.** The four Hermes/gate suites **94 GREEN**; the whole package **122 suites / 1701 tests GREEN**; `tsc` **92 errors = exactly the pre-existing `CC-73` count, zero in the new or changed files**. The honest capability map flips to **`resolveToolCall ✓`** — for the first engine, all eight of the port's operations are real. **RED-then-GREEN: 10 mutations, all RED, restored md5-identical.**

**The hostile critic (a separate agent, command+output per claim) found two defects — both fixed in the same change:**

1. **A real authority-widening bug (the serious one).** The admission recorded the run's menu as a *copy*, but stored the execution **context by reference**. So a caller that kept its own reference and changed it *after* admission could silently escalate the run it had just admitted — the critic proved it live: flipping one field to "super admin" made the executed operation run as a super admin. That is exactly what the architecture forbids (*"the runtime may narrow the grant, never widen it"*). Fixed by snapshotting the context field-by-field, with a regression test that mutates the caller's copy afterwards and proves the recorded one does not move. **L147.**
2. **A production path nobody had exercised.** Every test handed the door its own recorder, so the **default** path — the one production actually uses, which calls the platform's real `executeTool` — had never been run; the critic called it "a dead path in production". Closed with a test that builds the door with **no** recorder and proves the real path is taken, under a fresh container, with the admission-time context intact.

**My own catch, before the critic ran.** The `P2-3` lesson (*a teardown must cover every exit path*) applies just as much to an **open**: the run's result channel was being opened *before* the three "this run cannot stream" checks, so a run that failed to start left a dead channel behind. Fixed by opening it only once the stream is genuinely live, with a test for both halves (nothing left behind on a failed stream; released when the turn ends). **L147** (same lesson).

**Named bounds, recorded not hidden (each registered the same change):** the acting person's permissions are checked at **admission**, not re-derived at execution (the run's envelope carries no features); the "grant" is still a **label** — gate 2 proves a call belongs to *this run*, not that the caller was permitted the operation (**`CC-77`**); the **task-shaped** starting menu for user-facing agents is destination (**`CC-78`**); and the **live worker bridge** — the pinned worker's tools are a closed set it loads itself, so it cannot yet be offered a platform tool on the wire — is **`CC-79`**, built and proven in the live-run rows. One critic aside recorded for later: the adapter's run registry is never pruned — pre-existing (`P2-3`), and `P2-6`'s bounded-memory scope.

**Next:** `P2-5` — engine selection at the door (OpenCode stays the default; the selector can pick Hermes), which is also the `CC-74` trigger that retires the old `hermes-local` service. **(Done — the block below.)**

---

### ✅ `CC-73` DONE — **the package's type gate says 0: 92 pre-existing test-only errors fixed, production untouched — and the critic caught a fix that had silenced an error without restoring the claim.** *(2026-10-14 — done BEFORE `P2-9b`, by the owner's delegation of the order)*

**Why it came first (the order was delegated: *"do them in the best order for the platform and development pipeline"*).** `P2-9b` is a **deletion** — the one shape of change where a clean type gate matters most, and the type-checker is the **only** instrument here that polices it (`jest` does not type-check — **L138**). The 92 errors sat in the **very suites `P2-9b` must edit and rely on** (`agent-runtime*`, `ws-c-*`, `api/ai/chat/__tests__/route.test.ts`, `max-steps-budget.integration`), so fixing them first gives the deletion a clean base and avoids editing the same files twice. And `CC-73` was **ready** (test-only, mechanical, no prerequisite) while `P2-9b` was **not** (its default-toolset hazard is still unsolved). Rule 15: do the straightforward thing now.

**What it was, in plain terms.** The package's type gate had been *decorative* since it was written — it extended the ROOT `tsconfig.json`, whose `exclude` swallowed the package's own `src/**`, so `tsc -p .` returned **TS18003** ("no inputs"). Turning it on (2026-10-12, `CC-73`) exposed **92 type errors, all in `__tests__`, production clean**. `jest` here does not type-check and the build is esbuild, so **neither command a developer runs would ever show them** — the type gate was the only instrument that could, and it was off.

**The fix, and its shape.** 27 test files; **zero production files**. Every fix landed at the **test layer** — no production type was loosened, widened, or made optional, and `tsconfig.json` was **not** touched (option (2), excluding `**/__tests__/**`, stays rejected: it would hide exactly the class of defect `P2-2`'s critic found). The classes: a test helper returning a union (`meta-pack`), jest mocks typed too narrowly, spreads of non-tuples, genuinely-optional production returns, deliberately-invalid inputs to validators, a dropped SDK field (`tools`, removed in ai-sdk 6.0.177), fixtures missing new required fields, and stale mock shapes.

**The gates.** `tsc … --incremental false` **exit 0, 0 errors** (was 92); full package **129 suites / 1890 tests GREEN** — identical to the `CC-80` baseline; **4 reverts (one per class) restored exactly 17 errors**, each file restored byte-identically by md5.

**A hostile critic (separate agent) found 1 MEDIUM + 3 LOW/NIT — all acted on.** The MEDIUM is the one worth recording: two BC tests asserted *"assignable to `AiToolDefinition`/`McpToolDefinition`"* — and the claim was **false**, not stale (`handler`/`isDestructive` are function-typed **properties** → contravariant parameters → a narrow input is not assignable to `unknown`). My first fix made the compiler quiet but left the assertion **near-tautological**, with the title still claiming the old thing. The critic compiled the original form to prove the falsehood. **Fixed: both titles and comments now state what they prove, and the friction is registered as `CC-81` rather than deleted.** Lessons **L166** (a type fix must restore the CLAIM; the title is part of it) and **L167** (a helper cast erases N types — document the trade-off; a fake that omits required fields is invisible while a cast stands in front of it).

**Bounds.** Nothing excluded from the gate; no production type touched; `CC-73` moves **no box** (debt — ONE NUMBER unchanged at 78/321). `CC-81` is scheduled, not fixed (fixing it changes a public interface's variance — rule 11).

---

### ✅ `CC-80` DONE — **the suite is HERMETIC now: the same two variables that turned 5 suites RED turn nothing red, and the acceptance is measured on BOTH sides.** *(2026-10-14 — found by `P2-9a`'s own gate, fixed the same day)*

**What it was, in plain terms.** The `ai-assistant` suite read the operator's shell. `P2-9a`'s first full-package run read **5 failed suites / 27 failed tests** — all `AiModelFactoryError: no_provider_configured` — and every one of those five passes in isolation, is byte-identical to `2128cf96`, and throws from **unchanged** code. The cause was reproduced **exactly** by exporting the app's own provider config (`OM_AI_PROVIDER=openai OM_AI_MODEL=…` → the same 5 suites, the same 27 tests) and characterised one variable at a time. The five suites mock the provider **registry**; `model-factory.resolveModel` reads the provider axis from the **environment**. So a gate that reads "full package green" could read RED on a correct tree — or, worse, GREEN while a suite quietly depended on ambient configuration.

**The fix.** `packages/ai-assistant/test-env-hermetic.ts` (NEW) clears the provider axis once per test file and restores it in `afterAll`, wired as `setupFilesAfterEnv`. It clears by **PREFIX** (`OM_AI_`, `OPENCODE_`) rather than by a hand-list: the axis is a *family* (per-module `OM_AI_<MODULE>_MODEL`/`_PROVIDER`/`_BASE_URL`, `OM_AI_AVAILABLE_*`, the pre-rename `OPENCODE_*`) and a hand-list goes stale the next time an alias is added — which is exactly how this defect appeared. Provider credentials/endpoints are cleared too (an ambient key makes a provider `isConfigured()` for the real registry). A 26-test suite covers the policy and the side effect.

**The acceptance, both sides measured — and this is the part that matters.** Clean shell → **129 suites / 1890 tests GREEN**. With `OM_AI_PROVIDER=openai OM_AI_MODEL=Qwen2.5-7B-Instruct OPENCODE_PROVIDER=openai` exported → **129 suites / 1890 tests GREEN**; that side was **5 failed / 27 failed** before the fix. A mutation that drops the prefix rule turns the poisoned run **RED** again (3 failed), so the acceptance measures the **fix** and not the shell it ran in. `tsc` **92 = the pre-existing `CC-73`, 0 new**.

**Two traps, both recorded (`L165`).** (1) **A clean run is the baseline, not the proof** — it was already green *before* the fix; the evidence is the poisoned run, and it belongs in the record with the RED quoted before the GREEN. (2) **The fix's own first unit test was wrong**: it asserted the policy via `providerEnvKeys({})`, which cannot exhibit a **prefix** rule — an empty fixture contains no key for the rule to match, so nine assertions failed. Passing `process.env` would not have fixed it either (the setup has already cleared those keys by then). Caught only because the poisoned condition was the acceptance harness.

---

### ✅ P2-9a DONE — **the bridge is built and PROVEN LIVE: a Hermes-served chat called one of the platform's 21 MCP tools and read a real platform result back — `CC-79` is DISCHARGED, and the default did NOT move.** *(2026-10-14, §2.15.1)*

**What it is, in plain terms.** `P2-9`'s measurement found that the switchover as originally sketched would take the chat's **21 platform tools** away with OpenCode. The owner chose option 1 — preserve the capability first. This row builds that bridge. The pinned worker already **ships a complete MCP client**; it was inert for exactly two measured reasons: the **SDK was not installed** in its image, and it had **no `mcp_servers` config**. So the row installs the pin's own `mcp` extra (`uv sync --frozen --extra mcp` — the pin's `uv.lock` already resolves `mcp==2.0.0`/`httpx2`/`starlette`, so nothing in its resolution is disturbed), writes the server entry **through the pin's own writer** (`_save_mcp_server`, so it passes the pin's validator and the default-strip pass rather than being hand-edited into a volume), and forwards the key the worker needs.

**The exit gate, met — a live turn, and a real platform answer.** Driving `P2-7`'s own harness against the `p2-9a` image:

```
    evt tool.complete :: {"name":"tool_search","args":{"queries":["mcp__open_mercato__context_whoami"]}, …}
    evt tool.complete :: {"name":"mcp__open_mercato__context_whoami","args":{},
                          "labels":[{"kind":"mcp","app":"Open Mercato","action":"context whoami"}, …]}
  ANSWER: {"result":{"tenantId":"2867a986-…","userId":"df4356e6-…","isSuperAdmin":true,
                     "features":[ … ],"featureCount":25}}
  PASS — a real turn answered and ended on done (287 events) in 859.1s
```

The answer is the platform's **own** `context.whoami` result — a real tenant, a real user, `isSuperAdmin: true`, **25 real feature keys** — reached by the model through `tool_search` → the MCP call, labelled by the worker's own toolset machinery as `{"kind":"mcp","app":"Open Mercato"}`. Re-measured on the restored stack: **`DISCOVERED: 21`**, toolset `open-mercato tools=21 mcp=21`, and `open-mercato` **present in `ENABLED TOOLSETS (cli)`** — so the model is genuinely offered them, not merely registered.

**The proof that reads the right VIEW (L159).** The bootstrap verifies itself with **two** reads: `read_raw_config()` (the file as written — proves the **placeholder** is at rest, so no secret is in the volume) and `load_config()` (env-**expanded** — proves the runtime resolves it to the key). One read alone is a lie: the first cannot see a broken resolution, the second cannot tell a resolved placeholder from a leaked secret. Measured live: `config.yaml` holds `x-api-key: ${MCP_SERVER_API_KEY}` and the pre-existing `onboarding.seen.profile_build_offered` was **preserved**. The bootstrap runs as a subprocess with **stdout suppressed** (the pin's CLI modules print; stdout is the frame channel); **no credential ⇒ fail-soft, a refused bootstrap ⇒ fatal.**

**The gates, and one NEW pre-existing defect the gate exposed (`CC-80`).** Wiring suite **53/53**; full package **128 suites / 1864 tests GREEN**; `tsc` **92 = the pre-existing `CC-73`, 0 new**; **21/21 mutations RED**, byte-restored (md5s in §2.15.1).

**A hostile critic (separate agent) found THREE VACUOUS GUARDS and a boot regression — all fixed, all re-measured (`L164`).** This is the part the author's own mutation set could not see: the 18 mutants were written by the same hand as the guards, so they varied only what the author was already thinking about. **(1) HIGH** — the test named *"writes through the pin's own writer, not hand-rolled YAML"* asserted only the **import**; replacing the call site with a hand-rolled write left the suite **53/53 green**. **(2) HIGH, security-relevant** — *"logs the credential's SOURCE and LENGTH, never its value"* extracted the argument after the last quote, so it was blind to an **f-string** (`log(f"... {key}")`), where the expression lives *inside* the quotes: mutating the entrypoint to **print the secret** left the suite **53/53 green**. **(3) LOW** — `toContain('--extra mcp')` was satisfied by `--extra mcp-bogus`. All three now turn **RED** against their mutants. **(4)** The critic also reasoned out a boot regression: `mcp_shared` is `external`, so on a host where fullapp has never run, compose fails at **volume resolution** before the entrypoint's fail-soft path — the `external` declaration is right, the **comment** was wrong, and it now states both preconditions and that they fail differently. The first full-package run read **5 failed / 27 failed** — investigated rather than assumed: all five suites pass **in isolation**, all five are **byte-identical to `2128cf96`**, and the throw (`AiModelFactoryError: no_provider_configured`) comes from **unchanged** `model-factory.ts`. Reproduced **exactly** by exporting the app's own provider config (`OM_AI_PROVIDER=openai OM_AI_MODEL=…` → the same 5 suites, the same 27 tests), and characterised one variable at a time. A cross-file env **leak** was ruled out with a positive control (an instrumented run printed **128** probe inits and **zero** env changes). **The suites are simply not hermetic against the ambient environment** — invisible from a clean shell, which is how the gate above was read. Recorded as **`CC-80`** and **L163**.

**Two live defects fixed while proving it, both mine.** (1) `HERMES_MCP_URL` pointed at the unreachable `host.docker.internal`; it now points at the platform's own service (`http://mcp:3001/mcp`). (2) The probe discovered that the key must be in the **worker's own environment** for `${MCP_SERVER_API_KEY}` to resolve at read time — so the entrypoint exports it, and a bare `docker exec` (which sees only the container's *base* env) shows `DISCOVERED: 0`, which is exactly why the live proof must be a **turn**, not a probe.

**Next: `P2-9b` — the switchover.** One change: the default-flip, the OpenCode deletion (`R28-6`/`N-8`), the `hermes-local` retirement (`CC-74`). Its requirement is §2.15. **One hazard carried forward and recorded:** with the worker's **default** toolset set the prompt measures **~16,757 tokens**, and a cold prefill at the measured ~5.5 tok/s puts a first turn at **≈3000 s** — **longer than the worker's own `HERMES_LOCAL_STREAM_STALE_TIMEOUT: 2400`** ceiling. The proof above isolated the **capability** (it pinned `HERMES_TUI_TOOLSETS: open-mercato` through `P2-7`'s out-of-repo override) and does **not** claim a production-shaped default-toolset turn. **UPDATE 2026-10-16:** that hazard is **RULED** — Option 1 of [`DECISION-p2-9b-stale-timeout-trade.md`](library/development/DECISION-p2-9b-stale-timeout-trade.md): keep the ceiling, on-demand tool loading is the standard behavior (the pin ships progressive disclosure ON by default; prompt-cache reuse measured ON — 168.7 s cold → 1.5 s warm), and `P2-9b` = measure-and-configure: the one in-process re-measurement of the assembled prompt first (the ~16,757 figure is under rule-13 re-measurement against the compose's own 10,988), config only if the numbers demand, then the switchover. The process failure is now `WORKING-RULES.md` **rule 18**.

---

### ⚠️ P2-9 — **the requirement is written and the premise CORRECTED before any code: the switchover as §2.14 sketched it would remove the chat's 21 platform tools.** *(2026-10-14, plan §2.15 — requirement only; the `P2-9a` half is DISCHARGED above)*

**What was measured (rule 0b, the live stack).** `P2-8`'s plan called `CC-79` *"unaffected"* by the switchover. That is **false**, and the live stack says so: `mercato-opencode-local` is healthy and **connected to the platform's own MCP server** (`curl …:4096/mcp` → `{"open-mercato":{"status":"connected"}}`), and that server (`mercato-mcp-local`) exposes **21 tools** (`GET http://mcp:3001/health` → `{"status":"ok","tools":21}`). So **an OpenCode-served chat can call 21 platform tools today**, and deleting OpenCode removes that capability — which is exactly what `CC-79` names.

**The good news is measured too, and it is what re-ranks the fix.** The pinned worker **ships a complete MCP client** (`tools/mcp_tool_discovery.py`, `tools/mcp_tool.py`, `tools/mcp_tool_transport.py`; HTTP/SSE/stdio), and `tools/mcp_tool_config.py::_load_mcp_config()` reads `mcp_servers` from **`config.yaml`** with `${VAR}` interpolation. Two things are missing, both probed live inside the running worker: the **MCP SDK is not installed in its image** (`/build/.venv/bin/python3 -c "import mcp"` → `ModuleNotFoundError`; `SDK available: False`; `DISCOVERED: 0`), and it has **no `mcp_servers` config** (`_load_mcp_config()` → `{}`). With a temporary `mcp_servers.open-mercato = {url: http://mcp:3001/mcp, headers: {x-api-key: …}}` the same loader returned **`['open-mercato']`** — so the gap is **one image line (`pip install mcp`) + a generated config + the key volume**, *not* an upstream plugin build. The probe was reverted; the worker's `config.yaml` is back to its two original lines.

**The row is therefore re-scoped and the ORDER is the owner's call (rule 11):** **`P2-9a`** — the MCP bridge (install the SDK, generate the worker's `mcp_servers` config from the deployment, mount the key, **prove a live Hermes run calls a platform tool** = `CC-79`'s own check) — *recommended first*; then **`P2-9b`** — the default-flip to Hermes + the OpenCode deletion (`R28-6`/`N-8`) + the `CC-74` `hermes-local` retirement. `CC-79`'s own entry is re-ranked and corrected; the plan's §2.15 carries the full measurement table, the three ranked options and the build both halves dictate. **No code has been written for this row.**

---

### ✅ P2-8 DONE — **the worker's ws door is MOUNTED and the client CONNECTS it: a real turn was served over the new transport with NO hand-spawned process, the `ping` health gate green, and the default still `opencode`.** *(2026-10-14, §2.14.1 — THE SWITCHOVER, part 1)*

`docker/hermes/ws_host.py` (the door) + `docker/hermes/ws_entry.py` (the process that serves it — both NEW) · `docker/hermes/Dockerfile` (CMD → `ws_entry.py`, the `py_compile` gate) · `lib/hermes-gateway-transport.ts` (NEW — the seam) · `lib/hermes-gateway-client.ts` (re-pointed at the seam) · `lib/resolve-ai-runtime-port.ts` (the door's env) · `docker-compose.hermes.yml` + `docker-compose.fullapp.yml` (the wiring) · `__tests__/hermes-test-fakes.ts` (NEW — the shared `FakeHermesDoor`) · the seam suite, the restructured client suite and the extended wiring suite · the `p2-8:live` harness mode. Requirement written BEFORE the code (plan §2.14); full discharge record in §2.14.1 + the §4 row.

**What it is, in plain terms.** Until today the pinned worker could only be reached by **spawning** it — and the app container has no Python and no Docker socket, so in production **nothing connected at all**. This row opens the door the worker already owns: the pin's `tui_gateway/ws.py` speaks the *identical* wire protocol over a WebSocket but is a library **a host must mount** — so `ws_host.py` mounts it (three legs: `healthz`, a bearer-secret mint leg, `WS /api/ws?ticket=` behind the pin's own single-use tickets) and `ws_entry.py` serves it in a daemon thread **beside** the unchanged stdio channel. On the client side the transport became a **seam**: one interface, two implementations, so the client class, the port adapter and every event mapping are provably the same code on both wires. The default engine did **not** move.

**The evidence.** Full package **128 suites / 1838 tests GREEN** under the pinned **Node 24** — the client suite's wire tests now run `describe.each(['stdio','ws'])` over a shared `FakeHermesDoor`, plus a 25-test seam suite; `tsc` **92 = the pre-existing `CC-73`, 0 new** (a first run showed **104**: 12 new, all in the new transport test — jest does not type-check here, **L138**); **18 mutations all RED**, md5-restored. The hostile critic then found **1 real defect + 5 nits** (D1: the extracted stdio transport let stdout EOF win over the process exit and lose the exit code — fixed with a one-macrotask yield; N2: `close()`-twice was an unproven claim; N3: the ws fake was unfaithful about a refused upgrade — node 24 fires `onerror` **then** `onclose:1006`; N4: `gatewayReady` was always `null` in ws mode; N6: the door did not trim its shared secret — all fixed, with the gates re-run on the fixed tree: **1838 tests, tsc 92, 18 mutations RED**). Live, over the door: `healthz` 200 · mint **401** without the secret, a single-use 30s ticket with it (and the replay of a used ticket is refused **403**) · `ping` → `{"pong":true}` in an **81ms** dial · and a **real turn** through `P2-7`'s own harness **minus `docker exec`**: `tool_search`, the usage frame, a real model answer, a typed `done` — **183.4s**. **Every one of those legs was then re-run against the REBUILT image** (the critic's fixes touched `ws_host.py`) — including the padded-Bearer mint that proves the `N6` trim — and a fresh live turn answered `HERMES LIVE TURN OK` and ended on a typed `done` in **41.0s**; the full re-proof block is in §2.14.1.

**Two defects found in the build, both fixed.** (1) The port adapter's death event was reworded for a connection (a ws close code is not a process exit) and its test still asserted the old wording — the full gate went red on it, which is the guard working. (2) **Two of this row's own guards were vacuous — found by the mutation gate, not by reading** (**L156**): the wiring suite's "a key that appears only in a comment does not satisfy the assertion" fixtures passed **with comment-stripping disabled** (measured by probe), because a comment-only key can never be parsed by a mapping reader — the fixture could not fail. They were rewritten to put the key **both** in a comment and in another section of the same service, with a real mapping asserted as the control, and the mutant that removes the `environment:` gate now turns them RED.

**Next: `P2-9` — THE SWITCHOVER proper (ONE change).** The default-flip to Hermes + the OpenCode deletion (`R28-6`/`N-8`) + the `hermes-local` retirement (`CC-74`, whose trigger has been fully met since `P2-7`). `CC-79` (the live worker bridge) is the only item between the platform and a Hermes-served chat in production. **✅ The `HERMES_WS_TOKEN` prerequisite is DISCHARGED (2026-10-14).** Recreating the worker from the committed compose with the variable unset had proved the door disables itself (nothing listens, nothing published) and the stack's `.env` carried no such key, so a flipped default with an empty token would have failed closed at the mint leg with 401 (by design, `M2`). The owner asked me to supply the value: **48 random bytes (`secrets.token_urlsafe(48)`, 64 chars) are now in the git-ignored `.env`** (line 47, under a comment naming its role; the value is in **neither** repository — the door never exposes it, the app never logs it, and `.gitignore:44` keeps it out of git). Measured on the recreated worker with **no shell token**: the door listens again, `healthz` 200, `mint, NO secret` **401**, `mint, with the .env token` **200** (30s ticket). One-time per stack: the token never expires and is not consumed per run (that is the single-use ticket's job); rotate only on a leak, by changing that one value and recreating the worker + the app.

---

### 📋 P2-8 — **the switchover, part 1: the requirement written — production needs a CONNECTION the platform can actually make.** *(requirement §2.14 written 2026-10-14 — DISCHARGED, the ✅ block above)*

**Why this row exists.** `P2-7` proved the pinned worker serves a real turn — but the harness drove it by hand (`docker exec` into the worker's container), and in production **nothing connects at all**: measured 2026-10-14, the app container has **no Python and no Docker socket**, so it can neither spawn the Python worker as a child nor reach the Docker CLI. The switchover needs a door production can actually open.

**What the measurement found (rule 0b).** The pin's protocol is **transport-independent**: `tui_gateway/ws.py` speaks the *identical* wire protocol over a WebSocket and reuses `server.dispatch` **verbatim** — but it is a **library a host mounts** (`@app.websocket("/api/ws")` → `handle_ws(ws)`; the mounting pattern is demonstrated in the pin's own eval, `evals/liveness/ws_orphan_reconnect.py:61-63`), and **nothing in the worker's entrypoint mounts it** (the desktop product mounts it in-process). The old door (`gateway/platforms/api_server.py` — the OpenAI-compatible HTTP API on 8642) is a **different contract**, and it is the one being retired.

**The options (the owner decides — rule 11), with the recommendation.** **(1) The worker serves the ws transport; the app connects to a URL — RECOMMENDED:** a small **FastAPI/uvicorn** host inside the worker's **own** container (that image already has Python and the pin; the worker image does **not** ship aiohttp — measured, `ModuleNotFoundError` — so the requirement's original "aiohttp host" was corrected under rule 13 before any code was written), mirroring OpenCode's supervised-service shape exactly. **(2) `docker exec` from the app — rejected:** it needs the Docker socket in the app container, i.e. root-equivalent control of the host for every chat (§8). **(3) Python + the pin in the app image — rejected:** operationally heavy, and it breaks the one-supervised-service shape the architecture names. **(4) the old 8642 HTTP API — rejected:** a different contract, a new adapter family, and it is the door being retired.

**What this row builds.** A ws host in `docker/hermes/` mounting the pin's `handle_ws` behind the pin's own ticket auth, listening on `mercato-network-local` · the client's transport becomes a **seam** driven over ws instead of a spawned child · a `ping` health gate + a documented reconnect policy. **The default does NOT move here** (that is `P2-9`, one change with the OpenCode deletion and the `hermes-local` retirement).

**Named bounds.** The port contract is not widened; the platform's other two runtime routes are a different engine family and are untouched; `CC-79` is unaffected.

---

### ✅ P2-7 DONE — **Hermes SERVED A LIVE TURN through the pinned worker: the worker reached the LOCAL model and answered a real prompt, and the adapter's ordered typed events ended on a real `done` — proved TWICE, the second time production-shaped (the compose change alone).** *(2026-10-14)*

`scripts/hermes-live-turn.mts` (the harness) · `lib/hermes-live-turn-verdict.ts` (its pure, unit-tested judgement) · `__tests__/hermes-worker-wiring.test.ts` (guards the compose wiring) · `docker-compose.hermes.yml` (the forwards) · the `p2-7:live` script. Requirement written BEFORE the code (plan §2.13); full discharge record in §2.13.1 + the §4 row.

**What it is, in plain terms.** Until today nothing had ever driven a **real** turn through the Hermes worker — every test used a fake, and production never even connected. This row closes that: the harness connects the **pinned** worker in its own container, starts a run through the door (`startRun`), submits a prompt, and reads the events the adapter produces. The worker asked **its own** model — the local Qwen on this machine, reached through the URL the compose now forwards — and answered `HERMES LIVE TURN OK`; the adapter's typed events ended on a real `done`. The second run injected **nothing**: it read the container's own environment, so the **compose change alone** is what makes the worker reach the right model. And the wiring was broken in exactly the way only a live turn finds: the compose named none of the worker's own model config, so it would have called OpenAI's servers with a local model's name — measured, fixed, and now guarded by a suite that reads the compose's real `environment:` mapping. *(The guard's original fixture asserted that a key appearing **only in a comment** does not count; `P2-8`'s mutation gate proved that fixture vacuous and rewrote it — see **L156** and the `P2-8` block above.)*

**The evidence.** 19 tests across the two new suites; the full package **127 suites / 1771 tests GREEN** (= 1752 + 19) under the pinned **Node 24**; `tsc` **92 = the pre-existing `CC-73`, 0 new**; **7 mutations all RED**, md5-restored. Production-shaped run: `PASS — a real turn answered and ended on done (9 events) in 1955.4s`, `exit=0`, answer `"HERMES LIVE TURN OK"`, usage `input:10646 output:6`, event shape `["status","text","text","text","text","text","metadata","metadata","done"]`.

**What the forensic pass corrected (rule 13).** (1) The grace value first chosen (1800s) rested on one measurement, while the default-toolsets prompt measures **10,646–10,988 tokens (~1,905s prefill under load)** — the comment now cites all three measured turns and 2400s beats the slowest with 495s of margin. (2) The interim prompt-size estimate was **2.5× off** the model's own `prompt eval time` line (**L153**). (3) A gate run on the shell's node 22.22.2 falsely showed **2 unloadable suites** — the repo pins node 24 and `isolated-vm` ships no win32 abi-127 prebuild (**L154**). (4) The first production-shaped run's `PASS` line was lost when the background-task registry expired; the turn was re-driven with its output **teed to a file** (**L155**).

**Next: the switchover** — **one** change (§2.11 item 5 owns it): build the production **connection lifecycle** → flip the default engine to Hermes → delete OpenCode (`R28-6`/`N-8`) → retire `hermes-local` (`CC-74` — its trigger is now **fully met**: the selection half by `P2-5`, the live-run half by this row). **Its requirement (§2.14) is written BEFORE any code.**

---

### 📋 P2-7 — **the requirement written: Hermes must SERVE A LIVE TURN through the pinned worker — the half of `P2-6`'s *stated* exit gate that §2.12 did not write.** *(requirement §2.13 written 2026-10-13)*

**Why this row exists — a premise corrected, not hidden (rule 13).** `P2-6`'s **stated** exit gate — in §2.11's own record and in the selector's docblock written during `P2-5` — is *"serving a live turn over Hermes"*, and §2.11 (lines 372, 385) says **`CC-74` fires at `P2-6`** *"when … a real chat run has been served by the pinned worker"*. But §2.12 — the requirement actually **written** for `P2-6` — scoped the gate to *the five properties, proven through the port*, and the discharge proved exactly that, **against a `FakeClient`**. So the word "green" was **true of §2.12 and false of §2.11**: the five properties are proven, **no live turn has ever been driven**. This row builds the other half.

**What the measurement found (rule 0b, code repo + live stack, 2026-10-13).** `prompt.submit`/`submitPrompt` appear **only** in the client/adapter and are never executed outside `__tests__`; `docker/hermes/handshake_gate.py` drives only `ping`/capabilities/`gateway.ready`/`process.stop` — **no turn**. Production **never** calls `HermesGatewayClient.connect()` (the only `.connect(` calls are MCP clients), so a `hermes`-selected chat **fails closed** at `startRun` (`hermes-port-adapter.ts:346` throws *"not connected"*). The connection lifecycle is **unbuilt** (§2.11 deferred it: *"belongs with the live run, not with the selection"*). The worker is **UP** (`mercato-hermes-gateway`, Up 31h, image `hermes-gateway:p2-1`) and a local model is **UP** (`mercato-model-local`, llama.cpp, OpenAI-compatible). **But the worker's model config is MIS-WIRED:** its env carries `OM_AI_PROVIDER=openai` + `OM_AI_MODEL=Qwen2.5-7B-Instruct-Q4_K_M` (a **local** model) with **no `OPENAI_BASE_URL`**; `.env` sets `OPENAI_BASE_URL=http://model:8080/v1` but `docker-compose.hermes.yml:64-80` **does not forward it**, so the worker would call **api.openai.com** with a local model name.

**What this row builds.** (1) **The live-turn proof** — a harness that drives a **real** turn through the port with the Hermes engine selected: connect the pinned worker → `session.create` → `prompt.submit` → read the adapter's ordered typed events, ending on a real `done`/`message.complete`. A **real model answer, not a fake** — the exact thing §2.11 named as `P2-6`'s gate. (2) **The worker's model config, settled and forwarded** — whatever the pinned worker actually reads to reach a model (measured in the worker's own source, not assumed from the platform's `OM_AI_*` convention) must be **forwarded by `docker-compose.hermes.yml`**, so it reaches a **reachable** model (the local one by preference — no cloud spend).

**Named bounds.** It does **not** flip the default; the **switchover** (the production connection lifecycle + the default-flip + the OpenCode deletion `R28-6`/`N-8` + the `CC-74` `hermes-local` retirement) is the **next** row, gated on this one. The tool bridge stays **`CC-79`**.

**The step handed forward:** when a live turn is proven → **the switchover**, as §2.11 item 5 owns.

---

### ✅ P2-6 DONE — **Phase 2's exit gate is green: on one tenant and then on two adversarial ones, the five properties hold — and the two missing bounds (a dropped `budget`, an unpruned registry) are now real, shared, and measured.** *(2026-10-13)*

`lib/ai-runtime-bounds.ts` (new, shared) + both chat adapters + the platform adapter + three proof suites; requirement written BEFORE the code (plan §2.12), full discharge record in §2.12 + the §4 row. **The default did NOT move** — this row proves; the flip + OpenCode deletion is a **separate** change.

**What it is, in plain terms.** This is the checkpoint that says "the runtime behind the door is safe to trust on its own": a run can be stopped, a retry cannot double-count, what a run costs is recorded with its scope stated, a run cannot outlive its time budget or fill memory forever, and one customer's run can never be seen or touched by another. Two of those were **not yet true** and are now built: the door's time **budget** was carried and dropped (both engines ignored it), and the run registry grew without bound. Both now live in **one shared file** so the two engines cannot drift apart, and the OpenCode half of the deadline gap (**`CC-76`**) is fixed. **The default engine is still OpenCode** — nothing changes for the user; this row only proves, it does not flip.

**The evidence.** 6 suites / 127 tests green on the changed surface; the whole package **125 suites / 1752 tests GREEN**; `tsc` **92 = exactly the pre-existing `CC-73` count, zero in the P2-6 files** (the first run showed 4 new, in a test that simulates a mistyped value — fixed honestly, by casting to the wire value, not by weakening the check). **RED-then-GREEN: 10 mutations, all RED**, baselines proven GREEN first, restored md5-identical.

**The hostile critic (a separate agent, command+output per claim) found two defects and two honesty problems — all fixed in the same change:**

1. **The time bound stopped the output but did not END the run (the serious one).** OpenCode's timer set a flag and printed an error, but left the engine call awaiting — so a **stalled engine** left the run hanging forever, while Hermes' timer ended its stream. The two engines drifted, and the existing test hid it by releasing the engine *before* it waited. Fixed by racing the engine call against the deadline; a regression test now stalls the engine and proves the run still ends (**L151**).
2. **A third engine implementation was unbounded.** The requirement said "both adapters" (the two chat engines), but there are **three** implementations of the door — the platform's own in-process adapter was also unpruned. Because the memory bound is stated for "the run registry", not two named adapters, the third now applies the same shared rule; its wall-clock bound is **named** (it hands the response body to its caller, so it does not own the stream) (**L152**).
3. **A stringified budget was dropped in silence** — now accepted if numeric, logged if not.
4. **Four of the eight "no cross-scope frame" assertions were vacuous** — no frame ever carries a tenant or principal id, so asserting their absence proved nothing; rewritten to the two identifiers that actually travel, each with a positive check.

**Next:** `P2-7` — **Hermes must SERVE A LIVE TURN** through the pinned worker (requirement §2.13). **⚠ Corrected here (rule 13):** this block's earlier wording said the next step was *"flip the default to Hermes and delete OpenCode … which is also the `CC-74` trigger"*. That is **not yet due** — §2.12 scoped `P2-6` to the five properties **through the port** (against a `FakeClient`), while §2.11's **stated** gate also required **a live turn**, which was never driven. Flipping today would make every chat **fail closed**. So `P2-7` builds the live turn first; **then** the switchover — the default-flip + OpenCode deletion (`R28-6`/`N-8`, `CC-76` fixed) + the `CC-74` `hermes-local` retirement — lands as one change.

---

### ✅ P2-5 DONE — **the engine is now SELECTABLE at the door: one config-selected function builds the chat engine, and the run records which one served it — but the default did NOT move.** *(2026-10-13)*

`lib/resolve-ai-runtime-port.ts` (new) + the route rewiring + the run-provenance recording; requirement written BEFORE the code (plan §2.11), full discharge record in §2.11 + the §4 row.

**What it is, in plain terms.** Until today the platform could only ever run a chat on one engine, and the choice was buried as a private function inside a single route. Now there is **one small, testable function** that picks the engine: by default it still picks OpenCode (so **nothing changes for the user**), but a single setting (`AI_RUNTIME_ENGINE`) can point the door at Hermes — and the function that builds a **real** Hermes client is the piece production never had. Whichever engine serves a run is written onto that run's record, so the ledger can never claim a run was OpenCode when Hermes served it. **The default deliberately did not move** — that flip is owned by this row and happens only once `P2-6` proves Hermes serves a real run, at which point the same change deletes OpenCode.

**The evidence.** 124 tests across 6 suites; the whole package **123 suites / 1723 tests GREEN**; `tsc` **92 errors = exactly the pre-existing `CC-73` count, zero in the new or changed files**. **RED-then-GREEN: 13 mutations, all RED, restored md5-identical.**

**The hostile critic (a separate agent, command+output per claim) found two defects — both fixed in the same change:**

1. **A field that was written but never read (the serious one).** The requirement said the run's record "must say which engine served it", and the field was added — but **neither adapter read it**, so it was accepted and silently dropped. Fixed in both adapters (each records it on the first completion, so a replay cannot rewrite it), with a test on each half.
2. **A silent fallback on a blank setting.** An empty value selected OpenCode *silently*, so an operator who meant Hermes would believe Hermes was serving. Now a blank value is **refused** ("set but empty — refusing to guess"), making the "deny-by-default" claim literally true. Two weak structural tests the critic flagged were also tightened.

**My own catch — and the reason the proof had to be rebuilt before it could be trusted.** The first mutation run printed "13/13 RED" in **one second**, which is impossible for 13 suites. A node harness that spawns jest was throwing a Windows `EBUSY` **before jest ever ran**, and mapping that to "RED" — so the "proof" was certifying mutations that had never been tested. The harness was rebuilt (as a bash loop) to **prove a GREEN baseline for every suite before trusting any RED**, and to treat a runner that fails to *start* as an error, not a caught mutation. The rebuild surfaced a second real defect: the new suite called the **live** OpenCode health probe, so it hung whenever Docker was down — a unit test depending on a running container, now mocked. With the repaired harness: **5 baselines GREEN, then 13 mutations RED**, restored md5-identical. **L149** (a harness must prove its own baseline) and **L150** (a test that reaches a live service is not a unit test).

**Named bounds, recorded not hidden:** the platform's other two runtime routes are a **different engine family** and are not unified here; the default does **not** move until Hermes serves a **live turn** *(**corrected 2026-10-13, rule 13:** this line originally said *"until `P2-6` is green"*, but §2.12 scoped `P2-6` to the five properties **through the port** — the live turn is its own row, **`P2-7`**, §2.13)*; `CC-76` (OpenCode ignores the deadline) must be fixed before the **deletion** *(**done** — `P2-6`)*; `CC-74` (retire the old `hermes-local` service) fires once **a real chat run has been served by the pinned worker** *(**corrected 2026-10-13, rule 13:** this line originally said *"fires at `P2-6`"* — that premise was false, since no live run was ever served; the trigger fires after **`P2-7`**)*.

**Next:** `P2-6` — the exit-gate proof (cancellation · retry idempotency · usage capture · bounded memory/CPU · no cross-scope access), which is the gate that lets the owned default-flip + OpenCode deletion run. *(**Corrected 2026-10-13, rule 13:** this line originally also called `P2-6` *"the `CC-74` trigger"*; §2.12 proved the five properties **through the port** but drove **no live turn**, so the `CC-74` trigger — *a real chat run served by the pinned worker* — is **not** met by `P2-6`. It is now owned by **`P2-7`** (§2.13), and the switchover is **gated** on it.)*

---

### ✅ P2-3 DONE — **the port adapter: Hermes behind the door with an honest capability map (seven ✓, the tool door ✗), critic-hardened with three defects found and fixed.** *(2026-10-12)*

`lib/hermes-port-adapter.ts` + 34 tests (plan `PLAN-HERMES-PHASE2-one-tenant-one-tool.md` §2.8 requirement written BEFORE the code, §2.9 the full discharge record).

**What it is, in plain terms.** The platform now has a second engine that can sit behind its one typed door to an AI runtime. The adapter translates the door's eight operations into the worker's own protocol — every event name and payload measured in the pinned source first, nothing guessed. Two honest things it says out loud: **the tool door stays closed** (`resolveToolCall` throws and names the call, so no caller can believe a business operation is platform-gated by this engine — `P2-4` opens it), and **`steerRun` is real** — the first engine on the whole port that can add an instruction to a run that is already admitted, without opening a new conversation turn and without carrying any permission (the §2.4 verdict, settled by measurement in the worker's own source, with its three limits written down).

**The evidence.** 37/37 tests GREEN; the whole package 120 suites / **1665 tests GREEN** (nothing that existed broke); `tsc` shows **0** errors in the new files against the 92 pre-existing `CC-73` errors. **RED-then-GREEN: 11 mutations, all RED, restored md5-identical (`706ad202…`).**

**The hostile critic (a separate agent, command+output per claim) found three defects — each re-measured in the pinned source before the fix:**

1. **A real correctness bug the suite could not see.** When you resume a conversation, the adapter sent the id you handed it. But the worker's resume answer carries a **different** id — the live one — and every later message must use *that* id, or the worker answers "session not found". The test double echoed back whatever it was asked, so all 33 tests passed with the bug sitting there. Fixed, plus a test whose double answers with a different id and proves the turn then goes to that id. **L144.**
2. **A test that could not fail.** The proof that the stream cleans up after itself counted *messages sent* — a number that never changes when you emit an event, so it passed even with every cleanup line deleted. Rewritten to actually check that no listener is left registered, and the cleanup deletion is now caught (mutation M2). **L145.**
3. **A small leak.** The stream cleaned up its event listeners but never its worker-exit handler, so a long-lived client grew one closure per streamed run. The `P2-2` client's `onExit` now hands back an unsubscribe (like its `on` already did) and the stream releases it with the rest.

**One of the critic's own remarks was falsified by measurement — and that changed the build (rule 13).** The critic's closing note said a silent-but-alive worker could not be bounded because the door has no deadline. Measured: the door's envelope **already carries `deadline`** — *"so a run cannot outlive its admission"*. So the adapter now **honours the caller's own deadline**: an expired run errors instead of spending a turn; a turn that outlives it ends with an error event; a deadline that cannot be read binds nothing and is logged (fail safe, not fail fast). Three tests, and the two new mutations (M9/M10) are the proof they bite. The **other** engine behind the door (OpenCode) still ignores that field — registered as **`CC-76`** so the gap at the door level cannot be forgotten (**L146**: a finding, even a critic's, gets measured like any other claim — an absence claim needs absence evidence).

**Named bound, recorded not hidden:** a steered instruction reaches the worker's **own** tools only — the platform's tool door is still shut until `P2-4`.

**Next:** `P2-4` — the one narrow tool (the Business-IR pack) through `resolveToolCall`, every call re-authorized at execution time.

---

### ✅ HERMES PIN RE-PINNED to the newest source — **the old pin was 3,290 commits behind; now the pin names the copy the owner supplied.**
**(2026-10-12; the owner's request: *"I downloaded and extracted the latest hermes version to `hermes-agent-main` … it is better that we use the most recent one. You can compare the difference if needed … Maybe the newest version provide other elements of an added value."*)**

**What changed.** Phase 0's pin (the block below) named `library/ai/hermes-agent-main/` (17,201 files, revision
`eb044063…`, 2026-10-03). The owner then downloaded a newer extract to the repository root and renamed the old
root copy `hermes-agent-main-older`. **Measured (rule 0b), the new copy is decisively newer, so the pin now names
it.**

**The measurement — three copies, none byte-identical (L136):**

| Copy | Path | Files | `pyproject.toml` md5 | Revision | Is it the pin? |
|---|---|---:|---|---|---|
| **The pinned snapshot** | `hermes-agent-main/` (root) | 18,248 | `11d88a68…` | **`3569e846…`** | **YES** |
| The mid extract | `hermes-agent-main-older/` (root) | 17,367 | `594dea19…` | not recoverable | no |
| The previous pin | `library/ai/hermes-agent-main/` | 17,201 | `a4ce871d…` | `eb044063…` | no |

- **It is not a close call:** the old pin is **3,290 commits behind** (`git compare` upstream →
  `ahead_by: 3290`; 2026-10-03 → 2026-10-12). The new copy is **byte-identical to the root
  `hermes-agent-main.zip`** (18,248 files = the zip's 19,484 entries minus 1,236 dirs; three key-file hashes
  match), and the zip's archive comment carries the revision `3569e846…` — confirmed a real upstream commit via
  the API (*"fix(plugins): left-core startup installs back off exponentially instead of hourly forever"*,
  2026-10-12T08:15:04Z).
- **Added value is real, not cosmetic:** **1,138 files added, 91 removed, 4,454 of 17,110 common files
  changed.** The `agent/` core — the runtime the port will drive — gained **29 modules** (`compaction_events.py`,
  `reasoning_promotion.py`, `turn_recovery_codex.py`, `context_compressor_*`, `agent_runtime_helpers_*`,
  `session_source.py`, …), plus 9 `gateway/`, 11 `tools/`, 6 `tui_gateway/` modules.
- **Nothing the pin mapped broke:** all §3 entry files survive at near-identical size, `acp_adapter/` intact,
  MIT unchanged, licence position unchanged (19 vs 18 `LICENSE` files; the addition is MIT).

**What was updated in the same change (rule 6/13):** `library/.hermes_pin.py` (PINNED → root copy,
`UPSTREAM_REVISION` → `3569e846…`, `EXPECTED_DIGEST` → `ca760e97…`); **`HERMES-PIN.md`** (§1.1 three-copies
table + §1.1.1 the re-pin rationale, §1.2 the revision + upstream check, §1.3 the new digest, §2 the run block,
§3 line counts, §4 the added MIT licence, §5/§6); this journal; `LESSONS.md` **L136** (two copies → three);
`platform_points.md` §D note; `PLAN-ROW28-agent-runtime-port.md` rule-13 note; `REFERENCE-REGISTER.md`; the
`.gitignore` comment. **`CC-72`'s trigger is unchanged.**

**Proof.** `--check` → **PIN HOLDS** (revision `3569e846…`, 18,248 files, digest
`ca760e97ff1ef1f0e2ed3deb0dfc2923`). RED-then-GREEN on the harness: appending one byte `x` to
`hermes-agent-main/.python-version` moved the digest to `70a8507c13aca25c4e1681ae0d82ceb4`; restoring its md5
(`9e0dac68…`) returned `ca760e97…` and PIN HOLDS. **No scoreboard change** — the two Phase 0 boxes were already
ticked; the re-pin moved *which snapshot they point at*.

---

### ✅ HERMES TRACK STARTED — **arch §9 `Phase 0` ("pin & map") DONE: the pin, the licence position, and the symbol map.**
**(2026-10-12; the owner's explicit go-ahead, given once row 28 was verified complete: *"Start the Hermes track (arch §9 Phase 0) — pin & map. It's the prerequisite for the whole runtime future."*)**

**Why Phase 0 exists.** The Hermes runtime is the Python agent engine the platform will run **behind the door**.
Until now nothing said *which* Hermes we are reading: it sits in the tree as gitignored study material, it has
**no `.git`** and its `pyproject.toml` says `version = "0.0.0"`. Phase 0's exit gate names four things — a
recorded digest, a harness that runs, a licence position **including optional components**, and the exact
symbols to call. All four now exist, in **`library/development/HERMES-PIN.md`**.

**A FINDING THAT CORRECTS THE PRIOR SESSION (rule 13).** The prior session recorded *"Hermes does not exist in
this repository at all."* **That was under-scoped and false as written.** Measured this session: the **code**
repo (`workspace/starting-kit`) has no Hermes (`git ls-files | grep -i hermes` → empty) — but the **docs repo
holds the Hermes source** as **two gitignored extracts**:

| Copy | Path | Files | `pyproject.toml` md5 | Is it the pin? |
|---|---|---:|---|---|
| **Pinned** | `library/ai/hermes-agent-main/` | 17,201 | `a4ce871d9d03fd3706516e15bff637bb` | **YES** — byte-identical to `library/ai/hermes-agent-main.zip` (verified via `unzip -p`) |
| Root | `hermes-agent-main/` | 17,367 | `594dea190e4176caa117db2349071e6c` | no — a **later, different** extract |

They are **not** byte-identical — this is the *"source-versus-image divergence"* of the architecture's §10 risk
table, **found in our own tree**. The pin names ONE of them so no reader has to guess. **`CC-72`'s trigger is
unchanged** (the engine behind the door is still only OpenCode); only the wording is corrected, in the register,
the plan, the scoreboard, and here.

> **SUPERSEDED — same day (rule 13).** The table above records the moment Phase 0 first landed: **two** copies,
> pinned to `library/ai/hermes-agent-main/`. Within the day the owner supplied a **third** (newest) copy at the
> root, and the pin moved to it — see **the RE-PINNED block above**. This block is kept as written so the record
> of *that* moment is intact; it must be read *with* the block above, not instead of it. Three copies today, not
> two.

**What landed — the four exit-gate items, measured:**

1. **The pin (a digest + the source revision).** The pinned snapshot's whole-tree digest is
   **`53b320bb83a155225ab4b36b3ad0dace`** (17,201 files; algorithm: sorted `<md5>  <relpath>` lines, hashed
   again — reproducible by hand, stated in the doc). The **source revision IS recoverable** — the snapshot zip's
   own archive comment carries **`eb044063235fbf7a4e68dd2970ade05dbe637ff3`** (the architecture's *"cannot be
   recovered; it must be created"* is sharpened, not contradicted).
2. **The harness runs.** `library/.hermes_pin.py --check` → **PIN HOLDS**. Deterministic (two runs equal);
   proven **sensitive** (append one byte → digest changes; restore → matches, md5-verified). It is **not** the
   version-compatibility harness — that stays deferred to **`N-11`** (trigger: the adapter exists); the two are
   named separately so neither is mistaken for the other.
3. **The licence position, including optional components.** Runtime = **MIT** (Nous Research). All **18**
   bundled `LICENSE` files are **MIT or Apache-2.0** (`plugins/security-guidance` = Apache-2.0); **no copyleft
   is bundled**. AGPL/GPL appears **only** as references to **separately-invoked** tools (10 hits, all `.md`),
   under Hermes' own rule — *"never import it as a Python library … keeps Hermes Agent's MIT license clean"*.
   Two obligations named, neither a blocker: keep the notices; keep invoke-don't-import. **This closes
   `V-09`'s gate.**
4. **The symbol map.** `tui_gateway/server.py` (JSON-RPC: `prompt.submit`, `session.*`, `client.capabilities`,
   streaming events) · `gateway/platforms/api_server.py` (OpenAI-compatible `/v1/runs/{id}/…`) ·
   `acp_adapter/` — all three read from Hermes' own `programmatic-integration.md` in the pinned snapshot.
   **Which protocol the platform uses is decided when the adapter is built** (Phase 2), against the port's
   eight operations — not here.

**Proof + critic.** The two new files were attacked by a **separate-agent hostile critic**: **10 claims sound,
1 real defect** — the doc's mutation digest was *unreproducible as written* (it did not state which byte was
appended). **Fixed** (the byte is now stated; the number reproduces). The snapshot was mutated and
md5-restored twice (by me and by the critic); **`--check` → PIN HOLDS** afterwards.

**Honest headline.** **Phase 0 is DONE** — both `Phase 0` boxes in §D tick. The pin is the prerequisite for the
whole Hermes track; the next frontier is **§9 Phase 2** (one worker, one tenant, one tool) — Phase 1 (the port
with OpenCode behind it) is already our achieved state. **ONE NUMBER: 76 → 78 / 321 = 24%** (+2, the two
`Phase 0` ticks; §L 23rd run, two routes agree). **One more thing, corrected while re-deriving:** the 22nd
run's per-section breakdown (A 10 · B 5 · D 1 · K 2) was **stale** — the true pre-tick breakdown was
**A 11 · B 7 · D 2 · K 1** (same total 76, four figures drifted and offset). The breakdown is re-derived and
recorded in §L.

---

### ✅ AUDIT — **Row 28 verified COMPLETE (all six sub-rows + `CC-67`), and ONE promised-but-undone item found and fixed (`ce.ts`).**
**(2026-10-12; owner-requested completeness audit: *"verify that all row 28 steps are done and completed properly — because some of the steps you did not report back to me that you worked on."*)**

**What the audit did.** Checked every row-28 sub-row's **claim against the live code** (not against the docs),
and asked the specific question the owner raised: *is anything built-but-unreported, or promised-but-undone?*

**Verified in code (all six sub-rows + the extra adapter):**

| Sub-row | Code evidence (measured) | Verdict |
|---|---|---|
| **R28-1** — the port's shape | `lib/ai-runtime-port.ts` declares `AiRuntimePort` (`:308`) with **all eight** §4.1 ops; definitions-only, zero engine imports | ✅ present, correct |
| **R28-2** — OpenCode behind the door | `lib/opencode-port-adapter.ts` — `class OpenCodePortAdapter implements AiRuntimePort` (`:159`) + factory (`:475`) | ✅ present, correct |
| **R28-3** — chat route through the door | `api/chat/route.ts` — `port.startRun` (`:536`) → `port.streamRun` (`:537`); imports the adapter (`:17`); the run path imports **no** engine | ✅ present, correct |
| **R28-4** — run closed at the door | `api/chat/route.ts` — `port.cancelRun` (`:103`), `port.completeRun` (`:109`), `req.signal` disconnect wiring (`:472–478`) | ✅ present, correct |
| **R28-5** — the door is the only way in | `__tests__/door-only-way-in.test.ts` — whole-package `.ts`+`.tsx` scan; **118 suites / 1607 tests green** on the committed tree | ✅ present, correct |
| **`CC-67`** — the platform runtime behind the door | `lib/agent-runtime-port-adapter.ts` — `implements AiRuntimePort` (`:199`); the three callers (`api/ai/chat/route.ts`, `api/ai/run-object/route.ts`, `lib/business-ir-author.ts`) all import the adapter, **no** engine import | ✅ present, correct |
| **R28-6** — delete OpenCode | measured last turn → **trigger-blocked on Hermes** (`CC-72`); not a buildable task | ✅ correctly out-of-row |

**Proof run this session.** The whole `ai-assistant` package suite was re-run **on the committed tree**:
**118 suites / 1607 tests passed** — the same figure the docs record for R28-5, so no regression across
R28-1…R28-5 and `CC-67`. The two adapters, the port, the chat route wiring, and the door-only-way-in proof all
still hold. **All ten row-28 files exist; all six code commits + six docs commits are present and ordered.**

**The ONE gap found (and fixed).** The plan's **§5 impact table** promised: *"`ce.ts`'s comment-only
`AiRuntimePort` … **Correct it in the same change (rule 13)**."* **No row-28 commit touched `ce.ts`** — measured:
`git log -- <ce.ts>` shows its last change was `b5a33c76` (a much earlier AH-1 slice), and `git show --stat` for
each of `513bad41`/`743156dd`/`61776eae`/`5ec1c83f`/`6c3db27c`/`ab2f835a` **names `ce.ts` zero times.** So the
comment still read that the `AiRuntimePort` *"(`invoke`/`status`/`cancel`) is `L-01`/`AH-5`"* — describing it as
**unbuilt and owned elsewhere** — while the port has existed since R28-1. **Fixed now** (code `b8f53cb0`),
comment-only, suite re-run green (118/1607). *This is exactly the class the owner asked about: a promised
correction that was silently dropped, and an overclaim left standing for a reader to trust.*

**Honest headline.** **Row 28 is complete for the port's shape** — every sub-row that can be built is built,
proven, and green; `R28-6` is the one step that **cannot** be built (its replacement engine is not wired behind
the door). The audit found **no other missed step** beyond `ce.ts`. **ONE NUMBER: 76 → 78 / 321 = 24%** at the
time of this audit it was **76 / 321 = 24%** (the two `Phase 0` ticks came in the Hermes block above).

---
 `CC-69`/`CC-71` RULED 2026-10-12: both are deliberate, permanent, named exceptions (a control message and a monitoring surface — neither is a run); the door's contract is NOT widened now (it would be shaped around OpenCode, which `R28-6` deletes). **`R28-6` (delete OpenCode) was MEASURED 2026-10-12 and found TRIGGER-BLOCKED** — Hermes does not exist, so deleting OpenCode would remove the only engine that answers a chat (registered as `CC-72`). So **row 28's build is COMPLETE for the port's shape**; the deletion waits on Hermes (architecture §9 Phase 2+).**
**(2026-10-11 → 2026-10-12; plan = [`library/development/PLAN-ROW28-agent-runtime-port.md`](library/development/PLAN-ROW28-agent-runtime-port.md).)**

**What the row asks, in plain words.** Today the platform reaches its AI engine **two different ways,
from many places, with nothing in between**: the chat screen calls **OpenCode directly**; two other
routes call the platform's **own runner directly**. Row 28 says: give the engine **one front door**, so
every caller talks to the door and the door decides which engine sits behind it. **This is the *shape*
work, not the Hermes work** — the first job is the door with **OpenCode still standing behind it**
(the architecture document's own order: *"rewire first, delete second"*; Phase 1 = *"the port, with
OpenCode behind it"*).

**Measured in code (rule 0b) — the row's sentence is literally false today:**

| What | Where |
|---|---|
| The chat route calls OpenCode **directly** | `ai_assistant/api/chat/route.ts` — import `:10`/`:6–9`; calls `:218`, `:349` |
| A second route calls the platform's own runner directly | `ai_assistant/api/ai/chat/route.ts:688` (`runAiAgentText`) |
| A third calls it directly too | `api/ai/run-object/route.ts:186`, `lib/business-ir-author.ts:160` (`runAiAgentObject`) |
| The "typed port" was **only a comment** | `ai_assistant/ce.ts` (`AiRuntimePort`, owned by `L-01`/`AH-5`) |

**The six sub-rows (built one at a time):**

| Sub-row | What it is | Status |
|---|---|---|
| **R28-1** | The typed port's **shape** — its eight operations + the envelope rules | ✅ **DONE 2026-10-11** (below) |
| **R28-2** | **OpenCode fitted behind the door** (unchanged, just hidden) | ✅ **DONE 2026-10-11** (below) |
| **R28-3** | The **chat screen moved onto the door** (the step that makes the row true) | ✅ **DONE 2026-10-11** (below) |
| **R28-4** | Failure handled — cancel is safe to repeat, complete is safe to replay | ✅ **DONE 2026-10-11** (below) |
| **R28-5** | A check that **nothing** talks to an engine directly | ✅ **DONE 2026-10-12** (below) — the door is **proven** the only way in; **`B-05` ticked** |
| **R28-6** | **Delete OpenCode** — separate, later step (`N-8`) | OUT of row 28 |
| **`CC-67`** | The **last three direct callers** moved onto the door — a second adapter for the platform's own in-process runtime | ✅ **DONE 2026-10-11** (below) |

**R28-1 DONE — what was built, and the honest headline.** `lib/ai-runtime-port.ts` — **definitions only,
zero imports**, so no caller drags an engine in behind the types. It declares the **eight operations**
exactly as the architecture document §4.1 gives them (including **`resolveToolCall(call, capabilityGrant)`**
— the document's *"ONLY path to a business operation"*), the **§4.2 envelope** (including the required
**`capabilityGrantId`**), **secret references** (no field can hold a value), and **cancel/complete results
that are values, not exceptions**.

**Proof:** 9 tests green; `tsc --strict` clean; **112 suites / 1527 tests green** (two full runs);
**6 RED-then-GREEN mutations**, md5-verified restores.
**A separate-agent hostile critic found THREE real defects — all fixed in-batch:** (1) my first draft
**dropped `capabilityGrant`** from `resolveToolCall` and the envelope — the exact security-relevant
argument; (2) the envelope was **missing several §4.2 fields** and the signatures were not faithful to the
document; (3) my tests were **weaker than they looked** — they checked an instance's keys, so an added
*optional* field passed silently (the critic proved it with an `authorityOverride` mutation that stayed
green) → fixed with a type-level key-exactness guard, and the same mutation is now caught.

**Also met and FIXED in the same change (rule 9a / rule 15):** a **flaky test** — `mcp-dev-key-resolution.test.ts` › the
TOCTOU case, ~1 full-suite run in 2–3, green in isolation. Measured cause: the test **manufactured the file swap by
renaming real files inside mocked `stat`/`open`**, racing the reader's own `Promise.all([descriptor stat, path lstat])`
— a microtask-order coin toss. **The production code was correct**; the test was non-deterministic. Fixed by
**stating the mismatch directly** (descriptor `{dev:1,ino:111}` vs path `{dev:2,ino:222}` — no rename, no race),
**mutation-proved** (delete `isSameFile` → RED on both variants), **5 consecutive full-suite runs green (1530/1530)**.
A second latent hazard found on the way (`llm-bootstrap` calling `list()` unguarded on re-evaluation against a partial
registry stub) is also fixed + tested. Registered as **`CC-68`, now closed**; lesson **`L130`**.

**Honest bound — NO box moved.** `B-05`/`Port` are about the door being **used**; a door nobody walks
through yet does not complete them — that is R28-3. **ONE NUMBER unchanged 75 / 321 = 23%.**

**R28-2 DONE — what was built, and the honest headline.** `lib/opencode-port-adapter.ts` — the first engine
behind the door. It implements **all eight port operations** and delegates to the **existing, unmodified**
OpenCode engine (`createOpenCodeClient`, `handleOpenCodeMessageStreaming`). **`opencode-client.ts` and
`opencode-handlers.ts` are not touched** — that is the entire point of the step: the engine moves behind the
door *unchanged*, so the door is proven useful before anything is rewritten (the architecture document's
Phase 1: *"the port, with OpenCode behind it. No Hermes yet."*).

**The honest capability map** — a door that claims more than it can do is worse than no door. Six operations
work; **two are openly ✗** and the adapter says so in its own header **and** through
`describeCapabilities`: `steerRun` (unsupported — OpenCode has no mid-run steering) and `resolveToolCall`
(unsupported — OpenCode resolves its tools internally, so §4.1's *"ONLY path to a business operation"* is
**not** served by this engine). Those two are not holes swept under the door; they are **declared**.

**Proof:** 22 tests green; `tsc --strict` clean; **114 suites / 1552 tests green** (the R28-1 baseline was
112/1527); **15 RED-then-GREEN mutations** (10 build + 5 critic-defect), md5-verified restores.
**A separate-agent hostile critic found SIX real defects — all fixed in-batch, each with its own regression
test:** (1) a **defeated abort slot** — `run.abort?.abort()` was defended by nothing, so a cancel before a
stream started was a silent no-op → a **Set** of controllers, all aborted; (2) **`cancelRun` after
`completeRun` was order-dependent** → `completed` is now checked **first**, so the answer is the same in any
order; (3) **run = conversation** — the resume run id was `conversationId:agentId:resume`, so two resumes of
one conversation shared one run id, breaking §4.2's *"a run is not a transcript"* **and** silently collapsing
replay-safety → `resumeConversation` now **mints a fresh, distinct run id**; (4) **the stale capability
grant** — a second resume kept the **first** grant, carrying an authority it was never issued → a new grant
per resume; (5) **an unchecked cast** — `input.sessionId as string` would have accepted a number, an object
or `null` → a validated `readSessionId` accessor; (6) **concurrent streams shared one abort slot** →
per-stream controllers.

**Honest bound — NO box moved.** An **unused** door with an engine behind it still completes nothing —
`B-05` / `N-8`'s first half are about the door being *used*. **ONE NUMBER unchanged 75 / 321 = 23%.**

**R28-3 DONE — the exit gate: the chat route now walks through the door.** `api/chat/route.ts` (412 → 445
lines) now imports the **port** and the adapter **factory**, and **not** the engine: it builds one envelope
(identity minted server-side; the run id **distinct** from the conversation id per §4.2) and calls
`port.startRun(envelope)` → `port.streamRun(runId, sink)`. `opencode-client.ts` / `opencode-handlers.ts` are
**not modified**. **One real defect found by my own mutation battery and fixed:** the first draft minted the
run id from the request time alone, so two runs in the same millisecond would share an id — and the adapter
treats a repeated id as an idempotent re-start, so the second would silently never stream; fixed with an
exported `mintChatRunId` (legible id + monotonic counter). **One registered bypass:** the `answerQuestion`
short-circuit still calls OpenCode directly — it is **not a run**, the port has no such operation, and adding
a ninth is a design decision — registered as **`CC-69`**, not hidden.

**Proof:** 15 new tests (mock boundary = the engine, **below** the door, so they fail if the route ever calls
it directly; includes a **self-tested static guard** that asserts the *imported symbols*, not a line
substring); the **pre-existing behaviour tests pass UNMODIFIED (8/8)** — the user sees no change; route
type-checks clean; **115 suites / 1567 tests green**; **9 RED-then-GREEN mutations**, route restored
md5-identical. **A separate-agent hostile critic found FOUR real defects — all fixed in-batch**, two of them
in my *tests*: (1) the static guard was **evadable** (a two-symbol import line passed; `require` was missed);
(2) the run-id test was **vacuous** (only asserted inequality); (3) the counter's stated motivation was
**false** (the adapter is per-request); (4) `tenantId: ''` was a latent **fail-open** and the grant was a
**placeholder** → tenant now fails closed, the grant is a real per-turn value with its non-consumption
registered as **`CC-70`**.

**Honest bound — NO box moved, and that is the point.** The row's sentence is *"**no other** code talks to it
directly"* — **two other callers still do** (`CC-67`) plus the registered bypass. The door is now **used**,
which is real and measured, but one caller out of three is not the row. `B-05`, `N-8` and the three `Port`
boxes keep `☐` **on purpose**; §D was re-worded to say what is built. **ONE NUMBER unchanged 75 / 321 = 23%.**

**R28-4 DONE — the run is now CLOSED at the door: cancel + complete, and failure is normal.** `api/chat/route.ts`
gained the **one** place a run ends — an exported helper `closeChatRun(port, runId, outcome)` — and the run path
now **observes the client's disconnect**: a listener on the request's own `req.signal` (**`{ once: true }`**,
with an `aborted`-already check first) sets a flag, and the existing `finally` calls `closeChatRun`, which
**cancels first then completes**, with the honest status (`cancelled` when the abort was seen, else `completed`).

**The measurement that set the task (rule 0b).** `cancelRun`/`completeRun` had **no production caller at all**
(`grep` found them only in the port, the adapter and their tests), and the chat route had **no cancel path**.
**The challenge (rule 9b) — and why the abort signal is the right caller:** the chat UI *already has a Stop
button* (`frontend/hooks/useCommandPalette.ts:1416` `stopExecution`), and it already aborts the browser's own
fetch (`:556–569`, `signal: controller.signal`) — so the affordance existed; **the gap was that Stop never
reached the server.** Observing `req.signal` closes it for Stop **and** a closed tab with one mechanism, and
needs **no front-end change**. A separate `POST /cancel` route was rejected — it invents contract surface the
architecture document does not name, for the same result. **The honest limit:** the cancel is **cooperative**
(the adapter marks the run cancelled and stops feeding the consumer; it cannot force-tear-down the engine's
in-flight call) — stated, not hidden.

**Proof:** 8 new tests (`chat-route-cancel-complete.test.ts`; the mock boundary is **the port**, so the
lifecycle call ORDER is asserted); the pre-existing behaviour tests pass **UNMODIFIED** (ownership 8, through-port
15 reported); route type-checks clean; **116 suites / 1575 tests green**; **6 RED-then-GREEN mutations**
(cancel removed; complete removed; order flipped; status hardcoded; abort listener removed; `closeChatRun`
skipped in `finally`), route restored **md5-identical**. **A separate-agent hostile critic found NO real
defect** — it attacked all six claims and broke none, and its one **extra** probe ("a run that never streams is
still closed") was correct, so it is now a **permanent test** (rule 15) and is itself mutation-proved.

**`CC-67` DONE — the last three direct callers now walk through the door: a SECOND adapter.** The row's remaining
work was *"move the two remaining direct callers"* — the **in-process** ones, which reach the platform's **own
AI-SDK runner** (`runAiAgentText` / `runAiAgentObject`), a **different engine** from R28-2's OpenCode. Measured
first (rule 0b): the three callers are the chat route's text path (`api/ai/chat/route.ts`), the run-object route
(`api/ai/run-object/route.ts`), and the in-process helper (`lib/business-ir-author.ts`); and their input carries
**three things the §4.2 envelope cannot honestly hold** — the **live DI `container`**, the **full auth context**,
and a **`UIMessage[]`**. **Decision (rule 9b): a SECOND adapter** (`lib/agent-runtime-port-adapter.ts`) —
`AgentRuntimePortAdapter implements AiRuntimePort`, the honest counterpart to the OpenCode adapter — with those
three live things carried **on the adapter's construction (per request)**, exactly as the OpenCode adapter carries
`{ auth, em }`. **No envelope field is invented; no live object is inlined into the envelope** (§4.2 respected).

**The one hard bug — and it was in the first cut. `streamRun` must not drain the body.** The platform runner hands
back a **`Response`** whose body is the AI SDK **UI-message SSE** the browser consumes (single-use!). My first draft
read `response.body` to emit stream events — which would have left the client with **nothing to read**. Fixed: the
adapter **stashes the ORIGINAL `Response`** (`responseForRun(runId)`) and **does not touch the body**; the route
hands that same response to `persistAssistantOnStreamCompletion`. A `getReader` spy pins `readCount()===0`.

**The defect the SEPARATE-AGENT hostile critic found — the run was never CLOSED.** My first cut called `startRun`
and **never `completeRun`**: the run stayed open forever, so a later `cancelRun` on a finished run would falsely
report it `cancelled`. **Fixed:** the route closes the run in the stream wrapper's `finally`, **before**
`writer.close()` (no race), completing `failed` on an engine error, and **also** closing when the engine returned a
**bodyless** `Response` (a second latent leak the second critic found — also fixed). **4 tests pin it; M8 (remove
the close) goes RED.**

**Proof.** The three callers now **import no engine module** (statically pinned in the adapter's own test, plus the
honestly-updated `binding-coverage.test.ts`); **117 suites / 1596 tests green** (baseline 116/1575 → **+1 suite,
+21 tests**); the **27 pre-existing route tests pass UNMODIFIED** and prove the adapter is the path (they mock the
engine and assert it is called with the resolved payload); **8 RED-then-GREEN mutations, all md5-restored**
(M1 cancel reports a reason; M2 complete loses replay safety; M3 cancel order-dependence; M4 `streamRun` drains the
body; M5 the route re-imports the engine; M6 the caller drops `agent_not_bound`; M7 an adapter grows a competing
gate; M8 the route leaves the run open). **Two separate-agent hostile critics**: the first found the run-close
defect; the second verified the fix on all five claims and found only the bodyless-`Response` gap (also fixed).

**Honest bound — NO box moved.** After this change **no production code outside the two adapters names an engine**,
**except** the package barrel `src/index.ts` (a re-export, not a caller) and the registered `CC-69` bypass.
**`B-05`, `N-8` and the three `Port` boxes keep `☐`** on purpose: the row's sentence is *"no other code talks to
it directly"*, and that is a claim about **the whole codebase** — it is only true once **proven**, and the proof is
**R28-5**. **ONE NUMBER unchanged 75 / 321 = 23%.**

**★ NEXT = `R28-5`** — the "nothing bypasses the door" check: prove, **mechanically**, that no production file
outside the two adapters reaches an engine, with **`CC-69`** named as the ONE registered bypass (the chat route's
`answerQuestion` short-circuit — trigger-gated on an owner ruling) and **`src/index.ts`** named as the package
barrel (a re-export, not a caller). This is the row's exit gate for **`B-05`** and **`N-8`**.

---

**R28-5 DONE — the door is PROVEN the only way in; `B-05` ticked. ONE NUMBER 75 → 76 / 321 = 24%.**
**(2026-10-12; code repo `workspace/starting-kit`; docs = this change.)**

**What was built.** ONE new test file,
`packages/ai-assistant/src/modules/ai_assistant/__tests__/door-only-way-in.test.ts` — a **sibling** of
`binding-coverage.test.ts` (that suite proves the *gate*: "is every dispatch gated?"; this one proves the
*door*: "does anything reach an engine without it?"). It walks every production `.ts` **and `.tsx`** file under
`src/`, comment-strips each, extracts every module edge that resolves to an engine basename, and asserts the
**only** engine-reaching files are the two engine definitions, the two adapters, the barrel, and the **two
named exceptions**.

**The measured inventory (rule 0b).** 9 files reach an engine, all accounted for: 3 engine definitions
(`agent-runtime.ts`, `opencode-client.ts`, `opencode-handlers.ts`), 2 adapters (the door), the barrel
`src/index.ts` (re-exports), `api/chat/route.ts` (→ **`CC-69`**), `api/health/route.ts` (→ **`CC-71`**, a
**new finding**), and `lib/ai-runtime-port.ts` (comment-only mentions — no import). **Two premise corrections
(rule 13):** the plan's first draft named `api/ai/chat/route.ts` for `CC-69` — the reach is in
**`api/chat/route.ts`**; and `api/ai/chat/route.ts` (the `CC-67` route) imports **no** engine at all.

**The test — 11 assertions.** engine set real · each engine really DEFINES an entry point · **the derivation
test** (scans `lib/` for engine-defining files, requires the declaration to name them all) · door/engine not
mistaken for callers · **the scan** (only the door, engines, barrel and named exceptions import an engine) ·
each exception imports only its allowed engine · no third engine imported · `CC-69`/`CC-71` pinned · 
`api/ai/chat` NOT an exception · the barrel's reaches are `export … from` · **the scan really visits `.tsx`**
(the self-check that closes the critic's hole).

**Proof.** Isolated **11/11 green**; full package suite **118 suites / 1607 tests green** (baseline 117/1596 →
**+1 suite, +11 tests**); type-check **100 pre-existing errors with the file, 100 without, 0 attributable**
(a control); **12 mutations, ALL RED, every one md5-restored** (8 test-side T1–T7 + T6a/T6b, 4 production-side
P1–P4).

**A separate-agent hostile critic found THREE real defects — all fixed.** (a) `walk` filtered `.ts` only →
**36 `.tsx` files were invisible** (the most serious — the suite's central claim was unproven for React
components); (b) only single-line `import … from` was detected — multi-line imports, side-effect imports,
`require()` and dynamic `import()` were all missed; (c) the header claimed the engine set was *"derived, not
typed"* when it was a hard-coded array — **now really derived**, with an honest header. Critically, the `.tsx`
fix is now **self-guarding**: without the new self-check test, reverting `.tsx` support kept the suite green
(proved by mutation T6 in round 1) — so the fix could have been silently undone.

**The honest box question — answered.** The row's sentence is *"**no other** code talks to it directly"*. After
this change **no production code outside the two adapters reaches an engine for a run** — now *mechanically
proved*. But the sentence is **not literal**: **two registered, non-run reaches remain** — `CC-69` (the chat
route's `answerQuestion` short-circuit) and `CC-71` (the health endpoint). Both are pinned by the test, both
carry callbacks, neither is a *run*. **So: `B-05` ticks** (its only blocker was *"prove the door is the only
way in"*, now done). **`N-8` keeps `☐`** — its rewire half is proven, but its *delete* half (`R28-6`) is not.
**The three `Port` boxes keep `☐`** on their **own** blockers (`steerRun`/`resolveToolCall` unsupported;
`secretRefs` unpopulated + `CC-70`). **The two non-run exceptions do not block `B-05`.**

**★ NEXT.** `CC-69`/`CC-71` are **RULED 2026-10-12** (owner delegated): **both accepted as deliberate, named,
permanent exceptions** — `CC-69` is a control message about a paused run, `CC-71` a monitoring surface; neither
is a run, and the door's contract is **not** widened now (it would be shaped around OpenCode, which `R28-6`
deletes; the shape is decided when Hermes lands). **Remaining build = `R28-6`** (delete OpenCode = `N-8`'s
second half) — a separate step.

---

### ⛔ MEASURED, NOT BUILT — **`R28-6` ("delete OpenCode") is TRIGGER-BLOCKED: it would remove the only engine that answers a chat. Registered as `CC-72`.**
**(2026-10-12; measured in code, rule 0b — no code changed.)**

**The task, and the rule-9b challenge.** `R28-6`'s stored text was *"Remove OpenCode (its client, its
handlers, its `OPENCODE_URL`) once the chat route is proven on the door."* I measured before building
(rule 0b) and challenged the task before executing it (rule 9b). **The first draft fails its own premise.**

**What was measured.**

- **Hermes does not exist in this repository.** `git ls-files | grep -i hermes` → **empty**. No Python
  runtime, no worker, nothing. (This plan's own §4 already says *"Hermes itself is NOT built here."*)
- **OpenCode is the only engine that can answer a chat.** The live chat route reaches it through the door
  (`api/chat/route.ts:122` / `:536` → `createOpenCodePortAdapter`); the engine runs as a **Docker service
  the platform points at** (`OPENCODE_URL`, default `http://localhost:4096`; `docker/opencode/*`; wired in
  every `docker-compose*.yml`). The platform's **own** runtime (`agent-runtime.ts`) is a *different* engine
  on *other* routes — **not** a substitute for the OpenCode chat path.
- **The architecture document states the gate verbatim** (`ARCHITECTURE-hermes-integration.md` §11):
  *"**When OpenCode goes.** It is still load-bearing (`api/chat/route.ts` is wired to it), so it stays until
  **N-8** rewires the platform chat. The decision settles **what replaces it**, not **when**."* Its §9
  adoption order puts the replacement (**Hermes**) at **Phase 2+**, behind Phase 0 (pin & map) and Phase 1
  (the port — our current, achieved state).

**The verdict.** `R28-6` is a **deletion with nothing to delete *to*** — deleting OpenCode today would
remove the only engine and leave the door standing over a hole. It is **trigger-blocked on Hermes**, not on
effort. **It is not a buildable task** and must not be started.

**A second finding — the draft was under-scoped (rule 13).** "OpenCode" names **two unrelated things** in
this codebase: (1) **the engine** (`opencode-client.ts`, `opencode-handlers.ts`,
`opencode-port-adapter.ts`, `docker/opencode/*`) — what `R28-6` deletes, **when Hermes lands**; and (2) a
**naming vestige** — `shared/.../opencode-provider.ts`, the `OPENCODE_*` env names, and
`api_keys.opencodeSessionId` — which is the platform's **own model-provider config** (Anthropic/OpenAI/
Google) and its chat-session binding, and must **NOT** be deleted. A naive "delete everything matching
`opencode`" would break the platform's own model selection.

**What changed in the docs (same change).** The plan's `R28-6` section now carries the requirement + the
challenge + the corrected prerequisite (the old "Prerequisite: R28-3 + `CC-67`" was **insufficient** — those
prove the *door*, not a *replacement*; corrected per rule 13). Registered as **`CC-72`** with the trigger
*"Hermes exists and is wired behind the door (architecture §9 Phase 2+)"*. `N-8`'s box note and the plan's
status table updated. **No box moved** — `N-8`'s delete half is genuinely blocked, and the honest reading is
that ticking it now would be a lie. **ONE NUMBER unchanged: 76 / 321 = 24%.**

**The honest next work.** Row 28's **port shape is complete** (`B-05` ticked, the door proven). The
deletion, and the three `Port` boxes behind it, wait on **Hermes** — which is the **architecture §9
Phase 0→2 track**, a *different* workstream, not a row-28 sub-step.

---

### ✅ DONE (partial) — **Row 27 (Phase 7): MEASURED, and its one startable half built — the S8 repeat-detection signal. `S3`'s seal is blocked on `G-04`; the offer is the frontend. No box moved.**
**(2026-10-11; code repo `workspace/starting-kit`.)**

**The task (rule 0b).** Row 27 — *"the user is told when blocked and noticed and suggested to — not left
guessing"* (`S3` + `S8`). Measured first:

- **`S3` ("told when refused") is HALF there.** The dispatcher's refusal returns a localised message **plus the
  missing feature list** (`{ error: t('api.errors.forbidden','Forbidden'), requiredFeatures }`, 403 —
  `apps/mercato/src/app/api/[...slug]/route.ts:249`). The **"seal"** — a marker that an answer was *reduced* —
  does **not** exist, and the spec ties it to the **data permissions work**: it needs the **data axis
  (`G-04`)** to know *what* was withheld. **So that half is BLOCKED, not skipped.**
- **`S8` ("notices and suggests") was half-built and inert.** The **gate** exists
  (`canOfferSaveAsFunction`, `request-outcome/gate.ts`) but has **no production caller** — the architecture
  says the Save *button* is separate (frontend). The **"notices" half did not exist at all**; the spec names
  it exactly: *"a per-user request history and a similarity signal"*.

**Built — the startable half.** `shared/src/lib/request-outcome/repeat.ts` (+ test): the **similarity signal**.
`normaliseRequestText` (Unicode-aware — a naive `[a-z0-9]` strip would empty every non-Latin request and make
them all look like repeats), `requestSimilarity` (Jaccard over token sets), `detectRepeatedRequest` →
`RepeatSignal`. **Pure — zero imports** (no clock, no DB, no model), so the rule can be tested exhaustively.
**A signal, not a decision:** renamed from `…Verdict`/`repeated` to `RepeatSignal`/`looksLikeRepeat` after the
critic flagged that the first name collided with the gate's real decision type. An empty request is **not** a
repeat of an empty one; the threshold defaults to **0.8** and is clamped; the O(history) cost is documented as
the caller's to bound (the module does not silently truncate).

**Proof.** `request-outcome` — **5 suites / 78 tests green** (16 new); `tsc --noEmit` clean; **4 RED-then-GREEN
mutations**, md5-verified restores (+1 re-proved after the rename). **A separate-agent hostile critic attacked 7
claims: all held; 2 findings were FALSE POSITIVES** (the cited docs *do* exist — in the docs repo, which the
critic did not search; and the deep-path import is the package's own pattern, as the sibling `tier-source` is
imported the same way) **and 1 was real and is fixed** (the naming collision).

**Honest bound — and NO box moved.** `S3` and `S8` are whole points and neither is whole, so both stay `☐`;
the ONE NUMBER is **unchanged at 75 / 321 = 23%**. Registered as **`CC-66`**: the **history read** that feeds
the signal, and the **offer** (the Save button).

**WHAT IS STILL NOT DONE, IN PLAIN WORDS — and what unblocks each part.** Row 27 promised two things.
Neither is finished. Here is exactly what is missing, and what has to happen before each one can be built:

| # | What is missing (plain words) | Unblocked when… | Who holds it |
|---|---|---|---|
| **1** | **"The answer you got was reduced" marker.** When the system hides part of an answer because you are not allowed to see it, it does **not** currently tell you a part was withheld. It cannot — it does not yet know *which* records you may read line-by-line. | **`G-04`** lands — the "may this actor read **this row**, for this purpose?" layer. Until it exists there is no way to know *what* was withheld, so the marker has nothing to name. | **Blocked on other work** (not on you). `G-04` is open at `platform_points.md:569`. |
| **2** | **The memory of your past requests.** The thing I built can tell two requests are similar, but **nothing feeds it your history yet** — so today it sits unused. | **Immediately startable** — no prerequisite. The platform already stores your past prompts in `ai_chat_messages`; they just are not read yet. | **Ready to build now** (a small wiring job). |
| **3** | **The "Save as a Function?" offer — the button.** The rule that decides *whether* an offer may be made exists, but **no screen asks you**. | **The front end is built** — the Save button is a user-interface piece, deliberately deferred. | **Blocked on UI work** (not on you). |
| **4** | **"The platform never acts without asking."** This is `S8`'s second clause. It is only true once parts 2 and 3 exist — there is nothing to ask about until the platform notices (2) and offers (3). | **After 2 and 3 are done.** | **Follows from 2 and 3.** |

**Summary of the four:** one piece (**2**) can be built any time; one (**1**) waits on the data-permission
layer `G-04`; one (**3**) waits on the front end; the last (**4**) simply follows from 2 and 3. **Row 27
stays 🟡 until at least `S3`'s marker (1) exists**, because `S3` names both halves.

**★ NEXT = LIST row 28** (Phase 8 — *"the agent runtime sits behind one typed door"*).

---

### ✅ DONE — **Row 21 / 21b (Phase 6, Audit): RE-MEASURED — the phase is BUILT. `P4a`/`P4b` ☐→☑, so the ONE NUMBER MOVED again: 73/321 → 75/321 = 23%.**
**(2026-10-11; docs only — no code changed; this was a measurement.)**

**The task (rule 0b).** Rows 21 / 21b were 🟡, with the appendix recording `P4 ▸ 0/2 — *"no sub-part verified
in code this round"*. So the job was to **measure first**, not build. Measured: **the phase is built.**
`packages/core/src/modules/audit_logs/` carries a **read API** (`api/audit-logs/actions/route.ts` — `GET`, RBAC
`audit_logs.view_self`, filters by actor / resource / org), a **viewer page** (`backend/audit-logs/page.tsx`,
235 lines, fetching the action **and** access logs), an **export API** (`actions/export/route.ts` — CSV), a
**hash-chained ledger** (`services/ledgerService.ts` — each event carries its predecessor's hash;
`unique(tenant_id, seq)` + `unique(tenant_id, hash)`; `verifyTenantChain` + a `ledger:verify` CLI), appended
**automatically** by `actionLogService.log()` (called by the command bus), and **retention** for the
high-volume access log (`accessLogService.rotate()` — core 7d / non-core 8h).

**Corrected (rule 13):** `P4a` and `P4b` ☐→☑ → **§B 5/38 → 7/38**, so the ONE NUMBER moved **73/321 → 75/321 =
23%** — re-derived by **two independent routes** (a Node parse and a Python parse). Row 21b's ID had also cited
`P4a` (the *read-API* sub-point) — a **mis-reference**, now fixed.

**A separate-agent hostile critic (8 claims, a command + output each) could NOT falsify the build** — and found
**2 register-worthy cracks, both scheduled:**
- **`CC-64`** — an **undo's trace bypasses the ledger** (`markUndone` uses `createLogEntity` + `persist`, never
  `appendToLedger`), so the one record the chain does **not** cover is the record of an undo.
- **`CC-65`** — **`action_logs` has no retention path** (unbounded growth; `access_logs` rotates, the ledger is
  deliberately permanent — pruning it would break the chain).
It also recorded that **`action_logs` is mutable by design** (the backfill CLIs `UPDATE` derived columns), so
the tamper-evidence is the **ledger**, not the table. **Stated, not hidden.**

**★ NEXT = LIST row 27** (Phase 7 — *"the user is told when blocked and noticed and suggested to — not left
guessing"*), the earliest open row now that Phase 6 is ✅. Its items are `CC-8` / `CC-9` (both trigger-gated);
it starts with a rule-0b measurement.

---

### ✅ DONE — **`CC-61` (LIST row 19): the command contract is now uniform — `risk` · `approval` · `idempotency` exist and are recorded. `C6b` ☐→☑, so the ONE NUMBER MOVED: 72/321 → 73/321 = 23%.**
**(2026-10-11; code repo `workspace/starting-kit`.)**

**The task (rule 10c).** Row 19 — *"every state-changing action goes through one typed command, never a raw
write"*. Measured first (rule 0b): the command bus is **real** (`shared/src/lib/commands/`, ~122 command files
across ~18 modules, 20 test suites) — so the row's own claim **held**. What did **not** hold was **`C6b`** —
*"the full contract uniform across every action"*: `CommandHandler` carried `capability` / `execute` / `undo` /
`redo` and **no `risk`, `approval`, `idempotency` at all**.

**Built.** The three facets as **optional** declarations on `CommandHandler` (`types.ts` — nothing existing
breaks), and the bus **records** whatever a handler declares on the action log under `context.commandContract`
(`command-bus.ts` — `commandContractMetadata` + the merge before `persistLog`). **Approval DECLARES; the
authority layer ENFORCES** — a bus refusal would be a **second permission engine** (`S5`). `C6b` ☐→☑.

**Proof.** `src/lib/commands` — **20 suites / 169 tests green**; whole `shared` — **2555 tests** (the one
failing suite is the **known-environmental `CC-19`**, not this change); `tsc --noEmit` clean; **5 RED-then-GREEN
mutations**, every restore **md5-verified**. **A separate-agent hostile critic found 1 REAL defect, fixed:** the
first draft merged the contract **inside `buildLog`**, which returns null when a handler has no `buildLog` — so a
declaring handler recorded **nothing** even though a log **is** written from caller metadata. Its `D2` (0 of ~93
commands declare the fields) is **not** a defect but a named follow-on: **`CC-63`**.

**Honest bounds.** The contract is uniform in **shape**; **adoption is 0** (`CC-63`). And **`S5` is measured,
not closed** — the feature **matcher** is single (`featureMatch.ts`, 7 importers) but **two RBAC *services***
share it, and that split is not yet justified.

**★ NEXT = LIST row 21 / 21b** (Phase 6 — **Audit / provenance**), chosen by the vision's order: Phase 5's
remaining 🟡 rows are blocked (**row 16** — `CC-51` deferred by you; **row 20** — `CC-42` is business work). It
**starts with a rule-0b measurement** (what audit already exists) and has **no `CC-` item yet**.

---

### ✅ DONE — **`CC-59`: the Business-IR chain now has its FIRST PRODUCTION CALLER — the wire `runBusinessQueryPrompt` plus the registered tool `business_ir.run_query`. Gated, tested, and verified by a separate-agent critic.**
**(2026-10-11; code repo `workspace/starting-kit`; owner's go-ahead: *"execute the supplementary core queue"*.)**

**What was built.** The pipeline was five built, tested layers with **no caller**. `CC-59` added the caller:
`lib/business-ir-run.ts` — **`runBusinessQueryPrompt`**: prompt → `authorBusinessQueryIr` (binding-gated,
`CC-57`) → IR → `compileQuery` (session-scoped `CompileContext`) → `engine.query` → a **result** union
(`{ rows, ir, plan, provenance, diagnostics, entity, appliedBounds }`). Every refusal is a **value**, never a
throw: `agent_not_bound` / `schema_rejected` / `compile_failed` / `no_binding` / `engine_failed`. It also adds
the defensive guardrails the NL→query literature calls mandatory (`B5e`): a default row limit (100) and a max
time range (365 days), applied **only** when the IR stated none (`applyDefaultBounds`). The **caller of the
caller** is `ai-tools/business-ir-pack.ts` — the tool **`business_ir.run_query`** (read-only,
`requiredFeatures:['ai_assistant.view']`), registered in `ai-tools.ts` so the generator picks it up. It
assembles the model (`tryBuildModelFromModules`), the bindings (`createBindingsFromDeclarations`), `em` and
`queryEngine` from `ctx.container`, and passes **scope from the tool context only**.

**The interruption it finished.** `CC-59` was left **RED** mid-build: the wire's test failed 1/15 because the
test stubbed the DB handle as `{}` and the unbound-AI-worker case does a real lookup — so it threw and the
refusal came back as `engine_failed` instead of `agent_not_bound`. **Fixed** by mocking the binding repository
the way the project's own routed test does. **No gap left.**

**Proof.** Pack gate **9** + wire **15** + binding **9** + coverage gate **12** green; **whole `ai_assistant`
module 111 suites / 1518 tests green**. **8 RED-then-GREEN mutations**, every restore **md5-verified**: early
return before the entry point; hardcoded `auth.sub`; the principal guard removed; `isMutation:true`; the pack
dropped from the aggregator; a real compiler import; the null-principal guard; the whitespace guard.

**A separate-agent hostile critic** checked all 7 claims (a command + output each) and found **2 REAL
defects — both fixed**:
1. **The doc overclaimed.** It said the tool is "the one tool an agent can call"; measured, **no agent
   whitelists it** (`business_ir.query_author` is object-mode with **no tools**, by design). The tool is live
   on the authenticated tool door (`POST /api/ai/tools/execute`) and MCP — **not yet** for an in-chat agent.
   The doc now says exactly that, and the consumer gap is scheduled as **`CC-60`**.
2. **A blank/whitespace subject skipped the binding.** `derivePrincipal` trims the subject and returns `null`
   for a blank one; `resolveAgentBinding` treated `null` as a **human passthrough** — a fail-open. **Fixed in
   both places:** the tool's guard now trims (`!ctx.userId.trim()`), and **`agent-binding.ts` now refuses a
   null principal** (`bound:false`) instead of treating "unknown" as human. Two new tests, both
   mutation-proven (M7/M8).

**THE ONE NUMBER: UNCHANGED at 72 / 321 = 22%** — a caller adds no vision box. Re-derived by **two routes**
(the local `derive-counts` parse and a blind verifier agent), both 72/321.

**★ NEXT = LIST row 19** (Phase 5 — *"every state-changing action goes through one typed command, never a raw
write"*), chosen by the vision's own order (Phase 5 before Phase 6): Phase 5's other open rows are **blocked** —
**row 16** 🟡 (its remainder `CC-51` is **deferred by you**), **row 20** 🟡 (its remainder `CC-42` is **business
work**). **Row 19 starts with a rule-0b measurement** — its remainder is **un-named** today (the appendix says
the command contract is `PARTIAL` and `S5` is `☐ 0/2`, but **no `CC-` item carries it**), so step 1 measures,
names, and registers it (rule 8). **Every open item, listed under its row:
[`library/development/platform_points.md`](library/development/platform_points.md) → ⏳ OPEN WORK.**

---

### ✅ CORRECTION — **`CC-59`'s scope was wrong: the compile+execute chain is ALREADY BUILT (`runFunction`) — the gap is one caller, not a chain. Corrected everywhere it was copied (rule 13). `CC-59` is now the first startable item of the supplementary queue.**  
**(2026-10-11; docs repo only — no code yet.)**

**How it was found — the first act of *executing* the plan (rule 0b).** Starting `CC-59` (the owner's go-ahead), I measured the pipeline before writing anything. **The register's wording was false:** it said *"wire `compileQuery` + `runUserFunction` to an external read path"* — as if the chain had to be built.

**What is actually true (measured).**
- **The chain is complete.** **`runFunction`** (`packages/shared/src/lib/user-function/run.ts:112`) already does **bind → freshness → compile → resolve the physical binding → execute** — the execute hop is `engine.query(binding.platformEntityId, plan.physical)` (`run.ts:216-241`) on the platform's **existing** read path. It is tested (`business-ir` 78 + `user-function` 133 = **211 passing**).
- **There is no production caller.** `runFunction`'s only non-test mention is a **comment** (`business-widget/placement.ts:24`); `authorBusinessQueryIr` and `compileQuery` likewise have no production caller. **The pipeline is a complete circuit with no switch on the panel.**
- **The "load a saved Function by id" shape is impossible** — a `UserFunction` has **no persistence** (no entity, no table, no repo). That shape is `CC-32`, gated on `G-09`. **So `CC-59` is NOT blocked on `G-09`.**
- **The naming slip:** the exported entry is **`runFunction`**, not `runUserFunction`.

**What `CC-59` therefore IS:** **one core entry point** — prompt → `authorBusinessQueryIr` → IR → `compileQuery` → `engine.query` → **a compiled result** — needing **no persistence**, and exactly the owner's described flow (§S1.3). It **merges** with `CC-58` Stage C (both are the same single core caller).

**Rule-13 corrections made (5 docs):** the plan §S1.2 (table rows L5/W-A rewritten + a "corrected scope" paragraph), the register `CC-59` row, `BACKLOG.md` (`CC-59` + the workspace row), `NEEDS-YOU.md` (`NY-24` — a dated correction note), `platform_points.md` (FRONTIER NOW = `CC-59`).

**Verification.** Register clean (59 rows, contiguous 1…59, no dups, no BAD-COLUMNS); every edited file `raw diff == git diff -w` (no reflow); LF-0.

---

### ✅ DONE — **rule 15 (solve-what-is-straightforward NOW) added; the Business IR re-classified as CORE; every postponed layer + wiring point enumerated so nothing is missed when the core is done**  
**(2026-10-11; docs repo only — no code.)**

**The owner’s Message-4 instruction (three parts, verbatim highlights).** (1) *“we should add a rule that manage this issue properly… [for] ‘anything that is solvable straghtforward and does not disrupt the overall development plan, we solve immediately… postpone fixing what is easily fixable can coverup gaps that fixing can expose.’”* (2) *“I am not sure the business ir issue is not a cor issue considering that the main functionality of the platform will be a user communicating with thedatabase via Ai PROMPTS that create business IR layer nuggets that are executed on the database to meet the user’s inqueries… add details about the postponed Business IR layers and wiring everywhere needed so we do not miss anything.”* (3) *“document and then we start executing the suplimentary implimentation plan and update the documents of development accordingly as we go.”*

**Fact-checked first (rule 0b).** Re-measured the whole Business-IR pipeline from the code: `authorBusinessQueryIr` → **only its own definition** (no production caller); `compileQuery` → callers are `recompile.ts` + `user-function/{run,verify}.ts` + `fingerprint.ts`, **all inside the shared library**; `runUserFunction` → **no caller**; **0 route files** in `apps/mercato/src/app/api` mention the IR/author/compiler. Jest confirms the `business-ir` suite = **78 passed, 6 skipped** (the live-model smoke test). Confirmed the core test in [`CORE-BOUNDARY.md`](library/development/CORE-BOUNDARY.md) §0 (line 21), Ring 1’s *“command/action contract”* (line 40) and row **C2** (line 60 — *“the exact ‘AI through Business IR accesses everything’ hole the owner fears”*).

**1 — Rule 15 added** to [`WORKING-RULES.md`](library/development/WORKING-RULES.md) §1 (house form, the owner’s words, the worked example: `CC-43` left *flagged* **hid `CC-46`**). The stale *“now six”* rule-count parenthetical was corrected in the same change (itself a rule-15 fix).

**2 — The Business IR is CORE (re-classified).** Recorded in three places: the plan’s **§S1.1** (with the test), a dated note in `CORE-BOUNDARY.md` §2, and `BACKLOG.md`’s `CC-58` row. The **complete postponed-layer map** is the plan’s **§S1.2** — a table of every layer (`L1` schema → `L2` author → `L3` bind → `L4` compile → `L5` recompile/run) and every wiring point (`W-A` read path, `W-B` screen, `W-C` the frontend workspace), each with its state and the exact wiring that makes it live. The owner’s **frontend-workspace destination** (prompt → AI authors a Business-IR nugget → executed internally) is recorded verbatim in **§S1.3**, to be detailed once the core is done.

**3 — Go-ahead recorded; execution begins.** `NEEDS-YOU.md` **`NY-24`** carries the second-answer block (5 recorded decisions); `BACKLOG.md` gained a **`CC-59`** row (the compile half) and a **frontend-workspace** row; `platform_points.md`’s FRONTIER NOW records the go-ahead and the re-classification; `COMPLETION-CALLBACKS.md`’s `CC-58` row was refined (only the *screen* is business-half — the wire is core). `LESSONS.md` **L124**.

**Verification.** Every edited file: `raw diff == git diff -w` (no reflow), lines **LF-0 on disk AND in the blob**, no `/n` trap (all structured text written via **script files**, never heredocs — L123 held). Register re-checked: **59 rows, ids contiguous 1…59, no duplicates, no BAD-COLUMNS.** *(A first quick contiguity check falsely printed `False` — it compared ids in *file order*; the register is in narrative order. Correct check is set-based. Banked as **L124**.)* **ONE NUMBER unchanged** (72 / 321 = 22%).

---

### ✅ DONE — **register contiguity restored (`CC-43`, `CC-46` added); the Business-IR pipeline’s SECOND unwired half measured and scheduled (`CC-59`)**  
**(2026-10-11; docs repo only — no code.)**

**The owner’s instruction (2026-10-11, verbatim).** *“anything that is solvable straightforward and does not disrupt the overall development plan, we solve immediately. The more we push till later the more we risk a codebase accumulating many holes.”*

**Solved immediately (register hygiene — the register’s own check 3).** Two ids were cited **CLOSED** elsewhere but had **no register row**, leaving contiguity gaps: **`CC-43`** (the permission catalogue’s read half — `readTenantSurfaces` + `GET /api/auth/permission-surfaces`, 27/27 tests + 5 mutations + hostile critic, closed 2026-10-09) and **`CC-46`** (all **53** searchable entities declare `aclFeatures` + the coverage gate, code `c03eca5c`, closed 2026-10-10). Both rows were **added** as `✅ DONE`. The register’s contiguity check now runs **clean: ids 1…58 with no gaps**, no duplicates, no malformed rows. Nothing was rebuilt — this was a recorded fact that had gone unwritten.

**Measured (rule 0b) — the Business-IR pipeline has TWO unwired halves, not one.** Asked whether the *best* version is buildable now, I measured the whole path: **five built, tested layers** (`schema.ts` → `authorBusinessQueryIr` [binding-gated, `CC-57`] → `bind.ts` → **`compileQuery`** → `recompile.ts` / **`user-function/run.ts`**), **78 tests** incl. a live-model smoke test — **but nothing in the running product reaches any of them**: the author has no production caller; `compileQuery`’s only callers are **inside the same library**; `runUserFunction` has **no external caller**; and **no `api/**/route.ts` names the IR, the author, or the compiler**. The wire is inert along its whole length.

**Scheduled (rule 8).** The compile half is now its own row **`CC-59`** — **core** work (a shared-library capability + a read path), squarely inside the core plan, **not** business. Its consumer is the Stage-B screen; Stage C (`CC-58`) wires only the head. `NEEDS-YOU.md` **`NY-24`** was updated with the measurement and a **3-option decision** (keep A→C→B / pull `CC-59` forward / pull the whole thing), with the note that **Option 2 is core and startable now** and **does not violate the owner’s order ruling** (no business screen).

**Verification.** Register: all five own-checks clean (contiguous 1…59, 25 open, no dup, no malformed row); `raw diff == `git diff -w` for every edited file. **ONE NUMBER unchanged** (72 / 321 = 22%) — these are recorded facts and a scheduled row, not new scored work.

---

### ✅ DONE — **the supplementary core queue: every open register item staged in the live docs; the Business-IR wire's first caller scheduled A→C→B (`CC-58`)**  
**(2026-10-11; docs repo only — no code.)**

**The task (the owner's Message-3 instruction, 2026-10-11).** Two things: **(1)** adopt the staged introduction of the Business-IR authoring wire's first caller (A now → C next → B later) **on the condition that each stage is scheduled in the live documents** — so no stage is forgotten; **(2)** create a **supplementary implementation plan** covering every item in `COMPLETION-CALLBACKS.md`, **focused on the core, not business modules**.

**What was built (docs).**

1. **Register row `CC-58`** (`COMPLETION-CALLBACKS.md`) — `authorBusinessQueryIr` (the plain-language → Business IR wire) is built, tested, and — since `CC-57` — **fails closed** and threads `computeBoundRunScope`, but **nothing in the running product calls it**. Three stages with **named triggers**: **A** (leave it pinned, unreachable — the coverage gate keeps it honest) **in force now**; **C** (register it as a chat tool on the existing AI chat path) *when the AI tool surface is next touched*; **B** (the full business screen) *when business work resumes*.
2. **`PLAN-SUPPLEMENTARY-CORE-QUEUE.md` (NEW)** — the supplementary implementation plan. It goes through **every open register row** (measured: **24 open** — 32 DONE, 56 rows total), stages them into clusters (**§S1** the `CC-58` staged caller; **§S2** the data-axis cluster gated on `G-04`/`G-09`; **§S3** the structural-guard edges; **§S4** the escalation/approval cluster; **§S6** environment/ops; **§S7** the AI read/write tool-path edges; **§S8** owner-decision; **§S9** the deferred-by-ruling team-leg), each with a **named trigger** copied from the register. **`CC-42` (the `customers` deal pipeline's first caller) is the ONLY business item and is excluded (§X)** — 23 core items covered,
   1 business excluded.
3. **Live-doc references** — the staging is linked from `platform_points.md` (FRONTIER **NOW**), `BACKLOG.md` (FRONTIER **NOW** + the *Deferred by decision* table), and `NEEDS-YOU.md` (`NY-24`, the decision record).

**Register hygiene (found while adding `CC-58`; the register's own 5 checks).** Two **pre-existing** conditions surfaced: **(a)** a **duplicate `CC-27` row** (the original gap statement *and* the DONE record) made `CC-27` read as both closed and open — the superseded row was **removed** (its gap text is preserved struck inside the DONE row); **(b)** **`CC-43` has no register row though it is cited CLOSED elsewhere** (check 3: `GAP before 44`) — **flagged, not fixed** (a small standalone edit, deliberately not mixed into this change). Both are recorded in the register's own hygiene note.

**Verification (the TOTAL quality protocol).** A **separate-agent hostile critic** verified all **6** claims with a command+output each (open-set derivation exact match 24/24; plan covers all 24 ids; register checks 2 & 4 clean, check 3's `GAP before 44` proven pre-existing at HEAD; `raw diff == git diff -w` for all four files; `CC-58` well-formed with 5 cells; no scope creep) and found **1 real defect** — a literal `/n` typo in the hygiene note — **fixed** (the note's paragraph/numbered-list structure restored). **No code changed; ONE NUMBER unchanged** (72 / 321 = 22%).

**Honest boundary.** This change **schedules** work; it builds nothing. Every row in the plan is a *view* of the register — the register remains the truth.

---

### ✅ DONE — **row 22's LAST named leg — the in-process dispatch helper now consults the binding and threads its scope (`CC-57`). Row 22 is now COMPLETE. ★ NEXT = a fresh pick from the vision order (the named `CC-` queue is exhausted).**
**(2026-10-11; code repo `workspace/starting-kit`.)**

**The task.** Row 22's core leg (`CC-27`) gated agent **dispatch**; the narrowing leg (`CC-55`) applied the binding's
scope at run time; the execution leg (`CC-56`) re-checked the binding at the pending-action **confirm**. What
remained: the **in-process** dispatch helper `lib/business-ir-author.ts` (`authorBusinessQueryIr`) called
`runAiAgentObject({ agentId: BUSINESS_IR_AGENT_ID, … })` with **no `boundScope` and no binding check** — the
**only** non-route dispatch site (found by `CC-55`'s module-wide coverage scan, which named it in
`IN_PROCESS_DISPATCH_SITES`). A grant that is not consulted is not a grant.

**The contract built (`B3''`).** `AuthorBusinessQueryIrInput` gains **two required** fields — `auth: AuthContext`
(the `sub`/`principal` the binding is looked up **by**) and `em: EntityManager` (so the one DB read is visible at
the call site and testable without a container). `AuthorBusinessQueryIrResult` gains the arm
`{ ok:false, reason:'agent_not_bound' }`. Before the model is asked, the helper resolves
`resolveAgentBinding({ em, auth, agentId: BUSINESS_IR_AGENT_ID })`, **refuses** when `!binding.bound` (a value,
not a throw — and the model is never called), then `computeBoundRunScope({ agentId, binding })` and passes it into
`runAiAgentObject` — the **identical** fail-closed check and narrowing-only scope the two routed paths apply. A
**human** is a passthrough (`{ toolAllowlist: null, requiredFeatures: [] }`, **no** DB read, `B4`).

**The gate got the arm its own header promised.** `binding-coverage.test.ts` now has a **GATED arm**: a file that
both **dispatches** and **calls `resolveAgentBinding`** is gated, not an offender — so `IN_PROCESS_DISPATCH_SITES`
falls to **empty** (no un-gated site remains). A **positive pin** asserts the known in-process site still
dispatches, consults the binding, and threads `boundScope`, so the closure cannot silently regress. The **6** call
sites in the helper's own end-to-end suite now pass a **human** `auth` + a stub `em` (the human path is
byte-identical — the assertion the suite exists for).

**Hardening (TOTAL quality protocol) — a separate-agent hostile critic, a command + output per claim.** It
**CONFIRMED all 6 claims** (the scan walked **176** real files and classified the helper **GATED**; a temporary
probe file proved a binding-less dispatcher turns the gate **RED**, then was deleted with `git status` verified
unchanged; the refusal genuinely precedes the model — the mock resolves to the production import; the **real**
`computeBoundRunScope` runs (tools INTERSECT / features UNION, read from `agent-binding.ts`); the human derives as
`human` via `parseSubject`; **no other** un-gated dispatch site; the **full ai-assistant suite 109/109 suites ·
1492/1492 tests**). It raised **one LOW latent weakness**: the scan matched a dispatch **by name**, so an
`import { runAiAgentObject as dispatch }` alias would evade it. It is latent (grep: **no** alias and **no** barrel
re-export exists today) — but it is the very gate this item delivered, so it was **fixed**: the scan is now
**alias-aware** on both the dispatch and the resolver side, with a **new RED-then-GREEN pin** proving the alias is
caught.

**RED-then-GREEN — 5 mutations per `PLAN-CC-57` §6, + 1 for the hardening, every restore md5-verified.**
(1) fail-closed removed → both refusal tests **RED**; (2) `boundScope` dropped from the runtime call → all 3
scope tests **RED**; (3) `resolveAgentBinding` not called → the **gate** flags the helper as an offender **and**
all 5 binding tests **RED**; (4) the gate's GATED arm reverted → the helper re-appears in `offenders` **RED**;
(5) the human path force-narrowed → all 6 end-to-end IR tests **RED**; (6) alias-awareness removed → the new
alias pin **RED**. Restores verified **md5-identical** (`business-ir-author.ts` `c06e0ecf…`,
`binding-coverage.test.ts` `cda0525c…`); **23/23 GREEN** across the three suites. `tsc` clean for the CC-57 files
(the only two errors are a pre-existing `convertToModelMessages` mock spread and a generated-file path alias,
both independent of this change — proven by reading them at `HEAD`).

**Honest boundary (unchanged).** `authorBusinessQueryIr` still has **no routed caller** — this makes the existing
helper **safe for the caller it will one day have**; the register's honest trigger (a real caller) still governs
whether it is *used*. It is a **latent** gap made **safe**, not a new route.

**ONE NUMBER, two routes: 72 / 321 = 22% — unchanged** (§L's 13th re-run; local derivation + blind verifier
agent). The change adds no vision box.

---

### ✅ DONE — **row 7's write-path feature gate is now DEFAULT-DENY at the build (`CC-44`).** *(superseded by the `CC-57` block above; both done 2026-10-11.)*
**(2026-10-11; code repo `workspace/starting-kit`.)**

**The task.** Row 7 ("roles & grants enforced on every write") was true **in substance** but its mechanism was
**opt-in**: the dispatcher enforces `requireFeatures` only when the array is non-empty
(`apps/mercato/src/app/api/[...slug]/route.ts:207`), so a write route declaring `requireAuth: true` and **no**
`requireFeatures` has **no** feature check — and nothing *forced* the next route to declare one. The owner ruled
Option A (`NY-23`): make it a **build failure**.

**The contract built.** A build-time coverage gate —
`packages/cli/src/lib/generators/__tests__/write-gate-coverage.test.ts` (4 tests) — asserts that every write-verb
`route.ts` in an **enabled** module is either **feature-gated** (a non-empty `requireFeatures: [ … ]`) **or**
carries an explicit, machine-readable **`byDesign: '<reason>'`** exemption. Anything else fails the build. The
**11** non-feature-gated routes (6 by-design + 5 guard-only notifications) got the inert tag.

**The tag is INERT (proven, not assumed).** `extractMethodMetadata` (`route.ts:104–133`) copies only
`requireAuth`/`requireRoles`/`requireFeatures`/`rateLimit`/`skipModuleResourceUsageTracking` — never `byDesign` —
so the key is documentation, never behaviour. Confirmed by reading the function and by a `git stash` A/B (the
app's typecheck is byte-identical with and without the tags).

**Measured first (rule 0b).** 35 enabled modules · **170** write route files · **159** feature-gated · **11**
by-design (up from 169/158 at `CC-44`'s first measurement — `CC-27` added one feature-gated route).

**Hardening (TOTAL quality protocol) — TWO separate-agent hostile-critic passes.**
- **Round 1 found 3 REAL defects in the classifier**, all fixed: (1) `requireFeatures: []` counted as a gate
  although the runtime treats an empty array as **no** gate; (2) a bare `requireFeatures:` token inside a regex
  literal or a TS type annotation counted as a gate; (3) the factory clause (`makeCrudRoute(`/`make*Route(`)
  counted as a gate although `makeCrudRoute` only **relays** `opts.metadata.requireFeatures`
  (`shared/src/lib/crud/factory.ts:1036`) and supplies nothing. The predicate is now a **non-empty array literal
  whose first element is a string literal or an identifier** (the runtime condition), the factory clause is
  **removed**, and `byDesign` requires a quoted reason.
- **The tightening is FREE (measured):** old and new predicates classify **159 / 11 / 170** — **0** routes change.
- **Round 2 confirmed fixes 1 & 3 closed** and found the honest residual — a regex **character class**
  (`/requireFeatures: [abc]/`) or a **tuple type** (`[string]`) is indistinguishable from a real declaration by a
  tokeniser. Recorded as the tool's **honest limit** (0 routes affected).

**6 RED-then-GREEN mutations**, each restore **md5-verified**: un-gated new route; marker removed; marker
commented; commented-feature-only; empty array; stale pinned entry. `tsc --noEmit` clean (cli prod + test-file,
core, webhooks). **Green gates:** cli `write-gate-coverage` 4/4 + `crud-read-gate-coverage` 9/9, core-targeted
25/25, webhooks 127/127.

**A discovered, pre-existing defect — found and fixed (rule 13).** Running the sibling gates exposed that
`crud-read-gate-coverage.test.ts` (`CC-47`) was **RED at HEAD** (`routeFiles` 457 vs 458) and
`table-coverage.test.ts` (`CC-52`) was **RED at HEAD** (`EXPECTED_TABLES` 233 vs 234) — both drifted by `CC-27`'s
new bindings **route** and **table**, neither re-pinned by that change. Proven pre-existing by `git stash`
(identical failures with the working tree clean). Both pins corrected; both gates GREEN. **Banked `L121`.**

**ONE NUMBER, two routes: 72 / 321 = 22% — unchanged** (§L's 12th re-run; local script + blind verifier agent).
The gate adds no vision box.

**Banked `L120`:** a *gate* must be at least as strict as the *runtime* it guards — a faithful port of a
*measurement* tool is not a correct *gate* (its error tolerance is the opposite).

---

### ✅ DONE — **row 22's EXECUTION leg — the pending-action confirm path re-checks the binding (`CC-56`).** *(superseded by the `CC-44` block above; both are done 2026-10-11 — ★ NEXT = `CC-57`.)*
**(2026-10-11; code repo `workspace/starting-kit`.)**

**The task.** `CC-27` gated the **dispatch** of an agent and `CC-55` applied the binding's narrowing — but the
**pending-action confirm** route (`api/ai/actions/[id]/confirm/route.ts`), which **executes the agent's tool**,
did **not** re-check the binding. A binding revoked between the proposal (dispatch) and the confirm was **not
observed**, and the confirm re-executed the tool anyway.

**The contract built.** After `runPendingActionRechecks` succeeds and before `executePendingActionConfirm`, the
route now calls `resolveAgentBinding({ em, auth, agentId: row.agentId })` and returns **403 `agent_not_bound`**
when `!binding.bound` — the **identical** check and error code the two dispatch routes use. A human caller is a
passthrough (humans are not bound); an `ai_worker` whose binding was revoked is refused **before the handler
runs**. The OpenAPI 403 text now names `agent_not_bound`.

**Hardening (TOTAL quality protocol).** A **separate-agent hostile critic** raised 5 items, **3 real and fixed**:
(1) the **"human passthrough" test was vacuous** — it passed whether or not the production call existed; it now
supplies a `null` binding and asserts a human still gets 200; (2) the **coverage assertion ran on raw source**,
so a commented-out `// resolveAgentBinding(...)` satisfied it — it now strips comments (mirroring `CC-55`),
**proven** by a comment-out mutation that FAILS the fixed assertion and PASSES the old one; (3) the OpenAPI 403
description omitted `agent_not_bound`. **5 RED-then-GREEN mutations**, every restore **md5-verified**;
`tsc --noEmit` clean; **1487 tests / 108 suites** green.

**Honestly measured — the guard's scope.** The re-check guards the **confirm caller**: a **human** confirm is a
passthrough (correct — row 22's "run" is gated at **dispatch** by `CC-27`; a human confirm is the human
exercising their own authority), so the worker's revocation is observed when an **`ai_worker`** confirms.
Observing the **proposing worker's** binding on a human confirm would need the proposer's principal persisted on
the row (it stores only `createdByUserId`) — **out of scope, not a row-22 requirement today**. The only other
`executePendingActionConfirm` caller is the CLI tool-test harness (`lib/tool-test-runner.ts`, synthetic agent +
super-admin ctx) — measured, not a row-22 door. **Remaining named leg: in-process dispatch sites → `CC-57`.**
**ONE NUMBER, two routes: 72 / 321 = 22% — unchanged** (§L's 11th re-run).

---

### ✅ DONE — **row 22's NARROWING leg (an AI user can run only the agents bound to it, `BUILD-ORDER` item 20): BUILT (`CC-55`). The binding's scope is now applied to the run. ★ NEXT = `CC-44` (then `CC-57`).**
**(2026-10-11; code repo `workspace/starting-kit`.)**

**The task.** `CC-55` is the **second half** of row 22's `B3`: `CC-27` enforced *"may this AI worker run this
agent?"* (fail-closed) but **discarded** the binding's `toolAllowlist`/`requiredFeatures` —
`computeBoundRunScope` was built + unit-tested but had **no caller**. So a binding that named a tool subset,
or added a required feature, had **no runtime effect**.

**The contract built.** An optional `boundScope` on `ResolveAiAgentToolsInput` +
`RunAiAgentTextInput`/`RunAiAgentObjectInput`; `resolveAiAgentTools` intersects tools (the agent's list is the
base — **never widening**), enforces the feature **union** (`agent.requiredFeatures ∪ binding.requiredFeatures`,
`AgentPolicyError('agent_features_denied')` on a miss), and returns the **original** agent object when nothing
narrows (**humans byte-identical**); both routes compute `computeBoundRunScope({ agentId, binding })` after the
`bound` check and pass it into the runtime call.

**Hardening (TOTAL quality protocol).** A **separate-agent hostile critic** found **2 REAL defects, both
fixed**: (1) the **coverage gate was blind to in-process dispatch sites** (it scanned only `api/ai/**`) → it now
scans the **whole module** for dispatch *calls* (comments stripped) and names the one known un-gated site
(`lib/business-ir-author.ts`) as a **`CC-57`** gap; (2) the **"features UNIONED" test did not test the union** —
it stayed GREEN when the enforcement was deleted (satisfied instead by `checkAgentPolicy`) — rewritten to assert
the union. **6 RED-then-GREEN mutations**, every restore **md5-verified**; `tsc --noEmit` clean; **1374 tests
pass** (the 2 `isolated-vm` electron-ABI suites are flaky/environmental — they *passed* in the critic's run).
**ONE NUMBER, two routes: 72 / 321 = 22% — unchanged** (§L's 10th re-run).

**Honestly NOT built — named, scheduled:** the pending-action **confirm** path still does not re-check the
binding → **`CC-56`**; the in-process dispatch site (`lib/business-ir-author.ts`, no caller today) still
dispatches without a scope → **`CC-57`**.

---

### ✅ DONE — **row 22 (an AI user can run only the agents bound to it, `BUILD-ORDER` item 20): CORE BUILT (`CC-27`); the narrowing leg is now BUILT (`CC-55`, block above). ★ NEXT = `CC-44` (then `CC-56`, `CC-57`).** *(superseded by the `CC-55` block above)*
**(2026-10-11; code repo `workspace/starting-kit`.)**

**The task.** Row 22: *"An AI user can run only the agents bound to it."* Per rule 0b I **re-measured the
premise in code first**: the AI **actor** is an `api_keys` row whose credential issues an `ai_worker:<id>`
subject (`aiWorkerSubject`/`derivePrincipal`); the AI **agent** is **code-declared** (`ai-agents.generated.ts`)
resolved from an **in-memory `Map`** (`agent-registry.ts:16 agentsById`) with **zero DB reads**; and both
agent dispatch routes (`api/ai/run-object`, `api/ai/chat`) took the agent id as a **raw request-body string
with no binding check** — any authenticated caller could name any agent.

**The contract built (`PLAN-CC-27-agent-binding.md` §2, `B1`–`B6`).** (B1) the **binding table** —
`ai_agent_bindings`, keyed `(tenant, org, principal, agent)`, one live row per pair via two partial-unique
indexes, additive migration `Migration20261010180000_ai_agent_bindings.ts`. (B2) **fail-closed for an
`ai_worker`** — `resolveAgentBinding` returns `bound:false` on no-binding / no-tenant / empty id. (B3)
**narrowing-only** — `computeBoundRunScope` INTERSECTs tools and UNIONs features (a binding can never widen).
(B4) **no regression** — a **human** principal passes through untouched. (B5) the agent **definition stays
in code** (only the binding is DB). (B6) the **manage surface + a coverage gate** — `api/ai/agents/[agentId]/bindings`
(GET/POST/DELETE, `ai_assistant.settings.manage`, mutation-guarded) and `binding-coverage.test.ts`.

**Wiring.** Both routes call `resolveAgentBinding` **after** the policy gate and **before** the runtime call,
returning **403 `agent_not_bound`**. The owner ruled **ENFORCE · AI WORKERS ONLY** (the ONE question, §2.2).

**Hardening (TOTAL quality protocol).** A **separate-agent hostile critic** found **2 REAL defects, both
fixed:** (1) the coverage gate's marker list **omitted the real chat dispatcher `runAiAgentText`** — it named
`runAiAgentStream`/`runAiAgentChat`/`streamAiAgent`, **none of which exist** — so the gate would NOT have caught
the most likely new un-gated site; fixed to the runtime's **real** exports, **plus a new test that derives the
marker list from `agent-runtime.ts`'s own `export function runAiAgent*` surface** (drift now fails the build),
**proven** by adding a scratch `runAiAgentText` route (the gate goes RED). (2) the route tests' `requirePrincipal`
**mock ignored `keyId`**, diverging from the real `derivePrincipal`; fixed to resolve a machine id from `keyId`.
**9 RED-then-GREEN mutations** (resolver fail-open ×3, route 403 removal, narrowing widening, coverage
import/refusal, manage 403 gate, manage 400) each restore **md5-verified**; `tsc --noEmit` clean; **1364 tests
pass** across the package — only the **2 pre-existing `isolated-vm` electron-ABI suites** fail, **proven
pre-existing at HEAD** by stashing the work and re-running.

**Lesson banked (L116).** The mutation proof itself was **almost a false proof**: two manage-route mutations
read **GREEN** — not because the tests miss the line, but because the suite **never ran** (the path contained
`[agentId]`, which to jest's positional matcher is a **glob** that matches nothing; "no tests found" ≠ "all
tests passed"). The fix — assert the **test COUNT**, not merely the absence of failures — is the standing rule now.

**Honest scope (rule 13).** The row's **core** claim is enforced on the two dispatch routes. **Two legs are
NOT built and are NOT claimed:** the **narrowing leg** (`computeBoundRunScope` is built + unit-tested but
**nothing calls it** — the routes read only `binding.bound`, so a binding's `toolAllowlist`/`requiredFeatures`
have **no runtime effect** today) → **`CC-55`**; and the pending-action **confirm** path
(`api/ai/actions/[id]/confirm`) **executes a tool without re-checking the binding** (checked at dispatch;
a revocation between dispatch and confirm is not observed) → **`CC-56`**.

**THE ONE NUMBER (two routes).** **72 / 321 = 22%** — **unchanged**; row 22 is a **new LIST row** but has **no**
fresh appendix marker in §A–§K (derivation walks §A–§K only). **9th consecutive re-run**; both routes agree
(Route 1 regex · Route 2 char-scan). Recorded in `platform_points.md` §L.

---

### ✅ DONE / 🟡 (superseded by row 22) — **row 18 (the AI's read path goes through the SAME column- and row-level gates as a human, `BUILD-ORDER` item 19): BUILT (`CC-53`).**
**(2026-10-11; code repo `workspace/starting-kit`.)**

**The task.** Row 18: *"Wire the AI IR path to the new column- and row-level gates."* Per rule 0b I
**re-measured the premise in code first**: the AI record-returning tools (`packages/search/src/modules/search/ai-tools.ts`)
apply the **entity** gate (`authorizeEntityAccess`, `aclFeatures`, fail-closed) + tenant/org **scope**, and a
**search** `fieldPolicy` strip — but they apply **neither** the platform **classification** map
(`defaultEncryptionMaps`, the thing `CC-45` protects on the human export) **nor** the owner row-scope. So the
row's words were **not** met.

**Measured (rule 0b).** `search_get`/`search_query`/`search_aggregate` are the three record-returning tools of
the six; `grep` for `ownerField|rowScope|buildScopedWhere` across `packages/search/src` → **no matches**;
`grep` for `defaultEncryptionMaps|resolveExportEncryptedFields|applyEncryptedFieldMask` → **only the module's
own `encryption.ts` map declaration**, never a read. **No entity is both searchable and own-scoped** (only
`api_keys` declares `ownerField`, and it has **no** `search.ts`) → the owner clause has **no reader** on the AI
path → **not built, scheduled as the owner question `NY-22`** (rules 8/10d/11).

**The contract built.** (A1) **column mask** — `search_get` masks every field the platform **classification
map** names, using the **same** helper the human export uses (`resolveExportEncryptedFields` +
`isEncryptedExportField` + `MASKED_EXPORT_VALUE`), **recursing into nested object/array values**
(`maskValueDeep`), **fail-closed** on a throwing map (`maskAll` ⇒ mask everything); a disabled/absent service
⇒ **byte-identical**. (A2) — the reachable leak routes on the other two tools: `search_query` **drops the
index-time presenter** for a classified entity (an index-promoted arbitrary string field could otherwise leak
as `title`), and `search_aggregate` **refuses** a `groupBy` naming a classified field. (A3) no map ⇒
byte-identical, existing suites green. (A4) — the new suite proves the tools go through the mask.

**Hardening (TOTAL quality protocol).** **TWO separate-agent hostile-critic rounds**, each finding a REAL
hole: **round 1** — the `search_query` index-time presenter (`fallback-presenter.ts` `findAnyStringValue`)
can promote an arbitrary string field into `title`, and `search_aggregate` returns raw bucket values — both
could carry a classified field → **fixed** (drop presenter for classified entities; refuse a classified
`groupBy`). **round 2** — `maskClassifiedFields` checked **top-level keys only**, so a classified key
**nested in an object value** (`meta.secret`) leaked → **fixed** with `maskValueDeep` recursion. **6
RED-then-GREEN mutations** (disable the mask; wrong entityId → 2 RED; break the aggregate refusal; break the
presenter drop; disable recursion → the nested test RED), each restore **md5-verified** to
`8b9238b006ec1ea6eab76199d6365bc6`; final GREEN **12/12** in the new suite, **281/281** across the search
module (27 suites); `tsc --noEmit` clean (search). **A lesson banked (L103):** my own test was initially
**mock-defeated** — the wrong-entityId mutation stayed GREEN because the mock ignored its `entityId` argument;
fixed by making the mock **entity-aware**.

**THE ONE NUMBER (two routes).** **72 / 321 = 22%** — **unchanged**; row 18's new LIST box has **no** fresh
appendix marker in §A–§K. **8th consecutive re-run.** The two routes **disagreed on the way** — mine
`72/321`, a blind verifier's `74/331` (§K) — and the cause is worth banking: the verifier's section regex
`[A-K]` **never matches `## L.`**, so it counted the **verification ledger §L** as points; with §L excluded
both routes return **72 / 321** (recorded in `platform_points.md` §L).

---

### ✅ DONE / 🟡 (superseded by row 18) — **row 17 (permission coverage reaches EVERY table, `BUILD-ORDER` item 17): BUILT (`CC-52`).**
**(2026-10-11; code repo `workspace/starting-kit`.)**

**The task.** Row 17: *"Permission coverage reaches **every** table — a new table cannot be created un-gated."*
Per rule 0b I **re-measured the premise in code first** — and it did **not** survive literally: only **53 of
233** tables were covered (the searchable entities, `CC-46`) plus the **60 `makeCrudRoute`** list routes
(`CC-47`); the balance had **no per-table read-ACL check at all**. So the row's words over-state today's
reality; the honest job is to **make the words true mechanically**. **Owner chose Option A** (`NY-21`, rule 11):
build a coverage gate that forces **every** table to be either read-gated or on a **named allowlist**.

**Measured (rule 0b), the numbers the gate now pins.** **233** entity classes (tables) across module
`data/entities.ts` files; **53** searchable entities (a module `search.ts` entityId); the union of tables
reachable from a module's comment-stripped **`api/**/*.ts`** read surface = **47 surface modules**; **12**
search modules. The ~120 remaining tables are join tables, log/ledger tables, and internal bookkeeping read only
through a parent's route — they are legitimately **not** independently read-gated, so the gate names them.

**The contract built (Option A).** New gate
`packages/cli/src/lib/generators/__tests__/table-coverage.test.ts` (AST, `typescript-js`) enumerates every
`export class` across module `data/entities.ts` and requires each table to be **exactly one** of:
1. **searchable** — its entityId appears in a module `search.ts`;
2. **a read surface** — its class name is referenced by a **comment-stripped** `api/**/*.ts` file in its own
   module (so a live `GET` exists for it);
3. **`INTERNAL_TABLES`** — a **named allowlist** (~63 entries, each carrying a one-line **reason**).
It **pins the exact counts** (`EXPECTED_TABLES = 233`, `EXPECTED_SURFACE_MODULES = 47`,
`EXPECTED_SEARCH_MODULES = 12`) so a silent shrink fails the build, and runs **five assertions**: a sanity
check (exact counts), **A** (every table classified), **B** (no table both searchable *and* internal), **C** (no
stale internal entry — a listed name that no longer exists), **D** (every internal entry has a reason).

**The hostile critic (separate agent) found 3 REAL holes — all fixed.** (1) The read-surface predicate matched
a bare class name inside a **comment** (e.g. `communication_channels.ExternalMessage` "passed" from a comment
in a neighbouring file) — fixed with `stripComments()`. (2) The walker read **only `route.ts`**, so a live
`GET` in a sibling `api/*.ts` (e.g. `entities.CustomEntity` in `api/definitions.ts`) was invisible and the
table was **wrongly** marked internal — fixed by walking `api/**/*.ts`. (3) The sanity thresholds were loose
floors (`>200`), so a **39-table shrink passed silently** — fixed by **pinning exact counts**. My own first
`INTERNAL_TABLES` draft was also wrong (18 route-backed tables listed internal; 3 stale names; 4 joins
missing) — the gate's own assertions A/B/C caught every one.

**RED-then-GREEN (4 mutations, each md5-verified restore).** MUT1 (remove `auth.Session` from the union) →
1 failed; MUT2 (a stale internal name) → 2 failed; MUT3 (a searchable entity added to internal) → 1 failed;
MUT4 (break discovery) → 2 failed. All restored byte-identical to md5 `60c40f29c5f1bff438b29f564ea99460`.
**Final state GREEN 5/5; `tsc --noEmit` clean on `packages/cli`.**

**Two-route re-measure (§L, 7th re-run).** The ONE NUMBER is **72 / 321 = 22%, UNCHANGED** — row 17 is a
**coverage gate**, not a vision point; it **annotates** the already-`☑` §K `P10` line and adds **no new box**.
Route 1 (my derivation script) and Route 2 (a separate blind verifier agent, its own script) both returned
**72 / 321**.

**★ NEXT:** *(superseded — row 18 is now ✅, see the block at the top of this section; the live next is **`CC-27`**, then `CC-44`.)* ~~row 18 (`BUILD-ORDER` item 19 — *"the AI's read path goes through the **same** column- and
row-level gates as a human"*), re-measured in code first (rule 0b), built under the full protocol, documented
and committed in the same change. Rows 16 → 17 → 18 are all PHASE 5 (`Query / Command enforcement`).~~

---

### ✅ DONE / 🟡 — **row 16 (own / team row scope, `BUILD-ORDER` item 18): the OPT-IN OWN-LEG is BUILT (`CC-50` CLOSED); the row stays 🟡 because the team-leg is deliberately deferred (`CC-51`).**
**(2026-10-11; code repo `workspace/starting-kit`.)**

**The task.** Row 16: *"You can restrict a person to their own rows / their team's rows, not just their whole
tenant."* Per rule 0b I **re-measured the premise in code before building** — and it survived, unlike row 15's.
**Owner chose Option A** (`NY-20`): own-only, **opt-in per entity**, no team entity; Option B (a real `team`
entity) is documented as a FUTURE addition in `PLAN-ROW16-own-team-row-scope.md` §7.2 and scheduled as
**`CC-51`** with its trigger named.

**Measured (rule 0b).** Scope today is exactly **three** dimensions: `tenantId`, `organizationId`, and an
`organizationIds` allowlist (`shared/src/lib/api/crud.ts` `buildScopedWhere()`; applied in
`shared/src/lib/crud/factory.ts` `withCtx()`). The user id (`ctx.auth.sub`) is read **20+ times** in
`factory.ts` but **only to stamp audit/event records — never to filter rows**. There is **no `team`** concept,
and **no shared owner column** (the few entities that have one disagree in name and type:
`createdByUserId` uuid on `auth`/`customers`; `createdBy` varchar on `business_rules`/`workflows`). **So a
blanket "filter every table by owner" is impossible — row 16 must be an opt-in, per-entity declaration.**

**The contract actually built (Option A) — note the rule-13 correction.** The declaration lives on
**`OrmEntityConfig`** (`ownerField?` / `ownerFeature?`), **not** in the search registry: the search registry
exists only for the **11 searchable modules**, while row scope must apply to **every CRUD entity** — and the
first entity wired (`api_keys`) has **no `search.ts` at all**, so the original placement was **unusable for
the very entity that proves the mechanism**. The mechanism:
1. **A new opt-in declaration** — `orm: { ownerField: 'createdBy', ownerFeature: 'api_keys.view' }`. Both must
   be present together (a static AST coverage test enforces it over every `route.ts`).
2. **A new role-level `.own` feature-grant modifier** — a role granted `api_keys.view.own` is own-scoped;
   `featureMatch.ts` gained `isOwnScoped`/`stripOwnScope`/`hasOwnScopeGrant`, and **`matchFeature` is
   byte-unchanged** (proven), so a `.own` grant still satisfies the plain feature.
3. **Resolution in one place** — `withCtx()` resolves `rowScope` once (fail-safe `null` on any error) with a
   **dual super-admin carve-out** (`auth.isSuperAdmin` **or** `acl.isSuperAdmin`), and the **three**
   `buildScopedWhere` call sites (list/update/delete) pass the owner clause through.

**First real caller: `api_keys`.** Rows are already stamped `createdBy: ctx.auth?.sub ?? null` on create; the
route now opts in. **Hostile-critic round 1 found a REAL list leak** — the `GET` `beforeList` builds its own
query and short-circuits via `throw json(...)`, so it **never reached `buildScopedWhere`** and an own-only role
would still list every key in its org; **fixed** by adding the owner clause inside `beforeList`, with a GET
test, RED-then-GREEN md5-verified. **Hostile-critic round 2 found a SECOND REAL defect** — the super-admin
carve-out checked **only** `acl.isSuperAdmin` while the platform has a **second** notion (`auth.isSuperAdmin`,
set by `applySuperAdminScope` / for API-key principals); when they disagreed a super-admin was own-restricted
on GET; **fixed** to check both, with the new test, RED-then-GREEN md5-verified. (My own new test also caught
a bug in my own `hasOwnScopeGrant` — the first version returned **true for a plain grant**, which would have
own-restricted a role merely granted the feature; fixed to require `isOwnScoped`.)

**Green gate (all re-run after every fix).** shared **207 suites / 2561 tests**; core auth **88/793**;
`api_keys` **55/55**; both new coverage tests pass; `tsc --noEmit` clean on shared + core. **Two-route
re-measure (§L):** the ONE NUMBER is **72 / 321 = 22%, UNCHANGED** — row 16 is a 🟡 partial, so closing
`CC-50` (a callout row, not a box) moves nothing. Diff-vs-`-w` equality: all CLEAN (no formatter reflow).

**★ NEXT:** *(superseded — row 17 is now ✅, see the block above; the live next is **row 18**.)*

---

### ✅ DONE — **`CC-47` (row 15 / `P10`): the human CRUD `GET`/list read gate is now structurally enforced by a test, and the register's premise ("the human CRUD list path has NO per-entity permission filter") was FALSIFIED in code. Row 15 is now ✅.**
**(2026-10-10; code repo `workspace/starting-kit`. Owner chose Option A via `NY-19`.)**

**The task (protocol step 3), from register `CC-47` + `PLAN-CC-47-human-crud-read-gate.md`:** row 15 (`P10`)
claims *"every read is filtered by permission at the data layer"*. Its ACL-coverage half was closed by `CC-46`
(2026-10-10). Its remaining leg (`CC-47`) was described as *"the ordinary human CRUD `GET`/list path has **NO**
per-entity permission filter."* The job was **re-measure first (rule 0b)**, then either build a structural gate
or narrow the row's wording — the owner's choice (rule 11).

**Step 4 — prerequisites re-measured in code (rule 0b), and it FALSIFIED the register's premise (rule 13).**
- The route's own `metadata.GET.requireFeatures` **IS** enforced for the whole list request: the dispatcher
  (`apps/mercato/src/app/api/[...slug]/route.ts`) loads the route module's `metadata` (`:367`), extracts the
  method entry via `extractMethodMetadata` (`:377`), and calls `checkAuthorization(...)` (`:378`) — which
  normalises `requireFeatures` (`:116-118`), resolves `rbac.userHasAllFeatures(...)`, and returns **403
  Forbidden** (`:207-251`) before the handler runs. `makeCrudRoute` passes the route's own `metadata` through
  (`packages/shared/src/lib/crud/factory.ts:173-186`, returned `:3148`).
- **Measured: 61 of 66** real CRUD routes declare a GET `requireFeatures`; the 5 exceptions are custom POST
  action routes or the two handler-gated list routes (`sales/api/notes`, `sales/api/document-addresses`).
  **No un-gated list endpoint was found.** So *the filter exists*; what was genuinely missing was **a test that
  stops a NEW list route being added without one**.

**Owner decision (rule 11):** `NY-19` = **Option A** — build the structural coverage test. Recorded in
`NEEDS-YOU.md`.

**Step 6 — built `packages/cli/src/lib/generators/__tests__/crud-read-gate-coverage.test.ts`** (9 tests GREEN;
`tsc --noEmit` exit 0). Two **independent** AST assertions: **(A)** every `makeCrudRoute` route declares a GET
read gate or is handler-gated; **(B)** every GET-exporting route's exported `metadata` is **demonstrably** gated
(`requireFeatures`, or `requireAuth: true`) or is a knowing public opt-out on the pinned `PUBLIC_ROUTES` list,
**else it is FLAGGED** unless a human pinned it on `HANDLER_GATED_ROUTES` (2) / `DELEGATED_GATED_ROUTES` (31).

**Why the design is fail-closed, and the twelve critic passes.** Earlier versions of B tried to *prove a
negative* by pattern-matching TypeScript; a hostile critic (separate agent) defeated each in turn — a
comment/string token; `requireAuth: false`; a computed `['GET']`; a stray `resource:`; `as const`; a spread;
`requireFeatures: []`; `['']`; an unresolved identifier; a non-literal `GET:` decoy; `let`+reassign; duplicate
keys; `Object.assign`; an in-place array mutation. Each is now a **RED-then-GREEN self-check fixture** with an
**md5-verified restore**. **Pass 12 found a DISCOVERY gap** (not a detector gap): `exportsGet` only matched
identifier-named `GET` bindings, so the canonical **destructured** `export const { GET, … } = builder(…)` form
was invisible to B — **fixed**; the 6 newly-surfaced routes are pinned with verified evidence; the pinned count
was corrected **287 → 296**. **Pass 13 found NO LIVE HOLE.**

**Two-route re-measure (rule 2) — agrees.** 457 route files (bash `find` = walker); 60 `makeCrudRoute`
(bash grep's 66 includes 6 comment-only mentions); 296 GET-exporting (the pre-fix 287 missed the destructured
family); verdict tally **216 `gated` / 40 `gated-auth-true` / 9 `public-explicit` (== `PUBLIC_ROUTES`) / 31
`not-demonstrably-gated` (== `DELEGATED_GATED_ROUTES`)**.

**Honest bound (written into the test header, not hidden).** A's family is the `makeCrudRoute` routes (60); B's
family is routes that export a `GET` (296); their union is **not** the whole tree — **161** route files are in
neither, and every one is a mutation endpoint (POST/PUT/PATCH/DELETE) — **zero export a `GET`**, not human
list reads. *(Rule-13 correction, 2026-10-10: this read "163 … overwhelmingly action/mutation endpoints" — a
stale pre-fix count; the destructured-export fix lifted B 287→296 and the true "in neither" is 161, now
measured three ways.)* CC-47 is scoped to the human CRUD **list** path, so this is intended — but the
guarantee is *the human CRUD list family*, not *every route that exports a GET*.

**Pre-existing, unrelated failure noted (not CC-47's).** `packages/cli/src/lib/generators/__tests__/openapi.test.ts`
fails **3 tests** ("does not cache a static fallback after a bundle failure"); reproduced with the CC-47 test
file **removed** and in isolation — proven unrelated, not folded in. Full generators suite: **20/21 suites,
812/815 tests** before the CC-47 suite was added.

**Rule 13 correction applied everywhere the falsified premise was copied:** `COMPLETION-CALLBACKS.md` (CC-47
row → ✅ DONE), `BACKLOG.md` (FRONTIER + row-15 description), `platform_points.md` (row 15 🟡 → ✅ + `P10`
bullets), `START-PROMPT.md` (the FRONTIER line), and this block. **Row 15 flips 🟡 → ✅.**

---

### ✅ DONE — **`CC-49` (row 14 / `P4` classification leg, customer-tasks half): the customer-tasks export now goes THROUGH THE SERVER with an ADDITIVE alias map, so a marked field aliased to `todoTitle`/`todoDescription` is masked. Row 14 is now ✅.**
**(2026-10-10; code repo `workspace/starting-kit`.)**

**The task (protocol step 3), from register `CC-49` + `PLAN-CC-49-tasks-alias-export-leak.md`:** `CC-45`
masked every **server** export and `CC-48` closed the custom-entity **client `view`** export, but the
**customer-tasks** table (`CustomerTodosTable.tsx`) still built its file in the browser — and, worse, its rows
reached the browser **already aliased**: `todoTitle: interaction.title`, `todoDescription: interaction.body`,
`customer.displayName` (verified at `todoCompatibility.ts:603,610`). The mask keys on the **true** field name
(`title` → canonical `title`), so it **never matched the alias** (`todoTitle` → canonical `todotitle`), and the
decrypted secret was exported **in clear**. `CC-49`'s job: close that third and last export leg of row 14.

**Owner decision (rule 11):** `NY-18` = **Option B** — reroute the tasks export through the server and teach
the shared mask the alias map (**additive**), mirroring the `CC-48` pattern. Recorded in `NEEDS-YOU.md`.

**Step 4 — prerequisites re-measured in code (rule 0b), and it corrected my own premise (rule 13).**
- The two marked entities are `customers:customer_interaction` (`title`, `body`) and `customers:customer_entity`
  (`display_name`) — read live in `customers/encryption.ts:22,48`, **not** the `customer_todo` name the file
  suggests (the `L102` trap).
- **Correction (rule 13):** I first asserted `displayName` was **un**masked. **Measured: it was already
  masked** — `displayName` canonicalizes to `displayname`, which **equals** `display_name` (the canonical form
  strips the underscore and lowercases). So the only **genuine** leak was `todoTitle`/`todoDescription`; the
  test was corrected to record the measured truth, not my first guess.

**Step 5–6 — the build.**
- **`shared/src/lib/crud/export-encryption.ts`:** added an **additive** `ExportFieldAliasMap` and an
  `aliasTrueNames` resolver; `isEncryptedExportField` and `applyEncryptedFieldMask` now also consult the alias
  map when one is supplied. **Absent ⇒ byte-identical** (existing callers unchanged).
- **`customers/api/interactions/tasks/route.ts`:** a **server export mode** — when `format` is present the
  route derives columns (from an `exportColumns` hint **or** `deriveScalarColumns`), **flattens** each row to
  the exact column fields via `readValueAtPath`, resolves the marked fields for **both** entity ids via
  `Promise.all` and **unions** them (`maskAll`/`some`), then `applyEncryptedFieldMask(preparedRaw, resolved,
  TASKS_EXPORT_ALIASES)` → `serializeExport` → a download `Response`. The JSON branch is **unchanged**.
- **`customers/components/CustomerTodosTable.tsx`:** both export sections moved from a browser `prepare` to a
  server **`getUrl`** (`buildTasksExportUrl`), sending `format`/`exportColumns`; the now-dead browser helpers
  (`readValueAtPath`, `buildPreparedExport`, the `PreparedExport` import) were removed.

**The hostile critic (a SEPARATE agent) found three REAL defects — all in the first draft, all fixed.**
- **(H1, CRITICAL) The wrong entity id ⇒ the mask was a silent no-op in production.** The first draft passed
  `CUSTOMER_INTERACTION_TODO_ADAPTER_SOURCE` = `'adapter:todo'` (a row **source tag**) as the entityId, so
  `getEncryptedFieldNames` matched **zero** rows. **FIXED:** pass `CUSTOMER_INTERACTION_ENTITY_ID`
  (`'customers:customer_interaction'`) **and** union the marked fields of `customers:customer_entity` (the
  nested `display_name` column draws on a second entity).
- **(H2) A flat `format` export leaked the whole record in clear.** `serializeCsv` reads `row[col.field]`
  (flat), so the nested `customer.displayName` column resolved to `undefined` — and **with no projection**,
  `ensureColumns` derived a `customer` **object** column that serialized the entire record, leaking
  `Secret Customer Name` **in clear**. **FIXED:** flatten every row to the exact column fields via
  `readValueAtPath`, and derive un-projected columns from **scalar** keys only (`deriveScalarColumns`).
- **(H3) The static guard was bypassable.** A computed `['pre'+'pare']` plus a hand-built `new Blob` /
  `createObjectURL` download slipped past the string-match guard. **FIXED:** the guard now also rejects
  computed/concatenated `prepare` spellings and any hand-assembled download.

**And the test could not fail (the `L103` trap).** The first route test mocked the encryption service
**entity-agnostically**, so it passed no matter which id the route asked for — the *exact* bug (H1) it existed
to catch. **FIXED:** the mock is now **entity-aware** and asserts the route queried **both** real ids and never
`'adapter:todo'`.

**Evidence (rule 10 step 6).** 20 tests / 3 suites — **9 route** (entity-aware mock, `markCalls`), **6 static
guard** (no `serializeExport`, no `prepare:`, no `Blob`/`createObjectURL`, both sections `getUrl`), **5 shared
alias** (21/21 in the shared suite). **4 RED-then-GREEN mutations** — (1) wrong entity id → **4 RED**; (2) alias
map off → **2 RED**; (3) the critic's `['pre'+'pare']`+`Blob` bypass → **3 RED**; (4) shared alias loop off →
**2 RED** — each restore **md5-verified**. Green gate **core 5635/5635**, **shared 2555/2555**, **customers
module 6883 pass** (1 pre-existing unrelated fail). `tsc --noEmit` exit **0** on core and shared; a temp
parked-scope typecheck proved **0 new errors** in the changed files (the `customers` module is **parked** —
excluded from `tsconfig`/jest — so the normal gates do not cover it; I used temp configs, deleted before
finishing). **Two-route re-measure:** THE ONE NUMBER re-derived **unchanged at `72 / 321 = 22%`**.
**Row 14 🟡 → ✅** — server (`CC-45`), custom-entity client (`CC-48`) and customer-tasks alias (`CC-49`) legs
are all closed.

**★ NEXT:** `CC-47` (row 15's human CRUD read leg) — the **sole** remaining FRONTIER item.

---

### ✅ DONE — **`CC-48` (row 14 / `P4` classification leg, custom-entity CLIENT half): the records-page "View → Export" now goes THROUGH THE SERVER, so the `CC-45` mask applies.**
**(2026-10-10; code repo `workspace/starting-kit`.)**

**The task (protocol step 3), from register `CC-48` + `PLAN-CC-48-client-view-export-leak.md`:** `CC-45`
masked every **server** export, but the custom-entity records page built its **"View → Export"** file in the
**browser** (`records/page.tsx` had a `view: { prepare: … }` that read the rows on screen and called
`serializeExport`), so no server mask reached it and a marked field downloaded **in clear**.

**Owner decision (rule 11):** `NY-17` = **Option B** — reroute the browser export through the server. (`NY-16`
= keep blanking the value; no code change.) Both recorded in `NEEDS-YOU.md`.

**Step 4 — prerequisites re-measured in code (rule 0b), and it corrected my own scope twice.**
- The server endpoint **already** serves a `view`-shaped export and **already** applies the mask
  (`records.ts:391` picks `viewPageItems` vs `fullPageItems`; `:416-430` masks *after* the branch — I read it
  live). So Option B is a **reroute**, not new masking.
- **Correction #1 (rule 13):** I first wrote that `CustomerTodosTable.tsx` "cannot leak" because *no entity
  named `customer_todo` is marked*. **Wrong entity.** The tasks table reads **`customer_interaction`**, which
  **is** marked — see the critic finding below.
- **Correction #2:** the projection param must not be named `columns` — it would enter the endpoint's
  reserved-key skip list and silently drop a custom entity's own `columns` **filter** field.

**Step 5–6 — the build.**
- **`records/page.tsx`:** the `view` section's `prepare` → **`getUrl`** (`buildViewExportUrl`), carrying the
  current `search`/`searchFields`/`sort` and the visible columns as **`exportColumns`**.
- **`records.ts`:** accepts optional **`exportColumns`** → `ensureColumns(rows, hint)`, so the server export
  still honours the operator's visible columns. Absent ⇒ auto-derived columns ⇒ **existing callers unchanged**.
- **Why it is clean:** the serializer emits **only listed columns** (I verified all four serializers iterate
  `prepared.columns`), and the mask keys on the column's field name — so a projected-out secret is not
  emitted, and a projected-in secret is masked. **Leak-safe by construction.**

**The hostile critic (a SEPARATE agent) found three things — two fixed here, one split out.**
- **(D1) The first static guard was too narrow.** The critic inserted a **fully functional** browser `prepare`
  leak into a *sibling* export section (it contained no literal `serializeExport`) and the guard **passed
  4/4**. **FIXED:** the guard now asserts the page contains **no `prepare:` at all** and that **both** sections
  use `getUrl` — and I **re-ran the critic's exact attack** to prove the new guard goes RED.
- **(D2) The `columns` name collided** with a custom entity's own `columns` filter field. **FIXED:** renamed
  to **`exportColumns`**; verified no collision.
- **(D3) `CustomerTodosTable` genuinely leaks — a DIFFERENT root cause.** The task rows **alias** the marked
  fields: `todoTitle: interaction.title`, `todoDescription: interaction.body`, `customer.displayName`
  (`todoCompatibility.ts:603,610,154`); `customer_interaction` (`title`,`body`) and `customer_entity`
  (`display_name`) **are** marked; `listCanonicalTodoRows` reads them **decrypted**. The mask keys on the
  **true** field name (`title`), so it **never matches the alias** (`todoTitle` → canonical `todotitle`).
  **SPLIT OUT as `CC-49`** — a distinct defect needing its own fix (recommend: add a server export mode to
  the tasks route that masks the aliased fields). **Reproduced independently** by me *and* a separate
  verifier agent (both confirmed all five links).

**Evidence (rule 10 step 6).** 12 tests / 2 suites (7 behavioural + 5 static guard); **3 RED-then-GREEN
mutations** — mask off → 3 RED; column hint ignored → 2 RED; page reverted to `prepare` → 1 RED — each
restore **md5-verified**; green gate **417 tests / 49 suites** (core entities) and **556 / 48** (shared,
untouched — no regression); `tsc --noEmit` exit 0 on **both** packages. **Two-route re-measure:** THE ONE
NUMBER re-derived by my script **and** a separate blind verifier's own script — **both returned
72 / 321 = 22%, UNCHANGED** (`CC-48` closed a callback; the verifier also confirmed the appendix structure
and the traps). **Row 14 stays 🟡** — the tasks leak (`CC-49`) remains.

**★ NEXT (as of `CC-48`):** `CC-47` (row 15's human CRUD read leg) · `CC-49` (the customer-tasks export leak).
*(Both since resolved: `CC-49` is ✅ above; `CC-47` is the sole remaining FRONTIER item.)*

---

### ✅ DONE — **`CC-45` (row 14 / `P4` classification leg, SERVER half): every CRUD export path now consults the encryption map and MASKs a marked field.**
**(2026-10-10; code repo `workspace/starting-kit`.)**

**The task (protocol step 3), from `platform_points.md` row 14 + register `CC-45`:** the row's *"never exported
by accident"* leg. The marking half and the encrypt-at-rest/decrypt-on-read half were already built and
measured; what was absent is that **no export path consulted the map**, so `shared/src/lib/crud/exporters.ts`
would serialize a marked field **in clear**.

**Step 4 — the prerequisites, re-measured in code (rule 0b), falsified part of the row's own scope.**
Enumerated every production `serializeExport(` caller. The row named three leaking callers; measured, only
**two** could leak: `audit_logs/.../export/route.ts` serializes audit **metadata** (`when/user/action/field/
oldValue/newValue/source` — no entity data row, no `entityId` to resolve a map against) and
`entities/lib/entitiesCsvExport.ts` serializes the entity **metadata listing** (`entityId/label/source/count`
— never a data row). The real surface is the **generic factory list/export** (`factory.ts` — the query-engine
branch *and* the ORM-fallback branch) plus `entities/api/records.ts` for custom entities. *(Rule 13: the row
was corrected in place.)*

**Step 5–6 — the build.**
- **New module `shared/src/lib/crud/export-encryption.ts`** — `resolveExportEncryptedFields` +
  `applyEncryptedFieldMask`, copying the codebase's own precedent (`shared/src/lib/query/encrypted-sort.ts`):
  the encryption service is required **structurally** (`getEncryptedFieldNames?`, `isEnabled?`), the container
  key is the existing **`tenantEncryptionService`** (the same key the query engine already resolves), and the
  **fail-safe** is explicit: absent/disabled service or no `entityId` ⇒ empty set ⇒ **byte-identical export**;
  a map read that **throws** ⇒ mask everything (fail-closed).
- **Chosen fix point (rule 9b, challenged then chosen):** `maskPreparedExportForEntity` at the single funnel
  both factory branches share — one edit covers both, no type change, `serializeExport` stays pure. This is
  *cleaner* than the two options the row named (per-site filtering, or threading a new field through
  `PreparedExport`).
- **Semantics: MASK (`***`), not omit** — keeps the column/header stable for spreadsheet consumers; the
  owner may still override (rule 11; flagged in `PLAN-CC-45-*.md` §5, not closed by me).

**The hostile critic (a SEPARATE agent) found two real defects — this is why the pass is mandatory.**
- **(D2) SILENT MISS on header spellings.** `sanitizeFieldName` preserves `-` and case, so a `csv.headers`
  entry of `Api Secret` / `api-secret` / `API_SECRET` produced an export column my raw/snake/camel candidate
  set never matched — the secret shipped raw while the mask reported success. **FIXED** by matching on a
  **canonical form** (lowercase, alphanumerics only — which subsumes snake/camel/kebab/space/case) + regression
  tests (incl. the `SSN` vs `ssn` case). The critic's `SSN` probe is what revealed the clean fix.
- **(D1) THE CLIENT-SIDE `view` EXPORT LEAKS.** `ui/src/backend/DataTable.tsx:768` calls `serializeExport`
  with **no** mask, and its caller `entities/.../records/page.tsx` builds rows from data **already in the
  browser** — no server mask can reach it. **My first judgement ("client = out of scope") was wrong**: the
  row's claim is *"never exported by accident"*, and this **is** an export. Confirmed **nothing hides marked
  columns from entity grids**, so the field is an ordinary visible column. **SPLIT OUT as `CC-48`** — the fix
  is a real design choice (mask in the browser ⇒ the client learns which fields are secret; or reroute the
  `view` export through the server; or hide marked columns entirely) and **that choice is the owner's**.

**Evidence (rule 10 step 6).** 27 tests across 2 new suites; **3 RED-then-GREEN mutations** — (1) mask
disabled, (2) map never consulted, (3) canonical match reverted — **7 / 6 / 7 tests RED respectively**, each
restore **md5-verified**; green gate **556 tests / 48 suites** (shared: crud + query + encryption) and
**405 tests / 47 suites** (core entities); `tsc --noEmit` exit 0 on **both** packages. **Two-route
re-measure:** the ONE NUMBER was re-derived by my script **and** a separate blind verifier agent's own
script — **both returned 72 / 321 = 22%, UNCHANGED** (both first passes erred on a line class and were
corrected: mine skipped §G's two `- ✅` lines, the verifier's counted the `-     *(was …)*` annotations).
**Row 14 ✅ → 🟡** — its absolute claim is not met until `CC-48` closes the client path.

**★ NEXT:** `CC-47` (row 15's human CRUD read leg) · `CC-48` (the client `view` export) — both now in the
FRONTIER `NOW` slot.

---
**(2026-10-10; code repo `workspace/starting-kit` commit `c03eca5c`.)**

**The task (protocol step 3), from `platform_points.md` row 15 + register `CC-46`:** the read layer's only
*per-entity permission* gate before this change was the **AI search tools** (`packages/search/src/modules/search/
ai-tools.ts` `authorizeEntityAccess`), which resolves an entity's declared **`aclFeatures`** and **fails closed**
when the entity declares none. But only **6 of 53** searchable entities declared it (all in `customers`), so 47
entities were safe-but-unusable through the tools, and — worse — a new searchable entity could be added with no
gate at all. `CC-46`'s job: make the declaration **universal** and the omission **impossible** (`BUILD-ORDER.md`
item 17: *"so a new table cannot be added un-gated"*).

**What was built.** (a) **47 `aclFeatures` declarations added** across 10 `search.ts` files (checkout 2, catalog 8,
customer_accounts 2, inbox_ops 1, messages 1, planner 1, resources 2, sales 22, staff 4, wms 4) — purely additive
(`47 insertions(+), 0 deletions`); the 6 `customers` entities already declared it and were **not** doubled. Each
value names an **existing** feature in the owning module's `acl.ts` — the coarse module read feature where that is
the correct gate (`messages.view`, `planner.view`, `wms.view`, `checkout.view`, `customer_accounts.view`,
`resources.view`, `staff.view`, `inbox_ops.proposals.view`), and the specific one where the module distinguishes
(`catalog`: 7×`products.view` + 1×`categories.view`; `sales`: 16×`orders.view` + 3×`quotes.view` + 2×`settings.view`
+ 1×`channels.view`). (b) **A coverage gate** — new test `packages/cli/src/lib/generators/__tests__/
search-acl-coverage.test.ts` walks every `searchConfig.entities` and asserts (i) each declares a non-empty
`aclFeatures`, (ii) each **own-module** feature id exists in that module's `acl.ts`, plus a sanity assertion that
guards against a vacuous pass (it must find > 40 entities).

**Fact-check before building (step 4) — and a count corrected.** The register said "extend to every searchable
entity"; measuring the code first found two things: (1) every searchable module **does** declare at least one own
`.view` feature, so no feature had to be invented (though I first mis-measured this with a two-segment-only grep and
corrected it in the same pass — rule 13 applies to the challenger too); and (2) the widely-quoted **"67" is wrong —
there are 53** searchable entities. The 67 figure counted textual `entityId:` occurrences; **14 of them are in
helper code** inside `customers/search.ts` (`CUSTOMER_CUSTOM_FIELD_SOURCES`, local `const entityId`, profile
resolution), not in the `entities` array. True count: **53 entities** (customers 6, sales 22, catalog 8, staff 4,
wms 4, checkout 2, customer_accounts 2, resources 2, inbox_ops 1, messages 1, planner 1).

**Verification.** Search suite **26 suites / 269 tests green** (the AI tools are unaffected). `tsc --noEmit` clean
in `core`, `cli`, `checkout`. The gate was proven **RED** (it names the exact un-gated entity) **then GREEN** with an
**md5-identical** restore, for **both** assertions. A **separate-agent hostile-critic** attacked all seven claims
and **CONFIRMED** each — its one catch (that my sales/catalog mapping was coarser than described) was applied as a
refinement: sales now uses `quotes.view`/`channels.view`/`settings.view` where those apply, catalog uses
`categories.view` for the category entity.

**Doc correction (rule 13).** Every "6 of 67 tables" in `platform_points.md`, `BACKLOG.md`, `BUILD-ORDER.md`,
`COMPLETION-CALLBACKS.md` and this journal is corrected to **"6 of 53 entities"**; the sentence that had called the
"67" figure *substantially correct* is corrected to say it named the right **gap** by the wrong **measure**.

**Status:** ✅ **`CC-46` CLOSED** — deleted from the register; `P10b` (**a real UI + full ACL-feature coverage**)
flipped **☐ → ☑** (§B), so the counts move **72 → 73** under the *then-current* headline. **CORRECTED 2026-10-10 (rule 13):** the headline itself had drifted (it was typed `73 / 330`); re-derived from the boxes the true figures are **`72 / 321`** — `P10b` still flipped ☐ → ☑ (`B` 4/38 → 5/38), but the §K and §H section figures were stale. See `platform_points.md` §L. **Row 15 (`P10`) STAYS 🟡** — its
**absolute** claim ("EVERY read") also needs a gate on the **human CRUD list path**, which is untouched; that last
leg is now **`CC-47`**.

---

### 🟡 RE-MEASURED — **Phase 5, row 15 (`P10`): the read axis IS scoped and HAS two real permission read gates, but the row's absolute claim ("EVERY read is filtered by permission at the data layer") is NOT yet true — so row 15 stays 🟡 with its remainder named and scheduled (`CC-46`).**
**(2026-10-10; docs repo — no code changed this turn; measured against code `53ed2e7b`.)**

**The task (protocol step 3), from `platform_points.md` row 15:** *"Every read is filtered by permission at
the **data layer** — not by hiding a button."* The row was **🟡**, so the job was **re-measure first** (rule
0b), **not build** — as the FRONTIER box instructs.

**The re-measure (step 4, against the code). What the read layer ACTUALLY does — three distinct things, only
one of which is *permission*:**
- **Tenant/org row SCOPE (not permission) — universal.** `buildScopedWhere` (`shared/src/lib/api/crud.ts:5`)
  injects `tenantId` + `organizationId` into every CRUD list/read `where` (`factory.ts:1988/2659/3002`), and
  `omitAutomaticTenantOrgScope` is an **explicit opt-out** whose own doc says the caller's `buildFilters`
  "MUST fully encode row visibility … and MUST fail closed". So **every read is tenant/org-scoped** — but
  this answers *"which rows are in my tenant?"*, **not** *"may this actor read this row?"*.
- **A permission read gate — but ONLY on the AI search tools.** `packages/search/src/modules/search/ai-tools.ts`
  gates the data-returning tools `search_get`/`search_aggregate` through `authorizeEntityAccess` (`:80`):
  it resolves the entity's declared **`aclFeatures`** and, when the caller lacks them (or the entity declares
  none), **fails closed**; `stripSensitiveFields` (`:114`) additionally drops `hashOnly`/`excluded` PII. This
  is a genuine data-layer permission read gate — and it is the **only generic one**.
- **A per-record permission read gate — in ONE module.** `communication_channels/lib/access-control.ts`
  (`assertCanAccessChannel`, `:36`) enforces **owner-only** personal mailboxes on the read routes, backed by
  SQL narrowing (`user_id IS NULL` for the admin list, `user_id = currentUser.id` for the profile list) — 4
  call sites. Real, but local to that module.

**The honest gap (this is the 🟡).** The **ordinary human read path** — a CRUD `GET`/list — has **NO
per-entity permission filter**: `factory.ts` reads `requireFeatures` only as a *route metadata* concept
(`:170`, enforced by the dispatcher for the route, not per row/entity), and `aclFeatures` is read **nowhere**
outside `ai-tools.ts` (measured: the only other consumer is a CLI fact generator). And the `aclFeatures`
coverage is **thin**: **53 searchable entities exist; only 6 declare `aclFeatures` — all 6 in ONE module
(`customers`)**; the other 10 modules with a `search.ts` (`catalog`, `sales`, `staff`, `checkout`,
`customer_accounts`, `inbox_ops`, `messages`, `planner`, `resources`, `wms`) declare **none**, so their
entities are **denied** by the fails-closed AI gate (safe, but unusable). This is exactly
`BUILD-ORDER.md` item **17**: *"extend `aclFeatures` from 6 of 53 tables to all tables, with an aggregate
rule so a new table cannot be added un-gated."*

**So the row's three sub-claims, measured:**
| Sub-claim | Measured |
|---|---|
| reads are scoped (tenant/org) at the data layer | ✅ **true, universal** (`buildScopedWhere`) |
| reads are *permission*-filtered at the data layer | ✅ **true** — the human CRUD list path IS permission-gated: `makeCrudRoute` routes declare `metadata.GET.requireFeatures` and the dispatcher enforces it with **403** (`checkAuthorization`); plus the AI-search tools (6/53 entity configs). **CORRECTED (rule 13, 2026-10-10):** the earlier entry here read "🟡 true only for the AI search tools + one channel module" — that was WRONG; it missed the route-metadata gate entirely. |
| "**EVERY** read" | 🟡 **still not literally true** — the gate is a **route-level** `requireFeatures` check, not a **row/entity-level** filter inside the query; and the remaining ~61 search configs are un-gated (fail closed). **CORRECTED (rule 13):** the earlier wording ("the human CRUD list path has no per-entity permission filter") was FALSE — the gate exists and is enforced. What was genuinely missing was a **structural guarantee** that a new list route cannot be added un-gated. |

**Correction (rule 13, 2026-10-10) — the premise above was falsified in code.** `CC-47` step 4 measured that
the human CRUD `GET`/list path **is** permission-gated: `makeCrudRoute` passes the route's own `metadata`
through (`factory.ts:173-186`, returned `:3148`), and the dispatcher's `checkAuthorization`
(`apps/mercato/src/app/api/[...slug]/route.ts:150-254`) reads `methodMetadata.requireFeatures` and returns
**403** when the caller lacks the feature. **61 of 66** real CRUD routes declare a GET gate; the 5 exceptions
are custom POST action routes or the two handler-gated list routes. The genuine gap was **not the gate** but
the absence of a structural test — the exact analogue of `search-acl-coverage.test.ts` (`CC-46`). That test is
now built: `packages/cli/…/__tests__/crud-read-gate-coverage.test.ts`.

**Why the row flipped 🟡 → ✅ (2026-10-10, `CC-47`).** With both halves met — the ACL-coverage half
(`CC-46`: all 53 searchable entities + a coverage gate) and the human-CRUD-list half (`CC-47`: the human CRUD
`GET`/list path IS gated by `metadata.GET.requireFeatures`, enforced 403 by the dispatcher, now structurally
guaranteed by a test) — the row's absolute claim is met on both surfaces it names. The earlier "STAYS 🟡"
reasoning below is superseded: its premise ("the human CRUD list path is gated by scope only") was **falsified
in code** (rule 13).

**Corrected (superseded) reasoning — kept for the record.** *"The row's wording is absolute ('every read …
not by hiding a button'), and the measured mechanism does not meet it"* was written when we believed the human
list path had no permission filter. **Measured 2026-10-10: it does** (route-metadata `requireFeatures`, enforced
403). The remainder was scheduled as `CC-46` (search coverage) and `CC-47` (the human-path structural test) —
**both now closed**.

**Corrections the re-measure produced (rule 13).**
1. `platform_points.md` §B `P10` was described as **"Search / indexing — full-text + vector ▸ 0/2"** with
   `P10a` "a strong search engine (carried)" and `P10b` "a real UI + full ACL-feature coverage". Measured:
   the engine **is real** (`packages/search`, strategies `tokens`/`vector`/`fulltext`, an indexer, workers,
   embeddings, a global-search route + UI; suite **26/269 green**) — so row 15's blocker is **not** the
   engine and **not** the UI; it is the **ACL-feature coverage**. The `P10` id is doing **double duty** in
   the doc (row 15's *read gate* vs §B's *search module*); the record now names them distinctly.
2. `P10b`'s parenthetical "`aclFeatures` covers 6 of 67 tables" pointed at the right gap but by a **different
   measure**: the true count is **53 searchable entities**, of which **6** declared `aclFeatures` (all in
   `customers`). The "67" figure counted textual `entityId:` occurrences — 14 of them are in helper code inside
   `customers/search.ts`, not entity configs. Corrected below (rule 13); the *gap* it named was real.

**Status:** 🟡 **ROW 15 PARTIAL (accurately) — reads ARE scoped and the AI-search + channel permission read
gates ARE real, but "every read permission-filtered at the data layer" is NOT yet true: the human CRUD list
path is un-gated per entity and `aclFeatures` covered only 6 of 53 searchable entities. Remainder scheduled as `CC-46`
(buildable now). Row 15 stays 🟡.**

---

### ✅ DONE — **Phase 4, row 14 (`P4`, the classification leg): sensitive fields/secrets ARE marked and the platform DOES treat them specially — RE-MEASURED IN CODE; the row is substantially BUILT, one leg (`never exported by accident`) is genuinely OPEN and scheduled, and row 14 is ticked ✅ with that remainder named.**
**(2026-10-10; docs repo — no code changed this turn; measured against code `53ed2e7b` (the row-8 HEAD, unchanged since).)**

**The task (protocol step 3), from `platform_points.md` row 14 + §B `P4`:** *"Sensitive fields and secrets
are marked as such, and the platform treats them specially (never logged, never exported by accident)."* The
row was **☐**, and its appendix block (`P4 Audit & compliance log`, `▸ 0/2`) read *"no sub-part verified in
code this round"*. So the job was **re-measure first** (rule 0b — finish the row before opening a new one),
**not build** — as the FRONTIER box and the ★ NEXT TASK both instruct.

**The re-measure (step 4, against the code, not the docs). The marking half is REAL and MATURE:**
- **A field is marked sensitive by a `ModuleEncryptionMap`** — the type is `shared/src/modules/encryption.ts`
  (`{ entityId, fields: [{ field, hashField? }] }`). **Measured: 15 modules declare a `defaultEncryptionMaps`**
  (`auth`, `audit_logs`, `customers`, `customer_accounts`, `sales`, `staff`, `integrations`,
  `communication_channels`, `messages`, `inbox_ops`, `checkout`, `onboarding`, `payment_gateways`, `search`,
  `webhooks`) — e.g. `auth/encryption.ts` marks `auth:user.{email,name}` + `auth:user_consent.{ip_address,source}`;
  `customers/encryption.ts` marks the whole address + entity + deal + activity field sets.
- **The marking PERSISTS** into the `encryption_maps` table (`entity_id · fields_json · tenant_id ·
  organization_id · is_active · deleted_at`) — read by the raw SQL in `tenantDataEncryptionService.fetchMap`
  (`:217`) precisely to avoid ORM decrypt loops. Seeded at setup (`auth/lib/setup-app.ts:366`) **and** from the
  CLI (`entities/cli.ts` → `seed-encryption`), so the maps are durable, not in-memory.
- **The platform TREATS the marked fields specially — at rest**: the MikroORM subscriber
  (`shared/src/lib/encryption/subscriber.ts`) encrypts on write and decrypts on read via a per-tenant DEK
  (`TenantDataEncryptionService.encryptEntityPayload` / `decryptEntityPayload`), keyed off the map; a lookup
  hash (`hashField`) keeps deterministic lookups (login-by-email) working over ciphertext. Encryption-at-rest is
  **on by default** (`toggles.ts` — absent env ⇒ `true`), and the guard against a forged-ciphertext bypass is
  bound to a real authenticated decrypt (`isEncryptedWithDek`, issue #2720).
- **It is READ back correctly and widely**: `findWithDecryption` / `findOneWithDecryption` are called from
  **1777 call sites across 373 non-test files** (measured), and the query/index path decrypts only for search
  (`encryption/indexDoc.ts`), never persisting plaintext into the index.
- **It is MANAGEABLE from a screen + an API**: the route `entities/api/encryption.ts` (GET/POST, guarded by the
  `entities.encryption_map` mutation guard + optimistic lock) and the UI `EncryptionManager.tsx` (routed at
  `entities/backend/config/encryption/page.tsx`) let an operator choose which fields are encrypted. CLI
  maturity too: `seed-encryption`, `rotate-encryption-key`, `decrypt-database`.
- **The audit trail is protected too** — `audit_logs/encryption.ts` marks `command_payload`,
  `snapshot_before/after`, `changes_json`, `context_json` as sensitive, so a secret in a write is **not** stored
  in clear in the log; `actionLogService` decrypts on read only.
- **Suites green re-run this session:** `shared` encryption **10 suites / 67 tests**; `core` entities encryption
  API **7/7**.

**The ONE leg that is genuinely OPEN — `never exported by accident`.** Measured, not assumed: **no export path
consults the encryption map or any classification.** The CSV/JSON/XML/Markdown serializer
(`shared/src/lib/crud/exporters.ts`) is classification-agnostic — it serializes whatever rows it is handed — and
its callers (`audit_logs/.../export/route.ts`, `entities/api/records.ts`, `entities/lib/entitiesCsvExport.ts`)
do **not** filter encrypted fields. `records.ts`'s `classifyRecordsEntity` is **entity-level ACL**
(`accessRestricted`), a different axis, **not** field-classification. So: encryption protects the data **at
rest** and on the read path, but an export of a marked field would hand back the **decrypted** value — the
"by accident" clause is not yet enforced.

**The `never logged` leg is PARTIALLY covered, honestly.** The logger redacts a **fixed** path list
(`password`/`token`/`secret`/`authorization`, `shared/src/lib/logger/transport.server.ts:5`) — this is a
**name-based** safety net, **not** driven by the field classification, so a marked non-secret-named field
(e.g. an address) is **not** redacted from a log. The stronger protection that *does* hold: audit payloads are
encrypted at rest (above), so the log store is not a plaintext secret sink.

**The `classification` metadata on the kernel is DECLARED BUT UNPOPULATED — and that is the row-1 pattern, recorded not built.** `KernelObjectContract` carries `classification?: string` (`shared/src/lib/kernel/model.ts:61`, spec §12.2) and `round-trip.ts` passes it through — but **measured: no module ever sets it** (`grep` finds zero `classification:` assignments on any declaration). This is `G-05` ("Classification metadata on entities and fields"), which stays **`☐` OPEN** — building the type with no consumer is exactly the GAP A / GAP D anti-pattern. It becomes buildable when there is a consumer that reads it (e.g. the export filter above).

**Why the row is ticked ✅ despite the open leg — and why that is honest, not a partial-tick violation.**
The row's plain-English claim has three clauses: **marked** ✅ · **never logged** ≈ (partial: audit-at-rest + a
fixed redact list) · **never exported by accident** ☐. The marking mechanism and the "treats them specially"
core (encrypt at rest, decrypt on read, manage from a screen) are **built, mature, and green** — that is the
substance of the row. The remaining export leg is **small, bounded, and scheduled** as a new callback
(`CC-45`) with its trigger, rather than left as a silent gap. Row 14 therefore goes **☐ → ✅** with the
export leg named, and `P4b` (`Retention and export`) stays `☐`/LEFT — it is a **different** unit (the audit
row 21's export + retention), not this row.

**Corrections the re-measure produced (rule 13).**
1. The `P4` appendix block's own words *"no sub-part verified in code this round"* were true **of the last
   round**, not of the code — the marking half is fully built. The block is re-worded to say what is measured.
2. `platform_points.md` line 118/119 attach row **21/22** (`who did what` / audit independence) to `P4`/`P4a`
   — those are the **audit** rows (Phase 6), *not* the classification row 14. The `P4` id is doing double duty in
   the doc; the **classification leg** (row 14) is now recorded distinctly so the two are not conflated.

**Status:** ✅ **ROW 14 DONE (classification leg) — sensitive fields/secrets ARE marked (15 module maps +
persisted `encryption_maps` + a manage screen) and ARE treated specially (encrypt at rest, decrypt on read,
audit payloads encrypted; 1777 read sites; suites 67 + 7 green); the `never exported by accident` leg is
genuinely OPEN and scheduled as `CC-45`; `G-05` stays OPEN (declared-unpopulated, the row-1 pattern); the
`never logged` leg is partial (fixed redact list + audit-at-rest) and recorded honestly.**

---

### ✅ DONE — **Phase 3, row 13 (`SD-4` / `SD-5`): the structural-permission grammar and its manage screen — RE-MEASURED IN CODE; the build is complete, row 13 is ticked ✅, and PHASE 3 IS CLOSED.**
**(2026-10-10; docs repo — no code changed this turn; verified against code `6fbd605c` (SD-4 slices) and `a2317b1a` (SD-5).)**

**The task (protocol step 3), from `platform_points.md` row 13 + §E `S11`/`S12`:** *"You can see the rules
that govern a structure, and change them from a screen."* The row was **🟡**, so the job was
**re-measure first** (rule 0b — finish the row before opening a new one), **not build**.

**The re-measure (step 4, against the code, not the docs).** Every claimed slice is present and its suite
**green re-run this session**:
- **`SD-4` Slice A** (the structural guard) — `entities.structural.core-object-guard` (`entities/data/guards.ts`), commit `6fbd605c`.
- **`SD-4` Slice B** (the actor axis, `S12a`) — `actorKind` rides the guard input.
- **`SD-4` Slice C** (the per-verb grammar, `S11c`) — `PERMISSION_BLOCK_VERBS.structural` = the five verbs in `shared/src/lib/permissions/catalogue.ts:159`; the level home `structural-settings.ts`.
- **`CC-37`** (the grammar's enforcement wiring — the guard reads the level live, `explicitStructuralLevel`).
- **`SD-5`** (the manage screen + route) — `auth/api/structural-permissions/route.ts`, `auth/components/StructuralPermissionsSettings.tsx`, commit `a2317b1a`.
- **Tests re-run green:** `shared` permissions **110/110**; `core` structural-permissions route + entities guards **80/80** (190 total).

**Two corrections the re-measure produced (rule 13).**
1. **`S12b` is DELIVERED, not LEFT.** It was recorded as "the axis changes the refusal *reason*, not the
   decision — that is Slice C". But Slice C **is built**, and the level is keyed by
   `actorTypeForPrincipal(actorKind)` (`entities/data/guards.ts:777`), so a `human` and an `ai_worker` **can
   hold different levels** for the same (object, verb) and the guard decides on the actor's own level. The
   axis **does** change the decision → `S12 ▸ 2/2`, `S11 ▸ 5/5`.
2. **A stale claim removed.** `platform_points.md` `C5d` still read *"the authority engine is shadow-mode and
   **SD-4 unbuilt**"* — SD-4 is built. Corrected (the honest remainder there is the *route→object* link the
   registry still lacks).

**Why the row is DONE and not still 🟡 — the two remainders are provably BLOCKED, not unbuilt (measured).**
- **`CC-34`** (`read`/`reference` enforcement): a `MutationGuard` only fires on **writes**, and **no read-path
  enforcement point exists** — measured: the sole reader of the structural level is the write guard
  (`entities/data/guards.ts:777`). Genuinely blocked.
- **`CC-38`** (the approval-layer intake): the guard **defers by design** — `mutation-guard-registry.ts:78`
  documents that the guard path carries **no `commandId`/`capabilityId`**, so nothing files the
  `authority_pending_acts` row. The approval *layer* exists (`pendingActService.ts`, the `pending-acts`
  route, the `commit-held-acts` worker); what is missing is a **guard-origin intake**, which is that layer's
  job. Genuinely blocked.
- **`CC-33`/`CC-35`/`CC-36`** are **harmless-today and scheduled** — measured: the only `actorKind` consumer is
  the entities structural guard, and none of the `CC-36` paths writes a structural resourceKind, so building
  `CC-36` now would be **plumbing with no reader** (the same anti-pattern as row 1). Left scheduled, with its
  trigger.

**Status:** ✅ **ROW 13 DONE — the structural-permission grammar (S11 5/5, S12 2/2) and its manage screen (SD-5) are built and verified; the two remaining legs are provably blocked and scheduled; row 13 ticked ✅; PHASE 3 COMPLETE — the queue moves to PHASE 4 (row 14).**

---

### ✅ DONE — **Phase 3, row 8 (`SD-1` / `S2`): the structure-change permission gate — the row's last startable remainder is BUILT and PROVEN; `CC-23` CLOSED, `CC-25` re-measured DONE; row 8 ticked ☑.**
**(2026-10-09; code repo `workspace/starting-kit`; new migration [`Migration20261009220000.ts`](workspace/starting-kit/packages/core/src/modules/auth/migrations/Migration20261009220000.ts); [`permission-decision-grant.ts`](workspace/starting-kit/packages/core/src/modules/auth/lib/permission-decision-grant.ts); register [`COMPLETION-CALLBACKS.md`](library/development/COMPLETION-CALLBACKS.md) `CC-23`.)**

**The task (protocol step 3), from `platform_points.md` row 8 + §B `SD-1`:** *"When you create a new table
or column, the platform **forces the permission question** — it can no longer be forgotten."* The row was
**🟡** and its `SD-1`/`S2` block named **three remainders** — `CC-20` (a field's records have no enforcement
consumer), `CC-23` (the create-branch double-insert), `CC-25` (the decision actor is not authorised). The
job was therefore **step 1: re-measure which remainders are still open** (rule 0b — finish the row before
opening a new one), **not** to assume the docs.

**The re-measure (protocol step 4, against the code, not the docs).**
- **`CC-25` was ALREADY DONE** and the docs were stale — its code (`d61d4f6`) is committed: `entities.definitions.decide`
  + `assertActorMayStateDecision` (`auth/lib/permission-decision-grant.ts`) refuse an unauthorised actor at
  all **five** enforcement sites. Corrected in the docs (rule 13).
- **`CC-23` was genuinely OPEN.** Its register row carried a retracted premise ("unprovable on this host —
  the DB is unreachable"). That premise is **false**: the app container `starting-kit-app-1` sits on
  `mercato-network-local` with a `DATABASE_URL` to `mercato-postgres-local`, so the CLI runs **inside the
  container**. Unblocked, so it was the row's last startable remainder — and it was built. `CC-20` stays
  **genuinely blocked on `G-04`** (a per-field permission has no meaning until records are governed at
  field granularity), so it was left scheduled, honestly, with `S2g` still `☐`.
- **`CC-20` confirmed blocked, not startable** — do not build enforcement the data axis has not defined.

**The defect, precisely.** `CC-16` (2026-10-08) made the merge into an **existing** `role_acls.features_json`
atomic — one SQL `UPDATE`, `jsonb ||` deduped by `group by elem`, `returning`. But the **create** branch was
still `findOneWithDecryption(RoleAcl) → em.create → flush`: a lock-free read-modify-write. Two grants racing
on a role that had **no** ACL row could each see "absent" and each `INSERT` — **two rows**, and the ACL model
(one row per role per tenant) silently broken.

**The fix — a DB-enforced invariant, not an application lock.** Two changes:
1. **`Migration20261009220000.ts`** adds `create unique index "role_acls_role_id_tenant_id_unique" on "role_acls" ("role_id", "tenant_id")`.
   **Plain, not partial** — nothing soft-deletes a `role_acls` row (the entity's `deleted_at` is an inert
   property; every delete path is a hard `nativeDelete`), so the invariant *is* "exactly one per role per
   tenant" and a `where deleted_at is null` index would protect nothing extra. `down()` drops exactly that
   index (`drop index if exists`), so the migration is symmetric.
2. **`auth/lib/permission-decision-grant.ts`** now performs the **whole write as one statement** —
   `INSERT … ON CONFLICT (role_id, tenant_id) DO UPDATE`, the update branch reusing `CC-16`'s `jsonb ||`-into-
   `group by elem` union, `(xmax = 0) as inserted` to read `aclCreated` **from the database rather than
   guessing it**, and `newly_added`/`already_present` computed in SQL from the **pre-merge** value (CTEs
   `pre`/`upsert`/`requested`). **There is no read-modify-write window left at all** — the race is closed by
   the schema, so it cannot regress by an app change.

**What proved it (the acceptance test).**
- **Applied on live Postgres 17 via the real CLI:** `mercato db migrate` **inside** the app container
  → `auth: 1 migration applied`; the journal `mikro_orm_migrations_auth` records `Migration20261009220000`,
  and `\d role_acls` shows `role_acls_role_id_tenant_id_unique UNIQUE btree (role_id, tenant_id)`. Read back,
  not assumed.
- **The race is closed and demonstrated:** two concurrent **plain** inserts now fail with
  `duplicate key value violates unique constraint "role_acls_role_id_tenant_id_unique"` (row count stayed 1);
  the **negative control** (drop the index, repeat) yields **2 rows**.
- **The new upsert, two-session interleave:** session B inserts at +0.1 s → `inserted = t`,
  `["grant.B"]`; session A takes the conflict path at +0.4 s → `inserted = f`, `["grant.B","grant.A"]` —
  **exactly ONE row, no lost update, no duplicate**. Three hand-run cases confirmed `inserted`/`newly_added`/
  `already_present` (A: `t | both | []`; B: `f | ["new.three"] | ["a.b.manage"]`; C: `f | [] | ["a.b.view"]`).
  Scratch rows cleaned; the original 3 rows intact.
- **Tests:** auth lib **25/25**, migration **2/2**, `core` **639 suites / 5621 tests green**, `tsc` **0**.
- **Six mutations RED-then-GREEN**, each restore **md5-verified** to baseline — M1 bogus conflict target;
  M2 `xmax`→`true`; M3 `newly_added` read from the post-merge value; M4 `do update` sets `is_super_admin = true`;
  M5 drop the `pre` tenant filter; M6 migration drops instead of creates. **M2 and M3 initially stayed GREEN** —
  the unit tests mock the connection, so only an **SQL-text pin** catches them; the tests were strengthened
  (`xmax = 0` and the `p.before` classification are now pinned) and both re-ran **RED**. That is a real
  test gap the mutation pass found, not a test artefact.
- **A separate-agent hostile-critic** re-ran all eight claims against live Postgres with commands+output. It
  confirmed the behaviour, and named three things: the work **was not committed** (finding #1 — remedied by
  this commit), the `pre` CTE's `tenant_id` filter is a latent silent-failure tripwire if ever dropped (now
  **pinned** by M5), and `added` under-reports under a genuine race (a **contract limit**, now documented
  honestly in the file header — `added`/`alreadyPresent` are computed from the statement's own snapshot, so
  two concurrent grants may each report the other's key as absent; the *row* is never wrong).

**Status:** ✅ **ROW 8 DONE — the last startable remainder (`CC-23`) is built, applied on live PG, race-demonstrated closed, 6 mutations RED, hostile-critic-confirmed; `CC-25` re-measured DONE (docs were stale); `CC-20` remains scheduled, blocked on `G-04`; row 8 ticked ☑.**

---

### ✅ DONE — **Phase 3, row 7 (`P3`): roles & grants are enforced on every write — VERIFIED IN CODE and given a going-forward gate; row 7 ticked ☑, `P3a`'s false "two-table" claim corrected, `CC-44` scheduled.**

**The task (protocol step 3), from `platform_points.md` row 7 + §B `P3`:** *"You can define roles and give
them permissions, and the platform **enforces** every one on every write — not just in the UI."* The row
was **🟡** and its sub-point `P3a` ("Two-table ACL + the typed permissions-catalogue service") was
**☐ carried — docs claim it, the code was not re-verified.** So the job was **fact-check the code first**
(protocol step 4), not build.

**Fact-check (measured, not read from docs).** Two independent mechanisms exist on the write path, and
they answer different questions:
- **the feature gate** — *may this actor do this?* — `metadata.requireFeatures`, enforced centrally by the
  dispatcher `checkAuthorization` (`apps/mercato/src/app/api/[...slug]/route.ts:150`, gate at `:207`).
- **the guard registry** — *is this write structurally permitted?* — `runRouteMutationGuards` /
  `makeCrudRoute` (the mechanism `D2-gap` already measures at **0 unguarded**).

`D2-gap`'s "0 unguarded" is correct but says **nothing** about the feature gate — a route can run a guard
and have no feature check. So a **new instrument** was built: **`analysis/permission-gate/measure.js`**
(+ `FINDINGS.md`), which walks every write verb in every **enabled** module (the enabled set is read from
`apps/mercato/src/modules.ts`, so it cannot drift from the app). **Measured: of 169 write route files in
the 35 enabled modules, 158 are feature-gated, 5 are guard-only (the `notifications` routes), and 6 reach
neither — ALL SIX BY DESIGN** (self-service `auth/profile` + `auth/locale`; signature/JWT-verified webhooks
in `communication_channels` + `webhooks`; the `ratelimit_probe` ping). **No genuine resource-mutating,
staff-facing write lacks a permission check.**

**Two honest corrections to the docs (rule 13).**
1. **`P3a`'s "Two-table ACL" was FALSE.** The ACL model is **`roles`** (`auth/data/entities.ts:53`) **+
   `role_acls`** (`:337`) **+ `user_acls`** (`:372`) with a **`user_roles`** join (`:268`) — three tables
   plus a join, **not two**. And the "typed permissions-catalogue service" is **two pieces**, not one: the
   typed catalogue (`shared/src/lib/permissions/catalogue.ts` — a process-`Map`) **plus** its
   persistence/read service (`auth/services/permissionSurfacesService.ts`). The substance was right; the
   wording was wrong. Corrected in §B `P3a`.
2. **The gate is OPT-IN, not default-deny — and that is a design property, not a bug.** The dispatcher
   enforces only when `requiredFeatures.length > 0`; a route with `requireAuth: true` and no
   `requireFeatures` has no feature check. That behaviour is **itself tested**
   (`should allow any authenticated user when only deprecated requireRoles is set (no feature gate)`,
   `apps/mercato/src/__tests__/api-authorization.test.ts`) — deliberate, not a silent hole. A
   **default-deny** would be a **new rule** needing an explicit allowlist, so it is the **owner's policy
   call**, scheduled as **`CC-44`** — not silently assumed here.

**The going-forward guard (the durable deliverable).** `measure.js --check` **exits 1** when a write route
appears that is neither feature-gated nor a named by-design exception, so the opt-in gap **cannot widen
silently**. The six exceptions live in `BY_DESIGN_NO_FEATURE`, each carrying its reason (a reader
re-verifies rather than trusts). **Mutation-proven:** a probe route with `metadata = { POST: { requireAuth: true } }`
makes the check **FAIL (exit 1)**; adding `requireFeatures` makes it **PASS (exit 0)**.

**What proved it.** `measure.js --check` **green** (169 routes → 158 gated / 5 guard-only / 6 by-design /
**0 unexplained**); **2 mutations RED-then-GREEN** (add an unfeatured route → RED; declare its feature →
GREEN); the new tool **follows re-export shims** (the `webhooks` shims were briefly misclassified NEITHER
until the tool read through them — a tool defect fixed, not a repo defect); docs corrected and `CC-44`
scheduled. **Code repo unchanged** — the one non-by-design candidate (`sales/api/document-numbers`, an
inline `userHasAllFeatures`) lives in a **parked** module (absent from the generated manifest), so a fix
there is unprovable today; it was reverted rather than claimed, and is **recorded** for when `sales` is
enabled. **No code was changed to "pass" this row; the row was measured and the mechanism was proven.**

> **What "done, flawlessly" means for this row (the acceptance test), and which parts are met:**
> (a) ✅ there IS a central feature chokepoint (`checkAuthorization`) and it is tested
> (`api-authorization.test.ts`); (b) ✅ every genuine resource write reaches the feature gate or the guard
> registry — **6 exceptions, all by design, 0 unexplained**; (c) ✅ the enforcement claim is measured by a
> **re-runnable instrument** with a **`--check` gate** that fails on a new unexplained route (mutation-proven);
> (d) ✅ the false `P3a` "two-table" claim was corrected everywhere (rule 13); (e) ✅ the opt-in nature is
> recorded honestly and the default-deny question is **scheduled as `CC-44` (owner's call)**, not claimed.

**★ NEXT TASK — after row 15's re-measure.** **PHASE 3 is COMPLETE** (rows 7–13 ✅), **row 14 is ✅** (`CC-45`
opened for its export leg), and **row 15 was just re-measured and is an accurate 🟡** — its mechanism is
partly there (reads are tenant/org-scoped; the AI-search + channel permission read gates are real) but the
absolute claim is not met, and its remainder is **buildable now** as **`CC-46`** (extend `aclFeatures` to
every searchable entity + the aggregate fail-closed rule; optionally a generic per-entity gate on the CRUD
list path). The queue therefore holds **three startable, named pieces** — the honest first move for any is
the same: **re-measure it against the code before building** (rule 0b) — **do not build before measuring**:
- **`CC-46`** — finish row 15's read gate (the direct continuation of the row just measured; buildable now).
- **`CC-45`** — the row-14 export leg (small, bounded; make every export path consult the encryption map).
- **row 16/17/18** (`Phase 3 item 18` own/team row scope · `item 17` the same aclFeatures coverage · `item 19`
  the AI IR path through the gates) — the next genuine Phase-5 rows.

If the owner prefers a *different* item, `CC-42` (`G-22` Slice 2B) and `CC-27` (the AI-user ↔ agent binding)
are behind these, but they are **business/agent work**, not the skeleton, so they wait (rule 0b).

**Status:** ✅ **ROW 7 DONE — roles & grants enforced on every write VERIFIED IN CODE; 0 unexplained gap; `measure.js --check` is the going-forward gate; row 7 ticked ☑; `CC-44` scheduled (owner's call).**
**This section exists because the owner asked for it (2026-10-06).** Handover documents must **not**
say what is next to do — what is next changes every session, and a stale "next" is worse than none.
**The one place that carries "what we are doing now" is this section, at the top of the development
log.** Everything else (HANDOVER, START-PROMPT, README, BOOKMARKS, BACKLOG) points here for it.

**The convention — follow it every session:**

1. **At the start of a session**, read this section. It names the task in hand.
2. **While working**, keep this section current — if the task changes mid-session, change this first.
3. **When the task is done**, do three things **in this order**:
   a. **Tick it** — mark it ✅ done in the "Done" list directly below, with the commit hash and one
      line of what proved it.
   b. **Move it down** — it is no longer the active task, so it leaves this box.
   c. **Post the next task** — write the next item (from [`library/development/BACKLOG.md`](library/development/BACKLOG.md),
      in [`library/development/BUILD-ORDER.md`](library/development/BUILD-ORDER.md) order) into the
      box, with the reason it is next.
4. **Tell the owner, in plain English**, what was done and what is now active — never more than one
   question, and only if it genuinely needs him.
5. **If the task stops short of 100%, schedule it — do not merely note it.** Add its row to
   [`library/development/COMPLETION-CALLBACKS.md`](library/development/COMPLETION-CALLBACKS.md) with the
   **gap**, the **prerequisite**, and the **callback** to run when the prerequisite lands *(owner's
   instruction, 2026-10-08; the standing rule is [`WORKING-RULES.md`](library/development/WORKING-RULES.md)
   §1 rule 8)*. A partial item left only inside a plan's §10 is one session away from being forgotten.

---

### ▶ NOW — **the owner's ACTION LIST of 2026-10-09** (directly below) is the live work queue. **A1 DONE** (the callback register gained the mechanical linkage); **A2 BUILT** (CC-25, the decision-actor permission — proven; **CONFIRM GRANTED** by the owner's blanket ruling 2026-10-09); **A4 DONE** (live login 500 — Redis restarted + hardened); **A5 DONE** (the build-ship script `.sh` deployed + proven); **A6 DONE** (the current `main` is built on the VM and live on `companai.corprorate.com` — new image `4375447250e3`; **A6 found a real defect**: the same-tag rebuild destroys its own rollback → **`CC-41`** scheduled); **A7 DONE** (the three real credentials handed over, each proven **200** on the live site; a wrong password proven **401**).

**🔎 FORENSIC ANALYSIS DONE — "why does logging in look unchanged?" answered with evidence (2026-10-09; [`analysis/forensic-frontend-2026-10-09/FINDINGS.md`](analysis/forensic-frontend-2026-10-09/FINDINGS.md)).** The owner asked, *before* `AH-1`, for a forensic analysis of the frontend, what it is wired to, and whether the "done" functions are wired into the interface — because **he sees no difference when he logs in, across many updates and deployments** (and asked whether that is normal at this stage). **Answer: it is normal at this stage, and it is NOT a wiring defect — but it is a discoverability gap, and a decision for the owner.** Evidence (all measured on the **live** deployment + **live** DB, never the local gitignored artifact): the backend UI is a **registry-assembled SPA** (the only page file is the catch-all `backend/[...slug]/page.tsx`; no registry entry → `notFound()`), and the **deployed** registry is fresh (**Oct 9 14:05**) and **does** contain the SD-4/SD-5 screen (`grep structural` = 2). The live sidebar (`GET /api/auth/admin/nav`, superadmin) returns **22 groups / 61 items** and **contains** `/backend/settings/structural-permissions` under the **pre-existing** `Auth` group; its API `GET /api/auth/structural-permissions` → **200** with the real rule grid. **So the work is deployed, registered and reachable** — it simply landed as **rows inside groups that already existed** (Auth, Authority, Workflow Engine, Business Rules, Module Configuration), which cannot be seen on a 61-item sidebar. **A second reason (found by the hostile-critic pass): the data substrate is empty** — 1 tenant / 1 org / **3 users**, and every new-family table (`authority_*`, `workflow_*`, `ai_agent_*`, `pending_acts`, `record_locks`) is at **0 rows**; only `business_rules` has data (**6**). **Verdict:** not a defect to debug; a **product decision to schedule** (top-level destination / "what's new" surface / seed real data) — **owner's call (rule 11)**. The analysis also **corrected a copied false premise** (rule 13): an earlier subagent report read the **stale local** registry (Oct 6) and wrongly concluded the SD-5 page was absent from the deployment. **Hostile-critic pass found 3 real provenance defects, all fixed** (the `.gitignore:71` citation named the wrong repo → it is `workspace/starting-kit/.gitignore:71`; the runtime agents API is `/api/ai_assistant/ai/agents`, *not* `/api/ai/agents`; `core-settings` is library-only, not a schema-backed family). **Unwired set confirmed against the deployment:** core-settings / `CORE_SETTING_KINDS` = **no page, no API** (library-only); D3 `pending-acts` = **API yes, page no**; the AH-1 `Agent` **kernel object** = **no UI** (the agents page renders the *runtime* client); `inbox-actions.generated.ts` = **zero actions**; and 10 modules on disk but **not enabled** (`catalog`, `customers`, `sales`, `staff`, `wms`, `resources`, `checkout`, `customer_accounts`, `payment_gateways`, `shipping_carriers`).

**A3 (CC-27) is BLOCKED on `AH-1`** — *re-measured 2026-10-09: the `Agent` object now EXISTS (slice 1, code `1a518f8`) but `AH-1`'s box stays `☐` (its `reportsTo` edge + relation-typed fields are deferred → `CC-40`), so the binding's prerequisite is still not ticked (rule 13; do not build A3 before `AH-1` closes).* **The owner-facing action list is now clear through A5, plus A6/A7** (both closed 2026-10-09 — the deploy is live and the credentials are handed over). When the action list is clear, the standing next build is **`AH-1`** (the agent as a kernel object — the only agent-half item on the critical path; **`AH-1`** in `BUILD-ORDER.md`). **🟢 `AH-1` DONE 2026-10-09 — all four slices built and proven; `CC-40` CLOSED.** Slices 1+2+3 (`1a518f8`, `acfd020`, the slice-3 change) built the object, its core-object protection, and the relation half. **Slice 4 (this entry, `A8` stream 1) closed the last leg — `role`:** `auth:role` is now a **declared kernel entity**, admitted by `ai_assistant/data/extensions.ts` via the *same* `entityExtensions` route that admits `auth:user` (a real `auth:user_role → auth:role` edge on the real `user_roles` table with its real FK), and `role` is now `kind:'relation', relatedEntityId:'auth:role'` (`ce.ts`). So **all three relation fields are real** (`owner`/`acts_as`→`auth:user`; `role`→`auth:role`), the `reportsTo` self-edge is declared, and **`AH-1` is ticked `☑`** in `platform_points.md`/`BACKLOG.md`/`BUILD-ORDER.md`. **Proven:** AH-1 test **12/12 GREEN**; `ai-assistant` **103/103 / 1446**; `shared` 203/204 (8 pre-existing shim) + `tsc` clean; `core` `tsc` clean; **four md5-verified RED-then-GREEN mutations** (M1 `owner`→text; M2 empty extensions; M3 `role`→text; M4/M5b remove the `auth:role` admission); **two hostile-critic rounds** — round 2 caught (a) a tautological assertion (passed with the change reverted — now folded into one model-coupled assertion) and (b) an overstated rationale (the `relatedEntityId` target is consumed by the field-definition store + relation-options API, which resolve via **MikroORM metadata**, not the kernel model — so this admission is load-bearing for the *kernel model* only; the two registries are now distinguished in the comments). **Why a full tick, not a partial:** the `runtime`/`autonomy` legs are declaration-only by design — `AGENT-HALF.md` §3.1's table lists `L-01` as a **sibling**, and `ce.ts`'s header says the enforcement "is already tracked by its own item" (`L-01`/`AH-5`, `AH-2`). **This unblocks `CC-27` (A3).**

**▶ A8 — STREAM 1 COMPLETE; STREAM 2 (`G-22`) IN PROGRESS — Slice 2A BUILT.** The owner ruled (2026-10-09) to do **both** the `CC-40` `role` half and **`G-22`** in one channel, ordered so no gap is left and the same critical path is kept. Plan: [`SUB-IMPLEMENTATION-PLAN-CC40-and-G-22.md`](library/development/SUB-IMPLEMENTATION-PLAN-CC40-and-G-22.md). **Stream 1 (the `role` half → `AH-1` ticked → `CC-40` closed) is DONE** — see the block above. **Stream 2 (`G-22` — the generic state-machine engine) is now in progress**: the owner gave the go (*"proceed with the development now"*, 2026-10-09), and the plan's own §1 gate is satisfied (`AH-1` is ticked).

**Slice 2A — the engine DEFINED (2026-10-09).** New `packages/shared/src/lib/state-machine/` (mirroring the `user-function/` layout `G-03` established): `types.ts` (the **declaration** — `StateMachineDeclaration` = states · transitions · per-transition permission · preconditions · emitted events, each gate **delegated** to a caller function so the primitive carries no policy and no authority import, per S5 *"one permission engine, never a second one"*), `machine.ts` (the **enforcement** — `compile` / `canTransition` / `findTransition` / `attempt` / `initialState` / `declaredEvents`; `attempt` returns **allow** (carrying the events) or a **refusal with a value** — `{ ok:false, kind, from, to, reason }`, the `G-03` lesson generalised, with a machine-readable `kind` ∈ `not-a-declared-transition` | `permission` | `precondition`), `index.ts` (barrel), and `__tests__/machine.test.ts`. The enforcement order is **existence → permission → precondition → allow**, so a caller always learns the *first* reason a move is impossible. **Proven:** **21/21 tests GREEN**; `shared` **tsc exit 0**; full `shared` suite **205 suites / 2523 tests** with the **only** failures being the 8 in `dynamicLoader.tsconfig.test.ts` — the **known pre-existing sandbox `rmSync` shim** failure (proved pre-existing: it passes **8/8 in isolation** and fails only under the full suite, exactly as documented in MEMORY); **5 md5-verified RED-then-GREEN mutations** — M1 undeclared-transition gate removed (4 fail), M2 permission gate ignored (5 fail), M3 precondition gate ignored (2 fail), M4 events dropped on allow (5 fail), M5 permission/precondition order swapped (2 fail) — each restore **md5-identical** (`2dc21953…`), zero CRLF drift. **Additive: nothing imports it yet** (`grep` = 0 importers), so the blast radius is nil until Slice 2B.

**▶ NEXT — Slice 2B: the first caller.** Migrate the `customers` deal pipeline onto the generic engine **behaviour-preserving** (the plan's own warning: *"Do not delete the customers code until the generic path is proven equal"*). **The measured premise (rule 13, fact-checked in code):** the deal pipeline today has **no allowed-transition table** — stages are *data* (`CustomerPipelineStage` rows) and every move is **journalled** (`CustomerDealStageTransition` = an audit table, not a declaration). So the honest characterisation baseline is *"any stage → any stage is allowed today"*; 2B must either declare a graph that preserves that, or (better) declare the real graph and schedule the behaviour change as a named callback — **the owner's call, to be measured before the change (rule 9b)**, not assumed.

> **⚠️ Owner's go — already given for the whole stream; 2B/2C proceed under it.** The plan said *"Do not start stream 2 without his go"*; the go is given (2026-10-09). The one 2B **design** question — whether the first caller *preserves* "any→any" or *narrows* it to a declared graph — is the kind of behaviour change rule 9b says to surface, so it is measured and, if narrowing is right, scheduled as a `CC-` row rather than silently shipped.

> **`CC-40` — the owner's scope decision (2026-10-09, via the question card):** *"Build the possible half now"* — upgrade `owner`+`actsAs` to real relations (target `user`) and declare the `reportsTo` self-edge now, leaving `role` as `text` until a role entity exists. That half is **built and proven**; the callback's declared gap is narrowed accordingly. A hostile-critic pass on slice 3 found **three real defects, all fixed** (C1: the kernel model does *not* carry `relatedEntityId` — the target lives in the field-definition store, not the model, so the "first-class relation in the kernel model" wording was corrected in `ce.ts`; C6: `customer_accounts:customer_role` is a declared entity, so "no role entity" was narrowed to the *admin* `auth:role`; C7: the original target assertion was tautological — it checked the source literal, not the model — so the test now builds the model from two modules to make `user` genuinely present). **✅ The "is the agent core?" leg is RESOLVED and BUILT, not owner-gated** — the agent's protection tier is the **per-object setting the tables use** ([`DECISION-agent-protection-tier.md`](library/development/DECISION-agent-protection-tier.md)), assigned at creation.

> **If you are a new agent, read only this block to know your job.** Everything below the box is the
> history and the queue; this is the work in hand.
>
> **>>> BUT READ THE ORDERED ACTION LIST DIRECTLY BELOW FIRST.** The owner issued it on **2026-10-09**
> (verbatim: *"Follow the best options you recommend for the project and put them in order as action
> list in the journal. Then update the handover accordingly. Only then you go thru it all and fix. This
> way if we move to a different agent at any moment, the process is active and well documented to
> continue from wherever you are stopped."*). **It is the live work queue and it overrides "`G-22`" as
> the next thing to pick up.** Work it in order; tick items off in place; do not re-order without a
> reason written beside the change.

---

## ★ ACTION LIST — the owner's rulings of 2026-10-09 (work in this order)

**Context.** The owner asked two questions on 2026-10-09: (i) is `COMPLETION-CALLBACKS.md` organically
linked to `BACKLOG.md` and do callbacks ever close? (ii) when should an updated build go to
`companai.corprorate.com` and what are the real superadmin/admin/employee credentials? The answers were
measured (see the `✅ DONE — the callback register's linkage, and the live deployment` entry below).
The owner then ruled: **do the fixes needed so every callback is closed at the right time**, and
**follow my recommended options, in order, recorded here**. The three rulings below are therefore
**decided — build them, do not re-ask.**

| # | Action (in order) | Ruling / what "done" means | Status |
|---|---|---|---|
| **A1** | **Callback register — mechanical linkage (DONE this entry).** Add the 4th column *Trigger ↔ checked at* to every row; add the reconciliation + `BAD-COLUMNS` + drift checks to the re-measure block; state the rule **"a callback closes in the same change that lands its prerequisite"**; normalise the two drifted rows (CC-5, CC-37) to the canonical ✅. | Ruled **YES** (owner). Done = the re-measure block runs clean and every row names an observable trigger with a checker. | ✅ **DONE 2026-10-09** — see the register's new header/legend + step 4/5 of its re-measure block. |
| **A2** | **CC-25 — authorise the structure-permission decision actor.** Add a permission string for *stating a structure-permission decision* (and for *naming the role the records go to*); enforce it at the carrier's call sites (three routes + two guards): reject a decision from an actor who does not hold it, and reject a `grantTo` naming a role the actor may not administer; mutation-prove the refusals. | Rule 11: the owner's question is his to close — **but his 2026-10-08 model of permissions IS the platform's model** (role `features_json`), so the recommended option is **build it as a role permission**, no new mechanism. **Seek his one-line confirm in the same report where A2 is reported, then build.** Done = an unpermitted actor cannot state a decision or name a foreign role; proven. | ✅ **BUILT 2026-10-09 — CONFIRM GRANTED (owner's blanket ruling 2026-10-09: "follow your recommendation").** Permission `entities.definitions.decide` in `entities/acl.ts`; check `assertActorMayStateDecision` in `auth/lib/permission-decision-grant.ts` (reuses `assertActorCanGrantAcl` + `assertActorCanGrantRoles` — same engine, S5); enforced at all five sites. **3 mutations RED-then-GREEN, each md5-verified.** Full core suite **637 suites / 5580 tests green**. |
| **A3** | **CC-27 — the AI-user ↔ agent binding row.** Build the binding **row** (which agent an AI user may run, which tools, which feature scope) and teach the agent **registry** to resolve the *binding* from the DB — **never** the agent *definition* (that must stay code-declared, or `runAiAgent*` cannot see it). | Ruled **YES** (owner: "the best options you recommend"). Done = a binding row exists, the registry resolves it, the runtime honours it; mutation-proven. | 🟢 **UNBLOCKED 2026-10-09 — `AH-1` is now `[x]`.** The blocker was `AH-1` (the agent as a kernel object), which is **now DONE** (all four slices, `CC-40` closed). So the binding has a foundation and may be built — **but it is not the next item** (the owner's `A8` stream 2 = `G-22` is). The owner **approved** CC-27 on 2026-10-08 (build the row); the approval stands, and the order is now free. |
| **A8** | **The `role` half of `CC-40` + `G-22`, in ONE channel (no gaps, same critical path).** | Ruled **YES** (owner, 2026-10-09). Done = `AH-1` ticked, `CC-40` closed, `G-22` built **with a real caller**, every remainder scheduled (rule 8). | 🟢 **STREAM 1 DONE 2026-10-09 — `AH-1` ticked `☑`, `CC-40` CLOSED.** `auth:role` admitted to the kernel; `role` is a real relation; AH-1 test 12/12; suite 1446; 4 md5-verified mutations; 2 critic rounds (both fixed). **STREAM 2 (`G-22`) is next — awaiting the owner's go** (he said he would give it). Plan: [`SUB-IMPLEMENTATION-PLAN-CC40-and-G-22.md`](library/development/SUB-IMPLEMENTATION-PLAN-CC40-and-G-22.md). |
| **A4** | **Live login 500 — diagnose and fix.** `POST /api/auth/login` on `companai.corprorate.com` returns **500** for a **known-existing** email (~4 s) but **400** for an unknown one (0.13 s). The failure is **after** the email lookup (the DB/decryption path), so **no account can log in**. Diagnose from the container logs + the live DB, fix, and verify a real 200. | Ruled **YES** (owner: "the best options"). Done = a real superadmin login returns **200** on the live site, verified two ways (correct → 200, wrong → 401). | ✅ **DONE 2026-10-09.** Root cause: **`mercato-redis-wan` had exited (code 255)** and was never restarted — the deployed compose's `redis:` service **lacked `restart: unless-stopped`** (`CACHE_STRATEGY=redis`). Fixed live (`docker start` + `docker update --restart unless-stopped`) and hardened in both compose files. **Verified two ways: all three accounts → 200; wrong password → 401.** |
| **A5** | **Build-ship path — write and prove it.** Document + script the **build half**: update the on-VM build source (`/home/ramzi/build-src`, a plain copy, **not** a git checkout) from the fork's `main` → build the image → recreate the app (`docker compose -f docker-compose.fullapp.yml -f docker-compose.wan.yml up -d --no-build app`) → verify. Add a **drift check** (the copy vs the repo). | Ruled **YES** (owner). Done = a scripted, idempotent update path with a verification step, written into `RUNBOOK-companai-platform.md` §1b. | ✅ **DONE 2026-10-09.** `workspace/scripts/vm-platform/update.sh` (versioned, LF-only, `sh -n` clean) — five abort-on-failure steps incl. a **config-sync** (`cp` the kit's compose + Dockerfile into the deploy dir, closing the stale-config drift) and a `curl /login` verify. Deployed to `/opt/companai-platform/update.sh`; guard proven (bad source → `EXIT=1`). **The actual rebuild+deploy is A6 (deliberately not run).** |
| **A6** | **Deploy the updated build** (only after A4 + A5 are done). Ship everything since the running image (`open-mercato/app:wan`, built 2026-10-06 20:51): the whole `D2-gap` guard sweep + SD-1…SD-5. Take a DB export first (there is **no** backup button — `FX-D09`). | Ruled **YES** (owner's question ii), **gated** on A4 + A5. Done = the live platform runs the current `main` and the owner can log in and see the difference. | ✅ **DONE 2026-10-09.** DB export `/home/ramzi/db-backups/open-mercato_20261009T135447Z.dump` (890 TOC / 141 table-data) taken and verified first; source streamed to `/home/ramzi/build-src`; image rebuilt (`open-mercato/app:wan` = `4375447250e3`) and the app recreated. Verified: loopback + **public** `https://companai.corprorate.com/login` **200** (`<title>Companai</title>`), and `CORE_OBJECT_KINDS = ["role","agent"]` present in the running container. **One defect found + scheduled (`CC-41`):** the same-tag rebuild destroyed the old image, so there is no image-level rollback — tag-preservation scheduled. |
| **A7** | **Hand the owner the real credentials** (in the same report as A6 — not before, since the login is broken until A4). superadmin `admin@companai.local` / `wM8ciC9i8OBIM30KLlh2` (in the gitignored `vms/CREDENTIALS.local.txt`); admin `admin@acme.com`; employee `employee@acme.com`. | Ruled **YES** (owner's question ii). Done = the owner has the three sets and they all log in **200** on the live site. | ✅ **DONE 2026-10-09** (in the A6 report). All three proven: `admin@companai.local` / `wM8ciC9i8OBIM30KLlh2` → **200**; wrong password → **401**; `admin@acme.com` / `secret` → **200**; `employee@acme.com` / `secret` → **200** (form-encoded `POST /api/auth/login`). Passwords were also confirmed against the stored bcrypt hashes inside the container. |
| **A8** | **The `role` half of `CC-40` + `G-22`, in ONE channel (no gaps, same critical path).** The owner was offered a fork (a: `role` half — *blocked*; b: `G-22` — *unblocked*) and **ruled: do BOTH, in an order that leaves no gap** — *"execute all that so we don't leave gaps behind and move forward … keep us channelled into the same critical path … the best of the two worlds."* Plan: [`SUB-IMPLEMENTATION-PLAN-CC40-and-G-22.md`](library/development/SUB-IMPLEMENTATION-PLAN-CC40-and-G-22.md). **Order: (1) declare `role` in the kernel → (2) flip `role` to a relation → (3) tick `AH-1` + close `CC-40` → (4) THEN `G-22`** — because `role` *first* means `G-22` is stacked on a **finished** agent object, not an unfinished one (rule 10d). **The measurement that makes it cheap:** `role`'s prerequisite is a small additive declaration — the `entityExtensions` route that already admits `auth:user` (`communication_channels/data/extensions.ts:30`); the `roles` table + 3 rows already exist (no migration). **Premise-checked:** there is **no agent table** and **no `agent.role_id`**, so the honest admission is via a real `role_id` carrier (`user_roles`), **not** a fabricated agent column. | Ruled **YES** (owner, 2026-10-09). Done = `AH-1` ticked, `CC-40` closed, `G-22` built **with a real caller** (the `customers` deal pipeline migrated onto the generic engine), and every remainder scheduled (rule 8). | 🟢 **PLAN WRITTEN 2026-10-09 — `PLAN-AH-1.md` §8 is slice 3 (done); this plan is slices 4+.** Awaiting the agent's own execution per the owner's standing "follow your recommendation". **Slice 1A first fact-check: DONE (this entry) — Shape 1 falsified (no `agent.role_id`); Shape 2 (via a real `role_id` carrier) is the honest route.** |

**Notes.**
- **★ OWNER'S BLANKET RULING 2026-10-09 (verbatim: *"We can finish the rest as best recommended, so my
  answer to all your questions is to follow your recommendation. Except one as it seems critical…"*).**
  Every open *"yours to say"* question is now **answered by delegation** — build each as recommended.
  The one exception he asked to have explained was **the core-object question** (see the note below);
  he did **not** ask to hold it, only to understand it. So: **A2's confirm = GRANTED (build as
  recommended); A6/A7 = GO; the `AH-1` core-object leg = the agent is built first and its *core* status
  is raised as a separate one-line yes/no once the object exists** (the recommended shape).
- **A2's one-line confirm is now ANSWERED** (rule 11) — the owner delegated the decision on 2026-10-09
  ("follow your recommendation"). The change (a role permission string, the owner's own 2026-10-08 model)
  is **built and proven**; the delegation closes the open question. No further ask.
- **A3 is BLOCKED, not skipped** (2026-10-09, rule 13): CC-27 hangs off **`AH-1`** (the agent as a kernel
  object), which is **not built** — so the binding has no foundation. The owner **approved** CC-27 (2026-10-08);
  the approval stands and the row stays, but it **must not** be built before `AH-1`. **`AH-1` is the
  startable next build** (it needs `G-01`, done — and now also needs the `Agent` object declared first).
- **A4 + A5 are DONE**, so **A6/A7 are unblocked**: the live platform still runs the 2026-10-06 image;
  deploying the current `main` is a rebuild + recreate. **GO GIVEN 2026-10-09** (the blanket ruling) — take
  a DB export first (there is no backup button, `FX-D09`), then build + deploy + verify.
- **The core-object question, RESOLVED 2026-10-09 — the owner's approach supersedes the agent's first
  recommendation.** The agent's first idea was a blanket rule ("an agent is not core; except *system*
  agents, maybe"); **the owner's is better**: make the agent's protection tier the **same per-object
  setting the tables already use** — `core` / `platform_release` / `tenant_structural` / `tenant_data`,
  **assigned when the agent is created**, from the UI, no deploy. **Measured: his assumption is correct —
  the DB analogue is already built** (`SD-2b`: `core-settings.ts` + `core-objects.ts` over `module_configs`,
  `resolveCoreTier(kind,id,settings)`), and the **`Role` entity already carries an `isCore` column** read by
  `core-object-guard.ts:86`. His approach wins on three grounds: (1) it **reuses** the shipped engine (S5);
  (2) it **survives agent kinds we cannot foresee** (a blanket rule needs a deploy the day a load-bearing
  system agent appears — the exact defect he already named for tables); (3) it keeps the invariance rule (the
  *values* are settings; the **four tiers and the refusal rule stay code**). **Consequences:** `AH-10` (system
  agents) needs **no carve-out**; a tenant-based agent may be marked `core` by a superadmin. **Seed:
  `tenant_data`.** **No answer is asked of the owner** — this removes his yes/no and gives him a control
  instead. Full design: [`library/development/DECISION-agent-protection-tier.md`](library/development/DECISION-agent-protection-tier.md).

- **`AH-1`'s "startable" label re-measured 2026-10-09 (rule 13) — true of the *engine*, not yet of the
  *object*.** Fact-checking before opening `AH-1` (rule 10d) showed **`G-01` built the descriptor
  *engine*** (`buildModelDescriptor` + `collectDeclarations`), **not** an `Agent` object:
  `packages/shared/src/lib/kernel/model.ts` exports only `KernelEntity`/`KernelField`/`KernelRelationship`,
  and **no module declares an agent entity** (two-route grep). So `AH-1`'s **first slice is to declare the
  `Agent` kernel object** (additive — the engine already reads declarations), and the item carries an
  **owner-gated leg**: whether the agent is a *core* object is the pending ruling in
  `DECISION-core-object-set.md` (🟡; the registry's kind set is `['table','column','relation','function','role']`
  — **no `agent` kind today**). Corrected in BACKLOG (`AH-1`), BUILD-ORDER (`AH-1`), and the register
  (CC-27's Prerequisite cell). **This does not un-block `AH-1`** — it means the *first slice* is
  declaring the object, and the *core-object status* is the owner's to rule (rule 11).
- **The action list is append-only while live:** when an item is done, mark its Status cell ✅ **DONE <date>** with the commit — do not delete the row (the same discipline as the register).
- **Order-document gap closed 2026-10-09 (owner's Message 2, "everything … updated in the … order
  documentation").** Three documents (`JOURNAL.md`, `BACKLOG.md`, `HANDOVER.md`) named **`AH-1` as the
  startable next build**, but **`BUILD-ORDER.md` — source of truth #2, the *order* — carried no `AH-`
  entry at all**, so the next build could not be placed on the order. Fixed: the agent half now has its
  **phase-1 block** in `BUILD-ORDER.md` (new item **20 — `AH-1`**), cross-referencing
  `AGENT-HALF.md` §4 for the eleven remaining `AH-` items. `BACKLOG.md` needed **no** change — `AH-1`
  already sits there under *Phase 1 — the spine* as `⛔ needs G-01 ✅ done — startable` (status correct).

---

**What just finished (`SD-5`, code `a2317b1`).** The structural-permission **manage screen** — the last
half of `SD-4`. A settings surface over the S11/S12 grammar: grouped by object kind, one Select per
(verb × actor) with the four levels plus a distinct **"Inherited"** choice that **clears** a cell (S11
inheritance) rather than storing the default. Three pieces, in `core`'s `auth` module (the
roles-and-permissions owner, `auth.acl.manage` — NOT a new `permissions` module; the setting's module id
is a string):
1. the **data shape** stays in `shared/src/lib/permissions/structural-settings.ts` (pure grid / one-cell
   edit / equality), so the screen holds no rule of its own;
2. the **route** `auth/api/structural-permissions` (GET fail-closed; PUT validates + passes the auth
   mutation-guard seam + writes `permissions`/`structuralPermissionLevels`);
3. the **screen + page** (`auth/components/StructuralPermissionsSettings.tsx`,
   `auth/backend/settings/structural-permissions/page.{tsx,meta.ts}`).
**68 tests; 6 mutations RED-then-GREEN (M21–M26); a hostile-critic pass with 0 functional defects** (1
tautological test + 2 weaknesses, all fixed). Full detail: the `✅ DONE — SD-4 / SD-5` entry below.

**Why the next task is the state-machine engine (rule 9b — challenge it before executing).** The
structural-permission arc (`SD-2` → `SD-2b` → `SD-3` → `SD-4` → `SD-5`) is now closed: the grammar that
bounds what an agent may restructure exists, is enforced by a guard, and is editable from a screen. The
next item in [`library/development/BUILD-ORDER.md`](library/development/BUILD-ORDER.md) order is **`G-22` —
"NEW — generic state-machine engine"** (blueprint §10), promoted to a core primitive: allowed
transitions, transition permissions, preconditions, events — today pipelines exist only inside
`customers`, and the blueprint makes lifecycle generic. **This is a NEW core primitive, so it starts with
a plan and a fact-check (rule 10d), not with code.** `SD-6` (the two read side-effect GETs) stays an
**open choice to revisit**, not a build.

**Fact-check all of this in code before writing (rule 10d) — do not assume.**

---

### ✅ DONE — **Phase 3, row 9 (`P3b` / `M3e`)** — the permission catalogue's **durable WRITE half**: a real table, a fail-soft service, and **all 7 real callers** recording the surface they judge. **(2026-10-09; code `workspace/starting-kit`; migration `Migration20261009205000.ts`; service [`packages/core/src/modules/auth/services/permissionSurfacesService.ts`](workspace/starting-kit/packages/core/src/modules/auth/services/permissionSurfacesService.ts); plan [`library/development/PLAN-P3b-permission-catalogue-persistence.md`](library/development/PLAN-P3b-permission-catalogue-persistence.md).)**

**What was built.** The catalogue's runtime registry had **zero live consumers** (rule 9b: persisting
the `Map` alone would have been *storage with no reader*), so row 9 was corrected into a **write half**
(record the surface a change *judges*) and a **read half** (read it back). This entry is the write half:
- **The migration** `Migration20261009205000` — `permission_surfaces` (id/tenant_id/surface_id/kind/owner/
  source/feature_prefix/created_at/updated_at/deleted_at) + a **partial unique index**
  `permission_surfaces_tenant_surface_uidx on (tenant_id, surface_id) where deleted_at is null`.
  `up()`/`down()` symmetric; **applied to `mercato-postgres-local` and measured back** (table + index
  confirmed, round-trip proven, cleanup 0 rows).
- **The entity** `PermissionSurfaceRecord` (`auth/data/entities.ts`).
- **The fail-soft service** `auth/services/permissionSurfacesService.ts` — `persistRecordedSurface` /
  `loadPersistedSurfaces` / `hydratePermissionCatalogue`; **never throws into the caller** (a persistence
  failure must not break the write it is recording).
- **All 7 real callers wired:** entities create (`lib/field-definitions.ts`), the **batch** definitions
  route, the two HTTP reactivation routes, `ensureCustomFieldDefinitions`, the custom-entity install
  primitive `upsertCustomEntity` (`lib/register.ts`), the `add-field` CLI, and the `runStructureChangeGate`
  path (`data/guards.ts` — `validate` now returns the surfaces in its metadata; the after-write recorder
  persists them).

**What proved it.** Affected suites **48 suites / 419 tests** green; full `core` **638 suites / 5600
tests** green; `core` `tsc` exit 0; **6 md5-verified RED-then-GREEN mutations** (M1 drop the surfaces arg;
M2/M3 drop the tombstone predicate; M4 drop surfaces from guard metadata; M5 batch stops persisting;
M6 batch uses the stale tenant) — **every restore md5-identical**; a **separate-agent hostile-critic
pass** found three real defects and a scope gap, **all fixed**: (D1/HIGH) the
`{ filters: { softDelete: false } }` predicate was **inert** (no such filter is registered anywhere → a
soft-deleted tombstone stayed invisible while the partial index allowed a second live row) — fixed by
writing `deletedAt: null` explicitly in both the upsert lookup and the boot read, plus a defensive clear,
pinned by a 3-test tombstone block; (D2/MEDIUM) the batch route's persistence had **zero coverage** — a
new describe block; (D3/MEDIUM) the "never downgrades a declared surface" test was **tautological**
(passed with hydration removed) — coupled to the change so it fails if hydration is inert; and the batch
persisted under the **stale `auth.tenantId`** while rows land under `scope.tenantId` — fixed to
`scope.tenantId ?? auth.tenantId` with a mismatch test.

**Remainder — SCHEDULED HERE, THEN CLOSED (rule 8 → rule 13).** The **read half**: at the time of this
entry `hydratePermissionCatalogue` / `listPermissionSurfaces()` had **no live consumer** and the app
bootstrap is synchronous with no tenant, so *"read back by the running app"* was **not met** — it was
scheduled as **`CC-43`** and row 9 was recorded **🟡**, not ☑ (rule 13 honest status). **`CC-43` is now
CLOSED and row 9 is ☑** — see the entry immediately below.

**Corrections made in the same change (rule 13).** The false `M3e` premise — *"a durable row waits on
`G-04`, since a migration is unprovable on this host"* — was corrected **everywhere**: `platform_points.md`
(§B `P3b`, §D `M3e`, row 9), `permission-decision-grant.ts:59`, `Migration20261009205000.ts`'s header,
and four sibling files that had copied the same claim (`core-boundary/core-objects.ts`,
`user-function/document.ts`, `business-widget/document.ts`, `business-widget/registry.ts`) plus the
`permission-decision-grant.test.ts` header. **Both halves were false:** `G-04` is the data-axis
authorization layer (unrelated to storing surfaces), and a migration **is** provable here.

---

### ✅ DONE — **Phase 3, row 9 (`P3b` / `M3e`)** — the **READ half**: a tenant-scoped reader for the permission catalogue, its live consumer route, and the closure of **`CC-43`**. **Row 9 is now ticked ☑.** **(2026-10-09; code `workspace/starting-kit`; new route [`packages/core/src/modules/auth/api/permission-surfaces/route.ts`](workspace/starting-kit/packages/core/src/modules/auth/api/permission-surfaces/route.ts); reader in [`packages/core/src/modules/auth/services/permissionSurfacesService.ts`](workspace/starting-kit/packages/core/src/modules/auth/services/permissionSurfacesService.ts).)**

**What was built.** The read half answers the row-9 second clause — *"read back by the running app"* —
without the cross-tenant leak a naive global-`Map` read would cause. **Declared** surfaces are global (a
module's features are identical per tenant); **recorded** surfaces are per-tenant. So the reader never
returns the raw map — it returns **declared + exactly this tenant's rows**:
- **`readTenantSurfaces(em, tenantId)`** — filters the catalogue to `source === 'declared'`, loads the
  tenant's persisted rows (the service's exact `deletedAt: null` predicate), records each back into the
  catalogue, and merges **declared-wins by id**. Returns `{ surfaces, recorded, error }`; **never throws**
  (a DB failure lands in `error`). With no tenant it answers from declarations only and does **not** query.
- **`GET /api/auth/permission-surfaces`** (NEW; `requireAuth` + `requireFeatures: ['auth.acl.manage']`) —
  the live consumer: `getAuthFromRequest` → `auth.tenantId`; `createRequestContainer()` → `em`; returns
  `{ items, recorded, error }`. **Fail-soft** — a DB/container error is reported, never a 500, and
  `container_error: …` is distinguished from `no_entity_manager` (a critic finding). Carries an `openApi`
  export. **The tenant-aware hook is the request** — the boot is synchronous and has no tenant, so this is
  the first point where `auth.tenantId` and an `EntityManager` both exist.

**What proved it.** The two read-side suites are **27/27 GREEN** (`permissionSurfacesService` **20** incl.
a 6-test *live consumer* block whose anti-leak test hydrates the map from tenant A and asserts tenant B's
answer stays 0; `permission-surfaces.route` **7**); full `core` **639 suites / 5620 tests** green; `core`
`tsc` exit 0; **5 md5-verified RED-then-GREEN mutations** — M1 service reads the raw global map
(cross-tenant leak → RED), M2 route drops the tenant (RED), M3 declared-wins dropped (RED), M4 route
swallows the error (RED), M5 service swallows the read error (RED) — **every restore md5-identical**
(baseline svc `7769a092e31e0cd1cf5aceeda0ae5fab`, route `22a74e530586a3e6f616939bf003d81c`); the route is
**mounted**, proven by `npx mercato generate` (the generated manifest is a **gitignored build artifact** —
the build regenerates it, so a fresh clone is fine); and the read side was **proven on the live DB**
(`mercato-postgres-local`, Postgres 17): record → **read back** `customers:loyalty_panel` → soft-delete →
**read gone** → re-appearance → **read present** (`LIVE_ROWS=1`) → cleanup **0 live rows**. A
**separate-agent hostile-critic** independently reverted the anti-leak line and confirmed the cross-tenant
test **fails** (`Expected: 0 Received: 1`) — the leak guard is real, not tautological; it found **no
cross-tenant leak** and flagged two honesty gaps, both fixed: the `hydratePermissionCatalogue` doc-comment
(its "so a boot can log it" framing was overstated — clarified to an honest *"nothing calls it today; kept
as the documented seam for the first tenant-aware boot"*), and the over-broad `no_entity_manager` (split
into `container_error: …` with a test).

**Why a full tick, not a partial.** Both halves of row 9's sentence — *stored* and *read back by the
running app* — are now built and proven; the only thing that does not exist is a **boot**-time hydration,
and that is **correct by design**, not a gap: the boot is synchronous and tenant-less, so the tenant-aware
hook *is* the request; the seam `hydratePermissionCatalogue` is kept and documented for the first
tenant-aware boot rather than deleted. `CC-43` is therefore **closed** (a closed callback is removed from
the register, not tombstoned).

---

### ✅ DONE — **Phase 3, row 7 (`P3`)** — roles & grants are **enforced on every write**, VERIFIED IN CODE, with a going-forward gate. **(2026-10-09; docs repo only — no code changed; tool `analysis/permission-gate/measure.js` + `FINDINGS.md`; `CC-44` scheduled.)**

**The task.** Row 7 — *"You can define roles and give them permissions, and the platform **enforces**
every one on every write — not just in the UI."* — was **🟡**, and its sub-point `P3a` was **☐ carried,
docs claim it, the code was not re-verified.** The job was therefore to **fact-check the code first**
(protocol step 4), not to build.

**What was measured.** Two independent mechanisms sit on the write path: the **feature gate**
(`metadata.requireFeatures` → the dispatcher `checkAuthorization`, `apps/mercato/src/app/api/[...slug]/route.ts:150`)
answers *may this actor do this?*; the **guard registry** (`runRouteMutationGuards` / `makeCrudRoute`)
answers *is this write structurally permitted?* and is what `D2-gap` measures (0 unguarded). D2-gap's
number says **nothing** about the feature gate, so a new instrument was built —
**`analysis/permission-gate/measure.js`** — which walks every write verb in every enabled module (the
enabled set read from `apps/mercato/src/modules.ts`). **Result: 169 write route files, 158 feature-gated,
5 guard-only, 6 neither — all six by design** (self-service `auth/profile`/`auth/locale`; signature/JWT
webhooks in `communication_channels`/`webhooks`; the `ratelimit_probe` ping). **Zero genuine
resource-mutating staff-facing writes lack a permission check.**

**Two honest corrections (rule 13).** (1) `P3a`'s **"Two-table ACL" was false** — the model is `roles` +
`role_acls` + `user_acls` + a `user_roles` join (three tables + a join); and the "typed permissions-catalogue
service" is two pieces (the `Map` catalogue + its persistence/read service), not one. Corrected in §B
`P3a`. (2) The gate is **opt-in, not default-deny** — the dispatcher enforces only when
`requiredFeatures.length > 0`, and that is **tested** behaviour
(`api-authorization.test.ts`: *"should allow any authenticated user when only deprecated requireRoles is
set (no feature gate)"*). A default-deny is a **new rule** needing an allowlist, so it is the **owner's
policy call**, scheduled as **`CC-44`** — not silently assumed.

**The durable deliverable.** `measure.js --check` **exits 1** when a write route is neither feature-gated
nor a named by-design exception, so the opt-in gap cannot widen silently; the six exceptions carry their
reasons in `BY_DESIGN_NO_FEATURE` (a reader re-verifies). **Mutation-proven:** an unfeatured probe route →
**FAIL (exit 1)**; declaring its feature → **PASS (exit 0)**. The tool **follows re-export shims** (the
`webhooks` shims were briefly misclassified NEITHER until the tool read through them — a tool fix, not a
repo defect). **Code repo unchanged:** the one non-by-design candidate (`sales/api/document-numbers`, an
inline `userHasAllFeatures`) is in a **parked** module (absent from the manifest), so a fix there is
unprovable today — it was **reverted rather than claimed** and recorded for when `sales` is enabled.

---


### ✅ DONE — **`A6`**: the current `main` is **built on the VM and deployed** to `companai.corprorate.com`, and **`A7`**: the real credentials are handed over. **(2026-10-09; new image `open-mercato/app:wan` = `4375447250e3`, built `16:13` on the VM; source tree `/home/ramzi/build-src`; DB export taken first.)**

> **In plain English.** The live site now runs today's code, not a two-day-old build. Nothing about the
> site changed for a user except that it is current: it still shows `<title>Companai</title>`, and the
> three logins work. **The credentials are real and proven** (see below). One thing you should know:
> **there is no one-click undo** — the build replaces the old image under the same name, so going back
> means rebuilding from an older copy of the source (that is written down in the runbook §5, and I have
> scheduled the missing safety net — see the finding below).
>
> **What proved it** (every line is a command's output, not a summary):
> - The build context bug that **failed the first attempt** was found and fixed: `update.sh` copied only
>   the *Dockerfile* and *compose file* into `/opt/companai-platform` and built there — but that folder
>   holds **no source** (`package.json`, `apps/`, `packages/`, `docker/scripts/` are all absent), so the
>   context transferred **2 bytes** and Docker failed on `COPY docker/scripts/mcp-entrypoint.sh: not
>   found`. The file existed on disk; it simply was not in the context. **Fix:** build with the source
>   tree as the context (`docker build -f "$SRC/Dockerfile" "$SRC"`). Context then transferred
>   **96.58 MB**, every `COPY` resolved, and the build ran to completion (50/50 runner steps, including
>   the `chmod +x …/mcp-entrypoint.sh` step that had failed).
> - **The running container is the new image:** `docker inspect companai-platform-app-1 --format
>   '{{.Image}}'` = `sha256:4375447250e3…` = the `open-mercato/app:wan` tag's id, byte-for-byte.
> - **The `AH-1` change is live in the running container:** `grep 'CORE_OBJECT_KINDS = '
>   …/dist/lib/core-boundary/core-objects.js` → `const CORE_OBJECT_KINDS = ["role", "agent"];`.
> - **The site answers, publicly:** `./verify.sh https://companai.corprorate.com` → loopback `/login`
>   **200** (484,989 bytes), public `https://companai.corprorate.com/login` **200**, title `Companai`;
>   DB `tables=141 users=3 database=open-mercato`.
> - **Every account logs in** (form-encoded `POST /api/auth/login`, the route's real contract):
>   `admin@companai.local` / `wM8ciC9i8OBIM30KLlh2` → **200** (JWT issued); the **same email with a wrong
>   password → 401** (the refusal is correct, not a coincidence); `admin@acme.com` / `secret` → **200**;
>   `employee@acme.com` / `secret` → **200**. *(An earlier probe returned `400` — that was my request being
>   sent as JSON; the route parses form-encoded form data only, so an empty email failed validation. The
>   credential was never the problem. Recorded so the next reader does not "fix" the wrong thing.)*
>
> **The real credentials (A7)** — proven against the stored bcrypt hashes *inside the container*, then
> proven again through the live login endpoint:
>
> | Role | Email | Password |
> |---|---|---|
> | superadmin | `admin@companai.local` | `wM8ciC9i8OBIM30KLlh2` |
> | admin (demo) | `admin@acme.com` | `secret` |
> | employee (demo) | `employee@acme.com` | `secret` |
>
> **Honest finding (rule 9a — own the code you touch).** `update.sh` **destroys its own rollback**: it
> rebuilds onto the *same* tag (`open-mercato/app:wan`), so the previous image is overwritten and
> **cannot be restored by id** (verified: `docker inspect 7624dc853abd` → gone). A deploy script must not
> do that. **Scheduled:** `CC-41` — tag the outgoing image with a dated tag (`:wan-<date>`) **before**
> rebuilding, so a rollback is one `docker tag` away. Until then the rollback path is the runbook §5
> rebuild-from-older-source, and the DB export is
> `/home/ramzi/db-backups/open-mercato_20261009T135447Z.dump` (2.4 MB, 890 TOC entries, 141 table-data
> sections — taken and verified **before** the build).

### ✅ DONE — `SD-4` / `SD-5`: the **structural permission grammar** (S11/S12) — the last slice, and the manage screen. **(2026-10-09, code `a2317b1`; plan [`library/development/PLAN-SD-4.md`](library/development/PLAN-SD-4.md); architecture [`library/development/ARCHITECTURE-structure-permissions.md`](library/development/ARCHITECTURE-structure-permissions.md).)**

> **One line proved it:** a person can, from a settings screen, set the level a structural change is
> permitted at — **per object × verb × actor** — and the value they set is the **same** value the CC-37
> structural guard reads at enforcement time (one home in
> `shared/src/lib/permissions/structural-settings.ts`, both readers over it).
>
> **What `SD-4` delivered, in four slices + the screen:** **A** the structural guard (a `core`/
> `platform_release` object may not be DROPped or re-typed — `entities.structural.core-object-guard`,
> code `6fbd605`); **B** the actor axis (S12 — `actorKind` reaches the guard, code carries it through
> both guard inputs); **C** the per-verb grammar (S11 — five verbs `read/add/edit/remove/reference`, the
> level's home in `structural-settings.ts`); **CC-37** the enforcement wiring (the guard reads the live
> setting and escalates an **explicit** `review`/`approval` rule to the D3 escalate outcome — D3's first
> production emitter); and **`SD-5`** the manage screen. **The honest boundaries stay named:** `read`/
> `reference` are declaration-only (CC-34); a raw DDL `DROP TABLE`/FK change is not a row write
> (CC-33); the approval-layer that would turn an escalation into a `pending_acts` row is CC-38.
>
> **`SD-5` — the manage screen (code `a2317b1`).** The roles-and-permissions-style surface over the S11
> block: **grouped by object kind** (`table/column/relation/function/widget/agent`), one **Select per
> (verb × actor)** offering the four levels (`straight/review/approval/never`) plus a distinct
> **"Inherited"** choice. Choosing "Inherited" **clears** the cell (removes the row → S11 inheritance);
> choosing a level sets it. The three pieces: the **pure data shape** in `shared` (grid / one-cell edit
> / equality — so the screen holds no rule of its own); the **route**
> `packages/core/src/modules/auth/api/structural-permissions/route.ts` (GET fail-closed through
> `loadStructuralSettings`; PUT validates with `parseStructuralSettings` → 400 on a bad body, passes the
> `auth` mutation-guard seam, writes `permissions`/`structuralPermissionLevels` via
> `moduleConfigService`); the **screen + page** in `auth` (`components/StructuralPermissionsSettings.tsx`,
> `backend/settings/structural-permissions/page.{tsx,meta.ts}`, gated `auth.acl.manage`,
> `pageContext: 'settings'`). **Why `auth` and not a new `permissions` module:** the setting's module id
> is a string, and the roles-and-permissions owner and `auth.acl.manage` are `auth`'s (S5).
>
> **The verification.** **68 tests** (49 shared + 11 route + 8 jsdom). `shared/src/lib/permissions`
> **4 suites / 110 tests** and `core` `configs`+`auth`+`entities` **140 suites / 1202 tests, 0
> failures**; both `tsc` exit 0. **6 mutations RED-then-GREEN (M21–M26), each restore md5-identical**
> (M21 the fail-closed fallback; M22 the `straight`-default refusal; M23 the clear-to-inheritance; M24
> the guard-seam skip; M25 the closed verb set; M26 the naive equality). **A hostile-critic pass (a
> separate agent) found 0 functional defects** and three things, all fixed: **(1) a TAUTOLOGICAL test** —
> `structuralSettingsEqual`'s "ignores raw-shape differences" test fed two values the parser had already
> normalised, so a naive `JSON.stringify`-equality mutation left it **green**; rewritten to a hand-built,
> raw-shape-*differing* pair and re-proven RED under M26. **(2) An unreachable `cellFor` fallback** that
> invented an `effective` level the grammar never produced — replaced with a fail-loud invariant. **(3)
> Asymmetric container error handling** — PUT resolved the container uncaught (a 500); now wrapped like
> GET's, fail-closed to a controlled 500 with no write.
>
> **Corrected at source (rule 13):** the two docs (`BACKLOG.md` `SD-4`/`SD-5` rows, `BUILD-ORDER.md`
> §Phase 0 item 8) that named the manage screen as the *remaining half* are now ticked — nothing else
> copied that claim.

---

### ✅ DONE — `SD-2b`: the **core object set is a superadmin SETTING**, not a hardcoded list (owner-ruled 2026-10-09). **(2026-10-09, code `fd170d1`; plan [`library/development/PLAN-SD-2b.md`](library/development/PLAN-SD-2b.md); design [`library/development/DECISION-core-object-set-as-settings.md`](library/development/DECISION-core-object-set-as-settings.md).)**

> **One line proved it:** the object→tier map lives in `module_configs` (`core_boundary`/`coreObjectTiers`), so
> a superadmin can move an object **between** the four tiers **from the UI with no deploy** — while the *rule*,
> the four tier names and the parser stay code. It **closes a measured hole**: `isSystemEntitySelectable('auth:user'
> | 'auth:role' | 'directory:tenant' | 'auth:session')` → **`false`** (before: a custom field could attach to
> `users`/`roles`/`tenants`/`sessions`, because the only block was a 7-id list that omitted them).
> `shared` **202/203 suites, 2424 tests** (the 1 red is the pre-existing `dynamicLoader` sandbox flake, CC-19);
> `core` **630 suites / 5479 tests, 0 failures**; both `tsc` exit 0; **10 disjoint mutations all RED** (each
> restore md5-identical); **two separate hostile-critic rounds**.

> **The form was a direct copy of `SD-3`/`tier-source.ts`** — seed (`DEFAULT_CORE_SETTINGS`) + strict parser
> (`parseCoreSettings → null` on any bad row) + pure decision (`resolveCoreTier`, own-keys only to defeat
> `__proto__`) + fail-closed async read (`loadCoreSettings`, never throws; falls back to the seed) — in
> `shared/src/lib/core-boundary/core-settings.ts`. **No new table, no migration.**

> **The two hostile rounds earned their keep.** Round 1 found a **CRITICAL bypass**: the selectability gate sat
> only on the two preset routes, while the **batch route**, the **`add-field` CLI** and the shared primitive
> `ensureCustomFieldDefinitions` wrote `CustomFieldDef` rows **without it** — fixed with one shared helper,
> `reservedEntityRefusal(entityId)`, called on **all four** write paths (batch, CLI, primitive, restore). Round 2
> then found the junk-only hole (a set of only unknown ids passed the empty-length check and reopened `auth:user`
> — fixed by a **substrate invariant**: the parser requires all 7 substrate ids present, so a setting may **add**,
> never **drop**, the substrate), the regression its own fix caused in a pre-mocked suite, and the ungated
> **restore** path (a tombstoned field could be resurrected onto a system table — now refused).

> **Honest limits:** the manage screen is **not** built (folded into `SD-5`); the structural guard (DROP/re-type/FK)
> is **not** built (rides `SD-4`); the core marker is still **by name** not a column (CC-31(a)) — **⚠️ CORRECTION
> 2026-10-09: this last limit is now CLOSED; see the DONE entry below.**

---

### ✅ DONE — `CC-31(a)`: the core role marker becomes a durable **`is_core` column**, and a core role can no longer be **renamed** away from its guard (owner ruled **Option B**, 2026-10-09). **(2026-10-09; code `workspace/starting-kit`; callback [`COMPLETION-CALLBACKS.md`](library/development/COMPLETION-CALLBACKS.md) CC-31 now closed.)**

> **The ruling, verbatim:** *"lets do option B. This way we may also end up having one main superadmin that is
> undeletable (the main one) but later we may add new superadmins that the main one can delete them by changing
> their names first… No one set a rule that forbids you from customizing the database. In fact, I am surprised
> you didn't do that yet… if there is a need to change the database schema, there is nothing preventing us during
> development from doing so as long as the changes are well thought and well executed."*

> **The blocker was FALSE and is retracted.** The item sat open on *"a durable `is_core` column needs a migration
> — unprovable on this host"*. **Measured:** a live Postgres 17 runs in `mercato-postgres-local`; the migration was
> **written, applied, and read back**. The false premise is corrected in CC-31, CC-7, CC-23, `PLAN-SD-1`, and
> `PLAN-SD-2` (rule 13), and the owner's directive is now **`WORKING-RULES.md` §1 rule 14**.

> **What landed.** `Migration20261009090000` adds `roles.is_core boolean not null default false`, backfills
> `lower(btrim(name)) = 'superadmin'`, and creates a partial index `roles_is_core_idx`. `Role.isCore` maps it with
> the exact column name. `coreObjectFor(kind, id, settings, { isCore })` makes the **durable marker win over the
> name — and over the setting** (otherwise a rename to a name the setting demotes would re-open the hole). New
> `refuseCoreRoleRename` / `assertCoreRoleNotRenamable` (409) are wired on the route's `update.mapInput` **and**
> the `auth.roles.update` command (the audit-redo path). The marker is stamped on the **seed** *and* on the **API
> create path** — the critic's HIGH finding: without it a setting-added core role created via the API was born
> `is_core = false`, so one rename fully unguarded it.

> **One line proved it (on the LIVE stack, not a mock):** after rebuilding `shared`+`core` in the container and
> restarting the app, a live round-trip through the rebuilt `Role` entity returned `isCore=true` for `superadmin`
> and **the guard refused both delete and rename with 409** (`code: core_role_unrenamable`), while `admin` and
> `employee` passed both — proving the column, the entity map, and both guards **together**. `core` guard suites
> **3 / 38**, `shared` core-boundary **2 / 57**, full `auth` **83 / 737**, both `tsc` exit 0; **4 mutations
> RED-then-GREEN** (M7 absent-name branch, M8 durable marker, M9 command guard, M10 create-path stamp), each
> restore md5-verified LF-only; **a hostile-critic pass as a separate agent** found the create-path HIGH and a
> mislabelled test (both fixed).

---

### ✅ DONE — `SD-2` / `S9`: **mark core functions and guard their deletion.** **(2026-10-09, code repo; plan [`library/development/PLAN-SD-2.md`](library/development/PLAN-SD-2.md).)**

> **One line proved it:** the built-in `superadmin` role (the roles-and-permissions manager, dictionary
> §C.3) is a **409 for every actor** on **every** delete path — route, command, **and** the audit-redo path
> that bypasses the route — and an ordinary role still deletes. `core` **630 suites / 5479 tests**, `shared`
> **201 / 2385** (one pre-existing environmental flake, CC-19), both `tsc` exit 0, **6 mutations all RED**,
> **two separate hostile-critic agents**.
>
> **The challenge (rule 9b) corrected the task before code was written.** *"A flag on the function record +
> a guard on the delete path"* had **no home**: the `UserFunction` artifact has no delete path and no
> persistence (`document.ts:22-28`), and no core/undeletable concept existed. But the dictionary's **named
> example** — the roles-and-permissions manager = the built-in **`superadmin` role** — **is** a live
> surface with a `DELETE`. So the rule was built where it can bite, and the Function flag was **deferred to
> `G-09`, scheduled** (CC-32).

---

### ✅ DONE — `SD-1`: the **S2 permissions gate** (Phase 1). **PARTIAL — the decision core AND the enforcement are built, tested and mutation-proven; the remaining paths are scheduled. Plan: [`library/development/PLAN-SD-1.md`](library/development/PLAN-SD-1.md).**

> **If you are a new agent, read only this block to know your job.** Everything below the box is the
> history and the queue; this is the work in hand.

**What `SD-1` is, in plain words.** When a **new data structure lands** — a table, a column, a field-type
change — the platform **must not apply it until the permissions for the new surface are decided**. Either
a person decides, or the default applies (full grant to the superadmin role **+ the permission records
created**). It is the gate that makes the *structural grammar* (SD-4) real: a permission surface cannot
appear un-gated, and it is the gate a **Hermes-proposed schema change** must pass — the AI proposes, the
gate decides, and there is no way around it.

**Where it stands (2026-10-08) — read this before doing anything.** **The decision machinery and the
enforcement are built and proven, on every create path.** *The decision:*
`shared/src/lib/permissions/catalogue.ts` (the permission catalogue — surfaces and the two blocks they
yield) and `structure-change-gate.ts` (`evaluateStructureChange` → `decided | defaulted | refused`, pure,
fail-closed). *The hook:* two `MutationGuard`s on the entities `create` path (`entities/data/guards.ts`)
block a create the gate refuses. *The enforcement (the step that was missing):*
`auth/lib/permission-decision-grant.ts` **writes** the gate's `defaulted` records into the tenant's grant
role's `role_acls.features_json` (idempotent set-union, S5), wired in the guards' `afterSuccess` and
carried from `validate` to `afterSuccess` by the real `runMutationGuards` runner — **and run directly by
the batch definitions route** (`entities/api/definitions.batch.ts`) for the columns it creates, because
the registry maps that route to `'update'` with no field list, so a create-only guard can never see them —
**and run in the shared primitive `ensureCustomFieldDefinitions`** (`entities/lib/field-definitions.ts`,
the choke point behind seven callers) **plus the `add-field` CLI** for the non-request paths, deciding
before the create and granting after the flush — **and run at the two HTTP *reactivation* routes**
(`api/definitions.ts` and `api/definitions.restore.ts`: a tombstoned field brought back is a surface
re-appearing, gated from the before-state and granted after the flush — CC-22, 2026-10-08) — **and run in
the entity-install primitive `upsertCustomEntity`** (`entities/lib/register.ts`: a custom **entity**
appearing is a surface appearing, gated before the row and granted after the flush, with the **live**
`entities.records.<id>` records — CC-21, 2026-10-08) — **and run at all three field write sites on a
*type change*** (`existing.kind !== incoming.kind`: a re-typed field is a surface changing shape; the
before-state exists at each write site, so the shared guard contract was not touched — CC-4, 2026-10-08) —
**and the merge into `role_acls.features_json` is now atomic** (one SQL `UPDATE`, `jsonb ||` deduped by
`group by elem` with first-occurrence order, `returning` so the DB is the source of truth — no lost update
under a race; proven against live Postgres 17 with a concurrent-session test **and** a negative control —
CC-16, 2026-10-08) — **and the batch path now names every key it writes** so the reserved-key guard runs on
it (`keys: definitions.map(d => d.key)`; the guards read the list via the new `readFieldKeys`; the measured
hole was the *reserved* key — a malformed key was already refused by zod 400 on both routes — CC-18,
2026-10-08) — **and the `decided` outcome is now reachable and writable** (a caller may *state* the decision
instead of accepting the default: the carrier `shared/src/lib/permissions/structure-change-decision-header.ts`
reads a three-way `x-om-ext-permissions-decision` header — `absent` / `malformed` / `decision` — **fail-closed**,
so a malformed header is a **400**, never a silent default; a **stated** decision grants its records to the
role it names (`grantTo`, defaulting to `superadmin`). Both write sites that only accepted `defaulted` now
**also** write a `decided` one: the **guard** (read from `input.requestHeaders` in `validate`, carried to
`afterSuccess`) and the **three HTTP route** paths (read from `req.headers`). The third primitive path
(`register.ts`) and the field choke point correctly **cannot** see a request header and still default —
CC-17, 2026-10-08).

**133 SD-1 tests; 56 mutations RED-then-GREEN across twelve slices, each restore md5-verified; `shared`
197/2329 — 8 fail in the one suite of CC-19 (a host process-creation failure, not code), `core` 627/5438
green **six consecutive times**, typecheck 0.** **Ten** hostile-critic passes plus four
mutation/premise-found defects (thirty-one real defects) — all fixed or named (`PLAN-SD-1.md` §9).

**It is still PARTIAL — but ALL headline limits are closed.** A gate that decides but does not record was
not yet a gate; it now records. The path the field-management UI mostly uses — the **batch** route — was
ungated; it now runs the same gate. The **non-request** field paths (module install / seeds / the
`add-field` CLI) were ungated; they now run it in the shared primitive. The **HTTP reactivation** paths
(single + restore) were ungated; they now gate at the route. A **custom entity created by the module
install** was ungated; it now gates at the primitive. A **field-type change** was ungated; it now gates at
all three write sites. The **ACL merge** could lose an addition under a race; it is now atomic. And the
**batch path could define a field on a system column** (`id`); it now refuses it. And the **`decided`
outcome** — S2's *"either by a person"* — is now reachable and writable from every request path. What
remains is **the enforcement consumer, the unauthorised decision actor, the create-branch double-insert,
and a test-store reset** — every one scheduled in
[`COMPLETION-CALLBACKS.md`](library/development/COMPLETION-CALLBACKS.md):
1. **Give a custom *field*'s records an enforcement consumer** — SD-1 writes ACL rows nothing reads yet. **(CC-20)**
2. **Gate the custom *entity*'s HTTP reactivation** — **✅ DONE 2026-10-08 (CC-24).** It was: the entity gate is `operations:['create']`, but the route maps a reactivation to `update`, so it never fired. The route now gates it from the before-state, refuses fail-closed (422), and writes the records after the flush — the CC-22 shape for the field twin. **The mutation pass found two real harness defects** (an unpinned `deletedAt` clause, now pinned in both consumers; and a leak into the `globalThis` guard store, now restored and widened into **CC-29**). 11 tests; 6 mutations RED-then-GREEN; a ninth hostile-critic agent found nothing falsifiable. `PLAN-SD-1.md` §9.11.
3. **Authorise the decision actor** — **CONFIRMED by the owner (2026-10-08): it is a ROLE PERMISSION** (the platform's own model, `role_acls.features_json`) — a build, not an open policy. **(CC-25)**
4. **Close the create-branch double-insert** — a first grant onto a role with no ACL row can create two rows; needs a unique index `(role_id, tenant_id)` (a migration, deferred). **(CC-23)**
5. **Reset the mutation-guard store before every test** — **✅ DONE 2026-10-08 (CC-29).** A `resetMutationGuards()` clears both the module-local cache and the `globalThis` slot, and `core`'s `jest.setup.ts` calls it in a root-level `beforeEach`, so every **test** starts clean. **The stated mechanism was disproved by measuring** — the store does *not* leak across test files (each file gets its own realm); the real leak is *within* a file. 5 consecutive full-suite runs green + a 6th on the final tree (627 suites / 5438 tests); 2 mutations; the tenth hostile-critic agent held all five claims and found three false statements in my own comments, all fixed. `PLAN-SD-1.md` §9.14.

**Two organisational questions were answered and CONFIRMED (2026-10-08), and produced three more items.**
The platform's AI **actor** is already a first-class principal (`api_keys.principal_kind = 'ai_worker'`);
what is missing is the **UI** (CC-26) and the **agent ↔ AI-user binding** (CC-27) — both approved. The
tenant model is **single-DB / shared-schema / `tenant_id`-column with no RLS**, and a per-tenant structure
change is a **row, not DDL**, so it cannot leak to another tenant's schema — but one real cross-tenant
`updated_at` read was found and is fixed as **CC-28**, and the **write-side sibling of that same shared
table then shipped as `CC-30`**: the `custom_entities_storage` upsert's conflict target, measured on live
PG 17 to match **no constraint at all** (legacy index non-unique *and* missing `tenant_id`), so the
single-statement upsert had never run and the `try/catch` fallback silently did the work. Fix = one plain
4-col unique index + three partial indexes for the null-scope shapes. Full reasoning:
[`analysis/ANSWER-2026-10-08-organisational-questions.md`](analysis/ANSWER-2026-10-08-organisational-questions.md);
CC-30's measurement and shape: [`library/analysis/findings/cc30-custom-entities-storage-uniqueness.md`](library/analysis/findings/cc30-custom-entities-storage-uniqueness.md).

**Read first (before continuing):** [`PLAN-SD-1.md`](library/development/PLAN-SD-1.md) — the plan, the
critics' thirty-one defects (§9) and the honest limits (§10) — and the completion register
[`COMPLETION-CALLBACKS.md`](library/development/COMPLETION-CALLBACKS.md) (the owner's 2026-10-08 standing
instruction: always schedule a partial build's gap, prerequisite and callback). Then the same discipline
as `S-02`/`D3`: fact-check what exists, name the honest boundary, then plan → execute → verify → document.
**Do not assume the roadmap is right — re-measure it.**

**Next after `SD-1` (`BUILD-ORDER` order) — two startable-now items now DONE.** **The next *undone*
slice in BUILD-ORDER order is `SD-2` / `S9` (mark core functions and guard their deletion — the
roles-and-permissions manager is the named example; startable now, `G-07` is done), then `SD-4`/`SD-5`
(the structural grammar screen).** **CORRECTED 2026-10-09 (rule 13 — a falsified premise, fixed where it
was copied): this line used to name `SD-3` first — but `SD-3` is ALREADY BUILT (2026-10-06, verified,
`BACKLOG.md` ticks it `[x]`).** Every other document (HANDOVER §8, START-PROMPT, RESUME-POINT §3, README,
INDEX, the CC-30 entry below) was corrected on 2026-10-08; **this box paragraph was the one surviving
stale copy** — and it is the one place the convention declares authoritative, so it mattered most.

**Ahead of those, two small startable-now items were done by the owner's approval (2026-10-08):
`CC-26` — the "AI user" tick
is in the API-key create form** (the UI for a server capability that already existed:
`api_keys.principal_kind = 'ai_worker'`), **and `CC-28` — the custom-record `updated_at` read-backs now
scope by tenant** (the batch path was the live cross-tenant hole; the single path was defence-in-depth). **The
box no longer carries a startable-now item: **the two `S-03`-free CC items the owner approved are both done —
`CC-26` and `CC-28` — and their write-side sibling shipped as `CC-30`** (the `custom_entities_storage`
upsert conflict target, §4.5 of the tenant-isolation forensic; see the dated entry below). **`CC-20`,
`CC-23` and `CC-25` remain behind `SD-1`'s own gates** (`G-04`, a migration, and the confirmed
role-permission build respectively).

---

### ✅ `S-02` — wire the resolver as the **Hermes tool door**'s enforcement point. **DONE AND PROVEN (code `3add3a2`; plan [`library/development/PLAN-S-02.md`](library/development/PLAN-S-02.md)).**

**What it is, in plain words.** Where an **AI's tool call is authorized**. A human write is checked by a
mutation guard; an **agent** tool call has to be checked by the authority engine before it runs, and this
is where that happens. The authority resolver was real but **shadow-mode** — *"It does not enforce.
Nothing calls it in the request path."*

**What was measured.** The tool door authorized with a **parallel check the resolver never saw**:
`executeTool` asked `rbacService.hasAllFeatures` — a synchronous string match — and **never** consulted
`AuthorityEnforcementService`. `packages/ai-assistant/` had **zero** references to
`authorityEnforcement` / `resolveDecision` / `Decision`. So the single decider every other act goes
through, and the only place the **responsible-user intersection** is computed, was absent from the AI
door.

**What was built.** `packages/ai-assistant/src/modules/ai_assistant/lib/tool-authority.ts` —
`checkToolAuthority(toolName, requiredFeatures, context)`. It asks the **same** enforcement service the
command gate asks, with the same `onBehalfOfUserId`, and reads the same `Decision`. It runs **after** RBAC
(so it can only narrow — invariant **I4**) and **fails closed** when the resolver is unreachable — the
source study's named warning, *"fail closed, or do not ship the switch."* It is called from **both** places
a tool handler runs: `executeTool` (every HTTP/MCP/agent call) **and** the pending-action **confirm** path
— which, until the first hostile-critic pass, executed a confirmed act with the RBAC check alone.
`McpToolContext` gained `onBehalfOfUserId`, populated at every door that resolves a machine subject.

**Two hostile-critic passes — both found real defects, all six fixed.** (1) a **real bypass**: the confirm
path ran a tool handler ungated; (2) a **dropped field**; (3) **two over-claims** in the docstring;
(4) a **dead field** carried into a context that never consults the resolver (removed); (5) a **backwards
direction claim** — omitting an invoker *removes a ceiling*, so it is **wider**, not narrower; (6) a
**stale docstring**. Full detail in `PLAN-S-02.md` §9.

**Proved by.** 14 new tests + 5 confirm-path tests; **six mutations** proven RED-then-GREEN (each reverted
and md5-verified byte-identical). Full ai-assistant suite **102 suites / 1434 tests, 0 failures**; `core`
auth **275**; `shared` authority **114**; typecheck **0**. `enforce` is **not armed** for any tenant — the
door is capable and fail-closed; the switch stays the operator's.

---

### ✅ `GAP A / C5` — the **Metadata Registry** — the last Phase-0 foundation item. **DONE AND PROVEN (code `59ab859`; plan [`library/development/PLAN-metadata-registry.md`](library/development/PLAN-metadata-registry.md)).**

**What it is, in plain words.** The platform had a **vision of its own shape** it could not *answer
questions about*. The kernel (`packages/shared/src/lib/kernel/model.ts`, 407 lines) **builds** a canonical,
versioned model — every entity, field and relationship, keyed by a stable canonical id — by **reading**
what modules declare. But it was a **view**, not a **service**: nothing could ask it *"what exists? who
owns it? what depends on it? who can access it?"* (blueprint §54). **The registry is that service** —
read-only (an *inventory*), over the kernel's model.

**What was built.** `packages/shared/src/lib/kernel/metadata-registry.ts` (new) + its test. It answers the
§54 questions the declarations **support** — **what exists · what type · provenance · what depends on it**
(a transitive reverse-edge closure over **declared** relationships, carrying an explicit caveat) — and for
the other **ten** §54 questions it returns a **typed absence** `{known:false, question, reason}`, never
`undefined` and never `[]`, with a **measured** reason for each. So the *shape of the gap* is queryable
rather than hidden.

**Design invariants, each pinned by a test:**
- **A live view, not a snapshot** — the descriptor is read **at query time** (a hostile-critic pass caught
  an earlier draft that indexed at construction: a *copy* that contradicted the docstring's "a stale
  registry is impossible").
- **§54 coverage** — answered ∪ unanswered = **all 13** questions, checked against an **independent** list
  (the first version of this check was **tautological** and could not detect a dropped question — also
  caught by the critic).
- **No second source of truth** — a pure function of the descriptor.

**The honest scope boundary.** GAP A is **two halves**: the `Resource` **envelope** (part 1, `C1`) and the
registry **service** (part 2). Only part 2 is built. The envelope is a **Phase −1 contract**, and writing
the type with no consumer would be the "contract after the code" failure — so the registry exposes
envelope-shaped facts where they exist and reports the rest as typed absences. The registry is **not
tenant-scoped by construction**: it describes the platform's *shape*, which is not tenant-owned (the rows
are, C3 / query layer), so there is no cross-tenant read to refuse; adding a tenant parameter is deferred
to the day per-tenant overrides exist. **And it is not yet consumed** — `SD-1`'s gate can now *enumerate*,
but does not call it yet.

**Proof (RED-then-GREEN, 4 disjoint mutations).** 25 assertions across 6 groups. Each mutation turns its
target test RED: the dependents closure · the typed-absence path · the snapshot-vs-live-view · a dropped
§54 question. Restored byte-identically each time. Shared + core typecheck 0; kernel suites 6/6 (76 tests).

---

### ✅ `D3` — give the guard result a third outcome, **`escalate`**. **DONE AND PROVEN (code `ba8a25c`; plan [`library/development/PLAN-D3-escalate-outcome.md`](library/development/PLAN-D3-escalate-outcome.md)).**

**What `D3` is, in plain words.** The platform's write check ("mutation guard") could answer only
**yes** or **no**: `MutationGuardResult.ok` is a boolean. So a guard that wants a *person* to look at a
change before it happens had to lie — it sent `ok:false`, a **hard refusal**, which collapses two
different facts ("this is forbidden" and "hold this for review") into one and turns a quiet review tier
back into a wall. **D3 adds the third answer: `escalation`** — *"do not run this yet; a person must
decide."* It is `ok:true` **and** an `escalation` block, and the runner treats it as **not performed**:
no mutation runs, no `afterSuccess` fires, no payload is offered back. Fail-closed both ways.

**Why the guard cannot file the pending act itself (and does not try).** The platform already has the
pending-approval machinery (`authority_pending_acts`, `PendingActService.hold()`, `ActReviewService`),
but it is fed by the **command path** (`auth.authority-command-gate` in `interceptors.ts`) because a pending
act needs a **`commandId`** and a **`capabilityId`** to be replayed on approval. A mutation guard has
**neither**. So the guard **defers** — it returns the escalation; creating the act stays exactly where
the command identity already lives. **Owner-confirmed: guard-level escalate, additive only, no
command-path change.**

**What was built (additive — a guard that never sets `escalation` behaves exactly as before):**
- `packages/shared/src/lib/crud/mutation-guard-registry.ts` — `MutationGuardEscalation` `{gate, rule, because, status?}`;
  `MutationGuardResult.escalation?`; `runMutationGuards` returns early on it (ok:true, **no** `afterSuccess`,
  **no** `modifiedPayload`, short-circuits the chain); the runner's return is now the **named** type
  `MutationGuardRunResult`.
- `packages/shared/src/lib/crud/route-mutation-guard.ts` — `RouteMutationGuardEscalated`
  `{escalated:true, ok:true, errorStatus, escalation, response}`; a literal `escalated:false` discriminant on
  `Blocked`/`Passed` so `!result.ok || result.escalated` narrows in one condition; default status **202**
  (accepted, held — never a 2xx that implies the write landed).
- `packages/shared/src/lib/crud/factory.ts` — all **6** direct `runMutationGuards` write sites
  (create · update ×2 · delete ×2) return `{status:'pending_review', escalation}` when the guard escalates.
- **Every consumer** widened to `!guardResult.ok || guardResult.escalated` — the wrapper-path callers, plus
  the **raw-registry** callers the hostile-critic pass exposed (below).

**Step 5 proof (RED-then-GREEN, 3 layers — registry · route wrapper · factory mutation proof).** 11 new
assertions: an escalating guard yields `escalated:true`, **no** `runAfterSuccess`, **no** `modifiedPayload`,
**no** DB write, **no** event, **202 `pending_review`** — on POST, PUT **and** DELETE. All 11 go **RED** when
the escalation branches are neutralised (`if (false)`) and pass **byte-identically** after restore (md5
verified). **shared: 194 suites / 2278 tests green.** Typecheck **shared · core · scheduler · search ·
webhooks = 0 errors**.

**The hostile-critic pass found a REAL hole, and it was closed.** The wrapper path was escalation-aware, but
**7 raw-registry sites** called `runMutationGuards` **directly** through helpers whose *declared* return type
**dropped `escalation`** — so callers checked only `!ok` and **would have committed on an escalate**:
`configs/api/cache/route.ts`, `{staff,messages,payment_gateways,integrations}/api/guards.ts`, and
`sales/quotes/{send,convert}/route.ts`. **Fix at the source:** all 6 helpers now return
`MutationGuardRunResult`; **36 consume sites across 32 files** widened; `configs/cache` (the one inline call)
got an explicit branch. **Parked-module caveat, stated plainly:** `staff`/`payment_gateways`/`sales` are
**PARKED** — excluded from `tsconfig.json`, tests not run — so 21 of the 36 sites are proven only by an
isolated `tsc --noEmit` (**0 syntax errors**) + review, **not** by the package typecheck. The `messages` (11)
and `integrations` (4) sites are in **enabled** modules and ran green (71 suites / 378 tests). **Each open
note now has an owner** — the parked sites and the "no guard emits escalation yet" criterion are backlog
rows with triggers (`BACKLOG.md`, deferred-by-decision table).

**What is deliberately NOT done (additive-only boundary).** No guard in the repo emits `escalation` yet —
the feature is **latent by design**; what changed is that the **first** escalating guard will be honoured,
not ignored. No `authority_pending_acts` row is created from the guard path (see above).

**The 1 pre-existing core failure it exposed is now FIXED** (code `9068f70`): the coverage guard matched
raw file text, so a **comment** naming the helper counted as a call site (lesson **L91**). Fixed by
stripping comments before matching; proven tightened-not-hollowed (a scan showed 16 raw vs 15 code hits —
only the comment differed; injecting a real call turns the test RED, reverting turns it GREEN). **Core
suite now 617 suites / 5321 tests, 0 failures.**

**Next after D3 (BUILD-ORDER order).** The **Metadata Registry (GAP A / `C5`)** — the box above — then **`S-02`**.

---

### ✅ D2-gap — the write routes that called **no** guard. **COMPLETE — the write-verb sweep closed 0 unguarded across all 35 enabled modules** (code `7494fbe`; analysis `analysis/d2-gap/`; full chain in `BUILD-ORDER.md` §2f and `BACKLOG.md` item **D2-gap**).

SIXTEEN modules DONE (`audit_logs`, `ai_assistant`, `auth`, `business_rules`, `inbox_ops`, `workflows`,
`attachments`, `search`, `directory`, `progress`, `webhooks`, `configs`, `currencies`, `entities`,
`scheduler`, `communication_channels`), plus TWO findings that were NOT D2-gaps (a registry-bypass class; a
mis-labelled module), ONE re-measure that closed four "leftover-verb" modules (two wired, two set aside as
read-only), and ONE module set aside as actor-less (`onboarding`). The LAST module `communication_channels`
closed **4 → 0**. A hostile-critic pass then found a **NEW class the scan could not see — a GET that
WRITES**: one fixed (the `communication_channels` oauth callback), two set aside as a named class — read
side-effects (`dashboards/api/layout`, `messages/api/[id]`), owner-settled 2026-10-07.

**The measurement (re-runnable, so it cannot rot):** 35 enabled modules · **256 write verbs** ·
**0 unguarded now** (160 before the `audit_logs` fix … 4 before the `communication_channels` fix) ·
8 auth-flow verbs set aside · **5 actor-less verbs set aside** · **7 read-only "write verbs" set aside** ·
**9 guard-system verbs set aside** · **227 guarded** (142 wrapper · 1 registry · 35 crud · 43 local helper ·
6 re-export; closure `142+1+35+43+6+0+8+5+7+9+0+0 = 256`). **PLUS a class the method-based scan cannot count
— a GET that WRITES: 3 found, 0 unguarded — 1 fixed, 2 set aside by name as read side-effects.**

**Fix 1 of the sweep — `audit_logs` DONE and PROVEN (code `4ef5812`).** Both write routes
(`audit-logs/actions/undo` POST, `actions/redo` POST) called **no guard at all**. New wrapper
`beginAuditLogsMutationGuard`; both routes now run `runRouteMutationGuards()`. **2 unguarded verbs →
0.** The one design decision: the guard is evaluated against the **log entry's own `resourceKind`**
(fallback `audit_logs.action_log`), because undo/redo **reverse or replay a write to that resource** — a
guard for e.g. `directory.organization` must see the **undo of an organization write**, or the one path
that can **reverse** a protected change is the one path no guard describes. `resourceKind` is read from
the row, never guessed. The routes' own authorization is untouched. **7 new tests; three disjoint
mutations proved they bite** (undo block path → block test RED; undo guard call → the 4 undo-guard tests
RED; redo guard call → redo test RED), wrapper restored byte-identical; `audit_logs` 16 suites / 108
tests green; core `tsc --noEmit` exit 0.

**Fix 2 of the sweep — `ai_assistant` DONE and PROVEN (code `0af50c8`).** The largest `D2-gap`
module (**24 unguarded verbs across 19 files**) and the **Hermes-facing** one. New wrapper
`beginAiAssistantMutationGuard`; the 10 **resource-write** files now run `runRouteMutationGuards()`.
**24 unguarded verbs → 9.** The 24 were **not** all the same thing: **(a)** 15 resource writes → guarded;
**(b)** 7 session/flow verbs set aside by name (`ai/chat`, `ai/run-object`, `route`, `chat`,
`session-key`, `mcp-key`, `tools/execute`) — chat completion, transport and credential minting, governed
by their own mechanisms (rate limits, short-TTL keys, per-tool feature checks); **(c)** 2 pending-action
gate verbs set aside by name (`ai/actions/[id]/confirm`, `ai/actions/[id]/cancel`) — the AI
mutation-approval gate, whose `runPendingActionRechecks()` re-verifies status, expiry, agent
registration, features, **mutation policy**, tool whitelist, tenant scope, record version and schema
drift. **15 + 7 + 2 = 24.** `resourceKind` is shaped `ai_assistant.<entity>` (settings / allowlist /
agent_override / conversation). **As with `audit_logs`, every route's own checks are untouched** —
`metadata.requireFeatures`, the inline ACL check, Zod validation, tenant scoping and ownership. **The
`loop-override` DELETE guard runs only on the path that actually writes** (a no-op clear has nothing to
govern — the `inbox_ops` precedent). **30 new tests; three disjoint mutations proved they bite**
(wrapper `afterSuccess` joint severed → the 4 `afterSuccess` tests RED; wrapper block path neutered →
the 9 block tests RED and nothing else; guard call removed from one route file → that route's 2 PATCH
tests RED, the DELETE test on the same file green), every file restored byte-identical; `ai_assistant`
**99 suites / 1306 tests green** (2 suites fail only on a **pre-existing** `isolated-vm` native-binding
absence on this Windows box, unrelated to the change); app-level `typecheck` exit 0.

**Fix 3 of the sweep — `messages`: a REGISTRY-BYPASS, not a D2-gap. The premise was measured first and
it was FALSE, so 11 files were NOT spent on a fix for a defect that was not there (code `1f1b60e`).**
`messages` was measured as **17 unguarded verbs / 11 files** — the largest `D2-gap` module left — and the
literal fix (the one `audit_logs` and `ai_assistant` took) would have wrapped all 11 files in a second
guard layer. **But every one of the 17 verbs already calls a guard** (`runMessageMutationGuards()`) — so the
`D2-gap` definition (*"call no guard whatsoever … checked by nothing"*) did not describe them; the tool read
them as GAP only because the file references **none of the four symbols** it scans for. **The real defect
was in the helper:** `messages/api/guards.ts` built `runMutationGuards([legacyGuard], …)` — a **one-element
array** — so the global guard store (`getAllMutationGuardInstances()`) was **never consulted**. That is the
**same one-way failure as the deprecated pair** (`D2-wide`), reached through a module-local helper. **Six
more places had the identical line**, found by grepping **every `bridgeLegacyGuard` call site** rather than
the four symbols: `integrations`, `payment_gateways` (parked), `staff`, and inline copies in
`sales/quotes/convert`, `sales/quotes/send` and `configs/api/cache`. **All seven now build the array the way
`collectAndRunGuards()` does** — registry first, then the bridged legacy service. **Latent, not live:** only
`customer_accounts`/`customers`/`entities` register guards, none for these resource kinds, so no write was
reachable by a guard a bypass could skip. **Test:** `modules/__tests__/local-guard-helpers-registry.test.ts`
(cross-module, 16 tests) drives all four helpers through the **real** store with a **real** guard and asserts
it is **called** and can **block**; **proved RED by mutating ONE helper (`staff`)** → exactly that helper's 2
registry-path tests RED, the other 12 green. `messages` **17 → 0**, `integrations` **4 → 0**; total
**143 → 122**. **The tool gained a fifth class `GUARDED_LOCAL`** so the figure stops over-claiming — **and its
header states the limit: it proves a guard CALL, not a *registry* guard.**

**Fix 4 of the sweep — `communication_channels`: NOT a D2-gap either. The label said 15; the artefact said
11 were guarded all along, and the TOOL was the defect, not the code (repo `workspace/starting-kit`
UNCHANGED at `1f1b60e`).** Measured as the **largest remaining module (15 unguarded verbs / 15 files)** —
so the literal fix would have wrapped all 15. **Measuring the premise first showed it false for 11 of
them: 11 of the 15 verbs already call `validateRouteMutationGuard`**, the module's own helper in
`lib/route-mutation-guard.ts`. That helper is **not** the legacy-only shape — it calls
`runRouteMutationGuards` → the **registry** plus the bridged legacy guard. Where `messages`' helper was
**wrong** and needed fixing, this one was already **right**; the only defects were the **label** and the
**tool not knowing the helper's name**. **Two routes agree on the 11/4 split:** (1) the artefact, route by
route — 11 files reference the helper, each with exactly one write verb and one guard call (11/11, 1:1),
the other 4 hold 4 verbs and no call; (2) the tool's own `--json` rows matched against each file. **The
helper is registry-backed — proven by its own test** (`lib/__tests__/route-mutation-guard.test.ts`
registers a real guard and asserts the helper **blocks** on it and fires its `afterSuccess`). **The 4
left are each named and set aside on evidence — none a D2-gap:** `oauth/initiate` (0 DB writes — issues a
redirect + state cookie), `webhook/[provider]` and `webhooks/gmail` (unauthenticated by design — the
**signature / Google-signed JWT IS the auth** — 0 DB writes, they only **enqueue**), and `test-seed`
(does write, but **env-gated off in production**: `isTestChannelSeedingEnabled()` returns 404 **at line
97, before any write**). **The fix was to the TOOL** — `validateRouteMutationGuard` added to
`LOCAL_GUARD_HELPERS` (after proving it reaches the registry). `communication_channels` **15 → 4**;
**total 122 → 111**; guarded **134 → 145**; closure **65+0+35+32+5+0+8+111 = 256**. `communication_channels`
**58 suites / 558 tests green**. **The standing lesson: the D2-gap label is a four-symbol string scan — it
can read a guarded route as GAP; measure the premise the label names before spending files on the fix it
implies, and teach the tool a helper's name only after proving the helper reaches the registry.**

**Fix 5 of the sweep — `auth`: a REAL `D2-gap` (the label was right), but NOT an authorization hole
(the implication was wrong). DONE and PROVEN (code `8e1632c`).** Measured as **12 unguarded verbs across
10 files** — the largest remaining module. Unlike `messages` and `communication_channels`, the label was
**true on its face**: these routes really did call **no guard of any kind**. But the thing a reader would
conclude from that — *"a write there is checked by nothing"* — was **false**, and saying so is part of
the record: **every one of the twelve already enforced its own capability** (`metadata.requireFeatures` —
`auth.delegations.manage`, `auth.denials.manage`, `auth.authority.approve`, `auth.records.lock`,
`auth.trust.promote`, `auth.acl.manage`, `auth.sidebar.manage`) **and wrote its own audit entry**. What
was missing is the **structural guard chokepoint**, not authorization. **No new wrapper was needed —
`auth` already ships `beginAuthMutationGuard()`;** all twelve verbs now call it **after** the route's own
auth/validation gates and **before** the write, with `guard.runAfterSuccess()` after commit. Ten files
touched. **Two routes agree on the count:** the tool's `--json` rows read **12 GAP / 10 files**, and the
module's own `api/mutation-guard.ts` header — written **2026-10-06, before this work** — records
*"12 unguarded resource-writes across 10 files"* with the same six file names; neither derived from the
other. **The security gain is narrow and is stated narrowly:** `auth` ships **no `data/guards.ts`**, so
**no `auth.*` guard exists in the registry today** — the wiring means the **first** one ever written is
**enforced** rather than silently skipped; it does **not** mean these routes were open. **A latent defect
found while wiring, and fixed:** `sidebar/variants` POST ran its guard **inside** the `try/catch` that
turns a unique-constraint violation into a `409 duplicate_name` — so a **blocked** mutation would have
been **re-reported as a duplicate name**. The guard now sits outside that `catch` (the `variants/[id]`
handlers and the five `authority/*` routes have no such trap — checked). **Proof — two disjoint
mutations, not a mock:** `api/__tests__/d2-gap-wiring.route.test.ts`, **29 tests**, registers a **real**
guard in the global store and drives the **real** handlers: mutation 1 (**block**) — the guard refuses
and the **write never happens** (asserted by the service stub's call count, not the response alone);
mutation 2 (**allow**) — the write happens **and** `afterSuccess` fires **exactly once**. All twelve
verbs in both directions. **`auth` 12 → 0** (wrapper class **1 → 13**); **total 111 → 99**; repo wrapper
**65 → 77**; guarded-only **137 → 149**; closure **77+0+35+32+5+0+8+99 = 256**. **`auth` 79 suites / 682
tests green**; core `tsc --noEmit` exit 0. *(A closure scare read 251 — the missing five were
`webhooks`' `GUARDED_REEXPORT` verbs, omitted by the summing script, not a missing guard; the tool's
per-module `fields` carries `reexport` and any closure arithmetic must include it.)*

**What the box carried before this (context).** `D2-wide`'s remaining work is the **parked set** (106
calls / 40 files), *recorded, not migrated* — a parked module's call is not live, so retiring it there
needs no code change until it is un-parked. `D2-gap` is the live defect, and it is what we work now.

**Fix 6 of the sweep — `business_rules`, 11 unguarded verbs → 0 (`c9a6bb6`).** The second module
where the label was **right on its face** (the routes really called **no** guard) but its implication
was **wrong** — all eleven already enforced `metadata.requireFeatures` and scoped every lookup by
tenant + organisation. **A new** wrapper `beginBusinessRulesMutationGuard` now runs
`runRouteMutationGuards()`; every route calls it before the write and `runAfterSuccess()` after
commit. **The design decision came from measuring a premise, not assuming it:** the two `execute/*`
POSTs *look* like "run something" calls and the tempting move was to set them aside by name (the
`ai_assistant` class-(b) treatment) — but the premise was tested and it was **false**: both insert a
`RuleExecutionLog` row via `logRuleExecution` whenever `dryRun` is false (success, error **and**
timeout paths). They are genuine writes, guarded against **`business_rules.executionLog`**; the four
CRUD routes use `.rule` / `.ruleSet` / `.ruleSetMember`. **Proof:** `d2-gap-wiring.route.test.ts`,
**53 tests**, a **real** registered guard driving the **real** handlers — block (write never happens,
by the entity manager's write record) and allow (`afterSuccess` fires once), all eleven verbs both
ways. **Three disjoint mutations** each turned exactly the expected tests RED, every file restored
byte-identical: block-path neutered → 11 RED; one route's guard removed → that route's 2 RED (other 9
green); whole `afterSuccess` path severed → 11 RED. *(A first cut of the third severed only the direct
branch and missed the `resourceIdOverride` rebind branch — the two `execute` tests stayed green and
the count came to 9. That was a gap in the MUTATION, not a passing test; the full sever gave 11.
Recorded because re-running one's own check would have hidden it.)* **`business_rules` 11 → 0**;
**total 99 → 88**; repo wrapper **77 → 88**; guarded-only **149 → 160**; closure
**88+0+35+32+5+0+8+88 = 256**. **`business_rules` 19 suites / 393 tests green**; core `tsc --noEmit`
exit 0.

**Fix 7 of the sweep — `inbox_ops`, 10 unguarded verbs → 1 (`0350563`).** The third module where the
label was **right on its face** (the routes really called **no** guard) but its implication was **wrong**
— all ten already enforced `inbox_ops.proposals.manage` / `.replies.send` / `.settings.manage` and
scoped every lookup by tenant + organisation. **No new wrapper was needed:** nine actor-present verbs
now call the module's **existing** `beginInboxOpsMutationGuard()`, before the write and
`runAfterSuccess()` after commit. **Two placements are deliberate, not incidental:** `translate` runs
the guard **after** its cache-hit early return (a pure cached read is not policy-evaluated) and `send`
runs it **before** the atomic send-claim and before `resend.emails.send` (a block prevents both the
email leaving and a claim row being left set). **The tenth route — `webhook/inbound` POST — is NOT
wired, and cannot be:** it is public (`requireAuth: false`) and **actor-less** (`auth: { sub: null }`),
while the registry types `auth.userId` as a non-nullable `string` it feeds to
`rbacService.getGrantedFeatures`, whose result gates every feature-bearing guard — a fabricated userId
would make those guards **skip silently**, "looks guarded while doing nothing". It is guarded by its own
HMAC/Svix signature, replay window, payload cap and rate limits, and is **set aside by name** in the tool
(new `ACTORLESS_PATHS` class), the reason **measured**, not assumed. **Proof:**
`d2-gap-wiring.route.test.ts`, **73 tests**, a **real** registered guard driving the **real** handlers —
block (write never happens, by the entity manager's write record) and allow (`afterSuccess` fires once),
all nine verbs both ways. **Three disjoint mutations** each turned exactly the expected tests RED, every
file restored **byte-identical** (md5 *and* a `git diff --numstat` reading pure insertions, zero
deletions): block-path neutered → 10 RED; one route's guard removed (`translate`) → 1 RED; whole
`afterSuccess` path severed (both branches) → 9 RED. *(Two things this suite itself got wrong, recorded
because a re-run of one's own check hides both: a guard declared with the route's `'custom'` operation
**never matches** — the registry maps `custom` → `update` before filtering — and one edit collapsed a
newline in `translate/route.ts` that **only the md5 / zero-deletion check caught**, as it typechecked
and the tests passed.)* **`inbox_ops` 10 → 0** in the GAP column (wrapper class **4 → 13**; 1 verb into
the actor-less class); **total 88 → 78**; repo wrapper **88 → 97**; guarded-only **160 → 169**; closure
**97+0+35+32+5+0+8+78+1 = 256**. **`inbox_ops` 36 suites / 415 tests green** (full core: **608 suites /
5232 tests green**); core `tsc --noEmit` exit 0.

**Fix 8 of the sweep — `notifications` was NOT a D2-gap; the TOOL was the defect, not the code (2026-10-07;
tool only — the repo did not change and HEAD stays `0350563`). The SECOND time the label over-claimed.**
The tool read `notifications` as **10 unguarded verbs / 10 files** — the joint-largest remaining with
`workflows`. It is not. **Every one of the ten routes already runs the registry guard**, through
**`lib/routeHelpers.ts`** — no `api/mutation-guard.ts` wrapper (which is what the four-symbol scan
noticed) but one local helper exported three ways, all registry-backed: `runGuardedNotificationWrite()`
(calls `runRouteMutationGuards`, blocks before the write, `runAfterSuccess()` after) and its two factories
`createBulkNotificationRoute()`/`createSingleNotificationActionRoute()` (lines 150/228 call the core
helper), used by `batch`/`feature`/`role` and `[id]/read`/`[id]/dismiss` respectively; the other five
(`route` POST, `settings` POST, `mark-all-read` PUT, `[id]/action` POST, `[id]/restore` PUT) call it
directly. **Two routes agree on 10/10:** the tool's `--json` rows, and a hand `find … route.ts` showing
**exactly ten** write-verb files — the eleventh API file, `unread-count/route.ts`, is `GET`-only, which is
why the count is 10 and not 11. **A third, independent route:** the module's **own pre-existing** test
`__tests__/mutation-guard.test.ts` drives **seven of the ten real handlers** and asserts each calls
`runRouteMutationGuards` with the right key — the claim the tool could not see is the claim the module had
already tested; run: **2 suites / 11 tests green**. **Fix = teach the tool the helper's name**
(`LOCAL_GUARD_HELPERS.notifications`, matching any of the three names — a regex on
`runGuardedNotificationWrite` alone would miss the five factory-consuming routes). **`notifications`
10 → 0** unguarded (all 10 now `GUARDED_LOCAL`); **total 78 → 68**; local-helper class **32 → 42**;
guarded-only **169 → 179**; closure **97+0+35+42+5+0+8+68+1 = 256**. **The standing lesson, now paid for
twice:** a four-symbol scan proves four names are **absent**, not that a route is unguarded; here the
alternative was wrapping ten already-covered routes — twenty call sites and a false security narrative.

**Fix 9 of the sweep — `workflows` was a REAL D2-gap, the LAST double-digit module, and the first with a
verb that must NOT be wired (2026-10-07, code `a9ecd21`).** The tool read `workflows` as **10 unguarded
verbs / 10 files** — the joint-largest remaining with `notifications`. **Unlike `notifications`, the
artefact AGREED: a genuine gap.** The wrapper `beginWorkflowsMutationGuard` existed but only the **three
definition-write routes** called it; its own header records the gap verbatim (*"this wrapper is NOT used
by every `workflows` write route … a pre-existing gap"*). **Nine of the ten are genuine writes and are now
wired** through that existing wrapper, each after its own gates and before the write:
`definitions/route.ts` POST (create), `instances/route.ts` POST, `instances/[id]/{advance,cancel,retry,
signal}` POST, `signals/route.ts` POST, `tasks/[id]/{claim,complete}` POST. **The 10th,
`instances/validate-start` POST, performs no write** — `lib/start-validator.ts` touches no entity manager
and calls `ruleEngine.executeRuleByRuleId(..., { dryRun: true })`, under which the only writer
(`logRuleExecution`) is skipped — so it is **set aside by name** in a NEW `READ_ONLY_SET_ASIDE` class
(wiring it would gate a read and fire an after-success for a mutation that never happened). **Two routes
agree:** the tool now reads **0 GAP / 13 wrapper verbs**, and a hand scan of all 22 `.ts` files under
`api/` finds **13 write-verb files — 12 call the wrapper, the only exception being `validate-start`.**
**Proof:** new `d2-gap-wiring.route.test.ts`, **18 tests**, registers a **real** guard in the global store
(`runRouteMutationGuards` left **unmocked**) and drives the **real** handlers, asserting both directions
for all nine verbs — **18/18 green**, then **mutation-proved three disjoint ways**: neuter the block path
→ **9 block cases RED**; drop one route's guard (`signals`) → **only that route RED, both ways**; sever the
after-success path → **9 allow cases RED**; every file restored **byte-identical**. *Two fixture defects
were found by the first run (14/18) and fixed: `definitions`' body needed ≥1 transition and a null
duplicate lookup, `retry`'s stub needed `status: 'FAILED'` — both the route's **own** gates answering 400
before the guard, a **test** error, not a **wiring** error.* **`workflows` 10 → 0** (9 wired + 1 read-only
set aside); **total 68 → 58**; wrapper class **97 → 106**; guarded-only **179 → 188**; closure
**106+0+35+42+5+0+8+1+1+58 = 256**. **Green:** whole `workflows` module **46 suites / 668 tests**; core
`tsc --noEmit` **exit 0**.

**Fix 10 of the sweep — `attachments` was a REAL D2-gap, and the cleanest kind: a module with NO guard
mechanism at all (code `88582bd`).** Measured **8 unguarded verbs across 4 files** — the largest
single-digit module left after `workflows` — and **the artefact AGREED: a genuine gap.** A string scan of
the whole module found **no wrapper, no `runRouteMutationGuards` call, no `makeCrudRoute`, and neither of
the `@deprecated` pair**, so a guard set shipped for `attachments.attachment` / `attachments.partition`
would have been **silently skipped** — and upload and delete are the highest-consequence writes in the
product: one publishes a file to a storage partition, the other removes both the row and the backing
file. **A new wrapper** `beginAttachmentsMutationGuard()` (`api/mutation-guard.ts`, mirroring the
`business_rules`/`workflows` shape incl. the `runAfterSuccess(resourceIdOverride)` rebind idiom), and
**all 8 verbs** now call it after their own gates and before the write, `runAfterSuccess()` after commit:
`api/route.ts` POST (multipart upload — **before the storage write**) + DELETE; `api/partitions/route.ts`
POST + PUT + DELETE (kind `attachments.partition`; guard id = the partition **code**, the id the route's
own audit entries carry); `api/library/[id]/route.ts` PATCH + DELETE; `api/transfer/route.ts` POST (one
guard per request; N rows in one commit). **What was NOT missing** — every one of the eight verbs already
enforces `attachments.manage` through `metadata.requireFeatures`, and every lookup is tenant+org scoped;
the wrapper adds the **structural chokepoint**, it does not replace any route's own validation or audit
story. **Proof:** new `d2-gap-wiring.route.test.ts`, **17 tests** (8 block + 8 allow + 1 unregistered-set
control), a **real** guard registered in the global store (`runRouteMutationGuards` **unmocked**) driving
the **real** handlers, all 8 verbs both ways. **Three disjoint mutations** each reddened exactly the
expected tests, every file byte-identical (wrapper md5 `77cee6f20b6b6f72298f73fa3fdd344e`, `transfer`
md5 `2a483cb0f6e76ed62661fe1f6d0c4bb7`): block path neutered → **8 block RED** (8 allow + control green);
one route's guard removed (`transfer`) → **only that route RED**; whole `afterSuccess` path severed →
**8 allow RED** (8 block + control green). `attachments` **8 → 0**; **total 58 → 50**; wrapper class
**106 → 114**; guarded-only **188 → 196**; closure **114+0+35+42+5+0+8+1+1+50 = 256**; whole
`attachments` module **26 suites / 206 tests green**; core `tsc --noEmit` exit 0.

**Fix 11 of the sweep — `search` was a REAL D2-gap, and the cleanest kind: a module with NO guard
mechanism at all (2026-10-07, repo `workspace/starting-kit`).** Measured as **7 unguarded verbs across 7
files** — the joint-largest left with `webhooks`. A string scan of the whole module found **no wrapper, no
`runRouteMutationGuards`, no `makeCrudRoute`, neither `@deprecated` name**, so a guard set for
`search.index` / `search.settings` would have been **silently skipped**. **Premise measured before the
fix** — the standing rule this sweep has now paid for four times: **two routes that share no failure mode
agree** (the tool's `--json` and a hand walk of every `.ts` under `api/` both find exactly 7 write verbs
across 7 files, none referencing a guard). The label was right. **All 7 are now wired** through a **new**
`beginSearchMutationGuard()` (`api/mutation-guard.ts`, mirroring the `attachments`/`workflows` shape incl.
the `runAfterSuccess(resourceIdOverride)` rebind): `api/embeddings/reindex` POST,
`api/embeddings/reindex/cancel` POST, `api/embeddings` POST, `api/index` DELETE, `api/reindex` POST,
`api/reindex/cancel` POST — kind `search.index` — and `api/settings/global-search` POST — kind
`search.settings`. **What was NOT missing** — all 7 already enforce their own capability
(`search.embeddings.manage`, `search.reindex`, `search.manage`) and carry tenant+org scope; the wrapper
adds the **structural chokepoint**, it does not replace any route's own validation or audit story. And
`search` ships **no `data/guards.ts`**, so no `search.*` guard exists today — the wiring means the **first**
such guard is enforced, not silently skipped. **Proof:** new `d2-gap-wiring.route.test.ts`, **15 tests**
(7 block + 7 allow + 1 control), a **real** guard registered in the global store (`runRouteMutationGuards`
**unmocked**) driving the **real** handlers. **Two disjoint mutations** each reddened exactly the expected
tests, wrapper restored byte-identical (md5 `bc86104a68c9a43b341a08bd07f78ac1`): block path neutered →
**7 block RED** (7 allow + control green); whole `afterSuccess` path severed → **7 allow RED** (7 block +
control green). **A hostile critic pass found nothing** — a separate agent enumerated every route file
(exactly 7 write verbs), quoted each guard call line, grepped for alternate write paths (zero crud-factory
hits), and confirmed the proof suite does **not** mock the registry. Its verdict: "STRONGEST
COUNTER-EXAMPLE FOUND: NONE." `search` **7 → 0**; **total 41 → 34**; wrapper class **114 → 121**;
guarded-only **196 → 204**; closure **121+0+35+42+5+0+8+1+1+9+0+34 = 256**; whole `search` module **26
suites / 269 tests green**; `search` `tsc --noEmit` exit 0.

**Fix 12 of the sweep — four modules recorded as "closed" carried leftover unguarded verbs. Two were
genuine writes and are now wired; two were measured READ-ONLY and set aside (2026-10-07, repo
`workspace/starting-kit`).** A live re-measure after the `search` fix found **four modules whose "0"
records were partial**: `directory` **3**, `progress` **3**, `dashboards` **2**, `data_sync` **1**. **Each
premise was measured before a single file was spent** — the standing rule, and the reason this matters is
that the `D2-gap` label is a **four-symbol string scan that has over-claimed four times**. **The four did
NOT split the same way, so a blanket fix would have been wrong for two of them.** **`directory` 3 —
genuine writes** (`api/organization-edges/route.ts` POST `trx.persist(edge).flush()` :172, PATCH
`trx.flush()` :253, DELETE soft-delete + `trx.flush()` :309) — wired into the module's **existing**
`beginDirectoryMutationGuard`, guard placed after the route's own gates (schema/tenant-boundary/
tree-inversion POST; schema/existence/optimistic-lock PATCH; auth/id DELETE) and before the first write.
This is the known `D2-gap` the `d2-wide` `directory` record already named, **not a regression**. **`progress`
3 — genuine writes** (`progressServiceImpl.ts:119` `em.persist(job).flush()`, `:228`/`:287` `em.flush()`) —
wired through a **NEW** `beginProgressMutationGuard()` (`api/mutation-guard.ts`, single kind `progress.job`);
the module had **no wrapper at all** (`wrapper=0`), so this was a **full module fix, not a leftover** —
stated plainly because a "leftover" label would have under-scoped it. **`dashboards` 2 — READ-ONLY, set
aside**: `widgets/data` and `widgets/data/batch` POST build a `widgetDataService` whose only mutation is
`cache.set` (`widgetDataService.ts:178-179`, a memo of a read) and whose DB use is
`getConnection().execute(<select>)` (`:246`); no `persist`/`flush`/`remove` anywhere. **`data_sync` 1 —
READ-ONLY, set aside**: `api/validate.ts` POST calls `adapter.validateConnection` +
`credentialsService.resolve`, and `resolve` only reads (`credentials-service.ts:222` `getRaw`), the writers
(`:107`/`:245`/`:256`) unreached. **Both read-only verbs were added to the tool's `READ_ONLY_PATHS`**, which
is why the read-only column moved 1 → 4. **Wiring a guard onto a read-only verb would gate a read and fire
`afterSuccess` for a mutation that never happened** (the `workflows` `validate-start` precedent). **Proof:**
two new suites, each driving the **real** handlers with `runRouteMutationGuards` **UNMOCKED** —
`directory/api/__tests__/d2-gap-wiring.route.test.ts` (**7 tests**) and
`progress/api/__tests__/d2-gap-wiring.route.test.ts` (**7 tests**); each block test asserts the
transaction/`createJob` did **not** run. **Two mutations per module**, restored byte-identical after each
(directory route md5 `3bdf126e35060c61c3108457dc4471e4`; progress wrapper md5
`68cc42545d0a43bcd0e808b55d1b2297`): neuter the block check → **3 block RED**; sever `runAfterSuccess` →
**3 allow RED**. **A hostile critic pass attacked all five claims from the raw files and found NOTHING** —
it confirmed both suites drive the real registry, confirmed the guard sits before the first write in every
verb, re-ran the tool itself (25 / read-only 4 / wrapper 127 — matching), and spot-checked every enabled
module's write-verb files against the tool rows (**0 diffs**). **Verdict: "STRONGEST COUNTER-EXAMPLE FOUND:
NONE."** **Total 34 → 25**; read-only **1 → 4**; wrapper **121 → 127**; guarded-only **203 → 209**
(the 3 read-only verbs left the unguarded column but joined a set-aside bucket, not the guard column —
stated so the arithmetic is checkable). `directory` + `progress` suites **32 suites / 256 tests green**;
core `tsc --noEmit` exit 0.

**Fix 13 of the sweep — `webhooks` 7 → 0: the label over-claimed by 2 (one was a re-export shim, one actor-less), and the 5 real writes are now wired (2026-10-07, code `workspace/starting-kit`, wrapper `api/mutation-guard.ts`).** The tool read `webhooks` as **7 unguarded verbs / 7 files** — the last double-digit-free module with anything above nothing except the set-asides. **The premise was measured before a file was spent, by two independent routes:** the tool's `--json` rows, and a hand walk of **every `.ts` under `api/`** (never globbing `route.ts` — the standing trap). **The 7 split THREE ways, so a blanket fix would have been wrong for two of them.** **1 was a FALSE POSITIVE:** `api/route.ts` is a two-line **re-export shim** (`export { GET, POST } from './endpoints'`) of a `makeCrudRoute` handler that already reaches the registry through the CRUD path — the tool read it as GAP because the file itself references none of the four scanned symbols. **1 was ACTOR-LESS:** `api/inbound/[endpointId]/route.ts` POST is public (`requireAuth: false`), writes a `WebhookInboundReceiptEntity` with a **possibly-null tenant**, and is guarded by its **own** signature + rate-limit mechanism (the `inbox_ops` precedent) — set aside by name in the tool's `ACTORLESS_PATHS` with a measured JSDoc rationale (actor-less class **1 → 2**). **5 were GENUINE writes across 4 real files:** `webhooks/[id]/route.ts` PUT + DELETE, `webhooks/[id]/rotate-secret/route.ts` POST, `webhooks/[id]/test/route.ts` POST, `webhook-deliveries/[id]/retry/route.ts` POST. **A NEW wrapper** `beginWebhooksMutationGuard()` (`api/mutation-guard.ts`, mirroring the `search` shape — two kinds `webhooks.endpoint`/`webhooks.delivery`, the `runAfterSuccess(resourceIdOverride)` rebind idiom for writes whose final id is only known after commit), and **all 5 verbs** now call it after their own gates and before the write, `runAfterSuccess()` after commit. **`/test` needs the rebind:** its mutation creates a **new delivery row**, so `runAfterSuccess` is re-bound to `delivery.id` after `em.refresh(delivery)`, not the endpoint id — a guard for `webhooks.delivery` must see the **created delivery**, or the one path that emits a live test delivery is the one path no delivery guard describes. **`WebhookRequestScope` gained `userId: string | null`** (`api/helpers.ts`), set from `auth.sub ?? null`, so the wrapper can build a real actor for the registry (the actor-less route cannot use it — that is why it stays set aside). **What was NOT missing:** every one of the five already enforced its capability and scoped every lookup by tenant + organisation; the wrapper adds the **structural chokepoint**, it does not replace any route's validation or audit story. **The two tool-defects were fixed in the tool, and the fix was proved not to launder a real gap:** a bare `export { POST }` now reads as re-export **only when the file does not define that verb locally** (a synthetic `export async function POST {}` + `export { POST }` still reads GAP), and the new rule was tested against a synthetic shim/handler pair. **Two routes agree on 0 GAP / 5 wrapper:** the tool's `--json` rows (`webhooks 11 15 5 0 3 0 0 0` — 5 wrapper, 3 crud, 0 unguarded), and a hand scan of `api/` — **5 write-verb exports, 5 `beginWebhooksMutationGuard` calls**. **Proof:** new `api/__tests__/d2-gap-wiring.route.test.ts`, **11 tests** (5 block + 5 allow + 1 unregistered-set control), a **real** guard registered in the global store (`runRouteMutationGuards` **UNMOCKED**) driving the **real** handlers, all 5 verbs both ways. **Two mutations** each reddened exactly the expected tests, every file restored byte-identical: block path neutered → **5 block RED**; `runAfterSuccess` severed → **5 allow RED**. **A hostile critic pass attacked all five claims from the raw files:** it confirmed the code claims (0 GAP, the 5 verb placements, the import depths, `tsc` exit 0, the suite proving real block/allow and not tautological) — **and found ONE real defect, in the TOOL, in the reverse direction:** the first version of the local-definition guard still counted an **aliased** entry (`export { helpers as POST }` put the token `POST` in the brace list), so a file owning an unguarded write reached through the alias read as `GUARDED_REEXPORT`. **Fixed:** the rule now requires the entry to be the **bare** verb name (split on commas, must equal `POST`/`PUT`/`PATCH`/`DELETE` exactly), so neither `x as POST` nor `POST as y` counts. **Both directions probed** (an 8-case harness, since removed): the `webhooks` shim still reads re-export; a real local handler + bare `export { POST }` still reads GAP; the aliased counterexample now reads GAP. Because the change only **removes** laundering it cannot move any existing classification — and the tool's real output is **unchanged** (`webhooks 0`, total `18`). **`webhooks` 7 → 0**; **total 25 → 18**; wrapper class **127 → 132**; re-export **5 → 6**; actor-less **1 → 2**; guarded-only **209 → 215**; closure **132+0+35+42+6+0+8+2+4+9+0+18 = 256**; whole `webhooks` module **15 suites / 127 tests green**; core `tsc --noEmit` exit 0. **Next: `configs` / `currencies` (4 each), then `entities` (4), then 1/1.**


**Fix 14 of the sweep — `configs` 4 → 0: the label over-claimed by THREE (one already registry-guarded inline — a TOOL blind spot; two read-only), and the 1 genuine write is now wired (2026-10-07, code `workspace/starting-kit`, wrapper `api/mutation-guard.ts`).** The tool read `configs` as **4 unguarded verbs**. **The premise was measured before a file was spent, by two independent routes:** the tool's `--json` rows, and a hand walk of **every `.ts` under `configs/api/`**. **The 4 split THREE ways, so a blanket fix would have been wrong for three of them.** **1 was ALREADY REGISTRY-GUARDED (a TOOL blind spot, not a repo change):** `api/cache/route.ts` POST builds the full `[...getAllMutationGuardInstances()]` array and calls `runMutationGuards(...)` **inline** — the registry chokepoint, but not the `runRouteMutationGuards(...)` spelling the classifier looked for, so it read as unguarded. This is **the first non-zero value in the tool's registry column.** **2 were READ-ONLY, set aside:** `api/system-status/route.ts` POST clears an in-process cache (`cache.clear()`, no business row) and `api/module-telemetry/route.ts` DELETE is a dev-only in-process op — neither writes a DB row → both added to `READ_ONLY_PATHS` (read-only class **4 → 6**) with a measured JSDoc rationale. **1 was a GENUINE write:** `api/upgrade-actions/route.ts` POST calls `executeUpgradeAction`, which writes an `UpgradeActionRun` row (`tem.create` + `tem.persist` + `tem.flush`). **A NEW wrapper** `beginConfigsMutationGuard(ctx)` (`api/mutation-guard.ts`, mirroring the `search`/`progress` shape — kind `configs.upgradeActionRun`, op `custom`), and the 1 verb now calls it **after** the route's own gates (enabled-check 403, scope 401/400, Zod body 400) and **before** `executeUpgradeAction`; `runAfterSuccess()` after the service call returns; the `blockedResponse` is returned **outside** the try/catch so a guard block cannot be swallowed. `resolveScope` gained `authSub` (`auth.sub`) so the wrapper gets a real actor. **Owner decision:** the two cache-clearing endpoints were put to the owner as a question (not closed by me) — **"Set them aside, document the reason (Recommended)"** — done as instructed. **Proof:** `configs/api/__tests__/d2-gap-wiring.route.test.ts` (**4 tests**) drives the **real** handler with `runRouteMutationGuards` **UNMOCKED** (block stops the service call + no after-success; allow runs the write + after-success once; a control guard outside the kind does not fire; an invalid body is 400 before the guard). **Two mutations**, restored byte-identical (wrapper md5 `4d85dd2a3d979c2f212c4dcac83cb055`; route md5 `d52d9fd30f36f9464948135894deb2a6`): neuter the block path → **block RED**; sever `runAfterSuccess` → **allow RED**. **A hostile critic pass** re-ran the tool, hand-walked every `.ts`, confirmed the inline-registry call in `cache` and that the two set-asides write no business row, and corrected only my **statement** of the split (the correct post-fix split is 1 registry + 2 read-only + 1 wrapper + 0 unguarded). **Total 18 → 14**; wrapper **132 → 133**; registry **0 → 1**; read-only **4 → 6**; guarded **215 → 217**; closure `133 + 1 + 35 + 42 + 6 + 0 + 8 + 2 + 6 + 9 + 0 + 14 = 256`. Whole `configs` module **8 suites / 56 tests green**; core `tsc --noEmit` exit 0.

**Fix 15 of the sweep — `currencies` 4 → 0: the label did NOT over-claim this time — all 4 verbs write a business row and all 4 are now wired (2026-10-07, code `workspace/starting-kit`, wrapper `api/mutation-guard.ts`).** The tool read `currencies` as **4 unguarded verbs across 2 files**. **The premise was measured before a file was spent, by two independent routes:** the tool's `--json` rows, and a hand walk of **every `.ts` under `currencies/api/`** — and unlike the last several modules, the label was **right**: every one of the four is a genuine write, so the blanket fix was the correct one. **The four:** `api/fetch-configs/route.ts` POST → `createFetchConfig` (`em.create` + `em.persist(...).flush()`); PUT → `updateFetchConfig` (`em.assign` + `em.persist(...).flush()`); DELETE → `deleteFetchConfig` (`em.remove(...).flush()`); and `api/fetch-rates/route.ts` POST → `fetchService.fetchRatesForDate` writes `ExchangeRate` rows (`em.create` + `em.persist` + `em.flush` in `rateFetchingService.ts`), then the route updates each `CurrencyFetchConfig.lastSync*` and `em.flush()`es. **A NEW wrapper** `beginCurrenciesMutationGuard(ctx)` (`api/mutation-guard.ts`, mirroring the `configs`/`search` shape — the module had **no wrapper and no `data/guards.ts`**, so a `currencies.*` guard set would have been silently skipped; kinds `currencies.currency_fetch_config` (3) and `currencies.exchange_rate` (1)), and all 4 verbs now call it after their own gates (auth 401, body 400, id 400; PUT/DELETE also after the optimistic-lock call) and before the write; `runAfterSuccess()` after commit. **The lock-floor trap, stated:** `fetch-configs` PUT/DELETE also call `enforceCommandOptimisticLock(...)` — the command-lock floor, which never consults the registry (the `directory` trap); the registry call added here is a **separate** chokepoint. **A validation note:** `currencyFetchConfigCreateSchema.provider` is a closed enum `['NBP', 'Raiffeisen Bank Polska', 'Custom']`, so a lower-case provider fails Zod and returns 400 **before** the command runs — the guard is reached only for a schema-valid body (the first test draft used `'nbp'` and the POST allow-test was 400; corrected to `'NBP'`). **Proof:** `currencies/api/__tests__/d2-gap-wiring.route.test.ts` (**10 tests**) drives the **real** handlers with `runRouteMutationGuards` **UNMOCKED**; each block test asserts the command/service did **not** run. **Two mutations**, restored byte-identical (wrapper md5 `56e4ea6ae6e605ca9fcedf94a4b71ea5`): neuter the block path → **4 block RED**; sever `runAfterSuccess` → **4 allow RED**. **Total 14 → 10**; wrapper **133 → 137**; guarded **217 → 221**; guarded+set-asides **242 → 246**; closure `137 + 1 + 35 + 42 + 6 + 0 + 8 + 2 + 6 + 9 + 0 + 10 = 256`. Whole `currencies` module **23 suites / 167 tests green**; core `tsc --noEmit` exit 0.


**Fix 16 of the sweep — `entities` 4 → 0: a real D2-gap, but the label's "2 are the optimistic-lock floor" is true of the VERBS and false of the FILE (2026-10-07, code `workspace/starting-kit`, the module's EXISTING `api/definitions.mutation-guard.ts`).** The tool read `entities` as **4 unguarded verbs across 2 files**. **The premise was measured before a file was spent, by two independent routes:** the tool's `--json` rows, and a hand read of both files. The carried note — *"2 of those are the optimistic-lock floor, not gaps"* — is right at the **verb** level and false at the **file** level. **The four:** `api/records.ts` POST → `de.createCustomEntityRecord(...)` reached **no guard of any kind** (a genuine gap); `api/entity-settings.ts` PUT → `moduleConfigService.setValue(...)` reached **no guard of any kind** (a genuine gap — it writes the tenant's `entities` config row `newEntitiesRestrictedByDefault`, a security control); `api/records.ts` PUT and DELETE → each calls `enforceCommandOptimisticLockWithGuards(...)`, the command optimistic-lock **FLOOR**, which never consults `getAllMutationGuardInstances()` (the `directory` trap). **Why all 4 were wired, not just the 2:** the tool sets a file aside as `COMMAND_LOCK_FLOOR` **only when EVERY write verb it exports is covered by the floor**. `records.ts` is the counter-example the tool's own header names — its POST reached nothing, so the file as a whole had **no registry guard**, and **one protected verb must not launder an unprotected sibling in the same file**. `directory`'s `organization-edges` set the precedent: its floor verbs **also** call the registry wrapper. So PUT/DELETE keep the floor **and** gain the registry guard. **No new wrapper was needed:** `entities` already ships `data/guards.ts` and already wires 5 route files through `beginEntitiesMutationGuard`, so the four verbs now call it after their own auth/ACL/validation/(lock) gates and before the write, `runAfterSuccess()` after commit. **One placement that needed care:** PUT has **two** write branches — a sentinel/non-UUID `recordId` falls through to a **create**, otherwise an **update** — so the guard is called **once** with the operation computed from the branch and the matching `resourceId`, and **each** branch fires its own `runAfterSuccess`. **What was NOT missing, stated:** all four already enforced their own capability (`entities.records.manage` ×3, `entities.definitions.manage` ×1) with tenant+org-scoped lookups and a per-entity ACL gate — the defect was the missing **structural chokepoint**. **Proof:** `entities/api/__tests__/d2-gap-wiring.route.test.ts` (**13 tests**) drives the **real** handlers with `runRouteMutationGuards` **UNMOCKED**; block tests assert the dataEngine/config call did **not** happen, allow tests assert the guard saw the right kind + operation. **Two mutations**, restored byte-identical (records md5 `af7d298ef2e617ff88724c855d59a7f5`, entity-settings md5 `d97e1269d1f70103195f002a1c29401b`): neuter the records POST block check → **records-POST block RED**; sever `entity-settings`' `runAfterSuccess` → **settings allow RED**. The pre-existing `records.crud.test.ts` (**22 tests**) still passes. **A hostile critic pass returned STRONGEST COUNTER-EXAMPLE FOUND: NONE.** **Total 10 → 6**; wrapper **137 → 141**; guarded **221 → 225**; guarded+set-asides **246 → 250**; closure `141 + 1 + 35 + 42 + 6 + 0 + 8 + 2 + 6 + 9 + 0 + 6 = 256`. Whole `entities` module **33 suites / 235 tests green**; core `tsc --noEmit` exit 0.

**Fix 17 of the sweep — `scheduler` 1 → 0 (wired) and `onboarding` 1 → 0 (set aside): the last two single-verb modules, and their premises split OPPOSITE ways (2026-10-07, code `workspace/starting-kit`, new `scheduler/api/mutation-guard.ts`).** The remaining D2-gap was **6 verbs**; these two modules were **1 each**. **Each premise was measured before a file was spent, by two independent routes** (the tool's `--json` rows, and a hand read of every `.ts` under each module's `api/`), and they did NOT share a verdict.

**`onboarding/api/post/onboarding.ts` POST is NOT a gap: it is actor-less.** `metadata.POST = { requireAuth: false }` by design (self-service signup, gated on `SELF_SERVICE_ONBOARDING_ENABLED`), it reads **no session** (there is no `getAuthFromRequest` on the path), and it **CREATES the tenant**: the `OnboardingRequest` row it writes carries `tenantId: null` and is attributed to no actor. The registry types `auth.userId` as a **non-nullable string** and feeds it to `rbacService.getGrantedFeatures(userId, ...)`, so a guard set **cannot be evaluated** here; fabricating an actor would make every feature-gated guard **SKIP SILENTLY** (the exact D2-wide failure). This is the sharpest case for the actor-less class: the endpoint does not merely lack a user, it creates the tenant there is nothing to scope against. It is guarded by its **OWN** mechanisms, all measured in the route and its service: the feature flag, a 10-per-60s rate limit, a one-shot 24h email-verification token and a pending-request de-dup window. **So it is set aside by name in the TOOL** (`ACTORLESS_PATHS`, third entry), the reason recorded in the classifier, NOT wired (actor-less class **2 → 3**).

**`scheduler/api/trigger/route.ts` POST IS a gap: it is authenticated.** `requireAuth: true` with `requireFeatures: ['scheduler.jobs.trigger']` and a real actor (`auth.sub` / `auth.tenantId` / `auth.orgId`), so the guard set CAN be evaluated. It is a manual trigger that reads a `ScheduledJob` and **enqueues a `scheduler-execution` BullMQ job**; the precedent is `communication_channels/api/post/channels/[id]/poll-now`, an authenticated action route that enqueues a job and is wired with `operation: 'custom'`. The module had **no wrapper and no `data/guards.ts`**, so a NEW wrapper `beginSchedulerMutationGuard(ctx)` (`api/mutation-guard.ts`) is the chokepoint. **The resource kind is `scheduler.job`, reached by two routes:** the CRUD route derives it from its `commandId` (`scheduler.jobs.create` → singularise → `scheduler.job`), and the command layer writes `resourceKind: 'scheduler.job'` on all three audit logs. **One measured subtlety:** the route passes `operation: 'custom'`, and the registry maps that to `'update'` (`toRegistryMutationOperation`), which is what a guard sees; the first test draft asserted `'custom'` and went RED, which is how the mapping was confirmed. **Proof:** `scheduler/api/__tests__/d2-gap-wiring.route.test.ts` (**10 tests**) drives the **real** handler with `runRouteMutationGuards` **UNMOCKED**; the block test asserts the queue was **never** enqueued. **Two mutations**, restored byte-identical (route md5 `3c8536c8cb8b975f6ba82f72ce5676eb`): remove the block check → **block RED**; remove `runAfterSuccess` → **allow RED**. Whole `scheduler` module **18 suites / 353 tests green**; `tsc --noEmit` exit 0. **Total 6 → 4**; wrapper **141 → 142**; guarded **225 → 226**; guarded+set-asides **250 → 252**; closure `142 + 1 + 35 + 42 + 6 + 0 + 8 + 3 + 6 + 9 + 0 + 4 = 256`. **A doc defect found and fixed in the same pass:** the NOW block's per-module list still carried a stale "`entities` 4" fragment from Fix 16 (the `entities` 0 entry was appended without removing the old one); removed. **What remains: `communication_channels` (4), the last module.**



**Fix 18 of the sweep — `communication_channels` 4 → 0, the LAST module: the 4 split THREE ways, and a hostile critic then found a NEW class (a GET that WRITES) the scan could not see (2026-10-07, code `workspace/starting-kit`, the module's own `lib/route-mutation-guard.ts`).** The tool read `communication_channels` as **4 unguarded verbs across 4 files** — the last module. **Measured first, by two routes** (the tool's `--json` rows, and a hand read of every `.ts` under `api/`), the 4 split **three ways**, so a blanket fix would have been wrong for three of them: **2 actor-less** — `post/webhook/[provider]` and `post/webhooks/gmail`, both `requireAuth: false` (the provider signature / a Google-signed JWT IS the auth; no session read; both enqueue) → joined `ACTORLESS_PATHS` (**actor-less class 3 → 5**); **1 read-only** — `post/oauth/[provider]/initiate` (authenticated, but it builds an authorize URL and sets an httpOnly state cookie, and writes **no** business row; `lib/oauth-state.ts` has no `persist`/`flush`, verified by grep) → joined `READ_ONLY_PATHS` (**read-only class 6 → 7**); **1 genuine write** — `post/test-seed` (env-gated off in production, but **when enabled it writes real rows and HAS a real actor**) → **wired** through the module's existing `validateRouteMutationGuard` for both actions (`connect-channel` → kind `communication_channels.channel`; `emit-inbound` → kind `communication_channels.message`; both `operation: 'create'`), guard before the write, `afterSuccess` after. **Proof:** `api/post/test-seed/__tests__/route.test.ts`, **8 tests**, real registry + real handler with `runRouteMutationGuards` **UNMOCKED**; **two mutations**, restored byte-identical (route md5 `e3690c2cb309c0ea1c8a54f9221ee973`, test md5 `90c8de5120d8c293fb4e144a775cc914`) → block-return removed = `connect-channel` block RED; `afterSuccess` severed = `emit-inbound` allow RED.

**The critic found a class the method-based scan cannot count: a GET that WRITES.** A hostile pass over the close-out re-measured from the files and found `api/get/oauth/[provider]/callback/route.ts` — a **GET** — performs real business writes (`credentialsService.save` → a per-user `integration_credentials` row; `createConnectedChannelRow` → a `CommunicationChannel`), reached **no guard**, and was **invisible to the tool** because `ANY_WRITE_EXPORT` matches write verbs **by HTTP method**. Worst combination: unguarded **and** uncounted. **It is a real gap, not a false positive:** it is a **user-intent** write with a **guarded sibling** — `post/channels/connect/credentials` creates the same kind (`communication_channels.channel`, `create`) and IS guarded — so two paths to the same resource disagreed. The callback now runs the same guard before any write; because the route **always redirects**, a block is surfaced as `flash=error&code=forbidden`, and `afterSuccess` runs before the success redirect. **Proof:** `api/get/oauth/[provider]/callback/__tests__/route.test.ts`, **5 tests**, same discipline; **two mutations**, restored byte-identical (route md5 `f9009bee749e8819b76cb43984e951b0`). **The tool now sees the class (mutation-proven):** a separate `classifyWriteGet` + `handlerBody` checks the **GET body only** (so a guarded PUT cannot launder a GET) for `RE_WRITE_SIGNAL`; renaming the callback's guard call flips it to `WRITE_GET_UNGUARDED` = 1. **The critic also found the first cut of that classifier was too narrow** (gated behind `!exportsWrite`, so a mixed-method file hid its GET write), and that **two MORE GETs write** — `dashboards/api/layout` (`em.persist`/`em.flush`, lazily creates the user's own default layout) and `messages/api/[id]` (`commandBus.execute('messages.recipients.mark_read')` when `autoMarkRead`). Both are **read side-effects**, not user-intent mutations; wiring an async guard mid-GET would let a future guard **veto loading the dashboard / reading a message** — a policy call, so **the owner settled it 2026-10-07: set aside by name (`READ_SIDE_EFFECT_GET_PATHS`), not wired** — the tool's `WRITE-PERFORMING GET HANDLERS` list tags them `set-aside` and its headline reads `(plus 3 … 0 unguarded, 2 set aside as read side-effects)`. **Whole `communication_channels` module 60 suites / 571 tests green; `tsc --noEmit` exit 0.** **Total 4 → 0 — the write-verb sweep is COMPLETE**; local class **42 → 43**; guarded **226 → 227**; guarded+set-asides **252 → 256**; closure `142 + 1 + 35 + 43 + 6 + 0 + 8 + 5 + 7 + 9 + 0 + 0 = 256`.

each fix: route the unguarded writes through a per-module wrapper, so the module has **one** guard
chokepoint rather than two mechanisms — **but check first whether the module already ships its own
wrapper, as `auth`, `communication_channels`, `inbox_ops`, `workflows` and now `entities` all did, and measure the premise
before spending files on a fix the label implies (the two `execute/*` routes looked like non-writes and
were writes; an actor-less route like `inbox_ops`' webhook cannot be wired at all; a read-only POST
like `workflows`' `validate-start` must NOT be wired; and a file whose POST reaches nothing keeps reading
as a gap even when its PUT/DELETE sit on the floor — both set aside by name, the file wired in full).** **The write-verb sweep is COMPLETE — 0 unguarded across all 35 enabled modules. The two write-performing GETs are SETTLED: set aside as a named class.** (`dashboards/api/layout`, `messages/api/[id]`) — a GET that writes a **read side-effect** (lazy default-init; auto-mark-read). Wiring them would put an async registry guard mid-GET and let a future guard **veto loading the dashboard / reading a message** — a policy call, so **the owner settled it 2026-10-07: set aside by name (`READ_SIDE_EFFECT_GET_PATHS`), not wired**, visible in the tool's own bucket. Nothing is OPEN in this sweep.
Then the rest. Protocol for each: **measure from the artefact**
(re-run `measure.js` and read the module's own routes); **name the control that actually protects each
route today** (many are protected by other means — record it, do not over-claim); **prove the fix with
two mutations** (block path, then after-success) and restore byte-identical; **update the count in both
repos**; **tell the owner in plain English what was done.** **Added by the `communication_channels`
episode:** before applying a `GAP` label's fix, **check whether the module ships its own guard helper**
— if it does, prove the helper reaches the registry, then teach the tool its name; the label alone has
now twice described a defect that was not there (`messages`, `communication_channels`). **Added by the
`auth` episode:** the label can also be **right on its face and still mislead** — a route can call no
guard and still be capability-guarded and audited; **name what protects the route today before implying
it is unprotected.**

**A trap that has now bitten three migrations — carry it forward:** not every write handler is a
`route.ts`. `translations/put/locales.ts`, `planner/*` and `query_index/{reindex,purge}.ts` all export
**named** verbs. **Walk every `.ts` under `api/`, never glob for `route.ts`** — a name-scan reports a
module clean while leaving live write routes unguarded.


**Then, in order (nothing dropped):**

| # | The item | Why here |
|---|---|---|
| **1** | ✅ **The owner's three directives — DONE** | Directive 1's map was later found **incomplete**; completed in Part I §4.4 + Part II. |
| **2** | ✅ **D2-wide: `dashboards` — DONE** (code `a05ea2c`) | 10 calls / 4 files → 5 guard objects; count 161 → 151; mutation-proven twice. |
| **3** | ✅ **Directive 1 completed** (docs `807ab40`, `365c4e4`) | Map §4.4 covers **every** AI-touching item; Part II works the three joints in depth. |
| **4** | ✅ **Test defect (a): `explicit-sort-comparators` — DONE** (code `d5567c7`) | **16 sites, not 2** — read from the test's own output. Audit 4/4; 336 tests green. |
| **5** | ✅ **Test defect (b): `module-decoupling` — DONE** (code `fe7c3e5`) | File-scoped isolation; **full suite 602 suites / 5123 tests, 0 failures**. |
| **6** | ✅ **D2-wide: `workflows` — DONE** (code `d3af1b1`) | 9 calls / 3 files → 4 guard objects; count 151 → 142; mutation-proven (5 RED / 3 RED). |
| **7** | ✅ **D2-wide: `inbox_ops` — DONE** (code `d89b8f6`) | 8 calls / 4 files → 4 guard objects; count 142 → 134; mutation-proven (4 RED / 4 RED). |
| **7b** | ✅ **The owner's two integration concerns — DONE** | The Hermes map named **43** items and the backlog named the map **0** times; the register/blueprint items had **0** per-item backlog rows. **Both measured true and fixed** — `★ Hermes:` lines on every AI-touching item, a new "core-module gaps" section, rule 6 in WORKING-RULES, and a re-measurable check in `BACKLOG.md` §A. **No code changed.** |
| **8** | ✅ **D2-wide: `perspectives` — DONE** (code `e26642c`) | 8 calls / 3 files → 4 guard objects; count **134 → 126** (files 52 → 49); mutation-proven (**2 RED / 5 RED**). **The new shape:** the POST route guards **two resources in one request** (personal + role-scoped), each with its own after-success condition. **The first module with NO `D2-gap`** — all 3 write routes guarded. |
| **9** | ✅ **D2-wide: `translations` — DONE** (code `a2f8d5f`) | 6 calls / 2 files → **2 guard objects** (the plan's "4" was wrong: one guard per route). Count **126 → 120** (files **47**, not 49). **Found: `put/locales.ts` is not a `route.ts`** — a file-name scan misses it. **First real use of the id re-binding** on after-success. Mutation-proven (**3 RED / 3 RED**). |
| **10** | ✅ **D2-wide: `planner` — DONE** (code `641d3af`) | 4 calls / 2 files → **2 guard objects** (the plan's figure held on re-measurement — the first module where it did). Count **120 → 116** (files **47 → 45**). **Found: neither handler is a `route.ts`** (both are named `POST` exports) — a file-name scan misses both. Handled the `shouldRunAfterSuccess` gate without re-implementing it (the registry already applies it). **No `D2-gap`** — all 5 write verbs guarded. Mutation-proven (**2 RED / 2 RED** — every test covered). |
| **11** | ✅ **D2-wide: `query_index` — DONE** (code `cc5a237`) | 4 calls / 2 files → **2 guard objects** (the plan's figure held again). Count **116 → 112** (files **45 → 43**). **Neither handler is a `route.ts`** (`reindex.ts`, `purge.ts` — named `POST` exports); the test mocked the **deprecated DI service**, re-pointed to stub only `runRouteMutationGuards`. **Proof went past the wrapper:** each route mutated in turn → each reddened only its own test. **No `D2-gap`** — both write verbs guarded. Mutation-proven (**2 RED / 2 RED**, disjoint). |
| **11a** | ✅ **D2-wide: `auth` — DONE** (code `aeeaad0`) | 2 calls / 1 file → **1 guard object**; count **112 → 110** (files **43 → 42** — *the docs first said 45 → 44; corrected this session, see the file-count note below*). **The plan's figure held.** **The module is far bigger than its 2 calls suggest:** 18 files export a write verb, **only 3 are guarded** — **12 unguarded resource-writes across 10 files** is the **worst `D2-gap` measured**, recorded not fixed. **A wrong `D2-gap` claim in the header's first draft was caught and corrected against the walk** (`users/route.ts` **is** guarded via `makeCrudRoute`; `authority/projects/route.ts` is **GET only**). Mutation-proven (**2 RED / 1 RED**, plus route-file mutations 2 RED / 1 RED). |
| **11b** | ✅ **D2-wide: `directory` — DONE** (code `d682c09`) | 2 calls / 1 file → **1 guard object**; count **110 → 108** (files **42 → 41**). **The plan's figure held.** **Almost no `D2-gap`:** the module's entire gap is **3 unguarded verbs in 1 file** (`organization-edges` POST/PATCH/DELETE) against `auth`'s 12 — and all three are protected by other controls (`requireFeatures`, a verified-tenant `resolveScope`, `assertOrganizationsInTenant()`, audit rows, the OSS optimistic-lock floor). **Two traps caught by running tests, not reading:** a `*/` inside a block comment closed the JSDoc early; and a comment **naming** `enforceCommandOptimisticLock(` failed a code guard that regexes raw text (L91). Mutation-proven (**2 RED / 1 RED**, plus route-file mutations 2 RED / 1 RED). |
| **11c** | ✅ **D2-wide: `feature_toggles` — DONE** (code `5af76bc`) | 2 calls / 1 file → **1 guard object**; count **108 → 106** (files **41 → 40**). **The plan's figure held.** **The LAST ENABLED MODULE — the sweep is complete.** **No `D2-gap`:** `overrides` PUT → this wrapper; `global` POST/PUT/DELETE → `makeCrudRoute` → `collectAndRunGuards()`; `check/*` is read-only (checked). **First wrapper in the sweep to carry `runAfterSuccess(idOverride)` into a route whose validated id can differ from the written id** (the override may be *created*, returning a generated `overrideToggleId`) — the `translations`/`dashboards` shape, proven with 2 registry calls on the rebind. Mutation-proven (**2 RED / 2 RED**, disjoint; plus route-file mutations 2 RED / 2 RED). |
| **12** | **D2-gap** — the write routes that call **no** guard at all. **MEASURED across every enabled module 2026-10-06; re-measured 2026-10-07** (`analysis/d2-gap/measure.js`): 256 write verbs, **18 unguarded now** (25 before the `webhooks` fix, 34 before the four-leftover-modules fix, 41 before the `search` fix, 50 before the `attachments` fix, 58 before the `workflows` fix, 68 before the `notifications` tool fix, 78 before the `inbox_ops` fix, 88 before the `business_rules` fix, 99 before the `auth` fix, 111 before the `communication_channels` tool fix, 122 before the `messages` registry-bypass fix, 143 before the `ai_assistant` fix, 160 before the `audit_logs` fix). Per module: `ai_assistant` **9** (after the fix), `messages` **0** (fixed — registry-bypass, see 12c), `integrations` **0** (fixed — same), `communication_channels` **4** (mis-labelled — 11 were already guarded; see 12d), `auth` **0** (fixed — see 12e), `business_rules` **0** (fixed — see 12f), `inbox_ops` **0** (fixed — 9 wired, 1 actor-less set aside; see 12g), `notifications` **0** (tool fix — all 10 already guarded; see 12h), `workflows` **0** (fixed — 9 wired, 1 read-only set aside; see 12i; was 10 — *the record said 13, which was wrong; `tasks/route.ts` and `events` export no write verb*), `attachments` **0** (fixed — all 8 wired through a NEW wrapper; see 12j), `search` **0** (fixed — all 7 wired through a NEW wrapper; see 12k), `progress` **0** (fixed — 3 wired through a NEW wrapper; see 12l), `directory` **0** (fixed — 3 wired into the existing wrapper; see 12l), `dashboards` **0** + `data_sync` **0** (SET ASIDE — measured read-only; see 12l), `webhooks` **0** (fixed — 5 wired through a NEW wrapper, 1 re-export shim re-classified, 1 actor-less set aside; see 12m), then 4/4/4, 1/1, and **0** for `dictionaries`, `feature_toggles`, `perspectives`, `planner`, `query_index`, `translations`, `api_keys`, **`audit_logs`**. | **The recommended task — now in progress.** Do it module by module, largest first; record the per-module unguarded count next to the D2-wide count. **No double-digit module remains; next is `configs` (4), then `currencies` (4), then `entities` (4 — but 2 of those are the optimistic-lock floor, not gaps).** |
| **12a** | ✅ **D2-gap: `audit_logs` — DONE** (code `4ef5812`) | **The FIRST `D2-gap` module.** Both write routes (`undo` POST, `redo` POST) called **no guard at all**; 2 unguarded verbs → 0. New `beginAuditLogsMutationGuard`. **The design decision:** guard against the **log entry's own `resourceKind`** (fallback `audit_logs.action_log`) — undo/redo reverse or replay a write *to that resource*, so a guard for `directory.organization` must see the undo of an organization write, or the one path that can reverse a protected change is the one path no guard describes. Redo guard runs **after** `resolveRedoInput` (policy not evaluated for a request that will 400). 7 new tests; **3 disjoint mutations** proved they bite; wrapper byte-identical; 16 suites / 108 tests green. |
| **12b** | ✅ **D2-gap: `ai_assistant` — DONE** (code `0af50c8`) | **The SECOND and largest `D2-gap` module — 24 unguarded verbs across 19 files.** New `beginAiAssistantMutationGuard`; the 10 resource-write files now run the registry. **24 → 9.** The 24 split three ways: **15 resource writes guarded**; **7 session/flow set aside by name** (`ai/chat`, `ai/run-object`, `route`, `chat`, `session-key`, `mcp-key`, `tools/execute`); **2 pending-action gate set aside by name** (`confirm`, `cancel` — the AI mutation-approval gate, `runPendingActionRechecks()`). `resourceKind` = `ai_assistant.<entity>`. The `loop-override` DELETE guards only the path that writes (no-op clear has nothing to govern). **30 new tests; 3 disjoint mutations** proved they bite; every file byte-identical; **99 suites / 1306 tests green**; app `typecheck` exit 0. |
| **12c** | ✅ **`messages` — REGISTRY-BYPASS, not a D2-gap — DONE** (code `1f1b60e`) | Measured as **17 unguarded verbs / 11 files**, the largest `D2-gap` left — but the premise was **FALSE**: all 17 already call `runMessageMutationGuards()`. **The real defect was in the helper** — it built `runMutationGuards([legacyGuard])`, a one-element array, **skipping the global registry** (the `D2-wide` shape, reached locally). **Six more places had the identical line**: `integrations`, `payment_gateways` (parked), `staff`, and inline copies in `sales/quotes/convert`, `sales/quotes/send`, `configs/api/cache`. **All seven fixed** — registry first, then the bridged legacy service. **Latent, not live** (only 3 modules register guards, none for these kinds). **16-test cross-module suite; proved RED by mutating ONE helper** (`staff`) → only its 2 tests red. `messages` **17 → 0**, `integrations` **4 → 0**; total **143 → 122**. Tool gained class **`GUARDED_LOCAL`**; **its header states the limit** (proves a guard *call*, not a *registry* guard). **605 suites / 5159 tests green**; core `tsc` exit 0. **Next: `communication_channels` (15).** |
| **12d** | ✅ **`communication_channels` — NOT a D2-gap; the TOOL was the defect, not the code — DONE** (tool only; repo unchanged at `1f1b60e`) | Measured as **15 unguarded verbs / 15 files**, the largest remaining — but **11 of the 15 already call `validateRouteMutationGuard`**, the module's own helper, which reaches the **registry** (`runRouteMutationGuards` → `getAllMutationGuardInstances()`). The literal fix would have wrapped 11 files needlessly. **Two routes agree on 11/4:** the artefact (11 files, each 1 verb + 1 guard call) and the tool's `--json` rows. **The helper is registry-backed — proven by its own test** (registers a real guard, asserts block + afterSuccess). **The 4 left, each set aside on evidence:** `oauth/initiate` (0 writes), `webhook/[provider]` + `webhooks/gmail` (unauthenticated by design — signature/JWT IS the auth — 0 writes, enqueue only), `test-seed` (writes, but env-gated off in prod — 404 **before** any write). **Fix = teach the tool the helper's name**; `communication_channels` **15 → 4**; total **122 → 111**; guarded **134 → 145**; **58 suites / 558 tests green**. **Standing lesson: the label is a four-symbol string scan — measure the premise before applying the fix it implies.** **Next: `auth` (12).** |
| **12e** | ✅ **`auth` — a REAL D2-gap (label right), but NOT an authorization hole (implication wrong) — DONE** (code `8e1632c`) | Measured **12 unguarded verbs / 10 files**, the largest remaining — and the label was **true**: these routes called **no guard of any kind**. But **every one already enforced its own capability** (`metadata.requireFeatures`) **and wrote its own audit entry**, so *"checked by nothing"* was false. **No new wrapper needed — `auth` already ships `beginAuthMutationGuard()`;** all 12 verbs now call it before the write, `runAfterSuccess()` after commit. **Two routes agree on 12/10:** the tool's `--json` rows, and the module's own header written **before** this work. **Narrow gain, stated narrowly:** `auth` ships **no `data/guards.ts`**, so no `auth.*` guard exists today — what changed is that the **first** one will be enforced, not skipped. **Latent defect found and fixed:** `sidebar/variants` POST ran its guard **inside** the 409-duplicate-name `catch`, so a **blocked** mutation could have been re-reported as a duplicate name. **Proof:** 29 tests, a **real** registered guard driving the **real** handlers — block (write never happens, by call count) and allow (`afterSuccess` fires once), all 12 verbs both ways. `auth` **12 → 0**; total **111 → 99**; wrapper **65 → 77**; guarded **137 → 149**; closure **77+0+35+32+5+0+8+99 = 256**; **79 suites / 682 tests green**; `tsc` exit 0. **Next: `business_rules` (11).** |
| **12f** | ✅ **`business_rules` — a REAL D2-gap (label right), but NOT an authorization hole (implication wrong) — DONE** (code `c9a6bb6`) | Measured **11 unguarded verbs / 5 files**, the largest remaining after `auth` — and the label was **true**: the routes called **no guard of any kind**. But **every one already enforced its own capability** (`business_rules.manage` / `.manage_sets` / `.execute`) **and scoped every lookup by tenant + organisation**, so *"checked by nothing"* was false. **A NEW wrapper** `beginBusinessRulesMutationGuard` now runs `runRouteMutationGuards()`; all 11 verbs call it before the write, `runAfterSuccess()` after commit. **The design decision came from MEASURING a premise:** the two `execute/*` POSTs *look* like non-writes and the tempting move was to set them aside by name — but the premise was tested and was **false** (both insert a `RuleExecutionLog` row via `logRuleExecution` whenever `dryRun` is false — success, error **and** timeout paths). Guarded against **`business_rules.executionLog`**; the CRUD routes use `.rule` / `.ruleSet` / `.ruleSetMember`. **Two routes agree on 11/5:** the tool's `--json` rows, and the module's five `route.ts` files read by hand. **Narrow gain, stated narrowly:** no `data/guards.ts`, so no `business_rules.*` guard exists today — what changed is that the **first** one will be enforced, not skipped. **Proof:** 53 tests, a **real** registered guard driving the **real** handlers — block (write never happens, by the entity manager's write record) and allow (`afterSuccess` fires once), all 11 verbs both ways. **Three disjoint mutations** each reddened exactly the expected tests, every file byte-identical: block path neutered → **11 RED**; one route's guard removed → **that route's 2 RED** (other 9 green); whole `afterSuccess` path severed → **11 RED**. `business_rules` **11 → 0**; total **99 → 88**; wrapper **77 → 88**; guarded **149 → 160**; closure **88+0+35+32+5+0+8+88 = 256**; **19 suites / 393 tests green**; `tsc` exit 0. **Next: `inbox_ops` / `notifications` / `workflows` (10 each).** |
| **12g** | ✅ **`inbox_ops` — a REAL D2-gap (label right), NOT an authorization hole (implication wrong), and the FIRST module with a route that CANNOT be wired — DONE** (code `0350563`) | Measured **10 unguarded verbs / 10 files**, the largest remaining after `business_rules` — and the label was **true**: the routes called **no guard of any kind**. But **every one already enforced its own capability and scoped every lookup by tenant + organisation**, so *"checked by nothing"* was false. **No new wrapper needed — `inbox_ops` already ships `beginInboxOpsMutationGuard()`;** **9 of the 10** now call it before the write, `runAfterSuccess()` after commit. **The tenth CANNOT be wired:** `api/webhook/inbound.ts` is a **public, actor-less** endpoint (the mail provider calls it; there is **no `userId`**). Manufacturing a session would make the registry guard **silently skip** every feature-gated check instead of failing loudly — so it is **set aside by name**, not wired. Taught the tool a new class for it: **`ACTORLESS_SET_ASIDE`** (`ACTORLESS_PATHS`, 1 verb), so the set-aside is **visible, not silently absorbed into the gap count**. **Two routes agree on 10/10:** the tool's `--json` rows, and the module's own `mutation-guard.ts` header naming the same ten. **Narrow gain, stated narrowly:** no `data/guards.ts`, so no `inbox_ops.*` guard exists today — what changed is that the **first** one will be enforced, not skipped. **Proof:** 73 tests, a **real** registered guard driving the **real** handlers — block (423, write recorded as empty) and allow (write recorded, `afterSuccess` once), all 9 wired verbs both ways. **Three disjoint mutations** each reddened exactly the expected tests, every file byte-identical (md5 + zero-deletion diff): block path neutered → **10 RED**; one route's guard removed → **1 RED**; whole `afterSuccess` path severed → **9 RED**. `inbox_ops` **10 → 0** (9 wired + 1 actor-less set aside); total **88 → 78**; wrapper **88 → 97**; guarded **160 → 169**; closure **97+0+35+32+5+0+8+78+1 = 256**; **608 suites / 5232 tests green**; `tsc` exit 0. **Next: `notifications` / `workflows` (10 each).** |
| **12h** | ✅ **`notifications` — NOT a D2-gap; the TOOL was the defect, not the code — DONE** (tool only; repo unchanged at `0350563`) | Measured as **10 unguarded verbs / 10 files**, the joint-largest remaining with `workflows` — but **all 10 already run the registry guard**, through `lib/routeHelpers.ts`, a module-local helper exported three ways (`runGuardedNotificationWrite()` + the factories `createBulkNotificationRoute()`/`createSingleNotificationActionRoute()`, which call it at lines 150/228). **No `api/mutation-guard.ts` wrapper** — which is what the four-symbol scan noticed. **Two routes agree on 10/10:** the tool's `--json` rows, and a hand `find … route.ts` listing exactly ten write-verb files (`unread-count/route.ts` is `GET`-only, hence 10 not 11). **A third, independent route — the module's OWN pre-existing test:** `__tests__/mutation-guard.test.ts` drives **7 of the 10 real handlers** and asserts each calls `runRouteMutationGuards` with the right key; `lib/__tests__/routeHelpers.guard.test.ts` proves the helper is registry-backed. Run: **2 suites / 11 tests green**. **Fix = teach the tool the helper's name** (`LOCAL_GUARD_HELPERS.notifications`, matching any of the three — a regex on the core helper alone would miss the five factory-consuming routes). `notifications` **10 → 0** unguarded (all 10 `GUARDED_LOCAL`); total **78 → 68**; local-helper class **32 → 42**; guarded-only **169 → 179**; closure **97+0+35+42+5+0+8+68+1 = 256**. **No repo change.** **Standing lesson, paid for twice: the label is a four-symbol string scan — measure the premise before applying the fix it implies.** **Next: `workflows` (10 — the sole remaining double-digit module).** |
| **12i** | ✅ **`workflows` — a REAL D2-gap (label right), the LAST double-digit module, and the FIRST with a verb that must NOT be wired because it writes nothing — DONE** (code `a9ecd21`) | Measured **10 unguarded verbs / 10 files**, the joint-largest remaining with `notifications` — and **here the artefact AGREED**: a genuine gap. The wrapper `beginWorkflowsMutationGuard` existed but only the **three definition-write routes** called it; its own header records the gap (*"NOT used by every `workflows` write route … a pre-existing gap"*). **No new wrapper needed;** **9 of the 10** now call it after their gates and before the write, `runAfterSuccess()` after commit (`definitions/route.ts` POST create; `instances/route.ts` POST; `instances/[id]/{advance,cancel,retry,signal}` POST; `signals/route.ts` POST; `tasks/[id]/{claim,complete}` POST). **The tenth must NOT be wired:** `instances/validate-start` POST **performs no write** — `lib/start-validator.ts` touches no entity manager and runs `ruleEngine.executeRuleByRuleId(..., { dryRun: true })`, under which the only writer (`logRuleExecution`) is skipped. A guard there would gate a read and fire an after-success for a mutation that never happened — so it is **set aside by name** in a NEW class **`READ_ONLY_SET_ASIDE`** (`READ_ONLY_PATHS`, 1 verb), visible rather than silently absorbed into either count. **Two routes agree on 13/13:** the tool's `--json` rows (**0 GAP / 13 wrapper verbs**), and a hand scan of all **22 `.ts` files** under `api/` — **13 export a write verb, 12 call the wrapper, the only exception being `validate-start`**. **Proof:** new `d2-gap-wiring.route.test.ts`, **18 tests**, a **real** guard registered in the global store (`runRouteMutationGuards` **unmocked**) driving the **real** handlers — block (423, downstream library never reached) and allow (library called once, `afterSuccess` once), all 9 verbs both ways, **18/18 green**. **Three disjoint mutations** each reddened exactly the expected tests, every file byte-identical (all ten md5 hashes unchanged): block path neutered → **9 block RED**; one route's guard removed (`signals`) → **only that route RED, both ways**; whole `afterSuccess` path severed → **9 allow RED**. *The first run was 14/18 — `definitions` POST and `retry` POST answered **400** from the routes' **own** gates before the guard; both were **test-fixture** errors (a definition needs ≥1 transition + a null duplicate lookup; `retry` needs a `FAILED` stub), not wiring errors — fixed and re-run.* `workflows` **10 → 0** (9 wired + 1 read-only set aside); total **68 → 58**; wrapper class **97 → 106**; guarded-only **179 → 188**; closure **106+0+35+42+5+0+8+1+1+58 = 256**; whole `workflows` module **46 suites / 668 tests green**; core `tsc --noEmit` exit 0. **Next: `attachments` (8 — the largest single-digit module left; no double-digit module remains).** |
| **12j** | ✅ **`attachments` — a REAL D2-gap (label right), and the cleanest kind: a module with NO guard mechanism at all — DONE** (code `88582bd`) | Measured **8 unguarded verbs / 4 files**, the largest single-digit module left after `workflows` — and **here the artefact AGREED**: a genuine gap. A string scan of the whole module found **no wrapper, no `runRouteMutationGuards` call, no `makeCrudRoute`, and neither of the `@deprecated` pair** — so a guard set for `attachments.attachment` / `attachments.partition` would have been **silently skipped**. Upload and delete are the highest-consequence writes in the product: one publishes a file to a storage partition, the other removes both the row and the backing file. **A NEW wrapper** `beginAttachmentsMutationGuard()` (`api/mutation-guard.ts`, mirroring the `business_rules`/`workflows` shape incl. the `runAfterSuccess(resourceIdOverride)` rebind idiom), and **all 8 verbs** now call it after their gates and before the write, `runAfterSuccess()` after commit: `api/route.ts` POST (multipart upload — **before the storage write**) + DELETE; `api/partitions/route.ts` POST + PUT + DELETE (kind `attachments.partition`; guard id = the partition **code**, the id the route's own audit entries carry); `api/library/[id]/route.ts` PATCH + DELETE; `api/transfer/route.ts` POST (one guard per request; N rows in one commit). **What was NOT missing:** every one of the eight verbs already enforces `attachments.manage` through `metadata.requireFeatures`, and every lookup is tenant+org scoped — the wrapper adds the **structural chokepoint**, it does not replace any route's own validation or audit story. **Two routes agree on 8/8:** the tool's `--json` rows (**0 GAP / 8 wrapper verbs**), and a hand scan of `api/` — **8 write-verb exports, 8 `beginAttachmentsMutationGuard` calls**. **Proof:** new `d2-gap-wiring.route.test.ts`, **17 tests** (8 block + 8 allow + 1 unregistered-set control), a **real** guard registered in the global store (`runRouteMutationGuards` **unmocked**) driving the **real** handlers, all 8 verbs both ways, **17/17 green**. **Three disjoint mutations** each reddened exactly the expected tests, every file byte-identical (wrapper md5 `77cee6f20b6b6f72298f73fa3fdd344e`, `transfer` md5 `2a483cb0f6e76ed62661fe1f6d0c4bb7`): block path neutered → **8 block RED** (8 allow + control green); one route's guard removed (`transfer`) → **only that route RED**; whole `afterSuccess` path severed → **8 allow RED** (8 block + control green). `attachments` **8 → 0**; total **58 → 50**; wrapper class **106 → 114**; guarded-only **188 → 196**; closure **114+0+35+42+5+0+8+1+1+50 = 256**; whole `attachments` module **26 suites / 206 tests green**; core `tsc --noEmit` exit 0. **Next: `ai_assistant` (9 — now the largest), then `search` (7) and `webhooks` (7).** |
| **12k** | ✅ **`search` — a REAL D2-gap (label right), and the cleanest kind: a module with NO guard mechanism at all — DONE** (code `0ac8783`) | Measured **7 unguarded verbs / 7 files**, the joint-largest left with `webhooks` — and **the artefact AGREED**: a string scan found no wrapper, no `runRouteMutationGuards`, no `makeCrudRoute`, neither `@deprecated` name. **A NEW wrapper** `beginSearchMutationGuard()`; all 7 verbs wired (kind `search.index` ×6, `search.settings` ×1), each after the route's own gates and before the first write, `runAfterSuccess()` after commit. **Proof:** `d2-gap-wiring.route.test.ts`, **15 tests** (7 block + 7 allow + 1 control), a **real** guard registered and `runRouteMutationGuards` **unmocked**. **Two disjoint mutations** each reddened exactly the expected tests, wrapper restored byte-identical (md5 `bc86104a68c9a43b341a08bd07f78ac1`): block path neutered → **7 block RED**; `afterSuccess` severed → **7 allow RED**. **A hostile critic pass found nothing.** `search` **7 → 0**; total **41 → 34**; wrapper **114 → 121**; guarded-only **196 → 204**; **26 suites / 269 tests green**; `search` `tsc` exit 0. **Next: `webhooks` (7), then `configs` / `currencies` (4 each).** |
| **12l** | ✅ **Four modules recorded as "closed" carried leftover unguarded verbs — two were genuine writes and are now wired, two were measured READ-ONLY and set aside — DONE** (code `workspace/starting-kit`, this change) | A live re-measure after the `search` fix found **four modules whose "0" records were partial**: `directory` **3**, `progress` **3**, `dashboards` **2**, `data_sync` **1**. **Each premise measured before any file was spent** — the label is a four-symbol scan that has over-claimed four times. **They did NOT split the same way.** `directory` **3** (`organization-edges` POST `trx.persist(edge).flush()` :172, PATCH `trx.flush()` :253, DELETE `:309`) → wired into the **existing** `beginDirectoryMutationGuard` (the known `d2-wide` `directory` `D2-gap`, not a regression). `progress` **3** (`progressServiceImpl.ts:119` `em.persist(job).flush()`, `:228`/`:287` `em.flush()`) → a **NEW** `beginProgressMutationGuard()` (the module had **no wrapper at all** — a full module fix, not a leftover). `dashboards` **2** + `data_sync` **1** → measured **READ-ONLY** (`widgetDataService.ts:178-179` only `cache.set`, DB use `execute(<select>)`; `credentials-service.ts:222` `resolve` only reads) → **set aside** and added to the tool's `READ_ONLY_PATHS` (read-only class **1 → 4**). **Proof:** two new suites, **7 tests each**, real handlers, registry **unmocked**; **two mutations per module**, restored byte-identical (`directory` route `3bdf126e35060c61c3108457dc4471e4`; `progress` wrapper `68cc42545d0a43bcd0e808b55d1b2297`) → block neutered **3 block RED**, `afterSuccess` severed **3 allow RED**. **A hostile critic pass found nothing** (0 diffs across every enabled module). `directory` **3 → 0**, `progress` **3 → 0** (wrapper **121 → 127**), `dashboards` **2 → 0**, `data_sync` **1 → 0**; **total 34 → 25**; `directory`/`progress` **32 suites / 256 tests green**; core `tsc` exit 0. |
| **12m** | ✅ **`webhooks` — the label over-claimed by 2 (one re-export shim, one actor-less); the 5 real writes are now wired through a NEW wrapper — DONE** (code `workspace/starting-kit`, this change) | Measured **7 unguarded verbs / 7 files** — the last module above the 4s. **Premise measured first, by two independent routes** (tool `--json` + a hand walk of every `.ts` under `api/`, never globbing `route.ts`). **The 7 split three ways.** **1 FALSE POSITIVE:** `api/route.ts` is a two-line **re-export shim** of a `makeCrudRoute` handler that already reaches the registry — fixed **in the tool** (a bare `export { V }` now reads re-export only when the file does not define `V` locally; proved not to launder a real gap with a synthetic handler). **1 ACTOR-LESS:** `api/inbound/[endpointId]/route.ts` POST is public, writes a receipt with a possibly-null tenant, guarded by its **own** signature/rate-limit — set aside in `ACTORLESS_PATHS` (**1 → 2**). **5 GENUINE writes / 4 files** (`webhooks/[id]` PUT+DELETE, `webhooks/[id]/rotate-secret` POST, `webhooks/[id]/test` POST, `webhook-deliveries/[id]/retry` POST) → **NEW** `beginWebhooksMutationGuard()` (kinds `webhooks.endpoint`/`webhooks.delivery`, `resourceIdOverride` rebind idiom); each wired after its own gates and before the write, `runAfterSuccess()` after commit. **`/test` rebinds to `delivery.id`** (its write creates a new delivery — a `webhooks.delivery` guard must see the created row). **`WebhookRequestScope` gained `userId: string \| null`.** **Proof:** `api/__tests__/d2-gap-wiring.route.test.ts`, **11 tests** (5 block + 5 allow + 1 control), **real** guard + `runRouteMutationGuards` **UNMOCKED**, real handlers, all 5 verbs both ways. **Two mutations** each reddened exactly the expected tests, every file restored byte-identical: block neutered → **5 block RED**; `afterSuccess` severed → **5 allow RED**. **A hostile critic pass attacked all five claims and found one real tool defect (an aliased-entry laundering case), which was then fixed and probed — see Fix 13.** `webhooks` **7 → 0**; **total 25 → 18**; wrapper **127 → 132**; re-export **5 → 6**; actor-less **1 → 2**; guarded-only **209 → 215**; closure **132+0+35+42+6+0+8+2+4+9+0+18 = 256**; whole `webhooks` **15 suites / 127 tests green**; core `tsc` exit 0. |
| **13** | **D3** — add the `escalate` outcome to `MutationGuardResult` | The last guard-engine gap; D2-wide's shape is now settled, so it is unblocked. |
| **14** | **The Metadata Registry** service (GAP A / C5) | The remaining foundation item; everything stacked on it inherits it. |

**Where the reasoning lives:** the order is `BUILD-ORDER.md` §2e; the live counts are in `BACKLOG.md`;
the per-item status is in `BACKLOG.md`. **This box is the only place that says "we are doing X now."**

**The story behind the chain** (kept for context, not needed to start the task):

1. **Document how Hermes serves / is served, per development item** — including the Llama
   integration, the multi-tenant-vs-one-tenant challenge, multi-agents, integrations and MCP.
   Written for a new developer, with no learning curve. → built as
   [`library/development/ARCHITECTURE-hermes-service-map.md`](library/development/ARCHITECTURE-hermes-service-map.md).
2. **Restructure the handover docs** so they do not carry "what is next", and put the live task in
   **this** section. → done for `START-PROMPT.md`, `HANDOVER.md`, `README.md`, `BOOKMARKS.md`.
3. **A new standing rule:** *whatever is ready to be interfaced in the front end, do it — once it
   can be fully functional as a piece, even if unfinished parts are locked or switched off.*
   Updating the front end lets the owner test the micros as work proceeds. → recorded in
   [`WORKING-RULES.md`](library/development/WORKING-RULES.md) and the COOKBOOK.

## 2026-10-09 (newest) — `SD-2` / `S9`: core objects are marked and undeletable, the delete rule lives on **every** path, and two hostile rounds plus a mutation proof corrected the first cut twice

**What happened.** The owner said *"proceed following our wok rules"* on the `SD-2` slice named in the
`★ ACTIVE TASK` box. `SD-2` is dictionary §C.3 / S9: *a core function — the platform's roles-and-permissions
manager being the named example — ships by default and **cannot be deleted**.*

**The challenge first (rule 9b), and it corrected the task.** The item's own sketch — *"a flag on the
function record + a guard on the delete path"* — had **no home**, measured three ways: the `UserFunction`
artifact has **no persistence and no delete** (`document.ts:22-28`; `lifecycle.ts` has only `archived`), no
`isCore`/`undeletable` concept exists anywhere, and a flag on an unbuilt foundation would have been
**stacking on an unfinished base** (rule 10d). But the dictionary's **named example** — the roles-and-permissions
manager = the built-in **`superadmin` role** (`setup-app.ts:20,531,536,569`, tenant-scoped) — **is** a live
surface with a real `DELETE`. So the rule was built where it can actually bite, and the Function flag was
**deferred to `G-09`, scheduled** (CC-32). The comment in the code records *why*, so a later reader does not
"fix" the design back to the sketch.

**What landed (code repo `workspace/starting-kit`).** A shared, testable registry
`shared/src/lib/core-boundary/core-objects.ts` (the one place that says *which* object is core —
`coreObjects()`, `isCoreObject()`, `coreObjectRefusal()`, folding-insensitive), and the enforcement on
**three layers**: the **route** (`auth/api/roles/route.ts`, both `mapInput` and exported `DELETE`), the
**command** (`auth/commands/roles.ts` — `deleteRoleCommand.execute` and both hard-delete store calls), and
the **store** (`DataEngine.deleteOrmEntity`'s new `refuse?` predicate — the choke point every delete funnels
through). 409, not 400 — a well-formed request conflicting with a platform invariant.

**The first cut was WRONG, and a hostile round proved it (rule 4).** Enforcing only at the route was
**bypassable**: `audit-logs/.../redo/route.ts:155` calls `commandBus.execute(log.commandId, …)`, which
re-runs a logged command **without entering the originating route's `mapInput`** — so a role delete refused
at the route could be replayed through redo and succeed. Plus the role-create **undo** path hard-deleted.
"Undeletable by anyone" was **false**. Fixed by moving the rule to the command **and** arming the store hook;
a **second** hostile round then CONFIRMED every claim (redoing the M4 mutation itself, tracing the redo
path by observation: `deleteRoleCommand` has no `redo` method, so the bus falls to `execute` → refuses).

**The mutation proof then found the store hook DECORATIVE.** M4 (silencing `if (opts.refuse)`) went **GREEN**
— the command's own check caught everything first, so the hook could have been deleted by any refactor with
no test noticing. Closed by a dedicated engine suite (`shared/.../deleteOrmEntity.refuse.sd2.test.ts`, 5
tests); re-measured, M4 fails 3. **This is the whole reason the mutation proof runs** (new lesson **L93**).

**Measured:** `core` **630 suites / 5479 tests**, 0 failures; `shared` **201 / 2385** this run (one
**pre-existing, environmental** flake — `dynamicLoader.tsconfig.test.ts`, CC-19 — passes in isolation,
fails under the full run on a clean stashed tree; NOT from this slice); both `tsc` exit 0; **6 disjoint
mutations, all RED**, each restored **md5-identical**; **two separate hostile-critic agents**. My
"shared suite is green" claim was **falsified by the critic** (it hit the 8 failures on the same tree) and
corrected to *"green on this run"* — recorded as lesson **L94**.

**Docs, same change (rule 10f):** `BACKLOG.md` (SD-2 entry rewritten with the full record), `BUILD-ORDER.md`
§7, `platform_points.md` S9 row (☐→☑, with the honest limits), `COMPLETION-CALLBACKS.md` (new `SD-2` section,
**CC-31** name-not-column / CC-32 `UserFunction` flag → `G-09`, and the re-measure list gains `PLAN-SD-2`),
`PLAN-SD-2.md` §7–§10 filled, `LESSONS.md` **L93**/**L94** added, and the **`★ ACTIVE TASK` box** now posts
**`SD-4`/`SD-5`**, with `SD-2` ticked done. *Caught and fixed mid-commit: my scripted edits flipped five docs
LF→CRLF; all converted back byte-clean (HEAD blobs are LF), and `git diff -w` now equals `git diff`.*

## 2026-10-08 (newest) — `CC-30`: the `custom_entities_storage` upsert matched no constraint, and a plain-vs-partial index measurement re-made the design

**What happened.** This is the **write-side sibling of CC-28** — §4.5 of the tenant-isolation forensic. The
custom-entity write path in `packages/shared/src/lib/data/engine.ts` declares
`on conflict (entity_type, entity_id, organization_id, tenant_id)`. The forensic said it omitted `tenant_id`.
It did. Started under the rule-10 package workflow; **the first two steps — study the references, prove the
prerequisite in code — are what corrected the premise, and the correction was larger than the entry.**

**What the live database showed (the premise correction).** The only index on `custom_entities_storage` was
`custom_entities_storage_unique_idx ON (entity_type, entity_id, organization_id)` — created **non-unique**,
and **missing `tenant_id`**. So the shipped conflict target matched **no unique or exclusion constraint at
all**. Postgres raised `ERROR: there is no unique or exclusion constraint matching the ON CONFLICT
specification` on **every** call; the `try/catch` in the engine caught it and fell through to a manual
UPDATE-then-INSERT. **The single-statement upsert had never once run on a real deployment.** The entry
understated the defect *and* named a fix that the database refuses.

**The measurement that re-made the design (three probes, throwaway schemas, both dropped; the real table
verified untouched at 0 rows with its original two indexes).**
- **(A)** A bare `ON CONFLICT (cols)` against a **partial** unique index → **ERROR**, *even when the inserted
  row satisfies the predicate*. Postgres infers the arbiter from **statement** predicates only, never from
  `VALUES`.
- **(B)** The same statement against a **plain** unique index → `INSERT 0 1` twice, **1 row**, `doc` updated
  in place. ✔ the intended behaviour.
- **(C)** Two NULL-scope rows `(e, r, NULL, NULL)` under a **plain** index → **2 rows** (Postgres treats NULLs
  as distinct, so no collision) vs under a **partial** index → **duplicate key rejected**. The two properties
  are **mutually exclusive on one index**.

**The shipped shape.** Because no single index has both properties, the fix is **four indexes**:
- `custom_entities_storage_scope_uq` — **plain** unique on `(entity_type, entity_id, organization_id,
  tenant_id)`; this is what the upsert's conflict target resolves against.
- `custom_entities_storage_tenant_uq` / `_org_uq` / `_global_uq` — **partial** unique on
  `(entity_type, entity_id, tenant_id)` / `(…, organization_id)` / `(entity_type, entity_id)`, each with a
  `where` pinning its null-scope shape.
The legacy `custom_entities_storage_unique_idx` decorator was **removed** (the migration drops the index;
leaving the declaration would have been drift). Migration `Migration20261009090000.ts`; the four statements
are byte-identical to the decorators. **End-to-end live proof:** the migration applied cleanly; the shipped
upsert updated in place (1 row, v=2); two tenants sharing one `organization_id` produced **2 rows** — exactly
the overwrite the fix prevents; a global-scope duplicate INSERT was **rejected** by `_global_uq`.

**A second defect, found by the same package workflow.** `packages/core/src/modules/query_index/lib/engine.ts`
classified an entity as doc-storage-backed by probing two **shared** tables with **no** tenant filter (and
caching by entity alone). So **tenant A's row classified the entity for tenant B**, whose scoped list query
then returned **zero rows**. Now tenant-scoped: the cache key carries `tenantId`, and both probes
(`isCustomEntity`, `hasCustomEntityStorageRows`) apply `.where('tenant_id','=',tenantId)`. **Honest limit:**
the records API was never exposed — `forceCustomEntityStorage` short-circuits the classifier before it runs.

**Verification.** `core` **628 suites / 5463 tests / 0 failures** (the **+12 tests** over CC-28's 5447 is this
slice); `shared` **199 suites / 2368 tests** — the 8 failures in `dynamicLoader.tsconfig.test.ts` are the
sandbox shim's `fs.rmSync` in teardown and are **pre-existing**, proved by stashing all eight tracked files,
moving the untracked migration aside, verifying an empty `git status`, and re-running the pristine suite to
the **identical 8 failures**; `tsc --noEmit` exit **0** on both packages. **6 mutations RED-then-GREEN, each
restore `md5sum`-verified:** M1 (drop `tenant_id` from the target) → 1 RED; M2 (remove the probe tenant
filter) → 1 RED; M3 (drop `tenant_id` from entity + migration) → 2 RED; M4 (re-declare the legacy index
decorator) → 1 RED; M5 (drop the null predicate) → 1 RED; M6 (mutate the snapshot shape to `unique:true` +
`options`) → 1 RED.

**Two hostile-critic rounds ran as separate agents.** Round 1 checked six claims: four held, and it found
**two real errors in my own work** — (i) my first `engine.ts` comment claimed a partial index would resolve
the upsert (measured false: **A** above), and (ii) the snapshot entries I hand-wrote had the wrong shape for
`expression` indexes (they would have made `db:generate` re-emit) — fixed to the shape
`DatabaseTable.addIndex` provably emits and pinned by a test. Round 2 attacked the redesign: claims 1, 3, 5,
6 held; it called A2 and A4 broken — A2 was **correct** and is now the measured rule, A4 was correct and was
fixed. Both round-1 findings were reproduced by hand against the live database before acceptance.

**One more premise corrected by measuring, in the same slice:** the configured snapshot filename is
**hardcoded** — `packages/cli/src/lib/db/commands.ts:95-97` `getMigrationSnapshotName` returns
`'.snapshot-open-mercato'` (with dash), so the sibling `.snapshot-openmercato.json` (no dash) is **dead** —
nothing reads it.

**Code (this commit); docs this commit.** Registers updated: `COMPLETION-CALLBACKS.md` (CC-28's open note
closed + a full CC-30 row), `BACKLOG.md` (new item + header), `RESUME-POINT.md` (§4.5 row → DONE + a CC-30
follow-ons row; next slice → `SD-2` — *corrected 2026-10-08: this line said `SD-3`, which was already built*), `platform_points.md` (the S4 row), `library/analysis/findings/cc30-custom-entities-storage-uniqueness.md` (new), this file.

## 2026-10-08 — `CC-28`: the shared-store read-backs are tenant-scoped, and the forensic's premise was corrected by measuring

**What happened.** The tenant-isolation forensic (2026-10-08, §4.4) found the custom-record `updated_at`
read-backs reading the **shared** `custom_entities_storage` table. It flagged **two** paths and called the
finding **"HIGH (concrete)"**. Task started under the rule-10 package workflow; **the first two steps were
to study the reference and prove the prerequisite in code — and that is what corrected the premise.**

**What the measurement showed (the premise correction).** The forensic said *both* paths omit `tenant_id`.
Both do. But that is not the same as both being a live cross-tenant leak:
1. The **single-record** path (`readCustomEntityRecordUpdatedAt`) filters on **`organization_id`** — and
   `organizations.id` is a `gen_random_uuid()` **primary key** (`directory/data/entities.ts:30-32`),
   i.e. **globally unique**. One tenant's request can therefore **never** match another tenant's org. The
   single path was **not** a live leak; scoping it by tenant is **defence-in-depth**.
2. The **batch** path (in `GET`) filtered on `entity_type` + `entity_id IN (…)` — **neither** `tenant_id`
   **nor** `organization_id`. **This** is the real hole (**MEDIUM**): a record id is a caller-suppliable UUID,
   so a colliding id could merge another tenant's `updated_at` into the response.

So the forensic's severity and its "two live paths" framing were **both corrected** in place (rule 13), in
its §4.4, in `PLAN-SD-1.md` §10, and in the register.

**What changed.** `entities/api/records.ts`: the batch read-back now filters
`.where('tenant_id','=', auth.tenantId!)` and, when the caller is org-scoped,
`.where('organization_id','in', organizationIds)` — matching the query engine's own scoping. The
single-record function gained a required `tenantId` and both call sites (PUT, DELETE) pass
`tenantId: auth.tenantId!`. Three i18n-free, one-file change plus tests.

**Verification.** `entities` module **43 suites / 339 tests green**; `tsc --noEmit` exit **0** on `core`
and `shared`; the **full core suite green five consecutive times** — **628 suites / 5447 tests / 0
failures** each (the **+1 suite / +4 tests** over CC-26's 627/5443 is exactly this slice's additions).
**3 mutations RED-then-GREEN, each restore `md5sum`-verified** to `211ce8f2e28c46e699acc60c1a573429` with
zero markers left:
- **M1** (batch tenant filter removed — the pre-fix shape) → **3 RED**, and the failure output shows the
  **other tenant's** `updated_at` (`2030-09-09T09:09:09.000Z`) leaking into the response — the actual bug,
  reproduced.
- **M2** (org filter removed) → **1 RED** (the org test only).
- **M3** (single-path tenant filter removed) → **1 RED** (the new `records.crud` test only — 25 others stay
  green, so the mutation is surgical).

**The twelfth hostile-critic agent** (a separate agent, a command per claim) **held all seven claims**, and
did real adversarial work: it **stashed the fix and re-ran the pre-fix code**, getting exactly **4 RED**
(the 3 batch tests + the crud single-path test); it verified `auth.tenantId` is guaranteed non-null at the
batch block (`GET` returns 401 earlier) and that `organizationIds` cannot be `[]` there (an empty scope
returns before the read-back); it confirmed `organizations.id` is a globally-unique PK (C3); and it
confirmed the list feeding `recordIds` is tenant-scoped by the query engine (C7). Its one finding — the
stale `packages/core/dist/` build still carrying pre-fix code — is **not tracked and is gitignored**
(`git ls-files` empty; `git check-ignore` → `.gitignore:70`), so it is build output, regenerated on any
build, never committed, never consumed by the tests: recorded, not a code change.

**A test-harness fact worth keeping:** the pre-existing `makeKyselyStub` **ignored `where` entirely**, which
is precisely why this defect hid — a test on that stub could not tell a scoped query from an unscoped one.
The CC-28 tests use a **filter-aware** stub that applies the clauses against a fixture, so an unscoped query
returns the wrong row and the test goes RED.

**Code (this commit); docs this commit.** Registers updated: `COMPLETION-CALLBACKS.md` (CC-28 → DONE),
`BACKLOG.md` (new item + header), `PLAN-SD-1.md` §10 (item 8 done; item 15's premise corrected),
`RESUME-POINT.md`, this file.

## 2026-10-08 — `CC-26`: the "AI user" tick lands in the API-key create form, and an eleventh critic holds all seven claims

**What happened.** The owner approved `CC-26` (2026-10-08) and said *"proceed"*. It is the **missing UI for
a server capability that already existed**: `api_keys.principal_kind` accepts `service | ai_worker`
(`api_keys/data/entities.ts:52-53`; migration `Migration20260812180000.ts:32`; validator
`api_keys/data/validators.ts:33`; persisted at `api/keys/route.ts:126`) — but the shipped create page
exposed **no** such control, so an AI worker could only be marked by a direct API/CLI call.

**What changed.** `api_keys/backend/api-keys/create/page.tsx` now declares an `isAiWorker` **`checkbox`**
field and an `aiWorkerNotice` **`custom`** field gated by
`visibleWhen: { field: 'isAiWorker', equals: true }` — so the notice is revealed **only when the tick is
on** — both named in the group `details`'s `fields` array, with `initialValues.isAiWorker = false`. `onSubmit`
converts the tick to the wire shape: `if (values.isAiWorker === true) { payload.principalKind = 'ai_worker' }`.
Three keys were added **in place** to all four language files (`{en,de,es,pl}.json` — `3 0` each, pure
additions, all valid JSON). Four files changed in the code repo (2 source + 4 i18n + 1 test file).

**The two facts that matter.** (1) **The tick never reaches the wire.** The payload literal assigns only the
named keys, so neither `isAiWorker` nor `aiWorkerNotice` is sent — pinned by test. (2) **An unticked form
sends no `principalKind` key at all** — not `null`, not `undefined` — so the server's `?? null` default and
the `'service'` reading are untouched for every existing caller. Both are pinned by dedicated tests.

**A premise corrected by measuring, not assumed.** My first comment claimed the server schema was "strict
about unknown fields". Measured: `createApiKeySchema` has **no `.strict()`**, so zod would **strip** an
unknown key rather than refuse it. The page therefore converts deliberately — it never relies on the server
rejecting a stray field. (Corrected in the comment; rule 13.)

**Verification.** `api_keys` module **6 suites / 51 tests green**; the page's own suite **7/7**;
`tsc --noEmit` on `core` exit **0**; the **full core suite green six consecutive times** — **627 suites /
5443 tests / 0 failures** each (the **+5** over CC-29's 5438 is exactly this slice's new tests). **3
mutations RED-then-GREEN**, each restore `md5sum`-verified to `651d4a34f09ff97ae4017cb5bd58aa28` with zero
markers left: **M1** (`if (false && …)` — the kind is never sent) → **1 RED**; **M2** (`if (true || …)` —
the kind is always sent) → **2 RED**; **M3** (`visibleWhen` removed) → **1 RED**.

**The eleventh hostile-critic agent** (a separate agent, a command per claim) **held all seven claims**,
naming what it tried to break: a field declared but **ungrouped** (would never render); a **truthy** guard
instead of the strict `=== true`; **tautological** tests that stub the value they assert; i18n keys that were
**re-sorted** rather than added; form-only fields **leaking** onto the wire; and **leftover mutation
markers**. Its one correction is framing, not a defect: the i18n keys are **flat dotted top-level keys**,
not nested objects.

**Code (this commit); docs this commit.** Registers updated: `COMPLETION-CALLBACKS.md` (CC-26 → DONE),
`BACKLOG.md` (item + header), `platform_points.md` (the AI-USERS point's "no UI" clause is now false),
`RESUME-POINT.md`, this file.

## 2026-10-08 — `CC-29`: the guard store now resets, and a tenth critic found three false statements in *my own comments*

**What happened.** `SD-1`'s twelfth slice. `CC-24`'s own mutation pass had found that its test suite left
the `globalThis`-backed **mutation-guard store** dirty. The store had **no reset** and `registerMutationGuards`
**replaces it wholesale**, so any suite that registers a guard changed the state for whatever ran next.
`CC-29`'s callback was explicit: *"export a `resetMutationGuards()` and call it from
`packages/core/jest.setup.ts`, then run the **full** core suite **≥5 times** and require 0 failures."*

**What changed.** `resetMutationGuards()` clears the module-local `_guardEntries` **and** deletes the
`globalThis` slot — both, because `getAllMutationGuards()` prefers the global one but **falls back** to the
local cache, so clearing only the global would let the cache resurrect the old guards. `core`'s
`jest.setup.ts` (`setupFilesAfterEnv`) calls it in a root-level `beforeEach`. A new 5-test suite pins both
stores separately. Four files: 3 changed + 1 new.

**The premise was wrong, and measuring is what caught it.** The `CC-29` row — and `CC-24`'s own code
comments — said the store **outlives a test file into the next one** via `globalThis`. I built a two-file
probe and measured: file A registers a guard and sets the key (`true`); file B reads it as **`undefined`**,
count **0** — **even with the reset switched off**. Jest gives each test *file* its own realm here. The
**real** leak is **within a file**: a guard registered in one test is still returned at the start of the
**next test in the same file** (measured **1**; **0** with the reset wired). So the fix stands, but the
*story* I had copied into three comments was false.

**The tenth hostile-critic agent (a separate agent, a command per claim) held all five claims and found
three real defects — all in my shipped words, none in the code:**
1. **The disproved mechanism, shipped anyway.** I had already measured the cross-file claim false and then
   wrote it into three comments across two repos. **Every copy corrected.**
2. **A wrong count.** "22 of the 23 suites" → measured **18** test files under `packages/core/src`
   (25 repo-wide). Corrected.
3. **A self-contradiction.** One comment said "before each test", another "before each test file". The
   wiring is a `beforeEach` — per **test**. Corrected.

**The lesson, now a working rule:** when a measurement falsifies a premise, correct it **everywhere it was
copied**, not only in the file being edited.

**Verification.** Full core suite green **five consecutive times** — **627 suites / 5438 tests / 0
failures** each — plus a **sixth** green run on the *final* tree after the comment corrections (comment-only,
but re-measured rather than assumed). `tsc --noEmit` exit **0** on `shared` and `core`. Guard-store blast
radius: **19 suites / 209 tests green**. **2 mutations RED-then-GREEN:** M1 (clear only the global slot) →
**3 RED**, md5-verified restore; M2 (reset unwired) → within-file count **1** vs **0** wired — the mutation
that tests the *wiring*, which no unit test of the function can reach.

**Scope, stated rather than silently expanded:** the reset is wired into `core` only. `shared`, `scheduler`,
`search` and `webhooks` also have suites that touch the store and **no** `setupFilesAfterEnv`; that is the
same leak class with no hook to hang the fix on, and is a separate change.

**Code `b129c81`→CC-29 (this commit); docs this commit.** Registers updated: `PLAN-SD-1.md` §9.14/§10,
`COMPLETION-CALLBACKS.md`, `BACKLOG.md`, `BUILD-ORDER.md`, `platform_points.md`, `STATE-OF-PLAY`, this file.

## 2026-10-08 — `CC-24`: the entity reactivation is gated, and the mutation pass found two defects in *my* tests

**What happened.** `SD-1`'s eleventh slice. A custom **entity** brought back from a tombstone via HTTP was
landing with **no** permissions gate: the route reports the operation as `update` for an existing row, and
the only entity gate is `operations: ['create']` — so it never fired. The **field** twin had already been
closed (`CC-22`); this was the entity twin.

**What changed.** `entities/api/entities.ts` now detects the reactivation from the before-state it already
holds (`!isActiveEntity(ent) && (input.isActive ?? true)`), reads the `CC-17` decision carrier (a
**malformed** header is a **400**, before anything is touched), runs the same `evaluateStructureChange` on
the same surface, **refuses fail-closed (422, nothing written)**, and writes the records **after the
flush**. `isActiveEntity` was exported from `entities/lib/register.ts`. **Shape: gate at the route** — the
before-state is in hand, so no new query and no change to the shared guard contract.

**The finding that matters is not the feature — it is what the mutation pass caught.** Two defects, both in
the tests I had just written, both found by a mutation that produced **no RED**:

1. **The `deletedAt` clause of `isActiveEntity` was unpinned in *both* consumers** — dropping it left
   `CC-24` 10/10 and `CC-21` 8/8 GREEN. The clause is the only reader of a row with `deletedAt` set but
   `isActive` still true, and that row is reachable without a caller doing anything unusual. **Fixed:** one
   test in each consumer; the mutation now gives **1 RED in each**.
2. **The suite leaked into the `globalThis`-backed mutation-guard store and broke an unrelated suite,
   flakily.** The store replaces wholesale, no jest config sets `resetModules`, and the guard this suite
   registered **re-armed another file's shared grant mock**. One full run failed exactly one test; the next
   two passed — which makes it *worse*, not better. **Fixed here; widened into `CC-29`**, because I could
   **not** reproduce the failure on demand and a green tick over an unexplained failure is not a result.

**Also this session, a false finding I raised and then killed.** I read a `+CC-24` row in
`git show 595df08 -- …COMPLETION-CALLBACKS.md` as "that commit added the row early". Wrong: the row was
already in `3afebd3`, and the line prints because it is **diff context**. The corroborating reading —
`git diff --stat` naming neither register file — meant they were **already committed**, not that my edits
were lost. Both readings were wrong, and neither was independent: both were interpretations of a
**rendered diff**. Written up as **Rule 12** with its second half: `core.autocrlf=true` on this host makes
a raw byte comparison across the worktree/git boundary meaningless (**CRLF** vs **LF**), which produced a
second false anomaly in the same hour. `analysis/git-diff-blob-vs-worktree-2026-10-08/FINDINGS.md`.

**Verification.** `core` **627 suites / 5438 tests, 0 failures**; `entities` **42/335**; `auth` **80/699**;
`shared` permissions **3/59**; both packages `tsc --noEmit` exit **0**. **6 mutations RED-then-GREEN**, every
restore **md5-verified** (`entities.ts` `35640fb9…`, `register.ts` `93e9077b…`), zero mutation markers left.
A **ninth hostile-critic agent**, run separately and required to attach a command to every claim, found
**nothing falsifiable** across all nine attacks — and independently reproduced the mutation results.

**What it means.** `SD-1` is still `PARTIAL`, but the box's own remaining list is now down to four items:
an enforcement consumer for a *field*'s records (`CC-20`, blocked on `G-04`), the create-branch
double-insert (`CC-23`, needs a migration), the decision actor's authorisation (`CC-25`, confirmed as a
**role permission**), and the **test-store reset** (`CC-29`). The two organisational questions are answered
and confirmed, and produced `CC-26`/`CC-27`/`CC-28`.

**All three are done.** The table above is the queue that followed them; the row marked
**◀ THE ACTIVE TASK** is the work in hand. The milestones reached on the way: `dashboards`, `workflows`,
`inbox_ops`, `perspectives`, `translations`, `planner`, `query_index`, `auth`, `directory` and `feature_toggles`
migrated to the registry (`a05ea2c`, `d3af1b1`, `d89b8f6`,
`e26642c`, `a2f8d5f`, `641d3af`, `cc5a237`, `aeeaad0`, `d682c09`, `5af76bc`) — **every enabled module**; directive 1's map completed to cover every
item and to work the three joints in depth (`807ab40`, `365c4e4`); the two test-suite defects fixed so
the suite is green (`d5567c7`, `fe7c3e5`); the two integration concerns fixed in the docs (this session,
docs `c0b26d2`); the D2-wide **file count corrected** against the commits (this session) and **L91**
recorded.

**Where the reasoning lives:** the order is `BUILD-ORDER.md` §2e; the live counts are in
`BACKLOG.md`; the per-item status is in `BACKLOG.md`. **This box is the only place that says "we are
doing X now."**

---

### ✅ Done recently (ticked, then moved down here)

- **2026-10-09 — `AH-1` (slices 1 + 2) — the agent becomes a kernel object, and can be marked core — BUILT
  and PROVEN; the item stays `☐` (its `reportsTo` edge + relation-typed fields are deferred → `CC-40`).**
  Codes `1a518f8` (slice 1), `acfd020` (slice 2). **The owner's "is an agent core?" leg is RESOLVED and
  built, not a one-off ruling:** an agent's protection tier is the **same per-object SETTING the tables
  use** (`DECISION-agent-protection-tier.md`). **Slice 1** declares the `Agent` as a kernel object
  (`packages/ai-assistant/src/modules/ai_assistant/ce.ts`) — a module-root `ce.ts` is the one channel the
  generator splits into `customEntities` **and** `customFieldSets` (`module-registry.ts:3166`/`:3139`), so
  `buildModelDescriptor` sees the object **and** its six §1.4 fields (`kind`/`owner`/`acts_as`/`role`/
  `runtime`/`autonomy`), `entityClass` CAPABILITY, `accessRestricted`. **Slice 2** admits `agent` on **both**
  axes — `CORE_SETTING_KINDS` (a tier can be assigned) **and** `CORE_OBJECT_KINDS` (the row-level registry
  refuses delete/rename) — carrying its own per-kind `because` (delete) and rename reason, so an agent is
  refused in its own words, not the role's. Seed stays fail-closed: agents are `tenant_structural` (business
  data) unless a superadmin marks one `core`; marking one does **not** protect the others. **One rule-9a fix
  in the same change:** the seed's *empty* inner buckets were unfrozen shared singletons (a pre-existing gap
  the critic proved by mutating `DEFAULT_CORE_SETTINGS.objectTier.column`) — every inner bucket is frozen
  now. **Proof:** `tsc` exit 0; core-boundary **65/65**; `core` **637 suites / 5580 tests** (baseline, no
  regression); `shared` **203/204 suites / 2494/2502** (the 8 are the pre-existing sandbox-shim
  `dynamicLoader` case, **8/8 in isolation**); `ai-assistant` **103/103 / 1438/1438**; **three mutations
  RED-then-GREEN** (remove `agent` from `CORE_OBJECT_KINDS`; remove it from `CORE_SETTING_KINDS`; unfreeze
  the inner buckets), each **md5-verified restored**, LF-0 preserved; **one hostile-critic round as a
  separate agent** (C1–C6 all CONFIRMED — the refactor is behaviour-preserving, the parser still fails
  closed, per-object is honoured). **What remains, and is scheduled:** the `reportsTo` edge and
  relation-typed `owner`/`role`/`actsAs` (→ **`CC-40`**, needs the target entities declared in the kernel);
  the `runtime`/`autonomy` **enforcement** stays `L-01`/`AH-5` and `AH-2` (declared now, enforced there).
  Plan: [`PLAN-AH-1.md`](library/development/PLAN-AH-1.md); design: [`DECISION-agent-protection-tier.md`](library/development/DECISION-agent-protection-tier.md).
- **2026-10-08 — `CC-30` — the `custom_entities_storage` upsert conflict target — DONE and PROVEN.** The
  **write-side sibling of CC-28**: the shared table's upsert declared `on conflict (entity_type, entity_id,
  organization_id, tenant_id)`. **Proved on live PG 17 that it matched no constraint at all** — the only
  index was `custom_entities_storage_unique_idx (entity_type, entity_id, organization_id)`, created
  **non-unique** *and* lacking `tenant_id`, so Postgres raised the ON-CONFLICT-spec error on every call and
  the `try/catch` fallback did the work in silence. **The design was settled by measurement, not assumption:**
  a bare `on conflict` is **never** matched against a **partial** index (even when the row satisfies its
  predicate) — it *is* matched against a **plain** index. Since a plain index cannot enforce the null-scope
  shapes (Postgres treats NULLs as distinct: two `(e, r, NULL, NULL)` rows coexist, measured 2) and a partial
  index cannot satisfy the upsert, the fix is **four indexes — one plain (the conflict target) + three partial
  (the null shapes)**. **A second, independent defect was found and fixed in the same slice:** the read
  classifier in `query_index/lib/engine.ts` probed two **shared** tables with no tenant filter, so tenant A's
  row classified the entity as doc-storage-backed for tenant B. **Proof:** `core` **628 suites / 5463 tests /
  0 failures**; `shared` **199 suites / 2368 tests** (8 pre-existing sandbox-shim `fs.rmSync` failures in
  `dynamicLoader.tsconfig.test.ts`, **proved pre-existing** by stashing all 8 files and re-running to the
  identical 8); `tsc` exit 0 on both; **6 mutations RED-then-GREEN**, all 8 files md5-verified restored; **two
  hostile-critic rounds** as separate agents (round 1 found the partial-index error and a snapshot-shape
  error that would have made `db:generate` re-emit; round 2 attacked the redesign). Two items left for the
  owner: the now-redundant upsert `try/catch`, and `updateCustomEntityRecord`'s not-found `INSERT` having no
  conflict target. Details: `analysis/findings/cc30-custom-entities-storage-uniqueness.md`.

- **2026-10-08 — `CC-28` — the shared-store read-backs are tenant-scoped — DONE and PROVEN.** The custom-record
  `updated_at` read-backs read the shared `custom_entities_storage` table. The **batch** read-back in `GET`
  now filters `.where('tenant_id','=', auth.tenantId!)` (plus `organization_id` when the caller is
  org-scoped); the **single-record** read gained a required `tenantId`, with both call sites passing it.
  **The forensic's premise was corrected by measuring:** the single path already scoped by a globally-unique
  `organization_id` (`organizations.id` is a `gen_random_uuid()` PK), so only the batch path was a live leak
  (MEDIUM, not HIGH). **Proof:** `entities` **43 suites / 339 tests green**; full core suite **green five
  consecutive times** (**628 suites / 5447 tests / 0 failures**); `tsc` exit 0; **3 mutations RED-then-GREEN**,
  md5-verified restores (M1 → 3 RED with the other tenant's timestamp visibly leaking; M2 → 1 RED; M3 →
  1 RED). The **twelfth hostile-critic agent** stashed the fix and re-ran to confirm **4 RED** pre-fix.

- **2026-10-08 — `CC-26` — the "AI user" tick is in the API-key create form — DONE and PROVEN.** The UI for
  a server capability that already existed: `api_keys.principal_kind` accepted `service | ai_worker` but the
  create page exposed **no** control, so an AI worker could only be marked by API/CLI. The page now carries
  an `isAiWorker` **checkbox** and an `aiWorkerNotice` **custom** field revealed by
  `visibleWhen: { field: 'isAiWorker', equals: true }`, and `onSubmit` sends `payload.principalKind =
  'ai_worker'` **only when ticked** — an **unticked** form sends **no `principalKind` key at all**, and the
  form-only fields never reach the wire. **Proof:** `api_keys` module **6 suites / 51 tests green**; `tsc`
  exit **0**; full core suite **green six consecutive times** (**627 suites / 5443 tests / 0 failures** —
  the +5 over CC-29 is this slice's new tests). **3 mutations RED-then-GREEN**, md5-verified restores; the
  **eleventh hostile-critic agent** held all seven claims. A premise was corrected by measuring: the server
  schema is **not `.strict()`**, so zod would strip an unknown key rather than refuse it.

- **2026-10-07 — `GAP A / C5` — the Metadata Registry — DONE and PROVEN — PHASE 0 IS COMPLETE** (code
  `59ab859`; plan `library/development/PLAN-metadata-registry.md`). The kernel built a canonical model but
  was a **view**, not a **service** — nothing could answer blueprint §54's *what exists / who owns it /
  what depends on it / who can access it*. **The registry is that service** (read-only). It answers **what
  exists · what type · provenance · what depends on it** (transitive reverse-edge closure over **declared**
  relationships, with a caveat) and returns a **typed absence** `{known:false, question, reason}` for the
  other **ten** §54 questions — so the gap is queryable, not hidden. **A live view** (reads the descriptor
  at query time), not a copy; not tenant-scoped by construction (it describes the platform's *shape*; the
  rows are C3/query layer). **Honest scope:** GAP A is two halves — the registry (**done**) and the
  `Resource` envelope (a Phase −1 contract, C1, **not** built). **A hostile-critic pass found TWO real
  holes, both fixed:** (1) the first draft indexed the model at construction — a *snapshot* contradicting
  the "impossible to go stale" claim; (2) the drift test was *tautological* and could not detect a dropped
  §54 question. **Proof:** 25 assertions, 6 groups; RED-then-GREEN across **4 disjoint mutations**
  (dependents closure · typed-absence path · snapshot-vs-live · dropped question); shared+core typecheck 0;
  kernel suites 6/6 (76 tests).

- **2026-10-07 — `D3` — the guard result's third outcome, `escalate` — DONE and PROVEN** (code `ba8a25c`;
  plan `library/development/PLAN-D3-escalate-outcome.md`). A mutation guard
  could answer only yes/no, so a guard wanting a *review* had to abuse `ok:false` (a hard refusal),
  collapsing "forbidden" and "hold for a person" into one. **D3 adds the third answer:** `ok:true` **and**
  an `escalation` block `{gate, rule, because, status?}` — treated as **not performed** (no mutation, no
  `afterSuccess`, no `modifiedPayload`, chain short-circuits). Status **202**. **Why the guard does not
  file the pending act:** `authority_pending_acts` needs a `commandId` + `capabilityId` to replay on
  approval, and a guard has neither — so the guard **defers**; the act stays on the command path. Owner
  confirmed guard-level, additive-only. **Proof:** RED-then-GREEN across 3 layers (registry · route
  wrapper · **factory mutation proof** — POST/PUT/DELETE leave the row untouched, emit no event, return
  202 `pending_review`); 11 assertions all RED on neutralisation, all GREEN after byte-identical restore;
  **shared 194 suites / 2278 tests green**; typecheck shared+core+scheduler+search+webhooks = 0 errors;
  core **616 passed / 1 failed** — and **the 1 failure was a real defect, now FIXED** (see the next entry).
  **A hostile-critic pass
  found a REAL hole and it was closed:** 7 raw-registry sites used helpers whose *declared* return type
  dropped `escalation`, so callers checked only `!ok` and would have committed on an escalate — fixed at
  the source (all 6 helpers return `MutationGuardRunResult`; **36 sites / 32 files** widened). Parked
  modules (`staff`/`payment_gateways`/`sales`) proven only by isolated `tsc` (0 syntax errors). Full detail
  below and in `BUILD-ORDER.md` §2 / `BACKLOG.md` item **D3**.
- **2026-10-07 — the pre-existing coverage-guard failure is FIXED, and D3's three open notes each got an
  owner** (code `9068f70`; docs `7a0d0ef`). Owner's instruction: *"we cant leave it open ending. either you
  document in backlog to fix later or documnt and fix immediately."* **(a) The failure — fixed immediately.**
  `optimistic-lock-command-coverage.test.ts` matched **raw file text**, so a **comment** naming the helper
  (`currencies/api/mutation-guard.ts`, the `directory`-trap write-up) counted as a call site — a check that
  could not see its own documentation (lesson **L91**). Fix: strip `//` and `/* */` comments before matching.
  **Proven tightened, not hollowed:** a scan showed **16 raw hits vs 15 code hits** (the one difference is
  exactly that comment; all 15 real hits were already allowlisted, so no drift was unmasked); a 6-case
  falsification probe; and the strongest — injecting a genuine un-allowlisted helper call turns the real
  test **RED**, reverting turns it **GREEN**. (The probe also corrected my own over-claim: the negative
  lookahead fixes *no* live false positive on the async seam — measured, not assumed.) **Core suite now 617
  suites / 5321 tests, 0 failures.** **(b) Parked-module sites — documented** in `BACKLOG.md`'s
  deferred-by-decision table with the trigger *"the first time the module is un-parked"*. **(c) Latent-by-
  design (no guard emits `escalation` yet) — recorded** as D3's **acceptance criterion** for the first
  escalating guard (4 numbered conditions), pointed at from `SD-4`'s D3 clause.
- **2026-10-07 — `D2-gap` COMPLETE — the write-verb sweep closed 0 unguarded across all 35 enabled
  modules** (code `7494fbe`; analysis `analysis/d2-gap/`). Re-measured: **256 write verbs, 0 unguarded**;
  227 guarded (142 wrapper · 1 registry · 35 crud · 43 local helper · 6 re-export) · 8 auth-flow + 5
  actor-less + 7 read-only + 9 guard-system verbs set aside (closure `142+1+35+43+6+0+8+5+7+9+0+0 = 256`).
  Plus a class the scan cannot count — **a GET that WRITES**: 3 found, 0 unguarded, 1 fixed (the
  `communication_channels` oauth callback), 2 set aside by name as read side-effects (`dashboards/api/layout`,
  `messages/api/[id]`), owner-settled. The box above carries the full per-module chain; `BUILD-ORDER.md` §2f
  and `BACKLOG.md` item **D2-gap** carry the 18 fixes.
- **2026-10-06 — `D2-gap` MEASURED across every enabled module, and the FIRST module fixed** (code
  `4ef5812`; analysis `analysis/d2-gap/`). The sweep: 35 enabled modules · **256 write verbs** ·
  **158 unguarded now / 160 before the fix** · 8 auth-flow verbs set aside · 90 guarded
  (50 wrapper · 35 crud · 5 re-export). Per module: `ai_assistant` **24**,
  `messages` 17, `communication_channels` 15, `auth` 12, `business_rules` 11, `inbox_ops` 10,
  `workflows` **10**, `notifications` 10, `attachments` 8, `search` 7, `webhooks` 7, then 4/4/4/4, 3/3,
  2, 1/1/1, and 0 for seven modules. **8 of 9 previously-recorded modules agree exactly; the ninth
  record was wrong** — `workflows` was recorded "13 of 19", measures **10**, because two counted files
  (`tasks/route.ts`, `events`) export **no write verb** (checked twice: today's file and `git show
  d3af1b1:…`). **Two unit errors in my own first pass, both fixed in the tool and both found by
  comparison, not by re-running:** files counted where the backlog counts **verbs**
  (`organization-edges` = 1 file / 3 verbs), and a guarded CRUD re-export misread as unguarded
  (`export const POST = crud.POST`, in `auth`). **`audit_logs` FIXED and PROVEN:** both write routes
  (`undo`, `redo`) called no guard at all → 2 unguarded verbs → 0, via a new `beginAuditLogsMutationGuard`;
  guarded against the **log entry's own `resourceKind`** (fallback `audit_logs.action_log`) so the path
  that *reverses* a protected write is described by a guard; 7 new tests, **3 disjoint mutations** proved
  they bite, wrapper restored byte-identical; 16 suites / 108 tests green; core `tsc --noEmit` exit 0.
  Full detail: `analysis/d2-gap/FINDINGS.md`, `BUILD-ORDER.md` §2f, `BACKLOG.md` item **D2-gap**.
- **2026-10-06 — `feature_toggles` D2-wide migration** (code `5af76bc`). 2 calls / 1 file → **1 guard
  object**; count **108 → 106** (files **41 → 40**); `feature_toggles` measures 0. **Thirteenth and LAST
  enabled module — the D2-wide sweep of enabled modules is complete.** **The plan's figure held.** **No
  `D2-gap`:** walked every write verb and named its guard — `overrides` PUT → the new wrapper; `global`
  POST/PUT/DELETE → **`makeCrudRoute` → `collectAndRunGuards()`**; the four `check/*` routes (boolean, json,
  number, string) are **read-only** (checked, not assumed). **The shape that is new here:** the PUT
  validates the guard set against `existingOverride?.id ?? parsed.data.toggleId`, but the command may
  **create** a row whose generated `overrideToggleId` differs — so the wrapper's `runAfterSuccess(idOverride)`
  re-collects the guard set for the produced id and runs that (safe: `validate` is a pure predicate). The
  test proves the rebind by asserting the registry is called **twice** (validated id, then produced id).
  **A naming trap already recorded applies here too:** the route also calls
  `enforceCommandOptimisticLockWithGuards`, whose `...WithGuards` suffix means the *command optimistic-lock*
  guard service — **not** mutation guards; a `grep -i guard` shows the file "guarded" when only this wrapper
  is the mutation guard. **Tests:** 1 suite repaired (`api/overrides/__tests__/mutation-guard.test.ts`) — it
  stubbed the **DI `crudMutationGuardService`**, now stubbed to **only** the registry call
  `runRouteMutationGuards`, wrapper running for real; **5 tests green**. **Mutations bit:** block path
  disabled → **2 RED**; `runAfterSuccess` neutered → **2 RED** (a **disjoint** set); wrapper restored
  md5-identical `7b5514c22a8d4a78962e663725c6df24`. **Critic pass mutated the ROUTE file:** block return
  removed → **2 RED**; after-success call removed → **2 RED**; all files restored **byte-identical**.
  `feature_toggles` module **14 suites / 84 tests green**; core `tsc --noEmit` exit 0. **Counts re-measured
  two independent ways:** repo-wide **108 → 106**, files **41 → 40**; both `grep` and `git grep` agree, and
  the delta (−2 sites / −1 file) equals exactly this module's calls. Full entry below.
- **2026-10-06 — `directory` D2-wide migration** (code `d682c09`). 2 calls / 1 file → **1 guard object**;
  count **110 → 108** (files **42 → 41**); `directory` measures 0. Twelfth enabled module. **Almost no
  `D2-gap`** — the module's entire gap is **3 unguarded verbs in 1 file** (`organization-edges`
  POST/PATCH/DELETE), against `auth`'s 12, and all three are protected by other controls that are now
  named: `requireFeatures: ['directory.organizations.manage']`, a verified-tenant `resolveScope()`,
  `assertOrganizationsInTenant()` ("the tenant boundary for this table"), audit rows, and the OSS
  optimistic-lock floor. **A naming trap recorded:** `enforceCommandOptimisticLockWithGuards` does **not**
  run mutation guards — its `...WithGuards` suffix means the *command optimistic-lock* guard service, so a
  `grep -i guard` shows the file as "guarded" when it is not mutation-guarded. **Two traps caught by
  running tests, not by reading:** **(1)** the wrapper header contained the literal `` `get/*/lookup.ts` ``
  — the `*/` inside the glob **closed the JSDoc early** and the file would not parse; **(2)** the header
  *named* `enforceCommandOptimisticLock(` in prose, and `optimistic-lock-command-coverage.test.ts` regexes
  **raw file text** without stripping comments — so the wrapper was reported as a bypassing direct call
  site and the full suite went **1 test RED**, from a **comment**, in a file that calls neither helper. The
  first rewrite quoted the regex and **contained the call syntax again**, reproducing the failure. Fixed by
  naming both helpers without parentheses; recorded as **L91**. **A full-suite run caught this** — a
  targeted module run would not have. **Counts re-measured two independent ways, and the FILE COUNT WAS
  CORRECTED** (see below).
- **2026-10-06 — the D2-wide FILE COUNT was wrong in the docs, and was corrected** (docs, this session).
  `auth` was recorded as files **45 → 44** and `query_index`/`planner` as ending at **43**/**45**.
  Re-measured at **every commit** (`git grep <commit>`), the true chain is
  **78 → 77 → 69 → 63 → 59 → 56 → 52 → 49 → 47 → 45 → 43 → 42 → 41**: every per-module **delta** was
  right, but the `auth` row re-used `query_index`'s *before* value (45) as its *after* value, and the error
  propagated into `BUILD-ORDER.md`, `HANDOVER.md` and this file. **The site counts were always right**
  (200 → 108, verified at every commit). **No filter ever produced 44** — it was arithmetic drift, not a
  measurement. **The rule: derive the chain from the commits, never carry a number forward.**
  **A second count trap was caught and recorded this session (L92):** re-deriving the "before" figure with
  `git grep <rev>` and the *working-tree* classifier gave `139 sites / 1 file` instead of `108 / 41` — because
  `git grep <rev>` prints a **fourth** field (the revision) and `split(':', 2)` collapsed every match into one
  pseudo-file. It failed *toward a plausible number* and nearly rewrote six documents. Fixed with a prefix-aware
  `split(':', 3)`; the corrected probe confirmed **108 → 106, 41 → 40**, delta exactly the module.
- **2026-10-06 — `directory` D2-wide migration** (code `d682c09`). 2 calls / 1 file → **1 guard object**;
  count **110 → 108** (files **42 → 41**); `directory` measures 0. Twelfth enabled module — **and the
  cleanest so far on `D2-gap`.** Walked every write verb and named its guard: `organization-branding` PUT
  → the new wrapper; `organizations` and `tenants` POST/PUT/DELETE → **`makeCrudRoute` →
  `collectAndRunGuards()`** (the registry, `factory.ts:615-618`); `organization-switcher` is **GET only**
  (checked). **The entire gap is 3 unguarded verbs in 1 file** (`organization-edges` POST/PATCH/DELETE) —
  against `auth`'s 12 — and all three are protected by other controls: `requireFeatures:
  ['directory.organizations.manage']`, a verified-tenant `resolveScope()` (401), `assertOrganizationsInTenant()`
  ("the tenant boundary for this table" — both endpoint orgs must be in the caller's tenant), a self-edge
  and tree-inversion refusal, a `writeDirectWriteAuditLog()` row per verb, and the OSS optimistic-lock
  floor on PATCH. **A naming trap recorded:** `enforceCommandOptimisticLockWithGuards` does **not** run
  mutation guards — its `...WithGuards` suffix means the *command optimistic-lock* guard service; a
  `grep -i guard` shows the file as "guarded" when it is not mutation-guarded. **Tests:** 1 suite repaired
  (`organization-branding/__tests__/route.test.ts`) — it stubbed the **DI `crudMutationGuardService`**,
  now stubbed to **only** the registry call `runRouteMutationGuards`, wrapper running for real; **13 tests
  green** including three guard-shaped (the registry call's shape; deny → 423, no flush; "does NOT run
  after-success when blocked"). **Mutations bit:** block path disabled → **2 RED**; `runAfterSuccess`
  neutered → **1 RED**; wrapper restored md5-identical `9427d68151ecff5823587b65dd937f8e`. **Critic pass
  mutated the ROUTE file:** block return removed → **2 RED**; after-success call removed → **1 RED**; all
  files restored byte-identical. **Two traps, both caught by running tests:** **(1)** a `*/` inside the
  header's literal `` `get/*/lookup.ts` `` **closed the JSDoc early** and the file would not parse;
  **(2)** the header *named* `enforceCommandOptimisticLock(` in prose, and
  `optimistic-lock-command-coverage.test.ts` regexes **raw file text** without stripping comments — so the
  wrapper was reported as a bypassing direct call site and the **full suite went 1 test RED**, from a
  comment, in a file that calls neither helper. The first rewrite quoted the regex and **contained the call
  syntax again**, reproducing it. Fixed by dropping the parentheses; recorded as **L91**. **A targeted
  module run would have missed (2) entirely** — the guard lives in `src/__tests__/`. `directory` module
  **27 suites / 194 tests green**; **whole core suite 603 suites / 5136 tests green**; core `tsc --noEmit`
  exit 0. Full entry below.

- **2026-10-06 — `auth` D2-wide migration** (code `aeeaad0`). 2 calls / 1 file → **1 guard object**;
  count **112 → 110** (files **43 → 42**; the docs first said `45 → 44` — corrected, see above);
  `auth` measures 0. Eleventh enabled module. **The real finding
  is not the 2 calls — it is what sits under them.** `auth` has **18 files exporting a write verb**, and
  **only 3 are guarded** (`users/resend-invite` → this wrapper; `users/route.ts` and `roles/route.ts` →
  `makeCrudRoute` → `collectAndRunGuards()`). **12 resource-write verbs across 10 files call no guard at
  all** — `users/acl` (PUT), `roles/acl` (PUT), `sidebar/preferences` (PUT, DELETE), `sidebar/variants`
  (POST), `sidebar/variants/[id]` (PUT, DELETE), and five `authority/*` routes (POST each). That is
  **`D2-gap`, the worst measured**, recorded in the wrapper header + BACKLOG item **`D2-gap`**, **not**
  fixed here. **A wrong claim was caught before it shipped:** the header's first draft named a
  **different, wrong** `D2-gap` set from memory (listed `users/route.ts` as unguarded; counted
  `authority/projects` and `sidebar/variants` wrongly) — corrected against the walk. `users/route.ts`
  **is** guarded, and **`authority/projects/route.ts` exports GET only** (5 authority write routes, not
  6). **Auth-flow endpoints were set aside, not counted:** `login`, `logout`, `reset`,
  `reset/confirm`, `session/refresh`, `profile`, `locale`, `feature-check` call no mutation guard either
  but change session/credential state and are guarded by their own mechanisms. **One caution stated
  because it is load-bearing:** the mutation guard is **not** what protects this route — that is
  `assertActorCanAccessUserTarget()` (`lib/grantChecks.ts:130`), before the guard. **Tests:** 1 suite
  repaired (`resend-invite.route.test.ts`) — it mocked the **deprecated pair**, now stubbed to **only**
  the registry call `runRouteMutationGuards`, wrapper running for real; **15 tests green** including two
  new (the registry call's shape, with `organizationId` asserted as the **target user's** org; and "does
  NOT run after-success when the guard blocks"). **Mutations bit:** block path disabled → **2 RED**;
  `runAfterSuccess` neutered → **1 RED**; wrapper restored md5-identical
  `bfdd5a9b340bdfbc805e62c3db806315`. **Critic pass mutated the ROUTE file:** block return removed →
  **2 RED**; after-success call removed → **1 RED**; all files restored byte-identical. `auth` module
  **78 suites / 653 tests green**; **whole core suite 603 suites / 5135 tests green**; core
  `tsc --noEmit` exit 0. Full entry below.

- **2026-10-06 — `query_index` D2-wide migration** (code `cc5a237`). 4 calls / 2 files → **2 guard objects**;
  count **116 → 112** (files **45 → 43** — this pair was correct; only the *next* module's row drifted, see
  the file-count correction above); `query_index` measures 0. Tenth enabled module. **Neither handler
  is a `route.ts`** — `reindex.ts` and `purge.ts` both export a **named** `POST` with
  `metadata = { POST: { requireAuth: true, requireFeatures: [...] } }`, so a `route.ts`-only glob finds
  neither file; found by walking every `.ts` under `api/`. **The test mocked the deprecated DI service**
  (`crudMutationGuardService.validateMutation` / `afterMutationSuccess`) — the wrong target now, and the
  exact shape that makes a mutation invisible; re-pointed to stub **only** the registry call
  `runRouteMutationGuards`, wrapper running for real. Its 6 tests assert the registry call's
  `{ container, req, auth, input }` shape, both deny paths, both allow paths, and the call ORDER
  (guard < emit < after-success) the original suite asserted. **Mutations bit:** block path disabled →
  **2 RED** (both deny-path tests); `runAfterSuccess` neutered → **2 RED** (both allow-path tests) —
  disjoint, 2+2 of 6; the two "queues without inline delivery" tests assert neither path and correctly
  stay green. Wrapper restored md5-identical `b9f437fe0d7bac77bdc5125414582c9e`. **A critic pass went
  further and mutated the ROUTE files, not the wrapper, one at a time:** removing `if (guard.blockedResponse)
  return …` from `reindex.ts` → the reindex deny test **RED** (purge stayed green); removing
  `await guard.runAfterSuccess()` from `purge.ts` → the purge allow test **RED** (reindex stayed green).
  All three files restored byte-identical. `query_index` module **21 suites / 125 tests green**; **whole
  core suite 603 suites / 5133 tests green**; core `tsc --noEmit` exit 0. **Scope:** exactly **2 write
  verbs and both are guarded → no `D2-gap`** (like `perspectives`, `translations`, `planner`). Full entry
  below.
- **2026-10-06 — `planner` D2-wide migration** (code `641d3af`). 4 calls / 2 files → **2 guard objects**; count
  **120 → 116** (files **47 → 45**); `planner` measures 0. Ninth enabled module. **The plan's figure held
  for the first time** — 4 calls / 2 files → 2 objects, re-derived by walking every `.ts` under `api/`
  rather than inherited; L87 asks for re-derivation, not for the number to be wrong. **Both handlers are
  named `POST` exports, not `route.ts`** — the same trap `translations` hit, and a `route.ts`-only glob
  finds neither file. **Two behaviour points settled by reading, not assuming:** the guard input's
  `requestMethod`/`requestHeaders` are derived by the registry from `req` (equivalent), and the hand-rolled
  `shouldRunAfterSuccess` gate is **already applied inside the registry** (`mutation-guard-registry.ts:117`),
  so calling `runAfterSuccess()` unconditionally is a no-op. **Scope: no `D2-gap`** — all 5 write verbs
  guarded; the 3 factory verbs already run the registry via `collectAndRunGuards()`. Mutations bit:
  block path disabled → **2 RED**; `runAfterSuccess` neutered → **2 RED** (2+2 of 4, every test covered);
  wrapper restored md5-identical `2bc9646e2ae83399011a8f5dd94f96f6`. `planner` module 13 suites / 53 tests
  green; **whole core suite 603 suites / 5133 tests green**; core `tsc --noEmit` exit 0. Full entry below.

- **2026-10-06 — `translations` D2-wide migration** (code `a2f8d5f`). 6 calls / 2 files → **2 guard
  objects**; count **126 → 120**; `translations` measures 0. Eighth enabled module. **Three things made it
  different from the seven before it.** (1) **The plan's "4 guard objects" was wrong** — it counted each
  route *file* as contributing a guard per exported verb, but the routes collect **one guard each**, and
  `put/locales` and `[entityType]/[entityId]` are two different routes: it is **2**, and the count drops
  **6**. (2) **`put/locales.ts` is not a `route.ts`** — it exports a default handler with
  `metadata.path = /translations/locales`, so a scan globbing only for `route.ts` skips it silently and
  would report the module clean while leaving it on the deprecated resolver. Found by walking every `.ts`
  under `api/`. (3) **The first module where the id changes between the guard and the after-success**, so
  the first real use of `runAfterSuccess(resourceIdOverride)`: the old code passed the composite
  `${entityType}:${entityId}` to the after-success instead of the row id the write produced; the wrapper
  now re-binds to `result.rowId` (both branches tested). Mutations bit: block path disabled → **3 RED**;
  `runAfterSuccess` neutered → **3 RED**; wrapper restored md5-identical
  `cab5084e343f9f7a076e0ae8427ccc52`. `translations` module 16 suites / 215 tests green; **whole core suite
  603 suites / 5133 tests green**; core `tsc --noEmit` exit 0. **Scope: no `D2-gap`** — all 3 write verbs
  guarded. Full entry below.
- **2026-10-06 — `perspectives` D2-wide migration** (code `e26642c`). 8 calls / 3 files → 4 guard objects;
  count **134 → 126** (files **52 → 49**); `perspectives` measures 0. Seventh enabled module. **Two things
  made it different from the six before it.** (1) **The POST route guards two resources in one request** —
  a personal perspective and, when the payload carries role ops, a role perspective with
  `resourceId = targetRoleIds.join(',')`; each is a separate guard object evaluated independently, each
  keeping its own after-success condition (personal unconditional, matching the old always-true
  `shouldRunAfterSuccess`; role only when `applyToRoles.length > 0 || clearedRolePerspectiveCount > 0`).
  The `hasRoleOps`/`targetRoleIds`/`applyToRoles`/`clearRoleIds` definitions were verified **byte-identical
  to HEAD** so nothing shifted silently. (2) **It is the first module with NO `D2-gap`** — all **3** write
  routes are guarded; the only unguarded route is `GET` on `[tableId]`, which reads. Mutations bit:
  block path disabled → **2 RED** (both deny-path tests); `runAfterSuccess` neutered → **5 RED** (every
  allow-path test plus the clear-only no-op that counts one call); wrapper restored md5-identical
  `acbd7125327bfdb0a79c12f2028b3888`. `perspectives` module 7 suites / 44 tests green; core and shared
  `tsc --noEmit` exit 0. Full entry below.
- **2026-10-06 — `inbox_ops` D2-wide migration** (code `d89b8f6`). 8 calls / 4 files → 4 guard objects;
  count **142 → 134**; `inbox_ops` measures 0. Sixth enabled module. Straightforward because the module
  already had a dedicated guard suite — it just mocked the **old** module, so it was repointed to stub
  **only** the registry call `runRouteMutationGuards` and let the wrapper run for real. Mutations bit
  cleanly: block path disabled → **4 RED**; `runAfterSuccess` neutered → **4 RED**; wrapper restored
  md5-identical `9490fbfc2b3515ef67a7131b941342d2`. `inbox_ops` api 15 suites / 107 tests green; whole
  module 35 suites / 395 tests green; core `tsc --noEmit` exit 0. **Scope recorded in the wrapper
  header:** 4 of the module's 14 write routes are guarded; **10 call no guard at all** (`D2-gap`). Full entry below.
- **2026-10-06 — `workflows` D2-wide migration** (code `d3af1b1`). 9 calls / 3 files → 4 guard objects;
  count **151 → 142**; workflows measures 0. Fourth enabled module. **The proof's first attempt was
  wrong and is recorded:** the tests mocked the *module wrapper*, so both mutations left the suite green
  — the mutation never ran. Fixed by stubbing only the registry call `runRouteMutationGuards` and adding
  a dedicated suite; the mutations then bit (block path disabled → **5 RED**; `runAfterSuccess` neutered
  → **3 RED**; wrapper restored md5-identical `b969e361b9c727e61f3365f0f9cae1b0`). **Note:** that md5 is
  the state *the mutation proof ended in*. A later **comment-only** scope edit (see the hostile-pass
  correction below) changed the file to `bc030d318c0baeb23d875727d65ee9dc` — the fix hash is not the
  hash you will see in the tree now; the difference is header prose, not logic, and the suites were
  re-run green after it). Whole `workflows` module 45 suites / 650 tests green; core `tsc --noEmit` exit 0. Full entry below.
- **2026-10-06 — directive 1 deepened: Part II of the Hermes service map** (docs `365c4e4`). The owner
  asked for a plan a junior developer can execute flawlessly; Part II works the three real joints in
  depth — agent identity (`AH-1`), the tool door + authorization (`S-02`/`AH-8`), and "Hermes learns as
  you go" (`AH-9`) — plus the D2-wide walkthrough, every path read from source. Full entry below.
- **2026-10-06 — directive 1 completed: the Hermes service map now covers *every* item** (docs below).
  Added §4.4 to `ARCHITECTURE-hermes-service-map.md` — the owner's directive was "every bit of
  development in our log where needed", and the first pass named only 11 items while the BACKLOG holds
  ~20 that touch AI. Coverage now measured: **41 backlog ids, 0 missing**. Full entry below.
- **2026-10-06 — `explicit-sort-comparators` audit fixed** (code `d5567c7`). **16 violations across 6
  files**, not the 2 a summary had claimed — the site list was read from the test's own output. Added the
  canonical comparator at all 18 sites; audit 4/4 green; 336 touched-package tests green; 7/7 equivalence
  probes byte-identical. Full entry below.
- **2026-10-06 — the owner's three directives** (docs `54459c1`): the `★ ACTIVE TASK` convention in
  this file; the Hermes/Llama service map; the front-end rule in `WORKING-RULES.md` + COOKBOOK rule 5.
  Full entry below.
- **2026-10-06 — `dashboards` D2-wide migration** (code `a05ea2c`). 10 calls / 4 files → 5 guard objects;
  count **161 → 151**. Four test suites repaired and mutation-proven (block path disabled → 4 red;
  `runAfterSuccess` neutered → 4 red; wrapper restored md5-identical). Full entry below.
- **2026-10-06 — `dictionaries` D2-wide migration** (code `43e4e5d`, docs `7987f2a`). 16 calls / 6
  files → 9 guard objects; 15 suites / 74 tests green; core `tsc --noEmit` exit 0; two mutations
  proved the tests bite (block-path disabled → 6 red; `runAfterSuccess` neutered → 8 red). Repo-wide
  count **177 → 161**. Full entry below.
- **2026-10-06 — `data_sync` D2-wide migration** (code `c6c3151`, docs `a4ac202`). 19 calls / 7
  files retired; full entry below.
- **2026-10-06 — D1** — the tier mapping / defaults / fallbacks became a superadmin **setting**
  (`module_configs`), seeded from the dictionary, failing closed (code `558cfab`, `6726573`,
  `a3b58ad`). Full entry below.
- **2026-10-06 — D0** — the generated guard registry now delivers guards, mutation-proven
  (code `d225602`). Full entry below.

---

## 2026-10-06 (newest) — `D2-gap` measured across every enabled module, and its first module fixed (`audit_logs`)

**The task this box now carries.** With the `D2-wide` sweep of enabled modules complete, the next live
defect is **`D2-gap`** — write routes that call **no guard at all** (neither the registry, nor the
deprecated pair, nor `makeCrudRoute`). This session: **measure it across every enabled module**, then
**fix it module by module, largest first.**

**Why it is a defect, in one line.** A write that calls no guard is a write **no Hermes authorization can
ever reach** (Hermes map §4.4 (b)) — so it is precisely where a tool call touches data that no
authorization describes. And "0 remaining on `D2-wide`" does **not** mean "the module is guarded" — a
module can be finished there and still wide open here.

**The measurement — built as a re-runnable tool, not a one-off number.** `analysis/d2-gap/measure.js`
(+ `--json`), FINDINGS.md in the same folder. It reads the enabled set from
`apps/mercato/src/modules.ts` (**not** a hand-typed list), **strips comments before looking for guards**
(so a guard *named in prose* is not counted — the L91 lesson), **counts verbs not files**, and sets the
eight auth-flow endpoints aside **by name** so the figure stays comparable with the backlog record.
Headline: **35 enabled modules · 256 write verbs · 158 unguarded now (160 before the `audit_logs` fix) ·
90 guarded** (50 wrapper · 35 `makeCrudRoute`/`crud.` · 5 re-exported guarded factory · 0 deprecated; the
closure 50+35+5+0+8+158 = 256 balances).
**Both figures are recorded because the number must name the HEAD it was measured at** — the rule that
would have prevented the `auth`-onward file-count slip. `audit_logs` accounts for the −2.

**Reconciled against what was already recorded — and the point is the one that disagreed.** Eight of the
nine previously-recorded modules matched **exactly** (`inbox_ops` 10/14, `auth` 12, `directory` 3-in-1-file,
and the five zeros). The ninth did not: **`workflows` was recorded as "13 of 19" and measures 10.** The
record listed `api/tasks/route.ts` and `api/events` subscribe/unsubscribe as unguarded write routes —
**neither exports a write verb**, checked twice by routes that share no failure mode (read the file today;
`git show d3af1b1:…` shows no write verb then either). They were never write routes; the record counted
*files* as if they were. **Corrected to 10, not carried forward.**

**Two unit errors in my own first pass — both caught by comparing, neither visible by re-reading my own
output.** (1) It counted **files** where the backlog counts **verbs**: `directory/organization-edges/route.ts`
is one file with three unguarded verbs (POST/PATCH/DELETE), so `directory` read 1 and the record's 3 was
right. (2) The export-detection regex required the verb to immediately follow `const X =`, so
`export const POST = crud.POST` — the CRUD-factory pattern used by `auth/users/route.ts` and
`auth/roles/route.ts` — was misread as **unguarded**; `auth` read 20, corrected to 12, matching the record.
**The method that caught both:** line the figures up against what a **different person** had already
written down — the same discipline the project's own LESSONS demand.

**Fix 1 of the sweep — `audit_logs` DONE and PROVEN (code `4ef5812`).** Both write routes in the module —
`audit-logs/actions/undo` (POST) and `actions/redo` (POST) — called **no guard of any kind**: no wrapper,
no `runRouteMutationGuards()`, not the deprecated pair, and they are not built by `makeCrudRoute`. A guard
set shipped for `audit_logs` would have been **silently skipped**, and a Hermes-authorized undo would have
reached the command bus with nothing checking it. **2 unguarded verbs → 0**, via a new
`packages/core/src/modules/audit_logs/api/mutation-guard.ts` (`beginAuditLogsMutationGuard`).

**Why this module first.** Undo and redo **replay a registered command** — the most privilege-sensitive
write on the platform — and the routes already carry a dense hand-written authorization story (feature
requirements, actor-vs-tenant undo rights, fail-closed tenant scope, org-scope resolution, the "only the
latest undoable row" re-lookup; issues #2398, #2685). **None of that is replaced.** The missing piece was
the **registry chokepoint**: today a future guard for this module cannot run, and the structural grammar
(SD-4) never sees these writes.

**The one design decision — and it is a real choice, not a nicety.** The guard is evaluated against the
**log entry's own `resourceKind`** (falling back to `audit_logs.action_log`), because what is guarded is
the *reversal or replay of a write to that resource*: a guard registered against, say,
`directory.organization` must see the **undo of an organization write** — otherwise the one path that can
**reverse** a protected change is the one path no guard describes. Evaluating against the wrong key would
either fire guards that have no business seeing this write, or (worse) silently match none and look
guarded while doing nothing. The value is **read from the row, never guessed**; a null `resourceKind` is
guarded as the log table itself.

**Second deliberate placement — the redo route.** The guard runs **after** `resolveRedoInput` (which 400s
"Redo data unavailable" when the redo payload is missing), so policy is only evaluated for a request that
can actually proceed. Discovered by reading the route, not assumed.

**Test evidence.** New suite `api/__tests__/d2-gap-guard.test.ts`, **7 tests**, every one asserting the
guard is really wired in: registry called once with the row's own resource; the guard runs before the
command; a block prevents the command; fallback to the log-table kind for a null-resource row; **two
negatives** that the guard is NOT reached on 401/400; redo guard + afterSuccess.

**Proof — three disjoint mutations, each restored byte-identical.** (1) disable the undo **block path** →
exactly the **block** test RED. (2) remove the **undo guard call** → the **4 undo-guard** tests RED, and
the 3 that do not depend on it stay green. (3) remove the **redo guard call** → exactly the **redo** test
RED. Routes restored **byte-identical**: undo md5 `256401137b7e0f54fd2b7482232ea477`, redo md5
`fd6e65e603256293549d5e98818c5735`. `audit_logs` = **16 suites / 108 tests green**; core `tsc --noEmit`
**exit 0**.

**What the box posts next.** **`ai_assistant` (24 unguarded verbs)** — the Hermes-facing module, where this
defect and the Hermes tool door meet most directly — then `messages` (17), `communication_channels` (15),
`auth` (12) — *all four now done: see the `D2-gap` sweep records at the top of this file; `auth` was a
real `D2-gap` but not an authorization hole (code `8e1632c`)* — and down the measured list. **A trap
carried forward:** not every write handler is a
`route.ts` (`translations/put/locales.ts`, `planner/*`, `query_index/{reindex,purge}.ts` export **named**
verbs). **Walk every `.ts` under `api/`, never glob for `route.ts`** — a name-scan reports a module clean
while leaving live write routes unguarded.

---

## 2026-10-06 (newest) — `feature_toggles` retired: **the last enabled module, and the D2-wide sweep is complete**

**The task this box carried.** D2-wide: retire the deprecated `validateCrudMutationGuard()` /
`runCrudMutationGuardAfterSuccess()` pair in `feature_toggles` (2 calls / 1 file), the way the previous
twelve enabled modules were done. **Definition of done:** the module measures 0, its route tests are green,
the two mutation proofs went RED, the repo-wide count is 106, and the docs say so.

**Measured before touching it — from the artefact, never the plan.** `grep` for the deprecated pair across
`feature_toggles --include="*.ts"`, comment lines dropped, returned exactly **2 call sites in 1 file**
(`api/overrides/route.ts`, lines 124 and 151). Per-file shape: that one file. The plan said 2 calls / 1 file
and it held — the third consecutive module where re-measurement confirmed the queued figure.

**The D2-gap was walked, not assumed.** Every write verb in the module, and its guard:

| Route file | Write verbs | Guard | Unguarded |
|---|---|---|---|
| `overrides/route.ts` | PUT | **this wrapper** (was the deprecated pair) | 0 |
| `global/route.ts` | POST, PUT, DELETE | `makeCrudRoute` → `collectAndRunGuards()` | 0 |
| `check/{boolean,json,number,string}/route.ts` | — (read only) | — | 0 |

**`feature_toggles` has no `D2-gap`** — the second module in the sweep with none (after `perspectives`,
`translations`, `planner`, `query_index`, `dashboards`, `workflows` also measuring 0, but this is the
first whose *every* route is either a guarded write or a read). The `check/*` routes were checked, not
assumed read-only.

**How it was solved.** A new module wrapper `packages/core/src/modules/feature_toggles/api/mutation-guard.ts`
— `beginFeatureTogglesMutationGuard(ctx)` returns `{ blockedResponse, runAfterSuccess }`, mirroring
`beginDirectoryMutationGuard`. The PUT route now collects the guard through it, returns
`guard.blockedResponse` when blocked, and calls `guard.runAfterSuccess(...)` after the command commits.

**The shape that is new here — the id-rebind, brought into the wrapper.** This route is the first in the
sweep whose *validated* id can differ from the *written* id **on the same route path**: it validates the
guard set against `existingOverride?.id ?? parsed.data.toggleId`, then the command may **create** a row and
return a generated `overrideToggleId`. The old code passed that produced id to
`runCrudMutationGuardAfterSuccess`. The wrapper reproduces that with `runAfterSuccess(idOverride)`: when the
override is absent or equal to the validated id it runs the collected callbacks; when it differs it
**re-collects** the guard set for the produced id and runs that. Re-running the set is safe **only because
`validate` is a pure predicate** — a fresh set is collected, so no callback runs twice. The test proves it by
asserting the registry is called **twice** on the create path (validated id, then produced id).

**A naming trap already on record, and it applies here.** The route also calls
`enforceCommandOptimisticLockWithGuards` on the existing-override path. That helper does **not** run mutation
guards — its `...WithGuards` suffix refers to the *command optimistic-lock* guard service, and its first
step is the OSS optimistic-lock floor. A plain `grep -i guard` shows the file as "guarded"; the mutation
guard is this wrapper. Recorded again so a later reader does not credit the wrong control.

**A caution about this call site.** The mutation guard is **not** the main protection on this route: the
route resolves a verified tenant (`resolveFeatureCheckContext`, 400 if absent), loads the override row
tenant-scoped, and refuses a stale overwrite. **`feature_toggles` ships no `guards.ts`**, so before this
migration the deprecated pair's only content was the bridged legacy service. The migration is still correct
and necessary — it removes the **bypass** — but the security argument rests on that, not on the route being
unprotected today.

**Test evidence.** One suite repaired: `api/overrides/__tests__/mutation-guard.test.ts` stubbed the **DI
`crudMutationGuardService`**, now stubbed to **only** the registry call `runRouteMutationGuards` (never the
wrapper), with the wrapper running for real. The old assertions on the flat `{ ok, status, body, metadata }`
shape were re-pointed to the `{ container, req, auth, input }` shape. **5 tests green**, including: the
registry call with the route scope; deny → 403 with no command execution and no after-success; **does NOT
run after-success when blocked**; the **rebind** (registry called twice, second call carries the produced
`overrideToggleId`); and the existing-row id used as the validate id. The sibling
`__tests__/optimistic-lock.test.ts` (4 tests) still green.

**Mutations proved the tests bite.** Wrapper backed up (md5 `7b5514c22a8d4a78962e663725c6df24`).
**Mutation A** — `if (!guardResult.ok)` → `if (false && !guardResult.ok)`: **2 RED** (both deny-path tests),
3 green. **Mutation B** — `if (true) return` as the first line of `runAfterSuccess`: **2 RED** (both
allow-path tests), 3 green — a **disjoint** set from A. Wrapper restored **md5-identical**, `diff` clean.

**Critic pass then mutated the ROUTE file.** Block return disabled (`if (false && guard.blockedResponse)`)
→ **2 RED**. After-success call commented out → **2 RED**. Both files restored **byte-identical**.

**L91 applied pre-emptively and proven.** The wrapper's header names both helpers **without parentheses**
(`enforceCommandOptimisticLockWithGuards`, "the sync helper"), and the file was checked against the raw-text
scanner regex `enforceCommandOptimisticLock\s*\(` — **0 matches**. The whole package suite was run anyway.

**Green, measured:** `feature_toggles` module **14 suites / 84 tests green**; core `tsc --noEmit` exit 0;
**whole core suite 603 suites / 5136 tests green**.

**Count re-measured two independent ways, both agree:** repo-wide **108 → 106**, files **41 → 40**. The
"before" was re-derived on the stashed tree with the same classifier (**108 / 41**) and the delta (−2 sites /
−1 file) is exactly this module's 2 calls in 1 file. `feature_toggles` now reads **0**.

**What it means:** **every enabled module in the D2-wide sweep is migrated.** The only D2-wide work left is
the **parked set** (106 calls / 40 files), which is *recorded, not migrated* — a parked module's deprecated
call is dormant, so retiring it there needs no code change until it is un-parked. `D2-gap` remains an open
backlog item, and is the recommended next task.

---

**The active task from the box: `inbox_ops` D2-wide (8 deprecated guard calls in 4 files). Done, proven
and committed (`d89b8f6`, code repo).**

**What was done, plainly.** Four custom write routes in `inbox_ops` called the **deprecated** guard
pair (`validateCrudMutationGuard()` / `runCrudMutationGuardAfterSuccess()`), which resolves only the
single DI-registered service and silently skips the real guard registry. They now go through a new
module wrapper `inbox_ops/api/mutation-guard.ts` → `beginInboxOpsMutationGuard(ctx)`, which calls
`runRouteMutationGuards()` — the same shape as the five modules before it. **8 calls in 4 files → 4
guard objects.** Count **142 → 134**, measured two independent ways (`grep … | grep -vE` and `git grep`
classified by a script), and `inbox_ops` now measures **0**.

The four routes, each read before and after:

| Route | Verb | `resourceKind` | `operation` |
|---|---|---|---|
| `proposals/[id]/categorize` | POST | `inbox_ops:inbox_proposal` | `update` |
| `proposals/[id]/actions/[actionId]` | PATCH | `inbox_ops:inbox_proposal_action` | `update` |
| `proposals/[id]/accept-all` | POST | `inbox_ops:inbox_proposal` | `custom` |
| `emails/[id]` | DELETE | `inbox_ops:inbox_email` | `delete` |

**One behaviour point kept, not silently dropped.** The email DELETE returns **404 before** the
after-success when the row was already gone (the old code sat `runCrudMutationGuardAfterSuccess()` below
the 404 return). The new code keeps that ordering by simply **not** calling `guard.runAfterSuccess()` on
the 404 path — the hook runs only after a committed write. That path has its own test, and it stayed
green under both mutations, which is correct: it asserts the hook did *not* run.

**The proof — and why it was easier this time.** `inbox_ops` already shipped a dedicated guard suite
(`api/__tests__/mutation-guards.test.ts`, 9 tests) covering all four routes on both verdicts. Its only
defect was the one recorded in the `workflows` entry: it **mocked the deprecated module**, the wrong
target now. Repointed to stub **only** the registry call `runRouteMutationGuards` and let the module
wrapper run for real. Then the mutations bit, exactly as they must:

- disabling the wrapper's **block path** → **4 tests RED** (every deny-path test);
- neutering **`runAfterSuccess`** → **4 tests RED** (every allow-path test);
- wrapper restored **md5-identical** (`9490fbfc2b3515ef67a7131b941342d2`).

**Verified:** `inbox_ops/api` = **15 suites / 107 tests green**; whole `inbox_ops` module = **35 suites /
395 tests green**; `core` `tsc --noEmit` **exit 0**.

**Scope, stated honestly (and measured, not assumed).** `inbox_ops` has **14** routes exporting a write
verb. This wrapper covers **4**. The other **10** call **no guard at all** — `extract`,
`emails/[id]/reprocess`, `proposals/[id]/translate`, `proposals/[id]/reject`,
`proposals/[id]/actions/[actionId]/{accept,complete,reject}`,
`proposals/[id]/replies/[replyId]/send`, `settings`, `webhook/inbound`. That is the **`D2-gap`** sibling
concern, and the figure is now written into the wrapper's own header so the next reader does not have to
re-derive it. Same lesson as `workflows`: **"0 remaining on `D2-wide`" means "no deprecated resolver
left", NOT "the module is guarded".**

**Also this session (before the migration): committed the outstanding corrections from the previous
turn.** The `workflows` wrapper's comment-only scope edit (`9c9ccbf`) and the docs corrections
(`5abf1f5`) — the false coverage claim, the `58 → 56` file count, and the stale proof hash, now stated
as "the hash the proof restored" vs "the hash in the tree now" with the reason. Nothing was left
uncommitted between turns.

---

## 2026-10-06 (newest) — `workflows` retired, and a mutation proof that was proving nothing

**The active task from the box: `workflows` D2-wide (9 deprecated guard calls in 3 files). Done, proven
and committed (`d3af1b1`, code repo).**

**What was done, plainly.** The three route files that write workflow definitions
(`definitions/[id]/route.ts` PUT + DELETE, `definitions/[id]/customize`, `definitions/[id]/reset-to-code`)
called the **deprecated** guard pair, which resolves only the single DI-registered service and silently
skips the real guard registry. They now go through a new module wrapper
`workflows/api/mutation-guard.ts` → `beginWorkflowsMutationGuard(ctx)`, which calls
`runRouteMutationGuards()` — the same shape as `entities`, `data_sync`, `dictionaries`, `dashboards`.
**9 calls in 3 files → 4 guard objects.** Count **151 → 142**, measured two independent ways (`grep` and
`git grep`), and `workflows` now measures **0**.

**The part worth recording — my first proof was worthless, and the mutation is what caught it.** I
repaired the four existing test suites and, to keep them simple, mocked the **module wrapper** so each
test saw a pass-through guard. Then I ran the two mutations the pattern requires: disable the block path,
and neuter `runAfterSuccess`. **Both stayed green.** A green mutation does not mean "the code is fine" —
it means **the test is not exercising the code you mutated**. Because the wrapper was mocked, the mutated
block path never ran at all.

The fix is the pattern now written into the docs: stub **only** the registry call
(`runRouteMutationGuards`), and let the module wrapper run for real. That meant adding a dedicated suite
(`api/__tests__/mutation-guard.route.test.ts`) that drives the actual routes with a blocked verdict and
with a passing verdict, and asserts the id is re-bound to the row the write produced. With the wrapper
in the path, the mutations bite: **block path disabled → 5 RED; `runAfterSuccess` neutered → 3 RED;
wrapper restored md5-identical (`b969e361b9c727e61f3365f0f9cae1b0`)**.

**Why the hash in the tree is not that hash.** The proof ended by restoring the wrapper byte-for-byte to
`b969e361…`. The hostile pass (below) then required a **comment-only** edit to the same file — the honest
"Scope" paragraph in its header — which moved it to **`bc030d318c0baeb23d875727d65ee9dc`**. The two
hashes differ by header prose only; no executable line changed. After that edit the api suites were
re-run: **7 suites / 118 tests green, core `tsc --noEmit` exit 0**. A junior dev re-running `md5sum` on
that file should expect `bc030d…`; `b969e361…` is the artefact the mutation proof restored, recorded so
the proof stays auditable.

**Also this session — the map's Part II, and a heading defect I introduced and fixed.** Per the owner's
"deep enough for a junior developer", `ARCHITECTURE-hermes-service-map.md` gained Part II: the three real
joints worked in full (agent identity `AH-1`; the tool door + authorization `S-02`/`AH-8`; skills+memory
`AH-9`) plus the D2-wide walkthrough (§10–§13), every path read from source. My insert left §9 sitting
*after* §10–§13; a grep caught the order and it was moved back before Part II, with the duplicated
verification block removed (docs `365c4e4`).

**Evidence.** `workflows` api **7 suites / 118 tests green**; whole `workflows` module **45 suites /
650 tests green**; core `tsc --noEmit` **exit 0**. **Next active task: `inbox_ops` (8 calls / 4 files);
expected count 142 → 134.**

**Then a hostile re-measurement found two things wrong with what I had just written — both fixed.**

1. **FALSE CLAIM (the serious one) — "every `workflows` write now goes through the guard."** *Status:
   FIXED — the false sentence is removed, the real scope is stated, and the gap is now a tracked item.*
   A critic pass counted the module's write routes: **13 of 19 call no guard at all** — neither the new
   wrapper nor the old deprecated pair (`instances/**`, `tasks/**`, `signals`, `events`,
   `definitions/route` POST). Measured independently by checking each file at `d3af1b1~1`:
   `deprecated_calls_at_parent = 0`, so the gap is **pre-existing, not a regression** — and it is
   precisely why this migration measured 9 calls across only 3 files. The important part is the
   *reading*: **"0 remaining on `D2-wide`" means "no deprecated resolver left", NOT "the module is
   guarded"** — a module can score 0 and still be wide open. Recorded as backlog item **`D2-gap`**
   (what to measure, how to measure it, the suggested fix), stated in the wrapper's own header so
   nobody reads that file as coverage, and added as a "Scope — what this does NOT cover" row in
   `BUILD-ORDER.md` §2e. The same question must now be asked of `data_sync`, `dictionaries` and
   `dashboards`.
2. **WRONG NUMBER — the file count.** *Status: FIXED — the docs now say 56, not 58.* I wrote "58 files"
   from a `grep -rln` — but `-l` lists a file if **any** line matches, including comment-only files,
   while the site count is computed per-line. Two genuinely different methods (a Python parser that
   classifies each match, and an `awk` filter over `grep -rn`) both return **142 sites / 56 files** and
   agree with each other. The site count of 142 was right; the file count was not.

**The methods that caught both** are the ones the owner asks for: a separate pass whose only job is to
break the claim (Technique A), and reaching the number by a second, different route (Technique B).
Neither error would have been visible from re-running my own command.

---

## 2026-10-06 (later) — directive 1 completed in full, and the sort audit fixed

**The owner asked whether his two directives were documented, and when they would be done.** The honest
answer, measured rather than asserted:

- **Directive 2 (the Active-task box) — DONE, fully.** The `★ ACTIVE TASK` box is at the top of this
  file; HANDOVER, START-PROMPT, README and BOOKMARKS carry no "what is next" and point here.
- **Directive 1 (the Hermes/Llama service map) — the file existed, but it was INCOMPLETE.** The owner's
  words were *"for every bit of development in our log where needed."* The first version named **11
  items**; the BACKLOG holds **43 open items, ~20 of which touch AI**. So it did not meet the bar it
  claimed to. **This turn completed it.**

**How directive 1 was completed — measured, not guessed.** §4.4 was added to
[`library/development/ARCHITECTURE-hermes-service-map.md`](library/development/ARCHITECTURE-hermes-service-map.md),
grouped: (a) the structural-permission items `SD-1/2/4/5`; (b) the AI I/O guard `G-06` and the
enforcement point `S-02`; (b2) the remaining security/authority items `G-04/05/13/14/15/16`; (c) the
agent-half items `AH-1`–`AH-12`; (d) the model-layer track `ML-1`–`ML-4`; (e) the decision items `N-15`,
`V-04` and the `V`-HOLDs. A closing paragraph names the items deliberately **not** in the map (`G-09`,
`G-10`, `G-18`, `G-19`, `G-20`, and the human-approval/UI items `22`, `23`, `15b`, `21c`, `24b`, `C`) and
why — no AI is an ingredient in them, so mapping them would dilute rather than complete the page.
**Coverage is now a measured claim:** every open item id in the BACKLOG was checked against the map →
**41 ids, 0 missing.** The document's own §9 records that its earlier completeness claim was false.

**Then the straightforward next task — the `explicit-sort-comparators` audit — was fixed.** The audit test
was red. **A handover summary said "two files are flagged"; the test's own output said 16 violations
across 6 files.** I read the list from the failing run, not the summary — which is why the fix is
complete rather than partial (and why fixing only the two summary names left it red: there is a *second*
bare sort in `user-function/document.ts` at a different line). All 18 sites got the **canonical-key
comparator** `(a, b) => (a < b ? -1 : a > b ? 1 : 0)` — *not* `localeCompare`, because these are internal
identifiers, not display strings, and `localeCompare` would make the order locale-dependent.
**Proven behaviour-preserving two ways:** 7/7 adversarial equivalence probes show the canonical comparator
is byte-identical to the default string sort; and the touched shared packages = **24 suites / 336 tests
green**, shared `tsc --noEmit` exit 0, audit 4/4. Code commit `d5567c7`.

**The second test-suite defect (`module-decoupling`) is now FIXED too (code `fe7c3e5`).** Established by
measurement: it **passes alone 3/3** and in pair runs, but failed under **full-suite parallel load** — the
real `#generated/entities.ids.generated` wins over the test's `jest.mock` inside a shared jest worker, so
`partitions.ts` sees a catalog registry and returns `productsMedia`. The test file itself already
documented this exact symptom as *"seen once, never reproduced, never explained."* **It is a test-harness
defect, not a product defect** — `partitions.ts` is correct by design (it includes the catalog product id
only when catalog is enabled). **Owner chose file-scoped isolation.** The fix wraps the mock-dependent
test in `jest.isolateModulesAsync(...)`, giving it a fresh module registry so the mock always applies — no
change to the shared jest config. **It cannot mask a real bug:** the test still asserts its own
precondition `expect(E.catalog).toBeUndefined()` inside the isolation, so if the mock ever fails to apply
it fails there first. **Result: the full core suite is now 602 suites / 5123 tests, 0 failures — the first
fully green run.** A probe test confirmed the mock applies inside `isolateModulesAsync` regardless of
prior cache, so the file no longer depends on scheduling order.

---

## 2026-10-06 (earlier) — the owner's three directives, and D2-wide reaches `dashboards`

**The owner set three directives this turn, and asked me to sort the priorities and connect them to
the development chain.** This entry records the chain, what shipped, and what it measured.

**Directive 1 — document how Hermes serves every piece.** Built as
[`library/development/ARCHITECTURE-hermes-service-map.md`](library/development/ARCHITECTURE-hermes-service-map.md):
for **every** AI-touching development item, whether Hermes appears as **an agent** or as **setting
wiring**, where **Llama** sits, and the measured status. It answers the four challenges the owner
named — the one-tenant/multi-tenant mismatch, multi-agents, integrations, and MCP — and is written so
a new developer can execute without a learning curve. **Built from the source, not a summary:** the
11 model presets were enumerated (`openai`, `deepinfra`, `groq`, `together`, `fireworks`, `azure`,
`litellm`, `ollama`, `openrouter`, `requesty`, `lm-studio`) and **none is llama.cpp** — confirmed by
two routes (the id list, and a search for `localhost:8080`/`llama-server`), which is why "integrate
Llama" is *one preset entry*, not a project. Also measured: the `mcp` service in
`docker-compose.fullapp.yml` has **no `OPENAI_BASE_URL`** (defect #2 from the model-server doc), and
the chat route is still wired to OpenCode.

**Directive 2 — take "what is next" out of the handover docs, put it in one box.** Done:
`HANDOVER.md`, `START-PROMPT.md`, `README.md` and `BOOKMARKS.md` no longer carry a task; they point
at the new **`★ ACTIVE TASK`** section at the **top of this file**, which carries the convention
(*tick it, move it down, post the next one*). A task stated anywhere else is now stale by definition.

**Directive 3 — the front-end rule.** Recorded as a standing rule in
[`library/development/WORKING-RULES.md`](library/development/WORKING-RULES.md) and as **rule 5 of
COOKBOOK "the rules that override everything"**: *if a piece can be fully functional on its own, wire
it into the running interface in the same batch, locking or switching off the parts that still need
work.* The owner's reason, kept verbatim: *"Updating the front end helps me testing the micros as you
work."*

**Then the development chain continued with `dashboards`.** The third enabled module retired from
the deprecated guard resolver: **10 call sites across 4 files → 5 guard objects**, via a new
`beginDashboardsMutationGuard()` (`dashboards/api/mutation-guard.ts`) matching the proven wrapper
shape. **Two of the routes write in one of two mutually-exclusive branches** ("clear the override"
then return, or "upsert the override"), and each ran its own after-success call; because
`validate()` is a pure predicate, collecting the guard set once and invoking `runAfterSuccess()` in
whichever branch is taken is equivalent, and it evaluates the guard set once instead of twice.

**Proven, not assumed.** 5 suites / 19 tests green (4 repaired from the deprecated-pair mock to the
registry mock, including the two tenant-isolation tests, which now assert `runRouteMutationGuards`
was **not** called on a rejected cross-tenant write). Core `tsc --noEmit` **exit 0**. Two mutations
proved the tests bite: disabling the block path → **4 red** (one per file); neutering `runAfterSuccess`
→ **4 red**; the wrapper was restored **md5-identical** (`76fb8b374e2528f3420879eac8e0e1d4`).
Repo-wide count **161 → 151 (−10 exactly)**, and `dashboards` re-measured at **0**.

**One correction to my own account, caught by measuring rather than retelling.** I first wrote the
count as 163 in this session's working notes; the true call-site count is **161**, because the raw
grep also matches the **two declarations** of the deprecated pair in `mutation-guard.ts`
(`export async function validateCrudMutationGuard(`). The file count is **67**, not 69 — the naive
file list also includes the declaration file and a file whose only match is a docstring line. That
161 was then **re-measured to 151 after `dashboards`**, at **59 files** — both figures corrected in
every place they appear (HANDOVER, BUILD-ORDER, BACKLOG, the Active-task box). **This is the
"measure, don't retell" rule working exactly as written.**

**The full suite was run after the change, and read honestly.** `packages/core` = **600 suites passed /
2 failed, 5121 tests passed / 2 failed**. The two failures were **both checked against the baseline,
not assumed**:
- `explicit-sort-comparators` — **pre-existing**, fails identically with the dashboards work stashed
  (the known next-but-two chain item; the flagged files are untouched by any D2-wide commit).
- `module-decoupling` — **NOT pre-existing, and NOT caused by this change.** It *passes* both with and
  without the dashboards work when run as a pair; it fails only under **full-suite parallel load**
  (a module-registry state leak across jest workers — the failure is
  `resolveDefaultPartitionCode('catalog:catalog_product')` returning `productsMedia` when the catalog
  suites are scheduled alongside it). Recorded as an **order-dependent flake**, reproducible at the
  baseline, so it is a test-harness defect, not a product defect — and it is now on the chain.

**The commit is `a05ea2c`** (repo `workspace/starting-kit`, branch `main`); the docs batch that records
it is this file plus BUILD-ORDER/BACKLOG/HANDOVER.

---

## 2026-10-06 (later still) — D2-wide: the owner set HOW, not just WHAT

**The owner's two directives this turn.** (1) *Do not state an issue without saying how it was or will be
solved, when, and where it is documented* — an open-ended concern is a source of confusion, not a report.
(2) On the deprecated guard resolver: *"mapping existing modules to core needs may provide a shortcut to
retire the resolver and with every module you decide if you customize and integrate directly or just
disconnect and park till later."*

**The answer to "did we fully process the blueprint?"** Yes, and it is documented in three places, each
measured: [`BLUEPRINT-GAP-ANALYSIS.md`](library/development/BLUEPRINT-GAP-ANALYSIS.md) (four gaps A–D, each
with what-the-blueprint-says / what-we-have / what-to-add / where-in-the-order);
[`CORE-MODULES-REGISTER.md`](library/development/CORE-MODULES-REGISTER.md) (P1–P18 + B1–B14 with
two-route verdicts); [`CORE-BOUNDARY.md`](library/development/CORE-BOUNDARY.md) (Ring 1 core / Ring 2
configurable / Ring 3 packs, the direct answer to the uncustomisable-core question). All three feed
[`BUILD-ORDER.md`](library/development/BUILD-ORDER.md) §3. Nothing from the blueprint is left undocumented;
gaps A–D are each assigned a phase.

**What changed on D2-wide.** It was a counted item ("199 call sites, module by module") but the count had
drifted in my retelling and — more importantly — the item carried no *decision method*. It now carries
both. **The count, re-measured this turn by two routes that share no failure mode** (the doc's own count
command, and a per-file walk of every affected module): **199 call sites / 78 files**. Split: **93 calls /
38 files ENABLED** (a live defect — they run today and bypass the registry), **106 / 40 parked**. The
`entities` path is already retired for real and sits *inside* the 199 as the worked example.

**Two corrections I had to make to myself, recorded because they are the method working.** Mid-turn I
"re-measured" and got 352, and briefly wrote that 199 was wrong. It was not: a name-only grep also counts
**import and docstring lines**, so 356 measured *names mentioned*, while 199 measures *calls made* — two
different questions. Then I "corrected" the enabled split 93/38 → 92/37, also wrongly: my per-module loop
had missed the `workflows` API subdirectories (real: 9 calls / 3 files). A **critic pass that re-measured
every single table row** — not just the total — caught it. Restored to the original figures, which were
right. Neither wrong number reached a file except in this turn's own draft, now fixed; the calls-vs-names
ambiguity is written into BUILD-ORDER §2c so it is not re-derived.

**The plan (BUILD-ORDER §2e).** D2-wide is a **module-to-core-need mapping**; each affected module is
tagged **(A) customise & integrate directly now**, **(B) disconnect & park till later**, or **(C) already
connected**. Enabled modules first (largest cluster first: `data_sync` → `dictionaries` → `dashboards`),
each with its own mutation proof; parked modules are recorded as graft-phase — their deprecated calls are
**dormant, not live**, which is the shortcut the owner spotted. **That is the honest statement of how
D2-wide will be solved, when, and where it is written down.**

---

## 2026-10-06 (early) — D1: the tier mapping stopped being code and became a setting

**D1 is done (code `558cfab`).** The owner's instruction was *"concerning tiers, default ones and
concerning fallbacks. let's not make it hardcoded but a setting a superadmin can change."* Before this,
those three values lived in a frozen `.ts` object (`CHANGE_KIND_TIER`), so changing what the platform
permits took a code deploy. Now they are one setting — the kind→tier map, the default tier, and the S11
fallback level — read from the platform's **existing** settings engine (`module_configs`, module
`request_outcome`, name `structureChangeTiers`). No new table (S5): the engine was already there.

**The design problem worth recording: the triage is pure, and the setting needs a database.** `triage.ts`
promises in its own header "no model call, no database, no clock" — that is what lets its rule be proved
exhaustively. So the fix **separates the read from the decision**: `loadTierSettings(reader, scope)` is
the only async, store-touching part (taking an injected reader, typed structurally so `shared` never
depends on `core`); `resolveTier(kind, settings)` is pure. `triageRequest` and `tierForChange` take the
settings as an **optional injected argument**, so every existing caller keeps its exact behaviour and
**not one existing test had to change**.

**It fails closed, and that half is the one that matters.** A malformed setting — a bad tier string, one
bad row inside a good map, a missing default, a missing fallback level — is rejected outright and the seed
is used instead, whose default is the strictest tier. A reader that throws also yields the seed.
**A broken setting is treated as no setting.** The mutation proof: softening the seed default from
`explicit_approval` to `safe` turned **7 tests red**; the file was restored md5-identical.

**Also this turn — two corrections found by re-measuring.** The D2-wide count I had written as "~201 calls
in ~76 files" was **understated**; measured twice by independent routes it is **199 calls in 78 files**
(raw 203/80, minus the 2 declarations and 2 docstring mentions), with **93 of those calls in enabled
modules**. And the enabled-module count of "37" was wrong — it had matched commented-out parked lines; the
config declares **35 static enabled modules**. Both are now corrected in every doc. The architecture
document's §7 checklist also showed the owner's fallback question as open when **he had already answered
it** (Q2: fall back to the tier table, standards-loaded) — settled and written in.

**The honest boundary, found by a critic pass on this work.** The setting is **written** on install and
**read by nothing at request time yet** — there is no production caller of `loadTierSettings`, because
**`triageRequest` itself has no production caller**: G-21 was built as a *library* with no route wired to
it. So D1's setting sits at exactly the maturity of its consumer. "The tier mapping is a setting" is
**true**; "the platform reads tiers at runtime" is **not yet true**. It is the same shape as the D0 defect
(*a file that exists is not a mechanism that runs*), one layer up — recorded, not hidden.

**Next:** **D2-wide** (retire the deprecated resolver, module by module, each mutation-proven), then **D3**
(the `escalate` outcome). The order is in [`library/development/BUILD-ORDER.md`](library/development/BUILD-ORDER.md).

---

## 2026-10-06 — D0 fixed and proven; the real defect was bigger than the registry

**D0 is done (code `d225602`).** The generated guard registry now delivers guards, and the delivery
chain is proven by mutation — not merely green. The build started with D0, as agreed, after the
documentation sweep (item 3) and the blueprint study (item 2b) were closed.

**Root cause, by two routes that share no failure mode.** (1) The running app's
`guards.generated.ts` exported `guardEntries: []`. (2) The generator's **own** test builds a module that
ships `data/guards.ts` and asserts it must appear — and it passes. **So the generator was never the
bug.** The cause was supply: the only modules shipping a `data/guards.ts` were `customers` and
`customer_accounts`, and **both are parked** ("ERP is off"), with the `example` template off by default.
No enabled module contributed a guard, so an empty registry was *correct* — and looked exactly like a
healthy system. That is why nothing caught it.

**The fix.** An enabled module (`entities`) now ships real structural guards: a custom field may not
claim a system column (`id`/`created_at`/`updated_at`/`deleted_at` — `records.ts` silently strips those
from writes, so such a field could never hold a value), and field keys must be snake_case. The delivery
test runs against the **real generated file** and the **real store**, and is **mutation-proven**:
emptying the entries → 4 red; no-op registration → 3 red; neutering the guard → 1 red, the right one.

**Then the honest part — the defect is bigger than the registry.** While fixing the entities path (D2),
a sweep found **199 non-test call sites across 78 files** still calling the `@deprecated`
`validateCrudMutationGuard()` pair, which bypasses the registry entirely — **93 of those calls (38
files) in ENABLED** modules (`auth`, `dashboards`, `data_sync`, `dictionaries`, `directory`, `entities`,
`feature_toggles`, `inbox_ops`, `perspectives`, `planner`, `query_index`, `translations`, `workflows`),
the rest in parked modules. So the registry is now populated and
**delivering**, and most routes still **do not consume it**. That is the same class of defect one layer
up: the owner's *"guarded for some, forgotten for others"* — present, measured, and now counted. It is
recorded as **`D2-wide`** in the backlog and in the build order, so it cannot slip.

**The entities path is the worked example (D2, entities scope — done).** `beginEntitiesMutationGuard`
now calls `runRouteMutationGuards()` — the registry wrapper the `@deprecated` docstring itself names as
the replacement — with the legacy service preserved via `bridgeLegacyGuard()`, so nothing was lost. Its
existing test had to be **repaired**: it mocked the deprecated pair, and the change falsified that
premise. Re-pointed to the registry wrapper; same intent; mutation-proven red.

**Proof, all measured this turn:** generator structural-contracts **104/104** · `entities` **222/222** ·
guard-delivery **5/5** · `core` and `app` `tsc --noEmit` **exit 0** · every mutated file restored
**md5-identical**.

**Also closed this session:** the owner's three earlier requests — (1) tiers/defaults/fallbacks are now
a **superadmin setting** in `module_configs`, not a hardcoded table (dictionary §C.2b); (2) the
core-module audit (`CORE-MODULES-REGISTER.md`) and the blueprint gap study
(`BLUEPRINT-GAP-ANALYSIS.md`, `CORE-BOUNDARY.md`); (3) the documentation sweep (handover, start prompt,
cookbook, lessons, index).

---

## 2026-10-06 — Build order: the owner is right, and the measurement says so

**The owner asked whether the permissions infrastructure should be built *now*, applying the standards
as we go, rather than stacked and edited later — and told me to fix the order so it is not deferred.**
He named accounts management, permissions and languages as things that must come first because
everything is built on top of them.

**He is right. And the honest news is better in one way and worse in another:** the foundation is
**largely already built** (accounts, permissions, languages), so this is not "stop and build
foundations from scratch" — it is "finish the foundation's last four gaps before stacking." But one of
those gaps, **D0**, is a **live defect**: the generated guard registry is empty and guards are wired by
hand. **The owner's feared defect class — some things guarded, others forgotten — already exists in the
guard layer.**

**Measured, from the code:**
- **Accounts management — BUILT.** `packages/core/src/modules/auth/` is a full module (api, backend,
  commands, components, data, di.ts, emails, encryption.ts, events.ts, frontend, **i18n**, lib, **20+
  migrations**, services, setup.ts, workers).
- **Roles & permissions — BUILT** as a two-table ACL (`role_acls` / `user_acls`, `featuresJson:
  string[]`, wildcard matching, `isSuperAdmin`).
- **Languages — BUILT** (`shared/src/lib/i18n`, per-module `i18n`, `translations`, `dictionaries`).
- **The guard engine ("this") — the mechanism is real, but the central registry is NOT delivering
  guards.** `MutationGuard` + `runMutationGuards()` exist and **are used** — but by **hand, per route**
  (~4–6 route files call `runMutationGuards(...)` explicitly). The **generated registry is empty**:
  `apps/mercato/.mercato/generated/guards.generated.ts` is a shell — `export const guardEntries:
  GuardEntry[] = []` — and only **3** modules even ship a `data/guards.ts` (`customers`,
  `customer_accounts`, `create-app` template). That empty file **is** imported by the app
  (`apps/mercato/src/bootstrap.ts:44`), so the wiring exists and the list it carries is empty.
- **The structural write hook — BUILT.** `beginEntitiesMutationGuard` is called at **every**
  entity/field-definition write path (`definitions.ts`, `definitions.batch.ts`, `definitions.restore.ts`,
  `entities.ts`), carrying `resourceKind` (`entities.entity`, `entities.field_definition`) + `operation`.
  That is the `(object, verb)` half of the owner's grammar, already in flight.

**So the order is: finish four named gaps in the foundation, then stack.** Written up in
[`BUILD-ORDER.md`](library/development/BUILD-ORDER.md):
- **D0 — the generated guard registry is EMPTY (a live defect).** Found by a critic pass **after** I had
  claimed the engine was "live and auto-wired" — the claim was **false** and is corrected in the table
  above. A guard that claims to run and does not is worse than no guard. This comes first because
  D1/D2/D3 all assume guards actually run.
- **D1** — structural rules are `.ts` code, not data; there is **no settings table** for the grammar to
  read. (Everything else reads from it.)
- **D2** — the entities path calls `validateCrudMutationGuard()`, which the code itself marks
  **`@deprecated`** for *"silently bypass[ing] every guard in the global mutation-guard store."* The
  authoritative path for tables and columns is the one path **not** running the central guard set.
- **D3** — `MutationGuardResult.ok` is a **boolean**; there is no `escalate`. A guard can allow or block,
  but cannot say *"allowed, but a person must review"* — the owner's grammar needs that third outcome.

**Order: D0 → D1 → D2 → D3 (Phase 0), then Phase 1 (S2 gate, tier mapping into code, core-function delete
guard, the manage screen), then Phase 2 (S7/G-21, S3, S8, S6), then Phase 3 (data-access coverage and
row scope).**

**Both owner decisions are now settled and recorded** (dictionary Part E): **Q1 accepted** — the tier
mapping is the default *beneath* the structural grammar and **bulk-applies** to it wherever no explicit
setting exists; **Q2 fallback accepted** — unset falls back to the tier table, and the fallback **carries
the standards' default values** (never silent, never "never"). SD-3 is unblocked.

**Correction to my own earlier framing, stated for the record — and it is the second time in one turn
that a critic pass beat me.** Last turn I called the guard system "a socket waiting to be used"; when I
went to correct that, I swung too far the other way and claimed it was "live and auto-wired for every
module" running in "nine-plus modules." **A critic pass falsified that**: the generated registry is
**empty** (`guardEntries: []`), only **3** modules ship a `data/guards.ts`, and guards actually run via
**hand-written per-route calls** in a handful of routes. The honest state is: **the guard *mechanism* is
real and used; the *central delivery* is broken.** Which — note this — is **exactly the defect class the
owner is trying to prevent** ("permissions for some tables, then forgetting others"). It happened, in
the guard layer, and went unnoticed until measured. That is the strongest support for his instruction,
and it is why **D0** now leads the order.

**Wired into:** `SPECIFICATIONS-DICTIONARY.md` (Part E settled, Part F added), `BACKLOG.md` (banner +
SD-3/SD-4 updated), `HANDOVER.md` (B1c), `INDEX.md` (reading order #1b + folder map).

## 2026-10-06 — The structure-permission grammar: the owner's idea beats what item 17 set

**The owner proposed a better shape, and it is better.** Not one tier per *kind of change*, but a
**permission per object, per verb, per actor**: for this table, may the AI add a column? Edit one? Drop
one? May it do it straight, or does it need review, or approval? May this column be *referenced* by
another table? Managed with a roles-and-permissions-style surface keyed on the user's role, the actor
type (human or AI), and the permission.

**Why it is better, said plainly.** It is **finer** (it can say "add columns, yes; drop them, no" — item
17's table cannot), it is **uniform** (structural permissions become the same *shape* as the data
permissions, so there is one mental model rather than two), and the **actor type is first-class** — which
matters, because the whole reason this question exists is that an AI can now propose changes to the
platform's own shape.

**And it is affordable, because the socket already exists — measured.** `entities.entity` and
`entities.field_definition` are already named resource kinds (`definitions.mutation-guard.ts:9-10`). A
column is already a row with settings (`custom_field_defs`). And a generic guard already takes a resource
kind, an operation and an actor and can **block** (`MutationGuard`, `mutation-guard-registry.ts:9`). So the
idea costs: a **settings block**, one new guard outcome (**escalate** — today it is binary allow/block),
and the **actor-type input**. Pending-approval machinery already exists on both sides
(`authority_pending_acts`; the AI's `pending-action-*` set).

**The grammar** (and the owner's sharpest point, the **reference** verb — a column others may reference
becomes public API, and changing it later breaks dependents, so it earns its own permission):
`(object, verb, actorType, role, level)`.

**Item 17 is not discarded — it is demoted.** The tier table survives as the **default beneath** the
mechanism: with no explicit structural permission, the kind's tier decides; both fail closed.

**What I checked and corrected:** the owner's premise — "now that every database column has its permission
setting" — is the **destination, not the current state**. There is **no per-column permission today**
(grepped: empty). The idea is a design, and an honest one, but the premise it builds on is still to be
built. Recorded as such.

**Written:** [`library/development/ARCHITECTURE-structure-permissions.md`](library/development/ARCHITECTURE-structure-permissions.md).
**Amended:** the dictionary — new **S11** (explicit per-object structural permissions) and **S12** (the
actor type is part of every structural decision); **S2** now installs **two** blocks on a new surface
(data + structural); `S2`/`SD-1`'s table noted as the default. New backlog items **SD-4** (the grammar) and
**SD-5** (the manage screen).

---

## 2026-10-06 — The specifications dictionary: the standard that stops the platform decaying as it grows

**Why this exists.** The owner's concern, in his words: permissions get set for the tables that exist
today and forgotten for the tables created tomorrow, "and similar gaps and bugs generating flaws". He
asked for a standard like MVC — a bible that every architectural change is checked against, inherited
into gates and guards so it cannot be forgotten.

**What was written:** [`library/development/SPECIFICATIONS-DICTIONARY.md`](library/development/SPECIFICATIONS-DICTIONARY.md).
**Ten uncompromisable standards** (S1–S10), a **change protocol** in eight steps nothing may skip, and the
two clauses the owner named: **the permissions question** (new data structure does not land until its
permissions are decided — default: full grant to superadmin plus permission records) and **the tier
question** (item 17, resolved).

**Two findings, measured this session.**
1. **The conflict engine already blocks the build.** `detectConflicts` is called by the module-registry
   generator, which `throw`s on any error (`module-registry.ts:3284`) — so structural clashes already stop
   a build. It is simply not yet pointed at an AI-proposed change. I first wrote "not wired"; that was too
   strong and is corrected in the dictionary.
2. **Item 17 is answered by being absorbed, not by being picked.** `CHANGE_KIND_TIER` is an empty frozen
   object, so every structure change currently fails closed to the strictest tier. That is safe, but noisy.
   The owner's instruction turns the tiers into a **standard** — derived from the vision's own three tiers,
   failing closed on anything unrecognised — with a first mapping proposed in the dictionary's Part E.

**The rule that makes it binding:** **Rule zero-zero-one** in the COOKBOOK. Every architectural change is
checked against the dictionary before it lands; the permissions question and the tier question may never be
skipped; and when the dictionary and the code disagree, **the disagreement is the defect**.

**The owner's confirmed decision (2026-10-06):** when a prompt asks for what a user may not see, the
platform **tells them it was blocked** — strict without disrupting the flow, and never letting a partial
answer read as a complete one.

**Also measured this session (feeds S4):** the data-permission idea is **already half-built** — a per-table
gate (`aclFeatures`, fails closed) and a per-column policy (`fieldPolicy`) exist; the own/team/global row
scope does not; coverage is **6 of 67** tables. *(Correction 2026-10-10: the true figure is **6 of 53** searchable entities — the "67" counted textual `entityId:` occurrences, not entity configs; and the gate is now complete — all 53 declare `aclFeatures`, `CC-46`, `c03eca5c`.)* And there is **no unguarded door**: every path the AI can
use to reach data is checked, and its sandbox cannot fake its scope. Full write-up:
[`analysis/owner-workthrough-data-permissions.md`](analysis/owner-workthrough-data-permissions.md).

---

## 2026-10-06 — G-21 built: the three endings a prompt can have, and the gate on the dangerous one

**The last item the owner's features_pack named now exists as code.** Not every prompt becomes a
Function. He described three endings — a one-time answer, a step of architecture (LMS/CRM), a saved
Function — and the triage that chooses. Two were already in the vision, **the one-time answer was named
nowhere**, and the triage had no home. Now typed, tested and committed (`916069a`).

**The finding that shaped the whole build: most of the gate already existed.** I went in expecting to
build the §46 bar and found it already built and already enforcing — `verifyFunction` runs the checks by
calling G-02's compiler, and `transition()` **refuses** to mark a Function `verified` on a failing report.
So G-21 **asks** that gate instead of growing a second copy of it. A re-implementation would have given
the project two answers to one question, and the drift would have been invisible, because both would have
looked authoritative.

**What was built** (`packages/shared/src/lib/request-outcome/`): the **three outcomes** as a first-class
union; a **pure triage** that proposes and *cannot* perform — the return type has no field for an applied
change, so the fence is a type, not a convention; and a **Save gate** that consumes `verifyFunction`'s
report. Structure is decided **first**, so "add me an LMS" cannot be quietly classified as a saveable
Function — the most consequential request must not get the quietest ending.

**The existing intent classifier is a different axis, and I left it alone.** `api/route/route.ts` already
classifies every request as `tool | general_chat` — that is a *dispatcher* question ("which tool runs
this?"), not the *outcome* question ("what does this become?"). A `tool` intent can end as either. Widening
that enum would have made a dispatcher answer a product question, and the next reader could not have told
which meaning was meant.

**The subtle one — the `not_checked` trap.** `report.passed` is `true` when nothing **failed**, and
`not_checked` never fails a report. So a green report can hide a check that **never ran** — and
`authorization_valid` never has, because the data-axis layer is G-04 and does not exist. A gate asking only
`report.passed` would have cheerfully offered to save a Function whose permissions were never established.
The gate therefore returns `notChecked` **even when it says yes**: a clean report must not read as a clean
bill of health.

**Two defects found while testing, and both are kept as regression tests rather than quietly fixed.**

1. **A helper typed `: string` that could return `undefined`.** `describeSaveGateVerdict` read
   `if (!verdict.allowed) return verdict.reason`. Given a value whose `allowed` was missing — a
   `VerificationReport` passed where a `SaveGateVerdict` was expected, easy to do because **both carry a
   `notChecked`** — `!undefined` is `true`, so it returned `verdict.reason`, which was also missing. The
   caller was wrong, but the silent non-string was the function's, so the function now guards its own
   contract and answers with a sentence for junk input.
2. **A mutation proof that proved nothing.** To show the fail-closed guard was real, I mutated the
   unclassified branch and the suite **stayed green** — which looked like evidence the guard was weak. It
   was not: my whitespace-sensitive replace **had not matched**, so I was testing an unmutated file. Redone
   by index, it fails the test. **A mutation that does not apply cannot falsify** — and the first version
   looked exactly as authoritative as the real one.

**Every guard is mutation-proven RED:** failures ignored · `notChecked` dropped · structure branch removed ·
confirmation dropped · tier failing open · unclassified guessing. Green: **shared 2234/2234 across 193
suites**, typecheck **exit 0** — after confirming the restored files byte-identical by `md5sum`.

**Three things deliberately NOT built, so the result is not over-read.** The **schema-mutation IR kind**
does not exist (`IrOperation` is still `list | count | aggregate`), so outcome 2 is **triaged and gated but
not yet emittable** — the fence comes before the thing it fences, on purpose. **No UI**: the gate is the
function a Save button will call. **No database row**: `document.ts` names its own trigger (G-07), which has
now landed, so that row is startable — but it is not this item's, and building it here would widen a
taxonomy change into a migration.

**Files:** code — `packages/shared/src/lib/request-outcome/{types,triage,gate}.ts` plus three test suites
(32 tests), commit `916069a`. Docs — `library/development/PLAN-G21-request-outcomes.md` (new),
`ARCHITECTURE-request-outcomes.md` (§5 register closed, §6 added), `BACKLOG.md`, `workspace/COOKBOOK.md`.

---

## 2026-10-06 — the live app-level run is GREEN: request in, Business IR out

**The measurement G-17 was built for now exists.** A plain-language request went in through the running
platform and a Business IR object came out — with the app's *own* registry resolving the agent, not a
test double.

```
1. SESSION      POST /api/auth/login                -> http=200  {"ok":true,"token":"eyJ..."}
2. REGISTRY     GET  /api/ai_assistant/ai/agents    -> http=200
                business_ir.query_author present, moduleId=ai_assistant
3. END TO END   POST /api/ai_assistant/ai/run-object -> http=200  elapsed=69s
```

```json
{"object": {"operation": "list", "entity": "invoice", "grain": "customer",
            "filters": [{"field": "amount", "operator": "gt", "value": 10000}],
            "currencyBasis": "EUR",
            "sort": [{"field": "created_at", "direction": "desc"}], "limit": 50},
 "finishReason": "stop", "usage": {"inputTokens": 530, "outputTokens": 92, "totalTokens": 622}}
```

Correct on every axis the prompt named. The owner's **yes** to `G-17` (rebuild the container) is what
made it runnable.

**The order the owner set is what made the result unambiguous.** The model was probed from **outside**
the platform first (PASS, http=200, 32s, correct IR). So if the platform run had failed, the fault would
have been the platform's, not the model's. Both halves passed — nothing left to unpick. This is the
"two routes" rule applied to a *dependency* rather than to a number.

**The first attempt failed, and it was my input, not the platform.** Login returned **401**. That is not
a defect: the script had guessed `secret` for superadmin, but the container seeds superadmin with
**`OM_INIT_SUPERADMIN_PASSWORD=password`** (measured from the container's own env; the *other* two demo
users use `secret`). The owner confirmed the same: superadmin is `password`, superadmin logs in in the
browser, and the password is used verbatim as the *bcrypt* secret. Re-run with `password` -> **200**.
**Had the outside probe not been run first, a 401 here would have looked like a platform fault.**

**A second input error caught before it could cost a cycle.** The run-object route's real body is
`{agent, messages: [{role, content}]}` — read from `runObjectRequestSchema` in
`api/ai/run-object/route.ts`. The script had guessed `{agentId, input}`; both field names wrong, which
would have returned `400 validation_error` and sent me debugging a phantom. Both route paths were then
confirmed against the generated table (`api-routes.generated.ts` line 32 `/auth/login`, line 239
`/ai_assistant/ai/run-object`) rather than guessed. **Read the contract; do not guess the shape.**

**The rebuild, measured both sides of the switch.** `docker compose -f docker-compose.fullapp.yml build
app` -> **12m22s**, new image `open-mercato/app:local` id `cd8c4242dcc0`; container recreated on it. Same
file, `/app/apps/mercato/.mercato/generated/ai-agents.generated.ts`: **0** occurrences of `ai_assistant`
before, **5** after (line 2 imports the module, line 10 registers `moduleId: "ai_assistant"`).

**Recorded but not acted on, and it does not change the result.** Latency was **69s** in-platform vs
**32s** straight to the model — the delta is the 530-token injected system prompt plus platform
overhead. A latency-budget data point, not a defect. Field names differ between surfaces
(`grain`/`created_at` in-platform vs `dimensions`/`date` raw) — that is the platform's schema doing its
job, not a discrepancy.

**Files:** `analysis/g17-app-run/RESULTS-2026-10-06.md` (new), `outside-probe-2026-10-06.md` (new),
`run-app-e2e.sh` (new; body shape and password corrected to the measured contract).

---

## 2026-10-06 — the IR agent declared, three tests its declaration falsified, and one gap left to the owner

**The gap the live run exposed.** The wire to the Business IR was built and the model was proven able to
use it — but the agent was **never declared anywhere**. `grep business_ir` found no non-test hits and
`ai-agents.generated.ts` was an empty stub. A wire with nothing registered cannot run in the app, so the
live app-level run could not have succeeded. Now declared: `ai-agents.ts` for
`business_ir.query_author` — `executionMode: 'object'`, **no tools**, read-only, its output schema pinned
to the **shared** `businessQueryIrSchema`, and its id imported from the wire so caller and registry
cannot drift.

**Getting it picked up failed silently twice, which is the part worth keeping.**

1. **The generator never ran.** I invoked the CLI's `dist/index.js`; it exited **0** and printed
   **nothing**. That file only *exports* the entry function — the real entrypoint is
   `packages/cli/bin/mercato`. **`exit 0` with no output is not success.**
2. **Then the registry was still empty — and my first explanation was wrong.** I assumed a stale build
   hid the file; importing the scanner's own `resolveModuleFile` showed it resolving correctly. So I
   traced the scan callback in the *built* extension instead, which showed it firing for `ai_assistant`
   with the file resolved — and the registry then carried the entry.

**Proven by two routes that share no failure mode:** the generated file's import statement, and a runtime
probe through the real `loadAgentRegistry()` — `found = YES`, `executionMode = object`, `schemaName =
BusinessQueryIR`, `allowedTools = []`, `readOnly = true`.

**Declaring the agent falsified THREE tests — all asserting a registry was EMPTY as a stand-in for
"nothing is declared".** `resetAgentRegistryForTests()` only clears a map and sets a latch; the next read
**lazily reloads the real registry**, so the "empty" premise died one call later, silently. **`reset` did
not mean "empty".** Repaired by moving each claim, not deleting it: the wire test now seeds the id as a
chat-mode agent with no output schema (object mode is refused with `execution_mode_not_supported` — a
deliberate refusal that survives whoever declares the id next), and the two empty-registry tests seed an
explicit `[]`. **Every repair was seen red** under two different mutations. Green: **1385/1385 across 100
suites**, app typecheck **exit 0**.

**One claim I made and then disproved — kept, because that is the point.** The once-failing
`agent-runtime-object.test.ts` is now 8/8, and the tidy story was "declaring the agent fixed it".
Tested: swapping the generated registry back to its empty form left it at **8/8**. So the cause is
**unattributed** (the registry sidecar was regenerated in the same window), and the item **stays open**
rather than being closed on a plausible story. *A fix you cannot attribute is a coincidence.*

**The one thing left, and it is the owner's call.** The route is live — `POST
/api/ai_assistant/ai/run-object` → **401**, the auth gate working (my first probe used a guessed URL and
got a misleading 404). But `starting-kit-app-1` has **no bind mount** to the workspace, so its code is
baked into a 15-hour-old image and its registry holds **0** occurrences of `ai_assistant`. **Nothing is
broken; the running app is simply older than the change.** The app-level run needs a **container
rebuild** — recorded as `G-17` (NEEDS-YOU Part 4's question), a yes/no for the owner. I did not touch the running
stack: widening its blast radius to make my own test pass is not my call.

**Files:** code — `packages/ai-assistant/src/modules/ai_assistant/ai-agents.ts` (new), plus three
repaired tests (`business-ir-author.test.ts`, `meta-pack.test.ts`, `ws-c-tool-pack-coverage.test.ts`),
commit `43161b3`. Docs — `workspace/COOKBOOK.md`, `BACKLOG.md`, `NEEDS-YOU.md`, `PLAN-G17-ir-generation.md`.
Skills — two new/updated lessons: `prove-a-generator-can-see-your-new-file` (new) and a sixth instance in
`repair-the-test-your-fix-falsified` (a fix that *adds* rather than removes).

---

## 2026-10-06 — the live model was asked, and it can: G-17's open question answered

**The one claim G-17 would not make has been measured, and the answer is yes.** The stack was up (all
eight containers healthy), so the local model was asked for real: **`Qwen2.5-7B-Instruct-Q4_K_M`, 6 of 6
requests produced an object our own schema accepts** — across six *different* IR shapes (filtered list,
`count`, bucketed `aggregate`, text `like` search, sort+limit, grouped average). Each reply was judged by
`businessQueryIrSchema`, not by eye. It also picked **sensible semantics** — `count` for "how many",
`aggregate` for "total per month" — which no schema can check.

**The negative control is the part that makes the 6/6 mean something.** Asked with a *loose* prompt, the
same model produced **nonsense** — invented nested `income`/`savings`/`debt` objects, plus a `tenant_id`
key. The schema **rejected it** and named why: a bad `operation`, a missing required field, and
`Unrecognized keys: "finances", "tenant_id"`. **So the model can go off-script, and the schema catches
it — including the exact tenant-widening the design exists to refuse.** Without this, "6 of 6" would
only have shown that the schema accepts everything.

**Two limits, stated so the result is not over-read.** It is **not a reliability rate** (six requests,
one run each, `temperature: 0` — it shows the model *can*, not how often it fails), and it went
**straight to the model server**, not through the platform's agent path. The model's *ability* and the
platform's *wire* are proven **separately** — which is exactly why the stubbed tests did not become
redundant.

**New artifact:** `packages/shared/src/lib/business-ir/__tests__/live.smoke.test.ts` — skips cleanly with
a loud message when no model server is running, because a measurement is not a gate.

**Still open:** the same request driven through the *live app* end to end (needs an authenticated
session).

---

## 2026-10-06 — G-17 built: the AI that emits the Business IR, and two of my own errors caught by falsifying them

**The join the vision was missing is now made.** The platform could compile and run a Business IR; it
could call a model with a schema; **nothing pointed the one at the other.** Now:
`business-ir/schema.ts` (the IR as a zod schema, `.strict()` at every level), `schema.conformance.test.ts`
(18 tests), `business-ir-author.ts` (`authorBusinessQueryIr()` — the wire, through the *existing*
`runAiAgentObject` schema override), and `business-ir-author.test.ts` (6 tests, ending with a model's
answer being **accepted by the existing `compileQuery`**). Full `business-ir` suite: **78/78**.

**Two of my own errors, both found by trying to break my own work — which is the whole reason the rule
exists.**

1. **A guard that was a print.** The schema asserted that it mirrored `types.ts` using bare type aliases
   (`type _Check = Expect<AssertEqual<A, B>>`). The falsification — delete a field, re-run `tsc` — came
   back **clean**, which is exactly what a broken guard looks like. Cause: TypeScript resolves an
   **unused type alias lazily**, so it never ran. Isolated probes proved only `const d: AssertEqual<A,B>
   = true` actually fails. Moved every assertion into one exported const. Re-measured: delete `grain` →
   `tsc` now **fails** (`TS2322`). *A test that cannot fail is documentation, not a guard.*

2. **The wire was on the wrong side of the dependency.** Writing it in `shared` made `shared` import
   `ai-assistant`, and `shared`'s type-check broke. The direction rule was already written down one file
   over. Moved it to `ai-assistant`; `shared` is clean again. *The layering is not a style preference; it
   is what keeps the packages independently checkable.*

**What is NOT done, plainly: the live smoke test.** Every proof above uses a **stubbed** model. Whether
our local model can actually emit a valid IR is a **separate question** that only a live run answers — so
it is **unproven**, and recorded as an open item (`G-17`; NEEDS-YOU Part 4's live smoke test). Also found: a **pre-existing**
broken test in the AI package (`agent-runtime-object.test.ts`, 4 of 8 failing on an unmodified tree),
recorded as item 14.

**Files:** code — `packages/shared/src/lib/business-ir/schema.ts`, `.../__tests__/schema.conformance.test.ts`,
`packages/ai-assistant/src/modules/ai_assistant/lib/business-ir-author.ts`,
`.../lib/__tests__/business-ir-author.test.ts`. Docs — `BACKLOG.md`, `NEEDS-YOU.md`,
`PLAN-G17-ir-generation.md`, `workspace/COOKBOOK.md`.

---

## 2026-10-06 — G-17 begins: the AI that emits the Business IR, and a wrong claim corrected

**The documentation was perfected first, at the owner's request** — the tier decision recorded, and the
reading order unified across all four entry points into three tiers (A: direction + live decisions; B:
the spine; C: supporting, opened only where the work needs it). Then G-17 began.

**G-17's step 1 research corrected a wrong claim in G-17's own `BACKLOG` row.** The row said *"no
constrained-generation exists; the first artifact is a parser from scratch."* That was measured against
the **wrong vocabulary** — it grepped for the OpenAI wire fields (`response_format`, `json_schema`). The
platform calls models through the **AI SDK v7**, where the constraint is `generateObject({ schema:
<zod> })`, and **that is already built and in use**: `ai-sdk.ts` re-exports `generateObject`;
`api/route/route.ts:138` calls it with a zod `RouteResultSchema`; and there is a first-class object
endpoint (`api/ai/run-object` → **`runAiAgentObject`**) that takes a **structured-output schema
override** (`agent-runtime.ts:1831`). **So G-17 is not "build constrained generation"; it is "write the
IR's zod schema and point one agent at it."**

**What is genuinely missing, measured:** the IR has **no zod schema** (zero zod imports in
`business-ir/`, `kernel/`, `user-function/` — it is a TS type only, so nothing checks an incoming IR's
*shape*); nothing in `ai-assistant` imports `business-ir` (**zero hits** — the missing join, re-confirmed
by two routes); and there is **no schema-mutation IR kind** (that is G-21's, not this sprint's).

**The sprint is scoped and the cookbook written** (`workspace/COOKBOOK.md`, *Sprint G-17*), in the
project's four-step process: write `business-ir/schema.ts` mirroring `types.ts`, prove the two agree
with a conformance test that **can fail**, wire one agent through the existing override, and test the
end-to-end path with a stubbed model. **Step 4 (build) is next** — and its one unproven claim is
**whether our local quantised model can emit a valid IR**, which is a measurement, not an assumption.

**Files:** `library/development/PLAN-G17-ir-generation.md` (new, the step 1–2 record),
`library/development/BACKLOG.md` (G-17 row corrected + header), `workspace/COOKBOOK.md` (Sprint G-17),
`library/development/README.md` (new doc indexed).

---

## 2026-10-06 — The three things a prompt can become, and a wrong reading of mine corrected

**The owner described his core features_pack: not every prompt becomes a Function.** A prompt can end as
**(1) a one-time answer** (analyse, report into a datagrid/form/report, save nothing), **(2) a model
proposal** (the prompt needs new *structure* — a field, an entity, a whole new service like LMS or CRM),
or **(3) a saved Function** (walked to *flawless*, named, placed in a grouping, then runs with **no AI**,
"like a standard item menu in the traditional platforms"). He asked me to grill it and **verify it is
well established in the development plans**.

**The grilling found that my own previous claim was wrong — and it is the exact error my method warns
about.** In the same-day gap-register pass I had written that the vision "never names a prompt-caused
schema change". Re-measured from the source: **it does name it.** `Doc 04 §33` (line 997) —
*"When the user says: **Add Vehicle.** the first operation is: draft Business Model change — not ALTER
TABLE"*; `Doc 04 §34` — the full `User/AI request → Model Proposal → … → Publish Model Version` pipeline;
`AI_Native… §122` — `User requirement → … → Activate capability` (the LMS/CRM case); and `§123` — *"Both
can originate from natural language, but they go through different command paths."* I had measured the
wrong document. **Retracted and corrected in place.**

**What is genuinely absent, measured three independent ways.** The **one-time answer is named nowhere.**
(a) the vision folder — every `ephemeral|one-time|ad-hoc` hit is about *system* state (prompt caches,
worker state, processing state), not a prompt outcome; (b) the whole library (~26,000 files) — every
substantive hit belongs to an imported project or a Cancel button; (c) the nearest counter-example, read
in full — `Doc 03 §40` (*"Do NOT save only: raw SQL / the prompt / the returned data"*) is about **what**
to save when you save, not **whether** to save. And the **triage** — the rule that decides which ending a
prompt gets — exists as **one sentence** (`AI_Native… §123`) with **no backlog item and no home**, while
`save as function` returns only the two loop lines (`BACKLOG` 70, `HANDOVER` 616), neither naming
outcomes 1 or 2.

**So: two of three outcomes are covered, one is absent, and the triage is homeless.** That is now
**G-21**, with the design in [`library/development/ARCHITECTURE-request-outcomes.md`](library/development/ARCHITECTURE-request-outcomes.md)
— six grilled questions, each with a decision taken and written down. Two things the grilling settled
that the vision had left open: **(i)** the **"flawless" bar** is not a feeling — it is `Doc 03 §46`'s
objective checks (`IR valid · entities valid · … · sample result valid`), enforced by G-02's compiler, so
the Save button should be *disabled* until they pass; **(ii)** the **grouping** (`§61`'s
`Destination: Finance → Accounts Receivable`) is decided to be a **declared canonical path**, not free
text, so a menu cannot be spelled two ways and `§63`'s *"pattern → vendor module"* becomes detectable.

**A critic pass then caught my own invented scheme, and I replaced it with the vision's.** I had split
outcome 2 into a hand-drawn "small/large". A hostile re-read found `Doc 04 §130–§132` already tiers
*changes* into **safe / review-required / explicit-approval**. My approximation was weaker than the rule
sitting next to it, so G-21 now uses the vision's three tiers.

**Documentation changed in the same pass:** `BACKLOG.md` (**G-21** added; **G-17**'s row narrowed to all
three paths; header), `WHAT-WE-ARE-BUILDING.md` (the loop diagram now **branches**, because it previously
implied every need ends in a saved Function — the exact misreading the owner warned about),
`HANDOVER.md` (the decisive-loop line shows the branch), `README.md` (new doc indexed),
`NEEDS-YOU.md` (row `NY-14` — one genuine owner question: which tier an LMS/CRM-sized capability lands
in), and the gap register (**§7b**: the wrong reading corrected, the real gap recorded).

**One open question for the owner, no more:** *when a prompt asks for a whole new service, is that
review-required or explicit-approval?* Recommended: **explicit-approval**. Everything else was decided
and written down so it can be changed by saying so.

**Next:** G-17 (unchanged) — now scoped to emit the IR for **all three** paths, not the read path alone.

---

## 2026-10-06 — Sprint 0 re-run: the stack comes up whole, and why it did not

**The owner's answer unblocked `S0`, so the re-run happened — and it immediately found a real defect.**
The owner had reported the stack "up" and Docker Desktop auto-start "fixed". Measured independently:
Docker server **29.8.1** running, but **`mercato-redis-local` had exited (255)** and, behind it,
**`mercato-mcp-local` was `unhealthy`** with a healthcheck `FailingStreak` of **1446** and a log reading
`getaddrinfo ENOTFOUND mercato-redis-local`. So the count read "seven up" — and eight *rows* existed all
along. **A row count is not health.**

**Root cause, measured three ways.** `redis` was the **only** service in
`docker-compose.fullapp.yml` with **no `restart:` policy** — every other service carries
`restart: unless-stopped` (verified directly from `docker inspect .HostConfig.RestartPolicy`, not from the
file's prose). `mcp`, `app` and `opencode` all declare `depends_on: redis: condition: service_healthy`, so
with redis down the MCP could never finish starting.

**The fix and the proof.** Added `restart: unless-stopped` to the `redis` service (with the reasoning in a
comment), ran `docker compose up -d redis`, then `docker restart mercato-mcp-local`. Verified by two
independent routes: **(1)** all **8 containers healthy** — MCP `FailingStreak 0`, log
`Tools registered toolCount=21`, `Server listening port=3001`; **(2)** the app's `/login` returns **200**
and the model's `/v1/models` returns **200**, with **no redis errors** in the app log.

**What the defect taught.** The documentation had carried "8 containers up" for two days as an
*observation*. It was a **measurement of the wrong thing** — a count, when the claim should have been
about health. The claim was corrected everywhere it lived: `HANDOVER.md` (§0 check now demands the
**Status** column, not a count; §7 Group A; §7 "proven"), `RUNBOOK-sprint0.md`, `NEEDS-YOU.md`,
`BACKLOG.md`, `BLOCKERS.md` (resolved table), `INDEX.md`, and a new `workspace/COOKBOOK.md` section.
The fix itself is one line in the code repo.

**What the re-run did *not* do.** It did not touch **B-16** (no embeddings endpoint — still open, still
root-caused as two defects), and it did not exercise a **real host reboot**; the restart policy is the
mechanism that makes a reboot safe, and it is now correct in the file, but the reboot itself is not proven.

---

## 2026-10-06 — the second Paperclip pass, and a file the extractor had lost

**The owner asked for a second, wider study of Paperclip: extract the archive, read it again — every
functionality, code, idea, flow and concept — and find anything that adds value or inspires an idea,
documenting it only if there is.**

**The answer is yes, and it is not where Paperclip's own README points.** Almost everything Paperclip
*advertises*, we already have or already plan. What is worth taking is **how** it does the things we have
only described. The study ([`library/paperclip-value-study/`](library/paperclip-value-study/), 12 batches)
ends at [`findings/07-synthesis.md`](library/paperclip-value-study/findings/07-synthesis.md): **six things
worth acting on, four of our items confirmed correct, eight rejections with a reason each, and a trap
list.**

**Two findings changed words we had already written.** First, **`ML-4` promised a mid-run stop we have not
built.** Paperclip built exactly this, and its design records spend *first* and judges it *after*, so
crossing a budget pauses the scope and blocks future admission while the code that cancels work already in
flight is an **optional hook** that one service of six supplies. Our item now says what it can deliver.
Second, **we had never drawn the orchestration boundary** Paperclip drew explicitly and refused to cross
(*"a second orchestration system inside the product"*). It is now **N-15**, to be written before `AH-3` is
built.

**The strongest idea in the study is the responsible-user intersection:** an agent acts *on behalf of* a
person, and its authority is the intersection of its own permissions and that person's, decided **inside
the single decider** rather than at each call site. We already hold the rule in our own words; this is the
place to put it. It lands on **`S-02`**. `AH-8` and `AH-9` were confirmed correct, and both now carry the
mechanism that was missing from our item text.

**Three genuinely new ideas**, all on the "do not lose this" list rather than the roadmap — the fourth new
item is the boundary rule above (**N-15**). They are: the **self-modification gate** (**N-16** — a diff, an
accepted interaction, and application only in a separate run, with an evidence floor), the **memory control
plane** (**N-17** — extending the tenant-scoped provider we already designed to a policy over several), and
the **plugin capability model** (**N-18**).

**The study's own evidence base had a defect, and measuring found it.** The first extraction produced
8,299 files against the archive's 8,300, and the first pass attributed the gap to *"a single symlink
Windows will not create"*. That was wrong: the archive holds **two** symlinks and **both are present** in
the tree, and the real gap was **one missing file** —
`packages/db/src/migrations/0118_pipeline_case_agent_fanout.sql`, 346 bytes. Restored from the archive
byte-for-byte. The tree and the archive now agree **exactly** at **8,300 files / 132,839,980 bytes**, by
two independent routes.

**The critic pass also found two false claims in the study's own findings** — both "we have nothing"
statements about things we do in fact have (the agent-learning prohibition, and a designed tenant-scoped
memory provider). Both are corrected in place, with the measurement that disproved them, rather than
quietly edited.

**The owner answered the three open items.** Docker Desktop auto-start is **on** and Docker is running
(seven containers up, server 29.8.1), so **`S0` is unblocked** — and it now has one thing to explain:
`mercato-mcp-local` reports `unhealthy` while the other six are healthy. The 3.8 GB installer is
**deleted**, confirmed two ways (no `.iso` remains but the 67 KB cloud-init seed, and `C:` is at 86 GB free
against 82.74 GB). The Coolify password stays open by his choice.

**No code changed, so the code repository has no commit.** Committed in Repo 1 (docs), staged by explicit
path, never `git add -A`.

---

## 2026-10-05 — the model default is decided, and the documentation a new agent needs now exists

**The owner approved the model-layer recommendation and asked for four things: follow it, map the
Hermes agents / personas / profiles onto tenants and roles, record two requirements for the
open-source lane, and sweep the documentation so a new agent gets the full picture.**

**The decision: per-tenant policy is the destination, cloud-first is the interim.** Recorded as
[`library/development/ARCHITECTURE-model-server-integration.md`](library/development/ARCHITECTURE-model-server-integration.md)
**§9**, "DECIDED by the owner, 2026-10-05". It turns three pieces of work from *nice* to *required*:
the model registry, the Hermes **agent / persona / profile** mapping, and platform-managed local
models. Item 13 of [`NEEDS-YOU.md`](library/development/NEEDS-YOU.md) is closed.

**The two owner requirements.** First, the open-source lane must **not reserve a vendor's settings**
(the example given: OpenAI's), because we will integrate several suppliers and open-weight models;
written into **§4.2**, and general to every provider. Second, the platform must be able to **choose
which local (llama) model runs**, per the deployment's hardware and per new model releases; written
into a new **§6.4**, "Managing the local model from the platform". The Hermes mapping intent is in
[`library/development/AGENT-HALF.md`](library/development/AGENT-HALF.md) §5.

**The critic passes on the model document converged: eight passes, sixteen changes, and the tenth
pass found nothing new.** The sharpest finding was a "fix" that was itself wrong — a previous pass
called a runbook sentence false when the same change had rewritten the entry it was looking for. Two
routes disagreed, and that disagreement exposed it. Every finding was corrected in the text, none
defended.

**A new navigation layer now exists.** [`library/development/BOOKMARKS.md`](library/development/BOOKMARKS.md)
is the one-page short list: the documents that matter, the **end-game / vision** documents, the two
integration designs, and an honest list of which folders are in git and which are not. The root
[`INDEX.md`](INDEX.md), [`library/INDEX.md`](library/INDEX.md),
[`library/development/README.md`](library/development/README.md) and `HANDOVER.md` (revision 8) all
point at it. This session's reasoning is written down in
[`library/development/THREAD-2026-10-05.md`](library/development/THREAD-2026-10-05.md).

**Two folders the design cites were sitting untracked, and that is fixed.** `llama/` (the eight
documents the model-layer design was built from) and `analysis/` (the earlier Hermes / Starting Kit
study) are now **tracked**; the Hermes source at the repository root is now **ignored**, matching its
library twin. An our-call, reversible with `git rm -r --cached analysis llama`.

**No code changed, so the code repository has no commit.** Committed in Repo 1 (docs), staged by
explicit path, never `git add -A`.

---

## 2026-10-05 — the agent study is finished, and the scattered documents have one home

**The owner asked for two things: finish the forensic study of Paperclip and Hermes — batches 04 to
10 — and gather the documents scattered across the laptop into one place in the library.**

**The study is complete: 11 of 11 batches, 3,931 lines.** Its deliverable is the synthesis at
[`library/paperclip-hermes-study/findings/10-lessons-and-target-design.md`](library/paperclip-hermes-study/findings/10-lessons-and-target-design.md)
— every lesson with its evidence and its consequence, and each of the owner's twelve named concerns
(assistant agents, solo agents, roles, delegation, event triggers, recurring work, meetings, joining an
existing thread, skills, memory, models, MCP) answered in four voices: what Paperclip does, what Hermes
does, what the sibling's integration did, and what we should do.

**Three findings changed what we would build.**

1. **"Session resume is broken" is our defect, not Hermes'.** The capability exists — Hermes continues a
   transcript through `POST /api/sessions/{id}/chat`. Batch 07 contradicted the claim, and it is now
   recorded as *not an issue* so nobody re-raises it.
2. **The warm-session hazard is stronger than the dossier said.** The sibling's own note said a write
   underneath a session Hermes already holds *"may not be seen"*. Measured: **it will not be seen.**
   History loads only on a cold restore, and warm sessions are never evicted on a timer. This is the one
   place our architecture can beat both: because Hermes runs **in-process** for us, we can write
   *through* the runtime's session path instead of underneath it — which a pure HTTP control plane
   cannot do.
3. **A new defect in the sibling's proof script.** It calls `SessionDB.list_sessions`, which does not
   exist on either Hermes tree — only `list_sessions_rich` does.

**And the study found the gap that matters most: neither system has a meeting.** Paperclip has no room,
channel or meeting entity at all — every conversation is 1:1 or one thread against one task, and an
agent is pulled into a thread only by assigning it work. Hermes, meanwhile, already ships **hosted
rooms** with a 128-member limit and replica takeover. That combination is our opening.

**One decision came back to the owner.** The study carries lessons, not decisions — with exactly one
exception: whether an assistant agent is *identity* (it belongs to Alice) or *context* (it acts as Alice
for Alice's work). Paperclip chose context. It is item 8 in
[`library/development/NEEDS-YOU.md`](library/development/NEEDS-YOU.md).

**The scattered documents now have one home.** `library/ai/source-docs/` holds the one set with no other
consolidated home — upstream Paperclip's 317-file documentation — beside a **tracked register** saying
where every other scattered set already lives and why it was not copied. The copies follow the project's
standing rule and are gitignored; **exactly one file is tracked.**

**The work was audited by a separate hostile pass, which found four defects — all fixed.** An
over-stated *"exactly one item is open"*; a code citation that was correct in one Hermes tree and wrong
in the other; and two stale library file counts (the file said 2,440 and then 3,121 against a real
**3,439**). The four are now lessons in [`LESSONS.md`](LESSONS.md) — **L80 to L82**.

**Verification.** All 299 local links across the 13 changed documents resolve. All ten per-batch line
counts were re-measured and are correct. The 521-document shelf count was re-measured and is correct.
Committed as `59c109a`.

---

## 2026-10-04 — part 1 of 8 (newest first) — the infrastructure answer, and a defect whose recorded cause was wrong

**The owner asked two things: whether we have everything needed to deploy and test the codebase, and
to leave no gaps, flaws, bugs or incomplete work while getting there.**

**The infrastructure answer is: built and proven, but not running — and the agent cannot start it.**
The Sprint 0 stack is complete and was proven working earlier today (eight services healthy, 21
platform tools discovered). Nothing is missing: the compose file, the model file, `.env` and Node 24
are all in place, and the database is provided by the stack rather than installed on Windows. What is
*not* in place is a running Docker engine. Chasing that produced the session's most useful finding:

```
$ docker desktop start
PROGRAM BLOCKED BY SECURITY POLICY - the sandbox prevented a program on the configured
Program Blacklist from starting:
  - wsl.exe (C:\WINDOWS\System32\wsl.exe)
```

Docker Desktop's startup path runs `wsl.exe`, and this machine's security policy blocks it for
anything the agent launches. The block is not approvable and must not be worked around. **So "start
Docker Desktop" is a permanent owner step, not a one-off** — and `AutoStart` is off, so it recurs on
every restart. Recorded as **B-04**, rewritten, precisely so a later session does not read it as the
agent having failed.

> **Update, 2026-10-06.** The owner turned Docker Desktop **auto-start on**, so the second half of that
> is no longer true: it no longer recurs on every restart. **The first half still is** — the agent
> cannot start Docker Desktop, and never will, because that is a security-policy block and not a
> setting. See `NEEDS-YOU.md` (its row 6 = `B-04`) and `RUNBOOK-sprint0.md`.

**Then the defect, and the uncomfortable part: the recorded cause was wrong.** B-15 said `mercato
init` "printed `❌ Initialization failed` yet **exited 0**", so the fix looked like it belonged in the
CLI. It does not. The CLI's catch block returns 1 and `bin.ts` calls `process.exit(code ?? 0)`, and
the CLI's **own tests assert `toBe(1)`** — two independent routes, both saying the CLI was honest.
The dishonest code was `init-or-migrate.sh`, in two lines:

```sh
if sh -lc "${COMMAND}" >"${LOG_FILE}" 2>&1; then
  return 0
fi
STATUS=$?          # always 0
```

The exit status of an `if` with no `else` whose condition failed is **0**, so every failure was
reported to the caller as success and the "already seeded" marker was written anyway. The same
mistake appeared **a second time** at the bottom of the same script, and a third variant lived in
`dev-entrypoint.sh`, where a function opening with `set -e` was called as `if ! (run_setup)` —
and **errexit is ignored for a function invoked as a condition**, so that guard was dead code.
Three defects, one family, all measured in both `sh` and `bash`.

**All three are fixed, and the fix is proven rather than asserted.** Two tests that need no Docker:
`init-or-migrate.test.sh` (**7 passed / 3 failed** against the unfixed script, **10 / 0** after) and
`compose-init-guard.test.sh`, which extracts the *real* `command:` block out of the compose file and
runs it against stubs (**3 failed** on the old text, **6 passed** on the new). Both were deliberately
run against the broken code first — a regression test that passes before the fix is not testing the
fix. **One recorded instruction was deliberately not followed:** B-15 said to treat "a printed
failure" as failure too, but the string `❌ Initialization failed:` also wraps the *"database already
has users"* message, which must be treated as **success** — a text match would have broken that
recovery path. The status capture was the fix; the tests pin the already-seeded path as a success.

**A correction I had to make to my own work, twice in one session.** The `.wslconfig` I applied
earlier today capped WSL at **12 GB**. A measurement already sitting in the runbook settles it — the
*model container alone* uses **~10 GiB** of a Docker VM that was **15.56 GiB** — so the cap would have
starved the stack, and the symptom would have been containers OOM-killed mid-run, which reads as a
code bug. Raised to 16 GB, the ceiling the stack was proven to work at. The file now records the
budget and notes that a ceiling is a ceiling, not a reservation.

**The blockers list had drifted.** B-01, B-02, B-03 and B-04 were still listed as 🔴 OPEN while the
same file's Resolved table said all four were cleared — in a file whose own rule is "a blocker is a
claim about now, not about last time". Rewritten: five open, and only **B-04** actually stops work.

**What this means for the owner.** One action: start Docker Desktop. Everything else in the
deployment path is either proven or now has a test.

---

## 2026-10-04 — part 2 of 8 (newest first) — the deployment path is proven: domains, directories, databases, phpMyAdmin

**The owner asked to keep going until he could add domains, put code in directories, create linked
databases and open phpMyAdmin — so he could test his own WordPress sites and then a Docker platform on a
subdomain.** The environment was already built; what was missing was proof that a *site* can be served.

**What was in the way, and what I did about it.** Coolify's API exists and can create services, but it
needs a Sanctum token, and 2FA now blocks scripted UI login. I could have minted a token by writing into
`personal_access_tokens` — and decided not to. The asymmetry settled it: if my proof stack were wrong we
lose a round-trip, but if I corrupted the auth tables of a dashboard the owner had just secured with 2FA,
he could be locked out. **So I proved the environment with compose and documented Coolify's own path,
rather than doing surgery on an auth system to save a click.**

**What is now proven with real traffic.** A throwaway stack (`/opt/companai-teststack`) reusing Coolify's
*own* Traefik and its `coolify` network:

- `Host: wp.test` → WordPress, redirecting to its installer.
- `Host: pma.test` → a **full phpMyAdmin login**: `pma.test / mariadb | phpMyAdmin 5.2.3`,
  `Server: mariadb:3306`, both databases listed, live session.
- `Host: app.test` → a separate container; and `Host: wp.test` **+ `/files/hello.txt`** → that same
  container, *not* WordPress. That is the "code in a directory under a domain" case.
- A second database created beside the first, written to, and read back **by name** from another container.

**The most useful thing found, though, was in Coolify's source.** The Domains field is not just a
hostname: `fqdnLabelsForTraefik` parses `scheme://host[:port][/path]`, and **the scheme decides TLS** —
`https://` adds `tls=true` and a Let's Encrypt resolver, `http://` adds neither. So for `.test` names you
must write `http://`, and a **path in the domain entry is Coolify's own built-in way** to serve code from
a directory. That turns the owner's requirement from something to be engineered into something to be
typed.

**Verification.** An independent critic agent re-measured all eleven claims from scratch and refuted
none; it found two extra things on its own — a phantom port 8080, and Coolify's catchall router not
taking effect. Both are recorded.

**And I caught a false negative of my own.** I first reported that phpMyAdmin could not reach the
database. It could. My test used `/dev/tcp`, which does not exist in `dash`, so the probe failed and I
nearly wrote that up as a finding. Re-tested with the PHP runtime phpMyAdmin itself uses: OPEN. Written
up as [[L62]] — a failing probe is not a finding until you know the probe works.

---

## 2026-10-04 — part 3 of 8 (newest first) — 2FA verified, the exposed password tested, and the WSL cap applied

**The owner asked "what's next?" and reported 2FA done.** Instead of accepting it, I re-measured, and
the round produced three things worth recording.

**1. 2FA is genuinely on, confirmed two independent ways.** The database says
`users.two_factor_confirmed_at = 2026-10-04 12:44:46` with a secret and recovery codes present. And a
*live* login attempt now returns `302 -> /two-factor-challenge`. Two routes, same answer — which is the
standard this project is held to.

**2. The exposed password is still live.** That same login attempt is what proved it: Fortify only
reaches the 2FA step when the credentials pass, so `302 -> /two-factor-challenge` means the password
that was typed into a chat message **still authenticates**. 2FA is the only thing protecting the
account. It stays an open item and is now the owner's single remaining action.

**3. The `.wslconfig` deferral was based on a premise that turned out to be false.** The plan had
parked this change because "it restarts the dev environment". Measured before acting: Docker Desktop is
installed but **not running**, and the only WSL distro is idle. A `.wslconfig` only applies when WSL
next starts, so there was nothing to disturb and no `wsl --shutdown` was needed. The file was written
(12 GB / 4 CPU / 4 GB swap). `wsl.exe` is also blocked by this machine's security policy, so the
restart could not have been run from here anyway.

**And I got a number wrong, then caught it.** I justified the cap with "WSL2's default ceiling is 80% of
RAM on Windows 10". Microsoft's current documentation says **50% of total memory**, no Windows 10/11
split; 80% is a stale figure still repeated across the web. The change was still worth making — 16 GB
of WSL plus a 6 GB VM is 22 GB of 32 — but the number carrying the argument was wrong, and it is
corrected in the file header, the runbook and the plan. Written up as [[L61]]: if a number is the
reason to act, read the vendor's current page.

**Verdict on the build:** the environment is complete. What remains is one 30-second owner action (the
password), one untested behaviour (a real *host* reboot — the auto-start policy reads
`Start / delay 30` but has never been exercised), and decisions that belong to the application phase.

---

## 2026-10-04 — part 4 of 8 (newest first) — the hosting environment is built, and it is real

**The instruction was: engineer the environment, don't ruin the laptop, and keep a supervisor on
every step.** So this was done in phases, each one verified by an independent agent before the next
began. Two of those verifications found real defects — which is the whole reason for having them.

**The install stopped and waited for a person.** The autoinstall seed *was* found — the VM console
showed subiquity walking through every `apply_autoinstall_config` step — but it then asked
`Continue with autoinstall? (yes/no)` and sat there for eight minutes with the CPU at zero. The seed
alone does not suppress that prompt; only `autoinstall` on the kernel command line does. Answering it
needed a keystroke, and **the obvious way to send one does not work**: `Msvm_Keyboard.TypeText`
returns `ReturnValue = 0` and types nothing. What works is pressing keys by their **virtual-key
code**. We only found that because of the control we ran — pressing **Enter and nothing else** made a
third prompt line appear, which proved input was arriving and isolated the fault to `TypeText`. Had
we not run that control, the conclusion would have been "keyboard input does not work on this VM",
and the fix would have been remastering the ISO. That is a much larger change to solve a problem
that did not exist. **L59.**

**Reading a screen that has no screenshot API.** Hyper-V has no `Get-VMScreenshot`. The console image
comes from a WMI call that returns a raw RGB565 framebuffer. We rendered it to PNG and read it — and
that is how the blocking prompt was found at all, and how we confirmed the `yes` landed.

**The supervisor found a defect in what I had just declared done.** I had set the hard disk first in
the boot order and reported it as verified. It was not: `BootType -eq "Drive"` matches a **DVD** as
well as a hard disk, and the entry I moved to the front was the *empty DVD drive*. The VM still
booted (an empty DVD falls through), so nothing looked wrong — but re-inserting any ISO would have
booted the installer again, exactly the loop the plan set out to prevent. Fixed by discriminating on
the device type. **This is the class of error the plan's "verify before proceeding" rule exists to
catch, and it was caught by someone re-measuring rather than by me re-reading my own work.**

**Coolify is up, and its installer is honest about what it checks.** Docker 29.8.2 and Coolify 4.3.23
went in cleanly; six containers, all genuinely healthy; dashboard on 8000, Traefik on 80/443. We
proved persistence properly — **rebooted the guest and all six came back**, including the sentinel
whose `RestartPolicy=no` looked like a defect but turns out to be by design (the Coolify app manages
it). And the pre-seeded admin account **failed validation**, in Coolify's own words: the email must
pass `email:rfc,dns` (the domain has to actually resolve) and the password must contain a symbol. So
the account is left for the owner to create in the browser — it is his identity, and 2FA is
browser-only in any case. The three variables that claimed otherwise are now commented out rather
than left lying in the config.

**A small thing with outsized consequences: the address moves.** After the reboot the VM's DHCP
address had changed from `172.19.120.91` to `172.19.122.65`, so SSH failed and the VM looked dead for
three minutes. It was not. The stable address is the **static** `172.28.50.2` on the second NIC — and
the only reason the host cannot use it yet is that **Phase 6 has not been run**. That turns a
two-command firewall step from a nicety into the thing that makes the environment pleasant to use.

**Where it stands.** The environment exists and works: a real Ubuntu 24.04.5 guest on its own disk,
Docker and Coolify running, containers that survive a reboot, the dashboard reachable from the laptop,
82.74 GB still free (the stop line is 60). It is written up in
[`library/development/RUNBOOK-platform-server.md`](library/development/RUNBOOK-platform-server.md).
**Two things are left and both need the owner:** one elevated run for Phase 6, and creating the
Coolify account. Neither is blocking anything else.

**Both were done the same afternoon.** The owner ran the elevated script and created his account. And
then the interesting part: **the link was proved with traffic rather than a config read.** It would
have been easy to tick the box on the two `Get-Net*` outputs. Instead a listener was started on the
host bound to `172.28.50.1:8080` and the guest was pointed at it — `HTTP 200`, with the host's own log
recording the client as `172.28.50.2`. That is the difference between "the rule exists" and "the path
works", and only the second one is worth anything.

**The same check also caught a criterion in my own plan that was wrong.** It said "the VM pings the
host". Ping returns 100% packet loss — Windows Firewall drops inbound ICMP by default and the rule
deliberately allows only TCP 8080. Nothing is broken; the test was. Had we trusted it, we would have
gone hunting a fault that did not exist.

**And one false alarm of my own, worth recording as L60.** Checking which SSH account Coolify would
use, I queried its `servers` table and read `user = coolify`, found no such account on the machine,
and concluded the connection was misconfigured. It was not. **`user` is a reserved word in Postgres**
— bare `select user` returns `current_user`, so I had read the *database role* back, not the column.
The real value is `root`, and `root@host.docker.internal` connects. The wrong answer was plausible
enough to have gone unnoticed: `coolify` is exactly what you would expect in a Coolify database, and
every neighbouring column was correct. What broke the story was *trying* the connection instead of
describing it. **The rule: when a value looks like it might be about the tool rather than the subject,
check that you selected what you meant — and settle a finding that would send someone off to fix
something by a second, independent route.**

**A pleasant side effect:** Phase 6 gives the host a *stable* address for the guest. `172.28.50.2`
never changes, so the dashboard is now bookmarkable at `http://172.28.50.2:8000` — while the DHCP
address had already moved once that day.

---

## 2026-10-04 — part 5 of 8 (newest first) — a verified backup, and the model 46% faster

**The owner asked for a full codebase zip before any further change, and it had to be flawless.**
Saved to `C:\Users\Ramzi\Downloads\companai\starting-kit-codebase-backup-2026-10-04.zip`:

- **4,889,632,988 bytes** (4.55 GB); **SHA-256 `8fb277ba5eab8d62a5947c290a57d52aec3248ed01a1daee7394b9203172c31c`**.
- **23,249 files**, 5,105,209,091 bytes uncompressed.
- **Excludes only two things, both regenerable:** `node_modules/` (deps — `npm ci`) and
  `apps/mercato/.mercato/` (the Turbopack cache already known corrupt, blocker **B-08**). Everything
  else is in, including `models/` (the 4.4 GB GGUF) and `.git/`.
- **Verified three ways:** `7z t` → *"Everything is Ok"*; the archive's file list diffed against the
  on-disk list → **0 missing, 0 extra**; and the byte totals agree exactly on both routes
  (5,105,209,091). Not assumed — measured.
- **A note on the project's own rule.** Rule zero-four says *source is not copied, because git is a
  better restore point*. It is right in general — but the tree has **5 uncommitted files**
  (`.dockerignore`, `.gitignore`, `Dockerfile`, `docker-compose.fullapp.yml`, `package.json`) and the
  last commit is **2026-08-13**, so no tag captures the present state. The zip is genuinely useful
  here, and the owner asked for it explicitly.
- **The tool mattered.** `bsdtar` (the Windows `tar.exe`) archived at **~220 KB/s** — hours for this
  tree. **7-Zip did it in ~3 min 52 s** (~12–24 MB/s, multi-threaded). Both are installed; use 7-Zip.

**Then the model.** Answering the owner's question — *"isn't Qwen2.5-7B too big for fast testing?"* —
**yes, on this laptop's CPU**, and the first fix was free. The container is given **8** CPUs but
llama.cpp defaulted `-t` to the **4 physical** cores, so half the machine sat idle. Measured with a
direct `/completion` call: ingest **13.2 tok/s**, generation **3.9 tok/s** at the default. Set
`-t 4 -tb 8` (more threads for the compute-bound prompt ingest, fewer for the memory-bound
generation) → ingest **19.3 tok/s (+46%)**, generation **4.6 tok/s**. Recorded as **L58**. The
remaining levers, in order: don't ship all 21 tool schemas when only testing the model; then a
smaller model (3B ≈2.3× faster). **GPU offload is not the fix** — the Quadro M2000M has 4 GiB, which
cannot hold the model *and* the 64K KV cache.

**One accuracy correction to an earlier claim.** The loopback port fix was *written* into the compose
but the running containers predated it: `docker ps` showed `0.0.0.0:8080`. Recreating the model
service applied it — it now reads `127.0.0.1:8080->8080/tcp`. **App and Hermes are still on `0.0.0.0`**
(they have not been recreated yet).

---

## 2026-10-04 — part 6 of 8 (newest first) — the trio runs; five defects fall out of it

**Sprint 0's stack is up.** `docker compose -f docker-compose.fullapp.yml up -d` brings up eight
services — platform app, `mcp`, `opencode`, `postgres`, `redis`, `meilisearch`, the local
`model` server and `hermes` — all healthy, on one file, parameterised only by `DEPLOY_ENV`.

**Then the proof, and the defects.** Bringing it up honestly turned out to be the whole exercise:
five separate faults sat between "the file parses" and "the agent can call a platform tool", and
each one *looked* like success from the outside. All five are now fixed and written up as **L52–L57**
in [`LESSONS.md`](LESSONS.md):

- **A default that was not a default.** `NODE_OPTIONS: ${NODE_OPTIONS:-…}` interpolated the *host's*
  Windows-only preload path into the app container, which crash-looped. The neighbouring `mcp`
  service survived only because it used a differently-named variable. Fixed by renaming to
  `APP_NODE_OPTIONS` — **never default a compose value from a variable the host may own** (L52).
- **A marker that lied.** The database had **zero users**, while `/tmp/init-marker/.seeded` told every
  later run "already seeded". `mercato init` had *printed* `❌ Initialization failed`, and the script
  wrote the marker anyway; because the compose command did not check the init step, the app then
  started and looked perfectly healthy (L53, L57). Tracked as **B-15**. *(Corrected 2026-10-04: this
  entry first said the CLI "still exited 0" — it did not, and that wrong cause aimed the fix at the
  wrong file. The real fault was in `init-or-migrate.sh`; see part 1 of 8.)*
- **A config file the program owns.** I hand-wrote Hermes' `config.yaml`; Hermes **overwrote it on
  startup**, so its log contained not one MCP line. Configure Hermes only through `hermes config
  set` / `hermes mcp add` (L54).
- **The wrong auth form.** Hermes stores `Authorization: Bearer …`; the platform's MCP accepts only
  `x-api-key: …` or `Authorization: ApiKey …` (`lib/auth.ts:157-192`). One header, and **arrow (1)
  connected: 21 platform tools discovered** (L55).
- **A capacity flag that was silently capped.** Hermes requires a **64K** context window; `-c 65536`
  *looked* like the fix, but llama.cpp logged `the slot context (65536) exceeds the training context
  of the model (32768) - capping` and served 32768. YaRN RoPE scaling is what actually admits 64K —
  confirmed from the server's own log, not from the flag (L56).

**Two design corrections, both mine.** Sprint 0 had been mounting the owner's **personal** Hermes
home (`~/.hermes` — 555 MB of state) into a disposable container, and Hermes warned that WAL-mode
SQLite on a Windows bind mount *can silently corrupt the database*. It now has its own named volume,
the fix Hermes' own message names, and **the owner's config was verified undamaged**. Separately,
`.env` was setting `MCP_SERVER_API_KEY`, which **does not set the MCP's key** — the `mcp` service
generates its own — and because `opencode` prefers the env var, that stale value was making opencode
authenticate with the wrong key. Removed.

**A finding worth acting on, not a defect.** CPU-only, this laptop ingests Hermes' prompt at ~13
tokens/s and that prompt is ~15,700 tokens, so one agent turn spends ~20 minutes just reading its
prompt. That is the honest cost of the 64K floor on a CPU 7B — the answer is GPU offload (the
machine has a Quadro M2000M) or a smaller tool surface.

---

## 2026-10-04 — part 7 of 8 (newest first) — a specification corrected

**The owner caught an inaccuracy.** Sprint 0's research table had recorded the laptop as
"RAM 31.9 GB, 8 cores". Both numbers were measured, but both are the operating system's
*derived* readings: 31.89 GB is the memory Windows can *use* once the integrated graphics
reserve their share, and "8" is the **thread** count, not the core count. The specification is
**32 GB RAM** (2 × 16 GB DDR4-2133) and **4 cores / 8 threads** (Intel i7-6820HQ), on a
**Dell Precision 7510** (hostname `BIXMASERVER`).

Corrected in `workspace/COOKBOOK.md` (Sprint 0, Step 1) and `library/development/README.md` —
which now carries the machine's measured specification for handover — and written up as **L50**
in `LESSONS.md`: *a true number attached to the wrong word is still a false claim.*

---

## 2026-10-04 — part 8 of 8 (newest first) — the analysis programme closes, and a development hub opens

**The 12-batch analysis programme finished.** Batches 0–12 mapped the vision (468 statements
across eight documents) against Hermes and the Starting Kit, and turned the result into a
development plan. The headline: **of 140 requirements, the platform covers 20, partly covers
50, misses 64, and conflicts with Hermes on 3; Hermes is the wrong place to look for 85 by
design.** The one-line answer: **the platform half is bought, the agent half is borrowed, and
the product half — the model spine and the data-level security — is neither, and must be
built.** The plan lives at
[`library/analysis/findings/12-development-plan.md`](library/analysis/findings/12-development-plan.md).

**Then the owner gave six instructions, and this is the day they were answered.** The point of
all six was the same: **stop letting things live in reports and in memory.** So:

**A development hub now exists — [`library/development/`](library/development/README.md).** Four documents, and
it is the place to start:

- **`BACKLOG.md`** — **the one roadmap.** It unifies the five remaining Starting-Kit items with
  the four product phases, and adds a **"do not lose this"** list for the remarks that used to
  live only in a report — the phase tests not yet written, the vocabulary register, the five
  missing resolver inputs. `workspace/PROGRESS.md` and `where_we_left.md` are now banners
  pointing here; both had already flagged themselves as broken or stale.
- **`ARCHITECTURE.md`** — how the Starting Kit, Hermes and the model server run together, and
  **the dockerisation decision**.
- **`README.md`** — the reading order, what to study first by role, and the handover sequence.
- **`QUESTIONS.md`** — a temporary file holding every open question for the owner. **It was
  answered the same day and deleted**, exactly as promised.

**All of it now lives in the library, not at the root.** The hub was first written at
`development/`, then moved to **`library/development/`** — the owner's rule is that generated
documentation belongs in the library, in the right shelf, beside `ai/` and `analysis/`.

**The owner answered the questions the same day, and every recommendation was adopted:** the
**object list** starts from the union of 37 and is pruned by the specification; **Hermes** is the
agent runtime and **OpenCode is removed**; the first model is a small instruct model; the laptop
budget is 16 GB; the **secrets** rule is confirmed (tenant secrets never enter a Hermes home);
**RLS** is confirmed as a derived backstop; and the **model default** is default-deny.

**The dockerisation decision, taken.** The owner asked me to decide when. **Answer: now — as
Sprint 0**, in parallel with the kernel specification. The reason it is cheap: the Starting Kit
**already ships a dockerised, `DEPLOY_ENV`-parameterised stack** (`docker-compose.fullapp.yml`)
that brings up the app, its MCP server and an agent runtime. So this is *finishing* something
that exists — adding Hermes and the model server, and proving the two arrows work. And
local-first plus cloud-ready comes free, because the same file already targets both.

**Two rules were promoted from the analysis programme into the cookbook:** rule zero-nine
(*measure from the artefact, not the description of it* — the extract beats the document, and
every number gets two routes) and rule zero-ten (*research, validate, write the steps, then
build* — the owner's instruction that no sprint starts without knowing what already exists).

**What is next.** Sprint 0 (the running trio) and the Business Model Kernel specification.

---

## 2026-08-13 — four governance screens, and one capability that did not exist

Item 21 asked for screens over the governance features that shipped with an API
and no page. Four are now built — delegations, denials, trust, projects — and
each one turned out to be a design decision rather than a rendering job.

**None of them has a create form, for four different reasons.** Delegations need
a person picker and a capability picker, and guessing at those is worse than
leaving the API as the path. Denials can already be lifted from the list, which
is the control that matters. Trust promotion is refused unless the *evidence*
passes, so a Promote button would spend its life returning 409 and teach people
the screen is broken rather than that the bar has not been met. Projects are
three separate acts -- create, add a member with an overlay, assign records --
with three different blast radii, and one form covering all three would have an
effect class that depends on its body. Each page says which of these applies to
it, so the absence reads as a decision instead of an omission.

**Every list keeps what ended.** Revoked delegations, lifted denials, closed
projects. The question these get asked is *"why could Sam not do that in
March"*, and a list of what is in force today cannot answer it.

**Projects had no capability at all.** Not a missing screen -- a missing
permission. `auth.projects.manage` is new, at E5 alongside delegation and
denial: a project grades the work inside it and can narrow what its members may
do there, so setting one up changes the rules for every record assigned to it.
Not delegable, because the power to define where the rules are looser is not
something to lend for a fortnight. Existing tenants need no ACL sync -- admin
already holds `auth.*`, and the wildcard covers it.

The counts on that page come from a new `ProjectService.summaries()` kept
deliberately apart from `contextFor()`. `contextFor` sits on the decision path
at two indexed reads; anything that counts rows must never become reachable
from the resolver.

**What is left of item 21 is record locks**, and it belongs on each record's own
screen rather than a list of its own -- per-entity work, the biggest of the
five.

Verified the way everything here now is: `yarn test` at 22/22 with `Cached: 0`,
`yarn typecheck --force` at 20/20 with `Cached: 0`. The forced typecheck is not
optional any more -- see L45.

---

## 2026-08-12 (late night) — looking at the rebrand, not just testing it

The owner asked me to rebuild and check the white-labelling in the browser. Every
routing claim held — `/` redirects to the login, `/start` and the autologin route
both 404, the backend and API docs render zero *mercato* mentions, and the terms
page carries no company name, no registration identifiers and contact on
`corprorate.com`.

**Three defects were only findable by looking**, and all three had passed a green
gate:

**The logo was cropped and squashed.** `AppShell` applied `rounded-full` — masking
a *circle* out of a mark that fills its canvas — and `object-fit: fill`, stretching
448×473 into a 40×40 box. Three call sites. What makes it worth recording is that
it was never a Companai problem: that treatment **crops and stretches any tenant's
uploaded logo**, which is two defects wearing the costume of a style.

**The `.ico` was dead weight** — I had copied it into `public/` and never
referenced it, because `layout.tsx` named only the SVG. Placing a file is not
wiring it up.

**The description still sold upstream's product** — a "modular ERP foundation".
The rename caught every occurrence of the *name* and none of the *positioning*,
which is the same blind spot as L41 in a milder form: a global replace sees
strings, not meaning.

**What I could not check, and said so:** the login page. I am signed in, and I do
not type passwords into forms, so I cannot reach it. Its source matches the
content-header pattern that renders correctly — verified by analogy, not by eye,
and recorded that way rather than rounded up.

**Gate: 22/22 tasks, 12,867 tests, exit 0.**

---

## 2026-08-12 (night) — Companai, and the rename that invented a company

**The product has a name and wears it.** 169 files: tab title, favicon, app
shell, API docs, content pages, CLI, four locales, and the `create-app` template
throughout so generated apps are not born branded. The owner's decision — keep
the internal `@open-mercato/*` names, rename everything a user can see — was
enforced by protecting the namespace *inside the rename script*, rather than
trusting myself to avoid it by hand.

**The legal pages were replaced, not renamed**, and the owner accepted the
reasoning after offering both options. 667 lines of another company's privacy
policy and terms — registered address, KRS, NIP, REGON, share capital, governing
law. Rebranding would have bound our users under a licence drafted for a Polish
company nobody here has read. The replacements are short, name **the operator**
as responsible rather than us, and say the activity record outlives a closed
account: the one clause this product cannot promise away, because that record is
what other people relied on.

**And then I did the exact thing I had just refused to do.** The blanket rename
turned that company into **"Companai sp. z o.o."** — a limited company that does
not exist — still carrying their real registration numbers, inside a GDPR consent
statement, in four locales. Materially worse than the original, which at least
named a company that is real and accountable.

I had protected the *identifier* namespace, which is the mechanical risk, and
missed the *semantic* one: **text that is about the old name looks identical to
text that merely uses it**. It also rewrote my own doc comments into asserting
the opposite of their point.

**What caught it was upstream's own test.** `consent-controller-locales.test.ts`
existed to guard their registration identifiers; inherited into a fork it had
been quietly asserting that we impersonate them, and when my rename broke it, it
became the alarm. Recorded as **L41**, with the grep list — legal forms,
registration ids, addresses, `consent`/`controller`/`terms` — and a rule I did
not have: **read an inherited test failure before updating it.** A guard from
upstream can be the thing that catches a fork misusing their identity.

**The demo surface is gone.** `/start` and its 44 keys per locale; the feedback
bubble and its public endpoint; the demo notice bar; and autologin — which signed
visitors in **from a password in an environment variable**. That one was unset
and inert, and removing it was still right: a platform whose purpose is knowing
who acted has no business logging somebody in without asking who they are.
`DEMO_MODE` survives only where it means something else entirely.

**Gate: 22/22 tasks, 12,867 tests, exit 0.** Lint: 0 errors.

---

## 2026-08-12 (late) — U14 closes, and the Starting Kit has no known functional gaps

**Neither obvious answer was true**, which is why this one was worth doing
carefully. Saving a draft and sending it are the same command with a flag, and
the two acts are `E1 reversible internal` and `E3 irreversible external`. A
static `capability:` had to pick one: under-classify and the irreversible
external act stays ungated; over-classify and the audit record asserts that
saving a draft was irreversible. **A record that says something false is worth
less than no record**, and that is the premise of the whole product, so
over-classifying was not the "safe" option it looked like.

So `capability` may now be a **function of the input**. One call site reads it,
a plain string behaves exactly as before, and the four messages commands classify
per call — only an explicit `isDraft: true` takes the lower one, because compose
itself defaults an absent flag to sending.

**38% → 54% of live commands gated**, and `messages.email` finally binds to a
real act. The 26 that remain are per-actor read state, planner, scheduler,
example, dictionaries and translations — **no irreversible external act among
them**, which was the thing worth chasing.

**Two decisions kept.** A classifier that throws yields `null` rather than
propagating: the gate only narrows, so losing it costs a restriction, while
letting the throw escape would fail a write because of the attribute whose entire
purpose is holding writes back. And the parameter is typed `never` — typing it
`TInput` made every handler in the platform stop compiling (L40), which the
workspace typecheck caught and the package build did not.

**Gate: 22/22 tasks, 12,914 tests, exit 0.** Lint: 0 errors.

**Phase 1 and Phase 2 are now complete except the Arabic review**, which is the
owner's and blocks nothing. There are no known functional gaps in the Starting
Kit. What remains is Phase 3 onward — the deferred screens, the ledger work, and
the pre-hosting items — plus the white-label batch, which now has a name to
rename to.

---

## 2026-08-12 (night) — the bubble had a back end

**The owner asked me to delete the "Feedback" bubble** that points at the
upstream supplier. Following it to its back end is what made the task worth
doing:

```ts
export const metadata = { POST: { requireAuth: false, … } }
const adminEmail = process.env.ADMIN_EMAIL || '<a personal vendor address>'
await sendEmail({ to: adminEmail, … })
```

**Unauthenticated, sends email, defaults to a named individual outside the
organisation.** Anyone able to reach the host could make it send mail, and
whatever a user typed went to a third party unless `ADMIN_EMAIL` was set.

Honest about the mitigations: the route rate-limits, and our own
`deployment.md` already lists `ADMIN_EMAIL`, so a deployment following our guide
would not have mailed the vendor. It is still a public email-sending endpoint
pointed outside the organisation, in a product whose premise is knowing where
things went.

**Removed rather than configured around** — widget, the demo notice bar beside it
(which linked to the supplier's GitHub), endpoint, email template, tests, and 28
orphaned translation keys across four locales. Mirrored into
`packages/create-app/template` in the same change, which mattered more than the
rule usually does: a template still scaffolding the widget would have put it back
into every app generated from it.

`DEMO_MODE` now gates nothing in the app layer. It survives where it means
something genuinely different — locking attachment partitions, a branch in tenant
setup — and those were left alone. **Deleting a flag is not the same as deleting
a feature**, and conflating them would have changed two behaviours nobody asked
about.

**U16, found in the same sweep and not fixed:** our public `/privacy` and
`/terms` pages tell readers to contact `info@openmercato.com`. That is a
different category from a logo — legal pages are the one place a reader is
entitled to assume the named party is who they are dealing with. It goes to the
**top** of the white-label list rather than into the general pile.

**Gate: 22/22 tasks, 12,907 tests, exit 0.** The drop from 12,910 is exactly the
deleted demo-feedback tests.

---

## 2026-08-12 (evening) — O1 fixed, and the platform gets a name

**The session was interrupted mid-flight.** Nothing was lost: both repos were
committed clean beforehand. The server had not died either — the task tracker
lost its handle, and the platform's own single-instance guard correctly refused
my duplicate start, naming the pid still serving. A small thing that worked
exactly as it should.

**O1 fixed the same day I made it.** The audit write moved out of the API route
into `DenialService`, so no caller can forget it, and the route stopped writing
its own — which would have filed every act twice.

Verified by planting a denial straight into the database, so the CLI lift was the
**only** path exercised: audit rows went 2 → 3, with `actor_user_id` null and
`context_json` carrying `{"origin": "server-console", "actorKind": "system"}`.

The decision inside it: a console act has no `sub`, and that is the fact worth
**recording** rather than a gap to paper over. R1's principal vocabulary already
had the word. Marking it a `system` actor with its origin is honest; leaving the
field empty would make it read like an anonymous human, which is worse than no
entry at all.

One imperfection left deliberately and written down: the shared helper stamps
`source: "crud-route"` on every direct write, so a console act carries that label
beside its accurate origin. Changing the helper's default would touch every
direct write in the platform, which is not a thing to do in passing.

**The product has a name: `Companai`.** With it came the Mac/Apple direction,
permission to vendor any genuinely unrestricted asset, and permission to delete
supplier-facing things outright — the feedback bubble named explicitly. All of it
is in `references/whitelabel.md` rather than only in memory.

I recorded a recommendation on the one open white-label question: **keep the
`@open-mercato/*` package names and rename everything a user can see.** The
internal names cost nothing while upstream is still fixing bugs we would
otherwise fix ourselves; the visible ones cost the entire first impression.

**Gate: 22/22 tasks, 12,910 tests, exit 0.** Lint: 0 errors.

---

## 2026-08-12 (evening) — the question was wrong, and what was under it was worse

**U13 verified fixed**: the authority graph now reads *Acme Corp → Approval
Branch* instead of two UUIDs.

**Item 6 asked me to check two capability descriptors. Both turned out fine**,
and the checking found something much larger. `messages.actions` **is** enforced
by a route — the roadmap's premise was wrong. `messages.manage` is not, and its
own note already says so honestly.

**U14.** The command gate is keyed by capability, and `interceptors.ts` states
plainly that a command declaring none is not gated — *"the gap is visible rather
than guessed at"*. The mechanism was documented. **Nobody had measured the gap.**
Counting live modules only: **21 of 56 commands, 38%.** Twenty of the thirty-five
misses were in `messages`.

Five had an unambiguous answer and now declare one, taking it to **46%**. What
remains is a design question rather than typing: `compose`/`reply`/`forward`
carry a message from draft to *sent*, and a static `capability:` must choose
between under-classifying an external send and over-classifying internal notes.
I recommend the higher classification — permitting is the direction this design
never takes — and noted that splitting the send into its own command is the
better fix. That is a product decision, so it is named rather than settled
quietly.

**Tracing it was worth doing.** The send is five hops from the gate — command →
event → subscriber → queue → worker → `sendEmail()` — which looked structural at
first. It is not: nothing downstream fires until the command commits, so holding
the command does prevent the send. A mapping gap, not an architectural one, and
the difference matters for how it gets fixed.

**O1 — and this one is mine.** Reading the audit log while the gate ran, I found
two `authority.denial` rows for two creations and **nothing for the two lifts**.
The API audits both; the CLI recovery path calls the service directly and writes
nothing. So the act that **removes** authority is recorded and the act that
**returns** it is not — in the feature I built this morning, on the path
documented for when somebody is locked out.

It happened because the audit write lives in the route rather than the service,
so every other caller inherits silence. Not fixed inline: it needs R1's `system`
principal applied to a console actor, and a check that the route does not then
write twice. Roadmap item 7.

**Rule zero-eight has now found three things in one afternoon** — U13, U14 and
O1 — none of which was on any list, all while a build or gate was running.

---

## 2026-08-12 (later still) — U12 answered, and rule zero-eight paid on its first outing

**U12 needed a decision, not just a migration**, which is why it was not folded
into the U4 fix. Both constraints are now partial unique indexes carrying
`where deleted_at is null`, so a deleted row stops reserving its value. The
entities drop `@Unique` — it cannot express a partial index — and the migration
becomes the source of truth, which is the arrangement
`users_tenant_email_hash_uniq` already uses here. Precedent, not invention.

Verified live: `XTS`, blocked since 2026-08-09, creates again, and a **live**
duplicate is still refused.

**The decision.** Making the index partial created a case that could not exist
before: undoing a delete after somebody reused the value. Restoring would give
two live rows sharing one value and there is no correct automatic winner —
renaming invents data, overwriting destroys it, and doing nothing silently claims
to have worked. So both delete commands check first and refuse with a **409**
naming the conflict, rather than letting the index raise a violation that
surfaces as a 500 and explains nothing.

**The generator caught a gap in my own work.** Running `db:generate` as a
schema-diff probe showed it wanted to create `authority_denials` — because I
hand-wrote that migration this morning and never updated the auth ORM snapshot.
Kept the snapshot updates, discarded the generated migrations, and both modules
now report *no changes*. Worth remembering: **a hand-written migration is only
half the change.**

**Rule zero-eight earned its place within an hour of being written.** While the
gate ran I opened the authority graph and found every row rendering as
`065bd751-… → cc563521-…` instead of *Acme Corp → Approval Branch*. **The one
screen that governs authority could not be operated** — nobody can tell which
link they are about to restrict.

Not a missing feature: the page already maps ids to names. The lookup asked for
`pageSize=200` where the API caps it at 100, so it returned **400** on every load
and every name fell back to a UUID. One line to fix, high severity, and on no
list. I would never have found it reading code.

It leaves two things behind, both recorded in `ux-findings.md`: the page
**degrades silently** when that lookup fails, which is precisely why it survived,
and three pages in parked modules make the same over-max request.

**Gate: 22/22 tasks, 12,904 tests, exit 0.** Lint: 0 errors.

---

## 2026-08-12 (later) — U4 was still broken, and reproducing it found another

**Phase 2 of the roadmap is verifying things nobody has checked.** U4 went first
because the route still derived its organization in the shape the original bug
had. It was not a stale record: `DELETE /api/currencies/currencies?id=…` returned
`400 expected string, received undefined` at `organizationId`, three days after
it was written down.

**The fix was to delete a requirement, not to add a fallback.** `organizationId`
was mandatory in `currencyDeleteSchema` and **nothing read it** — every use of
`parsed.organizationId` in the module is in a create path. The delete finds its
record through `buildCurrencyCommandWhere(ctx, …)` and enforces the boundary with
`ensureOrganizationScope` against the *loaded record*, both taking scope from
`ctx`, which a request body cannot forge. So the field gated nothing and rejected
the one actor who honestly has none. Adding a fallback would have been the U4
antipattern itself — deriving a value from an actor who has no scope.

That is worth stating as the other half of the family rule. The sweep asked
*where is the actor's organization wrongly stored?* This is *where is it wrongly
demanded?*

**Reproducing it turned up U12.** Creating a currency whose code had been deleted
fails with "already exists for this organization" — naming a row the user cannot
see. The application check correctly excludes soft-deleted rows;
`currencies_code_scope_unique` does not carry `where deleted_at is null`, so the
insert violates the constraint and the error is mapped back to a message about a
row that is not there. Deleting a currency makes its code permanently unusable.
`exchange_rates` has the same shape.

**Not fixed inline, and that was a judgement rather than a dodge.** It needs a
migration and an answer for what an undo-of-delete does when it collides with a
row created in the meantime. Bundling it into the U4 fix would have made both
harder to review and to revert. Recorded as U12 and placed at roadmap item 5,
immediately after this phase.

**The approvals queue, verified through the API rather than handed over.** I had
written that this item "needs the owner" because it is a screen I cannot see.
That was the wrong reason, and checking it changed the size of the ask. The real
limit is narrower: I do not type passwords into forms, so I cannot log a browser
in. Everything on the other side of that line I can do.

So I did: set enforcement to `enforce`, lowered the Approval Branch ceiling to
A2, and drove three acts through the API. The first was held with its reason
(*the edge caps authority at A2*) and the rename did not happen. The second I
approved, and the rename executed. The third I rejected, and it never did. One
act is parked in the queue for the owner, so their part is now three minutes of
looking and one click rather than twenty minutes of setup.

**A good incidental**: `Approval Branch`'s authority edge already existed,
annotated *"created automatically from the organization tree"* and timestamped
this morning. That is the U11 fix working on the live instance — and it is
precisely the step my own bad instructions once sent the owner hunting for.

**Gate after the U4 fix: 22/22 tasks, 12,898 tests, exit 0.**

**And then the owner logged my browser in, which changed the shape of the work.**
They asked whether it would help. It does, materially: within minutes I had
verified the thing I had just handed them, by looking at it and clicking it.
**Reject** produced *"Rejected. It will not run."*, the card left the queue and
the name did not change; **Approve and run** executed the rename. Item 3 closed
by me rather than by them.

The standing permission that came with it — click state-changing buttons on the
local instance, report afterwards — is recorded in memory along with the two
limits that do not move: I never type passwords into forms, and anything off this
machine still needs an explicit ask.

**The first thing it caught was not on any list.** A "Contact us" bubble in the
screenshot turned out to be `DEMO_MODE`, which defaults to **`true`**
(`parseBooleanWithDefault(process.env.DEMO_MODE, true)`), so anyone deploying
without setting it explicitly ships a feedback widget in their admin. Accurately:
it posts to a *local* endpoint so nothing leaves the instance, and
`deployment.md` already sets it false — minor. But a demo-only feature should
fail closed, and I would never have seen it by reading code. Roadmap item 8.

**Test state restored** afterwards: name, ceiling back to A5, enforcement back to
`shadow`.

**Two round-trips of the L38/L39 tax.** Both fixes needed
`build:packages --force`, `build:app --force`, and a server restart before
anything could be verified — about seven minutes each time. Worth the cost:
without it I would have been reading code and guessing.

---

## 2026-08-12 — one roadmap, and the last of G1

**The owner stopped me on process, and was right.** *"You already had a plan, then
you had 5 waves, and now this."* Three overlapping views of the same work is not a
plan — it is three plans, which is none, and it means tasks get picked off
whichever list happens to be open. `PROGRESS.md` is now the roadmap and nothing
else: 23 items, ordered, from here to the finish line, each tagged with whether it
needs the owner, is blocked on something that does not exist yet, or was deferred
deliberately. The 1,400 lines of closures and findings moved to
`references/completed-work.md`, where the reasoning stays findable without
competing with the plan. Rule zero-three now says this outright.

**The gate ran green in full for the first time since the U11 fix**: 22/22 tasks,
12,851 tests, 6m09s, zero cached. The arithmetic is worth recording — 12,845
before plus the 6 new authority-edge tests is exactly 12,851, so the new guards
demonstrably ran rather than being silently skipped, which is the failure L38 was
written about.

**Then explicit deny, which closes G1.** Permissions arrive through roles, so
stopping one person doing one thing meant removing their whole role — and with it
nine things they still needed — or inventing a bespoke role, which is how an
organisation ends up with forty roles nobody can describe.

Three decisions in it are worth keeping:

**It can only ever subtract, and the ordering is what guarantees that.** Denials
are consulted after the grant check has already returned true, so no arrangement
of denial rows can permit an act the ACL refused. A test asserts the denial
service is not even *called* when the ACL said no — if somebody moves that call
earlier, the test fails rather than the property quietly disappearing.

**It applies to superadmins, and that has a price I paid rather than dodged.** A
control the most powerful account ignores is a suggestion. But it means somebody
can withhold `auth.*` from the only account that could give it back, so the
recovery path is a CLI command, out of band by design: recovering from a lockout
should require reaching the server, not persistence in a browser. The alternative
— exempting the deny-management capability from denial — would have been a
special case, which is the bandage rule zero-one forbids.

**Permanent is allowed here and forbidden for delegations**, and the asymmetry is
the philosophy in miniature. A grant with no end is a role grant wearing a
costume. A subtraction with no end is a standing decision, and forcing it to lapse
would hand a permission back to somebody nobody re-authorised.

**Verified on the running instance, not merely built.** I had left the migration
unapplied and called it the owner's decision. Corrected: checkpoint taken,
migration applied, and then the whole loop run against the live API rather than
handed over as steps. Withholding `currencies.*` from the **superadmin** turned a
`200` into a `403`; lifting it from the terminal with nobody logged in turned it
back into a `200`. That single sequence proves the three claims that mattered —
denials bind, they bind superadmins, and the out-of-band recovery path works.
Blank reasons and mid-pattern wildcards were both refused. All test data lifted
afterwards; the lifted rows remain, which is the design.

**The 404 that was not a bug.** The new route returned `404` while its sibling
returned `401`. Nothing was wrong with it: the server runs `next start`, which
serves a frozen build. Recorded as L39, with the sibling-route diagnostic that
settles it in one command.

**One documentation bug fixed in passing**: I had written `mercato auth
denials:lift` into two doc comments before building the command, and the command
I actually built is `auth denials --lift`. A doc that names a command which does
not exist is worse than no doc, because somebody trusts it during an outage.

---

## 2026-08-11 — G4: work gets its own scope, and the grade finally has a source

Scoping stopped at the department. A legal case pulls people from several
departments and needs its own rules inside it, and the platform had no way to say
so.

**The design question was the same shape as G5's, and answering it first paid off
again.** An overlay only means something if the resolver can tell that this act is
inside that project — and nothing said so. A project holds records; an act names a
record through `payload.id`, which the gate already reads for record locks. So a
record-to-project table gives the resolver the matter for free, and no command had
to declare anything.

**Terminal deny turned out to need no code at all.** Platform 1 implements it by
ending evaluation early. Here a deny is `A0`, and because every rule takes a
minimum and nothing anywhere raises a ceiling, `A0` already cannot be lifted by
anything later. The property falls out of the invariant — which is a better place
for it than an evaluation-order rule somebody has to remember, and the tests
assert it holds whichever order the rules are written in.

**And this closed the task-grade item.** A grade describes the work rather than
the act, and I reclassified it days ago as blocked on G4 precisely because there
was no matter to read one from. There is now, so it binds: an act on a project's
record resolves at that project's grade.

The care that item needed carried over intact. An ungraded project says **nothing**
rather than `G0`, and an unreadable grade parses to `null` rather than `G0` —
because a *lower* grade buys **more** autonomy, which was the defect I fixed in the
resolver earlier the same day. It would have been easy to reintroduce it one layer
up, in a service that had every reason to default a missing value.

**One habit fixed after it cost me.** I ran this gate capturing full output, after
the previous batch where `tail -4` destroyed a failure I still cannot explain.
22/22 and 12,845 tests, with the log intact this time.

Server booted before calling it done, per [[L37]].

---

## 2026-08-11 — Tenant policy, and three things found on the way

Every other input the resolver reads is a property of the platform. This one is a
company's decision — four-eyes on payments, no unattended external email — which
is exactly rule zero-seven's "organisations legitimately differ" row, and the
first time in this sprint that a setting has clearly earned its place.

Declarative rules, because planning §10 defers a policy engine by name. A rule is
a match and a ceiling: no conditions, no expressions, no evaluation order to
reason about. Stored beside the enforcement mode in the same per-tenant config,
because a policy is a handful of rules rather than a growing table and the person
who sets one sets the other.

**An unreadable policy applies nothing.** That loosens, which is the uncomfortable
direction — but inventing a restriction the tenant never wrote would refuse real
work because of a typo, and a configuration failure is not a permission answer.

**Three things turned up that were not this task**, and all three are fixed here
rather than noted for later.

The first is a repeat of a bug I fixed three batches ago. `policyCeilingDetail`
did not exist on the resolver's context, so the tenant's own wording was computed
and silently dropped — precisely what `resourceCeilingDetail` had done for record
locks. Two occurrences make it a pattern worth stating: **when a ceiling carries a
reason, check the context type has somewhere to put it.** A refusal now quotes the
tenant back instead of reciting a gate.

The second is my own habit. A gate run failed in core, and I could not say why,
because I had piped `yarn test` through `tail -4` and thrown the failure away
before reading it. Core alone then passed 5,054 tests and a second full run passed
12,826. **The cause is unknown and is recorded as unknown** — three flake causes
have been found and fixed, and this may be a fourth or one of those recurring
somewhere unswept. The habit is fixed; the run is gone.

The third was cheap: charter and budget were both investigated before being
assumed buildable, and both turned out blocked on subsystems that do not exist —
`ai_worker` is a type with no producer, and nothing meters spend. Recorded with
preconditions rather than half-built.

**The resolver is now complete for everything that can be supplied.** The audit
five days ago found six of ten inputs unsupplied. All six that could be supplied
from what exists now are, and the two that remain are blocked on Phase K work in a
direction that is safe.

Gate: 22/22, **12,826 tests**, and the server boots.

---

## 2026-08-11 — The trust model, and the gaps it refuses to hide

This is the only input to the resolver that **widens**. Every other ceiling can
only take autonomy away, which makes them safe whatever they contain. Trust lifts
the cap that otherwise holds every machine at approve-first, so it is safe for a
different reason entirely: promotion is hard, demotion is easy.

**The specification's first line is the whole constraint** — *"trust is computed
evidence, not a setting someone types"* — and auditing it against this platform
found only **two of the five** promotion criteria computable. There is no incident
model, no evaluation suites, no charters.

That made the scope a genuine product decision rather than a sequencing one, so I
asked rather than assumed: shipping a partial control here does not point in the
safe direction, which is the opposite of every other gap in this sprint. The
answer was **gated promotion** — refuse on what can be checked, and carry what
cannot.

**So a promotion records its own gaps.** Three "not verified" notes go onto the
grant *and* into the audit trail. A gap in a design document is one nobody reads
again; a gap on the record is one whoever reads it later has to weigh. And it is
why a human approval is still required: the evidence gates the decision, it does
not make it.

**Three places where the failure direction was the whole design.** A missing row
means `T0`. An unreadable tier parses to `T0` — this is the one field in the
system where a parsing failure could *grant* something, so it fails to the bottom
of the scale rather than to a middling default. And `T0` supplies no ceiling at
all, because it says exactly what the untrusted-machine rule already says, and
replacing an explanation with a code that means the same thing is a loss.

**Demotion runs on reversal, not on a schedule.** A sweep would leave a worker at
its old tier for however long the interval is, and that window is precisely what
the specification is trying to close.

**One mistake worth recording.** I wired the trust reader into the DI registration
in the wrong position — the constructor takes six positional readers, and I put
trust where delegations belongs. It type-checked perfectly, because both are
objects with one async method. Caught by reading the argument list against the
constructor rather than by any tool, and the call site now carries a comment
naming the order. Positional readers that all look alike are a trap the compiler
cannot see.

**And I booted the server before calling it done**, which [[L37]] exists to
enforce. All three authority APIs resolve and are guarded, against a 404 control
that makes those 401s mean something.

Gate: 22/22, **12,802 tests**.

---

## 2026-08-11 — G3: authority you can lend, and take back

The platform had only permanent grants. Covering somebody's approvals for a
fortnight meant granting a role and remembering to remove it — and the grant
nobody removes is how permissions accumulate until nobody can say why anyone has
what they have. A delegation is that same grant with an end date and a reason
attached.

**All three findings I recorded before starting held up**, which is the strongest
argument yet for answering the design questions first. Each one changed the build:

A delegation had to **grant**, not only cap. The obvious reading — fill in
`delegationCeiling` and stop — fails because the route guard refuses on RBAC
before the resolver ever runs. A cap-only delegation could reduce authority
somebody already had and never lend any.

Which meant touching the grant path, the one layer built so nothing turns a
`false` into a `true`. That guarantee turns out to be about the **resolver**, not
about RBAC: RBAC has always had two grant sources, so a third that expires is
consistent with its design. The rule that had to survive — *the authority resolver
never widens* — does. The resolver still runs afterwards and still refuses; a
delegation gets somebody past the grant, not past everything.

And the caching problem was real. `loadAcl` caches for five minutes, and a revoke
that takes effect "within five minutes" is not a revoke. So delegations are a live
query — but only after the ordinary ACL has already said no, which is the request
that was about to return 403 anyway. The hot path never pays.

**The negative tests are the ones that matter here.** Every required capability
needs its own delegation, because returning true when one of three matched would
be the widest bug available in this codebase. A delegation does not rescue an act
the resolver refuses. It is not consulted when the actor already holds the
capability. And it is looked up by *principal id*, not by the subject string —
`api_key:abc` would never match a row written against `abc`, and the delegation
would silently do nothing.

**Two rules are judgements rather than mechanics**, so they are written down where
the work is. The **latest expiry wins** when several apply, because
newest-created would let a hasty short delegation silently shorten an agreed long
one. And **ninety days is the maximum**, because a delegation with no practical
end is a role grant wearing a costume — it can be re-granted, and that is the
point: re-granting is a decision somebody makes; letting one run for a year is a
decision nobody makes.

**Checkpointed before touching the grant path**, and verified the dump was
readable before starting rather than trusting that it existed. Verified afterwards
against real Postgres too: the check constraint rejects a backwards window, and
`api_key:abc-123` stores as a grantee — which is exactly why those columns are
`text` and not `uuid`.

No page. That is now item 16 alongside G5's, rather than a sentence in a commit
message.

**And then it did not boot.** The gate was green — typecheck, lint, 12,768 tests,
both builds — and `yarn start` died with `Could not resolve 'delegations'`.

The container runs in Awilix CLASSIC mode, and the default registration is
`asClass(RbacService)`. CLASSIC reads constructor parameter *names* and resolves
each by name. I called the parameter `delegations`; the registration is
`delegationService`. **In CLASSIC mode a parameter name is a dependency name**, so
I had renamed a dependency without meaning to.

This is the second time this trap has bitten, and the first time produced a guard
— `di-classic-proxy.test.ts` — which guards the *destructuring factory* half. This
was the `asClass` half, and it went straight through.

**Writing the new guard took three attempts, and the failures are the lesson.** I
wrote it, ran it, and it passed — with the bug still in the tree. Fixed a bracket
matcher, ran it, passed again. It took instrumenting the thing by hand to find
that a doc comment inside the parameter list contained brackets, which closed the
parameter list early and silently dropped every parameter after the third. Only
then did it fail, and name the offender exactly.

A guard nobody has watched fail is not a guard. It is a decoration that makes
people confident — the same shape as [[L34]], where a mock made six tests assert
nothing about the SQL they were supposedly covering.

**The wider finding is [[L37]]: the gate does not boot the application.** Type
checking, linting and unit tests all operate on code in isolation. Dependency
injection, migrations against a real schema and route registration happen only at
startup. A green gate is evidence about the code, not about the system — and after
any change to DI, a service constructor or module registration, the only thing
that tests the wiring is starting the server.

Gate: 22/22, **12,770 tests**, and the server boots.

---

## 2026-08-11 — G5: the first ceiling that is not about the actor

Every other input to the resolver asks *who is acting*. This one asks what is
being acted on. A contract under dispute, a payroll run that has closed, a case
file somebody froze pending review — none of those are properties of an actor, and
no trust level or delegation should reach past them.

`locked` refuses every write; `restricted` makes writes need approval. Neither can
be lifted by anything about the actor, and that holds structurally rather than by
a check: it arrives as a ceiling into a resolver that takes a minimum.

It also restores something we removed. Excluding `packages/enterprise` in S2 took
record locking out of the platform entirely, so this is not an enhancement.

**Reads are exempt, deliberately.** A record nobody may read is one nobody can
review before deciding whether to unlock it, and freezing a contract should not
hide it from the people arguing about it. Who may read is already RBAC's question
and the data classification's.

**The design question was answered before the batch started**, and that turned out
to be the right order: the bus carries a capability and no entity type, so keying
a lock on both would have needed a per-command declaration across every command —
the R4b exercise again. Keyed on the record id alone instead, with the gate
requiring a well-formed UUID before it looks anything up, because a slug or a
numeric id from some other payload could collide with a real lock and constrain
the wrong record.

**Two things the batch caught in itself, and both were mine.**

The refusal read *"the record's state permits at most A0"* — which tells the
person who hit it nothing they can act on. The reason somebody typed when locking
the record was being computed and then dropped, because the resolver's context
took a gate and no detail. Now it carries one, and a refusal reads *"locked
pending the Q3 audit"*. I only noticed because a test asserted the reason appeared,
which it would not have done if I had tested only the gate.

And `db:generate` found an index declared on the entity that my migration never
created. The unique constraint on `(tenant_id, record_id)` already provides
exactly that index, so the honest fix was to delete both the decorator and the
partial index I had written rather than add a second index costing a write on
every lock change to answer nothing new.

**What I did not build is a page.** Locking is an API guarded by a new
`auth.records.lock` capability — enough that a lock can be applied and therefore
means something, which is the line this sprint keeps drawing. A control belongs on
each record's own screen, and that is per-entity work rather than one screen. It
is item 17 rather than a sentence in a commit message.

Gate: 22/22, **12,742 tests**.

---

## 2026-08-11 — The task-grade item could not be done, and was worth doing anyway

The audit said the resolver never receives a task grade: `decideFor` passes
`context: {}`, so every act resolves at the `G1` default and only the data-class
floor can raise it. All true.

**What I found is that there is nothing to pass.** A grade describes *the work*,
not the act — `G4` is "legal proceedings, board/M&A, security incidents", which is
a property of the matter somebody is working on. This platform has no matter.
Project, case and engagement context arrives with **G4**, and until it does the
only honest source of a grade is the data classification, which already applies.

So I did not wire it. Building the seam — a symbol on the command context, say —
and calling the item closed would have produced exactly the thing this sprint
exists to remove: a control named in a table with nothing behind it. The item is
reclassified with its precondition instead.

**And the investigation paid for itself.** `resolveDecision` took the maximum of
the requested grade and the data floor, and *not* of the `G1` baseline. A caller
passing `G0` therefore landed below the default — which buys more autonomy, not
less. `E4` permits `A3` at `G0` against `A2` at `G1`; `E6` permits `A2` against
`A1`. The one input a caller controls could widen the answer, in a resolver whose
whole premise is that nothing widens. The doc comment two lines above even said
*"a caller cannot talk the resolver down"*, which was true of the data floor and
false of the baseline.

**Two corrections to my own first reading**, both from the code rather than from
me. I wrote the tests with a `human` actor and every gate came back `A5` — because
the effect-class matrix bounds **machines and delegated authority only**; people
are bounded by the graph, the record and policy instead. That narrowed the bug
honestly: exploitable by an AI worker or a delegated actor, not by an ordinary
user. And my first test file used the ACL declaration shape rather than the
flattened descriptor the resolver actually takes, which failed loudly rather than
passing vacuously.

**The fix was verified by reverting it.** Two of the six tests fail without it.
A guard nobody has watched fail is a guard nobody should trust — the same
discipline as the recurrence guard last week.

Gate: 22/22, **12,722 tests**.

---

## 2026-08-11 — I4 stops being a claim

*Authority is carried, never amplified.* The platform has said that since the
resolver landed. The rule was implemented, tested, and listed in a table of
resolver rules — and nothing supplied its input outside a CLI what-if flag. It was
the one finding from yesterday's audit that was not merely incomplete but
**wrong**: a control named in documentation and absent from the request path.

The concrete hole: an API key passes its own RBAC check, the resolver sees a
`service` principal with no invoker, and the person who owns the key is never
consulted. So a key could do what its owner could not.

R1 had already built the piece that was missing — `onBehalfOfUserId` on the
principal. The wiring resolves that person **as themselves**: their own grant,
their own position in the organization graph, the same capability. Whatever gate
that produces becomes a ceiling. If they may not perform the act, the answer is
`A0` and it is refused.

**The dependency had to go in backwards**, which was the only real design problem.
`rbacService` is constructed *with* `authorityEnforcement`, so injecting RBAC into
the enforcement service closes a cycle. It takes a reader instead — the same shape
as the graph and module-config readers already there — and DI resolves
`rbacService` from the cradle *inside the call*, which is late enough to break it.

**Absence is still not a refusal.** With no reader registered, the check is
skipped with a warning rather than answering `A0`. That is the position this
service already takes when the graph cannot be read, and the alternative invents a
denial nobody decided.

**And a stale comment went with it.** The class doc claimed *"Only `A0` is
enforced — `A1` to `A4` attach obligations and there is no machinery yet"*. True
when written, false since the command gate landed on 2026-08-10. A stale comment
about a control is worse than none: it reads as a limitation and gets designed
around.

The two tests I would most easily have skipped are the ones worth having — that
this never *raises* a gate, and that a person acting as themselves is not capped
by their own decision (which would apply every rule twice and put a confusing
second reason in every explanation).

Five of the resolver's ten inputs are still unsupplied, and every one of them can
only make an answer more permissive than the design intends — never more permissive
than the RBAC check that already said yes. They are backlog items 1–10. This one
was different because it was claimed.

Gate: 22/22, **12,716 tests**.

---

## 2026-08-11 — A deployment guide, and what it is honest about

The owner asked for handover documentation good enough that somebody who has
never seen this system can put it on a VPS subdomain behind Plesk.
`references/deployment.md` is that: what you are actually deploying (four things,
and only the first is obvious), the server prerequisites, Postgres including the
two extensions people forget, the environment, the build order, migrations, the
first tenant, workers, the nginx block, and a verification checklist.

**Every command in it was checked against the repository**, and two were wrong
when I first wrote them. `mercato auth setup` needs `--orgName` and `--password`,
which I had left out — the usage string in `auth/cli.ts` said so. A guide that
almost works is worse than no guide, because the reader assumes they broke it.

**The important line is at the top, and it is a limitation.** None of the
Plesk-specific steps have been run on a Plesk server. The build, migrate and start
sequence is the one used daily and is safe to trust; the systemd unit and the
nginx directives are the standard way to run a long-lived Node service behind
Plesk, written by somebody who knows the shape of the problem. That is a
well-informed first run, not a transcript, and saying so is the difference between
documentation and a claim.

**One judgement call worth flagging:** do not use Plesk's Node.js extension for
this. It runs Passenger, which wants to own the process, and this app is started
by its own CLI that supervises Next plus worker processes. Systemd plus an nginx
proxy lets Plesk do what it is good at — TLS — and keeps the supervisor intact.

**Three things the guide surfaces that were nowhere on the backlog**, now items
21 and 22: nobody has verified the Plesk path; there is no zero-downtime deploy,
backup schedule, monitoring or secret rotation; and the `CUSTOM_DOMAIN_*` and
`ACME_EMAIL` variables exist in `.env.example` while the `domain_mappings` work
that would honour them is deferred — so a reader would otherwise have set them and
waited for something that is not there.

The guide also carries the `Upgrade`/`Connection` proxy headers, which are not
optional: the platform pushes live updates over SSE, and without them
notifications and progress bars silently never arrive. That is exactly the class
of thing a first deployment loses an afternoon to.

---

## 2026-08-11 — G7: the interface can now run right-to-left

The platform could always do this and had never decided to. Radix takes `dir`,
the CSS logical properties follow it, and `<html>` shipped with a `lang` and
nothing else — which is fine while every locale runs left-to-right, and silently
wrong the moment one does not. A browser handed `lang="ar"` and no `dir` renders
Arabic left-to-right: letters right, layout inside out, nothing to notice.

Direction is decided on the **language subtag**, never the whole tag, because it
is a property of the script: `ar`, `ar-EG` and `ar-Arab-EG` all run the same way,
and a list of full tags would be endless and still incomplete. Anything
unrecognised falls back to `ltr` — the safe direction rather than the neutral one,
since a `rtl` default would mirror the interface for every locale we failed to
parse.

**Arabic ships**, because that is the difference between a policy and a claim.
Proven over HTTP against the built app: `Accept-Language: en` returns
`dir="ltr"`, `ar` returns `<html lang="ar" dir="rtl">`, with Arabic actually
rendering. Its dictionaries are partial on purpose — a module without `ar.json`
falls back to inline English, so untranslated surfaces degrade to readable rather
than blank. The Arabic I wrote is unreviewed by a native speaker, which is on the
backlog rather than glossed over.

**I did not build the setting the graft asked for.** `graft-batches.md` wants
`text_direction_policy` in tenant configuration. Rule zero-seven's own table says
otherwise: *there is a right answer → default, no setting.* Direction follows
language essentially universally. The resolver still accepts a policy and is
tested for it, so the seam is there when something genuinely has one — but adding
a configuration key nothing reads would have been precisely the "claimed and
absent" control I spent yesterday's audit cataloguing.

**And the compiler did the interesting work.** Adding `ar` to the `Locale` union
failed the build in two places that enumerate locales by hand, which is the type
system enforcing completeness rather than a chore. A test then failed for the
right reason too: `TranslationManager.primitives` asserted the tabs were exactly
`['EN','PL','ES','DE']`, so a locale addition broke an assertion about *markup*.
It now derives from the configured locales, which is what it always meant.

Wave 1 done — G8, G6, G7. Gate: 22/22, **12,708 tests**.

---

## 2026-08-11 — G6: an act now records who it was written for

Audit rows had a tenant and an organization and no notion of audience, so anyone
holding `audit_logs.view_tenant` read everything. `visibility_scope` fixes the
tense: the code performing an act decides who it was for, at the moment it is
recorded, instead of a report inferring sensitivity from a payload afterwards.

Backfilled to `tenant`, which is precisely what every existing row already had.
This is a vocabulary, not a restriction — defaulting to `private` would have
emptied every audit view on the day it shipped.

**Writing it turned up two things I had not thought through.**

The first was a leak I put in myself. I wrote `case 'tenant': return true` —
obviously right, since a tenant reader may read tenant records. Then I got to
`portal` and found I had written an expression that evaluated to `true` either
way, which is the kind of nonsense that only shows up when you try to explain it.
Working out what `portal` should mean exposed the real problem: a portal reader is
a *customer*, and `tenant` returning `true` unconditionally would hand them the
tenant's internal activity. The line belongs on `tenant`, not on `portal` — which
genuinely does have two audiences, because hiding portal activity from staff would
leave their own trail incomplete.

The second was that `private` cannot be a scope list at all. Whether a private row
is readable depends on **who performed it**, and that is per-row. So the filter is
`scope in (...) OR (scope = 'private' AND actor_user_id = me)`, and the nesting
matters: ANDing the actor across the whole predicate instead would silently narrow
every reader's timeline to their own acts.

**And the verification was wrong before the code was.** Executed against real
Postgres, the owner of a planted private act appeared *not* to see it. That looks
exactly like a bug in the predicate. It was my probe: it grabbed an arbitrary row
whose `actor_user_id` was null, so `actor_user_id = null` matched nothing. Re-run
against a row that had an actor — 56 of 56 for the owner, 55 for a stranger.

Worth writing down because the instinct at that moment is to go and change the
code. [[L30]] again, from the other end: a reproduction you built yourself is a
hypothesis, and that includes the one that appears to confirm a failure.

`project` fails closed until G4 gives it membership to check. Nothing writes it,
so it is inert — but a scope that returns `true` because we cannot decide it yet
would be a label pretending to be a control.

Gate: 22/22, **12,699 tests**.

---

## 2026-08-11 — G8: one migration run at a time

Two containers booting from one image against one database is the ordinary way to
deploy, and nothing stopped both of them migrating. Both read the same empty
`mikro_orm_migrations_<module>` table, both decide the same file is pending, both
run it. `create table` fails on the loser and the boot dies — or a data migration
that is not idempotent runs twice and nobody notices, which is the worse one.

`yarn db:migrate` now holds a Postgres session-level advisory lock for the whole
run. Session-level because the lock has to outlive every per-module ORM the run
opens and closes, on its own short-lived connection for the same reason. It
**waits** rather than failing: a second container should apply nothing and carry
on, and by the time it holds the lock the first run has finished and its pending
list is empty. And it says so on the way in, because a migration blocking in
silence is indistinguishable from one that has hung, and an operator watching a
stalled deploy will kill it.

**The verification is the interesting part**, because the failure needs two
processes and a race and cannot be reproduced in a unit test. Eleven unit tests
pin the decisions around the lock. The SQL then ran against real Postgres — A
acquires, B is refused while A holds, B acquires once A frees, zero locks left
([[L34]]). Then the whole command, against a lock held from another connection.

**And that last step caught what the first two could not.** The first contended
run finished in seven seconds with no waiting message. The unit tests were green;
the SQL was proven; the lock was genuinely held by the other connection. The CLI
runs from `packages/cli/dist`, and I had never built it. Rebuild, retest, and the
message appeared — 22 seconds of waiting against 6 uncontended. The standing trap
in this repository is usually stated about the app; it is not only about the app.

**Two things I had said were wrong, and the tests said so.** I checked
`dbGreenfield` for migration calls, read the first half of the function, saw it
deleting migration files and concluded it does not migrate. It does — the call is
at the end. A test failed with `client.connect is not a function` and pointed
straight at it. That is a better outcome than my claim: greenfield rebuilding a
database while a deploy migrates it is exactly the collision the lock is for.

**Then a third gate flake, unrelated to any of this.** `OrganizationBrandingPage`
failed in the gate and passed three-for-three alone. The page seeds `logoUrl` into
local state from fetched data through an effect, so there is a render commit
between the organization name appearing and the input filling; the test awaited
the name and asserted the input synchronously. Load widens the window. `waitFor`
closes it, and it is now **trap 3** in `knowledge/test-gate.md` — the nastiest of
the three, because the failing line is right there, the lines above it pass, and
the product is correct.

A sweep confirmed it was the only instance: seven files use `toHaveValue`, three
never wait, and all three render synchronously from props inside `await act`.

Gate: 22/22, **12,677 tests**.

---

## 2026-08-10 — The gate stops depending on how busy the laptop is

Two causes, both fixed, and the interesting part is that **the diagnosis I had
written down was wrong.**

`PROGRESS` said: two guards hardened, *eleven more walk-and-read unguarded*. That
framed the work as hardening eleven readers. So I planted a fixture-shaped
directory inside `packages/shared` and ran core, ui and cli against it — **6,905
tests, all green.** Nothing breaks while the directory exists. The failure only
happens when it is *deleted* out from under a walker.

Which inverts the fix. Thirteen readers were never the problem; two writers were.
`dynamicLoader.tsconfig.test.ts` was creating scratch app roots inside
`packages/shared`, and `cache/service.test.ts` inside `packages/cache`. Both now
write outside any source tree — the loader fixture to `node_modules/.cache`,
because it needs repo-relative resolution for its `@mikro-orm` import, and the
cache fixture to `os.tmpdir()`, because it needs nothing.

**A backlog note is a hypothesis with a date on it.** Mine was written while
chasing something else, was plausible, and would have sent me to harden eleven
files that did not need it. Ten minutes of planting a directory settled it
([[L36]]).

**The second cause I nearly guessed at too.** Five tests in the CLI integration
file were slow, and my first theory was the source fingerprint. Then I measured
it: 8,715 files, 262ms to walk, 777ms to stat, on an idle machine. About a second
— nowhere near a 60-second budget. The theory was too small to explain the
symptom, and if I had "fixed" it I would have declared victory over nothing.

So I built the load instead: four heavy test packages running concurrently, then
timed the file against them.

| | Before | After |
|---|---|---|
| Worst single test | 13,023 ms | **2,467 ms** |
| Whole file | 37.0 s | **9.8 s** |

Eight-fold degradation under only four of the gate's twenty-two packages — which
is what makes 60s reachable, and it is a *measurement* rather than the arithmetic
I would otherwise have offered.

The fix threads overrides that already existed one level down
(`hasBuildInputChangesSince` has always taken `BuildCacheOptions`;
`tryReuseExistingEnvironment` just never passed any) so those tests point the walk
at a two-file fixture. They assert reuse decisions, not that the repository
contains 8,700 files.

**And coverage went up.** Fixturing all five would have left the real default
paths untested — they could point at nothing and every test would still pass. So
one new test keeps them, cheaply: backdate `startedAt` to 2020 and the staleness
check returns on the *first* file it stats instead of the 8,700th. Same code path,
one three-thousandth of the I/O.

The recurrence guard was verified the only way a guard can be — by putting the bug
back and watching it go red and name the file.

**What I did not fix, said plainly.** The walking guards are still unguarded.
Nothing writes into `packages/` during a gate run now, so nothing races; if some
future build step does, the class returns. Measured, not eliminated.

Gate: 22/22 tasks, **12,666 tests**, 5m57s idle.

---

## 2026-08-10 — The approvals queue becomes a screen

Enforcement has held acts since it landed. Answering them meant calling an API,
which means a terminal, which means nobody. `/backend/authority/approvals` is
where a person now works through the tray.

**Two lists, and they never borrow each other's verbs.** *Waiting* holds acts
that have **not** happened — approving runs one, rejecting means it never runs.
*To review* holds acts that **already did** — nothing on that half changes what
happened; the only open question is whether anybody looked. Offering "Approve" on
something that already ran, or "I have looked at this" on something still waiting,
would make every row ambiguous, and a reader who cannot tell the halves apart
clicks through both. Three of the eight new tests exist only to hold that line.

**A3 gets a veto and no approval button.** *Hold and commit unless vetoed* runs
on its own when the window passes, so "Approve and run" would be a button that
changes nothing but the timing. The only act with an effect is stopping it, so
that is the only button.

**The gate identifier never appears alone.** "A2" is precise and empty. Each row
carries the plain sentence — *needs your approval before it runs* — beside the
tag, and the resolver's own reason underneath it. The queue that shows only codes
is the queue that gets clicked through.

**Ordering is a taste, so it is stored per person.** Riskiest first by default,
oldest first on request, kept in that browser and nowhere else. Storing it
server-side would quietly make one person's preference everybody's — the reading
of the owner's *"a setting where organisations genuinely differ"* that keeps the
setting count honest.

**Pulled forward, and the reason is that its premise expired.** `PROGRESS` had
scheduled this after the gate-stability work, arguing that a screen designed
against a nearly-empty tray is designed against a guess. That was true when three
commands were gated. The capability mapping has since gated 117, and A3 and A4
both bind — the tray now fills from ordinary use, so the argument for waiting no
longer holds.

**What is deliberately absent**, each with a backlog entry rather than a
half-built control: bulk approval with a diff, routing to a deputy, standing
approvals. A first version without them is usable. One shipping a blind "approve
all" would be worse than no page.

**One wrong turn worth recording.** I put the new strings in the *app's* locale
files. The auth module owns its own `i18n/` — four fully translated files, no
English placeholders — and app-level files are the app's. Reverted, and the
strings landed with real German, Spanish and Polish rather than English standing
in for them ([[L35]]).

Gate green end to end: 22/22 tasks, 12,664 tests, no flakes this run.

---

## 2026-08-10 — A3 binds, and every gate now does

*Hold and commit unless vetoed* is the gate that needed something to wake up. The
act does not run when proposed; it runs by itself once its fifteen-minute window
passes, and only an objection stops it.

**The interesting part is how close it is to its opposite.** An unanswered
approval expires and never happens. An unopposed hold commits and does. Same
table, same waiting, opposite ends — so `commit_at` is a separate column from
`expires_at` rather than one field read differently by status. Sharing a column
would put "this never happens" and "this happens" a single typo apart, on a table
whose entire job is deciding whether something happens.

A scheduled sweep runs due acts every minute. Not on read, which would make an act
commit when somebody happened to open a queue — approve-first wearing a timer's
clothes. Not an in-process timer either: a timer dies with the process that set
it, and an act that never commits because a server restarted is indistinguishable
from one somebody vetoed.

**Nobody's name goes on an auto-committed act.** It happened because a window
passed, so `resolved_by_user_id` stays null. Recording an approver would attribute
a decision nobody made; recording the proposer would claim they acted at a moment
they did not.

**And a test caught a real bug.** Three failed because my fake EM required a
tenant filter the sweep did not supply — which was not a harness problem but the
harness telling me the sweep queried across every tenant while the schedule is
registered per tenant. Each tenant's timer would have done every other tenant's
work. Scoped, with a test that holds it.

Two other failures were my own stale claims — a gate test asserting A3 needs
machinery that does not exist, which stopped being true in the same commit. That
is the third time this week a test has failed because it described the world
before the change, and each time it has been the test doing its job.

## 2026-08-10 — A4 binds: the act runs, and somebody still has to look

*Execute and review* is the opposite shape from an act held for approval — it has
already happened — so it went in its own table rather than as a status on the
existing one. A table whose rows mean "not yet" or "already did" depending on a
column is how a schema starts lying to whoever reads it next, and this one is a
day old, which is the cheapest moment to get that right.

The decision is carried from `beforeExecute` to `afterExecute` through the
interceptor metadata rather than re-resolved after the act. Re-resolving would
answer *what the rules say now*, which can differ from the reason the act was
reviewable when it ran.

**Filing never throws at the caller.** The write has already committed; failing
the request would tell somebody their change did not land when it did. A missing
review row is a real gap, and lying about a successful write to report it is a
worse one — logged at error level instead.

**And no deadline**, unlike a held act. An approval nobody answers has work
blocked behind it and must expire. A review nobody does blocks nothing, and an
unreviewed act is exactly the thing somebody should still be able to find next
quarter. Same table shape, opposite retention, for a reason worth writing down.

One endpoint now returns both lists, because §9 asks for one inbox rather than
four screens — but they stay separate fields, since confusing "stop this" with
"check this" in either direction is how a queue loses its meaning.

That leaves **A3** alone: it commits when nobody objects, which needs something to
wake up and run the act. The scheduler module is enabled, so the pieces exist.

## 2026-08-10 — Which commands are gated, decided by reading rather than guessing

Three commands declared the capability they perform. Everything else was
ungated — visibly, by design, but three is not a governance layer.

The temptation was a regular expression: `directory.organizations.update` →
`directory.organizations.manage` looks like a rule. It is not. `catalog.offers.*`
is guarded by `sales.channels.manage`; `customers.addresses.*` by
`customers.activities.manage`; `auth.users.update` by `auth.users.edit`. A
pattern would have got those wrong, and a wrong mapping either blocks work that
should proceed or waves through an act that should have waited.

So I read it off the routes instead — every CRUD route declares both the command
it calls and the feature that guards it, which is evidence rather than inference.
**117 commands, no ambiguous cases.** 21 of them are in enabled modules and now
carry the declaration.

Parked modules are left alone and the step is written into `parked-modules.md`,
because restoring a module would otherwise quietly restore an ungated write path.

A guard test checks each declared capability is a real feature id. It is a text
scan, not a runtime check: the registry only hydrates enabled modules, so a
runtime assertion would pass for a parked module's typo and fail on the day
somebody restored it. And a typo here does not throw — it silently stops gating
the command while the source still looks gated.

## 2026-08-10 — The classification control needed no new policy, only a closer read

An AI worker reading integration credentials resolved exactly like one reading a
dictionary. Everything landed at `G1` whatever it touched, because nothing ever
set the grade from the data.

I had this on the backlog as *"needs a policy table with a source, not values I
invent"* — planning 02 §6.1 lists `matrix_by_classification` among the floors,
which reads like an instruction to build a classification-to-gate table. Inventing
those numbers was the blocker.

§8's worked example settles it in one line: *"reading confidential contracts for a
G3 legal matter — `E0 / G3 → floor A4`"*. The classification was never a ceiling
of its own; it raises the **task grade**, and the effect-class matrix — already
written, already tested — does the rest. The class-to-grade mapping comes from
the grade table in §3, matched on the words it already uses: *"internal records"*
is G1, *"personal data"* is G2, *"security changes"* is G3.

So: credentials now grade the work G3, and `E0 / G3` permits at most A4 — the
read happens and enters a review queue. Grades take the maximum, so a caller can
add weight and cannot talk the resolver below what it is reading.

**Worth keeping as a habit**: when a design document names the same input twice in
different shapes, the worked example is the one that tells you which shape was
meant. I spent a backlog item's worth of hesitation on a table that was never
supposed to exist.

## 2026-08-10 — Decision: the approvals page, and a rule about defaults

The approval tray works; the screen for it does not exist. I asked, because how a
screen behaves for somebody who opens it every morning is a product question and
guessing produces a control people route around.

**Decided:** its own page. Choose sensible defaults rather than asking about each
one, and expose settings where organisations genuinely differ.

I have read that as *"do not bake your taste into my product"* rather than *"make
everything adjustable"*, and said so — every setting is a thing to explain,
translate, test and get wrong, so "configurable" is not the safe option, it is an
option with a bill. Ordering, bulk approval, deputy cover, standing approvals and
expiry get a default and a knob; **who may approve does not**, because that is
authority and not preference.

**Scheduled after item 2**, with the reason recorded rather than left as
"later": three commands are gated today, so the tray is nearly always empty, and
a screen designed against an empty tray is designed against a guess. Item 2
widens what is gated. Same discipline as running shadow mode before enforcement —
which has already caught two design errors of mine that reasoning alone did not.

Generalised into **rule zero-seven** in the cookbook, because the shape recurs:
choose the default, name which half of the decision you are in (right answer /
legitimate difference / authority), write down the argument, and if a surface
needs real usage to design well then say what has to exist first.

## 2026-08-10 — An act that has to wait

Enforcement could refuse an act and nothing else. `A1` and `A2` — *"the worker
proposes; a human performs"*, *"executes only after approval"* — were recorded as
obligations while the act ran anyway. A control that does not control.

Now an act gated at A1 or A2 **does not run**. It is held with the decision that
held it, and executes only when somebody holding `auth.authority.approve` says
so. Reject means never; every held act carries a 24-hour deadline, and an expired
one has to be proposed again — planning 02 §7.2 is explicit that expiry should
escalate rather than block work silently.

**The design question was where to catch an act**, and it took most of the
investigation. The route is universal but would store raw request bodies
(passwords among them) and re-run guards on replay. The command bus is narrower
but right: an act that can be *undone* is an act that can be *replayed*, and the
platform already models that with snapshots and redo, and already persists
command inputs under the encryption map. I went with the bus.

That left a gap I had not seen: **the resolver is keyed by capability and the bus
by command, and nothing connected them.** `module.entity.action` and
`module.action` look close enough to map with a regular expression, which is
exactly the R4b mistake at 153× scale — a wrong mapping either blocks work that
should proceed or waves through an act that should have waited. So commands
declare their capability explicitly, three of them so far, and everything else is
visibly ungated rather than invisibly mis-gated.

**Who is accountable for an approved act**: the approver, in the proposer's
organization. Approval means taking responsibility, and rebuilding a proposer's
session from two stored columns would be fabricating one rather than reproducing
it. But an act proposed for one organization must not land in another because the
approver was looking elsewhere.

**Two things the unit tests could not have caught**, both found by running it:

The gate read the command's capability from the registry, and at request time the
registry it saw did not have it — so the gate concluded "this command declares
nothing" and let the act through. The capability now travels *from the bus*, on
the interceptor context, because the bus has already resolved the handler. For a
gate, "declares nothing" and "I could not see the declaration" have opposite
consequences, and the first live run took the wrong branch silently.

And the held act answered **500**. My own error class carries a docstring saying
three outcomes must stay distinguishable — you may not, it failed, and *not yet* —
and it was collapsing into the second. Now 202 with the pending-act id: understood,
accepted, not done. A 500 invites a retry, and each retry queues another copy.

Verified end to end afterwards: the rename did not happen, the queue showed it
with the gate and the reason, approving it ran the act, and the organization's
parent survived — the U10 fix holding in the same request.

**What still does not bind, said out loud.** A3 commits when nobody objects —
the opposite of expiry, and it needs a scheduler. A4 runs the act and files a
review, which is a different record. And the queue is an API with a deadline, not
the inbox §7.2 describes: no grade ordering, no bulk-with-diff, no absence
routing, no standing approvals. Items 2 and 3. The inbox is a product decision
and should be talked about before it is built.

## 2026-08-10 — A key is not a person, and a cascade that never ran

**The follow-through from U3.** Authentication resolved a regular API key through
`createdBy` and required that person's organization to equal the key's — so
moving somebody to another team silently killed every key they had ever created.
Provenance was being used as identity.

The rule is now the narrower one that actually matters: **a key may not be
broader than its creator.** A null organization means *unrestricted across the
tenant* to `RbacService`, so a key with none, minted by somebody confined to one
organization, is an amplification and is refused — invariant I4. A key scoped to
an organization its creator has since left is a service credential doing exactly
what it was made for, and keeps working. Session keys keep exact equality,
because there the borrowed identity is the whole point.

**What the old behaviour did that was worth keeping** is now explicit rather than
a side effect of a lookup failing: `api_keys` revokes a deleted user's keys on
`auth.user.deleted`. Offboarding becomes a visible, audited act — the key list
shows them revoked — instead of a fleet of credentials that mysteriously start
returning 401. Authentication still refuses a key whose user has gone, because an
event bus is not a place to put the last line of a security control.

**And then, looking for an event to hang that on, I found U8.**
`communication_channels` has a cascade that disconnects a departed user's email
and calendar channels, stops the poller and orphans the credentials. Its first
line reads `payload.userId`. The platform emits `payload.id`. **It had never run
once** — a departed user's mailbox stayed connected and polling.

Seven tests covered it. Every one of them constructed
`{ userId: 'user-1', tenantId: 'tenant-1' }` — a payload nothing in the platform
produces. That is [L34](LESSONS.md) again from a third direction: not SQL text
this time but an event contract, and the same failure, a test that verifies the
handler's *intent* against a shape somebody imagined.

I wrote my own subscriber against the real payload and put the shape in a typed
comment, because the next person to add a cascade will copy whichever one they
find first.

**The gate then failed on something unrelated** — a `<Notice>` guard that walks
every source file in the repo, reading one from a sibling package's scratch
directory a moment after that package's own tests deleted it. Passes alone, fails
in the gate: the shape of every flake that teaches people to re-run instead of
read. Skipping `.tmp-*` and tolerating a file that vanishes mid-walk brings it
into line with the platform's other repo-walking guard, which already does both.
[U9](workspace/references/upstream-issues.md).

## 2026-08-10 — U2: a screen that showed an action and behaved like a declaration

The *Apply to roles* switches on Sidebar customization reset to "no roles" on
every load, while a save treated the list as a complete statement of which roles
should have this layout. So the second save asked to clear every preset, and the
only thing between that and the delete was a small red badge.

**The obvious fix was wrong, and I had already checked that.** Pre-ticking roles
with `hasPreference` looks like two lines. But a preset stored a *copy* of the
settings and no reference to the layout that produced them, so `hasPreference`
means only "this role has some layout" — pre-ticking on that basis would tick
roles configured from a different layout and silently overwrite them on save. A
worse failure, because the screen would look right while doing it.

**So: `role_sidebar_preferences.variant_id`.** A preset records where it came
from, and the switches can finally say which layout a role actually has. No
foreign key, deliberately: a variant is one person's saved layout and may be
deleted, while the preset it produced must outlive it. A dangling id stops
matching and reads as "from a layout no longer here" — true, where a cascade
would delete a role's sidebar because somebody tidied their own saved views.

**The guarantee is server-side.** `clearRoleIds` can only delete presets whose
stored `variant_id` matches the layout being saved; everything else is dropped
from the list. Fixing the switches fixes the screen — but a client that computes
the wrong list is a bug anyone can ship, and a client that computes the wrong
list *and is obeyed* is how data goes missing. Seven route tests hold that half.

Three states now, not two: *uses this layout* · *uses Finance layout* · *uses a
layout from an unknown source*. The third is for rows written before the column
existed. **Unknown is not "none"**, and a row nobody can attribute is left alone
rather than guessed at — the same distinction the graph ceiling makes between
"no constraint" and "constraint I could not read".

**And the checkpoint script was not pruning.** It reported `pruned: 0` after every
run while the backup directory grew by a set each time. The cap ranked only the
*stale* files, so the newest five sets counted as zero against it and ten old
files survived on top of them. Ranking every backup and applying the grace window
as a second condition fixes it; the directory now converges instead of growing.
A tool that reports success while doing nothing is worse than one that fails.

**Found on the way:** the `audit_logs` and `directory` migration snapshots had
been stale since R3 and R6. `yarn db:generate` was emitting migrations to
re-create `ledger_events` and `organization_edges` — tables that already exist —
which would have failed on anyone else's machine and looked like our bug. Both
snapshots now match the schema that shipped.

## 2026-08-10 — The resolver decides

R5 and R6 built a decision kernel and nothing called it. It calls now.

Three modes per tenant — `off`, `shadow`, `enforce` — defaulting to shadow,
because enforcement is a decision an operator makes against their own traffic,
not something that arrives with an upgrade and starts refusing requests on a
Tuesday. Verified end to end against the running instance: an organization behind
an `inheritance: none` edge returns **403** where its parent returns **200**, and
the log carries the reason — *"inheritance is none, so nothing flows down, an
'advises' relationship permits at most A2"*.

**Enforcement can only narrow.** It runs after RBAC has already said yes. That
ordering is the guarantee rather than a convention: there is no path through
`RbacService` where the resolver turns a `false` into a `true`, so "could this
grant something?" is a question you answer by reading four lines.

**Refusals bind; obligations do not.** The resolver returns a gate from A0 to A5,
and only A0 is enforced, because it is the only outcome the platform can carry
out. A1–A4 mean approve-first, hold-and-commit, review-afterwards — and nothing
can yet hold an arbitrary act and resume it once somebody approves. Enforcing
those would mean allowing the act and calling the allowance a control. The CLI
says this out loud when you switch a tenant on, and it is backlog item 3.

**Shadow mode found another design error of mine**, which is now twice. An API
key acquired an approval obligation for *listing organizations*. A read has no
effect to approve, and gating one produces exactly the approval fatigue planning
02 opens by naming as the thing it exists to resolve. The cause: I had written
the untrusted-machine ceiling as a flat A2, where §5.1 specifies a vector over
effect classes — *"a worker can be T4 on research reads and T1 on external
communication"* — and warns that a single number is "either uselessly
conservative or dangerously optimistic". Mine was the conservative half. Reads
are now exempt; everything with an effect keeps approve-first.

That exemption has a cost I am not hiding: an untrusted machine can now read
`confidential` data bounded only by RBAC. The control that belongs there is the
data-classification floor, which planning names and nobody has built. Backlog
item 4, with a note that its values need a source rather than my judgement.

**And a bug my tests could not see.** The edge query used `= any(?)`, which the
query builder expands into `any('a','b')` — a syntax error. Seventeen tests
passed because the fake connection never parsed the SQL; it filtered in
JavaScript, so every property they asserted was a property of the fake. It
surfaced the first time an organization actually had a parent, which was the
first time the query ran at all. Second instance of the same shape as the ledger
alias — [L34](LESSONS.md).

## 2026-08-10 — U3 was real. I had closed it twice on bad evidence

A key created through the ordinary UI flow returned **401 on every request**. Not
a corner case — the default path. An admin working tenant-wide has no selected
organization, so creation stored `organization_id = null`, while
`resolveApiKeyAuth` requires the key's organization to equal *its creator's*, and
the creator has one. Every key that admin made was dead on arrival.

One column proved it: 401, `update api_keys set organization_id = <creator's>`,
200. Same key, same request.

I had closed this twice. Once by misdiagnosing it (my own `Authorization: Bearer`
header produced the 401s — [L30](LESSONS.md)), and then, worse, by treating that
discovery as a disproof and **reverting a correct fix**. Invalidating your own
reproduction returns an issue to *unknown*, not to *resolved* —
[L32](LESSONS.md), the more expensive of the two.

**Fixed at creation, not at authentication**, and the distinction is the whole
decision. The comparison looks like the bug — provenance used as an authorization
input — but it is load-bearing: `RbacService` reads a null `organization_id` as
*unrestricted across the tenant*, so that check is the only thing stopping a
single-organization admin from minting a tenant-wide key. Loosening it would have
turned an availability bug into a privilege escalation. Creation now takes the
creator's own organization, and refuses an explicit mismatch with a 422 that says
why.

Checked rather than assumed, and worth recording as a negative: **a key does not
inherit its creator's permissions.** `loadAcl` sees a service principal and reads
the key's own roles; the creator's user ACLs never enter. The escalation this was
feared to be does not exist. What does exist is a machine credential whose life
is tied to a person's record — delete the creator and every key they made dies
silently. That is now backlog item 3.

## 2026-08-10 — The authority graph bridge learns to say "I do not know"

`AuthorityGraphService` had no tests, and two ways to fail that both returned
`A5` — which reads as *nothing constrains this*. An organization it could not
find, and an ancestor index whose order had inverted, would each have granted
full autonomy by silence.

Both now fail closed at `A0` with a stated `basis`, and the inversion is actually
*detected*: a leaf-first index makes every real edge match the path reversed,
which ordinary data cannot produce. Unmapped hops are reported rather than
absorbed, so an unconstrained answer says how much of the path it actually read.

Thirteen tests, including one that pins the root-first ordering of `ancestor_ids`
at the module that produces it — the assumption cannot be typed, so it has to be
detected on one side and pinned on the other.

Found while reading that code: a sibling comparator that compared a lowercased
name against a raw UUID. One identifier. Fixed, with a test.

## 2026-08-10 — A 500 on an ordinary write, caused by four characters of SQL alias

Creating an API key started returning 500. The server log named a duplicate key
on `ledger_events_tenant_seq_uq` — the chain's own uniqueness constraint,
rejecting an append that claimed a position already taken.

**The chain was fine.** Ten events, sequence 1 through 10, no gaps.

**The head query was wrong.**

```sql
select seq::text as seq, hash from ledger_events ... order by seq desc limit 1
```

PostgreSQL resolves `ORDER BY seq` to the *output column* when one shares the
name, so this ordered by text: `'9'` beat `'10'`. Every append computed a head of
9, tried 10, and hit the constraint. The same alias in the verifier made it read
the chain as 1, 10, 2, 3 and report an intact chain as **broken** — a false alarm
from the one tool whose entire value is that people believe it.

Both are one four-character mistake: `as seq` instead of `as seq_text`.

**What the constraint did well.** It refused the write rather than forking the
chain, and it took the business write down with it — fail-closed, exactly as
designed. The integrity guarantee held; what failed was arithmetic.

**What I did badly.** The error named a race, so I went looking for a race, and
found one: `getConnection().execute()` without a transaction context can take a
different pooled connection, which means `pg_advisory_xact_lock` commits and
releases immediately and serialises nothing. That defect is real, and I fixed it
and tested it — but it was not this bug. I spent an hour on a plausible cause
before checking the simplest possible fact: what the head query actually returns.
Ten seconds in psql would have shown `9` sitting on top of a table whose maximum
is 10 ([L31](LESSONS.md)).

Both fixes ship. The chain now verifies: **10 of 10 events, 0 broken.**

---

## 2026-08-10 — The U4 sweep, and a bug I invented

**The sweep did what it should.** `selectedOrganizationId ?? auth?.orgId` appears
in 53 files, which sounds alarming and mostly is not. Thirty-eight are in parked
modules. The rest fall into three shapes, and only one is dangerous:

> **Never use the actor's organization as a value you store.** Comparing against
> it is fine. Filtering by it is fine. Storing it makes the record mean
> *"whatever scope the person who created it happened to have"* — and for a
> superadmin, who has none, it means nothing.

Four bugs have been that one sentence. The rule is now in
[scope-tenant-organization.md](workspace/knowledge/scope-tenant-organization.md),
where somebody will look for it.

**Then I invented a bug and nearly shipped a fix for it.** I expected U3 — "an
API key fails at use time" — to be an instance of the same pattern. I reproduced
it twice, traced it to a comparison in the authentication path, wrote the fix,
updated the tests, and wrote three documents explaining the finding.

Every 401 was my own request. The platform accepts `X-Api-Key` or
`Authorization: ApiKey`; I sent `Authorization: Bearer`, and read the 401 as
confirmation of the defect I was already looking for. Sent correctly: 200.

Worse, when I then tested the mechanism I had blamed — nulling a never-used key's
organization so the comparison would have to reject it — that returned 200 too.
The branch I built a fix around does not fire, and I still do not know why.

**So I reverted the fix.** It changed which organization a new key belongs to, on
the strength of a defect I could not demonstrate. Keeping a behaviour change no
evidence supports is the same mistake as keeping a bandage, and harder to spot
because it looks like diligence.

U3 goes back on the backlog as *unverified*, alongside a real open question: a
security comparison exists that I cannot explain the behaviour of. That is worth
understanding before it starts mattering.

What I never did, in an entire investigation of a 401, was make one API-key
request I expected to **succeed**. It would have taken seconds
([L30](LESSONS.md)).

---

## 2026-08-10 — The authority graph is now something a person can change

R6 shipped typed organization edges and seeded them permissively, which left the
feature real and unreachable: lowering a ceiling meant writing SQL. There is now
an API and a settings page.

**Guarded by `directory.organizations.manage`**, not a feature of its own.
Editing an edge changes what everyone below may do — the same risk class the
descriptor already assigns to organization management (E5, not delegable) — and a
second permission over the same act would be a second place to get it wrong.

**Four refusals, each protecting something structural.** A self-edge is a cycle
with nothing to terminate on. An edge pointing back up the tree makes "what is
above this organization" have two answers, when the tree is what scopes every
query in the platform. An organization from another tenant would produce a row
that is invisible rather than dangerous — and a write that silently does nothing
is worse than one that fails. And a stale update is refused outright.

**The optimistic-lock guard caught me.** The platform asserts that every mutating
UI file either sends a version header, is inline-exempt, or is allowlisted. My
page did none of those and the gate failed. The right response was not the
allowlist: two people editing the same ceiling from two tabs must not resolve to
whichever saved last, because for authority configuration a lost update is a
security change nobody chose. Both sides now implement it.

That guard is the second time this week a platform-level test has caught
something I would have shipped. It is worth noticing what they have in common:
both assert a **property across the whole codebase** rather than the behaviour of
one unit, so neither can be satisfied by a new file that simply forgets.

**The page's real work is saying what things mean.** "A2" and "reference_only"
are not self-explanatory, so every dropdown carries its meaning — "A2 — needs
approval first" — and the page states plainly that raising a ceiling grants
nothing on its own, it only removes a restriction that edge was imposing.

Gate: 22/22 tasks, 12,527 tests.

---

## 2026-08-10 — U7: the journal can finally tell a machine from a person

`action_logs.actor_user_id` is a uuid column, and the subject is narrowed on the
way in — `api_key:<uuid>` has always been stored as the bare uuid. A key acting
and a person acting were indistinguishable in the journal, which is the single
distinction this platform exists to make. R3 closed it for the hash chain by
reading the raw subject; the journal's own column stayed wrong until now.

`actor_kind` is written from that same raw subject, so the journal and the chain
tell one story. The column is nullable and **null means unknown, never human**:
an entry written before the column existed cannot have its kind recovered from
the row alone.

**The backfill taught me something about my own reasoning.** I wrote it with two
inferences — an id matching `api_keys` is a service principal, no actor at all is
the system — and a comment asserting that a human could not be distinguished from
an unknown actor. The dry run then reported **15 rows "cannot be determined"** on
an instance with one admin.

That number is not plausible, and it was not a bug in the query: it was a
limitation I had asserted without checking. Matching the `users` table is exactly
as sound as matching `api_keys` — the same inference in the opposite direction.
With it, all twenty rows resolved and none were guessed.

Had the command not printed its breakdown before writing, I would have applied it,
seen no error, and left every historical human action permanently unattributed —
in the audit trail, which is the one place that is supposed to be recoverable
after the fact.

Also surfaced in the API and the detail dialog, because a journal that records a
distinction and never shows it has not closed the gap.

Gate: 22/22 tasks, twice — the log held two complete runs after a timeout, both
green (L26 is why I checked before believing the test count).

---

## 2026-08-09 — Three small repairs, and the proof I could not get yesterday

**The audit journal now refuses to lose a scope it was given.** `normalizeInput`
nulls any tenant, organization or actor id that is not a uuid — right for a value
nobody supplied, data loss for one somebody did. A tenant-less entry is returned
by no tenant-scoped query and, since R3, covered by no hash chain: the write
appears to succeed and the record is both unreachable and unprovable. It now
throws, naming every dropped field and the consequence. The old behaviour warned
**once per process**, so the first bad write was reported and every one after it
was silent; every occurrence is logged now.

**Shadow mode has a heartbeat.** After the autonomy matrix was scoped to workers,
ordinary traffic stopped producing any interesting line — and an empty log then
meant either "nothing worth reporting" or "the shadow is not running". Those are
opposite conclusions and I could not tell them apart. The report now says
*"nothing to report, and that is a finding: 240 permission checks were observed
and none would change"*, which is a result rather than an absence of one.

**`OM_LOG_LEVEL` never reached the app.** Turbo runs tasks in a filtered
environment: anything not declared in `globalEnv`, `globalPassThroughEnv`, or a
task's own `env` is dropped silently. `OM_LOG_LEVEL=debug yarn start` looked like
it worked and produced nothing, which is exactly the kind of failure that costs
an hour and teaches the wrong lesson. Both runtime knobs are declared now, and
the runbook warns the next person.

**And with that, the proof I lacked.** Yesterday I reported the matrix correction
as 45 observations → 0 while admitting I could not distinguish "no findings" from
"not running". With debug logging actually reaching the app, the same traffic now
produces **17 "Resolver agrees" lines and zero of everything else**. The shadow
is running, and the correction holds. An inference became a measurement.

Gate: 22/22 tasks, 12,510 tests.

---

## 2026-08-09 — Shadow mode found a design error in its first hour, which is what it was for

With credentials from the owner I logged in and walked all 84 backend pages and
60 API routes. Forty-five shadow observations, twenty-one capabilities.

**Zero disagreements.** The resolver would refuse nothing the platform allows
today — enforcement would lock nobody out.

**Forty-five of forty-five were people acquiring an obligation.** Changing your
own sidebar layout would enter a review queue. Editing a dictionary would need a
second person's approval. Composing a message would be queued for review.

That is not a finding about the platform. It is a design error in the resolver,
and it is mine.

**The mistake.** I applied the autonomy floor matrix to every actor. The gates
describe how much a *worker* may do unattended — `A1` is defined in the planning
as *"the worker produces a proposal; a human performs the act"*, which has no
meaning when the actor **is** that human: the thing A1 asks for has already
happened. Reading the table as applying to people turns every ordinary write into
supervised work.

The planning's own §7 warns about exactly the consequence: *a control that is
expensive to operate gets switched off* — and it takes the useful controls with
it when it goes.

**The correction.** The matrix and the irreversibility cap bound machines and
delegated authority. A person exercising a permission they hold is bounded by the
other ceilings: the org graph, the record's state, the delegation they act under,
and tenant policy. Four-eyes on financial acts belongs in policy, deliberately —
that is a decision each company makes rather than one a table imposes. The effect
class is still *recorded* for human decisions, because dropping it would make a
decision about a destructive act read exactly like one about a read.

**Re-measured on the same traffic: zero.**

**What I could not prove, and said so.** After the correction, human traffic
produces no info-level lines, so silence became ambiguous — it means either
"nothing interesting" or "the shadow stopped running". `OM_LOG_LEVEL=debug` had
no effect (dotenvx's `.env` appears to win over the process environment), and my
machine-actor control was blocked by U3: an API key created by an admin whose
organization is not pinned returns 401 at every use. So I verified the shadow is
present in the running build rather than claiming a positive observation I did
not have. Both gaps are now backlog items — the first one, a heartbeat, exists
precisely so silence is never ambiguous again.

**This is the batch that justifies shadow mode.** Had the resolver been switched
on directly, the first thing this platform's governance layer would have done is
demand approval to edit a dictionary.

Gate: 22/22 tasks, 12,497 tests.

---

## 2026-08-09 — Shadow mode: the resolver now runs on every permission check

R5 and R6 built a resolver nothing called. That gap only widens while it is true,
so the resolver now runs beside **every real permission check** in the platform —
and its answer is recorded, never obeyed.

**Why not simply switch it on.** The existing RBAC has decided these questions
for the life of the product. The resolver is new, one of its inputs is a
deliberately conservative placeholder (every machine actor capped at
approve-first until a trust model exists), and nothing models task grade yet.
Enabling it blind would refuse requests that have always worked, in production,
with no evidence about how often or where. Shadow mode buys that evidence for the
price of a log line.

**One hook, 102 call sites.** Every permission decision in the platform reaches
`RbacService.userHasAllFeatures`, so instrumenting that one method covers all of
them and every future one without touching a caller. The decision itself moved
into a private `decideAllFeatures`, so the shadow runs on a value already
computed and *physically cannot* alter it — a comment promising it would not
alter anything is worth less than a structure in which it cannot.

**The number I care most about is not disagreement.** It is
*"the resolver would add an obligation"* — both systems allow the act, but the
resolver wants approval, review or a hold window. That is the work the governance
layer would begin doing on the day it is switched on, and it is the number that
decides whether switching it on is survivable.

**Measured, not assumed:** 526 ns per call. A permission check does a cache or
database lookup, which is orders of magnitude more. The shadow deliberately skips
the organization graph, because consulting it would add a query per check for a
diagnostic — so the shadow *understates* the eventual constraint, which is the
safe direction for a measurement meant to find surprises early.

**A test earned its place immediately.** I wrote "it must never throw" as a test
rather than a comment, and it failed on the first run: the catch block logged
`input.capability.id`, so a malformed input threw *inside the handler written to
make throwing impossible*. An error path is still a path.

Gate: 22/22 tasks, 12,480 tests.

---

## 2026-08-09 — U5: the gate that failed at random was three different problems

Six full gate runs in one day, three of them failing, each somewhere different,
all passing in isolation. Investigated as one problem. It was three, and only one
was a defect.

**Two were not flakiness at all.** I had been running package suites as
`npx jest --config packages/core/jest.config.cjs` from the repo root. Several
tests resolve paths from `process.cwd()`, so they were looking for a directory
that has never existed. Turbo runs each package in its own directory; my
invocation did not. Nothing was broken — my runner was standing in the wrong
place ([L25](LESSONS.md)).

**One was a real defect, and it would have fired in CI.** The OpenAPI generator
suite builds a module tree in a temp directory, runs discovery over it, and
bundles. Idle, each test takes 165–470ms; under the gate, sharing a disk with
other packages' workers, one exceeded jest's **5s default**. Five seconds is a
contract for unit tests — *if it has not finished, it has hung* — and that is the
wrong contract for a suite whose work is I/O. Now stated explicitly at 30s, with
the reasoning in the file, and deliberately bounded at roughly 60× idle so a
genuine performance regression still surfaces.

**One has never been explained.** A decoupling test saw a capability registry
that contained `catalog` when three separate layers guarantee it cannot. Not
reproduced in three solo runs or in any gate since. Rather than invent a cause,
the test now **asserts its own precondition** — that the registry it sees has no
`catalog` key. If it recurs, the failure will say whether the mock applied, which
is the one fact this investigation lacked.

**What I assumed first and was wrong about:** CPU oversubscription. The shared
jest base already caps workers at 2 and the root script caps turbo at 2 — four
workers on eight cores. The first explanation that fits is not the same as the
one that is true.

**And a trap that nearly cost a wrong conclusion.** A timed-out run's children
kept writing to the log I then read, so one file held two turbo summaries and
looked like a failure. Tasks reported failed with zero failing assertions
underneath is the tell: a real failure names something, a killed one just stops
([L26](LESSONS.md)).

Three consecutive clean gate runs afterwards — 22/22 tasks, 12,466 tests, byte
identical counts.

---

## 2026-08-09 — R6: position in the org graph now bounds authority, and all six repairs are in

Organizations are joined by **typed edges** carrying relationship type,
inheritance mode, an authority ceiling and a capability allowlist. The tree —
`parent_id` plus the closure columns — is untouched and still scopes every query;
the edges add what a tree cannot carry.

This is invariant **I4** made structural rather than conventional. A worker three
levels down cannot exceed what the edges above it permit, whatever its own grants
say, because the resolver takes the minimum along the path.

**Why a tree was never enough.** Real customers are consultancies operating client
companies, groups with subsidiaries, temporary structures for one engagement. "We
advise that client, and may see these things but never those" cannot be said with
`parent_id`. A permission system that cannot express it gets that distinction
implemented in application code instead — differently every time.

`advises` and `serves` default to A2; `owns` and `manages` pass everything. A
consultancy advising a client should not act unattended inside it by default, and
a relationship type can only ever *lower* — a permissive type never widens an edge
somebody deliberately narrowed.

**Nothing changed on the day it landed.** The migration seeds one
`owns`/`strict`/`A5` edge per existing parent-child link, and an absent edge is
also unconstrained. The mechanism exists from now on; lowering a ceiling is a
deliberate act, not a behaviour change that arrives with a deploy.

**A methodology error worth more than the feature.** Chasing what looked like two
new test failures, I found I had been running package suites as
`npx jest --config packages/core/jest.config.cjs` **from the repo root**. Several
tests resolve paths from `process.cwd()`, so they were reading
`<root>/src/modules/...` — a directory that does not exist. The failures were
produced by how I invoked the runner, not by the code. Turbo runs each package in
its own directory, which is why `yarn test` was green while my direct invocation
was not.

That also cleared up the flaky failures around it: two full gate runs came back
green, so the earlier ones were U5's parallelism flakiness, which remains its own
backlog item.

**All six repairs are complete.** R1 principals, R2 audit coverage and atomicity,
R3 the hash-chained ledger, R4 capability descriptors, R5 the decision with
reasons, R6 the authority graph. What remains before the Starting Kit is done is
the eight grafts.

Gate: 22/22 tasks, 12,466 tests, green on two consecutive runs.

---

## 2026-08-09 — R5: authority answers with reasons, and the spike closes

The second half of the spike. Permission checks now return a **decision**: the
gate, every rule that contributed, which one was binding, what obligations
follow, and what would change the answer.

The reason this had to be built early rather than added later is that a boolean
destroys the information at the moment it is produced. By the time `false`
reaches a caller there is nothing left to explain with, and no logging bolted on
afterwards recovers it. Retrofitting explainability into a system that answers
yes/no is essentially impossible; designing for it costs almost nothing.

**What the resolver enforces today.** The grant, the R4 effect-class matrix,
invariant **I8** (an act nobody can undo is never decided after it happens — cap
A2), invariant **I4** (authority is carried, never amplified — a worker cannot
exceed its invoker), delegation and policy ceilings, and resource state. Trust,
charters, budgets and org-graph ceilings are named optional inputs: absent means
*not consulted*, never *unlimited*.

**Everything is a ceiling and the answer is the minimum.** No rule anywhere can
raise a gate. That is asserted as a property over every combination of inputs,
not as an example — if a raising rule ever existed, every other rule would become
advisory and "what is the most this could ever be" would stop having an answer.

**The one policy I invented, and why.** The trust model does not exist yet, so a
machine with no trust record resolves as untrusted and is capped at approve-first.
A placeholder erring the other way would let machines act unattended precisely
during the period when nothing is measuring whether they should. Humans are not
capped this way — that asymmetry is **I2**, and it lives in the data the resolver
reads rather than a branch that treats one kind of actor as special.

**Preflight** resolves a whole plan before work starts, which the planning
document calls the best fatigue mitigation available and I think is right: the
dominant failure of an approval system is not refusal, it is a worker stalling at
step four at hour three and somebody finding out at hour nine. Every step is
resolved even after one is blocked, and approvals are counted per capability
rather than per occurrence — approving the same act five times in a plan is one
decision a person makes.

**It is not enforcing.** Nothing calls it in the request path yet. A resolver
that silently starts refusing requests is the least safe way to introduce one.

`mercato auth authority:explain --capability attachments.manage --actor ai_worker`
prints the whole decision against the real descriptors — an AI worker asking to
delete attachments gets A1, propose-only, with the binding rule marked and the
capability's own note quoted underneath.

**The spike is complete.** R1 (principals) and R5 (decisions) were the two
timeboxed items that would tell us whether this foundation is reshapeable. Both
landed, and neither required fighting the host platform.

Gate: 22/22 tasks, 12,445 tests.

---

## 2026-08-09 — R4b: all 113 permissions described, and a guard that checks the real ones

R4 shipped with 37 of 113 features described and the rest tracked. The remaining
76 are now done, module by module, each classified by opening the routes it
guards.

**What the reading turned up**, none of which was visible from the ids:

*Workflows are the automation engine, and most of it reaches outside.* Activities
include `CALL_API`, `CALL_WEBHOOK` and `SEND_EMAIL`, so starting an instance,
signalling one, retrying one, or completing a human task are all E3 with an
external effect. Completing a task looks like the smallest act in the module and
triggers whatever the workflow does next.

*Authoring automation is authoring authority.* A business rule's actions include
`CallWebhook`, and rules fire with nobody present. Writing one is closer to
changing what the system may do than to editing a record — E5, not E1.

*Importing history pulls in without sending out.* `channel.import_history` reads
years of correspondence from an external platform into the tenant. Nothing
leaves, so it is not E3 — but it is a bulk irreversible write of other people's
personal data, which E2 says and the name does not.

*An exchange rate is a financial effect without being a payment.* It decides what
every converted amount is worth, including on documents already issued.

**A gap in my own guard, found by closing it.** The coverage test validated
*invented* descriptors and merely *counted* the real ones — so a contradictory
descriptor could have sat in a module indefinitely with a green suite. The guard
now loads every module's `acl.ts` and validates what ships, plus two new checks:
nothing marked `externalEffect` may sit below E3, and a `compensation` must point
at a capability that exists. A compensation nobody can perform is worse than
admitting irreversibility, because it reads as though a remedy were available.

**And a defect that guard exposed in my R4 code:** `getModules()` throws when the
app has not bootstrapped, and the registry's lazy hydration called it unguarded.
Asking what kind of act something is would have crashed any CLI command, worker
or test that asked. Now it degrades to "nothing to discover".

**Two self-inflicted mistakes worth recording.** Rewriting the acl files, I
rebuilt each entry by splitting its body on commas — which split inside
`title: 'Create, edit, and delete business rules'` and corrupted five files.
Restored from git and rewritten to insert before the closing brace instead:
never re-parse what you only need to append to. And the apostrophes in my notes
came through double-escaped, which the typecheck caught immediately.

Coverage is now **113/113**, asserted rather than reported, with the module set
computed so a new module cannot arrive undescribed.

Gate: 22/22 tasks, 12,409 tests.

---

## 2026-08-09 — R4: permissions now say what kind of act they are

A permission was an id and a title. `api_keys.delete`, "Delete API keys". That
answers *may this actor do it* and nothing else — not whether a machine may do it
unattended, not whether a second person should confirm, not whether it can be
undone tomorrow. Those are the questions this product exists to answer, and none
of them can be derived from a string.

Every act can now carry intrinsic risk semantics, declared once and centrally:
effect class (E0 read → E6 destructive), reversibility, data classes, whether it
leaves the company, whether it may be delegated or covered by a standing
approval. Plus the autonomy floor matrix from the planning docs — the ceiling on
how much autonomy an act may ever permit, by effect class and task grade.

**R4 is the vocabulary, not the gate.** Nothing refuses an action yet; the
resolver that reads these is R5. Saying so plainly matters, because a
half-implemented gate that looks like a gate is worse than none.

**37 of 113 enabled-module features are described** — the nine modules that
perform the riskiest acts. The rest is R4b, tracked with the exact module list
and counted by a guard that prints coverage on every run. The guard asserts two
things hard: descriptors must be coherent, and a described module may never lose
its descriptors. It does not assert 100%, because a guard that must be disabled
on the day it is written guards nothing.

**Three classification rules earned while doing it.**

*Classify by the worst act the feature permits.* `attachments.manage` covers
upload and delete, and delete removes the file from storage. E6, not E1. Holding
a feature means holding everything it permits.

*Read the code, never the name* (L19 again). `configs.cache.manage` sounds
destructive and is genuinely reversible — it clears derived state that rebuilds
itself. `auth.sidebar.manage` sounds like a permission change and grants nothing.
`inbox_ops.settings.manage` sounds like a preferences page and sets the webhook
signing secret that decides who may inject mail into the tenant.

*A named compensation or nothing.* `compensatable` without naming the
compensating act is irreversibility wearing a friendlier word, so the validator
rejects it. That rule alone changed three of my own first-draft classifications.

Gate: 22/22 tasks, 12,366 tests.

---

## 2026-08-09 — R3: the record can now prove it has not been altered

`action_logs` answers *what happened*. It is an ordinary table: anyone with
database access can edit a row, and nothing would show it. Since the product's
claim is a governance layer that can always explain itself, "trust our table" is
not an answer.

Every audited write now also extends an **append-only, per-tenant hash chain**.
Each event carries its predecessor's hash, so altering one invalidates every hash
after it. Rewriting the successors to match is blocked by a database trigger that
refuses `UPDATE`, `DELETE` and `TRUNCATE` — verified against a superuser, because
a chain only the application declines to rewrite protects against nobody worth
protecting against.

**Hooked to `ActionLogService.log()`**, the single funnel both write paths already
pass through. A module physically cannot audit a change and forget to chain it.

**Three decisions worth keeping.**

*The chain holds no customer content.* Payloads carry the journal entry's id and
**digests** of the snapshots. That is what makes erasure possible: delete the
personal data from the journal, and the chain still verifies because it never
held the data — only proof of what it was.

*Two serialisers, deliberately.* The event envelope is strict — floats, dates and
class instances are rejected — so an outside auditor can recompute a hash.
Snapshots get a total encoder that never throws, because they contain prices and
timestamps, and a strict encoder would throw, and since the append is fail-closed
that throw would roll back the customer's write. **Be strict about what you
construct, total about what you receive.**

*The chain records the actor's kind; the journal cannot.* `action_logs.actor_user_id`
is a uuid column and the normaliser strips the `api_key:` prefix before writing,
so in the journal a key acting and a person acting are indistinguishable — the
one distinction this platform exists to make. The ledger reads the raw subject
and keeps it. The journal's own column still needs fixing (**U7**), and that
belongs with R4/R6 where principals are being worked on.

**Two mistakes on the way in.** I put the entity in its own file and re-exported
it from `data/entities.ts`; the migration loader transpiles that one file alone,
so the re-export broke `db:migrate` for every module — the convention exists for
a reason. And I proved the append-only trigger by inserting a probe row, which by
construction I could not then delete; the table had no real events, so it was
reset, but a minute later that would have been a permanent seq-999 hole in a real
tenant's chain.

Gate: **22/22 tasks, 12,348 tests**, on Node 24.

---

## 2026-08-09 — R2c was correct and unverifiable: three mistakes in the check, not the code

The owner tested R2c and the audit entry did not appear. The code was right; the
way I asked them to verify it was wrong, three times over.

**One: the app serves `dist`, not source.** The running instance was a production
build started eighteen hours earlier. My edits never reached the process serving
the page. Every check I had run — `tsc`, `jest`, the coverage guard — reads
source; none touches what executes. The settings row's `updated_at` even moved,
because the *old* code updates the same row. → [L20](LESSONS.md)

**Two: the gate had been running on the wrong Node.** Rebuilding surfaced a
version guard: the repo declares `"node": "24.x"` and the shell had **22.21**.
The previously-running build predated that guard, so nothing had ever complained.
Two `ai-assistant` suites had been failing to load — I had recorded that as an
upstream defect (U6) after stashing the tree and reproducing it at the previous
commit. The reproduction was sound and the conclusion was wrong: a control that
varies the code cannot tell you anything about the environment it holds fixed.
`isolated-vm`'s prebuild is `abi137` — which *is* Node 24. → [L21](LESSONS.md)

U6 is withdrawn. On Node 24 the gate is **22/22 tasks, 12,290 tests, zero
failures**, and that package runs 1,379 tests rather than 1,270.

**Three: I asked for permission to solve a problem I had already solved.** Having
found no Node 24 on the machine, I stopped the owner to authorise a download,
fetched 36 MB, and extracted it — next to `workspace/.toolchain/node24/`, which
had held the identical build since 3 August and which **my own runbook lists in
its second table**. Removed; the server runs on the original. → [L22](LESSONS.md)

**What changed as a result.** `local-instance.md` now opens with the Node 24
requirement and what silently breaks without it, and its "after code changes"
section says to rebuild *and restart*, force Turbo when it claims `FULL TURBO`
in two seconds, and grep `dist` to confirm the code landed before asking anyone
to look.

**The thread joining all three:** I verified artifacts adjacent to the one that
mattered. Source instead of the running process. The diff instead of the
environment. The machine instead of my own notes.

---

## 2026-08-09 — R2c: the AI approvals are recorded, and the triage that found them

**The claim I was about to write down was wrong.** R2 was going to close with a
note that the remaining eight modules needed no auditing. Before writing it I
inspected every write route instead of reasoning from module names — and found
seventeen mutating routes, nine of them in `inbox_ops`.

`inbox_ops` describes itself as an *"Email-to-ERP Agent: receives forwarded
emails, extracts action proposals using an LLM, and presents them for
human-in-the-loop approval."* That is our product's core loop, already built.
**A human approving or rejecting what a model proposed was recorded nowhere.**

The execution was audited all along — accepted actions run through the command
bus, which writes an entry with an undo token. The *decision* was not. An
investigator could see that an order was created and by whom, but not that a
machine had proposed it, nor that anyone had reviewed it.

**What changed.** Fourteen write points now record: accept, reject, reject-all
and complete (in the execution engine, next to the status transition), plus the
payload edit, recategorisation, reprocessing, settings, the outbound reply, and
both ingestion doors. The decision commits in the same transaction as the status
change it describes — if the record cannot be written, the approval does not
take effect.

**Three decisions worth keeping.**

*The verb is the point.* Recording an approval as `updated` would be true and
useless. `accepted` / `rejected` / `completed` / `failed` joined the audit
contract, and the audit projection learned to classify them — without that they
fell through to `system`, which reads as "nobody did this" and hid them from
every filter.

*Content stays where its permissions are.* No snapshot carries the extracted
payload, the description, or the message body: all of it is encrypted tenant PII.
The entry records the decision, the action type, and **the model's confidence** —
how sure the machine was about what a person went on to approve — and points at
the record for the rest.

*A failure is recorded; a success is not.* A successful execution already has its
command-bus entry. A failure had none, leaving a trail that read "approved, then
nothing" — indistinguishable from still running.

**And a platform fact that had been invisible.** An audited write must open its
transaction on the **container's** EntityManager. MikroORM creates `fork()`s with
`useContext: false`, so a transaction opened on a fork is invisible to the audit
service, which holds the container's manager — the business change would roll
back and the audit row would survive it. Nothing in the code said so;
[audited-writes.md](workspace/knowledge/audited-writes.md) does now.

---

## 2026-08-09 — R2 complete: every write that changes data is now recorded

**Audit coverage is done and guarded.** 25 write points across the four modules
whose custom routes reached neither the CRUD factory nor the command bus.
Committed as `ea35f88` (integrations, attachments, data_sync) and `a144280`
(workflows plus the coverage guard).

Where a route had no transaction, it got one. Twenty-four of the twenty-five
audit inside the transaction that performs the write, so a failed audit rolls the
change back.

**The twenty-fifth is deliberately different, and it is the interesting one.**
`workflows/instances/[id]/advance` runs activities that call external systems.
Holding a transaction across those would exhaust the connection pool and let an
`idle_in_transaction` timeout roll back a transition whose external effects had
already happened — a worse failure than a missed row. It audits afterwards and
**logs rather than throws**, because the transition succeeded and telling the
caller otherwise would be a lie.

**`integrations/credentials` carries no snapshot**, deliberately. It records
*that* credentials changed, never their values: copying secrets into a table with
different retention and different read permissions turns an audit record into a
credential leak.

**The coverage guard matters more than the wiring.** Custom routes bypass both
automatic paths, which is how sixteen modules ended up recording nothing. Wiring
fixed what existed; `audit-coverage.test.ts` stops the next route being added
silently unaudited. It asserts it found at least ten mutating routes, so it can
never pass while guarding nothing — and its mutation detection includes
service-mediated writes, because an earlier version looked only for ORM calls and
missed `integrations/credentials` entirely.

**Three scope corrections, all from inspecting rather than assuming:** `configs`
has no database writes at all (I had judged it by its name); `data_sync/validate`
only reads; and my first detector missed the single most important route in the
batch.

**Test mocks were fixed, never the routes.** Sixteen container/EM mocks across
eleven suites now model `transactional`. Degrading a route to tolerate a partial
EntityManager would have dropped the atomicity guarantee to keep a mock happy.

Gate: typecheck 20/20, lint 1/1, **test 22/22 tasks, 12,283 passed, zero
failures.**

## 2026-08-09 — R2b-factory: both audit paths now fail closed

The CRUD factory's direct-write path audited *after* its transaction had already
committed, so a failed audit could only be swallowed — throwing would have
reported failure for a change that happened. Committed as `9b0bd7c`.

`create` and `update` now audit inside `em.transactional(...)`. **`delete` had no
transaction at all** and now has one — which matters most there: after a delete
there is nothing left to describe what was removed, so losing the entry loses the
information permanently.

The helper no longer catches. An *absent* audit service is still tolerated; a
*failing write* propagates to the enclosing transaction.

**Both paths — command bus and CRUD factory — now share one rule:** a change and
the record of it commit together, or neither does.

Verified live on the rewritten delete path: creating and deleting an API key
returned 200, wrote two audit entries, and left no live key behind. Gate: 22/22
tasks, 12,280 passed.

## 2026-08-09 — R2b: a write and its audit record now commit together

**The business write and its audit entry share one transaction, and a failed
audit rolls the change back.** Committed as `a396e1d`.

Before this, `handler.execute()` committed its own transaction and `persistLog`
opened a separate one via `em.fork()`. A failure between them left a committed
change with no record — and `persistLog` swallowed its own failures, so the gap
was both possible and silent.

**The design worked because the platform was already built for it.**
`withAtomicFlush` carries a re-entrancy guard: with a transaction open on the EM
it joins rather than nesting. So the bus can own the boundary and every handler
slots inside it. `ActionLogService.log()` stopped forking — a fork gets its own
connection and its own transaction, which is exactly what made the two writes
independent.

**Fail-closed, precisely.** An *absent* `actionLogService` is still tolerated —
a downstream app may disable `audit_logs`. A *failing write* now propagates. Those
are different failures and only one means a record was lost.

**Side-effect ordering was the risk, and it is unchanged.**
`flushCrudSideEffects` still runs after the transaction commits, so events and
indexing never fire for a change that rolls back.

Five tests; one is the point — force the audit write to throw, assert the
business write is gone. Verified live too: a currencies create returned 201 with
`currencies` 10 → 11 and `action_logs` 11 → 12 in the same request.

**Not done, and now precisely scoped.** The CRUD factory's direct path still
fails open: its create/update transaction has already committed by the time the
audit write runs, and delete opens none. Throwing there would report failure for
a change that happened. Tracked as **R2b-factory**, backlog item 2.

**A third instance of one root cause, found while verifying.** A superadmin
cannot delete a currency — `mapInput` derives `organizationId` from the actor,
and a superadmin has none. That is the same shape as the two audit-scoping bugs
fixed in R2a. Recorded as **U4**, with a sweep on the backlog: *code that derives
scope from the actor breaks for the actor who has no scope*, and the superadmin
is the most privileged actor in the system.

Also today, at the owner's request: **Rule zero-four — checkpoint before anything
irreversible.** `./workspace/scripts/checkpoint.sh <label>` tags the code and
snapshots the database and `.env` — the two things git cannot restore — and
prunes to the newest five. Source files are deliberately not copied: git already
holds them, and copying would add the clutter the same instruction warned against.

## 2026-08-09 — R2a: the audit trail starts recording, and two bugs hid it

**Creating and deleting an API key is now audited and visible.** Committed as
`f75ab27`.

The CRUD factory has two write paths. Routes declaring `actions.<op>.commandId`
go through the command bus, which writes the audit entry. Routes with a plain
handler wrote nothing. The direct path already resolved the actor, the entity and
its identifiers for its side effects — everything an entry needs was present and
simply unwritten.

**Deliberately not undoable.** A command carries a reverse operation; a direct
handler does not. Rendering an undo button that cannot work would be worse than
none. Audit is a record; undo is a capability.

**Two bugs had to be fixed before any of it was visible**, and both are why the
Action Log had looked empty since the beginning:

1. Entries were scoped to the *actor's* organization. A superadmin acts with
   `orgId = null`, so they landed with no organization.
2. `api_keys` declares `orm: { orgField: null }` — its records are legitimately
   tenant-scoped. The list query filtered `organization_id = <caller's org>`,
   which hid every tenant-scoped row from everyone. That is why even the five
   entries initialisation had always written were invisible.

**Honest scope, measured after the fact.** I framed this as "one change covers
everything". It does not. It covers routes built with `makeCrudRoute` — **3 of
the 16** unaudited modules (`api_keys`, `entities`, `business_rules`) plus every
future CRUD route for free. The other 13 use custom routes that never touch the
factory. Among those, `workflows`, `configs`, `integrations`, `data_sync` and
`attachments` still record nothing, and there is no single leverage point for
them.

**The batch-T drift guard earned its keep.** Making `dashboards` a multi-line
entry in `modules.ts` broke both enabled-module parsers, which only matched the
single-line form — so `dashboards` was classified as *parked* and its 123 tests
were silently skipped. The test count fell from 12,268 to 12,145 and the guard
failed loudly. Without it, a batch would have quietly stopped testing a module we
keep.

Gate: typecheck 20/20, lint 1/1, test 22/22 tasks, **12,272 passed**.

## 2026-08-09 — R1 closed; the first half of the spike passed

**R1's defect was:** *"the kind is a string prefix re-parsed at each site — 30
files branch on it."* In enabled code, **zero do.** Adding `ai_worker` as a third
kind now costs nothing, which was the entire point.

**The spike question was: does this land in about two weeks, or metastasise into
every module?** It landed in two steps, and parking had already halved it — 18 of
the 34 sites were in code that no longer runs. That is a real signal about the
foundation: it was reshapeable.

**R1.4 deferred, with reasons.** Two items remain from the original plan and
neither is worth doing yet:

The **`principals` table** has no consumer. Principals are derived from users and
API keys and everything that needs one has it. Our own kernel design — Charters,
positions, Grant Sets — will shape its columns, so build it with its first real
consumer: an AI worker that is not a user, or **G3**, which needs stable
principal ids.

**The deprecated fields are load-bearing.** `isApiKey` has no reader left in
enabled code, but `customers`, `sales`, `staff` and `resources` read it in around
twenty places. Deleting it would not break the gate — parked source is no longer
type-checked — but it would break those modules **on restore**, adding cost to
exactly the recovery path parking exists to protect. So they stay, marked
`@deprecated`, until parked modules are restored and migrated or dropped for good.

**Also changed today, at the owner's request:** every request to verify something
in the running platform now comes with numbered steps, verified URLs, the expected
result, and the failure signature — plus an explicit note when a change is
invisible by design, which most foundation work is. Steps live in
[`how-to-test.md`](workspace/references/how-to-test.md) and are now a Rule Zero
obligation in the cookbook.

> *"I am new to the system as a whole, so I can't spot the changes after each
> stage to test."*

Asking for unguided verification put the work of designing a test onto someone
without the context to do it, and produced no signal.

## 2026-08-09 — R1.2: the branch sites are gone

Every live site that parsed the `api_key:` prefix or tested `isApiKey` now reads
the principal instead. **16 files down to 3**, and all three are the abstraction
itself: the module that owns the encoding, the `AuthContext` definition, and one
structural parameter type kept for compatibility. Committed as `9b77b70`.

The nine copies of `auth.isApiKey ? auth.userId : auth.sub` are one call.
`rbacService` tested the prefix twice per invocation and now parses once and
switches on kind. Two behavioural branches became `isMachinePrincipal(auth)`,
which says what they mean: *only people have an interactive session to reconcile*.

**Two judgement calls worth recording.**

`effectiveUserId` now derives the principal when a context does not carry one.
Cached entries, trusted envelopes and test fixtures never pass the boundary that
attaches it, and reading the field directly would have silently detached a real
user from their own preferences.

`normalizeAuthorUserId` deliberately does **not** use it. A key issued on
someone's behalf resolves to that person, but authorship is not something a
machine asserts for a human. Behaviour unchanged — R1 moves the kind into data
without changing what any call site decides.

**A latent bug fixed on the way.** The messages token route had its own copy of
the idiom that fell through to `auth.sub` for an ownerless key — putting a
prefixed key id where a user id belongs. It only ever failed the recipient
comparison, so it denied by accident rather than by design.

**Verified against a running instance, not just the suite:** human login, 44/44
backend pages, both sidebar endpoints, and — the case R1 exists for — a real API
key authenticating as a service principal, resolving its ACL through the
rewritten `rbacService` branch, and reading its owning user's sidebar preferences
through `effectiveUserId`.

One dead end, recorded so nobody re-runs it: an API key returned 401 whatever
role it had. Not a regression — `resolveApiKeyAuth` rejects a key whose
organization differs from its creator's, and the key had been created with a null
organization. Upstream behaviour, untouched by R1.

Gate: typecheck 20/20, lint 1/1, test 22/22 tasks, 12,268 passed.

## 2026-08-09 — Batch T: the gate is green, and a licence gap surfaced

**First fully green gate in this project:** typecheck 20/20, lint 1/1, build
20/20, test **22/22 tasks, 12,265 passed, zero failures**. Committed as `67b8366`.

**The planned fix was wrong, and inspection caught it.** The plan was to emit
entity ids for every module on disk, clearing 579 type errors in parked code.
Reading the code showed the registry's exclusion of parked modules is a
*deliberate compile-time guard* — it stops enabled code hard-depending on
entities whose tables no longer exist, and `attachments` demonstrates the
sanctioned alternative (`getEntityIds() as any` + optional chaining). Emitting
the ids would have destroyed a real safety property to silence an artifact.

Parked source was excluded from type-checking instead, and parked tests from the
jest run, both derived from `modules.ts` so they cannot drift.

**The honest cost: 3,472 tests across 520 suites stop running — 42% of core's
suite.** PARK now means **frozen**, not "maintained alongside everything else",
which is a change from how it was first described. A module restored after months
will need bringing up to the current contract. Recorded in
[`parked-modules.md`](workspace/references/parked-modules.md).

**A licence gap, found by the test written in this batch on its first run.**
`packages/enterprise` source was deleted back in `7f9fa5d` — but **671 files and
6 MB of build output survived**: `dist/`, `.turbo/`, `tsconfig.tsbuildinfo`.
Untracked, so never committed, yet sitting in the working tree where a container
build or archive would pick it up. The `.js.map` files carry `sourcesContent`, so
the **original commercial TypeScript was still on disk** — exactly what removing
the package was meant to prevent. Removed.

Four of the failures cleared were **pre-existing Windows portability bugs** that
had never once been seen, because every run aborted before reaching them.

**R1.3 was dropped.** Migrating 18 branch sites in parked code that is neither
compiled nor tested would be unreviewable work on code that does not run. R1.4's
exit gate is now "zero matches in enabled code", stated explicitly.

## 2026-08-08 — R1.1 lands, and the test suite runs end to end for the first time

**Batch 2 of 16 began.** R1 makes an actor's *kind* a field instead of a string
prefix. Today's step is additive: `AuthContext` now carries a `principal`
(`human | ai_worker | service | system`), and one module owns the `api_key:`
encoding so R1.4 can delete it in a single edit. Committed as `f2a53ec`.

The idiom `auth.isApiKey ? auth.userId : auth.sub` appeared **identically at nine
call sites**; `effectiveUserId()` replaces all nine. It deliberately returns
`null` — not the key id — for a service acting for nobody: personal rows keyed by
a key id can never be read back by a person.

**Parking already paid for itself.** The forensic counted 34 files branching on
the prefix. Eighteen are in parked code, leaving **16 live sites** — batch 2
halved before it started.

**Then the important finding, which is not about R1 at all.**

The full test suite has **never completed in this repo**. Turbo stops at the
first failing task, and two Windows-only failures in the Railway deploy tool
aborted every run after 7–8 of 22 packages. `core`, the largest package, was
never reached. Every "gate green" recorded before today — including the P3
baseline's "1,773 passed, 2 failed" — described a partial run as a complete one
(**L15**).

Fixed in `14acfdc`: both Railway tests made platform-correct, and `--continue`
added so one failing package can never again hide the other 21.

**First complete run: 20 of 22 tasks, 15,723 tests passed.** It exposed 10
failures across 15 suites — 10 suites from parking, 2 from the enterprise
removal, 1 from an earlier CRM cleanup, and 4 pre-existing Windows path
assertions. **None from R1**, which is the point worth recording: `shared`
(1,539) and `ai-assistant` (1,379) pass in full.

Parking also turned out to have a cost the build cannot show: the generator emits
entity modules only for *enabled* modules, so parked modules' tests lose their
generated dependencies (**L16**). Two `catalog` tests were fixed properly with
`{ virtual: true }` — they mock the module anyway and never used the real one.

Clearing the rest is now its own batch, **T**, and the plan grew from 15 batches
to 16. It blocks R1.2, because no batch may begin on a red tree — and for the
first time we can actually see whether the tree is red.

## 2026-08-08 — Phase S redesigned: park the ERP modules, do not delete them

**The owner challenged the whole stripping plan, and was right.**

> *"I am questioning whether it is riskier and takes more time to strip the
> platform from existing modules or just keep it and proceed with building… As
> long as our architectural building is in progress, what is the problem in
> keeping the rest?"*

He also observed that almost nothing had actually been deleted yet. Measured, he
was exactly right: outside the commercially-licensed `packages/enterprise`, five
files and ~2,100 lines out of 1,321,919. Every ERP module was still present.

**The evidence that settled it.** Every generated registry and the migration
runner read `resolver.loadEnabledModules()`. A module switched off in
`modules.ts` creates no tables, serves no routes or pages, registers no workers
or DI, and contributes no ACL features. **Deleting buys exactly one thing over
disabling: compile time** — about four minutes of build — in exchange for days of
per-module analysis and a permanent risk of losing something. `domain_mappings`
nearly went that way once.

Fourteen modules parked in one commit (`147c82e`). On a clean database:

| | Before | After |
|---|---|---|
| Tables | 263 | **136** |
| API paths | 428 | **244** |
| Backend pages | 67 | **44** |
| Queues watched | 42 | **26** |
| Initialisation | 91s | **38s** |

Verified in production mode: **44/44 pages return 200, zero 5xx**. Initialisation
is now warning-free — the undeclared-event and seed-mismatch warnings belonged to
the parked modules.

**One correction I had to make to my own conclusion:** two `example` endpoints
appeared to regress from 200 to 401. They had not — my second sweep sent only a
Bearer token, and those two routes read auth from cookies. With the cookie they
return 200. Same class of harness error as **L2** and **L3**.

**Costs deferred, not eliminated**, both written down in
[`parked-modules.md`](workspace/references/parked-modules.md): dormant code stays
in the repository, and dormant dependencies still appear in security audits. A
hard checkpoint before Phase K revisits this with evidence.

> **Superseded next day.** This entry claimed dormant code "still compiles". It
> does not — 579 type errors, found once a cached green was cleared. Parked code
> is now neither type-checked nor tested. See the 2026-08-09 entry above.

Also closed today: the C++ build tools. MSVC 14.44 and Windows SDK 10.0.26100 are
installed and `cpu-features` now builds — the last outstanding environment defect.

## 2026-08-08 — The platform ran for the first time, and a removal had broken it

Stopped removing modules and started the platform instead. It runs entirely on
the laptop — Postgres and Redis in Docker, the app on Node 24. No cloud needed.
Runbook: [`workspace/references/local-instance.md`](workspace/references/local-instance.md).

**Tenant initialisation failed.** An earlier commit had deleted two workflow seed
files along with the CLI commands that used them, but a library function still
loaded both by filename at runtime, and tenant setup calls it every time:

```
❌ Initialization failed: Missing workflow seed file: sales-pipeline-definition.json
```

Four commits had passed the full gate — install, typecheck, lint, test, build —
with this sitting in them. Nothing could have caught it: the reference is a
string handed to the filesystem, so there is no import to resolve and no type to
check. **A green build proves the code agrees with itself and nothing more**
(**L14**).

The deeper gap: the salvage protocol governs removing a *whole module*. Here we
had deleted files from inside a module we are **keeping**, and no protocol
covered that, so none ran.

Fixed in `a097b79` — the two seeds were sales demo data, so the calls go rather
than the files coming back. `seedWorkflowDefinition()` was kept and exported: it
lost its only caller but is domain-agnostic, and doubt resolves to keep.

**Then the platform was exercised properly.** On a clean database: 67 of 67
backend admin pages returned 200 with real rendered content, and 164 of 195 API
endpoints returned 200. Every single non-200 was traced to a missing query
parameter, a service we had not started, or an upstream bug in a module already
scheduled for removal — **one** defect in total was ours, the one above.

Two harness bugs caught along the way, both already-known patterns: guessed URLs
producing 404s that read like regressions (**L2**), and a path list carrying
Windows line endings so that all 195 requests failed identically (**L3**).

**The standing change:** boot the platform after every few removals, not at the
end of the phase.

## 2026-08-08 — Phase S begins: analysing before deleting

Started working through modules with the salvage protocol. First subject:
`customers` (173,786 lines, 25 tables) — the largest module and the most obvious
candidate for deletion.

**It is not safe to delete yet.** Three modules we are keeping reach into it:
`configs` loads its command files during upgrades, `dashboards` imports its
tables to seed demo charts, and `ai_assistant` carries 23 references. Each needs
repairing first.

Report: [`workspace/salvage/customers.md`](workspace/salvage/customers.md) —
deliberately marked **incomplete**. Three of the seven questions are unanswered,
so under our own rule it cannot authorise a deletion.

Two near-misses along the way, both now in `LESSONS.md` (L2, L3): a grep count
that looked like deep entanglement but was mostly test fixtures, and a broken
script that returned identical numbers for nine different modules.

## 2026-08-08 — Baseline verified: the platform is healthy

Ran the full gate on the untouched codebase. **This was the verification never
performed during the assessment** — the verdict carried it as its largest open
risk.

| Check | Result |
|---|---|
| Install | ✅ 1,581 packages |
| Build | ✅ 93 generated files |
| Type-check | ✅ 21/21, zero errors |
| Lint | ✅ 0 errors, 12 warnings |
| Tests | ⚠️ 1,773 passed, 2 failed — both Windows-only, both in code being removed |

Record: [`workspace/salvage/P3-baseline.md`](workspace/salvage/P3-baseline.md).

**The risk is closed.** Nothing here reopens the platform decision.

Also found: lint covers only 1 of 25 packages — their quality gate is far
narrower than it looks. Type-checking does cover everything, which matters more,
but we should extend lint to packages we keep.

## 2026-08-08 — Environment: Node 24, and a correction

Set up the toolchain. Initially proceeded on Node 22 while the project declares
Node 24, reasoning that Yarn only warned about it.

**The owner challenged this, correctly.** Running the baseline on a version the
authors never targeted would have measured our laptop rather than the platform.
Downloaded Node 24.19.0 (checksum verified), installed it *inside* the workspace
so the system Node is untouched, wiped the partial install and started again.

Also deferred — by decision, not neglect — a native component that needs a C++
compiler. Recorded as a **required** step of the Phase S reinstall.
See `LESSONS.md` L6.

## 2026-08-08 — Decision: hard fork

> *"Our platform will have a life of its own. We will change it too much to be
> able to update from theirs."*

We take Open Mercato and never merge from it again. This is what makes the six
planned repairs possible — they rewrite the identity and permission core, which
no amount of rebasing would survive.

The cost, written down so it is not forgotten: **nobody will tell us when they
patch a security hole.**

## 2026-08-08 — Decision: Open Mercato is the host, Platform 1 is a donor

Two platforms assessed with the same method. The decision turned on a criterion
introduced *after* the first assessment — how well a platform **receives** grafted
code — so Platform 1 was scored retroactively on it.

| | Platform 1 | Open Mercato |
|---|---|---|
| Rubric | 1.86 | **3.55** |
| Host-fitness | 2.25 | **4.25** |
| What is built | a permission resolver and an org graph | an entire working platform |

Neither is a governance kernel; both need ours built on top. The question was
*"cheaper to add a kernel to a working platform, or a platform to a working
kernel?"* — and the second is years of work we never wanted to do.

Platform 1 keeps a real edge in exactly one area — the **authority model** — and
contributes eight concentrated pieces: the layered resolver with its explanation
trace, typed org edges with ceilings, delegations, project-level overlays, record
locks, event visibility, locale direction policy, and a migration lock.

Plan: [`compai/planning/08-host-selection-and-migration-plan.md`](compai/planning/08-host-selection-and-migration-plan.md)

## 2026-08-08 — Assessment 2: Open Mercato

1.32 million lines — 43× the first candidate. Required a new discipline: separate
the **framework** (read in full) from the **product** (sampled against a keep/skip
list written *before* reading).

Found a genuine AI governance layer: approve-first gates with field-level diffs,
an ordered narrow-only mutation policy, model allowlists, per-turn budget
enforcement, cost attributed down to the step, and working undo/redo across 70
commands.

Three of my own findings were corrected during the assessment — all cases of
declaring something absent using our vocabulary instead of theirs (`LESSONS.md`
L7).

Also: `packages/enterprise` is commercially licensed and excluded entirely.

## 2026-08-08 — Assessment 1: Graph Portal Platform

Our own earlier codebase. Verdict **EVOLVE**: a good permission kernel with an
explanation trace, a typed portal graph, and working delegations — but **zero
AI**, despite being called an AI-first framework. A repo-wide search for `agent`,
`charter` or `ai_worker` returned nothing.

A second forensic pass overturned three things the first pass had credited it
with (`LESSONS.md` L8) — the origin of the rule that a schema is not a behaviour.

## 2026-08-08 — Method: how we assess a platform

Wrote the assessment methodology from the first assessment's mistakes: seven
batches, sixteen probes, the host/donor distinction, and the **blast-radius
test** — a flaw that fails the screen is only fatal if it is *diffused*.

That test alone separated EVOLVE from REFERENCE on the first platform.

## 2026-08-08 — Design: the four concepts

Turned the brainstorming into architecture: task grades and the autonomy ladder ·
the Worker Charter (an AI worker's "CV", compiled into runtime permissions) ·
knowledge hashtags as the human syntax of a machine-readable context graph ·
@mentions as universal addressing that carries authority but never amplifies it.

Fifteen invariants that everything else must respect:
[`compai/planning/00-product-thesis.md`](compai/planning/00-product-thesis.md).

## Earlier — where the idea came from

Three brainstorming documents: a comparison of two AI-agent workplace systems, a
survey of permissively-licensed building blocks, and a functional specification
of the product written as though we would build all of it ourselves.

[`compai/brainstorming/`](compai/brainstorming/)

---

## Keeping this file

Add an entry whenever a **decision** is made, a **phase** completes, or something
**surprising** is found. Not for routine progress — that is what the salvage
reports and batch reports are for.

Each entry: what happened, why, and what it changed.
