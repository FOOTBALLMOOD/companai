import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

export type IntegrationSpecDiscoveryItem = {
  path: string
  moduleName: string | null
  isOverlay: boolean
  requiredModules: string[]
  requiredEnvVars: string[]
  requiredAnyEnvVars: string[]
}

const MODULE_INTEGRATION_DIRECTORY_NAME = '__integration__'
const DISCOVERY_IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  '.turbo',
  'coverage',
  'test-results',
  '.yarn',
  '.cache',
  'tmp',
  'temp',
  '.claude',
  '.codex',
])
const INTEGRATION_META_FILE_NAMES = ['meta.ts', 'index.ts'] as const
const INTEGRATION_META_DEPENDENCY_KEYS = ['dependsOnModules', 'requiredModules', 'requiresModules'] as const
const INTEGRATION_META_REQUIRED_ENV_KEYS = ['requiredEnvVars', 'requiresEnvVars'] as const
const INTEGRATION_META_REQUIRED_ANY_ENV_KEYS = ['requiredAnyEnvVars', 'requiresAnyEnvVars'] as const
const DEFAULT_OVERLAY_ROOT = 'packages/enterprise'

export function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/')
}

function normalizeModuleId(moduleId: string): string {
  return moduleId.trim().toLowerCase()
}

function isEnterpriseModulesEnabled(): boolean {
  const rawValue = process.env.OM_ENABLE_ENTERPRISE_MODULES?.trim().toLowerCase()
  return rawValue === 'true' || rawValue === '1' || rawValue === 'yes' || rawValue === 'on'
}

function collectNamedDirectories(rootPath: string, directoryName: string): string[] {
  let entries
  try {
    entries = readdirSync(rootPath, { withFileTypes: true, encoding: 'utf8' })
  } catch {
    return []
  }

  const collected: string[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (DISCOVERY_IGNORED_DIRS.has(entry.name)) continue
    const absolutePath = path.join(rootPath, entry.name)
    if (entry.name === directoryName) {
      collected.push(absolutePath)
    }
    collected.push(...collectNamedDirectories(absolutePath, directoryName))
  }
  return collected
}

function collectSpecFilesFromDirectory(directoryPath: string): string[] {
  let entries
  try {
    entries = readdirSync(directoryPath, { withFileTypes: true, encoding: 'utf8' })
  } catch {
    return []
  }

  const collected: string[] = []
  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name)
    if (entry.isDirectory()) {
      collected.push(...collectSpecFilesFromDirectory(absolutePath))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
      collected.push(absolutePath)
    }
  }
  return collected
}

function collectDirectDirectoryNames(directoryPath: string): string[] {
  let entries
  try {
    entries = readdirSync(directoryPath, { withFileTypes: true, encoding: 'utf8' })
  } catch {
    return []
  }
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
}

function collectModuleIdsFromModulesRoot(modulesRoot: string, enabledModules: Set<string>): void {
  for (const moduleName of collectDirectDirectoryNames(modulesRoot)) {
    enabledModules.add(normalizeModuleId(moduleName))
  }
}

/**
 * `CC-149` — the modules the APP actually enables, read from its own declaration.
 *
 * `resolveEnabledModuleIds` below scans **directories**, so it answers *"which modules exist"* — and a
 * parked module's directory still exists. That is the `CC-132` trap in a second place: a denominator
 * built from the filesystem cannot see a switch that lives in a config file. A spec belonging to a
 * parked module is discovered, loaded by Playwright, and crashes on the module's own generated entity
 * ids (`customers/commands/people.ts:197` reads `E.customers`, which is not generated for a parked
 * module) — before a single test runs.
 *
 * `CC-152` — the same trap one level deeper, in this file's own second question. A module can be
 * pushed **behind a guard**:
 *
 *     if (parseBooleanWithDefault(process.env.OM_ENABLE_EXAMPLES, false)) {
 *       enabledModules.push({ id: 'example', from: '@app' })
 *     }
 *
 * Reading the push without its guard answers "enabled" from a line the runtime never executes — so
 * the example module's specs ran in CI, where the flag is off, against pages and routes that are only
 * generated for an enabled module. Every one of them failed on a 404 (`CC-152`). The guard is
 * therefore read *with* the push:
 *   - `parseBooleanWithDefault(process.env.NAME, DEFAULT)` — the module counts as enabled only when
 *     NAME parses on, with the same token table `@open-mercato/shared/lib/boolean` uses.
 *   - `enabledModules.some((entry) => entry.id === 'OTHER')` — enabled only when OTHER is already
 *     in the set (the set is built static-array-first, then push-by-push, in source order).
 *   - any other shape, or no guard — the module counts as enabled. Over-inclusion fails loud (the
 *     spec runs and fails); under-inclusion would silently shrink the suite.
 *
 * Returns `null` when the project declares no such file (a standalone app whose enablement lives
 * elsewhere), and the caller keeps the old directory-based answer.
 */
function readDeclaredEnabledModules(projectRoot: string): Set<string> | null {
  const candidates = [
    path.join(projectRoot, 'apps', 'mercato', 'src', 'modules.ts'),
    path.join(projectRoot, 'src', 'modules.ts'),
  ]
  for (const file of candidates) {
    if (!existsSync(file)) continue
    const source = readFileSync(file, 'utf8')
    const start = source.indexOf('export const enabledModules')
    if (start < 0) continue
    const end = source.indexOf('\n]', start)
    if (end < 0) continue
    const ids = new Set<string>()
    // Top-level entries are `id:` at four spaces; nested override objects are deeper, so the indent
    // keeps a widget id out of the module set.
    for (const match of source.slice(start, end).matchAll(/^ {4}id:\s*'([^']+)'/gm)) {
      ids.add(normalizeModuleId(match[1]))
    }
    collectPushedModuleIds(source, ids)
    if (ids.size > 0) return ids
  }
  return null
}

/**
 * `CC-152` — a guarded push is only a push when its guard is open. See the docblock above for the
 * two guard shapes this reads and why an unrecognised shape must over-include.
 */
function collectPushedModuleIds(source: string, ids: Set<string>): void {
  const lines = source.split('\n')
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].includes('enabledModules.push(')) continue
    // `enabledModules.push({ id: 'x' …` may put the id on the same line or the next one.
    const pushWindow = lines.slice(index, index + 3).join('\n')
    const pushMatch = pushWindow.match(/enabledModules\.push\(\s*\{\s*id:\s*'([^']+)'/)
    if (!pushMatch) continue
    let guardIndex = index - 1
    while (guardIndex >= 0 && lines[guardIndex].trim() === '') guardIndex -= 1
    const guardLine = guardIndex >= 0 ? lines[guardIndex] : ''
    const envGuard = guardLine.match(
      /^if\s*\(\s*parseBooleanWithDefault\(\s*process\.env\.([A-Z0-9_]+)\s*,\s*(true|false)\s*\)\s*\)\s*\{\s*$/,
    )
    if (envGuard) {
      if (!isEnvFlagEnabled(envGuard[1], envGuard[2] === 'true')) continue
      ids.add(normalizeModuleId(pushMatch[1]))
      continue
    }
    const moduleGuard = guardLine.match(
      /^if\s*\(\s*enabledModules\.some\(\(entry\)\s*=>\s*entry\.id\s*===\s*'([^']+)'\)\s*\)\s*\{\s*$/,
    )
    if (moduleGuard) {
      if (!ids.has(normalizeModuleId(moduleGuard[1]))) continue
      ids.add(normalizeModuleId(pushMatch[1]))
      continue
    }
    ids.add(normalizeModuleId(pushMatch[1]))
  }
}

/**
 * `CC-152` — mirrors `parseBooleanWithDefault` from `@open-mercato/shared/lib/boolean` (same token
 * table, same default-when-unset). Duplicated rather than imported: this file must not pull the
 * shared package into the CLI's discovery path.
 */
function isEnvFlagEnabled(name: string, fallback: boolean): boolean {
  const rawValue = process.env[name]
  if (typeof rawValue !== 'string') return fallback
  const normalized = rawValue.trim().toLowerCase()
  if (!normalized) return fallback
  const trueValues = new Set(['1', 'true', 'yes', 'y', 'on', 'enable', 'enabled'])
  const falseValues = new Set(['0', 'false', 'no', 'n', 'off', 'disable', 'disabled'])
  if (trueValues.has(normalized)) return true
  if (falseValues.has(normalized)) return false
  return fallback
}

function resolveEnabledModuleIds(projectRoot: string): Set<string> {
  const enabledModules = new Set<string>()
  const appModulesRoot = path.join(projectRoot, 'src', 'modules')
  const appsRoot = path.join(projectRoot, 'apps')
  const packagesRoot = path.join(projectRoot, 'packages')
  const installedPackagesRoot = path.join(projectRoot, 'node_modules', '@open-mercato')
  const enterpriseEnabled = isEnterpriseModulesEnabled()

  // Standalone app: src/modules at project root
  collectModuleIdsFromModulesRoot(appModulesRoot, enabledModules)

  for (const appName of collectDirectDirectoryNames(appsRoot)) {
    const moduleRoot = path.join(appsRoot, appName, 'src', 'modules')
    collectModuleIdsFromModulesRoot(moduleRoot, enabledModules)
  }
  for (const packageName of collectDirectDirectoryNames(packagesRoot)) {
    if (packageName === 'enterprise' && !enterpriseEnabled) {
      continue
    }
    const moduleRoot = path.join(packagesRoot, packageName, 'src', 'modules')
    collectModuleIdsFromModulesRoot(moduleRoot, enabledModules)
  }
  // Standalone app: installed @open-mercato packages in node_modules
  for (const packageName of collectDirectDirectoryNames(installedPackagesRoot)) {
    if (packageName === 'enterprise' && !enterpriseEnabled) {
      continue
    }
    const moduleRoot = path.join(installedPackagesRoot, packageName, 'src', 'modules')
    collectModuleIdsFromModulesRoot(moduleRoot, enabledModules)
  }
  const createAppTemplateModulesRoot = path.join(projectRoot, 'packages', 'create-app', 'template', 'src', 'modules')
  collectModuleIdsFromModulesRoot(createAppTemplateModulesRoot, enabledModules)

  return enabledModules
}

function extractModuleNameFromIntegrationPath(relativePath: string): string | null {
  const segments = normalizePath(relativePath).split('/')
  const integrationDirectoryIndex = segments.indexOf(MODULE_INTEGRATION_DIRECTORY_NAME)
  if (integrationDirectoryIndex <= 0) {
    return null
  }
  const moduleSegment = segments[integrationDirectoryIndex - 1]
  return moduleSegment && moduleSegment.length > 0 ? moduleSegment : null
}

function resolveOverlayRootPath(): string {
  const configured = process.env.OM_INTEGRATION_OVERLAY_ROOT?.trim()
  if (!configured) {
    return DEFAULT_OVERLAY_ROOT
  }
  return configured.replace(/\/+$/, '')
}

function isOverlayIntegrationPath(relativePath: string, overlayRoot: string): boolean {
  return normalizePath(relativePath).startsWith(`${normalizePath(overlayRoot)}/`)
}

function extractStringArrayFromSource(source: string, keys: readonly string[]): string[] {
  const collected = new Set<string>()
  for (const key of keys) {
    const keyPattern = new RegExp(`${key}\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'm')
    const keyMatch = source.match(keyPattern)
    if (!keyMatch?.[1]) continue
    const valuesPattern = /['"`]([a-zA-Z0-9_.-]+)['"`]/g
    for (const valueMatch of keyMatch[1].matchAll(valuesPattern)) {
      const value = String(valueMatch[1] ?? '').trim()
      if (value) {
        collected.add(value)
      }
    }
  }
  return Array.from(collected)
}

function extractDependencyListFromSource(source: string): string[] {
  return extractStringArrayFromSource(source, INTEGRATION_META_DEPENDENCY_KEYS).map(normalizeModuleId)
}

function extractRequiredEnvVarsFromSource(source: string): string[] {
  return extractStringArrayFromSource(source, INTEGRATION_META_REQUIRED_ENV_KEYS)
}

function extractRequiredAnyEnvVarsFromSource(source: string): string[] {
  return extractStringArrayFromSource(source, INTEGRATION_META_REQUIRED_ANY_ENV_KEYS)
}

function readDependenciesFromMetadataFile(absolutePath: string): string[] {
  try {
    return extractDependencyListFromSource(readFileSync(absolutePath, 'utf8'))
  } catch {
    return []
  }
}

function readRequiredEnvVarsFromMetadataFile(absolutePath: string): string[] {
  try {
    return extractRequiredEnvVarsFromSource(readFileSync(absolutePath, 'utf8'))
  } catch {
    return []
  }
}

function readRequiredAnyEnvVarsFromMetadataFile(absolutePath: string): string[] {
  try {
    return extractRequiredAnyEnvVarsFromSource(readFileSync(absolutePath, 'utf8'))
  } catch {
    return []
  }
}

function resolveIntegrationRootDirectory(relativeSpecPath: string): string | null {
  const segments = normalizePath(relativeSpecPath).split('/')
  const integrationDirectoryIndex = segments.indexOf(MODULE_INTEGRATION_DIRECTORY_NAME)
  if (integrationDirectoryIndex === -1) {
    return null
  }
  return segments.slice(0, integrationDirectoryIndex + 1).join('/')
}

function resolveRequiredModulesForSpec(projectRoot: string, relativeSpecPath: string): string[] {
  const requiredModules = new Set<string>()
  const normalizedSpecPath = normalizePath(relativeSpecPath)
  const absoluteSpecPath = path.join(projectRoot, normalizedSpecPath)
  const integrationRoot = resolveIntegrationRootDirectory(normalizedSpecPath)

  if (integrationRoot) {
    const relativeDirectory = normalizePath(path.dirname(normalizedSpecPath))
    const integrationRootAbsolute = path.join(projectRoot, integrationRoot)
    const directoryAbsolute = path.join(projectRoot, relativeDirectory)
    const relativeFromIntegrationRoot = normalizePath(path.relative(integrationRootAbsolute, directoryAbsolute))
    const pathSegments = relativeFromIntegrationRoot === '.'
      ? []
      : relativeFromIntegrationRoot.split('/').filter(Boolean)

    let currentDirectory = integrationRootAbsolute
    const traversal = [currentDirectory, ...pathSegments.map((segment) => {
      currentDirectory = path.join(currentDirectory, segment)
      return currentDirectory
    })]

    for (const directoryPath of traversal) {
      for (const metadataFileName of INTEGRATION_META_FILE_NAMES) {
        const metadataPath = path.join(directoryPath, metadataFileName)
        readDependenciesFromMetadataFile(metadataPath).forEach((dependency) => requiredModules.add(dependency))
      }
    }
  }

  readDependenciesFromMetadataFile(absoluteSpecPath).forEach((dependency) => requiredModules.add(dependency))
  const specFileName = path.basename(normalizedSpecPath, '.spec.ts')
  const perTestMetadataPath = path.join(path.dirname(absoluteSpecPath), `${specFileName}.meta.ts`)
  readDependenciesFromMetadataFile(perTestMetadataPath).forEach((dependency) => requiredModules.add(dependency))

  return Array.from(requiredModules)
}

function resolveRequiredEnvVarsForSpec(projectRoot: string, relativeSpecPath: string): string[] {
  const requiredEnvVars = new Set<string>()
  const normalizedSpecPath = normalizePath(relativeSpecPath)
  const absoluteSpecPath = path.join(projectRoot, normalizedSpecPath)
  const integrationRoot = resolveIntegrationRootDirectory(normalizedSpecPath)

  if (integrationRoot) {
    const relativeDirectory = normalizePath(path.dirname(normalizedSpecPath))
    const integrationRootAbsolute = path.join(projectRoot, integrationRoot)
    const directoryAbsolute = path.join(projectRoot, relativeDirectory)
    const relativeFromIntegrationRoot = normalizePath(path.relative(integrationRootAbsolute, directoryAbsolute))
    const pathSegments = relativeFromIntegrationRoot === '.'
      ? []
      : relativeFromIntegrationRoot.split('/').filter(Boolean)

    let currentDirectory = integrationRootAbsolute
    const traversal = [currentDirectory, ...pathSegments.map((segment) => {
      currentDirectory = path.join(currentDirectory, segment)
      return currentDirectory
    })]

    for (const directoryPath of traversal) {
      for (const metadataFileName of INTEGRATION_META_FILE_NAMES) {
        const metadataPath = path.join(directoryPath, metadataFileName)
        readRequiredEnvVarsFromMetadataFile(metadataPath).forEach((envVar) => requiredEnvVars.add(envVar))
      }
    }
  }

  readRequiredEnvVarsFromMetadataFile(absoluteSpecPath).forEach((envVar) => requiredEnvVars.add(envVar))
  const specFileName = path.basename(normalizedSpecPath, '.spec.ts')
  const perTestMetadataPath = path.join(path.dirname(absoluteSpecPath), `${specFileName}.meta.ts`)
  readRequiredEnvVarsFromMetadataFile(perTestMetadataPath).forEach((envVar) => requiredEnvVars.add(envVar))

  return Array.from(requiredEnvVars)
}

function resolveRequiredAnyEnvVarsForSpec(projectRoot: string, relativeSpecPath: string): string[] {
  const requiredAnyEnvVars = new Set<string>()
  const normalizedSpecPath = normalizePath(relativeSpecPath)
  const absoluteSpecPath = path.join(projectRoot, normalizedSpecPath)
  const integrationRoot = resolveIntegrationRootDirectory(normalizedSpecPath)

  if (integrationRoot) {
    const relativeDirectory = normalizePath(path.dirname(normalizedSpecPath))
    const integrationRootAbsolute = path.join(projectRoot, integrationRoot)
    const directoryAbsolute = path.join(projectRoot, relativeDirectory)
    const relativeFromIntegrationRoot = normalizePath(path.relative(integrationRootAbsolute, directoryAbsolute))
    const pathSegments = relativeFromIntegrationRoot === '.'
      ? []
      : relativeFromIntegrationRoot.split('/').filter(Boolean)

    let currentDirectory = integrationRootAbsolute
    const traversal = [currentDirectory, ...pathSegments.map((segment) => {
      currentDirectory = path.join(currentDirectory, segment)
      return currentDirectory
    })]

    for (const directoryPath of traversal) {
      for (const metadataFileName of INTEGRATION_META_FILE_NAMES) {
        const metadataPath = path.join(directoryPath, metadataFileName)
        readRequiredAnyEnvVarsFromMetadataFile(metadataPath).forEach((envVar) => requiredAnyEnvVars.add(envVar))
      }
    }
  }

  readRequiredAnyEnvVarsFromMetadataFile(absoluteSpecPath).forEach((envVar) => requiredAnyEnvVars.add(envVar))
  const specFileName = path.basename(normalizedSpecPath, '.spec.ts')
  const perTestMetadataPath = path.join(path.dirname(absoluteSpecPath), `${specFileName}.meta.ts`)
  readRequiredAnyEnvVarsFromMetadataFile(perTestMetadataPath).forEach((envVar) => requiredAnyEnvVars.add(envVar))

  return Array.from(requiredAnyEnvVars)
}

function isEnvironmentVariableConfigured(name: string): boolean {
  const value = process.env[name]
  return typeof value === 'string' && value.trim().length > 0
}

export function discoverIntegrationSpecFiles(projectRoot: string, legacyIntegrationRoot: string): IntegrationSpecDiscoveryItem[] {
  const discoveredByPath = new Map<string, IntegrationSpecDiscoveryItem>()
  const overlayRoot = resolveOverlayRootPath()
  const enterpriseEnabled = isEnterpriseModulesEnabled()
  const discoveryRoots = [
    path.join(projectRoot, 'src', 'modules'),
    path.join(projectRoot, 'apps'),
    path.join(projectRoot, 'packages'),
    path.join(projectRoot, 'node_modules', '@open-mercato'),
  ]

  for (const specFile of collectSpecFilesFromDirectory(legacyIntegrationRoot)) {
    const relativePath = normalizePath(path.relative(projectRoot, specFile))
    discoveredByPath.set(relativePath, {
      path: relativePath,
      moduleName: extractModuleNameFromIntegrationPath(relativePath),
      isOverlay: isOverlayIntegrationPath(relativePath, overlayRoot),
      requiredModules: resolveRequiredModulesForSpec(projectRoot, relativePath),
      requiredEnvVars: resolveRequiredEnvVarsForSpec(projectRoot, relativePath),
      requiredAnyEnvVars: resolveRequiredAnyEnvVarsForSpec(projectRoot, relativePath),
    })
  }

  for (const root of discoveryRoots) {
    for (const integrationDirectory of collectNamedDirectories(root, MODULE_INTEGRATION_DIRECTORY_NAME)) {
      for (const specFile of collectSpecFilesFromDirectory(integrationDirectory)) {
        const relativePath = normalizePath(path.relative(projectRoot, specFile))
        discoveredByPath.set(relativePath, {
          path: relativePath,
          moduleName: extractModuleNameFromIntegrationPath(relativePath),
          isOverlay: isOverlayIntegrationPath(relativePath, overlayRoot),
          requiredModules: resolveRequiredModulesForSpec(projectRoot, relativePath),
          requiredEnvVars: resolveRequiredEnvVarsForSpec(projectRoot, relativePath),
          requiredAnyEnvVars: resolveRequiredAnyEnvVarsForSpec(projectRoot, relativePath),
        })
      }
    }
  }

  const discovered = Array.from(discoveredByPath.values())
  const enabledModules = resolveEnabledModuleIds(projectRoot)
  const declaredEnabledModules = readDeclaredEnabledModules(projectRoot)
  // One definition of "enabled" for both questions: may this spec's own module run, and are the
  // modules it DEPENDS on available. The directory scan answers "exists", and a parked module's
  // directory exists — using it here is how a spec that needs the parked CRM stayed in the suite.
  const isModuleEnabled = (moduleId: string): boolean =>
    (declaredEnabledModules ?? enabledModules).has(normalizeModuleId(moduleId))
  const enabledModuleNames = new Set<string>()
  for (const file of discovered) {
    if (!file.isOverlay && file.moduleName) {
      enabledModuleNames.add(file.moduleName)
    }
  }

  return discovered
    .filter((file) => {
      // `CC-149` — a spec that belongs to a module this app does not enable cannot run: the module's
      // commands and generated entity ids are not part of the build, so loading the spec crashes
      // before the first test. Overlays declare their own enablement below.
      if (
        !file.isOverlay &&
        file.moduleName &&
        !isModuleEnabled(file.moduleName)
      ) {
        return false
      }
      if (file.requiredModules.some((moduleId) => !isModuleEnabled(moduleId))) {
        return false
      }
      if (file.requiredEnvVars.some((envVar) => !isEnvironmentVariableConfigured(envVar))) {
        return false
      }
      if (
        file.requiredAnyEnvVars.length > 0 &&
        !file.requiredAnyEnvVars.some((envVar) => isEnvironmentVariableConfigured(envVar))
      ) {
        return false
      }
      if (!file.isOverlay) {
        return true
      }
      if (!enterpriseEnabled) {
        return false
      }
      if (!file.moduleName) {
        return true
      }
      if (enabledModuleNames.has(file.moduleName)) {
        return true
      }
      return enabledModules.has(normalizeModuleId(file.moduleName))
    })
    .sort((left, right) => left.path.localeCompare(right.path))
}
