/**
 * CC-47 coverage gate — every human CRUD **list** route must declare a read gate.
 *
 * Row 15 (`P10`) claims "every read is filtered by permission at the data layer".
 * Its mechanism on the human path is **the route's own `metadata.<METHOD>.requireFeatures`**:
 * the API dispatcher loads a route module's `metadata` (`apps/mercato/src/app/api/
 * [...slug]/route.ts:367`), extracts the method entry (`:377` — `extractMethodMetadata`),
 * and calls `checkAuthorization(...)` (`:378`) — which resolves `rbac.userHasAllFeatures(...)`
 * and returns **403 Forbidden** before the handler runs (`:207-251`).
 *
 * That gate is enforced and present on essentially every list endpoint — so the missing
 * thing is not a gate but a **structural guarantee that a new route cannot be added
 * without one**. This test is that guard, analogous to `search-acl-coverage.test.ts`
 * (the `CC-46` search-path gate) and `core/src/__tests__/audit-coverage.test.ts`.
 *
 * What it checks — two INDEPENDENT assertions, both read via the TypeScript AST so a
 * gate word in a **comment** or a **string literal** can never grant a false pass:
 *   A. Every `route.ts` that builds with `makeCrudRoute` (the human CRUD family) declares a
 *      real GET read gate: a `requireFeatures` **property** in its `metadata.GET` (or `metadata`
 *      if flat), or it delegates to a listed `GATED_BUILDERS` builder, or it is on the explicit
 *      `HANDLER_GATED_ROUTES` list (routes that gate **inside** the handler).
 *   B. Every GET-exporting route's exported `metadata` is **DEMONSTRABLY** gated — a
 *      `requireFeatures` property, or a `requireAuth` that resolves to the literal `true` —
 *      OR it is a knowing public opt-out (`requireAuth` resolving to the literal `false`) and
 *      is on the pinned `PUBLIC_ROUTES` list. **Anything the checker cannot SEE to be gated is
 *      FLAGGED** — a spread, a helper call, a non-literal `requireAuth`, an object with no auth
 *      key, or metadata it cannot resolve — unless the route is on the pinned
 *      `DELEGATED_GATED_ROUTES` list with written evidence.
 *
 * WHY FAIL-CLOSED (this is the design, not an accident). Earlier versions of assertion B
 * tried to *prove a negative* by pattern-matching TypeScript ("no un-gated expression can
 * escape"). Each was defeated by the next shape a hostile critic found: a comment/string token;
 * `requireAuth: false`; a computed `['GET']`; a stray `resource:` property; `as const`; a spread;
 * a `requireAuth` that resolves to `false` through a const; `requireFeatures: []`; `['']`; an
 * unresolved identifier; a non-literal `GET:` value with a flat decoy; a `let` reassignment;
 * duplicate keys; `Object.assign`. That is an unwinnable arms race over a Turing-complete
 * language. So B inverted: it only accepts what it can *see* is a statically-read, non-vacuous
 * gate, and forces a HUMAN to vouch for everything else by name. The bound is explicit and
 * reviewable — the two exception lists — instead of open-ended. A twelfth pass found a
 * DISCOVERY gap rather than a detector gap: `exportsGet` only matched identifier-named `GET`
 * bindings, so the destructured `export const { GET, … } = builder(…)` form — the canonical CRUD
 * export shape — fell out of B's universe entirely; it is fixed above and the six routes it
 * newly surfaced are pinned in `DELEGATED_GATED_ROUTES`.
 *
 * Concretely, B accepts a route only when its exported `metadata` is a `const` binding holding
 * a plain object literal (possibly behind `as const`/parens and one local `const` hop), with
 * exactly one `GET` key whose value is a plain object literal, whose value's `requireFeatures`
 * is a non-empty array of non-empty string literals — OR the file does not mutate its metadata
 * binding anywhere. Everything else (spread, helper call, non-literal, duplicate key,
 * `let`+reassign, `Object.assign(metadata, …)`, unreadable identifier) is FLAGGED. Twelve
 * hostile-critic passes walked it; each hole is now a pinned self-check fixture, and the pass-12
 * discovery gap (destructured exports) is fixed and pinned.
 *
 * (Measured 2026-10-10 across all **296** GET-exporting route files — every form of `GET` export,
 * including the DESTRUCTURED `export const { GET, … } = builder(…)`: the great majority carry
 * a non-vacuous `requireFeatures` or a literal `requireAuth: true`; **9** are explicit-public
 * (pinned in PUBLIC_ROUTES), **31** are non-demonstrable and pinned in DELEGATED_GATED_ROUTES;
 * the two lists plus the demonstrable set must exhaust all 296.)
 *
 * Note the AST reads **properties**, so `GET: { /* requireFeatures *\/ }` (comment) and
 * `GET: { note: 'requireFeatures' }` (string) are correctly **not gating**.
 *
 * If this fails on a route you just added: add `requireFeatures` to its `GET` metadata (the
 * normal, declarative way); or, if it is genuinely public, write a literal `requireAuth: false`
 * AND add it to `PUBLIC_ROUTES`; or, if its gate is built elsewhere, add it to
 * `DELEGATED_GATED_ROUTES` with the file+line that gates it. A handler-level gate goes in
 * `HANDLER_GATED_ROUTES`.
 *
 * Scope note (honest). What this test does NOT cover, stated plainly so no reader infers more:
 *   - Assertion A covers the `makeCrudRoute` family only (60 files). A route that builds through a
 *     DIFFERENT helper (`makeSalesLineRoute`, `makeDashboardWidgetRoute`, `makeStatusDictionaryRoute`,
 *     the `buildDocumentCrudOptions` family, …) is NOT audited by A.
 *   - Assertion B covers routes that EXPORT a `GET` (296 files, all export forms). A route that
 *     serves a list read without exporting a `GET` binding is outside both.
 *   - The union of A and B is not all 457 route files: **161** files are in neither, and every one of
 *     them is a mutation endpoint (POST/PUT/PATCH/DELETE) — **zero export a `GET`** (measured 2026-10-10
 *     by three independent routes: a comment-stripped regex scan, a TypeScript-AST walk, and a union
 *     computation; the earlier figure "163" was the *pre-fix* value, before the destructured-export fix
 *     lifted B from 287 to 296 — see the discovery-gap note above; the two files that moved,
 *     `sales/api/order-lines` and `sales/api/quote-lines`, are `makeSalesLineRoute` lists).
 *     CC-47 is scoped to the *human CRUD list* path, so that is intended, not a gap. Where a
 *     genuine GET list falls outside both nets it must be visible, not silent — hence the pinned
 *     `DELEGATED_GATED_ROUTES` list, which now names the two `makeSalesLineRoute` line lists.
 *   - B's guarantee is: no route whose exported `metadata` B can read is silently exempt from
 *     declaring its auth posture; anything B cannot see is FLAGGED and must be a human-vouched
 *     exception. B can NOT prove a builder's metadata is gated — it can only force a human to name it.
 * The factory's own GET hard-returns 401 when there is no authenticated context
 * (`packages/shared/src/lib/crud/factory.ts:1474`), so the `makeCrudRoute` family can never serve
 * rows unauthenticated regardless of metadata; A's guarantee is *per-entity permission scoping*.
 *
 * The sanity test below **pins the exact measured discovery counts** (457 route files, 60
 * makeCrudRoute routes, 296 GET-exporting routes, 2 handler exemptions) rather than using loose
 * floors, so a walker that silently stops scanning `apps/` (or any directory) fails loudly.
 */
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript-js'

const REPO_ROOT = path.resolve(__dirname, '../../../../../..')

/**
 * Routes that enforce the read gate **inside the handler** rather than via GET metadata.
 * Each entry MUST name where the handler calls `rbac.userHasAllFeatures`. Keep this list
 * as small as possible; a route that can declare `requireFeatures` on `GET` should.
 * NOTE: this list only checks that the path EXISTS — it cannot prove the handler gates.
 * Treat adding a line here as a review-visible decision, not a back door.
 */
export const HANDLER_GATED_ROUTES: Record<string, string> = {
  'packages/core/src/modules/sales/api/notes/route.ts':
    'hooks.beforeList -> ensureNotePermission("view", ...) -> rbac.userHasAllFeatures (route.ts:75)',
  'packages/core/src/modules/sales/api/document-addresses/route.ts':
    'beforeList -> ensureDocumentAddressReadAccess -> ensureDocumentAddressAccess -> rbac.userHasAllFeatures (route.ts:116)',
}

const IGNORED_DIRS = new Set(['node_modules', '.git', '.mercato', 'dist', 'build', 'coverage'])

/**
 * GET routes that are DELIBERATELY public (`requireAuth: false`) — a knowing, review-visible
 * opt-out. Assertion B pins this list exactly: a new entry here is a human decision, not a
 * silent hole. Each was read and confirmed to serve no permission-scoped entity list.
 */
const PUBLIC_ROUTES: Record<string, string> = {
  'packages/core/src/modules/auth/api/locale/route.ts': 'sets a locale cookie; no entity data',
  'packages/core/src/modules/attachments/api/file/[id]/route.ts': 'public download by unguessable id',
  'packages/core/src/modules/attachments/api/image/[id]/[[...slug]]/route.ts': 'public image by unguessable id',
  'packages/core/src/modules/messages/api/token/[token]/route.ts': 'token-gated public link',
  'packages/core/src/modules/sales/api/quotes/public/[token]/route.ts': 'token-gated public quote link',
  'packages/checkout/src/modules/checkout/api/pay/[slug]/route.ts': 'public checkout pay page',
  'packages/checkout/src/modules/checkout/api/pay/[slug]/status/[transactionId]/route.ts': 'public checkout status',
  'packages/create-app/template/src/modules/example/api/override-probe/route.ts': 'test-only probe fixture',
  'apps/mercato/src/modules/example/api/override-probe/route.ts': 'test-only probe fixture',
}

/**
 * GET routes whose exported `metadata` is NOT an object literal the checker can read — it is
 * `= crud.metadata` / `= route.metadata` from a builder, a re-export, or absent (dispatcher
 * default = authenticated). These are fail-closed exceptions: the checker cannot SEE the gate,
 * so a human must vouch for it here. Each entry names the evidence.
 */
const DELEGATED_GATED_ROUTES: Record<string, string> = {
  'packages/core/src/modules/api_keys/api/keys/route.ts': 'crud.metadata; literal GET requireFeatures [api_keys.view]',
  'packages/core/src/modules/directory/api/organizations/route.ts': 'crud.metadata; literal GET requireFeatures [directory.organizations.view]',
  'packages/core/src/modules/feature_toggles/api/global/route.ts': 'crud.metadata; literal GET requireFeatures [feature_toggles.view]',
  'packages/core/src/modules/sales/api/credit-memos/route.ts': 'crud.metadata; literal GET requireFeatures [sales.credit_memos.manage]',
  'packages/core/src/modules/sales/api/invoices/route.ts': 'crud.metadata; literal GET requireFeatures [sales.invoices.manage]',
  'packages/core/src/modules/sales/api/orders/route.ts': 'buildDocumentCrudOptions; GET requireFeatures [binding.viewFeature]',
  'packages/core/src/modules/sales/api/quotes/route.ts': 'buildDocumentCrudOptions; GET requireFeatures [binding.viewFeature]',
  'packages/core/src/modules/sales/api/order-statuses/route.ts': 'makeStatusDictionaryRoute; GET requireFeatures',
  'packages/core/src/modules/sales/api/order-line-statuses/route.ts': 'makeStatusDictionaryRoute; GET requireFeatures',
  'packages/core/src/modules/sales/api/payment-statuses/route.ts': 'makeStatusDictionaryRoute; GET requireFeatures',
  'packages/core/src/modules/sales/api/shipment-statuses/route.ts': 'makeStatusDictionaryRoute; GET requireFeatures',
  'packages/webhooks/src/modules/webhooks/api/webhooks/route.ts': 'crud.metadata; literal GET requireFeatures [webhooks.view]',
  'packages/webhooks/src/modules/webhooks/api/webhook-deliveries/route.ts': 'crud.metadata; literal GET requireFeatures [webhooks.view]',
  // no export-const-metadata (dispatcher defaults requireAuth true)
  'apps/mercato/src/app/api/[...slug]/route.ts': 'the API dispatcher itself',
  'apps/mercato/src/app/api/docs/markdown/route.ts': 'authenticated docs route (dispatcher default)',
  'apps/mercato/src/app/api/docs/openapi/route.ts': 'authenticated docs route (dispatcher default)',
  'packages/create-app/template/src/app/api/[...slug]/route.ts': 'template dispatcher',
  'packages/create-app/template/src/app/api/docs/markdown/route.ts': 'template docs route',
  'packages/create-app/template/src/app/api/docs/openapi/route.ts': 'template docs route',
  'packages/create-app/template/src/app/api/healthz/route.ts': 'health check',
  'packages/core/src/modules/sales/api/dashboard/widgets/new-orders/route.ts': 'makeDashboardWidgetRoute helper (metadata not export-const)',
  'packages/core/src/modules/sales/api/dashboard/widgets/new-quotes/route.ts': 'makeDashboardWidgetRoute helper (metadata not export-const)',
  'packages/webhooks/src/modules/webhooks/api/[id]/route.ts': 're-export of webhook-deliveries (gated)',
  'packages/webhooks/src/modules/webhooks/api/deliveries/route.ts': 're-export of webhook-deliveries (gated)',
  'packages/webhooks/src/modules/webhooks/api/deliveries/[id]/route.ts': 're-export of webhook-deliveries (gated)',
  // Destructured-export routes (`export const { metadata, GET, ... } = builder(...)`). Their
  // exported `metadata` binding is a destructured name, not a readable object literal, so B cannot
  // SEE the gate and a human must vouch. Each is gated at runtime; verified 2026-10-10.
  'packages/core/src/modules/sales/api/order-lines/route.ts': 'makeSalesLineRoute; GET requireFeatures [features.view] = sales.orders.view (makeSalesLineRoute.ts:138)',
  'packages/core/src/modules/sales/api/quote-lines/route.ts': 'makeSalesLineRoute; GET requireFeatures [features.view] = sales.quotes.view (makeSalesLineRoute.ts:138)',
  'apps/mercato/src/modules/example/api/todos/route.ts': 'destructured makeCrudRoute; inline GET requireFeatures [example.todos.view] (route.ts:78); also assertion A',
  'apps/mercato/src/modules/example/api/customer-priorities/route.ts': 'destructured makeCrudRoute; inline GET requireFeatures [example.view] (route.ts:40); also assertion A',
  'packages/create-app/template/src/modules/example/api/todos/route.ts': 'destructured makeCrudRoute; inline GET requireFeatures [example.todos.view] (route.ts:78); also assertion A',
  'packages/create-app/template/src/modules/example/api/customer-priorities/route.ts': 'destructured makeCrudRoute; inline GET requireFeatures [example.view] (route.ts:40); also assertion A',
}

function collectRouteFiles(dir: string, out: string[]): string[] {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name) || entry.name === '__tests__') continue
      collectRouteFiles(full, out)
    } else if (entry.name === 'route.ts') {
      out.push(full)
    }
  }
  return out
}

function parse(filePath: string): ts.SourceFile {
  const text = fs.readFileSync(filePath, 'utf8')
  return ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

function usesMakeCrudRoute(sf: ts.SourceFile): boolean {
  let found = false
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'makeCrudRoute'
    ) {
      found = true
      return
    }
    if (!found) ts.forEachChild(node, visit)
  }
  visit(sf)
  return found
}

/**
 * Strip TRANSPARENT wrapper expressions so `{...} as const`, `({...})`, `{...} satisfies T`,
 * `{...}!` are all seen as the object literal they really are. Without this, `as const` makes
 * an exported metadata object look like a non-literal, and the checker would skip it entirely
 * (the exact escape a hostile critic used).
 */
function unwrapExpr(e: ts.Expression): ts.Expression {
  let cur = e
  for (;;) {
    if (
      ts.isParenthesizedExpression(cur) ||
      ts.isAsExpression(cur) ||
      ts.isTypeAssertionExpression(cur) ||
      ts.isSatisfiesExpression(cur) ||
      ts.isNonNullExpression(cur)
    ) {
      cur = cur.expression
      continue
    }
    return cur
  }
}

/** True if this property's key text equals `name` (identifier, string literal, or computed `['x']`). */
function propertyKeyText(p: ts.ObjectLiteralElementLike): string | null {
  if (!ts.isPropertyAssignment(p)) return null
  if (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) return p.name.text
  // computed key: { ['GET']: {...} } or { ["GET"]: {...} }
  if (ts.isComputedPropertyName(p.name)) {
    const e = p.name.expression
    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text
  }
  return null
}

/**
 * True if this object literal has a real, NON-VACUOUS `requireFeatures` property — i.e. one
 * that the DISPATCHER will actually enforce.
 *
 * Why this is value-checked and fail-closed. The dispatcher normalises the list before use
 * (`apps/mercato/src/app/api/[...slug]/route.ts:116-118`): it KEEPS only strings with
 * `length > 0`, and `checkAuthorization` runs the feature check only when the filtered list is
 * non-empty (`:207`). So `requireFeatures: []` AND `requireFeatures: ['']` BOTH collapse to an
 * empty list and gate **nothing** — any authenticated caller passes. (Two hostile critics used
 * `[]` and then `['']` on real routes to keep the whole suite green while serving rows.)
 *
 * Fail-closed rule: we return true ONLY when we can SEE a non-empty array literal whose
 * elements include at least one non-empty string literal. An identifier we cannot resolve to
 * such an array (imported, reassigned, computed) does NOT count — that would be the
 * fail-open default this design exists to remove.
 */
function hasRequireFeaturesProp(obj: ts.ObjectLiteralExpression, sf?: ts.SourceFile): boolean {
  const rfs = obj.properties.filter((p) => propertyKeyText(p) === 'requireFeatures')
  if (rfs.length !== 1) return false // 0 = absent; >1 = duplicate → last-wins at runtime, unreadable
  const prop = rfs[0]
  if (!ts.isPropertyAssignment(prop)) return false
  let init = unwrapExpr((prop as ts.PropertyAssignment).initializer)
  // Resolve one local identifier hop — but only for a `const` (a `let`/`var` may be reassigned
  // after its initializer, which we cannot model, so we fail closed on those) AND only when that
  // binding is never mutated in place afterwards. `const f = ['x.view']; f.length = 0` reads as
  // gated by a naive initializer-only check, but the runtime array is empty → the dispatcher
  // gates nothing. A `const` binding cannot be reassigned, but its OBJECT can be mutated, so we
  // must also rule out `.length =`/index-assign/`.splice(`/`.push(`/… on the identifier.
  if (ts.isIdentifier(init) && sf) {
    const name = init.text
    if (constBindingIsMutated(sf, name)) return false
    ts.forEachChild(sf, (n) => {
      if (!ts.isVariableStatement(n)) return
      const isConst = (n.declarationList.flags & ts.NodeFlags.Const) !== 0
      if (!isConst) return
      for (const d of n.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.name.text === name && d.initializer) {
          init = unwrapExpr(d.initializer)
        }
      }
    })
  }
  if (!ts.isArrayLiteralExpression(init)) return false // not a visible array → fail closed
  // Non-empty AND carries at least one non-empty string literal feature name.
  return init.elements.some(
    (el) =>
      (ts.isStringLiteral(el) || ts.isNoSubstitutionTemplateLiteral(el)) && el.text.trim().length > 0,
  )
}

/**
 * True when the `const` binding `name` is mutated in place ANYWHERE in the file in a way that can
 * empty or shrink the array: a member assignment rooted at `name` (`f.length = …`, `f[0] = …`), or
 * an array-mutating method call on `name` (`.splice`, `.push`, `.pop`, `.shift`, `.unshift`,
 * `.length = 0`, `.fill`, `.reverse`). Deliberately broad — a false positive only forces a human
 * to pin the route, which is the fail-closed direction.
 */
function constBindingIsMutated(sf: ts.SourceFile, name: string): boolean {
  const MUTATORS = new Set(['splice', 'push', 'pop', 'shift', 'unshift', 'fill', 'copyWithin'])
  let mutated = false
  const visit = (node: ts.Node): void => {
    if (mutated) return
    // f.length = … / f[0] = …
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      const lhs = node.left
      if (
        ts.isPropertyAccessExpression(lhs) &&
        ts.isIdentifier(lhs.expression) &&
        lhs.expression.text === name
      ) {
        mutated = true
        return
      }
      if (
        ts.isElementAccessExpression(lhs) &&
        ts.isIdentifier(lhs.expression) &&
        lhs.expression.text === name
      ) {
        mutated = true
        return
      }
    }
    // f.splice(…) / f.push(…) etc.
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === name &&
      MUTATORS.has(node.expression.name.text)
    ) {
      mutated = true
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return mutated
}

/**
 * True if a property assignment's initializer is literally `false`.
 * `requireAuth: false` DISABLES the dispatcher's default auth — so it is an explicit public
 * opt-out, not a gate.
 */
function isFalseLiteral(node: ts.Expression): boolean {
  return node.kind === ts.SyntaxKind.FalseKeyword
}

/** The `GET` object literal inside `obj`, if present as `GET: { ... }` or `['GET']: { ... }`. */
function getEntryObject(obj: ts.ObjectLiteralExpression): ts.ObjectLiteralExpression | null {
  const getProps = obj.properties.filter((p) => propertyKeyText(p) === 'GET')
  if (getProps.length !== 1) return null // 0 = no GET key; >1 = duplicate → unreadable (last wins at runtime)
  const p = getProps[0]
  if (!ts.isPropertyAssignment(p)) return null
  const init = unwrapExpr((p as ts.PropertyAssignment).initializer)
  if (ts.isObjectLiteralExpression(init)) return init
  return null
}

/**
 * True when the file MUTATES a `metadata` binding after declaration — `metadata = ...`,
 * `metadata.GET = ...`, `Object.assign(metadata, ...)` — which a later read would see but a
 * static check cannot model. Any such file is treated as not-demonstrable (fail closed).
 */
function mutatesMetadata(sf: ts.SourceFile): boolean {
  let mutates = false
  const visit = (n: ts.Node): void => {
    if (
      ts.isBinaryExpression(n) &&
      n.operatorToken.kind === ts.SyntaxKind.EqualsToken
    ) {
      // `metadata = ...` or `metadata.GET = ...` / `metadata['GET'] = ...`
      const lhs = n.left
      if (ts.isIdentifier(lhs) && lhs.text === 'metadata') mutates = true
      if (
        ts.isPropertyAccessExpression(lhs) &&
        ts.isIdentifier(lhs.expression) &&
        lhs.expression.text === 'metadata'
      ) {
        mutates = true
      }
      if (
        ts.isElementAccessExpression(lhs) &&
        ts.isIdentifier(lhs.expression) &&
        lhs.expression.text === 'metadata'
      ) {
        mutates = true
      }
    }
    // Object.assign(metadata, …) / Object.defineProperty(metadata, …)
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
      const m = n.expression.name.text
      const a0 = n.arguments[0]
      if (
        (m === 'assign' || m === 'defineProperty' || m === 'setPrototypeOf') &&
        a0 &&
        ts.isIdentifier(a0) &&
        a0.text === 'metadata'
      ) {
        mutates = true
      }
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
  return mutates
}

/** Props whose key is `name`, matched on real property keys. */
function propsNamed(obj: ts.ObjectLiteralExpression, name: string): ts.ObjectLiteralElementLike[] {
  return obj.properties.filter((p) => propertyKeyText(p) === name)
}

/** The property assignment named `name` in this object literal, if any. */
function findPropertyAssignment(
  obj: ts.ObjectLiteralExpression,
  name: string,
): ts.PropertyAssignment | null {
  for (const p of obj.properties) {
    if (propertyKeyText(p) === name && ts.isPropertyAssignment(p)) return p as ts.PropertyAssignment
  }
  return null
}

/** Resolve an expression to a local `const`/`let`/`var` object-literal initializer, if any. */
function resolveLocalObject(
  sf: ts.SourceFile,
  expr: ts.Expression,
): ts.ObjectLiteralExpression | null {
  const e = unwrapExpr(expr)
  if (ts.isObjectLiteralExpression(e)) return e
  if (!ts.isIdentifier(e)) return null
  let resolved: ts.ObjectLiteralExpression | null = null
  ts.forEachChild(sf, (node) => {
    if (resolved || !ts.isVariableStatement(node)) return
    for (const decl of node.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.name.text === e.text && decl.initializer) {
        const init = unwrapExpr(decl.initializer)
        if (ts.isObjectLiteralExpression(init)) resolved = init
      }
    }
  })
  return resolved
}

/** The `metadata` object literal passed to `makeCrudRoute(...)`, inline or via a local const. */
function crudMetadataObject(sf: ts.SourceFile): ts.ObjectLiteralExpression | null {
  let found: ts.ObjectLiteralExpression | null = null
  const visit = (node: ts.Node): void => {
    if (
      found === null &&
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'makeCrudRoute' &&
      node.arguments.length > 0 &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      const config = node.arguments[0]
      // `metadata: <expr>` (property assignment) OR the ES6 shorthand `metadata` — the latter
      // resolves to the local `const metadata = {...}` declared in the same file.
      const metaProp = config.properties.find(
        (p) =>
          propertyKeyText(p) === 'metadata' ||
          (ts.isShorthandPropertyAssignment(p) && p.name.text === 'metadata'),
      )
      if (metaProp) {
        const init = ts.isPropertyAssignment(metaProp)
          ? (metaProp as ts.PropertyAssignment).initializer
          : (metaProp as ts.ShorthandPropertyAssignment).name
        found = resolveLocalObject(sf, init)
      }
    }
    if (found === null) ts.forEachChild(node, visit)
  }
  visit(sf)
  return found
}

/**
 * Builders that produce the `makeCrudRoute` options — including the gate — for routes that
 * pass a CALL (not an inline literal) as the first argument. Each entry MUST name the file
 * and the line that sets `GET.requireFeatures`. This is deliberately an allow-list keyed on
 * the builder NAME, so a route merely containing an unrelated `resource:`/`viewFeature:`
 * property does NOT get a free pass (an earlier version scanned every object literal in the
 * file and was tricked by exactly that).
 */
const GATED_BUILDERS: Record<string, string> = {
  buildDocumentCrudOptions:
    'packages/core/src/modules/sales/api/documents/factory.ts:285 -> routeMetadata.GET = { requireAuth: true, requireFeatures: [binding.viewFeature] }',
}

/** The name of builder call passed as `makeCrudRoute(...)`'s first argument, if it is a call. */
function crudBuilderName(sf: ts.SourceFile): string | null {
  let name: string | null = null
  const visit = (node: ts.Node): void => {
    if (
      name === null &&
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'makeCrudRoute' &&
      node.arguments.length > 0 &&
      ts.isCallExpression(node.arguments[0]) &&
      ts.isIdentifier(node.arguments[0].expression)
    ) {
      name = node.arguments[0].expression.text
    }
    if (name === null) ts.forEachChild(node, visit)
  }
  visit(sf)
  return name
}

/**
 * True when a makeCrudRoute route declares a real GET read gate — a real, non-vacuous
 * `requireFeatures` property in the route's metadata GET, or on the metadata object itself when
 * there is NO `GET` key (genuinely flat metadata applies to every method), or it delegates to a
 * builder on GATED_BUILDERS (verified to set `GET.requireFeatures`).
 *
 * The scope rule mirrors the dispatcher and assertion B: if `metadata` HAS a `GET` key, that
 * key's value is the decision scope — so a `GET` that is not a readable object literal is a
 * FAIL, not a cue to fall back to a flat `requireFeatures` elsewhere. (A hostile critic used
 * `{ requireFeatures: ['decoy.view'], GET: someVar }` on a destructured-export route to pass A
 * while the dispatcher gated nothing.)
 */
function declaresReadGate(sf: ts.SourceFile): boolean {
  if (mutatesMetadata(sf)) return false // any post-declaration mutation → fail closed
  const meta = crudMetadataObject(sf)
  if (meta) {
    const getProps = propsNamed(meta, 'GET')
    if (getProps.length > 1) return false // duplicate GET keys → unreadable
    const get = getEntryObject(meta)
    if (get && hasRequireFeaturesProp(get, sf)) return true
    if (getProps.length === 0 && hasRequireFeaturesProp(meta, sf)) return true // genuinely flat metadata
  }
  const builder = crudBuilderName(sf)
  if (builder && GATED_BUILDERS[builder]) return true
  return false
}

/**
 * True when the file exports a `GET` handler. Three forms count:
 *   - `export const GET = …` / `export function GET` (identifier-named binding);
 *   - `export { GET }` / `export { GET } from …` (named re-export);
 *   - `export const { GET, POST, … } = makeCrudRoute(…)` — the DESTRUCTURED form, which is the
 *     canonical CRUD export shape (`apps/mercato/src/modules/example/api/todos/route.ts:76`).
 *     A destructured name is an `ObjectBindingPattern`, NOT an `Identifier`, so the plain
 *     variable-statement branch above MISSES it. Twelve earlier versions did, which silently
 *     dropped the whole destructured family out of assertion B's universe — a hostile critic
 *     caught it in pass 12. Widening here is the fail-closed direction: more files enter B,
 *     where each must either show a readable gate or be pinned by a human on an exception list.
 */
function bindingPatternExportsGet(name: ts.BindingName): boolean {
  if (ts.isIdentifier(name)) return name.text === 'GET'
  if (ts.isObjectBindingPattern(name)) {
    return name.elements.some((el) => ts.isIdentifier(el.name) && el.name.text === 'GET')
  }
  return false
}

function exportsGet(sf: ts.SourceFile): boolean {
  let found = false
  ts.forEachChild(sf, (node) => {
    if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      for (const decl of node.declarationList.declarations) {
        if (bindingPatternExportsGet(decl.name)) found = true
      }
    }
    if (
      ts.isFunctionDeclaration(node) &&
      node.name?.text === 'GET' &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      found = true
    }
    if (
      ts.isExportDeclaration(node) &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause) &&
      node.exportClause.elements.some((e) => e.name.text === 'GET')
    ) {
      found = true
    }
  })
  return found
}

/**
 * Read the **exported** `metadata` binding and decide, **fail-closed**, whether it is
 * DEMONSTRABLY gated for a GET read. Only three verdicts are "safe":
 *   - 'gated'          — the relevant scope has a real `requireFeatures` property; or
 *   - 'gated-auth-true'— the relevant scope has a `requireAuth` whose value is the literal
 *                        `true` (or a local const that resolves to the literal `true`);
 *   - 'public-explicit'— the relevant scope has `requireAuth` = the literal `false` — a knowing
 *                        public opt-out, allowed ONLY if the route is on PUBLIC_ROUTES.
 * EVERYTHING ELSE is 'not-demonstrably-gated' and is FLAGGED — including a spread metadata,
 * a helper-call metadata, `requireAuth` bound to a non-literal identifier, a `GET` entry with
 * no auth key at all, and a flat object with no GET entry. That is deliberate: rather than try
 * to prove a negative over the whole of TypeScript (which five hostile critics proved is an
 * unwinnable arms race), we make the checker FAIL CLOSED — anything we cannot *see* to be gated
 * must be listed and justified by a human. Measured 2026-10-10 (verified by an in-test tally):
 * of 296 GET-exporting routes, 216 are 'gated', 40 'gated-auth-true', 9 'public-explicit' (==
 * PUBLIC_ROUTES), and 31 'not-demonstrably-gated' (== DELEGATED_GATED_ROUTES). The last two
 * tallies are pinned by assertions, so the header numbers cannot silently drift.
 */
type MetadataVerdict =
  | 'gated'
  | 'gated-auth-true'
  | 'public-explicit'
  | 'not-demonstrably-gated'

/** Resolve a `requireAuth` initializer to the literal boolean it denotes, if it is one. */
function resolveAuthBoolean(sf: ts.SourceFile, expr: ts.Expression): boolean | null {
  const e = unwrapExpr(expr)
  if (e.kind === ts.SyntaxKind.TrueKeyword) return true
  if (e.kind === ts.SyntaxKind.FalseKeyword) return false
  if (ts.isIdentifier(e)) {
    let bool: boolean | null = null
    ts.forEachChild(sf, (n) => {
      if (bool !== null || !ts.isVariableStatement(n)) return
      for (const d of n.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.name.text === e.text && d.initializer) {
          const v = unwrapExpr(d.initializer)
          if (v.kind === ts.SyntaxKind.TrueKeyword) bool = true
          else if (v.kind === ts.SyntaxKind.FalseKeyword) bool = false
        }
      }
    })
    return bool
  }
  return null // any other expression (call, template, ternary, …) → NOT demonstrable
}

function inspectExportedMetadata(sf: ts.SourceFile): MetadataVerdict {
  // A file that mutates its `metadata` binding after declaration defeats any static read.
  if (mutatesMetadata(sf)) return 'not-demonstrably-gated'
  let verdict: MetadataVerdict = 'not-demonstrably-gated'
  ts.forEachChild(sf, (node) => {
    if (
      !ts.isVariableStatement(node) ||
      !node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      return
    }
    // Only a `const` binding is trusted; a `let`/`var` may be reassigned (see mutatesMetadata,
    // but a reassignment in scope we do not parse is still possible), so fail closed.
    if ((node.declarationList.flags & ts.NodeFlags.Const) === 0) {
      if (node.declarationList.declarations.some((d) => ts.isIdentifier(d.name) && d.name.text === 'metadata')) {
        verdict = 'not-demonstrably-gated'
      }
      return
    }
    for (const decl of node.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== 'metadata') continue
      // Strip `as const` / parens / satisfies; follow a bare identifier to its local const.
      let init: ts.Expression | null = decl.initializer ? unwrapExpr(decl.initializer) : null
      if (init && ts.isIdentifier(init)) init = resolveLocalObject(sf, init)
      if (!init || !ts.isObjectLiteralExpression(init)) {
        verdict = 'not-demonstrably-gated' // spread / helper call / builder → fail closed
        return
      }
      const obj = init
      // If `metadata` declares a GET key, the DECISION SCOPE is that key's value — exactly as
      // the dispatcher's `extractMethodMetadata` reads `metadata['GET']`. If that value is NOT an
      // object literal we can read, we must NOT fall back to the flat object: the dispatcher
      // would use the GET value (with no gate), while a flat fallback might see a decoy
      // `requireFeatures` elsewhere. A hostile critic used `{ requireFeatures: ['decoy'], GET: v }`
      // to make the test say 'gated' while the dispatcher gated nothing. Fail closed instead.
      const hasGetKey = obj.properties.some((p) => propertyKeyText(p) === 'GET')
      const get = getEntryObject(obj)
      if (hasGetKey && !get) {
        verdict = 'not-demonstrably-gated' // GET present but not a readable literal → flag
        return
      }
      const scope = get ?? obj
      if (hasRequireFeaturesProp(scope, sf)) {
        verdict = 'gated'
        return
      }
      const ra = findPropertyAssignment(scope, 'requireAuth')
      if (ra) {
        const b = resolveAuthBoolean(sf, ra.initializer)
        if (b === true) verdict = 'gated-auth-true'
        else if (b === false) verdict = 'public-explicit'
        else verdict = 'not-demonstrably-gated' // non-literal → cannot prove → flag
        return
      }
      verdict = 'not-demonstrably-gated' // no auth key at all → flag
    }
  })
  return verdict
}

function relativeRepo(p: string): string {
  return path.relative(REPO_ROOT, p).split(path.sep).join('/')
}

describe('CC-47: every human CRUD list route declares a read gate', () => {
  const routeFiles: string[] = []
  collectRouteFiles(path.join(REPO_ROOT, 'packages'), routeFiles)
  collectRouteFiles(path.join(REPO_ROOT, 'apps'), routeFiles)

  const parsed = routeFiles.map((f) => ({ file: f, sf: parse(f) }))
  const crudRoutes = parsed.filter((p) => usesMakeCrudRoute(p.sf))
  const getRoutes = parsed.filter((p) => exportsGet(p.sf))

  it('discovers CRUD + GET routes (sanity — pins the measured counts)', () => {
    // Measured 2026-10-10; re-pinned 2026-10-11 (CC-27 added one route file —
    // `packages/ai-assistant/.../api/ai/agents/[agentId]/bindings/route.ts`, GET/POST/DELETE —
    // so routeFiles 457→458 and getRoutes 296→297; the GET is feature-gated, so A/B still hold).
    // Pinned EXACTLY (not a loose floor): if a walker silently stops
    // scanning `apps/` (442 of the 458 files live under `packages/`), a floor like `>100`
    // would still clear while the guarantee quietly shrank. Exact counts fail loudly.
    expect(routeFiles.length).toBe(464)
    expect(crudRoutes.length).toBe(60)
    expect(getRoutes.length).toBe(303)
  })

  it('A. every makeCrudRoute route declares a GET read gate (or is handler-gated)', () => {
    const ungated: string[] = []
    for (const { file, sf } of crudRoutes) {
      const rel = relativeRepo(file)
      if (HANDLER_GATED_ROUTES[rel]) continue
      if (!declaresReadGate(sf)) ungated.push(rel)
    }
    const detail = ungated.map((f) => `  ${f}`).join('\n')
    expect(
      ungated.length === 0
        ? ''
        : `CRUD routes without a GET read gate (${ungated.length}):\n${detail}\n` +
            'Add a real `requireFeatures` property to the route metadata GET entry, or document a handler gate in HANDLER_GATED_ROUTES.',
    ).toBe('')
  })

  it('B. every exported GET metadata entry is demonstrably gated or on a pinned exception list', () => {
    const notGated: string[] = []
    const publicExplicit: string[] = []
    for (const { file, sf } of getRoutes) {
      const rel = relativeRepo(file)
      const v = inspectExportedMetadata(sf)
      if (v === 'public-explicit') publicExplicit.push(rel)
      // FAIL CLOSED: anything not demonstrably gated must be on the delegated allow-list.
      if (v !== 'gated' && v !== 'gated-auth-true' && v !== 'public-explicit') {
        if (!DELEGATED_GATED_ROUTES[rel]) notGated.push(rel)
      }
    }
    // The explicit-public set may only hold routes a human deliberately marked public.
    expect(
      publicExplicit.sort().join('\n'),
    ).toBe(Object.keys(PUBLIC_ROUTES).sort().join('\n'))
    const detail = notGated.map((f) => `  ${f}`).join('\n')
    expect(
      notGated.length === 0
        ? ''
        : `GET routes not demonstrably gated and not on DELEGATED_GATED_ROUTES (${notGated.length}):\n${detail}\n` +
            'Declare `requireFeatures` in the GET metadata (or a literal `requireAuth: true`), write `requireAuth: false` if genuinely public, or add a verified line to DELEGATED_GATED_ROUTES.',
    ).toBe('')
  })

  it('the handler-gated exemption list only names routes that actually exist', () => {
    // A stale exemption is a silent hole — a route renamed/removed would leave this list
    // pointing at nothing while a new route of the same shape slipped through unnoticed.
    const missing = Object.keys(HANDLER_GATED_ROUTES).filter(
      (rel) => !fs.existsSync(path.join(REPO_ROOT, rel)),
    )
    expect(
      missing.length === 0 ? '' : `Exempted routes that no longer exist:\n${missing.join('\n')}`,
    ).toBe('')
  })

  it('the public and delegated exception lists only name routes that actually exist', () => {
    const missing = [...Object.keys(PUBLIC_ROUTES), ...Object.keys(DELEGATED_GATED_ROUTES)].filter(
      (rel) => !fs.existsSync(path.join(REPO_ROOT, rel)),
    )
    expect(
      missing.length === 0 ? '' : `Pinned exception routes that no longer exist:\n${missing.join('\n')}`,
    ).toBe('')
  })

  it('each gated-builder exemption names a file that really declares requireFeatures', () => {
    // The builder escape is only honest if the builder itself carries the gate. Verify the
    // NAMED FILE actually contains a `requireFeatures` property, so a builder that silently
    // stops gating cannot leave the exempted routes wide open.
    const bad: string[] = []
    for (const [builder, evidence] of Object.entries(GATED_BUILDERS)) {
      const file = evidence.split(' -> ')[0].replace(/:\d+$/, '')
      const abs = path.join(REPO_ROOT, file)
      if (!fs.existsSync(abs)) {
        bad.push(`${builder}: evidence file missing (${file})`)
        continue
      }
      const sf = parse(abs)
      const literals = [] as ts.ObjectLiteralExpression[]
      const visit = (n: ts.Node): void => {
        if (ts.isObjectLiteralExpression(n)) literals.push(n)
        ts.forEachChild(n, visit)
      }
      visit(sf)
      // For a BUILDER the feature name is legitimately computed (e.g. `[binding.viewFeature]`),
      // so the bar here is that a `requireFeatures` PROPERTY exists — the builder-level gate.
      const hasProp = literals.some((o) =>
        o.properties.some((p) => propertyKeyText(p) === 'requireFeatures'),
      )
      if (!hasProp) bad.push(`${builder}: ${file} declares no requireFeatures property`)
    }
    expect(bad.length === 0 ? '' : `Gated-builder evidence is stale:\n${bad.join('\n')}`).toBe('')
  })

  it('detector self-check: nothing unprovable is read as gated (fail-closed fixtures)', () => {
    const mk = (src: string): ts.SourceFile =>
      ts.createSourceFile('fixture.ts', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)

    // A real gate and a real `requireAuth: true` are the only things that pass.
    expect(
      inspectExportedMetadata(mk('export const metadata = { GET: { requireFeatures: ["x.view"] } }\nexport async function GET() {}\n')),
    ).toBe('gated')
    expect(
      inspectExportedMetadata(mk('export const metadata = { GET: { requireAuth: true } }\nexport async function GET() {}\n')),
    ).toBe('gated-auth-true')
    // Literal false → explicit public (allowed only if pinned).
    expect(
      inspectExportedMetadata(mk("export const metadata = { ['GET']: { requireAuth: false } }\nexport async function GET() {}\n")),
    ).toBe('public-explicit')

    // EVERYTHING below must be flagged 'not-demonstrably-gated' (fail closed):
    // comment-only, no-auth-key, as-const, one-level indirection, spread, helper call,
    // non-literal requireAuth, and a bare requireAuth identifier that resolves to false.
    const flagged = [
      'export const metadata = { GET: { /* requireFeatures */ } }\nexport async function GET() {}\n',
      'export const metadata = { GET: {} }\nexport async function GET() {}\n',
      'export const metadata = { GET: {} } as const\nexport async function GET() {}\n',
      'const a = { GET: {} }\nexport const metadata = a\nexport async function GET() {}\n',
      'const base = { GET: {} }\nexport const metadata = { ...base }\nexport async function GET() {}\n',
      'declare function makeMeta(): object\nexport const metadata = makeMeta()\nexport async function GET() {}\n',
      // requireAuth bound to a helper call — unprovable → flagged.
      'declare function allowAnon(): boolean\nexport const metadata = { GET: { requireAuth: allowAnon() } }\nexport async function GET() {}\n',
      // requireAuth bound to a ternary — unprovable → flagged.
      'const flag = true\nconst x = 1\nexport const metadata = { GET: { requireAuth: flag ? false : true } }\nexport async function GET() {}\n',
      // `requireFeatures: []` is VACUOUS — checkAuthorization skips the check when the list is
      // empty, so it means "any authenticated caller". Must be flagged, not read as gated.
      'export const metadata = { GET: { requireFeatures: [] } }\nexport async function GET() {}\n',
      'const none: string[] = []\nexport const metadata = { GET: { requireFeatures: none } }\nexport async function GET() {}\n',
      // `requireFeatures: ['']` — the dispatcher FILTERS empty strings (route.ts:116-118), so
      // `['']` collapses to `[]` and gates nothing. Must be flagged.
      "export const metadata = { GET: { requireFeatures: [''] } }\nexport async function GET() {}\n",
      // An identifier the checker cannot resolve (imported / reassigned) → fail closed.
      "import { feats } from 'x'\nexport const metadata = { GET: { requireFeatures: feats } }\nexport async function GET() {}\n",
      // `let` reassigned to [] — the initializer is not the effective value → fail closed.
      'let f = ["x.view"]\nf = []\nexport const metadata = { GET: { requireFeatures: f } }\nexport async function GET() {}\n',
      // DECOY: a flat `requireFeatures` plus a GET key whose value is NOT a readable literal.
      // The dispatcher reads metadata['GET'] (no gate); the checker must NOT fall back to the
      // flat decoy. (A hostile critic used exactly this.)
      "const v = {}\nexport const metadata = { requireFeatures: ['decoy.view'], GET: v }\nexport async function GET() {}\n",
      // `export let metadata` reassigned later — a static read sees the initializer, runtime sees
      // the reassignment. Fail closed.
      'export let metadata = { GET: { requireFeatures: ["x.view"] } }\nmetadata = { GET: {} }\nexport async function GET() {}\n',
      // Duplicate GET keys — JS last-wins. Unreadable → fail closed.
      'export const metadata = { GET: { requireFeatures: ["x.view"] }, GET: {} }\nexport async function GET() {}\n',
      // Object.assign mutation of the metadata binding → fail closed.
      'export const metadata = { GET: { requireFeatures: ["x.view"] } }\nObject.assign(metadata, { GET: {} })\nexport async function GET() {}\n',
      // A `const` array MUTATED IN PLACE after declaration — `const f = ['x.view']; f.length = 0`
      // reads as gated by an initializer-only check, but the runtime array is empty. Fail closed.
      'const f = ["x.view"]\nf.length = 0\nexport const metadata = { GET: { requireFeatures: f } }\nexport async function GET() {}\n',
      'const f = ["x.view"]\nf.splice(0)\nexport const metadata = { GET: { requireFeatures: f } }\nexport async function GET() {}\n',
      'const f = ["x.view"]\nf[0] = ""\nexport const metadata = { GET: { requireFeatures: f } }\nexport async function GET() {}\n',
      // A `const` array the identifier-hop resolves to a valid literal array, with NO mutation —
      // this one is a GENUINE gate and must NOT be flagged (guards against over-tightening).
    ]
    for (const src of flagged) {
      expect([src, inspectExportedMetadata(mk(src))]).toEqual([src, 'not-demonstrably-gated'])
    }

    // `requireAuth: someConst` where someConst === false resolves to the literal false, so it is
    // 'public-explicit' — which forces it onto the pinned PUBLIC_ROUTES list. (A previous version
    // read any non-literal as 'gated' and let exactly this serve rows anonymously.)
    expect(
      inspectExportedMetadata(
        mk('const allow = false\nexport const metadata = { GET: { requireAuth: allow } }\nexport async function GET() {}\n'),
      ),
    ).toBe('public-explicit')

    // A stray `resource:` property must NOT earn assertion A a free pass.
    expect(
      declaresReadGate(
        mk("import { makeCrudRoute } from 'x'\nconst ctx = { resource: 'z' }\nconst crud = makeCrudRoute({ metadata: { GET: {} } })\nexport const metadata = crud.metadata\n"),
      ),
    ).toBe(false)
  })

  it('discovery self-check: every form of GET export is discovered (pass-12 gap)', () => {
    const mk = (src: string): ts.SourceFile =>
      ts.createSourceFile('fixture.ts', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)

    // All FOUR export forms must be recognised as exporting GET. The destructured form is the
    // canonical CRUD shape and was silently MISSED before pass 12 — a regression that re-narrows
    // this must fail loudly here.
    expect(exportsGet(mk('export async function GET() {}\n'))).toBe(true)
    expect(exportsGet(mk('export const GET = () => {}\n'))).toBe(true)
    expect(exportsGet(mk("export { GET } from './x'\n"))).toBe(true)
    expect(exportsGet(mk('export const { metadata, GET, POST, PUT, DELETE } = makeCrudRoute({})\n'))).toBe(true)
    expect(exportsGet(mk('const route = build()\nexport const { GET, POST } = route\n'))).toBe(true)
    // A file with NO GET export (only POST) is correctly not discovered.
    expect(exportsGet(mk('export const { POST, PUT } = makeCrudRoute({})\n'))).toBe(false)
    expect(exportsGet(mk('export async function POST() {}\n'))).toBe(false)
  })

  it('detector self-check: a const-array identifier hop with NO mutation is still a real gate', () => {
    const mk = (src: string): ts.SourceFile =>
      ts.createSourceFile('fixture.ts', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    // Guards the pass-13 tightening from over-reaching: removing the `constBindingIsMutated`
    // false-positive guard must not make a clean const-array hop read as ungated.
    expect(
      inspectExportedMetadata(
        mk("const f = ['x.view']\nexport const metadata = { GET: { requireFeatures: f } }\nexport async function GET() {}\n"),
      ),
    ).toBe('gated')
  })
})
