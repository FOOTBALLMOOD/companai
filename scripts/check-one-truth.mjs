#!/usr/bin/env node
/**
 * One-truth checker — `SR-39` (zulip's `check-schemas`, generalised).
 *
 * WHY THIS EXISTS
 * ---------------
 * Wherever one fact is written down in more than one place, the copies drift, and the drift is
 * invisible until it bites. It bit us: the 2026-10-16 Hermes re-pin updated **three of four**
 * copies of the pin digest and left `docker/hermes/verify_pin.py` naming the *previous* revision,
 * so any caller not handed `HERMES_PIN_DIGEST` read a correctly-pinned tree as `PIN BROKEN`
 * (`CC-90`, measured). A machine comparing the copies would have caught it at the re-pin and
 * named the stale one.
 *
 * This is not a new idea for this repo — `scripts/check-version-alignment.sh` already does exactly
 * this for ONE fact (the package version). The difference here is the **registry**: adding the
 * second fact is a data change, not a new script. That is the difference between a mechanism and
 * an anecdote.
 *
 * WHAT IT CHECKS
 * --------------
 * For each fact in `FACTS`, every listed representation is read and a value extracted. Then:
 *
 *   ≥2 readable, all equal        -> PASS   (the fact has one truth)
 *   ≥2 readable, any differ       -> FAIL   (and every representation is printed, so the divergent
 *                                            one is named — that is the whole point)
 *   a representation yields >1
 *     distinct value in one file  -> FAIL   (a copy that disagrees with ITSELF — see the
 *                                            `hermes-pin-digest` note below)
 *   fewer than 2 readable         -> SKIP   loudly. One representation is not a one-truth problem,
 *                                            and silence there would be a false green.
 *
 * USAGE
 * -----
 *   node scripts/check-one-truth.mjs                    # check (exit 1 on drift)
 *   node scripts/check-one-truth.mjs --json             # machine-readable report
 *   node scripts/check-one-truth.mjs --root <dir>       # check another checkout (used by the test)
 *
 * A representation whose file is ABSENT is reported, never silently skipped: the docs repo is a
 * SIBLING checkout (`../../library/…`), so a code-only clone legitimately has fewer copies — and
 * that must be visible in the output rather than read as agreement.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * The registry. One entry per fact that must have one truth.
 *
 * `pattern` is a RegExp source; group 1 is the value. Every match in the file is collected, so a
 * file that states the fact twice with different values is caught (that is a real failure mode —
 * see `hermes-pin-digest`).
 */
const FACTS = [
  {
    id: 'hermes-pin-digest',
    description: 'The digest the mounted Hermes tree must produce (the pin).',
    note:
      'The fact that drifted: the 2026-10-16 re-pin updated three of four copies and missed ' +
      'verify_pin.py (CC-90). ' +
      '`CC-109` — this note used to say HERMES-PIN.md could NOT be registered because it "carries TWO ' +
      'different 32-hex digests for the same tree and never says which is the pin digest". **That was ' +
      'wrong, and it is what kept the one copy a human reads unguarded.** Measured 2026-10-21: the doc ' +
      'carries SEVEN 32-hex values — the §1 history table, the upstream git revision, a superseded ' +
      'comparison — and it says exactly which one is the pin, at :183 ("**The pinned digest — this is the ' +
      'value the harness enforces:**") followed by the value. A pattern anchored on the declaration line ' +
      'picks the pin and nothing else, which is why the pattern below is anchored rather than a bare ' +
      '32-hex match.',
    representations: [
      {
        label: 'verify_pin.py',
        path: 'docker/hermes/verify_pin.py',
        pattern: 'DEFAULT_EXPECTED_DIGEST\\s*=\\s*"([0-9a-f]{32})"',
      },
      {
        label: 'docker-compose.hermes.yml',
        path: 'docker-compose.hermes.yml',
        pattern: 'HERMES_PIN_DIGEST:\\s*\\$\\{HERMES_PIN_DIGEST:-([0-9a-f]{32})\\}',
      },
      {
        label: 'library/.hermes_pin.py (docs repo)',
        path: '../../library/.hermes_pin.py',
        pattern: 'EXPECTED_DIGEST\\s*=\\s*"([0-9a-f]{32})"',
      },
      {
        // `CC-109` — the one copy a human reads, registered at last. Anchored on the word `digest`
        // followed by a colon, because the file also carries six other 32-hex values (history table,
        // upstream revision, superseded comparison) and a bare match would read all of them.
        // **Not anchored with `^`:** the checker compiles patterns with `new RegExp(source, 'g')` and no
        // `m` flag (`:199`), so `^` would only ever match the start of the file and this representation
        // would read NO-MATCH forever. The self-conflict check catches a second match, so the anchor does
        // not need to be a line anchor to be safe.
        label: 'library/development/HERMES-PIN.md (docs repo)',
        path: '../../library/development/HERMES-PIN.md',
        pattern: 'digest\\s*:\\s*([0-9a-f]{32})',
      },
      {
        // `CC-109` — the fifth copy, found by the residue guard on its first run: it held the superseded
        // 2026-10-12 pin for one whole re-pin because nothing had ever looked at this file. Registered
        // now, so the next re-pin cannot miss it. The pattern is anchored on the table row, which is the
        // only place in the file the value appears as a declared default.
        label: 'docker/README.md (the operator-facing table)',
        path: 'docker/README.md',
        pattern: '\\|\\s*`HERMES_PIN_DIGEST`\\s*\\|\\s*`([0-9a-f]{32})`',
      },
    ],
  },
]

/**
 * `CC-109` — where the pin is DECLARED as a value, as opposed to quoted in prose.
 *
 * The row prescribes "fail on any 32-hex hit outside registered paths". Measured, that fails at once:
 * `library/development/` holds 32-hex in BACKLOG.md, BUILD-ORDER.md, DEPLOY-2026-10-20.md, HANDOVER.md,
 * MASTER-CHECKLIST.md and more — prose quoting commit SHAs and old pins for reasons unrelated to the pin.
 * A guard that reddens the build for a hash in a changelog is the control CC-101's close record warns
 * about: *"a control that fires so loudly it gets switched off."*
 *
 * So the guard is scoped by SHAPE and LOCATION — the files that state the pin as a machine-readable
 * value — and prose is excluded by scope rather than by an allowlist that would grow forever.
 */
const PIN_DECLARATION_SURFACE = [
  // The whole `docker/` tree, not just `docker/hermes/` — the drift the guard found on its first run is in
  // `docker/README.md`, one level up from where a narrow scan would have looked.
  'docker',
  'docker-compose.hermes.yml',
  '../../library/.hermes_pin.py',
]

/**
 * `CC-109` — the residue guard.
 *
 * Zulip's harvest (`tools/check-feature-level-updated:26`) fails when a placeholder survived. Ours is the
 * same idea against a different drift: **a 32-hex value sitting in the pin's declaration surface in a file
 * that is not a registered representation** — i.e. a fifth copy nobody added to the registry. The registry
 * being hand-kept is not a latent risk here: it already lost one, and the guard found it on its first run
 * (`docker/README.md` declaring the superseded 2026-10-12 pin).
 *
 * Scoped to `PIN_DECLARATION_SURFACE` — see the note there for why it is not "any 32-hex in the tree".
 */
function checkResidue(repoRoot, facts) {
  const registered = new Set()
  for (const fact of facts) {
    for (const representation of fact.representations) {
      registered.add(path.resolve(repoRoot, representation.path))
    }
  }

  const findings = []
  for (const entry of PIN_DECLARATION_SURFACE) {
    const full = path.resolve(repoRoot, entry)
    if (!existsSync(full)) continue
    const files = statSync(full).isDirectory() ? walk(full) : [full]
    for (const file of files) {
      if (registered.has(file)) continue
      if (file.includes('__pycache__')) continue
      let text
      try {
        text = readFileSync(file, 'utf8')
      } catch {
        continue
      }
      const hits = text.match(/[0-9a-f]{32}/g) ?? []
      if (hits.length > 0) {
        findings.push({ file: path.relative(repoRoot, file), hits: [...new Set(hits)] })
      }
    }
  }
  return findings
}

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '__pycache__' || entry.name === 'node_modules') continue
      out.push(...walk(full))
    } else {
      out.push(full)
    }
  }
  return out
}

function parseArgs(argv) {
  const options = { json: false, root: process.cwd(), help: false, allowSkip: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--json') options.json = true
    else if (arg === '--allow-skip') options.allowSkip = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else if (arg === '--root') {
      const value = argv[i + 1]
      if (!value) throw new Error('--root needs a directory')
      options.root = value
      i += 1
    } else throw new Error(`Unknown option: ${arg}`)
  }
  return options
}

/** Every distinct value a representation states, in file order. */
function readRepresentation(repoRoot, representation) {
  const full = path.resolve(repoRoot, representation.path)
  if (!existsSync(full)) {
    return { label: representation.label, status: 'absent', path: representation.path }
  }
  let text
  try {
    text = readFileSync(full, 'utf8')
  } catch (error) {
    return { label: representation.label, status: 'unreadable', path: representation.path, detail: String(error) }
  }
  const pattern = new RegExp(representation.pattern, 'g')
  const values = []
  for (const match of text.matchAll(pattern)) {
    if (match[1] && !values.includes(match[1])) values.push(match[1])
  }
  if (values.length === 0) {
    return { label: representation.label, status: 'no-match', path: representation.path }
  }
  return { label: representation.label, status: 'read', path: representation.path, values }
}

function checkFact(repoRoot, fact) {
  const results = fact.representations.map((representation) => readRepresentation(repoRoot, representation))
  const readable = results.filter((r) => r.status === 'read')

  // A copy that disagrees with itself is a failure on its own, independent of the others.
  const selfConflicts = readable.filter((r) => r.values.length > 1)

  const distinct = []
  for (const result of readable) {
    for (const value of result.values) if (!distinct.includes(value)) distinct.push(value)
  }

  let verdict
  if (selfConflicts.length > 0) verdict = 'FAIL'
  else if (readable.length >= 2) verdict = distinct.length === 1 ? 'PASS' : 'FAIL'
  else verdict = 'SKIP'

  return {
    id: fact.id,
    description: fact.description,
    verdict,
    distinctValues: distinct,
    representations: results,
    selfConflicts: selfConflicts.map((r) => r.label),
    readable: readable.length,
  }
}

function report(report_, options) {
  if (options.json) {
    process.stdout.write(JSON.stringify({ facts: report_ }, null, 2) + '\n')
    return
  }
  for (const fact of report_) {
    process.stdout.write(`\n${fact.verdict}  ${fact.id}\n  ${fact.description}\n`)
    for (const representation of fact.representations) {
      const where = `    - ${representation.label} [${representation.path}]`
      if (representation.status === 'read') {
        process.stdout.write(`${where}\n        ${representation.values.join('  |  ')}\n`)
      } else {
        process.stdout.write(`${where}\n        ${representation.status.toUpperCase()}\n`)
      }
    }
    if (fact.selfConflicts.length > 0) {
      process.stdout.write(`  DISAGREES WITH ITSELF: ${fact.selfConflicts.join(', ')}\n`)
    }
    if (fact.verdict === 'FAIL' && fact.selfConflicts.length === 0) {
      process.stdout.write(`  DRIFT: ${fact.readable} copies read, ${fact.distinctValues.length} distinct values\n`)
    }
    if (fact.verdict === 'SKIP') {
      process.stdout.write(
        `  NOT CHECKED: fewer than 2 representations readable (${fact.readable}) — ` +
          'one copy is not a one-truth problem, but it is also not a green.\n',
      )
    }
  }
}

function main() {
  let options
  try {
    options = parseArgs(process.argv.slice(2))
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    return 1
  }
  if (options.help) {
    process.stdout.write('Usage: node scripts/check-one-truth.mjs [--json] [--root <dir>] [--allow-skip]\n')
    return 0
  }

  const report_ = FACTS.map((fact) => checkFact(options.root, fact))
  report(report_, options)

  const failed = report_.filter((fact) => fact.verdict === 'FAIL')
  const skipped = report_.filter((fact) => fact.verdict === 'SKIP')
  const residue = checkResidue(options.root, FACTS)

  // `CC-109` — the residue guard's findings are printed whether or not anything drifted, because a fifth
  // copy is drift even when the four registered ones agree perfectly. That is the whole point of a
  // residue check: it catches what the registry cannot see.
  if (residue.length > 0) {
    const lines = residue.map((finding) => `  ${finding.file}: ${finding.hits.join(', ')}`).join('\n')
    const message =
      `\nONE-TRUTH RESIDUE — ${residue.length} file(s) in the pin's declaration surface hold a 32-hex ` +
      `value and are not registered representations:\n${lines}\n` +
      `Either the value is a copy of the fact (register it in FACTS, then make it agree) or it is stale ` +
      `(delete it). A checker cannot tell those apart, and neither can a reader.\n`
    process.stderr.write(message)
  }

  const summary =
    failed.length > 0
      ? `\nONE-TRUTH CHECK FAILED — ${failed.length} fact(s) drifted.\n`
      : '\nOne-truth check passed.\n'

  // `--json` must keep stdout PURE JSON so a caller can pipe it into a parser (the repo's other
  // `--json` scripts do the same). The human status line therefore goes to stderr in that mode —
  // and always on failure, where stderr is where a CI reader looks.
  if (options.json || failed.length > 0) process.stderr.write(summary)
  else process.stdout.write(summary)

  // `CC-109` — **the exit code must agree with the report.** A SKIP verdict is "not checked", and the
  // report has always said so ("one copy is not a one-truth problem, but it is also not a green"), while
  // the exit code called it green. Exit 2 is a distinct code so a caller can tell "drifted" (1) from
  // "could not check" (2) — and `--allow-skip` is the explicit opt-out for a checkout that legitimately
  // has fewer copies, such as a code-only clone of a sibling docs repo.
  if (failed.length > 0 || residue.length > 0) return 1
  if (skipped.length > 0 && !options.allowSkip) return 2
  return 0
}

process.exitCode = main()
