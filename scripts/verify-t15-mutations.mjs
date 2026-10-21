#!/usr/bin/env node
/**
 * T-15 mutation proof.
 *
 * Five mutations, each restored byte-identically. M4 is the one that matters most
 * for the audit's own wording: the narrowing must be ENFORCED, because a scope
 * that is computed and then ignored is worse than none, it makes the gap
 * invisible to a reader of the code.
 *
 *   ../.toolchain/node24/node.exe scripts/verify-t15-mutations.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = join(here, '..')
const node = process.execPath
const jest = join(root, 'node_modules', 'jest', 'bin', 'jest.js')

const ROUTE = 'packages/ai-assistant/src/modules/ai_assistant/api/ai/actions/[id]/confirm/route.ts'
const SUITE = 'src/modules/ai_assistant/api/ai/actions/\\[id\\]/confirm/__tests__/route.test.ts'

const mutations = [
  {
    name: 'the narrowing is dropped again, which is the defect this row is about',
    file: ROUTE,
    // A scope that permits everything is what "no narrowing" means. An earlier
    // version of this mutation set `allowedTools: []`, which the test cannot
    // distinguish from an enforced narrowing with an empty list.
    from: `    const boundScope = computeBoundRunScope({ agent, binding })`,
    to: `    const boundScope = { allowedTools: [row.toolName], requiredFeatures: [] as string[] }`,
    expect: [
      'T-15 — refuses a tool outside the binding allowlist (403)',
      'T-15 — refuses when the caller lacks a feature the binding requires (403)',
    ],
  },
  {
    name: 'the narrowing is computed but only logged, not enforced',
    file: ROUTE,
    from: `    if (!boundScope.allowedTools.includes(row.toolName)) {`,
    to: `    if (false && !boundScope.allowedTools.includes(row.toolName)) {`,
    expect: ['T-15 — refuses a tool outside the binding allowlist (403)'],
  },
  {
    name: 'only the tool allowlist is enforced, not the features',
    file: ROUTE,
    from: `    if (!hasRequiredFeatures(boundScope.requiredFeatures, acl.features, acl.isSuperAdmin)) {`,
    to: `    if (false) {`,
    expect: ['T-15 — refuses when the caller lacks a feature the binding requires (403)'],
  },
  {
    name: 'the agent is resolved from the global registry again',
    file: ROUTE,
    from: `    const agent = await resolveAgentDefinition({
      agentId: row.agentId,
      scope: { tenantId: auth.tenantId ?? '' },
      em,
    })`,
    to: `    const agent = getAgent(row.agentId) ?? null`,
    expect: ['T-15 — a tenant-authored type is resolved through the catalogue, not the registry'],
  },
  {
    name: 'the enforcement runs before the binding re-check',
    file: ROUTE,
    from: `    const binding = await resolveAgentBinding({ em, auth, agentId: row.agentId })
    if (!binding.bound) {
      return jsonError(
        403,
        \`Agent "\${row.agentId}" is not bound to this principal.\`,
        'agent_not_bound',
      )
    }`,
    to: `    const binding = { bound: true, toolAllowlist: null, requiredFeatures: [] } as Awaited<
      ReturnType<typeof resolveAgentBinding>
    > & { bound: true }
    void resolveAgentBinding`,
    expect: ['CC-56 — REFUSES an ai_worker whose binding was revoked (403 agent_not_bound)'],
  },
]

function runSuite() {
  const result = spawnSync(node, [jest, '--config', 'jest.config.cjs', '--forceExit', SUITE], {
    cwd: join(root, 'packages', 'ai-assistant'),
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
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
    run = runSuite()
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
