#!/usr/bin/env node
/**
 * T-07 mutation proof.
 *
 * Six mutations against the rewritten guard, each restored byte-identically. The
 * two that matter most are M5 and M2: M5 puts the *original defect* back (a
 * hardcoded list of parked modules), and M2 takes a capability away from a
 * command in one of those modules. The old guard passed both; this one must fail
 * them, which is the whole reason the row exists.
 *
 * Rule 13 against the requirement's own §4: M2 was "the route's second feature is
 * restored", and R2 turned out to be void (the route never over-declared; the
 * instrument over-unioned). M2 is rebuilt against what was actually built.
 *
 *   ../.toolchain/node24/node.exe scripts/verify-t07-mutations.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = join(here, '..')
const node = process.execPath
const jest = join(root, 'node_modules', 'jest', 'bin', 'jest.js')

const GUARD = 'packages/core/src/__tests__/command-capability-coverage.test.ts'
const PEOPLE = 'packages/core/src/modules/customers/commands/people.ts'
const RETURNS = 'packages/core/src/modules/sales/commands/returns.ts'
const LABELS = 'packages/core/src/modules/customers/commands/labels.ts'

const mutations = [
  {
    name: 'the collector skips the core package, so the surface shrinks below the floor',
    file: GUARD,
    from: `  const files = [
    ...walk(path.join(repoRoot, 'packages')),
    ...walk(path.join(repoRoot, 'apps', 'mercato', 'src')),
  ]`,
    to: `  const files = [
    ...walk(path.join(repoRoot, 'apps', 'mercato', 'src')),
  ]`,
    expect: ['finds commands to check at all'],
  },
  {
    name: 'a command in a parked module loses its capability',
    file: PEOPLE,
    from: `  id: 'customers.people.create',
  capability: 'customers.people.manage',`,
    to: `  id: 'customers.people.create',`,
    expect: ['leaves no command ungated without a recorded reason'],
  },
  {
    name: 'the factory-mapped command loses its capability',
    file: RETURNS,
    from: `  id: 'sales.returns.update',
  capability: 'sales.returns.manage',`,
    to: `  id: 'sales.returns.update',`,
    expect: ['leaves no command ungated without a recorded reason'],
  },
  {
    name: 'an exception is declared after all, so the entry goes stale',
    file: LABELS,
    from: `  id: 'customers.labels.assign',`,
    to: `  id: 'customers.labels.assign',
  capability: 'customers.people.manage',`,
    expect: ['keeps every documented exception real'],
  },
  {
    name: 'an exception loses its reason',
    file: GUARD,
    from: `    'Its route declares requireAuth and no requireFeatures, so any signed-in user may assign a label. CC-156 owns the route gap.'`,
    to: `    'Route gap.'`,
    expect: ['states a reason for each exception'],
  },
  {
    name: 'THE ORIGINAL DEFECT: a hardcoded list of parked modules is skipped again',
    file: GUARD,
    from: `    const module = moduleOf(file)
    const source = fs.readFileSync(file, 'utf8')`,
    to: `    const module = moduleOf(file)
    if (['catalog', 'customers', 'resources', 'sales', 'staff', 'wms'].includes(module)) continue
    const source = fs.readFileSync(file, 'utf8')`,
    expect: ['finds commands to check at all'],
  },
]

function runGuard() {
  const result = spawnSync(
    node,
    [jest, '--config', 'jest.config.cjs', '--forceExit', 'src/__tests__/command-capability-coverage.test.ts'],
    { cwd: join(root, 'packages', 'core'), encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  )
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
  const bullets = [...output.matchAll(/^\s+●\s+(.+)$/gm)]
    .map((match) => match[1].trim())
    .filter((line) => line.includes('›'))
    .map((line) => line.split('›').pop().trim())
  const crosses = [...output.matchAll(/×\s+(.+?)(?:\s+\(\d+\s*ms\))?$/gm)].map((match) => match[1].trim())
  const failed = [...new Set([...bullets, ...crosses])]

  const totals = [...output.matchAll(/^Tests:\s+(.+)$/gm)].map((match) => match[1].trim())
  const last = totals.length ? totals[totals.length - 1] : ''
  const ran = Number(/(\d+)\s+total/.exec(last)?.[1] ?? '0')
  return { failed, ran }
}

let proven = 0
const results = []

for (const mutation of mutations) {
  const path = join(root, mutation.file)
  const before = readFileSync(path)
  const original = before.toString('utf8')

  if (!original.includes(mutation.from)) {
    results.push({ name: mutation.name, state: 'NOT APPLIED, anchor not found' })
    continue
  }

  writeFileSync(path, original.replace(mutation.from, mutation.to), { encoding: 'utf8' })

  let run
  try {
    run = runGuard()
  } finally {
    writeFileSync(path, before)
  }

  const restored = readFileSync(path).equals(before)
  const missed = mutation.expect.filter((expected) => !run.failed.some((name) => name.includes(expected)))

  let state
  if (!restored) state = 'NOT RESTORED'
  else if (run.ran === 0) state = 'NOT PROVEN, the suite ran 0 tests'
  else if (missed.length === 0) state = 'PROVEN'
  else state = `NOT PROVEN, expected red: ${missed.join(' · ')}`

  if (state === 'PROVEN') proven += 1
  results.push({ name: mutation.name, state, red: run.failed })
}

console.log('')
for (const result of results) {
  console.log(`${result.state === 'PROVEN' ? '✓' : '✗'} ${result.name}`)
  console.log(`    ${result.state}`)
  if (result.red?.length) console.log(`    red: ${result.red.join(' · ')}`)
}
console.log('')
console.log(`${proven}/${mutations.length} mutations PROVEN`)
process.exitCode = proven === mutations.length ? 0 : 1
