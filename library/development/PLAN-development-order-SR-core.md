# PLAN-development-order-SR-core — the order the SR work should land in

**Status:** strategy, written 2026-10-21 from measurement. **No code.** This is the ordering, not a build.
**Why it exists:** Slot 0 closed on 2026-10-21, which makes `CC-121` (the authority re-key) startable behind
`CC-119`. The SRS's own sequencing (`library/architecture/mapping/findings/08-THE-SRS.md` §4) was written
before most of the work was built, so this re-derives the order from what is **on disk now**.

---

## 1. What was measured, not assumed

**The SR register** (`MASTER-CHECKLIST.md` §7) holds **54 rows**: 3 HAVE · 11 BUILD · 38 BORROW ·
2 RE-ENGINEER. Four of the PZ tooling rows are already built but two of them are **wired and not
enforcing**, and one has a false-green skip path.

**The SRS's chain** (§4 of the SRS findings) puts the tooling set first, then identity → tenancy → durability
→ composition. That direction is still right. What it does not record is *which of those rows has a measured
prerequisite*, so its "must land before what" reads as tighter than the register supports.

**Measured, on 2026-10-21:**

| Claim | Measured |
|---|---|
| "`CC-119` is the next row to measure" | **partly done** — its first check passed 2026-10-20: a fresh deployment built the whole schema from zero on real PostgreSQL 17 + pgvector and the app serves (`DEPLOY-2026-10-20.md`). **Two checks remain:** the `down()` path, and the generated-schema-vs-entities diff (which also settles `CC-100`). |
| `CC-121` is startable | **gated**, and its gate is named in its own row: *"Dependency: `CC-119` — it is a schema move."* |
| the SR rows' prerequisites | **most have none recorded.** The register's *Extends* column reads `—` for SR-03, -04, -06, -09, -10, -13, -14, -15, -16, -17, -19, -26, -27, -40, -42, -43, -44, -45. They are not unblocked; they are **unordered**, which is a different and more dangerous state. |

**★ The finding that shapes this plan: the SR rows' real dependency is not on each other — it is on the
authority substrate.** `SR-03` (permission ladder as data), `SR-04` (two-surface rule), `SR-18` (machine
actors capped at approve-first), `SR-22` (risk on every command), `SR-26` (every gate ships a test) and
`SR-47` (declared-control coverage) are all the same question — *who may do this, and where is that written
down* — answered in five different places. Without one chokepoint, each row invents its own answer, and five
answers is exactly the one-truth defect `SR-39` exists to catch.

---

## 2. The core, defined

**The core is the authority substrate: the actor, its credentials, and the one place a decision is made.**
Everything else in the SR register either feeds it, or hangs off it.

```
   W1 the actor, not the credential      CC-121   ← schema move, gated on CC-119
   W2 hire: the instance                 CC-122
   W3 one chokepoint, three sources      CC-123 · CC-124 · CC-125 (closed)
        │
        ├─► the ratchets (W8) — every row after is cheaper AND provable
        │      SR-39 (CC-109) · SR-41 (CC-110) · SR-46 (CC-114) · SR-40 · SR-42 · SR-43 · SR-44
        │
        ├─► the SR authority rows can now be data instead of code
        │      SR-03 · SR-04 · SR-05 · SR-18 · SR-22 (CC-63) · SR-26
        │
        └─► tenancy  SR-12 (CC-84) → SR-10 · SR-11 · SR-13
               │
               └─► durability  SR-19 (+19a/19b) · SR-20 · SR-21 · SR-21a
                      │
                      └─► composition  SR-27 → SR-28 → SR-29 → SR-31 → SR-32 → SR-36
```

---

## 3. The order

### Wave 0 — the ratchets, first, because they are no-blockers and they make every later row verifiable

`SR-38` is already built and enforcing. Its three siblings are **wired and inert**, which is the
`CC-101` shape — *a checker is not a control until something calls it* — found four times now.

| Row | What is wrong (measured) | Lands |
|---|---|---|
| `SR-39` | `CC-109` — `check:one-truth`'s **SKIP exits 0** and there is no residue guard; nothing references it | `SR-39` ✅ |
| `SR-41` | `CC-110` — **202 holes, 169 unnamed**; `-- x` passes as a reason; the gate is called by nothing | `SR-41` ✅ |
| `SR-46` | `CC-114` — **89 settings read twice in 46 files**; no baseline, so it cannot gate | `SR-46` ✅ |
| `CC-101` | CI runs **2 of 7** drift checkers | the other five in CI |

**Why first:** these are the only rows in the register that make the *next* row cheaper. A ratchet that does
not run is worse than none — it is a recorded control nobody can rely on, which is `SR-47`'s own subject.
**Risk of not doing them first:** every SR row built after lands unverified, and the register's ✅ becomes
prose again — the exact drift `CC-112` caught in this file.

### Wave 0b — `SR-08`, the one row with no prerequisite at all

The triage core (`G-21`) has no production caller. It is the cheapest item in the register and it is also the
first end-to-end proof that the typed port (`SR-01`, built) actually carries a real workload. **Land it here**,
not later: it de-risks the port before the identity work depends on it.

### Wave 1 — the core itself

| Order | Row | Why here | Gate |
|---|---|---|---|
| 1 | **`CC-119`'s two remaining checks** | the schema move's verification milestone; settles `CC-100` with it | none — **`DEPLOY-2026-10-20.md` already passed check 1** |
| 2 | **`CC-121`** | the actor's authority hangs off its credential, so rotating a key un-hires it | `CC-119` |
| 3 | **`CC-122`** | there is no agent instance — nothing is ever hired | `CC-121` |
| 4 | **`SR-02` slice 2 (`CC-102`) + `SR-07` (`CC-107`)** | the SRS lands these together: an agent is not its runtime, a bot is a participant | they move the **same tables** as `CC-121` |
| 5 | **`SR-13`** | identity keys unique per realm, DB-enforced — cheap once 2–4 exist | 4 |

### Wave 2 — the authority rows become data

Only now can these be built as **data and fences** rather than as new code paths: `SR-03` (the ladder),
`SR-04` (two-surface, a build-time fence), `SR-05` (spawn cap + ledger), `SR-18` (already HAVE — extend),
`SR-22` (**`CC-63`: 0 of ~93 commands declare risk or approval**), `SR-26` (every gate ships a test that
fires it).

**`SR-22` is the row to watch.** It is the largest in the register by surface — every command — and it is the
one the whole guard engine was waiting on. Measure it before building it: the count "0 of 93" is from
2026-10-17 and `T-07` has since given 115 commands a capability, so the denominator has moved.

### Wave 3 — tenancy, then durability

`SR-12` (per-tenant engine home, `CC-84`) → `SR-10` + `SR-11` → `SR-19` (+`19a`, `19b`) → `SR-20` →
`SR-21` (+`21a`). `SR-12` gates `P2-9b`, the Hermes switchover — so **this wave is the one that produces a
product-visible change**, and it is deliberately not earlier: it is the first wave whose value depends on
Wave 1 being right.

### Wave 4 — composition

`SR-27` (widget = append-only log) → `SR-28` → `SR-29` → `SR-31` → `SR-32` → `SR-36`. The widget IR already
exists (`SR-35` ✅); this wave is engine work, not foundation work.

---

## 4. What is startable today, measured

| Row | Why it can land now |
|---|---|
| `CC-156` | three endpoints are authenticated but **not authorised** — any signed-in user may assign labels or edit sales notes. A live defect, not a gap. |
| `CC-157` | six commands have no caller, so nothing can invoke them |
| `SR-08` | no prerequisite at all |
| `CC-109` / `CC-110` / `CC-114` | the three inert ratchets — no blockers |
| `CC-119`'s two checks | check 1 already passed on the real deploy |

## 5. The one thing that needs you

**Nothing blocks this order.** It follows from measurement, so it is a proposal you can overrule, not a
decision you must make first.

Two decisions are adjacent and will bite inside Wave 3 if they are still open then — they are **not** in the
way now: `V-04` (stay headless or adopt Hermes's ops console — its trigger has fired) and `N-15` (where the
orchestration boundary sits, before `AH-3`).

## 6. What this plan does not do

- **It does not re-sequence `W4`–`W8`** of `PLAN-2026-10-18-one-agent.md`; it sits on top of that plan and
  orders the SR register against it.
- **It does not claim the SRS's chain was wrong.** The direction was right; what it could not know is which
  rows have no recorded prerequisite at all, and that is the part this re-derives.
