#!/usr/bin/env node
/**
 * check-route.mjs — the drift check for `library/development/ROUTE.md`.
 *
 * **Why this file exists.** `ROUTE.md` §0 records what drift cost: a session ended mid-edit with five
 * handover documents uncommitted and `HANDOVER.md` carrying an orphaned sentence; the injected project
 * memory was three hours stale and would have had the next agent rebuild a closed row; and three ratchets
 * are wired and inert. The common cause is prose that records state and nothing checks.
 *
 * So the route's step marker is **code**: this script reads it, compares it against the register, and fails
 * the build when they disagree. It runs in CI and in the pre-commit hook, which is the difference between
 * this and the five plans that came before it — those were prose, and prose is not called by anything
 * (`CC-101`, found four times).
 *
 * What it checks, and why each one:
 *
 *  1. the marker's step exists in ROUTE-STEPS      — a typo must not silently mean "nowhere"
 *  2. every step BEFORE the current one is closed  — you may not work ahead of an open predecessor
 *  3. the CURRENT step's row is still open         — a closed row being worked is a re-build
 *  4. the plan file the step names exists          — no code before a written requirement
 *  5. the register row exists at all               — a step pointing at nothing is a drift
 *
 * The tie-breaker, written into ROUTE.md §2 and enforced here: **when the marker and the register
 * disagree, the register wins and the marker is wrong.** So this script never edits anything; it reports.
 *
 * Usage:  node scripts/check-route.mjs            (exit 0 = the route is coherent)
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..')
const ROUTE = join(repoRoot, 'library', 'development', 'ROUTE.md')
const CHECKLIST = join(repoRoot, 'library', 'development', 'MASTER-CHECKLIST.md')

const failures = []
const notes = []

function fail(message) {
  failures.push(message)
}

/** Read a `KEY: value` line out of a fenced block in a markdown file. */
function readMarker(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
  return match ? match[1].trim() : null
}

/** The `ROUTE-STEPS:` block: one `STEP ROW` pair per line. */
function readSteps(text) {
  const block = text.match(/^ROUTE-STEPS:\s*\n((?:^\S+\s+\S+\s*$\n?)+)/m)
  if (!block) return null
  return block[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [step, row] = line.split(/\s+/)
      return { step, row }
    })
}

/**
 * The register holds rows in two shapes and this reads both, because a step that points at an SR row is as
 * legitimate as one that points at a CC row — and the drift this catches is precisely a step pointing at a
 * row that does not exist.
 *
 *   §5  `| CC-101 | … | ☐ open |`  /  `| ✅ closed |`   — the last cell is the status
 *   §7  `| SR-08  | P1 | … | ☐ BUILD | … |`             — the fifth cell is the status glyph
 *
 * Anything else (a `G-*` id, a plan phase like `P2-9b`) is NOT a register row: the route must name a row,
 * and if the work has no row yet the row must be written. That is the discipline, not an inconvenience.
 */
function readRegisterStatuses(checklistText) {
  const statuses = new Map()
  const lines = checklistText.split('\n')
  for (const line of lines) {
    // §5 and §9 — `| CC-101 | … | status |`
    const cc = line.match(/^\|\s*(CC-\d+|T-\d+)\s*\|/)
    if (cc) {
      const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean)
      const last = cells[cells.length - 1] ?? ''
      statuses.set(cc[1], last.includes('closed'))
      continue
    }
    // §7 — `| SR-08 | P1 | … | ☐ BUILD | … |` — the pole cell is P1, P2, P3, PX-W, PX-F or PZ,
    // sometimes bold (`| SR-47 | **PZ** |`)
    const sr = line.match(/^\|\s*(SR-\d+[a-z]?)\s*\|\s*\**\s*[A-Z0-9-]+\s*\**\s*\|/)
    if (sr) {
      const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean)
      const statusCell = cells[4] ?? ''
      // ✅ HAVE / ✅ BUILT is done; ☐ and 🟡 are not.
      statuses.set(sr[1], statusCell.startsWith('✅'))
    }
  }
  return statuses
}

if (!existsSync(ROUTE)) {
  console.error('FAIL — library/development/ROUTE.md does not exist. The route is the entry point; without it every agent starts from a different plan.')
  process.exit(1)
}

const routeText = readFileSync(ROUTE, 'utf8')
const checklistText = readFileSync(CHECKLIST, 'utf8')

const currentStep = readMarker(routeText, 'ROUTE-STEP')
const currentName = readMarker(routeText, 'ROUTE-STEP-NAME')
const steps = readSteps(routeText)

if (!currentStep) {
  fail('ROUTE.md has no `ROUTE-STEP:` marker. Without it nothing knows which step is in progress — this is the exact drift the file exists to stop.')
}
if (!steps) {
  fail('ROUTE.md has no `ROUTE-STEPS:` block. The order must be machine-readable, or it is prose again.')
}

if (failures.length === 0 && currentStep && steps) {
  const index = steps.findIndex((entry) => entry.step === currentStep)
  if (index < 0) {
    fail(
      `ROUTE-STEP is "${currentStep}", which is not in ROUTE-STEPS. Known steps: ${steps.map((s) => s.step).join(', ')}.`,
    )
  } else {
    const statuses = readRegisterStatuses(checklistText)
    const current = steps[index]

    // (5) the row exists at all
    for (const entry of steps) {
      if (!statuses.has(entry.row)) {
        fail(`Step ${entry.step} points at register row ${entry.row}, which is not in MASTER-CHECKLIST.md §5. A step pointing at nothing is a drift.`)
      }
    }

    // (2) every predecessor closed
    for (let i = 0; i < index; i += 1) {
      const entry = steps[i]
      if (statuses.has(entry.row) && !statuses.get(entry.row)) {
        fail(`Step ${entry.step} (${entry.row}) is still open, but ROUTE-STEP is ${currentStep}. You may not work ahead of an open predecessor.`)
      }
    }

    // (3) the current row is still open — a closed row being worked is a re-build
    if (statuses.has(current.row) && statuses.get(current.row)) {
      fail(`ROUTE-STEP is ${currentStep}, whose row ${current.row} is already closed. Either the step is done and the marker must move, or the row was closed without the work — measure which.`)
    }

    // (4) the plan file the step names exists
    if (currentName) {
      const planMatch = currentName.match(/([A-Za-z0-9._-]+\.md)/)
      if (planMatch) {
        const planPath = join(repoRoot, 'library', 'development', planMatch[1])
        if (!existsSync(planPath)) {
          fail(`ROUTE-STEP-NAME names ${planMatch[1]}, which does not exist in library/development/. No code before a written requirement.`)
        }
      } else {
        notes.push(`ROUTE-STEP-NAME has no plan file — acceptable for a step whose requirement already exists, but say which one.`)
      }
    }
  }
}

if (failures.length > 0) {
  console.error('FAIL — the route and the register disagree.\n')
  for (const message of failures) console.error(`  ✗ ${message}`)
  console.error('\nThe register wins. Fix ROUTE.md\'s marker, not the register.')
  process.exit(1)
}

for (const note of notes) console.log(`  · ${note}`)
console.log(
  `PASS — ROUTE.md step ${currentStep} (${currentName ?? 'unnamed'}) matches the register; every predecessor is closed.`,
)
process.exit(0)
