# Lessons

**Mistakes made on this project, how they were caught, and what to do instead.**

Read before starting work. Every one of these was made by someone competent who
had a reason at the time — that is precisely why they are worth writing down.

Add to this file whenever something is caught. A near-miss counts.

---

## L1 — A confident label is not an inspection

**What happened.** `customer_accounts` was on the delete list, described as
"customer-facing identity, part of the CRM chain". It contains `domain_mappings`
— unique hostname per tenant with a database constraint. **That is per-company
custom domains, a platform feature we want.**

**How it was caught.** The owner asked a question about it. Not by any method.

**Cost if missed.** A working feature silently deleted, rediscovered months later
as "we need to build custom domains".

**What to do instead.** The
[salvage protocol](workspace/references/salvage-analysis.md) is now mandatory and
blocking before any deletion. Its first question is the one that catches this:
*for each table a module owns, is this a business record, or is it configuration,
infrastructure, identity, routing or policy?*

**The general form:** *"this module is obviously about X, so it contains only X"*
is false in any mature codebase. Modules accumulate infrastructure that happened
to be needed there.

---

## L2 — A grep count is not a finding

**What happened.** Counting references from kept modules into `customers` gave
alarming numbers: `ai_assistant` 362, `auth` 86, `inbox_ops` 52. It looked like
deep entanglement that would block removal.

**Reality.** Almost all were **test fixtures and documentation examples** —
`customers.people.view` is the example feature id used throughout the codebase to
explain how permissions work. Real count excluding tests: 23, 1, 4.

**What to do instead.** A count tells you where to look. Then **go and read the
actual lines** before recording anything. Exclude `__tests__`, `.test.`, `.spec.`
and comments before quoting a number.

---

## L3 — Verify the tool before trusting the measurement

**What happened.** The script written to correct L2 returned exactly `21` for all
nine modules. A path-resolution bug meant it measured the same directory nine
times.

**How it was caught.** The uniformity looked wrong. Nine different modules do not
have identical counts.

**Cost if missed.** Nine false findings in a permanent document.

**What to do instead.** When a measurement looks too uniform, too round, or too
convenient, **test the tool on a case where you already know the answer**.

---

## L4 — Never pipe build commands through a pager

**What happened.** `corepack yarn typecheck 2>&1 | tail -50` reported **exit code
0**. That was `tail`'s exit code. The type-check had actually **failed**.

**Cost if missed.** A green baseline recorded for a red build — the exact
opposite of the truth, in the document everything else is measured against.

**What to do instead.** Never pipe a command whose success matters. Capture full
output and read it. If output must be trimmed, capture the exit code separately
first.

---

## L5 — Run the steps in the project's own order

**What happened.** Type-check was run on a fresh checkout and failed with
`Cannot find module '#generated/entities.ids.generated'`. It looked like the
platform was broken.

**Reality.** The project's build script is
`build:packages → generate → build:packages → build:app`. **`generate` creates
those files.** Type-checking before it cannot succeed.

**Cost if missed.** Reporting "this platform fails to type-check on a clean
checkout" — a false finding that would have counted against a platform we had
just chosen.

**What to do instead.** Read the project's own `build` script and follow its
order. Its authors already solved this.

---

## L6 — Do not accept a degraded state on your own authority

**What happened.** A native component (`cpu-features`) failed to build for want
of a C++ compiler. It was reported as "almost certainly harmless — I'll only
chase it if something breaks", and work continued.

**Why that was wrong.** It was a quality decision taken without asking. The owner
could simply install the compiler — and did.

**What to do instead.** When something fails: report **what it is, what is lost,
what the fix costs, and a recommendation** — then let the owner decide. Deferring
is often right; deferring *silently* is not.

**How to defer safely:** write it into the plan as a **required** step of a
future batch, never as a note that might be forgotten.

---

## L7 — Judge a concept absent only in the target's vocabulary

**What happened.** During assessment, three capabilities were recorded as absent
that were in fact present:

| Recorded absent | Reality |
|---|---|
| AI cost budgets | Present — they call it **token usage**, tracked per agent, module, session and step |
| Scoped model policy | Present — a two-level allowlist in the database; env vars only set defaults |
| Capability metadata | Richer than recorded — features also carry `dependsOn` |

**Root cause.** Each was inferred from *our* word for the thing, or from a single
file, without checking the data model.

**What to do instead.** Before declaring anything absent: search **two or three
words the target might use**, and check **entity/table names** — the most reliable
vocabulary index a codebase has. A false absence is worse than a false presence:
it silently removes a candidate's best feature from the comparison.

---

## L8 — A schema is not a behaviour

**What happened.** A codebase was credited with transactional audit and
correlated event tracing because the *types and columns* were there. Neither was
real: audit ran in a separate transaction, and every correlation id was a fresh
random value never reused.

**What to do instead.** A field's existence proves intent, not behaviour. **Grep
where it is assigned**, not where it is declared. Trace one complete path before
crediting a property.

---

## L9 — Trustworthiness is per document, not per folder

**What happened.** One platform's README was accurate and admirably honest about
its own gaps. A document **in the same folder, of the same vintage** listed
Garage, Assets Store, AI Studio and several routes as "Shipped" — none of which
existed anywhere in the source.

**What to do instead.** Verify claims from several documents before trusting any
of them. Never generalise from one good document to a folder, a project, or a
date.

---

## L10 — Report the whole picture, not the first red flag

Adopted from the sibling project's **`skills-main`** skills tree — an external folder
(`konsult/aikonsult/suplimentery/skills-main`), not a path inside this repository: *"A red signal does not short-circuit
the review… one review cycle gives the author the failing check, the conflict,
and every code finding at once, rather than the cheapest red flag first and
another cycle to discover the rest."*

**In practice:** when a batch hits a blocker, finish analysing the batch and
report everything together. A partial picture costs another whole cycle.

---

## L11 — `import type` is a dependency that breaks the build, not the app

**What happened.** `query_index` imports `ProgressService` from the `progress`
module using `import type`. TypeScript **erases** those at compile time, so the
code runs perfectly with `progress` deleted — the runtime resolve is guarded and
simply disables the feature.

**But `yarn typecheck` fails**, because the type no longer resolves.

**Why this is a trap.** A type-only dependency:

- is invisible to any runtime probe — nothing imports it when the code executes;
- **breaks the build**, so it surfaces late and looks unrelated to the deletion;
- is easy to dismiss as "just a type" when you see it in a grep.

**What to do instead.** When analysing a module for removal, grep specifically
for `^import type.*modules/<name>` in the modules you are keeping — separately
from ordinary imports. Checked across the whole delete list on this project:
only one exists today. The next codebase may have many.

---

## L12 — Do not describe a thing before you have read it

**What happened.** The attic catalogue was written *ahead* of the salvage
analyses, so it could not fall behind the removals. Sound reasoning — but entries
were written from module **names and sizes**, and two were simply wrong:

| Catalogued as | Actually |
|---|---|
| `onboarding` — "onboarding request flows" | **Self-service sign-up and tenant provisioning** — the platform's front door |
| `content` — "a small content-management module" | The **privacy and terms pages**. No CMS, no entities, no editor |

Both were then reclassified from *remove* to *keep*.

**Why it matters.** The catalogue's whole purpose is to let someone months from
now ask *"did we already build this?"* A wrong entry answers **no** to a question
whose true answer is **yes** — the most expensive failure that document can have.

**What to do instead.** Write the catalogue entry **after** the analysis, from the
code. If an entry must exist earlier, mark it **UNVERIFIED** so nobody trusts it.

This is L1 in a new costume: a confident label doing the work of an inspection.
The first time it nearly deleted custom domains; this time it nearly deleted
tenant provisioning.

---

## L13 — A module-shaped analysis misses packaging-shaped dependencies

**What happened.** The plan for removing `packages/enterprise` listed three steps:
unregister it in `modules.ts`, unregister it in the create-app template, delete
the directory. All three were done. **The install then failed immediately:**

```
Error: @open-mercato/enterprise@workspace:*: Workspace not found
```

`apps/mercato/package.json` still declared it as a workspace dependency — a
fourth step nobody had written down.

**Why it was missed.** The salvage protocol looks at *module-system* surfaces:
registrations, imports, generated registries, ACL features, events, migrations.
A Yarn workspace dependency is none of those. It lives in a `package.json` the
module analysis never opens.

**What to do instead.** When removing anything that is its own **package**
(not just a module inside one), check the consuming app's `package.json` too.
The corrected four-step checklist is in
[`workspace/references/strip-batches.md`](workspace/references/strip-batches.md).

**The general form:** an analysis framed around one system (modules) will not see
dependencies expressed in another system (packaging, build config, CI, container
images, infrastructure). Ask explicitly: *what other systems know this thing's
name?*

---

## L14 — A green build is not a working platform

**What happened.** Four commits of removals all passed the full gate — install,
typecheck, lint, test, build. The first time we actually *started* the platform,
tenant initialisation died:

```
❌ Initialization failed: Missing workflow seed file: sales-pipeline-definition.json
```

Commit `a423050` deleted two seed JSON files along with the CLI commands that
used them. But `workflows/lib/seeds.ts` also loaded them — by **filename, at
runtime**, inside `seedExampleWorkflows()`, which `setup.ts` calls during every
tenant init.

**Why every check missed it.** The reference is a string passed to
`fs.existsSync`. There is no import to resolve, no type to check, no registry
entry to regenerate. TypeScript cannot see it; the generator cannot see it; lint
cannot see it. Only executing the code finds it.

**The second gap: nothing governed this deletion at all.** The salvage protocol
is written for removing a **whole module** — it asks who imports it, what
declares it in `requires`, what it contributes to shared surfaces. Here we
deleted *files from inside a module we are keeping*. No protocol covered that, so
none ran.

**What to do instead.**

1. **Run the platform, not just the build.** Boot and click through after every
   few removals — not at the end of the phase. Runbook:
   [`workspace/references/local-instance.md`](workspace/references/local-instance.md).
2. **Deleting a data file is deleting an interface.** Before removing a JSON,
   SQL, template or fixture asset, grep for its **bare filename** across the
   repo, not for imports of it.
3. **Removing files from inside a kept module needs its own check** — at minimum
   Q2 (who references it) and Q6 (string references) from the salvage protocol.

**The general form:** *static analysis proves the code is consistent with itself;
it says nothing about the code's agreement with data on disk.* Anything referenced
by name at runtime — files, env vars, queue names, table names, feature ids — is
invisible to the compiler and must be checked by running the thing.

---

## L15 — "The gate is green" can mean "the gate never got there"

**What happened.** Three commits were reported with a green gate. Running the
full suite properly afterwards found three real failures — in `core` and
`content` — that had been sitting there the whole time.

They were never *seen* because **Turbo stops at the first failing task.** The
two known Windows-only `cli` failures aborted every run after 7 or 8 of 22
packages. Everything downstream — including `core`, the largest package — was
never executed. The P3 baseline's "1,773 passed, 2 failed" was a partial run
described as if it were complete.

**The compounding error.** A wrapper written as

```bash
corepack yarn test > log 2>&1; echo "EXIT=$?" >> log
```

reports the exit code of `echo`, not of `yarn`. The harness duly announced
"completed (exit code 0)" for a run that had failed. This is **L4 wearing a
different hat** — the failure is not piping through `tail` specifically, it is
*reading a status that belongs to a different command.* Capture it as

```bash
{ corepack yarn test > log 2>&1; echo $? > log.rc; }
```

**What to do instead.**

1. **Report coverage with the result.** Not "tests pass" but *"14 of 22 packages
   ran; 3,538 tests passed."* A pass count without a denominator hides an
   aborted run.
2. **Check `Tasks: N successful, M total`.** If `N < M`, the run is incomplete
   and the result is not a gate.
3. **Never infer success from the absence of visible errors** — that is the
   original sin behind half of these lessons.

**The same trap, third form: a cached green.** The gate after parking reported
`typecheck EXIT: 0 — 19 cached, 20 total`. Turbo had served a cached result from
before the generated files changed. The true state was **579 type errors**. When
a result decides whether work may proceed, read the cache line: `Cached: N` on
the task you just changed the inputs of means the tool did not look.

**The general form:** *a status is only evidence if it came from the run you
think it did.* A short-circuiting runner, a cached task and `$?` after the wrong
command all fail the same way — they hand you a true statement about something
else.

---

## L16 — Parking has a cost the build does not show: generated artifacts

**What happened.** Parked modules still compile, so typecheck and build stayed
green. But the generator only emits entity modules for **enabled** modules, so
two `catalog` tests could not resolve `#generated/entities/catalog_product_variant`
and the suite failed to run.

**Why this was not predicted.** The parking analysis reasoned about what a
disabled module *stops doing* — no routes, no tables, no workers. It did not ask
what other things stop being *produced for it*. Generated output is a second
system that also keys off the enabled list.

**The fix was not to skip the tests.** Both files already replaced the module
with `jest.mock(..., () => ({}))` — they never used the real one. Adding
`{ virtual: true }` states exactly that: this module may not exist on disk, here
is the stub. No assertion weakened, no test skipped.

**What to check when parking anything:** does any retained code import a
*generated* artifact of the parked module? `grep "#generated/entities/<name>"`.
Source files resolve through TypeScript path mapping and stay green; only the
test runner's resolver notices.

**The general form:** this is **L13** again — *ask what other systems know this
thing's name.* There, packaging. Here, code generation. The list of systems is
longer than it looks: modules, packaging, build config, codegen, CI, containers.

---

## L17 — Before removing an obstacle, ask whether it is a guard

**What happened.** Parked code produced 579 type errors because the generated
entity-id registry covers **enabled** modules only. The recorded fix — written
into the plan, and reported to the owner as a recommendation — was to make the
generator emit ids for every module on disk. It would have worked, and it would
have been wrong.

**What inspection found.** That exclusion is deliberate. It is a **compile-time
guard**: with `catalog` parked, `E.catalog.catalog_product` fails to compile, so
enabled code cannot take a hard dependency on entities whose tables no longer
exist. Code that must work either way already has a sanctioned form —
`getEntityIds() as any` plus `E.catalog?.…` — which `attachments` uses and which
type-checks fine.

Emitting the ids would have silenced an artifact by **deleting a safety
property**, and nothing would have failed until a runtime query hit a missing
table in production.

**How it was caught.** By reading the enabled code that referenced parked entity
ids, to check whether the guard was doing anything — rather than treating 579
errors as noise to be suppressed. The question that did it: *does anything depend
on this restriction existing?*

**What to do instead.** When something blocks you and the obvious fix is to
relax it, establish first **why it is there**:

- Does any code rely on the restriction holding?
- Is there already a sanctioned way to opt out? Its existence is strong evidence
  the restriction is deliberate.
- What fails, and how loudly, if the restriction goes?

Then choose. Here the answer was to narrow the *scope of checking* (exclude code
that does not run) rather than weaken the *rule* (emit ids that should not exist).

**The general form:** *an error is not always a problem to be removed; sometimes
it is a mechanism working.* The volume of an error says nothing about whether it
should be silenced — 579 identical errors were one guard firing 579 times.

---

## L18 — Disabling a thing does not disable what others say about it

**What happened.** Fourteen ERP modules were parked, and the platform was
verified: 44/44 pages, no server errors. The owner then opened the dashboard and
saw a red *"Failed to load new customers data"*.

The `dashboards` module is **enabled** and ships **ten** analytics widgets that
read `sales` and `customers` data. Parking those modules removed their routes,
tables and workers — but not the widgets a *different* module ships **about**
them. The widget lives in kept code; only its feature requirements point at the
parked module.

**Why the verification missed it.** The page sweep asked *"does this URL return
200?"* The dashboard did. The failure was inside a widget panel, rendered
client-side after load. **An HTTP status is not a rendered page.**

**What to check when disabling anything:** not only what it provides, but what
*other* enabled things provide about it — widgets, response enrichers, menu
entries, subscribers, dashboard tiles, saved layouts.

**A second lesson inside the fix.** The first override attempt used the widget's
`id` where the registry matches on `entry.key` — different strings. It silently
did nothing, and the page HTML still contained both "Customer Growth" and "Failed
to load", which I nearly read as "the fix did not work" without knowing why. The
server log said exactly what was wrong:

```text
label=widgets.dashboard key=dashboards.analytics.aovKpi
msg="Override did not match any registered entry — override skipped"
```

**Read the application's own diagnostics before theorising.** A well-built
platform usually tells you; this one did, on the first run.

**The general form:** *scope boundaries are asymmetric.* Turning something off
removes what it pushes outward, never what others have already pulled inward.

---

## L19 — A module's name describes its subject, not its behaviour

**What happened.** Twice in two batches I classified a module from its name.
`configs` "obviously" wrote configuration — its write routes touch no database at
all. `inbox_ops` sounded like mail plumbing — it is the human-in-the-loop
approval of LLM-generated proposals, the single most product-relevant module in
the codebase, and it recorded none of its decisions.

The second one nearly cost more: I was one sentence away from writing down that
the remaining modules needed no auditing. The inspection that overturned it took
about ten minutes.

**Why it happens.** A name is a summary written by someone else for a different
purpose. It compresses. What it drops is exactly what you need when the question
is "does this write anything, and does anyone need to know."

**The rule.** *Before recording that something needs nothing, enumerate what it
actually does.* Grep for write handlers and mutation signals; read what survives.
A negative finding is a claim like any other, and costs the same to verify as a
positive one.

**The general form:** the effort saved by not looking is borrowed, not saved.

---

## L20 — The running app serves `dist`, so source edits are invisible until you build

**What happened.** R2c passed its tests, typechecked, and committed. I then asked
for a UI check. The change did not appear — because the app loads
`packages/core/**dist**`, the compiled output, and the running server was a
**production build** started eighteen hours earlier. My source edits had never
reached the process serving the page.

The settings row's `updated_at` moved, which made it look like the route had run
the new code. It had run the *old* code, which updates the same row.

**Why it fooled me.** Every check I ran was against source: `tsc` reads source,
`jest` reads source, the coverage guard greps source. Not one of them touches
what the server executes. A green gate says the source is right; it says nothing
about what is running.

**The rule.** *Before asking anyone to look at a running system, rebuild it and
restart it.* `yarn build:packages && yarn build:app`, then restart. And when the
answer is "no change visible", check what the process is serving **before**
debugging the code.

**The general form:** verifying an artifact tells you nothing about a different
artifact, however closely related. Source is not `dist`; `dist` is not the
running process.

---

## L21 — A control that holds the mistake fixed proves nothing

**What happened.** Two test suites failed to load. I stashed the entire working
tree, reproduced the failure at the previous commit, and concluded it was not
mine — recording it as an upstream issue (U6).

The reproduction was sound and the conclusion was wrong. The repo requires **Node
24**; my shell had **Node 22**. The "missing" native binary was `abi137`, which
*is* Node 24. Both runs — before and after the stash — used the same wrong
runtime, so the control varied the code and held the actual cause constant.

**Why it happens.** A control answers exactly one question: *does the thing I
changed cause this?* It is silent about everything it holds fixed. The
environment is the easiest thing to hold fixed without noticing, because it is
not in the diff.

**The rule.** *When a failure looks environmental, check the environment against
what the project declares* — `engines`, `.nvmrc`, the lockfile's platform — before
building a case that it is somebody else's problem. One line of `package.json`
would have ended it.

**And a second-order one:** every gate result recorded before this was measured
on an unsupported runtime. When you find the environment was wrong, the past
results are not merely suspect — they measured a different system.

---

## L22 — I did not read my own runbook, and asked the user to authorise a fix I already had

**What happened.** Having found that the repo needs Node 24 and the machine's
default is Node 22, I checked for `nvm`, `fnm`, Volta and `Program Files`, found
nothing, stopped the user to authorise a download, fetched 36 MB from nodejs.org,
verified the checksum, and extracted it.

`workspace/.toolchain/node24/` had held the identical build — v24.19.0, ABI 137 —
since 3 August. **`local-instance.md` lists it in the "What you need once"
table**, three lines into the file I wrote to prevent exactly this.

**Why it happened.** The runbook is written for *setup*. This did not present as
setup — it presented as a mid-batch failure, and I searched the machine the way
you would search an unknown machine. I looked outward for something I had already
written down.

**The rule.** *When the environment surprises you, read the runbook before you
search the system.* The whole point of rule zero — every batch updates
`INDEX.md`, `JOURNAL.md`, `LESSONS.md` — is that the answer is written down; it
is worthless if I only consult it when I think to.

Concretely, before any "how do I get X on this machine" question:
`grep -i X workspace/references/local-instance.md`.

**The cost this time was small** — a redundant download, since removed, and a
question the user should never have been asked. The cost of the habit is not
small: I interrupted the user to decide something my own documentation had
already decided, which spends their attention and their trust in the docs.

**The general form:** documentation you do not read is indistinguishable from
documentation you never wrote.

---

## L23 — Do not test an irreversible guarantee by triggering it on real infrastructure

**What happened.** To prove the ledger's append-only trigger was real, I inserted
a probe row and tried to `UPDATE`, `DELETE` and `TRUNCATE` it. All three were
correctly refused — including the delete of my own probe.

The probe row was now permanent, at sequence 999, in a live tenant's chain. The
first real verification would have reported a sequence gap forever. The table
happened to hold no real events, so resetting it cost nothing. A day later it
would have been unrecoverable by design.

**Why it happens.** Testing a guarantee usually means creating the condition it
protects against. When the guarantee is *irreversibility*, creating that condition
is itself irreversible — the test cannot be cleaned up, because cleanup is the
thing being prevented.

**The rule.** *Before exercising an irreversible mechanism, ask what state the
test leaves behind and whether you can live with it.* Use a scratch tenant, a
scratch database, or a transaction you roll back — the probe only needs to prove
the trigger fires, and `begin; insert; update; rollback;` proves exactly that
while leaving nothing.

**The general form:** a test that cannot be undone is not a test, it is a change.

---

## L24 — Never re-parse what you only need to append to

**What happened.** Adding a `capability` block to 76 permission declarations, I
wrote a rewriter that took each entry apart — split the body on commas, trimmed
the parts, reassembled them with the new field. It split inside
`title: 'Create, edit, and delete business rules'` and corrupted five files.

The typecheck caught it immediately and `git checkout` undid it, so the cost was
ten minutes. The cost if those files had been generated rather than tracked, or
if the corruption had been subtler than a syntax error, would not have been ten
minutes.

**Why it happens.** "Insert a field into this object literal" *feels* like a
parsing problem, so you reach for a parser you can write in one line. Splitting on
commas is a parser — a wrong one, which is fine right up until a value contains
the delimiter.

**The rule.** *Match the smallest edit to the smallest operation.* Appending a
field needs the position of the closing brace, nothing more. It does not need to
know what the other fields are, so it should not look. Use a real parser when you
genuinely need structure; use an anchor when you only need a place.

**The general form:** every piece of a file you take apart is a piece you can put
back wrong.

---

## L25 — Running a package's tests from the repo root is not running them

**What happened.** Two tests failed, deterministically, in a suite I had not
touched. The error was `ENOENT: no such file or directory,
open '<repo root>/src/modules/workflows/components/EdgeEditDialog.tsx'` — a path
that has never existed.

The tests resolve files from `process.cwd()`. Turbo runs each package's suite
**in that package's directory**, so `src/modules/...` means
`packages/core/src/modules/...`. I had been running
`npx jest --config packages/core/jest.config.cjs` from the repo root, where the
same relative path means something else entirely.

Nothing was broken. My runner was standing in the wrong place.

**Why it happens.** Pointing jest at a package's config *looks* like running that
package's tests, and for most tests it is — every assertion that touches only
imported modules behaves identically. Only the ones that read the filesystem
notice, which is a small enough minority to look like a real regression rather
than a setup difference.

**The rule.** *Run the suite the way the project runs it.* `corepack yarn test`
for the gate; a direct `npx jest` invocation is a convenience for one file, and
its results are only comparable when nothing in that file touches `cwd`.

Corollary: when a test fails with a path that does not exist, suspect the working
directory before suspecting the code.

**The general form:** a tool invoked differently is a different tool. This is L20
again — source is not `dist`, the running process is not the source — wearing the
runner's clothes.

---

## L26 — A killed command's children keep writing to the log you are about to read

**What happened.** A loop of three gate runs hit the ten-minute tool timeout and
was killed part-way through the second. I relaunched the remaining runs, and they
wrote to the same log filenames.

The orphaned run had not stopped. It kept writing, so one log ended up holding
**two** turbo summaries — one clean 22/22, one 19/22 with three tasks "failed".
Those three had not failed; they had been killed with the shell that started
them. Read quickly, that log says the gate is flaky. It says nothing of the kind.

**Why it happens.** Killing a shell does not reliably kill its grandchildren, and
a redirect target is not owned by the process that opened it. The log looks like
one run's output because logs usually are.

**The rule.** *After a timeout, treat every artifact that run was writing as
contaminated.* Use a fresh filename for the retry, and when a result looks
anomalous, count the summaries in the file before believing any of them — two
summaries means two runs.

**The tell worth remembering:** tasks reported as failed with **zero** failing
assertions underneath. A real failure names something; a killed one just stops.

---

## L27 — A rule written for one kind of actor will be applied to all of them unless you say otherwise

**What happened.** The autonomy matrix answers *how much may this be done
unattended*, and every one of its gates is phrased about a worker: "the worker
produces a proposal", "the worker prepares the act". I implemented it as a
property of the **act**, applying to whoever performed it.

The result passed 27 tests and read perfectly. On its first hour of real traffic
it demanded a review queue for a person changing their own sidebar layout, and a
second person's approval to edit a dictionary — 45 of 45 observed human actions
acquired an obligation.

**Why it happens.** A table indexed by *act* and *situation* looks complete. The
actor is not one of its axes, so nothing in the table prompts the question "who
is this for?" — the omission is invisible precisely because the table looks
total.

**The rule.** *When a rule comes from a document about one kind of actor, write
down which actors it binds — in the code, at the point it applies.* If the answer
is "all of them", that is a decision worth one sentence. If it is not, the
sentence is what stops the next reader re-broadening it.

**What saved it** was measuring before enforcing. The design error was invisible
to unit tests, because every test I wrote encoded the same misreading. Only real
traffic disagreed.

**The general form:** tests written from a misunderstanding confirm the
misunderstanding. A measurement against reality is the only thing that does not.

---

## L28 — A tool that filters the environment will filter yours without saying so

**What happened.** `OM_LOG_LEVEL=debug corepack yarn start` produced no debug
output. The logger read the variable correctly, the shell exported it correctly,
and the app never saw it: Turbo runs each task in a **filtered environment**, and
anything not declared in `globalEnv` / `globalPassThroughEnv` / the task's `env`
is dropped with no warning.

It cost a diagnostic at the moment I needed one — I was trying to prove the
shadow resolver was still running, could not, and had to fall back to inspecting
the build.

**Why it happens.** Every layer between the shell and the process looks like a
passthrough. `yarn` passes the environment, `node` passes the environment, so the
mental model is that environment variables simply arrive. A tool that *filters*
by default breaks that model silently, because a missing variable is
indistinguishable from a variable set to nothing.

**The rule.** *When a flag appears to do nothing, prove it arrived before
debugging what it does.* One log line, one `process.env` dump, one grep of the
output at the level you asked for. And when adding a runtime flag to a repo with
a task runner, declare it in the runner's config in the same commit — otherwise
it works for whoever wrote it and for nobody else.

**The general form:** this is L20 and L25 again — the source is not the running
process, the runner is not the shell. Each layer between what you typed and what
executed is a place the thing you typed can disappear.

---


> **It bit again, 2026-08-10.** Diagnosing why a gate never fired, I ran
> `OM_LOG_LEVEL=debug corepack yarn start` and got no debug output — and read the
> silence as "the interceptor never ran". It had run; the level had not reached
> the app. Putting `OM_LOG_LEVEL=debug` in `apps/mercato/.env`, which dotenv
> loads directly, produced the lines immediately and named the real defect in one
> read.
>
> The rule earned a second half: **when a diagnostic produces nothing, prove the
> diagnostic works before believing the nothing.** An empty log is evidence of an
> empty log. ([[L3]] says the same about tools; this is the environment-shaped
> version of it, and I have now paid for it twice.)
## L29 — A dry run is a claim you can check; read its numbers against what you know

**What happened.** The `actor_kind` backfill printed its plan before writing:
5 rows inferrable as `system`, 0 as `service`, **15 that "cannot be determined"**.

Fifteen undeterminable actors on an instance with exactly one admin user is not a
plausible number, and the implausibility was the finding. The query was correct;
the *limitation I had asserted in a comment* was wrong. Matching the `users`
table identifies a human exactly as soundly as matching `api_keys` identifies a
key — the same inference in the opposite direction, which I had talked myself out
of while writing the doc comment.

With it, all twenty rows resolved and none were guessed.

**What it would have cost.** Applied without the dry run, it would have succeeded,
reported nothing wrong, and left every historical human action permanently
unattributed — in the audit trail, the one place whose whole purpose is being
recoverable after the fact.

**The rule.** *Make data migrations dry-run by default, print a breakdown, and
check the numbers against something you independently know about the data.* One
admin means roughly one distinct human actor. A count that disagrees with a fact
you already hold is the cheapest bug report you will ever get.

**And the second-order one:** a limitation written confidently in a comment is
still an unverified claim. I had documented the constraint before testing whether
it existed, and the documentation then made it feel settled.

---

## L30 — A reproduction you built yourself is a hypothesis, not evidence

**What happened.** I set out to confirm that U3 — "an API key is rejected at use
time" — was an instance of the U4 scoping pattern. I reproduced it twice, traced
it to a comparison in the authentication path, wrote a fix, wrote tests, and
wrote three documents explaining it.

Every 401 was my own request. `extractApiKey` accepts `X-Api-Key` or
`Authorization: ApiKey`. I sent `Authorization: Bearer` — the reflex — and read
the resulting 401 as the defect I was expecting to find. Sent correctly, the key
returns 200.

Then, testing the mechanism I had "found", I nulled a never-used key's
organization so the comparison I had blamed would have to reject it. It returned
200 as well. The branch I built a fix around does not fire, and I still do not
know why.

**Why it happens.** I went looking for a specific bug. A 401 is consistent with
that bug, so the first 401 confirmed it — and once confirmed, everything after
was elaboration rather than investigation. A reproduction built to demonstrate a
hypothesis will demonstrate it.

**The rule.** *Before treating a reproduction as evidence, establish the
negative case.* One request that should **succeed** — a known-good credential, a
known-good header — costs seconds and would have ended this in the first minute.
I never made a single API-key request I expected to work.

**And the second half:** I reverted the fix. It changed which organization a new
key belongs to, on the strength of a defect I could not demonstrate. Keeping a
behaviour change that no evidence supports is the same mistake as keeping a
bandage, pointed the other way — and it is harder to notice, because it looks
like diligence.

**The general form:** confirmation is cheap and disconfirmation is what costs.
Spend the seconds.

> **Correction, 2026-08-10.** The header mistake was real and the rule above
> stands. The conclusion I drew from it did not: **U3 is a real defect and it
> reproduces.** A key created through the ordinary UI flow came out with a null
> organization while its creator had one, returned 401 on first use, and
> returned 200 after changing that single column. The fix I reverted was the
> right fix; it is restored, with tests and an end-to-end verification.
>
> Why the second experiment misled me: I nulled a key's organization and expected
> a rejection, but the comparison is against *the creator's* organization, and at
> that moment the fix I had just written was in the build — so the key and its
> creator agreed and the request correctly returned 200. I read a passing check
> as an absent one.
>
> This is [[L32]]: a bad reproduction disproves nothing. Discovering that my
> evidence was worthless told me only that I had no evidence — and I converted
> that into "there is no bug", which is a different and much stronger claim that
> nothing supported.

---

## L31 — An alias that shadows a column changes what `ORDER BY` means

**What happened.** The ledger's head query was

```sql
select seq::text as seq, hash from ledger_events where tenant_id = ? order by seq desc limit 1
```

PostgreSQL resolves `ORDER BY seq` to the **output column** when one shares the
name — so this ordered by *text*, and `'9'` beat `'10'`. The head came back one
behind the real one, the next append claimed a sequence number that already
existed, and the unique constraint rejected it.

The user-visible symptom was a **500 on creating an API key**. The cause was
four characters of alias.

The same alias in the verifier made it read the chain as 1, 10, 2, 3 and report a
**perfectly intact chain as broken at position 2** — a false alarm from the one
tool whose value is that people believe it.

**Why it happens.** `as seq` looks like a no-op: the column is already called
`seq`, and the cast is the only visible change. Nothing in the query says that
naming an output column after an input column changes the meaning of a different
clause.

**The rule.** *When casting a column in a select list, never alias it back to the
column's own name.* `seq::text as seq_text`. And when a query has both an
`ORDER BY` and a cast, check which one the sort actually binds to — the two look
independent and are not.

**What made this expensive:** I spent an hour on a concurrency theory first. The
duplicate-key error named a race, so I diagnosed a race, and the advisory-lock
defect I found on the way was real — but it was not this. **A plausible cause
found while looking for a cause is not the cause.** Ten seconds of `select … order
by seq desc limit 1` in psql would have shown `9` sitting on top of a table whose
maximum is 10.

---

## The pattern behind most of these

Twenty of the thirty-one are the same mistake wearing different clothes: **a conclusion
drawn from a proxy instead of from the thing itself.** A label instead of the
tables. A count instead of the lines. A type instead of the runtime. A word
instead of the schema. One document instead of several. A build instead of a
running system. A partial run instead of a whole one. An HTTP status
instead of a rendered page. A name instead of the routes. **The source
instead of the running process. The diff instead of the environment.**

The habit that prevents all of them: **before recording a finding, ask what
exactly you looked at, and whether it is the thing you are claiming about.**

---

## L32 — Finding your evidence was worthless is not evidence of the opposite

**What happened.** I built a reproduction of U3, discovered the reproduction was
my own header mistake ([[L30]]), and concluded the defect did not exist. I
reverted a correct fix and reopened the issue as "does not reproduce".

It reproduces. A key created through the UI by the admin came out with
`organization_id = null` while its creator had an organization; the first
request with it returned **401**; setting that one column to the creator's
organization turned the identical request into **200**. Ten minutes of work,
which I did not do, because I thought the question was closed.

**Why it happens.** Disproving my own reasoning felt like the rigorous move, and
it was — right up to the point where I let it carry a conclusion of its own.
"My evidence is bad" and "the claim is false" are different findings. The first
returns you to not knowing. The second is a new claim, and it needs its own
evidence, which I never gathered.

The retraction even felt *safer* than the fix, because reverting looks like
restraint. It was not restraint: it was shipping a known-broken code path back
into the product on the strength of an argument about my own competence.

**The rule.** *When you invalidate your own reproduction, the issue returns to
**unknown**, not to **resolved**.* Write down what would settle it, then go and
settle it. For U3 that was one sentence: create a key the normal way and use it
with the correct header. Neither of my two experiments was that.

**The tell:** a conclusion that arrives at the same moment as an apology. The
apology is about the process; the conclusion is about the world; and one does not
supply the other.

**The cost:** a real 401-on-every-request defect stayed in the build for a day,
and the fix had to be written twice.

---

## L33 — `clearAllMocks` does not clear a queued `mockResolvedValueOnce`

**What happened.** Five new tests passed alone and two failed inside their own
file. The route under test had gained one extra `em.findOne` call — and that call
consumed a value queued by an earlier test with `mockResolvedValueOnce` and never
used, because that test's code path never made the query it was primed for.

**Why it happens.** `jest.clearAllMocks()` empties the call log. It leaves the
once-queue and the implementation intact; only `mockReset()` clears those. So an
unconsumed `Once` is not discarded at the end of a test — it waits, and is
delivered to whichever test next calls that mock. Adding a query to production
code then silently redirects another test's leftovers into it.

**The rule.** *A mock that any test primes with `Once` gets `mockReset()` in
`beforeEach`, then its default again.* The alternative — every test consuming
exactly what it queues — is a property no one can maintain.

**The tell:** a test that passes with `-t` and fails in the suite. That is never
the new test being wrong; it is state crossing a boundary, and the boundary is
worth finding rather than working around. Here it was latent before my change and
would have surfaced on whoever added the next query.

---

## L34 — A query your tests never ran is a query you have not written yet

**What happened.** `AuthorityGraphService` had seventeen tests, including six on
the edge query, and every one of them passed against SQL Postgres refuses:

```sql
where parent_id = any(?) and child_id = any(?)
```

The query builder expands an array binding into a comma-separated list, so this
reaches the database as `any('a','b')` — a syntax error. The correct form is
`in (?)`, which is *built* to receive that expansion.

It surfaced the first time an organization in the real instance actually had
ancestors, which was the first time the query ran at all.

**Why the tests missed it.** The fake connection matched on
`sql.includes('from organization_edges')` and did the filtering itself in
JavaScript. It never parsed the SQL, so every property the tests asserted — the
tenant filter, the soft-delete filter, the chain membership — was a property of
*the fake*, not of the query. The tests were correct and told me nothing about
whether the statement was valid.

**Why it is the second time.** [[L31]] was the same shape: a column alias that
changed what `ORDER BY` meant, invisible to a mock that did its own ordering. The
pattern is now clear enough to state as a rule.

**The rule.** *A hand-written SQL string needs one of two things: an assertion
about its **text**, or an execution against a real database.* A mock that
implements the query's intent tests your understanding of the query, which is
exactly the thing in doubt.

Both fixes now carry a text assertion — the ledger asserts no query aliases to
`seq`, the graph asserts `in (?)` and never `any(`. They look crude. They are the
only kind of test that can see the defect.

**The other half:** notice when a code path has never executed. This one shipped
with tests, a review, and no organization anywhere with a parent — so nothing had
ever reached line two of the function. "Covered by tests" and "has run" are
different claims, and only one of them was true.


---

## L35 — A file that exists in two places has one owner; find out which before writing

**What happened.** The approvals page needed thirty-four new user-facing strings.
The platform has locale files at `apps/mercato/src/i18n/*.json`, so I seeded them
there — and, for good measure, into the create-app template's copy.

Both are real files. Neither is where auth strings live. The auth module owns
`packages/core/src/modules/auth/i18n/{en,de,es,pl}.json`, and every key the page
sits beside — `auth.nav.roles`, `settings.sections.auth` — was already there.

**Why it nearly stuck.** The app-level files *worked*. Nothing would have failed:
`t(key, fallback)` renders the fallback when a key is missing, so a string in the
wrong file and a string in no file look identical at runtime. The mistake would
only have surfaced when somebody deleted the app-level entries as orphans, or
when a module was extracted and left its own strings behind.

**The tell I had and ignored.** `grep` for the neighbouring key found it in the
module file. I had run something close to that and read the answer as *"this key
exists"* rather than *"this is where this kind of key lives"*.

**The rule.** *Before adding an entry to a shared file, find an existing entry of
the same kind and add yours where that one is.* Not where a plausible file is —
where its neighbours already are. The question is never "does this file work"; a
duplicate always works, right up until one copy is edited.

**A second thing it bought.** Looking at the right files showed all four locales
fully translated, 252 keys each, with no English placeholders. Seeding English
into `de.json` would have been the first — and once one is there, the file stops
being a coverage signal for every key after it. The strings shipped translated.

---

## L36 — A diagnosis you wrote down is a hypothesis with a date on it

**What happened.** The backlog carried a precise-sounding account of why the gate
flaked: a test creates `.tmp-dynamic-loader-*` inside `packages/shared`, guards
walking `packages/` read from it after it is deleted, *"two hardened, eleven more
walk-and-read unguarded."*

Eleven files to harden. Clear scope, obvious next move.

So I planted a fixture-shaped directory in `packages/shared` and ran the three
suites that walk it. **All 6,905 tests passed.** Nothing breaks while the
directory is there. The failure needs the *deletion*, which means the readers were
never the thing to fix — the two writers were. Two edits, not eleven.

**Why the note was wrong.** Nothing in it was invented. It was written while
chasing a different problem, from a real failure, and every clause was individually
plausible. What it lacked was the one experiment that separates *"a directory
appears and disappears here"* from *"eleven readers cannot cope with that"* — and
by the time I read it back, it had hardened from an observation into a work plan.

**The same shape, twice in one batch.** The second cause was a slow test, and my
first theory was its source fingerprint. Measuring it first: ~1 second on an idle
machine, against a 60-second budget. Too small to explain the symptom. Had I
skipped the measurement I would have optimised it, watched the flake continue, and
had one fewer suspect and no idea why.

**The rule.** *Before acting on a diagnosis you recorded earlier, re-derive its
key claim.* Especially your own, especially when it is specific, and above all
when it names a number — a count like "eleven" reads as though somebody counted,
and the note cannot tell you whether anybody did.

**The cheap test is usually available.** Planting a directory took ten minutes.
Timing a walk took two. Both were faster than the work they redirected, and both
turned a plan into a measurement. Related: [[L30]] — a reproduction you built
yourself is a hypothesis, not evidence; this is its mirror, where the hypothesis
arrived pre-built and carrying your own handwriting.

---

## L37 — The gate does not boot the application

**What happened.** G3 added a dependency to `RbacService`. Typecheck passed, lint
passed, **12,768 tests passed**, `build:packages` and `build:app` both succeeded.
The server then refused to start:

```text
Failed to start local scheduler: Could not resolve 'delegations'.
Resolution path: localSchedulerService -> rbacService -> delegations
```

The container runs in Awilix **CLASSIC** mode, and the default registration is
`asClass(RbacService)`. CLASSIC reads the constructor's parameter *names* and
resolves each one by name. I named the parameter `delegations`; the registration
is `delegationService`. **In CLASSIC mode a parameter name is a dependency name**,
so renaming a parameter renames a dependency — and nothing in the gate looks at
that, because no test constructs a real container.

**This is the second time this trap has bitten.** The first was a destructuring
factory needing `.proxy()`, which produced `di-classic-proxy.test.ts`. The lesson
was recorded and the guard was written — and it guarded the *other* half of the
same trap, so this half went straight through it.

**The wider point, which is the one worth keeping.** The gate proves the code
agrees with itself. It does not prove the application starts. Type checking,
linting and unit tests all operate on code in isolation; dependency injection,
migrations against a real schema, and route registration only happen at boot. A
green gate is evidence about the code, not about the system.

**The rule.** *After any change to DI wiring, a service constructor, or module
registration, start the server before saying it works.* It takes ninety seconds
and it is the only thing that tests the wiring.

**And the guard has to be watched failing.** I wrote
`di-classic-constructor-names.test.ts`, ran it, and it passed — with the bug still
in the tree. It passed again after a fix. It took **three** rounds of
instrumenting before it caught anything: a doc comment inside the parameter list
contained brackets, which threw off the bracket matcher, so the parser silently
dropped every parameter after the third. A guard that has never been seen to fail
is not a guard; it is a decoration that makes people confident. Related: [[L34]],
where a mock made six tests assert nothing.

---

## L47 — when a diagnosis has more than one candidate, instrument before asserting

**What happened.** The owner reported that an empty dashboard said *Use "Add a
widget"* with no such control. I read the condition:

```tsx
{editing && availableWidgets.length > 0 && (
```

saw the first clause, decided the panel only appears in edit mode, and shipped a
string change telling people to press **Customize** first. The owner replied that
pressing Customize does nothing — their screenshot showed the button already
reading **Done**, so `editing` was true all along and the clause that mattered was
the second one. My fix would have pointed at a button that does nothing.

Then I guessed twice more, confidently, and was wrong both times: first that the
module registry was being replaced by an i18n-only re-registration, then that a
module-level `widgetEntriesPromise` cache had resolved empty. Neither was true.

**What actually settled it** was a temporary diagnostic route reporting each
stage on the running server:

| Stage | Count |
|---|---|
| Raw entries in the registry | 10 |
| After `applyDashboardWidgetOverridesToEntries` | **0** |
| Override error | `null` |
| Loading one entry directly | works |

Which named the cause in one request: our own `enabledModules` override in
`apps/mercato/src/modules.ts` disables all ten widgets, because they read parked
ERP modules. Working as designed — plus a real upstream defect, that client
bootstrap registers the raw entries and never sees those overrides, so the
browser believed widgets existed and picked the wrong empty-state message.

**The rule.** Reading code tells you what it *would* do. It cannot tell you which
of several possible states the running system is in. When a symptom has more
than one candidate explanation, the cost of instrumenting — here about four
minutes of rebuild — is smaller than the cost of one confident wrong answer, and
far smaller than three of them.

**The tell:** if I am about to say "the cause is X" and I have not observed X, I
am guessing. That is the moment to add a probe, not to write a sentence.

**What it cost.** More than the time. Being wrong twice in one session made the
owner doubt the rest of the work, and they were right to — accuracy is not a
per-answer property, it is a reputation, and the second wrong answer devalues
every correct one before it. The related failure is L46's sibling: I quoted a
security finding of "seven" from a scan without opening a single hit, and it was
three.

---

## L46 — a wildcard grant makes a made-up permission work

**What happened.** Building the trust screen I wrote
`requireFeatures: ['auth.trust.manage']`. There is no such feature. The real one
is `auth.trust.promote`.

The page worked. It loaded, it rendered, it was correctly gated in the sense
that a signed-out visitor was refused. Nothing failed — not the typecheck, not
the gate, not the browser. I only caught it because I opened `acl.ts` for an
unrelated reason and the name I remembered writing was not in it.

**Why it worked.** Wildcard grants are part of the ACL contract: `admin` holds
`auth.*`, and `auth.*` matches `auth.trust.manage` exactly as happily as it
matches a real feature. The matcher has no idea which strings are declared. So
**every typo in a `requireFeatures` string is invisible to the one account most
likely to be testing it.**

**What it costs when it ships.** The page is then gated on a permission that
exists nowhere: it cannot be granted to a narrower role, cannot be revoked, does
not appear in the permission editor, and carries no effect class — so the
resolver treats acts behind it as ordinary. It works for administrators and for
nobody else, forever, silently.

**The general shape.** *A permissive fallback that matches by pattern will
validate a name that means nothing.* Testing as the most privileged account is
what hides it — the wildcard is doing the matching, so the specific string is
never exercised. This is the same family as L38 and L45: the thing that made it
convenient (a cache, a wildcard) is the thing that made the check meaningless.

**What to do.** When writing any `requireFeatures`, read the feature back out of
the module's `acl.ts` — do not trust that the page loading means the name is
real. And test a gate as a **narrow** role at least once, never only as admin.

Sweeping for it found three more, all inherited — U19, now fixed, along with a
guard test asserting every `requireFeatures` string resolves to a declared
feature. `capability-coverage.test.ts` cannot see this: it checks the
descriptors that exist, not the guards that reference ones that do not.

**My first sweep said seven, and I reported that number before checking one.**
Four were false — the regex harvesting declared ids excluded hyphens, so real
features like `customers.widgets.next-interactions` looked missing. The
correction is in U19, and the guard test now uses one shared id pattern for
both declarations and usages, so a gap in the pattern hides a finding rather
than inventing one. Overstating a security finding by more than double is its
own failure, and it was avoidable by opening two files.

---

## L45 — `yarn typecheck` is Turbo-cached, so a green one can be stale

**What happened.** After pinning `nanoid`, a typecheck surfaced an error in
`packages/checkout` that had nothing to do with my change:

```text
PayPage.tsx(1367,70): Property 'ar' is missing in type
  '{ en: string; pl: string; es: string; de: string; }'
  but required in type 'Record<Locale, string>'
```

The file was untouched by me. The error was real, it had been there since `ar`
was added in G7 — and **every typecheck I had run that day reported zero
errors.**

The reason:

```text
Tasks:    17 successful, 20 total
Cached:   16 cached, 20 total
```

**Sixteen of twenty packages were served from cache.** Installing a dependency
invalidated them, and the first package to actually re-run failed. My repeated
"0 type errors" were mostly a cache reporting yesterday's answer.

**This is [[L38]] again in a different tool.** There it was `build:app` serving a
stale bundle; here it is `typecheck` serving a stale verdict. The pattern is the
same: **a Turbo-cached task reports the last result, not the current one**, and
the output says so in a line that is easy to skim past.

**The rule.**

- Read the `Cached:` line, every time. `Cached: 16 cached, 20 total` is not a
  pass — it is one pass and sixteen memories.
- Before claiming a clean typecheck in a commit message or to the owner, run
  **`yarn typecheck --force`** at least once and quote `Cached: 0`.
- `yarn test` has been reporting `Cached: 0 cached, 22 total` throughout, so the
  gate numbers stand. It was only typecheck that was quietly cached.

**Worth noting the parked-module angle.** The error was in `checkout`, which does
not run. So nothing was broken in the product — but the same cache was hiding
whatever else might be in the other fifteen, and I would not have known.

## L44 — a test can assert a field that does not exist, and look fine

**What happened.** Writing the Phase G exit-gate test I assumed the resolver took
a `projectCeiling` in its context, alongside `resourceCeiling`. It does not — a
project overlay and a record's lock state are both statements about *this
record*, so `AuthorityEnforcementService` merges them with `lowerOf` into a
single `resourceCeiling` **before** the resolver sees either.

So `context: { projectCeiling: 'A2' }` set nothing at all.

**The dangerous part is why it did not error.** Jest strips types rather than
checking them, so an excess property on a typed object compiles and runs. The
test failed only because the gate came back `A5` and I had asserted `A0`. **Had
the expected value happened to match the unconstrained answer, it would have
passed while testing nothing** — a green assertion about a field that does not
exist.

**The rule.** When a test asserts on a field you have not personally read in the
type, check the type first:

```bash
grep -n "resourceCeiling\|policyCeiling" packages/shared/src/lib/authority/decision.ts
```

And prefer assertions that would fail if the input were ignored — a baseline
comparison (`toBeLessThan(baseline)`) rather than an absolute value. An absolute
value can coincide with the un-constrained answer; a narrowing cannot.

**The unexpected benefit.** Getting it wrong is how I learned the architecture:
that two of the three exit criteria are one input by the time they reach the
resolver, and the distinction lives one layer up. The test now says so, which
is more useful than the version I set out to write.

## L43 — adding an enum value makes old conditionals silently partial

**What happened.** Giving `ai_worker` a producer meant a new principal kind could
finally appear at runtime. Every existing `kind === 'service'` check then became
wrong — not syntactically, semantically. They all meant *"resolve this actor's
permissions from its API key row"*, and there were suddenly **two** kinds that
needed it.

`RbacService` tested only for `service`, so an AI worker fell through to the
**human** branch and put a prefixed subject into a uuid column:

```text
DriverException: invalid input syntax for type uuid:
  "ai_worker:28c2b7f3-529e-4591-812c-c16bfcc1f738"
```

**Nothing caught it.** Every unit test passed. Typecheck passed — the comparison
is valid TypeScript, it is just no longer complete. The bug existed only at the
seam between a new enum value and old conditionals, and only surfaced when a real
request hit a real database.

**The rule.** When adding a value to a union that is switched on across a
codebase, **grep for every comparison against its siblings before writing the
producer**, and ask of each: *does this mean "is exactly X", or does it mean "is
one of the kinds that behaves like X"?* The second is the common case and the
dangerous one.

```bash
grep -rn "=== 'service'" --include=*.ts packages apps | grep -v node_modules
```

Three sites, one of which was a 500. Two minutes of grep against an hour of
debugging.

**Then replace the comparison with a named predicate**, so the next value added
is a question somebody has to answer rather than a runtime surprise:

```ts
export function isApiKeyBackedKind(kind: PrincipalKind | null | undefined): boolean {
  return kind === 'service' || kind === 'ai_worker'
}
```

**And do not reach for the nearest existing predicate.** `isMachinePrincipal()`
already existed and looked right — but it also covers `system`, the platform
acting from a CLI with no key row at all. Using it would have compiled, passed,
and failed differently later. The predicate has to answer the question the call
site is actually asking.

## L42 — a roadmap entry is a claim about the past, not the present

**What happened.** The roadmap listed **U7** — *"the journal cannot tell a machine
from a human"* — as the single most important thing left before Hermes. I said so
to the owner in strong terms: *"the only one on the list that can't be fixed
later."*

It had been fixed. Commit `ce7fb61`, *"U7: the journal records what kind of
principal acted"*, in an earlier session. Every row in `action_logs` was already
classified — 67 `human`, 6 `system` — and a live test with a real API key
confirmed a machine write records `actor_kind = service`.

**What the entry actually contained** was the *original finding*, copied forward
unchanged while the fix landed elsewhere. It read as a present-tense description
of a defect and was a past-tense description of a discovery.

**The check that would have caught it** costs one command:

```bash
git log --oneline -- <the file the finding names>
```

**The rule.** Before acting on any recorded finding — especially one being used
to justify priority — verify it against the code, not the note. This is [[L36]]
(*a recorded diagnosis is a hypothesis*) in its second form: L36 was about a
diagnosis that was wrong when written; this is about one that was right when
written and has since been fixed.

**And the tell was there.** The entity file already carried a doc comment
mentioning U7 by name and describing a backfill command. I read past it because I
had arrived expecting to build something.

**What was genuinely missing** was smaller and different: the audit *screen* never
displayed the kind it had been recording for weeks. The record existed and nobody
could see it — worth finding, and not what the entry said.

## L41 — a global rename invented a legal entity

**What happened.** Re-branding the platform, I ran a protected find-and-replace:
`Open Mercato` → `Companai`, guarding the `@open-mercato/*` package namespace so
imports could not break. That guard worked. What it did not occur to me to guard
was **prose that names the old company as a legal person**.

The onboarding consent strings came out like this, in four locales:

```text
onboarding.form.legalEntity
  Companai sp. z o.o., registered office ul. Wyspa Słodowa 7, Wrocław,
  KRS No. 0001253104, NIP PL8982336029, REGON 545230330,
  share capital PLN 80,000.00, fully paid.
```

**A limited company that does not exist, wearing a real third party's
registration numbers, inside a GDPR consent statement.** Worse than what it
replaced: the original at least named a company that is real and accountable.

It also rewrote **my own doc comments** — the ones explaining that these pages
belonged to *another* company — so they asserted the opposite of their point.

**Why the guard was not enough.** I protected the *identifier* namespace, which
is the mechanical risk, and missed the *semantic* one: text that is **about** the
old name looks identical to text that merely **uses** it.

**The rule.** Before a global rename, grep the old name for the shapes that make
it a legal or factual claim, and handle those by hand:

| Grep for | Because |
|---|---|
| `sp. z o.o.`, `Ltd`, `GmbH`, `Inc`, `LLC` | a legal form makes it an entity claim |
| registration ids — `KRS`, `NIP`, `VAT`, `REGON` | these identify a real company |
| a street address, a registry court | same |
| `consent`, `controller`, `terms`, `privacy` | renaming changes who is liable |
| `previously`, `upstream`, `originally`, `fork` | prose *about* the old name |

**And rename tests last, deliberately.** Three suites failed because they
asserted our own renamed strings — trivial. A fourth, `consent-controller-locales`,
was upstream's guard **on their own registration identifiers**, and it failing was
the only reason I looked. A guard inherited from upstream can be the thing that
catches a fork impersonating them; read those failures before updating them.

## L40 — widening a type in a parameter position breaks every implementor

**What happened.** `CommandHandler.capability` was `string`. To let one command
classify itself per call I widened it to
`string | ((input: TInput) => string | null)` — additive, backwards compatible,
and it compiled in `shared`.

Then the workspace typecheck produced **eight errors across four modules**, all
the same shape:

```text
Argument of type 'CommandHandler<Record<string, unknown>, Role>' is not
assignable to parameter of type 'CommandHandler<unknown, unknown>'.
```

**Why.** Adding a function whose parameter is the class's own generic makes the
whole type **contravariant** in that generic. `CommandHandler<TInput>` stopped
being assignable to `CommandHandler<unknown>`, and `registerCommand` takes
exactly that — so **every command handler in the platform** stopped compiling.
Nothing was wrong with any of them.

**The fix is one word:** type the parameter `never`.

```ts
readonly capability?: string | ((input: never) => string | null)
```

`never` is assignable to any parameter type, so the variance disappears and a
classifier written against `unknown` or a concrete shape both still fit. The cost
is that authors annotate their own parameter instead of having it inferred.

**The rule.** Before adding a **function-valued** field to a widely-implemented
interface, ask what it does to variance. A field that only *returns* the generic
is safe; one that *accepts* it flips the whole type and the blast radius is every
implementor, not the one you were editing.

**And run the workspace typecheck, not the package one.** `yarn workspace
@open-mercato/shared build` passed cleanly — the breakage was entirely in the
consumers, and only `yarn typecheck` across all packages saw it.

## L39 — a 404 on a route you just wrote is usually a stale server, not a bug

**What happened.** I finished the denials API, saw it built into
`packages/core/dist/modules/auth/api/authority/denials/`, saw it registered twice
in `modules.generated.ts`, and curled it. **404.** The delegations route beside it
answered `401` — the correct answer for "exists, needs auth".

Nothing was wrong with the route. The server was running `next start`, which
serves a build made before the route existed and never re-reads anything.

**The diagnostic that settles it in one command.** Curl a *sibling* route in the
same directory:

```text
api/auth/authority/delegations GET: 401   <- server is fine, auth is fine
api/auth/authority/denials     GET: 404   <- this route is not in the build
```

A `404` on the new one and a `401` on the old one is conclusive: the routing
works, the new route simply is not there. If both had returned 404 the problem
would have been auth or the path.

**The rule.** Before believing a new route is broken, establish which of three
things you are looking at:

| Symptom | Meaning |
|---|---|
| New route 404, sibling 401 | Stale build. Rebuild and **restart** |
| Both 404 | Wrong path, or the whole module is not registered |
| New route 401 | It works — you are just not logged in |

**And check how the server runs before assuming a rebuild is enough.** `yarn dev`
picks up rebuilt packages; **`next start` does not** — it must be stopped and
started again. Check with `Get-CimInstance Win32_Process -Filter "Name='node.exe'"`
rather than guessing.

This is L38's sibling. L38 is *the build did not happen*; this is *the build
happened and the process is still serving the old one*. Both present as "my
change had no effect", and both waste an hour if you start by doubting the code.

## L38 — `yarn build:app` can be a cache hit that serves last week's code

**What happened.** Fixing U11 took four attempts, and three of them failed for the
same invisible reason.

I changed `packages/core`, ran `yarn build:packages && yarn build:app`, restarted
the server, and tested. Nothing happened. I added `em.persist()` — nothing. I
added `console.log` instrumentation and rebuilt — and **the log lines never
appeared**, which is what finally gave it away: the code could not be running,
because it was never bundled.

```text
Tasks:    1 successful, 1 total
Cached:   1 cached, 1 total          ← the app was NOT rebuilt
```

Turbo had cached `build:app`. The new code was demonstrably in
`packages/core/dist` — four occurrences of the debug string — and absent from
`apps/mercato/.mercato/next/server/chunks/`. With `--force`:

```text
Cached:   0 cached, 1 total          ← 5m32s, and the code shipped
```

**Why the cache is wrong here.** `build:app` compiles the Next application against
the *built packages*. Turbo's hash for that task did not pick up the change to
`packages/core/dist`, so it replayed a stale bundle while reporting success.

**The rule.** *After changing any package, rebuild the app with `--force`:*

```bash
corepack yarn build:packages && corepack yarn build:app --force
```

**What this costs beyond the four attempts.** Every boot check in this project
that used a plain `build:app` may have booted a stale bundle — so "the server
starts and the route resolves" proved less than it appeared to. The **gate is
unaffected**: Jest runs from source, so test results were always honest. It is the
*runtime* verification that was weaker than claimed, which is recorded rather than
quietly re-run.

**The tell to remember**: instrumentation that produces *no output at all* is
rarely a subtle bug. It usually means the code is not running. [[L28]] says prove
the diagnostic works before believing its silence; this is the same lesson from
the other side — the silence was real, and it was about deployment, not logic.

---

## L48 — a capability that exists is not coverage

**What happened.** The analysis programme mapped 140 requirements against our
platform and Hermes, and marked each `COVERED` / `PARTIAL` / `MISSING`. The
critic pass attacked every `COVERED` cell — **30 of them** — and the attack kept
landing:

| Marked `COVERED` | What was actually true |
|---|---|
| The authorization resolver | It exists, but it is in **`shadow`** — RBAC still decides. A resolver that decides nothing covers nothing |
| Hybrid search | It runs, but it is **not tenancy-filtered** — an unfiltered vector search is a security hole, not a feature |
| The UI shell | The shell is real; the **Widget it is supposed to host** does not exist |

Three of the strongest "shortcuts" in the register were **half-built**: the kernel
is free, the *enforcement* is the work; the shell is free, the *object* is not.

**Why it happens.** A capability that exists *looks* like coverage, and the file
behind it makes the claim feel measured. But **existing, being enabled, and doing
the job are three different things**, and only the third is coverage. The trap is
that the first two are checkable with a grep, and the third is not.

**The rule.** *For every "we already have this", ask what the requirement needs
that this cannot do.* A thing that is off, unwired, or only half the job is
`PARTIAL` at best. This is [[L8]] (*a schema is not a behaviour*) and [[L17]]
(*before removing an obstacle, ask whether it is a guard*) in the shape of an
assessment: the artifact is not the behaviour.

**The general form:** an inventory is not a capability. What you *have* is what
runs and does the job; everything else is a build wearing a green tick.

---

## L49 — a number written without measuring it

**What happened.** The analysis programme's batch 9 produced a 140-row matrix and
a headline count. I wrote the tally **by hand**, from memory, as I summarised:
`COVERED 15 · PARTIAL 55 · MISSING 38`. Then I parsed the file I had just
written. The real numbers were **`COVERED 20 · PARTIAL 50 · MISSING 64`**.

Four domain-header counts were wrong too, and three rows labelled `CONFLICT` had
`COVERED` sitting in their verdict cells. The *rows* were right; the *summary of
the rows* was invented.

**Why it happens.** A summary count feels like arithmetic, and arithmetic feels
safe. But the number was never derived — it was estimated from the shape of the
document, and estimation is invisible when it is written in the same font as the
count. A count that nobody derived is a guess with a number's authority.

**The rule.** *Never write a summary count by hand. Parse the artefact you just
wrote.* If the artefact is a file, the count is a `grep -c`, not a memory. And
check the parts add up to the whole — the domain headers and the row count and
the verdict columns must reconcile, or one of them is wrong.

**The general form:** this is [[L2]] (*a grep count is not a finding*) turned on
your own output, and [[L36]] (*a diagnosis you wrote down is a hypothesis*) in
numerical clothing. **A number is evidence only if it came from the thing it
describes.** The fix is one command; the cost of skipping it is a wrong figure in
a permanent document — the same failure this programme found in someone else's
documentation and criticised.

---

## L50 — quote the specification, not a derived reading

**What happened.** Sprint 0's research table recorded the laptop as
"**31.9 GB RAM**, 8 logical cores". Both numbers were measured — but both are the
operating system's *derived* readings, not the machine's specification. The
installed parts are **32 GB RAM** (2 × 16 GB DDR4-2133) and a **4-core /
8-thread** Intel i7-6820HQ. The owner caught it: *"'RAM: 31.9 GB, 8 cores' is not
my laptop specifications."*

**Why it happens.** The OS reports what it can *use*, not what is *installed*: it
deducts the memory the integrated graphics reserve (32 GB installed → 31.89 GB
"total physical"), and it reports *logical processors* (threads) under a heading
that reads like cores. A derived reading is a real number, which is exactly what
lets it pass a casual check — but it is not the answer to "what are the machine's
specifications?".

**The rule.** *When you state a machine's specification, name the installed
part.* Memory = the installed capacity, from the DIMMs — not the OS's usable
total. CPU = cores **and** threads, never threads alone labelled "cores". The
evidence is `Win32_PhysicalMemory` (sum of DIMM capacities) and
`Win32_Processor` (`NumberOfCores` vs `NumberOfLogicalProcessors`) — **not**
`Win32_ComputerSystem.TotalPhysicalMemory`.

**The general form:** this is rule zero-nine (*measure from the artefact, not the
description of it*) applied to the machine itself, and [[L49]] (*a number written
without measuring it*) with the twist that this number **was** measured — it was
just the wrong quantity for the noun. **A true number attached to the wrong word
is still a false claim.**

---

## L51 — an absence is a claim too

**What happened.** Writing Sprint 0's model-server step, I asserted the machine
had **"no NVIDIA GPU"** and told the reader to use the CPU image. I had not
enumerated the GPUs. I then measured: the machine has **two** adapters — Intel HD
530 **and an NVIDIA Quadro M2000M**. The absence I wrote down was simply false.

**Why it happens.** Stating what a thing *lacks* feels like a weaker, safer claim
than stating what it *has* — so it gets less scrutiny. But "there is no X" is a
claim about the whole system, and it is falsified by a single X. It is, if
anything, *harder* to prove than a presence. It is also invisible: a wrong
presence is a wrong fact, but a wrong absence quietly closes a door the reader
never knew was open (here: GPU acceleration).

**The rule.** *Do not write an absence you have not enumerated.* Before "there is
no X", run the check that would find X if it existed — and say where you looked.
This is [[L1]] (*a confident label is not an inspection*) aimed at the empty set:
"nothing there" is a finding, and a finding needs an inspection behind it.

**The general form:** [[L50]] was a true number on the wrong noun; this is a
**negative** on no evidence at all. Both are the same defect — a claim that
outran its measurement — and both were caught by the owner, not by me.

---

## L52 — `${VAR:-default}` is not a default, it is a pass-through

**What happened.** The app container crash-looped on
`Cannot find module 'C:/Program Files/WorkBuddyAI/…/node-language-shim.cjs'`. The
compose read `NODE_OPTIONS: ${NODE_OPTIONS:---max-old-space-size=3072}`, which
*looks* like "use the sensible default". It is not: when the **host shell** has
`NODE_OPTIONS` set — and this machine exports a Windows-only preload path —
compose interpolates the host's value straight into the container, where the path
does not exist and `node` aborts before running a single line of the entrypoint.
The neighbouring `mcp` service was immune only because it read a **differently
named** variable (`MCP_NODE_OPTIONS`).

**Why it happens.** The construct reads as "fallback", so the eye sees a safe
default and stops. But `${VAR:-x}` means *"the ambient value if there is one,
otherwise x"* — the ambient value is the **primary**, and `x` is the leftover. Any
name that a build host, a developer's shell, or a CI runner might set turns a
"default" into an uncontrolled input.

**The rule.** *Never default a compose value from a variable the host might own.*
Use a project-specific name (`APP_NODE_OPTIONS`, `MCP_NODE_OPTIONS`) so the
ambient environment cannot reach the container at all. If you must read a
generic name, read it and **print what you resolved** before trusting it.

**The general form:** a default that can be overridden by the environment is not a
default — it is an unvalidated input wearing a default's clothes. Measured three
ways before believing it: the host shell, `docker compose config`, and
`docker inspect` of the live container.

---

## L53 — a marker written on *reported* success is a lie the next run believes

**What happened.** The database had **zero users**, yet
`/tmp/init-marker/.seeded` existed, so `init-or-migrate.sh` took its "Subsequent
run: migrations only" branch forever and never seeded anything. `mercato init` had
**printed** `❌ Initialization failed`, and the marker was written anyway.

**CORRECTION, 2026-10-04.** This lesson first said the CLI "still **exited 0**".
**That was wrong, and it aimed the fix at the wrong file.** Two routes agree that
the CLI was always honest:

- the catch block logs the message and `return 1` (`packages/cli/src/mercato.ts:1322-1324`),
  and `bin.ts` ends with `process.exit(code ?? 0)`;
- the CLI's own tests assert it — `expect(exitCode).toBe(1)` at
  `packages/cli/src/__tests__/mercato.test.ts:373` and `:419`.

**The script that read it was the dishonest one:**

```sh
if sh -lc "${COMMAND}" >"${LOG_FILE}" 2>&1; then
  return 0
fi
STATUS=$?          # always 0
```

The exit status of an `if` with no `else` whose condition failed is **0**, so
`run_command_with_cli_recovery` reported **every** failure to its caller as
success. The script read `$?` in **four** places and **two** of them were broken; all four now use
one explicit shape. The trap itself is written up as [[L63]].

**Why it happens.** A sentinel file is a promise made to a future run, and it is
written at the moment the writer is least able to judge. "The command returned 0"
is treated as "the work is done", but the two are different claims: one is about a
process, the other about the world. The world here was an empty `users` table.

**The rule.** *A marker must be written only after the effect is verified, not
after the command returns.* And before trusting any status, **verify that you
actually read the one you think you read** — a status captured in the wrong place
is worse than no status at all, because it arrives looking like evidence. Any
"already done" sentinel must also be re-checkable against the thing it claims.

**The general form:** this is [[L48]] (*a capability that exists is not coverage*)
turned inward — a *reported* success is not a *measured* one. The marker is now a
known defect (**B-15**), not a curiosity. *The follow-on lesson is the harder one:
the first diagnosis of this defect was itself unmeasured, and it was believed for a
day.*

---

## L54 — never hand-write a file the program owns

**What happened.** To point Hermes at our model and our MCP, I wrote its
`config.yaml` by hand. Hermes **overwrote it on startup** — the file is its own
state, carrying a `_config_version` it migrates, and it rewrites it from its
internal model. My `model:` and `mcp_servers:` blocks simply vanished, which is
why Hermes never contacted the MCP and its log contained not one MCP line.

**Why it happens.** Editing a config file is the obvious move and it *looks* like
it worked — the file on disk contains your text right up until the program starts.
The failure is silent and delayed: you find out only by noticing an **absence**
(no MCP lines) rather than an error.

**The rule.** *If a program ships a CLI for its configuration, that CLI is the
only writer.* `hermes config set`, `hermes mcp add` — then verify with
`hermes config get`. Do not infer that a hand edit took effect because the file
still reads the way you left it; **re-read it after the program has started.**

**The general form:** [[L51]] (*an absence is a claim too*) — the damage here was
not a wrong value, it was a **missing** one, and a missing thing has no error
message.

---

## L55 — the accepted form of a credential lives in the code, not in the client's prompt

**What happened.** Hermes' `mcp add --auth header` flow asks for an
"API key / Bearer token" and stores `Authorization: Bearer <key>`. The platform's
MCP accepts exactly **two** forms (`lib/auth.ts:157-192`): `x-api-key: <secret>`,
or `Authorization: ApiKey <secret>` — note **`ApiKey `**, not `Bearer `.
`Bearer` is neither, so every call returned
`401 {"error":"API key required (x-api-key header)"}`. The fix was one header.

**Why it happens.** "Bearer token" is so standard that both sides assume it. But
the *label on the client's prompt* is a guess about the server; only the server's
own header-parsing code is a fact. The 401 message was the server telling us
precisely which header it wanted, and it was easy to read past it as a generic
auth error.

**The rule.** *Read the server's header parser before wiring a client.* And treat
an error body that **names the required header** as an instruction, not a symptom.

**The general form:** [[L50]] (*quote the specification, not a derived reading*) —
a prompt string is a derived reading; the parser is the specification.

---

## L56 — a flag that looks like it sets capacity may be silently capped

**What happened.** Hermes refuses any model whose served context is below 64,000
tokens. Adding `-c 65536` to llama.cpp looked like the fix — and the server
started happily. It was **not** the fix: llama.cpp logged
`the slot context (65536) exceeds the training context of the model (32768) -
capping` and served `n_ctx_slot = 32768`. The server accepted the flag, discarded
the part it did not like, and reported success. Only the **startup log** revealed
it. YaRN RoPE scaling was what actually admitted 64K.

**Why it happens.** "It started" is read as "it is configured". A capped value
produces no error, no warning dialog and no non-zero exit — just a quieter,
smaller system than the one you think you built. The evidence sits in one log line
that scrolls past during a 60-second model load.

**The rule.** *After setting a capacity, read back the capacity the component
reports — from its own log, not from your config.* The config states an intention;
the log states a fact.

**The general form:** [[L49]] (*a number written without measuring it*) with a
mask: the number was written **and accepted**, which feels like measurement. It
was not — nothing had confirmed the value took.

---

## L57 — a failure that falls through still looks healthy

**What happened.** The compose `command` for the app runs
`init-or-migrate.sh` and then `yarn start` — with **no `set -e`**. When
initialisation failed, the shell simply carried on to `yarn start`. The container
reported `Up`, served HTTP, started all its queue workers and its scheduler, and
answered `/` with a `307 → /login`. Every outward signal said "healthy". It had
never been initialised.

**Why it happens.** We read health from the *liveness* of the process, and a
process that fell through a failure is perfectly alive. The defect is invisible
from outside because the fall-through is what makes it look well.

**The rule.** *When a startup sequence has a must-succeed step, make it fail the
startup.* `set -e`, or an explicit exit — otherwise "it came up" says nothing about
whether the step ran.

**The general form:** this is the same defect as [[L53]] seen from the other side.
There, a marker claimed work that had not happened; here, a **running process**
does. Both substitute a signal about the program for a fact about the world.

---

## L58 — a default tuned for a different machine than the one you gave it

**What happened.** The model server ran at **~13 tokens/s** ingesting its prompt,
which made every agent turn take ~20 minutes. The container had **8** CPUs. But
llama.cpp's `-t` default is the number of **physical** cores — and this laptop is
**4 physical / 8 logical** — so the server quietly used **4 threads** and left
half the machine idle. `docker exec … nproc` said 8; the server's own log said
`n_threads = 4`. Nothing was broken; the default was simply sized for a machine
we were not running on.

**Why it happens.** The default is a *reasonable guess about the host*, made by
the tool, for a host it cannot see. We hand it a container and assume the guess
still holds. It does not — the container is not the laptop.

**The measurement, and why one number would have misled.** Both phases had to be
measured separately, because they answer to opposite resources:

| `-t` / `-tb` | prompt ingest | generation |
|---|---|---|
| 4 / 4 (default) | 13.2 tok/s | 3.9 tok/s |
| 8 / 8 | 17.7 tok/s | **3.0** tok/s |
| **4 / 8** | **19.3** tok/s | **4.6** tok/s |

Ingest is compute-bound, so more threads help. Generation is memory-bandwidth-
bound, so more threads *hurt* (sync overhead beats the extra parallelism). Had we
only measured "tokens per second" on a generation test, we would have concluded
8 threads was a regression and reverted the real fix.

**The rule.** *Read the tool's default, and check it against the resource you
actually gave it — not the resource of the machine you are sitting at.* And when
one setting governs two phases, **measure both**, because they need not move
together.

**The general form:** [[L49]] again — a number (here, a default) accepted without
being measured against the situation it was going to run in.


## L59 — a zero return value means "request accepted", not "effect happened"

**What happened.** The unattended Ubuntu install on the Hyper-V VM stopped at

```
An autoinstall file was found … add 'autoinstall' to your kernel command line to avoid this
Continue with autoinstall? (yes/no)
```

and sat there for **eight minutes** with the CPU at 0 % and the virtual disk still
at 4 MB. To answer it we called the Hyper-V keyboard API:

```powershell
$kb.TypeText("yes")     # → ReturnValue = 0   (success)
$kb.PressKey(13); $kb.ReleaseKey(13)
```

Both calls returned `0`. The VM did nothing. We had already tried this once, so we
assumed the *approach* was wrong. It was not — **`TypeText` is the part that does
nothing.** Replacing it with per-character virtual-key presses fixed it instantly:

```powershell
$kb.PressKey(89); $kb.ReleaseKey(89)   # Y
$kb.PressKey(69); $kb.ReleaseKey(69)   # E
$kb.PressKey(83); $kb.ReleaseKey(83)   # S
$kb.PressKey(13); $kb.ReleaseKey(13)   # Enter
```

The screen then read `Continue with autoinstall? (yes/no)` / `yes` /
`start: subiquity/Install/install/configure_apt`, and the disk began to fill.

**Why it happens.** `ReturnValue = 0` on a WMI method means *the management
service accepted the request*. It says nothing about whether the guest received,
understood, or acted on it. `TypeText` crosses a boundary — host → VMBus → guest
keyboard driver → tty — and reports success at the **first** hop.

**How we caught it, which is the reusable part.** Two probes, in order:

1. **A single harmless character** (`TypeText("y")`), then re-capture the screen.
   Byte-identical → the call had no observable effect. (It had also reported `0`.)
2. **A control that must change the screen if input works at all** — press
   **Enter** and nothing else. A *third* `Continue with autoinstall? (yes/no)`
   line appeared. An empty answer re-prompts, so the extra line is proof that
   input reaches the guest. That isolated the fault to `TypeText` and cleared the
   whole delivery path in one step.

Without probe 2 we would have concluded "keyboard input does not work on this VM"
and gone off to remaster the ISO — a much larger, riskier change to fix a problem
that did not exist.

**The readback, since it is not obvious.** Hyper-V has **no `Get-VMScreenshot`
cmdlet**. The console image comes from a WMI call —
`Msvm_VirtualSystemManagementService.GetVirtualSystemThumbnailImage` — which
returns a raw **RGB565** framebuffer (here 640×480×2 = 614 400 bytes, plus a
4-byte header). Render it to PNG and *read the screen*. Note the trap: the
header's width/height describe the **guest's** display mode (2304×1120), not the
thumbnail you asked for, so size the buffer from the byte count, not the header.

**The rule.** *A success return is a claim about the API, not about the world.*
Before you drive anything with an input path, prove it moves something you can
**see** — and use a control that has no other explanation. Then trust it.

**The general form:** [[L3]] and [[L49]] again — a returned number accepted as a
measurement of something it never measured.


## L60 — `select user` asks the database who *you* are, not what the column says

**What happened.** To find out which SSH account Coolify would use to reach its own server, I queried
its `servers` table:

```sql
select id, name, ip, user, (private_key_id is not null) as has_key from servers;
--  0 | localhost | host.docker.internal | coolify | t
```

I read `user = coolify`, checked whether a `coolify` account existed on the machine, found it did
**not**, tried the connection as that user, got `Permission denied`, and concluded that Coolify's
localhost server was misconfigured and would fail the moment it was used.

All of that was wrong. **`user` is a reserved keyword in PostgreSQL** — bare `user` is an alias for
`current_user`. The query returned the *database session role* (`coolify`, the Postgres user created
by the install), not the column. The real column value is **`root`**, and `root@host.docker.internal`
connects fine. The corrected query quotes the identifier:

```sql
select id, name, ip, "user" from servers;   -- 0 | localhost | host.docker.internal | root
```

**Why it is worth a lesson.** The wrong value was *plausible*. `coolify` is exactly the kind of answer
you expect from a Coolify database, and every neighbouring column was correct, so nothing looked
wrong. It was only caught because the next step — actually *trying* the SSH connection — did not fit
the story: `coolify@` failed but `root@` succeeded, and both could not be true of a correctly-read
column.

**The tell.** The suspicious value was **identical to something else I already knew** (the database
username). A column whose value happens to equal the name of the thing you are querying is worth a
second look.

**The rule.** *When a value looks like it might be about the tool rather than the subject, confirm you
selected what you meant.* Quote identifiers that are also SQL keywords — `user`, `order`, `table`,
`end`, `limit`, `default`, `group`. And when a "finding" would send someone off to fix something,
settle it with a **second, independent route** before reporting it: here, performing the connection
rather than describing it.

**The general form:** [[L1]] and [[L2]] again — a value read as a fact about the subject when it was
a fact about the reader. In a build that must not break the machine, the cost of this one was a
false alarm; had it been acted on, it would have meant "fixing" a connection that was already working.



---

## L61 — When a widely-repeated number justifies an action, read the vendor's current doc

**What happened.** WSL2 runs as a small VM and is given a share of the host's RAM by default. I wrote,
into a config file, a runbook and the plan, that the default is **"80% of RAM on Windows 10"** — and
used it to justify capping WSL at 12 GB on a 32 GB laptop that also runs a 6 GB Hyper-V VM.

**It is wrong.** Microsoft's current `.wslconfig` reference states a single default of **50% of total
memory**, with no Windows 10 / Windows 11 split. The 80% figure is an older value that is still
repeated in blog posts, Stack Overflow answers and AI-generated summaries — and a web search returns
those first, which is how it got in.

**Why it is worth a lesson.** The *action* was still correct: 16 GB of WSL plus a 6 GB VM is 22 GB of
32, and lowering the ceiling to 12 GB is a reasonable margin either way. So nothing broke, and the
error was invisible — a wrong number inside a right decision. That is exactly the kind that survives
review.

**The tell.** The number was **load-bearing** (it was the reason to act) and it came from a **secondary
source** (a search result) rather than the vendor's own reference page.

**The rule.** *If a number is the justification for changing something, fetch it from the vendor's
current documentation and quote the sentence.* A figure that is merely descriptive can come from
anywhere; a figure you are about to act on cannot. Corollary: when a claim is widely repeated, that is
evidence it is **old**, not evidence it is right.

**The general form:** [[L1]] again — a confident label is not an inspection. Here the confident label
was a percentage, and the inspection was one fetch of the page that defines it.

---

## L62 — A failing probe is not a finding until you know the probe works

**What happened.** I needed to show that the phpMyAdmin container could reach the MariaDB container by
name. I ran a TCP test inside the phpMyAdmin container and got:

```
TCP-3306-CLOSED
```

That looked like a real result: the database was unreachable and phpMyAdmin would never work. I was one
keystroke from writing it up.

**It was false.** The test was `(echo > /dev/tcp/mariadb/3306)`. **`/dev/tcp` is a bash feature, and the
container's `sh` is `dash`, which does not implement it.** The command could never have succeeded,
whatever the network did. The same container also resolved `mariadb` to `10.0.1.8` and answered a real
`mysqli` connection, listing both databases.

**Why it is worth a lesson.** A probe that fails looks exactly like a subject that is broken. The failure
was in the instrument, and the instrument was silently incapable of success. This is the same shape as
[[L3]] — verify the tool before trusting the measurement — but with a nastier property: the broken tool
did not error, it returned a clean negative.

**The rule.** *Before believing a negative result, make the probe succeed on a case you know is positive.*
If you cannot get the instrument to say "yes" anywhere, it has not told you "no" about anything.

**Practical corollaries from the same hour:**
- **Use the subject's own runtime as the probe.** The definitive test was `php -r 'new mysqli(...)'` —
  the same PHP that phpMyAdmin itself uses. It cannot disagree with the thing it is measuring.
- **Two client names, one tool.** MariaDB 11 has no `mysql` binary; the client is `mariadb`. An
  `executable file not found` is a naming fact, not a database fault.
- **`getent hosts` may show only IPv6** while `getent ahostsv4` shows the working IPv4 address. Check
  both families before concluding a name resolves badly.

**The general form:** a measurement has two parts — the subject and the instrument — and a bad reading
implicates both equally. [[L1]] says a confident label is not an inspection; this says an inspection is
not an inspection either, until the instrument is proven.

---

## L63 — `$?` after `fi` is always 0, so a failure read there is a success

**What happened.** `init-or-migrate.sh` reported every failed database initialisation to its caller
as a success, so it wrote its "already seeded" marker anyway and the app came up looking healthy on a
half-seeded database ([[L53]], **B-15**). The whole defect is two lines:

```sh
if sh -lc "${COMMAND}" >"${LOG_FILE}" 2>&1; then
  return 0
fi
STATUS=$?          # <-- 0, always
```

**Why it happens.** The exit status of an `if` compound command with **no `else`**, whose condition
was false, is **0** — because no command in either branch ran, and the shell has nothing to report.
The condition's own failure is *not* propagated. So `STATUS=$?` reads the status of the `if`, not of
the command that failed. It looks completely natural, it is the obvious place to put the line, and it
is silently wrong every single time. Measured directly, in both `sh` and `bash`:

```sh
f() { if sh -c "exit 7"; then return 0; fi; STATUS=$?; echo "$STATUS"; }   # prints 0
```

**The rule.** *Never read `$?` after `fi`. Capture the status where the command is.* The safe shapes
are `cmd || STATUS=$?` (with `STATUS=0` set first), or `$?` as the first thing inside an `else`
branch. Prefer the `||` form: it says what it means, and it is also exempt from `set -e` — see
[[L64]].

**The general form:** a status is only evidence if you know *which command's* status you read. This is
[[L62]] applied to shell plumbing rather than to a probe: the instrument was never measuring the
subject. When one instance of a pattern is found, **grep the file for the others** — this script read
`$?` in **four** places and **two** of them were broken (the two read after an `fi`); the other two
sat in an `else` branch and were correct only by accident of where they were written. Fixing the
first alone left the bug half-alive.

---

## L64 — `set -e` is ignored inside a function called as a condition

**What happened.** `dev-entrypoint.sh` guarded its expensive setup with a function whose first line
was `set -e`, and called it as `if ! (run_setup); then`. The intent — and the comment in the file —
was that any failing step would abort the setup and print a "SETUP FAILED" banner. It did not. A
failing `yarn install`, `build`, `generate` or `init` fell through to the next line, the function
ended on a successful `cd`, returned 0, and the banner never printed. The guard was dead code that
read as protection.

**Why it happens.** POSIX exempts the condition of an `if` from errexit — that is deliberate, so that
`if grep -q x file` is not fatal. The exemption applies to the whole command in the condition
position, *including a function called there*: the `set -e` inside the function does not re-arm it.
Measured, in both `sh` and `bash`:

```sh
f() { set -e; false; echo "NOT ABORTED"; }
if ! (f); then echo "guard fired"; else echo "guard did NOT fire"; fi   # guard did NOT fire
```

**The rule.** *Do not rely on `set -e` for a function that is invoked as a condition.* Check each
step explicitly (`cmd || return 1`), or restructure so the function is called as a plain command.
And when a guard is meant to protect something, **make it prove it fires** — a guard that cannot fail
is a comment.

**The general form:** `set -e` is not a safety net, it is a mode with exceptions — conditions,
`&&`/`||` lists, and `!` all switch it off. Treat "the script would have stopped" as a claim to be
tested, exactly like any other. Same family as [[L63]]: the mechanism looked right and was inert.

---

## L65 — a test that cannot tell pass from fail proves nothing

**What happened.** Writing the regression test for **B-15**, the first run reported the *happy path*
failing and the *bug* passing — the exact inverse of the truth. The harness was broken: `mktemp -d`
on Git Bash returns a Windows path (`C:\Users\...`), `sh -lc "C:\Users\..."` eats the backslashes and
reports "No such file or directory", so **every** stub failed to run, and "failed" happened to look
like the expected result in one case. Separately, a second run appeared to hang and was killed at
120 s — it was not hung, it was slow, and the timeout was mine.

**Why it happens.** A test that fails looks like a test doing its job. Nothing in the output says
*which* of the two things went wrong — the product, or the instrument — and the reader is strongly
motivated to accept the convenient reading. [[L62]] in a different costume.

**The rule.** *A harness must first prove it can distinguish the two outcomes, before its verdict on
anything is worth reading.* Concretely, every test here now opens with a self-check: run a stub that
exits 0 and one that exits 1, and abort if they are not seen as 0 and 1. And **a regression test must
be run against the unfixed code first** — if it passes there, it is not testing the fix.

**The general form:** mutation-prove the instrument before believing its reading of the subject.
Applied here, both tests were run against the pre-fix code and failed there (3 and 3 cases
respectively) before being trusted on the fixed code (0 and 0).

---

## L66 — when a sentence states a total *and* its components, the components are the second route

**What happened.** The vision's object lists are Doc 3 §38 = 30, README §16 = 33, Doc 3 §150 = 34.
The union was recorded — in the analysis reports, the development plan, the backlog and the owner's
own decision record — as **36**. It is **37**. The sentence that carried the figure had the proof of
its own error inside it:

> "the union of all three is **36 distinct objects** (30 ∪ 33 ∪ 34 = 30 + LegalEntity + Function +
> Dependency + the four contracts)"

`30 + 3 + 4` is 37. The stated total and the stated components disagreed, and the total was the
wrong one. Re-measured twice — counting the added items per list, and extracting the three lists
programmatically from the source files and de-duplicating two ways — both routes gave 37. The slip
had been copied into **14 places across 8 files** and had reached a decision record.

**Why it happens.** A total is the part people read and copy; the components are skimmed as
decoration. So the wrong total travels and the right components stay put. This is why the error
survived: nobody had a reason to add up a sum that was already answered.

**The rule.** *A stated total is not evidence — the components are.* Whenever a document gives a
count **and** the things it counts, add them up; if they disagree, the arithmetic is the finding.
And a figure that has been copied into several documents is **more** suspect, not less: copying is
not checking, and each copy is a chance to lose the context that would have caught it.

**The general form:** read the derivation, not the result. This is [[L61]] (check the source, not
the repeated number) applied to our own writing rather than a vendor's.

**And its inverse, found the same day.** The first draft of the Business Model Kernel specification
tallied its own status register as `22 settled · 11 partly · 7 open`. The measured figures are
`22 · 10 · 8`. **The sum was right — 40 either way — and the split was wrong.** So "it adds up" is
not a check: a wrong split hides behind a correct total just as easily as a wrong total hides behind
correct components. Both halves of a figure need deriving, and the half nobody re-derives is the one
that is wrong. This is also why the critic pass that caught it is written into the document itself
rather than mentioned in a message.

---

## L67 — catching an error does not un-abort a database transaction

**What happened.** `mercato init` died with `current transaction is aborted, commands ignored until
end of transaction block`. The statement that actually failed was nowhere in the app log, because the
code that runs it wraps it in `try { ... } catch {}`. The Postgres server had it: a scope lookup
`select "organization_id", "tenant_id" from "feature_toggles" where "id" = $1` against a **global**
table that has neither column.

**Why it happens.** In Postgres a failed statement puts the whole transaction into the aborted state,
and every later statement in that transaction is then rejected whatever it is. A `catch {}` is a
JavaScript construct; it has no power over the server's transaction state. So the pattern *"fire a
speculative query, swallow the failure, carry on"* is safe only when the query is **not** inside a
transaction — and a query inside a command handler almost always is.

**The rule.** *When a caught error and a later, unrelated-looking error share a connection, the first
is the cause and the second is the symptom.* To diagnose: read the failing statement from the
**database**, not from the app — `log_min_error_statement` is already `error` by default, so the
server logs it; grep the server log for `STATEMENT:`, which the app log will never contain. To
prevent: do not run a query that can fail inside a transaction without knowing it can succeed — here,
ask the schema which columns exist (the codebase's own `columnExists` does exactly that) instead of
selecting them blind.

**Proven, not guessed:** both errors were logged on the **same backend PID**, so it was demonstrably
one connection and one transaction.

**The general form:** a swallowed exception is not a neutral act — it hides the first link of a causal
chain, and every later failure in that chain then reads as a separate bug.

---

## L68 — a fix that is not built into the artefact you are running is not a fix

**What happened.** B-15 half 1 was diagnosed and fixed in source on 2026-10-04 16:51, and the fix was
verified with two test suites. On 2026-10-05 the reset still produced a half-seeded database with an
"already seeded" marker — because the running image had been built at **03:08 the same day**, ~11.7
hours *before* the fix, and was still executing the old script. Diffing the script out of the
container against the repo copy is what showed it.

**Why it happens.** The repo is the thing being edited; the container is the thing being run. Every
tool that reports — tests, lint, a diff, a commit — reports on the edited thing. Nothing in the normal
workflow reports on the run thing, so "fixed and tested" and "fixed and running" drift apart silently,
and the drift is invisible exactly when the fix matters most.

**The rule.** *Before concluding a fix is in effect, read the artefact that is actually running.*
Concretely: `docker inspect <image> --format '{{.Created}}'` against the commit dates of the fixes;
and when the running code is what matters, diff the file **out of the container** against the repo
copy. A build that has not been run is a hypothesis.

**The general form:** [[L61]] says read the source, not the repeated number. This is its counterpart
for anything deployed — read the artefact, not the repository.

---

## L69 — fixing one copy of a duplicated pattern is not fixing the pattern

**What happened.** The **B-15 half-2** bug was a blind scope lookup — `select "organization_id",
"tenant_id" from "<table>"` against a global table that has neither column. It was found in
`query_index/di.ts`, fixed there, rebuilt, and **verified present in the running container**. The
reset then failed in exactly the same way: same statement, same abort, same place in the log.

That identical failure is what exposed the real shape of the problem: the lookup had been
copy-pasted into **five** places across two packages, and the copies carried comments pointing at
each other (*"same pattern as vector_upsert.ts"*). The three in the search subscribers were the ones
actually firing, because they register at startup.

**Why it happens.** A fix is naturally scoped to the file you were reading. Verifying the fix
*reached the artefact* feels like the end of the job — and it is, for that file. Nothing in the
process asks "where else is this written?", so a pattern that exists N times gets fixed once, and the
one remaining copy produces a failure indistinguishable from "the fix did not work".

**The rule.** *Before fixing a defect, search for the shape of the defect, not the site of the
symptom* — grep the distinctive line, count the copies, and fix them at one shared place if you can.
And: **a fix that is confirmed deployed and still fails identically is evidence that you fixed the
wrong copy.** That is a signal to widen the search, not to doubt the fix.

**The general form:** the identical-failure-after-a-verified-fix is a *measurement*, and it points at
duplication. [[L62]] says a failing probe proves nothing until you know the probe works; this is its
counterpart — a fix that provably deployed and changed nothing tells you where to look next.

## L70 — running a test against each copy of a duplicated file does not make the copies agree

**What happened.** `init-or-migrate.sh` — the script that decides whether a database needs initialising
— exists twice in the repo: `docker/scripts/` and `packages/create-app/template/docker/scripts/`. Both
copies had to be fixed by hand for B-15. While wiring the tests into CI, the obvious improvement was to
run the test against *both* copies rather than just one, and that is now done.

It is not enough, and the reason is worth stating precisely. The test asserts **behaviour** — exit codes,
and whether the marker is written. So:

- a copy that has been **broken** fails its run → caught;
- a copy left behind at **older-but-still-correct behaviour** passes its run → **not caught**.

So if someone improves one copy and forgets the other, CI stays green and the stale copy ships into every
app scaffolded by `create-app`. The two copies are byte-identical today (`sha256 838969fe…`) **only
because both were edited by hand**.

**Why it happens.** "Test both copies" *feels* like it closes a duplication hole. It closes the half
where a copy is broken; it does nothing about the half where the copies have diverged. Two files can each
be self-consistently correct and still disagree with each other — and a behaviour test is structurally
unable to see that, because each run only ever looks at one file.

**The rule.** *Duplication needs a comparison, not more test runs.* A parity check is a different kind of
assertion from a behaviour check: it compares the artefacts **to each other** — a `diff`, a hash, or a
sync tool that owns the mirror. If two files are supposed to be identical, something must assert that
they *are*; running the same test twice is not that thing.

**The general form:** before claiming a duplicated pattern is covered, ask what the assertion actually
*compares*. If every check looks at one copy at a time, nothing is comparing them. [[L69]] says fix the
pattern rather than the copy; this is the same defect one layer up — **the guard was also written per
copy.** Tracked as **N-14**.

## L71 — Yarn 4 will not run a script before an install has happened

**What happened.** Adding a CI job for the Docker-free shell tests, the natural step was
`yarn test:docker-scripts`, because that alias in `package.json` is the single source of truth for what
the tests are. The job deliberately needs no dependencies — the tests are pure `sh` — so it was written
without a `yarn install`.

**Measured, in a clean `node:24` container with the repo's real `package.json`, `.yarnrc.yml` and
`yarn.lock`, and no `node_modules`:**

```
Usage Error: Couldn't find the node_modules state file - running an install might help (findPackageLocation)
```

So `yarn run` needs the install state to be present even for a script that touches no dependency. The job
would have dragged a full `yarn install` (minutes, on a large monorepo) into a job that needs none of it.
Fixed by invoking the same files directly with `sh`, and keeping that list in step with the alias.

(A smaller surprise on the same errand: with *no* lockfile at all, Yarn fails even earlier with
`This package doesn't seem to be present in your lockfile`.)

**Why it happens.** "Running a script" sounds dependency-free — it is just a shell command out of
`package.json`. But Yarn Berry resolves the workspace and needs its install state present before it will
dispatch a script, so the install is a precondition regardless of what the script itself does.

**The rule.** *In a Yarn Berry repo, a CI job that runs a yarn script must install first — so if the job
needs no dependencies, call the underlying command directly instead of the alias.* Pick one deliberately
and say so in a comment: the alias is more maintainable, the direct call is far cheaper. You cannot have
both, and this was found by measuring rather than by assuming — the assumption was that `yarn run` is
dependency-free.

## L72 — before adding a gate, find the gate that already exists

**What happened.** The two copies of `init-or-migrate.sh` needed a parity guard ([[L70]]). The obvious
move was to invent one — a new CI step, or a bespoke shell test beside the other docker-script tests.
Neither was needed. `ci.yml` already had a step called **"Check create-app template parity (always,
unfiltered)"** running `yarn workspace create-mercato-app test`, and
`packages/create-app/src/lib/` already held a whole family of `template-*.test.ts` parity guards — one
of which asserts byte-identity between a template file and its monorepo source, in exactly the shape
required.

It surfaced only because a grep for the *concept* ("template-sync") hit the file — after two earlier
greps for the *names I expected* (`"template:sync"`, `"scripts/__tests__"`, `"node --test"`) had missed
it and left me believing no such gate existed. The near-miss was a duplicated CI gate that would have
looked perfectly reasonable and run forever.

**Why it happens.** You decide what the guard should be *before* looking for whether it exists, then
search for the thing you decided on. Searches are built from your own vocabulary, so they tend to
confirm the plan instead of testing it. The existing mechanism is usually named after the **concept** it
serves, not after the words you would have chosen.

**The rule.** *Before building a gate, enumerate the gates that already run.* Read the CI workflow's
step **names** end to end, and list the test files in the directory where a guard of that kind would
live. Only then decide whether to add one. A step literally named "…parity (always, unfiltered)" is not
something to rediscover — it is something to extend.

**The general form:** the same discipline as [[L51]] — *"nothing enforces this"* is a claim about the
repo and needs the same evidence as any other. The honest finding here was narrower and more useful
than the first guess: nothing enforced **this file**, while the mechanism to enforce it already existed.

---

## L73 — the filter decides what you can see, and it answers "nothing" just as confidently as "here it is"

Twice in one deployment session I concluded something was wrong with a file when the file was fine.
Both times the fault was in how I looked, and both times the raw output would have shown it in one line.

**First instance.** A Traefik routing rule in a compose override read
``Host(`a`) || Host(`b`)``. I checked it with `grep "companai.rule"` and saw only
``Host(`a`)``, and spent several minutes building a theory about how Compose's interpolation was eating
the `||`. Dumping the full labels block showed the value was simply **folded across two lines** by the
YAML writer. `grep` prints matching *lines*; the value's second line did not match. The rule had been
correct the whole time.

**Second instance.** Measuring what a request from the public internet carries, I grepped for
`Cf-Connecting:` — with a colon, because I was thinking of the header as "the connecting header". The
real header is `Cf-Connecting-Ip:`. No match. I concluded the visitor's IP never reaches the app, and
started designing a fix for a problem that did not exist. The IP *was* there; I had written a pattern
that could not match it. (The related finding — that `X-Forwarded-For` really is unusable — was true,
and survived.)

**The rule.** *When a search comes back empty, or a value looks truncated, dump the raw thing before
theorising.* Specifically: `cat -A`, or the whole block, or the whole response — unfiltered. A filter
you wrote is a hypothesis about the shape of the data, and if the hypothesis is wrong the filter returns
"nothing" rather than "your hypothesis is wrong". Absence of a match is not evidence of absence; it is
evidence that your pattern did not match.

**Why it keeps happening.** The filter is chosen from the *same mental model* that produced the wrong
belief in the first place, so it confirms the belief instead of testing it. This is [[L46]] wearing
different clothes: the search is built from your own vocabulary, so it cannot surprise you. The fix is
to look at something you did not construct — the raw file, the raw response, the actual bytes.

**The general form:** *never let a filtered view be the evidence for a claim about absence or
truncation.* Both of these were cheap to check and expensive to get wrong — one sent me chasing a
non-existent bug, the other nearly sent me changing a correct configuration.

---

## L74 — `docker compose config` prints every secret in plaintext

Running `docker compose config` to check that interpolation had worked did what it says on the tin: it
rendered the fully resolved configuration. Which means it printed the database password inside
`DATABASE_URL`, plus `JWT_SECRET`, `NEXTAUTH_SECRET`, `MEILISEARCH_API_KEY` and the superadmin password,
into the terminal and from there into the session transcript.

**The rule.** *Treat `docker compose config` as a command that discloses secrets.* It is the right tool
for checking that variables resolve — but resolve them against a throwaway `.env`, or pipe the output
through a filter that keeps only the keys you are actually checking. Never run it against a live
deployment's `.env` and dump the output.

**What made it recoverable.** The database had not been seeded yet, so rotating cost one `rm` and one
re-run of the generator — no data to lose. Had this happened a week later it would have meant either
accepting exposed credentials or rebuilding the database. The lesson is not "be careful"; it is
**check the deployment's secrets against the kit's public defaults before first boot, and do the risky
inspection then** — the moment before seeding is the only moment when a mistake here is free.

**A related measurement from the same session:** `docker compose -f base.yml -f override.yml config`
proved that Compose **replaces** a service's `networks` list rather than merging it. Listing only the
new network in an override silently drops the service off its original bridge, and it then cannot
resolve its own database by name. The override must repeat the base's networks. (This is the opposite
of `environment` and `labels`, which do merge — the difference is worth knowing rather than guessing.)

---

## L75 — a header that arrives at the proxy is not a header the application reads

The platform behind Cloudflare could not tell its visitors apart: the login rate limiter bucketed
everyone together. The instinct was to tune the proxy. Before doing that I traced the value to the code
that consumes it, and the answer changed completely.

Three facts, each measured rather than assumed:

1. **What arrives** — a probe container behind the same Traefik showed `Cf-Connecting-Ip: 151.177.174.17`
   (the real visitor), `X-Forwarded-For: 10.0.1.1` (Traefik had *replaced* it with the docker bridge
   gateway), and `RemoteAddr: 10.0.1.2` (Traefik itself).
2. **What the app reads** — `packages/shared/src/lib/ratelimit/helpers.ts`, `getClientIp`, reads
   `x-forwarded-for` only. It never looks at `CF-Connecting-IP`.
3. **What the app does with the result** — `null` falls back to a single shared key
   (`RATE_LIMIT_FALLBACK_KEY`), so limiting still applies, but globally.

So the real client address **is** present at the application, in a header it does not read. Every
setting of the knob I had intended to tune — `0`, `1`, `2` — yields either no address or the same
internal one for everybody. Tuning the proxy would have been work in the wrong layer, and my first
draft of the override carried a confident comment asserting that depth 2 recovered the visitor's
address. It did not; depth 2 indexes off the end of a one-entry list and returns nothing.

**The rule.** *Follow a value from where it appears to the line of code that consumes it before changing
any configuration.* "The proxy can see it" and "the app can use it" are different claims, and only the
second one decides whether a setting matters. Corollary: a knob that is accepted without complaint, and
plausibly named, may still do nothing at all — `parseTrustProxyDepth` happily accepted `2` and the
behaviour was identical to the default.

**The general form:** the same discipline as [[L31]] and [[L69]] — read the consumer, not the
transport. And when the honest answer turns out to be "this knob is a no-op here", the right move is to
**remove it and say so**, not to leave it set at a value that looks deliberate. A setting that does
nothing is worse than an absent one, because it tells the next reader a story that is not true.

---

## L76 — a public address is not an open door, and DNS lives where the name is owned

Two questions arrived together, both of the form "can we just add a thing to make this work?":
*does a DNS server on the VM help?* and *can many domains share one address?* The second is a plain
yes. The first is a no, and answering it well required correcting an assumption that earlier documents
in this repo had already written down.

**What was assumed.** "This VM has no public address" — repeated in the manual, in the architecture
diagram, and in the deployment runbook's not-proven list. It reads as a fact about the network. It is
really a fact about the *VM*, and it hid a second, different fact underneath it.

**What was measured.** The VM's own address is `172.28.50.2` — private, and it exists only inside the
laptop's Hyper-V Internal switch. But the *network* the laptop sits on has a real public address,
`151.177.174.17`, confirmed by three independent services asked from inside the VM (`api.ipify.org`,
`ifconfig.me`, `ipinfo.io` — all agree), with reverse DNS `c151-177-174-17.bredband.tele2.se` and
`ipinfo.io` placing it in Malmö, Sweden, AS1257 Tele2. It is **not** CGNAT: CGNAT would live in
`100.64.0.0/10`, and this address does not.

That measurement alone would have flipped the conclusion from "DNS cannot point at us" to "DNS *could*
point straight at us". It would have been wrong to stop there, because it answers a different question
than the one that matters. **Having a public address and being reachable from the internet are two
different facts**, and only the second one decides whether a DNS record pointing at that address does
anything useful.

**The measurement that decides it.** Port 80 on `151.177.174.17`, probed from three independent vantage
points *outside* this network: `api.hackertarget.com`, `api.allorigins.win`, `r.jina.ai`. All three failed
to connect. The laptop's own attempt failed too, but that one proves little by itself — the laptop sits
behind the *same* router, and hairpin routing commonly fails even when a forward does exist. The outside
hosts are what decide it; the local test only corroborates. The router owns the address and forwards
nothing inbound. So a record pointing at it yields a name that resolves and a site that does not load —
the half-finished domain, produced by measuring the wrong layer and believing it.

**Why the DNS-server idea cannot work here, stated once.** DNS is the internet's phone book. To be the
phone book for a name you must tell the registrar "look this name up *here*", and *here* must be
reachable by everyone. The VM's only address is `172.28.50.2`, which exists inside one laptop. Listing
it at the registrar would direct the whole internet at an address it cannot reach. Plesk shipped a DNS
server because Plesk was often the authoritative server for its own zones, on a host with a real public
address; neither condition holds here. Installing one is possible and buys nothing but a thing to keep
alive.

**And the ownership fact that decides the Cloudflare path.** Cloudflare's own docs, not a blog: a
*primary (full) setup is the most common and the only one available for Free or Pro plans*, which means
the domain's nameservers must move to Cloudflare. The setup that keeps the registrar's nameservers
("partial / CNAME") is Business and Enterprise only. So "I have many domains on GoDaddy" is a yes for
sharing one address, and simultaneously a *two-step, two-place* job per domain — add to Cloudflare, then
move nameservers — because the phone book and the site are not in the same place.

**The rule.** *Reachability is measured from outside, never inferred from an address.* An address that
looks public says nothing about whether a packet gets in; the router in between is the thing that
decides, and it is not visible from the machine. Ask an outside host to connect, from more than one
outside host.

**The general form:** the same discipline as [[L73]] and [[L75]] — *the thing you can see is not
necessarily the thing that acts.* Here it was an address that existed without admitting anything, in
front of a name that resolved without reaching anything. Two layers, two truths, and the convenient one
was the one already written down. Corollary: when a document says "X has no public address", check
whether it means X, or the network X sits on — the two support opposite conclusions, and only one of
them is the question anyone actually asked.

---

## L77 — an empty variable is a value, and it will be sent

Building the "site in a directory" proof, I wanted to check that the platform's own hostname still
routed through Traefik. I extracted the hostname like this:

```bash
TUNHOST=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cf-site.log | head -1 | sed 's|https://||')
curl -H "Host: $TUNHOST" http://127.0.0.1/
```

The log had moved — `grep` printed `No such file or directory` to stderr, returned nothing on stdout, and
`TUNHOST` became the empty string. The curl then sent **`Host: `** with nothing after it, Traefik found
no router, and returned `404` with a 19-byte body. Which is exactly what a genuine routing regression
looks like.

I was one step from writing down "the platform's public hostname no longer routes" — a false alarm about
a working system, produced entirely by my own broken lookup. Re-run with the hostname spelled out by
hand, the same request returned `307` with 474,333 bytes.

**The rule.** *An empty string is not the absence of an answer — it is an answer, and it flows into
whatever you feed it.* When a shell variable is built from a command substitution, a failure in that
command produces `""`, and `""` is silently valid as a header, a path segment, a filename or a filter.
The downstream tool cannot tell "the lookup found nothing" from "the lookup never ran", so it reports on
the empty value as though it were real data.

**Guards that cost nothing:**

- `set -u` in any script, so an unset variable is an error rather than `""`.
- Check the source exists and the substitution is non-empty before using it:
  `[ -n "$TUNHOST" ] || { echo "hostname lookup failed"; exit 1; }`
- Prefer reading the value from a place you know exists. Here the authoritative source was the running
  container's own label (`docker inspect … .Config.Labels`), not a log file in `/tmp`.
- When a result surprises you, **re-run it with the input written out literally** before believing it.
  A hard-coded value and a computed one are different experiments.

**The general form:** the same family as [[L73]] — a filter that answers "nothing" as confidently as
"here it is". L73 was about a search pattern that could not match; this is about its output being used
as an input. Both produce a confident, specific, wrong reading. The tell is the same: the answer arrived
too easily, and nothing in it referenced the thing you were actually asking about.

---

## L78 — `pkill -f` matches its own command line, and will kill you

Cleaning up a proof tunnel, I ran this over SSH:

```bash
ssh ramzi@172.28.50.2 "sudo pkill -f 'http-host-header demo.test'; sleep 2; pgrep -af cloudflared"
```

The command returned **no output at all** — not even the parts that ran before the `pkill`. The reason:
`pkill -f` matches against the **full command line of every process**, and the shell running my script
had a command line that *contained the literal string* `http-host-header demo.test`. So `pkill` matched
its own parent shell and killed the session that was executing it. The tunnel did die — and so did the
output, the exit code, and any chance of seeing what happened next.

**The rule.** *A pattern used to find processes is also matched against the process doing the finding.*
Any `-f` (full-command-line) match on a string that appears in the command you are currently running is
self-referential, and the self-match is usually fatal because it is the parent.

**Fixes, cheapest first:**

- Break the literal with a character class so the pattern no longer matches its own text:
  `pkill -f 'http-host-header demo[.]test'` — the regex still matches the target, but the string in the
  command line no longer matches the pattern.
- Match something narrower than the whole line — a PID from `pgrep`, or an exact process name.
- Or avoid the shell entirely: `systemctl stop <unit>` for anything service-managed.

**The general form:** this is the same trap as a `grep` whose pattern appears in its own output file, or
a build that scans a directory it is writing into. Whenever a search and its subject share a namespace,
the search will find itself. Ask "could this pattern match the thing running it?" before running it —
and when a command returns *nothing at all*, including output you expected to appear before the
suspicious line, suspect the process was killed rather than that it silently succeeded.

---

## L79 — the scheme in a domain field is not cosmetic; it picks which listener the router binds to

Writing the step-by-step guide for putting a domain on a site, I told the owner to type
`https://shop.yourdomain.com` into Coolify's **Domains** field, on the reasoning that `https://` is what
asks for a real certificate. That advice was wrong, and reading the running source showed why.

**What the field actually does.** `fqdnLabelsForTraefik` in `bootstrap/helpers/docker.php`, read from the
running Coolify 4.3.23, branches on the parsed scheme:

| You type | Labels produced |
|---|---|
| `https://host` | router on **`entryPoints=https`**, `tls=true`, `tls.certresolver=letsencrypt` — **plus** an http router whose middleware is `redirect-to-https` when Force HTTPS is on |
| `http://host` | one router on **`entryPoints=http`**. No TLS, no redirect. |

The scheme is not decoration. It selects the **listener** the router is attached to, and Traefik's
entrypoints are separate sockets. A router on `entryPoints=https` is bound to port 443 and will never
match a request that arrives on port 80.

**Why it mattered here.** Every site on this VM is reached through a Cloudflare tunnel that connects to
`http://localhost:80`. So only the **http** router is reachable. Typing `https://` produced two failures
at once:

1. **A redirect loop** (with Force HTTPS on): tunnel → port 80 → `301` to `https://…` → Cloudflare →
   browser → back through the tunnel → port 80 → `301` again, until the browser reports *too many
   redirects*.
2. **A doomed certificate job**: `tls.certresolver=letsencrypt` makes Traefik attempt issuance, which
   cannot succeed because the HTTP-01 challenge needs the name reachable from the internet — and nothing
   reaches this VM inbound. The certificate was never needed: **Cloudflare terminates the TLS the visitor
   sees.**

The correct value is `http://`, which reads as a downgrade and is in fact the only configuration that
works: the public padlock comes from Cloudflare, and the origin hop is plain HTTP on port 80.

**The rule.** *When a value looks like a cosmetic prefix, find the code that parses it before choosing
one.* A scheme, a trailing slash, a leading `www`, an `@` — these read as presentation and are frequently
used as **branch selectors** in the layer that consumes them. Here `https` vs `http` decided which
socket the route lived on, which decided whether the request could ever arrive.

**How to check it, rather than reason about it.** Read the function from the **running** container, not
from documentation or memory:

```bash
docker exec coolify sh -lc \
  'grep -n "function fqdnLabelsForTraefik" -A 60 /var/www/html/bootstrap/helpers/docker.php'
```

**The general form:** the same discipline as [[L75]] — follow the value to the line that consumes it.
The specific trap here is that the two settings differ by one character, are both accepted without
complaint, and the wrong one *fails at request time in a different component* (a redirect loop in the
browser, an error in Traefik's ACME log) rather than at the moment you type it. Corollary: when a
control panel offers a free-text field with a scheme in it, assume the scheme is load-bearing until the
parser proves otherwise.

---

## L80 — A line-number citation means nothing without the tree it came from

**Caught 2026-10-05, by a separate hostile audit pass — not by re-reading my own note.**

The Paperclip + Hermes study's synthesis cited `acp_adapter/session.py:544` for the claim *"restore
loads every message with no limit"*. The citation was taken from the sibling project's dossier, where it
is correct. But that same file exists in **two** Hermes trees on this machine:

| Tree | The file | Line 544 |
|---|---|---|
| `library/ai/hermes-agent-main/` (581 lines) — **the tree the study names as its source** | `acp_adapter/session.py` | `"credential_pool": runtime.get("credential_pool"),` — **unrelated**. The restore is at **line 474** |
| `aissistant-package/hermes/` — the sibling's vendored copy | `acp_adapter/session.py` | `history = db.get_messages_as_conversation(` — **correct** |

So the citation was right in one tree and wrong in the other, and the study pointed at the wrong one.

**The rule.** *A `file:line` citation is only complete when it names which checkout the line number
belongs to.* The moment the same file exists twice — a vendored copy, a fork, a zip extract, an older
revision, a `node_modules` copy — the line number is a **different claim in each**. A bare path reads as
"the obvious one", and the obvious one is not always the one you measured.

**How to check it.** Resolve the path from the document's own base directory and read the line:

```bash
sed -n '544p' library/ai/hermes-agent-main/acp_adapter/session.py
```

If the line does not say what the sentence claims, the citation is broken — even though it was copied
from a document where it worked.

**The general form:** the same family as [[L3]] — *the measurement is only valid against the artefact
you actually named.* When a number is inherited from somebody else's document, you have measured
nothing until you re-take it in your own tree.

---

## L81 — A count can silently exclude the very thing it sits above

**Caught 2026-10-05, same audit.**

I wrote, in the handover document: *"`library/` holds **3,121 markdown files**."* That was a real
measurement, correctly taken. It was also wrong. On the same day I had created
`library/ai/source-docs/` — 318 markdown files — **inside `library/`**. The 3,121 was
`find library -name '*.md'` *minus* that folder. The true total was **3,439**. The number measured a
different thing than the sentence named.

Worse, the same figure appeared in **three** places in that file (2,440 twice, 3,121 once), and the
sweep updated only the ones I was looking at — so the document then disagreed with itself.

**The rule.** *Measure with the exact command that matches the words you are about to write, and
re-measure every copy of the figure, not just the one in front of you.* If the sentence says "library
holds", the command must say `library` and nothing else. A `-not -path` filter, a `-maxdepth`, or an
exclusion is a **different claim** and needs different words.

**How to check it.**

```bash
find library -name '*.md' | wc -l          # the words say "library", so measure "library"
grep -rn '2,440\|3,121' --include=*.md .   # find the copies you forgot
```

**The general form:** this is the project's oldest recurring defect — *seven wrong figures in two days,
every one from measuring a different thing than the claim named.* It keeps happening because the
measurement *succeeds*: you get a number, it looks authoritative, and the only thing wrong is that it
answers a slightly different question.

---

## L82 — "Exactly one" is an enumeration, not a feeling

**Caught 2026-10-05, same audit.**

The synthesis said *"**exactly one item is open for the owner**"* and repeated it three times, because it
read well and felt true. It had checked the obvious place. A hostile pass then walked every section and
found a second candidate — a section instructing *"decide one mental model for frequency and document
it"*, stamped as a lesson rather than as a question.

The claim was over-stated. What was actually meant was *"only one item is **genuinely** yours"* — and
proving that means walking the whole set and classifying each member, not sampling it.

**The rule.** *"Only one", "never", "always", "none" and "the only one" are enumerations. Either walk
the entire set and say how many you examined, or soften the claim.* A universal statement is the easiest
kind to write and the easiest to falsify.

**How to check it.** Count it, and put the count in the document:

```bash
grep -c 'OPEN — needs you' the-file.md    # if the claim is "one", the count must be 1
```

**The general form:** the same discipline as [[L1]] — *a confident label is not an inspection.* "Exactly
one" is a label. The inspection is the walk.

**And the fix is worth copying.** When the audit found the second candidate, the honest repair was not to
promote it to a second question but to state the classification rule and name the items that were
**deliberately not** the owner's. A claim of "one" is defensible only when it comes with the list of
things it is a claim *about*.

---

## L83 — a file that exists is not a mechanism that runs

**Caught 2026-10-06, during the core-module audit.**

The claim was that the mutation-guard engine was *live and auto-wired for every module*. It rested on
the fact that the app imports a generated registry: `apps/mercato/src/bootstrap.ts:44` imports
`guardEntries` from `.mercato/generated/guards.generated.ts`, and the CLI generator has a step that
scans each module's `data/guards.ts` and populates it. Every part of that sentence is true — and the
mechanism was dead. The running file said:

```ts
export const guardEntries: GuardEntry[] = [];
```

**Zero entries.** The generator scans `data/guards.ts`; only **three** modules ship one, and none of
them were in the registry. The guards that actually ran did so through hand-written per-route calls on
roughly four to six routes. So "the registry exists and is wired" was true, and "guards run for every
module automatically" was false. This is **D0** — it now leads Phase 0 of the build order.

**Why the first instrument missed it.** The evidence offered was the *import* — the wiring diagram. That
proves the door is installed, not that anything walks through it.

**What to do instead.** Measure the **behaviour**, not the structure. Two counts that share no failure
mode:

1. Read the generated artefact and count what it actually contains.
2. Find something that would only agree if the claim were true — here, the generator's **own test**,
   which asserts that a module shipping `data/guards.ts` *must* appear in the output. When the registry
   is empty and a module ships a guards file, the test's premise is violated. That second route is what
   turned a suspicion into a finding.

**The general form:** *"it exists" is not "it is built."* The same sentence is the owner's whole reason
for asking: *"we can't compromise core architecture just because something already exists."* When you
report something as built, say **what you ran** and **what it produced** — not what file imports what.

---

## L84 — counting empty folders is not counting tests

**Caught 2026-10-06, the same audit, by a second pass.**

A sub-agent was asked to inventory 34 modules and report, per module, the number of tests. It reported
**"0 unit tests"** for every module it named. The second pass counted the actual files and got
**15, 21, 5, 12, 11, 13, 7, 9, 14** for the same modules — a completely different answer.

**What went wrong.** The agent looked at a directory tree, saw that the test sub-directories it checked
were empty, and generalised. The tests were not in the sub-directories it looked at; they were one level
up. It measured **the wrong place** and reported it as **the wrong quantity** — exactly the failure the
owner has now caught seven times in two days: *measuring a different thing than the claim names.*

**What to do instead.** Count **files that match the thing you are counting**:

```bash
# the count is files whose name says "test", not folders that might contain tests
find packages/core/src/modules/<mod> -name '*.test.ts' -o -name '*.spec.ts' | wc -l
```

Then spot-check one module by hand and confirm the number is real before trusting the sweep.

**The general form:** [[L82]] said *"exactly one" is an enumeration, not a feeling.* This is its twin:
**a count is an enumeration too.** State the predicate you counted, and prove it on one member, or the
number is a guess wearing a number's clothes.

**The good news, worth recording.** Both defects in this audit were caught by the **same discipline** —
a second pass whose only job was to break the first. Neither survived contact with an independent
instrument. That is the loop working as designed.

---

## L85 — a test that mocks the layer you are changing proves nothing

**Caught 2026-10-06, while migrating `workflows` off the deprecated guard resolver (D2-wide).**

The work was: replace a deprecated resolver call inside a per-module wrapper
(`beginWorkflowsMutationGuard`) with a registry call, then prove the change by **mutation** — disable
the block path and the tests must go red; neuter the after-success and they must go red too.

**Both mutations left the suite green.** The tests mocked the **module wrapper** — the exact file being
changed — so the mutated line never executed. A green suite was read as "the guard works"; it proved the
mutation was invisible, which is the opposite.

**Why it happens.** When you inherit tests for a piece you are about to change, the instinct is to keep
the existing mock and re-point the assertions. But the mock target *is* the subject. If the test's
`jest.mock` names the file you are editing, the test can never fail for the reason you care about.

**What to do instead.** Stub **only the layer underneath**, and let the layer you are changing run for
real:

```ts
// WRONG — the wrapper is the thing under test; mocking it makes your mutation a no-op
jest.mock('../mutation-guard', () => ({ beginWorkflowsMutationGuard: jest.fn(...) }))

// RIGHT — stub the registry call; the module wrapper runs for real
jest.mock('@open-mercato/shared/lib/crud/route-mutation-guard', () => ({
  runRouteMutationGuards: (...args: unknown[]) => runRouteMutationGuardsMock(...args),
}))
```

**The rule.** *Before you trust a mutation proof, name the file the mutation edits and confirm the test
actually executes it.* A mock that severs the path between the test and the mutated line turns every
"RED" into a guaranteed green — and a guaranteed green is the most convincing lie in the toolkit. This is
[[L21]] (*a control that holds the mistake fixed proves nothing*) one layer down: a test that skips the
changed code holds nothing at all.

**The general form:** a proof must exercise the thing that changed. If it exercises a stand-in for that
thing, it is a proof of the stand-in.

---

## L86 — a tracked count is a claim about the artefact, not a running total you trust

**Caught 2026-10-06, across the seven-module `D2-wide` guard-resolver migration.**

A platform-wide migration tracked a count that had to tick down — `198 → 177 → 161 → 151 → 142 → 134
→ 126` deprecated call sites. Each tick was quoted in the plan, the tracker item, the handover and the
journal. Two failures recurred, both in the number itself:

1. **The "before" was carried forward, not re-derived.** The "before" on module N is the "after" of
   module N−1; a wrong figure propagates silently. Fixed by re-running the **same** classifier against
   the clean tree (`git stash push -u`; classify; `git stash pop`) and requiring the delta to equal
   **exactly this module's** call count.
2. **The two counting tools disagreed by one (`126` vs `127`).** The script stripped only *trailing*
   `//` comments, so it still counted lines whose content *begins* with `//`, `*` or `/*` (JSDoc
   continuations). Both tools must drop leading-comment lines.

There was also the twin of [[L84]] in the **same** migration, one level up: a *file* count of `55` came
from an ad-hoc command that used a **different comment rule** than the two agreed methods, so it was not
comparable to them. Re-running the **agreed** classifier gave `52`, and the delta then matched the three
repointed files.

**Why it happens.** Once a number is written it reads as measured, and the next tick is tempting to
compute rather than measure. A number that is only ever *incremented* is a summary, not an observation —
the same defect as [[L49]], in slow motion over seven commits.

**What to do instead.** For every tick: re-derive the "before" from the tree with the **agreed** tool,
measure the "after" the same way, and check `before − after == this module's count`. If the arithmetic
does not match the artefact, the artefact is right and the number is wrong. Two tools, one of them a
different program, must agree.

**The companion fact — a count can be right and still mislead.** A module reaching **0** on this count
is *not* "the module is guarded". The count only sees routes that *used to call* the deprecated
resolver; a route that calls **no guard at all** is invisible to it. Measured at the first module
(`workflows`, 2026-10-06): `workflows` **10 of 19** (the first count said 13, which was wrong; it
counted files), `inbox_ops` **10 of 14**, `perspectives` **0 of 3** — all since closed (the sweep is
now **0** across all 35 enabled modules). So the scope sentence goes
**either way** and must be measured, not assumed — *"0"* is a claim about the resolver, never about
coverage ([[L48]]).

**The general form:** a number is an observation with a date, a tool and a predicate. Re-take the
observation every time you quote it, and never let a count stand in for the property you actually care
about.


---

## L87 — a migration plan's per-item arithmetic is a guess until the source is read

**Caught 2026-10-06, migrating `translations` in `D2-wide` — the eighth module.**

The queued task said the module had **"6 deprecated guard calls in 2 files"** and, in the plan's
mapping table, implied **4 guard objects** — the same shape as the seven modules before it, where
"calls → objects" had usually been roughly half. Reading the source showed the routes collect **one
guard object each**, and that the two "halves" were **two different routes**, not one route with two
verbs: it is **2 objects**, and the repo-wide count drops **6**, not 4.

The plan's number was not random. It was derived from a **pattern** — earlier modules' ratios — rather
than from this module's code. That is exactly the failure mode a plan is most likely to have: the
earlier rows were right *because they were measured*, and the later row *looked* consistent with them
without being measured at all.

**The companion finding, which is worse.** The plan's step said to "repoint the route files", and the
sweep had been described as walking `route.ts` files. **`put/locales.ts` is not a `route.ts`** — it
exports its handler as the module **default** with a `metadata.path`. A sweep globbing only for
`route.ts` would have skipped it, reported the module clean, and left a live write route on the
deprecated resolver — a false green in the *safe-looking* direction, which is the direction nobody
re-checks. Found only by walking **every `.ts` file under `api/`**.

**Why it happens.** A plan written from a count is cheaper to produce than a plan written from the
source, and it is indistinguishable from one at a glance. Both failure modes above produce a plan that
*reads* as measured.

**What to do instead.** Before executing a planned item, re-derive **that item's** numbers from its own
files — not from the plan's table, and not by scaling an earlier module. For this class of work the
enumeration must be **by file content** (does this file export a write verb?), never by file **name**.
Then check the tick: `before − after == this module's real count`.

**The general form:** an inherited estimate is a hypothesis. The plan tells you *what* to do; only the
source tells you *how much*. Read the thing you are about to change, count it yourself, and let the plan
be wrong out loud rather than silently.

## L88 — an empty test run exits 0, so a path that matches nothing looks like a pass

**Caught 2026-10-06, while critic-passing the `translations` `D2-wide` migration.**

The suite's own directory is named `[entityType]/[entityId]`. Passing that path to Jest **unescaped**
gives:

```
npx jest --config jest.config.cjs 'src/.../[entityType]/[entityId]/__tests__/mutation-guard.test.ts'
→ No tests found, exiting with code 0
```

Jest reads `[entityType]` as a **glob character class**, matches nothing, and — this is the trap —
**exits 0**. Read quickly, "no failures, exit 0" is a pass. It is the opposite: **nothing ran.**

Instead of finding this, I nearly recorded a *false green* against a mutation I had deliberately planted
to be caught. Two mutations in a row "passed" and that should itself have been the alarm: a mutation
that changes behaviour **cannot** leave a biting suite green. The signal was there and I read it as
success.

**The general form — a runner that reports "nothing to do" as success is indistinguishable from a
runner that reports success.** Any tool whose empty-input behaviour is exit 0 must be checked for
**work done**, not just exit status. The safest habit for a path containing `[ ]`: use
`--runTestsByPath`, which takes the literal path. Failing that, escape the brackets, or assert the
runner reported a non-zero test count.

**What to do instead.** When a mutation leaves a suite green, **do not record the proof** — first
re-run the exact same invocation and read the **test count**. A bite that fails to bite is evidence
about the *invocation* before it is evidence about the *test*. And when a result is surprising in the
reassuring direction, that is the moment to look hardest, not the moment to tick the box.

**Check it with a count, always:** `Tests: N passed` where N is the number you expected. Zero tests
passing is not a passing suite.

## L89 — a plan that inherits a count is right by luck, not by method; a `route.ts` glob is not a route audit

**Caught 2026-10-06, migrating `planner` in `D2-wide` — the ninth module, one after L87.**

Two findings, and the second is the important one.

**1. The plan's number can be right — and that changes nothing about L87.** The queued task said
`planner` was **4 calls / 2 files → 2 guard objects**, and walking every `.ts` file under `api/`
confirmed exactly that. This is the **first module in the sweep whose figure survived re-measurement
unchanged** — and it is recorded *because* it is the exception, not because it validates the method. The
rule from L87 is "re-derive the figure", not "the figure is wrong". A plan that happens to be right is
right by luck; the re-derivation is what makes it knowledge. Had this module been the first one measured,
the earlier modules' errors would have looked like anomalies instead of the pattern.

**2. The named-export trap recurred, and it is now confirmed as a class, not a one-off.** `planner`'s
two write routes are **`availability-weekly.ts`** and **`availability-date-specific.ts`** — neither is a
`route.ts`. Both export a **named** `POST` with `metadata = { POST: { requireAuth: true } }`. A sweep
that globs only for files named `route.ts` finds **neither file**, and reports the module clean while
leaving **both** live write routes on the deprecated resolver.

That makes two modules out of nine with a write route a name-based scan cannot see:
`translations/put/locales.ts` (L87) and `planner`'s two files. **Two independent confirmations make it a
class.** The general rule, stated once and to be applied every time: **enumerate a module's write routes
by what the file *contains* — does it export `POST`/`PUT`/`PATCH`/`DELETE`, by name or as default? —
never by what the file is *called*.** In this codebase both conventions are in live use (`route.ts` and
named exports with a `metadata` object), so the name is not a signal at all.

**What it would have cost.** The failure is silent and reads as success: the deprecated-call count for
the module would show 0 (the routes are not scanned), the module would be marked done, and two live
writes would still bypass every registry guard. Nothing in the test suite or the count would catch it,
because both would be measuring the files that were found.

**How to check it, concretely.** After migrating a module, confirm the migration's arithmetic against
the **files**, not the plan: `before − after == this module's real count`, and the file count must fall
by the number of files actually repointed. Here: 120 → 116 calls (−4) and 47 → 45 files (−2), matching
the two routes changed.

## L90 — a small `D2-wide` number can sit on top of a large `D2-gap`; a claim written into code must be measured, not remembered

**Caught 2026-10-06, migrating `auth` in `D2-wide` — the eleventh module.**

Three findings, and the first two are the ones that would have cost something.

**1. The plan said "1 file" and that was true — and it was the single most misleading true number in the
sweep.** `auth` had **2 deprecated calls in 1 file**, exactly as the plan said. But the module has **18
files exporting a write verb**. "One file" invites the reader to conclude the module is nearly clean. The
opposite is true: **only 3 of the 18 are guarded at all** — `users/resend-invite` (the migrated route),
and `users/route.ts` + `roles/route.ts` (guarded via `makeCrudRoute` → `collectAndRunGuards()`). The
other **12 resource-write verbs across 10 files call no guard whatsoever**: `users/acl` (PUT),
`roles/acl` (PUT), `sidebar/preferences` (PUT, DELETE), `sidebar/variants` (POST),
`sidebar/variants/[id]` (PUT, DELETE), and five `authority/*` routes (POST each).

That is **`D2-gap`**, not `D2-wide`, and `auth` carries the **worst ratio measured** — worse than
`workflows` (10/19 — first counted as 13, wrong) and `inbox_ops` (10/14), which previously looked like the bad cases. **The general
rule:** a module's `D2-wide` count measures only the calls that *used the deprecated resolver*. It says
**nothing** about the writes that never called any guard. **Measure both, every module, or the small
number hides the big hole.** The `D2-wide` sweep is a tidy-up; `D2-gap` is where writes are actually
unprotected, and a module can be "done" on the first while being worst-in-class on the second.

**2. A wrong claim written from memory was caught only because it was checked against the walk.** The
wrapper header's **first draft** documented the `D2-gap` inventory — and named a **different, wrong**
set of files. It listed `users/route.ts` as unguarded (it is guarded, via `makeCrudRoute`); it counted
`authority/projects` as a write route (**it exports GET only**); and it miscounted the `sidebar/variants`
verbs. Every one of those was plausible and none was measured. The correction came from walking the
files and reading each export — the same walk that produced the right answer, run *after* the wrong one
had already been written into the source.

**Why this is a lesson and not just a typo:** the claim lived in a **JSDoc block in production code**,
where a future reader treats it as documentation. A wrong note in a comment is not caught by the
compiler, the tests, or the count — it is caught by nothing, and it is read by the person who came to
that file precisely because they do not know the answer. **The rule:** a factual claim about the
codebase written into a comment, a doc, or a commit message is a **measurement**, and it must be taken
from the artefact before it is written — never recalled. If it cannot be measured at the time, say
"unverified" rather than a number.

**3. On the migrated route itself, the guard is not the protection.** `resend-invite`'s real defence
against touching a foreign user is `assertActorCanAccessUserTarget()` (`lib/grantChecks.ts:130`), called
**before** the guard. The migration is still correct — it removes the **bypass** and means the module's
next guard is enforced — but a reader who assumed the mutation guard was the security control would
over-read the change. **Name the control that actually holds, or the change is credited for work it is
not doing.**

**How to check it, concretely.** After migrating any module, run two counts, not one: (a) the deprecated
call sites, and (b) a walk of every write verb (does the file export `POST`/`PUT`/`PATCH`/`DELETE`?) with
its guard mechanism — `makeCrudRoute`/`collectAndRunGuards`, the module wrapper, or **nothing**. Report
(b) beside (a) in the progress note. If a header or note names a file as unguarded, that name must have
come from step (b) on the same day.

---

## L91 — a **comment** can fail a code guard: scanners that regex raw file text do not strip comments

**What happened (2026-10-06, the `directory` migration).** The new wrapper
`directory/api/mutation-guard.ts` carried a header JSDoc that *explained*, in prose, that
`organization-edges` PATCH calls `enforceCommandOptimisticLockWithGuards()` and that the wrapper's own
route uses the synchronous `enforceCommandOptimisticLock()`. Both are true statements **about other
files**. But `src/__tests__/optimistic-lock-command-coverage.test.ts` scans every source file with
`readFileSync(...)` and tests the raw text against `/enforceCommandOptimisticLock\s*\(/` — **it never
strips comments**. So the wrapper was reported as a *direct call site that bypasses the record_locks
seam*, and the full suite went **1 suite / 1 test RED** — caused entirely by a comment, in a file that
calls neither helper.

**The trap underneath the trap.** The first fix attempt made it worse: the explanatory comment was
rewritten to *quote the regex*, and the quote itself contained `enforceCommandOptimisticLock(` — so the
"fix" reproduced the failure. A comment that documents a scanner is subject to that scanner.

**The rule.** Before writing a symbol's **call syntax** (`name(`) into a comment, a doc, or a test
fixture, check whether any code guard regexes raw file text for it. If one does, **name the symbol
without the parentheses** and say why in the comment (this is what the `directory` wrapper now does).
**A green full-suite run is the only proof a code guard is satisfied** — a targeted test run of the
changed module would have missed this entirely, because the guard lives in `src/__tests__/`, not in the
module. **Always run the whole suite after adding a file whose comments name other helpers**, and prefer
`grep -rn "<symbol>("`-style checks to confirm the name does not appear in a scanned position.

**Corollary for counts (same family as L90).** Several of this repo's guards measure by **text**, not by
AST: the optimistic-lock coverage guard, and the D2-wide count's `grep -vE ":[0-9]+:\s*(//|\*|/\*)"`
filter which drops comment lines. Text-based measurement is cheap and auditable but it reads **prose as
code**. When a count or a guard looks wrong, the first question is not "is the code wrong?" but "is the
instrument reading a different thing than the claim names?" — which is the same failure mode as L90, one
layer down.

## L92 — `git grep <rev>` prefixes the output with the revision, and a `split(':',2)` classifier then reads every match as one file

**What happened (2026-10-06, proving the `feature_toggles` count).** To re-derive the "before" figure I ran
`git grep -n -e "validateCrudMutationGuard(" -e "runCrudMutationGuardAfterSuccess(" d682c09 -- packages apps`
and piped it through the *same* classifier used for the working tree. The working tree's `git grep` output is
`<path>:<ln>:<content>` — **3 fields**. But when a **revision** is given, git prints `<rev>:<path>:<ln>:<content>`
— **4 fields**. The classifier did `parts = line.split(':', 2)`, so `parts[0]` became the **revision** and the
whole run collapsed to a single pseudo-file: it reported **`sites: 139 files: 1`** for a tree that actually held
**108 sites in 41 files**. I nearly wrote "the docs' before-count is wrong by 31" — when the error was in my
probe.

**Why it is dangerous.** It fails *toward a plausible number*. `139` is not absurd, `files: 1` is odd but
easy to explain away ("maybe it's the concatenation"), and the wrong number is the one that would have
**rewritten six documents**. This is the exact shape recorded in L90 and in the skill's "suspect your own
probe" note: a probe written as a shell one-liner is a suspect; the agreed classifier is the reference — but
the classifier must be **fed the same field layout** in both runs.

**The rule.** When a classifier is reused against **different output shapes** (working tree vs `git grep <rev>`,
single-file vs recursive, `grep` vs `git grep`), **assert the field count first** and print the raw values
behind the result before believing the total. For revisions, split with `maxsplit=3` (`<rev>:<path>:<ln>:<content>`),
or strip the revision with `sed 's/^[^:]*://'` first. **A classifier that runs clean is not a classifier that
ran on the right thing** — the same "measured a different thing than the claim names" failure that has now
produced wrong numbers in this project more than once. The corrected probe (prefix-aware) gave
**108 / 41 before, 106 / 40 after — delta exactly the module**, which is what the docs already said.

## L93 — a defence you added but never tested is a defence a refactor may delete; the mutation proof is what tells the two apart

**What happened.** Building `SD-2` I protected a core role on **three** layers: the route, the command,
and a new `refuse?` predicate on the shared `DataEngine.deleteOrmEntity` (the store choke point). The
route and command checks were each covered by their own suite. The store predicate was **not** — every
test that reached the store also passed through the command's own check first, so silencing the predicate
changed **no test result**. The 6-mutation proof caught it: **M4 (`if (false && opts.refuse)`) went GREEN**
(16/16 core, 12/12 shared) while the other five went RED. The hook was **decorative** — a future refactor
could have deleted the option argument and the whole suite would still have reported green.

**Why it is dangerous.** A layer added "for safety" reads as *more* protection, so it raises confidence
in proportion to how much it does **not** do. The failure is silent, and it is exactly the shape a human
review misses: the code *is* there, it *is* called from real call sites, and it *is* plausible. Only a
mutation that **removes** it shows whether anything notices.

**The rule.** For every layer you add to a defence-in-depth stack, the proof must include a mutation that
**disables that specific layer** and shows a test goes RED. Layers that share a test are one layer for
proof purposes. When a layer's mutation stays GREEN, do **not** rationalise it ("the earlier layer catches
it anyway") — either **add the test that makes it bite**, or **delete the layer on purpose** and say so.
A defence with no test is not a defence; it is a comment that compiles. (Here: closed by
`shared/src/lib/data/__tests__/deleteOrmEntity.refuse.sd2.test.ts`, 5 tests; M4 then failed 3.)

*Cross-ref: L21 (a control that holds the mistake fixed proves nothing), L85 (a test that mocks the layer
you are changing proves nothing).*

## L94 — a suite that passed for you and failed for the critic is not "green"; it is "green on your run", and the claim must say which

**What happened.** I ran the full `packages/shared` suite, saw the tail, and wrote into the work record
that it was **201 suites / 2385 tests, 0 failures**. A separate hostile-critic agent then ran the **same**
suite and got **1 failed / 8 failed** — the `dynamicLoader.tsconfig.test.ts` suite (a Windows
`spawnSync … EBUSY` host failure, already catalogued as **CC-19**). It reproduced the 8 failures on a
**stashed clean tree**, so the failure was pre-existing and unrelated to my change — but my claim as
written was false.

**Why it is dangerous.** "Green" is a claim about a *run*, not about *code*. A flaky-or-environmental
suite makes the same tree produce different verdicts on different runs, so a claim stated as a bare fact
("the suite passes") silently asserts more than the measurement supports — and the next reader trusts it
and does not re-run. The trap is worse when the failure is **pre-existing**: the temptation is to wave it
away ("not mine"), which is right about *causation* and wrong about *the claim*. The claim still said
"0 failures".

**The rule.** When a suite is known to be flaky or host-failing, the claim must read **"green on this run
(N suites / M tests, 0 failures); it fails X on other runs for the known reason, catalogued as CC-n"** —
never a bare pass. State the measured figure **with its condition**, and name the pre-existing failure
rather than folding it into silence. **A verdict is a measurement; report it as one.** (Owner's rule 0:
every claim carries an observation — and the observation here includes the run it came from.)

*Cross-ref: L1 (a confident label is not an inspection), L10 (report the whole picture, not the first red
flag), L14 (a green build is not a working platform).*

## L95 — a blocker repeated for weeks can be a **false premise**, and it will have been copied into every document before anyone re-measures it

**What happened.** Two register rows (`CC-7`, `CC-31`) and two plan documents (`PLAN-SD-1`, `PLAN-SD-2`)
all deferred real work because *"a migration is unprovable on this host — the unit suites mock the
EntityManager"*. The owner pushed back and asked for the schema change to be made. Re-measuring found the
premise **false**: a **live Postgres 17** had been running in `mercato-postgres-local` the whole time;
`Migration20261009090000` was written, applied with `mercato db migrate`, and read back on the live DB
(`is_core boolean not null default false`, backfill `superadmin=t`), then rebuilt into the container's
runtime artefacts and proven through the restarted app. Nothing had ever forbidden the change.

**Why it is dangerous.** A premise that is *convenient* (it defers hard work) gets copied — into the
register row, into both plans, into code comments — and each copy makes it look more measured than it is.
No single copy was ever re-derived from an observation; they all cited each other. A **blocker** is the
most dangerous place for this, because a blocker is exactly what nobody tries to falsify — its job is to
stop you looking.

**The rule.** **A blocker is a claim, and every claim carries an observation (rule 0) — including the
claim that something *cannot* be done.** When a blocker is more than one session old, re-measure it before
trusting it: run the command it says is impossible, and look at the output. And when a measurement
falsifies a premise, **correct it everywhere it was copied** (rule 13) — here five documents. Stated in
the owner's own standing instruction (now `WORKING-RULES.md` §1 rule 14): *"ANYTHING that blocks the work
you HAVE TO clearly state it repeatedly till it is resolved."* A blocker you repeat but never re-test is a
blocker you have stopped thinking about.

*Cross-ref: rule 13 (correct a falsified premise everywhere it was copied), rule 0-zero-two ("it exists" is
not "it is built"), L1 (a confident label is not an inspection).*

## L96 — a guard on the SEED path is not a guard on the CREATE path, and the two are found in different files

**What happened.** The durable `is_core` marker was stamped in the seed (`setup-app.ts`, for the built-in
`superadmin`/`admin`/`employee` roles) and the guard was wired on the delete and rename paths. Then the
hostile critic found a **HIGH** hole: the **API create path** (`auth/roles/commands/roles.ts`) inserted a
role with `{ name, tenantId }` and **no `isCore`**, so a role the setting marks core — created at runtime —
was born `is_core = false`. One rename would move its name out of the setting and leave it fully
unguarded: the exact hole the work existed to close, re-opened for every non-seed core role.

**Why it is dangerous.** "I stamped the marker" is true of *a* path (the seed), and the seed is the path a
reader naturally checks first — it is where the built-in roles visibly come from. The create path is in a
different file, a command, not a setup script. A property that must hold **for every row** was enforced on
one of the two ways a row is born, and the one it missed is the one that runs in production.

**The rule.** When an invariant is "every X is stamped/has/gets Y", enumerate **every place an X is
created** and check each — not just the one that is easiest to find. Seed and runtime-create are different
paths *by construction* (one is bootstrapping data, one is user action), so a check on one says nothing
about the other. Ask "how many ways can this row come into existence?" before declaring the invariant held.

*Cross-ref: rule 9a (own the code you touch — the create path was mine the moment I stamped the seed),
L85 (a test that mocks the layer you are changing proves nothing).*

---

## L97 — a **declared** grammar with no reader is not an enforced one; the honest boundary must be measured, not implied

**What happened.** `SD-4` Slice C was asked to build *"the per-verb grammar (S11/CC-5)"*. It built two
things: the **records** the catalogue yields (the structural block widened from one `'structure'` verb to
the five S11 verbs), and a **settings home** for the grammar's *level* (`structural-settings.ts` — seed +
strict parser + pure `resolveStructuralLevel` + the `actorTypeForPrincipal` bridge + fail-closed read). The
module's own JSDoc said a guard "calls it". Then the hostile critic ran `grep -rn "structural-settings"
packages` (excluding `dist`/`node_modules`) and got back **only the test file**. Nothing in production
imports it. The grammar is *declared and readable*; it is *not enforced* — and the comment claiming a
caller existed was **false in the tree**.

**Why it is dangerous.** "The grammar is built" reads as "the rule is in force". It is not: no guard reads a
level, no route escalates on one, and nothing changes for any actor. A reader who trusts the comment ships a
platform where the AI's structural reach is *described* but not *bounded*. The gap is invisible to every
test in the module — they all pass, because they test the functions that were built, not the wiring that was
not.

**The rule.** When a change adds a **mechanism** (a parser, a decision, a settings home) but not its
**enforcement** (the caller that acts on it), say so with an *observation*, not a promise: run the grep for
the module's importers and report the count. If the count is zero, that is the finding — record it in the
module's own header **and** schedule the wiring in `COMPLETION-CALLBACKS.md` with the trigger that brings it
back (here, **CC-37**: the guard gaining the escalate outcome). A mechanism with no caller is a legitimate,
honest partial build; a mechanism *claimed* to be enforced when it has no caller is the decoration the
working rules forbid. The distinction is one grep wide.

*Cross-ref: rule 9a (own the code you touch — fix it or schedule it, never leave it implied), L83 (a file
that exists is not a mechanism that runs), L94 (a suite green on your run, not the critic's, is a claim
about a run, not the artefact).*

## L98 — a mutation that does **not** flip a test may be **unreachable**, not redundant; and a mutation `git checkout` restore can silently destroy uncommitted work

**What happened (two failures in one session, both in the CC-37 mutation proof).** (1) I mutated a function's
final `return null` to `return settings.defaultLevel` and re-ran its suite: **all tests still passed**. My
first read was "the tests are weak". The truth was subtler: for every input the tests used
(`actorType='human'`), an earlier branch (`return findLevel('any')`) returned *first*, so the mutated line was
**dead for those inputs** — the mutation never executed. The tests were fine; my *mutation* was unreachable.
Crafting the mutation to bite the reachable path (`actorType='any'`) then required the test that reached it,
which did not exist — so the real gap was a **missing input**, found only by asking *"does my mutation even
run?"* (2) My restore helper used `git checkout -- <file>`. On a file with **uncommitted edits** that reverts
to *HEAD*, not to the pre-mutation working tree — it deleted the entire change (the new function and all doc
edits) and the md5 "proved" a file that was now *wrong*. The mismatch (`RESTORE-MISMATCH`) was the only thing
that caught it.

**Why it is dangerous.** (1) A mutation that silently does not run is worse than no mutation: it *looks* like
proof and manufactures false confidence in tests that may genuinely be thin. "Red-then-green" is only evidence
if the **red** is real — i.e. if the mutated line is on the path the test drives. (2) A restore that reverts to
HEAD on an uncommitted file is **data loss dressed as verification** — the md5 check passes against the wrong
baseline, and an uncommitted-but-correct change is gone.

**The rule.** (1) When a mutation fails to flip a test, ask **"did the mutation actually execute?"** before
concluding the test is weak — trace the branch. A mutation must be **reachable** for the inputs the test uses;
if the only reaching input is not tested, the gap is a **missing input**, and the fix is a test that reaches
it (here: `actorType='any'` on an unreached triple — the sole path to the final `return`). (2) Restore from a
**byte copy you took**, never `git checkout`, for any file with uncommitted changes; and check the md5 of the
*restored* file against the *pre-mutation* value, not against HEAD. (Both were fixed this session: a
`snapshot`/`restore` helper that copies the file and verifies md5, and the `any`-actor test.)

*Cross-ref: L93 (a defence you never tested is one a refactor may delete — the mutation proof tells the two
apart), L94 (green on your run is a claim about a run), the encoding-trap note (a byte-identical restore must
be proven, not assumed), rule 13 (a falsified premise is corrected everywhere it was copied — here CC-37's own
callback named a `resolveStructuralLevel` design that would have weakened S9).*

## L99 — a test whose two inputs are both produced by the function under test is **tautological**: it passes even when that function is replaced by a naive one

**What happened.** `SD-5` added `structuralSettingsEqual(a, b)` (compares two settings cell-by-cell over the
grammar's closed sets) and a test named *"ignores raw-shape differences (key presence/order) between
equivalent settings"*. Both inputs were built with `parseStructuralSettings(...)`, which **normalises** both
to the identical full shape. The hostile critic mutated the function itself to `return JSON.stringify(a) ===
JSON.stringify(b)` — a naive deep-equality — and the suite stayed **green** (`49 passed`). The test could not
tell the real function from the naive one, because after normalisation the two inputs *were* byte-identical:
the whole point of the test — that raw shape must not matter — was never exercised.

**Why it is dangerous.** A test that passes for *any* implementation of the function it names is **not a
test of that function** — it is a coincidence that happens to run, and it manufactures confidence in exactly
the property it claims to pin. Worse, it is invisible: the assertion (`toBe(true)`) is correct, the inputs
look reasonable, and the suite is green. The defect is in the **relationship** between the inputs and the
function under test — the inputs were pre-processed by the very thing being tested, so the test could only
ever see already-equal values.

**The rule.** For an equality/hashing/normalisation function, at least one input must be a **hand-built,
deliberately differently-shaped** value that the function under test did **not** produce — a raw literal the
other path (a parser, a serialiser) would emit. And **prove the test bites**: mutate the function to the
naive wrong implementation (`JSON.stringify(a) === JSON.stringify(b)`) and confirm the test goes **RED**. If
it stays green, the inputs were too well-normalised to distinguish the implementations — the test is
tautological, and the fix is a raw-shape-*differing* pair (here: a hand-built object with only one object
kind, a different key order and extra empty buckets; re-proven RED under M26). This is the sibling of **L98**:
L98 is a mutation that never *runs* (unreachable); this is a mutation that runs but whose *test inputs*
cannot tell the two implementations apart.

*Cross-ref: L98 (a mutation that does not flip a test may be unreachable — check it ran; this is the other
half — check the inputs can distinguish), L93 (a defence you never tested is one a refactor may delete), rule 9a
(own the code you touch — the critic found it; I fixed it and re-proved it), the `check-the-premise-before-the-
blanket-fix` discipline (re-measure the premise of a claim before trusting it).*

---

## L100 — a **headline number that is incremented by hand** drifts away from the boxes it claims to be derived from; the *sections nobody re-opens* go stale first

**What happened.** `platform_points.md` opens with a single headline number — *"72 of 321 units"* (it read
*"73 of 330"*). The file's own §L states the number is **derived from the ticked boxes, never typed**, and
gives the exact counting rule. Over several sessions the headline was **bumped by hand** as rows closed
(`68/329 → 70/329 → 71/330 → 72/330 → 73/330`) instead of the check being re-run. When the owner asked for a
forensic sweep and the count was actually **re-derived**, the boxes summed to **72 / 321**, not 73 / 330.
Two *section* figures had been stale the entire time — §H was kept at `0 done` even after its `P10` line was
ticked, and §K was kept at `3/23` even though §K has **13 lines and 1 tick** (the "23" had counted *ids named
inside one bullet* — `N-16/17/18/19`, `V-09…V-13/S-04` — as if each were its own line). §B's unit count was
one short.

**How it was caught.** The owner refused to accept the number on faith and asked for a forensic re-check;
the count was then derived **twice by two independent routes** (a local script, and a separate blind
hostile-critic agent) and **both returned 72 / 321**.

**Why it is dangerous.** A derived number is only as trustworthy as the last time it was *actually derived*.
Bumping a total by hand looks harmless — it is one and the same as the real delta **only if every section is
still current**, and the sections that no one re-opens (the ones whose work is *done* and therefore
"finished") are exactly the ones that go stale unnoticed. The headline then becomes a **typed** number
wearing the badge of a derived one — and a reader who trusts the badge propagates the error into handovers,
starter prompts and status pages.

**The rule.** A number that claims to be derived must be **re-derived, in full, in the same change that
changes any box** — never incremented. If a file says "computed, never typed", the derivation must be
**reproducible from the raw file** (state the rule, then show the per-section sum), and any session that
edits a tick re-runs it. When a derived figure is found wrong, **fix it everywhere it was copied** (rule 13)
— and record *why* it drifted, so the reason is not rediscovered. This is the standing-instruction version of
`N-20`: one fact, one canonical copy — and the copy must be *computed*, not remembered.

*Cross-ref: `N-20` (one fact, one canonical copy; two stale copies of one count is a defect), rule 13
(re-measure premises; correct a falsified premise everywhere it was copied), §L `derive-counts` in
`platform_points.md` (the rule this lesson protects), L1 (a confident label is not an inspection — the
headline's "%" badge is a label; the boxes are the inspection).*

---

## L101 — when you **re-derive a number from a text file**, the *parser* is the thing under test: a near-miss on `319` vs `321` was **my measurement being wrong**, not the file

**The trap.** Asked to re-derive `platform_points.md`'s headline from its boxes, I wrote a small parser
and it returned **`72 / 319`** — two units short of the file's `72 / 321`. The honest first response is
*"the file is wrong"*. It was not. The file was right and **my parser was wrong**.

**What actually happened.** The file's rule says a line starting `- ` is a whole point, marked `☐` or `☑`.
My regex matched exactly those two markers. But the appendix contains **two** whole-point lines marked
`- ✅` instead (`S11` and `S12` in section G) — and my pattern silently skipped both. `319 + 2 = 321`: the
file's number was correct all along, and the "discrepancy" was an artifact of my instrument. **A second,
independent verifier then reproduced the *same class* of error from the other direction** — its first pass
returned `364` because it counted the `-     *(was PARTIAL…)*` **annotation** lines (which are prose under a
point, not points) as units. Two different parsers, two different wrong answers, one correct file.

**Why it is dangerous.** A re-derivation is supposed to be the *check* on a typed number. When the parser is
wrong, the check **manufactures a defect that does not exist** — and the natural next move (edit the file to
"fix" it) would have written the *parser's* bug into the source of truth, i.e. exactly the L100 failure in
reverse. The instrument failing is indistinguishable, on first reading, from the patient failing.

**The rule.** When a re-derivation disagrees with the file, treat **both** as suspects: before touching the
file, (a) enumerate the **actual distinct line-markers / line-classes** in the raw text and prove your
parser covers *every* class (here: `☐`/`☑`/**`✅`** for whole points, `-   - ` for sub-points, and the
indent-only `-     *(was …)*` lines are **annotations, never units**); (b) get a **second route** that is
genuinely different — and when the two routes disagree, assume the *instruments* disagree until the raw
lines are printed and counted by eye. A re-derivation that reports a defect must be able to **show the
offending lines**, not just a total. **The number that survives two independent correct parsers is the
number; a total from one parser is a hypothesis.**

*Cross-ref: L100 (a derived number must be re-derived, never incremented — this is the failure mode *of the
check itself*), L1 (a confident label is not an inspection — a parser's total is a label until the lines are
read), rule 0 (the code/text is the evidence, and here the *reader* of that evidence was the defect),
rule 13 (a falsified premise must be corrected everywhere — but *first* be sure it is falsified).*

## L102 — before you call a file **"not a leak surface"**, name the **entity the code actually reads** — not the entity its *name* suggests; I dismissed a real leak by checking the wrong table

**The trap.** Closing the *client-side export* leak (`CC-48`), I had to say which other exporters were and
were not leak surfaces. I looked at `customers/components/CustomerTodosTable.tsx`, saw it exports "todo"
rows, then checked the encryption map for a **`customer_todo`** entity, found none, and wrote the table off
as **"not a leak surface"**. That claim was **false**, and it was false for a reason worth banking: the
table does not read a `customer_todo` entity at all — it reads **`customers:customer_interaction`**
(`listCanonicalTodoRows` → `em.find(CustomerInteraction, …)`), and **`customer_interaction` IS marked**
(`title`, `body`). Even worse, the rows **alias** the marked fields — `todoTitle: interaction.title`,
`todoDescription: interaction.body` — so the mask (which keys on the true field name) would **never match**
the alias, meaning the value is decrypted server-side, aliased, sent to the browser, and exported **in
clear**. **Only the mandatory hostile critic caught it**; I had already written the false "not a surface"
claim into a planning document.

**The rule.** A **negative** claim ("X is not a leak surface" / "Y cannot happen") is the most dangerous kind,
because it *closes* an investigation. So a negative claim must (a) name the **concrete object the code
reads** — the *entity id at the read call* (`em.find(CustomerInteraction, …)`), the *column actually
serialized* — not the object the file's **name** or purpose suggests; (b) be derived by **following the data
path to its read site**, not by matching a plausible-looking identifier; and (c) be **stated with the search
that would falsify it** ("I looked for a marked entity among the ones this table reads"). If you cannot name
the read site, you have not measured — you have guessed, and a guess in the negative voice is worse than no
claim at all.

**The second half.** When the critic *did* find it, the right response was **not** to fold it silently into
the change in hand: it is a **different defect with a different root cause** (aliasing, not the browser), so
it became its own callback row (`CC-49`) with its own reproduction, and the parent row-14 status was left
**🟡** rather than falsely ✅. **Splitting a newly-found defect out is not "leaving work incomplete" — it is
keeping the record honest**; the sin would be to mark row 14 done while a leak of the same requirement
survives.

*Cross-ref: L101 (the *reader* of the evidence was the defect — here the *scope* of the claim was), L1 (a
confident label is not an inspection), rule 0 (the code is the evidence — so read *which* code), rule 2 (two
routes or it is not a finding — the leak was confirmed by the critic **and** reproduced by me **and** a
verifier), rule 13 (a falsified premise corrected everywhere it was copied), rule 11 (an owner's decision is
not the assistant's to close — the new defect's fix choice was registered, not silently taken).*

---

## L103 — a mock that is **the same regardless of what you pass it** makes the test **unable to fail** on the one bug you are testing; and the **first** draft of a security fix is where the critic earns its keep

**The trap (two, in one change).** Building `CC-49` — the customer-tasks export leak — my first route test
mocked the encryption service **entity-agnostically**: `getEncryptedFieldNames: jest.fn(async () =>
encryptedFields.value)`. It returned the same marked-field set no matter **which entity id** the route asked
about. But the *entire* bug under test is "did the route ask the **right entity** for its marked fields?" —
and with that mock, a route that asked for **any** id (or none) still passed. The test **could not fail** on
the exact defect it existed to catch. **The same first draft then passed the wrong id in production too:**
`CUSTOMER_INTERACTION_TODO_ADAPTER_SOURCE` = `'adapter:todo'` (a row **source tag**) instead of
`CUSTOMER_INTERACTION_ENTITY_ID` = `'customers:customer_interaction'` (the entity id), so
`getEncryptedFieldNames` matched **zero** rows and the mask was a **silent no-op** — the leak the fix was
supposed to close would have shipped, with a green test beside it.

**How it was caught.** Only by the **mandatory hostile critic, a separate agent**. It ran the fix's *own*
premise through the code and noticed the mock's output never depended on its argument, then traced the id
back to its definition and found it was a source tag, not an entity id. I had already written a "tests
prove it" line into the plan. **I reproduced both from the code** (rule 2) before fixing.

**The rule.** (1) A mock **must depend on the argument the code under test varies**; if the thing you are
testing is *which* value was passed, the mock must return **different** results for different values and the
test must **assert the value was asked for** (here: assert the route queried **both**
`customers:customer_interaction` **and** `customers:customer_entity`, and never `adapter:todo`). A mock that
returns a constant is a **tautology** (see L99) wearing a service stub. (2) **Interrogate a constant that
looks like an identifier**: before using an exported `*_ID`/`*_SOURCE` constant as an id, **read where it is
defined** and confirm its *value* is the id the callee matches on — `..._SOURCE` and `..._ENTITY_ID` are
different kinds of thing even when both are strings. (3) A fix that spans **two** entities must resolve the
marked fields of **both** and treat a field as marked if **either** says so (`some`, not `every`), or half
the leak survives.

**The second half — the fix's first draft is where the critic earns its keep.** All three of this change's
real defects (the wrong id above; a **flat** `format` export that left a nested `customer.displayName`
column `undefined` and, with no projection, serialized the **whole object** in clear; and a static guard
that a `['pre'+'pare']` + hand-built `Blob` download could slip past) were **in the first draft** and were
found **only** by the separate-agent critic. A correctness pass by the author is not a substitute: the
author reads for *intent*, the critic reads for *falsification*. Budget it as part of the change, not as an
optional extra.

*Cross-ref: L99 (a tautological test — here the tautology was a *constant mock*), L102 (the sibling
false-negative in the same feature: the wrong *entity* dismissed a leak), L101 (a measurement was the
defect), rule 2 (two routes — both the wrong id and the flat-export leak were reproduced independently), rule
10 step 6 (the hostile critic as a **separate** agent is mandatory, and here it found every real defect).*

## L104 — a coverage test's **discovery** predicate is part of its guarantee: if it recognises only *one* spelling of the thing it audits, the routes written the *other* spelling are silently outside the claim — and the header must not claim more than the discovery enumerates

**The trap.** `CC-47`'s coverage test asserts that every human CRUD `GET`/list route is permission-gated. Its
"which routes exist" walker (`exportsGet`) recognised `export const GET = …`, `export function GET`, and
`export { GET } from …` — but **not** the **destructured** form
`export const { metadata, GET, POST, PUT, DELETE } = makeCrudRoute({…})`, which is the **canonical** shape the
CRUD factory prints. A destructured binding name is an `ObjectBindingPattern`, **not** an `Identifier`, so the
`ts.isIdentifier(decl.name) && decl.name.text === 'GET'` check returned false for it. **Nine real route files
fell out of the audited set entirely** — B never saw them — while the sanity test happily pinned a count
(`287`) that *encoded* the omission. The detector was fine; the **discovery** was narrow, and a narrow
discovery is a silent hole in a *coverage* claim, the same way a wide detector is a silent hole in a *gating*
claim.

**How it was caught.** Only by the **hostile critic as a separate agent**, on the **twelfth** pass — eleven
earlier passes had attacked the detector's *predicates* (comment tokens, `as const`, spreads, `['']`, `let`,
duplicate keys, `Object.assign`, in-place array mutation) and all had been closed. It was the pass that asked
the *other* question — "is the set of routes you claim to cover the same set you actually enumerate?" — that
found it. I reproduced it from the code before fixing: `exportsGet` returned **false** for every one of the
destructured files, including the two `makeSalesLineRoute` line lists that were in **neither** assertion.

**The rule.** (1) In a coverage test, **test the discovery against every spelling** the language and the
project's own factories permit — the shape you happened to write first is not the only shape the codebase
uses. Add a **discovery self-check fixture** for each form (I did: all four export forms asserted
`exportsGet === true`, and a POST-only file asserted `false`), so a future narrowing fails loudly. (2) A
**sanity count that pins the discovered set** does not protect against a *discovery* gap — it *bakes it in*.
Where a count is pinned, pair it with a check that the excluded files are **named**, not absent (here: the
newly-surfaced routes went onto the pinned `DELEGATED_GATED_ROUTES` list with verified evidence). (3) A
header must **not claim more than its code proves**: when I widened discovery, the honest fix was to also
write the test's **bound** into the header — A covers the `makeCrudRoute` family, B covers routes that export
a `GET`, their union is **not** the whole tree (161 of 457 route files are in neither — every one a
mutation endpoint, zero exporting a `GET`; the earlier "163" was the pre-fix value), so *"every read is
permission-filtered"* is guaranteed for the **human CRUD list
family**, not for *every route that exports a `GET`*. (4) **Never let a promise of "all" rest on a walker
whose exclusions you have not enumerated** — enumerate them. (5) **When you widen a discovery predicate, the
counts it fed do not update themselves**: fixing the destructured-export gap lifted B from 287 to 296 and
dropped "in neither" from 163 to 161, but the *derived* number 163 had been copied into five documents and
survived until a reader (the owner) asked what it meant. A correction must be **grepped for**, not remembered.

*Cross-ref: L93 (a defence never tested is one a refactor may delete — here the "defence" was a discovery
predicate), L99 (a tautological test — a narrow discovery makes a coverage test tautologically true over a
smaller set), L101 (a measurement was the defect — here a *discovery* was), L95 (a false premise copied into
every document), rule 0 (only the code is evidence — the fix began by reading the walker, not the doc),
rule 2 (two routes — the pre-fix `287` and the destructured family were each re-measured independently),
rule 10 step 6 (the hostile critic as a **separate** agent; the twelfth pass found what eleven predicate
passes could not), rule 13 (the falsified "no per-entity permission filter" premise corrected in all six
documents).*

---

## L105 — a declaration put where *you* assumed it lives can be unreachable by the very entity that proves it; the place a mechanism must live is decided by the **scope of the guarantee**, not by the file you read first

**The trap (row 16, Option A).** The mission was *"restrict a person to their own rows"* for **every** CRUD
entity. I placed the new opt-in declaration (`rowScope` / owner-marker) in the **search registry**
(`SearchEntityConfig.aclFeatures`'s neighbour, `shared/src/modules/search.ts`), because that is where the
analogous **per-entity permission declaration** (`aclFeatures`, `CC-46`) already lived, and copying the
pattern that works is a good instinct. **But the search registry exists only for the 11 modules that define a
`search.ts`** — and the **first entity I wired to prove the mechanism, `api_keys`, has no `search.ts` at all.**
The declaration was therefore **unusable for the very entity that demonstrated it** — I could have written a
green test proving a mechanism no real entity could use.

**How it was caught.** By reading the code the declaration would have to serve (rule 0b — *"what is there;
which prerequisites must be done"*) **before** building on it: grepping the entities that actually have a
`search.ts`, then grepping the first target entity, and finding it absent. No test would have caught this —
the test would have passed, over the wrong home.

**The rule.** (1) Before you put a declaration in a file, **name the set of callers the guarantee must cover**
and **prove the file is present for every one of them**. A declaration belongs at the **lowest layer every
covered caller shares**, not at the layer of the nearest existing example. (2) An example is a **hint about
style**, not **evidence about scope**: the existing example (`aclFeatures`) was correct *for its own promise*
("every **searchable** entity declares its ACL") and wrong for this promise ("every **CRUD** entity can opt
in"). (3) The correction is a **rule-13 sweep** — the wrong home was already copied into the plan's §3 and the
requirement draft; fixing the code without grepping for the claim leaves the documents lying. I reverted the
`search.ts` edit (kept only a NOTE pointing at the true home), moved the declaration to **`OrmEntityConfig`**
(the layer every `makeCrudRoute` caller shares), and rewrote the coverage walker to walk `orm: {}` blocks.

*Cross-ref: L89 (a plan that inherits a count/a shape is right by luck), rule 0b (measure the prerequisites
before building), rule 13 (correct a falsified premise **everywhere it was copied**), rule 2 (two routes — the
"searchable entities" set and the "CRUD entities" set were each measured, and they are not the same set).*

---

## L106 — a hook that short-circuits the shared builder is a place the shared builder's new clause never reaches; wiring a clause at the **one** place you know is not the same as wiring it at **every** place the query is built

**The trap (row 16 hostile-critic round 1 — a REAL leak, caught before commit).** The scoping mechanism's
design claim was *"`buildScopedWhere` is the single scope builder; wire the owner clause there and every read
is scoped."* I wired it there and a test went green. The critic asked a different question — *"is
`buildScopedWhere` actually on the path of **every** list?"* — and found that the `api_keys` `GET` route's
custom **`beforeList` hook builds its own query builder and short-circuits** via `throw json(...)`: it
**returns the response itself and never calls `buildScopedWhere`**. So an own-only role would still list
**every key in its organization**. My wired owner clause was **dead code for that route** — I had scoped the
thing I *knew about* (the shared builder) and missed the route that bypasses it.

**How it was caught.** The **hostile critic as a separate agent**, asking "where else is a query built for
this entity?" — not "does the clause you added fire?" The fix was to add the owner clause inside the
`beforeList` hook too, plus a GET test (the earlier tests only exercised the shared path).

**The rule.** (1) When you add enforcement at a **shared** choke point, **enumerate the paths that bypass
it** — a hook, a raw `createQueryBuilder`, a hand-written query, a second route — **before** claiming the
guarantee. "Single choke point" is a **claim to verify**, not an assumption to build on. (2) A green test over
the choke point proves the **choke point**, not the **route family**: the critic's question ("does this route
reach it?") is a different question from yours ("does my clause do what I intend?"), and you need both. (3)
This is the **same defect class as L104** (a *discovery* gap in a coverage claim) applied to **enforcement**:
a claim of "every read is scoped" rests on a **discovery** of "every read path", and the discovery is exactly
where a hand-rolled bypass hides.

*Cross-ref: L104 (a discovery predicate is part of a coverage guarantee), L96 (a guard on one path is not a
guard on another, found in a different file), rule 2 (two routes), rule 10 step 6 (the separate-agent critic
earned its keep on the first pass).*

---

## L107 — a security carve-out must be checked against **every** notion of the privileged principal the platform actually has, not the one on the object you happen to hold

**The trap (row 16 hostile-critic round 2 — a REAL defect).** The design was *"a super-admin is never
own-restricted."* I implemented it as `if (!acl.isSuperAdmin && hasOwnScopeGrant(...)) rowScope = …`, reading
the flag from the **ACL** object (`rbacService.loadAcl()` → `{ isSuperAdmin, … }`) — the object I already had
in hand. The critic found that the platform has **a second, independent** super-admin notion:
**`auth.isSuperAdmin`**, set on the request (`applySuperAdminScope` in `shared/src/lib/auth/server.ts`, and
for API-key principals). **When the two disagree** — a super-admin whose `auth` flag is set but whose ACL flag
is not (or vice versa) — the user was **own-restricted on `GET`** while being treated as super-admin
everywhere else. The carve-out was checked against one notion and the platform honoured two.

**How it was caught.** The separate-agent critic, by grepping for **every** place the concept
*"super admin"* is expressed — not by testing my one flag.

**The rule.** (1) For a **security exception**, first **enumerate every expression of the privileged
concept** (`grep -ri "superadmin\|super_admin"`), then design the check against **all** of them; a carve-out
that misses one notion is a hole, not a partial defence. (2) When the two notions live on **different objects
the code already holds** (here `acl` and the request `auth`), the check must **consult both** — `a || b`, not
whichever is closer. (3) The fix's shape can itself mislead: the correct read of `auth.isSuperAdmin` required a
cast (`(auth as Record<string, unknown>).isSuperAdmin === true`) because `AuthContext` does not **declare** the
field — the type system did not surface the second notion, which is *why* it was easy to miss. **A runtime flag
the type does not declare is a flag that hides from the compiler and the reader alike.**

*Cross-ref: L97 (a declared thing with no reader is not enforced — here, an *undeclared* thing with a real
reader was not noticed), rule 10 step 6 (two critic rounds, two real defects — the critic's value is asking
the question you did not), rule 2 (two routes / two notions), L103 (the first draft of a security fix is where
the critic earns its keep).*

---

## L108 — the "obvious" implementation of a suffix helper is wrong in the direction the tests must catch: `strip(x) === feature` returns **true for a plain grant**, which would own-restrict a role that was merely granted the feature

**The trap (row 16, caught by my own new test — before the critic).** To implement *"does this role hold the
own-scoped form of the feature?"* the natural code is
`granted.some(g => stripOwnScope(g) === feature)`, where `stripOwnScope` removes a trailing `.own`. It reads
well and it is **wrong**: for a **plain** grant (`api_keys.view`, no suffix), `stripOwnScope` is a **no-op**,
so `strip('api_keys.view') === 'api_keys.view'` → **true**. The helper then reports *"holds the own-scoped
grant"* for a role holding the **unscoped** grant — and the factory would **own-restrict a role that was never
scoped**, silently hiding rows from a user who was promised the whole tenant. The fix is to require the
**positive** signal: `isOwnScoped(g) && stripOwnScope(g) === feature`.

**How it was caught.** By the **test I wrote for the helper**, on the first run — the negative case
*"a plain grant does not count as own-scoped"* failed. This is the payoff of writing the **negative** test
first: the bug is a **false positive on the negative input**, and a test suite that only proved the positive
case (`.own` grant → own-restricted) would have passed over it.

**The rule.** (1) When a helper answers a question by **stripping** or **normalising** its input, the
**identity / no-op input** is the dangerous case — write the test where the transformation does **nothing** and
assert the **conservative** answer (here: *not* own-scoped, so the user keeps their rows). (2) In security
code the **safe default is the permissive-to-the-innocent** one: an unrecognised/malformed grant must **not**
narrow a user's access, so the check must require the **affirmative marker**, never infer intent from a
successful strip. (3) The **general form**: any `f(x) === target` predicate is only sound when `f` is
**injective** on the inputs that matter; when `f` is a **projection that fixes** some inputs (a strip that
does nothing), it **confuses them with the target**.

*Cross-ref: L99 (a tautological test — here the *positive* test alone was near-tautological), L103 (the first
draft of a security helper is where the critic earns its keep — here a self-test beat the critic to it),
rule 2 (two routes — the strip direction and the identity direction were each asserted), rule 10 step 4/6
(RED-then-GREEN: this bug's test was the RED).*


## L109 — a **coverage test's predicate** is a security control, and a coarse one ("is the name mentioned *anywhere* in the file") is defeated by a **comment**; strip comments before you trust a textual match

**The trap (row 17, caught by a separate-agent hostile critic).** The new `table-coverage.test.ts` decided a
table was *"a read surface"* by searching the module's `api/**/*.ts` files for the **bare class name**. It
passed — but one of its passes was **false**: `communication_channels.ExternalMessage` was matched from a
**comment** in a neighbouring file that merely *mentioned* the class name, not from any live `GET`. A table
proved "reachable" by a sentence about it is **not** read-gated; the predicate was satisfied by prose, so the
guarantee it claimed (row 17: *"a new table cannot be added un-gated"*) was **one comment away from a hole**.

**How it was caught.** By a **separate blind hostile-critic agent** (rule 10f), whose job was to *break* the
gate, not to re-run it — it inserted a class name into a comment and watched the gate stay green. My own
RED-then-GREEN mutations had all passed, because **each mutated the data, never the predicate**.

**The rule.** (1) A **coverage/enforcement claim is only as strong as the predicate that computes it** — so the
predicate, not the allowlist, is what the critic must attack. (2) When a check is **textual** (grep/AST over
source), **comments and string literals are attacker-controlled text**: strip them (`stripComments()`) before
matching, or the check certifies *"someone wrote this word"*, not *"the code does this"*. (3) The **general
form**: *"X is mentioned in file Y"* is **not** *"Y does X"* — and any security gate built on a text search
inherits that gap. Assert the **structural** fact (a route/handler exists), never a **textual** proximity.

*Cross-ref: L104 (a discovery predicate is part of a coverage guarantee — here the predicate's **input** was
the defect, not its **reach**), L102 (a name suggested a thing that the code did not do), rule 10f (the
hostile critic must attack the **predicate**, and must be a separate agent), rule 4 (two routes).*


## L110 — when a walker reads exactly **one filename**, everything defined in a **sibling file** is invisible — and the invisible thing is marked "not a surface" by default, i.e. the failure is a **false negative that hides a real read path**

**The trap (row 17, second real hole, found by the same hostile critic).** The gate's read-surface walker read
each module's **`route.ts`** and nothing else. Measured: the `entities` module serves a live **`GET`** from
**`api/definitions.ts`**, not from `route.ts` — so `entities.CustomEntity`, a table with a real read path, was
**invisible** to the walker and got filed as *"internal"*. The gate was **green and wrong**: it silently
declared a **readable** table un-readable, so the day that table's real `GET` was removed, no test would
notice — the allowlist entry would keep the gate green.

**The rule.** (1) When you enumerate *"is this thing read anywhere in its module?"*, the unit is **the module's
whole read surface**, not one blessed filename — walk **`api/**/*.ts`** (or the module's declared entry
points), never a single guessed path. (2) **A missed discovery is a false negative in a gate whose whole job is
to force a positive classification** — so the safe direction is to **over-discover** and let the allowlist
carry the deliberate exceptions by **name + reason**, never to under-discover and let silence pass as internal.
(3) The general form: *"I read the file I expected the behaviour to live in"* is **L105's trap** (a
declaration lives where the **scope** says, not where you looked first) applied to a **search** — the search's
**path list** is a premise that must be measured, not assumed.

*Cross-ref: L105 (the mechanism lives at the scope of the guarantee, not the file you read first — here it was
the *search*, not the *declaration*), L104/L109 (a discovery predicate is part of the claim), rule 0b
(measure the premise — including *where* a thing is read), rule 10f (a separate critic found it).*


## L111 — a **sanity threshold with slack** (`> 200`, `> 30`) is a **silent-permission slip**: it lets a whole class of regression pass because the number only has to stay *above* a floor — pin the **exact** figure so any shrink is RED

**The trap (row 17, third real hole, found by the same hostile critic).** The gate opened with loose sanity
checks (`tables > 200`, `surfaceModules > 30`) so it would not be brittle. The critic **deleted 39 tables**
from the discovery (`EXPECTED_TABLES` 233 → 194) and the suite stayed **GREEN** — the floor was 200 only in
spirit; the real numbers it compared against were loose enough that a **17% shrink of the entire audited
universe** slipped through. A gate whose job is *"a new/changed table cannot slip past un-gated"* had a hole
the size of *"any table you like, as long as a few dozen remain"*.

**The rule.** (1) In a **coverage / inventory gate**, the count of audited items is **itself an assertion** —
pin the **exact** number (`EXPECTED_TABLES = 233`), so both a **shrink** (something stopped being discovered)
and a **growth** (a new table appeared — which must be classified deliberately) turn the suite **RED** and force
a human to re-derive. (2) A floor with slack is the *right* tool for a **sanity guard against total collapse**
(a `> 0` guard against "the walker returned nothing"), and the *wrong* tool for the **guarantee itself** — use
both: a low floor to catch a broken walker, an **exact pin** to catch a silent shrink. (3) The general form:
**any threshold expressed as an inequality is a **permission** for everything on the far side of it**; a
security gate must express its spine as an **equality**, and reserve inequalities for the "did it run at all?"
check.

*Cross-ref: L100 (a number must be re-derived, never incremented — here a floor *permitted* a wrong number to
stand), L101 (the parser/measurer is the thing under test), L109/L110 (the same critic, the same session, the
same class — a gate that is green while the thing it claims to protect is gone), rule 10f (the critic is a
**separate agent** that attacks the guarantee, not the data).*

---

## L112 — a record you **mask by field name** still leaks if the value is **re-shaped** on the way out: an *index-time presenter* can promote an arbitrary string field into the displayed `title`, so "I masked the field" is not "the value cannot leave"

**The trap (row 18, first hostile-critic round).** `search_get` was masked correctly — every field the platform
classification map names was replaced with `***`. But the AI's **other** two record-returning tools did not
return the raw record:

- `search_query` returns a **presenter** shape (`title`/`subtitle`/`url`) built at **index time**. The fallback
  presenter (`fallback-presenter.ts` `findAnyStringValue`) will **promote *any* string field** it finds into
  `title`. So an entity with a classified field `api_secret` (not in the search `fieldPolicy`) would have had
  that secret **copied into the displayed title** — the mask on the raw record never saw it, because the record
  that left the tool was not the raw record.
- `search_aggregate` returns **raw bucket values**. `isGroupByAllowed` blocked grouping only on the **search**
  `fieldPolicy`, so a `groupBy` on a classified field returned the secret as a group key.

Both are the same shape: **the field was "masked", but the *value* reached the caller through a second,
re-shaped channel.**

**The rule.** (1) When a read path **transforms** a record before returning it (a presenter, a projection, an
aggregate, a join, a serialiser), masking the **source** field is not sufficient — enumerate every **egress
shape** and ask, for each, *"can this shape carry the value?"*. (2) For a **free-form promotion** (the fallback
presenter), the safe fix is to **suppress the whole shape** for a classified entity, not to try to scrub the
one field you know about — you cannot enumerate what a "find any string" heuristic will pick. (3) For an
**aggregate**, refuse the **dimension** (`groupBy`) that names a classified field, exactly as you refuse to sort
on one. *Cross-ref: L102 (name the entity the code actually reads), rule 10f (the critic found it, not the
author).*

---

## L113 — a mask that checks only **top-level keys** is defeated by one level of nesting; a recursive egress needs a **recursive** mask

**The trap (row 18, second hostile-critic round).** The first mask iterated the record's own keys and replaced
each classified one. A classified key **nested inside an object value** — `record.meta.api_secret` — was
**never visited**, so the secret left in clear. (The same would be true of a classified key inside an **array**
of objects.) This is the classic shallow-vs-deep traversal bug, and it is invisible to a test that only uses
**flat** fixture records.

**The rule.** (1) If the egress can contain **nested structures** (objects, arrays, JSON columns), the mask must
**recurse** into them (`maskValueDeep`), not just rewrite the top level. (2) The test must include a **nested**
fixture — a flat fixture proves nothing about depth. (3) The general form: **a mask's reach must equal the
egress's shape**; anything the serialiser can descend into, the mask must descend into first. *Cross-ref: L112
(the same class — "masked" is not "gone"), rule 10f.*

---

## L114 — a test whose **mock ignores its arguments** cannot catch the bug the arguments encode: the wrong-entity mutation stayed GREEN because the mock was entity-blind

**The trap (row 18, found by re-running the mutations, then hardened).** The mask resolves the classification
map **for a given entity** (`getEncryptedFieldNames(entityId)`). I wrote a mutation that passed the **wrong
`entityId`** expecting the test to go RED — and it stayed **GREEN**, because the mock returned the same set
**regardless of what entity was asked for**. The test was asserting behaviour that its own fixture had made
unobservable: **the very parameter under test was ignored by the double.**

**The rule.** (1) A mock/stub must be **sensitive to every argument the real code depends on** — if the code
branches on `entityId`, the double must branch on it too (make it **entity-aware**, keyed by the argument).
(2) After writing a mutation that *should* fail, if it stays **GREEN**, suspect the **fixture** before you
suspect the mutation — a mutation that cannot fail is a test that cannot fail. (3) Add an **explicit assertion**
that the correct argument was used (here: *"resolves the map for the **requested** entity"*), so the contract
is pinned even when the happy-path output would look identical. *Cross-ref: L103 (the same lesson from the other
direction — a double that is the same regardless of input), rule 10f (the mutation is the second critic).*

---

## L115 — two routes can **agree on every section and still disagree on the total** if one of them **counts a section the rule excludes**: §L is the ledger, not a unit — bound the walk to `A…K`, never `A…L`

**The trap (row 18, the eighth §L re-run).** The ONE-NUMBER is re-derived by two independent routes. Mine
returned `72 / 321`; a blind verifier returned `74 / 331`. Per-section they differed only on §K (`3/23` vs
`1/13`). The verifier's section regex was `^##\s+([A-K])\.\s` — which **never matches `## L.`** (the letter
`L` is outside `[A-K]`), so its parser left `sec = 'K'` open and **kept counting every `- ` bullet in the
verification ledger §L** (lines 634–862) as if they were §K points — inflating §K to 23 (the exact "23" the
file's own §L note had already warned about). Fixing the bound to `[A-L]` corrected §K to `1/13`, **but the
total then read `72 / 331`** — the extra 10 units were §L itself being summed **as a point section**.

**The rule.** (1) The derivation walks **§A–§K only**; **§L is the ledger** (it names evidence for the ticks,
it holds no points) and must be **excluded from the count** — bound the walk's **end** at `## L.` and **do not
sum L**. (2) A section-header regex must include the very letter that **ends** the walk, or the last counted
section silently absorbs the ledger. (3) When two routes disagree on the **total** while agreeing on most
sections, the disagreement is almost always **one mis-bounded region** — diff per section, then inspect the
**boundary** between the last real section and the excluded one. *Cross-ref: L100/L101 (the number is derived,
the measurer is under test), rule 4 (two routes or it is not a finding — never average, never pick the nicer
number).*

## L116 — a test-runner **path pattern** that contains glob metacharacters (`[agentId]`) **silently matches nothing**: the suite never runs, the mutation proof reads GREEN, and a broken build is certified as proven

**The trap (CC-27, the mutation proof).** I proved the RED-then-GREEN property by mutating a production file
and asserting the suite turns RED. Two mutations against the manage-surface route — *remove the 403 feature
gate*, *remove the missing-`principalId` 400* — came back **GREEN**, i.e. "the mutation did not break any
test." That reads as *"the test does not cover this line."* It was the opposite: the tests **did** cover it,
but the suite **was not running**. The path I passed was
`src/modules/ai_assistant/api/ai/agents/[agentId]/bindings/__tests__/bindings.route.test.ts`, and to jest's
**positional** test-path matcher `[agentId]` is a **glob character class** — so the pattern matched **zero**
files, jest exited 0 with *"No tests found"*, and the harness saw "no failures" and printed GREEN.

**The rule.** (1) A test runner's path argument may be a **glob**, not a literal. Any path containing `[`,`]`,
`*`, `?`, `{`,`}` can silently match nothing — and *"no tests found" is not "all tests passed."* (2) A
mutation proof must assert the **test COUNT**, not merely the absence of failures: for each mutation, confirm
the baseline suite count is the number you expect **before** trusting a RED/GREEN verdict. A GREEN that means
"0 tests ran" is the most dangerous kind of false proof — it certifies a broken build. (3) Prefer matching a
bracket-free **substring/regex** (`--testPathPatterns "bindings\\.route"`) over a literal path when the path
contains brackets. (4) The tell: the total test count for the run is **smaller than the sum of the suites you
asked for** — here the combined run reported **8** (the coverage suite alone) instead of **15** (8 + 7).
*Cross-ref: L114 (a test that cannot catch the bug), the hostile-critic protocol (a SEPARATE agent re-ran and
found the hole), rule 10 (RED-then-GREEN must be a **real** proof).*

## L117 — a test can pass for the **wrong reason**: if a property is enforced in **two** places, a test that does not isolate the **new** one stays GREEN when the new one is deleted

**Seen in `CC-55` (2026-10-11).** The build added a **binding-feature union** check inside
`resolveAiAgentTools` (`agent.requiredFeatures ∪ binding.requiredFeatures`). A test named *"the binding's
features are UNIONED with the agent's own"* seeded an agent that **already declared** a required feature, gave
the actor **no** features, and asserted the run was denied. That assertion passed — **but for the wrong
reason**: `checkAgentPolicy` (which runs *first*, and is untouched) independently denies when the agent's own
feature is missing. So when a mutation **deleted the new union check**, the test stayed **GREEN** — it was
testing `checkAgentPolicy`, not the union. **The hostile critic caught it** (mutation: only the *deny* test went
red, the "union" test did not).

**The rule.** (1) When a property ends up enforced at **two** layers, a test for the **new** layer must
exercise the case that **only** the new layer handles — otherwise it proves nothing about the new code. For a
union, that case is: the actor **holds the first set's members** but **lacks the second set's** — the old layer
passes it, so only the new layer can deny. (2) A **mutation proof** is the detector: delete the new enforcement
and confirm the named test goes **RED**. If it stays green, the test is mis-targeted (or, worse, is an L116
false-green). (3) Name the test after the case it actually isolates, not the property in the abstract.
*Cross-ref: L114 (a mock that ignores its arguments), L116 (a suite that never ran), rule 10 (RED-then-GREEN
must be a **real** proof — a mutation that does not flip the test proves the test is wrong, not the code).*

## L118 — a **structural coverage gate** that scans only **part** of the tree is blind to the rest: name the known exceptions explicitly, or a real hole hides just outside the scan

**Seen in `CC-55` (2026-10-11).** The `CC-27` binding-coverage gate asserted *"every agent dispatch site
consults the binding"* — but it walked only `api/ai/**`. A **production** dispatch site in `lib/`
(`business-ir-author.ts`, which calls `runAiAgentObject` with no binding) sat **outside the scan** and was
invisible: the gate passed while a real un-gated path existed. **The hostile critic found it** by a repo-wide
grep of the runtime's call sites.

**The rule.** (1) A coverage gate must scan the **whole** surface where the pattern can occur — not the
convenient sub-directory. If the pattern is "calls the agent runtime", the scan is the **whole package**, not
`api/`. (2) Known exceptions are **named in an allowlist with a reason and a scheduled callback**, and the test
asserts the offender set **equals** that allowlist — so a **new** occurrence fails the build *and* a **stale**
entry fails it too. (3) Prefer detecting the **call** (name + `(`, comments stripped) over a bare textual
mention, so a name in a comment is not a false hit. (4) The test that would have caught it is the one you did
not write: ask *"where else could this pattern appear?"* before scoping the scan.
*Cross-ref: L111 (a sanity floor is a silent-permission slip), the hostile-critic protocol (a SEPARATE agent
found the blind spot), rule 9(a) (own the full codebase, not just your diff).*

## L119 — a documented lesson is not an applied one: when you write a guard of a class the file already covers, **reuse its fixed form** instead of re-deriving it

**Seen in `CC-56` (2026-10-11).** Adding a coverage assertion to `binding-coverage.test.ts` — the *same file*
that already defines `stripComments()` and whose own L118 clause (3) reads *"detect the call (name + `(`,
comments stripped)"* — I matched the confirm route's source for `resolveAgentBinding(` against **raw** source.
A `// resolveAgentBinding(...)` comment satisfied it. **Two documented lessons were re-broken in one line:**
**L109** ("strip comments before trusting a textual match") and **L118 clause 3**. In the same change the
"human passthrough" test was green whether or not the production call existed — **L93**'s shape ("a defence
with no test is not a defence"), also a recurrence. A **separate-agent hostile critic** found both by attacking
the *predicate* (inserting a comment) rather than the data.

**Why it happens.** Each lesson was written in a *different* session and file, and the new guard was written
*fresh* rather than by copying the neighbouring, already-fixed pattern. The failure is not ignorance of the
rule — it is that the rule lives in **prose** while the fix lives in a **helper** (`stripComments`) two
functions away.

**The rule.** (1) Before writing a guard, ask *"has this module already solved this class?"* — here it had, and
the solution was a **named helper in the same file**; **call it**, do not re-derive the predicate. (2)
`LESSONS.md` is a **critic's checklist, not a memory**: point the hostile critic at the *classes already
documented* (comments, one-file walkers, sanity floors, non-discriminating tests) so a recurrence is caught in
the same session. (3) Every test added for a change must be **shown to fail when the change is reverted** (the
mutation proof) — a test green in **both** trees documents behaviour, it does not verify the change. (4) A
lesson is only "learned" when the **shared artefact** (a helper, a pattern) carries it, not the sentence.

*Cross-ref: L109, L118, L93, L91, L65, L104; rule 7 (LESSONS.md binds **both** ways — read **and** apply).*

## L120 — a **gate** must be at least as strict as the **runtime it guards**; porting a *measurement* tool verbatim is not porting a *gate*

**Seen in `CC-44` (2026-10-11).** The new build-time write-gate was built by "faithfully porting" the classifier
from `analysis/permission-gate/measure.js` — the right instinct per **L119** (reuse the fixed form, do not
re-derive it). That was **half** right. `measure.js` is a **measurement** tool: its predicate is
`requireFeatures\s*:` — deliberately loose, because its output is read by a **human** who classifies the
residue by hand. The **runtime** it now guards is stricter: the dispatcher fires the feature check only
`if (requiredFeatures.length)` (`apps/mercato/src/app/api/[...slug]/route.ts:207`). So the ported predicate
certified three shapes the runtime leaves **open**: (1) `requireFeatures: []` — an empty array; (2) a bare
`requireFeatures:` token inside a **regex literal** or a **TS type annotation**; (3) the
`makeCrudRoute(`/`make*Route(` **factory clause** — but `makeCrudRoute` only *relays*
`opts.metadata.requireFeatures` (`shared/src/lib/crud/factory.ts:1036`) and supplies **nothing**, so a factory
route with no `requireFeatures` is genuinely ungated. A **separate-agent hostile critic** found all three by
attacking the *predicate* (inserting an empty array, a regex, a coincidental helper), not the data.

**Why it happens.** "Faithful port" is the right instinct for a *measurer* (L119) and the wrong one for a
*gate*: the two artefacts share a classifier but have **opposite** error tolerances. A measurer prefers **no
false positives** (a human reads the output); a gate must prefer **no false negatives** (the build is the
reader, and a false PASS ships silently).

**The rule.** (1) When you turn a measuring script into a build gate, re-derive the predicate from the
**runtime condition**, not from the script — the gate's predicate must be a **subset** of "the runtime actually
enforces this". (2) A "feature carrier" is only a carrier if it **supplies** the feature — verify in the
factory's own code (`opts.metadata || {}` is **not** "supplies"), never by the factory's **name**. (3) Prove the
tightening is **free** before adopting it: measure old-vs-new classification over the real tree and show **0**
routes change (here 159 gated / 11 by-design / 170 total either way). (4) State the tool's **honest limit** — the
shapes a tokeniser cannot tell from a real declaration (a regex character class, a tuple type) — in the header,
so the gate never claims more than it proves.

*Cross-ref: L109/L119 (a coverage predicate is a security control; reuse the fixed form), L111 (a sanity floor is
a permission slip), L114 (a test that cannot catch the bug), L104 (the discovery predicate bounds the claim);
rule 0b (measure the premise in code first), rule 10 (the TOTAL quality protocol).*

## L121 — a change that **adds an enumerable object** (a route, a table, a module) drifts **every pinned count** in **every sibling coverage gate**; re-run them ALL, and expect the first failure to hide the rest

**Seen in `CC-44` (2026-10-11).** While building the write-gate, the sibling gate `crud-read-gate-coverage.test.ts`
(`CC-47`) was found **RED at HEAD** — `routeFiles.length` expected **457**, got **458** — a failure **not** caused
by `CC-44`. It was caused by **`CC-27`** (an earlier session) adding one route file
(`packages/ai-assistant/.../api/ai/agents/[agentId]/bindings/route.ts`, GET/POST/DELETE) **without re-pinning** the
count. Proven pre-existing by a `git stash` A/B (identical failure at HEAD with the working tree clean). The first
mismatch (`routeFiles`) **hid a second** (`getRoutes` 296→297 — the new route exports GET); only fixing the first
revealed the second. `crudRoutes` stayed **60** (the new route is hand-written, not `makeCrudRoute`).

**Why it happens.** The gates pin **exact** counts on purpose (**L111**: a floor is a silent-permission slip). But a
pin is only correct for the tree it was measured on. A change in **one** package (here `ai-assistant`) moves a count
in a **different** package's gate (here `cli`), which that change's author never ran. And because the assertions run
in order, the run **stops at the first** mismatch — so one failing `expect` masks the next.

**The rule.** (1) When a change adds an **enumerable** object (a route, a table, an entity, a module), treat **every**
repo-wide coverage gate as affected: run them (at least the sibling gates in the same suite dir) in the **same**
change. (2) When a pinned count fails, **do not stop at the first** — fix it, re-run, repeat until GREEN; a single
run reports only the first mismatch. (3) A pin failing is the pin **working** — the fix is to **re-measure every
count that moved**, never to loosen the pin to a floor (**L111**). (4) Record the correction where the pin lives,
with the date and the cause.

*Cross-ref: L111 (pin the exact figure), L104/L110 (a walker's discovery predicate bounds its claim), L120 (a gate
vs the runtime it guards); rule 0b (measure the premise first), rule 9(a) (own the full codebase).*

## L122 — a coverage gate that matches a call **by name** is evadable by an **alias**; a gate you just delivered is still your gate — harden it in the same change the critic names it

**Seen in `CC-57` (2026-10-11).** `binding-coverage.test.ts` scans the module for files that **dispatch an agent**
and treats a file that **also calls `resolveAgentBinding`** as GATED. Its dispatch detection was a regex on the
literal name: `/\brunAiAgent(?:Text|Object)\s*\(/`. A **separate-agent hostile critic** — one command + output per
claim — confirmed all six of my claims, then raised **one LOW**: `import { runAiAgentObject as dispatch } from
'./agent-runtime'` followed by `dispatch(...)` dispatches an agent while matching **neither** the marker list nor
the call regex, so the file would be **invisible** to the gate. The evasion was **latent** — `grep` for
`runAiAgent(Text|Object) as` and for a barrel `export … runAiAgent*` both returned **nothing** today — but it is
the very gate `CC-57` delivered, and a gate with a known walk-around is a gate that will be walked around
(**L120**: a gate must be at least as strict as the thing it guards; **L119**: a coverage predicate is a security
control).

**Why it happens.** A text scanner is the cheap, dependency-free way to enforce a structural rule across a module
(the alternative — an AST — is heavier and version-fragile). But a text scanner sees **tokens**, and a token can be
**renamed on import**. The name-matching predicate is therefore only as broad as the *spelling* it anticipates.

**The rule.** (1) When you write a name-matching enforcement predicate, resolve the **local binding name** from the
file's own **import statements** — match `X as Y` and treat `Y` as an alias of `X` — on **both** sides of the
predicate (the call you are hunting **and** the call that clears it). (2) **Pin the alias case with its own
RED-then-GREEN test** (import the entry `as` an alias, assert the scan catches it; and, symmetrically, an aliased
binder still counts as gated) so the detection cannot silently regress. (3) A critic finding on a gate you **just
delivered** is not "pre-existing, not mine" — the item exists to make that gate correct; fix it in the same
change. (4) But do **not** over-claim: state plainly whether the hole is **live** (an alias exists) or **latent**
(none does) — here it was latent, and the honest record says so.

*Cross-ref: L119/L109 (a coverage predicate is a security control; reuse the fixed form), L120 (a gate vs the
runtime it guards), L121 (a change that adds an enumerable object drifts sibling pins); rule 9(a) (own the code
you touch — including the gate you delivered), rule 13 (state the measured truth, live vs latent).*

## L123 — a `python3 - <<'PY'` heredoc through Git Bash **mangles `\n`** in string literals — write the script to a FILE instead

**Seen in the `CC-58` docs change (2026-10-11).** I added a register-hygiene note by building it in a Python heredoc and writing it with `open(p,'wb')`. The note needed literal newlines inside its string (`"…CC-58 change:" + "\n\n" + "1. A duplicate…"`). On disk the result contained a **literal `/n`** — two characters, forward-slash and `n` — where a newline was intended, so the paragraph and the numbered list collapsed onto one physical line. A **separate-agent hostile critic** caught it (`od -c` showed `: / n \n`).

**Why it happens.** Git Bash (MSYS2) rewrites an **unquoted-ish** argument/heredoc body before Python sees it: a backslash followed by `n` inside the heredoc can be transliterated to `/n` by the MSYS path-conversion layer (it treats `\something` as a path-like token). It is **intermittent and silent** — the script runs, the file is written, and only a **byte-level inspection** of the output reveals the corruption. Prose is unaffected because natural text rarely contains a lone `\n`; the damage lands precisely in the strings that *build structure*.

**The rule.** (1) **Never build content with `\n`/`\r`/`\t` escapes inside a `python3 - <<'PY'` heredoc** run through Git Bash. Write the generator to a **script file** (`Write` tool) and run `python3 script.py` — the shell never sees the escapes. (2) If a heredoc is unavoidable, build the newline from a **non-escape** — `chr(10)` — never the two-character literal. (3) **Always assert the result byte-wise** after writing structured text: `repr()` the tail, — a `\n` count, or `od -c` — so a `/n` cannot survive unnoticed. (4) This is the same family as the standing rule *"prefer script files over `python -c` heredocs"* — that rule is about **backticks / `[]` / em-dashes**; this adds **`\n` in string literals** to the mutation set. (5) Delete the helper script afterwards (do not leave scratch files in the tree).

*Cross-ref: the standing hazard note (prefer script files over heredocs); L122 (the critic found it — a separate agent verifying byte-level output is what caught it); rule 0 (only the code — here the *bytes* — is evidence).*

## L124 — a **contiguity check that compares ids in FILE order** reports a perfectly contiguous register as broken

**Seen in the 2026-10-11 docs change (the `CC-58`/`CC-59` re-classification).** After editing a register row I re-ran the register's own checks. My quick check did this: collect the `CC-n` ids **in the order they appear in the file**, then test `nums == list(range(1, len(nums)+1))`. It printed **`contiguous 1..N: False`**. The register was, in fact, **perfectly contiguous (1..59, no gaps, no duplicates)** — proven by the correct check (`set(nums)` covers `1..59`, and a `Counter` shows no id appears twice).

**Why it happens.** The register file lists its rows in **narrative / thematic order**, not numeric order (a `CC-58` row can sit above a `CC-40` row, a DONE block can cite an earlier id again, etc.). Comparing the *file-ordered* id list to a monotone `range()` therefore fails **whenever the file is not sorted by id**, which it never is. The failure is **in the instrument, not the artefact** — exactly the standing lesson *"a `0` (or a `never read`) is a claim about the instrument, not the data"*, met in its positive twin: **a `False` from a mismatched check is a claim about the check, not the file.**

**The rule.** (1) To prove **contiguity**, compare the **set** of ids to the expected set (`set(nums) == set(range(1, N+1))`), never the **sequence**. (2) To prove **no duplicates**, use a `Counter` (or `len(set(nums)) == len(nums)`) — never a positional scan. (3) To prove **order** (if order ever matters), sort first, or assert the specific ordering you actually require — and say **which** ordering you mean. (4) **When a check reports a defect, first confirm the check measures what its name claims** before "fixing" the artefact — a false `False` invites a repair that damages a healthy file. (5) Two routes: state the result from **two different checks** (set-based contiguity + set-size vs total) and require them to agree, the same standard as any number the owner will act on (rule 4).

*Cross-ref: the standing "a 0 is a claim about the instrument" lesson; rule 4 (two routes, disagreeing instruments never averaged); L121 (a change that adds an enumerable object drifts sibling pins — pins need the right *shape* of check).*

## L125 — a **fail-closed** check that keys on a **value** must **trim** it — a blank value that derives to "nobody" must not fall into the permissive branch

**What happened (2026-10-11, `CC-59`).** `resolveAgentBinding` decides whether an actor may run an agent: **fail-closed** for an `ai_worker`, **passthrough** for a human. It derived the principal via `requirePrincipal(auth)`, and `derivePrincipal` **trims** `auth.sub` — an empty/whitespace subject returns **`null`**. The binding then read `if (!principal || principal.kind !== 'ai_worker') return { bound: true, … }` — so a **blank subject** (no principal at all) fell into the **human passthrough** and **skipped the check**. A separate-agent hostile critic found it; it is a genuine **fail-open** (the branch written for "a person" also caught "nobody").

**Why it is easy to miss.** The guard *looked* fail-closed — it named `!principal` explicitly. But `!principal` was OR-ed into the **permissive** arm, not the refusing one. And the value it keyed on was **not** what the caller passed (`' '`) but what the trimmer produced (`''` → `null`) — a **second transformation between the input and the check**.

**The rule.** (1) When a check decides *permission* from a **value**, normalise the value **the same way the downstream code does** before testing it — here, trim. The tool's own guard had the identical bug (`if (!ctx.userId)` missed `'   '`), so the fix landed in **both** places. (2) Read every `if` that mixes a **refusing** condition with a **permissive** one: `!x || y` is not fail-closed; `!x` alone must route to **refuse**. (3) An **unidentifiable** actor is **nobody**, never "a person by default" — defaulting to the permissive branch is how a fail-closed design silently becomes fail-open. (4) Prove it with a **test that passes the blank value** (`'   '`), and **mutate the guard away** to confirm the test goes RED.

*Cross-ref: L103 (the test that cannot fail — a check that cannot see the defect it exists for); the standing "fail-closed" design note; rule 9(a) (own the code you touch — the second site, in `agent-binding.ts`, was found by fixing the first).*

## L126 — a **source-scanning** structural guard must **strip comments** first — a doc comment may legitimately NAME the very symbol the guard forbids

**What happened (2026-10-11, `CC-59`).** A structural test asserted the new tool pack "builds no second chain": `expect(source).not.toMatch(/\bcompileQuery\b/)`. It went **RED on a correct file** — because the pack's **doc comment** explains what it *reuses* ("`compileQuery` validates it against the canonical model"). The guard fired on **prose**, not code.

**The rule.** (1) A structural guard reads **code**, so **strip comments before matching** (`.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')`) and assert on the stripped text. (2) Prefer an **import/call** shape over a bare-name match where you can (e.g. match `business-ir/compile` inside an import), so a mention can never satisfy it. (3) When the guard fires, **read the match before "fixing" the file**: a guard that fails on prose is the defect, not the comment (L124's twin — confirm the check measures what its name claims). (4) Re-run the **mutation** after changing the guard: it must still go RED on a **real** import (it did — M6 re-proved against the final test).

*Cross-ref: L124 (a check that mis-measures reports a healthy file as broken); L122 (the guard's predicate is part of its guarantee); rule 4 (two routes).*

## L127 — an "attach it on the way out" hook placed in a method that **early-returns** attaches it to **nothing** for exactly the cases that skip that method

**What happened (2026-10-11, `CC-61`).** The command bus was to record a handler's declared contract (`risk` / `approval` / `idempotency`) on the action log. The first draft put the merge **inside `buildLog`** — the method that assembles the handler's own log metadata. But `buildLog` opens with `if (!handler.buildLog) return null`: a handler with **no `buildLog`** never reaches the merge, so a declaring handler recorded **nothing** — even though a log **is** still written from **caller-supplied `metadata`**. The suite was green, because every test command happened to have a `buildLog`. **A separate-agent hostile critic found it** by asking the question the tests did not: *what about the handler that skips this path?*

**Why it is easy to miss.** The hook was in a *plausible* place — "where the log metadata is built" — and it worked for every case the author tried. The defect lived in the **gap between two mechanisms** (the handler's `buildLog` vs the caller's `metadata`), which is exactly where a single-path test cannot look.

**The rule.** (1) When attaching data to an output, attach it at the point the output is **finalised** (here: immediately before `persistLog`, where every path converges) — not inside a **producer** that may not run. (2) Ask *"which paths reach this line, and which skip it?"* and write a test for a **skipping** path, not only the happy one. (3) A green suite over one code path is evidence about that path, not about the feature: if the claim is "**every** X is recorded", the test must include an X that takes a **different** route. (4) The `null`-means-no-key discipline is worth keeping: an undeclaring input must add **nothing** (proved byte-identical), so the feature is invisible until it is used.

*Cross-ref: L103 (the test that cannot fail); L125 (a blank value falling into the permissive branch — the same "the gap between two mechanisms" shape); rule 4 (two routes).*

## L128 — "not verified this round" is **not** "not built" — a stale `0/N` makes you build what already exists

**What happened (2026-10-11, rows 21/21b).** The appendix recorded the audit phase as `P4 ▸ 0/2 — *"no sub-part verified in code this round"*`, and the LIST showed both rows 🟡. The honest reading of that phrase is **"nobody looked"**, not **"it is absent"** — and the difference is a whole phase of work. Measured (rule 0b): `packages/core/src/modules/audit_logs/` carries a **read API**, a **viewer page**, an **export API**, a **hash-chained ledger** with a verify CLI, **retention** for the access log — the phase is **built**. Two `☐→☑` corrections, and the ONE NUMBER moved **73/321 → 75/321**.

**Why it is easy to miss.** A `0/N` with the words *"not verified"* reads like a finding. It is a **gap in the ledger**, and it is indistinguishable at a glance from a real zero. The whole register's value is that a `☑` names its evidence; the corresponding discipline is that a **`☐` must name whether it was *measured absent* or merely *unmeasured*** — and the two demand opposite next actions (build vs. measure).

**The rule.** (1) When a `☐` carries *"not verified / carried / claimed by docs"*, **the next action is a measurement, not a build** — write it as *"UNVERIFIED — go measure"* in your head, and measure before planning anything. (2) Before building any row, grep the code for the **feature's own vocabulary** (here: `audit_logs`, `ledger`, `rotate`, `export`) — a built phase leaves many traces. (3) When the measurement finds it built, the fix is a **rule-13 correction with evidence**, not a build; and the ONE NUMBER moves on a **correction** exactly as it does on a build. (4) Then ask the **critic** to falsify the "it is built" claim — the stakes are inverted here (a false "built" is worse than a false "missing"), and it is the one claim you must not self-certify.

*Cross-ref: L124 (a check that mis-measures reports a healthy file as broken — the mirror image); the standing "a `0` is a claim about the instrument" lesson; rule 0b (measure before you build); rule 13 (correct it everywhere it was copied).*

## L129 — a test that asserts on a value's **runtime keys** does **not** defend a type's **shape** — an added *optional* field is absent from every instance, so it passes silently

**What happened (2026-10-11, row 28 / R28-1).** The port declares `AiRuntimeSecretRef = { scope; name }` — a secret **reference**, never a value. The test "proved" it by `expect(Object.keys(ref).sort()).toEqual(['name','scope'])`. A separate-agent hostile critic added a field — `value?: string` — to the interface and re-ran: **the suite stayed GREEN.** The assertion reads an **instance**, and an *optional* field is simply **absent** from any instance you construct, so the check cannot see it. The critic did the same with `authorityOverride?` on the envelope: green. **Two tests that looked like guards were decorative.**

**Why it is easy to miss.** `Object.keys(x)` *feels* like "the shape of x". It is the shape of **one value**, and an optional field is invisible in it. The assertion also reads as a strong, specific check — the danger is that it looks **stronger** than it is, so nobody re-examines it. The real defect class is worse than a missing test: a **false sense of coverage** on a security-adjacent rule ("no field can hold a secret").

**The rule.** (1) To pin a **type's** key set, assert at the **type** level, not on a value: a key-exactness guard —
```ts
type IsExactKeys<T, K extends string> = [keyof T] extends [K] ? ([K] extends [keyof T] ? true : false) : false
const ok: IsExactKeys<AiRuntimeSecretRef, 'scope' | 'name' | 'purpose'> = true
ok satisfies true   // `tsc` fails if a field is added, removed, or made optional
```
— because `keyof T` changes the moment **any** field is added, optional or not. (2) The proof of a type-level guard is a **mutation run**: add the forbidden field, run `tsc`, confirm it goes **RED**, restore (md5). A type guard is only real once a mutation has proved it. (3) Prefer the guard **in the type's own file or a type-test**, and note that `tsc` must **include the test file** in the same invocation — compiling the source alone does not run the guard. (4) When a critic shows an assertion was vacuous, do not merely strengthen that one test: **re-derive the guard for the whole class** (here: the envelope key set too got an `IsExactKeys` guard), then re-run **the critic's own mutation** and show it now goes RED.

*Cross-ref: L124 (a check that mis-measures reports a healthy file as broken); L127 (the test that cannot fail); L103; rule 10f (the hostile critic; a mutation must go RED); rule 4 (two routes).*

## L130 — a **flaky** test is a defect in the test, and a **heisenbug fixed by logging** is proof the test depends on timing — remove the timing, do not tune it

**What happened (2026-10-11, `CC-68`, during the row-28 tracker work).** `mcp-dev-key-resolution.test.ts` failed ~1 full-suite run in 2–3 (always the `fails closed when the config path is replaced after open/validation` case) while passing every time in isolation. The first diagnosis named the wrong suspect (a `llm-bootstrap` import-time throw) — see the *second* half of this lesson — and the wrong **framing** ("not my change, not a hole"), which the owner struck down under rule 9a: *everything in the codebase is mine to fix or schedule, and a flag without a full report is not a report.* The real defect, measured: the test drove a **real file swap** (`rename` the path, put a different file in its place) from inside mocked `stat`/`open`, and that swap **raced** the function's own `Promise.all([fileHandle.stat(), lstat(path)])`. Whether `lstat` observed the pre- or post-swap inode depended on **microtask order** — so the outcome was a coin toss. **The production code was correct throughout**; the test was non-deterministic by construction.

**The trap inside the trap.** The rewrite that swapped the file *inside the mocked `lstat`* (so it "always" ran before returning) **still flaked** in the full suite, and — decisively — it **passed 4/4 with `console.log` added**, failing again once the logging was removed. **A heisenbug that logging hides is not fixed; it is timing-sensitive.** Tuning a race by moving the swap earlier, or by adding a `await` until it "usually" wins, is not a fix — the next scheduler can reorder it. The only fix is to **remove the timing dependency**: state the mismatch **directly** rather than racing real filesystem operations to produce it (mock the descriptor to report one `{dev, ino}` and the path another — no rename, no race, no host-inode assumption).

**A second trap: the "deterministic" rewrite was still vacuous.** The first no-race version spread a real `Stats` object (`{ ...(await realStat()), dev, ino }`) — which **drops the prototype**, so `isFile()` became `undefined`, the function refused for the *wrong reason*, and the test **stayed green even with the identity check mutated away**. It only became a real guard after (1) keeping the real `Stats` object and overriding `dev`/`ino` via `Object.defineProperty`, and (2) **running the mutation** (delete `isSameFile(...)`) and seeing it go **RED on both platform variants**. *A test you have not mutated is a test you have not tested* (L129).

**Why it is easy to miss.** (1) A flake "passing in isolation" reads like an environment problem, so it gets filed as environmental and left — which is exactly how a real test defect survives for months. (2) An intermittent failure is the *hardest* thing to attribute, so the instinct is to find a plausible cause and move on; here the first plausible cause was wrong, and only running the full suite **five times** and reading the *failing test name* settled it. (3) A test that refuses for the wrong reason, and a test that refuses for the right reason, both print GREEN — the difference is invisible until a mutation.

**The rule.** (1) When a test fails intermittently **only under the full suite**, treat it as a **test defect first**: read the failing *test name* (not the first error in the log), reproduce it, and drive the failing condition **deterministically**. (2) If adding a `console.log` makes it pass, you have proved it is a **race** — delete the race (assert the condition directly), never the log. (3) A test that produces a condition by **racing real I/O** against the code's own async chain is non-deterministic by construction; prefer to **state the condition in the mock** (an inode mismatch, a flag) over producing it with the filesystem. (4) **Mutate every test you write**: remove the exact line it claims to defend and require RED. (5) Do not reason from a **log line to a cause** without a stack: a `WARN`-logged `TypeError` inside a `try/catch` is *not* a crash — I mis-attributed the flake to a caught warning (`llm-bootstrap.ts:40`) before finding the real, uncaught path. (6) Rule 9a framing, restated because it was broken here: "pre-existing / not my change / not a hole" is **not** a disposition; the item is **fixed now** or **scheduled with its trigger named** (rule 8 / rule 15).

*Cross-ref: L129 (a test you have not mutated is not a test); L127 (the test that cannot fail); L103; `CC-68` (this item); `CC-19` (the "passes alone, flaky in the suite" environmental class — this item is the *non*-environmental case, which is why it had to be fixed); rule 9a (own everything); rule 15 (solve the straightforward now).*

## L131 — moving a dispatch **behind a door** keeps the security **gate at the door's callers**, and an adapter that **starts a run must also close it**

**What happened (2026-10-11, `CC-67`, the last three callers moved onto the runtime port).** Row 28 builds **one typed door** for the AI engine; `CC-67` moved the **last three direct callers** (the chat route's AI-SDK text path, `api/ai/run-object/route.ts`, and the in-process `lib/business-ir-author.ts`) onto a **new** adapter that fronts the platform's **own in-process runtime**. Two distinct traps surfaced, both **created by the move itself**, and both were caught only because the critic was a **separate agent** told to attack every claim.

**Trap 1 — the move silently **deleted a security gate and created an un-gated dispatcher**. The binding gate (`CC-27`/`CC-55`/`CC-57`) is enforced by a **static scan** (`binding-coverage.test.ts`) that fails any **new** agent-dispatch site which does not `resolveAgentBinding`. Moving the dispatch *out* of `business-ir-author.ts` and *into* the adapter did two things at once: (a) the old in-process dispatch site disappeared (so the test's `IN_PROCESS_DISPATCH_SITES` pin, and the caller-side gate, went stale), and (b) the **adapter itself** became a new dispatcher that named the engine directly — exactly the shape the gate exists to catch. **The fix was not to weaken the gate but to re-site the pin:** the two adapters are now declared **the door** (excluded from the scan, like the port's own definition), and two new pins require that **every caller of the door still consults the binding** and that the **adapters never grow a competing gate of their own**. *A dispatch moved behind an abstraction does not move the security requirement with it — the requirement stays at the **caller**, and the coverage check must be re-pointed at the new shape, never loosened to make the build pass.*

**Trap 2 — a run that is **started** but never **closed** is a state bug that reports WRONG.** The first cut called `startRun` and **never `completeRun`**: the run stayed open forever, so a later `cancelRun` on a finished run would falsely report it `cancelled`. (R28-4 had just taught the *opposite* half — that a run must be closed at the door — and `CC-67` introduced a new `startRun` site that forgot it.) The second critic then found a **latent twin**: an engine call that returns a **bodyless** `Response` skipped the close too. Both fixed (close in the `finally` **before** `writer.close()`; `failed` on engine error; close even with no body), each pinned by a test whose mutation (remove the close) goes **RED**.

**The nuance that made this row hard to score honestly.** After `CC-67`, **every production caller walks through the door** — yet the row's box stays `☐`. The row's sentence is *"**no other** code talks to it directly"*: a claim about the **whole codebase**, and a whole-codebase claim is true only when it is **proven** (R28-5), not when the last *known* caller is moved. *"All the callers I found are behind the door"* and *"nothing bypasses the door"* are different statements; only the second completes the row, and it needs a **mechanical** check.

**Portability traps inside the work.** (1) The engine returns a **single-use `Response`** whose body the browser consumes — an adapter that emits stream events by **reading `response.body`** leaves the client with nothing; the fix is to **stash the original `Response`** and hand it back (`responseForRun`), never draining it (a `getReader` spy asserts `readCount()===0`). (2) A **pure** helper (here `resolveLoopBudgetPreset`, a switch over a literal) may be re-exported from the adapter so the route names no engine module — but only after **checking it is pure**; re-exporting a symbol that drags the engine in would defeat the whole point. (3) When an original caller passed an optional dependency **only when defined**, an edit that passes it **always** is a silent behaviour change — guard the spread.

**The rule.** (1) Moving a dispatch behind a door: **re-site** the coverage/gate pin to the new shape (door = the excluded implementation; callers = the gated sites), never delete or loosen it; and add the **inverse** pin (the door must not gate itself). (2) **Every `startRun` needs a `completeRun`**: a run is closed on *every* exit path — success, engine error, and no-body — with the honest status, and the close happens **before** the consumer is closed (no race). (3) A whole-codebase claim (*"nothing else does X"*) is completed by a **proof**, not by moving the known callers; name the honest exceptions (`src/index.ts` = a re-export; the registered bypass) rather than pretending they are absent. (4) Never drain a single-use stream to inspect it. (5) Ask the critic as a **separate agent** with *"attack all five claims"* — both defects here were invisible to the author and obvious to the adversary.

*Cross-ref: L127 (an "attach on the way out" hook in an early-returning method — the same "a path skips the one place that fixes it" shape); L125 (a value that derives to "nobody" falls into the permissive branch — re-siting a gate must not open a hole); L121 (a change that adds an enumerable object drifts sibling pins — here the *coverage* pin, not a key set); rule 10f (the hostile critic; a mutation must go RED); rule 4 (two routes); rule 8 (schedule the remainder with its trigger — R28-5); rule 9b (challenge the task: the honest verdict was *no box moved*, because the row needs the proof, not just the moves); rule 13 (a falsified premise is corrected everywhere it was copied — §D's `B-05`/`Port`/`N-8` wording).*

## L132 — a structural scan is only as strong as its **file filter and its detector**: a `.ts`-only walk misses every `.tsx`, a single-line matcher misses half the import forms, and a **mutation that does not apply** proves nothing

**What happened (2026-10-12, `R28-5`, the "nothing bypasses the door" check for row 28).** The check is a whole-package structural scan: walk every production file, strip comments, find every module edge to an AI engine, and assert the only engine-reaching files are the door, the engines, the barrel and two named exceptions. It was green, 11 mutations "passed", and the author believed it. **A separate-agent hostile critic found three real defects, all confirmed by command:**
- **(a) `.tsx` was invisible.** `walk()` filtered `entry.endsWith('.ts')` — so **36 production `.tsx` files** (React components, real production code) were **never scanned**. The suite's *central* claim — *"nothing outside the door reaches an engine"* — was **unproven** for a whole file class. A component could `import { createOpenCodeClient } from '../lib/opencode-client'` and the check would stay green.
- **(b) the detector was half-blind.** It matched only single-line `import X from '<spec>'`. **Multi-line** imports, **side-effect** `import '<spec>'`, **`require('…')`** and **dynamic `import('…')`** were all missed — five of six real module-edge forms.
- **(c) a header claim was false.** The comment said the engine set was *"derived, not typed"* — it was a **hard-coded three-element array**. A genuinely new third engine file would not have been caught by the claim's own promise.

**The subtlest finding — a fix that can be silently reverted is not a fix.** After adding `.tsx` to `walk`, the mutation *"revert the `.tsx` filter"* still read **GREEN** — because, with no `.tsx` importer present in the tree, reverting the filter changed nothing observable. **Nothing in the suite noticed the `.tsx` support was gone.** The fix was a **self-check test** (`the scan really visits .tsx production files`: assert the walk yields at least one `.tsx`, and that a non-`__tests__` one exists so the assertion is not vacuous). Only then did the revert go **RED**. *A capability that no test observes is a capability that will be deleted by the next tidy-up.*

**The mutation-script trap — a mutation that does not APPLY is not a mutation.** Round 1 of the proof reported **4 "STILL GREEN"** results that were **the script's fault, not the test's**: T1 added a file that was **already** in the exception set (a no-op); T3 used `expect(x.length).toBeGreaterThanOrEqual(0)` (vacuously true) and did not pair it with the condition that would bite; T4 stripped comments on a file whose engine mention was a **bare backticked name** the regex never matched anyway; T7 **deleted the test's own assertion** (which no test can defend against). Three fixes made each mutation **load-bearing**: pair a wide exception with a file that then hides a second import; pair "stop stripping comments" with a **commented-out real import**; pair "neutered derivation" with a real new engine file and **keep the assertion** (the mutation is the *code*, never the *test*). After that, **12/12 mutations were RED.**

**Why a critic only half-helps if it is not told the right things.** The critic was told to attack every claim and to **produce a command + output per claim** — that is the only reason the `.tsx` gap surfaced (a claim *"we scan the whole package"* is falsified by one `ls` showing `.tsx` files). A critic that accepts prose cannot find a filter someone forgot.

**The rule.** (1) A structural scan must **enumerate the file classes it claims to cover** and **assert it visits each** — the default filter (`.ts` only, or ignoring `.tsx`/`.mts`/`.cts`) is an unguarded assumption, and a scan that silently narrows its own input is worse than no scan (it certifies a hole as proven). (2) A source-edge **detector** must handle **every** syntactic form of the edge it looks for (static, re-export, side-effect, `require`, dynamic import), not the first one that occurs to you. (3) Any **claim written in the header must be true of the code** — *"derived, not typed"* is a claim, and if it is typed, either make it derived or say "declared, then checked"; do not leave an overclaim where the next reader trusts it. (4) **Every mutation must be verified to actually change the artefact**, and every mutation must be paired with the **tree condition** that lets it bite — an unapplied mutation reads GREEN and looks like a weak test. (5) The mutation is the **code under test**, never the test's own assertion — replacing `expect(A).toEqual(B)` with `expect(true).toBe(true)` proves nothing about the code. (6) A **fix that closes a blindness needs its own self-check test**, or it can be silently reverted by a later edit that never sees it.

*Cross-ref: L118 (a structural coverage gate that scans only part of the tree is blind to the rest — this is that lesson applied to a scan that scanned the wrong **file classes**); L126 (a source-scanning guard must strip comments — the sister blind spot, here also paired with the case it really guards); L122 (a gate matched by name is evadable by an alias — same "the detector must be complete" family); rule 4 (two routes — the `.tsx`-evasion and the `.ts`-only mutation were two independent routes to the same defect); rule 7 (a lesson binds both ways — written the same change it was learned); rule 10f (the hostile critic, with a command per claim); rule 13 (a falsified premise — the plan's `CC-69` file location — corrected everywhere); rule 15 (solve the straightforward now: the `.tsx` self-check was added immediately, not scheduled).*

## L133 — **"delete X" is not a task until its replacement exists**: measure whether X is the *only* thing that works before you delete it — and a **"blocked" verdict must be attacked too** (it is convenient to declare work blocked)

**What happened (2026-10-12, `R28-6` "delete OpenCode" for row 28).** The stored task read: *"Remove OpenCode (its client, its handlers, its `OPENCODE_URL`) once the chat route is proven on the door."* The prerequisite it named ("R28-3 + `CC-67`") was **met** — so the task looked queued and startable. **I measured first (rule 0b) and challenged the task before executing it (rule 9b), and the task fails its own premise:**
- **The replacement does not exist.** `git ls-files | grep -i hermes` → **empty**; `find . -iname '*hermes*'` → **empty**. The engine the architecture doc says will *displace* OpenCode (**Hermes**) has **no code in this repository at all**.
- **X is the only thing that works.** The live chat route is wired to OpenCode (through the door, `createOpenCodePortAdapter`), and OpenCode runs as a **Docker service the platform points at** (`OPENCODE_URL`, default `http://localhost:4096`). Deleting it removes the **only** engine that can answer a chat.
- **The document states the gate verbatim** (`ARCHITECTURE-hermes-integration.md` §11): *"It is still load-bearing … so it stays until **N-8** rewires the platform chat. The decision settles **what replaces it**, not **when**."* Its §9 puts Hermes at **Phase 2+** — a **different workstream** from this row.

So `R28-6` was **not a buildable task**, and the honest verdict was **"trigger-blocked — do not build."** The prerequisite it named was **not sufficient** ("prove the door" ≠ "have a replacement"); that premise was corrected wherever it was copied (rule 13).

**The name collision — a deletion must scope itself by ROLE, not by STRING.** "OpenCode" named **two unrelated things**: **the engine** (`opencode-client`/`handler`/`port-adapter` + `docker/opencode`) — what the task deletes — and a **naming vestige** (`shared/.../opencode-provider.ts`, the `OPENCODE_*` env names, `api_keys.opencodeSessionId`) which is the platform's **own model-provider config** and chat-session binding. **The vestige is load-bearing** — `api/route/route.ts` and `settings/route.ts` import it, `model-factory.ts` reads `OPENCODE_PROVIDER` — so a naive *"delete everything matching `opencode`"* would **break the platform's own model selection.** A deletion by string is a deletion of things you did not read.

**A "blocked" verdict must itself be attacked — it is the most convenient claim there is.** Declaring work blocked is *self-serving*: it costs nothing, ships nothing, and excuses the session. So the verdict was handed to a **separate-agent hostile critic** asked to **falsify** it. It attacked five sub-claims and **upheld every one** (each with a command + output), and its verdict was *"SOUND — no safe path to build `R28-6` now."* **Crucially, it also named the one alternative the author had understated** — the chat path *could* be repointed at the platform's in-process runtime — and correctly classified it as a **behavioural rewrite** (SSE-events vs an AI-SDK `Response`) that is exactly **`N-8`'s** charter, not `R28-6`'s. That alternative was **recorded in the register, not buried**: a finding that omits the path the critic found is not a complete report.

**The rule.** (1) Before any **deletion** task, measure whether the thing to be deleted is **the only thing that performs its function** — a deletion is a task only once a **replacement exists and is wired**; *"its prerequisite is met"* is not the same as *"there is something to delete **to**."* (2) A task whose text is a **string match** ("remove X") must be **scoped by role** first: enumerate every file that matches the string, classify each as **the thing** vs a **namesake**, and never bulk-delete a namesake that is load-bearing. (3) A **"blocked / do not build"** conclusion is a claim like any other — give it the **same hostile-critic treatment** as a build, because it is the claim most easily made in bad faith (by yourself); and a criticism that **upheld** the verdict but **found an alternative** is a *better* result than one that simply agreed — **record the alternative**, ranked, with why it is not the move now. (4) The **honest reading of the scoreboard** when blocked is **no box moved** — `N-8`'s delete half stays `☐`; ticking it because the *rewire* half is done would be a lie of the "one caller out of three" class (L131).

*Cross-ref: L131 (a door's claim is completed by a proof, and the honest verdict can be *no box moved* — the sister lesson, same row); L128 (`"delete second"` — the order is rewire-then-delete, and here the rewire target itself does not exist yet); L125 (a value that derives to "nobody" must not fall into the permissive branch — reading a task's *name* instead of its *role* is the same class of shortcut); rule 0b (measure before building — the deletion was measured, not assumed); rule 9b (challenge the task — the challenge *was* the deliverable this turn); rule 11 (the owner decides *what* — do not pre-empt the Hermes decision by picking the engine early); rule 13 (correct a falsified premise everywhere it was copied — the plan's insufficient prerequisite); rule 15 (solve the straightforward now — the honest disposition of a blocked task is to register it with its trigger, this change); rule 8 (schedule the remainder in `COMPLETION-CALLBACKS.md` — `CC-72`); rule 10f (the hostile critic, a command per claim).*

## L134 — a **promised correction is not a correction**: a "fix it in the same change" note in an impact table is **work**, and work written in a plan is not done until a commit names the file — audit the plan's own promises

**What happened (2026-10-12, the row-28 completeness audit).** The owner asked: *"verify that all row 28 steps are done and completed properly — because some of the steps you did not report back to me that you worked on."* The **code** was sound: all six sub-rows (`R28-1`…`R28-5` + `CC-67`) verified against the live files, and the whole `ai-assistant` suite re-ran **118 suites / 1607 tests green** on the committed tree. But checking the plan's **own promises** — not just its status column — found one that was **silently dropped**:

`PLAN-ROW28-agent-runtime-port.md` **§5 (Impact)** carried a row: *"`ce.ts`'s comment-only `AiRuntimePort` — Low — a false 'it exists' statement — **Correct it in the same change (rule 13)**."* **No row-28 commit touched `ce.ts`.** Measured: `git log -- ce.ts` showed its last change was an earlier AH-1 slice (`b5a33c76`), and `git show --stat` for each row-28 commit (`513bad41`, `743156dd`, `61776eae`, `5ec1c83f`, `6c3db27c`, `ab2f835a`) named `ce.ts` **zero times**. So the comment still said the port *"(`invoke`/`status`/`cancel`) is `L-01`/`AH-5`"* — **unbuilt, owned elsewhere** — while the port had existed since `R28-1`. A reader trusting that comment would believe there is no runtime port. **Fixed** (code `b8f53cb0`), comment-only, suite re-run green.

**Why it survived six clean sub-rows.** Each sub-row's *own* record was accurate — the port was built, the adapters were built, the callers moved, the proof shipped. The dropped item was a **side-task**, named in an **impact table**, not in a status column. Status columns are audited; side-promises in an impact table are **read once when written and never re-read**. The "done" checks looked at the sub-rows; nobody re-opened §5.

**The rule.** (1) A plan's **"do X in the same change"** line is **work**, committed as such — it belongs in the same checklist the sub-rows are in, or it will be dropped exactly as this one was. (2) A **completeness audit greps the plan's own promises** (`"in the same change"`, `"correct it"`, `"must be updated"`, `TODO`) and verifies each against `git log <file>` / `git show --stat` — *"the status says done"* is not the same as *"every promised edit landed."* (3) When a plan promises a correction because a comment/claim is **false**, the false claim is a **defect** (rule 13), not a nicety: left standing, the next reader trusts it. (4) The audit's honest result is permitted to be *"all sound"* — but only after **measuring**, not after reading the status column.

*Cross-ref: rule 13 (a falsified premise is corrected everywhere it was copied — here the correction was promised and not made); rule 9a (own the FULL codebase — the side-task was mine and was dropped); rule 10e (name what a change can touch — the row was named, then ignored); rule 15 (solve the straightforward now — the stale comment was fixed on discovery, not scheduled); L131/L133 (the sister "the honest verdict is no box moved / the task is blocked" lessons — an audit that finds one real gap and fixes it is the point of the audit).*

---

## L135 — **a snapshot with no `.git` still has a provenance**: a downloaded source archive can carry its own upstream revision, so *"we cannot know which revision this is"* must be measured, not assumed

**What happened (2026-10-12, Hermes §9 Phase 0 "pin & map").** The architecture said the Hermes source revision *"cannot be recovered; it must be created."* Measured: the Hermes source sits in the tree as a **zip extract with no `.git`** and `version = "0.0.0"` — so on the surface, no revision. But `library/ai/hermes-agent-main.zip` carries a **commit hash in its own archive comment**: `unzip -z <zip>` → `eb044063235fbf7a4e68dd2970ade05dbe637ff3`. So the pin could carry **real provenance** (a revision) *and* **proof** (a content digest), rather than a made-up identifier. The pinned directory was also verified **byte-identical to the zip** (`unzip -p <zip> <member> | md5sum` matched the on-disk file; 17,201 files each).

**Why it matters.** *"Cannot be recovered"* is an **assumption about the packaging**, not a fact about the content. A `git archive`/release zip is exactly the case where the revision travels **inside the archive** (comment, `.gitattributes` `export-subst`, a version file). Declaring the revision unrecoverable **without opening the archive's metadata** would have produced a pin with no provenance — a digest that proves *"this file is unchanged"* but cannot say *"this is Hermes at commit X."*

**The rule.** (1) Before accepting *"the revision cannot be recovered"*, **open the archive's own metadata** — `unzip -z`/`unzip -l` (comment), a `VERSION`/`SOURCE_DATE_EPOCH`/`.gitattributes` `export-subst` marker, or a build-stamp file. (2) A pin should carry **both** provenance (a revision, if any) and proof (a content digest); if only the digest is recoverable, say so explicitly. (3) Verify the extracted directory against the archive **by hash**, not by eyeball — a "pinned" copy that silently differs from its own zip is worse than no pin.

*Cross-ref: L128 ("not verified this round" is not "not built" — the same error shape: an unmeasured *"cannot"*); rule 0b (measure first); rule 13 (the architecture's *"cannot be recovered"* was corrected where copied); `HERMES-PIN.md` §1.2.*

---

## L136 — **two copies of one thing in the tree is a defect even when each is "the same software"**: a pin must pick ONE and say why, because "which one did we read?" has a single answer or none — **and when a THIRD arrives, the pin must re-measure, not defend its first choice**

**What happened (2026-10-12, the same Phase 0).** The Hermes source exists in the tree three times.
**First measured:** `library/ai/hermes-agent-main/` (17,201 files, mtime 2026-10-03, `pyproject.toml` md5
`a4ce871d…`) and `hermes-agent-main/` (17,367 files, mtime 2026-10-05, md5 `594dea19…`) — **not** byte-identical:
a **later, different** extract of the same product. Both gitignored; nothing said which was authoritative. This
is exactly the architecture's own **§10 "source-versus-image divergence"** risk — but sitting in **our** tree,
not the product's. The pin picked the first, `library/ai/hermes-agent-main/`.
**Then, the same day:** the owner supplied a **third** copy at the root (18,248 files, revision `3569e846…`) and
renamed the old root copy `hermes-agent-main-older/`. Measured against upstream, the *first* pin was **3,290
commits behind** the new one (2026-10-03 → 2026-10-12). The pin **moved** to the newest.

**Why it matters.** A digest over "the Hermes source" is meaningless while there are two — or three. Worse, a
reader who opens *any* of the other copies would find different code and different docs, and all would look
correct, because none was labelled. And the *first* fix ("pick the one in the library") was itself a trap: it
was a good reason only while there was **one** candidate; once a second arrived, the real question became
**"which is newest?"**, and the answer moved. **A pin defends a choice by re-measuring its premise, not by
restating it.**

**The rule.** (1) When the same third-party source appears in more than one place, **the measure is a diff, not a
glance** — compare file counts, mtimes, a few file hashes, and the whole-tree digest; "same product" is not "same
snapshot." (2) A pin **names exactly ONE copy** and states why; the others are left in place but explicitly marked
**not the pinned one**. (3) Answer *"which revision are we reading?"* in **one** place a newcomer can find. (4)
**When the inputs to the choice change** — a newer copy arrives, upstream moves — **re-measure the choice**
(which copy is newest? how far behind is the pin?) and, if it has moved, re-pin *and update the harness and the
doc in the same change*, so the recorded digest and the ticked box still point at the same thing.

*Cross-ref: rule 12 (judge the committed/invariant copy, not the rendered one); L135 (a snapshot carries its own
provenance — the copies differ *by revision*, which is how the divergence was caught *and* how the new one's
"newest" was proven); rule 13 (a falsified premise corrected everywhere it was copied — the "two copies" doctrine
became "three", and the pin's own premise was re-measured); rule 0b (measure first; the 3,290-commit gap was
measured, not assumed); `HERMES-PIN.md` §1.1 / §1.1.1.*



---

## L137 — **a measured "the concept does not exist" that greps ONE module is a claim about that module, not the platform**: over-generalising a true narrow scan is how a false blocker survives for a day and gets deferred as "large"

**What happened (2026-10-12, measuring `CC-51` before building it — rule 0b).** `CC-51` is row 16's team-leg of
own/team row scope. It had been deferred on a documented measurement: *"B additionally needs a real `team` concept
the platform has never had — no team entity, no membership, nothing on `auth` (measured 2026-10-11)."* The scan
behind it was real and *true*: `grep -rni "team" packages/core/src/modules/auth --include=*.ts` → only incidental
matches, and `AuthContext` carries `{ sub, tenantId, orgId }`. But the **conclusion drawn from it** — "so the
platform has no team concept, and B must invent one" — was false. Re-measured 2026-10-12 across the whole
codebase: `packages/core/src/modules/staff/data/entities.ts` declares `StaffTeam` (`staff_teams`),
`StaffTeamRole` and `StaffTeamMember` (`staff_team_members`, carrying **`team_id` and `user_id`**), with API
routes, commands, backend pages and seeds — **236 files**, and the *only* team concept in the tree. The team-leg's
"large" half (entity + membership + schema + UI) was already built; what remained was the row-scope plumbing. The
false premise had been copied into **four** documents and had gated the task for a day.

**Why it matters.** A negative search scoped to one module reads as a platform fact once the module name drops out
of the sentence. *"No team concept in `auth`"* became *"the platform has never had a team concept"* — and that
phrasing is what a later session reads as the blocker. The cost is not the wrong words: it is that a task is
sized **"large — invents a concept"** instead of **"small — wires a declared dimension onto an existing one"**,
so it never gets picked, and the module that would have answered the question sits one grep away.

**The rule.** (1) **A negative measurement must record its scope** — write the path you searched (*"in
`modules/auth`"*), not just the result, and never let the scope drop out of the sentence it is reused in. (2)
**Before deferring a task as "invents a concept", search the whole codebase for that concept's nouns**
(`grep -rn "tableName: '[^']*<noun"` over `packages/*/src`, plus the entity/API/command/UI surfaces) — one grep,
minutes. (3) **A "never had" claim is a falsifiable premise under rule 13**: when it is falsified, correct it in
*every* document that copied it, in the same change — here, four places. (4) When a premise flips from "must
invent" to "must wire", **re-size the task out loud** — that is the difference between a deferred item and a
pickable one.

*Cross-ref: L135/L136 (the same day's other two falsified premises: a snapshot's provenance assumed absent, and a
pin defending its first choice); rule 0b (measure first — the re-measure is what caught it); rule 13 (corrected
everywhere it was copied); rule 15 (solve the straightforward now — the correction was made immediately, the
*decision* it exposed was handed to the owner, which is rule 11); `COMPLETION-CALLBACKS.md` `CC-51`;
`PLAN-ROW16-own-team-row-scope.md` §7.2.*

---

## L138 — **a type gate that has never run is not a gate**: `tsc -p .` returning TS18003 for a package means nobody has type-checked it in living memory, and the moment you make it run, expect the errors that were always there — **measure a gate's existence before you trust its silence**

Measured 2026-10-12 while discharging `P2-2`'s *"`tsc` clean"* exit gate (`PLAN-HERMES-PHASE2-one-tenant-one-tool.md`).

**What happened.** `node node_modules/typescript/bin/tsc -p packages/ai-assistant/tsconfig.json --noEmit` returned **one** error: TS18003, *"No inputs were found in config file"* — not a type error, a **config** error. The package's only `tsconfig.json` extended the **root** `tsconfig.json`, whose `exclude: ["node_modules","apps","packages"]` is resolved **from the extending config's directory**, so from `packages/ai-assistant/` the pattern `packages` matched **the package's own `src/**`**. Twenty of the twenty-one package/app configs in the repo extend `tsconfig.base.json`; this one was the sole anomaly, and it had been harmless-looking for as long as nobody ran the command.

**Why the silence lasted.** Three commands could each have shown it, and none did: the **build** is esbuild (`node build.mjs`; no type-check, 238 entry points, "built successfully"), there was **no `typecheck` script** (unlike `packages/shared`), and **jest does not type-check in this repo** — `agent-runtime-loop-phase0.test.ts` carries 17 `tsc` errors and jest runs it 34/34 green. So the gate did not degrade; it never existed, and every "tests pass, build passes" was true while saying nothing about types.

**Fixing it exposed 92 pre-existing type errors in 27 other `__tests__` files** — zero in production code, and both files the change added were clean. That is the shape to expect: **errors accumulate behind a gate that never ran, and they are never evenly distributed.**

**The rules.** (1) **Before trusting a gate's silence, run the gate and look at what it actually checked** — a TS18003/TS6053/"no inputs" result is a *missing* gate, not a green one, and it must be fixed before the green means anything. (2) **When a package's tsconfig extends a config that excludes it, the exclusion still applies** — `exclude`/`include` survive `extends` and resolve relative to the config they came *from*; check the 20 siblings before assuming one is right. (3) **Assert a gate is real by pointing a known-bad file at it** — here, one file with 17 errors running green under jest while failing under `tsc` is the proof that jest was never the type gate. (4) **A newly-working gate is a finding, not a nuisance**: schedule what it exposes (`CC-73`) and resist the two-line escape hatch (`exclude __tests__`, which is what `packages/shared` already does) that would hide exactly the class of defect a hostile critic had just found.

*Cross-ref: L139 (the same measurement's second lesson: a stale incremental cache lied three ways); `CC-73` (the 92 errors, scheduled); `PLAN-HERMES-PHASE2-one-tenant-one-tool.md` §4 `P2-2`; rule 0b (measure the gate, do not assume it); rule 15 (the tsconfig half was straightforward and was fixed in the same change).*

---

## L139 — **`--incremental` lied three times about the same file set**: a stale `*.tsbuildinfo` produced 6,551 → 36 → 95 errors for one unchanged config, so a type measurement is only a measurement when the cache is off

Measured 2026-10-12, immediately after L138, in the same package.

**What happened.** The same `tsc -p packages/ai-assistant/tsconfig.json --noEmit`, run three times against one unchanged tsconfig, reported **three different totals**: **6,551** errors (the first run after the config fix), then **36** (a re-run), then **95** (a run with `--incremental false`). No file changed between them. The package directory held **seven stale `*.tsbuildinfo` files** (`tsconfig.tsbuildinfo`, `tsconfig.cc5*.tsbuildinfo`, `tsconfig.typecheck-tmp.tsbuildinfo`, …), and `incremental: true` is set in `tsconfig.base.json`.

**Why it matters.** A gate whose output is not reproducible cannot discharge anything. Had the 36-error run been taken at face value, `P2-2`'s gate would have been declared green on a **false** reading — and the false reading was the *quietest* one, which is the direction cache errors drift in.

**The rules.** (1) **Any `tsc`-based measurement must disable the incremental cache** (`--incremental false`, plus a `--tsBuildInfoFile` outside the repo) or it is not a measurement — and record that in the gate's own text, so the next run does not have to rediscover it. (2) **Two runs disagreeing is a measurement environment defect, not a code fact**: stop, find the cache, then re-measure. (3) **`git check-ignore` the artifacts a probe creates and delete them** — the probe configs used here left `tsconfig.probe*.tsbuildinfo` files behind, and a leftover cache is the next run's lie.

*Cross-ref: L138 (the same measurement's first lesson — the gate that never ran); `CC-73`; rule 0b (a measurement that cannot be reproduced is not one).*

---

## L140 — **A compose service's network is an ownership claim, not a string**: I copied a network name from a *different* compose file and put my worker alone on it while the live stack ran on the next one — and my file could have deleted a network it did not own

Measured 2026-10-12, discharging `P2-1` (`PLAN-HERMES-PHASE2-one-tenant-one-tool.md` §2.7).

**What happened.** `docker-compose.hermes.yml` declared `mercato-network: {name: mercato-network, driver: bridge}`
— a name copied from `docker-compose.yml`, which hardcodes it. The measurement falsified the copy:
`docker network ls` returned **two** mercato networks, and `docker network inspect` showed my
`mercato-hermes-gateway` **alone** on `mercato-network`, while all eight of the operator's running
`*-local` containers (postgres, redis, mcp, meilisearch, model, opencode, app, plus its own Hermes) sat on
`mercato-network-local`. The stack's compose files (`docker-compose.fullapp.yml`, `.fullapp.dev.yml`)
declare `name: mercato-network-${DEPLOY_ENV:-local}`; the one I copied is used by the *other* stack, which
was not running. The row had therefore shipped a service that could not reach anything it names, on a
network this file itself created — and a plain `docker compose … down` on my file could have removed that
network while another stack's definition still pointed at it.

**Why it happened.** A compose file is read as a *text* ("the platform already uses `mercato-network`") when
it is a *claim about a live node*. Two compose files can name the same thing and mean different things; only
`docker ps` / `docker network inspect` / `docker compose ls` say which is true right now.

**The rules.** (1) **Before wiring a network, measure the node**: `docker ps`, then
`docker network inspect <name>` — which containers are on it, and which compose file actually created it
(`docker inspect <container> --format '{{json .Config.Labels}}'` names the config file and project). A
declared name with no running members is a warning, not a confirmation. (2) **`external: true` for a network
you do not own**: the file can neither create nor remove it, so the failure mode (a `down` taking a
neighbour's network) is structurally impossible — and make it overridable
(`${HERMES_DOCKER_NETWORK:-mercato-network-local}`) because a different `DEPLOY_ENV` means a different
name. (3) **Clean up the strays your wrong choice created**: the empty `mercato-network` my first version
created stayed behind after the fix; `docker network rm` on a zero-endpoint network is safe and reversible
(the declaring compose file recreates it). (4) **Prove the fix both ways**: `up` attaches where intended,
`down` removes only your own container and leaves every neighbour, the network and the volumes — a
before/after `docker ps` diff is the evidence.

*Cross-ref: L141 (the same `docker ps` measurement's other finding: the stack already ran a Hermes);
rule 0b (the measurement came before the fix); rule 13 (the falsified sentence — *"the same explicit name …
so compose attaches this worker to the network the platform already uses"* — corrected in the compose file,
in §2.6 decision 3 and in §2.7, and re-proved); `docker-compose.hermes.yml`'s `networks:` comment.*

---

## L141 — **`docker ps` before you design a service**: the product you are containerising was already running on that node, by someone else's door — and your docblock has to say why yours is a second door rather than a duplicate

Measured 2026-10-12, the same command run that produced L140.

**What happened.** `P2-1` was scoped and built as "the Hermes worker boots". After the fix, `docker ps` and
`docker network inspect` showed the platform's own stack had been running a **`hermes-local`** container for
days — image `nousresearch/hermes-agent:latest`, `command: ["gateway","run"]`, published on
`127.0.0.1:8642`, state on the `mercato-hermes-data-local` volume — the **upstream HTTP gateway**, added in
the operator's Sprint 0 step 3.5. Nothing about `P2-1` was wrong, but the plan had been written without ever
asking what was already there, and a reader of `P2-1` alone could conclude "we now have Hermes" — twice.

**Why it matters.** Two doors into the same product is a legitimate architecture choice (upstream HTTP over
a floating `:latest` tag for humans; the pinned source over stdio for the platform's own typed port), but it
is only legitimate when it is *stated*. Unstated, it reads as duplicate authority — exactly the risk the
architecture's §10 table names. And the same measurement showed **zero** `HERMES*` references in
`apps/mercato/src`: neither door is wired into the app yet, so "running" must never be written as
"integrated".

**The rules.** (1) **`docker ps` on the target node before writing a Dockerfile for a product that already
exists there** — one command, and it either confirms "new" or hands you the difference. (2) **When a second
door is intentional, write the distinction into the artifact itself** (the compose file's header now carries
the comparison, the digest-verified pin vs the `:latest` image, and which door `P2-3` fronts) so no later
reader has to reconstruct it. (3) **Never upgrade "running" to "wired"**: grep the app for the service's
env vars and record the count — here, zero — so the status is measured, not implied.

*Cross-ref: L140 (the same measurement); rule 13 (corrected everywhere); `PLAN-HERMES-PHASE2…` §2.7 (the
record); `CC-72` (deleting OpenCode has the same "two doors" shape, and the same need to say which door is
authoritative).*

---

## L142 — **A worker's stdout is the protocol channel, so every line of yours on it is data to the peer**: the fix is not care, it is an assertion that the channel carries nothing but parseable frames

Measured 2026-10-12, building `docker/hermes/` for `P2-1`.

**What happened.** Two ways to corrupt a channel you do not own, both hit in one build:

1. **My own diagnostics on stdout.** The entrypoint and the digests verifier logged
   *"verifying the pinned Hermes source…"* to **stdout** — the same fd the gateway speaks newline-delimited
   JSON-RPC on. A peer reading frames would have parsed my English as data. Fixed by moving every log line
   to **stderr** before the first boot.
2. **A gateway quirk that read as a broken wire.** The gate driver sent its requests **without a JSON-RPC
   `id`** — which makes them *notifications* — and the gateway **answered each one anyway** with `"id": null`.
   The driver's ordered reader reported "responses shifted by one"; the wire had never moved. Fixed by
   sending (and correlating by) explicit ids, and the trap is now a comment on the code that does it.

**Why the fix is an assertion, not care.** Both failures are invisible in the logs of the thing that is
failing, and both are one inattentive edit away from returning. So the gate asserts the invariant instead of
trusting it: **every line the worker writes to stdout must parse as JSON**, and a violation is recorded as a
channel-discipline failure with the offending bytes quoted. A rule that lives in a comment is a rule that
dies at the next edit; a rule that lives in a failing assertion survives it.

**The rules.** (1) **When a process's stdout is a wire, every diagnostic goes to stderr** — log to stderr by
default and treat any stdout write as a protocol event. (2) **Correlate by id, never by arrival order**; and
when a peer answers a *notification*, that is the peer's quirk, not a shift in the wire — reproduce it before
concluding the protocol changed. (3) **Assert the channel, not the intent**: a driver that checks every frame
parses catches your own pollution and the peer's mutiny in the same place.

*Cross-ref: `PLAN-HERMES-PHASE2…` §2.7 (the gate that now asserts it); `docker/hermes/handshake_gate.py`
(the assertion and the id-correlation); L139 (the same distrust of quiet output, one layer up).*

---

## L143 — **A disclaimer only its author can decode is not an honest limit — it is an unfinished report, and to the reader it reads as a hedge**: every "what this does NOT claim" line owes a plain-English twin before it leaves my hands

Measured 2026-10-12, in the closing summary of `P2-1`. The owner's reply, verbatim: *"you are making random
remarks like this that I dont get enough info about to give a feedback. Again breaching the rule of explaining
in a way that I can understand. Putting it like you did seems like a trap you set for me to ignore so you skip
some work."*

**What I wrote.** *"Honest limits: `P2-1` does not put Hermes behind the door (`P2-3`), does not serve a chat
(`P2-5`), and is not `hermes-local`'s replacement."* Three sub-row IDs, a "door", and a container name — in a
message whose only job was to let a non-developer decide what happens next.

**What it actually meant, and what should have been written.** (1) *"does not put Hermes behind the door"* =
the platform's AI chat still runs on OpenCode; nothing a user clicks reaches the new worker. (2) *"does not
serve a chat"* = no real conversation goes to it; it answers a scripted test handshake. (3) *"is not
`hermes-local`'s replacement"* = two Hermes services now run in Docker and the old one has not been removed.
Each is one sentence a non-developer can act on. I sent the register's shorthand instead of the translation —
the exact thing §2.3 and the reporting rules exist to prevent.

**Why it reads as a trap, and why that is the real defect.** A limitation the reader cannot decode gives him
two losing options: nod through work he cannot judge, or challenge text he cannot read. Either way the writer
looks covered. It was not intended as a hedge — but intent does not repair the effect: the owner must decide
from these sentences, so an undecodable one costs him the decision. And *"Again"* means the mechanism, not the
sentence, is at fault: I keep producing accurate-in-the-register, opaque-in-the-message claims.

**The rules.** (1) **Every limitation ships with its plain-English twin in the same reply** — the IDs may stay
in brackets, the meaning may never depend on them. (2) **One test before sending: could the owner act on this
sentence without asking me a single question?** If not, it is unfinished — rewrite it in this turn, not in the
reply to his follow-up. (3) **A limitation that is not actionable belongs in the worklog, not the message** —
if he cannot do anything with it, saying it is noise that hides the next real decision. (4) **When he says he
cannot decode a line, treat it as a defect in the report, not a gap in his knowledge** — the sentence gets
rewritten and the fix gets banked, in the same change, exactly as a falsified premise would be.

**CORRECTED THE SAME NIGHT — the plain-English twin is still only half a report (the owner, second reply).** I
fixed L143's rule (1) and his reply was *"This is better explained, yet still missing the most important part:
Actions done or recommended. Just like your rules dictate. Stating an issue is good. But only when you state the
action taken."* So the full shape of a limitation is **five parts, and the first version shipped two**: (a) the
name, (b) **what it means in plain words**, (c) **why it exists / the risk if it is left**, (d) **the action
already taken or the ranked lines with a recommendation**, and (e) **whether the owner must decide anything**.
A clean translation of the problem is the invitation to the decision — it is not the decision. **Rule (2)'s
test now reads: "can he act on this without asking me a question *and does the reply say what to do*?"** — a
sentence that explains a gap but names no action still fails, because knowing the gap is not knowing the move.
This is not a new rule; it is the standing reporting rule (*no flag without a full report — named · what it is ·
why · risk · **ranked actions + trade-offs + a recommendation***) applied to limitations, which I had been
treating as mere disclaimers attached at the end of a message.

*Cross-ref: WORKING-RULES §2.3 (plain English — the owner is not a developer) and the reporting rules (no
flag without a full report; never make the owner ask "what does that mean?"); `JOURNAL.md`'s P2-1 block (whose
closing "Honest limits" line is the instance); L137/L138 (the same month's other two "accurate internally,
misleading outside" findings).*

## L144 — when the contract says "the reply's X means Y", the adapter must USE the reply's X — and a fake that echoes the request cannot catch the defect (2026-10-12, `P2-3`)

`P2-3`'s `resumeConversation` sent `session.resume` with the id the caller supplied and then kept **that** id for every later turn. The pinned contract is explicit: the **params** take the stored id *or an exact title*, while *"the reply's* `session_id` *is the runtime id"* (`contracts/sessions.py`) — and the gateway resolves a session-scoped RPC against its **live** sessions by the runtime id **alone** (`server.py::_sess_nowait`, 4001 otherwise). So the adapter's turns would have 4001'd whenever the two ids differ. **The original suite's 33 tests were green with the bug present**, because the fake answered `session.resume` by **echoing the requested id** — a double that structurally cannot disagree with the code under test.

**The rules.** (1) When a measured contract gives a **reply field a defined meaning that differs from the request's**, the adapter adopts the reply's value — the request's value survives only as a fallback, never as the assumption. (2) **A fake must be able to answer differently from what it was asked**; if the double only echoes, add a knob (here: `resumeResult`) and write the test where it disagrees. (3) Grep the failure path too: `4001 session not found` existed in the pinned source and named the exact invariant the adapter had to meet — the *downstream* consequence is often documented where the *shape* is. (4) A green suite proves the adapter matches the fake; only a fake that can contradict the adapter proves anything about the wire.

## L145 — a teardown proof must observe the thing torn down, not a proxy count that cannot fail (2026-10-12, `P2-3`)

The "unsubscribes every event listener" test asserted `prompt.submit` **call counts** around an event emission — and emitting an event never submits a prompt, so the assertion was **invariant**: it passed with every `off()` line deleted from the adapter. The cleanup code was real; the **proof** was hollow, which is worse than no proof because it reads as coverage.

**The rules.** (1) To prove "it cleans up", assert the **collection is empty** — the listener set, the handler list — reachable through the double (`listenerCount(method)`, `exitHandlerCount()`). (2) Ask of any teardown test: *what mutation makes this fail?* If no mutation can (M2 — delete the `finally` loop — was invisible to the old test), the test is decoration, not evidence. (3) The same discipline covers the **exit/one-shot** subscriptions: they are the ones easiest to forget, because nothing *fails* when they accumulate — a bounded leak on a long-lived client is a real defect with no symptom until memory. (4) After rewriting such a test, **re-run the mutation** that should now catch it; a rewrite that no mutation fails is the same defect in a new suit.

## L146 — measure the critic's claims too: an absence claim needs absence evidence, and a bound that is easy to honour is an unfinished requirement (2026-10-12, `P2-3`)

`P2-3`'s hostile critic closed with an accepted bound: *"a live-but-wedged turn (no complete, no exit) has no timeout — hangs; within claim's framing but worth stating."* It read true — neither adapter enforced anything — and it nearly shipped into the journal, the register, the scoreboard and the code's own docblock as a **documented limit of the engine**. Measured before writing it down, it was **false**: `lib/ai-runtime-port.ts`'s `AiRuntimeEnvelope` carries **`deadline?: string | Date | null`** — *"a deadline, so a run cannot outlive its admission"* (and the port's shape test already pinned the key). The adapter now honours the caller's own bound (three tests; mutations M9/M10 prove they bite), and the real gap it exposed — the **OpenCode** adapter ignores that field — is a registered row (**`CC-76`**) instead of a footnote about Hermes.

**The rules.** (1) **The critic's report is evidence to be measured, not a verdict to be applied.** Its findings get re-verified against the source before any fix (all three of `P2-3`'s were) — and its *bounds and dismissals* get exactly the same treatment. (2) **An absence claim ("the port defines no deadline policy") requires absence evidence — a grep that comes back empty, quoted —** because a plausible-sounding absence is the easiest claim to write and the hardest to notice. (3) **A "limit" that turns out to be a field the door already defines is not a bound; it is an unfinished requirement.** When honouring it is straightforward, build the honouring code now (rule 15) and register what genuinely remains — do not document the omission as if it were physics. (4) Same failure mode as L143 — accurate in the author's frame, wrong on the reader's page — except here the author was me, quoting the critic; delegation is not verification.

## L147 — a snapshot that copies the obvious collection but not the fields that carry AUTHORITY is not a snapshot; and an OPEN must cover every exit path the way a teardown does (2026-10-13, `P2-4`)

Two instances, one shape — an incompletely copied or incompletely scoped piece of state — found the same day, one by the critic and one by me.

**(a) The authority-widening copy (the critic's F4).** `attachRunToolMenu` recorded a run's admitted tool menu and its execution context. The **menu** was copied (`[...tools]`) and the menu's own test asserted the copy — but the **context** (which carries `isSuperAdmin`, `userId`, `userFeatures`, `onBehalfOfUserId`) was stored **by reference**. A caller that kept its own reference and mutated it *after* admission could escalate the run it had just admitted; the critic proved it live (`isSuperAdmin: true`, `userId: "attacker"` reached `executeTool`). §8 says the runtime may **narrow** a grant, never widen it — and a recorded admission is authority, so it must be a **snapshot**, not a window onto the caller's object. The array was the *visible* thing to copy; the fields that carried the **power** were the ones left shared. **The rule:** when recording something as authority, copy **every field that grants power**, not the collection that is easiest to name — and ask "what does the caller still hold a reference to?".

**(b) The open that skipped the guards (my own catch).** The `P2-3` lesson L145 says a *teardown* must cover every exit path. The same is true of an **open**: `streamRun` set `run.streamSink = onEvent` *before* its three early-return checks (no input text · client not connected · deadline already passed), so a run that failed to stream left a **dead result channel** on the run object — the identical class of leak, at the other end of the lifecycle. Fixed by opening the channel only after every guard passes, with tests for both halves.

**The rules.** (1) **"Copy it" means copy the authority, not the obvious.** Enumerate the fields, find the ones that grant capability, and copy those; a shallow spread that leaves a nested array or a referenced object shared is the F4 bug wearing a seatbelt. (2) **An open and a teardown are the same discipline.** Whatever you acquire (a listener, a sink, a handler) must be acquired on exactly the paths that will release it — if the release is in a `finally`, the acquire belongs *after* the guards, not before. (3) **A test that asserts the copy must assert the field that carries the power**, or it passes with the defect live (the menu-copy test did exactly that).

## L148 — a new test is evidence only once a mutation makes it fail; prove each new test bites (2026-10-13, `P2-4`)

`P2-4` added three tests whose whole value was catching the exact defects just fixed (the authority snapshot, the result-channel open, the default executor path). Run against the *fixed* code they all pass — which proves nothing on its own: a test that passes is evidence only if some mutation makes it **fail**. So the RED-then-GREEN run was extended to target each new test individually, and the result is the proof: **M5** (revert the context snapshot to a reference) fails exactly the F4 test; **M6** (open the sink before the guards) fails exactly the lifecycle test; **M10** (make the default executor a no-op) fails exactly the default-seam test. One mutation each, one test each — none is decoration.

**The rules.** (1) **Every test added in a change gets a named mutation that turns it RED** — not the suite as a whole, the *test*. (2) When a fix and its regression test land together, run the mutation that reverses the fix and confirm the test (and ideally only it) fails; that is what separates a regression test from a comment. (3) The mutation set should cover **each distinct claim**, so a suite cannot be "all green" while a whole class of claim (here: the default path, the snapshot) has no falsifying mutation at all — the exact gap the critic's F5 found in the suite.

## L149 — a mutation harness that cannot prove its own baseline is not a proof: "13/13 RED" in one second meant jest never ran (2026-10-13, `P2-5`)

The `P2-5` harness printed **"ALL MUTATIONS RED" in 1 second** for **13 jest suites** — and one suite alone takes ~3–17s. That arithmetic is the tell, and it was the only tell: every line read `OK M<n> RED`. The cause was mechanical and total — the harness spawned jest with `execFileSync(..., { stdio: 'pipe' })`, which on Windows in this sandbox throws **`EBUSY`** for a node→node child **before jest starts**; the `catch` returned the string `'RED'`. So a verdict that requires jest to *fail* was produced by jest never *running*. **A RED is only a RED if the suite can be GREEN**: the harness must run every targeted suite **unmutated** first and refuse to trust any RED until the baseline is green, and it must require the runner's own evidence that it ran (jest's `Tests:` line) — a runner that fails to *start* is an **ERROR**, a third state, never folded into RED. Rebuilt as a **bash** loop (bash→node spawns fine; node→node does not, here), it then read: 5 baselines GREEN, then 13 mutations RED, in 2m26s — the duration alone confirming jest actually ran.

**The rules.** (1) **A mutation proof must prove its own baseline.** Run each targeted suite unmutated and require GREEN *before* any mutation's RED is trusted; otherwise a suite that is broken for an unrelated reason reports every mutation as "caught". (2) **Distinguish "failed" from "did not run".** A harness that maps *any* non-zero exit (or a thrown spawn) to RED will happily certify a tool that never executed — require positive evidence of execution (the runner's summary line) and treat its absence as ERROR. (3) **Sanity-check the duration.** A batch that finishes far faster than one unit should is a signal that the units never ran; the clock is free evidence. (4) **The proof's own plumbing is code and must be trusted like code** — the harness that *decides* RED/GREEN is part of the evidence chain, so a defect in it (here a Windows spawn fault) is a defect in every verdict it ever printed.

## L150 — a unit test that reaches a live external service is not a unit test; it is a proof that corrupts silently (2026-10-13, `P2-5`)

The new `resolve-ai-runtime-port` suite called the **real** OpenCode adapter's `describeCapabilities()`, which calls `handleOpenCodeHealth()` — a live HTTP probe to Docker `:4096` **plus** the DI container. It was GREEN earlier in the day (the container was up) and then **hung to the jest 5000 ms timeout** (the container was down). A test whose result depends on whether an unrelated container happens to be running is not evidence about the code under test: it is evidence about the environment. Worse, this is the *same* defect that made L149's false positive possible — a suite that fails for an environmental reason would, in a baseline-less harness, look like every mutation being "caught". The fix is the codebase's own established pattern: mock the probe at the module boundary (`jest.mock('../opencode-handlers')`), exactly as the adapter's own suite already does — the adapter suite proves the *mapping* against the same mock; this suite proves *selection*.

**The rules.** (1) **A test of logic must not perform I/O it does not control.** If the unit under test reaches the network, a database, a container or a clock, mock that boundary — the test's verdict must be a function of the code, not of the host. (2) **A green you did not earn is more dangerous than a red** — an environment-dependent test passes when the environment is favourable and hides the defect exactly when you are looking elsewhere (here, inside a mutation proof). (3) **When a suite already exists for the same seam, reuse its mock boundary**, so the two suites agree on what "the dependency" is; a second, hand-rolled seam is how one suite goes green while the other goes red on the same code. (4) **The corollary to L149:** an environment-dependent suite makes a mutation proof lie twice — once by failing when it should pass (baseline not green), once by looking like a caught mutation when it is only a flaky failure.

## L151 — a timer that only sets a flag does not bound a run: the bound must END the stream, and the test must drive the case where the engine never yields (2026-10-13, `P2-6`)

`P2-6`'s bounded-CPU claim required **both** engines to honour the envelope's wall-clock bound. The OpenCode adapter's timer set a `deadlinePassed` flag and emitted an error event, which stopped *forwarding* — but it left `await handleOpenCodeMessageStreaming(...)` **pending**, so `streamRun` never resolved. The Hermes adapter's timer calls `settle()`, which unblocks its `await streamEnded`, so Hermes **ended** at the bound. The two engines **drifted**: against a stalled engine, Hermes returned and OpenCode awaited forever. The existing "outlives the bound" test **hid** this because it released the engine *before* it awaited — it proved the *flag* worked, never that the *stream ended*. The separate-agent critic found it by writing a stalled-engine probe (`Expected: "RESOLVED" Received: "STILL-PENDING"`). Fixed by racing the engine call against a deadline promise; the regression test drives the case the old test avoided (the engine never yields).

**The rules.** (1) **A bound must END the thing it bounds, not merely stop it producing output.** "No further events are forwarded" is a different guarantee from "the call returns"; only the second bounds a caller's wait, and only the second is what "bounded CPU" means. (2) **A flag read by a cooperative consumer is not a terminator** — it bounds nothing while the producer is stalled, which is exactly when a bound matters. (3) **A test that releases the blocking condition before it awaits cannot see a hang** — to prove a bound ends a stalled stream, the stream must be stalled *while* you await it. (4) **When two engines implement the same contract, prove the property in BOTH** or the "shared rule" is a claim, not a fact — Hermes settled, OpenCode didn't, and only a side-by-side test shows the drift.

## L152 — a rule stated for "both" hides the third implementer; a property stated over "the X" must hold for EVERY X (2026-10-13, `P2-6`)

`P2-6`'s measured facts said "the run registry is never pruned … in **both** adapters" — the two chat-engine adapters behind the selector. The requirement's build then said "the run registry is capped and pruned", full stop. There are **three** implementations of `AiRuntimePort`: OpenCode, Hermes, and the platform's own in-process adapter (`agent-runtime-port-adapter.ts`, used by `api/ai/chat`, `api/ai/run-object`, `business-ir-author`). The third was **unbounded**. The separate-agent critic drove 300 finished runs through it and measured 300 retained. The "both" wording was true of the *premise* and false of the *property*. Fixed by applying the same shared `pruneRunRegistry` to the third; its wall-clock bound is **NAMED** (it does not own its byte stream — it stashes a `Response` for the caller to drain — so a wall-clock bound on it is a different change, registered rather than silently omitted).

**The rules.** (1) **A property stated over "the X" must hold for every X, not for the two you happened to measure** — when a shared module exists precisely to stop drift, a caller that skips it **IS** the drift. (2) **"Both adapters" is a count, and counts rot** — name the *interface* (`every AiRuntimePort implementation`) or enumerate and check the whole set; a count silently becomes wrong when a third appears. (3) **A negative assertion about a field that never travels is vacuous** — the same test asserted no frame carried the other tenant's *tenant id*, but **no** frame ever carries **any** tenant id (only `idempotency_key`/`session_id` travel), so four of its eight assertions could not fail; assert absence only of things that are actually present elsewhere (**L145**'s shape).

## L153 — size a bound from the metric that states the total, never from a derived fraction — and a derived estimate that agrees once is luck, not a method (2026-10-14, `P2-7`)

`P2-7` had to size a **prefill grace** (`HERMES_LOCAL_STREAM_STALE_TIMEOUT`) against a local model's time-to-first-token. The model's log prints two numbers per batch: a fraction (`prompt processing, n_tokens = 2047, progress = 0.47, t = 272.52 s / 7.51 tokens per second`) and, once, the total (`prompt eval time = 1583037.56 ms / 10988 tokens`). The fraction was read as `2047 / 0.47 ≈ 4355 tokens` and *looked* corroborated by an earlier, smaller prompt (`2047 / 0.34 ≈ 6020` against an actual **6105** — within 2%). Both were wrong in kind: the real prompt was **10,988 tokens**, 2.5x the estimate, needing **1583s** at 6.94 tok/s instead of the ~7 min the estimate implied. The same mis-reading recurred on the third turn the same day (`0.85` at 8191 → an implied **9,637** against an actual **10,646**), which is how the method was finally caught. The grace would have been sized against a prompt that does not exist.

**The rules.** (1) **A bound is sized from the authoritative metric — the one that states the total — never from a derived fraction**, even when the derivation is arithmetically correct. (2) **An estimate that agrees once is not a validated method** — the two measurements disagreed by 2.5x; agreement on the smaller case was luck. Either two independent confirmations, or read the total. (3) **When a log offers both a per-batch fraction and a final total, the total is the only number a timeout may be built on**; the fraction describes a batch, not a job. (4) **A timeout sized from an underestimate fails silently in production** — here the 900s default would have aborted every real turn on the platform's own Sprint-0 stack, and no unit test could ever have seen it.

## L154 — a gate run on the wrong toolchain is not the same gate: the runtime decides which tests can even LOAD (2026-10-14, `P2-7`)

Running the full package suite with `npx jest` reported **"2 suites failed, 125 passed, 127 total; 1662 tests passed"** — reading as a regression from `P2-6`'s 1752. Both "failures" were load errors, not test failures: `isolated-vm` (a native module behind `sandbox.ts`) printed *"No native build was found for platform=win32 arch=x64 abi=127"*. The repo pins **node 24.x** (`.nvmrc` = `24`, `engines.node = 24.x`) and `node_modules/isolated-vm` ships a win32-x64 prebuild for **abi137 (Node 24)** and abi147 — but **nothing for abi127**. The shell's `npx` had silently resolved the WorkBuddy-managed **node 22.22.2**. Re-running the identical command under the pinned **Node 24** binary: **127 suites / 1771 tests green** — and 1771 is exactly `P2-6`'s 1752 + this row's 19, the arithmetic tell that the 1662 run, not the code, was wrong.

**The rules.** (1) **Run the repo's gates with the repo's pinned runtime** — check `.nvmrc`/`engines` *before* trusting a green or a red; for native modules the ABI decides which suites can even load, so the wrong runtime changes the **set** of tests, not their result. (2) **When a gate number does not reconcile with the previous row's by exactly the delta you added, the run is wrong** — 1752 + 19 = 1771 ≠ 1662 was visible in the first line of output. (3) **"N suites failed" from an environment you are standing in is a finding about the environment first** — name the missing file, the import that reached it and the ABI before reporting a regression; the two suites imported none of this row's files. (4) **A shell's default `node` is not the project's node** — `npx` inherits the PATH, and a managed runtime's binary can silently outrank the pinned one.

## L155 — a proof longer than a minute writes its evidence to a file at launch; a background task's registry is a monitor, not an archive (2026-10-14, `P2-7`)

The production-shaped live turn (run #2) was started as a background task and its console output — including the harness's own `PASS` line, the exact artifact §2.13's exit gate names — was meant to be read afterwards. The background-task registry expired before the line was retrieved (a later `TaskOutput` returned *"No task found"*). The model's log independently proved the turn had completed (10,988-token prompt, 37 generated tokens, slot released), but the **typed-event verdict** existed nowhere durable. The turn was re-driven (run #3) with its output `tee`'d to a file from the first second.

**The rules.** (1) **Every long-running proof redirects its output to a file at launch** — `| tee file` in the launching command, not a retrieval step afterwards. (2) **A live-process registry is for watching, not for keeping** — assume anything not yet on disk will be lost. (3) **If a gate's artifact is a printed verdict, the verdict is not evidence until it exists somewhere a later session can read** — the model log proved the *model* answered; only the file proves the *adapter's typed events ended on `done`*, which is what the row actually claims.

## L156 — a guard that cannot fail is not a guard: PUT A MUTATION TO IT, and be suspicious of the fixture you did not try to break (2026-10-14, `P2-8`)

`P2-8` extended the wiring suite that `P2-7` wrote, including a test titled *"ignores a key that appears ONLY in a comment (the parse is not a substring search)"* — the anti-vacuity proof that the compose guard parses the real `environment:` mapping instead of grepping the file. It looked right, and the mutation gate proved it was not: **16 mutants were run, 14 went RED, and the two that stayed GREEN were both the "the parse is not a substring search" fixtures** (18 by the end of the row, after the critic's own M17/M18). A probe then removed the comment-stripping from the parser entirely and the whole suite still passed. The reason is structural: the fixture puts `# OPENAI_BASE_URL: …` on its own line, and **a comment-only key can never satisfy a mapping reader** — the line does not even reach the key regex. The test was a claim about itself.

**How it was caught.** Not by reading the fixture — it was read several times and looked sound — but by running a mutation of exactly the property it claimed to prove, then by a probe (revert one mechanism, re-run, observe GREEN). **A GREEN mutant is the only reliable reader of a guard.**

**The fix.** The fixture was rewritten so the named defect would actually be caught: the key now appears **twice** — in a comment **and** under a different section of the same service (`labels:` / `deploy:`) — and a real mapping is asserted as the **control** (`HERMES_HOME` is read, so the negative is a property of the parse, not of the key being unfindable). The mutant that removes the `inEnvironment` gate turns it RED. The docblock was corrected to say what the test proves, and the `P2-7` block that repeated the old claim was corrected too (rule 13).

**The rules.** (1) **Every anti-vacuity test gets its own mutation** — the property "this guard is not a substring search" is a *behavioural* claim, and behavioural claims are only proven by a mutant that exercises them. (2) **If a fixture's comment explains why it cannot fail, distrust the fixture** — "the parser must see nothing" over an input the parser could never have seen anything in is the shape of a vacuous test. (3) **A negative assertion needs a positive control** — assert the same key IS found when written correctly, so the negative proves the *scope*, not an inability to find. (4) **Probe before believing** — disabling the mechanism under test and re-running is a minute of work that turns "I think this is guarded" into "measured". (5) **A vacuous guard is worse than a missing one**: it spends review attention and buys no protection, and it is invisible until something breaks.

## L157 — the pin must reach the process that matters: a bash `PATH` prepend stops at the Windows shim, and a root-scoped discover is not the package gate (2026-10-14, `P2-8`)

Re-measuring `P2-8`'s own gate, I ran the pinned **Node 24** with a bash `PATH` prepend — `PATH="$NODE24:$PATH" NODE_OPTIONS=… npx jest` — and got **"2 suites failed … 1729 tests passed"**, with the same `isolated-vm` signature L154 recorded: *"No native build was found for platform=win32 arch=x64 runtime=electron abi=127 … node=22.22.2"*. The prepend never applied: on Windows, `npx` is a **`.cmd` shim** resolved through the **Windows** PATH, not the bash PATH, so the pinned binary was never the process that forked jest's workers. The measurement that settles it: run the gate as **an absolute path to the pinned binary** — `C:/…/.toolchain/node24/node.exe node_modules/jest/bin/jest.js` — which gave **128 suites / 1838 tests green**, exactly the recorded number.

**A second trap in the same ten minutes.** `npx jest` at the **repo root** is a *different* gate: the root config's `testMatch` discovers **1990 suites** and the run ends **"Test Suites: 1990 failed, 1990 total; Tests: 0 total"** — not one suite loads. Sampled three of them at root scope (all `hermes-*`): each fails with `TS5011: The common source directory of 'tsconfig.json' is …`, because the root transform block passes no `rootDir`, while `packages/ai-assistant/jest.config.cjs` does. So a root-scoped run reports 1990 red suites where the package-scoped gate reports 128 green; only the package scope is the row's gate.

**The rules.** (1) **A `PATH` prepend in bash proves nothing about a Windows shim** — the pin is in force only when the *pinned binary itself* is the process you launched (absolute path), for any command that runs through a `*.cmd`/`*.exe` shim. (2) **Read the runtime the error names** — `node=22.22.2` in the load error is the whole diagnosis, and it was on the first line. (3) **A suite count that is not the gate's suite count is the wrong gate** — root-scoped discovery found 1990 suites against the package gate's 128, and a config error at that scope looks like a mass regression rather than a mis-scoped run. (4) **Re-measure a recorded number with the recorded scope** — 128 suites is `packages/ai-assistant`'s `testMatch`, and reproducing it from the root is not possible (L154's rule 2 again, one level up).

## L158 — "the replacement is proven" is not "the replacement can do what the old one did": measure a DELETION against the capability, not against the exit gate (2026-10-14, `P2-9`)

`P2-9`'s plan said: flip the default to Hermes, delete OpenCode, retire the old door — one change — and it described `CC-79` (the worker→platform bridge) as *"unaffected"*. Every *gate* in that plan was satisfiable: `AI_RUNTIME_ENGINE` defaults to hermes, `door-only-way-in.test.ts` passes with the engine gone, the retired service leaves no reference behind, the suite is green, `tsc` is clean, the mutations go RED. **And the change would still have been a regression.** The live stack said so in three commands: OpenCode is `healthy` and **connected to the platform's own MCP server** (`{"open-mercato":{"status":"connected"}}`), that server exposes **21 tools**, and a Hermes chat can reach **none** of them. The exit gate measured the *engine swap*; nobody had measured the *capability* the engine was carrying.

**Why the gate could not catch it.** A gate is written from the replacement's exit criteria ("does Hermes serve a turn?"), and a turn is served. The capability lived *outside* the row's own contract — in a service connection (`OPENCODE_MCP_URL` → `mcp:3001`) that the row never named because it was never part of "the engine". **A deletion's blast radius is the union of every capability the deleted thing was carrying, and that union is not visible from the replacement's test suite.**

**The rules.** (1) **Before deleting a component, enumerate what it does for the product TODAY — from the running system, not from the code's own tests.** `docker ps` + the component's own status endpoints answered this in one minute. (2) **A green exit gate on the replacement proves the replacement runs, not that the product is whole** — write the deletion's requirement from the *capabilities*, then let the gates follow. (3) **When a plan sentence says "X is unaffected", X is the first thing to measure** — an "unaffected" claim in a deletion row is an untested assumption wearing the costume of a conclusion. (4) **A blocker's own remedy can be wrong in its ranking** — `CC-79` ranked "point the worker at an MCP server" *second* and called it "larger … the worker has no configured MCP surface (measured)"; the measurement was true about the *config* and false about the *capability* (the worker ships a full MCP client; only the SDK is absent from its image). **Re-measure a blocker's premise before acting on its ranking.** (5) **The cheap fix is often a configuration the component already supports** — check what the dependency ships before building a plugin for it.

## L159 — a proof that reads the WRONG VIEW of the thing it is checking is not a proof: the pin's `load_config()` is env-EXPANDED, `read_raw_config()` is as-written (2026-10-14, `P2-9a`)

`P2-9a`'s bootstrap writes the worker's MCP entry with the credential as the placeholder `${MCP_SERVER_API_KEY}` — deliberately, because `config.yaml` lives in a **persistent volume** and a secret at rest there would make rotation a volume edit. The bootstrap then proves its own work, and the first version of that proof was:

```python
saved = (load_config().get("mcp_servers") or {}).get(server_name)
if (saved.get("headers") or {}).get("x-api-key") != PLACEHOLDER:
    return fail("... the credential may have been written to disk in the clear.")
```

The worker booted and printed: **`FATAL: read back a header that is not the MCP_SERVER_API_KEY placeholder — the credential may have been written to disk in the clear.`** The file was correct. The *proof* was not: `hermes_cli/config.py`'s `_load_config_impl` ends in `_expand_env_vars(normalized)`, so `load_config()` returns the **resolved credential**, not the placeholder — and a resolved credential is exactly what a secret written in the clear looks like. The check could not distinguish the success case from the failure case it named.

The pin has both readers and says so in their docstrings: `read_raw_config()` — *"Read config.yaml as-is (no defaults merged, no migration)"*; `load_config()` — *"merged configuration (DEFAULT_CONFIG + config.yaml + managed scope, **env-expanded**)"*. Two questions need two reads: **is the secret at rest?** (`read_raw_config`) and **does the runtime resolve it?** (`load_config`). Both are now asserted, and the second is strictly stronger than the manual `_interpolate_env_vars` call it replaced, because it is the pin's *entire* load path — the same call `_load_mcp_config()` makes at turn time.

**Why this was caught, and why it matters that it was.** The bootstrap fails the **boot** on any failed proof, so the wrong assertion surfaced as a container that would not start — loud, immediate, and impossible to mistake for success. A fail-closed design turns a wrong assertion into a visible defect; the same mistake behind a warning would have shipped a config nobody could audit.

**The rules.** (1) **Name the question before choosing the reader** — "what is stored" and "what is resolved" are different questions, and a config layer usually answers each through a different function. (2) **A comparison is only a proof if the two failure modes it spans are distinguishable** — here "correct" and "secret leaked" produced the *same value*, so the assertion was testing nothing. (3) **Read the function's own docstring for expansion/normalisation before asserting on its output** — `load_config`'s says *env-expanded* in one line. (4) **Prefer the pin's full path over a hand-rolled equivalent** — `load_config()` subsumes the explicit `_interpolate_env_vars()` call and proves more, because it is what the runtime actually runs. (5) **Make the proof fatal** — a verification whose failure only warns is a verification that will be ignored.

## L160 — Git Bash rewrites a leading-slash ARGUMENT into a Windows path: `--entrypoint /build/…`, `cat /var/…`, `-f /c/tmp/…` all arrive mangled (2026-10-14, `P2-9a`)

Three separate failures in one row, one cause. `docker run --entrypoint /build/.venv/bin/python3 …` died with *`exec: "C:/Program Files/WorkBuddyAI/resources/vendor/PortableGit/build/.venv/bin/python3": stat …: no such file or directory`* — the MSYS layer had prefixed the Git installation root onto a container-internal absolute path. `docker exec <c> cat /var/lib/hermes/config.yaml` failed the same way (*`cat: 'C:/Program Files/…/PortableGit/var/lib/hermes/config.yaml': No such file or directory`*). And `docker compose -f /c/tmp/…yml` — with `MSYS_NO_PATHCONV=1` exported to stop the rewriting — then failed in the *opposite* direction: *`compose file "C:/c/tmp/…yml" is invalid`*, because the flag had also suppressed the conversion of a **host** path that genuinely needed it.

So the two directions need two different answers, and they are not interchangeable: **container-side absolute paths** (an `--entrypoint`, a `cat` argument) need `MSYS_NO_PATHCONV=1`; a **host path passed as a `-f` argument** needs the **Windows form** (`C:/tmp/…`), because with the flag set nothing will convert it. This is the same family as L157 — the shell between the operator and the tool is part of the command's semantics — but the failure is the *opposite* polarity, and the L157 fix (absolute path to the pinned binary) does not touch it.

**The rules.** (1) **A path in an argument is interpreted by the layer that receives it, not by the shell you typed it in** — decide which side of the boundary a path belongs to before writing it. (2) **`MSYS_NO_PATHCONV=1` is a per-command decision, not a shell setting** — exporting it globally then breaks the host paths in the same command line. (3) **The error names the truth**: a path with `PortableGit` in it, or `C:/c/tmp`, is the diagnosis, and it is on the first line. (4) **When a container-side probe is the goal, prefer stdin** — `docker exec -i <c> sh -c '… python3 -' < probe.py` carries no path across the boundary at all, which is why the working probes in this row used it.

## L161 — `toContain('theFunction()')` is satisfied by the DOCSTRING that explains the function: anchor a source guard on the CALL SITE (2026-10-14, `P2-9a`)

The `P2-9a` wiring suite guards which readers the bootstrap uses, and the first version of that guard was:

```ts
expect(source).toContain('read_raw_config()')
expect(source).toContain('load_config()')
```

Both passed — including on a mutant. The reason is that the module's own docstring is *about* those two functions (it explains why each is needed) and contains both names verbatim, so the guard was satisfied by the prose regardless of the code. The same trap then bit the ordering assertion: it sliced the source from `indexOf('read_raw_config()')`, which landed **inside the docstring**, so the slice ended before any code and the assertion on it failed for the wrong reason.

The fix is to anchor on something only code can contain — the call site with its argument: `read_raw_config().get("mcp_servers")` and `load_config().get("mcp_servers")`. That is the same anti-vacuity rule the `P2-7`/`P2-8` blocks already follow for the compose parser (L156), applied to a *source file* rather than a config file: **the file's comments and docstrings name every symbol under test, so a bare symbol is never evidence.**

**A second instance, caught the same way, in the same hour.** The guard for "a refused MCP bootstrap is FATAL" was `/if\s+result\.returncode\s*!=\s*0:\s*\n\s*fail\(/` — a *shape*, not a site. `main()` contains **two** such checks: the pin-digest verification near the top, and the bootstrap's at the bottom. The mutant that downgraded the bootstrap's `fail(` to a `log(` stayed **GREEN**: the regex was satisfied by the pin check. Fix: scope the assertion to the region after the bootstrap is resolved (`source.slice(source.indexOf('bootstrap = os.path.join'))`). **A structural pattern is only an anchor if it is UNIQUE in the file.**

**The rules.** (1) **Anchor a source guard on a construct the prose cannot form** — a call site with arguments, a full instruction line, an assignment — never a bare identifier. (2) **A docstring is a comment with better formatting** — strip it, or step over it, exactly as the compose parser strips `#`. (3) **Assert the guard against a mutant before trusting it** — this one survived the mutant precisely because it was reading the documentation. (4) **When a slice-based assertion fails, check where the slice STARTED** — `indexOf` finds the first occurrence, and in a well-documented file that is usually the prose. (5) **A structural pattern must be unique in the file, or it anchors the wrong site** — count the occurrences before trusting a regex; `if <cond>: fail(` matched a *neighbouring* check and left the mutant GREEN. Scope it (slice to the region) or make it name its subject.

## L162 — a compose command's blast radius is the PROJECT, not the file: `down --remove-orphans` on a partial file set removes the rest of the stack (2026-10-14, `P2-9a`)

Restoring the worker after the `P2-9a` live proof, I ran:

```
docker compose -f docker-compose.hermes.yml -f C:/tmp/hermes-door-publish.yml down --remove-orphans
```

intending to stop the two things those files define. The output named what it actually did: **`Container hermes-local Removed`, `Container mercato-mcp-local Removed`, `Container starting-kit-app-1 Removed`** — and `docker ps -a` then showed **one** container on the host. The platform's MCP server, its app, its model, redis, postgres, meilisearch, OpenCode and the upstream Hermes service were all gone. They were not in the file set, so `--remove-orphans` classified them as *orphans of the project* and removed them.

`docker-compose.hermes.yml` is a **separate file in the SAME compose project** — the project name comes from the directory (`starting-kit`), not from the file — which is exactly the design that made `P2-8`'s worker independent, and exactly what makes `--remove-orphans` here mean "remove everything this file set does not define", i.e. the entire rest of the platform.

**Recovery was complete, and that is the second half of the lesson.** `docker compose -f docker-compose.fullapp.yml up -d` (the repo's own `yarn docker:up`, minus `--build` since no image content had changed) brought all eight services back, and **no volumes were touched** — `down` without `-v` never removes volumes, so no data was at risk. The blast radius was bounded by the flag chosen, not by luck: had `-v` been on the same command line, the platform's databases would have been destroyed.

**The rules.** (1) **Never pass `--remove-orphans` when your compose file is one of several sharing a project** — the flag means "remove every container of this project that these files do not define", which is the rest of the stack. (2) **To stop what your file defines, use `up -d` (which replaces just that service) or `stop`/`rm` on the named service** — never a project-scoped teardown. (3) **The project name is the directory, not the file** — read `docker compose config --format json`'s `name` field before assuming a file is isolated. (4) **`down` without `-v` is recoverable; with `-v` it is not** — and the flag you did not type is not a safeguard you can rely on later. (5) **Read the removal list the command prints** — it named all three containers it was about to destroy before doing it.

## L163 — a suite that MOCKS the provider registry is not thereby hermetic: the runtime still reads the AMBIENT environment, so the gate's verdict depends on the shell that ran it (2026-10-14, `P2-9a`)

The `P2-9a` gate read **5 failed suites / 27 failed tests** on its first full-package run. Every one of the five **passed in isolation**. The throw was uniform and did not mention any file this row had touched:

```
AiModelFactoryError: The resolved model is pinned to provider "openai", but that provider is not configured.
  at Object.resolveModel (src/modules/ai_assistant/lib/model-factory.ts:699:17)
```

`model-factory.ts` was **unchanged**; so were all five suites (`git diff --quiet HEAD -- <file>` → unchanged, for each). The cause was reproduced **exactly** by exporting the app's own provider config before the run — `OM_AI_PROVIDER=openai OM_AI_MODEL=Qwen2.5-7B-Instruct <jest>` → `5 failed, 123 passed, 128 total` / `27 failed, 1837 passed, 1864 total`, the same five suites, the same count. `model-factory.resolveModel` walks the provider axis **from the environment** (`readGlobalProviderFromEnv` reads `OM_AI_PROVIDER`, then the legacy `OPENCODE_PROVIDER`; `readGlobalModelFromEnv` reads `OM_AI_MODEL`), and those suites mock the *registry* — not the *env* — so an exported `OM_AI_PROVIDER` pins the model to a provider their mock does not offer. Characterised by isolation: `OM_AI_PROVIDER=openai` alone ⇒ 3 failed; `OPENCODE_PROVIDER=openai` alone ⇒ 3; `OM_AI_MODEL=openai/gpt-4o` alone ⇒ 3; `OM_AI_MODEL=Qwen2.5-7B-Instruct` alone ⇒ 1.

**The hypothesis that was WRONG, and how it was killed.** The obvious story was a cross-file `process.env` leak — Jest shares `process.env` across test files in one worker, and several suites here assign it wholesale (`process.env = originalEnv`). That story was **falsified with a positive control**, not with an argument: a probe registered as `setupFilesAfterEnv` printed an init line **128 times** (proving it ran in every file) and reported **zero** env changes across the whole run — while the same run was 128 / 1864 green. The probe reports *changes*, so it can never see a variable that is **constant and inherited** — which is exactly what an exported `OM_AI_PROVIDER` is, and why the leak story looked right and was wrong.

**Why this matters more than the five suites.** The protocol's central claim is *"only code is evidence"*, and its gate is the full package green. A gate whose verdict flips because the operator's shell had `.env` sourced is a gate that can report RED on a correct tree — and, worse, GREEN while a suite is quietly dependent on ambient configuration. `P2-9b` deletes the engine whose env names (`OPENCODE_PROVIDER`/`OPENCODE_MODEL`) are precisely the aliases this defect reads, so the exposure is about to get wider, not narrower.

**The rules.** (1) **Mocking a collaborator does not hermeticise the process** — anything the unit reads from `process.env` is still live; a suite that claims "deterministic, hermetic, provider-agnostic" must clear the ambient keys or pass them explicitly. (2) **A gate's verdict is part of the gate** — record the environment a gate was read in, and re-run from a clean shell before believing a RED. (3) **Reproduce before you explain** — the exact failure set was reproduced by setting two variables, which converted a mystery into a two-line command. (4) **A negative result needs a positive control** — "the probe printed nothing" is worthless until the probe proves it ran (128 inits), and the probe's own blind spot (constant variables) must be stated. (5) **Check the failing files against HEAD first** — `git diff --quiet HEAD -- <file>` for each turned "is it mine?" into a fact in one command.

## L164 — a guard that names a MECHANISM must assert its USE, not its import — and an f-string puts the expression where a quote-anchored extractor cannot see it (2026-10-14, `P2-9a`)

Two vacuous guards, found by a **separate-agent hostile critic** in the `P2-9a` wiring suite, each proven by an actual mutation, and each invisible to every gate the row had already run (53/53 green, 18/18 mutants RED — because the mutation set was written by the same hand that wrote the guards).

**Trap 1 — the import is not the call.** The test is literally named *"writes through the pin's own writer, not hand-rolled YAML"*, and it asserted:

```ts
expect(source).toContain('from hermes_cli.mcp_config import _save_mcp_server')
```

That is the **import**. Replacing the call site with a hand-rolled write while leaving the import in place left the suite **53/53 green** — the test whose entire purpose is "not hand-rolled YAML" cannot fail when the YAML is hand-rolled. Fix: anchor on the call with its arguments, `/_save_mcp_server\(\s*server_name\s*,\s*entry\s*\)/`.

**Trap 2 — the f-string hides the expression inside the literal.** The guard *"logs the credential's SOURCE and LENGTH, never its value"* worked by taking everything **after the last quote** of each `log(` line — the `%`/`+`/`,` argument part — then stripping `len(key)` and asserting the identifier `key` is absent. That is exactly right for `log("... %s ..." % (source, len(key)))`. It is blind to:

```python
log(f"MCP credential resolved from {source} ({len(key)} chars): {key}")
```

because in an f-string the **expression lives inside the quotes**. Mutating the entrypoint to that line — i.e. **printing the secret** — left the suite **53/53 green**, including the test named "never its value". The guard was vacuous against the most idiomatic Python form of the very leak it names, and the leak lands in `docker compose logs`. Fix: also extract every `{…}` group from the line and check those.

**Why the mutation gate did not catch this.** The row's 18 mutants were written by the same author as the guards, so they varied the things the author was already thinking about. A mutation set is a **hypothesis about how the code could break**, and its blind spot is the author's blind spot. The critic's mutants came from a different hypothesis space — "what would a *later* developer plausibly write?" — which is why a plain f-string, not an exotic one, broke it. **A second, independent adversary is not redundancy; it is the only thing that tests the mutation set itself.**

**The rules.** (1) **A guard naming a mechanism must assert the mechanism's USE** — the call site with its arguments, never the import, never the name in prose. (2) **Know your extractor's blind spot and state it** — a quote-anchored slice cannot see f-strings, `{}`/`%` interpolation, or concatenation; enumerate the forms and cover each, or assert on a parsed AST. (3) **A security assertion deserves an adversarial mutation** — "the secret is never logged" is exactly the kind of claim that gets a green test and a leaked credential. (4) **Give the mutation set to someone who did not write the code** — the author's mutants share the author's blind spot, and the fix is a different hypothesis space, not more mutants of the same kind. (5) **A `toContain` on a flag needs a boundary** — `toContain('--extra mcp')` is satisfied by `--extra mcp-bogus`, a typo that installs nothing; measured, and it passed.

## L165 — the decisive run of a hermeticity fix is the DEFECTIVE condition, not the clean one — and a rule's test needs a fixture that CONTAINS the rule's subject (2026-10-14, `CC-80`)

`CC-80` is the defect `P2-9a`'s gate exposed: the `ai-assistant` suite read the operator's shell, so exporting `OM_AI_PROVIDER=openai` turned **5 suites / 27 tests** red. The fix clears the provider axis once per test file (`test-env-hermetic.ts`, wired as `setupFilesAfterEnv`). Two things about proving it are the lesson.

**1. A clean run proves nothing about a hermeticity fix.** The clean run was **already green before the fix** — it is the *baseline*, not the evidence. The evidence is the run in the condition the fix exists for:

```
# BEFORE the fix:  OM_AI_PROVIDER=openai OM_AI_MODEL=Qwen2.5-7B-Instruct <jest>
#   → 5 failed suites / 27 failed tests / 1864 total
# AFTER the fix:   the same two variables exported
#   → 129 suites / 1890 tests GREEN
```

Both sides are now recorded as the acceptance criterion, and a mutation (dropping the PREFIX rule, keeping only the exact key list) turns the poisoned run **RED** again — 3 failed — which is what makes the acceptance a measurement of the fix rather than of the shell it ran in. **State the acceptance two-sidedly, and make the "defective" side the one you quote.**

**2. The fix's own unit test was wrong on first write, and only the defective run caught it.** The suite asserted that the clearing policy includes `OM_AI_PROVIDER`, via `providerEnvKeys({})`. It does not — the function returns the keys *of the env it is given* that the policy covers, and an **empty fixture contains no key for a PREFIX rule to match**, so nine assertions failed. The mistake was a category error about the contract: "what does the policy cover" (a constant) versus "which of THESE keys does it cover" (a function of its input). Passing `process.env` would not have fixed it either — by the time the test runs, the setup has already cleared those keys, so the fixture would be empty for the same reason.

**The rules.** (1) **Run the new test in the condition it exists for** — a hermeticity test's decisive run is the poisoned one; a clean run is the baseline, not the proof. (2) **A fixture must CONTAIN the subject the rule operates on** — a prefix rule observed through an empty object tests nothing, and it fails for a reason that looks like a product bug. (3) **Distinguish a CONSTANT from a FUNCTION of its input** before asserting — "the policy covers X" and "these keys include X" are different claims, and only the second is a function call. (4) **Passing the live object is not the safe default** — when the system under test has already mutated it (here, cleared it), `process.env` is as empty as `{}`; build the fixture explicitly. (5) **The two-sided acceptance belongs in the record**, not in a transcript: quote the RED and the GREEN, in that order.

---

## L166 — a type-error fix must restore the CLAIM, not merely silence the compiler: the test's own TITLE is part of the claim (2026-10-14, `CC-73`)

**The symptom.** `CC-73` turned the `ai-assistant` type gate back on and 92 test-only errors appeared. Most were mechanical. Two were not: `ai-agent-definition.test.ts` and `phase-0-additive-contract.test.ts` each asserted *"returns an object assignable to `AiToolDefinition` and `McpToolDefinition` (BC)"* — and the assertion was **false**, not stale. `handler` and `isDestructive` are **function-typed properties**, so under `strictFunctionTypes` their parameters are checked **contravariantly**; a tool whose schema infers `Record<string, never>` is therefore NOT assignable to the default `AiToolDefinition<unknown, unknown>`.

**The wrong fix (mine, first attempt).** Author the tool with `defineAiTool<unknown, { pong: boolean }>(…)`. The error vanishes and the gate goes green — and the test now proves almost nothing, because `defineAiTool` is an identity function: asserting its return is assignable to the type it was given is near-tautological. **The title still claimed the old, false thing.**

**How it was caught.** A **separate hostile critic** compiled the ORIGINAL inference form in a scratch file, produced the `TS2322`, then asked what the fixed test still proves. The author's own gate could not see this — a green gate is exactly what the wrong fix produces.

**The rules.** (1) **A type-error fix has two obligations: make the compiler quiet AND restore the claim.** If the claim was false, the fix must narrow the claim — and the **title and the comment are part of the claim**, so they change in the same edit. (2) **Ask of every fix: does this make the assertion hollow?** An identity-typed builder asserted against its own parameter type is a tautology; what the test actually pins is the builder's RETURN TYPE, and the title must say so. (3) **When the true claim is weaker than the written one, the gap is a DEFECT to register, not a sentence to delete** — the narrow-input friction is real (`CC-81`); deleting the failing assertion would have buried it. (4) **The green gate is not the evidence for a type fix** — it is the *product* of the fix; the evidence is a separate reader asking what the test now proves.

---

## L167 — a blanket cast in a TEST HELPER erases the per-item types it covers, and a fake that omits required fields is invisible only while a cast stands between it and its consumer (2026-10-14, `CC-73`)

**The symptom, two shapes of one mistake.**

*(a) The helper cast.* `meta-pack.test.ts` reads a tool out of a **tuple** of three tools with three different input types; `.find()` returns their **union**, and calling `.handler()` on a union demands the **intersection** of every tool's input. The fix widened the helper's return to a loose hand-written shape — which **erases each tool's input type for the whole suite**: a wrong-TYPED input stops being a compile error. That is *acceptable here* (these tests assert runtime validation on arbitrary input, which is what a validator test is for) — but only if the **trade-off is written down at the cast**, because an undocumented blanket cast reads exactly like an oversight.

*(b) The fake with missing fields.* `business-ir-run.test.ts`'s spy engine returned `{ items, total }`; `QueryResult` also requires `page`/`pageSize`. Adding them is genuine **fidelity** — but the comment claimed it prevented an observed defect (*"a caller that read `result.page` would get `undefined`"*), and the critic measured that **no caller reads them** and the gate passes either way. A comment claiming a defect you did not observe is a false statement in the tree, the same standard as a wrong comment anywhere else.

**The rules.** (1) **A cast covering N items hides N types** — say so at the cast and say why the loss is acceptable; an unexplained `as unknown as` in a helper is indistinguishable from laziness. (2) **Distinguish "fidelity" from "fix"** — completing a fake to match its port is good, but the comment must say *fidelity*, not *fix*, unless a caller was actually observed reading the field. (3) **The blast radius of a test-helper type is the whole file** — a per-call-site cast is narrow and loud; a helper-level cast is broad and quiet, so it needs the stronger justification. (4) **"The gate passes either way" is the test** — if a change cannot be falsified by the gate, it is a comment or a convention, not a repair, and must not be recorded as one.

---

## L168 — a "copy this and change only two files" claim must be VERIFIED by grepping the new tree for the old name — the shared engine was not as platform-agnostic as its own guide said (2026-10-15, Multica reader)

**The symptom.** The reader engine's own guide states the invariant plainly: *"the engine is platform-agnostic; only two things change per platform (`DOCS_CONFIG` and `diagrams.js`)"*. It had been reused three times (Hermes → Paperclip → CrewAI), each time by copying the folder and swapping those two files. Copying it a fourth time (→ Multica) and swapping them **built successfully and looked correct** — 8 documents, the right branding in the header, all 8 pages generated.

**What was actually wrong.** A grep of the NEW tree for the OLD name found **three classes of hardcoded branding the `BRAND` object did not cover**:

1. **Four literal `"CrewAI"` strings inside `generate-reader.js`** (the header title, the extract-pin label, the page `<title>`, and the standalone-page subtitle) — written as literals, not read from `BRAND`, so the config swap could not reach them.
2. **`window.CrewAIReader` inside `assets/reader.js`** — used by the gallery card's `onclick`. The generator *does* emit `window.${BRAND.globalName}` (correctly renamed to `window.MulticaReader`), so the two halves disagreed: **every gallery card would have called a global that no longer exists — a broken modal**, invisible to the build (which only checks that files were written, not that the HTML's handlers resolve).
3. **A hardcoded `crewai_reader_` localStorage prefix** in `assets/reader.js` (font size, theme, font, width). `BRAND.storagePrefix` existed and said `multica_reader_` — but was never read. The real consequence is a **cross-study collision**: two readers open in one browser would share the same keys, so changing the theme in one would silently change it in the other.

**How it was caught.** Not by the build — the build was green. By asking the engine's own claim to prove itself: *if only two files change, then no other file may contain the old name.* Grepping the new tree for the old name is the test the claim implies, and it failed on three files.

**The rules.** (1) **A configuration seam is only a seam if every branded string reads from it.** A literal that duplicates a config value is not "covered" — it is a second source of truth that drifts silently. (2) **After any copy-and-rebrand, grep the NEW tree for the OLD name and require ZERO hits** (excluding deliberate cross-references). This is a one-line check and it is the whole verification. (3) **A green build is not evidence of a correct rebrand** — the build proves the files were written, not that the generated HTML's references resolve or that storage keys are unique. (4) **A repeated claim ("only two files change") accrues false confidence with each successful reuse** — the fourth copy is exactly when to test it rather than trust it. (5) **A documented check can itself be wrong:** this reader's own stability check said to compare the generator's character total against `wc -c` (bytes); for UTF-8 content those differ by a constant overhead (here 1,243 bytes over 177,688 characters), so a correct build would read as a mismatch. The guide now says *characters*, and names the trap.

---

## L169 — a **re-pin is ONE change, not two**: renaming the old snapshot aside and extracting a new one under the standard name is a pin change **the moment the folder moves** — if the recorded digest is not updated in the same change the digest-verifying worker **crash-loops**, and an extract that lands **one level too deep** cannot import, so the **layout** must be measured, not assumed

**What happened (2026-10-15/16, the Hermes pin).** The owner did exactly what the pin's own rule asks — *"renamed older version of hermes and extracted a new version with the same standard name."* Two things then went wrong, both invisible until measured:

1. **The recorded digest went stale at the instant of the rename.** `hermes-agent-main/` was replaced (2026-10-15 11:45), but `library/.hermes_pin.py`'s `EXPECTED_DIGEST` still named the **previous** snapshot (`ca760e97…`, 18,248 files). The worker verifies the pin at boot and **refuses to start**, so `mercato-hermes-gateway` entered a **crash loop**: `docker inspect` → **RestartCount=1834**, logs repeating *"PIN BROKEN — expected ca760e97… actual 84fb84bf… files 19728."* A container that "won't start" was not a bug in the new source; it was the pin guard **working**, against a record nobody had updated.
2. **The extract landed one level too deep.** The zip's root entry is `hermes-agent-main/`, and it was extracted *inside* a directory of the same name → `hermes-agent-main/hermes-agent-main/…`. The worker's `entrypoint.py` sets `PYTHONPATH=/hermes-src` and execs `python3 /opt/hermes/ws_entry.py`, which does `from tui_gateway import entry` — that import **fails** when the package sits one level down. Measured both ways in a one-off container: nested → `ModuleNotFoundError: No module named 'tui_gateway'`; flattened → `IMPORT OK`.

**Why it matters.** Both failures look like *"the new version is broken"* and both are actually **the harness telling the truth**: the digest guard caught an unreconciled pin, and the import error caught a layout that could never have run. A session that "fixed" either by disabling the guard (`HERMES_SKIP_PIN_VERIFY=1`) or by editing `PYTHONPATH` would have shipped a worker running **unverified code at the wrong depth**. The crash loop is also easy to misread: the first instinct — an out-of-memory kill (exit 137 on `docker exec`) — was **wrong**; the 137 was simply the absence of a live process in a container that kept restarting.

**The rules.** (1) **A re-pin is one change.** The moment a snapshot folder is renamed or replaced, the recorded **digest, revision and file count** move with it — in the same change — or the next boot fails. A pin whose *target* changed but whose *record* did not is **worse than no pin**: it fails loudly at best, and at worst guards the wrong tree. (2) **Measure the layout, don't assume it.** An archive's root may or may not include a top-level folder; extract, then **prove the import** (or the equivalent entry-point check) *before* taking the digest — the digest of a tree that cannot run is a digest of the wrong tree. (3) **A crash loop is a message, not a mystery** — read the log's first repeated line and `RestartCount` before theorising about resources. (4) **When the previous pin is renamed aside, add it to `.gitignore` too** — the rename created `hermes-agent-main-newer/`, an 18,248-file tree that `git check-ignore` reported **NOT IGNORED** and `git status` showed as untracked, one wildcard add away from being committed.

*Cross-ref: L136 (the sister lesson — two copies of one thing is a defect, and when a THIRD arrives the pin must re-measure); L135 (a snapshot with no `.git` still has provenance); rule 13 (re-measure, then commit the fix *by name* — the re-pin, the flatten and the `.gitignore` line all landed together); rule 4 (two-route verification — the new digest was confirmed by the harness, an independent `os.scandir` walk, and the worker's own `verify_pin.py`); `HERMES-PIN.md` §1.1.2.*

## L170 — a documented FLAG is not a SET flag: the deployment may omit it and the binary's default (here `-1 = auto`) applies — measure the RUNNING process, never the design doc's stated value (2026-10-16, the llama-server capacity measurement)

`library/ai/PAPERCLIP_HERMES_LLAMA_SERVER_SSOT.md` states the production baseline as `--parallel 1` ("Parallel slots: 1"), with a rationale — *"keeps the full 65,536-token budget available to the one active generation and avoids multiplying context/KV pressure on an 8-vCPU host."* The **running** container `mercato-model-local` passes **no** `--parallel` / `--slots` / `LLAMA_ARG_N_PARALLEL` at all (its whole environment is `PATH` + `LLAMA_ARG_HOST`; the compose `command:` omits the flag). This llama.cpp build (`version: 0.5.0-dev`, build 11371, commit `99b95488c`) documents the flag as `-np, --parallel N (default: -1, -1 = auto)`, and **auto selected 4**. Measured two ways, agreeing: the server's own startup log (`srv load_model: initializing, n_slots = 4, n_ctx_slot = 65536, kv_unified = 'true'`) and the live `/props` endpoint (`"total_slots": 4`).

**Why it matters.** Any capacity reasoning built on "one slot" is wrong — four slots exist. Because the KV cache is **unified** they share one 65,536-token buffer (the budget is *not* multiplied, so the doc's memory worry is milder than stated), but they **compete for the same CPUs**, so two simultaneous long turns each run at roughly half the single-turn rate. The same trap repeats one line up: the compose's `-tb 8` and its benchmark comment (comparing "8/8" and "4/8") assume 8 visible CPUs, while the container sees only **4** (`nproc` = 4; `docker info` `NCPU` = 4) — so the recorded benchmark figures do not describe the running configuration either.

**The rules.** (1) **A documented flag value is a claim about intent, not evidence the flag is set** — read the running process's actual arguments (`docker inspect … .Config.Cmd`) and the state the process itself reports, not the design doc. (2) **When a binary's flag default is `auto`, the effective value is a property of the host** — measure it, never infer it from the flag's absence. (3) **A capacity number derived from a stated config must be re-derived from the measured config** — "8 vCPU" in a comment is a claim a container's `nproc` can falsify. (4) **Two routes to the same number is the standard** (rule 4) — here the startup log and the status endpoint agreed at 4.

*Cross-ref: rule 13 (re-measure, then commit the fix by name); L169 (measure, don't assume); `PAPERCLIP_HERMES_LLAMA_SERVER_SSOT.md` §`--parallel 1`; `JOURNAL.md` 2026-10-16.*

## L171 — a service's CONTROL endpoints are not under its API BASE PATH: probing `…/v1/props` 404s, and a warm-up that reads that as "not ready" reports a healthy service as DOWN and silently never does its job (2026-10-16, the prompt-cache warm-up)

The worker's provider configuration is `OPENAI_BASE_URL=http://model:8080/v1`, and the chat call goes *under* it (`/v1/chat/completions`). The warm-up's liveness probe therefore built `http://model:8080/v1/props` — and got a 404, because **llama.cpp's control endpoints (`/props`, `/slots`, `/health`, `/metrics`) live at the server ROOT**, alongside the OpenAI-compatible surface rather than inside it. The probe's `except Exception: return None` swallowed the 404, the caller logged `SKIP — the model server is not answering at http://model:8080/v1 yet`, and the service settled into a loop that would have retried every 30 s forever.

**Why it matters.** The failure mode is the dangerous kind: **the model was up and healthy the whole time.** Nothing crashed, nothing alerted, and the log line read like a transient startup race — an operator watching a green, running container would conclude the warm-up "just hasn't had a chance yet". A component whose *entire purpose* is to prevent a 38-minute wait would have prevented nothing, while looking correct. Only running it against the live stack exposed it; the code review and the compose validation (`config --quiet`) both passed.

**The rules.** (1) **Derive a control endpoint's path from the ROOT, not from the API base** — if the base may carry a suffix (`/v1`, `/api`, `/openai`), strip it before appending `/props`-style paths. (2) **A blanket `except Exception: return None` around a probe destroys the diagnosis** — it collapses "connection refused", "404" and "bad JSON" into one indistinguishable silence. Log the failure's *kind* even when the caller only needs a boolean; "not ready" and "wrong URL" must never look the same. (3) **Prove a background service's FIRST cycle against the live dependency** — a service that starts cleanly and loops forever is not evidence that its condition was ever met. (4) **"Green and running" is not "working"**: a self-healing loop that never fires its action is indistinguishable from a healthy one until you read what it *did*, not what it *is*.

*Cross-ref: L170 (measure the running process); rule 4 (two-route verification); `docker/hermes/warmup.py::root_of`; `JOURNAL.md` 2026-10-16.*

## L172 — when the exact bytes you must reproduce are ALREADY PERSISTED somewhere, replay them instead of reconstructing them — a derived copy is a second source of truth that drifts, and the drift is invisible until the cache silently stops matching (2026-10-16, the prompt-cache warm-up)

The warm-up had to send the model server the *same* 16,572-token prefix a real chat turn sends, or the prompt cache would not match and it would warm nothing. The obvious implementation is to rebuild that prefix — call `build_system_prompt()`, gather the tool definitions, render them. **That implementation is a defect waiting to happen:** it would have to track the three prompt tiers, the cwd-dependent context files, the per-day date line, the tool ordering *and* the JSON field ordering (Qwen requires byte-identical tool definitions for a cache hit), and it would silently stop matching the day any of that changed — with no error, just a cache that quietly missed.

The worker's own `state.db` already stores **both halves verbatim**: `sessions.system_prompt_hash` → the system text (26,549 chars), `sessions.tool_names` → the tools array in literal OpenAI wire JSON (42,619 chars). Reading those two rows and posting them back made fidelity a **structural property rather than a maintenance obligation** — and the measurement confirmed it: **16,559 of 16,560 tokens reused**, i.e. the replay matched the real prefix to within one token (which llama.cpp re-evaluates anyway, to get logits).

**Why it matters.** A reconstructing warm-up would have passed every review, worked on the day it was written, and then degraded into a no-op on the first prompt change — the worst possible failure shape, because the *symptom* (a slow first turn) is identical to the problem it was built to fix, so nobody would look at the warm-up. Replay removed the failure mode entirely: there is nothing to keep in sync because nothing is derived.

**The rules.** (1) **Before writing code that reproduces a value, search for where that value is already stored.** A content-addressed store, a state DB, a recorded request or a cached artefact is a better source than a reimplementation of the logic that produced it. (2) **Prefer the mechanism the real consumer uses** — posting to the same endpoint (`/v1/chat/completions`) rather than a lower-level one, so the server applies the identical template instead of a rendering you had to guess at. (3) **"Nothing to keep in sync" is the design goal**: if the fix requires maintaining parity with a system that can change independently, it is a second source of truth, and it will drift. (4) **Measure fidelity, don't assert it** — the cache-hit count (`16,559/16,560`) is what turned "this should be the same" into "this IS the same".

*Cross-ref: L171 (the same component's other defect); L170; rule 13; `docker/hermes/warmup.py::read_shared_prefix`; `JOURNAL.md` 2026-10-16.*

## L173 — a sample taken under the OLD condition is NOT a baseline for the NEW one: timestamp every measurement and prove which run it belongs to before you subtract (2026-10-16, the CPU-ceiling measurement)

The `.wslconfig` CPU ceiling was raised `4 → 8` and the WSL VM restarted to apply it. Measuring the effect, I read a prefill rate of **7.81 tok/s** and compared it to the historical **7.32 tok/s**, concluded the change was worth ~7 %, and reported that the optimisation "barely helps" — recommending the owner discount it. **The conclusion was wrong, and the error was entirely in the comparison:** the 7.81 sample had been taken *before* the VM restart, so **both numbers were 4-CPU measurements**. I had subtracted two readings of the *same* condition and called the difference the *effect* of a change that had not yet been sampled at all.

The correct comparison, once the logs were separated by which server process produced them, was **7.81 tok/s (4 CPUs) vs 12.18 tok/s (8 CPUs) — +56 %**, which is the benchmark's ~+46 % actually transferring. **[Addendum, same day, second pass — see L174: that +56 % is a SEGMENT rate at the 2,048-token progress point, not the fill's rate. The whole 16,560-token cold fill measured 7.32 → 8.07 tok/s, i.e. +10 %. The lesson below still stands; only its headline number was a segment, and it is corrected here by name.]** The evidence for the right answer was *already in the wrong sample*: the line read `t = 262.12 s` for the same 2,048-token progress point that the new run completed in `t = 168.08 s`. The baseline was sitting inside the number I mislabelled.

**Why it matters.** A stale baseline does not fail loudly. It produces a *plausible, specific, wrong* number — and here it produced a wrong *recommendation* that would have had the owner discard a change that genuinely halves a 38-minute wait. It also survived the obvious checks: the sample was real, the arithmetic was right, and the qualitative reasoning ("memory bandwidth could be the limit") was defensible. Only re-deriving *which run* each number came from exposed it. The same trap is why the model's `n_threads = 4` startup line looked like corroboration — that is the `-t 4` **generation** pool, while `-tb 8` is the **batch** pool, so the line was measuring a different thing than the one under test.

**The rules.** (1) **Label every measurement with the condition that produced it** — run id, start time, or config — *at the moment of capture*; a bare number is not evidence. (2) **Before subtracting, prove both numbers came from different conditions** — "before" and "after" must be established, not assumed from the order you happened to read them in. (3) **When a change's effect is being measured, re-measure BOTH sides under their own conditions** rather than reusing a historical figure, however recently it was taken. (4) **A metric that responds to the change is not the same as a metric that explains it** — `n_threads = 4` and `830 % CPU` described different pools; pick the one the change actually targets. (5) **A correction is only finished when the superseded claim is corrected BY NAME everywhere it was written** — the wrong figure here had already reached the owner in a reply and two memory files.

*Cross-ref: L170 (measure the running process); rule 13 (re-measure, then commit the fix by name); `JOURNAL.md` 2026-10-16; `.workbuddy-ai/memory/2026-10-16.md` entry (AD), corrected in place.*

## L174 — a rate measured over a SEGMENT of a job is not the job's rate: when throughput varies with how far in you are, an early sample flatters the change — compare WHOLE jobs (2026-10-16, the CPU-ceiling measurement, second pass)

The `.wslconfig` change was `4 → 8` CPUs, and its effect was reported as **+56 % on the cold prefill**, derived from the *same 2,048-token progress point* (262.12 s at 4 CPUs vs 168.08 s at 8). That comparison is internally sound — same point, two conditions — and it is **not the fill's rate**. When the whole 16,560-token cold fill was finally measured end-to-end it ran at **8.07 tok/s** on 8 CPUs, against the historical **7.32 tok/s** on 4: **+10 %, not +56 %.** Both numbers are correct; they answer different questions, and the one that was committed to the record was the flattering one.

**Why they differ, and why it is not noise.** The prefill rate is **length-dependent**. The same 4-CPU server ran **12.26 tok/s on a 1,148-token prompt** and **7.32 tok/s on a 16,572-token one** — a 1.7× spread with the *only* difference being length. Early batches are cheap (few keys to attend over); the tail is memory-bandwidth-bound. So a *fixed early progress point* samples the most favourable part of the curve, and it samples it for **both** conditions — which is exactly why it looks rigorous while overstating the effect. The 8-CPU run degrades over the fill more steeply (12.18 → 8.07 tok/s, −34 %) than the 4-CPU run does (7.81 → 7.32, −6 %), so more of the early advantage is given back by the end.

**Why it matters.** The whole-fill number is the one that describes what a human waits for: a first turn pays the *entire* prefill, not its first tenth. Reporting a segment rate as "the cold prefill improved 56 %" promises ~23 minutes when the measured wait is ~34. The error is the same species as L173 (a comparison that never established its terms) but subtler, because the terms *were* matched — they were matched on the wrong axis.

**The rules.** (1) **When a metric varies with progress through a job, compare WHOLE jobs.** (2) **If a segment must be used, label it a segment and never generalise it to the job** — write "at the 2,048-token point", not "on the cold prefill". (3) **Prove the length-dependence rather than assuming uniformity** — two points at different lengths settle it in one measurement. (4) **When a change is credited, credit it against the user-visible whole**, and keep any segment figure as supporting detail, never as the headline.

*Cross-ref: L173 (the stale baseline — the same measurement's first error); L170; rule 13; `.workbuddy-ai/memory/MEMORY.md` "LOCAL STACK"; `library/development/MASTER-CHECKLIST.md` `CC-89`; `hermes_prompt_cache_and_session_readiness_REPORT.md` §10.*

## L175 — a counter that reports the state a request STARTED in cannot also report the state it LEFT: a cold warm-up reports 0 cached and reads as if it did nothing (2026-10-16, the prompt-cache warm-up's first live cold fill)

The warm-up replayed a cold 16,560-token prefix, held the connection for **2,051 s**, and then logged its verdict: **`COLD -> prefilled (0 of 16560 tokens now cached)`**. Every part of that is true and the `0` is *correct* — `usage.prompt_tokens_details.cached_tokens` reports how much of the prompt was already cached **when the request began**, which for a cold fill is nothing. But the line reads as *failure*: "0 now cached" after 34 minutes of work looks like the job did nothing. The proof it worked came from the **next** request, which read `already WARM (16,559 of 16,560 tokens reused)` in **4.1 s**.

**The sibling gotcha, same trap, different endpoint.** Reading progress mid-fill from llama.cpp's `/slots`, `n_prompt_tokens` said **14,336** while `n_prompt_tokens_processed` said 12,288 — during processing that field is a *progress-derived* value, not the prompt's length. The request's true length (**16,560**) came from `usage.prompt_tokens` in the response. Two endpoints, one misunderstanding: a number that describes *where you are* is not a number that describes *what the job is*.

**Why it matters.** A self-reporting loop that is judged on its own counter will mislead in exactly the case it exists for. Here the misleading reading would have prompted a "fix" to working code, or a conclusion that the warm-up failed, when the fill had succeeded and the very next cycle confirmed it.

**The rules.** (1) **Establish what moment a counter describes** — entry, progress, or exit — before reading meaning into it. (2) **Verify a warm-up by the request AFTER it**, never by the one that did the filling. (3) **Write the log line so it states the moment** ("began cold; prefilled all N tokens; the next cycle should read them back"), so the number cannot be misread as an outcome. (4) **Do not read a progress field as a total** — take totals from the terminal record.

*Cross-ref: L172 (replay the persisted bytes); L171 (the control endpoints at the root); rule 13; `docker/hermes/warmup.py::warm_once`; `JOURNAL.md` 2026-10-16.*

## L176 — a process that must BOOT before it can answer needs a boot clock, not a conversation clock: a per-frame timeout reported a correctly-booting worker as broken (2026-10-16, the stdio handshake gate)

The handshake gate drives a real worker over stdio and waits for its frames. On its first run against the re-pinned image it failed five checks at once — `client.capabilities: no frame within 60s`, the same for `gateway.capabilities`, `ping` and `gateway.ready`, and `process.stop: an unexpected frame ({'id': 1, 'result': {...}})`. Read as written, that is a broken worker. It was not: the entrypoint digest-verifies **18,248 files** over a Docker Desktop bind mount and the worker imports **46 locked dependencies** before it emits anything, which measured **~3–4 minutes** — so every "missing" frame was simply *late*, and the "unexpected frame" was the **correct answer to request id 1**, arriving after the 60 s window had already been declared a failure.

**Why it matters.** The gate's own timeout was 60 s — a reasonable budget for a *conversation* frame (measured warm answers land in ~1 s) applied to a *boot* that legitimately takes minutes. The failure was therefore entirely an artefact of the instrument, and the dangerous reading ("the re-pin broke the worker") was the one it printed. A test that mis-times its own clock reports a healthy system as broken, and does it confidently.

**The rules.** (1) **Separate the boot budget from the conversation budget** — the gate now has `BOOT_TIMEOUT_S` (600 s) for the first frames and `FRAME_TIMEOUT_S` (60 s) after the handshake completes. (2) **A frame that arrives late is not a frame that is wrong** — an "unexpected frame" carrying the id you asked for is the *expected* frame, late; report lateness as lateness. (3) **When several independent checks fail simultaneously and identically, suspect the harness before the subject** — five timeouts at exactly one number is a clock, not five coincident defects. (4) **Give the instrument the timing the system actually has**, measured, not the timing it "should" have.

*Cross-ref: L171 (a swallowed failure read a healthy service as down — same family: the instrument, not the system); rule 13; `docker/hermes/handshake_gate.py`; `CC-86`.*

## L177 — a check placed on a surface that never runs on the target files is a DEAD check: measure where a linter actually runs before choosing it as a home (2026-10-16, the two-reads lint's stated home)

The plan (inherited from the platform study) placed the two-reads lint — *"a setting read twice in one scope must be read once"* — on `packages/eslint-plugin-ds`, the repo's existing ESLint plugin. That is a reasonable-looking home: the plugin exists, it has `rules/`, `tests/` and a `recommended` preset, and the plan's rule was *"no new plugin"*.

**Measured, it is the wrong home, and it would have been a dead rule.** The plugin is not a general lint surface — it is scoped to **backend UI files**: `eslint.ds.config.mjs` sets `files: ['packages/core/src/modules/**/backend/**/*.{ts,tsx}', 'packages/enterprise/src/modules/**/backend/**/*.{ts,tsx}', 'packages/ui/src/backend/**/*.{ts,tsx}']`, and `yarn lint:ds` targets exactly those directories. But settings are read in **server and config modules** — `process.env` appears **718 times** in `src` (`NODE_ENV` ×205, `BASE_URL` ×114, `QUEUE_STRATEGY` ×72). **The two sets do not intersect**, so the rule would have shipped green, forever, on files that never read a setting.

**Why it matters.** A lint rule that never fires is worse than no rule: it produces a **clean report that means nothing**, and the next person reads that report as coverage. The failure is silent and permanent, and it survives review because the rule *is* written, *is* registered, and *is* wired into a config file — every artefact says it works.

**The rules.** (1) **Before choosing where a check lives, measure the `files` globs it will run under** — a plugin's name and its README say what it is *for*, the config says what it *does*. (2) **A check's home must intersect its target population** — state the target, then prove the surface covers it. (3) **"No new plugin" is a constraint on the SOLUTION, never a reason to place a rule where it cannot fire** — a dead rule satisfies the letter of that constraint and defeats its purpose. (4) **A rule that is green on the first run is a prompt to ask whether it CAN fail**, not evidence that it works.

*Cross-ref: L174/L176 (measure, don't assume — the same family applied to placement rather than timing); rule 1 (code is the authority, not the doc); `eslint.ds.config.mjs`; `CC-91` / `SR-46`.*

## L178 — a lexical scanner must adopt the TOOL's own parsing rule, not a looser one: counting `@ts-expect-error` anywhere in a comment counts SENTENCES (2026-10-16, the escape-hatch census)

The escape-hatch census counts directive holes (`eslint-disable`, `@ts-expect-error`, …) and checks each for a reason. The first version asked only *"is the token inside a comment?"* — and on the real repo it reported **23** `@ts-expect-error` holes where the true number is **22**.

The extra one was `// TS2578 "Unused '@ts-expect-error' directive" and this suite would not` — a **sentence about** a directive, inside a comment, counted as a directive. The repo has a second such line (`` *      or \`props\`, and the \`@ts-expect-error\` directives prove it ``) which happened to be skipped only because a block-comment continuation line carries no `//` or `/*` of its own.

**Why it matters.** The fix is not a smarter heuristic — it is to **adopt the rule the tools themselves use**. ESLint ignores an `eslint-disable` that is not the comment's first content, and TypeScript ignores a `@ts-expect-error` that is not at the start of the comment. Requiring the token to **open** the comment is therefore not a stylistic tightening; it is *the same parse*, and it makes the scanner agree with the compiler by construction. A looser rule is not "more thorough" — it is measuring a different thing.

**The rules.** (1) **When scanning for a construct that another tool consumes, copy that tool's acceptance rule** — anything looser invents a class of finding the tool would never act on. (2) **A census is a claim about a population; an over-count is as wrong as an under-count**, and prose is the usual source. (3) **Fix the number by name when a scan changes it** (23 → 22 here), and pin the case with a test — this one has a regression test. (4) **Run the check on the real corpus before trusting its count** — this is the second slice in a row where doing so found a bug in the check itself (the first was `--json` purity in the one-truth checker).

*Cross-ref: L174 (measure the real thing, not a proxy); rule 1; rule 13; `scripts/check-escape-hatches.mjs`; `CC-91` / `SR-41`.*

## L179 — a control that asks the right question and DISCARDS the answer is a dead control too: "handled upstream" is a claim to verify, not a reason to skip (2026-10-17, `T-45`)

The command gate computes an authority decision for every gated command, and the decision carries a **record lock** ceiling: a locked record yields `A0`, a refusal. The gate then looked at the gate code and **acted on `A1`/`A2` only** — `HELD_GATES = new Set(['A1','A2'])` — so an `A0` fell through the *"the gate permits the act to run now"* branch and the write proceeded. A locked record was writable by anyone holding the capability.

**The discard was deliberate, and its stated reason was half true.** The gate's docblock said: *"`A0` is a refusal and `RbacService` has already made it at the route guard, before any of this runs."* That is **true for a capability refusal** — the route guard answers before the command bus runs, so the gate never sees one — and **false for a record lock**, because the route guard's `refusalFor` calls `decideFor(subject, feature, scope)` with **no record id**, and the command gate is the *only* production path that threads one. So the one `A0` the gate alone could see was exactly the one it had been told to ignore.

**Why it matters.** This is subtler than "nobody calls it" (`SR-47`'s class): here the control **is** wired, **does** run, and **does** compute the right answer — and the consumer throws the answer away on an assumption about a *different* code path. The assumption is invisible from either site alone: the gate looks correct in isolation ("the route guard handles refusals"), and the route guard looks correct in isolation ("the gate handles holds"). Only the pair, read together with the *input each one receives*, shows the hole. A test mocked the resolver entirely (QT-02) and stayed green, so the discard was invisible to the suite too.

**The rules.** (1) **When a consumer deliberately ignores one value of a set, the reason must name the producer that handles it — and that producer must actually receive the same input.** "Handled upstream" is a claim to verify in the code, not a licence to skip. (2) **A path that computes a decision and then discards it is a defect site**: if the answer can be wrong, act on it; if it cannot matter, do not compute it. (3) **An exclusion that is right for one producer and wrong for another is a split, not an exclusion** — the fix is to act on the value, and to correct the comment that justified ignoring it (rule 13). (4) **A guard's "by design" comment is a claim like any other** — this one had been copied into the docblock, a test name and the register, and every copy was false for the record-lock path.

*Cross-ref: L177/L178 (a check that cannot fire is not coverage — this is the same family one layer in: the check fires, the consumer ignores it); rule 1; rule 13; `packages/core/src/modules/auth/commands/interceptors.ts`; `CC-97` / `T-45`.*

## L180 — a review of a GATE must also review the FACTORY: "who can call this" and "who is allowed to exist" are different questions, and I answered only the first (2026-10-17, `CC-103`)

`CC-103` closed a real hole: the agent-binding gate returned `bound: true` for every principal that was not an `ai_worker`, so a `service` API key could run any agent with its full tool list. The fix made the gate admit only `human` and refuse the rest. I then ran a hostile critic over it, and the critic found two more holes — **a second dispatch route that could not be bound at all**, and an MCP path whose identity was hardcoded to `service`. Both were real, both were fixed. I called it done.

**It was not done, and the owner found the rest by asking me to explain the breaking change in plain words.** The question was: *"a service key can no longer run an agent — should I be happy with that?"* Answering it honestly required asking **who mints service keys**. The answer: **we do.** `CreateApiKeyInput` had **no `principalKind` field**, so `createApiKey` — the single function every caller uses — could only ever produce `principal_kind = null`, which resolves as `service`. And **both** MCP key creators use it (`api/ai/mcp-key/route.ts`, `lib/mcp-ensure-api-key.ts`). The breaking change would therefore have locked out **the product's own MCP setup**, on both paths, with an error (`agent_not_bound`) that points at the binding table instead of at the key.

**A fourth defect in the same five minutes:** `createApiKey`/`deleteApiKey` invalidated `invalidateUserCache(apiKeySubject(id))`. But the ACL cache is keyed by the **subject string**, and an AI-worker key's subject is `ai_worker:<id>` — so the invalidation **missed**, and a deleted key could keep resolving its old permissions until the cache TTL. Three places build that prefix; one was wrong; nothing compared them.

**Why the critic missed it, and why that is the transferable part.** The brief said *"trace every caller of `resolveAgentBinding`"* — so it walked the **consumers** of the gate exhaustively and never looked at the **producer** of the credential the gate inspects. Both files were correct in isolation: the gate decides correctly, and the factory creates exactly the kind of key it is asked for. **Nobody could ask for the right kind.** That is the same shape as `CC-118` (a gate whose allowlist file does not exist, so it can never pass): a control that is unreachable is indistinguishable, from the inside, from a control that works.

**The rules.**
1. **When a control decides "may X do Y", find who CREATES X.** If the creator cannot produce the kind the control requires, the control can never pass — and a reviewer who only walks callers will never see it. **Producers and consumers are two halves of one investigation.**
2. **A string that acts as an identity — a subject, a cache key, a prefix — must be derived in ONE place.** Every hand-built copy is a place to drift. Here three sites built `api_key:<id>`/`ai_worker:<id>` and one of them was wrong for half the inputs; a helper (`keySubjectFor`) makes the drift impossible rather than unlikely.
3. **"Done" means the whole chain was read: who creates it, who checks it, who consumes the answer, who deletes it.** The gate was read three times today (by me, by the critic, by the register) and the factory was read zero times.
4. **Explaining a change in plain words is a REVIEW STEP, not a courtesy.** The owner's two-sentence question found two defects that a purpose-built hostile critic missed, because plain language forbids hiding behind a mechanism's name — *"a service key cannot run an agent"* immediately raises *"which keys are service keys, and who makes them?"* **Every closing report gets one paragraph written for a non-developer, and that paragraph is read back as a question.**
5. **A security review that stops at authorisation is incomplete.** Authorisation asks what an actor may do; **credential issuance asks what actors may exist.** Both are attack surface, and the second one is the one that decides whether the first can ever be satisfied.

*Cross-ref: L177/L178 (a check that cannot fire is not coverage), L179 (a control that discards its answer), `CC-118` (a gate whose allowlist does not exist), `CC-103` §9 of `PLAN-CC-103-binding-gate.md`; rule 1; rule 13; `packages/core/src/modules/api_keys/services/apiKeyService.ts`; `packages/ai-assistant/src/modules/ai_assistant/api/mcp-key/route.ts`.*

## L181 — a proof instrument that fails QUIETLY is worse than no instrument: it hands you a confident wrong answer (2026-10-17, `CC-102`)

I built a throwaway-PostgreSQL probe for the `CC-102` liveness migration and ran it. It found a real defect in my own writer, which is the reason it was worth running. Then I read its own output closely — and **two of the probe's own queries were broken**, one of them reporting the exact opposite of the truth while looking perfectly well-formed.

**The first failed loudly.** I selected `indispartial` from `pg_index`. No such column exists — it lives elsewhere — so the phase aborted with an error and nothing downstream ran. Easy to spot.

**The second failed silently, and that is the lesson.** I wrote a query to report each index key's sort direction:

```sql
case when i.indoption[array_position(i.indkey, a.attnum) - 1] & 1 = 1 then 'DESC' else 'ASC' end
```

It printed a tidy two-row table: `tenant_id ASC`, `last_seen_at ASC`. The index is declared `("tenant_id", "last_seen_at" desc)`, so half of that was wrong — and it was wrong in the direction that *looks* fine, because ASC is the default and nothing flags it. The cause: **`array_position` returns NULL for `int2vector`.** NULL flows through the subscript, NULL passes through `& 1`, the comparison is not true, and the `CASE` falls to its `ELSE`. No error, no warning, no NULL in the result — just `ASC`, twice. The raw value was `indoption = 0 3` → `tenant_id ASC`, `last_seen_at DESC NULLS FIRST`, i.e. the truth, sitting in a column I had not read because I had not needed to.

**The rules.**
1. **A derived value hides its own failure; a raw value does not.** When a query computes something, print the raw inputs beside it at least once. Here one extra column (`indoption`, as text) would have made the contradiction visible immediately. A `CASE` with an `ELSE` is a place where NULL becomes a confident default — treat every `ELSE` in a proof query as an unexamined branch.
2. **If a proof query reports the default for everything, suspect the query before you believe the result.** All-ASC, all-zero, all-pass, all-empty: a uniform answer across rows that should differ is the signature of an expression that never evaluated.
3. **Prefer the catalog's own rendering to a reconstruction of it.** `pg_indexes.indexdef` emitted the index definition verbatim; it was right the whole time and I nearly did not consult it because my derived query had already "answered". **When the source can state the fact, do not re-derive it.**
4. **A proof is a claim about an instrument too.** "The probe proved it" is only as good as "the probe was sound", and the second sentence needs its own evidence — here, a phase that aborted on a missing column and a second that silently inverted a direction. Both are recorded in the plan (§7.2) so nobody mistakes a green run for a validated instrument.
5. **Run the expensive proof anyway.** Every one of these instrument defects was found *because* the probe was run against a real database, which is also where the `created_at`/`updated_at` defect surfaced — the one all 24 tests had walked past for having no database at all. The lesson is not "distrust proofs"; it is **"read the proof's own output line by line, and treat a tidy table as a claim rather than evidence."**
6. **An inherited number is a claim with no author in the room.** The increment-2 record said "77/77 across the five affected suites"; re-measured from a worktree at that commit it is **93/93**, and no natural five-suite subset of this work sums to 77. A mutation count beside it ("2 fail") was also wrong — one test fails, asserting both forms, and Jest stops at the first. **Before a figure enters a delivery, re-measure it from the artefact.** `git worktree add <sha>` is cheap, and it is the only thing that turns "the last agent said 77" into "93, verified".

*Cross-ref: L180 (the critic walked consumers and never the factory — a second way to be confidently wrong about a fix), L179, the `CC-103` discharge-record error ("no database available" when one was), rule 13, `PLAN-CC-102-runtime-registry.md` §7.2 and §7.2b; `packages/ai-assistant/src/modules/ai_assistant/migrations/__probes__/ai_agent_runtime_liveness.probe.sql`.*

## L182 — when a row's HARVEST and its REFUSED list interact, the harvest is conditional on the refusal — and "as the donor does" can describe something the donor does not do (2026-10-17, `CC-107`)

The `CC-107` row told me to mirror Zulip's membership key: *"HARVEST: TWO PARTIAL UNIQUE INDEXES, NOT ONE
… mirror streams.py:410-418: unique (tenant, conv, user_id) where user_id is not null PLUS unique (tenant,
conv, agent_id) where agent_id is not null."* I ran the mandatory donor re-read before writing any code.
**At those lines there is no such thing.** `streams.py:411` is
`unique_together = ("user_profile", "recipient")` — ONE plain unique over TWO NON-NULLABLE FKs — and the
partial index at :414-418 is **not unique**. A search across `zerver/models/*.py` finds partial unique
constraints only for soft-delete exclusions, never for a nullable human/agent discriminator.

**Why the row was wrong, and why that is the part that generalises.** Zulip needs no two-index trick
because a Zulip bot **is** a `UserProfile` row with `is_bot = BooleanField(...)` (`users.py:556`) — it
joins a conversation through the *same* `Subscription.user_profile` FK a human uses, under the *same*
key, with the *same* non-nullability. The donor refuses the split; our own REFUSED list refuses the same
thing (*"making agents rows in the auth User table"*). **So the harvest was describing the solution to a
problem the donor does not have, and attributing it to the donor.** It is a correct design for our schema
— Postgres really does treat NULLs as distinct — but it is **ours**, and the register had it backwards.

**The rules.**
1. **Read the donor's source at the cited line, every time, even when the line number looks precise.** The citation being *specific* is what makes it trusted, and a precise wrong citation is more dangerous than a vague one — this one had a file and a range.
2. **When a row says HARVEST X and REFUSED Y, ask whether Y is what makes X necessary.** If the donor's design has no X, the honest reading is usually *"the donor solved this by accepting Y"* — and refusing Y means **you own the consequence**, including the schema that follows from it.
3. **A design can be right and its provenance wrong, and the two need separate sentences.** Justify the two partial unique indexes on Postgres NULL semantics; do not justify them on the donor. A borrowed justification for your own design cannot be checked by re-reading the donor.
4. **The third harvest in the same row was conditional in the same way**: *"exempt agents from idle-pruning (`subscription_info.py:654`: `(is_bot OR NOT long_term_idle)`)"* — that predicate reads `is_bot` **off the joined userprofile row**, which only works because a bot is a user. Harvest the **rule** (a participant that is not a person is not subject to human idle-pruning), not the SQL, and say which table it now reads from.
5. **Correct the row in the same edit you discover the error in, by name.** A register that carries a mis-attributed design is worse than one that carries none, because the next agent will trust the citation and skip the re-read.

*Cross-ref: L181 (two wrong figures inherited from a record, found by re-measuring — the same lesson on the *measurement* side), `00-PIN-AND-METHOD.md` §4.1 (the donor re-read rule) and §4.2 (the chain rule, which then found the live `22P02` defect in `CC-107`), `PLAN-CC-107-bot-participant.md` §1; `zerver/models/streams.py`, `zerver/models/users.py`, `zerver/lib/subscription_info.py`.*

---

## L21 — A proof that names the wrong suite proves nothing — and `[key]` is how it happens

**What happened.** The `CC-126` mutation proof ran 18 deliberate defects against
10 suites and reported 16 PROVEN, 2 NOT PROVEN. Both survivors targeted the same
file — `api/ai/agent-types/[key]/route.ts`. The harness had that path in its
suite list verbatim, character for character.

**The compounding error.** **Jest reads a positional argument as a regular
expression, not a path.** `[key]` in a regex is a character class matching one
of `k`, `e`, `y` — so the pattern `.../agent-types/[key]/__tests__/...` does not
match the real path `.../agent-types/[key]/__tests__/...` (five literal
characters). Jest matched nothing, exited 0, and the harness faithfully recorded
"the suite still passed with the bug present." Re-running the one suite by hand
showed the test red in three seconds — the test had teeth the whole time.

**And then the guard written for it had the same disease.** The harness now
asserts the denominator before calling anything proven — and its first version
matched `Test Suites: (\d+) passed, (\d+) total`, which is the **all-green**
summary format. A run with a failure prints `Test Suites: 1 failed, 9 passed, 10
total`, so the guard matched nothing on exactly the runs it was written to read
and reported NO SUITE COUNT nineteen times. A pattern written to notice a
*different* format than the one the tool emits fails silently in the same way:
it reads a true statement about nothing.

**Why this is L15 again, and why it is worth its own entry.** L15's runner stops
early; this one runs to completion and reports a complete-looking result. A
mutation proof's entire value is *"the suite noticed"* — and a suite that never
executed has not noticed anything. The harness reported two **real gaps** where
there were none, which is worse than a false green: it sends the next agent to
write tests that already exist, and it makes a harness with a typo look like a
codebase with holes.

**What to do instead.**

1. **Escape the brackets: `agent-types/\[key\]/__tests__/...`.** Any dynamic
   path segment Next.js writes as `[param]` is a regex metacharacter.
2. **Assert the denominator before trusting a ratio.** A proof over N suites
   must print the number of suites jest actually ran and compare it to the
   length of the list it was given. **A proof that cannot state how many suites
   it executed has not proved anything.** And write the guard's pattern against
   the format the tool emits *on failure* — the total is the last number on the
   line (`… 1 failed, 9 passed, 10 total`), not the one after "passed". A guard
   that only reads the green format is a guard that only works when nothing is
   wrong.
3. **A run that finishes suspiciously fast is evidence.** Eighteen mutations in
   eight seconds meant the suites were not running. Duration is a cheap sanity
   check on any repeated-run harness.
4. **Re-prove a survivor by hand before believing it.** One targeted run
   separated a broken harness from a missing test in under a minute — cheaper
   than writing two tests that already existed.

**The general form:** *a tool that selects by pattern can silently select
nothing.* grep with a bad regex prints an error; a test runner with a bad
pattern prints a green summary. The failure mode of the selector is the same
either way — the evidence belongs to a different run than the one you wanted.

---

## L22 — Python's text-mode write turns the whole repo CRLF, and `git` hides it

**What happened.** Three documents and the mutation harness ended up with CRLF line
endings while every other file in both repos is pure LF. The cause was not the editor
and not `git`: it was **`open(path, 'w')` in a Python patch script**. On Windows,
text mode translates every `\n` it writes into `\r\n` — so a one-line surgical patch
silently rewrote the line endings of the *entire file*.

**Why it stayed invisible.** `core.autocrlf=true` makes `git` normalize CRLF→LF on
commit, so `git diff` showed a tidy 57-line change and the committed blob was correct.
The damage was only in the working copy — which is exactly where the next tool reads.
`grep -q $'\r'` in a shell loop reported "LF-only" on a file with 337 CR bytes; the
check that finally worked was Python counting `b'\r'` in binary mode. **A line-ending
check that goes through a shell string is not a line-ending check.**

**What to do instead.**

1. **Patch with `newline=''`.** `open(p, 'w', encoding='utf-8', newline='')` preserves
   the file's own `\n`. Or read binary, `replace(b'\r\n', b'\n')`, write binary.
2. **Verify with bytes, not with grep.** `b.count(b'\r') == 0` on the file object.
3. **`git`'s autocrlf warning is evidence, not noise.** "CRLF will be replaced by LF"
   means the working copy *is* CRLF right now. Every commit that prints it is a commit
   made on top of a dirty working copy.
4. **Check the whole touched set, not the file you were thinking about.** The one file
   that looked fine (written by the editor) sat next to four that did not.

**The general form:** a patch tool that rewrites more than the lines you targeted is
the same failure class as a test runner that selects nothing (L21) — the operation
succeeded, the artifact changed in a way nobody asked for, and the tool reported
success. Surgical edits need surgical writers.

## L23 — A mock that ignores its arguments cannot prove the filter it was handed

**What happened.** `CC-127`'s mutation proof broke the preview on purpose — dropping the
`session_user_id` clause so the query would see only keys minted by the departing person — and
the suite stayed green. Same for the delegation `$or`, and same for the repository's
organization filter. Three mutations the tests should have caught, all survived.

**The tests were the defect, not the code.** The unit suite's fake `EntityManager` returned
**every row it was constructed with**, regardless of the `where` it was passed. So a query could
lose a clause and still receive the right rows: the *behaviour* under test was the mock's
constant, not the module's query. And one fixture hid it twice over — the "session" key was also
`createdBy` the same person, so even an honest filter would have kept it after the clause was
dropped.

**What to do instead.**

1. **A fake that takes a filter must apply it.** Even a ten-line matcher (`tenantId`,
   `deletedAt`, `$or`) is enough; what matters is that removing a clause removes rows.
2. **Fixtures must make each clause load-bearing.** If a row satisfies two conditions, neither
   condition is under test. The session key had to be minted by *somebody else*.
3. **Read a `PARTIAL` result as a test bug first.** "The suite failed, but not the case it should"
   means something else noticed — usually an assertion on the query's *shape*, which is a weaker
   proof than the behaviour the mutation aimed at.

**The general form:** a test double is part of the proof. One that answers without reading the
question turns every mutation of the question into a pass, and the mutation harness is the only
thing that will tell you.

## L24 — A status the checker cannot read is a row the register does not count

**What happened.** `CC-126` was closed a day before `CC-127`, and its §5 status cell read
`☑ done` — the glyph the **open-work** section uses. The register checker's state rule reads the
word after `✅`/`☐`, so the row counted as *neither* closed nor open: the totals read `67 closed ·
62 open · 130 total` while 68 rows were actually closed, and every subsequent tally inherited the
error.

**Why it stayed invisible.** The two mistakes cancelled. A closed row that is not counted as closed
also does not trip the "§4 still lists closed rows" check — so the checker stayed green, and the
number was wrong in a way no assertion covered. A total that adds up is not a total that is right.

**What to do instead.**

1. **One glyph per state, and the checker's glyph.** A closed register row is `✅ closed`; `☑` is
   the open-work section's marker for "this row is finished but still being described here".
2. **A closed row leaves §4.** §4 is the open-work list; keeping a finished row there is what
   forced the wrong glyph in the first place. Its record belongs in §5 and LAST DONE.
3. **When a count changes, re-derive it — do not adjust it.** The register's own history says it
   plainly: *a typed count drifts, a counted one cannot.*

**The general form:** a status vocabulary is a control surface. If the checker cannot parse the
word you wrote, you have not closed the row — you have written a sentence that looks like closure
to a human and is invisible to the machine that counts.

## L183 — The 14-year-old test governs every explanation, not only questions

**What happened.** `CC-123`'s requirement was written and the report ended with *"Two things worth
your attention"* — followed by *"the invoker half splits into holding and gating"*, *"`di.ts:59` has
a cycle"*, *"36 of the 157 have no descriptor"*. Every one of those is a **true sentence about the
code** and not one of them is a sentence about **what changed for the product**. The owner's reply:
*"random cryptic words salad I have no clue what it means. check your working rules."*

**Why it happened, and it is not carelessness.** `WORKING-RULES.md`'s top note says the test applies
*"before asking anything"*. It was written after a **question** failed, so it was scoped to questions
— and a report is not a question. So the test was not applied to the one thing that is sent far more
often. **A rule written from one failure tends to cover only that failure's shape.**

**What to do instead.**

1. **Apply the test to every sentence that reports a change**, not only to sentences with a question
   mark. The question is *"could somebody who has never opened this codebase say what changed?"*
2. **The vocabulary list is not just project nouns — it is anything that names a mechanism.**
   Function names, file paths, gate labels (`A0`–`A5`), the words *descriptor*, *invoker*,
   *intersection*, *holding*, *gating*. If the sentence survives only because the reader knows the
   code, it is a log entry, not a report.
3. **Say what changed in the product's terms, then the example, then what it costs.** Not the
   reverse. *"A stand-in can't collect a parcel you couldn't collect yourself"* is the same fact as
   *"the invoker half splits into holding and gating"*, and only the first one can be checked by the
   person paying for the work.
4. **If it needs a diagram, it is unfinished thinking** — the note already says this about questions.
   It is equally true of an explanation.

**The general form:** a rule learned from a failed question will be written as a rule about
questions. **Scope it to the class of failure, not the instance** — the owner reads reports every
turn and questions rarely, so the narrow reading protects the wrong thing.

## L184 — A correction that lands in a close note is not a correction until it reaches the ROW

**What happened, closing `CC-123`.** `CC-19` has said for a day that
`packages/shared`'s `dynamicLoader.tsconfig.test.ts` fails *"under the full suite (`EBUSY`)"* — a
concurrency story, and a plausible one. It is false. The suite clears its own 59-file cache directory
and this machine's delete-guard refuses any bulk delete above 50, so the suite fails to **run**.
Measured in four steps: alone it passes **8/8**; in the full suite it fails; with the sandbox off it
still fails; with the guard off the suite is **210/210, 2,594 tests green**.

**The part worth keeping.** That cause was **already written down correctly** — in §2 of the same
file, in `CC-124`'s close note: *"one shared suite fails only in its `afterAll`, where this sandbox's
delete guard blocks removal of the suite's own temp cache."* So the register held **both** the right
answer and the wrong one, in two places, for a day, and the wrong one sat in the row a debugger would
open first.

**Why it happens.** A close note is written to record **what I just did**; a row is read to find out
**what is true**. They are different audiences, and nothing forces one to update the other. The same
shape as `CC-101` (*a checker is not a control until something calls it*) and `L179` (*a control that
discards its answer*) — a fact with no path to the place it is needed.

**What to do instead.**

1. **When a measurement contradicts an existing row, the fix is in the row, by name** — not in a
   paragraph somewhere else in the same file. `Rule 13` already says the number gets committed; add
   **where**.
2. **Before closing anything, grep the register for the claim you just re-measured.** The old claim
   will be sitting in a row, phrased more confidently than your new measurement, because it was
   written when it was true.
3. **A "classification survives, mechanism does not" correction is still a correction.** It is
   tempting to leave it: the row still says *environmental, not a code defect*, which is right. But a
   wrong mechanism sends the next reader to the wrong place, which costs more than a wrong label.

**The general form:** *a fact is not corrected where it was discovered; it is corrected where it is
believed.*


## L185 — a default is not a default: `default: false` in an entity decorator does not make the property optional (2026-10-19, `CC-128`)

I added a column to the tenant table — `is_foundational boolean not null default false` — and declared it the way the neighbouring column is declared:

```ts
@Property({ name: 'is_active', type: 'boolean', default: true })   isActive: boolean = true
@Property({ name: 'is_foundational', type: 'boolean', default: false }) isFoundational: boolean = false
```

`tsc` then refused every existing `em.create(Tenant, { name, isActive, createdAt, updatedAt })` call with *"Property `isFoundational` is missing … but required"*. **The two declarations are identical in shape and opposite in effect**, because the falsy default is not inferred. `is_active` has been optional since the table was written; the new column was mandatory the moment it existed.

**The rules.**
1. **A decorator `default` is metadata for the database, not a statement about the TypeScript type.** Optionality is inferred from the presence of a default in some paths and not others — so when a property has a default, say so explicitly with `[OptionalProps]?: 'name'`. It costs one line and it cannot be inferred wrongly.
2. **`default: false` and `default: 0` are the cases to test**, because they are the ones a truthiness check anywhere in the chain will quietly discard. A default of `true` proves nothing about a default of `false`.
3. **When a shared entity gains a required property, the compiler is the census.** It found every call site in one pass — which is the argument for `tsc` being in the loop before a commit, not after.
4. **The column and the type must be changed together.** A migration that adds a column with a default, plus an entity that declares it required, is a deploy that compiles in the migration and fails at every write.

*Cross-ref: L37 (Awilix's silent `undefined` — the same family: a declaration that reads as one thing and behaves as another), `CC-128` §8 of `PLAN-CC-128-tenant-ceiling.md`; `packages/core/src/modules/directory/data/entities.ts`, `packages/core/src/modules/auth/data/entities.ts`.*

## L186

**A test that spells its own input tests a string, not the code that reads it.**

While closing `CC-125`, the test claiming to prove *"nothing in the service can turn the floor off"*
built its subjects by string concatenation — `` `${kind}:x` `` for `ai_worker` and `service`. The
`ai_worker` case worked. The `service` case went **red**, and the red was correct: `decideFor`
answered `allowed: true`, because **`service:` is not a subject prefix**. The platform's service
principal authenticates as `api_key:<id>`, and `parseSubject` — the *only* reader of the encoding —
decides the kind from the prefix. `'service:x'` has no known prefix, so the parser called it
**`human`**: the widest kind, past both the floor and the ceiling. The test was measuring a subject
the platform cannot produce.

**The rules.**
1. **Build test inputs through the same encoders production uses** — here `aiWorkerSubject(id)` /
   `apiKeySubject(id)` from `shared/lib/auth/principal.ts`. Then the input cannot drift from the
   encoding, and the test fails the day the encoding changes instead of silently testing a fiction.
2. **When a test goes red on a hand-built input, re-derive the input from the parser before touching
   the code under test.** The instinct was "the floor missed a case"; the truth was "the case does
   not exist". Fixing the code to match would have taught the platform a subject it does not have.
3. **The same lesson, from the green side:** the `system:` hole in the same file (`CC-136`) is a
   subject the platform *does* build in the wild and the parser answers as `human` — an input that
   exists with no handler, the mirror image of this one. Both directions come from assuming the
   spelling of a kind is the kind.

*Cross-ref: `CC-124` / `CC-129` (the encoding family — bare id in the column, kind in a sibling),
`CC-125`'s close record; `packages/shared/src/lib/auth/principal.ts:88-96`,
`packages/core/src/modules/auth/services/__tests__/authorityEnforcement.machineFloor.test.ts`.*

## L187

**`git checkout --` is not a restore while work is uncommitted — it is `git checkout --` of HEAD.**

While running the CC-125 mutation proofs, an intermediate restore used `git checkout --` on the one
**tracked** file that carried the change — `authorityEnforcementService.ts`, whose CC-125 wiring was
13 uncommitted lines. The command answered "what HEAD holds", wiped the wiring, and looked like
success; the damage surfaced only because a `sha256sum -c` against the pre-mutation checksum said
**FAILED**. The file was rebuilt from the captured diff and proven byte-identical by checksum, but
for minutes the safest copy of that work was my own scrollback.

**The rules.**
1. **Before any mutation, `sha256sum` every file it touches and keep the original beside it** — a
   `/tmp` copy, not a git command. Restore by copy, then verify with the checksum. That sequence is
   the only one that cannot answer the wrong question.
2. **Never `git checkout --`, `git restore`, or `git reset --hard` as a mutation restore while the
   change is uncommitted.** They restore HEAD, not the working tree's pre-mutation state; they are
   silent, and they are the one step in a proof that must never be irreversible.
3. **Commit the change under proof before mutating it** — then HEAD is the pre-mutation state and the
   restore is honest. That is also the cheapest fix: `CC-125` was uncommitted only because the proof
   was still running.

*Cross-ref: L23 family (a fake that behaves like the real thing until it doesn't), CC-125 §8 of
`PLAN-CC-125-machine-floor.md` (the near-loss and its recovery, recorded).*

## L188

**Narrowing a shortcut can silently REDUCE a legitimate answer — check what the shortcut was also supplying.**

`CC-134` scoped a cross-tenant permission check so that a superadmin of one customer was no longer a
superadmin of every customer. The fix was correct and the new tests were green. Then the **existing**
suite went red, and the red was right: a superadmin of a single tenant had been receiving *everything*
as a **side effect** of the bug. The shortcut did not only answer "is this person global" — it also
supplied the wildcard that spells "everything" in this codebase. Scoping the question therefore
**quietly demoted a tenant's own superadmin to whatever their row happened to list**, which is a
regression in the opposite direction and would have been discovered by a customer, not by a test.

**The rules.**
1. **Before narrowing a shortcut, list everything it returns**, not only the thing it decides. A buggy
   path that returns a *correct* value for the wrong reason is still the only source of that value.
2. **A privilege that is "everything" must be produced where the privilege is established**, not by the
   path that happens to run first. Here the wildcard belongs to the *position* (superadmin), not to the
   row's stored list — so it moved into the per-tenant read, where the position is read.
3. **A pre-existing test going red is evidence, not friction.** This one was the only thing that said
   the fix had reduced something; the seven new tests all passed.
4. **And a count is not a property.** A second failing assertion was `expect(em.find).toHaveBeenCalledTimes(1)`,
   a proxy for *"the per-user row won, so no role aggregation happened"*. The proxy also counted a
   lookup the fix made conditional. The property survived; the proxy did not. **Assert the thing the
   test means** — here, that no role ACL was ever read.

*Cross-ref: L175 (a counter that reports the start state cannot report the left state — same family:
the instrument measuring the wrong moment), `CC-134` §7 of `PLAN-CC-134-superadmin-tenant-scope.md`,
`rbacService.ts`'s per-tenant read.*

## L189

**An import from the wrong module is `undefined` at runtime — and the test that passes because of it is
the NEGATIVE one.**

`CC-135`'s new route test imported `Tenant` from `auth/data/entities`, which does not export it. Nothing
type-checked it (the suite runs with `isolatedModules`), so the symbol compiled to `undefined`, and the
fake `findOne` compared `entity === Tenant` — i.e. `=== undefined` — against the real class the code
under test passes. The comparison was never true, so **every tenant lookup answered "not found"**.

The result is the part worth remembering: **six tests failed and one passed.** The one that passed was
`answers 404 for a tenant id that does not exist` — a test whose whole content is *"the lookup finds
nothing"*. It had been handed a store where the lookup could never find anything, and it reported the
correct behaviour for a system with no tenants in it. Had the suite been written in the usual order
(negative cases first, green quickly, move on) the failure would have been invisible until a customer
asked why their ceiling route 404s.

**The rules.**
1. **Import the class from the module the code under test imports it from.** A re-export is a promise
   nobody checks; if the module you reach for does not export it, you get `undefined`, not a compile
   error, and `===` against `undefined` is silently false forever.
2. **A green refusal test is the weakest witness in the suite.** It is satisfied by a fixture that can
   only refuse. When the success cases go red and the refusal case stays green, suspect the fixture
   before the code — a broken store looks exactly like a correct refusal.
3. **Say in the test why the import is where it is.** The fix here is one line plus a comment; without
   the comment the next editor "tidies" it back.

*Cross-ref: L23 (a fake that ignores its arguments cannot prove a filter — the same family: the fixture,
not the code, decides what the test can see), the standing hazard **"a row's prescribed FIX can be
wrong — re-measure it first"** (here the row named **one** gate where the act needed **two**:
`CC-135` §3.2), `api/__tests__/capability-ceiling.route.test.ts`.*

## L190

**Two functions can produce one fact, and teaching only the one a row names leaves the other reporting
the old answer.**

`CC-136`'s row said a platform act was being judged as a person because the *parser* did not recognise
the `system:` word. True — and half. The other half is the step that turns a login into a principal: it
does not call the parser and use its answer. It **re-derives** the kind from two yes/no facts
(`isService`, `isAiWorker`) and its final `? :` chain ends in `'human'`. So a `system` subject fell
through to *person* there too, in a function the row never mentioned.

**Why that matters more than the missing branch:** the parser is read by the gates; the derivation is
read by everything else — the journal, the preferences read, the helper that answers *whose personal
settings are these*. Fixing only the parser would have turned the gates green while the rest of the
platform still believed a platform act was a person, and the test that would have caught it is not the
one the row asked for. The mutation that removes **only** the derivation arm turns exactly two tests red
and leaves the parser tests green — which is the proof that the two halves are separately observable,
and therefore that both need a test.

**The rules.**
1. **Before fixing "the reader", find every place that answers the same question.** A fact produced in
   two functions is two defects with one symptom. The row names the one that was measured; the other is
   found by asking *who else decides this?*
2. **A re-derivation is not a call.** `x = f(y)` and `x = y === 'a' ? 'a' : y === 'b' ? 'b' : 'c'` look
   equivalent until a fourth value exists — then the second silently answers `'c'`. Where a fall-through
   default is *the dangerous value* (here: the one kind the floor does not bind), the default is a
   defect waiting for its first new case.
3. **A row that says "past both gates" must name what each gate reads.** This row said *past the floor
   and the ceiling*; the ceiling is resolved **by tenant**, so it never looked at the kind at all, and
   the defect was a floor hole and only a floor hole. The overstatement cost nothing here, but the next
   reader would have gone looking for a ceiling bypass that does not exist. **Measure each half of a
   claim separately** — the half that is wrong is usually the one nobody re-measured.

*Cross-ref: L189 (the fixture decides what a test can see — same family: the instrument, not the code),
L23, the standing hazard **"a row's prescribed FIX can be wrong — re-measure it first"** (here the row's
FIX was *a parser edit*, and it was half an edit), `PLAN-CC-136-system-subject.md` §2.2, M2 in its §8.*

## L191

**A check that exempts the most powerful actor protects everyone except the one who can do the most harm.**

`CC-137`'s door was the users route: `POST`/`PUT /api/auth/users` accept a `roles` array, and the only
check on it was `assertActorCanGrantRoles` — a **subset** check whose first line that matters is
`if (actorAcl.isSuperAdmin) return` (`lib/grantChecks.ts:63`). So the actor holding `*`, the one who can
hand out **any** role to anybody, was the one actor the check did not examine. Everybody else was
carefully bounded.

**It is not a typo, and that is what makes it worth a lesson.** For the rule that function implements —
*you may pass on what you already hold* — the early return is **correct**: somebody holding everything
holds everything, and comparing `*` against a role's feature list is busywork. The defect is that this
was the **only** rule on that path. A narrowing rule was being used as if it were a granting rule, and
the two differ exactly at the top of the privilege range.

**And there was a second half, which is the part I did not expect.** The machine floor already listed
`auth.roles.manage` — live since `CC-125`, with its reason written beside it — and this route **never
asked a question the floor answers**, because it only ever asked *"do you hold `auth.users.edit`?"*. The
control was correct, present and unreachable: `CC-101`'s class (*a checker is not a control until
something calls it*), one layer down. The fix was therefore to **ask**, not to add another id.

**The rules.**
1. **Read the early returns before you trust a check.** An exemption is a statement about *which rule the
   function implements*, not about who deserves less scrutiny. If the exempted actor is the one whose
   abuse is unbounded, the check is measuring the wrong population.
2. **A subset rule bounds narrowing, not granting.** *May you pass on something you hold* and *may you
   hand out roles at all* are two questions, and the second one is not implied by the first. When a path
   needs both, both have to be asked.
3. **When a capability exists and a path does not consult it, add the question — not another
   capability.** The instinct after finding an open door is to put a new id on the floor; here the id was
   already there and the door was open because nobody asked. Ask first, then decide whether the gate
   itself is too wide.
4. **Say in the test which half it proves.** The route tests here assert the *capability id asked for* on
   the mock's arguments, because a gate asking for a misspelt capability refuses everybody and looks
   exactly like a gate that works.

*Cross-ref: `CC-101` (a checker is not a control until something calls it) · L179 (a control that
discards its answer) · L184 (*a fact is not corrected where it was discovered; it is corrected where it
is believed* — the floor's entry was believed in one file and unasked in another) ·
`PLAN-CC-137-role-assignment-door.md` §2, M2 and M3 in its §5.*

## L192

**An exemption's reason is a defect, and a comment is where defects go to be forgotten.**

`CC-139` shipped a screen with an inline `optimistic-lock-exempt` marker, because a guard scans backend
screens for mutating calls that do not send the expected-version header and its allowlist is deliberately
empty: *"wire it or exempt it inline."* Wiring was impossible — the ceiling is a **set of rows**, one per
capability, so a version header has nothing to name. The reason in the comment was honest, specific, and
one sentence long.

**And it was still a defect, sitting in a comment.** Two administrators who load the same ceiling and both
save keep the last write; the first one's change vanishes with no message and nothing records that
anything was lost. Writing the exemption did not cause the race — the write has always been a
compare-nothing replacement. **It made it reachable by hand**, and it forced me to write down exactly why
the "obvious" safety was missing. That sentence is the whole defect, and the natural place to put a
sentence is a comment.

**The rules.**
1. **Every `*-exempt` marker is a TODO with a receipt.** If you can write a reason you cannot wire
   something, the reason names a property the system does not have. Read it back as a requirement and
   register it — `CC-140` here came from my own comment, not from a review.
2. **Distinguish "cannot lock" from "did not bother".** The first is a measurement (a set of rows has no
   version), and it belongs in the marker. The second is a hole, and a marker would be laundering it.
3. **A guard's empty allowlist is a promise, and an inline exemption is how you keep it.** The moment an
   allowlist starts filling up, the guard stops being able to tell a documented gap from an accidental
   one. Exempt inline, with the reason, or fix it.
4. **Ask what the change makes reachable, not only what it fixes.** The screen fixed visibility. The same
   change made a previously impractical race a button.

*Cross-ref: `CC-101` (*a checker is not a control until something calls it* — this is the mirror image: a
control that called, and could not be obeyed) · `CC-115` (*the declared-control census is a report by its
own design*) · L191 (*the exemption was the attack surface*) ·
`PLAN-CC-139-ceiling-screen.md` §5, the paragraph that found the guard.*

## L193

**A fix that reloads wipes its own message — and the test that caught it was written for the fix, not for
the message.**

`CC-140`'s 409 branch said: show the sentence, then reload the ceiling. It failed its own test a minute
after it passed the one for the refusal. `loadCeiling` begins by clearing both the notice and the error —
so the very call that made the screen correct erased the only thing that explained why. The end state was
a screen that silently swapped its contents, which is the defect `CC-139` existed to repair.

**Why it took a test and not a review.** Each half was right on its own: setting an error, and reloading a
stale view. The order is what was wrong, and **order is invisible in a diff and obvious in an assertion** —
the test asked for an alert that had already been created and destroyed within the same handler.

**The rules.**
1. **When a handler both reports and repairs, repair first.** The report outlives the repair or nothing
   survives; a message cleared by recovery is a bug whose only symptom is that the person learns nothing.
2. **Assert the message *after* the whole handler has run**, not after the branch that produced it. An
   assertion in the middle checks a state nobody sees.
3. **"Reload and say so" is one action with two steps**, and the second is the one that gets forgotten.
   Write the pair down as a pair.

*Cross-ref: L184 (*a fact is not corrected where it was discovered; it is corrected where it is believed*
— here the correction was made in the wrong place in the *sequence* rather than the wrong file) ·
`PLAN-CC-140-ceiling-revision.md` §4, the paragraph under the mutation table.*

## L194

**A status line written before the evidence is a claim, and the next reader will take it as a fact.**

`PLAN-T04-count-returns-rows.md` was created at 21:35 with **"Status: BUILT AND CLOSED"** in its header.
The code was written at 21:36–21:38; the test was never run; the build was cut off at 21:41; nothing was
committed. The header sat false for six hours, and the first thing anyone resuming would read is the one
line that says there is nothing to resume.

**Why it happens.** A plan is opened by copying the last plan's shape, and the status line is part of the
shape. Copying a *format* copies a *claim*.

**The rules.**
1. **A status line is written last**, from the measurement, and it names the commit. If the document needs
   a status at creation, the status is `REQUIREMENT — not built`.
2. **A claim with a date is checkable; a claim without one is decoration.** `BUILT AND CLOSED 2026-10-19`
   was checkable — `git log` had nothing for that date — and that is what made it findable.
3. **The register's oldest rule applies to prose, not only to tables:** a typed claim drifts, a measured one
   cannot. The measurement here was the commit hash.

*Cross-ref: L193's family (the record disagreeing with the work) · `PLAN-T04-count-returns-rows.md` header,
corrected 2026-10-20.*

## L195

**A test written against an imagined signature tests the imagination.**

`T-04`'s scenario test was written with `check?.status` — `VerificationCheck` carries **`outcome`**. The
author had a nearby type in mind (`VerificationResult` elsewhere) and wrote from memory. The compiler would
have caught it in one line, which is exactly why the failure was interesting: the test was **never
type-checked before it was run**, and when it ran, the failure surfaced as a missing value rather than as
a wrong name.

**The rules.**
1. **Open the type before writing the assertion.** The cost is one file read; the alternative is a test
   that asserts on `undefined` and passes for the wrong reason once the optional chain is in place.
2. **`?.` on an assertion is a warning, not a convenience.** `expect(check?.outcome)` passes silently when
   `check` is missing only if the expectation is loose; assert the object exists first.
3. **A test file is code and belongs under `tsc`.** If the suite is outside the type-check, the first
   instrument that sees its mistakes is the run.

*Cross-ref: L186 (a test that spells its own input) · `t04-count-returns-rows.test.ts`.*

## L196

**The stage before the one you are testing answers first — and its answer looks like the one you wanted.**

`T-04` needs the compiler to refuse `operation: 'count'` at **stage 9**. The first version handed
`compileQuery` the fixture IR directly, and got `ok: false` — which the test read as success. The refusal
was `PARAMETER_NOT_BOUND` at **stage 2**: the IR still carried a `$param` placeholder, and a placeholder is
refused before the operation is ever looked at. **The test would have passed against a compiler that had
not changed at all.**

**Why it is easy to miss.** The assertion was `expect(compiled.ok).toBe(false)` — a true statement about the
wrong refusal. Only asking *which* diagnostic caught it, and then asking whether that diagnostic could
exist for another reason, separated them.

**The rules.**
1. **Assert the code, not the boolean.** `ok === false` is satisfied by every failure in the pipeline; the
   code names the one you built.
2. **Build the subject through the real pre-step.** The IR reaches stage 9 only after `bindParameters`, the
   same call the runner makes — so the test binds, and proves the path rather than a literal.
3. **When a mutation still passes, suspect the subject before the mutation.** A refusal that arrives from
   the wrong stage is a green test over an unchanged system.

*Cross-ref: L186 (the same family, from the input side) · `PLAN-T04-count-returns-rows.md` §6.*

## L197

**A green local run proves the file exists on disk, not that it is in the repository.**

`CC-146`, 2026-10-20. The second CI run to reach the unit suite failed with *cannot find module
`…/attachments/backend/storage/attachments/page.meta`*. The file was there. Every local run was green.
**It had never been committed**: `.gitignore` carried a bare `storage` rule, and a bare directory name
matches **at every depth** — including `packages/core/src/modules/attachments/backend/storage/**`, where
two real source files lived.

**Three inventories each looked away, and each for a different reason:**
1. the **test run** reads the filesystem, and the file is on it;
2. **`git status`** is clean, because an *ignored* file never appears as untracked;
3. **`git ls-files`** lists only *tracked* files, so the two appear in no inventory at all.

Only a **clean checkout** — what CI does — can see the hole. The first CI run in this project's history
found it within minutes, after 2,600+ green tests had said nothing.

**The rules.**
1. **Anchor every bare directory name in `.gitignore`** (`/storage`, not `storage`). A bare name is a
   pattern that matches at every depth, and you cannot see which siblings you have hidden by accident.
2. **Ask git, not the filesystem.** The honest guard is
   `git ls-files --others --ignored --exclude-standard` filtered to source extensions — a file-exists
   walker finds the file on the developer's machine and passes for the wrong reason.
3. **A guard for this needs a denominator.** `uploads`, `dist` and caches *are* ignored; if the check
   asserted only "the offender list is empty", a run that ignored nothing would pass by vacuity.
4. **"Green on my machine" is a claim about a filesystem.** When a failure appears only in CI, suspect
   the *delivery* of the files before the code that uses them — and reproduce with a clean clone, which
   is the only environment that has the same files as the repository.

*Cross-ref: `CC-146` (the fix, the guard, and the proof); `CC-141` (the same first CI run, a different
delivery defect); L186 (a test that measured the wrong object).*

## L198

**A mutation that survives may have removed the wrong guard — and that tells you which guard was real.**

`T-05`, 2026-10-20. The approvals queue refused a veto after an approval had claimed the row **twice
over**: an early `if (status !== 'pending')` and a compare-and-set in the `WHERE`. The mutation meant to
remove the protection edited the early check and *missed the one-line `WHERE`* — and the suite stayed
green. Two possible explanations, and they are not the same: the guard is dead code, or the mutation
never happened. Reading the diff settled it — the CAS was untouched, so **the CAS alone was doing the
work** and the early check is a fast path.

**The rules.**
1. **Before accepting a surviving mutation, read the mutated file.** `sed`/`perl` that silently match
   nothing is the commonest way to run a mutation that is not one — the same family as `L187` (a restore
   that was not a restore). Print the changed lines, not just the test output.
2. **A guard that survives removal of its *neighbour* is not redundant — it is the control.** Write that
   down: it changes what a future editor is allowed to delete.
3. **When two guards refuse the same thing, the mutation must remove both to prove the pair matters.**
   Removing one and staying green proves the *other* one suffices, which is a useful result but a
   different claim than "this row is protected".
4. **Keep the surviving mutation in the record.** It is evidence about the design, not a failed test run.

*Cross-ref: `PLAN-T05-approve-once.md` §4 (M3's first run, and the corrected one); L187 (a restore that
answered the wrong question); L186 (a test that measured the wrong object).*

## L199

**Two checks with almost the same name can measure opposite things — and the one that passes is the one people quote.**

`CC-148`, 2026-10-20. `i18n:check-sync` printed *"All translation files are in sync"* and was **right**:
all four locales were **equally** missing the same 21 keys. `i18n:check-usage` — code → English — found
them: screens that would render raw key names in every locale. The green check was the one in the CI log
first, and it is the one a person repeats when asked "is i18n fine?".

**The rules.**
1. **A sync check compares copies to each other; a usage check compares code to the catalogue.** Neither
   subsumes the other, and a passing sync says exactly nothing about whether a key exists.
2. **When a check's name contains a word you have not defined, define it before trusting a pass** —
   *sync* here meant *the locales agree*, not *the translations exist*.
3. **The failing check is the one that names the user-visible symptom.** "Raw key names on a screen" is a
   symptom; "locales differ" is a maintenance property. Prefer the check that would embarrass you.
4. **When you re-sort a generated file, prove the sort was the only change** — a key-set comparison
   against `HEAD` (added / removed / changed), not a line count. A 55-line diff for a 3-key addition is
   reordering, and saying so is part of the record.

*Cross-ref: `CC-148` (the fix, 96 entries), `CC-142` (sync, and the `--fix` trap), `CC-149` (the same
denominator lesson in the integration harness), L197.*

---

## L200

**A check that reads a line of config without the guard around it answers a question nobody asked.**

`CC-152`, 2026-10-20. The integration discovery read `apps/mercato/src/modules.ts` and matched
`enabledModules.push({ id: 'example' … })` — a regex with no idea that the push sits inside
`if (parseBooleanWithDefault(process.env.OM_ENABLE_EXAMPLES, false))`. It answered "is this module
enabled?" with **yes**, while the runtime, reading the same file, answered **no** — because the runtime
executes the `if` and the regex only reads the text. 33 specs then ran against pages that exist only when
the flag is on; 56 tests failed on 404s. The same trap `CC-132` (a directory scan cannot see a parked
module) and `CC-149` (a dependency check that read directories) fell into — twice the deciding fact was
**in the file and the check could not interpret it**.

**The rules.**
1. **A guard is part of the declaration.** `enabledModules.push(...)` alone is half a fact; the `if`
   above it is the other half. A reader that takes the push without the guard is reading a different
   file than the one the runtime executes.
2. **When a check cannot interpret what it reads, over-include, never under-include.** Here the unknown
   shape fails loud — the spec runs and fails visibly. The opposite (silently excluding) shrinks the suite
   and nobody notices until something regresses in the dark.
3. **The hollow green is the second failure.** With the flag off, discovery would find **0 specs** and all
   15 shards would pass having run nothing — 8 of today's shards already did exactly that. A suite that
   runs nothing is not green; it is absent. If the fix's effect can be "no tests", say so in the row.

*Cross-ref: `CC-152` (the fix: guard-aware discovery + `OM_ENABLE_EXAMPLES` in the integration job),
`CC-149` and `CC-132` (the same trap in the directory scan), L197 (a green run proves the file exists).*
