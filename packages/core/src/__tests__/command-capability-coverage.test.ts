/**
 * Which commands the authority gate can bind, and which it deliberately cannot.
 *
 * **Why a test rather than a note.** The gate is keyed by capability and a
 * command that declares none is not gated — silently, and by design, because
 * refusing every unmapped command would break the platform. That makes the gap
 * invisible: nothing fails, nothing warns, and coverage decays one new command
 * at a time.
 *
 * **★ This guard was blind, and its own docblock said it was not.** It carried a
 * hardcoded `PARKED` set naming `catalog`, `customers`, `resources`, `sales`,
 * `staff` and `wms`, and promised that *"if one is ever un-parked, this test
 * starts failing for it"*. It cannot: the list is a constant, so un-parking a
 * module changes nothing here. `T-07` measured 128 unchecked commands on
 * 2026-10-21.
 *
 * **The fix is to stop asking whether a module is parked.** A capability is a
 * property of the command, not of whether it can be dispatched today, and the
 * commands in a parked module are exactly the ones nobody is watching. So every
 * module is checked, and the thirteen that declare nothing are listed below with
 * the row that owns each one.
 *
 * Two smaller things changed with it, and both were silent bugs:
 *
 * - **The capability is read from the command's own block**, not from a ±400
 *   character window that can attribute a neighbouring command's capability to
 *   this one.
 * - **Both quote styles are read.** Twenty-four of these handlers use double
 *   quotes, and a single-quote pattern loses them without saying so.
 *
 * The lesson is the one `CC-132` recorded one row earlier: *a control that cannot
 * see what it guards is not a control.*
 */
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(__dirname, '../../../..')

/**
 * Commands that run ungated on purpose. Each needs a reason, because the whole
 * value of this list is that somebody had to write one.
 */
const DELIBERATELY_UNGATED: Record<string, string> = {
  // Behind a route that requires authentication but no feature. The route is the
  // defect, and `CC-156` owns it; a capability invented here would hide that.
  'customers.deals.update':
    'Its route (deals/bulk-update-stage) declares no feature, so there is nothing to inherit. CC-156 owns the route gap.',
  'customers.labels.assign':
    'Its route declares requireAuth and no requireFeatures, so any signed-in user may assign a label. CC-156 owns the route gap.',
  'customers.labels.unassign':
    'Same route family as labels.assign: authenticated, not authorised. CC-156 owns the route gap.',
  'sales.quotes.convert_to_order':
    'Reached from the anonymous quote-accept link, where the hashed token is the credential. A feature gate here would break the customer flow.',
  'sales.notes.create':
    'The sales notes route declares requireAuth on all four methods and no feature. CC-156 owns the route gap.',
  'sales.notes.update':
    'Same route as notes.create: authenticated, not authorised. CC-156 owns the route gap.',
  'sales.notes.delete':
    'Same route as notes.create: authenticated, not authorised. CC-156 owns the route gap.',
  // No caller at all. A capability would record an act nothing can perform.
  'customers.interaction.recompute_next':
    'Named nowhere outside its own commands folder and tests. CC-157 decides delete or wire.',
  'customers.todos.unlink':
    'No caller outside its commands folder and tests. CC-157 decides delete or wire.',
  'customers.todos.create':
    'Appears only in one integration spec, never in production code. CC-157 decides delete or wire.',
  'sales.orders.lines.delete':
    'No caller, and no dynamic construction of the id exists. CC-157 decides delete or wire.',
  'sales.quotes.lines.upsert':
    'No caller, and no dynamic construction of the id exists. CC-157 decides delete or wire.',
  'sales.quotes.lines.delete':
    'No caller, and no dynamic construction of the id exists. CC-157 decides delete or wire.',
  // The eighth module, and the one the audit never counted. `checkout` ships in
  // its own package (`@open-mercato/checkout`), so T-07's codemod, which walks
  // `packages/core`, did not reach it. Named rather than skipped: the moment this
  // module is un-parked, these nine need the same treatment as the other 115.
  'checkout.link.create': 'Parked, and outside T-07 measured scope: checkout ships in its own package. Same treatment when un-parked.',
  'checkout.link.update': 'Parked, and outside T-07 measured scope: checkout ships in its own package. Same treatment when un-parked.',
  'checkout.link.delete': 'Parked, and outside T-07 measured scope: checkout ships in its own package. Same treatment when un-parked.',
  'checkout.template.create': 'Parked, and outside T-07 measured scope: checkout ships in its own package. Same treatment when un-parked.',
  'checkout.template.update': 'Parked, and outside T-07 measured scope: checkout ships in its own package. Same treatment when un-parked.',
  'checkout.template.delete': 'Parked, and outside T-07 measured scope: checkout ships in its own package. Same treatment when un-parked.',
  'checkout.transaction.create': 'Parked, and outside T-07 measured scope: checkout ships in its own package. Same treatment when un-parked.',
  // The one genuine design exception, unchanged from before.
  'messages.tokens.consume':
    'The external-recipient path. A token from an emailed link is exchanged for access, and the token IS the credential, so there is no session and no ACL to check.',
}

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.mercato', '.next', '__tests__'].includes(entry.name)) continue
      walk(full, out)
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.spec.ts')) {
      if (full.split(path.sep).includes('commands')) out.push(full)
    }
  }
  return out
}

function moduleOf(file: string): string {
  const parts = file.split(path.sep)
  const i = parts.indexOf('modules')
  return i >= 0 ? parts[i + 1] : '?'
}

type Command = { id: string; module: string; gated: boolean }

function collectCommands(): Command[] {
  const files = [
    ...walk(path.join(repoRoot, 'packages')),
    ...walk(path.join(repoRoot, 'apps', 'mercato', 'src')),
  ]
  const commands: Command[] = []

  for (const file of files) {
    const module = moduleOf(file)
    const source = fs.readFileSync(file, 'utf8')
    const lines = source.split('\n')

    for (let i = 0; i < lines.length; i += 1) {
      const idMatch = /^\s*id:\s*(['"])([a-z0-9_.]+)\1\s*,?\s*$/.exec(lines[i])
      if (!idMatch) continue

      let end = lines.length
      for (let j = i + 1; j < lines.length; j += 1) {
        if (/^\s*id:\s*['"]/.test(lines[j])) {
          end = j
          break
        }
      }
      const block = lines.slice(i + 1, end).join('\n')
      if (!/\bexecute\s*[:(]/.test(block)) continue

      commands.push({ id: idMatch[2], module, gated: /\bcapability\s*:/.test(block) })
    }
  }
  return commands
}

describe('the authority gate can bind every live command', () => {
  const commands = collectCommands()

  it('finds commands to check at all', () => {
    // Guards the collector itself. A discovery bug that matched nothing would make
    // every assertion below pass while proving nothing (L37). The floor is the
    // surface measured on 2026-10-21, not a round number.
    expect(commands.length).toBeGreaterThanOrEqual(128)
  })

  it('leaves no command ungated without a recorded reason', () => {
    const unexplained = commands
      .filter((command) => !command.gated)
      .filter((command) => !(command.id in DELIBERATELY_UNGATED))
      .map((command) => `${command.module}: ${command.id}`)

    expect(unexplained).toEqual([])
  })

  it('keeps every documented exception real', () => {
    // Two ways an entry stops being true, and the first one was missing until a
    // mutation survived: a command that was **gated** after all is no longer an
    // exception, and a command that no longer **exists** is not one either. The
    // original test only checked the second, so an entry could sit there
    // excusing a command that had been fixed.
    const ids = new Set(commands.map((command) => command.id))
    const gatedIds = new Set(commands.filter((command) => command.gated).map((command) => command.id))
    const stale = Object.keys(DELIBERATELY_UNGATED).filter((id) => gatedIds.has(id) || !ids.has(id))

    expect(stale).toEqual([])
  })

  it('states a reason for each exception', () => {
    // A one-word reason is not a reason; the point of the list is that somebody
    // had to justify the exception in prose.
    const tooThin = Object.entries(DELIBERATELY_UNGATED)
      .filter(([, reason]) => reason.length < 40)
      .map(([id]) => id)

    expect(tooThin).toEqual([])
  })
})
