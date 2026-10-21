# PLAN-T-16 — two gates answer "the authority dependency is missing" in opposite directions

**Status:** REQUIREMENT ONLY, written 2026-10-21. **No code is written.** §3 is the requirement;
§4 is the proof the build will have to pass. The row stays open until both are done.
**Row:** `T-16` in `PREVIEW-AUDIT-TRIAGE.md` §6, carried as `MASTER-CHECKLIST.md` §9.4.
**Slot:** 0, before `CC-121` re-keys every `principal_id` through this gate.
**Measurement:** read from source on 2026-10-21, at the lines named below.

---

## 1. The defect, measured

Two doors guard the same thing, and they disagree about one state.

| Door | When the authority dependency is **not registered** | Lines |
|---|---|---|
| the **tool** door, `checkToolAuthority` | **refuse** (`bindingRule: 'enforcement-unreachable'`) | `ai_assistant/lib/tool-authority.ts:154-173` |
| the **command** gate, `authorityCommandGate.beforeExecute` | **return** — the act runs ungoverned | `auth/commands/interceptors.ts:189-199` |

Both comments justify themselves, and they contradict:

> *tool door:* "The dependency could not be reached. In `enforce` this is a refusal — see the header. The
> mode is unknown here, so it is read as the strictest position the platform ships with a switch for, and
> the call is refused."

> *command gate:* "Neither registered — a lean bootstrap. Nothing to gate with, so nothing is gated. An
> absent dependency is not evidence of a constraint."

### 1.1 The reachable consequence

In a deployment that does not register the authority module, an assistant **cannot call its tools** (every
tool is refused) but **can execute any command that declares a capability** (every command passes
ungoverned). The platform is simultaneously "enforcing" and "not enforcing", and which answer you get
depends on which door you walked through.

### 1.2 The distinction both doors are missing

The tool door wraps **two different failures in one `try`**: the `container.resolve` and the
`resolver.modeFor()` call. Those are not the same event:

| State | What it means | Right answer |
|---|---|---|
| **not registered** | the deployment chose not to gate | permit — nothing to gate with |
| **registered but unreachable** | the deployment meant to gate and cannot | refuse — a gate that cannot ask must not wave through |

The command gate already separates them by construction: the `resolve` is inside the `try`, and
`enforcement.modeFor(tenantId)` (`:203`) and `enforcement.decideFor(...)` (`:222`) are outside it, so an
unreachable service throws and fails the act. **The tool door is the one that cannot tell the two apart**,
which is why it refuses on the state that should permit.

### 1.3 What the audit's sentence gets right, and the two things it adds

Right: the two gates fail in opposite directions on a missing dependency, and the tool door's own header
names the pattern it falls into.

The audit then names two further things, both real, and **neither is this row**:
- **Code Mode resolves `endpoint.requiredFeatures` from the OpenAPI spec and calls `hasRequiredFeatures`
  directly**, never reaching `checkToolAuthority`. A third, parallel authorizer.
- **The HTTP RBAC path passes no options** (`onBehalfOfUserId`, `recordId`), so the invoker ceiling, the
  record-lock ceiling and the project overlay are absent on the plain HTTP path. That is `CC-10`, already
  registered and still open.

---

## 2. Why it matters

This is the shape the project has now found three times (`CC-101`, `CC-132`, `T-07`): **a control that
behaves differently depending on where it is called from.** An operator reading the tool door's log sees
refusals and concludes the platform is enforcing. An operator reading the command gate's log sees nothing
and concludes it is not. Both are reading a true log of a false system.

`T-16` is in Slot 0 because `CC-121` re-keys every principal through this gate, and a gate whose answer
depends on the door is a gate the re-key cannot make trustworthy.

---

## 3. The requirement

**R1 — one shared rule for "the authority dependency is missing", stated once.** A single helper, used by
both doors, that classifies the failure and returns the answer. Not two comments that disagree.

**R2 — "not registered" permits.** A deployment that did not register the module chose not to gate, and
refusing every tool there breaks a working deployment for a constraint it never asked for.

**R3 — "registered but unreachable" refuses.** A deployment that meant to gate and cannot reach the gate
must not have the act run ungoverned. This is the tool door's existing behaviour and it is right; the
command gate already fails closed here by throwing.

**R4 — the tool door distinguishes the two.** Its single `try` is split so a failed `resolve` and a failed
`modeFor` take different paths. This is the actual code change, and it is small.

**R5 — a guard that pins both directions.** One test per state per door: four cases. A mutation that
re-merges the two paths, or that flips either answer, goes red.

**Out of scope, deliberately:** Code Mode's parallel authorizer, and `CC-10`'s missing options. Both are
named in §5 with the rows that own them.

---

## 4. The proof

| # | Mutation | Must go RED |
|---|---|---|
| M1 | The tool door's `try` is merged again, so an unregistered service refuses | R2, R4 |
| M2 | The tool door permits on an unreachable service | R3, R4 |
| M3 | The command gate begins refusing on an unregistered service | R2 |
| M4 | The shared rule is duplicated instead of shared, and the two copies drift | R1 |
| M5 | The classification is removed entirely, which is the defect this row is about | R1, R2, R3 |

Plus: the `ai_assistant` and `core` suite counts, and `tsc --noEmit` at 0, as numbers.

---

## 5. Named debts, each a row rather than a note

| Debt | Why it is not this row | Where it goes |
|---|---|---|
| **Code Mode is a third authorizer.** It resolves `endpoint.requiredFeatures` from the OpenAPI spec and calls `hasRequiredFeatures` directly, so record locks, project overlays, trust tiers, tenant policy and the org graph are all invisible to it | It is a whole missing control, not a disagreement between two existing ones. The path-traversal and method guards there are genuinely good; the authorization is a different control | A new row, opened by this measurement |
| **The HTTP RBAC path threads no options** (`onBehalfOfUserId`, `recordId`), so an API key doing a read over HTTP is resolved as an invokerless machine, which widens the answer | Already registered and still open | `CC-10` |
