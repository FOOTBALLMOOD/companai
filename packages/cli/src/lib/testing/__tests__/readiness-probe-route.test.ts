/**
 * The readiness probe's path must point at a route that exists **and** whose module is enabled.
 *
 * `CC-143`: the probe read `/api/customers/people?pageSize=1`, and `customers` is parked in
 * `apps/mercato/src/modules.ts` ("upstream's reference module for CRUD patterns … parked, not deleted").
 * A route from a parked module is not generated, so the call returned **404**, the probe waited its full
 * 180 seconds, and every integration shard failed — on every configuration of this app, from the day
 * `customers` was parked. It went unnoticed because no run had ever reached the probe: the workflow was
 * only ever executed for the first time on 2026-10-20.
 *
 * Two facts have to hold together, and neither alone is enough:
 *   1. the module that owns the path is **enabled** — otherwise the route is never generated;
 *   2. a route **file** exists at that path — otherwise the path was never real.
 *
 * This test asserts both against the source, so the next parking decision or path edit fails here
 * instead of failing every shard after 180 seconds of waiting.
 */
import fs from 'node:fs'
import path from 'node:path'

import { READINESS_PROBE_PATH } from '../integration'

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..', '..')

/** Strip comments so a sentence that *mentions* a module cannot count as enabling it. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
}

function enabledModuleIds(): string[] {
  const source = stripComments(fs.readFileSync(path.join(REPO_ROOT, 'apps', 'mercato', 'src', 'modules.ts'), 'utf8'))
  const start = source.indexOf('export const enabledModules')
  expect(start).toBeGreaterThanOrEqual(0)
  const end = source.indexOf('\n]', start)
  expect(end).toBeGreaterThan(start)
  const block = source.slice(start, end)
  return [...block.matchAll(/\bid:\s*'([^']+)'/g)].map((m) => m[1])
}

/** `/api/auth/profile` → `{ module: 'auth', rest: 'profile' }`. */
function parseProbePath(): { module: string; rest: string } {
  const match = /^\/api\/([a-z0-9_]+)\/(.+)$/.exec(READINESS_PROBE_PATH)
  if (!match) throw new Error(`the readiness probe path "${READINESS_PROBE_PATH}" is not /api/<module>/<route>`)
  return { module: match[1], rest: match[2] }
}

describe('the authenticated readiness probe', () => {
  const { module: probeModule, rest } = parseProbePath()

  it('names a module that is enabled in the app', () => {
    const enabled = enabledModuleIds()
    // The denominator: an empty parse would pass the assertion below by vacuity.
    expect(enabled.length).toBeGreaterThanOrEqual(10)
    expect(enabled).toContain(probeModule)
  })

  it('names a route file that exists in the package that ships the module', () => {
    const candidates = fs
      .readdirSync(path.join(REPO_ROOT, 'packages'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(REPO_ROOT, 'packages', entry.name, 'src', 'modules', probeModule, 'api', rest, 'route.ts'))
      .filter((candidate) => fs.existsSync(candidate))

    expect(candidates.length).toBeGreaterThanOrEqual(1)
  })
})
