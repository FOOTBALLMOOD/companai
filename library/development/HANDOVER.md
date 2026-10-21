# Handover — start here if you have just inherited this project

> **WHERE THE ACTIVE TASK LIVES (read this first, it is the one live fact).**
> **The task being worked on right now is named in ONE place, and it is not this page:** the
> **`★ ACTIVE TASK` box at the top of [`../../JOURNAL.md`](../../JOURNAL.md)**. Open it to see the
> module in hand, its plain-English description, the exact steps to do it, and the current queue.
> **That box is the single source of truth for "what is being worked on now".** No other document —
> not this page, not START-PROMPT, not README, not BOOKMARKS, not BACKLOG — may state a live task;
> they all point to the box. If any of them seems to disagree with the box, **the box wins** (owner's
> instruction, 2026-10-06).

**You know nothing about this project, this codebase, or these documents. This page is
written for exactly that person — and this revision is written for an agent that will
continue the development work.** Read it top to bottom once (about 20 minutes), then
follow §2 to actually get working. Everything else in the project is reachable from here.

**Written 2026-10-05, revision 33 (2026-10-14). Owner: Ramzi. Development machine: `BIXMASERVER` (Windows 10 Pro).**
**★★ CURRENT POSITION — 2026-10-21, evening (revision 39). Read this paragraph, then go to the box.**
The authority family is **complete and closed**: `CC-125` (the machine floor) · `CC-128` (the tenant
ceiling) · `CC-134` (the superadmin read, scoped to the foundational tenant) · `CC-135` (the ceiling's
route + the flag's producer) · `CC-136` (a platform act is a platform act) · `CC-137` (one capability
means one door) · `CC-139` (the ceiling's screen) · `CC-140` (its write refuses a stale view).
**Register: 90 closed · 66 open · 156 total**, counted from `MASTER-CHECKLIST.md` §5 by
`scripts/check-master-checklist.mjs`. **The live task is `CC-92` Slot 0 — 4 spine findings left** before
`CC-121`, and **`T-17` is in hand: its requirement is written (commit `fe5fd08`,
`PLAN-T-17-model-allowlist-fails-open.md`) and NOTHING IS BUILT YET** — the next agent starts at §3 of
that plan, four requirements against five mutations. Behind it: `T-28`, `T-30`, `T-33`. The box at the top
of [`../../JOURNAL.md`](../../JOURNAL.md) names it with its steps. **The ONE NUMBER is 78 / 321 units
(24.3 %)**, re-derived by `scripts/derive-counts.mjs`.
**★ What is new since revision 38:** Slot 0 closed **five** findings in one day — `T-06` (the undo record
extends the hash chain), `T-07` (115 commands gained a capability, and the guard that should have caught
it was rewritten: it had been excluding those modules **by hand** while promising it would not),
`T-08` (trust demotion finally has a caller, in the undo path), `T-15` (the confirm path applies the
binding's narrowing, and resolves the agent through the catalogue rather than the global registry),
`T-16` (both doors now answer a missing authority dependency the same way, from one shared rule) — and
`T-17` is measured with its requirement written. **Two live rows are worth knowing beyond the spine:**
`CC-156` (three endpoints are authenticated but not authorised, so any signed-in user may assign labels or
edit sales notes) and `CC-157` (six commands nothing can invoke). Both are startable now.
**★ The standing lesson of the day, for whoever continues:** seven of the rows closed so far needed the
audit's own sentence corrected, and one (`T-07`) changed what its row *meant* — the modules were parked and
the guard lied. **Measure from source before building, every time.** And: a control that cannot see what it
guards is not a control; this project has now found that shape three times (`CC-101`, `CC-132`, `T-07`).
**What has NOT moved:** the ONE NUMBER is **78 / 321 = 24.3%** — re-derived 2026-10-21 by
`node scripts/derive-counts.mjs`, which prints `MATCHES the claimed 78/321`. None of the rows closed in
this slot moved a LIST row, because they are the authority spine, not a feature. The Hermes switchover
(`P2-9b`) is still the next *product* build once the spine work is done, and its gate is **closed**
(owner, 2026-10-16: Option 1 — keep the 2,400 s ceiling).
**This revision adds the handoff snapshot — the ★ section between this intro and §0 (measured
2026-10-14): the live frontier (Hermes Phase 2, `P2-1`–`P2-9a` discharged), the exact point the work
was interrupted (`P2-9b`, queued and not started), and the one owner decision that gates it.**
**This revision records row 27 (Phase 7 — *"told when blocked, noticed and suggested to"*): MEASURED, with its one
startable half built.** Measured: **`S3` ("told when refused") is half there** — the dispatcher's refusal already
returns a localised message **plus the missing feature list** (403, `apps/mercato/src/app/api/[...slug]/route.ts:249`)
— but the **"seal"** (a marker that an answer was *reduced*) is **blocked on `G-04`** (the data axis knows *what*
was withheld). **`S8` ("notices and suggests") was half-built and inert** — `canOfferSaveAsFunction`
(`request-outcome/gate.ts`) exists with **no production caller** (the Save *button* is frontend), and the
**"notices" half did not exist**. **Built:** the **similarity signal** —
`shared/src/lib/request-outcome/repeat.ts` (`normaliseRequestText` Unicode-aware · `requestSimilarity` Jaccard ·
`detectRepeatedRequest`; **pure, zero imports**; threshold **0.8** clamped; `RepeatSignal`/`looksLikeRepeat`, a
**signal not a decision** — renamed after a critic flagged the collision with the gate's real decision type).
**Proof:** `request-outcome` 5 suites / 78 tests green (16 new); `tsc` clean; **4 RED-then-GREEN mutations**,
md5-verified. A separate-agent hostile critic: all 7 claims held; **2 of its findings were false positives** (the
cited docs exist in the docs repo — it searched only the code repo; the deep-path import is the package's own
pattern) and **1 was real and fixed**. **NO BOX MOVED** — `S3`/`S8` are whole points and neither is whole, so the
ONE NUMBER is **unchanged at 75 / 321 = 23%**. Registered **`CC-66`** (the history read that feeds the signal,
and the offer). **NEXT = LIST row 28** (Phase 8).
**Prior — revision 31 recorded a RE-MEASUREMENT: Phase 6 (Audit) was recorded as `0/2 — never verified`, and it is
BUILT.** Rows 21 / 21b were 🟡; the rule-0b measurement found the whole phase in place —
`packages/core/src/modules/audit_logs/` carries a **read API** (`GET`, RBAC `audit_logs.view_self`, filter by
actor/resource/org), a **viewer page** (235 lines, fetching the action + access logs), an **export API** (CSV), a
**hash-chained ledger** (`ledgerService.ts` — each event carries its predecessor's hash; `unique(tenant_id, seq)`
+ `unique(tenant_id, hash)`; `verifyTenantChain` + a `ledger:verify` CLI), appended **automatically** by
`actionLogService.log()`, and **retention** for the high-volume access log (core 7d / non-core 8h). **`P4a` /
`P4b` ☐→☑ ⇒ the ONE NUMBER MOVED AGAIN: 73/321 → 75/321 = 23%** (§B 5/38 → 7/38; two independent routes agree).
**A separate-agent hostile critic (8 claims) could not falsify it**, and found **2 register-worthy cracks —
`CC-64`** (an undo's trace **bypasses the ledger**) and **`CC-65`** (`action_logs` has **no retention path**).
It also established that **`action_logs` is mutable by design** (backfill CLIs update derived columns), so the
tamper-evidence is the **ledger**, not the table — recorded, not hidden. **NEXT = LIST row 27** (Phase 7 — *"the
user is told when blocked and noticed and suggested to"*).
**Prior — revision 30 recorded `CC-61` — LIST row 19, the command contract made uniform.** Row 19's claim (*"every
state-changing action goes through one typed command"*) **held** — the command bus is real (~122 command files,
~18 modules). What did not was `C6b` (*"the full contract uniform across every action"*): `CommandHandler` had no
`risk` / `approval` / `idempotency` at all. Built: the three facets as **optional** declarations
(`shared/src/lib/commands/types.ts`) and recorded on the action log under `context.commandContract`
(`command-bus.ts`). **Approval DECLARES; the authority layer ENFORCES** — a bus refusal would be a second engine
(`S5`). `C6b` ☐→☑ ⇒ ONE NUMBER 72/321 → 73/321. **Proof:** `src/lib/commands` 20 suites / 169 tests green; whole
`shared` 2555 tests (the one failing suite is the known-environmental `CC-19`); `tsc` clean; **5 RED-then-GREEN
mutations**, md5-verified. **A separate-agent hostile critic found 1 REAL defect, fixed** (the first draft merged
inside `buildLog`, which returns null without one); its `D2` (0 of ~93 commands declare the fields) is **`CC-63`**.
**Prior — revision 29 recorded `CC-59` — the Business-IR chain's FIRST PRODUCTION CALLER — and the two real defects a
separate-agent hostile critic found in it.** The Business-IR pipeline (prompt → typed IR → deterministic compile
→ execute) was five built, tested layers with **no caller**; `CC-59` adds the caller and the switch. Two new
files in `packages/ai-assistant/src/modules/ai_assistant/`: **`lib/business-ir-run.ts`** — `runBusinessQueryPrompt`
(prompt → `authorBusinessQueryIr`, binding-gated `CC-57` → IR → `compileQuery`, session-scoped → `engine.query` →
a **result** union; every refusal a **value**: `agent_not_bound`/`schema_rejected`/`compile_failed`/`no_binding`/
`engine_failed`; plus the `B5e` guardrails `applyDefaultBounds`, default limit 100 / max range 365d) — and
**`ai-tools/business-ir-pack.ts`**, the read-only tool **`business_ir.run_query`**, registered in `ai-tools.ts`
so the generator picks it up. **The interruption it finished:** `CC-59` had been left **RED** (the wire's test
stubbed the DB handle as `{}`, so the unbound-AI-worker case threw and returned `engine_failed` instead of
`agent_not_bound`); fixed by mocking the binding repository as the project's own routed test does. **The
hostile critic (separate agent, a command + output per claim) found 2 REAL defects, both fixed:** (1) the pack's
doc **overclaimed** that an agent can call it — measured, **no agent whitelists it** (`business_ir.query_author`
is object-mode with **no tools**), so the tool is live on the authenticated tool door
(`POST /api/ai/tools/execute`) and MCP, **not yet** for an in-chat agent (doc corrected; the consumer gap is
scheduled as **`CC-60`**); (2) a **blank/whitespace subject** derived **no** principal and fell into the human
passthrough, skipping the binding (**fail-open**) — fixed in the tool's guard (trim) **and** in
`lib/agent-binding.ts`, which now **refuses a null principal**. **Proof:** pack gate 9 + wire 15 + binding 9 +
coverage 12 green; **whole `ai_assistant` module 111 suites / 1518 tests green**; **8 RED-then-GREEN mutations**,
md5-verified restores. **THE ONE NUMBER unchanged at 72 / 321 = 22%** (a caller adds no box), re-derived by two
routes.
**Prior — revision 28 recorded the `B-WS` BRIDGE and the follow-on document sync — the workspace-architecture design
workstream is now bound to this spine by a written contract.** The workspace-architecture workstream (`B-WS`,
`library/workspace-architecture/`) is the design of the dashboard & workspace widget architecture (the owner's
Message 6). Until the bridge it ran **alongside** the spine with **no binding** — the measured gap: `git grep -l
"workspace-architecture" 9b5af4d -- library/development INDEX.md JOURNAL.md` returned **nothing**, so a newcomer
reading the front door could not find it and its plan items were in no register. Fixed by
[`../workspace-architecture/04-BRIDGE.md`](../workspace-architecture/04-BRIDGE.md) (the contract, four rules
**BR-1…BR-4**) + **`WORKING-RULES.md` Rule 16**, with pointer rows wired into the spine and **BR-3 applied for
real** — the touched register rows (`CC-58`, `CC-32`, `CC-59`) now carry a `decided in B-WS/<batch>` note. **Two
commits, and the split matters for an auditor:** **commit `33ca4a5`** created the contract + Rule 16 + the two
workstream files and wired pointers into **eight** spine documents (`INDEX.md`, `library/INDEX.md`, `BACKLOG.md`,
`COMPLETION-CALLBACKS.md`, `HANDOVER.md`, `JOURNEY.md`, `development/README.md`, `WORKING-RULES.md`) plus
`JOURNAL.md`; **this revision's follow-on change** then brought `platform_points.md`, `HANDOVER.md`,
`START-PROMPT.md` and `BACKLOG.md` into line per the owner's instruction to track the design track "as we update
everything else" (so `platform_points.md`'s ▶ FRONTIER gains its **DESIGN TRACK** row in *this* change, not in
`33ca4a5`). **It is DESIGN, never code (BR-4): a design is never a build, so it moves no appendix box and the ONE
NUMBER stays 72 / 321 = 22% (§L's **fourteenth** re-run, both routes agree).** The backlog the bridge opens is
**`B-WS/B1–B-WS/B8` of 10 done, next `B-WS/B9`** (the widget architecture end to end → `B-WS/B10` finalises
`03-MAPPING.md`), then the two owner-approved follow-on workstreams **WS-1 B-perms** (the two-gate permissions
engine) and **WS-2 B-studio** ("The Studio"). **This is a *second live track*, not a new live task** — the live
task is still whatever the `★ ACTIVE TASK` box says (rule **BR-1**). Verified: the bridge's eleven committed blobs
all **CR=0** (LF) and BOM-free; **no reflow** (10/11 `raw == git diff -w`; the one gap proven by bytes to be
trailing-whitespace normalisation only); the code repo at `1bb61557`. Two separate-agent hostile-critic rounds on
the bridge (**15 defects, all in these docs, all fixed**).
**Prior — revision 27 recorded the BUILD of row 22's LAST named leg (`CC-57`) — the in-process dispatch
helper now consults the binding and threads its scope, so **row 22 is COMPLETE**. Rule-0b measurement first:
`authorBusinessQueryIr` (`lib/business-ir-author.ts`) called `runAiAgentObject({ agentId: BUSINESS_IR_AGENT_ID, … })`
with **no** `boundScope` and **no** binding check — the **only** non-route dispatch site (found by `CC-55`'s
coverage scan, which named it in `IN_PROCESS_DISPATCH_SITES`). Built (`B3''`): `AuthorBusinessQueryIrInput` gains
**required** `auth: AuthContext` + `em: EntityManager`; a new result arm `{ ok:false, reason:'agent_not_bound' }`;
before the model is asked the helper resolves `resolveAgentBinding`, refuses fail-closed when unbound, then threads
`computeBoundRunScope` into the runtime — the identical check + narrowing-only scope the routed paths use (humans
passthrough, no DB read). The gate got the **GATED arm** its `CC-55` header promised (a caller that dispatches
**and** calls `resolveAgentBinding` is gated), so `IN_PROCESS_DISPATCH_SITES` is now **empty**, held by a positive
pin. **A separate-agent hostile critic confirmed all 6 claims** (scan walks 176 files; a temporary un-gated probe
turned the gate RED then was deleted; the refusal precedes the model; real `computeBoundRunScope`; human
derivation; no other un-gated site; full suite **109/109 suites · 1492/1492 tests**) and raised **1 LOW** — the
scan matched a dispatch by **name**, so an `… as dispatch` alias would evade it; **fixed** (the scan is now
**alias-aware**, with a new RED-then-GREEN pin). **6 RED-then-GREEN** mutations, every restore **md5-verified**
(`business-ir-author.ts` `c06e0ecf…`, `binding-coverage.test.ts` `cda0525c…`); **23/23** across the three suites;
`tsc` clean for the CC-57 files (the only two errors are a pre-existing mock spread and a generated-file alias,
independent of this change). **Honest boundary:** the helper still has **no routed caller** — this makes it **safe
for the caller it will one day have**. ONE NUMBER **72 / 321 = 22%, unchanged** (§L's **thirteenth** re-run, both
routes agree). **The named `CC-` queue is now EXHAUSTED** — the next task is a fresh pick from the vision order
(rule 11 — the owner decides *what*).
**Prior — revision 26: row 7's write-path feature gate as DEFAULT-DENY (`CC-44`, owner's Option A, `NY-23`).** A
build-time gate fails when a write-verb `route.ts` in an enabled module declares neither a **non-empty**
`requireFeatures` nor a `byDesign: '<reason>'` exemption; the **11** non-feature-gated routes carry the inert tag.
**TWO separate-agent hostile-critic passes** (round 1: **3 REAL classifier defects**, all fixed, tightening proven
free — 0 routes reclassified; round 2: limits recorded); **6 RED-then-GREEN** mutations. ONE NUMBER unchanged
(§L's **twelfth** re-run). The live FRONTIER then was `CC-57`.
**Prior — revision 25: row 22's EXECUTION leg (`CC-56`) — the pending-action **confirm**
route now re-checks the agent binding before it runs the tool. Rule-0b measurement first: the confirm route
reached `executePendingActionConfirm` (which invokes the tool handler) with **no** `resolveAgentBinding` call, so
a binding **revoked between the dispatch that proposed the action and the confirm** was **not observed**. Built:
after `runPendingActionRechecks` succeeds and before `executePendingActionConfirm`, the route calls
`resolveAgentBinding({ em, auth, agentId: row.agentId })` and refuses **403 `agent_not_bound`** when
`!binding.bound` — the identical check + code the dispatch routes use (fail-closed for an `ai_worker`,
passthrough for a human). A separate-agent hostile critic raised 5 items, **3 real and fixed** (a vacuous human
test, a comment-blind coverage assertion, a stale OpenAPI 403 text); **5 RED-then-GREEN** mutations,
md5-verified; `tsc` clean; **1487 tests / 108 suites** green. **SCOPE (measured):** the guard checks the
**confirm caller**, so the worker's revocation is observed when an **`ai_worker`** confirms; a **human** confirm
is a passthrough (row 22's "run" is gated at **dispatch** by `CC-27`). ONE NUMBER **72 / 321 = 22%, unchanged**
(§L's **eleventh** re-run, both routes agree).
**Prior — revision 24: row 22's NARROWING leg (`CC-55`) — the binding's scope is now
applied to the run, so row 22 is ✅ whole.** Rule-0b measurement first: `computeBoundRunScope` had **no
production caller** (repo-wide grep: only its definition + the unit test); `resolveAiAgentTools` built the tool
set from the **full** `agent.allowedTools`; `checkAgentPolicy` enforced only `agent.requiredFeatures`; both
routes read only `binding.bound` and dispatched the **un-narrowed** `agentId`. Built: an optional `boundScope`
on `ResolveAiAgentToolsInput` + `RunAiAgentTextInput`/`RunAiAgentObjectInput`; `resolveAiAgentTools` intersects
tools (the agent's list is the base — **never widening**), enforces the **feature union**
(`AgentPolicyError('agent_features_denied')` on a miss), and returns the **original** agent object when nothing
narrows (**humans byte-identical**); both routes compute `computeBoundRunScope({ agentId, binding })` after the
`bound` check and pass it into the runtime call. A separate-agent hostile critic found **2 real defects** — (1)
the **coverage gate was blind to in-process dispatch sites** (it scanned only `api/ai/**`; it now scans the
**whole module** for dispatch *calls* and names the one known un-gated site `lib/business-ir-author.ts` as a
**`CC-57`** gap); (2) the **"features UNIONED" test did not test the union** (it stayed GREEN when the
enforcement was deleted — rewritten to assert the union). **6 RED-then-GREEN** mutations, md5-verified; `tsc`
clean; **1374 tests pass** (the 2 `isolated-vm` electron-ABI suites are flaky/environmental — they *passed* in
the critic's run). **Legs NOT built (not claimed):** the pending-action **confirm** re-check → **`CC-56`**; the
in-process dispatch site → **`CC-57`**. ONE NUMBER **72 / 321 = 22%, unchanged** (§L's **tenth** re-run, both
routes agree). The live FRONTIER is now **`CC-44`**, then **`CC-56`**/**`CC-57`**. **Prior — revision 23: row 22's (`CC-27`) CORE leg (an AI user can run only the agents bound to it): an `ai_agent_bindings` table + a fail-closed `resolveAgentBinding` for `ai_worker` + 403 `agent_not_bound` in both dispatch routes; the narrowing leg was left open as `CC-55`, the confirm re-check as `CC-56`.**
**Two separate-agent hostile-critic rounds** found and fixed **two real holes** (the presenter-promotion leak +
the raw aggregate bucket leak; then a classified key **nested in an object value** that the first top-level-only
mask missed) — **6 RED-then-GREEN** mutations, md5-verified (`8b9238b006ec1ea6eab76199d6365bc6`); green 12/12 in
the new suite, **281/281** in the search module; `tsc` clean. **The own row-scope leg is NOT built** — measured:
**no entity is both searchable and own-scoped**, so the owner clause has **no reader** on the AI path → owner
question **`NY-22`** (rules 8/10d/11). The ONE NUMBER is **72 / 321 = 22%, unchanged by row 18** (row 18's new
LIST box has **no** fresh appendix marker in §A–§K; §L now carries an **eighth** consecutive re-run, and this
re-run's two routes **disagreed** until the verifier's `[A-K]` regex bug — it never matched `## L.` — was found
to be counting the **ledger §L** as points). The previous revision (21) recorded the row-17 build (`CC-52`,
every-table coverage gate). **The PHASE-5 batch is COMPLETE and row 22's core is now also BUILT; the live FRONTIER is `CC-44` (then `CC-55`/`CC-56`).**
The revision before that (20) recorded the row-16 own-leg build (`CC-50` **CLOSED**; the row stays 🟡 because the
team-leg is deliberately deferred, `CC-51`): an opt-in `ownerField`/`ownerFeature` declaration on
**`OrmEntityConfig`** (rule-13 correction — it belongs on the CRUD layer every `makeCrudRoute` caller shares,
**not** in the search registry, which exists only for the 11 searchable modules and which the first wired entity
`api_keys` does not have), plus a role-level **`.own`** feature-grant modifier (`matchFeature` byte-unchanged)
resolved once in `withCtx()` with a **dual super-admin carve-out** (`auth.isSuperAdmin` **or**
`acl.isSuperAdmin`) and threaded through all **three** `buildScopedWhere` call sites plus any route hook that
short-circuits them. Two
hostile-critic rounds (separate agent) each found a **real** defect: a `beforeList` bypass that never reached
the shared builder (**L106**), and the missing second super-admin notion (**L107**); both fixed, RED-then-GREEN
md5-verified. Revision 20 also carried: **Rule 9(a) strengthened** (ownership is of the **full codebase while
you are working on it, not just your own diff** — two findings previously waved off are now **scheduled**:
`N-20` `openapi.test.ts` 3 failing tests; `N-21` `structural-contracts.test.ts` ~17-min suite), and a
**rule-13 correction** (the CC-47 test header's "in neither" count `163` → measured **161**). It also records
the 2026-10-10 closes of **`CC-46`**, **`CC-45`**, **`CC-48`**, **`CC-49`**, **`CC-47`** — **row 15 ✅, so
PHASE 3 is complete on rows 7–9, 13–15**.
*⚠️ **Note the revision cadence:** this page is bumped by a session that changes the *project layout,
the front-door documents, or a numbered ruling* — it is **not** bumped by every `CC-` item. Where this
page and the `★ ACTIVE TASK` box disagree about *what is being worked on now*, **the box wins** (line 9).*

> **What we are building, in one line:** a platform that turns a business's plain-language needs into
> **real working software** — the AI builds a capability once, the platform checks and saves it, and
> from then on it runs with **no AI**. The business model is the source of truth; governance is the
> floor, not the product. **The full plain-English version is
> [`../WHAT-WE-ARE-BUILDING.md`](../WHAT-WE-ARE-BUILDING.md) — read it before a long stretch of work;**
> it also says which documents in the library are *ours* and which are only imported study material.

> This is the **handover**. It is not a status page and not a roadmap — it is the one
> document that tells you what exists, where it is, and in what order to open it.
> For *what is left*, read [`BACKLOG.md`](BACKLOG.md). For *what happened*, read
> [`../../JOURNAL.md`](../../JOURNAL.md). For *what to avoid*, read [`../../LESSONS.md`](../../LESSONS.md).
> **The message that starts a new session is [`START-PROMPT.md`](START-PROMPT.md).**

---

## ★★ The remote, the branches, and CI — read this before your first push (2026-10-20, revision 37)

**One repository, two branches, and neither is called `master` any more.**

| Branch | Holds | Workflow | Runs on |
|---|---|---|---|
| `main` | **the documentation** (this folder, the repo root) | `.github/workflows/docs.yml` | push to `main`, every PR, manual dispatch |
| `code` | **the codebase** (`workspace/starting-kit`) | `.github/workflows/ci.yml` | push to `code`, `develop`, `feat/wms` |

Remote: `https://github.com/FOOTBALLMOOD/companai`. **Both branches are pushed after every slice** — the
rule is push, not commit-and-forget. There is no PR gate yet: a push to `code` runs CI directly, so a red
run is visible to anyone who looks.

**Authentication on this machine.** `git push` uses the Windows Credential Manager entry for
`github.com`; a push needs nothing from you. **`gh` is not logged in**, and `gh auth login` refuses that
stored credential because it lacks the `read:org` scope. Use the wrapper, which reads the credential from
the OS store at call time and writes no token to disk:

```
~/.workbuddy-ai/bin/ghx run list -R FOOTBALLMOOD/companai --limit 5
```

**The four commands that answer "is it green?"**

```
ghx run list -R FOOTBALLMOOD/companai --limit 5
ghx run view <run-id> -R FOOTBALLMOOD/companai --json jobs \
  --jq '.jobs[] | {name, conclusion, failed: [.steps[] | select(.conclusion=="failure") | .name]}'
ghx run view <run-id> -R FOOTBALLMOOD/companai --log-failed
ghx run view --job <job-id> -R FOOTBALLMOOD/companai --log
```

**What CI has actually found, and the pattern to carry.** Four defects that every local run passed over:
`CC-141` (a module exported a default but not the named export the generator resolves **statically** — a
`??` fallback does not exist for a bundler), `CC-146` (two source files were **gitignored** by a bare
`storage` rule, so no checkout contained them — `LESSONS.md` L197), `CC-148` (21 i18n keys referenced by
code and present in no `en.json` — the **sync** check cannot see this; the **usage** check can), `CC-149`
(the integration harness had **never run a test**: discovery included a **parked** module's specs, and
loading one crashed on generated entity ids). **The pattern:** a local run reads the **filesystem**, CI
reads the **repository** — and a parked module's directory still exists. Before blaming code for a
CI-only failure, check what a clean checkout actually contains.

**Deployment is NOT automatic.** A green CI deploys nothing. The live instance is deployed by hand
(`RUNBOOK-deploying-a-site.md` / `RUNBOOK-platform-server.md`), and **it was replaced on 2026-10-20 with
commit `86c2b1ed`** — a fresh instance, schema created from zero (`DEPLOY-2026-10-20.md` is the record,
and it is the file to read and extend for the next one).

---

## ★★ READ THIS FIRST — WHERE WE ARE NOW (measured 2026-10-16, revision 34 — SUPERSEDED by revision 37 above)

**The 2026-10-14 snapshot below is now historical context, not the live frontier.** After a deliberate
**development pause**, the owner chose to finish the **platform architecture** before resuming builds.
What changed and where things stand:

- **★ START HERE — [`MASTER-CHECKLIST.md`](MASTER-CHECKLIST.md)**. This is the **one plain-English index**
  over the whole
  lifecycle — every checklist row, every open item with its trigger, the platform study, and the
  requirements. **It is the single source of truth and every count in it is measured** by
  `scripts/check-master-checklist.mjs` (its tables vs its own typed numbers) and
  `scripts/derive-counts.mjs` (the 78/321 unit count, re-derived from the appendix boxes).
  **`MASTER-CHECKLIST.html` was retired 2026-10-17** — it was a second, hand-synced copy of the same
  content, and the copy drifted: its open-work view ran 25 of 54 rows behind while its headline counts
  stayed right, because the headline was computed and the list was typed. **Two mirrors cannot hold one
  truth.** The old file is in git history; the deep records it never held (`AUDIT-*`, `PLAN-*`,
  `DECISION-*`) and the running history (`JOURNAL.md`) are unchanged.
  development lifecycle — every checklist row, every open item with its trigger, the platform study, and
  the architecture requirements — built so nobody has to hunt to learn what a code-name (e.g. `CC-84`)
  means or where it sits. **The owner asked for exactly this on 2026-10-16.**
- **The platform-study + mapping stage is DONE.** Nine platforms studied (Hermes, Paperclip, CrewAI,
  Multica, Gas Town, n8n, buzz, openrig, zulip) and mapped into **53 architecture requirements**
  (`SR-*`) in [`../architecture/mapping/findings/08-THE-SRS.md`](../architecture/mapping/findings/08-THE-SRS.md),
  with the filterable register in
  [`../architecture/mapping/workshop-status.html`](../architecture/mapping/workshop-status.html).
- **A new platform was added:** **activepieces** (`activepieces-main.zip` on disk, repo
  `activepieces/activepieces`) — pending study, alongside **mattermost** (also pending your ask). Both
  join as new `SR-*` columns with **no rework**.
- **The ONE NUMBER is unchanged at 78 / 321 = 24%** (the mapping pass writes no code, so no box moved).
- **The build frontier is paused, not gone.** `P2-9b` (below) is still the next build when development
  resumes — its first step (the Hermes default-flip) is gated by the owner's stale-timeout decision
  (below). The R28-6 OpenCode deletion is the same switchover seen from the door's side (`CC-72`).

**What is genuinely open for the owner's decision now:** (1) the `P2-9b` stale-timeout trade — raise the
ceiling or shrink the toolset (below); (2) whether to start the **tooling set + `SR-08`** (my
recommendation — they come from already-closed platforms, so mattermost/activepieces cannot rewrite
them) while the two platform studies run in parallel, or hold all development until the studies close.

---

## ★ WHERE WE ARE NOW, AND WHERE THE WORK WAS INTERRUPTED — measured 2026-10-14 (historical)

> The snapshot below was the live frontier on 2026-10-14, at the end of the last build session. It is
> kept in full for its measurements; the **current** state is the 2026-10-16 banner above. Where the two
> touch the same item, the banner wins.

**This section is the handoff snapshot for an agent picking the work up cold.** It states the live
frontier, the exact point the last session stopped, and the one decision that gates the next build.
The `★ ACTIVE TASK` box in [`../../JOURNAL.md`](../../JOURNAL.md) remains the single live-task
record (line 9 above) — this section is its measured context, not a replacement.

### Where we are now

| | |
|---|---|
| **The live frontier** | **Hermes Phase 2** — *"one worker, one tenant, one tool"* (plan: [`PLAN-HERMES-PHASE2-one-tenant-one-tool.md`](PLAN-HERMES-PHASE2-one-tenant-one-tool.md)). Per the owner's 2026-10-12 ruling, the focus is the **core architecture**, and **business modules are generated from the core workspace, never hand-coded**. |
| **Phase 2 progress** | **`P2-1` … `P2-9a` all DISCHARGED.** The last, **`P2-9a` (the MCP bridge)**: a live Hermes turn **called a platform tool** (`mcp__open_mercato__context_whoami`) and read a real platform result back — `PASS — a real turn answered and ended on done (287 events) in 859.1s`; **`CC-79` discharged**. Before it: `P2-8` (the worker's **ws door** + the client's transport seam — a real turn served with **no hand-spawned process**), `P2-7` (Hermes served a live turn, twice, the second production-shaped), `CC-80` (the suite is **hermetic** — two-sided acceptance measured on both the clean and the poisoned shell), and `CC-73` (below). **The default engine did NOT move in any of them — it is still `opencode`.** |
| **The last thing done** | **`CC-73` DISCHARGED 2026-10-14, 15:53–15:54** — the `ai-assistant` type gate turned on: **92 pre-existing, test-only errors fixed across 27 `__tests__` files, production untouched**; `tsc --noEmit --incremental false` **exit 0** (was 92); package **129 suites / 1890 tests green**; 4 reverts restored exactly 17 errors, md5-verified; a separate-agent hostile critic found 1 MEDIUM + 3 LOW/NIT, all fixed — the MEDIUM became **`CC-81`**. Docs + memory synced in the same change. |
| **Repo state** | **Both repos clean — nothing uncommitted, nothing mid-edit.** Docs repo (this one) HEAD **`c540cc3`** (the tenancy measurement + the `CC-84` register; the code repo was untouched that turn); code repo (`workspace/starting-kit`) HEAD **`2ee74ba6`** (`CC-73`). |
| **The gates** (pinned Node 24 — `workspace/.toolchain/node24/node.exe`, never `npx`) | `ai-assistant` package **129 suites / 1890 tests GREEN**; `tsc --noEmit --incremental false` **exit 0**. |
| **The ONE NUMBER** | **78 / 321 = 24%** — unchanged (`P2-9a`, `CC-80`, `CC-73` each move no box). Derived by the two routes recorded in `platform_points.md` §L; never typed. |
| **The stack** | Runs from the committed compose. The Hermes worker serves its **ws door** (the pin's own wire protocol) — **fail-closed unless `HERMES_WS_TOKEN` is set**, which it is, in the **git-ignored `.env`** (48 random bytes, never committed, never logged). A real turn was last served through the production client on 2026-10-14. |
| **`CC-59`, for the record** | Completed 2026-10-11 (code `83f88bd3`, docs `95b5a24`): the Business-IR chain's **first production caller** — `lib/business-ir-run.ts` (`runBusinessQueryPrompt`: prompt → IR → compile → execute, every refusal a value, `B5e` guardrails) + `ai-tools/business-ir-pack.ts` (`business_ir.run_query`). Its consumer gap is **`CC-60`** (below). |

### Where the work was interrupted — the exact point

**The last session ended immediately after `CC-73`'s discharge** (docs `72e9b00`, then the memory
refresh `d8059ea`, 2026-10-14 15:54). The queue's NEXT item was written down and **not started —
zero lines of code**:

> **★ NEXT = `P2-9b` — THE SWITCHOVER.** ONE change, three parts:
>
> 1. **The default-flip** — `AI_RUNTIME_ENGINE` now defaults to `hermes`
>    (`lib/resolve-ai-runtime-port.ts`; the `opencode` branch and `OPENCODE_RUNTIME_IMPLEMENTATION`
>    go with the engine).
> 2. **The OpenCode deletion** (`R28-6` / `N-8`) — engine files (`opencode-client.ts`,
>    `opencode-handlers.ts`, `opencode-port-adapter.ts`, `docker/opencode/`), the six OpenCode test
>    files, the three **hidden importers** (`src/index.ts` barrel · `api/chat/route.ts`'s
>    `answerQuestion` short-circuit — `CC-69` · `api/health/route.ts` — `CC-71`), the `opencode:`
>    service blocks (3 compose files) + `OPENCODE_URL`/`OPENCODE_MCP_URL`/`OPENCODE_PORT` + the CI
>    build step; rewrite `door-only-way-in.test.ts` (≥6 assertions hard-code the engine set) and the
>    four suites that assert the default is `opencode`. **`CC-72`'s warning is binding: "opencode"
>    names two things** — the engine (delete) and the model-provider naming vestige
>    (`opencode-provider.ts`, `OPENCODE_PROVIDER`/`OPENCODE_MODEL`/`OPENCODE_*_API_KEY`,
>    `api_keys.opencodeSessionId`) which must **NOT** be deleted — a naive `grep -ri opencode | xargs rm`
>    breaks model selection.
> 3. **The `hermes-local` retirement** (`CC-74`, trigger fully met) — the `mercato-hermes-data-local`
>    volume stays until the owner says so (rule 11).

**Why it stopped there — the measured hazard that gates its first step (rule 11: the owner decides
the *what*):**

- With the worker's **default** toolset set, the prompt measures **~16,757 tokens**;
- a cold prefill at the measured **~5.5 tok/s** puts a first turn at **≈3000 s**;
- that **exceeds the worker's own `HERMES_LOCAL_STREAM_STALE_TIMEOUT: 2400` ceiling** — the value
  `P2-7` measured as the prefill grace;
- the `P2-9a` live proof pinned `HERMES_TUI_TOOLSETS: open-mercato` to isolate the capability, so it
  does **not** claim a production-shaped default-toolset turn.

**The trade to put to the owner before any code:** **(a) raise the stale-timeout ceiling** to cover
the real prompt, or **(b) shrink the offered toolset** so the prompt fits the current ceiling. Both
are defensible; they trade latency tolerance against capability — a product decision, not a
technical one. Recorded in the plan §2.15.1, and to be **re-measured, not assumed**, as step one of
the build (rule 0b).

**Measured in the pinned worker (2026-10-14, research turn) — what each side of the trade actually
costs, so the decision rests on facts:**

- **The default is the worker's own built-in set, not the platform's.** With
  `HERMES_TUI_TOOLSETS` unset the gateway resolves the platform default `hermes-cli`
  (`hermes_cli/platforms.py:15` → `toolsets.py:203` → the static `_HERMES_CORE_TOOLS` bundle,
  `toolsets.py:11-39`): **55 tools** — web ×2 · browser ×18 · terminal ×2 · file ×4 · skills ×3 ·
  kanban ×14 · and one each of vision, image_gen, tts, todo, memory, session_search, connections,
  clarify, delegation, cronjob, computer_use, code_execution.
- **Most of it was already un-callable in this deployment.** `kanban` is default-off on this
  platform (`hermes_cli/tools_config.py:110`), and every remaining tool carries a runtime
  `check_fn` (`tools/registry.py:739`): browser needs a browser install or the extension
  (`tools/browser_tool.py:1317`), web needs a search-provider key (`tools/web_tools.py:562`),
  image_gen needs FAL, tts an audio key, connections the managed gateway, computer_use a
  cua-driver — none of which this compose sets. **The callable default was the local subset:
  file, terminal, skills, todo, memory, session_search, clarify, delegation** (+ code_execution
  when its sandbox check passes).
- **Pinning is a selection, not a deletion.** The toolsets ship static in the image. The choice is
  the comma list `HERMES_TUI_TOOLSETS` (`tui_gateway/server.py:2056`), validated against built-ins
  **and enabled MCP server names** (`tui_gateway/server.py:2007-2046`); the persisted form is
  `platform_toolsets.cli` in the worker's config, the subtraction is
  `agent.disabled_toolsets`, and `all` means no restriction — auto-picking toolsets a future image
  adds (`toolsets.py:385-392`). **Re-enabling costs one env value and a container restart — no
  rebuild, no migration.**
- **Future tools have two open doors:** a new *platform* tool lands inside `open-mercato`
  automatically — the toolset IS the MCP server's discovered tools, so the 21 grows with the
  platform (proven live in `P2-9a`); a new *worker* capability is one more name in the same comma
  list.
- **A bonus of the pin:** the chat-serving worker stops offering shell/file tools to the model —
  a smaller attack surface for a process whose job is to serve the platform's own tools.

### The Paperclip+Hermes study's verdict on our architecture (read in full 2026-10-14)

The owner asked whether the control-plane/worker split is really the best architecture or just the
concept we happen to have. The study (`library/paperclip-hermes-study/`, 11 batches, read in full
this day) answers with evidence, not loyalty:

- **CONFIRMED — the seam is right, and twice over.** Paperclip, the closest product in existence to
  our agent half, is a control plane that defines only `invoke/status/cancel` and never owns the
  runtime (batch 01; `doc/SPEC.md:240-248`, `doc/GOAL.md:54`). The sibling's own ADR-001
  (`reboot/12-ARCHITECTURE-DECISION-COMPANAI.md`) reached the same shape independently: an
  `AiRuntimePort` of six narrow ports, browser never talking to Hermes — the same port name and
  shape our `lib/ai-runtime-port.ts` implements. L-01: the seam is the load-bearing decision.
- **FALSIFIED — the study's own claim that our advantage is "Hermes in-process".** Our Hermes is a
  digest-pinned **worker container** behind the ws door (P2-8), and the study's binary (in-process
  write-through vs HTTP-with-only-the-DB) is false for Hermes anyway: the pin ships a session REST
  surface (`/api/sessions/{id}/chat` + history, `api_server.py:3613-3614`). Corrected in
  `findings/10` §8 (rule 13). Our hybrid — external pinned worker + in-worker seam
  (`ws_host.py`/`mcp_bootstrap.py`) — gets the write-through **without** giving up the boundary.
- **The owner's settings instinct: right in direction, refined in mechanism.** The sibling answered
  this exact question (INV-03): ~19 of 122 Hermes capabilities reach the end user; ~46 admin
  settings converge on **declarative `FieldDef`s with a `secret` flag**, exposed as declarations
  rather than hand-built screens; iframing/proxying the Hermes dashboard rejected for four reasons
  (one profile, its own auth, destructive operations, second admin authority). D-07: hire/provisioning
  is a **server transaction**, never an ops script. So: settings must be product-reachable and
  changeable (the instinct) — as a curated declarative subset with one canonical owner per fact
  (the discipline). This refines `CC-82`: the generic config editor stays rejected; the positive
  pattern to adopt is the declared subset.
- **Warnings that map onto our live work.** D-06 "two owners of one fact … produces no error — only
  a system that quietly disagrees with itself" is exactly `CC-82`'s measured smell
  (`OM_AI_PROVIDER` inert on the worker). D-04: never fold model/config into a session key —
  directly constrains `CC-82`'s "model first" widening, or a per-agent model change would silently
  fork the worker session. R-11: per-employee containers caused the sibling's adopted-container
  incident — we are on the right side (one shared worker). L-16: copy `usageBasis`
  (per_run | session_cumulative) when usage accounting lands. Batch 03 (the owner's most-watched
  batch): when we build the task layer, a wake is a durable row, one typed funnel, schedule → work
  item, capped catch-up, conservative recovery that never silently reassigns.
- **Rooms, when they come:** a room is **one session per agent** — a shared Hermes session is
  impossible (N-03, no author column); every message carries its speaker label (the merge is not
  optional); and Hermes already ships hosted rooms (128 members, event log, replica takeover) —
  look hard at them before designing our own (D-01, batch 07 §9).

### Open items that are scheduled, not blocking

- **`CC-83`** (registered 2026-10-14 from the study re-read): **`P2-9b` retires the only door that
  can write a session.** Measured: the ws door has no message-append RPC; the append primitive
  exists in the pin (`hermes_state_messages.py:449`); the one currently reachable write surface is
  `POST /api/sessions/{id}/chat` on the `hermes-local`/`gateway run` service — **the service
  `CC-74` retires in `P2-9b`**. Trigger: when the `P2-9b` build starts. Ranked: **(1)** land
  `session.append_messages` on our own ws bootstrap (the `ws_host.py` pattern) **before or with**
  the retirement — *recommended*; **(2)** keep hermes-local until (1) is proven; **(3)** retire
  first and rely on prompt compensation — rejected: it permanently forecloses D-05(a).

- **`CC-81`** (from `CC-73`'s critic): the base `AiToolDefinition`/`McpToolDefinition` docblock
  (`lib/types.ts:115`) is a **false statement in the tree** — a narrowly-typed tool is *not*
  assignable to `unknown` under `strictFunctionTypes`. Both fixes are a design decision (rule 11).
- **`CC-84`** (new 2026-10-14, from the owner's tenancy question): the worker's MCP tool calls
  authenticate as **one service identity** — the superadmin's `__mcp_server__` key
  (`mcp-ensure-api-key.ts` → `auth.ts` → every tool's `ctx`) — so a Hermes-served turn executes
  platform tools **outside** the conversation's tenant/user authority; and one shared worker home
  (`HERMES_HOME`) with no per-tenant profiles, though the door's session methods all carry a
  `profile`. Invisible in single-tenant dev; a cross-tenant authorization gap the moment a second
  tenant exists. Ranked fix + recommendation in the `COMPLETION-CALLBACKS.md` row; sequencing
  relative to `P2-9b` is a rule-11 decision.
- **`CC-82`** (registered 2026-10-14 from the owner's architecture question): **the port carries no
  settings** — measured, the Hermes wire is `session.create { idempotency_key }` + `prompt.submit
  { text }` and nothing more, so the worker's model/toolset are deployment env vars and a per-agent
  setting never reaches the engine that serves the chat. The recorded direction (owner, rule 11):
  the **platform is the single control plane** — settings UI → platform DB (tenant/agent-scoped) →
  applied per run through the port; the worker keeps only deployment-level engine settings. The
  next widening step is **model first**, measured against the worker's own session contract. A
  generic worker-config editor in the frontend is **rejected** (one global config file per
  container serving every tenant; the env pin makes a config write a silent no-op).
- **`CC-60`**: `business_ir.run_query` is live on the tool door (`POST /api/ai/tools/execute`) and
  MCP, but **no agent whitelists it** — there is no in-chat consumer yet.
- **`B-WS/B9`** — the widget architecture, end to end (the *design* track; `B-WS/B1`–`B8` of 10
  done; a design is never a build, so it moves no box — BR-4).

### The first moves for whoever picks this up

1. Read the `★ ACTIVE TASK` box in [`../../JOURNAL.md`](../../JOURNAL.md) — the live task record.
2. `P2-9b`'s requirement is **§2.15** of
   [`PLAN-HERMES-PHASE2-one-tenant-one-tool.md`](PLAN-HERMES-PHASE2-one-tenant-one-tool.md); its
   hazard paragraph is **§2.15.1**.
3. **Rule 0b — measure before building:** re-measure the default-toolset prompt size and the
   OpenCode deletion surface (the plan names every file class; confirm it in code).
4. Report the raise-ceiling vs shrink-toolset trade to the owner **before choosing** (rule 11),
   with ranked options and a recommendation — the reporting standard. **Done 2026-10-14:** the
   measured enumeration above is the decision input (what each side costs, that the loss is
   config-reversible, how future tools arrive); **the decision itself is still the owner's** —
   fold the enumeration into `P2-9b`'s requirement (§2.15.1) when the build starts.

---

## 0. If you are an agent taking over

**What you are inheriting.** A project whose **foundation phase is a real thing** — not a plan. It has
finished thinking, and it has *started* building: the **phase-0 foundation is complete and proven**
(the guard engine's registry is populated, the settings table exists, the third guard outcome
`escalate` shipped, and the **Metadata Registry** — the service that lets the gate *enumerate* objects —
is built, 2026-10-07). On top of that, the first slice of the permissions gate (**`SD-1`**) is built and
mutation-proven, and a long run of small "`CC-`" items has shipped — most recently **row 16's own-leg
(Option A, `CC-50`, 2026-10-11)**: an opt-in, per-entity **owner row-scope** (`ownerField`/`ownerFeature` on
`OrmEntityConfig`) plus a role-level **`.own`** feature-grant modifier, so a role granted e.g.
`api_keys.view.own` sees **only its own rows** (the row stays 🟡 — the team-leg is deferred as `CC-51`),
preceded by **`CC-47`**
(2026-10-10: the register's premise *"the human CRUD `GET`/list path has **no** per-entity permission
filter"* was **falsified in code** — the path **IS** gated by route-metadata `requireFeatures`, enforced
**403** by the dispatcher; `CC-47` added `crud-read-gate-coverage.test.ts` so a new list route cannot be
added un-gated — this closed **row 15's human-CRUD-list half**, so **row 15 is ✅**), preceded by **`CC-46`**
(2026-10-10: every one of the **53 searchable entities** now declares `aclFeatures`, enforced by a
coverage gate — that closed **row 15's ACL-coverage half**).
**PHASE 3 is COMPLETE on rows 7–9 and 13–15; PHASE 4 (row 14,
data classification) is **✅** — its **server** export leg is **CLOSED (`CC-45`, 2026-10-10)**, the custom-entity
client `view` export is **CLOSED (`CC-48`, 2026-10-10)**, and the **customer-tasks** export is **CLOSED (`CC-49`, 2026-10-10)**. **Nothing is blocked.** What is left is the build continuing in order, and **the task in hand is
named in the `★ ACTIVE TASK` box at the top of [`../../JOURNAL.md`](../../JOURNAL.md)** — the one place
that carries it (step 7, and the owner's instruction of 2026-10-06). The **live FRONTIER** (its
authoritative statement is [`platform_points.md`](platform_points.md)'s `▶ FRONTIER` box) is
**re-derived from the ONE NUMBER** — row 16's own-leg is built (`CC-50` closed; row remains 🟡 pending the
deferred team-leg `CC-51`), rows 17 (`CC-52`), 18 (`CC-53`) and 22 (`CC-27` core + `CC-55` narrowing + `CC-56`
confirm-path + `CC-57` in-process) are **✅
DONE** (the PHASE-5 batch is complete and **row 22 is now COMPLETE — no named leg remains**); **the named `CC-`
queue is EXHAUSTED**, so the next task is a **fresh pick from the vision order** (`platform_points.md` THE LIST),
and **it must be re-measured in code before building** (rule 0b). The only remaining `CC-` items are
trigger-gated: `CC-51` (row 16 team-leg — deferred by the owner's ruling), `CC-54` (index-time presenter —
awaits an index rebuild), `CC-19` (environmental — awaits CI).

**Six things to do before you touch anything:**

0. **Read [`../WHAT-WE-ARE-BUILDING.md`](../WHAT-WE-ARE-BUILDING.md) — the product in plain English.**
   It is short, it keeps the eye on the prize, and it tells you which documents are *ours* (the
   direction) and which are *imported study material* (evidence only). Do not skip it — the imported
   material in the library is twenty times the size of our own writing, and reading it "for context"
   is how the direction gets buried.
1. **Read this page, then §2 step 1 — tier A first, then tier B.** Six files fix the direction and the
   live decisions; their spine follows. **Tier C is opened only when the work needs it** — do not
   read the imported material "for context". **And read [`../../LESSONS.md`](../../LESSONS.md) — do not
   skip the lessons.** Every numbered entry (L1–L101 so far, `LESSONS.md` 3,385 lines — re-measured
   2026-10-10) is a mistake this project already made,
   written in its general form; it is a reading list you act on, not history.
2. **Set the environment export** (§2 step 2). Every terminal, every session.
3. **Confirm both repositories are clean** (§2 step 3), and that the stack is up (§2 step 4).
4. **Read the project's memory** (§6c) — it holds the rules that were learned the hard way, and
   **57 reusable techniques** the previous sessions wrote from this very project.
5. **Read the task in hand** — the `★ ACTIVE TASK` box at the top of
   [`../../JOURNAL.md`](../../JOURNAL.md) (§2 step 7) — and work it as a **package**: the standing
   **rule 10** in [`WORKING-RULES.md`](WORKING-RULES.md) (study the references → pick the relevant
   platform_points → write the combined requirement → **prove the prerequisites flawless in code
   first** → trace the impact and update the plans → execute under the TOTAL quality protocol), and
   the older narrative four-step sprint process in README §"The sprint process" — **no code before
   the requirement is written and the prerequisites are proven.**

**What you may not do.** The admin password is the owner's and he types it; you never write it to a
file or type it into a form. You never `git add -A`. You never take an irreversible action without
a checkpoint. You never close a decision that is his — see §6b. **And you may not leave a new trap
unrecorded: a mistake that was invisible from the code goes into [`../../LESSONS.md`](../../LESSONS.md)
in the same change as the work** (rule 7, §6 — the file binds in both directions).

---

## 1. The 60-second version

**What we are building.** An **operating system for companies** where human employees and AI
employees work side by side — one org chart, one task model, one set of rules about who may do
what. A business describes itself in plain language; the platform proposes a complete structure
(departments, roles, workflows, knowledge, AI workers); a human approves it; then the platform
*runs* that company day to day.

**The thing that makes it different is not the AI.** It is the **governance layer** — one place
that decides whether any actor, human or machine, may take any action, and can always explain
why. Every act is checked against every ceiling that applies, and the answer is always the
*minimum* of them: **nothing anywhere can raise a gate.** That property is what makes the platform
safe to hand to an AI — the floor under the product, not the product itself. It is
built, and it works.

**What already exists, in three pieces** (see [`ARCHITECTURE.md`](ARCHITECTURE.md)):

| Piece | What it is | Where |
|---|---|---|
| **The Starting Kit** | The platform/product. A permanent fork of **Open Mercato 0.6.7**, rebranded to Companai. The governance layer (authority, approvals, delegations, denials, trust, projects, record locks, the ledger) is **ours** and does not exist upstream | [`../../workspace/starting-kit/`](../../workspace/starting-kit/) |
| **Hermes** | The **agent runtime** — the thing that will hold the AI-employee half. It is *borrowed* (a sibling project's code), not ours | [`../ai/hermes-agent-main/`](../ai/hermes-agent-main/) |
| **The model server** | Local inference (llama.cpp) serving a quantised Qwen2.5-7B model on `:8080`. No cloud dependency. **The full model-layer design is [`ARCHITECTURE-model-server-integration.md`](ARCHITECTURE-model-server-integration.md)** (2026-10-05): the platform already owns a model control plane, llama.cpp needs one preset entry, and **the owner decided the long-term default on 2026-10-05 — per-tenant policy as the destination, cloud-first as the interim** (§9), which requires a platform-managed local model (§6.4) | [`ARCHITECTURE.md`](ARCHITECTURE.md) §5, and the integration document |

Two arrows connect them: **(1)** the agent reaches the platform's tools over MCP, authorised by
our own gate; **(2)** the agent asks the model server for inference. Both were proven working on
2026-10-04.

**One-line summary of where we are:** *the platform half is **bought**, the agent half is
**borrowed**, and the product half — the model spine and the data-level security — is **neither**,
and must be built.*

---

## 2. Day one — the exact sequence

**Do these in order. Do not skip the lessons.**

**1. Read these, in three tiers** (about two and a half hours total for tier A+B). They are ordered so
each one assumes the last. **Read tier A, then tier B. Open tier C only when the work in front of you
touches it** — the library holds roughly twenty times more imported material than our own writing, and
reading it "for context" is how the direction gets buried (see [`../WHAT-WE-ARE-BUILDING.md`](../WHAT-WE-ARE-BUILDING.md) §7).

> **In a hurry?** [`BOOKMARKS.md`](BOOKMARKS.md) is the one-page short list: the handful of
> documents that matter, the **end-game / vision** documents, and which folders are in git.

**Tier A — the ones that fix the direction, the current decisions, and where we actually are. Read them all first.**

| # | Read | Why |
|---|---|---|
| A1 | [`../WHAT-WE-ARE-BUILDING.md`](../WHAT-WE-ARE-BUILDING.md) | **The product in plain English** — the decisive loop, the three things a prompt can become, what it is *not*, and which library documents are **ours vs imported**. The eye on the prize |
| A2 | [`../../INDEX.md`](../../INDEX.md) | The map of every folder, and the rules that matter most |
| A3 | **This file** | What exists, where, and the traps |
| A3b | [`WORKING-RULES.md`](WORKING-RULES.md) | **The owner's standing rules, in one page** — the five that outrank everything (two routes or it is not a finding; **if it is ready to be switched on in the front end, switch it on**), how to report with a status, and how to ask. Read once, at the start |
| A4 | [`BACKLOG.md`](BACKLOG.md) | **What is left**, in order, one line each — the single plan |
| A5 | [`ARCHITECTURE-request-outcomes.md`](ARCHITECTURE-request-outcomes.md) | **The request-outcome taxonomy (G-21)** — the owner's core features_pack: a one-time answer, a model proposal, or a saved Function; the triage, and the gate that stops the AI reshaping the database on its own |
| A6 | [`../../compai/planning/00-product-thesis.md`](../../compai/planning/00-product-thesis.md) | **What we are building**, and the 15 rules that must never be broken |
| A7 | [`STATE-OF-PLAY-2026-10-07.md`](STATE-OF-PLAY-2026-10-07.md) | **Where the project really is, and what is next** — a whole-project snapshot with every figure measured by two routes. It is **dated (2026-10-07)**, so re-measure before quoting; it defers to the box for the live task |
| A8 | [`RESUME-POINT.md`](RESUME-POINT.md) | **A parking space, not a roadmap** — where the last session stopped, the honest open list (§3), and the standing rules in force (§5). Written for the last slice; **stale the moment it disagrees with the box** |
| A9 | [`COMPLETION-CALLBACKS.md`](COMPLETION-CALLBACKS.md) | **The register of every partial build** — the **gap**, the **prerequisite**, the ***Trigger ↔ checked at*** (the observable event + where it is checked), and the **callback** to run when the prerequisite lands (**rule 8**). **If you ship something partial, it goes here in the same change — never merely noted.** **And a callback closes in the same change that lands its prerequisite** (owner, 2026-10-09); run the file's re-measure block to reconcile. This is the file that stops a half-finished slice being forgotten |
| A10 | [`../workspace-architecture/README.md`](../workspace-architecture/README.md) → [`04-BRIDGE.md`](../workspace-architecture/04-BRIDGE.md) | **A SECOND LIVE TRACK: the workspace-architecture workstream (`B-WS`)** — the design of the dashboard & workspace widget architecture (owner's Message 6). **It is DESIGN, never code** — its builds are named `CC-*`/`G-*` items. **Read the bridge first**: it is the contract that binds this workstream to the spine (one live task · one numbering `B-WS/Bn` · every plan item registered · a design is never a build). **`04-BRIDGE.md` §4 is the answer to *"which document do I trace for progress?"*** |

**Tier B — the spine: how it runs, how the work is done, and the plan.**

| # | Read | Why |
|---|---|---|
| B1 | [`SPECIFICATIONS-DICTIONARY.md`](SPECIFICATIONS-DICTIONARY.md) | **The standard every change is checked against** — the project's MVC. **Read before making any architectural change.** The two clauses that may never be skipped: the permissions question (S2) and the tier question (S4/`S2`/`SD-1` (was “item 17”)). §C.2b: the tiers/defaults/fallbacks are a **superadmin setting**, not hardcoded |
| B1a | [`CORE-BOUNDARY.md`](CORE-BOUNDARY.md) | **What is uncustomisable core vs configurable vs domain packs** — the answer to *"what must nobody be able to change?"* Ring 1 (identity, tenancy, the resource envelope, the policy engine, audit, localization resolution, the contract shapes) moves only by platform release |
| B1b | [`ARCHITECTURE-structure-permissions.md`](ARCHITECTURE-structure-permissions.md) | **What the AI may do to the platform's own structure** — the object × verb × actor grammar (S11/S12), and why it plugs onto the existing mutation guard |
| B1c | [`BUILD-ORDER.md`](BUILD-ORDER.md) | **The order — contracts, then foundation, then stack.** The owner's instruction (2026-10-06): fix the sequence so foundational items are not deferred. **Phase −1** = the architecture contracts; **Phase 0** = the foundation completion — **now COMPLETE (2026-10-07):** **D0 ✅** (the generated guard registry delivers guards, mutation-proven, §2c), **D1 ✅** (the tier mapping / defaults / fallbacks are a superadmin setting, §2d), **D3 ✅** (the third guard outcome `escalate`, 2026-10-07, code `ba8a25c`), the **Metadata Registry ✅** (`59ab859`), and **`D2-gap` COMPLETE** (0 unguarded across the 35 enabled modules, §2f). **The live remaining defect is `D2-wide`:** **106 call sites** in **40 files** still bypass the registry via the `@deprecated` resolver (baseline 198; **every enabled module is retired** — `entities`, `data_sync`, `dictionaries`, `dashboards`, `workflows`, `inbox_ops`, `perspectives`, `translations`, `planner`, `query_index`, `auth`, `directory`, `feature_toggles`; all 106 remaining are in **parked** modules, recorded not migrated). **The plan is per-module, not a blind sweep — build-order §2e; the exact item being worked now is in the JOURNAL's Active-task box** |
| B1d | [`CORE-MODULES-REGISTER.md`](CORE-MODULES-REGISTER.md) | **What core modules exist, and whether they are REALLY built** — two-route verified, honest verdicts (COMPLETE / BUILT-UNEVEN / SHELL / ABSENT). Finance & procurement are ABSENT |
| B1e | [`BLUEPRINT-GAP-ANALYSIS.md`](BLUEPRINT-GAP-ANALYSIS.md) | **What the universal platform blueprint exposed in our plan** — four gaps (resource envelope, core/pack boundary, i18n/a11y contracts, a contracts phase), and what to adapt vs adopt from the generic standard |
| B2 | [`ARCHITECTURE.md`](ARCHITECTURE.md) | How the three pieces run together, and the dockerisation decision |
| B3 | [`ARCHITECTURE-hermes-integration.md`](ARCHITECTURE-hermes-integration.md) | **How Hermes attaches**, and the owner's **B-05** runtime-boundary decision (§11) |
| B3a | [`ARCHITECTURE-hermes-service-map.md`](ARCHITECTURE-hermes-service-map.md) | **The service map, per development item** — for **every** AI-touching piece, how Hermes *serves* or is *served* (as an agent, or as a setting), where **Llama** sits, and the honest status. **Written for a new developer — read this to see the whole wiring without a learning curve.** Covers the multi-tenant-vs-one-tenant challenge, multi-agents, integrations and MCP |
| B4 | [`ARCHITECTURE-model-server-integration.md`](ARCHITECTURE-model-server-integration.md) | **How models attach**, and the owner's **model-default** decision (§9) |
| B5 | [`SPEC-business-model-kernel.md`](SPEC-business-model-kernel.md) | **The product specification** — the vision's own 40-item gate; ratification only remains |
| B6 | [`../analysis/findings/12-development-plan.md`](../analysis/findings/12-development-plan.md) | **The plan** — phases, order, why |
| B7 | [`../../workspace/COOKBOOK.md`](../../workspace/COOKBOOK.md) | **How the work is done** — read before touching code |
| B8 | [`../../LESSONS.md`](../../LESSONS.md) | **101 mistakes already made (L1–L101)**, so you do not repeat them — read before you start, and add the next number before you finish |
| B8a | [`JOURNEY.md`](JOURNEY.md) | **How the project got here, in order** — the arc from the first brainstorm to the guard migration in hand, written forward. Read it to follow any conversation about this project as if you had been here since day one. **`JOURNAL.md` is the same story newest-first, with the dates and measurements; this is the readable version** |

**Tier C — supporting, opened only where the work needs it.**

| Read | When it matters |
|---|---|
| [`AGENT-HALF.md`](AGENT-HALF.md) | before any **agent-half** work (roles, tasks, delegation, triggers, conversations) |
| [`THREAD-2026-10-05.md`](THREAD-2026-10-05.md) | when you need **why this session decided what it did** |
| [`NEEDS-YOU.md`](NEEDS-YOU.md) · [`BLOCKERS.md`](BLOCKERS.md) | when you need **what needs the owner** or **what is stopping work** |
| [`RUNBOOK-*.md`](.) | when the work is **hosting, deployment, domains, or Sprint 0** |
| [`../ai/ai-first/`](../ai/ai-first/) | to see **the vision itself** (our direction). **Read its [`README.md`](../ai/ai-first/README.md) first** — the filename numbers and the README's document numbers are offset by one |
| [`../paperclip-value-study/findings/07-synthesis.md`](../paperclip-value-study/findings/07-synthesis.md) | when **taking an idea from upstream Paperclip** |
| [`../analysis/`](../analysis/), [`../paperclip-hermes-study/`](../paperclip-hermes-study/) | for the **evidence** behind a design claim — not for context |

**Then, before you write any code:** [`../../workspace/knowledge/authority-overview.md`](../../workspace/knowledge/authority-overview.md)
— the governance layer end to end. **Governance is the floor the product stands on, not the product itself**
(the product is the business model being compiled into working software — see
[`../WHAT-WE-ARE-BUILDING.md`](../WHAT-WE-ARE-BUILDING.md)).

**2. Set up your shell — every terminal, every session.** Node 24 is project-local and mandatory:

```bash
export PATH="/c/Users/Ramzi/Downloads/companai/workspace/.toolchain/node24:$PATH"
```

Wrong Node produces results that describe *the laptop*, not *the platform*. See
[`../../workspace/references/environment.md`](../../workspace/references/environment.md).

**3. Check both repositories are clean.** There are **two** git repositories (see §3a). Nothing
should be half-finished on disk:

```bash
cd /c/Users/Ramzi/Downloads/companai               && git status --short   # thinking + docs
cd /c/Users/Ramzi/Downloads/companai/workspace/starting-kit && git status --short   # the code
```

**4. Confirm the stack is up.** It was running when this page was written — eight containers,
the app on `http://localhost:3000`, loopback only:

```bash
docker ps --format '{{.Names}}\t{{.Status}}'   # expect 8 containers, every one "(healthy)" — a COUNT is not enough
curl -s --noproxy '*' -o /dev/null -w '%{http_code}\n' http://localhost:3000/login   # expect 200
```

**Do not trust the count.** On 2026-10-06 eight rows were present while `redis` had exited and
`mcp` was unhealthy — `docker ps` counted rows, not health. Read the **Status** column.

If nothing is running, **Docker Desktop must be started first, and only the owner can start it**
(see §5). Then bring the stack up per [`ARCHITECTURE.md`](ARCHITECTURE.md) §5.

**5. Run the gate, and read the `Cached:` line.** A green result *from cache* is not a green
result. `--force` for anything you are about to make a claim about:

```bash
cd workspace/starting-kit
corepack yarn generate && corepack yarn build:packages && corepack yarn typecheck && corepack yarn lint && corepack yarn test
```

Never pipe these through `head` or `tail` — you throw away the exit code.

**6. Check what needs the owner before you plan around it.** [`NEEDS-YOU.md`](NEEDS-YOU.md) is a
numbered action list. As of 2026-10-05 only **three** items are open, and none of them blocks the
build: change the Coolify password (`NY-5`), turn on Docker Desktop auto-start (`B-04`), and
optionally delete the 3.8 GB ISO (`NY-7`).

**7. Your task is in `JOURNAL.md`, not here.** Open [`../../JOURNAL.md`](../../JOURNAL.md) and read
the **`★ ACTIVE TASK`** section at the very top. **That box is the one and only place that says what
is being worked on now** — handover documents deliberately do not carry a task, because a task changes
every session and a stale one is worse than none (owner's instruction, 2026-10-06). The box also gives
the convention: **when a task is done, tick it and move it down, then post the next one there.**

Use [`BACKLOG.md`](BACKLOG.md) for *what is left as a whole* and [`BUILD-ORDER.md`](BUILD-ORDER.md) for
*the order it must be done in* — the Active-task box always says which of them is in hand, and why.

**Status you can rely on (the foundation is done; this is not "what is next"):** the four-item critical
path `spec ✅ → G-01 ✅ → G-02 ✅ → G-03 ✅` is complete, and `G-07` (the Widget contract), `G-17` (the AI
emits the Business IR), and `G-21` (the request-outcome taxonomy and its gate) are done. The
**The guard family (once the live defect family) is now closed:** **D0** ✅ (the generated registry now delivers guards),
**D1** ✅ (the tier mapping is a superadmin setting), **D2-wide** COMPLETE for every enabled module — the
**106 call sites** that still bypass the registry via the `@deprecated` resolver are **all in parked
modules** (recorded, not migrated; `entities`, `data_sync`, `dictionaries`, `dashboards`, `workflows`,
`inbox_ops`, `perspectives`, `translations`, `planner`, `query_index`, `auth`, `directory` and `feature_toggles` are retired), and **D2-gap**
**COMPLETE** — the write-verb sweep closed at **0 unguarded across all 35 enabled modules** on
2026-10-07, including a class the method-based scan could not see (a **GET that writes**; one fixed, two
read side-effects set aside by name). **`D3`** (the `escalate` outcome) is **DONE** on 2026-10-07 — the
guard result now carries a third outcome, `ok:true` + `escalation`, treated as *not performed* (no
mutation, no `afterSuccess`); additive, guard-level, no command-path change. The **Metadata Registry**
(the last Phase-0 foundation item) is **DONE** on 2026-10-07 (code `59ab859`) — the read-only service over
the kernel view, answering what exists / what type / provenance / what depends on it, with a **typed
absence** for the other §54 questions; **Phase 0 is now complete**. **`S-02`** (the Hermes tool door) is
**DONE** on 2026-10-08 (code `3add3a2`) — the authority resolver is now the AI tool door's enforcement
point: `checkToolAuthority` runs **after** RBAC (narrow-only, I4) and **fails closed**, gating both the
execute path and the pending-action **confirm** path; `enforce` is not armed for any tenant. The active task
is **`SD-1`** (the S2 permissions gate), **PARTIAL on 2026-10-08**: the **decision core is built and proven**
(the permission catalogue + a pure fail-closed gate in `shared/src/lib/permissions/`, and a `MutationGuard`
hook on the entities `create` path — 37 tests, 8 mutations RED-then-GREEN), but **the records the gate
produces are not written**, so it is **not yet an enforcement**; the batch / module-install / CLI create
paths are also ungated (plan `PLAN-SD-1.md`, limits §10). The reasoning is BUILD-ORDER §2e/§2f/§2; the counts are in BACKLOG.md and
`analysis/d2-gap/FINDINGS.md`.

**Verify an item's status is still true before starting it** — the roadmap has been wrong about what
is already done **four times**.

### What to study first, by role

| If your job is… | Study first |
|---|---|
| **Understanding the product** | `00-product-thesis.md` → `findings/01-vision-frame.md` → `findings/12-development-plan.md` |
| **Writing code** | `COOKBOOK.md` → `workspace/knowledge/` (20 concept files) → `workspace/references/environment.md` |
| **Running it** | `ARCHITECTURE.md` → `workspace/references/local-instance.md` |
| **Hosting / domains** | [`RUNBOOK-adding-a-domain-step-by-step.md`](RUNBOOK-adding-a-domain-step-by-step.md) → [`RUNBOOK-hosting-server-manual.md`](RUNBOOK-hosting-server-manual.md) |
| **Testing it** | `workspace/references/how-to-test.md` → `workspace/knowledge/test-gate.md` |
| **Picking up the analysis** | [`../analysis/PLAN.md`](../analysis/PLAN.md) → [`../analysis/LOG.md`](../analysis/LOG.md) → the `findings/` reports |
| **Designing the agent half** (AI staff, roles, tasks, delegation, triggers, meetings) | [`AGENT-HALF.md`](AGENT-HALF.md) — **the model and the plan** — then [`../paperclip-hermes-study/findings/10-lessons-and-target-design.md`](../paperclip-hermes-study/findings/10-lessons-and-target-design.md) — **the synthesis** — for the evidence behind each lesson, and its [`PLAN.md`](../paperclip-hermes-study/PLAN.md) for how it was derived |
| **Deciding whether to take an idea from upstream Paperclip** | [`../paperclip-value-study/findings/07-synthesis.md`](../paperclip-value-study/findings/07-synthesis.md) — **the answer of the second, wider pass.** Six things worth acting on, four of our items confirmed correct, eight rejections with a reason each, and the trap list |

---

## 3. The traps a newcomer cannot discover

**These are the things that will waste your first day if nobody tells you. Nobody can find them
by reading the code — they are facts about the layout and the history.**

### 3a. There are **two** git repositories, not one

| Repo | Path | Branch | Holds |
|---|---|---|---|
| **Repo 1 — thinking & docs** | `C:\Users\Ramzi\Downloads\companai` | `master` | `INDEX.md`, `JOURNAL.md`, `LESSONS.md`, `library/`, `compai/`, `workspace/` (the non-code parts) |
| **Repo 2 — the code** | `...\companai\workspace\starting-kit` | `main` | **every line of code we own** — 21 packages, 1 app |

**Every batch ends with a commit in *both* repositories, and files are staged explicitly by
path.** `git add -A` once swept **10,448 of the owner's unrelated files** into a commit. Never
use it here.

### 3b. **Two different products are called "Companai"**

One is ours. One is a **sibling project** that happens to share the name. If you are about to
read a "Companai" document, **check its path first**:

- `aissistant-package/` at the root — ⚠️ **NOT OURS.** The sibling's codebase (a Paperclip fork). Do not edit, do not deploy from it.
- `companai.md` at the root — ⚠️ **NOT OURS.** A sibling document. It *reads* as a vision statement for our product. It is not one. It is the most misleading file in the folder.
- `library/ai/hermes-docs/` — a sibling's docs. **Lessons only, never decisions.**

Full evidence and the glossary: [`../analysis/findings/00-inventory.md`](../analysis/findings/00-inventory.md)
and [`../ai/README.md`](../ai/README.md). **Read the AI README before using any AI document.**

### 3c. **Naming traps — do not "fix" these**

- The outer folder is **`companai`**, the inner one is **`compai`**. Different spellings, both
  real. Paths depend on both.
- The owner's domain is **`corprorate.com`** — the misspelling is **deliberate and
  owner-confirmed.** Do not correct it.
- Item numbers (`15b`, `21c`, `24b`) are **not a sequence** — they grew by insertion. A gap does
  not mean something is missing.

### 3d. `vms/` is **gitignored** — and that matters

`.gitignore` line 105 excludes `vms/`, because it holds the VM credentials, a 4 GB ISO and a seed
ISO. **Consequence:** anything written there is **untracked** and dies with the laptop's disk.

**This was already fixed for the deployment scripts.** Their durable copy lives at
[`../../workspace/scripts/vm-platform/`](../../workspace/scripts/vm-platform/), and
`check-in-step.sh` proves the tracked copy still matches the working copy:

```bash
sh workspace/scripts/vm-platform/check-in-step.sh   # prints "in step", exit 0
```

**If you add a script to `vms/`, copy it into `workspace/scripts/vm-platform/` in the same
batch** — and check it for secrets *before* copying, not after.

### 3e. Node 24 is project-local, and the export is mandatory

`workspace/.toolchain/node24` is a private Node 24 install. **The system Node is 22 and the
platform refuses to run on it.** Every command in every terminal begins with the export in §2.
This is not optional and not a preference.

### 3f. `where_we_left.md` and `PROGRESS.md` are stale — by their own admission

- [`../../where_we_left.md`](../../where_we_left.md) is a **2026-08-13 snapshot**, self-labelled
  out of date. Keep it only for its *traps*, *"things that look broken and are not"* and *"how to
  work here"* sections — those are still accurate.
- `workspace/PROGRESS.md` has **three overlapping checklists that disagree with each other.**
  Trust [`BACKLOG.md`](BACKLOG.md) for status; use `PROGRESS.md` only for the *reasoning* behind
  an item.
- [`BLOCKERS.md`](BLOCKERS.md) **is** current and re-checked each session.

### 3g. Things that look broken and are **not**

- **The admin dashboard is empty.** Deliberate — upstream's widgets all read parked modules, so
  they are disabled rather than render ten red panels. Fixing it properly is backlog item **27**.
- **Fourteen modules are parked, not deleted.** Switched off in `apps/mercato/src/modules.ts`;
  they create no tables and serve no routes, but stay readable and restorable in seconds. See
  `workspace/references/parked-modules.md`.
- **Only `packages/enterprise` was ever actually deleted** — its licence forbids redistribution.
- **The MCP logs `Failed to index 21 tools … Invalid OpenAI API key`.** **Root-caused 2026-10-05, and
  the old description was half the story** (**B-16**). That error text is OpenAI's own code, so the
  call never reached our server: the **`mcp` service is missing `OPENAI_BASE_URL`** (it is set for
  `app` and `opencode` and not for `mcp`). The second, also-real defect is that the `model` service
  has no embedding model. All 21 tools register and are callable; only semantic search over tools is
  degraded. See [`ARCHITECTURE-model-server-integration.md`](ARCHITECTURE-model-server-integration.md) §6.2.
- **You may have been told database behaviour is "unprovable on this host". It is not.**
  A **live Postgres 17** runs in the container **`mercato-postgres-local`** (`pgvector/pgvector:pg17-trixie`),
  database `open-mercato`, and you can measure against it directly:
  `docker exec -i mercato-postgres-local psql -U postgres -d open-mercato` (the connection string is in
  `workspace/starting-kit/apps/mercato/.env:11`). **This is how the 2026-10-08 `CC-30` defect was
  settled** — the index shape and the `ON CONFLICT` behaviour were measured, not inferred, and two
  written premises were corrected as a result. **Before you tell the owner something about the database
  cannot be checked, check it.** (For anything experimental, work in a throwaway schema and drop it.)

### 3h. The one rule that matters most

**Every claim comes with an observation attached, not an argument.** The work that held up was
verified by *watching it happen* — loading the page, breaking the test to see it fail, reading
the database, reading the `Cached:` line. **The work that had to be retracted was reasoned from
reading code.** If you are about to say "the cause is X" and have not observed X, you are
guessing. See `COOKBOOK.md` rule zero-nine.

### 3i. Folders on disk that are **not** in git

**The repository versions our thinking, not everything on disk.** A few folders the design depends
on were sitting in the working tree **untracked**, so a fresh clone would not have had them. Named
here so nobody assumes a folder travels with the repository when it only exists on this laptop:

- `llama/` (the eight documents the model-layer design was built from) and `analysis/` (the earlier
  Hermes / Starting Kit study) are **ours and are now tracked** (2026-10-05). Before that they were
  untracked, and both are cited by the development documents, so the citations pointed at files a
  clone would not have.
- `hermes-agent-main/` at the repository root is the **Hermes runtime source** (somebody else's
  code, ~17,000 files). It is **ignored** (2026-10-05), matching its twin `library/ai/hermes-agent-main/`.
- `library/ai/hermes-agent-main/`, `library/ai/hermes-docs/`, `library/ai/paperclip-master/`,
  `library/kit-docs/` and the 16 numbered shelves are **ignored by design** — rebuildable or
  external. The rule and the reasons are commented in `.gitignore`.
- `vms/` and `keys/` are ignored because they hold **secrets** (§3d).

**The full, honest list is [`BOOKMARKS.md`](BOOKMARKS.md) §5.**

---

## 4. Where everything lives — the folder map

```text
companai/                       ← repo 1 root (thinking + docs).  You are here.
├── INDEX.md                    the map of every folder — start here after this file
├── JOURNAL.md                  what happened, in order, with dates (4,673 lines; newest first)
├── LESSONS.md                  mistakes made, how they were caught (3,007 lines, L1–L89)
├── where_we_left.md            ⚠️ stale (2026-08-13) — traps only
│                               (THIS FILE is not at the root — it lives at
│                                library/development/HANDOVER.md, below)
│
├── library/                    EVERYTHING DOCUMENTED, IN ONE PLACE (3,441 markdown files, measured 2026-10-05)
│   ├── INDEX.md                what each shelf is, and the reading order
│   ├── PROVENANCE.md           where every shelf came from, how to rebuild it
│   ├── development/            ← DEVELOPMENT MANAGEMENT — the hub
│   │   ├── HANDOVER.md         **THIS FILE**
│   │   ├── BOOKMARKS.md        the pages to open first — the short list, and what is in git
│   │   ├── START-PROMPT.md     **the message that starts a new session**
│   │   ├── JOURNEY.md          **how the project got here, in order** — the story, forward
│   │   ├── README.md           the front door: reading order, the sprint process
│   │   ├── BACKLOG.md          **THE ONE ROADMAP** — everything left, in order
│   │   ├── ARCHITECTURE.md     how Starting Kit + Hermes + model server run together
│   │   ├── ARCHITECTURE-hermes-integration.md      the Hermes boundary design (B-05, decided 2026-10-05)
│   │   ├── ARCHITECTURE-model-server-integration.md  the model layer: llama.cpp, providers, embeddings (2026-10-05)
│   │   ├── BLOCKERS.md         anything stopping progress, with what clears it
│   │   ├── NEEDS-YOU.md        **numbered list of owner-only actions** (see §8)
│   │   ├── AGENT-HALF.md       **THE AGENT HALF** — five agent kinds, the responsibility rule, and where every lesson lands
│   │   ├── RUNBOOK-*.md        hosting: the manual, the domain walkthrough, Sprint 0
│   │   └── SPEC-business-model-kernel.md   the product spec (Draft 2; 40-item gate passed, ratification pending)
│   ├── ai/                     READ ITS README FIRST — two products are called Companai
│   │   ├── ai-first/           THE DIRECTION — what we will actually build
│   │   ├── hermes-docs/        a sibling's docs. Lessons only, never decisions
│   │   ├── hermes-agent-main/  the Hermes runtime source — where it disagrees with docs, it wins
│   │   ├── paperclip-master/   upstream Paperclip — the subject of **both** studies below
│   │   └── source-docs/        ONE PLACE for the scattered source docs (register inside)
│   ├── analysis/               THE ANALYSIS PROGRAMME — complete, batches 0–12 (13 batch reports)
│   │   ├── PLAN.md             the batch plan with tickboxes — all DONE
│   │   ├── LOG.md              one dated line per batch
│   │   └── findings/           one report per batch — **batch 12 is THE DEVELOPMENT PLAN**
│   ├── paperclip-hermes-study/ THE AGENT STUDY — complete, all 11 batches, 3,940 lines
│   │   ├── PLAN.md             the batch plan with tickboxes — all DONE, each with its result
│   │   ├── LOG.md              one dated line per batch
│   │   └── findings/           one report per batch — **batch 10 is THE SYNTHESIS** (see §2)
│   ├── paperclip-value-study/  THE VALUE SCAN — complete, all 12 batches
│   │   ├── PLAN.md             the batches, the rule ("document only where there is value"), the five baselines
│   │   ├── LOG.md              one dated line per batch, including the extraction verification
│   │   └── findings/           01–06 evidence, **07 is THE ANSWER** (see §2)
│   └── canonical-architecture-v2-hybrid-ai-coolify.md   the hosting architecture
│
├── compai/                     THINKING — no code
│   ├── brainstorming/          where the idea came from
│   └── planning/               the design (12 documents) — see its own README
│
├── workspace/                  BUILDING — where work happens
│   ├── COOKBOOK.md             **the development cookbook — read before touching code** (1,187 lines)
│   ├── PROGRESS.md             ⚠️ superseded by BACKLOG.md; keeps the reasoning
│   ├── knowledge/              HOW THE PLATFORM WORKS — 20 concept files
│   ├── references/             the detail behind the cookbook (environment, deployment, testing…)
│   ├── scripts/                checkpoint.sh, and vm-platform/ (the tracked VM scripts)
│   ├── .toolchain/node24       our own Node 24 — **use this, not the system Node**
│   └── starting-kit/           ← repo 2: THE CODEBASE (21 packages, 1 app)
│
├── vms/                        ⚠️ GITIGNORED — the hosting VM's credentials, ISO, scripts
├── keys/                       ⚠️ server credentials — not documentation, keep private
├── llama/                      OUR model-layer analysis — the 8 documents the design was built from (tracked 2026-10-05)
├── analysis/                   OUR earlier Hermes / Starting Kit study — 5 findings + a forensic baseline (tracked 2026-10-05)
├── hermes-agent-main/          the Hermes runtime source at the root (⚠️ IGNORED — vendored code; its twin is in library/ai/)
├── aissistant-package/         ⚠️ NOT OURS — the sibling's codebase
└── companai.md                 ⚠️ NOT OURS — a sibling document
```

---

## 5. The two machines, and how work flows between them

**This is the part that confuses everyone, because there are two computers and only one of them
is where you work.**

| | **The laptop** (`BIXMASERVER`) | **The hosting VM** (`Platform-Server`) |
|---|---|---|
| What | Dell Precision 7510, Windows 10 Pro, i7-6820HQ (4c/8t), 32 GB RAM | Ubuntu 24.04.5, a Hyper-V virtual machine |
| Reachable at | where you are | **`172.28.50.2` — and only from this laptop** |
| Holds | the code, the docs, Docker Desktop (Sprint 0 stack) | Coolify 4.3.23, Traefik v3.6.25, the hosted sites |
| Who can reach it | you | **only the laptop.** Hyper-V Internal switch `AI-Private`, no physical adapter |

**The VM is invisible to the LAN and to any cloud agent.** That is deliberate. **Deploying happens
from the laptop; visiting happens through a tunnel.** Keep those two paths visibly separate so
nobody confuses them.

**The network *does* have a real public IP — `151.177.174.17`** (Tele2 Sweden, confirmed by three
independent services from inside the VM). But **a public address is not an open door:** port 80
on that IP was probed from **three independent outside hosts** and all three failed to connect.
So nothing reaches the VM inbound today. **The working path to the outside is a Cloudflare
Tunnel**, which needs only *outbound* port 7844 — no inbound port, no router change.

**The hosting stack, in one line each:**

- **Coolify** — the control panel. You add a *resource* (a Git app, a Docker image, or a Compose
  file) and give it a **Domains** field. Coolify then writes Traefik labels for you.
- **Traefik** — the proxy. It reads the `Host:` header on each request and sends it to the right
  container. Entrypoints `http` (80) and `https` (443) are **separate sockets**.
- **The tunnel** — `cloudflared`, installed. It makes outbound connections to Cloudflare, which
  publishes your domain and forwards to the tunnel. The public SSL certificate is **Cloudflare's**.

**Two jobs, two places — do not mix them up:**

1. **Make the name resolve** → at the registrar / Cloudflare (the owner's job).
2. **Tell Traefik which container answers** → in Coolify (our job).

**There is no DNS server on the VM**, and none is needed. Nothing listens on port 53. Plesk
shipped one; this stack deliberately does not.

**The scheme trap.** In Coolify's Domains field, **`http://` and `https://` are not cosmetic** —
they pick which listener the router binds to. Behind the tunnel, use **`http://`**. Typing
`https://` binds the router to port 443 and adds a redirect, while the tunnel arrives on port 80
→ a redirect loop and a certificate job that cannot succeed. (This was measured; recorded as L79.)

**The hosting runbooks — read these if your task is domains or hosting:**

| File | What it covers |
|---|---|
| [`RUNBOOK-hosting-server-manual.md`](RUNBOOK-hosting-server-manual.md) | **The operator manual** — connecting from the laptop, DNS, directories, databases, phpMyAdmin, SSL, WordPress, deploying another Docker platform |
| [`RUNBOOK-adding-a-domain-step-by-step.md`](RUNBOOK-adding-a-domain-step-by-step.md) | **The practical walkthrough** — GoDaddy → Cloudflare → tunnel → SSL → a live site, with all three site types |
| [`RUNBOOK-platform-server.md`](RUNBOOK-platform-server.md) | The VM itself — how it was built, owner tasks, rollback, rebuild from scratch |
| [`RUNBOOK-companai-platform.md`](RUNBOOK-companai-platform.md) | **THE COMPANAI APP'S OWN DEPLOYMENT** — `https://companai.corprorate.com`: what is deployed and where, Coolify's exact role (reverse proxy only — **not** the deployer), how the app initialises, its accounts, the one credential fault found and fixed 2026-10-07, and the open deploy questions. **Read this before any change that touches the running platform** |
| [`RUNBOOK-deploying-a-site.md`](RUNBOOK-deploying-a-site.md) | The proxy and the deployment proof in depth — what is and is not proven |
| [`RUNBOOK-sprint0.md`](RUNBOOK-sprint0.md) | Sprint 0 — running the kit on the laptop |

### ⚠️ The live platform right now (`companai.corprorate.com`, measured 2026-10-09)

**Measured this session, two ways** (`curl` + the runbook's own expected responses):

- **The site is up:** `GET /` → **307 → `/login`**; `GET /login` → **200**. Correct.
- **The login is BROKEN for every real account.** `POST /api/auth/login` (must be **form-encoded** —
  JSON always 400s here, see the runbook §4) with a **known-existing** email → **HTTP 500** (~4 s);
  with an **unknown** email → **HTTP 400** (0.13 s). The contrast proves the fault is **after** the
  email lookup — the DB/decryption path — not the credential. **Until this is fixed, no account can
  log in, so handing over credentials would be handing over something unusable.** It is **action list
  A4** (top of [`../../JOURNAL.md`](../../JOURNAL.md)).
- **What is actually running is old:** image `open-mercato/app:wan`, built **2026-10-06 20:51** — so the
  live platform contains **none** of the `D2-gap` guard sweep **or** SD-1…SD-5. A redeploy ships all of
  it at once (the difference the owner wants to see is total, not incremental).
- **The redeploy is gated on a missing script, not timing:** the *recreate* half is known/safe, but the
  **build half is unscripted** — the image is built on the VM from `/home/ramzi/build-src`, a **plain
  file copy, not a git checkout** (runbook §1b). **Action list A5** writes and proves that path.
- **The real credentials** live in the **gitignored** `vms/CREDENTIALS.local.txt`, never in the repo or
  in chat: **superadmin** `admin@companai.local` / `wM8ciC9i8OBIM30KLlh2` (reset 2026-10-07); **admin**
  `admin@acme.com`; **employee** `employee@acme.com`. **Action list A7** hands these over — only after
  A4 makes login return **200**.

### The owner's two hard rules about the machine

1. **"So we don't ruin the laptop."** Prefer reversible actions; take a checkpoint before anything
   that touches the database (`./workspace/scripts/checkpoint.sh <label>`).
2. **The admin password is the owner's, and he types it.** It is **never written to a file and
   never typed into a login form by an agent.** This was committed to and honoured throughout —
   do not quietly relax it. Anything needing a click-through of the running platform needs him at
   the keyboard. Where a proof is needed, take it from container logs, the MCP's own tool list, or
   the database instead.

**Docker Desktop must be running for the Sprint 0 stack, and only the owner can start it.**
Docker Desktop's startup runs `wsl.exe`, which this machine's security policy blocks for anything
an agent launches — the block is **not approvable and must not be worked around.** `AutoStart` is
off, so this recurs on every restart. It is a **permanent owner step** ([`NEEDS-YOU.md`](NEEDS-YOU.md) row `B-04`).
*It is running as this page is written.*

---

## 6. The rules that bind

**Full text in [`../../workspace/COOKBOOK.md`](../../workspace/COOKBOOK.md)** — eleven rules,
`zero-zero` to `zero-ten`. These are the ones you must not break:

### 6a. The nine standing rules

1. **Never assume a decision the owner did not make.** A direction counts only when he was asked
   plainly and answered. If a better way exists, come back with a labelled **COUNTER-OPINION**.
   **But when the right answer is clear, just do it** — consulting too much is its own failure.
2. **One roadmap.** Never a second view that competes with it.
3. **No bandages.** Production and security standards, or it goes on the list.
4. **Fix small risk-free things immediately** — but establish the size *before* deciding, not after.
5. **Checkpoint before risky work.**
6. **Capture know-how in `workspace/knowledge/`** every batch. It becomes the agent's brain.
7. **Found issues go on the roadmap**, in the same edit that discovers them.
8. **Use the waiting time.** While builds run, use the platform. Never derail the main task.
9. **Testing instructions are click-by-click**, with verified URLs and expected results. Say
   plainly when a change is invisible.

### 6b. The project's own hard rules

- **Every claim comes with an observation attached, not an argument** (§3h). Measure from the
  artefact, not the description of it.
- **Reach every important answer by two genuinely different routes**, and make them agree.
  **Re-running your own check is not a second route.** If they disagree, say so — never average.
- **Bounce every conclusion off a critic whose only job is to prove it wrong.**
- **Documentation is updated in the same change as the work**, not afterwards. A batch that
  leaves the docs stale is not finished. This is COOKBOOK Rule zero.
- **`LESSONS.md` binds both ways — read it before you start, and add to it before you finish.**
  Every numbered entry is a mistake this project already made, in its general form. When a trap
  catches you — a defect whose cause was invisible from the code — append the next-numbered lesson
  **in the same change as the work**. **A session that hit a new trap and added nothing to
  [`../../LESSONS.md`](../../LESSONS.md) is not finished.** (Stated as a standing rule 2026-10-06
  after the owner asked whether the file was wired in or loose; see [`WORKING-RULES.md`](WORKING-RULES.md) §1 rule 7.)
- **Switch things off; do not delete them.** If something must be deleted, it gets a written
  analysis first — we already nearly lost the custom-domains feature because a module was
  labelled "CRM".
- **Reports are written for someone who was not there.** Full sentences, and the *why*, not just
  the *what*.
- **We never take updates from the original project again.** It is our code now.
- **`present_files` / commit in both repos, staged by path** — never `git add -A`.

### 6c. Where the project's memory lives — read this, it is not in the repo

The repository holds the *project*. The accumulated **memory and technique** live outside it (and
partly in a hidden folder *inside* it), and a new agent that does not know they exist will re-learn
them the hard way. **Paths measured 2026-10-08.**

| What | Where | What is in it |
|---|---|---|
| **Project memory (curated, LIVE)** | `C:\Users\Ramzi\Downloads\companai\.workbuddy-ai\memory\MEMORY.md` | The role and the work protocol, the project in one screen, and the hard rules — learned the hard way. **This is the current one**; it is inside the docs repo and is tracked. |
| **Daily session logs (LIVE)** | `C:\Users\Ramzi\Downloads\companai\.workbuddy-ai\memory\2026-10-06.md`, `…-07.md`, `…-08.md` | What each session did, what it measured, and what it left open. **The docs-repo copy is the canonical log.** A mirror copy is written under the worktree path below. |
| **Worktree memory mirror** | `C:\Users\Ramzi\WorkBuddy\Worktrees\companai\master-7662cc8f\.workbuddy-ai\memory\` | The same logs, mirrored by the tooling, plus a `worktree-divergence-*.patch`. Read it if the docs-repo copy is missing. |
| **Older project memory (superseded)** | `C:\.workbuddy-ai\memory\MEMORY.md` **and** `C:\.workbuddy-ai\memory\2026-10-0{3,4,5}.md` | An **earlier** memory location (last written 2026-10-05). Still readable for the session narrative, but **superseded** by the docs-repo copy above — do not treat it as the current state. |
| **Standing preferences (all projects)** | `C:\Users\Ramzi\.workbuddy-ai\user-fc59ba67-9898-4f99-81cd-ca8434b72894-personal\MEMORY.md` (beside `IDENTITY.md`, `SOUL.md`, `USER.md`) | The standing preferences that apply to every project, not just this one: the two techniques (**bounce every outcome off a third-person critic**; **reach every answer by two different routes**), how to ask questions, reply language (always English), and the status vocabulary. An older revision is archived at `C:\Users\Ramzi\.workbuddy-ai\archive\MEMORY-to-2026-09-21.md`. |
| **Reusable techniques — 57 skills** | `C:\Users\Ramzi\.workbuddy-ai\skills\` | Each is a hard-won method written **from *this* project**: proving a deploy reached the running process, catching a file that is imported but never committed, measuring before a blanket fix, resuming an interrupted agent thread, writing a handover a newcomer can follow. **Load the matching one before starting a task it covers** — the list grew from 50 to 57 in the 2026-10-07/08 sessions. |

### 6d. How to talk to the owner

He has said this more than once, so it is worth repeating:

- **Reply in English.** Always.
- **Plain, everyday words.** He is not a developer — no jargon, no "word salad". One short
  sentence of background at most.
- **Do not ask him to adjudicate technical decisions.** *"You are asking me highly technical
  questions that I have no clue what they are … and demanding me to have the call about it."*
  When a problem has an obvious safe default, **apply it, commit it, and tell him what changed
  and how to undo it** (`git revert <sha>`). Reserve his judgment for what is genuinely his: a
  **name, a domain, a cost, a preference.**
- **One specific thing at a time**, answerable in a word or a sentence. Give the answer, then at
  most one question.
- **A question he is holding is not yours to close.** If a decision is his, ask him or leave it
  explicitly open — never resolve it yourself and write it down as settled.
- **Every point you raise carries a status**: **FIXED** (and how you re-checked) · **WILL DO X** ·
  **OPEN — needs you** · **NOT AN ISSUE** (raised, then measured false). A point without a status
  is not a finding.

---

## 7. Current state — measured, not assumed

**Two groups below. Group A was re-measured on 2026-10-10 (revision 15) where a row says so; rows still
carrying their 2026-10-08 (revision 11) figures are marked. Group B is quoted from older
documents and was *not* re-measured — treat it as a starting point, not a fact.**

**Group A — re-measured 2026-10-10 (revision 15), except where a row says otherwise:**

| | |
|---|---|
| **Repo 1** (thinking/docs) | `master`, HEAD **`f48f0c3`** — **re-measured 2026-10-11**. It is the **`CC-61` documentation commit** (`docs(CC-61): row 19 done — the command contract made uniform`). *(The row-21/21b re-measurement commit follows this figure — a commit cannot name its own hash.)* *(Previous figures: **`00bbb08`**, the front-door sync to the `B-WS` bridge; before that **`33ca4a5`**, the bridge itself.)* |
| **Repo 2** (code) | `main`, HEAD **`3ff25376`** — **re-measured 2026-10-11**. It is **row 27's S8 signal** (`feat(request-outcome): row 27 / S8 — the repeat-detection similarity signal`): `request-outcome/repeat.ts` + its test. *(Previous figure: **`4c8eecfe`**, `CC-61`, re-measured 2026-10-11; before that **`83f88bd3`**, `CC-59`.)* **RULE-13 CORRECTION (2026-10-11):** this row had read `c03eca5c` while three later code commits (`CC-44` `3ba7b28f`, `CC-56` `0d52368f`, `CC-57` `1bb61557`) had already landed — the figure was stale by three commits. |
| **Codebase shape** | **21 packages, 1 app** (`apps/mercato`) — a monorepo (Yarn 4.17.1 + Turbo) |
| **Documentation** | **Tracked markdown: 1,094 repo-wide, of which 50 are in `library/development/`** — **re-measured 2026-10-10** via `git ls-files`. `library/` also holds thousands of `.md` files on disk — but most of that is **gitignored imported study material** (§3i), so **treat the disk figure as approximate: it drifts as untracked files come and go.** `LESSONS.md` (L1–L101, 3,385 lines), `JOURNAL.md` (6,777 lines) and `COOKBOOK.md` (2,961 lines) are the three long-form files. |
| **The studies** | analysis programme **complete** (batches 0–12, 13 reports); Paperclip + Hermes study **complete** (11 batches, 3,940 lines, 53 lessons) |
| **The specification** | **Draft 2** — of its 40 rows, **36 SETTLED · 1 DERIVED · 3 DEFERRED-with-trigger · 0 OPEN — owner**. The gate is passed; only ratification remains |
| **The foundation (phase 0)** | **COMPLETE (2026-10-07).** The four named guard-engine gaps are built and proven — **`D0`** (the registry is populated from an enabled module, proven by mutation), **`D1`** (the tier/defaults/fallbacks settings table exists — rules are no longer `.ts` code alone), **`D3`** (the guard result has a third outcome, `escalate`, treated as *not performed*), and **`GAP A`'s registry half** (the read-only **Metadata Registry**, code `59ab859` — it answers *what exists · what type · provenance · what depends on it*, and returns a **typed absence** for the other ten blueprint §54 questions). **`D2-gap`** (every write route that reached no guard) also closed: **0 unguarded across the 35 enabled modules**. **What remains of the foundation: `D2-wide`** — 106 call sites still use the `@deprecated` guard pair, **all in parked modules** (recorded, not migrated), and **`GAP A`'s `Resource` envelope half** — a Phase −1 contract, deliberately not built because a type with no consumer is the "contract after the code" failure. |
| **The first build slice past the foundation** | **`SD-1` Phase 1 is BUILT (2026-10-08, PARTIAL).** The **S2 structure-change gate**: when a new data structure lands (a table, a column, a field-type change), the platform must not apply it until the permissions for the new surface are decided — either a person decides, or the default applies (full grant to the superadmin role **and the permission records created**). Its decision core (`structure-change-gate.ts`), its hook (two `MutationGuard`s on the entities create path), and its **enforcement** (`permission-decision-grant.ts`, which writes the gate's `defaulted` records into the role's `role_acls.features_json`) are built, tested and mutation-proven across **every create path**, including the batch route, the shared primitive `ensureCustomFieldDefinitions`, the `add-field` CLI, the two HTTP reactivation routes, the entity-install primitive and all three field-type-change sites. **The remaining paths are scheduled** in [`COMPLETION-CALLBACKS.md`](COMPLETION-CALLBACKS.md) (`CC-20`, `CC-23`, `CC-27`; `CC-23` — the create-branch double-insert — is **BUILT 2026-10-09**; `CC-25` — the decision actor's permission — is **BUILT 2026-10-09**, awaiting the owner's confirm). Plan: [`PLAN-SD-1.md`](PLAN-SD-1.md). |
| **Where the build is now (2026-10-11)** | **PHASE 3 is COMPLETE on rows 7–9 and 13–15; the PHASE-5 batch is COMPLETE too — rows 15, 16 (own-leg), 17, 18 and row 22 (all four legs: `CC-27`+`CC-55`+`CC-56`+`CC-57`) are ✅. The named `CC-` queue is EXHAUSTED, so the live frontier is the *supplementary* core queue** ([`PLAN-SUPPLEMENTARY-CORE-QUEUE.md`](PLAN-SUPPLEMENTARY-CORE-QUEUE.md); the owner's 2026-10-11 go-ahead). **NOW: `CC-59`** — one caller for the **already-built** Business-IR compile+execute chain (measured, rule 0b: `runFunction` at `user-function/run.ts:112` is complete; the gap is **one caller**, not a chain; the shape is prompt → `authorBusinessQueryIr` → IR → `compileQuery` → `engine.query` → result; no persistence; **not** blocked on `CC-32`/`G-09`; merges with **`CC-58` Stage C**). **ALSO NOW: `G-22`** (the generic state-machine engine; Slice 2A built, Slice 2B paused as business work, rule 0b). **A second, *design* track is also live: `B-WS`** (the workspace-architecture workstream) — bound to this spine by the bridge (`04-BRIDGE.md`, Rule 16); **`B-WS/B1–B-WS/B8` of 10 done, next `B-WS/B9`**; then WS-1 B-perms / WS-2 B-studio. **A design is never a build (BR-4), so the design track moves no box.** Row 14 closed its export leg fully (server `CC-45`, custom-entity client `view` `CC-48`, and customer-tasks `CC-49` — all 2026-10-10); **row 15 (`P10`, the read layer) is ✅** — its tenant/org row **scope** is universal (`buildScopedWhere`), its permission half has **three real read gates** (the AI search tools' `authorizeEntityAccess`, backed by **all 53 entities declaring `aclFeatures`** after `CC-46`; one module's per-record owner-only gate; **and the human CRUD `GET`/list path itself**, whose route-metadata `requireFeatures` the dispatcher enforces with **403** — `CC-47` added `crud-read-gate-coverage.test.ts` so a new list route cannot be added un-gated). **RULE-13 CORRECTION:** the earlier text here said row 15 was "an *accurate* 🟡 … its one remaining leg … is open as `CC-47`" — that premise was **falsified in code** (the human path DID have a gate); and it said row 16 was the live IN-PROGRESS item — it is now ✅ on its own-leg. **The scoreboard is [`platform_points.md`](platform_points.md): one number, derived from the ticked boxes, never typed (§L `derive-counts`) — re-derive it after any change.** |
| **The runtime boundary (B-05)** | **DECIDED 2026-10-05 by the owner.** One product, one repository, one deployment, one interface (ours), with Hermes as a **supervised private runtime process behind the internal port**; Hermes is **headless**. Reasoning in [`ARCHITECTURE-hermes-integration.md`](ARCHITECTURE-hermes-integration.md) §11. The Hermes **profile** topology is deferred with the trigger **the agent gateway** |
| **The model default (`ML-1`)** | **DECIDED 2026-10-05 by the owner: per-tenant policy is the destination, cloud-first is the interim.** It turns three pieces of work from *nice* to *required* — the model registry, the Hermes **agent / persona / profile** mapping, and platform-managed local models. Reasoning in [`ARCHITECTURE-model-server-integration.md`](ARCHITECTURE-model-server-integration.md) §9 |
| **The running stack** | **8 containers up, all healthy** (app, mcp, hermes, model, opencode, postgres, redis, meilisearch) — **re-measured 2026-10-08** (`docker ps`), all up ~19 hours. The platform's own Postgres 17 (`mercato-postgres-local`) is **live**, so **database behaviour is directly provable on this host** (see §3g, and [`../../workspace/COOKBOOK.md`](../../workspace/COOKBOOK.md)). *Note the trap in the count itself: on 2026-10-06 `docker ps` showed eight rows while `redis` had exited and `mcp` was unhealthy behind it — **eight rows is not eight healthy**, so read the `Status` column, not the line count.* |
| **The local database** | **Rebuilt clean 2026-10-05** (3 users, 1 tenant, 1 organisation, 5 feature toggles, 5 `action_logs` rows; init ran green). Used in the 2026-10-08 `CC-30` work as a **live measurement target** — the `custom_entities_storage` index shape and the `ON CONFLICT` behaviour were measured against it, not inferred. |
| **Open blockers** | **3** — B-05 (OpenCode is load-bearing), B-16 (no embeddings endpoint), B-17 (no audit trail of agent tool calls). **None stops the build** (see [`BLOCKERS.md`](BLOCKERS.md)). **B-05's design face is now closed** (the boundary is decided); what stays open is *when* OpenCode goes, tracked as **N-8**. **B-16 was root-caused 2026-10-05** — it is two defects, the first being a missing `OPENAI_BASE_URL` on the `mcp` service |
| **Waiting on the owner** | **3** — Coolify password (`NY-5`), Docker Desktop auto-start (`B-04`), the ISO (`NY-7`, optional). **`ML-1`, the model layer's long-term default, was decided by the owner on 2026-10-05** (per-tenant policy as the destination, cloud-first as the interim), so it is no longer waiting |

**Group B — quoted from older documents, not re-measured:**

| | |
|---|---|
| **Starting Kit milestone** | *~80% done; the governance layer is complete and has screens.* **Source:** [`../../where_we_left.md`](../../where_we_left.md) — **a 2026-08-13 snapshot, self-labelled out of date.** **Still true as of 2026-10-08, but do not treat the "80%" as current** — the 2026-10-07/08 work (phase 0 complete, `SD-1` Phase 1) is not in it. |
| **Last gate run** | *Green, `Cached: 0`.* **But the two status documents disagree on the test count** (`where_we_left.md` says 12,924; `INDEX.md` says 12,898, both dated 2026-08-13). **Do not quote either — re-run the gate and read the number yourself.** (For orientation only: the `core` package alone measured **628 suites / 5,463 tests / 0 failures** on 2026-10-08, run as part of `CC-30`. That is **not** the full gate figure — the full gate spans both packages and the front end.) |
| **Hosting VM** | *Built and proven; directory-based hosting works, proven over public HTTPS.* **Source:** the hosting runbooks |

### What is **proven** vs **not proven**

**Proven** (by observation, on the dates shown):

- The governance layer decides, every autonomy gate binds, and a person can work the queue
  (Settings → Authority → Approvals).
- Hermes connects to the platform's MCP and discovers all 21 tools; the local model answers with
  a 65,536-token context.
- The local stack runs: **8 containers, all healthy** (re-verified 2026-10-08), the app serving on
  `http://localhost:3000`, loopback only.
- **The phase-0 foundation is real, not a plan** (2026-10-07): the guard registry is populated and
  delivers guards from an enabled module (D0, proven by mutation); the tier/defaults settings table
  exists (D1); the guard result has a third outcome `escalate` (D3); and the **Metadata Registry**
  answers what exists / what type / provenance / what depends on it (code `59ab859`).
- **The S2 gate's enforcement writes what it decides** (2026-10-08, `SD-1` Phase 1): the gate's
  `defaulted` records are merged into the role's `role_acls.features_json` **atomically** (one SQL
  `UPDATE`, `jsonb ||` deduped), proven against **live Postgres 17** with a concurrent-session test
  **and** a negative control (CC-16).
- **Database-level behaviour is measurable on this host** (2026-10-08, `CC-30`): the live
  `mercato-postgres-local` was used to prove the `custom_entities_storage` upsert fix end to end —
  a plain `ON CONFLICT` resolves against a plain unique index but **never** against a partial one;
  two tenants sharing an organisation id produce **2 rows**, not 1; a global-scope duplicate `INSERT`
  is rejected. The forensic's premises were corrected by these measurements twice (CC-28, CC-30).
- Directory-based hosting on the VM: each hostname serves its own directory; a file in one
  returns **404** on the other; a host-side edit appears live with no rebuild; the whole chain
  fetched from the laptop over public HTTPS (`200`, certificate valid).
- **Every searchable entity declares its ACL features** (2026-10-10, `CC-46`): all **53** searchable
  entities across 10 modules declare `aclFeatures`, each naming an **existing** feature in its owning
  module's `acl.ts`; a new coverage gate test fails if any entity omits it or names a nonexistent
  feature (proven RED→GREEN with an md5-identical restore). Search suite **26 suites / 269 tests green**;
  `tsc --noEmit` clean in `core`/`cli`/`checkout`; a separate-agent hostile-critic confirmed all seven
  claims. *(This is the **AI-tool** gate's coverage half. **UPDATE 2026-10-10: the human CRUD list path is
  now ALSO covered — `CC-47` built `crud-read-gate-coverage.test.ts` after the premise that it was un-gated
  was falsified in code; the path declares route-metadata `requireFeatures` and the dispatcher enforces 403.)*

**Not proven** (do not claim these):

- A **named tunnel on the owner's own domain** — only the temporary `trycloudflare` tunnels have
  been exercised.
- **Let's Encrypt at the origin** — the public certificate so far is Cloudflare's.
- A **real reboot** of the VM, and the **visitor's IP reaching the app**.
- The **GoDaddy → Cloudflare nameserver move** — the only thing still blocking the real domain,
  and it is the owner's action.
- **`D2-wide`** — the 106 parked-module call sites that still bypass the guard registry have **not**
  been migrated; they are recorded, not fixed.
- **`SD-1`'s remaining paths** — the enforcement consumer for a custom field's records (`CC-20`), the
  agent ↔ AI-user binding (`CC-27`) are **scheduled, not built**; the create-branch double-insert
  (`CC-23`) is **BUILT (2026-10-09, `53ed2e7b`)** — a DB-enforced unique index + one-statement upsert;
  the unauthorised-decision actor (`CC-25`) is **BUILT (2026-10-09, `d61d4f6`)** — the
  `entities.definitions.decide` role permission, enforced at all five carrier call sites — and awaits
  only the **owner's one-line confirm** (rule 11); its one honest edge is **`CC-39`** (the actor check
  reads live authorisation state inside a guard's `validate`). See
  [`COMPLETION-CALLBACKS.md`](COMPLETION-CALLBACKS.md).
- **Row 15 is ✅ (2026-10-10, `CC-47`) — but read the honest bound.** Its absolute claim ("every read is
  permission-filtered at the data layer") is met on the two surfaces it names: the **AI search tools**
  (`authorizeEntityAccess`, backed by all 53 entities declaring `aclFeatures` — `CC-46`) **and the human CRUD
  `GET`/list path** (route-metadata `requireFeatures`, enforced **403** by the dispatcher; `CC-47` added
  `crud-read-gate-coverage.test.ts` so a new list route cannot be added un-gated). **RULE-13 CORRECTION:**
  the earlier claim here — *"the ordinary human CRUD `GET`/list path has no per-entity permission filter"* —
  was **FALSE**, falsified in code. **The honest bound (in the test header, not hidden):** the guarantee
  covers the **human CRUD list family** (and the AI-tool gates), **not** every route that happens to export a
  `GET`; **161** of 457 route files are in neither assertion's scope and **all 161 are mutation endpoints**
  (POST/PUT/PATCH/DELETE) — **none exports a `GET`** — so none is a list read. *(Rule-13 correction,
  2026-10-10: this read "163 … overwhelmingly action/mutation endpoints (POST/PUT)"; the true count is 161,
  measured three ways. The union of the two assertions is exactly the 296 GET-exporting routes, because the
  60 `makeCrudRoute` routes are a subset of them.)*
- **Row 14 is ✅ — its server export leg (`CC-45`), its custom-entity client `view` leg (`CC-48`) and its customer-tasks leg (`CC-49`) are all DONE 2026-10-10.** Sensitive-field **marking** (15 module `defaultEncryptionMaps`
  persisted to `encryption_maps`), encrypt-at-rest/decrypt-on-read and the manage screen are all built and
  measured; **every server-side CRUD export path now consults the classification map and masks a marked field** (`shared/src/lib/crud/export-encryption.ts`, wired at the factory funnel + `entities/api/records.ts`), the **records-page `view` export is server-routed** (`CC-48`, `getUrl` + an `exportColumns` projection), and the **customer-tasks table is server-routed too** (`CC-49` — `interactions/tasks` gained a `?format=` export mode that **unions both entities' marked fields** and masks via an **alias map**, `todoTitle→title`, `todoDescription→body`, `displayName`/`customer.displayName`→`display_name`) so the mask applies to the aliased columns.

---

## 8. What is left, and whose move it is

- **What is left, in order** → [`BACKLOG.md`](BACKLOG.md). One roadmap. Read §"The list" and
  nothing else for *"what is left"*. **The task in hand is not stated here** — it is in the
  **`★ ACTIVE TASK`** box at the top of [`../../JOURNAL.md`](../../JOURNAL.md) (owner's instruction,
  2026-10-06), and the order it comes from is [`BUILD-ORDER.md`](BUILD-ORDER.md).
  **Done so far, in order:** the four-item critical path (`P0-spec`, `G-01`, `G-02`, `G-03`), plus
  `G-07`, `G-17` and `G-21`; the foundation items `D0`, `D1` (`S0` also done); the foundation's
  `D3` (the third guard outcome, `escalate`); **`D2-gap` COMPLETE** (the write-verb sweep closed at
  **0 unguarded across all 35 enabled modules**, 2026-10-07); **the Metadata Registry** (`GAP A`'s
  registry half, code `59ab859`) — **so phase 0 IS COMPLETE (2026-10-07)**; the first build slice
  past it, **`SD-1` Phase 1** (the S2 structure-change gate's decision core, hook and **enforcement**),
  built and mutation-proven 2026-10-08; **`AH-1`** (the `Agent` kernel object, 2026-10-09); and the
  **→2026-10-10 run of the vision-ordered skeleton — rows 7, 8, 9, 13 and 14 ticked ✅ (PHASE 3
  COMPLETE), `CC-23` and `CC-25` built, and `CC-46`** (every searchable entity declares `aclFeatures`
  + a coverage gate), **then `CC-47` closed row 15's human-CRUD-list half so row 15 (`P10`) is ✅ too**;
  the `CC-45` / `CC-48` / `CC-49` triple closed row 14's export leg fully. **→2026-10-11: the PHASE-5
  batch (rows 16 → 17 → 18) begins; row 16 (own/team row scope) is MEASURED + DECIDED (Option A) and
  building.** A run of smaller items shipped alongside — `CC-26` (the "AI user" tick in the
  API-key form), `CC-28` (the custom-record `updated_at` read-backs tenant-scoped), `CC-29` (a
  test-store reset), `CC-30` (the `custom_entities_storage` upsert given a real unique constraint),
  all 2026-10-08.
  **The scoreboard: [`platform_points.md`](platform_points.md) — `72 of 321 = 22%`** (derived from the
  ticked boxes, never typed). *(Corrected 2026-10-10: the headline had drifted to a typed `73 of 330`; a
  forensic re-derivation by two independent routes put it back to the boxes' true `72 of 321` — see §L. Re-derived again, unchanged, at the `CC-45`, `CC-48`, `CC-49` and `CC-47` closes.)* The **live FRONTIER** is re-derived from the ONE NUMBER — **`CC-47` is closed (2026-10-10)**, so the next is the earliest unstarted Phase-3/5 row (row 16 / row 17 / row 18); the *authoritative* statement of it is `platform_points.md`'s
  `▶ FRONTIER` box, and **`BACKLOG.md`'s box points to it, not the reverse.**
  **What is left to do, in one place, is `BACKLOG.md`; what is being done *now* is the JOURNAL box.**
  **Still open in the foundation:** **`D2-wide`** — 106 call sites still bypass the guard registry,
  **all in parked modules** (every enabled module is retired; the rest are parked and recorded, not
  migrated); and **`GAP A`'s `Resource` envelope half** — a Phase −1 contract, deliberately unbuilt.
  **Still open in `SD-1`** (each scheduled in [`COMPLETION-CALLBACKS.md`](COMPLETION-CALLBACKS.md)):
  **`CC-20`** (a custom *field*'s records have no enforcement consumer — blocked on `G-04`) and
  **`CC-27`** (the agent ↔ AI-user binding — now **unblocked**, since `AH-1` closed 2026-10-09; it is
  the FRONTIER's **NEXT**), plus **`CC-39`** (the CC-25 actor check reads live state inside a guard's
  `validate` — a named, minor contract deviation). **`CC-23` (the create-branch double-insert) and
  `CC-25` (the decision actor's permission) are BUILT (2026-10-09, `53ed2e7b` / `d61d4f6`)** — `CC-25`
  awaits the owner's confirm — *not* open rows. **A caution, measured 2026-10-08:
  `SD-3` (the tier mapping as a superadmin setting) is ALREADY BUILT (`[x]`, 2026-10-06, BUILD-ORDER §2d)
  — several documents still call it "the next slice", which is stale.** The next **undone** slice in
  BUILD-ORDER order is **`SD-2` / `S9`** (mark core functions and guard their deletion — startable, `G-07`
  is done), then **`SD-4` / `SD-5`**. **The order is [`BUILD-ORDER.md`](BUILD-ORDER.md)'s to state and the
  box's to post — do not re-derive it from a handover.**
  **The "one of three endings" is the owner's core features_pack (2026-10-06):** a prompt can end
  as a **one-time answer** (nothing saved), a **model proposal** (the prompt needs new structure — a
  field, an entity, a whole new service like LMS/CRM — and goes through the same validate → impact →
  approve → migrate gate, never on the AI's own initiative), or a **saved Function** (walked to
  provable correctness, named, placed in a grouping, then runs with zero AI). Two of the three are
  already in the vision; the **one-time answer was named nowhere** and the **triage had no home** —
  now **`G-21`**, built, with the design and six grilled questions in
  [`ARCHITECTURE-request-outcomes.md`](ARCHITECTURE-request-outcomes.md).
- **What needs the owner** → [`NEEDS-YOU.md`](NEEDS-YOU.md) — a numbered action list. **`NY-20` (which
  row-16 scope you want) is the one decision open**; it does not block the build (the owner answered it on
  2026-10-11: Option A). The most urgent *do* item is changing the Coolify admin password (`NY-5`); it is
  the only thing standing between an agent and the 2FA wall on the hosting panel.
- **What is scheduled but not finished** → [`COMPLETION-CALLBACKS.md`](COMPLETION-CALLBACKS.md) — the
  register of every **partial build**, each with its **gap**, the **prerequisite** that must land, **the
  *Trigger ↔ checked at* column** (the observable event that means the prerequisite has landed, and where
  a session checks for it), and the **callback** to run when it does (**rule 8**). **This is the file that
  stops a half-done slice being forgotten — and the one a newcomer must read before assuming "done" means
  done.** Anything shipped partial is here; if you ship something partial and it is not, that is the defect.
  **Two standing rules (owner, 2026-10-09):** (a) **a callback closes in the *same change* that lands its
  prerequisite** — a session that lands a prerequisite must re-read this register and close any row whose
  *Trigger ↔ checked at* names what it just did; (b) **run the register's re-measure block** (bottom of the
  file: plan coverage, unique/contiguous ids, the 5-column shape, and the step-5 `OPEN` reconciliation list)
  after every task that stops short of 100% **and** after every change that lands a prerequisite.
- **What the owner ruled on 2026-10-09** → the **★ ACTION LIST** at the top of
  [`../../JOURNAL.md`](../../JOURNAL.md) — his rulings on the callback register, the deployment, and the
  credentials, **in the order they are to be worked**. It is the live work queue; read it before picking an
  item. **Status is current as of 2026-10-09: A1 done; A2–A7 open.**
- **Where the last session actually stopped** → [`RESUME-POINT.md`](RESUME-POINT.md) — a **parking
  space**: what was just completed, the premise its own measurement disproved (the lesson), and the
  honest open list (§3). It is written for the last slice, so it is stale the moment it disagrees with
  the box.
- **A whole-project snapshot, measured two ways** → [`STATE-OF-PLAY-2026-10-07.md`](STATE-OF-PLAY-2026-10-07.md)
  — *"where is the project really, and what is the next thing?"* It is **dated (2026-10-07)**, so
  re-measure before quoting it, and it defers to the box for the live task.
- **What is stopping work** → [`BLOCKERS.md`](BLOCKERS.md) — re-checked each session, because a
  blocker is a claim about *now*. **Three open, none blocking.**
- **The product specification** → [`SPEC-business-model-kernel.md`](SPEC-business-model-kernel.md)
  — **Draft 2 written 2026-10-05, and the vision's own 40-item gate is passed**: **36 SETTLED · 1
  DERIVED · 3 DEFERRED-with-trigger · 0 OPEN — owner** (the tally is parsed from the 40 rows, not
  written by hand — `LESSONS.md` **L49**; the last open row, **B-05**, was approved on 2026-10-05). One
  code gap surfaced: the ledger carries no
  `policy_version`/`decision_id` (assigned to **G-16**). **Only ratification remains** (`P0-spec`, was “item 4” of
  [`NEEDS-YOU.md`](NEEDS-YOU.md)). **§10a records that `G-01` has now run the specification's central
  claims as measurements** — the ID grammar, the contract, the versions and the round-trip are tested,
  not merely stated.
- **How the agent half is designed** → [`AGENT-HALF.md`](AGENT-HALF.md) — the five kinds of agent,
  the rule that decides who is answerable when an agent acts, and where every lesson from the
  Paperclip + Hermes study lands in the four phases.
- **The model layer** → [`ARCHITECTURE-model-server-integration.md`](ARCHITECTURE-model-server-integration.md)
  — **the owner decided the long-term default on 2026-10-05**: per-tenant policy is the destination,
  cloud-first is the interim (§9). Three pieces of work follow from it and are now marked **required**:
  the model registry, the Hermes **agent / persona / profile** mapping, and **platform-managed local
  models** (§6.4). It also records two stated requirements: the open-source lane must not reserve a
  vendor's settings (§4.2), and the platform must be able to choose which local model runs (§6.4).

---

## 9. Maintaining this page

**This page is part of the work, not documentation about the work.** Whoever changes the
repository layout, the machine arrangement, or the front-door documents updates it in the same
change.

A newcomer who cannot orient themselves from this page plus [`../../INDEX.md`](../../INDEX.md)
alone means this page is broken — **fix the page, not the newcomer.**

**When you update it, keep §7's two-group split.** A figure you just measured and a figure copied
from an older document are not equally current, and mixing them in one table is how this page
goes wrong. If two older documents disagree on a number, say so — never average them.

*Last updated: 2026-10-11, revision 24 — **row 22's (`CC-55`) NARROWING leg: a binding's scope is now applied to the run (tools INTERSECT, features UNION, humans byte-identical).** Rule-0b first: `computeBoundRunScope` had **no production caller** (grep: only its definition + the unit test); `resolveAiAgentTools` built tools from the **full** `agent.allowedTools`; `checkAgentPolicy` enforced only `agent.requiredFeatures`; both routes dispatched the un-narrowed `agentId`. Built: an optional `boundScope` on `ResolveAiAgentToolsInput` + `RunAiAgentTextInput`/`RunAiAgentObjectInput`; `resolveAiAgentTools` intersects tools (agent list as base, never widening), enforces the feature union (throws `AgentPolicyError('agent_features_denied')`), and returns the **original** agent object when nothing narrows; both routes pass `computeBoundRunScope({ agentId, binding })`. A separate-agent hostile critic found **2 real defects**, both fixed: (1) the **coverage gate was blind to in-process dispatch sites** (it scanned only `api/ai/**`) — it now scans the **whole module** for dispatch *calls* and names the one known gap `lib/business-ir-author.ts` as **`CC-57`**; (2) the **"features UNIONED" test did not test the union** (it stayed GREEN when the enforcement was deleted) — rewritten. **6 RED-then-GREEN** mutations, md5-verified; `tsc` clean; **1374 tests pass** (the 2 `isolated-vm` suites are flaky/environmental). **Legs NOT built:** confirm re-check → **`CC-56`**; in-process dispatch → **`CC-57`**. ONE NUMBER **72 / 321 = 22% unchanged** (§L's tenth re-run). **Prior — revision 23 — row 22's (`CC-27`) CORE leg: an AI user can run only the agents bound to it.** The AI **actor** is an `api_keys` row issuing an `ai_worker:<id>` subject; the AI **agent** is **code-declared** (in-memory `Map`, zero DB reads); both dispatch routes (`api/ai/run-object`, `api/ai/chat`) took the agent id as a **raw request-body string with no binding check**. Built: an `ai_agent_bindings` table (one live row per `(tenant, org, principal, agent)` via two partial-unique indexes), a repository, a **fail-closed** `resolveAgentBinding` for `ai_worker` (passthrough for a human), **403 `agent_not_bound`** wired into both dispatch routes after the policy gate and before the runtime call, a manage surface (`api/ai/agents/[agentId]/bindings`, GET/POST/DELETE), and a coverage gate. A separate-agent hostile critic found **2 real defects** (the coverage marker list omitted the real dispatcher `runAiAgentText` — fixed so the gate derives its marker list from `agent-runtime.ts`'s own exports; the test `requirePrincipal` mock ignored `keyId` — fixed); **9 RED-then-GREEN** mutations, md5-verified; `tsc` clean; **1364 tests pass** (only the 2 pre-existing `isolated-vm` electron-ABI suites fail, proven at HEAD). **Lesson banked L116:** a jest positional path containing `[agentId]` is a **glob** that matches nothing — "no tests found" ≠ "all tests passed", so a mutation proof must assert the **test count**. **Legs NOT built (not claimed):** the **narrowing leg** (`computeBoundRunScope` built + tested but **never called** — a binding's tool/feature narrowing has no runtime effect) → **`CC-55`**; the pending-action **confirm** re-check → **`CC-56`**. ONE NUMBER **72 / 321 = 22%, unchanged** (§L's **ninth** re-run; both routes agree — new LIST row 22 has no fresh appendix marker). The live FRONTIER is now **`CC-44`**, then **`CC-55`**/**`CC-56`**. **Prior — revision 22: row 18 (`CC-53`) built the AI read path onto the human column-/row-level gates, completing the PHASE-5 batch (rows 16 → 17 → 18).**

*Prior — 2026-10-11, revision 19 — **the PHASE-5 batch (rows 16 → 17 → 18) begins; row 16 first; rule 9(a) strengthened; the CC-47 "in neither" count corrected 163→161.**
**Row 16 (own / team row scope) — MEASURED (rule 0b) and DECIDED.** Scope today is exactly `tenantId` + `organizationId` + `organizationIds` (`shared/src/lib/api/crud.ts` `buildScopedWhere`; `factory.ts` `withCtx()` `:1359-1412`); `auth.sub` is stamped into audit/event records 20+ times in `factory.ts` but **never used to filter rows**; there is **no `team` concept**; and there is **no shared owner column** (`createdByUserId` uuid vs `createdBy` varchar vs `assignedTo`/`assignedToRoles`) — so a blanket owner filter is impossible and row 16 must be an **opt-in per-entity `rowScope` declaration** (the `aclFeatures` pattern in `shared/src/modules/search.ts`). **Owner chose Option A** (`NY-20`) = own-only, opt-in, no team entity; **Option B (a real `team` entity + membership + UI + migrations) is documented as a FUTURE addition** (`PLAN-ROW16-own-team-row-scope.md` §7). Partial scheduled as **`CC-50`**. Rows 17 and 18 follow, each committed as it lands.
**Rule 9(a) STRENGTHENED (owner's instruction).** Ownership is of the **full codebase while you are working on it, not just your own diff** — any flawed/incomplete/bugged/error-carrying code, and any required test, is **fixed or scheduled**, never left as "pre-existing, not mine". Applied retroactively the same session: **`N-20`** (`openapi.test.ts` 3 failing tests, proven not caused by `CC-47`) and **`N-21`** (`structural-contracts.test.ts` is a ~17-min suite — `104/104` green with no bound, but a **suite-level FAIL** under a default bound) are now rows on BACKLOG's "do-not-lose-this" list.
**RULE-13 correction (rule 13).** The CC-47 test header's "files in neither" figure read **163** (the *pre-fix* value, before pass 12 widened the GET-export predicate 287→296); re-measured **three independent ways** (comment-stripped regex, TypeScript-AST walk, union computation `457 − |A∪B|`) it is **161**, and **all 161 export POST/PUT/PATCH/DELETE — zero export a `GET`**. Corrected in 6 places (code `48fc2191`, docs `a6d7c79`). The claim held; only the number was stale.
**Prior — 2026-10-10, revision 18 — row 14's export leg is FULLY CLOSED** (server `CC-45`, custom-entity client
`view` `CC-48`, and customer-tasks `CC-49`), **`CC-47` is CLOSED and row 15 is now ✅** (the human CRUD `GET`/list path
IS permission-gated — route-metadata `requireFeatures`, enforced 403; `CC-47` added `crud-read-gate-coverage.test.ts`; the
register's premise was **falsified in code**, rule 13), **so PHASE 3 is complete on rows 7–9 and 13–15 and the FRONTIER is
re-derived from the ONE NUMBER.**
**`CC-49`** made the customer-tasks export **server-routed** (`CustomerTodosTable.tsx` `view`/`full` → `getUrl`), and
`customers/api/interactions/tasks/route.ts` gained a **`?format=` export mode** that **unions the marked fields of BOTH
entities the rows draw on** (`customer_interaction` → `title`/`body`; `customer_entity` → `display_name`), flattens each row
to its exact column fields, and masks via a new **additive `ExportFieldAliasMap`** in `shared/src/lib/crud/export-encryption.ts`
(`todoTitle→title`, `todoDescription→body`, `displayName`/`customer.displayName`→`display_name`). **20 tests + 4 RED-then-GREEN
mutations (restores md5-verified); green gate: core 5635/5635, shared 2555/2555, customers-module (parked, via a temp config)
6883 pass / 1 pre-existing unrelated fail (`DealsKpiStrip`, proven failing on HEAD too).** **A hostile critic (separate agent)
found 3 REAL defects in the first draft — all fixed: H1 (critical)** the draft passed `'adapter:todo'` (a row **source tag**) as
the entityId, so the map returned nothing and the mask was a **no-op in production** — and its own test could not catch it
because the mock ignored `entityId` (now **entity-aware**); **H2** `serializeCsv` reads `row[col.field]` (flat), so the nested
`customer.displayName` column was blank and an un-projected `customer` **object** column leaked the name **in clear**; **H3** the
static guard was bypassable by a computed `['pre'+'pare']` + manual `Blob` export. **NOTE: the `customers` module is PARKED**
(not in `enabledModules`), so the normal `tsc`/`jest` gates do **not** cover it — verification used a temp config, and the changed
files were proved to add **zero** new type errors (125 prod errors before and after). **Prior — `CC-48`:** made the records page's `view` export **server-routed** (`records/page.tsx` `view.getUrl` + a new
**`exportColumns`** projection accepted by `entities/api/records.ts` → `ensureColumns`), so the `CC-45` mask
applies; **12 tests / 2 suites; 3 RED-then-GREEN mutations (restores md5-verified); green gate 417/49 core (shared
556/48 untouched); `tsc` exit 0 both packages.** A **hostile critic (separate agent)** found three things: the
first static guard was **too narrow** (a functional browser `prepare` leak in a sibling section passed it 4/4 —
**FIXED**, the guard now asserts **no `prepare:` at all**), the projection param first named `columns` would have
**silently dropped a custom entity's own `columns` filter field** (**FIXED** — renamed `exportColumns`), and —
the big one — **`CustomerTodosTable` genuinely leaks** via **aliased** marked fields (`todoTitle`/`todoDescription`/
`displayName`) whose true names (`customer_interaction.title`/`.body`, `customer_entity.display_name`) are marked
but whose aliases the mask never matches; **SPLIT OUT as `CC-49`** (reproduced by two routes). **SCOPE CORRECTION
(rule 13):** my first draft wrongly dismissed `CustomerTodosTable` after checking for a `customer_todo` entity —
the table actually reads `customer_interaction`. **Prior — `CC-45`:** adds
`shared/src/lib/crud/export-encryption.ts` and wires the mask at the single
funnel both factory list-export branches share (`maskPreparedExportForEntity`) plus
`entities/api/records.ts`; **the map is consulted on every server export path** and a marked field is
**masked**, with an absent/disabled service leaving the export **byte-identical** and a map read that
throws masking **everything**. **27 tests / 2 suites; 3 RED-then-GREEN mutations (restores md5-verified);
green gate 556/48 shared + 405/47 core; `tsc` exit 0 both packages.** That critic found two real defects: a
**silent miss** on header spellings like `Api Secret` (**FIXED** — canonical,
spelling-agnostic matching + regressions) and the **client-side `view` export** leak in
`ui/src/backend/DataTable.tsx:768` (then **SPLIT OUT as `CC-48`** — since **DONE**). **SCOPE
CORRECTION (rule 13):** two of the three callers the old row named as leaking could not (audit-log export =
metadata only; `entitiesCsvExport` = entity-metadata listing). **The scoreboard is UNCHANGED at
`72 of 321 = 22%`** — `CC-45`, `CC-48`, `CC-49` and `CC-47` closed callbacks/status flips, none added a new box
unit; re-derived by two independent routes (at all four closes). *(Revision 15's "moved 72 → 73 of 330" copied the
drift error; the boxes always gave 72 / 321.)*
**Row 15 (`P10`) is now ✅ (2026-10-10, `CC-47`)** — its absolute claim ("EVERY read is permission-filtered
at the data layer") is met on both surfaces: `CC-46` (all 53 searchable entities + a coverage gate) and `CC-47`
(the human CRUD `GET`/list path is gated by route-metadata `requireFeatures`, enforced 403, plus a structural
test). **RULE-13 CORRECTION:** the sentence that stood here — *"its absolute claim … also needs a gate on the
human CRUD list path, which `CC-46` did not touch; that last leg is `CC-47`"* — rested on a premise
**falsified in code** (the path DID have a gate). This revision re-measured §7 Group A (both repo HEADs, the tracked-markdown
counts) and folded a **rule-13 correction** through every document (`platform_points`, `BACKLOG`,
`BUILD-ORDER`, `COMPLETION-CALLBACKS`, `JOURNAL`): the long-quoted **"67 tables"** was wrong — the true
count is **53 searchable entities** (the "67" counted textual `entityId:` occurrences, 14 of them in
helper code inside `customers/search.ts`). **A note for the next agent:** several statements below still
carry their revision dates on purpose — a figure re-measured this revision says so; an older one keeps
its date so you can tell the two apart (§7's rule). (Revision 14, below, recorded the owner's 2026-10-09
rulings as the ordered ACTION LIST and the `CC-27`-is-blocked correction.)*

*Previous — 2026-10-09, revision 14 — **`A3` (CC-27) is BLOCKED, not next: a premise was corrected
(rule 13).** The agent ↔ AI-user binding *hangs off* **`AH-1`** (the agent as a kernel object), which was
**not built** at that date (`BACKLOG.md:107`, unchecked) — so CC-27 must not be built before AH-1. (By
revision 15, **`AH-1` is BUILT (2026-10-09)** and `CC-27` is the FRONTIER's **NEXT** — unblocked.) The
owner's **approval** of CC-27 (2026-10-08) stands; only the *order* was wrong (the action list had copied
the approval but dropped the blocker). The **startable next build was `AH-1`**; the **owner-facing next
step is `A6`/`A7`** (rebuild + deploy — unblocked by A4+A5, owner-gated). (Revision 13, below, recorded
**`A2` built**; revision 12 recorded the owner's 2026-10-09 rulings as the ordered ACTION LIST, the
register's mechanical linkage, and the live-platform warning block in §5.)*
*Previous — 2026-10-07, revision 11 — the `D2-gap` write-verb sweep COMPLETE; the platform's own
deployment now reachable from this page (0 unguarded across all 35 enabled modules, and the GET-that-writes
class found and fixed). §2 step 7, §7's two HEADs and §8 updated in the same change; §5 first pointed at
[`RUNBOOK-companai-platform.md`](RUNBOOK-companai-platform.md). Docs updated in the same change as the work
(COOKBOOK rule zero).*

*Earlier, 2026-10-06, revision 9 — **the second Paperclip pass is done, and it changed four
documents without changing any code.** A new study, [`../paperclip-value-study/`](../paperclip-value-study/),
read upstream Paperclip through a **wider lens** than the agent study: not *"how do AI workers get
work"* but *"is any of this worth taking, learning from, or deliberately rejecting?"* Its
[`findings/07-synthesis.md`](../paperclip-value-study/findings/07-synthesis.md) is the answer. It
found **six things worth acting on** and **confirmed four of our items were right** (`AH-3`, `AH-8`,
`AH-9`, `ML-4`). Two of the six **changed words we had already written**: **`ML-4` promised a mid-run
stop we have not built**, and **we had never drawn the orchestration boundary** Paperclip drew
explicitly and refused to cross. §2's reading table and §4's folder map gained the new study.
**Also: the owner answered the three open items** — Docker Desktop auto-start is **on** and the 3.8 GB
installer is **deleted** (both measured), so **`S0` is unblocked**; the Coolify password stays open by
his choice. Docs updated in the same change as the work (COOKBOOK rule zero).*

*Earlier, 2026-10-05, revision 8 — **the navigation layer a new agent needs now exists, and two
analysis folders the design cites are now tracked.** [`BOOKMARKS.md`](BOOKMARKS.md) is the new
one-page short list: the handful of documents that matter, the **end-game / vision** documents, the
two integration designs, and an honest list of which folders are in git. New **§3i** names the
folders that were sitting untracked — `llama/` and `analysis/` are now tracked, and the Hermes
source at the root is now ignored. §2 step 1 points at the short list, and §4's folder map gained
the new file and the root folders. Docs updated in the same change as the work (COOKBOOK rule zero).*

*Earlier, 2026-10-05, revision 7 — **the model layer's one owner decision is taken: per-tenant
policy is the destination, cloud-first is the interim** (`ML-1`,
[`ARCHITECTURE-model-server-integration.md`](ARCHITECTURE-model-server-integration.md) §9). It turns
three pieces of work from *nice* to *required*: the model registry, the Hermes **agent / persona /
profile** mapping, and platform-managed local models (§6.4). Two further owner requirements were
recorded: the open-source lane must not reserve a vendor's settings (§4.2), and the platform must be
able to choose which local model runs (§6.4). §1's model row, §7's decided and waiting rows, and §8
were updated in the same change as the design (COOKBOOK rule zero).*

*Earlier, 2026-10-05, revision 6 — **`G-03` is built: User Functions exist, and the four-item
critical path (`spec → G-01 → G-02 → G-03`) is complete. The next build item is `G-07` (the Widget
contract), which now also owns a Function's placement.** §2 step 7 and §8 were updated in the same
change as the code (COOKBOOK rule zero). A Function is compiled IR made durable: an enforced lifecycle
in which only `published`/`active` run, objective verification that calls G-02's compiler instead of
re-implementing it, a byte-stable document whose round-trip is empty, and **execution with no AI
argument at all**. **Three critic passes found four defects, all fixed** — one in the compiler (the
model version could not see a field being retyped) and one that let a sort be silently dropped. **One
hole is OPEN with a named trigger**, and a database row and the interface placement are deliberately
left to **G-07**.*

*Earlier, 2026-10-05, revision 5 — **`G-02` is built: the Business IR and the compiler exist, and
the next build item is `G-03` (User Functions).** §2 step 7, §7's spec row and §8 were updated in the
same change as the code (COOKBOOK rule zero). The compiler runs §51's ten stages as named steps, compiles
a `list` read into the `QueryOptions` the engine already runs, and the plan's test — **the rename test —
passes both directions**: the old IR against a renamed model **fails**, and the rename-aware entry says
**requires recompilation** and names the destination. The IR has **no scope field**, so it cannot widen
its own reach.*

*Earlier, 2026-10-05, revision 4 — **`G-01` is built: the Business Model Kernel exists in the
code repo (`ee406e8`), and the next build item is `G-02`.** §2 step 7, §7's spec row and §8 were
updated in the same change as the code (COOKBOOK rule zero). The kernel is a view over the platform's
own declarations, its round-trip test passes, and a drift guard proves the kernel's view equals the
installer's view.*

*Earlier, 2026-10-05, revision 3 — **`P0-spec` done: draft 2 of the specification passes the
vision's 40-item gate, and the first build item is now `G-01`.** §2 step 7, §4's folder map, §7's spec
row and §8 were updated in the same change as the specification itself (COOKBOOK rule zero). The spec's
tally is parsed from the 40 rows — `35 SETTLED · 1 DERIVED · 3 DEFERRED-with-trigger · 1 OPEN — owner` —
not written by hand.*

*Earlier, 2026-10-05, revision 2 — **rewritten for an agent taking over the development.**
Added §0 (the agent's first moves), §6c (where the project's memory and the 50 reusable techniques
live), and the `START-PROMPT.md` pointer. §7 re-measured: both repos clean at `30bde42` /
`962ae2a`, the library at 3,441 files, the study at 3,940 lines, the stack up with 8 containers and
a cleanly-initialised database, and **the open-items list re-measured rather than repeated — four
rows that read as open were already done** (the database reset, `apps/docs`, the CI wiring, and
the init proof), which is why `NEEDS-YOU.md` now shows three owner items, not seven.*
*(Correction, 2026-10-06: "8 containers" was a row count, not health — `redis` had in fact exited.
See §7 Group A, "The running stack", and COOKBOOK §"Sprint 0 — the re-run".)*

*Earlier, 2026-10-05, revision 1 — first version. Recorded the two-repository layout, the
two-products trap, the gitignored `vms/` and its fix, the host VM, the standing rules, and the
honest split between what is proven and what is not.*
