#!/usr/bin/env node
/**
 * report-unused-disables.mjs — `CC-110`, the other half of the escape-hatch ratchet.
 *
 * `reportUnusedDisableDirectives` (now set in `eslint.config.mjs`) makes ESLint report a disable directive
 * that suppresses nothing. This script turns that into a NUMBER, the way the other censuses in this repo
 * publish one.
 *
 * **Why a number and not a gate:** measured 2026-10-21, there are **129** unused-disable reports across the
 * 101 files that carry eslint holes — roughly one dead hole per file. An `error` on day one is the
 * all-or-nothing shape `CC-110` exists to replace. So this publishes the count; the ratchet that turns it
 * into an error is the escape-hatch baseline, which can only shrink.
 *
 * **Why it is scoped to the pinned files:** a repo-wide lint is minutes long and reports thousands of
 * unrelated findings. The set that matters for THIS question is the files the census already knows carry a
 * hole — a dead disable is a hole that suppresses nothing, so it can only live in one of those files.
 *
 * Read-only: it runs ESLint and prints. It never edits the tree — a tool that could "fix" drift into
 * agreement is the failure `CC-109` refused on principle.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
// One level up: this file lives in `scripts/`, and the repo root is its parent. (Two levels up is
// `workspace/`, which is where the docs repo's sibling lives — an easy mistake, and it made the script
// report "no baseline" while the baseline sat one directory below.)
const ROOT = path.resolve(HERE, '..')
const BASELINE = path.join(ROOT, 'scripts', 'escape-hatches.baseline.json')

if (!existsSync(BASELINE)) {
  process.stderr.write('No escape-hatches.baseline.json — run `yarn check:escape-hatches` with --update-baseline first.\n')
  process.exit(1)
}

const pinned = JSON.parse(readFileSync(BASELINE, 'utf8'))
const files = [...new Set(pinned.filter((h) => h.kind.startsWith('eslint-disable')).map((h) => h.file))]

if (files.length === 0) {
  process.stdout.write('No eslint-disable holes pinned — nothing to check.\n')
  process.exit(0)
}

const result = spawnSync(
  process.execPath,
  [path.join(ROOT, 'node_modules', 'eslint', 'bin', 'eslint.js'), ...files],
  { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
)

const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
const unused = output.split('\n').filter((line) => /Unused eslint-disable directive/.test(line))

process.stdout.write(`Unused eslint-disable directives — CC-110\n`)
process.stdout.write(`- files with a pinned hole: ${files.length}\n`)
process.stdout.write(`- unused disable directives: ${unused.length}\n`)
if (unused.length > 0) {
  process.stdout.write('\nEach of these is a hole that suppresses nothing. Deleting it shrinks the baseline;\n')
  process.stdout.write('adding a reason to it pads the census while the code gets worse.\n\n')
  for (const line of unused.slice(0, 40)) process.stdout.write(`  ${line.trim()}\n`)
  if (unused.length > 40) process.stdout.write(`  ... ${unused.length - 40} more\n`)
}
process.stdout.write('\nReported, not gated: the count is published and the ratchet is the escape-hatch baseline.\n')
