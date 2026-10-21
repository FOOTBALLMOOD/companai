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
 */
import { readFileSync, writeFileSync, copyFileSync, rmSync, existsSync } from 'node:fs'
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

const mutations = [
  {
    name: 'the marker jumps ahead of an open predecessor (working two waves at once)',
    from: 'ROUTE-STEP: W0.2',
    to: 'ROUTE-STEP: W1.2',
  },
  {
    name: 'the marker names a step that does not exist (a typo that means "nowhere")',
    from: 'ROUTE-STEP: W0.2',
    to: 'ROUTE-STEP: W9.9',
  },
  {
    name: 'the marker points at a row that is already closed (a re-build)',
    from: 'ROUTE-STEP: W0.2',
    to: 'ROUTE-STEP: W0.1',
  },
  {
    name: 'a step points at a register row that does not exist',
    from: 'W0.2 CC-109',
    to: 'W0.2 CC-999',
  },
  {
    name: 'the machine-readable order block is removed (the route becomes prose again)',
    from: 'ROUTE-STEPS:',
    to: 'ROUTE-STEPS-REMOVED:',
  },
]

let allRed = true

copyFileSync(ROUTE, BACKUP)
console.log(`Unmutated run: must PASS`)
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
