#!/usr/bin/env node
/**
 * T-07: give the seven modules' commands the capability their route already requires.
 *
 * The rule (PLAN-T-07-command-capabilities.md R1): the capability is the single
 * feature declared by the write method that invokes the command. Nothing is
 * inferred from an identifier, which the `capability` docblock refuses in its own
 * words.
 *
 * This is a codemod, so it is deliberately conservative:
 *   - it only touches a handler that maps to EXACTLY ONE capability;
 *   - it only inserts after an `id:` line that stands alone, because rewriting a
 *     single-line object literal is a shape change and this is not the job;
 *   - it reports every skip by name, so a handler it cannot handle is visible
 *     rather than silently left behind;
 *   - `--dry` prints without writing. Run that first.
 *
 * After it runs, re-run `scripts/measure-t07-command-capabilities.mjs`: the count
 * of undeclared handlers must fall by exactly the number applied. The instrument
 * re-derives the map independently, so two implementations have to agree.
 *
 *   ../.toolchain/node24/node.exe scripts/apply-t07-command-capabilities.mjs --dry
 *   ../.toolchain/node24/node.exe scripts/apply-t07-command-capabilities.mjs --apply
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = join(here, '..')
const MODULES_DIR = join(root, 'packages', 'core', 'src', 'modules')
const MODULES = ['catalog', 'checkout', 'communication_channels', 'customers', 'resources', 'sales', 'staff', 'wms']
const WRITE_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']

const apply = process.argv.includes('--apply')

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

function methodFeatures(source, method) {
  const found = []
  const tableRow = new RegExp(`${method}\\s*:\\s*\\{([^}]*)\\}`, 'g')
  let match
  while ((match = tableRow.exec(source))) {
    const list = /requireFeatures\s*:\s*\[([^\]]*)\]/.exec(match[1])
    if (list) for (const part of list[1].split(',')) {
      const value = part.trim().replace(/['"]/g, '')
      if (value) found.push(value)
    }
  }
  const optionKey = { POST: 'manageFeature', PUT: 'editFeature', DELETE: 'deleteFeature' }[method]
  if (optionKey) {
    const option = new RegExp(`${optionKey}\\s*:\\s*(['"])([^'"]+)\\1`).exec(source)
    if (option) found.push(option[2])
  }
  return [...new Set(found)]
}

function invokingMethods(source, id) {
  // A factory route names each command in its own operation block, so the method
  // that invokes it is a fact in the file, not an inference from the id.
  const factoryOps = /(create|update|delete):\s*\{\s*commandId:\s*(['"])([a-z0-9_.]+)\2/g
  let opMatch
  while ((opMatch = factoryOps.exec(source))) {
    if (opMatch[3] === id) return [{ create: 'POST', update: 'PUT', delete: 'DELETE' }[opMatch[1]]]
  }

  const direct = []
  const bounds = []
  const exportRe = /export\s+async\s+function\s+(POST|PUT|DELETE|PATCH)\b/g
  let match
  while ((match = exportRe.exec(source))) bounds.push({ method: match[1], start: match.index })
  if (bounds.length) {
    for (let i = 0; i < bounds.length; i += 1) {
      const end = i + 1 < bounds.length ? bounds[i + 1].start : source.length
      if (source.slice(bounds[i].start, end).includes(id)) direct.push(bounds[i].method)
    }
    return direct
  }
  const factory = new Set()
  const assigned = new RegExp(`export\\s+const\\s+(${WRITE_METHODS.join('|')})\\s*=`, 'g')
  while ((match = assigned.exec(source))) factory.add(match[1])
  const bare = /export\s*\{([^}]*)\}(?!\s*from)/g
  while ((match = bare.exec(source))) {
    for (const part of match[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop().trim()
      if (WRITE_METHODS.includes(name)) factory.add(name)
    }
  }
  return [...factory]
}

const applied = []
const skipped = []

for (const module of MODULES) {
  const moduleDir = join(MODULES_DIR, module)
  const routeFiles = walk(join(moduleDir, 'api'))

  for (const file of walk(join(moduleDir, 'commands'))) {
    const original = readFileSync(file, 'utf8')
    const lines = original.split('\n')
    let changed = false

    // Walk lines so an insertion can keep the indentation of the id it follows.
    for (let i = 0; i < lines.length; i += 1) {
      const idMatch = /^(\s*)id:\s*(['"])([a-z0-9_.]+)\2\s*,\s*$/.exec(lines[i])
      if (!idMatch) continue
      const [, indent, , id] = idMatch

      // The block runs to the next `id:` line at the same indentation.
      let end = lines.length
      for (let j = i + 1; j < lines.length; j += 1) {
        if (/^\s*id:\s*['"]/.test(lines[j])) {
          end = j
          break
        }
      }
      const block = lines.slice(i + 1, end).join('\n')
      if (!/\bexecute\s*[:(]/.test(block)) continue
      if (/\bcapability\s*:/.test(block)) continue

      const route = routeFiles.find((candidate) => readFileSync(candidate, 'utf8').includes(id))
      if (!route) {
        skipped.push(`${id} (no route)`)
        continue
      }
      const routeSource = readFileSync(route, 'utf8')
      const features = new Set()
      for (const method of invokingMethods(routeSource, id)) {
        for (const feature of methodFeatures(routeSource, method)) features.add(feature)
      }
      const unique = [...features]
      if (unique.length !== 1) {
        skipped.push(`${id} (${unique.length === 0 ? 'route declares no feature' : `route declares ${unique.join(' + ')}`})`)
        continue
      }

      lines.splice(i + 1, 0, `${indent}capability: '${unique[0]}',`)
      i += 1
      changed = true
      applied.push(`${id} -> ${unique[0]}`)
    }

    if (changed && apply) writeFileSync(file, lines.join('\n'), { encoding: 'utf8' })
    if (changed && !apply) {
      console.log(`would edit ${relative(root, file).split(sep).join('/')}`)
    }
  }
}

console.log('')
console.log(`${apply ? 'APPLIED' : 'WOULD APPLY'}: ${applied.length}`)
for (const line of applied) console.log('  ' + line)
console.log('')
console.log(`SKIPPED (needs a decision, not a codemod): ${skipped.length}`)
for (const line of skipped) console.log('  ' + line)
