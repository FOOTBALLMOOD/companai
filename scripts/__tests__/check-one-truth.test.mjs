/**
 * Tests for `scripts/check-one-truth.mjs` (SR-39).
 *
 * The important case is the LAST one: a mutation proof. A checker that only ever reports PASS is
 * indistinguishable from a checker that does nothing — so the fixture is deliberately drifted and
 * the test asserts the check FAILS and names the stale copy. That is the behaviour that would have
 * caught `CC-90` at the re-pin.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CHECKER = path.resolve(HERE, '..', 'check-one-truth.mjs')

const DIGEST_A = '07ee857bdab59a875317035d8aaad4d6'
const DIGEST_B = 'ca760e97ff1ef1f0e2ed3deb0dfc2923'

let base
let repoRoot
let docsRoot

/**
 * Write the copies of the pin digest. The docs repo is a SIBLING of the code repo
 * (`../../library/…`), which is why the fixture nests the code repo one level down.
 *
 * `CC-109` added two more copies — `HERMES-PIN.md` (the document a human reads) and `docker/README.md`
 * (the operator-facing table) — so the fixture writes those too. Both are written by default because a
 * fixture that omits them would make the residue guard fire on every test.
 */
function writeFixture({ verify, compose, pinpy, verifyBody, pinDoc, readme }) {
  mkdirSync(path.join(repoRoot, 'docker', 'hermes'), { recursive: true })
  mkdirSync(path.join(docsRoot, 'development'), { recursive: true })

  writeFileSync(
    path.join(repoRoot, 'docker', 'hermes', 'verify_pin.py'),
    verifyBody ?? `# fixture\nDEFAULT_EXPECTED_DIGEST = "${verify}"\n`,
  )
  writeFileSync(
    path.join(repoRoot, 'docker-compose.hermes.yml'),
    `services:\n  hermes:\n    environment:\n      HERMES_PIN_DIGEST: \${HERMES_PIN_DIGEST:-${compose}}\n`,
  )
  writeFileSync(path.join(docsRoot, '.hermes_pin.py'), `# fixture\nEXPECTED_DIGEST = "${pinpy}"\n`)
  // `pinDoc` and `readme` are VALUES, not content overrides. An earlier draft wrote
  // `pinDoc ?? \`…${pinDoc ?? pinpy}…\``, which short-circuits: passing a value replaced the whole file
  // with the bare digest, the pattern matched nothing, and the test passed for the wrong reason.
  writeFileSync(
    path.join(docsRoot, 'development', 'HERMES-PIN.md'),
    `# Pin\n\n**The pinned digest — this is the value the harness enforces:**\n\n    digest   : ${pinDoc ?? pinpy}\n`,
  )
  writeFileSync(
    path.join(repoRoot, 'docker', 'README.md'),
    `| Setting | Default | Notes |\n|---------|---------|-------|\n| \`HERMES_PIN_DIGEST\` | \`${readme ?? pinpy}\` | The digest the mounted tree must produce. |\n`,
  )
}

function run() {
  const result = spawnSync(process.execPath, [CHECKER, '--root', repoRoot, '--json'], {
    encoding: 'utf8',
  })
  return { status: result.status, report: JSON.parse(result.stdout), stderr: result.stderr }
}

const factOf = (report, id) => report.facts.find((fact) => fact.id === id)

describe('check-one-truth (SR-39)', () => {
  before(() => {
    base = mkdtempSync(path.join(tmpdir(), 'one-truth-'))
    // The docs repo is a SIBLING two levels up from the code repo — exactly as on disk
    // (`companai/workspace/starting-kit` -> `companai`). The fixture mirrors that depth so the
    // `../../library/…` representation resolves INSIDE the temp tree instead of escaping it.
    repoRoot = path.join(base, 'workspace', 'starting-kit')
    docsRoot = path.join(base, 'library')
  })

  after(() => {
    rmSync(base, { recursive: true, force: true })
  })

  it('passes when every copy agrees', () => {
    writeFixture({ verify: DIGEST_A, compose: DIGEST_A, pinpy: DIGEST_A })
    const { status, report } = run()
    const fact = factOf(report, 'hermes-pin-digest')
    assert.equal(status, 0, 'exit code should be 0')
    assert.equal(fact.verdict, 'PASS')
    assert.deepEqual(fact.distinctValues, [DIGEST_A])
    // `CC-109` — was 3. HERMES-PIN.md and docker/README.md are registered now, so the fact has five
    // copies. This number is the point of the change: two more copies are covered than were before.
    assert.equal(fact.readable, 5, 'all five copies should be readable')
  })

  // ★ THE MUTATION PROOF — this is the case CC-90 would have hit.
  it('FAILS and names the stale copy when one representation drifts', () => {
    writeFixture({ verify: DIGEST_B, compose: DIGEST_A, pinpy: DIGEST_A })
    const { status, report } = run()
    const fact = factOf(report, 'hermes-pin-digest')
    assert.equal(status, 1, 'a drifted fact must fail the check')
    assert.equal(fact.verdict, 'FAIL')
    assert.equal(fact.distinctValues.length, 2)
    const stale = fact.representations.find((r) => r.label === 'verify_pin.py')
    assert.deepEqual(stale.values, [DIGEST_B], 'the stale copy is printed, so it can be named')
  })

  it('FAILS when one file disagrees with itself', () => {
    writeFixture({
      verify: DIGEST_A,
      compose: DIGEST_A,
      pinpy: DIGEST_A,
      verifyBody: `# fixture\nDEFAULT_EXPECTED_DIGEST = "${DIGEST_A}"\n# stale note: ${DIGEST_B}\nDEFAULT_EXPECTED_DIGEST = "${DIGEST_B}"\n`,
    })
    const { status, report } = run()
    const fact = factOf(report, 'hermes-pin-digest')
    assert.equal(status, 1)
    assert.equal(fact.verdict, 'FAIL')
    assert.deepEqual(fact.selfConflicts, ['verify_pin.py'])
  })

  it('★ CC-109: a SKIP exits 2, and --allow-skip exits 0', () => {
    // This test used to assert `status === 0` under the comment *"a SKIP is not a failure — but it is not
    // a green either."* The comment was right and the assertion contradicted it, which is the third time
    // this month a test has stated the correct rule in prose and pinned the opposite in code (T-16's two
    // conflated names, T-17's empty-list test, T-30's malformed header). Exit 2 is a distinct code so a
    // caller can tell "drifted" (1) from "could not check" (2).
    mkdirSync(repoRoot, { recursive: true })
    rmSync(path.join(repoRoot, 'docker'), { recursive: true, force: true })
    rmSync(path.join(repoRoot, 'docker-compose.hermes.yml'), { force: true })
    rmSync(path.join(docsRoot, '.hermes_pin.py'), { force: true })
    rmSync(path.join(docsRoot, 'development', 'HERMES-PIN.md'), { force: true })
    const { status, report } = run()
    const fact = factOf(report, 'hermes-pin-digest')
    assert.equal(fact.verdict, 'SKIP')
    assert.equal(fact.readable, 0)
    assert.equal(status, 2, 'a SKIP is not a green — the exit code must agree with the report')

    const allowed = spawnSync(process.execPath, [CHECKER, '--root', repoRoot, '--allow-skip', '--json'], {
      encoding: 'utf8',
    })
    assert.equal(allowed.status, 0, '--allow-skip is the explicit opt-out for a checkout with fewer copies')
  })

  it('★ CC-109: HERMES-PIN.md is registered and agrees', () => {
    writeFixture({ verify: DIGEST_A, compose: DIGEST_A, pinpy: DIGEST_A })
    const { status, report } = run()
    const fact = factOf(report, 'hermes-pin-digest')
    assert.equal(status, 0)
    assert.equal(fact.verdict, 'PASS')
    assert.equal(fact.readable, 5, 'all five copies should be readable')
    const doc = fact.representations.find((r) => r.label.includes('HERMES-PIN.md'))
    assert.deepEqual(doc.values, [DIGEST_A])
  })

  it('★ CC-109: a stale copy in docker/README.md now FAILS the fact and is named', () => {
    // This is the drift the residue guard actually found: docker/README.md held the superseded 2026-10-12
    // pin for one whole re-pin, because nothing had ever read that file. It is registered now, so it is
    // caught by the fact itself — which is stronger than residue, because it names the file AND the value.
    writeFixture({ verify: DIGEST_A, compose: DIGEST_A, pinpy: DIGEST_A, readme: DIGEST_B })
    const { status, report } = run()
    const fact = factOf(report, 'hermes-pin-digest')
    assert.equal(status, 1, 'a drifted fact must fail the check')
    assert.equal(fact.verdict, 'FAIL')
    const readme = fact.representations.find((r) => r.label.includes('docker/README.md'))
    assert.deepEqual(readme.values, [DIGEST_B], 'the stale copy is printed, so it can be named')
  })

  it('★ CC-109: the residue guard fails on a NEW unregistered copy in the declaration surface', () => {
    // The case the registry cannot see: a sixth copy, in a file nobody registered. The one-truth check
    // reads 5/5 and passes; the residue guard is what notices.
    writeFixture({ verify: DIGEST_A, compose: DIGEST_A, pinpy: DIGEST_A })
    const stray = path.join(repoRoot, 'docker', 'hermes', 'pin-notes.md')
    writeFileSync(stray, `# Notes\n\nThe mounted tree must produce ${DIGEST_A}.\n`)
    try {
      const { status, stderr } = run()
      assert.equal(status, 1, 'residue is drift even when every registered copy agrees')
      assert.match(stderr, /ONE-TRUTH RESIDUE/)
      assert.match(stderr, /pin-notes\.md/)
    } finally {
      // The suite shares one fixture root, so a stray file left here would make every later test see
      // residue. Cleaning up is part of the test, not an afterthought.
      rmSync(stray, { force: true })
    }
  })

  it('★ CC-109: prose quoting a hash is NOT residue — the guard is scoped, not a tree-wide grep', () => {
    // The row prescribes "fail on any 32-hex hit outside registered paths". Measured, that fails at once:
    // library/development/ holds 32-hex in BACKLOG.md, HANDOVER.md, MASTER-CHECKLIST.md and more. A guard
    // that reddens the build for a commit SHA in prose is the control CC-101 warns about — one that fires
    // so loudly it gets switched off.
    writeFixture({ verify: DIGEST_A, compose: DIGEST_A, pinpy: DIGEST_A })
    writeFileSync(
      path.join(docsRoot, 'development', 'BACKLOG.md'),
      `# Backlog\n\nMeasured 2026-10-06 (\`0af50c8\`) — commit ${DIGEST_B} mentioned in prose.\n`,
    )
    const { status } = run()
    assert.equal(status, 0, 'a hash quoted in prose outside the declaration surface is not residue')
  })
})
