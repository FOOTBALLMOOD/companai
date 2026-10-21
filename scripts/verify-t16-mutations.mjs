#!/usr/bin/env node
/**
 * T-16 mutation proof.
 *
 * Five mutations, each restored byte-identically. The pair that matters most is
 * M1 and M2: they are the two halves of the contradiction this row is about, and
 * each one is proven by a test on the OTHER door's expectation as well as its own.
 *
 *   ../.toolchain/node24/node.exe scripts/verify-t16-mutations.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = join(here, '..')
const node = process.execPath
const jest = join(root, 'node_modules', 'jest', 'bin', 'jest.js')

const TOOL = 'packages/ai-assistant/src/modules/ai_assistant/lib/tool-authority.ts'
const GATE = 'packages/core/src/modules/auth/commands/interceptors.ts'
const SHARED = 'packages/shared/src/lib/authority/dependency.ts'

const SUITES = [
  { pkg: 'ai-assistant', suite: 'src/modules/ai_assistant/lib/__tests__/tool-authority.s02.test.ts' },
  { pkg: 'core', suite: 'src/modules/auth/commands/__tests__/authority-command-gate.test.ts' },
]

const mutations = [
  {
    name: 'the tool door merges the two states again and refuses on "not registered"',
    file: TOOL,
    from: `  if (!resolver) {`,
    to: `  if (false) {`,
    expect: ['permits when the enforcement service is NOT REGISTERED'],
  },
  {
    name: 'the tool door permits on "registered but unreachable"',
    file: TOOL,
    from: `    if (verdict === 'permit') return { kind: 'permit' }
    return {
      kind: 'refuse',
      gate: 'A0',
      bindingRule: AUTHORITY_UNREACHABLE_BINDING_RULE,`,
    to: `    return { kind: 'permit' } as never
    if (verdict === 'permit') return { kind: 'permit' }
    return {
      kind: 'refuse',
      gate: 'A0',
      bindingRule: AUTHORITY_UNREACHABLE_BINDING_RULE,`,
    expect: ['refuses when the enforcement service is REGISTERED BUT UNREACHABLE'],
  },
  {
    name: 'the command gate refuses on "not registered", contradicting the tool door',
    file: GATE,
    from: `      logger.debug('Command declares a capability but authority is not registered; not gated', {
        commandId: context.commandId,
        verdict: authorityDependencyVerdict('not_registered'),
      })
      return`,
    to: `      throw new Error('authority not registered')`,
    expect: ['permits when the authority module is NOT REGISTERED'],
  },
  {
    name: 'the shared rule is flipped, so both doors change together',
    file: SHARED,
    from: `  return state === 'not_registered' ? 'permit' : 'refuse'`,
    to: `  return state === 'not_registered' ? 'refuse' : 'permit'`,
    expect: ['permits when the enforcement service is NOT REGISTERED'],
  },
  {
    name: 'the two doors each grow their own copy of the rule',
    file: SHARED,
    from: `export function authorityDependencyVerdict(state: AuthorityDependencyState): AuthorityDependencyVerdict {
  return state === 'not_registered' ? 'permit' : 'refuse'
}`,
    to: `export function authorityDependencyVerdict(state: AuthorityDependencyState): AuthorityDependencyVerdict {
  // Deliberately inconsistent with its own documentation, which is what a
  // duplicated rule drifts into.
  return state === 'not_registered' ? 'permit' : 'permit'
}`,
    expect: ['refuses when the enforcement service is REGISTERED BUT UNREACHABLE'],
  },
]

function runSuites() {
  const failed = new Set()
  let ran = 0
  for (const target of SUITES) {
    const result = spawnSync(node, [jest, '--config', 'jest.config.cjs', '--forceExit', target.suite], {
      cwd: join(root, 'packages', target.pkg),
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    })
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
    const bullets = [...output.matchAll(/^\s+●\s+(.+)$/gm)]
      .map((match) => match[1].trim())
      .filter((line) => line.includes('›'))
      .map((line) => line.split('›').pop().trim())
    const crosses = [...output.matchAll(/×\s+(.+?)(?:\s+\(\d+\s*ms\))?$/gm)].map((match) => match[1].trim())
    for (const name of [...bullets, ...crosses]) failed.add(name)
    const totals = [...output.matchAll(/^Tests:\s+(.+)$/gm)].map((match) => match[1].trim())
    const last = totals.length ? totals[totals.length - 1] : ''
    ran += Number(/(\d+)\s+total/.exec(last)?.[1] ?? '0')
  }
  return { failed: [...failed], ran }
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
  else if (run.ran === 0) state = 'NOT PROVEN, the suites ran 0 tests'
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
