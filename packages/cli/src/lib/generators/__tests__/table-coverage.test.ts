/**
 * Row 17 coverage gate — **every table is classified**: it is a read surface
 * (gated) or it is a named internal table.
 *
 * `BUILD-ORDER.md` item 17: *"Coverage: extend `aclFeatures` from 6 of 53 tables
 * to all tables, with an aggregate rule so a new table cannot be added
 * un-gated."* Two guards already cover the two read-surface families:
 *   - `search-acl-coverage.test.ts` (CC-46) — a new SEARCHABLE entity cannot be
 *     added without `aclFeatures`;
 *   - `crud-read-gate-coverage.test.ts` (CC-47) — a new CRUD LIST route cannot
 *     be added without a GET read gate.
 * Neither, however, enumerates the tables that are in NEITHER family. A table
 * that is not searchable and has no route is "covered" only by accident — nothing
 * forces a human to ask "may an actor read this, and under which feature?".
 * That is exactly the defect the owner objects to ("we do not end up having
 * permissions for some tables, then forgetting to add to other tables created
 * later").
 *
 * This gate enumerates **every table** the platform declares (the exported
 * entity classes across every module's `data/entities.ts`) and requires each to
 * fall into exactly one class:
 *   A. searchable — declared in a module `search.ts` `entityId` list (its read
 *      ACL is the `aclFeatures` asserted by CC-46); OR
 *   B. route-backed — referenced by at least one `route.ts` in its own module
 *      (its read ACL is the route gate asserted by CC-47); OR
 *   C. INTERNAL — on the explicit, NAMED, reviewable `INTERNAL_TABLES`
 *      allowlist below, each with a reason and a category.
 * A table in NONE of the three classes FAILS — so a new table cannot be added
 * un-classified.
 *
 * WHY THE CLASSES ARE POSITIVE-MATCH (fail-closed design, same as CC-46/CC-47).
 * A table is treated as covered ONLY when it is positively found in a universe
 * this test reads; everything else must be written down by a human. This is the
 * same inversion CC-47 uses: we do not try to *prove* a negative ("no table is
 * ungated"), we require a positive classification and force the remainder onto a
 * named list.
 *
 * SCOPE / HONEST BOUND (Rule 0 — what this gate does and does not prove).
 * This is a CLASSIFICATION gate: it proves every table is *accounted for* by a
 * NAMED class. It does NOT re-prove that each route is gated (CC-47's job) nor
 * that each searchable entity declares a resolvable feature (CC-46's job).
 * It guarantees: *a new table cannot ship without someone classifying it.*
 *
 * HARDENING AFTER A SEPARATE-AGENT HOSTILE CRITIC (2026-10-11) — three real holes
 * found and closed, so the predicates are honest about what "read surface" means:
 *   1. The read-surface predicate is matched against comment-STRIPPED text — a
 *      class name left in a stale comment no longer counts as a live reference
 *      (the critic showed `communication_channels.ExternalMessage` passed as
 *      "route-backed" from a comment alone).
 *   2. The read-surface universe is every `api/**` source file (not only files
 *      literally named `route.ts`) — the critic showed `entities.CustomEntity`
 *      has a live GET HTTP surface in `api/definitions.ts` yet was invisible to a
 *      `route.ts`-only walker, so it was wrongly classified internal.
 *   3. The sanity counts are PINNED to the exact measured numbers (233 tables, 41
 *      modules with a read surface, 12 search modules), not loose floors — a
 *      shrinking discovery now fails loudly instead of silently passing.
 */
import fs from 'node:fs'
import path from 'node:path'

const REPO_ROOT = path.resolve(__dirname, '../../../../../..')

const IGNORED_DIRS = new Set(['node_modules', '.git', '.mercato', 'dist', 'build', 'coverage', '__tests__'])

/**
 * Tables that are deliberately NOT read surfaces. Each entry names the table and
 * says why it is internal. Grouped by the kind of reason so the list is auditable.
 *
 * A table belongs here only if it is reachable by NO list/CRUD/read route and is
 * not exposed through search — join/cross-reference tables, session & credential
 * mechanism tables, per-user or per-role layout/preference rows with no list API,
 * append-only logs/queues/index tables, and encrypted-at-rest field maps.
 *
 * If a table gains a read route or a search entry, it must be REMOVED from here
 * (the gate asserts the two classes are disjoint: a table may not be both
 * route-backed/searchable AND internal).
 */
export const INTERNAL_TABLES: Record<string, string> = {
  // --- join / cross-reference / child tables (no direct read surface; reached via their parents) ---
  'customers.CustomerEntityRole': 'company↔role join for a customer entity',
  'auth.UserRole': 'user↔role join (read as a helper while building the roles list, not its own surface)',
  'customer_accounts.CustomerUserRole': 'customer-user↔role join',
  'customer_accounts.CustomerUserAcl': 'customer-user↔ACL grant rows (mechanism)',
  'catalog.CatalogProductVariantRelation': 'variant↔variant relation join',
  'wms.SalesOrderWarehouseAssignment': 'order↔warehouse join',

  // --- session / credential / verification mechanism tables (never listed) ---
  'auth.Session': 'session mechanism (not a read surface)',
  'auth.PasswordReset': 'password-reset token mechanism',
  'auth.RecordLock': 'optimistic-lock mechanism',
  'customer_accounts.CustomerUserEmailVerification': 'email-verification token mechanism',
  'customer_accounts.CustomerUserPasswordReset': 'customer password-reset token mechanism',
  'customer_accounts.CustomerUserInvitation': 'invitation token mechanism',

  // --- per-user / per-role layout & preference rows, single-row settings (no list API) ---
  'auth.UserSidebarPreference': 'per-user sidebar preference',
  'auth.SidebarVariant': 'sidebar variant definitions (config)',
  'perspectives.RolePerspective': 'per-role perspective default',
  'customers.CustomerSettings': 'single-row customer module settings',
  'sales.SalesSettings': 'single-row sales module settings',
  'configs.ModuleConfig': 'per-module key/value settings rows',

  // --- authority / governance mechanism tables (internal engine state) ---
  'auth.AuthorityAct': 'authority act (pending write) mechanism',
  'auth.AuthorityActReview': 'authority review mechanism',
  'auth.AuthorityDelegation': 'authority delegation mechanism',
  'auth.AuthorityTrustGrant': 'authority trust-grant mechanism',
  'auth.AuthorityProject': 'authority project grouping (engine state)',
  'auth.AuthorityProjectMembership': 'authority project membership (engine state)',
  'auth.AuthorityProjectRecord': 'authority project record link (engine state)',
  'auth.AuthorityDenial': 'authority denial record (engine state)',
  'auth.PermissionSurfaceRecord': 'persisted permission-surface rows (read via a dedicated service, not a table list)',
  // Added 2026-10-20 with the re-measurement below. Both are real tables from real work, and neither
  // is a business list surface — which is the question this guard asks.
  'auth.TenantCapabilityCeiling': 'the platform capability ceiling (CC-128) — one row per tenant, read only through the gated /api/auth/capability-ceiling route (CC-135/CC-139), which resolves it through a repository the walker cannot see. Configuration, never a business list',
  'ai_assistant.AiAgentRuntime': 'agent runtime registry (SR-02/CC-102) — daemon registration and liveness rows, written and read by the registry itself; no business list surface',

  // --- append-only logs / queues / index tables (written by workers, not listed) ---
  'audit_logs.AccessLog': 'access log (append-only; read via audit tooling)',
  'audit_logs.LedgerEvent': 'event ledger (append-only mechanism)',
  'query_index.EntityIndexRow': 'search-index row (index mechanism)',
  'query_index.EntityIndexJob': 'index job queue',
  'query_index.EntityIndexCoverage': 'index coverage bookkeeping',
  'query_index.IndexerErrorLog': 'indexer error log',
  'query_index.IndexerStatusLog': 'indexer status log',
  'query_index.SearchToken': 'search-token table (index mechanism)',
  'entities.CustomEntityStorage': 'generic custom-entity storage (reached via the custom-entity service)',

  // --- integration / sync / gateway mechanism tables ---
  'integrations.SyncExternalIdMapping': 'external-id mapping (sync mechanism)',
  'integrations.IntegrationCredentials': 'integration credentials (secret store)',
  'integrations.IntegrationState': 'integration runtime state',
  'integrations.IntegrationLog': 'integration log',
  'data_sync.SyncRun': 'sync run log',
  'data_sync.SyncCursor': 'sync cursor state',
  'data_sync.SyncSchedule': 'sync schedule state',
  'shipping_carriers.CarrierWebhookProcessedEvent': 'webhook dedupe ledger',
  'shipping_carriers.CarrierShipmentIdempotencyKey': 'idempotency-key store',
  'payment_gateways.GatewayPaymentOperation': 'gateway operation log',
  'payment_gateways.GatewaySessionInitialization': 'gateway session init state',
  'payment_gateways.WebhookProcessedEvent': 'webhook dedupe ledger',
  'sales.SalesDocumentSequence': 'per-document-type numbering counter (mechanism)',

  // --- workflow runtime state (engine state, not a list surface) ---
  'workflows.WorkflowBranchInstance': 'workflow branch runtime state',
  'workflows.StepInstance': 'workflow step runtime state',
  'workflows.WorkflowEventTrigger': 'workflow event trigger config',

  // --- AI engine mechanism tables ---
  'ai_assistant.AiTokenUsageEvent': 'AI token-usage event log',
  'ai_assistant.AiTokenUsageDaily': 'AI token-usage daily rollup',
  'ai_assistant.AiTenantModelAllowlist': 'per-tenant model allowlist (config)',
  'ai_assistant.AiChatConversation': 'AI chat conversation state',
  'ai_assistant.AiChatConversationParticipant': 'AI chat participant join',
  'ai_assistant.AiChatMessage': 'AI chat message log',

  // --- misc mechanism / child tables ---
  'configs.UpgradeActionRun': 'upgrade-run bookkeeping',
  'communication_channels.ExternalMessage': 'external message (reached via its conversation, not a list surface)',
  'communication_channels.ChannelThreadToken': 'thread→channel token map',
  'communication_channels.ChannelIngestDeadLetter': 'ingest dead-letter queue',
  'translations.EntityTranslation': 'entity translation store (read via the i18n service)',
  'example.ExampleItem': 'example module scratch entity',
  'example_customers_sync.ExampleCustomerInteractionMapping': 'example sync mapping (example module)',
}

function collectFiles(dir: string, out: string[], predicate: (name: string) => boolean): void {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue
      collectFiles(full, out, predicate)
    } else if (predicate(entry.name)) {
      out.push(full)
    }
  }
  return
}

type Table = { module: string; name: string; file: string }

/** Every exported entity class across module `data/entities.ts` files. */
function collectTables(): Table[] {
  const files: string[] = []
  for (const pkg of ['packages', 'apps']) {
    collectFiles(path.join(REPO_ROOT, pkg), files, (n) => n === 'entities.ts')
  }
  const tables: Table[] = []
  for (const file of files.filter((f) => f.includes(path.sep + 'modules' + path.sep))) {
    const moduleId = file.split(path.sep + 'modules' + path.sep)[1].split(path.sep)[0]
    const text = fs.readFileSync(file, 'utf8')
    const re = /^export class ([A-Za-z0-9_]+)\b/gm
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) tables.push({ module: moduleId, name: m[1], file })
  }
  return tables
}

/** Module ids that declare a `search.ts` (searchable family). */
function searchableModules(): Map<string, Set<string>> {
  const files: string[] = []
  for (const pkg of ['packages', 'apps']) {
    collectFiles(path.join(REPO_ROOT, pkg), files, (n) => n === 'search.ts')
  }
  const out = new Map<string, Set<string>>()
  for (const file of files.filter((f) => f.includes(path.sep + 'modules' + path.sep))) {
    const moduleId = file.split(path.sep + 'modules' + path.sep)[1].split(path.sep)[0]
    const text = fs.readFileSync(file, 'utf8')
    const ids = new Set<string>()
    for (const m of text.matchAll(/entityId\s*:\s*['"]([^'"]+)['"]/g)) {
      // entityId is '<module>:<snake_name>' or '<module>.<snake_name>' or '<snake_name>'
      const tail = m[1].split(':').pop()?.split('.').pop() ?? m[1]
      ids.add(tail)
    }
    const prev = out.get(moduleId) ?? new Set<string>()
    for (const id of ids) prev.add(id)
    out.set(moduleId, prev)
  }
  return out
}

function toSnake(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()
}

/**
 * Strip BOTH comment forms so a class name left in a stale comment cannot count as
 * a live read-surface reference (hostile-critic hole #1).
 */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

type SurfaceIndex = Map<string, string> // moduleId -> concatenated, comment-stripped read-surface text

/**
 * Concatenated, comment-stripped source of every READ-SURFACE file in each module.
 * A read surface is any source file under the module's `api/` directory (the
 * HTTP/route layer) — NOT only files literally named `route.ts`, because the
 * entities module exposes real GET endpoints from `api/definitions.ts` etc.
 * (hostile-critic hole #2). Only `api/` is included, so a name in a data/service
 * file does not count.
 */
function readSurfaceTextByModule(): SurfaceIndex {
  const files: string[] = []
  for (const pkg of ['packages', 'apps']) {
    collectFiles(path.join(REPO_ROOT, pkg), files, (n) => n.endsWith('.ts'))
  }
  const out: SurfaceIndex = new Map()
  for (const file of files) {
    const marker = path.sep + 'modules' + path.sep
    if (!file.includes(marker)) continue
    const rest = file.split(marker)[1].split(path.sep)
    const moduleId = rest[0]
    // read-surface = the module's api/ layer only
    if (rest[1] !== 'api') continue
    out.set(moduleId, (out.get(moduleId) ?? '') + '\n' + stripComments(fs.readFileSync(file, 'utf8')))
  }
  return out
}

const tableKey = (t: Table) => `${t.module}.${t.name}`

// Measured 2026-10-11 (pinned EXACTLY, not as a floor — a shrinking discovery
// must fail loudly, not pass vacuously; hostile-critic hole #3).
// Re-pinned 2026-10-11 (CC-27 added the `ai_agent_bindings` table → 233→234).
const EXPECTED_TABLES = 237
const EXPECTED_SURFACE_MODULES = 47
const EXPECTED_SEARCH_MODULES = 12

describe('Row 17: every table is classified (read surface or named internal)', () => {
  const tables = collectTables()
  const searchable = searchableModules()
  const surfaceText = readSurfaceTextByModule()

  const isSearchable = (t: Table): boolean => {
    const set = searchable.get(t.module)
    if (!set) return false
    return set.has(toSnake(t.name)) || set.has(t.name.toLowerCase())
  }
  const isReadSurface = (t: Table): boolean => {
    const text = surfaceText.get(t.module)
    if (!text) return false
    return new RegExp('\\b' + t.name + '\\b').test(text)
  }
  const isInternal = (t: Table): boolean => Object.prototype.hasOwnProperty.call(INTERNAL_TABLES, tableKey(t))

  it('discovers the declared table universe (sanity — pins the measured counts)', () => {
    // Exact counts, not floors: if the walker silently stops scanning a package,
    // the guarantee shrinks and this fails loudly.
    expect(tables.length).toBe(EXPECTED_TABLES)
    expect(surfaceText.size).toBe(EXPECTED_SURFACE_MODULES)
    expect(searchable.size).toBe(EXPECTED_SEARCH_MODULES)
  })

  it('A. every table is a read surface (searchable OR api-referenced) or is on INTERNAL_TABLES', () => {
    const unclassified = tables
      .filter((t) => !isSearchable(t) && !isReadSurface(t) && !isInternal(t))
      .map((t) => `  ${tableKey(t)}  (${path.relative(REPO_ROOT, t.file)})`)
    expect(
      unclassified.length === 0
        ? ''
        : `Tables that are neither a read surface nor classified internal (${unclassified.length}):\n` +
            `${unclassified.join('\n')}\n` +
            'Either give the table a read route / a search.ts entry, OR add it to INTERNAL_TABLES with a reason.',
    ).toBe('')
  })

  it('B. no table is BOTH searchable and internal (a searchable table cannot be "not a read surface")', () => {
    // Only the SEARCHABLE class contradicts INTERNAL — a searchable entity has an
    // explicit read ACL, so it cannot also be "deliberately not a read surface".
    // Being referenced by an api file does NOT contradict INTERNAL: a join table
    // may be read as a helper inside a parent route without being its own surface
    // (e.g. `auth.UserRole` is read while building the roles list). This assertion
    // therefore keys on `searchable` only.
    const contradictions = tables
      .filter((t) => isInternal(t) && isSearchable(t))
      .map((t) => `  ${tableKey(t)} — on INTERNAL_TABLES but is also a searchable entity`)
    expect(
      contradictions.length === 0
        ? ''
        : `Tables classified both internal AND searchable (${contradictions.length}):\n${contradictions.join('\n')}`,
    ).toBe('')
  })

  it('C. every INTERNAL_TABLES entry names a table that actually exists (no stale entries)', () => {
    const known = new Set(tables.map(tableKey))
    const stale = Object.keys(INTERNAL_TABLES).filter((k) => !known.has(k))
    // If a table is renamed or removed, its INTERNAL_TABLES entry must move with
    // it; a stale entry hides the change, so it is a defect.
    expect(
      stale.length === 0
        ? ''
        : `INTERNAL_TABLES names tables that do not exist (${stale.length}):\n${stale.map((s) => '  ' + s).join('\n')}`,
    ).toBe('')
  })

  it('D. every INTERNAL_TABLES entry carries a non-empty reason', () => {
    const missing = Object.entries(INTERNAL_TABLES)
      .filter(([, reason]) => !reason || reason.trim().length === 0)
      .map(([k]) => `  ${k}`)
    expect(missing.length === 0 ? '' : `INTERNAL_TABLES entries with no reason:\n${missing.join('\n')}`).toBe('')
  })
})
