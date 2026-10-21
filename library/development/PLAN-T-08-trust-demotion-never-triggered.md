# PLAN-T-08 — trust demotion is never triggered

**Status:** **BUILT and CLOSED 2026-10-21.** **7 tests, 5/5 mutations PROVEN.** §3 is the requirement,
§4 is the proof, §8 is what was built.
**Row:** `T-08` in `PREVIEW-AUDIT-TRIAGE.md` §6, carried as `MASTER-CHECKLIST.md` §9.4.
**Slot:** 0, before `CC-121` re-keys every `principal_id` through this gate.
**Measurement:** read from source on 2026-10-21, at the lines named below.

---

## 1. The defect, measured

`TrustService.demoteIfEvidenceDemands` exists, is documented, and is tested. It has **no caller in
production**:

| Symbol | Production callers | Test callers |
|---|---:|---:|
| `demoteIfEvidenceDemands` (`auth/services/trustService.ts:196`) | **0** | 4 |
| `promote` (same file, `:118`) | **1** (`auth/api/authority/trust/route.ts:125`) | tested |
| `demote` (same file, `:157`) | **1** (`demoteIfEvidenceDemands` itself) | tested |

So the platform has a **ratchet with only one direction wired**: authority can be raised on evidence, and
the one function that lowers it on evidence is never invoked.

### 1.1 What the demotion would actually do

`demoteIfEvidenceDemands` reads the evidence and, if the trigger fires, drops the principal one tier
(`trustService.ts:196-207`). The evidence is a ratio over the action log
(`evidenceFor`, `:78-105`):

```
completedActs = count(*) where execution_state in ('done','undone','redone')
overriddenActs = count(*) where execution_state = 'undone'
filtered to the tenant, the actor, and command_id like '<capabilityGroup>.%'
```

and the trigger (`packages/shared/src/modules/trust.ts`, `demotionTriggered`) is:

```ts
if (evidence.completedActs < 10) return false
return evidence.overriddenActs / evidence.completedActs >= PROMOTION_MAX_OVERRIDE_RATE
```

The same rate that *blocks a promotion* *demands a demotion*. That symmetry is invariant **I9**, stated in
the docblock of `demote`: *"the asymmetry between this and `promote` is the safety property, not an
inconsistency"* — a demotion needs no approval, no threshold beyond the trigger, and takes effect on the
next decision.

### 1.2 The trigger the code already names, and why it is now cheap

`demoteIfEvidenceDemands`'s docblock is explicit about **when** it should fire (`:189-195`):

> *"Called after an act is reversed rather than on a schedule, so 'immediate' means immediate. A sweep
> would leave a worker at its old tier for however long the interval is, which is the window the
> specification is trying to close."*

An act is reversed in exactly one place: `CommandBus.undo` (`shared/lib/commands/command-bus.ts:490`),
which **this week's `T-06` work already touched**, and which now writes its trace and chain event inside
the caller's transaction. The trigger and the hook are the same line of code, which is why this row is
smaller than its audit sentence suggests.

### 1.3 What the audit's sentence gets right and wrong

Right: the function is unreachable, and an unreachable safety control is a defect regardless of its tests.
Wrong by omission: nothing in the row says the missing caller is a **one line addition at a site that was
already being modified**, and nothing says the trigger is *already computed* rather than needing to be
built.

---

## 2. Why it matters

A principal whose acts keep being reversed stays at their tier forever. The promotion path refuses on the
same evidence, so the platform will not raise such a principal and will also not lower them: the ratchet
is stuck in the direction that favours the machine. `T-08` is in Slot 0 because `CC-121` re-keys every
`principal_id`, and a tier that never moves is a field the migration will faithfully carry forward.

---

## 3. The requirement

**R1 — the call site is `CommandBus.undo`, after the trace is written.** Not the undo route: the bus is
the one place a reversal is known, and `T-06` put the trace and its chain event inside the caller's
transaction, so the demotion can run in the same transaction as the act it is judging. A route-level hook
would miss every caller that is not a route.

**R2 — the actor demoted is the actor whose acts were reversed**, which is `log.actorUserId` on the
original action-log row, not the person performing the undo. `evidenceFor` counts
`action_logs.actor_user_id = principalId`, so demoting the undoer would change the evidence of a
different principal. **Default taken:** `log.actorUserId`; when it is null (a system or key-only act) the
call is skipped, because there is no principal to demote.

**R3 — the capability group is the undone command's own module segment.** `log.commandId` is
`customers.people.update`; `evidenceFor` matches `command_id like '<group>.%'`, so the group is the
segment before the first dot. No new vocabulary, and it is the same derivation `promote`'s caller uses.

**R4 — a failed demotion never fails an undo.** The undo completes and the error is logged. Default taken
because the ordering matters: a reversed act with no record is worse than a tier that moved late, and
`demoteIfEvidenceDemands` is best-effort by construction (it returns `null` when nothing is warranted).
The demotion must also run **after** the trace row is visible, so the count includes the reversal that
triggered it.

**R5 — a guard that proves the call exists.** A test asserts the demotion is attempted on undo with the
right actor and group, and a mutation that removes the call goes red. `T-07` is the precedent: a control
nobody calls is invisible, and this row exists because that was true for four months.

**Out of scope, deliberately:** changing the threshold, the tier ladder, or the definition of an
override. `PROMOTION_MAX_OVERRIDE_RATE` and I9 are settled design, not part of this row.

---

## 4. The proof

| # | Mutation | Must go RED |
|---|---|---|
| M1 | The demotion call is removed from `undo` | R1, R5 |
| M2 | It is called with the undoer's id instead of the original actor's | R2 |
| M3 | The capability group is hardcoded or mis-derived | R3 |
| M4 | A throwing trust service makes the undo fail | R4 |
| M5 | The call runs before the trace is written, so the count excludes it | R4 |

Plus: the command-bus suite count, the auth suite count, and `tsc --noEmit` at 0, as numbers.

---

## 5. Named debts, recorded rather than fixed here

| Debt | Why it is not this row |
|---|---|
| **Undoing someone else's act improves the undoer's own evidence.** The trace row carries `actor_user_id = ctx.auth.sub` and `execution_state = 'done'`, so the undoer gains a completed act while the original actor gains an overridden one. That is defensible (the undoer did perform an act) but it means a tenant-level undoer can dilute their own override rate by undoing others. | It is a property of how evidence is counted, not of the missing caller. It becomes a row when somebody decides whether the trace should count at all. |
| The `command_id like '<group>.%'` match means a command whose id does not start with its module is invisible to the evidence query | A convention, already noted in the source (`:95-97`), and changing it changes every tier in the system |

---

## 8. What was built

One private method and one call, in `packages/shared/src/lib/commands/command-bus.ts`:

```ts
await this.runInTransaction(ctx, async () => {
  await undoHandler({ ... })
  await service.markUndone(log.id, this.buildUndoTraceLog(log, ctx))
  // T-08: the caller demotion never had. After the trace, so the evidence
  // count includes the reversal that triggered it.
  await this.demoteTrustAfterUndo(log, ctx)
})
```

`demoteTrustAfterUndo` does four things in order: read the **original** actor from the log row and
return if there is none; derive the capability group from the command id's module segment; resolve
`trustService` and return if the deployment has none; call `demoteIfEvidenceDemands` inside a
try/catch that logs and swallows.

The type import is `import type { TrustService }`, the same style `ActionLogService` already uses, so
`packages/shared` gains no runtime dependency on core.

**Proof:** 7 tests (`command-bus.undo-trust.test.ts`), **5/5 mutations PROVEN** with every file
restored byte-identical, core **663 suites / 5,839 tests**, `tsc --noEmit` 0 for shared and core.

**One false alarm, recorded because it looked like a defect.** The shared suite reported
`dynamicLoader.tsconfig.test.ts` failed with **0 test failures**, which is the load-failure signature
(`CC-99`). It passes **8/8 on its own in 21s**; it ran in 74s while a `tsc --noEmit` was competing for
memory, and its cases are time-based with real compiles and two-second sleeps. A load failure under
contention, not a code failure.
