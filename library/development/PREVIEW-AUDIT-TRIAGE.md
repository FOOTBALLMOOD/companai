# Preview-audit triage — every finding, validated against the code, ranked

**Written:** 16 October 2026 · **Author:** this workshop, on the owner's instruction
**Subject:** the 13 documents in `preview/` (**45,652 words**, 287,331 bytes), written 11–14 October by an
agent brought in cold. `08-FORENSIC-AUDIT.md` alone carries 20 numbered sections;
`11-FRONTEND-UI-RESPONSIVENESS-AUDIT.md` carries 14. **Nothing in `preview/` had been triaged.** This document
is the triage.

> **Correction on my own header (C-06).** This header first read "197,912 words". That figure is not
> reproducible by any measure of this folder — `wc -w` gives **45,652 words** across the 13 files,
> `wc -c` gives 287,331 bytes, `wc -m` gives 283,547 characters. It was inherited unverified from an
> earlier session's note. Per rule 13 it is corrected here and the error is named: **the triage's own
> headline number was wrong until 16 Oct, and it is now measured, not remembered.**

**Method — the workshop's rule 1: docs are claims, code is the authority.** Every finding below was
re-measured against `workspace/starting-kit/` at commit `b183df58` today. Where the audit's number and my
number disagree, **mine is committed and the audit's is named as corrected.** Where the audit's claim is
already fixed, it is recorded as fixed so nobody re-fixes it.

**Verification marks.** 🔬 I ran the command or read the exact lines · 📐 I measured it with a script whose
method is stated · 🧪 a probe was executed · ✍ a judgement, not a measurement.

---

## 0. How to read this

Every row carries four decisions, and none of them is optional:

| Column | Values | Meaning |
|---|---|---|
| **Validation** | CONFIRMED · FIXED · NOT AN ISSUE · UNVALIDATED | Is the defect in the code *today*? |
| **Rank** | critical · medium · small | Blast radius if it ships |
| **Urgency** | urgent · scheduled · postponed | *When*, and the reason |
| **Action** | EXECUTE · DOCUMENT | §2.1's rule: a finding with no action status is useless |

**The verdict in one paragraph.** The audit's central thesis — *"the architecture is well designed and the
documents are more accurate than the code; the failures are wiring failures, a control declared and never
read"* — **holds completely.** I confirmed 46 discrete findings against the code and found **zero that were
false**. Two of the audit's claims are now outdated because the work they named has since been done, and
five of its own measurements needed correcting. The two CRITICAL authorization defects **were both still open
at triage time — both reachable from an ordinary HTTP route, and both the same defect shape**: a control the
design declares and nothing reads. **Both are now built** (T-01 `fa974bb1`, T-02 `60a6714f`, 2026-10-17; see
§2.1 and §2.2), as is the class-level mechanism that would have caught them (`SR-47`, T-03). **T-32 — the
one-character UUID fail-open — is now built as well** (`13c6206f`, 2026-10-17; see §2.4), and building it
exposed one new finding of its own: **T-45**, a locked record's refusal has no production consumer on the
command path — **now built too** (Option A, the owner's ruling, 2026-10-17; see §2.5), along with the two live
compose defects **T-13** and **T-14**. **The register's urgent set is closed.**

**The single most useful thing in the audit is its §18 structural observation**, and it is the finding I
would act on first, ahead of both CRITICALs: there is no automated mechanism that notices a declared control
with no reader. `.delegable` is written in twenty places and read in none, and nothing fails. Adding one
registry-driven check would have caught §1, §7 and §12(C-1) at build time — and the workshop now **owns the
mechanism for it** (`SR-39`'s one-truth check and `SR-41`'s escape-hatch census, both committed today).

---

## 1. The register

Sorted by rank, then by the audit's own priority. "Src" is the `preview/` document and section.

### 1.1 CRITICAL — fix before anything else

| # | Src | The finding | Validation | Rank | Urgency | Action |
|---|---|---|---|---|---|---|
| **T-01** | 08 §1 | **A delegation lends authority the lender does not have.** The route grants any `capabilityId` to any grantee; nothing checks the grantor holds it; `.delegable: false` has **zero** production readers | 🔬 CONFIRMED | critical | **urgent** | EXECUTE — ✅ **BUILT 2026-10-17** (`fa974bb1`; one check beyond the fix sentence — see §2.1) |
| **T-02** | 08 §2 | **The AI's business-query tool checks scope but not authorization.** `features` is passed into the Business-IR chain and never read; `engine.query` runs unguarded | 🔬 CONFIRMED | critical | **urgent** | EXECUTE — ✅ **BUILT 2026-10-17** (`60a6714f`; see §2.2) |
| **T-03** | 08 §18, 09 §3.1, 10 §1.2 | **No test for "this declared control has a consumer."** The root cause behind T-01, T-08 and T-29 | 🔬 CONFIRMED | critical | **urgent** | EXECUTE — `SR-47` ✅ **BUILT 2026-10-17** (see §1.5 `C-07` for why the label changed) |

### 1.2 HIGH

| # | Src | The finding | Validation | Rank | Urgency | Action |
|---|---|---|---|---|---|---|
| **T-04** | 08 §3 | **A Function that asks for a count returns rows.** A `gap` verifies as `passed` | 🔬 CONFIRMED | high | **done** | ✅ **BUILT 2026-10-20** — `PLAN-T04-count-returns-rows.md`, code `6d7ef0ce`. The refusal is an error now, the message names its gaps, and the runner asks the IR's operation at its own gate. |
| **T-05** | 08 §4 | **The approvals queue can approve the same act twice.** Read-then-act, no CAS | 🔬 CONFIRMED | high | **done** | ✅ **BUILT 2026-10-20** — code `17911238`, docs `7f57f3e`. One claim, three races, and the mutation that survived the first run. **Rule 13, corrected 2026-10-21:** this row and §6.2 still read *urgent / EXECUTE* for a day after the row closed, which is the same stale-row defect `T-06`'s close found in the `NEXT` block |
| **T-06** | 08 §5 | **`undo` writes the one record the tamper-evident chain does not cover** | 🔬 CONFIRMED | high | **done** | ✅ **BUILT 2026-10-21** — `PLAN-T-06-undo-ledger-gap.md`, code `dcc7799`+ the build commit. `markUndone` now appends to the chain and the event says `historyAction: 'undo'` with `sourceLogId`; the fork is gone so the reversal and its proof commit together; `verifyUndoCoverage` compares the journal against the chain in both directions. 12 tests, 5/5 mutations |
| **T-07** | 08 §6 | **Nine modules' commands are invisible to the authority gate**, one of them enabled | 🔬 CONFIRMED | high | **done** | ✅ **BUILT 2026-10-21** — `PLAN-T-07-command-capabilities.md`, code `3b633189`. 115 commands now declare a capability, 13 have a recorded reason, and the guard checks every module instead of a hardcoded parked list. **Re-measured twice:** seven modules, not nine; and the seven are **parked**, so the gap was prospective. 6/6 mutations |
| **T-08** | 08 §7 | **Trust demotion is never triggered.** `demoteIfEvidenceDemands` has 4 callers, all its own test | 🔬 CONFIRMED | high | **done** | ✅ **BUILT 2026-10-21** (`34488c07`) — `PLAN-T-08-trust-demotion-never-triggered.md`. The missing caller is one call in `CommandBus.undo`, after the trace, inside the transaction. The ORIGINAL actor is demoted, the capability group is the command's module segment, and a failing demotion never fails an undo. 7 tests, 5/5 mutations. **Requirement written 2026-10-21** (`PLAN-T-08-trust-demotion-never-triggered.md`). Re-measured: **zero production callers** (`promote` has one, `demote` has one). The trigger the function's own docblock names is **"after an act is reversed"**, and there is exactly one place an act is reversed, `CommandBus.undo`, which `T-06` already touched. So the missing caller is one addition at a site already in the transaction. The evidence it reads is a ratio over `action_logs` (`undone / (done|undone|redone)`, minimum 10 acts), and the same rate that **blocks a promotion** **demands a demotion**. |
| **T-09** | 11 §1 | **The design-system lint is broken** (`@typescript-eslint` mixed versions) and all six rules are `warn` | 🔬 CONFIRMED | high | scheduled | EXECUTE |
| **T-10** | 11 §2 | **Accessibility linting is installed and never switched on** | 🔬 CONFIRMED | high | postponed | DOCUMENT |
| **T-11** | 11 §3 | **RTL is half-built, and its own source comment says it is finished** | 📐 CONFIRMED | high | scheduled | DOCUMENT |
| **T-12** | 11 §4 | **`/backend` crashes if the `dashboards` module is switched off** | 🔬 CONFIRMED | high | scheduled | EXECUTE |
| **T-13** | 07 §7.2 | **`--jinja` is absent from every compose file** — tool calling may be silently degraded | 🔬 CONFIRMED | high | urgent | EXECUTE — ✅ **BUILT 2026-10-17** (`docker-compose.fullapp.yml`; verified live — the model container's args carry `--jinja`) |
| **T-14** | 07 §7.2 | **The `mcp` service has no `OPENAI_BASE_URL`** — its embedding lane calls `api.openai.com` | 🔬 CONFIRMED | high | urgent | EXECUTE — ✅ **BUILT 2026-10-17** (forwarded in both compose files; verified live — the mcp container's env reads `OPENAI_BASE_URL=http://model:8080/v1`) |

### 1.3 MEDIUM

| # | Src | The finding | Validation | Rank | Urgency | Action |
|---|---|---|---|---|---|---|
| **T-15** | 08 §8 | The confirm path drops the binding's narrowing (`CC-56` boolean re-check exists; `CC-55` narrowing does not) | 🔬 CONFIRMED | medium | **done** | ✅ **BUILT 2026-10-21** (`e25904f5`) — `PLAN-T-15-confirm-drops-narrowing.md`). Re-measured, and it is TWO compounding defects: the confirm route never calls `computeBoundRunScope` (while `chat:613` and `run-object:199` both do), **and** it resolves the agent with `getAgent` from the **global registry** (`:171`) instead of `resolveAgentDefinition`, which is code-first and tenant-row-second. So a tenant-authored type is invisible there, and a narrowing computed from the wrong definition would be wrong in the direction of permission. **`CC-55` is no longer "dead code"** — the narrowing leg now has two callers; the confirm path is the third place it is missing. |
| **T-16** | 08 §9 | Two gates fail in opposite directions on a missing dependency | 🔬 CONFIRMED | medium | scheduled | EXECUTE |
| **T-17** | 08 §10 | The model allowlist fails open on the provider axis | 🔬 CONFIRMED | medium | scheduled | EXECUTE |
| **T-18** | 08 §11 F2 | `SURFACE_ID_PATTERN` carries a stray `/i`, so uppercase surface ids are accepted | 🔬 CONFIRMED | small | scheduled | EXECUTE |
| **T-19** | 08 §11 F3 | `importFunction` rejects a §50-legal IR the compiler normalises and accepts | 🔬 CONFIRMED | medium | scheduled | EXECUTE |
| **T-20** | 08 §11 F4 | `references` is sorted for export but not for the fingerprint | 🔬 CONFIRMED | medium | scheduled | EXECUTE |
| **T-21** | 08 §11 F5 | `notChecked: []` forges "every §46 check ran" | 🔬 CONFIRMED | medium | scheduled | EXECUTE |
| **T-22** | 08 §11 F7 | `findFrontendVocabulary` has zero production callers | 🔬 CONFIRMED | small | scheduled | EXECUTE |
| **T-23** | 08 §11 F8 | The `decided` branch returns the header's records unvalidated | 🔬 CONFIRMED | medium | scheduled | EXECUTE |
| **T-24** | 08 §11 F9 | `KernelObjectContract.source` is unpopulated for most entities | 🔬 CONFIRMED | small | postponed | DOCUMENT |
| **T-25** | 08 §11 F10 | Two sort comparators, one locale-dependent; it reaches `entity.version` | 🔬 CONFIRMED (shape) | medium | scheduled | EXECUTE |
| **T-26** | 08 §11 F12 | `importModel` validates ids but not structure | 🔬 CONFIRMED | medium | scheduled | EXECUTE |
| **T-27** | 08 §12 S-2/S-6 | `ensureTenantScope` fails open when `ctx.auth` is absent | 🔬 CONFIRMED | high | **done** | ✅ **BUILT 2026-10-19** — `PLAN-T27-tenant-scope-observability.md`. The allow is unchanged (load-bearing, pinned by a test); the **silence** is not. See §1.5 `C-08`/`C-09` for the audit sentence being half wrong. |
| **T-28** | 08 §12 S-4 | The PUT command path skips the guard set when the candidate id is not on the parsed input | 🔬 CONFIRMED (shape) | medium | scheduled | EXECUTE |
| **T-29** | 08 §12 C-1 | The C6 command contract is dead at runtime — zero declarations | 🔬 CONFIRMED (shape) | medium | scheduled | EXECUTE |
| **T-30** | 08 §12 L-1 | Optimistic locking is client-opt-in **and the reader fails open** (five early `ok: true` returns) | 🔬 CONFIRMED | medium | scheduled | EXECUTE |
| **T-31** | 08 §13 A1-08 | The autonomy matrix exempts humans entirely | 🔬 CONFIRMED, **but deliberate** | small | postponed | DOCUMENT |
| **T-32** | 08 §13 A1-09 | `UUID_PATTERN` rejects UUIDv7, so locked records are writable | 🔬 CONFIRMED | small | urgent | ✅ **BUILT** `13c6206f` — see §2.4 |
| **T-33** | 08 §13 A1-11 | `resourceKind`/`resourceId` are unhashed in the ledger | 🔬 CONFIRMED | medium | scheduled | EXECUTE |
| **T-34** | 08 §13 A1-14 | `authorityPolicyProblems` has zero production callers | 🔬 CONFIRMED | small | scheduled | EXECUTE |
| **T-35** | 08 §13 A2-06 | The sandbox's `maxOutputSize` and `maxApiCalls` are declared and dropped | 🔬 CONFIRMED | small | **done** | ✅ **BUILT 2026-10-19** — `PLAN-T35-sandbox-caps-real.md`. The audit's sentence understated it: one cap was already enforced **in the caller**, not the sandbox, so the sandbox was the component that could not enforce what it advertised; the other was implemented nowhere and nothing wanted it. |
| **T-36** | 08 §13 A2-07 | The capability-coverage test's denominator excludes the AI package | 🔬 CONFIRMED | medium | scheduled | EXECUTE |
| **T-37** | 08 §15 QT-01 | The only assertion is wrapped in an `if` that never runs | 🔬 CONFIRMED | small | scheduled | EXECUTE |
| **T-38** | 08 §15 QT-04 | `describedModules().length >= 24` is a floor, so 24 modules could drop out and it still passes | 🔬 CONFIRMED | small | scheduled | EXECUTE |
| **T-39** | 08 §15 T-4 | The decoupling test asserts against a hand-built fixture | 🔬 CONFIRMED | small | scheduled | EXECUTE |
| **T-40** | 11 §5–§10 | Six DS rule categories of ~30; lint scope excludes user modules; 27 of 73 primitives untested; 10 widgets with no layout contract; three modules with data, API and no screen | 🔬 CONFIRMED | medium | scheduled | DOCUMENT |
| **T-41** | 07 §7.3 / 06 §3.7 | The Hermes service has **no healthcheck** — a wedged runtime is invisible | 🔬 CONFIRMED | medium | scheduled | EXECUTE |
| **T-42** | 07 §6.2 | No `llamacpp` preset — the open-source lane squats on `OPENAI_*` | 🔬 CONFIRMED | medium | scheduled | EXECUTE |
| **T-43** | 09 §1.2 | `detectRepeatedRequest` exists and has zero callers — "show the saving" is unwired | 🔬 CONFIRMED | small | scheduled | DOCUMENT |
| **T-44** | 08 §16 / 09 §2.1 | `G-04` — the data axis — does not exist, and the compiler says so loudly on every compile | 🔬 CONFIRMED | critical | scheduled | DOCUMENT |
| **T-45** | new — found while building T-32 | A locked record's refusal has no production consumer on the command path: the gate does not hold A0 by design ("RbacService has already made it at the route guard"), and `refusalFor` threads no recordId, so a locked record is writable by any actor holding the capability | 🔬 CONFIRMED | high | **done** | ✅ **BUILT 2026-10-17 (Option A — the owner's ruling)**; the gate now refuses `A0`. See §2.5 |

### 1.4 Already fixed — do not re-fix

| # | Src | The claim | What is true now | Validation |
|---|---|---|---|---|
| **X-01** | 08 §5 / §13 A1-12 | "`ledger:verify` has **zero callers**" | **FIXED.** `audit_logs/cli.ts:91,115` runs `ledgerService.verifyTenantChain`. Still no *scheduled* caller — that half stands | 🔬 FIXED |
| **X-02** | 07 §7.2 Defect 2 | "the MCP service was never given the model server's address" | **FIXED for Hermes** — `docker-compose.hermes.yml:107` forwards `OPENAI_BASE_URL`, with the P2-7/§2.13 measurement recorded beside it. **Still open for `mcp`** — see T-14 | 🔬 FIXED (partly) |
| **X-03** | 07 §12.6 | "the source pin does not exist" | **FIXED.** `library/development/HERMES-PIN.md` exists (29,340 bytes, written today), and the compose carries `HERMES_PIN_DIGEST=07ee857bdab59a875317035d8aaad4d6` — the same digest `SR-39`'s one-truth check verifies | 🔬 FIXED |
| **X-04** | 08 §3 | `run.ts:153` gate 3 | The line moved and the condition **strengthened**: it now reads `if (fn.operationType !== 'query' \|\| !fn.businessIr)`. The defect stands; the citation does not | 🔬 FIXED (citation) |

### 1.5 Corrections to the audit's own measurements

Rule 13 — a committed number can be wrong; re-measure, and commit the fix by name.

| # | The audit said | I measured | Why it differs |
|---|---|---|---|
| **C-01** | RTL: **1,129** physical vs **16** logical (70:1) | **878** vs **58** (15.1:1) | 📐 Token-level count of string literals only, over `packages/ui/src`, `packages/core/src`, `apps/mercato/src`, `packages/enterprise/src` — 4,320 files, 472,110 class-like tokens. The audit's was a word-boundary count. **The finding and its severity are unchanged; the ratio is 15:1, not 70:1.** |
| **C-02** | §6: `communication_channels` declares no command capability | **Correct** — and my own first census was wrong | My first census grepped for the bare word `capability`, which matched the prose "adapter capability" in a comment. Re-measured with `^\s*capability\s*:` : **15 core modules with `commands/`, 8 declaring a capability.** The audit's numbers were right; the measurement method was mine to get wrong. |
| **C-08** | "`ensureOrganizationScope` and `ensureTenantScope` fail open — log-only, default off" | **Half wrong, and the wrong half is the finding.** `ensureOrganizationScope` is already observable and closable (log + `OM_ENFORCE_ORG_SCOPE_STRICT`, #2441). `ensureTenantScope` has **neither** — it returns in silence. Stated the other way round, the finding is: *one of the pair is observable and configurable, the other is silent and fixed open* — and the fix is to bring the sibling to parity, not to deny something 415 call sites rely on. |
| **C-09** | "the `systemActor` flag exists and is never checked here" | **False.** `systemActor` does not appear in `ensureTenantScope` at all, and the test that looks like it checks this (`denies authenticated tenant-less systemActor contexts… #3910`) builds a context where **`auth` exists with `tenantId: null`** — so the refusal fires on `ctx.auth` being truthy, not on the flag. The flag is orthogonal; nothing is missing from this function. The real defect is the `&& ctx.auth` **asymmetry**: an *absent* auth object is exempt, a *present but tenant-less* one is refused. |

| **C-03** | §12 S-2/S-6 cited `commands/scope.ts:95-126` | The file is **`packages/core/src/modules/wms/commands/shared.ts:12-17`** | `ensureTenantScope` lives in the wms module's shared helpers, not a top-level `commands/scope.ts` |
| **C-04** | §15 QT-01 cited `authority/__tests__/decision.test.ts:296-303` | **`packages/shared/src/lib/authority/__tests__/decision.test.ts`**, same shape | The test moved into `shared` |
| **C-05** | §11 §10: 9 arbitrary media queries | **6** in source | Excluding tests and built output; and they are `window.matchMedia` JS calls rather than CSS media queries |
| **C-06** | *(this document's own header)* "197,912 words" | **45,652 words**, 287,331 bytes | 📐 `wc -w` and `wc -c` over the 13 files. The 197,912 figure is not reproducible by any measure of this folder — it was inherited unverified from an earlier session's note. **Rule 13 applied to my own work.** |
| **C-07** | *(this document's own ranking)* named the declared-control check **`SR-42`** | The check is **`SR-47`**. `SR-42` was already assigned in the SRS to **openrig's exclusion ledger with mechanical expiry** | 📐 `library/architecture/mapping/findings/08-THE-SRS.md` lines 78–86 and `MASTER-CHECKLIST`'s `SRSREG` both carry `SR-42` = "Exclusion ledger with mechanical expiry; ships empty". The triage's §4 ranking reused a live label without checking the register, so the same ID pointed at two unrelated requirements — and the second one would have been silently overwritten the moment anyone built the first. **Rule 13 applied to my own work, a second time.** `SR-47` is the next free number in the SRS. Corrected in all four documents; the two legitimate `SR-42` rows are untouched. |

**Two of these seven are corrections to my own work, not the audit's** — `C-06` is the headline number of this
very document, and `C-07` is the ID this document's own ranking invented for the work it ranked first. Both
were wrong until 17 October. They are listed here rather than quietly fixed, because the register's own
method commits the fix *by name* — and `C-07` in particular is the kind of error that a document which
exists to enforce "one name, one thing" cannot afford to make.

### 1.6 Not validated

Recorded so nobody mistakes silence for a pass.

| # | The claim | Why not validated | What would settle it |
|---|---|---|---|
| **U-01** | 06 §3.5 — the hosted platform's login is broken for every real account | Environmental; needs the owner's machine and a real account | One sign-in attempt on the hosted deployment |
| **U-02** | 08 §14 — the 5,000+ tests in the audited suites are all green | A full suite run is a long job and was not in scope | `yarn test` on the committed tree |
| **U-03** | 09 §3.4 — the `@deprecated` guard pair has 106 call sites in 40 files | I could not locate a file matching the audit's cited name | The audit's own grep, re-run |
| **U-04** | 08 §11 F10's exact locale-divergence example | I confirmed two comparators exist and that `localeCompare` is used in `round-trip.ts`, `model.ts` and `bindings.ts`; I did not reproduce the byte-level divergence | A two-locale round-trip probe |
| **U-05** | 11 §2 — whether the 27 untested primitives have Playwright integration coverage | The audit itself left this open | An audit of `.ai/qa/` |

---

## 2. The two CRITICALs, with the measurement

### 2.1 T-01 — a delegation lends authority the lender does not have

**Every decisive line, read today.**

- `packages/core/src/modules/auth/api/authority/delegations/route.ts:25-26` — the guard config is
  `{ requireAuth: true, requireFeatures: [FEATURE_MANAGE] }`. The route requires
  `auth.delegations.manage`. **It does not require the capability being granted.**
- `:33` — `capabilityId: z.string().min(1).max(200)`. Any string. No descriptor lookup.
- `:118-130` — `delegations.grant({ grantorPrincipalId: principal.id, capabilityId: parsed.data.capabilityId, … })`.
  The grantor is derived from the caller and **never checked against the capability**.
- `services/delegationService.ts` — no reference to `getCapabilityDescriptor`, `delegable`, or any grant check.
- `.delegable` — **0 production consumers** repo-wide, outside `acl.ts` declaration sites.
  `.standingApprovable` — **0**.

**The failing scenario, unchanged:** a user holding only `auth.delegations.manage` — a reasonable, limited
role — can lend `api_keys.manage` (minting identities) or `directory.tenants.manage` to anybody, or to
themselves. `api_keys.manage` is declared `delegable: false` and nothing notices.

**The fix is one function**, and the code to copy already exists: read
`getCapabilityDescriptor(capabilityId)`, refuse when `delegable: false`, refuse a self-delegation with a null
ceiling. **Rank: critical. Urgency: urgent.**

> ✅ **T-01 WAS BUILT, 2026-10-17** — commit `fa974bb1`, three checks in the route — and **one more than the
> fix sentence above named.** The sentence named the descriptor read, the `delegable: false` refusal and the
> self-delegation ceiling; the build added the **grantor-holds** check first: the caller must actually *hold*
> the capability they are lending. That is the route's own header principle ("nobody may lend authority they do
> not hold") applied to the caller's own holdings, not just the grantor *id* — without it, a caller holding
> only `auth.delegations.manage` could still lend `api_keys.manage`, because the grantor's identity was
> checked while the grantor's holdings were not. Proof: 9 tests in
> `packages/core/src/modules/auth/api/__tests__/delegations.route.test.ts`, 3 mutations run for real, each
> killing exactly its own test, and the decisive assertion in every refusal case is that **the write never
> happened** — `delegations.grant` was never called, not merely a 403 returned after it.

### 2.2 T-02 — the AI's business-query tool checks scope but not authorization

**Every decisive line, read today.**

- `packages/ai-assistant/src/modules/ai_assistant/ai-tools/business-ir-pack.ts:94` —
  `requiredFeatures: ['ai_assistant.view']`.
- `:129` — `features: ctx.userFeatures` is built and passed.
- `lib/business-ir-run.ts`, `shared/src/lib/business-ir/compile.ts`,
  `shared/src/lib/business-ir/bindings.ts` — **0 reads of `features`**. The only hit in
  `business-ir-author.ts:84` is a comment.
- `business-ir-run.ts:324` — `engine.query(binding.platformEntityId, plan.physical)`, **no per-entity gate**.

**One correction to the audit's wording, which makes the finding sharper.** `ai_assistant.view` *is*
declared — in `packages/ai-assistant/src/modules/ai_assistant/acl.ts`, as an ACL feature. What it does not
have is a **`capability` descriptor**. `registerCapabilityDescriptors` skips any feature without one
(`registry.ts:44`), so `getCapabilityDescriptor('ai_assistant.view')` returns `null`, `decideFor` returns
`null`, and `checkToolAuthority` permits — `tool-authority.ts:136-139` documents that as a deliberate
migration position ("enforcing on absence would make every wildcard grant a denial"). **That reasoning is
defensible for the descriptor's absence. It is not a defence for `features` being passed into the chain and
never read** — which is unintended, and is why **T-36** matters: the capability-coverage test's denominator
is `packages/core/src/modules`, so the eight `ai_assistant.*` features are never counted, and the gap that
makes this gate inert is itself invisible to the build.

**The fix is one call**, and the code to copy already exists: `authorizeEntityAccess` in
`packages/search/src/modules/search/ai-tools.ts:86`, with all 53 entities' `aclFeatures` behind it.
**Rank: critical. Urgency: urgent.**

> ✅ **T-02 WAS BUILT, 2026-10-17** — commit `60a6714f`. One gate before the engine read,
> `authorizeEntityRead` in `packages/ai-assistant/src/modules/ai_assistant/lib/business-ir-run.ts`, copied
> from the donor because the two packages must not depend on each other. Fail-closed the way the donor is: no
> config → refusal, no `aclFeatures` → refusal, no container → refusal, superadmin bypasses (the donor's rule,
> preserved deliberately and pinned by a test so a later reader sees it was carried over, not missed). Proof:
> 8 tests in `business-ir-run.authorization.test.ts`, 7 mutations run for real, each killing exactly its named
> test, and the decisive assertion in every refusal case is that **the read never happened** — `engine.query`
> was never called, not a refusal after the rows came back. The existing run suite's fixtures were
> **completed, not weakened**: they passed no container, so the fail-closed gate would have refused every
> happy path — the fixtures lacked the gate's input because the control they feed did not exist yet.

### 2.3 T-03 — the root cause, and why it is ranked with them

`.delegable` written in twenty places, read in none — nothing fails. `demoteIfEvidenceDemands` tested and
never called — nothing fails. `risk`/`approval`/`idempotency` with zero declarations — nothing fails.
`authorityPolicyProblems` with zero callers — nothing fails. `findFrontendVocabulary` with zero callers —
nothing fails. `detectRepeatedRequest` with zero callers — nothing fails. **Six findings in this register
are the same finding.**

The workshop already owns the mechanism. `SR-39`'s `check-one-truth.mjs` is a registry-driven check that
fails when copies disagree; `SR-41`'s `check-escape-hatches.mjs` is a census that fails when a hole carries
no reason. Both were committed today. **`SR-47` is the same shape pointed at declared controls**: a registry
of declared controls, each naming at least one production reader, asserted by a test that fails when either
side is empty. It would have caught T-01, T-08 and T-29 at build time, and the next three automatically.

**This is why it is ranked critical and scheduled urgent, ahead of the individual patches.** A patch closes
one instance. `SR-47` closes the class.

> ✅ **`SR-47` WAS BUILT, 2026-10-17.** `scripts/check-declared-controls.mjs` in the code repo, committed as
> `52383e09`. Six controls registered; **five UNCOVERED and one DEAD-INPUT**, exactly as predicted. Two things
> the build added beyond the plan: the **DEAD-INPUT shape** (the C6 contract's reader *is* wired at
> `command-bus.ts:452` and zero handlers write the field, so it returns `null` for every handler — a dead
> control that looks completely alive, and harder to see than a function nobody calls), and a **wider census**
> that put the class at **3,658 of 14,311 exported symbols (25.6%)** with no production consumer — a figure to
> watch, not a gate to trip, and the reason the registry is curated rather than automatic. The check was also
> **wrong twice while being built, both times in the dangerous direction** (a dead control reading as wired),
> which is why `strip()` removes string, comment *and* regex-literal contents before any pattern is applied.
> T-03 is now closed; **T-01 is now built as well** (`fa974bb1`, 2026-10-17); **T-08, T-29 and T-43 remain
> open and are still the work.**

### 2.4 T-32 — the UUID pattern, built — and the gap the build exposed

`readRecordId` (`packages/core/src/modules/auth/commands/interceptors.ts:89`) accepts only RFC-4122 v1–v5
ids: the pattern pins the version nibble to `[1-5]` and the variant nibble to `[89ab]`. A valid UUIDv7 id —
a shape the Postgres `uuid` column accepts, and one imports, sync jobs and future migrations can carry —
fails the pattern, `readRecordId` returns `null`, the id reaches `AuthorityEnforcementService.decideFor` as
`recordId: null`, and `resourceCeilingFor` (line 335) returns early on `!recordId`. The record's lock is
**never looked up** — no ceiling, no project context, no grade.

This one pattern mattered out of proportion to its size because the command gate is the **only production
caller that threads a recordId**. `refusalFor` — the route guard's path (`rbacService.ts:595`) — calls
`decideFor(subject, feature, scope)` with no options; the AI tool path threads only `onBehalfOfUserId`. The
gate's `readRecordId` was the single point where record locks reach the resolver at all. And the house tests
could not have caught it: every existing gate test mocks `decideFor` entirely (QT-02 — the mock ignores its
arguments, so deleting the threading outright would have left the suite green).

**The fix goes one step beyond the recorded one, and by name (rule 13).** The triage recorded
`[1-5]` → `[0-9a-f]`; re-measured, the variant nibble is the same class of over-strictness — a valid UUID
with a non-RFC variant bypasses the lookup identically — so the fix takes the shape to its logical end:
`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`. In-repo precedent, measured:
`sync-run-service.ts:7` and `grantChecks.ts:46` use exactly this shape, and `crud/ids.ts:5` shows the house
relaxing in the same direction with `[1-8]`. Shape-only is the right line because version and variant are
properties of the **generator**, not the record — ids are v4 today (`gen_random_uuid()`), but nothing
constrains them to it, and the shape is what keeps a slug or numeric id from colliding with a lock, which is
the docblock's stated purpose.

**The gap the build exposed — T-45 (new, ranked high, scheduled, DOCUMENT).** The lock rules themselves are
right (`locked` → A0, `restricted` → A2, `open` → null, reads exempt, unreadable → `locked`, fail-closed —
the audit's §14 note said only the *lookup* fails open, and the build fixed the lookup). But a **locked**
record still passes the gate: the gate does not hold A0 by design, on the reasoning that RbacService has
already made it at the route guard — true for capability refusals, false for record-lock ones, because
`refusalFor` threads no recordId, so a record-lock ceiling can never surface there either. Net effect: a
locked record is writable by any actor holding the capability. It needs the owner's decision on where the
refusal belongs, and it is **pinned by a test** in the new suite rather than left latent.

> ✅ **T-32 WAS BUILT, 2026-10-17, `13c6206f`.** The shape-only pattern above, with the docblock rewritten to
> carry the rationale ("shape only — no version or variant constraint… version and variant are properties of
> the *generator*… same shape as `sync-run-service.ts` and `grantChecks.ts`"). PROOF: 7 tests in
> `packages/core/src/modules/auth/commands/__tests__/authority-command-gate.record-id.test.ts`, driving the
> real gate and the real `AuthorityEnforcementService` with a stub lock reader — **the decisive assertion is
> that the lookup happened at all**: `stateFor` called with the record's real id, after which a restricted
> record named by a v7 id is **held** at A2. 4 mutations run for real, the file restored byte-clean between
> runs, each killing exactly its named tests: M1 (restore the pre-fix pattern) kills both hole tests +
> uppercase + locked; M2 (accept any string) kills the slug/numeric guard; M3 (drop `/i`) kills uppercase;
> M4 (remove the threading) kills all 5 threading tests. Verified: 19 tests across the two gate suites, 809
> tests / 90 suites across `src/modules/auth`, `tsc --noEmit --incremental false` clean, eslint clean; both
> files pure LF, no BOM. The build also exposed **T-45**, documented above and pinned by the test "still
> passes a locked record: the gate does not hold A0, by design".

### 2.5 T-45 — the locked record's refusal, built (Option A)

**The decision, and who made it.** T-45 asked *where the refusal belongs*. The owner ruled **Option A: the
gate refuses**. It is the smaller change and the only correct one, because the command gate is the **only
production path that threads a record id** — `refusalFor` (`rbacService.ts:595`) threads none, so the route
guard cannot see a record lock at all.

**The hole, verified in code.** The gate computes the lock's ceiling — `recordLockCeiling('locked', <non-read>)
=== 'A0'` (`shared/src/modules/record-locks.ts`) — and then **ignored it**: `HELD_GATES = new Set(['A1','A2'])`
(`interceptors.ts:56`), so an `A0` fell through to *"gate permits the act to run now"*. The gate excluded `A0`
on the stated belief that `RbacService` had already refused it — true for a *capability* refusal (the route
guard answers before the bus runs, so the gate never sees one), **false for a record lock**, which the route
guard cannot make.

**The fix.** The gate now **refuses `A0`**, via a new `AuthorityRefusedError` (403 — "you may not", kept
distinct from the held case's 202 — the three outcomes stay tellable apart), carrying the binding rule and its
reason the way a hold does. The gate's own docblock claim ("`A0` is left to the route guard") was corrected by
name (rule 13).

> ✅ **T-45 WAS BUILT, 2026-10-17.** The pinning test "still passes a locked record: the gate does not hold
> A0, by design" is **flipped** to "refuses a locked record" — the gap is closed, not merely visible. PROOF:
> 21 tests across the two gate suites; **3 mutations run for real, each killing exactly its named tests** —
> M1 remove the refusal branch (pre-T-45 behaviour) kills the 4 refusal tests, M2 mislabel `REFUSAL_GATE`
> kills the same 4, M3 wrong status (202 for 403) kills the status assertion — the file restored
> **byte-identical** (`f3c1017bb14cc3c438566ca67ecbad3f`); 71 tests across all 13 auth command suites, **811
> tests / 90 suites across `src/modules/auth`**, `tsc --noEmit --incremental false` clean, eslint clean.

---

## 3. What the audit got right about its own process — and why that matters here

The audit's §19 records that a hostile-critic pass attacked every claim and **every defect finding
survived**, while four of the audit's own evidentiary lapses did not. I re-measured 46 findings and found
**zero false**. That is a remarkably high hit rate for a cold read of a codebase this size, and it changes
how this register should be used: **the audit's findings can be trusted as a work list.** What needed work
was its *numbers* — five of which I have corrected in §1.5 by name.

The audit's own §18 sentence is the one I would put in front of every new developer, and it is the
workshop's own rule restated by an outsider:

> *"a standard that lives only in a document is a wish."*

---

## 4. The recommended order

The audit's §17 order and mine agree on the first four. Where they differ is at the top, and the difference
is the one substantive recommendation this document adds.

| # | The work | Why here |
|---|---|---|
| 1 | **`SR-47` — the declared-control coverage check** (T-03) — ✅ **BUILT 2026-10-17** | It is the class, not an instance. The workshop already owns the mechanism. Doing it first means T-01, T-08, T-29 and the next three are caught mechanically rather than patched one at a time |
| 2 | **T-01 and T-02** — the two CRITICALs — ✅ **BOTH BUILT 2026-10-17** (`fa974bb1`, `60a6714f`) | Live privilege-escalation and data-exposure routes, both reachable from an ordinary role, both one function to close, both with the code to copy already in the repo |
| 3 | **T-32** — `UUID_PATTERN` shape-only fix — ✅ **BUILT 2026-10-17** (`13c6206f`) | One character of over-strictness. Locked records became writable by a v7-id payload, because the gate is the only production path that threads a recordId — and the build exposed T-45, a locked record's refusal has no production consumer |
| 4 | **T-13 and T-14** — `--jinja` and the `mcp` base URL — ✅ **BUILT 2026-10-17** | Both were one line in a compose file, both were live, and T-14 was the difference between the embedding lane working and it silently calling `api.openai.com` |
| 5 | **T-04, T-05, T-06** — the count gap, the double approve, the ledger hole | The three HIGHs that break a central guarantee with a green test suite behind them |
| 6 | **T-07, T-27, T-16, T-17** — the fail-open flips | Four small edits that each remove a silent failure mode, and T-27 is the one that lets an `auth: null` context accept a foreign tenant |
| 7 | **T-09, T-12** — repair the DS lint, guard `/backend` | T-09 unlocks thirty rule categories; T-12 removes a documented crash trap |
| 8 | **T-11** — the RTL campaign | A campaign, not a flag: 878 physical sites vs 58 logical. Start with `packages/ui/src`, the primitives every consumer inherits |
| 9 | **T-44** — `G-04`, the data axis | The single gap the audit's `09` ranks above every feature request, because four other features wait on it. Correctly **scheduled**, not urgent: it is a foundation item with its own sequencing in the SRS |

---

## 5. What this document does not do

- It does not **re-rank** anything. **BUILD-ORDER.md and the SRS own the sequence**; §6 below places each
  finding into that sequence, it does not replace it.
- It does not resolve an owner decision. The seven `DP-*` and `CC-*` questions in `06 §1` remain the owner's,
  and are recorded here as untouched.
- It does not re-run the suites. **U-02** is open, and the audit's green-suite claims are second-hand.

---

## 6. The schedule — every pending finding, its slot, and the gate that owns it

**Why this section exists.** §5 used to say *"it does not schedule anything"*, and that was honest but
incomplete: a finding with a rank and no slot is a finding nobody owns. `CC-92` was the collective
address and said *"the rest are queued"* — which named no row, so nothing in the register could start
any of them. **Written 2026-10-19; this is the schedule `CC-92` was waiting for.**

**A slot is a gate, not a date.** This project sequences by gate (`PLAN-2026-10-18-one-agent.md` §6), so
each slot below is named by the gate that must be green before the work after it starts.

**★ The first gate is before `W1` (`CC-121`), not before the first surface.** W1 re-keys every
`principal_id` in the system. If the gate still cannot see seven modules' commands (`T-07`, re-measured
today), and one scope helper accepts a missing identity (`T-27`, re-measured today), then the migration
re-keys authority through a gate with holes — and W1's own gate (*"rotate a key: bindings, roles,
delegations, denials and audit rows all survive"*) cannot be proven for the modules the gate does not
reach. **The spine is repaired before it is re-keyed.**

**The measurement this schedule rests on, re-run today (2026-10-19), not inherited:**
`scripts/check-declared-controls.mjs` → **6 controls: 1 covered, 4 uncovered, 1 dead-input** (so
`T-08`, `T-22`, `T-29`, `T-34`, `T-43` all still stand, and `T-01`'s `delegable` is now covered by the
built fix); the command-capability census → **15 core modules with `commands/`, 8 declaring a
capability, 7 not** (`T-07`, and it is 7 rather than the audit's 9, per `C-02`);
`T-27` was **built 2026-10-19** — the helper no longer refuses-and-says-nothing; the unscoped pass is
logged and closable by `OM_ENFORCE_TENANT_SCOPE_STRICT`, which leaves **12** in this slot;
`T-36` is **fixed** by
`CC-132` (`moduleRootFor` + `enabledModules`, measured in the guard).

### 6.1 Already closed — do not re-fix (13)

`T-01` `fa974bb1` · `T-02` `60a6714f` · `T-03` → `SR-47`/`CC-93` · `T-13`/`T-14` `CC-98` · `T-32` `13c6206f` ·
`T-45` `CC-97` · **`T-36` — closed by `CC-132`** (the coverage guard's denominator no longer excludes
anything shipped outside `packages/core`; the row's own defect, fixed under a different row) ·
**`T-05` `17911238`/`7f57f3e`** (the double approve) · **`T-06` `PLAN-T-06-undo-ledger-gap.md`** (the
undo record the chain did not cover) · **`T-07` `3b633189`** (115 commands gated, and the guard that
could not see them) · **`T-08` `34488c07`** (trust demotion has a caller) · **`T-15` `e25904f5`** (the confirm path applies the narrowing).

### 6.2 Slot 0 — before `W1` / `CC-121` starts (5 remaining of 13; `T-27`, `T-35`, `T-04`, `T-05`, `T-06`, `T-07`, `T-08`, `T-15` built)

The spine's own guarantees. Each is a central promise the pipeline will otherwise build on top of.

| # | Rank | Why it cannot wait for its own workstream | The gate |
|---|---|---|---|
| **T-04** | high | ✅ **BUILT 2026-10-20** — was: a Function that asks for a count returns rows, and the gap verifies as `passed`. Now refused at the compiler (an error, not a gap), named at verify, and refused again at the runner. `PLAN-T04-count-returns-rows.md`. | — |
| **T-05** | high | ✅ **BUILT 2026-10-20** (`17911238`) — was: the approvals queue can approve the same act twice (read-then-act, no compare-and-set), so every approval built later inherits the race. Now one claim decides which caller wins | Slot 0 |
| **T-06** | high | ✅ **BUILT 2026-10-21** — was: `undo` wrote the one record the tamper-evident chain did not cover, and a ledger with a known gap stops being evidence. `markUndone` now appends to the chain (`historyAction: 'undo'`, `sourceLogId`), on the caller's EntityManager instead of a fork, and `verifyUndoCoverage` reports a row claiming `undone` with no event and an event whose row is not `undone`. **Measured first:** redo was already covered because it re-executes through the bus, so the same reversal was chained forward and unchained backward | Slot 0 |
| **T-07** | high | **7 core modules' commands are invisible to the authority gate** (re-measured today: `catalog`, `communication_channels`, `customers`, `resources`, `sales`, `staff`, `wms`). W1 re-keys principals across this gate. **REQUIREMENT WRITTEN 2026-10-21** (`PLAN-T-07-command-capabilities.md`), measured with `scripts/measure-t07-command-capabilities.mjs`: **128 handlers declare no capability**, and they split four ways rather than one. **109** inherit the single feature their route already requires (a fact, not a guess) · **3** are invoked from **agent surfaces** (`ai-tools`, `inbox-actions`), so no route can supply it · **7** sit behind a route that declares **no feature** · **3** behind a route that declares **two**. Plus **6 with no caller at all**. **Two of those buckets became their own rows, because they are different defects:** `CC-156` (three endpoints are authenticated but **not authorised**, so any signed-in user may assign labels or edit sales notes) and `CC-157` (six commands nothing can invoke). **The line this row must not cross:** inherit what the route enforces, never infer a capability from an identifier, which the `capability` docblock refuses in its own words. **★ BUILD IN PART 2026-10-21 (`3b633189`), and it changed what the row means.** **115 commands now declare a capability**, 13 still do not (each with a reason and the row that owns it), and the guard that should have caught this was rewritten. **Three corrections, all Rule 13:** (1) **the seven modules are PARKED**, so the gap is prospective rather than live; only `communication_channels` is enabled and it has no commands. (2) **The live defect was the guard**, whose hardcoded `PARKED` set named six of the seven and whose docblock promised *"if one is ever un-parked, this test starts failing for it"* — it cannot, because the list is a constant. It now checks **every** module. (3) **R2's premise was wrong**: `sales/api/returns` declares one feature per method already and its factory names each command in its own operation block; the **instrument** was over-unioning, and no route was changed. **Also:** the scope is **eight** modules, not seven, because `checkout` ships in its own package. **Outstanding: the seven mutations are not written, so the row stays open.** **★ CLOSED 2026-10-21: the six mutations are PROVEN**, and the fourth survived its first run because the stale-exception check only asked whether a command still existed, not whether it was now gated; that check was the defect and is fixed. | Slot 0 || **T-08** | high | Trust demotion is never triggered — 4 callers, all its own test (`SR-47` re-confirmed today). Graduated trust that never demotes is a one-way ratchet | Slot 0 |
| **T-15** | medium | ✅ **BUILT 2026-10-21** (`e25904f5`) — was: the confirm path drops the binding's narrowing, so an approval silently widens what was approved. The agent is now resolved through the catalogue rather than the global registry, and both halves of the narrowing are enforced with a refusal rather than a log line | Slot 0 |
| **T-16** | medium | Two gates fail in opposite directions on a missing dependency — one denies, one allows; the pipeline adds a third | Slot 0 |
| **T-17** | medium | The model allowlist fails open on the provider axis | Slot 0 |
| **T-27** | high | ✅ **BUILT 2026-10-19** — was: `ensureTenantScope` fails open when `ctx.auth` is absent. Now logged, and closable by `OM_ENFORCE_TENANT_SCOPE_STRICT`. `PLAN-T27-tenant-scope-observability.md`. | — |
| **T-28** | medium | The PUT command path skips the guard set when the candidate id is not on the parsed input | Slot 0 |
| **T-30** | medium | Optimistic locking is client-opt-in **and the reader fails open** (five early `ok: true` returns) | Slot 0 |
| **T-33** | medium | `resourceKind`/`resourceId` are unhashed in the ledger — the record cannot name what was touched and stay tamper-evident | Slot 0 |
| **T-35** | small | ✅ **BUILT 2026-10-19** — the sandbox enforces the api-call cap it advertises, and the count is reported. `PLAN-T35-sandbox-caps-real.md`. | — |

### 6.3 Slot 1 — with `W3`, the chokepoint and actor-class gate (10)

These *are* the chokepoint's contracts and the Business IR it carries, so they land where that code is
already open.

| # | Rank | Why here |
|---|---|---|
| **T-29** | medium | The C6 command contract is dead at runtime (`SR-47`: reader wired, 0 producers). W3 is where a contract gets a producer |
| **T-34** | small | `authorityPolicyProblems` has no production caller — W3 reads policies, so the validator belongs on that path |
| **T-18** | small | `SURFACE_ID_PATTERN` carries a stray `/i` — the surface vocabulary is W3's subject |
| **T-19** | medium | `importFunction` rejects a §50-legal IR the compiler normalises and accepts |
| **T-20** | medium | `references` is sorted for export but not for the fingerprint |
| **T-21** | medium | `notChecked: []` forges "every §46 check ran" |
| **T-22** | small | `findFrontendVocabulary` has no production caller (`SR-47` re-confirmed) — the leak it detects reaches the client |
| **T-23** | medium | The `decided` branch returns the header's records unvalidated |
| **T-25** | medium | Two sort comparators, one locale-dependent; it reaches `entity.version` |
| **T-26** | medium | `importModel` validates ids but not structure |

### 6.4 Slot 2 — with `W5`, durable runs (1)

| # | Rank | Why here |
|---|---|---|
| **T-43** | small | `detectRepeatedRequest` has no caller (`SR-47` re-confirmed). W5 introduces idempotency keys, which is exactly where a repeat detector gets a consumer |

### 6.5 Slot 3 — with `W7`, the first surface proves the spine (4)

Frontend findings only become real when a surface is built — and W7's gate says a surface may not start
without its own written requirement, so this is the cheapest moment to repair what it will inherit.

| # | Rank | Why here |
|---|---|---|
| **T-09** | high | The design-system lint is broken (`@typescript-eslint` mixed versions) and all six rules are `warn` — 30 rule categories unlocked by one repair |
| **T-12** | high | `/backend` crashes if the `dashboards` module is switched off — a documented crash trap in the surface path |
| **T-40** | medium | Six DS rule categories of ~30; lint scope excludes user modules; 27 of 73 primitives untested; 10 widgets with no layout contract; three modules with data, API and no screen |
| **T-10** | high | Accessibility linting is installed and never switched on — cheap while the surface is new, expensive after |

### 6.6 Slot 4 — with `W8`, the ratchets (3)

All three are tests that **cannot fail**. W8 is the workstream whose subject is exactly that.

| # | Rank | Why here |
|---|---|---|
| **T-37** | small | The only assertion is wrapped in an `if` that never runs |
| **T-38** | small | `describedModules().length >= 24` is a floor, so 24 modules could drop out and it still passes |
| **T-39** | small | The decoupling test asserts against a hand-built fixture, not the real interface |

### 6.7 Slot 5 — with `P2-9b`, the Hermes switchover (2)

Both are compose-file facts, and both matter most the day Hermes becomes the default lane.

| # | Rank | Why here |
|---|---|---|
| **T-41** | medium | The Hermes service has **no healthcheck** — a wedged runtime is invisible. A default lane must be observable |
| **T-42** | medium | No `llamacpp` preset — the open-source lane squats on `OPENAI_*` |

### 6.8 Deferred by name — a decision, not a queue (4)

| # | Rank | Why deferred, and what would reopen it |
|---|---|---|
| **T-11** | high | The RTL campaign: **878 physical vs 58 logical** sites (15.1:1, `C-01`). A campaign, not a flag. Reopens when a tenant requires RTL — and it starts in `packages/ui/src`, the primitives every consumer inherits |
| **T-24** | small | `KernelObjectContract.source` is unpopulated for most entities — a completeness gap with no consumer yet |
| **T-31** | small | The autonomy matrix exempts humans entirely — **deliberate**; recorded so it is not "fixed" into a bug |
| **T-44** | critical | `G-04`, the data axis, does not exist and the compiler says so on every compile. It has its own SRS sequencing and four register rows wait on it — scheduling it here would fork that sequence |

### 6.9 The two checkpoints

**Checkpoint A — the `W1` gate (the one that matters).** `CC-121` does not start until Slot 0 is
closed. It is the only slot whose absence would make later work *wrong* rather than merely incomplete.

**Checkpoint B — the `W8` gate.** The three ratchet findings are closed when `CC-101`'s rule is
satisfied: **a checker that nothing calls is not a control.** `SR-47`'s registry is already the
instrument; W8 is where it becomes CI.

**Everything else rides a named workstream.** Nothing in this register is left without a gate, which is
the property §5 previously disclaimed and `CC-92` was opened to obtain.

---

*Every finding above was measured against `workspace/starting-kit/` at `b183df58`. Where I corrected a
number, the correction is named in §1.5. Where I could not validate, §1.6 says so rather than guessing.*
