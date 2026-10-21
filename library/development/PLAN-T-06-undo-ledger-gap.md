# PLAN-T-06 — the undo record the chain does not cover

**Status:** REQUIREMENT ONLY, written 2026-10-21. **No code is written.** §3 is the requirement;
§4 is the proof the build will have to pass. The row stays open until both are done.
**Row:** `T-06` in `PREVIEW-AUDIT-TRIAGE.md` §6, carried as `MASTER-CHECKLIST.md` §9.4.
**Slot:** 0, before `CC-121` re-keys every `principal_id` through this gate.
**Measurement:** read from source on 2026-10-21, at the lines named below.

---

## 1. The defect, measured

The platform keeps **two** records of a change, and only one of them is proof.

| Record | Written by | Tamper evident |
|---|---|---|
| `action_logs` (the journal) | `ActionLogService.log()` | **no**, an ordinary table, editable |
| `ledger_events` (the chain) | `LedgerService.append()`, called from `appendToLedger` | **yes**, each row carries its predecessor's hash per tenant |

`log()` does both: it writes the journal row and then extends the chain
(`actionLogService.ts:242-244`, `:270-287`). The docblock states the intent plainly: *"the chain cannot
fall behind the record it proves, a module cannot audit something and forget to chain it"* (`:250-260`).

### 1.1 The one write path that does not go through `log()`

`CommandBus.undo` reverses a command and then records the reversal
(`command-bus.ts:490`, `:536`):

```
await handler.undo({...})
await service.markUndone(log.id, this.buildUndoTraceLog(log, ctx))
```

`markUndone` (`actionLogService.ts:736`) does three things on **its own forked EntityManager**:

1. flips the original row's `executionState` to `'undone'` and clears its `undoToken`;
2. builds the trace row with `createLogEntity(...)` and persists it;
3. flushes.

**It never calls `appendToLedger`.** `createLogEntity` is the entity factory, not `log()`, so the trace
row is written to the editable journal and **no event is appended to the chain**.

### 1.2 The asymmetry that makes this a defect rather than a design choice

Redo takes the other route (`redo/route.ts:155`, `:161`):

```
const { logEntry } = await commandBus.execute(log.commandId, {...})
await logs.markRedone(log.id)
```

A redo **re-executes the command**, and `execute` reaches `log()`, which chains. So the same reversal
operation is covered when it goes forward and uncovered when it goes backward.

### 1.3 What verification cannot see

`LedgerService.verifyTenantChain` (`:313`) walks the chain's own rows and checks each hash against its
predecessor. A missing event is **not a broken link**: the chain stays internally consistent, it simply
never mentions the undo. So:

- delete the trace row from the journal, and the chain still verifies;
- the evidence that a write was reversed disappears, and nothing reports it.

That is the row's own sentence, and it is exact: **a ledger with a known gap stops being evidence.**

### 1.4 A second thing in the same method, measured but not conflated

`markUndone` writes on `this.em.fork()` (`:737`) while `log()` writes on `this.em`. `appendToLedger`'s
docblock requires appends to run *"inside the caller's transaction"* so the journal row, the chain event
and the business change commit together or not at all (`:262-269`). A fork may commit separately.

This is an **atomicity** question, not a chaining one, and it is named here so the build does not
mistake one for the other. Whether it is a live defect depends on how the fork inherits the caller's
context, which the build must measure rather than assume.

---

## 2. Why it matters

The chain is the platform's answer to *"prove this record was not altered"*. An undo is the operation
that **reverses a consequential act**, which makes it the single most valuable row to alter after the
fact: an actor who wants their action to look as though it never happened deletes the undo, and the
proof still says the act occurred and was never reversed.

`T-06` is in Slot 0 because `CC-121` re-keys every authority record through this gate. Re-keying through
a chain with a known gap produces a clean answer about a partial system.

---

## 3. The requirement

**R1 — the undo trace is chained.** The trace row is written through the same funnel as every other
journal row, or `markUndone` appends the equivalent ledger event itself. One home for the rule, so a
future write path cannot miss it again.

**R2 — the chain says it was a reversal.** Today `appendToLedger` sets `eventType: data.commandId`
(`:289`), so an undo of `customers.people.update` would append an event indistinguishable in type from
the original act. The event must carry the marker the trace row already builds: `historyAction: 'undo'`
and `sourceLogId` (`command-bus.ts:buildUndoTraceLog`). **Default taken:** keep `eventType` as the
command id, so existing consumers keep working, and put the marker in the payload. Reversing the
original act and reversing the reversal must be distinguishable by reading one event.

**R3 — the state change and the chain agree.** A journal row claiming `executionState: 'undone'` must
have a matching chained undo event naming it as `sourceLogId`. Verification reports a row that claims to
be undone with no such event, and an undo event whose source row is not `undone`. Both directions,
because either one alone can be satisfied by an attacker who edits the other.

**R4 — the same transaction.** The trace row and its chain event commit with the business reversal or
not at all, per the rule `appendToLedger` already states. If the fork prevents that, the fork is what
changes, not the rule.

**R5 — the asymmetry is pinned.** A test asserts that **both** redo and undo leave a chained event, so a
future refactor of either path cannot silently lose one. Redo satisfies this today by construction; the
test exists to keep it true, not to fix it.

**Out of scope, deliberately:** the ledger's payload must not start carrying snapshots. It holds
pointers and digests only (`:296-311`), and an undo is no reason to change that.

---

## 4. The proof

Every rule gets a test that fails when the rule is removed, and the denominators are asserted
(`LESSONS.md` L21).

| # | Mutation | Must go RED |
|---|---|---|
| M1 | `markUndone` writes the trace row without appending to the chain (today's behaviour) | R1 |
| M2 | The append happens but the payload drops `historyAction`/`sourceLogId` | R2 |
| M3 | Verification accepts a row claiming `undone` with no undo event | R3 |
| M4 | The trace commits outside the caller's transaction (rollback case: the business reversal fails) | R4 |
| M5 | Redo is refactored to write its record without `execute` | R5 |

Plus: the audit_logs module suite count, `packages/core` suite count, and `tsc --noEmit` at 0, all
stated as numbers rather than "green".

---

## 5. Named debts

| Debt | Why it is not here | Where it goes |
|---|---|---|
| `markUndone`'s fork may commit outside the caller's transaction (§1.4) | It is atomicity, not chaining, and its severity depends on how the fork inherits context, which must be measured | Measured during this build; a row of its own if it is live |
| A journal row can be edited to `undone` without any undo having happened | That is the journal being editable, which is the premise of having a chain at all. The chain is what makes it detectable, and R3 is the detection | R3, no separate row |
| `T-07`'s measurement is done and unbuilt | It is the next row, not this one | `scripts/measure-t07-command-capabilities.mjs`, and `T-07`'s own requirement |

---

## 6. The question, if any

**None.** The two choices that could have been questions are settled by the code's own conventions:

- **Where the marker lives:** the trace row already builds `historyAction: 'undo'` and `sourceLogId`
  (`buildUndoTraceLog`). The chain should carry what the record already knows, not invent a second
  vocabulary.
- **What verification should do when the two disagree:** fail, because a chain that tolerates a
  disagreement is a chain that reports on itself rather than on the record.
