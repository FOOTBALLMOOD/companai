#!/usr/bin/env node
/**
 * check-route.mutations.mjs — proof that the route's drift check can fail.
 *
 * The same discipline `check-master-checklist.mutations.mjs` applies to the checklist checker: **a checker
 * nobody has seen go red is a checker nobody should trust.** Each mutation breaks ROUTE.md on purpose, runs
 * `check-route.mjs`, and requires a non-zero exit. The file is restored byte-identical every time — if any
 * restore fails, this suite fails, because a mutation that cannot be undone is not a test.
 *
 * Why this suite exists at all: ROUTE.md §0 records that this project has repeatedly shipped controls that
 * were wired and inert, and a check with no proof it fires is exactly that shape one level down.
 *
 * **★ 2026-10-21 — the targets are DERIVED, not hardcoded.** The first version spelled `ROUTE-STEP: W0.2`
 * and `W0.2 CC-109` literally, so the day the marker advanced to W0.3 the third mutation stopped firing and
 * reported *"DID NOT APPLY — the mutation is stale."* That is the checker doing its job — it is also the
 * exact failure mode the suite exists to prevent, one level down. So every target is now read from ROUTE.md
 * at run time, and advancing the marker can never make a mutation unfirable.
 */
import { readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { execFileSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
// Two levels up: this file lives in `scripts/__tests__/`, the repo root is two above it.
const repoRoot = join(here, '..', '..')
const ROUTE = join(repoRoot, 'library', 'development', 'ROUTE.md')
const CHECKER = join(repoRoot, 'scripts', 'check-route.mjs')
const BACKUP = join(here, '.route-mutation-backup.md')

const original = readFileSync(ROUTE, 'utf8')

/** Read a `KEY: value` line out of ROUTE.md. */
function marker(key) {
  const match = original.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
  if (!match) throw new Error(`ROUTE.md has no ${key}: line — the checker and this suite both need it`)
  return match[1].trim()
}

/** The first step in ROUTE-STEPS whose row is already closed in the register. */
function firstClosedStep() {
  const block = original.match(/^ROUTE-STEPS:\s*\n((?:^\S+\s+\S+\s*$\n?)+)/m)
  const steps = block[1].split('\n').map((l) => l.trim().split(/\s+/)).filter((p) => p.length === 2)
  const checklist = readFileSync(join(repoRoot, 'library', 'development', 'MASTER-CHECKLIST.md'), 'utf8')
  for (const [step, row] of steps) {
    const line = checklist.split('\n').find((l) => l.startsWith(`| ${row} |`) || l.startsWith(`| \`${row}\` |`))
    if (line && /closed|✅/.test(line)) return { step, row }
  }
  throw new Error('no closed step found in ROUTE-STEPS — the "already closed" mutation needs one')
}

const currentStep = marker('ROUTE-STEP')
const currentRow = original
  .match(new RegExp(`^${currentStep}\\s+(\\S+)\\s*$`, 'm'))?.[1]
  ?? (() => { throw new Error(`ROUTE-STEP ${currentStep} is not in ROUTE-STEPS`) })()
const closed = firstClosedStep()

const mutations = [
  {
    name: 'the marker jumps ahead to a step that does not exist',
    from: `ROUTE-STEP: ${currentStep}`,
    to: 'ROUTE-STEP: W9.9',
  },
  {
    name: `the marker points at a row that is already closed (${closed.row} — a re-build)`,
    from: `ROUTE-STEP: ${currentStep}`,
    to: `ROUTE-STEP: ${closed.step}`,
  },
  {
    name: 'a step points at a register row that does not exist',
    from: `${currentStep} ${currentRow}`,
    to: `${currentStep} CC-999`,
  },
  {
    name: 'the machine-readable order block is removed (the route becomes prose again)',
    from: 'ROUTE-STEPS:',
    to: 'ROUTE-STEPS-REMOVED:',
  },
]

let allRed = true

copyFileSync(ROUTE, BACKUP)
console.log(`Unmutated run: must PASS (current step ${currentStep} -> ${currentRow})`)
try {
  execFileSync(process.execPath, [CHECKER], { stdio: 'pipe' })
  console.log('  ✓ unmutated PASS\n')
} catch {
  console.error('  ✗ unmutated FAILED — fix ROUTE.md before trusting any mutation result.\n')
  rmSync(BACKUP, { force: true })
  process.exit(1)
}

for (const mutation of mutations) {
  const mutated = original.replace(mutation.from, mutation.to)
  if (mutated === original) {
    console.error(`  ✗ ${mutation.name}`)
    console.error(`      DID NOT APPLY — "${mutation.from}" is not in ROUTE.md. The mutation is stale.`)
    allRed = false
    continue
  }

  writeFileSync(ROUTE, mutated, 'utf8')
  let red = false
  let detail = ''
  try {
    execFileSync(process.execPath, [CHECKER], { stdio: 'pipe' })
  } catch (error) {
    red = true
    detail = String(error.stderr ?? '')
      .split('\n')
      .find((line) => line.includes('✗'))
      ?.trim() ?? ''
  }
  copyFileSync(BACKUP, ROUTE)

  if (red) {
    console.log(`  ✓ ${mutation.name}`)
    if (detail) console.log(`      ${detail}`)
  } else {
    console.error(`  ✗ ${mutation.name} — the checker PASSED while the route was broken.`)
    allRed = false
  }
}

// The restore must be byte-identical, or every result above is about a file that no longer exists.
const restored = readFileSync(ROUTE, 'utf8')
if (restored !== original) {
  console.error('\n✗ ROUTE.md was not restored byte-identical. Every result above is unreliable.')
  copyFileSync(BACKUP, ROUTE)
  allRed = false
} else {
  console.log('\nfile restored byte-identical')
}
rmSync(BACKUP, { force: true })

console.log(
  allRed
    ? `\nPASS — all ${mutations.length} mutations went red, and the file is intact.`
    : `\nFAIL — at least one mutation did not go red, or the file was not restored.`,
)
process.exit(allRed ? 0 : 1)
