#!/usr/bin/env node
/**
 * T-08 mutation proof.
 *
 * Five mutations, each restored byte-identically, each one a rule the requirement
 * names. M4 is the one that would be easiest to get wrong in the other
 * direction: swallowing the error must not swallow the undo.
 *
 *   ../.toolchain/node24/node.exe scripts/verify-t08-mutations.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = join(here, '..')
const node = process.execPath
const jest = join(root, 'node_modules', 'jest', 'bin', 'jest.js')

const BUS = 'packages/shared/src/lib/commands/command-bus.ts'
const SUITE = 'src/lib/commands/__tests__/command-bus.undo-trust.test.ts'

const mutations = [
  {
    name: 'the caller is removed again, which is the defect this row is about',
    file: BUS,
    from: `        await service.markUndone(log.id, this.buildUndoTraceLog(log, ctx))
        // T-08: the caller demotion never had. After the trace, so the evidence
        // count includes the reversal that triggered it.
        await this.demoteTrustAfterUndo(log, ctx)`,
    to: `        await service.markUndone(log.id, this.buildUndoTraceLog(log, ctx))`,
    expect: ['asks the trust service to re-evaluate the actor after a reversal'],
  },
  {
    name: 'the undoer is demoted instead of the original actor',
    file: BUS,
    from: `    const actorId = log.actorUserId`,
    to: `    const actorId = ctx.auth?.sub ?? null`,
    expect: ['demotes the original actor, not whoever pressed undo'],
  },
  {
    name: 'the capability group is the whole command id, so no evidence matches',
    file: BUS,
    from: `    const capabilityGroup = log.commandId?.split('.')[0]`,
    to: `    const capabilityGroup = log.commandId`,
    expect: ['derives the capability group from the undone command, not from the caller'],
  },
  {
    name: 'a failing demotion is allowed to fail the undo',
    file: BUS,
    from: `    try {
      await trust.demoteIfEvidenceDemands(actorId, capabilityGroup, {
        tenantId: log.tenantId ?? ctx.auth?.tenantId ?? null,
      })
    } catch (err) {
      logger.error('Trust demotion after undo failed', {
        err,
        commandId: log.commandId,
        actorId,
        capabilityGroup,
      })
    }`,
    to: `    await trust.demoteIfEvidenceDemands(actorId, capabilityGroup, {
      tenantId: log.tenantId ?? ctx.auth?.tenantId ?? null,
    })`,
    expect: ['swallows a failing demotion rather than failing the undo'],
  },
  {
    name: 'the demotion runs before the trace, so the count excludes the reversal',
    file: BUS,
    from: `        await service.markUndone(log.id, this.buildUndoTraceLog(log, ctx))
        // T-08: the caller demotion never had. After the trace, so the evidence
        // count includes the reversal that triggered it.
        await this.demoteTrustAfterUndo(log, ctx)`,
    to: `        await this.demoteTrustAfterUndo(log, ctx)
        await service.markUndone(log.id, this.buildUndoTraceLog(log, ctx))`,
    expect: ['runs after the trace is written, so the count includes the reversal'],
  },
]

function runSuite() {
  const result = spawnSync(node, [jest, '--config', 'jest.config.cjs', '--forceExit', SUITE], {
    cwd: join(root, 'packages', 'shared'),
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
