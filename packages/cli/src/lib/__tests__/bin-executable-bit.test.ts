// CC-153 — a bin script without the executable bit.
//
// `packages/cli/bin/mercato` is a shebang script. Committed mode 100644, it
// cannot be executed directly on Linux/macOS: `spawnSync(bin)` fails with
// EACCES, which Node reports as status `null` — the caller sees exit code 1
// with empty stdout AND stderr. That is exactly how the four `umes:*` tests in
// TC-UMES-011 failed in CI (Windows ignores the bit, so no local run ever saw
// it). Every other invocation goes through `yarn mercato`, which runs the file
// with `node` — which is why only the direct spawn caught it.
//
// This guard asks git, not the filesystem (the same rule as L197's
// `no-ignored-source.test.ts`): the mode that matters is the one in the index,
// which is what a fresh checkout on a CI runner materialises. A working-tree
// `fs.stat` would say 644 on Windows and 755 on Linux for the same commit.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function findRepoRoot(): string {
  let dir = process.cwd()
  for (let i = 0; i < 10; i += 1) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  throw new Error('Could not locate the repository root (no .git found walking up)')
}

const REPO_ROOT = findRepoRoot()

const BIN_PATHS = [
  'packages/cli/bin/mercato',
  'packages/create-app/bin/create-mercato-app',
] as const

function recordedModes(relativePaths: readonly string[]): Map<string, string> {
  const output = execFileSync('git', ['ls-files', '-s', '--', ...relativePaths], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
  })
  const modes = new Map<string, string>()
  for (const line of output.split('\n')) {
    const match = line.match(/^(\d{6}) [0-9a-f]{40} \d+\t(.+)$/)
    if (match) modes.set(match[2], match[1])
  }
  return modes
}

describe('package bin scripts (CC-153)', () => {
  it('locates the repository root', () => {
    expect(fs.existsSync(path.join(REPO_ROOT, 'package.json'))).toBe(true)
  })

  it.each(BIN_PATHS)('%s is committed with the executable bit', (relativePath) => {
    const modes = recordedModes(BIN_PATHS)
    expect(modes.get(relativePath)).toBe('100755')
  })

  it.each(BIN_PATHS)('%s exists on disk with a node shebang', (relativePath) => {
    const absolute = path.join(REPO_ROOT, relativePath)
    expect(fs.existsSync(absolute)).toBe(true)
    const firstLine = fs.readFileSync(absolute, 'utf-8').split('\n', 1)[0]
    expect(firstLine).toMatch(/^#!.*\bnode\b/)
  })
})
