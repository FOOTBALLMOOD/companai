#!/usr/bin/env node
/**
 * T-06 mutation proof.
 *
 * Five mutations, each one the defect or the rule the requirement names, each
 * restored byte-identically. A mutation whose test does not go red is a defect
 * in the test, not in the rule (`LESSONS.md` L23), and the denominator is
 * asserted so a suite that ran zero tests cannot pass as proof (L21).
 *
 * **Rule 13, against the requirement's own table:** §4's M5 was "redo is
 * refactored to write its record without `execute`". That cannot be proved in a
 * unit suite, because redo's chaining is a property of the *command bus*, whose
 * service is mocked in these tests. M5 is therefore the same claim from the side
 * that is testable: the forward path stops chaining, and the symmetry assertion
 * goes red. The rule it protects (both directions leave a chained event) is
 * unchanged.
 *
 * Run from the repo root:
 *   ../.toolchain/node24/node.exe scripts/verify-t06-mutations.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = join(here, '..')
const node = process.execPath
const jest = join(root, 'node_modules', 'jest', 'bin', 'jest.js')

const SERVICE = 'packages/core/src/modules/audit_logs/services/actionLogService.ts'
const LEDGER = 'packages/core/src/modules/audit_logs/services/ledgerService.ts'

const SUITES = [
  'src/modules/audit_logs/services/__tests__/actionLogService.undoLedger.test.ts',
  'src/modules/audit_logs/services/__tests__/ledgerService.undoCoverage.test.ts',
]

const mutations = [
  {
    name: 'markUndone writes the trace row without extending the chain (the defect)',
    file: SERVICE,
    from: `      await this.appendToLedger(traceLog, parsed, parsed.actorUserId ?? null)`,
    to: `      void this.appendToLedger`,
    expect: ['appends exactly one ledger event when an act is marked undone'],
  },
  {
    name: 'the event is chained but does not say it is a reversal',
    file: SERVICE,
    from: `        ...(historyAction ? { historyAction } : {}),
        ...(sourceLogId ? { sourceLogId } : {}),`,
    to: ``,
    expect: ['carries historyAction and the row it reverses'],
  },
  {
    name: 'verification accepts a row claiming undone with no event',
    file: LEDGER,
    from: `    const undoneWithoutEvent = [...undoneIds].filter((id) => !eventSourceIds.has(id)).sort((a, b) => a.localeCompare(b))`,
    to: `    const undoneWithoutEvent: string[] = []`,
    expect: ['reports a row that claims to be undone with no event naming it'],
  },
  {
    name: 'the trace commits outside the caller transaction, on a fork',
    file: SERVICE,
    from: `    const log = await this.em.findOne(ActionLog, { id, deletedAt: null })
    if (!log) return null

    log.executionState = 'undone'`,
    to: `    const log = await this.em.fork().findOne(ActionLog, { id, deletedAt: null })
    if (!log) return null

    log.executionState = 'undone'`,
    expect: ['writes the trace row on the same EntityManager, never a fork (R4)'],
  },
  {
    name: 'the forward path stops chaining, so the two directions disagree',
    file: SERVICE,
    from: `    await this.em.persist(log).flush()
    await this.appendToLedger(log, data, rawSubject)`,
    to: `    await this.em.persist(log).flush()`,
    expect: ['chains both a forward write and its reversal'],
  },
]

function runSuites() {
  const result = spawnSync(
    node,
    [jest, '--config', 'jest.config.cjs', '--forceExit', ...SUITES],
    { cwd: join(root, 'packages', 'core'), encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  )
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
  const bullets = [...output.matchAll(/^\s+●\s+(.+)$/gm)]
    .map((match) => match[1].trim())
    .filter((line) => line.includes('›'))
    .map((line) => line.split('›').pop().trim())
  const crosses = [...output.matchAll(/✕\s+(.+?)(?:\s+\(\d+\s*ms\))?$/gm)].map((match) => match[1].trim())
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
    run = runSuites()
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
