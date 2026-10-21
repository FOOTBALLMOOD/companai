# PLAN-T-15 — the confirm path drops the binding's narrowing

**Status:** REQUIREMENT ONLY, written 2026-10-21. **No code is written.** §3 is the requirement;
§4 is the proof the build will have to pass. The row stays open until both are done.
**Row:** `T-15` in `PREVIEW-AUDIT-TRIAGE.md` §6, carried as `MASTER-CHECKLIST.md` §9.4.
**Slot:** 0, before `CC-121` re-keys every `principal_id` through this gate.
**Measurement:** read from source on 2026-10-21, at the lines named below.

---

## 1. The defect, measured

An agent is bound to a principal with a **narrowing**: a tool allowlist and a required-feature list. The
narrowing is computed by `computeBoundRunScope` (`ai_assistant/lib/agent-binding.ts:134-153`) and it is
**intersection on tools, union on features**:

```ts
allowedTools = binding.toolAllowlist === null
  ? [...declaredTools]
  : declaredTools.filter((tool) => binding.toolAllowlist.includes(tool))
requiredFeatures = new Set([...declaredFeatures, ...binding.requiredFeatures])
```

**The two dispatch paths use it, and the confirm path does not.**

| Path | Resolves the agent | Computes the scope | Enforces it |
|---|---|---|---|
| `api/ai/chat/route.ts:570-613` | `resolveAgentDefinition` (code first, tenant row second) | **yes**, `:613` | via `checkAgentPolicy` |
| `api/ai/run-object/route.ts:199` | same | **yes** | yes |
| `api/ai/actions/[id]/confirm/route.ts` | **`getAgent(row.agentId)` — the global registry**, `:171` | **no** | **no** |

The confirm route re-checks the binding's **boolean** (`resolveAgentBinding`, `:207`, and refuses when
`!binding.bound`) — that is `CC-56`, closed — and then executes the stored pending action at `:229`
without applying the narrowing at all.

So: a binding that was narrowed at dispatch, meaning the tool was allowed and the features were required
at that moment, is executed at confirm **as though it had never been narrowed**.

### 1.1 The second defect, which is why the first one is not a one-line fix

`getAgent(row.agentId)` (`:171`) reads the **global registry**. `CC-126` states the consequence in the
docblock of `computeBoundRunScope` itself: *"a tenant-authored type is a row, not a registry entry, so the
caller resolves one (code layer first, tenant type second) and hands it in."*

A confirm for a **tenant-authored** agent type therefore:
- sees no agent definition at all if the id is not in the global registry, or sees the **wrong** one;
- and any narrowing computed from that wrong definition would be wrong in the direction of **permission**,
  because a missing definition yields the empty tool set and the binding's features alone.

**The two defects compound, and they must be fixed together.** Computing the scope from a globally-resolved
agent would look like a fix and would be wrong for exactly the agents the tenant layer exists to serve.

---

## 2. Why it matters

The confirm path is the one where a **human approves** a machine's proposed act. An approval that widens
what was approved is the worst place for a gap: the narrowing is the promise that a binding cannot be used
beyond its allowlist, and the confirm path currently keeps that promise only in the case where the binding
was never narrowed in the first place.

`T-15` is in Slot 0 because `CC-121` re-keys every principal, and the narrowing is computed against the
principal's binding. A path that skips the narrowing is a path the re-key cannot make safe.

---

## 3. The requirement

**R1 — the confirm path resolves the agent the same way the dispatch path does.** `resolveAgentDefinition(
{ agentId, scope: { tenantId }, em })`, which is code-first and tenant-row-second. **Not** `getAgent`.
Default taken because it is the helper the two working paths already use and the docblock of the function
this row is about names it.

**R2 — it computes the bound scope.** `computeBoundRunScope({ agent, binding })` with the resolved agent
and the binding the route already re-checked. One call, no new vocabulary.

**R3 — it enforces both halves, and fails closed.** The pending action's `toolName` must be in
`allowedTools`, and the caller must hold every feature in `requiredFeatures`. Either failure is a **403**
naming which half refused, not a log line. A narrowing that is computed and ignored is worse than none,
because it makes the gap invisible to a reader of the code.

**R4 — the human path is not special-cased.** A human confirming an act outside the narrowing is refused
for the same reason a machine is. The narrowing belongs to the **binding**, not to the caller's kind, so
"a human approved it" is not a reason the allowlist stops applying. `CC-56`'s comment says a human
confirm is byte-identical to before *for the boolean leg*; this row does not extend that to the narrowing.

**R5 — a guard that pins both halves.** A test for a tool outside the allowlist, a test for a feature the
caller lacks, and a test that a tenant-authored type is resolved rather than looked up globally. Three
mutations, one per rule.

**Out of scope, deliberately:** changing what a narrowing means (intersection/union), the tier ladder, or
the dispatch paths, which already comply.

---

## 4. The proof

| # | Mutation | Must go RED |
|---|---|---|
| M1 | The scope is computed but not enforced (logged, not refused) | R3 |
| M2 | Only the tool allowlist is enforced, not the features | R3 |
| M3 | The agent is resolved from the global registry again | R1 |
| M4 | The enforcement runs before the binding re-check, so a revoked binding reports the wrong reason | ordering |
| M5 | The call is removed entirely, which is the defect this row is about | R2, R3 |

Plus: the `ai_assistant` module suite count, and `tsc --noEmit` at 0, as numbers.

---

## 5. Named debts, recorded rather than fixed here

| Debt | Why it is not this row |
|---|---|
| The same `getAgent` global-registry lookup may exist on other confirm-adjacent paths | It is the same defect class, but each path needs its own measurement; this row measures the one the audit names |
| `computeBoundRunScope` reads `binding.toolAllowlist === null` as "all declared tools", so a null allowlist is the permissive case | It is the documented semantics and changing it would widen every existing binding |
