# PLAN-T-17 — the model allowlist fails open on the provider axis

**Status:** REQUIREMENT ONLY, written 2026-10-21. **No code is written.** §3 is the requirement;
§4 is the proof the build will have to pass. The row stays open until both are done.
**Row:** `T-17` in `PREVIEW-AUDIT-TRIAGE.md` §6, carried as `MASTER-CHECKLIST.md` §9.4.
**Slot:** 0, before `CC-121` re-keys every `principal_id` through this gate.
**Measurement:** read from source on 2026-10-21, at the lines named below.

---

## 1. The defect, measured

`enforceAllowlist` (`ai_assistant/lib/model-factory.ts:836-882`) is documented as never throwing, and it
keeps that promise. The problem is **what it keeps**.

### 1.1 The provider axis

When the resolved provider is outside the allowlist it asks `pickAllowedProvider` for a replacement. If
one is configured, it is used. **If none is, the resolved provider is kept anyway** (`:861-863`):

> *"If no replacement is configured we keep the resolved provider — the throw at the api-key gate will
> surface the misconfiguration to the operator instead of silently masking it."*

That reasoning does not hold. A provider that is configured **has its key by definition** — that is what
`isConfigured` tests — so the api-key gate never fires. The scenario is reachable and the constraint is
simply not applied:

```
OM_AI_AVAILABLE_PROVIDERS=openai     (a data-residency policy)
agent default → anthropic
ANTHROPIC_API_KEY set, openai unconfigured
pickAllowedProvider returns null  →  the request goes to Anthropic
```

### 1.2 The model axis fails open too, in the opposite way

`pickAllowedModel` (`:886-905`) returns `provider.defaultModel` when the allowlist for that provider is an
**empty array**:

```ts
if (allowed === undefined) return preferred?.length ? preferred : provider.defaultModel
...
return allowed[0] ?? provider.defaultModel     // allowed = [] → the default
```

`undefined` means "no allowlist configured", which is correct. An **empty array** means *no models
permitted*, and it yields the default. Two different states, one answer.

### 1.3 And the settings route accepts the empty list without challenge

The audit's third clause: an empty `allowedModelsByProvider` is accepted by the settings route without
asking whether the operator meant "none".

### 1.4 What the audit gets right

All of the above. The row's one-line summary — *the model allowlist fails open on the provider axis* — is
accurate and understated: **there are two fail-opens on the same axis, plus a route that will happily
store the state that causes the second.**

---

## 2. Why it matters

`OM_AI_AVAILABLE_PROVIDERS` is described in the code as the operator's **ultimate** constraint on which
provider a tenant may reach, and it is the shape a data-residency policy takes. A constraint that is
documented as ultimate and silently not applied is worse than no constraint, because the operator has a
reason to believe it holds.

`T-17` is in Slot 0 because `CC-121` re-keys every principal, and an act that reached a provider the
operator forbade is an act the re-key will faithfully carry forward.

---

## 3. The requirement

**R1 — a provider outside the allowlist with no permitted replacement is a refusal.** The request fails
with a named error, and the operator's log says which constraint refused it. The "the api-key gate will
catch it" reasoning is removed, because it is false for a configured provider.

**R2 — an empty model allowlist means no models permitted, not the default.** `pickAllowedModel` returns
`null` for that state, and the caller refuses. `undefined` (nothing configured) keeps today's behaviour.

**R3 — the settings route distinguishes the two states.** Storing an empty list is allowed, but it is
recorded and surfaced as *no models permitted* rather than silently meaning *no constraint*. Default taken:
the route accepts it and the effective allowlist reports it, because refusing to store it would leave an
operator with no way to express "none".

**R4 — one guard, pinning both axes.** A test for each fail-open, and a mutation that restores either one
goes red.

**Out of scope, deliberately:** changing what `undefined` means, the tenant-override intersection, or the
fallback chain's warning text.

---

## 4. The proof

| # | Mutation | Must go RED |
|---|---|---|
| M1 | The resolved provider is kept when no replacement is configured | R1 |
| M2 | An empty model allowlist falls back to the default model | R2 |
| M3 | `undefined` and `[]` are collapsed back into one branch | R2 |
| M4 | The settings route accepts an empty list and reports it as unconstrained | R3 |
| M5 | The refusal is downgraded to a warning and the request proceeds | R1, R2 |

Plus: the `ai-assistant` suite count, and `tsc --noEmit` at 0, as numbers.

---

## 5. Named debts

| Debt | Why it is not this row |
|---|---|
| The tenant-override intersection (`intersectAllowlists`) can itself widen a set if a tenant names a provider the env does not | It is a different function with its own tests; this row is about the fail-open at the end of the chain, and the intersection is where the set is built. It becomes a row when somebody measures it. |
