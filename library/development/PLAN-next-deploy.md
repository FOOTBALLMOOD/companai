# PLAN — the next deploy: what is live, what is not, and when to push it

**Written 2026-10-20. Status: not started — this is a gate and a sequence, not a record of a deploy.**

The owner's question: *"when is the best time to deploy a new updated build, as what we have now is
relatively old — it will be good to see live what changed."* This document answers it with the two facts
that decide it, and names the one fact nobody has measured.

---

## 1. What the record does **not** say

**The last deployed commit is not recorded anywhere.** Searched: `JOURNAL.md`, `HANDOVER.md`,
`RUNBOOK-platform-server.md`, `RUNBOOK-deploying-a-site.md`, `workspace/references/deployment.md` — none
states a commit, a tag or a date for the running build. So *"what we have now"* is the owner's
observation (older than the current work), not a measurement. **First task before any deploy: record the
live commit** (`git rev-parse HEAD` in the deployed tree, or the image tag). A deploy you cannot compare
against is a deploy you cannot roll back precisely.

## 2. What has landed since the live build — and is therefore not live

Everything below is committed and (once CI is green) deployable. It is the answer to *"what changed"*:

- **The authority family, complete:** the machine floor (`CC-125`), the tenant ceiling (`CC-128`), the
  superadmin read scoped to the foundational tenant (`CC-134`), the ceiling's route (`CC-135`), a
  `system:` act judged as a platform act (`CC-136`), role assignment behind one capability (`CC-137`),
  the ceiling's **screen** (`CC-139`) and its stale-view refusal (`CC-140`).
- **The approvals queue is correct under concurrency** (`T-05`): one compare-and-set claim, so an act
  cannot be approved twice; `reject` and the A3 sweep use the same primitive.
- **i18n:** 258 strings hand-translated into pl/es/de (`CC-142`) plus the 21 keys the new screens
  referenced (`CC-148`) — the ceiling screen and the authority graph now read properly in four locales.
- **A Function that asks for a count is refused, not answered with rows** (`T-04`).
- **The build and the checkout are trustworthy again:** the export convention (`CC-141`), the gitignored
  source files (`CC-146`), the coverage guards (`CC-145`), and an integration harness that actually runs
  (`CC-143` + `CC-149`).

**Visibly, for the owner:** a capability-ceiling screen (platform + per tenant), an authority graph page,
the approvals queue, and translated UI. That is what is worth seeing live.

## 3. The gate — three things, in this order

1. **CI green on `code`.** The last run was red for the two reasons fixed in `CC-148`/`CC-149`; a new push
   is the proof. **Do not deploy a commit whose CI is red** — the live instance is the one place a build
   failure is not a red icon but a broken product.
2. **`CC-119` — the migration chain must have touched a project-shaped database.** This is the hard gate,
   and it predates today: `Migration20261017160000` and `Migration20261017170000` were each proven against
   a throwaway container whose table was recreated by hand, **never against a database shaped like this
   project's own**, and the MikroORM snapshot is stale (`CC-100`). A deploy runs migrations. **A migration
   that has never run against a real schema is not a deploy, it is an experiment on the live data.**
   Minimum before deploying: the full chain from zero on a real Postgres, then the same chain against a
   **copy of production**.
3. **A rollback that exists before the deploy:** a database backup (`workspace/scripts/checkpoint.sh`), a
   tag on the deployed commit, and the previous image/commit recorded. `CC-41` is the precedent — an
   `update.sh` that rebuilt onto the same tag could not restore the outgoing image.

## 4. The sequence, once the gate passes

1. Record the live commit + take a database backup.
2. Run the migration chain against a **copy** of the live database; the smoke test is a login and the
   ceiling screen.
3. Build from a clean checkout of the exact commit CI proved (not the working tree).
4. Deploy; run the readiness probe; then the four screens: ceiling, authority graph, approvals queue, and
   one translated page.
5. Record the new commit in this file — **the next deploy starts by reading it**.

## 5. Recommendation — the timing

**Not today, and not because of the code: because two facts are unmeasured.** The honest answer to *"when
is the best time"* is: **the first window after (a) CI is green on `code` and (b) `CC-119`'s chain has run
against a copy of the live database.** Both are one working session each, and both are cheaper than
discovering either on the live instance.

What the owner can do to make that window soon: **say whether the live database can be copied** (or
whether it holds nothing worth preserving, which makes the dry-run trivial), and **provide access to the
server** (or run the two commands in §4 that need it). With those, the deploy is a single afternoon, and
the visible result is the authority screens.

**What must not happen:** deploying to make the work visible. Visibility is the reason to deploy *after*
the gate, not a reason to skip it.
