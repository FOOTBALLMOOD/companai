# THE ROUTE — the one document an agent follows

**Status:** the development route, written 2026-10-21. **This is the entry point.** `START-PROMPT.md`
points here and at nothing else; every other plan (`PLAN-2026-10-18-one-agent.md`,
`PLAN-development-order-SR-core.md`, the SRS chain, the triage) is **input to this file, not a rival to it.**

---

## 0. Why this file exists — the drift, measured

**You said this is not the first time things go away from the plan. It is not, and here is what it cost:**

| What happened | Evidence |
|---|---|
| A session ended **mid-edit**, leaving `HANDOVER.md` with an orphaned sentence fragment where the position statement should be, and **five handover documents uncommitted** | found 2026-10-21 while resuming `T-17` |
| The **injected project memory was three hours stale** — it said *"7 of 13 left, next `T-08`"* while `T-08`, `T-15`, `T-16` were closed and `T-17` was next. Trusting it would have rebuilt a closed row | same session |
| **Ten of thirteen** audit rows needed the audit's own sentence corrected; `T-30`'s reported a **designed, documented, tested** contract as a bug | Slot 0, 2026-10-19→21 |
| Three ratchets are **wired and inert** — a gate nothing calls, a skip path that exits 0, a lint with no baseline | `CC-109`, `CC-110`, `CC-114` |

**★ The four causes, and the four mechanisms this file uses against them:**

1. **There were five plans and no tie-breaker.** → *This file is the tie-breaker. It cites the others; it never contradicts one without saying so by name.*
2. **State lived in prose that was hand-updated.** → *§2 is a **machine-checked** step marker. `scripts/check-route.mjs` verifies it against the register and runs in CI. A step marker that lies fails the build.*
3. **Nothing told an agent where to stop.** → *Every step in §4 ends with a **STOP** line. You do not start the next step in the same session.*
4. **Nothing caught a plan abandoned quietly.** → *§6 is the drift check: if the work in progress does not match §2's marker, the build is red and the fix is to update this file, not to keep coding.*

**The rule that makes it hold:** *the route is code.* It is committed, checked, and pushed like code. A plan that lives only in a chat message is a plan that dies with the session.

---

## 1. The destination, in one paragraph

A platform where an operator can, **through the front end only**: send a prompt; watch a Business IR get
authored, validated and **saved as a Function**; run that Function; see it apply database changes; and see
every one of those acts recorded by an authority that hangs off the actor rather than its key. Behind that
surface sit automation pages, workspace pages and widget pages, all on the same spine, all integrated with
Hermes. **Nothing on this route is done until it is reachable from the front end** — a capability with no
caller is not a capability (`CC-101`, found four times).

---

## 2. The step marker — machine-checked, the only place "where are we" is answered

```
ROUTE-STEP: W0.2
ROUTE-STEP-NAME: the ratchets — SR-39 (CC-109), the one-truth check whose SKIP path exits 0
ROUTE-STARTED: 2026-10-21
ROUTE-NEXT: W0.3 — SR-41 (CC-110), the escape-hatch gate nothing calls
```

**The order, machine-readable — `scripts/check-route.mjs` reads this block and fails the build when the
marker and the register disagree. Every entry names a row that exists in the register; a step whose work has
no row yet is a signal to write the row, not to point at prose:**

```
ROUTE-STEPS:
W0.1 CC-101
W0.2 CC-109
W0.3 CC-110
W0.4 CC-114
W0b.1 SR-08
W0b.2 CC-13
W1.1 CC-119
W1.2 CC-121
W1.3 CC-122
W1.4 CC-102
W1.5 CC-107
W1.6 SR-13
W2.1 SR-03
W2.2 SR-04
W2.3 SR-05
W2.4 CC-63
W2.5 SR-26
W3.1 CC-84
W3.2 SR-10
W3.3 SR-11
W4.1 SR-19
W4.2 SR-20
W4.3 SR-21
W5.1 CC-72
W5.2 SR-16
W5.3 SR-22
W5.4 SR-29
W6.1 CC-74
W7.1 SR-47
```

**`scripts/check-route.mjs` reads these lines and fails unless:** the named step's row is open in the
register · every step before it is closed · the row exists at all · the plan file the step names exists.
It runs in CI and in the pre-commit hook, so an agent cannot quietly work two waves ahead.

*(If the marker and the register disagree, **the register wins and the marker is wrong** — fix the marker,
do not argue with the register. That is the whole discipline in one sentence.)*

---

## 3. The route

```
W0  the ratchets          SR-39 · SR-41 · SR-46 · CC-101      ← no blockers; makes every later step provable
 │
W0b the IR in the flow    SR-08 · Business IR → Function      ← no prerequisite; the first front-end proof
 │
W1  the core              CC-119 checks → CC-121 → CC-122 → SR-02 slice2 + SR-07 → SR-13
 │
W2  authority as data     SR-03 · SR-04 · SR-05 · SR-22 (CC-63) · SR-26
 │
W3  tenancy               SR-12 (CC-84) → SR-10 · SR-11
 │
W4  durability            SR-19 (+19a/19b) · SR-20 · SR-21 (+21a)
 │
W5  the surfaces          chat (exists) → workspaces → automation → widgets
 │
W6  Hermes                P2-9b — the switchover, and hermes-local retires
 │
W7  the ratchets, wired   W8's three counts, in CI
```

### W0 — the ratchets (no blockers)

**★ Measured 2026-10-21, and `W0.1` is already done — its close record is what defines the rest of the wave.**
`CC-101` closed on 2026-10-17 having wired **5 checker steps into the `test` job**, but only **2 as gates**:
`SR-39` (one-truth), `SR-47` (declared-controls, **5 of 6 uncovered**) and `SR-41` (escape-hatches, **169 of
202 unnamed**) are wired as **REPORT steps, not gates** — because each would be a permanently red build
today. The close record is explicit that a control which fires so loudly it gets switched off is the failure
mode the register exists to prevent.

**So W0 is not "wire the checkers". It is "turn three report-only checkers into gates, by shrinking what they
report until the number is zero."** Each row below is one of those reports, and each already knows its size.

| Step | Row | What is wrong, measured | Proof |
|---|---|---|---|
| ~~W0.1~~ | `CC-101` | ~~CI runs **2 of 7** drift checkers~~ | **✅ closed 2026-10-17 — 5 steps wired, 2 as gates** |
| W0.2 | `SR-39` / `CC-109` | `check:one-truth`'s **SKIP exits 0**; nothing references it | a skipped check fails the build |
| W0.3 | `SR-41` / `CC-110` | **202 holes, 169 unnamed**; `-- x` passes as a reason; the gate is called by nothing | a hole without a named reason fails |
| W0.4 | `SR-46` / `CC-114` | **89 settings read twice in 46 files**; no baseline | the baseline is committed and the count only goes down |

**Why first:** these are the only rows that make the *next* row verifiable. Every step after W0 lands
unproven without them, and the register's ✅ becomes prose again — the drift `CC-112` caught in the
checklist itself. **And the numbers are already known** — 202 holes, 169 unnamed, 89 double-reads — so W0 is
three cleanups of known size, not three discoveries.

**STOP after W0.4.** Report the four numbers before starting W0b.

### W0b — the Business IR, in the flow, tested from the front end

**Measured 2026-10-21, and one correction to my own first reading:** the Business IR **is** wired —
`business-ir-pack.ts` is registered into `aiTools` unconditionally, and `runBusinessQueryPrompt` is its
engine. What does **not** exist is the second half of the pipeline: the architecture
(`library/ai/ai-first/03_…md` §21) describes *prompt → AI-generated IR → **validated IR** → compiled plan →
**validated Function***, and **a Function is never saved.** There is no Function entity, no registry, no
"save this" act. The IR is authored and run in one shot and then gone.

**So W0b is: give the Function a body.**

| Step | What | Proof |
|---|---|---|
| W0b.1 | **The Function object** — an entity, a stable id, tenant-scoped, with the IR as its payload and a version | a migration, and the entity is in the schema diff |
| W0b.2 | **Save** — the act that turns a run's IR into a stored Function, recorded in the ledger with the actor's id | one prompt → one saved Function, visible in the DB |
| W0b.3 | **Run a saved Function** — by id, through the same authority chokepoint as everything else | the front end runs it; the ledger names the actor |
| W0b.4 | **The front-end acceptance path** — the page where an operator does all three | *you* send the prompt, save the function, and apply a database change |

**STOP after W0b.4.** This is the first step you test yourself. Nothing continues until you have.

### W1 — the core (the identity substrate)

`CC-119`'s two remaining checks (the `down()` path; the schema-vs-entities diff, which settles `CC-100`) →
`CC-121` (authority hangs off the credential, so rotating a key un-hires the actor) → `CC-122` (there is no
agent instance — nothing is ever hired) → `SR-02` slice 2 (`CC-102`) + `SR-07` (`CC-107`, they move the same
tables) → `SR-13`.

**Gate, and it is the one that cannot be softened:** rotate a key in a test and bindings, roles, delegations,
denials and audit rows **all survive**, with the audit trail still one actor.

### W2 — authority becomes data

`SR-03` (the permission ladder as data) · `SR-04` (two-surface rule, a build-time fence) · `SR-05` (spawn cap
+ ledger) · `SR-22` (**`CC-63`: measure the denominator first — it read "0 of ~93" on 2026-10-17 and `T-07`
has since given 115 commands a capability**) · `SR-26` (every approval gate ships a test that fires it).

**Only now** can these be data and fences rather than new code paths — that is what W1 bought.

### W3 — tenancy · W4 — durability

`SR-12` (per-tenant engine home, `CC-84`) → `SR-10` · `SR-11` · then `SR-19` (+`19a`, `19b`) · `SR-20` ·
`SR-21` (+`21a`). `SR-12` gates `P2-9b`, so W6 cannot start before W3 closes.

### W5 — the surfaces, in maturity order

**chat → workspaces → automation → widgets.** The order is from `PLAN-2026-10-18-one-agent.md` §W7 and it is
by maturity, not ambition: chat exists; **workspaces does not exist as a module**; automation cannot wake
durably until W4; widgets sits behind automation and the risk-on-command work.

**Gate:** a surface may not start until it has its own written `SR-*` and the spine's conformance test passes
from inside it. **No surface may add a second way to answer "may this act here".**

### W6 — Hermes

`P2-9b`, the switchover; `hermes-local` retires as its content (`CC-74`). Integration with Hermes is the
**last** wave, not the first, because Hermes inherits the spine — a switchover through a gate with holes
produces a clean answer about a partial system.

### W7 — the ratchets, wired

`W8`'s three counts, in CI: one representation of platform level · one authority predicate · one type branch.

---

## 4. What every step must carry before it counts as done

1. **Measured from source** — the row's sentence re-read against the code, and any correction recorded by
   name (ten of thirteen needed one; assume this one does too).
2. **A written requirement** — no code before it.
3. **The proof** — tests, and **mutations that go red** when the fix is removed.
4. **The front-end acceptance test** — the act is reachable from a page. If it is not, the step is not done,
   however green the suite is.
5. **A STOP and a five-slot report** — what is done · its address · what is next · waiting on you · next.
6. **This file updated** — §2's marker moves, and `scripts/check-route.mjs` passes.

---

## 5. The rules an agent may not break

1. **One wave at a time.** Do not start the next step in the same session as the current one.
2. **Measure before building.** The row's prescribed fix can be wrong; this project has found that ten times
   in one slot.
3. **No code before a written requirement.**
4. **Never `git add -A`.** Explicit paths, both repos, push after each step.
5. **A checker is not a control until something calls it.** If you add a check, wire it.
6. **If the marker and the register disagree, the register wins.**
7. **Do not reorder without writing the reason here.** The order is the plan; an unrecorded reorder is the
   drift this file exists to stop. **★ And the owner's instruction, 2026-10-21: if you disagree with this
   route, CHALLENGE it — do not drift around it.** Write the disagreement down with the measurement that
   produced it, and report back. The route is editable by anyone, but the edit is part of the work, not a
   substitute for it. Quietly working a different step is the one behaviour that has cost this project the
   most, and it is what `scripts/check-route.mjs` exists to make visible.

---

## 6. The drift check

`scripts/check-route.mjs` fails the build when: the step marker names a row that is already closed · the
previous step's row is still open · the named plan file is missing · two waves are in progress at once · a
step claims done without its plan file.

**It runs in CI and in the pre-commit hook.** That is the difference between this file and the five plans
that came before it: those were prose, and prose is not called by anything.

---

## 7. What is deliberately NOT on this route

- **`V-04`** (headless or Hermes's ops console — its trigger has fired) and **`N-15`** (the orchestration
  boundary). Both are owner decisions; neither blocks the route, and both bite inside W3 if still open.
- **`CC-133`** — deferred by the owner.
- Anything in `W4`–`W7` of `PLAN-2026-10-18-one-agent.md` that this file does not name: those waves are
  inputs, and where this file is silent the older plan governs.
