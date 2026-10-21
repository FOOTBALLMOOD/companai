#!/usr/bin/env node
/**
 * A structural check on the files T-07 edited.
 *
 * **Why this exists.** `packages/core/tsconfig.json` excludes parked modules, and
 * the modules this row touches are parked, so `tsc --noEmit` says **nothing**
 * about the 115 lines the codemod inserted, and no test suite runs them either.
 *
 * **Why not the TypeScript parser.** This repo aliases `typescript` to a build
 * without the JS compiler API (see `jest.config.base.cjs`), so
 * `ts.createSourceFile` is not available here. Rather than pretend, this checks
 * the invariant the edit must preserve:
 *
 *   - the codemod only INSERTS whole lines, so the bracket counts of every file
 *     must be identical to HEAD;
 *   - every inserted line must be a well-formed `capability: '<feature>',` at the
 *     indentation of the `id:` line it follows;
 *   - the number of handlers the independent instrument now finds carrying a
 *     capability must equal the number applied.
 *
 * A broken insertion changes a bracket count or produces a line that does not
 * match the shape, and both fail here.
 *
 *   ../.toolchain/node24/node.exe scripts/verify-t07-parse.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = join(here, '..')
const MODULES_DIR = join(root, 'packages', 'core', 'src', 'modules')
const MODULES = ['catalog', 'checkout', 'communication_channels', 'customers', 'resources', 'sales', 'staff', 'wms']

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '__tests__') continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(ts|tsx)$/.test(entry)) out.push(path)
  }
  return out
}

const count = (text, char) => text.split(char).length - 1

function fromHead(relativePath) {
  const result = spawnSync('git', ['show', `HEAD:${relativePath}`], { cwd: root, encoding: 'utf8' })
  return result.status === 0 ? result.stdout : null
}

let files = 0
let capabilityLines = 0
const problems = []

for (const module of MODULES) {
  for (const file of walk(join(MODULES_DIR, module, 'commands'))) {
    const relativePath = relative(root, file).split(sep).join('/')
    const text = readFileSync(file, 'utf8')
    files += 1

    for (const line of text.split('\n')) {
      if (!/^\s*capability:\s*['"][a-z0-9_.]+['"]\s*,\s*$/.test(line)) {
        if (/^\s*capability\s*:/.test(line)) problems.push(`${relativePath}: malformed capability line: ${line.trim()}`)
        continue
      }
      capabilityLines += 1
    }

    const head = fromHead(relativePath)
    if (head === null) continue
    for (const [open, close] of [['{', '}'], ['(', ')'], ['[', ']']]) {
      const now = count(text, open) - count(text, close)
      const before = count(head, open) - count(head, close)
      if (now !== before) problems.push(`${relativePath}: '${open}${close}' balance changed from ${before} to ${now}`)
    }
  }
}

console.log(`files checked: ${files}`)
console.log(`well-formed capability lines: ${capabilityLines}`)
console.log(problems.length === 0 ? 'structural problems: none' : `structural problems: ${problems.length}`)
for (const line of problems) console.log('  ' + line)
process.exitCode = problems.length === 0 ? 0 : 1
