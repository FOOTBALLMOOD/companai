/**
 * CC-44 coverage gate — the write-path **feature gate** is DEFAULT-DENY.
 *
 * Row 7 ("roles & grants enforced on every write") is true **in substance**, but
 * its mechanism was **opt-in**: the dispatcher enforces `requireFeatures` only
 * when the array is non-empty (`apps/mercato/src/app/api/[...slug]/route.ts:161`),
 * so a write route that declares `requireAuth: true` and **no** `requireFeatures`
 * has no feature check at all. Nothing forced the NEXT route to declare one.
 *
 * The owner's ruling (2026-10-11, `NY-23` → Option A) makes it **default-deny**:
 * a write route that declares neither a feature gate nor an explicit,
 * machine-readable **by-design** exemption **fails the build**. This test is that
 * build failure — the analogue of `crud-read-gate-coverage.test.ts` (CC-47) and
 * `table-coverage.test.ts` (CC-52) on the write path.
 *
 * The exemption lives **on the route**: a `byDesign: '<reason>'` key in the
 * method `metadata`. It is **inert** at runtime — `extractMethodMetadata`
 * (`apps/mercato/src/app/api/[...slug]/route.ts:104`) copies only `requireAuth`
 * and `requireFeatures` — so adding it is documentation, never behaviour.
 *
 * What it checks, per write-verb `route.ts` in an **enabled** module (the same
 * scope as `analysis/permission-gate/measure.js`):
 *   A. it is **feature-gated** — it declares a NON-EMPTY `requireFeatures: [ … ]`
 *      array literal whose first element is a string literal or an identifier (the
 *      form every real declaration takes, and the condition under which the
 *      dispatcher fires: `if (requiredFeatures.length)`,
 *      `apps/mercato/src/app/api/[...slug]/route.ts:207`); **or**
 *   B. it carries a real `byDesign: '<reason>'` marker.
 * Anything else fails. A re-export shim is followed to its target first, so a
 * gated route reached through a shim is not read as un-gated.
 *
 * Two predicate tightenings over `measure.js` (a GATE must be at least as strict
 * as the runtime it guards; a measurement tool may be looser). Both were found by
 * the CC-44 hostile-critic pass, and both change the classification of **zero**
 * routes today (measured 2026-10-11: 159 gated / 11 by-design / 170 total, either
 * way — so the pins below are unaffected):
 *   - NON-EMPTY: `measure.js` matches bare `requireFeatures:`, which also matches
 *     `requireFeatures: []` — an empty array the dispatcher treats as NO gate.
 *     The gate requires a non-empty array literal, closing that false-PASS.
 *   - NO FACTORY CLAUSE: `measure.js` also accepts `makeCrudRoute(` / a
 *     `make*Route(` helper as a feature carrier. `makeCrudRoute` does NOT supply
 *     features — it relays `opts.metadata.requireFeatures`
 *     (`shared/src/lib/crud/factory.ts:1036`), so a factory route with no
 *     `requireFeatures` is genuinely ungated. Treating the factory as a carrier
 *     is a false-PASS vector; the gate does not.
 *
 * Comment-proof (`L109`/`L119`): the classifier strips comments **and** string
 * literals before matching, so `// requireFeatures:` or `// byDesign:` cannot
 * grant a pass. Because the value must be a non-empty array literal (features) or
 * a quoted string (byDesign), a bare token in a regex literal (`/requireFeatures:/`)
 * or a type annotation (`{ requireFeatures: string[] }`) does not read as a gate
 * either. The self-check test below proves all of this.
 *
 * HONEST LIMIT (found by the second CC-44 hostile-critic pass). This is a light
 * tokeniser, not a parser, so two pathological shapes are indistinguishable from a
 * real declaration and would read as a gate: a regex CHARACTER CLASS spelled
 * `/requireFeatures: [abc]/`, and a TUPLE TYPE `type G = { requireFeatures: [string] }`.
 * Neither occurs in any route today (measured: 0 routes), and both are absurd in a
 * route file; only a real parser could close them. The gate catches every realistic
 * omission, which is what it is for.
 *
 * The exemption set is **pinned** (`BY_DESIGN_ROUTES`): a new marker with no
 * entry fails, and a stale entry fails — the list cannot drift silently.
 *
 * The classifier is a faithful port of `analysis/permission-gate/measure.js`
 * (the fixed form — `L119`: reuse it, do not re-derive it). The docs-repo tool
 * remains the independent evidence route; this is the code-repo build gate.
 */
import fs from 'node:fs'
import path from 'node:path'

const REPO_ROOT = path.resolve(__dirname, '../../../../../..')

// ---------------------------------------------------------------------------
// The enabled-module set + directory resolution (ported from measure.js).
// ---------------------------------------------------------------------------
function readEnabledModules(): string[] {
  const file = path.join(REPO_ROOT, 'apps/mercato/src/modules.ts')
  const src = fs.readFileSync(file, 'utf8')
  const start = src.indexOf('export const enabledModules')
  const end = src.indexOf('enabledModules.push(', start)
  const block = src.slice(start, end === -1 ? undefined : end)
  const ids = new Set<string>()
  for (const m of block.matchAll(/id:\s*'([a-z_0-9]+)'/g)) ids.add(m[1])
  return [...ids].sort()
}

function resolveModuleDir(id: string): string | null {
  const candidates = [
    path.join(REPO_ROOT, 'packages/core/src/modules', id),
    path.join(REPO_ROOT, 'packages', id, 'src/modules', id),
    path.join(REPO_ROOT, 'apps/mercato/src/modules', id),
  ]
  const pkgs = fs
    .readdirSync(path.join(REPO_ROOT, 'packages'))
    .filter((p) => !p.startsWith('.'))
  for (const p of pkgs) candidates.push(path.join(REPO_ROOT, 'packages', p, 'src/modules', id))
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isDirectory()) return c
    } catch {
      /* keep looking */
    }
  }
  return null
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'node_modules') continue
      walk(p, out)
    } else if (e.name === 'route.ts') {
      out.push(p)
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Write-verb detection (ported from measure.js).
// ---------------------------------------------------------------------------
const ANY_WRITE_EXPORT =
  /(?:^|\n)\s*export\s+(?:async\s+)?(?:function|const|let|var|\{)[^\n]*\b(POST|PUT|PATCH|DELETE)\b/
const RE_LOCAL_VERB_DEF = /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?(?:function|const|let|var)\s+(POST|PUT|PATCH|DELETE)\b/g
const RE_REEXPORT_BARE = /(?:^|\n)\s*export\s*\{([^}]*)\}/g

function writeVerbs(src: string): string[] {
  const verbs = new Set<string>()
  for (const m of src.matchAll(RE_LOCAL_VERB_DEF)) verbs.add(m[1])
  for (const m of src.matchAll(RE_REEXPORT_BARE)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop()!.trim()
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(name)) verbs.add(name)
    }
  }
  return [...verbs]
}

// ---------------------------------------------------------------------------
// Comment/string stripping (ported from measure.js — the L109/L119 fix).
// ---------------------------------------------------------------------------
function stripCommentsAndStrings(src: string): string {
  let out = ''
  let i = 0
  const n = src.length
  while (i < n) {
    const c = src[i]
    const c2 = src[i + 1]
    if (c === '/' && c2 === '/') {
      while (i < n && src[i] !== '\n') i++
      continue
    }
    if (c === '/' && c2 === '*') {
      i += 2
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++
      i += 2
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c
      i++
      while (i < n && src[i] !== quote) {
        if (src[i] === '\\') i++
        i++
      }
      i++
      out += '""'
      continue
    }
    out += c
    i++
  }
  return out
}

// A NON-EMPTY `requireFeatures: [ … ]` array literal whose FIRST element is a
// string literal or an identifier — the form every real declaration takes, and
// the condition under which the runtime gate fires (`if (requiredFeatures.length)`).
// `[]`, `[ ]`, `[0]`, `[[]]`, `[,]` are deliberately NOT gates (the runtime drops
// non-string / empty elements, so none of them gates anything).
const RE_REQUIRE_FEATURES = /requireFeatures\s*:\s*\[\s*(?:"|[A-Za-z_$])/
/**
 * A `requireFeatures: NAME` naming a **same-file** constant whose array literal is non-empty is the
 * same gate as the literal — written once and shared, which is better style, not a weaker gate.
 *
 * The departure route (`api/ai/departures/[userId]/route.ts:52`) does exactly this:
 * `const DEPARTURE_FEATURES = [DELETE_USER_FEATURE, MANAGE_FEATURE]`, then uses it for GET and POST.
 * Matching only the literal form reported that gated route as ungated — **a false red**, and a guard
 * that produces false reds is a guard that gets muted. Found 2026-10-20 by the first CI run.
 */
const RE_REQUIRE_FEATURES_NAME = /requireFeatures\s*:\s*([A-Za-z_$][\w$]*)/

function constantResolvesToGate(code: string, name: string): boolean {
  const re = new RegExp(
    '(?:^|\\n)\\s*(?:const|let|var)\\s+' + name + '\\s*(?::[^=\\n]+)?=\\s*\\[\\s*(?:"|[A-Za-z_$])',
  )
  return re.test(code)
}
// A real marker has a quoted reason; after stripping, the string literal is `""`.
const RE_BY_DESIGN = /byDesign\s*:\s*"/

// ---------------------------------------------------------------------------
// Re-export shims (ported from measure.js).
// ---------------------------------------------------------------------------
const RE_REEXPORT_FROM =
  /(?:^|\n)\s*export\s*\{[^}]*\b(?:POST|PUT|PATCH|DELETE)\b[^}]*\}\s*from\s*['"]([^'"]+)['"]/

function resolveReexport(file: string, src: string, depth = 0): string {
  if (depth > 4) return src
  const m = src.match(RE_REEXPORT_FROM)
  if (!m) return src
  const target = m[1]
  if (!target.startsWith('.')) return src
  const base = path.resolve(path.dirname(file), target)
  for (const ext of ['.ts', '.tsx', '/route.ts', '/index.ts']) {
    const candidate = base + ext
    try {
      if (fs.statSync(candidate).isFile()) {
        return resolveReexport(candidate, fs.readFileSync(candidate, 'utf8'), depth + 1)
      }
    } catch {
      /* try next */
    }
    try {
      const asFile = path.join(base, ext.replace(/^\//, ''))
      if (fs.statSync(asFile).isFile()) {
        return resolveReexport(asFile, fs.readFileSync(asFile, 'utf8'), depth + 1)
      }
    } catch {
      /* try next */
    }
  }
  return src
}

function classify(src: string): { featureGated: boolean; byDesign: boolean } {
  const code = stripCommentsAndStrings(src)
  let featureGated = RE_REQUIRE_FEATURES.test(code)
  if (!featureGated) {
    const named = RE_REQUIRE_FEATURES_NAME.exec(code)
    if (named) featureGated = constantResolvesToGate(code, named[1])
  }
  return {
    featureGated,
    byDesign: RE_BY_DESIGN.test(code),
  }
}

// ---------------------------------------------------------------------------
// The pinned exemption set — every write route that is NOT feature-gated.
// ---------------------------------------------------------------------------
/**
 * A route belongs here ONLY when its authorisation is a DIFFERENT, deliberate
 * mechanism, written next to it. Adding an entry is a review-visible decision.
 *
 * The **6** `NEITHER` routes (no feature, no guard) plus the **5** guard-only
 * notification routes. The guard-only set is included because the owner's gate
 * condition is *"declares no permission and no by-design exemption"* — a
 * structural guard is **not** a role/grant check, and row 7 is about
 * permissions. Tagging them is a strictly stronger guarantee (PLAN-CC-44 §4).
 */
const BY_DESIGN_ROUTES: Record<string, string> = {
  'packages/core/src/modules/auth/api/locale/route.ts':
    'self-service: sets the caller locale cookie; no entity data',
  'packages/core/src/modules/auth/api/profile/route.ts':
    'self-service: caller edits their own profile; own password re-verified',
  'packages/core/src/modules/communication_channels/api/post/webhook/[provider]/route.ts':
    'signature-verified inbound webhook (provider signature IS the auth)',
  'packages/core/src/modules/communication_channels/api/post/webhooks/gmail/route.ts':
    'JWT-verified inbound webhook (Google-signed JWT IS the auth)',
  'packages/webhooks/src/modules/webhooks/api/inbound/[endpointId]/route.ts':
    'signature-verified inbound webhook (adapter.verifyWebhook IS the auth)',
  'apps/mercato/src/modules/ratelimit_probe/api/ping/route.ts':
    'rate-limit probe endpoint; touches no resource',
  'packages/core/src/modules/notifications/api/mark-all-read/route.ts':
    'own-record notification action; guard-backed, no role feature needed',
  'packages/core/src/modules/notifications/api/[id]/action/route.ts':
    'own-record notification action; guard-backed, no role feature needed',
  'packages/core/src/modules/notifications/api/[id]/dismiss/route.ts':
    'own-record notification action; guard-backed, no role feature needed',
  'packages/core/src/modules/notifications/api/[id]/read/route.ts':
    'own-record notification action; guard-backed, no role feature needed',
  'packages/core/src/modules/notifications/api/[id]/restore/route.ts':
    'own-record notification action; guard-backed, no role feature needed',
}

// ---------------------------------------------------------------------------
// The walk (run once).
// ---------------------------------------------------------------------------
interface Row {
  module: string
  file: string
  verbs: string
  featureGated: boolean
  byDesign: boolean
}

function collect(): { rows: Row[]; enabled: string[]; byDesignFound: string[] } {
  const enabled = readEnabledModules()
  const rows: Row[] = []
  for (const id of enabled) {
    const dir = resolveModuleDir(id)
    if (!dir) continue
    let files: string[] = []
    try {
      files = walk(path.join(dir, 'api'))
    } catch {
      continue
    }
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8')
      if (!ANY_WRITE_EXPORT.test(src)) continue
      const verbs = writeVerbs(src)
      if (!verbs.length) continue
      const effective = resolveReexport(f, src)
      const { featureGated, byDesign } = classify(effective)
      rows.push({
        module: id,
        file: path.relative(REPO_ROOT, f).replace(/\\/g, '/'),
        verbs: verbs.join(','),
        featureGated,
        byDesign,
      })
    }
  }
  const byDesignFound = rows.filter((r) => r.byDesign && !r.featureGated).map((r) => r.file)
  return { rows, enabled, byDesignFound }
}

const { rows, enabled, byDesignFound } = collect()

// ---------------------------------------------------------------------------
// The gate.
// ---------------------------------------------------------------------------
describe('CC-44 — the write-path feature gate is default-deny', () => {
  it('every write route in an enabled module is feature-gated or by-design', () => {
    const offenders = rows
      .filter((r) => !r.featureGated && !r.byDesign)
      .map((r) => `${r.file} [${r.verbs}]`)
    expect(offenders).toEqual([])
  })

  it('the by-design set is EXACTLY the pinned map (no new marker, no stale entry)', () => {
    expect([...byDesignFound].sort()).toEqual([...Object.keys(BY_DESIGN_ROUTES)].sort())
  })

  it('sanity — the exact measured counts (a walker that stops scanning fails loudly)', () => {
    // Pinned so a silent shrink fails. Update deliberately when routes change.
    expect(enabled.length).toBe(35)
    expect(rows.length).toBe(175)
    expect(byDesignFound.length).toBe(11)
  })

  it('comment/string/token-proof — only a REAL, non-empty declaration counts (L109/L119)', () => {
    // stripping removes comments and string literals
    expect(stripCommentsAndStrings('// byDesign: nope\n').includes('byDesign')).toBe(false)
    expect(stripCommentsAndStrings('/* requireFeatures: [] */').includes('requireFeatures')).toBe(false)
    expect(stripCommentsAndStrings("const s = 'requireFeatures: [1]'").includes('requireFeatures')).toBe(false)

    // a COMMENTED or QUOTED declaration does not count
    expect(classify('// requireFeatures: []\n').featureGated).toBe(false)
    expect(classify('// byDesign: nope\n').byDesign).toBe(false)
    expect(classify("const doc = 'requireFeatures: [1]'").featureGated).toBe(false)

    // an EMPTY array is NOT a gate — the runtime only fires when length > 0
    expect(classify("export const metadata = { POST: { requireFeatures: [] } }").featureGated).toBe(false)
    expect(classify('export const metadata = { POST: { requireFeatures: [ ] } }').featureGated).toBe(false)

    // a non-string / non-identifier FIRST element is NOT a gate (the runtime drops it)
    expect(classify('export const metadata = { POST: { requireFeatures: [0] } }').featureGated).toBe(false)
    expect(classify('export const metadata = { POST: { requireFeatures: [[]] } }').featureGated).toBe(false)
    expect(classify('export const metadata = { POST: { requireFeatures: [,] } }').featureGated).toBe(false)

    // a bare token in a REGEX literal or a TYPE annotation is not a declaration
    expect(classify('const RE = /requireFeatures:/').featureGated).toBe(false)
    expect(classify('type Gate = { requireFeatures: string[] }').featureGated).toBe(false)
    expect(classify('type M = { byDesign: string }').byDesign).toBe(false)

    // a coincidental factory helper is NOT a feature carrier
    expect(classify('const x = makeSomethingRoute()').featureGated).toBe(false)

    // a REAL, non-empty declaration in code still counts
    expect(classify("export const metadata = { POST: { requireFeatures: ['x'] } }").featureGated).toBe(true)
    expect(classify('export const metadata = { POST: { requireFeatures: [REQUIRED_FEATURE] } }').featureGated).toBe(true)
    expect(classify("export const metadata = { POST: { byDesign: 'x' } }").byDesign).toBe(true)
    expect(classify('export const metadata = { POST: { byDesign: `x` } }').byDesign).toBe(true)

    // ★ A SHARED CONSTANT is the same gate, and the departure route uses one (2026-10-20)
    expect(
      classify(
        'const DEPARTURE_FEATURES = [DELETE_USER_FEATURE, MANAGE_FEATURE]\n' +
          'export const metadata = { POST: { requireFeatures: DEPARTURE_FEATURES } }',
      ).featureGated,
    ).toBe(true)
    // …but only when the constant actually resolves to a NON-EMPTY array in the same file
    expect(
      classify(
        'const EMPTY = []\nexport const metadata = { POST: { requireFeatures: EMPTY } }',
      ).featureGated,
    ).toBe(false)
    expect(
      classify('export const metadata = { POST: { requireFeatures: FROM_ELSEWHERE } }').featureGated,
    ).toBe(false)
  })
})
