#!/usr/bin/env node
/**
 * Escape-hatch census — `SR-41` (zulip's `mark_sanitized`, generalised).
 *
 * WHY THIS EXISTS
 * ---------------
 * Every guard has holes: a lint rule switched off for one line, a type error suppressed. The lesson
 * from the platform study is not "have holes" — every real codebase does — it is that a hole must be
 * **named**, so that (a) one search finds every one, and (b) the reason travels with it. An unnamed
 * hole is indistinguishable from an accident, and the next reader cannot tell whether it is still
 * needed or was forgotten.
 *
 * WHAT IT CHECKS
 * --------------
 * Every directive hole must carry a REASON on the same line. The **native** reason forms are used on
 * purpose, so the convention costs nothing new and both tools already understand it:
 *
 *   // eslint-disable-next-line no-console -- the CLI's only legal writer (see logger.ts)
 *   // @ts-expect-error: the upstream signature is wrong for the 3rd arg (fixed upstream in v5)
 *
 *   named    -> a hole WITH a reason. Counted, not listed.
 *   unnamed  -> a hole with NO reason. Listed, so it can be fixed.
 *
 * USAGE
 * -----
 *   node scripts/check-escape-hatches.mjs               # census + list unnamed (exit 0)
 *   node scripts/check-escape-hatches.mjs --fail        # exit 1 if any hole is unnamed
 *   node scripts/check-escape-hatches.mjs --json        # machine-readable report
 *   node scripts/check-escape-hatches.mjs --root <dir>  # scan another checkout (used by the test)
 *
 * WHY THE DEFAULT IS exit 0
 * -------------------------
 * The first job of this script is to ANSWER A QUESTION — "how many holes do we have, and where?" —
 * and a census that refuses to print when it finds something is useless. So the report always
 * prints and always exits 0; `--fail` is the enforcement mode, for when the backlog is cleared and
 * the convention is worth defending. That is the same report-now / enforce-later split the repo
 * already uses for `check:time-bombs` and `check:client-boundaries`.
 *
 * DELIBERATELY NOT SCANNED
 * ------------------------
 * `as any` / `as unknown as` are type ASSERTIONS, not guard bypasses, and there are ~4.4k of them in
 * `src` (measured 2026-10-16, most inside tests). Requiring a reason on each would bury the ~178
 * real directive holes in noise. If the assertion form is ever wanted it belongs behind its own flag
 * and its own backlog, not folded into this count.
 *
 * KNOWN LIMIT
 * -----------
 * Scanning is line-based and lexical (no parser), so a line whose TEXT happens to look like
 * `// eslint-disable…` inside a string literal still counts. The `startsComment` rule below removes
 * the much larger prose class, and a census is a report rather than a gate, so the residue is an
 * acceptable trade — the same one `time-bomb-scanner.mjs` makes.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** Where source lives. Walking only these keeps the scan bounded (the repo also holds GGUFs and
 *  a gitignored `workspace/`, none of which can carry a TS/JS directive hole). */
const SCAN_ROOTS = ['apps', 'packages', 'scripts']
const SOURCE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/
const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  'dist',
  'coverage',
  'build',
  'out',
  'generated',
  '.turbo',
  '.git',
  '.mercato',
])

/**
 * The hole kinds this check knows.
 *
 * **`CC-110` — `locate` replaced a bare `token` because two of these are the same word.** `eslint-disable`
 * appears in three forms — `-next-line`, `-line`, and the bare block form that silences the **rest of the
 * file** — and a bare `indexOf('eslint-disable')` matched all three at the same offset. The bare form was
 * therefore counted as one line-shaped hole while it exempted the whole file, which is the census defeat the
 * row names: a block-form `eslint-disable -- legacy` at the top of a file turns 160 unnamed into 0 while
 * exempting the whole file, and the checker scored it as a single hole. Measured 2026-10-21: **11 block-form
 * disables exist in the unnamed set right now**, so this was live, not theoretical.
 *
 * `locate` returns the index of the directive, or -1. The three eslint forms are mutually exclusive by
 * construction: the scoped forms match `eslint-disable-(next-)?line`, and the file form is a negative
 * lookahead on exactly those.
 */
const KINDS = [
  {
    id: 'eslint-disable',
    locate: (line) => {
      const m = /eslint-disable-(?:next-)?line/.exec(line)
      return m ? m.index : -1
    },
    // `CC-110` — was `/--\s*\S/`, so `-- x` passed as a reason. The donor requires code AND reason in one
    // regex and closes the empty-reason loophole with `' +# +\S'`; ours closed nothing. The reason must now
    // contain an alphabetic run of three or more characters, so `-- x`, `-- ??` and `-- 1` stop passing while
    // `-- legacy` still does. Three is a number someone can argue with, which is the point.
    isNamed: (line) => REASON_WORD.test(reasonOf(line, /eslint-disable-(?:next-)?line/)),
  },
  {
    // `CC-110` — the file-level form, its own kind, so it cannot hide inside the line count.
    id: 'eslint-disable-file',
    locate: (line) => {
      const m = /eslint-disable(?!-(?:next-)?line)/.exec(line)
      return m ? m.index : -1
    },
    isNamed: (line) => REASON_WORD.test(reasonOf(line, /eslint-disable(?!-(?:next-)?line)/)),
  },
  {
    id: 'ts-expect-error',
    locate: (line) => line.indexOf('@ts-expect-error'),
    isNamed: (line, idx) => REASON_WORD.test(afterDirective(line, idx, '@ts-expect-error'.length)),
  },
  {
    id: 'ts-ignore',
    locate: (line) => line.indexOf('@ts-ignore'),
    isNamed: (line, idx) => REASON_WORD.test(afterDirective(line, idx, '@ts-ignore'.length)),
  },
  {
    id: 'ts-nocheck',
    locate: (line) => line.indexOf('@ts-nocheck'),
    isNamed: (line, idx) => REASON_WORD.test(afterDirective(line, idx, '@ts-nocheck'.length)),
  },
]

/**
 * `CC-110` — a reason is a reason when it contains a real word.
 *
 * The donor (`custom_check.py:325`) requires code AND reason in one regex and closes the empty-reason
 * loophole with `' +# +\S'`. Ours was `/--\s*\S/` — a single character was enough, so `-- x` was a reason
 * and `-- legacy` was a *good* one. The floor is now an alphabetic run of three or more characters:
 * `-- x`, `-- ??`, `-- 1` and `-- ok` stop passing; `-- legacy`, `-- see logger.ts` pass.
 */
const REASON_WORD = /[A-Za-z]{3,}/

/** The text after `--` on a line carrying an eslint directive, or '' when there is no `--`. */
function reasonOf(line, directive) {
  const m = directive.exec(line)
  if (!m) return ''
  const after = line.slice(m.index + m[0].length)
  const sep = after.indexOf('--')
  return sep === -1 ? '' : after.slice(sep + 2)
}

/** TypeScript has no `--` separator: ANY trailing text after the directive is the reason. */
function afterDirective(line, idx, len) {
  return line
    .slice(idx + len)
    .replace(/\*\/\s*$/, '')
    .replace(/^[\s:\-–—]*/, '')
}

function parseArgs(argv) {
  const options = {
    json: false,
    fail: false,
    root: process.cwd(),
    help: false,
    updateBaseline: false,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--json') options.json = true
    else if (arg === '--fail') options.fail = true
    else if (arg === '--update-baseline') options.updateBaseline = true
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

function normalize(file) {
  return file.split(path.sep).join('/')
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = path.join(dir, entry)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) walk(full, out)
    else if (SOURCE_EXT.test(entry) && !entry.includes('.generated.')) out.push(full)
  }
  return out
}

/**
 * A directive only counts when it OPENS the comment. That is not a stylistic choice — it is how
 * both tools parse: ESLint ignores an `eslint-disable` that is not the comment's first content, and
 * TypeScript ignores a `@ts-expect-error` that is not at the start of the comment. Requiring the
 * same thing keeps PROSE out of the census, which is a real class of false positive here: the repo
 * contains lines like `// TS2578 "Unused '@ts-expect-error' directive" and this suite would not`
 * and `` *      or `props`, and the `@ts-expect-error` directives prove it `` — neither is a hole.
 *
 * **`CC-110` — and two more classes, both of which the checker was counting against itself.**
 *
 *  1. **A directive inside a block comment is not a directive.** This checker's own docblock shows
 *     `// eslint-disable-next-line no-console -- the CLI's only legal writer` as an example, on a
 *     ` * ` continuation line. The old logic found the last `//` on the line, saw only whitespace
 *     before the directive, and counted the documentation as a hole. A real inline directive is
 *     preceded by code, not by a block-comment continuation.
 *  2. **A directive inside a string literal is not a directive.** The test fixtures spell
 *     `'// eslint-disable-next-line no-console'` as data, and the opener is preceded by a quote.
 *
 * Both are detected by looking at what sits immediately before the opener: a `*` means we are inside
 * a block comment, and a quote means we are inside a string. Neither is a directive, and both were
 * inflating the census by about twenty entries.
 */
function startsComment(line, idx) {
  const before = line.slice(0, idx)
  const open = Math.max(before.lastIndexOf('//'), before.lastIndexOf('/*'))
  if (open === -1) return false
  if (!/^\s*$/.test(line.slice(open + 2, idx))) return false
  const preceding = before.slice(0, open).trimEnd()
  const lastChar = preceding.slice(-1)
  if (lastChar === '*') return false // inside a block comment
  if (lastChar === "'" || lastChar === '"' || lastChar === '`') return false // inside a string literal
  return true
}

/** Every hole on one line. A line may carry more than one kind; each is counted separately. */
function holesOnLine(line) {
  const holes = []
  for (const kind of KINDS) {
    const idx = kind.locate(line)
    if (idx === -1) continue
    if (!startsComment(line, idx)) continue
    holes.push({ kind: kind.id, named: kind.isNamed(line, idx) })
  }
  return holes
}

function scan(root) {
  const files = []
  for (const scanRoot of SCAN_ROOTS) files.push(...walk(path.join(root, scanRoot)))

  const byKind = {}
  for (const kind of KINDS) byKind[kind.id] = { total: 0, named: 0, unnamed: 0 }
  const unnamedHoles = []
  // `CC-110` — every hole, named or not, because the baseline pins IDENTITY. A hole that gains a reason is
  // progress and must be visible as a change; a hole that loses one is a regression and must fail.
  const allHoles = []
  let total = 0
  let named = 0

  for (const file of files.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    let text
    try {
      text = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    const lines = text.split(/\r?\n/)
    for (let i = 0; i < lines.length; i += 1) {
      for (const hole of holesOnLine(lines[i])) {
        total += 1
        byKind[hole.kind].total += 1
        if (hole.named) {
          named += 1
          byKind[hole.kind].named += 1
        } else {
          byKind[hole.kind].unnamed += 1
        }
        const record = {
          file: normalize(path.relative(root, file)),
          line: i + 1,
          kind: hole.kind,
          named: hole.named,
          text: lines[i].trim(),
        }
        allHoles.push(record)
        if (!hole.named) unnamedHoles.push(record)
      }
    }
  }

  return {
    scannedFiles: files.length,
    holes: total,
    named,
    unnamed: total - named,
    byKind,
    unnamedHoles,
    allHoles,
  }
}

function report(result, options) {
  if (options.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n')
    return
  }
  const out = process.stdout
  out.write('Escape-hatch census (SR-41)\n')
  out.write(`- files scanned: ${result.scannedFiles}\n`)
  out.write(`- holes: ${result.holes}  (named ${result.named}, unnamed ${result.unnamed})\n`)
  for (const [kind, counts] of Object.entries(result.byKind)) {
    if (counts.total === 0) continue
    out.write(`  - ${kind}: ${counts.total} (named ${counts.named}, unnamed ${counts.unnamed})\n`)
  }
  if (result.unnamedHoles.length > 0) {
    out.write('\nUnnamed holes (no reason — add `-- <reason>` / `: <reason>`):\n')
    for (const hole of result.unnamedHoles.slice(0, 50)) {
      out.write(`- ${hole.file}:${hole.line}  [${hole.kind}]  ${hole.text}\n`)
    }
    if (result.unnamedHoles.length > 50) {
      out.write(`- ... ${result.unnamedHoles.length - 50} more\n`)
    }
  }
}

/**
 * `CC-110` — the baseline, and why it is not a count.
 *
 * The row's own diagnosis: *"Ours is all-or-nothing `:fail` against 169 items, which is why it can never be
 * turned on."* A gate that fails 169 times on the day it is switched on is not a gate, it is a build-breaker
 * nobody will merge.
 *
 * The donor's instrument is stronger than a count: *"exact-line allowlists … a count lets one hole in for one
 * hole out; an exact-string allowlist pins identity, fails on new AND on stale, so it can only shrink."*
 *
 * So every hole is pinned by `file:line:kind`, and `--fail` compares identity:
 *
 *   in the tree, not in the baseline            -> NEW        -> fail (a hole was added)
 *   in the baseline, not in the tree            -> STALE      -> fail (the baseline is out of date; a fix
 *                                                                 is progress, but the pin must record it)
 *   in both, named false -> true                -> PROGRESS   -> pass, and it is printed
 *   in both, named true -> false                -> REGRESSION -> fail
 *   in both, the text changed                   -> STALE      -> fail (the line moved under the pin)
 *
 * The backlog is pinned the day this lands and shrinks one entry at a time. `--update-baseline` is the
 * deliberate act, and it is a reviewed commit like any other.
 *
 * **The path is resolved against `--root`, not against this script.** That is deliberate: the baseline
 * belongs beside the code it pins, so a fixture checkout can pin its own baseline in a test — which is the
 * only way the NEW and STALE paths can be proven without editing the real one.
 */
function baselinePathFor(root) {
  return path.join(root, 'scripts', 'escape-hatches.baseline.json')
}

function baselineKey(hole) {
  return `${hole.file}:${hole.line}:${hole.kind}`
}

function loadBaseline(root) {
  const BASELINE_PATH = baselinePathFor(root)
  if (!existsSync(BASELINE_PATH)) return null
  try {
    const parsed = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
    return new Map(parsed.map((entry) => [baselineKey(entry), entry]))
  } catch (error) {
    throw new Error(`escape-hatches.baseline.json is unreadable: ${error.message}`)
  }
}

/**
 * Compare the tree against the baseline. Returns the four buckets; only NEW, STALE and REGRESSION fail.
 */
function compareBaseline(result, baseline) {
  const current = new Map()
  for (const hole of result.allHoles) current.set(baselineKey(hole), hole)

  const added = []
  const stale = []
  const progressed = []
  const regressed = []

  for (const [key, hole] of current) {
    const pinned = baseline.get(key)
    if (!pinned) {
      added.push(hole)
      continue
    }
    // `named` is compared BEFORE the text, and the order is the whole point: a hole that gains a reason
    // necessarily changes its text — that is what adding a reason *is* — so comparing text first filed
    // every act of progress as STALE and the ratchet could never record an improvement. The test that
    // caught it is named for the behaviour, not the bug.
    if (!pinned.named && hole.named) {
      progressed.push(hole)
      continue
    }
    if (pinned.named && !hole.named) {
      regressed.push(hole)
      continue
    }
    if (pinned.text !== hole.text) {
      stale.push({ hole, was: pinned })
    }
  }
  for (const [key, pinned] of baseline) {
    if (!current.has(key)) stale.push({ hole: pinned, was: pinned, missing: true })
  }

  return { added, stale, progressed, regressed }
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
    process.stdout.write(
      'Usage: node scripts/check-escape-hatches.mjs [--fail] [--json] [--update-baseline] [--root <dir>]\n',
    )
    return 0
  }

  const result = scan(options.root)

  if (options.updateBaseline) {
    const sorted = [...result.allHoles].sort((a, b) =>
      a.file === b.file ? a.line - b.line : a.file < b.file ? -1 : 1,
    )
    writeFileSync(baselinePathFor(options.root), JSON.stringify(sorted, null, 2) + '\n', 'utf8')
    const message =
      `\nBaseline written: ${sorted.length} hole(s) pinned to ${path.relative(process.cwd(), baselinePathFor(options.root))}.\n` +
      'Commit it. From here the count can only shrink.\n'
    // The repo convention: `--json` keeps stdout pure, so a human status line goes to stderr. Without this,
    // a caller that always passes `--json` (as the test harness does) tried to parse this sentence.
    if (options.json) process.stderr.write(message)
    else process.stdout.write(message)
    return 0
  }

  report(result, options)

  const baseline = loadBaseline(options.root)
  if (baseline && options.fail) {
    const diff = compareBaseline(result, baseline)
    const lines = []
    if (diff.added.length > 0) {
      lines.push(`NEW (in the tree, not pinned) — ${diff.added.length}:`)
      for (const hole of diff.added.slice(0, 40)) {
        lines.push(`  + ${hole.file}:${hole.line}  [${hole.kind}]  ${hole.text}`)
      }
      if (diff.added.length > 40) lines.push(`  ... ${diff.added.length - 40} more`)
    }
    if (diff.stale.length > 0) {
      lines.push(`STALE (pinned, no longer there) — ${diff.stale.length}:`)
      for (const entry of diff.stale.slice(0, 40)) {
        // `entry.hole`, not `entry`: the wrapper carries `{hole, was, missing}`, and reading `entry.line`
        // printed `b.ts:undefined` — a report that names a file but not a line is not a report anyone can
        // act on. Caught by the test, not by reading it.
        lines.push(`  - ${entry.hole.file}:${entry.hole.line}  [${entry.hole.kind}]${entry.missing ? '  (gone)' : ''}`)
      }
      if (diff.stale.length > 40) lines.push(`  ... ${diff.stale.length - 40} more`)
    }
    if (diff.regressed.length > 0) {
      lines.push(`REGRESSION (was named, now unnamed) — ${diff.regressed.length}:`)
      for (const hole of diff.regressed.slice(0, 40)) {
        lines.push(`  ! ${hole.file}:${hole.line}  [${hole.kind}]  ${hole.text}`)
      }
    }
    if (diff.progressed.length > 0) {
      lines.push(`PROGRESS (was unnamed, now named) — ${diff.progressed.length}:`)
      for (const hole of diff.progressed.slice(0, 20)) {
        lines.push(`  ^ ${hole.file}:${hole.line}  [${hole.kind}]`)
      }
    }
    if (lines.length > 0) process.stderr.write(`\nESCAPE-HATCH BASELINE\n${lines.join('\n')}\n`)

    const broken = diff.added.length + diff.stale.length + diff.regressed.length
    if (broken > 0) {
      process.stderr.write(
        `\nESCAPE-HATCH CHECK FAILED — ${diff.added.length} new, ${diff.stale.length} stale, ` +
          `${diff.regressed.length} regressed.\n` +
          'Fix the hole, or run --update-baseline and commit the pin deliberately.\n',
      )
      return 1
    }
    if (diff.progressed.length > 0) {
      const message =
        `\n${diff.progressed.length} hole(s) gained a reason since the baseline. ` +
        'Run --update-baseline to record the progress.\n'
      // Same convention as above: stdout stays pure JSON under `--json`.
      if (options.json) process.stderr.write(message)
      else process.stdout.write(message)
    }
    return 0
  }

  const summary =
    result.unnamed > 0
      ? `\n${result.unnamed} unnamed escape hatch(es) of ${result.holes} — a hole must carry a reason.\n`
      : `\nAll ${result.holes} escape hatch(es) are named.\n`

  // Keep `--json` pure JSON on stdout (the repo's convention), so the status line goes to stderr.
  if (options.json) process.stderr.write(summary)
  else process.stdout.write(summary)

  // `CC-110` — the legacy all-or-nothing mode is kept for the report path, but the gate is the baseline:
  // `--fail` without a baseline still means "no unnamed holes", which is the state the backlog is shrinking
  // toward. With a baseline it means "the pin still matches", which is what CI runs.
  return options.fail && result.unnamed > 0 ? 1 : 0
}

process.exitCode = main()
