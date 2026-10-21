#!/usr/bin/env node
/**
 * T-07 measurement: the command to capability map for the seven core modules
 * whose commands the authority gate cannot see.
 *
 * The finding: 15 core modules carry a `commands/` folder, 8 declare a
 * `capability:` on their handlers, 7 do not. A command with no capability is
 * invisible to the resolver, which treats an undeclared act as ordinary.
 *
 * The pattern a declaring module uses, read from source: the capability is the
 * feature the invoking route already requires, so the map is derived from the
 * route rather than invented per command.
 *
 * This script was first written as three scratch files at the repo root by the
 * session that started T-07, and the third one was left mid-edit with a mangled
 * regular expression. It is consolidated here, reads only, and prints:
 *   - the clean map (command id -> capability)
 *   - the flagged set (no route, route declares no feature, route declares two)
 *
 * Run from the repo root:
 *   ../.toolchain/node24/node.exe scripts/measure-t07-command-capabilities.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = join(here, '..')
const MODULES_DIR = join(root, 'packages', 'core', 'src', 'modules')

/** The seven modules the audit names, re-measured as seven on 2026-10-19. */
const MODULES = ['catalog', 'checkout', 'communication_channels', 'customers', 'resources', 'sales', 'staff', 'wms']

const WRITE_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']

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

/**
 * Feature ids a route declares for one write method, from either form:
 *   POST: { requireFeatures: ['a.b'] }          (a metadata table)
 *   export const POST = crud.POST               (a factory, features via options)
 */
function methodFeatures(source, method) {
  const found = []

  const tableRow = new RegExp(`${method}\\s*:\\s*\\{([^}]*)\\}`, 'g')
  let match
  while ((match = tableRow.exec(source))) {
    const list = /requireFeatures\s*:\s*\[([^\]]*)\]/.exec(match[1])
    if (list) {
      for (const part of list[1].split(',')) {
        const value = part.trim().replace(/['"]/g, '')
        if (value) found.push(value)
      }
    }
  }

  const optionKey = { POST: 'manageFeature', PUT: 'editFeature', DELETE: 'deleteFeature' }[method]
  if (optionKey) {
    const option = new RegExp(`${optionKey}\\s*:\\s*(['"])([^'"]+)\\1`).exec(source)
    if (option) found.push(option[2])
  }

  return [...new Set(found)]
}

/**
 * Which write methods of this route invoke the given command id.
 *
 * Three export forms are in use, and all three must be recognised or a route
 * that declares its features correctly is reported as declaring none:
 *   export async function POST(req) { ... }      the method's own body names the id
 *   export { POST, PUT, DELETE }                 bare re-export of local consts
 *   export const GET = crud.GET                  a factory's handler, one at a time
 * For a factory route the id is named in the factory call above the exports, so
 * every write export is an invoking method.
 */
function invokingMethods(source, id) {
  // A factory route names each command in its own operation block:
  //   actions: { create: { commandId: 'x.y.create', … }, update: { … } }
  // That is an exact mapping, and reading it is not the identifier heuristic the
  // capability docblock refuses. Without this, every command behind a factory was
  // attributed to EVERY write method, which reported `sales.returns.*` as
  // "route declares two features" when the route declares one per method.
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

  // `export { POST, PUT, DELETE }`, with no `from`, re-exports local consts.
  const bare = /export\s*\{([^}]*)\}(?!\s*from)/g
  while ((match = bare.exec(source))) {
    for (const part of match[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop().trim()
      if (WRITE_METHODS.includes(name)) factory.add(name)
    }
  }

  return [...factory]
}

/** Command handler ids in one module's `commands/`, with the block that follows each. */
function handlersOf(moduleDir) {
  const handlers = []
  for (const file of walk(join(moduleDir, 'commands'))) {
    const source = readFileSync(file, 'utf8')
    // Both quote styles: 24 of the 128 handlers use double quotes, and a parser
    // that reads only one style silently loses them.
    const idRe = /\bid:\s*(['"])([a-z0-9_.]+)\1/g
    let match
    while ((match = idRe.exec(source))) {
      const id = match[2]
      const rest = source.slice(match.index)
      const next = rest.slice(10).search(/\bid:\s*(['"])[a-z0-9_.]+\1/)
      const block = next < 0 ? rest : rest.slice(0, next + 10)
      if (!/\bexecute\s*[:(]/.test(block)) continue
      // `capability` on a COMMAND is a feature id string (`capability: 'a.b'`),
      // not the descriptor object an `acl.ts` feature carries (`capability: {`).
      // Testing for the object form reported every declared command as
      // undeclared, which is how this instrument first "confirmed" 128 after 109
      // of them had been given a capability.
      handlers.push({ id, file, hasCapability: /\bcapability\s*:/.test(block) })
    }
  }
  return handlers
}

const rows = []
for (const module of MODULES) {
  const moduleDir = join(MODULES_DIR, module)
  const routeFiles = walk(join(moduleDir, 'api'))
  for (const handler of handlersOf(moduleDir)) {
    if (handler.hasCapability) continue

    const route = routeFiles.find((file) => readFileSync(file, 'utf8').includes(handler.id))
    let capability = null
    let note = 'NO ROUTE'

    if (route) {
      const source = readFileSync(route, 'utf8')
      const methods = invokingMethods(source, handler.id)
      const features = new Set()
      for (const method of methods) for (const feature of methodFeatures(source, method)) features.add(feature)
      const unique = [...features]
      if (unique.length === 1) capability = unique[0]
      else if (unique.length === 0) note = `ROUTE DECLARES NO FEATURE (methods: ${methods.join('/') || 'none found'})`
      else note = `ROUTE DECLARES SEVERAL (${unique.join(' + ')}, methods: ${methods.join('/')})`
    }

    rows.push({
      module,
      id: handler.id,
      commandFile: relative(root, handler.file).split(sep).join('/'),
      routeFile: route ? relative(root, route).split(sep).join('/') : null,
      capability,
      note,
    })
  }
}

const clean = rows.filter((row) => row.capability)
const flagged = rows.filter((row) => !row.capability)

console.log(`modules measured: ${MODULES.length} (${MODULES.join(', ')})`)
console.log(`command handlers with no capability: ${rows.length}`)
console.log(`  mapped to one capability:          ${clean.length}`)
console.log(`  need a decision or a caller:       ${flagged.length}`)
console.log('')

console.log('=== FLAGGED ===')
for (const row of flagged) console.log(`${row.id}\t${row.routeFile ?? '-'}\t${row.note}`)
console.log('')

console.log('=== DISTINCT CAPABILITIES TO DECLARE ===')
const counts = new Map()
for (const row of clean) counts.set(row.capability, (counts.get(row.capability) ?? 0) + 1)
for (const [capability, count] of [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
  console.log(`${String(count).padStart(4)}  ${capability}`)
}
console.log('')

console.log('=== THE MAP ===')
for (const row of clean) console.log(`${row.id}\t${row.capability}\t${row.commandFile}`)

/**
 * The map is only usable if every capability it names is a feature the module
 * actually declares. A route requiring a feature nobody declares is a gate that
 * can never be satisfied, or a typo, and either way it must not be copied onto a
 * command.
 */
console.log('')
console.log('=== MAPPED CAPABILITIES THE MODULE DOES NOT DECLARE ===')
let undeclared = 0
for (const module of MODULES) {
  const aclPath = join(MODULES_DIR, module, 'acl.ts')
  if (!existsSync(aclPath)) {
    console.log(`  ${module}: no acl.ts, so nothing it requires can be declared`)
    undeclared += 1
    continue
  }
  const declared = new Set()
  const aclSource = readFileSync(aclPath, 'utf8')
  const aclIdRe = /\bid:\s*(['"])([a-z0-9_.]+)\1/g
  let aclMatch
  while ((aclMatch = aclIdRe.exec(aclSource))) declared.add(aclMatch[2])

  const used = new Set(clean.filter((row) => row.module === module).map((row) => row.capability))
  for (const capability of used) {
    if (!declared.has(capability)) {
      const usedBy = clean.filter((row) => row.module === module && row.capability === capability).length
      console.log(`  ${module}: ${capability} (used by ${usedBy} command(s) in this module)`)
      undeclared += 1
    }
  }
}
if (undeclared === 0) console.log('  none')

/**
 * A capability owned by a DIFFERENT module than the command.
 *
 * This is objective, unlike guessing at nouns: the capability's prefix names the
 * module that declares it, so a `catalog.*` command mapping to a `sales.*`
 * capability is either a deliberate cross-module dependency or a defect, and it
 * is never safe to copy without deciding which.
 *
 * Same-module noun mismatches are deliberately NOT classified here. A heuristic
 * on the second segment flags `wms.warehouses -> wms.manage_warehouses`, which is
 * the module's naming convention rather than a defect, so the verified
 * same-module cases are recorded in the requirement with their file paths
 * instead of being guessed at by a regex.
 */
console.log('')
console.log('=== MAPPED TO A CAPABILITY OWNED BY ANOTHER MODULE ===')
const crossModule = clean.filter((row) => row.capability.split('.')[0] !== row.module)
for (const row of crossModule) console.log(`  ${row.id}\t->\t${row.capability}`)
if (crossModule.length === 0) console.log('  none')

