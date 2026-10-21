/**
 * `CC-110` — the baseline and the reason rule.
 *
 * The first four are the ones that matter, because they are what makes the gate *possible*: the row's own
 * diagnosis was *"Ours is all-or-nothing `:fail` against 169 items, which is why it can never be turned on."*
 * A pin that fails on new and on stale can be switched on the day it lands and can only shrink after that.
 *
 * The last two are the two census defects: `-- x` passing as a reason, and a file-level block disable being
 * counted as one line-shaped hole while it exempts the whole file.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CHECKER = path.resolve(HERE, '..', 'check-escape-hatches.mjs')

let base

function writeSource(relPath, body) {
  const full = path.join(base, 'packages', 'core', 'src', relPath)
  mkdirSync(path.dirname(full), { recursive: true })
  writeFileSync(full, body)
}

function fixtureBaseline(entries) {
  const dir = path.join(base, 'scripts')
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'escape-hatches.baseline.json'), JSON.stringify(entries, null, 2) + '\n')
}

function run(extra = []) {
  const result = spawnSync(process.execPath, [CHECKER, '--root', base, '--json', ...extra], {
    encoding: 'utf8',
  })
  // `--update-baseline` writes its status to stderr and nothing to stdout, so stdout can legitimately be
  // empty. Parsing it anyway is a test bug, not a checker bug.
  return {
    status: result.status,
    report: result.stdout ? JSON.parse(result.stdout) : null,
    stderr: result.stderr,
  }
}

const HOLE_A = 'packages/core/src/a.ts'
const HOLE_B = 'packages/core/src/b.ts'

describe('CC-110 — the escape-hatch baseline', () => {
  before(() => {
    base = mkdtempSync(path.join(tmpdir(), 'escape-hatch-baseline-'))
  })

  after(() => {
    rmSync(base, { recursive: true, force: true })
  })

  beforeEach(() => {
    // The suite shares one fixture root, so a file written by one test would be read by the next — and a
    // baseline pinned by one test would be compared against another's tree. Clean both, every time, and
    // let each test write the exact pin it needs.
    rmSync(path.join(base, 'packages'), { recursive: true, force: true })
    rmSync(path.join(base, 'scripts'), { recursive: true, force: true })
  })

  const UNNAMED_A = {
    file: HOLE_A,
    line: 1,
    kind: 'eslint-disable',
    named: false,
    text: '// eslint-disable-next-line no-console',
  }
  const NAMED_A = { ...UNNAMED_A, named: true, text: '// eslint-disable-next-line no-console -- reason' }

  function writeA(body = '// eslint-disable-next-line no-console') {
    writeSource('a.ts', [body, 'export const a = 1', ''].join('\n'))
  }

  it('★ --fail passes when the tree matches the pin exactly', () => {
    writeA()
    fixtureBaseline([UNNAMED_A])
    const { status } = run(['--fail'])
    assert.equal(status, 0, 'the pinned state is the state the gate accepts — this is what makes it switchable')
  })

  it('★ --fail fails on a NEW hole and names it', () => {
    writeA()
    writeSource('b.ts', ['// eslint-disable-next-line no-console', 'export const b = 2', ''].join('\n'))
    fixtureBaseline([UNNAMED_A])
    const { status, stderr } = run(['--fail'])
    assert.equal(status, 1)
    assert.match(stderr, /NEW/)
    assert.match(stderr, /b\.ts:1/)
  })

  it('★ --fail fails on a STALE pin — a hole fixed without updating the baseline', () => {
    writeA()
    writeSource('b.ts', ['// eslint-disable-next-line no-console', 'export const b = 2', ''].join('\n'))
    fixtureBaseline([UNNAMED_A, { ...UNNAMED_A, file: HOLE_B }])
    rmSync(path.join(base, 'packages', 'core', 'src', 'b.ts'), { force: true })
    const { status, stderr } = run(['--fail'])
    assert.equal(status, 1)
    assert.match(stderr, /STALE/)
    assert.match(stderr, /b\.ts:1/)
  })

  it('★ --update-baseline rewrites the pin and the next --fail passes', () => {
    writeA()
    fixtureBaseline([UNNAMED_A, { ...UNNAMED_A, file: HOLE_B }])
    const { status } = run(['--update-baseline'])
    assert.equal(status, 0)
    const written = JSON.parse(readFileSync(path.join(base, 'scripts', 'escape-hatches.baseline.json'), 'utf8'))
    assert.equal(written.length, 1, 'the stale entry is gone and nothing else is invented')
    assert.equal(written[0].file, HOLE_A)
    assert.equal(run(['--fail']).status, 0)
  })

  it('★ a hole that GAINS a reason is progress, not a failure', () => {
    writeA('// eslint-disable-next-line no-console -- the CLI is the one legal writer')
    fixtureBaseline([UNNAMED_A])
    const { status, stderr } = run(['--fail'])
    assert.equal(status, 0, 'progress must not break the build')
    assert.match(stderr, /PROGRESS|gained a reason/)
  })

  it('★ a hole that LOSES its reason is a regression and fails', () => {
    // Pin the hole WITH a reason, then take the reason away — the ratchet's whole value is that going
    // backwards is louder than going forwards.
    writeA('// eslint-disable-next-line no-console -- reason')
    fixtureBaseline([NAMED_A])
    writeA('// eslint-disable-next-line no-console')
    const { status, stderr } = run(['--fail'])
    assert.equal(status, 1)
    assert.match(stderr, /REGRESSION/)
  })
})

describe('CC-110 — a reason is a reason', () => {
  before(() => {
    base = mkdtempSync(path.join(tmpdir(), 'escape-hatch-reason-'))
  })

  after(() => {
    rmSync(base, { recursive: true, force: true })
  })

  beforeEach(() => {
    rmSync(path.join(base, 'packages'), { recursive: true, force: true })
    rmSync(path.join(base, 'scripts'), { recursive: true, force: true })
  })

  it('★ `-- x` is NOT a reason any more', () => {
    // Was `/--\s*\S/`: a single character was enough. The donor requires code AND reason and closes the
    // empty-reason loophole; ours closed nothing.
    writeSource('junk.ts', ['// eslint-disable-next-line no-console -- x', 'export const j = 1', ''].join('\n'))
    const { report } = run()
    assert.equal(report.unnamed, 1, 'a one-character reason is not a reason')
    assert.equal(report.unnamedHoles[0].file, 'packages/core/src/junk.ts')
  })

  it('★ a real word still passes', () => {
    writeSource('real.ts', ['// eslint-disable-next-line no-console -- legacy CLI writer', 'export const r = 1', ''].join('\n'))
    const { report } = run()
    assert.equal(report.unnamed, 0)
    assert.equal(report.named, 1)
  })

  it('★ a FILE-LEVEL block disable is its own kind, not one line-hole', () => {
    // The census defeat: a block-form disable at the top of a file exempts the whole file while the checker
    // scored it as a single hole. Measured on the real tree: 12 of them, all unnamed.
    writeSource('blanket.ts', ['/* eslint-disable no-console */', 'console.log(1)', 'console.log(2)', ''].join('\n'))
    const { report } = run()
    assert.equal(report.byKind['eslint-disable-file'].total, 1, 'the file-level form has its own kind')
    assert.equal(report.byKind['eslint-disable-file'].unnamed, 1)
    assert.equal(report.byKind['eslint-disable'].total, 0, 'it is not also counted as a line hole')
  })
})
