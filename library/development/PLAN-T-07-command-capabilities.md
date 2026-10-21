# PLAN-T-07 — the commands the gate cannot see

**Status:** REQUIREMENT ONLY, written 2026-10-21. **No code is written.** §3 is the requirement;
§4 is the proof the build will have to pass. The row stays open until both are done.
**Row:** `T-07` in `PREVIEW-AUDIT-TRIAGE.md` §6, carried as `MASTER-CHECKLIST.md` §9.4.
**Slot:** 0, before `CC-121` re-keys every `principal_id` through this gate.
**Measurement:** `scripts/measure-t07-command-capabilities.mjs`, read-only, run 2026-10-21.

---

## 1. The defect, measured

### 1.1 What a command's capability actually feeds

`CommandHandler.capability` (`shared/src/lib/commands/types.ts:191-225`) is *"the capability this command
performs, as an `acl.ts` feature id"*, and the docblock says exactly why it exists: *"Read by the
authority resolver, which is keyed by capability while the bus is keyed by command. Without this the two
cannot be connected, and a gate that says 'approve first' has nothing to hold."*

A command that declares nothing is **not gated**. It runs, and the authority layer never sees it.

### 1.2 The measurement

**128 command handlers across 7 core modules declare no capability.** Fifteen modules carry a
`commands/` folder, eight declare capabilities on their handlers, seven do not: `catalog`,
`communication_channels`, `customers`, `resources`, `sales`, `staff`, `wms`.

The instrument maps each of the 128 to the feature its **invoking route** already requires, and the
result splits four ways, which is the finding that shapes this requirement:

| Bucket | Count | What it means |
|---|---:|---|
| **A. one route, one feature** | **109** | the capability is a fact, read from the route, not a guess |
| **B. no route, but a real caller** | **3** | invoked from an **agent surface**, so no route declares anything |
| **C. a route that declares no feature** | **7** | the route itself is ungated, so there is nothing to inherit |
| **D. a route that declares two features** | **3** | the route over-declares; one capability cannot express both |

Plus **6 with no production caller at all**: five are named nowhere outside `commands/` and tests
(`customers.interaction.recompute_next`, `customers.todos.unlink`, `sales.orders.lines.delete`,
`sales.quotes.lines.upsert`, `sales.quotes.lines.delete`) and one only in a test
(`customers.todos.create`). 109 + 3 + 7 + 3 + 6 = 128.

### 1.3 Bucket B is the sharpest case, and it is not a route problem

| Command | Called from |
|---|---|
| `customers.activities.create` | `customers/ai-tools/activities-tasks-pack.ts:688`, `:1177` |
| `customers.activities.update` | `customers/ai-tools/activities-tasks-pack.ts:717`, `:1206` |
| `sales.orders.lines.upsert` | `sales/inbox-actions.ts:206` |

These are **agent tools and inbox actions calling the command bus directly**. An agent tool whose command
declares no capability is an agent act the gate cannot see, which is the same defect `CC-123` closed one
door over. They need capabilities, and the route cannot supply them, so the capability is a decision.

### 1.4 Bucket C is two different problems wearing one label

Reading the routes behind the seven:

| Route | Declares | What that is |
|---|---|---|
| `customers/api/labels/assign` | `POST: { requireAuth: true }` | **authenticated, not authorised** |
| `customers/api/labels/unassign` | same shape | **authenticated, not authorised** |
| `sales/api/notes` | all four methods `requireAuth: true` | **authenticated, not authorised** |
| `sales/api/quotes/accept` | `POST: { requireAuth: false }` | **anonymous by design**: a customer-facing token link, with same-origin validation, a rate limit, and a hashed token lookup |
| `customers/api/deals/bulk-update-stage` | no feature found | to be measured during the build |

So three of the seven are **endpoints any signed-in user can call**, which is a **route authorisation
gap** and a larger finding than this row's. One is a deliberate public flow whose authority is the
token, and giving its command a feature gate would break the customer's ability to accept a quote.

**This row must not absorb them.** A command cannot inherit a capability from a route that has none, and
silently inventing one would either break the token flow or paper over an ungated endpoint.

### 1.5 The precedent, and the line this row must not cross

`currencies/commands/currencies.ts:99-101` declares it, with the reason in a comment:

```ts
id: 'currencies.currencies.create',
// Capability taken from the route that invokes this command, not from the id.
capability: 'currencies.manage',
```

That is bucket A, and it is the whole of the mechanical half.

**The `capability` docblock refuses the other thing**, and it is right to: *"Deriving 153 of these from
the naming convention would be 153 guesses, and a wrong one either blocks work that should proceed or
waves through an act that should have waited."*

**This requirement is not that.** `sales.returns.create` → `sales.returns.manage` derived from the name
would be a guess; the same value **read from the route that invokes it** is a fact about the code. The
line is: *inherit what the route already enforces, never infer from an identifier.*

---

## 2. Why it matters

`CC-121` re-keys every `principal_id` in the system through this gate. A command with no capability is a
write the gate cannot see, so the migration would produce a clean answer about a partial system: the
records it re-keys would be the ones the gate already knew about, and the 112 acts it could not see would
be re-keyed by a process that never asked whether they were allowed.

And bucket B is the product, not the plumbing: those three commands are how an assistant writes an
activity or adds an order line. An ungated command behind an agent tool is an assistant act with no
authority check.

---

## 3. The requirement

**R1 — the 109 inherit the feature their route already requires.** For each, the capability is the single
feature declared by the write method that invokes the command. No identifier is parsed, no convention is
applied. **The instrument's map is the input**, and every value in it was read from source.

**R2 — a route that declares two features is a defect in the route, not a choice for the command.**
`sales/api/returns` declares `sales.returns.create + sales.returns.manage` on `POST`, `PUT` and `DELETE`
alike, so `update` and `delete` are gated by the *create* feature too. The route is corrected to one
feature per method, and the commands then inherit cleanly. **Do not pick one of the two and leave the
route over-declaring**: that hides the same defect one level up.

**R3 — the three agent-invoked commands get a capability, decided and recorded.** Their caller is not a
route, so the capability is chosen from the feature that governs the same act on the human path, and the
reason is written beside it. **Default taken:** `customers.activities.create`/`.update` →
`customers.activities.manage`; `sales.orders.lines.upsert` → `sales.orders.manage`.

**R4 — the ungated routes are not fixed here, and the commands behind them are not invented a
capability.** The three authenticated-but-unauthorised routes and the anonymous token flow become their
own rows (§5). Until then, their commands declare **nothing**, and that is the honest state: an act the
route does not authorise must not be described as though something authorised it.

**R5 — a command with no caller is not given a capability.** Six have none. Declaring a capability on
dead code records an act that cannot happen, and makes the coverage number look better for no reason.
They become a dead-code row (§5).

**R6 — the six modules that already declare stay as they are.** `auth`, `currencies`, `dashboards`,
`messages`, `inbox_ops`, `notifications` and the rest are the precedent, not the work. The build must not
re-touch them; a diff that edits a declaring module is a diff that changed behaviour nobody asked about.

**R7 — the measurement is a guard, not a one-off.** The instrument becomes a test with a floor: the count
of commands with no capability may fall, never rise. A new command added without one fails the suite.
**Without this the row closes and the number drifts back**, which is `CC-101`'s class: a measurement
nobody re-runs is a measurement that stops being true.

---

## 4. The proof

| # | Mutation | Must go RED |
|---|---|---|
| M1 | A declared capability is removed from one bucket-A command | R1 |
| M2 | The route's second feature is restored on one method | R2 |
| M3 | One of the three agent-invoked commands loses its capability | R3 |
| M4 | A capability is invented for a command behind an ungated route | R4 |
| M5 | A dead command is given a capability | R5 |
| M6 | A declaring module is edited | R6 |
| M7 | A new command is added with no capability and the floor does not move | R7 |

Plus: the guard suite count, the core suite count, and `tsc --noEmit` at 0, as numbers.

---

## 5. Named debts, each a row rather than a note

| Debt | Why it is not this row | Where it goes |
|---|---|---|
| **Three endpoints are authenticated but not authorised** (`customers/labels/assign`, `labels/unassign`, `sales/notes` ×3 methods): any signed-in user may assign labels or create, edit and delete sales notes | It is a **route** authorisation gap; this row is about commands inheriting what routes enforce. Inventing a command capability would hide it | A new row, opened by this measurement, with `requireFeatures` on the route as its fix |
| **Six commands have no caller** (five none, one test-only) | Dead code is its own decision: delete, or wire. Declaring a capability would record an act that cannot happen | A new row, with the project's own rule: *no caller = defect* |
| **The anonymous quote-accept flow has no feature gate by design** | Its authority is the token, and a feature gate would break the customer's link | Recorded here as deliberate; if the flow later gains a session path, that path needs the gate |

---

## 6. The question, if any

**None.** The three choices that could have been questions are settled by the code's own conventions:

- **Where a capability comes from:** the route that invokes the command. `currencies` states it and
  comments why.
- **What to do when the route declares nothing:** nothing, and open the route's own row. A capability
  invented to fill a hole is a false record, which is worse than a visible gap.
- **What to do with dead commands:** leave them undeclared and open the dead-code row. The coverage
  number is not the goal; a gate that sees real acts is.
