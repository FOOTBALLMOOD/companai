# Hermes integration — the architecture

**Status: DESIGN, NOT BUILT.** Written 2026-10-05. No code, no deployment and no runtime was
changed to produce it. Every path in this document was read from the source on 2026-10-05.

**What this is.** The complete design for bringing **Hermes** into the product as its agent
runtime: platform to platform, function to function, and architecturally, for a multi-tenant
SaaS product.

**What it rests on**, in order of authority:

1. **The product's own plan**: [`AGENT-HALF.md`](AGENT-HALF.md) (the agent half),
   [`SPEC-business-model-kernel.md`](SPEC-business-model-kernel.md) (the kernel spec),
   [`BACKLOG.md`](BACKLOG.md) (the one roadmap), [`ARCHITECTURE.md`](ARCHITECTURE.md) (how the
   pieces run).
2. **The measured source**: `workspace/starting-kit` (our platform) and
   `hermes-agent-main` (the Hermes snapshot). **Where a document and the code disagree, the code
   wins.**
3. **The prior analysis**: `analysis/hermes-starting-kit-forensic-analysis.md` and the five-batch
   study in `analysis/hermes-integration/`. This document **adopts its direction, corrects four of
   its facts, and supplies the one thing it omits entirely** (the incumbent runtime).

**The one decision this document deliberately left open was taken by the owner on 2026-10-05.** The
runtime boundary, the project's **B-05**, is now **decided**: see §11. What remains deferred is named
there with its trigger.

**The companion you read for "where does this show up in the build":**
[`ARCHITECTURE-hermes-service-map.md`](ARCHITECTURE-hermes-service-map.md) — the same design, turned
into a **per-development-item map** of how Hermes *serves* or is *served* (as an agent, or as a
setting), with the Llama layer and the honest status. **This document is the design; that one is the
wiring map a new developer works from.**

---

## 0. What this document changes about the prior analysis

Read this first. Four corrections and one omission. Each was measured, not argued.

| The prior analysis said | Measured on 2026-10-05 | Status |
|---|---|---|
| "Hermes is Python 3.14+"; "the dependency manifest targets Python 3.14" | **Four sources agree that it is 3.14, and only 3.14.** `pyproject.toml`: `requires-python = ">=3.11,<3.15"`, whose own comment reads *"3.14 is the newest python we know we have wheels for. we only support 3.14, BUT we need to allow old hermes installs on <3.14 to get thru their update step on old python"*. `.python-version`: `3.14`. The image manifest `pm/lock.json` pins **CPython 3.14.7** for every platform (`python-build-standalone`, release 20260901: x86_64 and aarch64, glibc and musl, darwin, termux). And the core dependencies (openai, httpx, rich, tenacity, fire, certifi, python-dotenv, truststore) each carry the marker `python_version >= '3.14'` | **CORRECTED, and corrected twice: my own first pass was wrong too.** It is **not "3.14+"**: `<3.15` is a hard upper bound. It is also **not "3.11 to 3.14"**: the `>=3.11` floor is an **updater escape hatch**, not a supported runtime, and the conditional dependency markers are the mechanism that makes 3.14 a **requirement** rather than a preference (on 3.11 to 3.13 those packages are simply not installed). And the container **is** 3.14: the image installs Python through its own package manager (`pm`), not from apt, at a pinned **3.14.7**. **State it as: the runtime requirement is Python 3.14 only.** |
| "Recover the exact Hermes source commit/tag" (Phase 0) | There is **no source revision to recover**: the snapshot has no `.git`, and `pyproject.toml` declares `version = "0.0.0"`. But the **dependencies are pinned**: `uv.lock`, `pm/uv.lock`, and `pm/lock.json`, which pins **CPython 3.14.7** by URL for every platform | **SHARPENED, and split in two.** The **source revision cannot be recovered**; it must be **created** (see §9 Phase 0). The **dependency set is already pinned by the project itself**, which is half the work and makes the reproducibility problem narrower than it first appears: today we can pin *what runs*, but not yet *which Hermes* it is. |
| "Security / Phase 2: enforce ai_worker identity" (as future work) | `packages/shared/src/lib/auth/principal.ts` already exports `aiWorkerSubject()` and `derivePrincipal()`, and `server.ts` mints the subject via an `actsAsAiWorker` flag. `packages/shared/src/lib/auth/__tests__/ai-worker-principal.test.ts` asserts `{ kind: 'ai_worker', displayName: 'Hermes' }` | **CORRECTED.** The agent-as-principal seam is **already built**. The work is to **extend and enforce** it, not to invent it. |
| "Inspection found no Hermes adapter/runtime package" (true) and "add a tool bridge" (Phase 3, as future work) | No Hermes adapter exists. But `ai_assistant/lib/in-process-client.ts` is **already a working in-process tool bridge**: it authenticates either by API key or by a pre-authenticated auth context, and exposes the platform's tool registry through `McpClientInterface`. Sprint 0 proved **21 MCP tools** discovered by a live agent over that boundary | **CORRECTED.** The **bridge is largely built**; what is missing is the **runtime** behind it. |
| *(nothing at all)* | **OpenCode currently occupies the agent runtime slot.** The platform's chat route is wired to it, which is why the project records B-05 as *"OpenCode cannot be removed in Sprint 0: the platform's own chat is built on it"* | **MISSING, and it is the most important omission.** Hermes does not arrive on empty ground. Integration is a **displacement**, not an addition. §7 is new. |

**What the prior analysis got right, and this document keeps.** The direction (platform owns
business truth and authorization; Hermes owns runtime mechanics), the process-boundary caution, the
refusal to equate a Hermes profile with a tenant, the rule that one scheduler owns business jobs,
and the insistence that no performance gain is proven. Those are adopted unchanged.

---

## 1. The decision in one page

**Hermes becomes the agent runtime inside our product.** It is not a second product, not a second
control plane, and not a second identity system.

The product is a **multi-tenant SaaS** whose authority is the **canonical business model**. Hermes
supplies the part we should not build: the reasoning loop, tool orchestration, context assembly,
provider breadth, sessions, memory, skills and the execution backends. Everything a customer is
answerable for stays with us: who they are, what they may do, what is true, who approved it, and
what it cost.

Stated as one sentence: **Hermes is an engine we own the crankshaft of.**

Three consequences follow, and they are the spine of this document.

1. **One boundary, not many.** All traffic between the platform and the runtime crosses a single
   typed port (§4). There is no back door: not a Hermes dashboard, not a direct database
   connection, not an ambient credential.
2. **The tenant is derived, never declared.** The runtime never learns a tenant from a prompt, a
   payload or a profile name. It receives an immutable scope object the server minted from an
   authenticated principal (§5).
3. **The runtime is disposable.** Anything Hermes holds is either derived state that can be
   rebuilt, or a projection of a record we own. Deleting the runtime's state must never delete a
   business fact (§5.3).

---

## 2. Platform to platform: what each side owns

### 2.1 What the platform already is

Measured, not assumed. `workspace/starting-kit` is an Open Mercato modular monorepo: Yarn 4
workspaces, Turborepo, **Node 24**, Next.js App Router (`apps/mercato`), PostgreSQL through
MikroORM, DI through Awilix. **Twenty-one** packages under `packages/`, of which these are the ones
this design touches: `ai-assistant`, `core`, `shared`, `queue`, `events`, `scheduler`, `search`,
`content`, `storage-s3`, `cache`, `onboarding`, `webhooks`, `ui`.

`@open-mercato/ai-assistant` is version **0.6.7**, and it is not a chat box. Its module
(`packages/ai-assistant/src/modules/ai_assistant/`) already carries: typed agent and tool
definitions (`ai-agent-definition.ts`, `ai-tool-definition.ts`), a 2,044-line AI SDK runtime
(`agent-runtime.ts`), a policy layer (`agent-policy.ts`), a tool registry and executor
(`tool-registry.ts`, `tool-executor.ts`), MCP server **and** client (`mcp-server.ts`,
`mcp-client.ts`, `mcp-tool-adapter.ts`), an in-process tool bridge (`in-process-client.ts`),
tenant scope injection (`scope-injection.ts`), a model allowlist (`model-allowlist.ts`), token
usage recording (`token-usage-recorder.ts`), session memory, a sandbox, rate limiting, prompt
overrides, and its own entities, repositories, migrations, subscribers and frontend.

### 2.2 What each side owns, permanently

| Concern | Owner | Why it can never move |
|---|---|---|
| Tenant, organization, user, principal | **Platform** (`shared/src/lib/auth`, `core/src/modules/auth`) | It is the product's identity. A runtime profile is a folder, not a tenancy model. |
| Authorization and authority | **Platform** (`shared/src/lib/authority`, `core/src/modules/auth/api/authority`) | Deny-by-default, scoped, and auditable. A model cannot authorize itself. |
| The canonical business model and its data | **Platform** (`shared/src/lib/kernel`, `business-ir`, `core`) | This is the product's reason to exist. |
| Conversations, tasks, runs, approvals, audit, budgets | **Platform** (`ai-assistant` entities, `queue`, `events`, `scheduler`, `shared/src/lib/ledger`) | These are the records a customer is answerable for. |
| The reasoning loop, tool orchestration, context assembly | **Hermes** | The thing we are buying instead of building. |
| Provider breadth, fallback, compression, retrieval, execution backends | **Hermes**, behind the port | Genuine capability, but never the authority for *which* provider a tenant may use. |
| Which provider, which model, which data may leave the tenant | **Platform** (`model-allowlist.ts` plus kernel policy) | A commercial and legal boundary, not a runtime preference. |

### 2.3 The three kernels, and where Hermes sits

The design-control vision divides the system into three kernels. This integration makes that
division concrete:

1. **The Hermes agent kernel** (runtime mechanics). Sits **behind** the boundary. Owns nothing a
   customer can see.
2. **The business model kernel** (identity, typed semantics, policy, commands, events). Sits **in
   front**. Owns all meaning.
3. **The data and workflow kernel** (transactional state, durable workflows, outbox, audit). Sits
   **around**. Owns all truth.

**The Business Agent Gateway is the boundary**, and it is not a new component. It is the existing
AI module's policy and scope layer, plus the authority layer, exposed to the runtime through one
port. Hermes proposes; the platform resolves, authorizes, executes and records.

---

## 3. Function to function: the joints

This is the section the owner asked for by name. Each row is one Hermes capability mapped to the
joint in **our** product that owns it, with the real path and an honest status.

**Status key: BUILT** (exists and works today) · **PART** (the seam exists, the behaviour does
not) · **MISSING** (nothing there yet).

| # | Hermes capability | Our joint (real path) | What it must become | Status |
|---|---|---|---|---|
| 1 | Agent loop, tool invocation, streaming | `ai-assistant/lib/agent-runtime.ts`, `agent-tools.ts` | The loop moves behind the port; the platform keeps context assembly and the streaming API | **PART** |
| 2 | Agent identity | `shared/src/lib/auth/principal.ts` (`aiWorkerSubject`, `derivePrincipal`), `api_keys` module | Extend to the five agent kinds; every run carries an `ai_worker` principal derived server-side | **PART** |
| 3 | Tool access to business data | `ai_assistant/lib/in-process-client.ts`, `tool-registry.ts`, `tool-executor.ts`, `mcp-tool-adapter.ts` | Keep as the only door. Every call re-authorizes against current state; never a direct database handle | **PART** |
| 4 | Authorization of a tool call | `shared/src/lib/authority/{decision,graph,preflight,shadow}.ts`, `core/src/modules/auth/api/authority/{delegations,denials,trust}` | This is the enforcement point. It exists; it must be **complete** before broad tools are granted | **PART** |
| 5 | Provider choice and fallback | `shared/src/lib/ai/llm-provider-registry.ts`, `ai_assistant/lib/model-allowlist.ts`, `llm-adapters/` | Hermes may fall back; the **allowlist and the local/cloud rule stay ours** | **PART** |
| 6 | Sessions, compression, recall | `ai_assistant/lib/session-memory.ts`, `data/entities/` | Our conversation records stay canonical. The runtime session is a **projection**, keyed by our ids | **PART** |
| 7 | Long-lived memory and user model | *(nothing)* | A new, tenant-scoped artifact with consent, export, retention and deletion. Never business truth | **MISSING** |
| 8 | Skills (learned procedures) | *(nothing)*; `core/src/modules/` has no skill registry | A governed catalog: provenance, scan, version, approve, pin, roll back, revoke | **MISSING** |
| 9 | Scheduling and cron | `packages/scheduler`, `packages/queue`, `packages/events`, `packages/webhooks` | **Our** scheduler owns every business job. Hermes cron may run runtime chores only | **PART** |
| 10 | Terminal, browser, code, filesystem | `ai_assistant/lib/sandbox.ts` | A disposable, quota-bounded, network-policed worker. Highest risk in the whole design | **PART** |
| 11 | Subagents and parallel work | *(nothing)* | Bounded child runs with budgets, deadlines, cancellation and a trace | **MISSING** |
| 12 | Channels and rooms | `packages/channel-gmail`, `packages/channel-imap` | Our workspace/room objects own identity and visibility. Hermes channels are adapters, never a second inbox | **PART** |
| 13 | Business meaning (intent to typed operation) | `shared/src/lib/business-ir` (G-02), `user-function` (G-03), `business-widget` (G-07) | Hermes authors IR and Widget/Function definitions; our compiler rejects ambiguity and injects scope | **BUILT** (the compiler); **PART** (Hermes authoring into it) |
| 14 | Deterministic execution with no AI | `shared/src/lib/user-function/run.ts` | Already true, and it must stay true: a published Function never calls a model at run time | **BUILT** |
| 15 | Runtime state | *(nothing)* | Isolated per tenant and agent, with export, backup, delete and retention | **MISSING** |

**Read the status column as the roadmap.** Three capabilities are genuinely absent (#7 memory,
#8 skills, #11 subagents), one is absent in the sense that matters most (#15 runtime state), and
the rest are seams that exist but are not yet the behaviour we need.

---

## 4. The contract: the runtime port

One typed port. Everything crosses it. It is owned by `packages/ai-assistant`, and it is the only
thing the runtime is allowed to know about us.

### 4.1 The port

Deliberately small, and it grows only with evidence:

```
describeCapabilities(runtimeVersion)   -> runtime version, tool delivery, limits, health
startRun(admittedEnvelope)             -> accepts a run the platform already authorized
streamRun(runId)                       -> ordered, typed events (text, tool, status, usage)
cancelRun(runId)                       -> bounded, idempotent
steerRun(runId, instruction)           -> only if the approval semantics exist
resumeConversation(binding, input)     -> explicit session continuity, never implicit
resolveToolCall(call, capabilityGrant) -> the ONLY path to a business operation
completeRun(runId, result)             -> structured outcome, usage, provenance; idempotent
```

### 4.2 The envelope

Server-generated, immutable, and versioned. It carries: schema version, run id, tenant id,
principal/actor id, agent id and kind, task or work id, platform conversation or room id, the
runtime session id, capability grant id, policy and model versions, allowed input references, a
deadline, a budget, and a correlation id.

Three rules make it safe:

- **Identity fields are minted server-side** and are read-only to the runtime. The runtime cannot
  name its own tenant.
- **Secrets are referenced, never inlined.** The runtime receives a secret *reference* it can
  redeem for one narrow purpose. Nothing secret is ever model-visible, and nothing secret is ever
  written to a prompt, a log or an instruction field. (The sibling project learned this the hard
  way, by putting a run token in instructions as an emergency measure.)
- **The identifiers stay distinct.** A run is not a transcript is not a memory scope is not a room
  is not a task. Conflating them is how a "session" quietly becomes an authority.

### 4.3 Failure is normal, not exceptional

`cancelRun` must be bounded and idempotent. `completeRun` must be safe to deliver twice. A runtime
crash must be able to retry an eligible run **without** rewriting assignment or business state.
Usage events must say whether a figure is per-run or cumulative for the session, and an unknown
provider must stay **unknown** rather than be guessed into a paid figure.

---

## 5. Multi-tenancy: the SaaS core

This is where the product is won or lost. Everything above is architecture; this is the part that
leaks a customer's data if it is wrong.

### 5.1 The rule

**A tenant is never inferred. It is derived from an authenticated principal and bound to the run.**

The runtime never sees a tenant id it could tamper with, and never decides one. Every database
query, cache key, file root, secret and log line is scoped from that bound value.

### 5.2 The four kinds of data, which must never be confused

| Kind | Example | Authority | Lifetime |
|---|---|---|---|
| **Business truth** | a customer, an invoice, a published Function | the platform | as long as the business needs it |
| **Tenant knowledge** | a policy PDF, a product manual | the platform, with the tenant as owner | tenant-controlled |
| **Runtime state** | the loop's message buffer, a compression artifact, an index | the runtime, **disposable** | rebuildable; deletable without loss |
| **Derived advisory** | an agent's note-to-self, a suggested summary | nobody; **advisory only** | expiring, and never citable as fact |

A memory, a summary or a skill **never becomes business truth merely by existing**. Retrieval
resolves canonical data under authorization; it does not promote a cached guess into a record.

### 5.3 Profile topology, and why "tenant = profile" is wrong

The Hermes profile is a **runtime home**: a config identity and a state directory. The tenant is a
**security boundary**. They are not the same thing, and equating them is the single most likely
way to leak data, because it leaves services, files, caches, subprocesses, logs and MCP
credentials outside the boundary it claims to draw.

The profile shape follows the **five agent kinds** the product already defines, not the tenant
count:

| Agent kind | Scope | Profile implication |
|---|---|---|
| Personal assistant | one user, private | principal-bound state; the strictest isolation |
| Role assistant | a role and its holders | role-bound; shared deliberately, within one tenant |
| Context agent | company-owned, acting as a user | the case the session bridge exists to serve |
| Independent agent | company-owned worker | its own identity, role and queue |
| System agent | admin-scoped | operator-only; never tenant-visible |

**Do not default to one profile per tenant or per user.** That is a choice to be **tested**, not
assumed, because a shared runtime home creates real contention and real leakage paths (file
permissions, SQLite locking, environment variables, subprocess inheritance, logs).

### 5.4 Isolation must be proven, not asserted

For every pair of the four data kinds, and for every profile shape, there must be a **negative
test**: two tenants, adversarial, asserting that neither can reach the other's chat, memory,
skill, tool output, cache entry or log line. A tenant string inside a folder name is **not**
isolation and must never be accepted as evidence of it.

---


### 5.5 The deployment boundary: one Hermes per deployment, and tenants inside it are one company

**The owner's ruling, 2026-10-21.** All tenants of one deployment share the one Hermes that deployment
runs, and that is deliberate: a deployment is a **solution for one company**, and the tenants inside it are
that company's branches, departments and units, not separate businesses. The runtime is the company's
shared home, so the experience compounds, the skills and knowledge built on top of it are built once and
benefit every part of the company, and there is one thing to swap when a better engine appears.

**The second companies never share a deployment.** A user of company A and a user of company B are never
tenants of the same deployment. That separation is a **business layer the owner adds on top**, not
something the code is asked to guarantee: the platform's job is to make tenant isolation inside a
deployment real and proven, and the deployment boundary is what keeps two companies from ever needing it
across the wider gap. At this early stage the boundary is drawn at least this strictly.

**Why the boundary sits where it does.** The platform is being built so that users with the right
permissions can understand and change the platform and tenant architecture itself. That power is the
product, and it is also the reason the boundary cannot be lax: a mistake made by a privileged user must
be able to damage one company, never two. Placing the boundary at the deployment also keeps the future
swap cheap, because there is exactly one Hermes per instance to replace, and the tenants of a company are
never coupled to a runtime another company depends on.

**What this does NOT change, and raises the stakes of instead.** Everything in 5.1 to 5.4 still holds and
now matters more, not less: a tenant is still never inferred, the four data kinds are still never
confused, and isolation between tenants inside one deployment is still proven by adversarial negative
tests rather than asserted by a folder name. Tenants of one company are different branches of one
business, and one branch reading another's data is still a leak.

---

## 6. Lifecycle: admission, scheduling, idempotency

### 6.1 Admission, in order

Nothing runs because a model asked. A run exists only after all eight steps:

1. Resolve the authenticated principal and the current tenant/organization membership.
2. Resolve the agent's kind, owner, `actsAs`, role and autonomy gate.
3. Resolve capabilities against policy, data classification, the local/cloud model rule and any
   required approval.
4. Persist an admitted run with an idempotency key, a deadline, a budget and trace ids.
5. Execute with a restricted tool set, no database authority and no ambient credentials.
6. **Re-authorize every business tool call against current state.** A stale envelope does not
   resurrect a revoked permission.
7. Record the tool call, the policy decision, the model and provider, the usage, the approval, the
   data references and the resulting business events.
8. Persist canonical outputs as platform records, keeping the runtime's session mapping separate.

### 6.2 One scheduler

**Our** scheduler owns every business job. Hermes cron may run runtime chores (compaction, cleanup)
and nothing else. Two schedulers over one body of work produces duplicate execution and an audit
trail nobody can trust. A schedule creates a **durable, auditable work record**; it does not fire a
callback.

### 6.3 Idempotency

Every admission carries an idempotency key, every completion is safe to replay, and every retry is
bounded. The sibling project's own incident list is the evidence: a manually constructed run row
lacked the source-task context its callback needed, and a resume path double-counted spend. Both
are avoided by making admission a single path with a durable record.

---

## 7. The incumbent: displacing OpenCode

**This is the section the prior analysis does not have, and it is the one that decides the
schedule.**

Hermes is not arriving on empty ground. The project's own blocker register records it:

> **B-05 — OpenCode cannot be removed in Sprint 0: the platform's own chat is built on it.**
> `packages/ai-assistant/src/modules/ai_assistant/api/chat/route.ts` imports `createOpenCodeClient`
> and `opencode-handlers`. `lib/opencode-handlers.ts` calls
> `process.env.OPENCODE_URL ?? 'http://localhost:4096'`.

And the same register records the decision that follows from it: *"Hermes takes the agent slot.
OpenCode is **not yet removed**."* The spec's open row (**B-05**, §8 row 26) is the design face of
the same question: which runtime boundary, and how it is isolated.

**The precedent that settles the process question.** OpenCode is not a Node library. The AI
module's own README describes it as a *"Go-based AI backend"* started as its own container
(`docker-compose up opencode`), and it is reached over HTTP. So **this product has already run a
non-Node agent runtime, in a different language, as a separate service** (Sprint 0's proven stack
is eight healthy services). The process boundary is therefore not a compromise being imposed on
Hermes; it is the pattern the platform already uses. A Python runtime behind a typed port is a
*better-governed instance of the existing shape*, not a new kind of thing.

So there are **two runtimes in the slot**, and the integration is a **migration with a live
passenger**. The consequences are concrete:

1. **The port is the migration seam.** The chat route must reach the loop through the port rather
   than through `opencode-client.ts`. Build the port first, then move the route onto it while
   OpenCode still serves behind it. This is the same "rewire first, delete second" order the
   blocker already names.
2. **No big bang.** The typed-agent path and the OpenCode path coexist today (the platform is
   explicitly dual-runtime). Adding Hermes creates a **third** if it is done carelessly. The port
   is what keeps it at two, then one.
3. **The deletion is a separate, later, testable step.** Removing `OPENCODE_URL`, the client and
   the handlers is only safe once the chat route is proven on the port. Tracked as **N-8**.
4. **The shared LLM registry already exists, and the blocker names it.** B-05's own remedy is to
   *"rewire the platform chat to the app's own LLM registry"*, and both halves of that registry are
   present: `ai_assistant/lib/model-factory.ts` and
   `shared/src/lib/ai/llm-provider-registry.ts`. Hermes is an **additional consumer** of that
   registry, not a replacement for it.

**Our recommendation, reported as ours:** build the port and move the chat onto it **before** any
Hermes capability is exposed to a user. The runtime can be added behind a port that already works;
it cannot be added behind a route that is still hard-wired to a departing engine.

---

## 8. Security: the gates

Security is not a phase here; it is a **launch gate**, and the order is not negotiable. Granting a
broad tool set before the enforcement layer is complete is not a shortcut, it is an authority
bypass.

**What already exists** (measured): the `ai_worker` principal (`principal.ts`), an authority layer
with decision, graph, preflight and shadow evaluation (`shared/src/lib/authority/`), delegation,
denial and trust endpoints (`core/src/modules/auth/api/authority/`), an API-key module with
migrations, an in-process tool bridge that authenticates before it executes, and a hash-chained
ledger.

**What must be true before broad tools:**

- Deny by default, everywhere, with the denial recorded.
- Tenant, actor, object, field, value and relationship scope all enforced, not just tenant id.
- The AI context firewall: what enters a prompt and what leaves a model are both filtered.
- Approval bound to the **exact** action and version, not to a description of it.
- One ledger entry per decision, carrying the policy version and the decision id (the spec already
  flags that the ledger currently lacks both, and assigns that to **G-16**).

**And the four things that must never be possible:**

1. A model-widened grant. Hermes may propose a call; it may not mint or widen authority.
2. A secret in a prompt, a log or an instruction.
3. A business mutation outside the typed command path and its approval.
4. A second identity plane. No Hermes account, dashboard or pairing flow becomes a way to be
   someone.

---

## 9. Adoption order

Each phase has an exit gate. A phase is not "done" because code exists; it is done when the gate
is measured.

| Phase | What lands | Exit gate |
|---|---|---|
| **0. Pin and map** | Create the pin that does not exist (a recorded source digest and a compatibility harness). Inventory native and transitive dependencies and licences. Map the exact symbols to be called | A digest is recorded; the harness runs; the licence position is stated, including optional components |
| **1. The port, with OpenCode behind it** | The runtime port and the chat route moved onto it. **No Hermes yet** | The chat works through the port; OpenCode is one implementation behind it; the suite is green |
| **2. One tenant, one tool** | A single Hermes worker, one provider, one narrow tool, through the existing authenticated context | Cancellation, retry idempotency, usage capture, bounded memory and CPU, and **no cross-scope access**, all proven on one tenant then on two adversarial ones |
| **3. Durable sessions and governed tools** | Session continuity where it earns its place; provider fallback; more tools, each authorized | Median and p95 time-to-first-token, total latency, tokens, CPU/RSS, database I/O and queue delay measured **against the current assistant** |
| **4. Memory and skills** | Tenant and user scoped, with provenance, review, version, rollback, export and deletion | Contamination tests pass; a skill cannot widen authority; deletion is real |
| **5. Autonomous work** | Recurring and event work through **our** scheduler and queue | Durable run records, per-tenant budgets, a global stop, deadlines, idempotency and audit |
| **6. Execution environments and channels** | Sandboxed terminal, browser, subagents, messaging | A separate threat model, disposable sandboxes, quotas and network policy, and measured cost |

**The product plan sets this order, not preference.** Hermes is unnecessary for the business-model
spine; security precedes broad tools; deterministic Functions never call a model at run time.

---

## 10. Risks, and the control for each

| Risk | Control |
|---|---|
| Cross-tenant leakage through session, profile, file, skill or log | Derive scope from auth; separate roots, permissions, secrets and logs; adversarial negative tests |
| A tool bypassing policy | One door (`in-process-client`); authorize at execution time; no direct database credential in the runtime |
| Prompt injection from tenant knowledge | Treat all retrieved content as untrusted; the context firewall; never let content carry authority |
| An unapproved business mutation | Typed commands plus the approval token bound to the exact action and version |
| Duplicate authority (two model configs, two transcripts, two schedulers, two memories) | Declare one owner per concern; every runtime cache is disposable derived state |
| Unpinned runtime drift | Phase 0 creates the pin; a compatibility harness runs on every change. The sibling's own source-versus-image divergence is the warning |
| Noisy neighbours and unbounded subagents | Per-tenant budgets, queue concurrency caps, deadlines, hard stop controls |
| Runtime state that cannot be exported or deleted | Define import, export, delete, retention and backup **before** broad use |
| A false performance premise | Benchmark representative workflows at realistic concurrency, including queue delay and cold start. A removed network hop is not a speed-up |

---

## 11. What is open, and whose it is

**The runtime boundary (B-05) — DECIDED by the owner, 2026-10-05.** It is the same item as *"OpenCode
cannot be removed yet"*: what occupies the agent slot, and how it is isolated.

**What the owner approved.** One product, one repository, one deployment, one interface (ours), with
Hermes as a **supervised private runtime process behind the internal port**. Hermes is **headless**;
the Starting Kit owns every surface a user sees. Not a separately administered Hermes product, and
not a literal single process.

**What the approval does *not* cover**, so it is not read as wider than it is:

- **When OpenCode goes.** It is still load-bearing (`api/chat/route.ts` is wired to it), so it stays
  until **N-8** rewires the platform chat. The decision settles *what replaces it*, not *when*.
- **The Hermes profile topology.** Deferred with the trigger **the agent gateway**, because a profile
  topology cannot be tested before there is an agent to place in one.
- **Any performance claim.** None was measured, here or in the prior analysis.

The owner raised three challenges before approving. Each is answered below from the source, not from
argument.

### 11.1 The three challenges

**Challenge 1 — "didn't the Hermes documentation give an idea which way to go?"**
It did, and more than an idea. Four independent readings agree, and they are the reason this is no
longer a matter of taste.

| Route | What it says |
|---|---|
| **Hermes' own integration guide** | `programmatic-integration.md` lists the three protocols for driving Hermes from another program. For a custom web host that wants every feature it names the **TUI gateway JSON-RPC**. The only in-process option it offers is `import run_agent.AIAgent` directly, which requires the host to be Python. Ours is Node. |
| **Hermes' own front end** | `web/` is a Vite/React **TypeScript** app. `hermes serve` exposes `/api/ws` and `/api/pty` for the desktop client. `docker-compose.yml` runs `gateway` and `dashboard` as two services. And the strongest form: Hermes' own **Desktop** app, the most integrated client it ships, **spawns** its backend as a child process (`apps/desktop/electron/backend-child.ts`, "the backend IS spawned into its own session/process-group"; it attaches to a backend that is already running and spawns one when there is none). Hermes never puts its own UI inside its Python process. |
| **Hermes' own source** | `gateway/platforms/api_server.py`'s `_answer_through_live_bot_chat` hands a turn to the process that holds the live session, and its own comment names the failure a second writer would cause: *"the open chat never shows the message or the reply, its live context never learns of them, and the two transcripts interleave in state.db"*. **Scope, stated honestly:** it fires only when a live owner is advertised; the mechanism is a ticket file in a shared directory that the owner polls every 0.5s, not a clean RPC; and with no live owner the server falls back to reading and writing `state.db` itself. So the accurate claim is narrower than "the gap is closed": Hermes has a **first-class concept of "the process holding the live session" plus a protocol for handing turns to it**. That is the capability the study wanted, and it is a boundary protocol rather than a shared address space. |
| **Our own documents** | `ARCHITECTURE.md` §5 (add the Hermes **service**), `BLOCKERS.md` **B-01** (a published port, not `network_mode: host`), Sprint 0's definition of done (platform + Hermes + model server). |

**Challenge 2 — "once built and deployed, will the crash threat still exist? And isn't two
platforms worse, since the going-down can happen in two places now?"**
Two halves, and they have different answers.

- *"Fiddly to build"* is a **build cost**, and it does go away when the thing is built. That half is
  conceded.
- *"Can take the whole site down"* is **not** a build cost. It is what sharing one address space
  means, and it is permanent: a fatal fault anywhere in a shared process ends the process.

On the second half the owner is right that two processes have **more failure events**. The trade is
not more against less, it is **frequency against blast radius**:

| Shape | Failure events | Blast radius |
|---|---|---|
| One process | fewer | **total** — the agent takes the business platform down with it |
| Two processes | more | **partial** — the assistant is down, the product is up |

For a multi-tenant product holding a customer's business records, a total outage is worse than a
degraded feature. So the failure being added is a small one and the failure being avoided is a total
one. Also worth stating plainly: what is proposed is **not two platforms**. It is one product, one
repository, one deploy command and one lifecycle, with one internal process boundary.

**Which half of that is measured, and which is not.** The *blast radius* half is measured in the
current stack: in `docker-compose.fullapp.yml` the app's `depends_on` lists postgres, redis and
meilisearch, and **not** OpenCode and **not** Hermes, so the site boots and serves with the agent
down. The *frequency* half (that two processes fail more often) is reasoning, not measurement, and
is stated here as such. One related gap is real and belongs on the list rather than in the argument:
the `hermes` service has `restart: unless-stopped` but **no healthcheck**, so today a wedged runtime
is invisible to the platform. That is a fix, not a reason to merge the processes.

**Challenge 3 — "isn't one place more organic, given we are tailoring Hermes for our own needs?"**
Partly right, and the part that is right matters most.

- **Right: the front end should be one place, and it should be ours.** We do not ship Hermes'
  dashboard. Hermes becomes headless and the Starting Kit owns the interface. That is exactly what
  Hermes itself does (its dashboard is a separate app it can drop), and it removes the duplication
  the owner can actually see.
- **Not right: tailoring does not imply co-location.** Most tailoring is not even source level.
  Hermes exposes a supported extension surface: `config.yaml` (its own example file is 124,215
  bytes), `plugins/` with `ctx.register_tool` and `ctx.register_middleware`, `optional-skills/` with
  `hermes skills install`, and the toolset configuration. Where source level *is* needed (a fork
  that deletes features and adds our toolsets), that is still a **source** activity, and running in
  one process is a **process** choice. The two are independent: an edited fork runs in a container
  exactly as an unedited one does.
- **And in-process is not on the menu anyway.** Node 24 cannot execute Python. "Building it inside"
  means one of: a TypeScript rewrite of the agent loop (throwing away the thing we chose Hermes
  for), a native Python-in-Node bridge (the fiddly one), or a supervised process. The third gives
  the owner "one place" in every sense that matters, one repository, one command, one lifecycle, one
  log, without the crash coupling, and it is what Sprint 0's compose already does.

### 11.2 The shape, as approved

- **Approved by the owner 2026-10-05:** one product, one repository, one deployment workflow, one
  interface (ours), with a supervised private Python runtime behind the internal port. Not a
  separately administered Hermes product, and not a literal single process.
- **Why not in-process:** Node 24/TypeScript and Python are different runtimes. A native bridge adds
  lifecycle and crash-coupling complexity with no measured benefit, and unlike a build cost it never
  goes away. A monorepo does not make anything faster by itself.
- **Why the hop is not the bottleneck people fear:** on the direct streaming path the interactive
  turn crosses the boundary as **one** connection, not a round trip per token. The API server's SSE
  queue is an in-process `asyncio.Queue` and deltas go straight to the socket, so there is no
  per-token database trip, and tool calls execute in-process with their events on the same stream.
  The one extra request is an **approval**: a turn that parks for a human decision carries a second
  client-to-server call (`POST /v1/runs/{id}/approval`). That is per-approval, not per-token.
  **The caveat, measured:** the *live-owner* lane does not stream. It awaits the settled receipt on
  the 0.5s poll and emits a single completion, so choosing live-session ownership currently costs
  token streaming. That is a real trade to decide when the adapter is built, not a defect in the
  boundary.
- **What would change the answer:** a benchmark showing the process boundary is the bottleneck.
  Until then the boundary is the safe default, and it is reversible.

**Deferred, each with the trigger that brings it back:**

| Deferred | Trigger |
|---|---|
| The Hermes **profile topology** (§5.3) | the **agent gateway** exists, so a profile can be tested rather than guessed |
| The Hermes version-compatibility harness | the adapter exists (already tracked as N-11) |
| The runtime-state database row | **G-09**, so it is written once, with the registry's own row |
| The performance benchmark | Phase 3's exit gate, when there is something to measure |
| Memory, skills, subagents, sandbox | their phases in §9 |

---

## 12. How this was verified

Every factual claim above was read from the source on 2026-10-05, not taken from a report about it.

- **The platform**: `workspace/starting-kit` at HEAD `fc96340`, tree clean. The package list (counted:
  **21**), `@open-mercato/ai-assistant` 0.6.7, the AI module's file tree, the 2,044-line
  `agent-runtime.ts`, `in-process-client.ts`, `principal.ts`, `authority/` and the
  `auth/api/authority/` endpoints were all listed or read directly. The OpenCode claim was read from
  the **route itself**, not from the blocker note: `api/chat/route.ts` lines 9 and 10 import
  `opencode-handlers` and `createOpenCodeClient`, and `opencode-handlers.ts` line 178 is
  `process.env.OPENCODE_URL ?? 'http://localhost:4096'`. The dual-runtime statement is the AI
  module's README verbatim: *"Both stacks coexist: OpenCode Code Mode keeps powering the Command
  Palette and `/api/chat` unchanged; the new typed framework adds focused, mutation-capable agents
  alongside it."*
- **Hermes**: `hermes-agent-main`, `pyproject.toml` (`requires-python`, `version`, the
  `python_version` dependency markers), `.python-version`, `pm/lock.json`, `LICENSE`, `Dockerfile`,
  and the top-level tree. It has **no `.git`**.
- **The product's plan**: `BLOCKERS.md` (B-05 and the resolved two-runtime row), `AGENT-HALF.md`
  (the five agent kinds), `SPEC-business-model-kernel.md` (§8 row 26 and §9).
- **The prior analysis**: all six files in `analysis/`, read in full.

**Three routes, not two, for the claim that decides the schedule.** That the agent slot is already
occupied was confirmed three independent ways: from `BLOCKERS.md`'s own definition of B-05; from the
resolved row recording that Hermes takes the slot while OpenCode is not yet removed; and from the
chat route's source, which imports the OpenCode client and reads its URL.

**And four routes for the Python version**, which is why it is stated flatly: `pyproject.toml`'s
`requires-python`; `.python-version`; `pm/lock.json`'s pinned `cpython-3.14.7` for every platform;
and the `python_version >= '3.14'` marker on the core dependencies. **The first two alone would have
supported a wrong answer** (a range that looks like "3.11 to 3.14"), and it took the third and
fourth to show the floor is an updater escape hatch and the requirement is 3.14 exactly. That is the
reason the marker column exists.

**One claim in this document was wrong in its first draft, and was corrected by the owner's own
challenge.** The first draft said the container "is not automatically 3.14" because the base image
is Debian with the distro Python. Measured: the image installs Python through its own package
manager (`pm`) at a pinned 3.14.7, and never uses the apt Python for the runtime. The correction is
recorded in §0 rather than quietly fixed, because the wrong version of it had already been written
down and acted on.

**Four routes for the boundary claim** in §11.1, which is why it is stated as fact rather than
preference: Hermes' own integration guide (the protocol table and the Python-only in-process
option); Hermes' own front-end shape (`web/` is TypeScript, `hermes serve` gives `/api/ws`, and
`docker-compose.yml` runs two services); Hermes' own source (`_answer_through_live_bot_chat` and the
comment inside it); and our own documents (`ARCHITECTURE.md` §5, `BLOCKERS.md` B-01, Sprint 0's
definition of done). The routes were read independently, and the fourth is the one that shows this
was already decided before the question was asked.

**Two hostile passes were run against §11, and both changed it.** The first pass broke four things,
and they were corrected rather than defended: the claim that Hermes "closes" the warm-session gap
was too broad (the lane fires only when a live owner is advertised, and the mechanism is a shared
ticket file polled at 0.5s); "the interactive path has no extra round trip" missed the approval call;
the frequency-versus-blast-radius trade was presented as if both halves were measured when only the
blast-radius half is; and the statement that tailoring is a source-level activity was wrong in the
common case (the supported surface is `plugins/`, `optional-skills/` and `config.yaml`). A second
pass then checked the corrections: all held, and it added three refinements (the approval request,
the exact size of the config example, and that the Desktop attaches before it spawns). The desktop
spawn fact and the missing Hermes healthcheck were both found *by* those passes, not by the first
draft.

**What this document does not claim.** No performance figure, no throughput, no concurrency limit
and no operational guarantee. None was measured, and none should be assumed from this design. In
particular, the claim that the process boundary is *not* the bottleneck is an inference from how the
streaming API is shaped, not a benchmark, and it is listed in §11.2 as the thing that would change
the recommendation if measured otherwise.
