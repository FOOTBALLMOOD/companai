/**
 * No source file may be gitignored.
 *
 * Found 2026-10-20 by the first clean checkout that ever ran the suite. A bare `storage` rule in
 * `.gitignore` matched **at any depth**, and one of the depths was
 * `packages/core/src/modules/attachments/backend/storage/**` — two real source files. The symptom in
 * CI was `Cannot find module '../attachments/backend/storage/attachments/page.meta' from
 * backend-sidebar-icons.test.ts`.
 *
 * **Why nothing said so for so long**, and why this guard is a git query rather than a walker:
 *   - the files exist on disk locally, so every local run was green;
 *   - `git status` was clean, because an ignored file never shows as untracked;
 *   - `git ls-files` shows only tracked files, so the two did not appear in any inventory.
 *
 * Only a **clean checkout** (what CI does) can see the hole, and a file-exists walker cannot see it
 * either — it would find the file on the developer's machine. The honest check therefore asks git
 * itself: which files under a src/ tree does git refuse to track?
 *
 * This is the same hazard the docs repository records for `hermes-agent-main/`: **a bare directory
 * name matches at every depth, and it takes a different rule for each sibling you did not mean to
 * hide.**
 */
import { execSync } from 'node:child_process'
import path from 'node:path'

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..', '..')

/** Source extensions that belong to a `src/` tree and must never be ignored. */
const SOURCE_EXT = /\.(ts|tsx|json|md)$/

function ignoredSourceFiles(): string[] {
  const out = execSync('git ls-files --others --ignored --exclude-standard -- packages apps', {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter((file) => file.length > 0)
    .filter((file) => file.includes('/src/'))
    .filter((file) => SOURCE_EXT.test(file))
}

function ignoreCountEverything(): number {
  const out = execSync('git ls-files --others --ignored --exclude-standard -- packages apps', {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  return out.split('\n').filter((line) => line.trim().length > 0).length
}

describe('no source file is gitignored', () => {
  it('finds ignored files to reason about (the denominator)', () => {
    // Upload artefacts, dist output, caches — the ignoring is working. A run that reported zero
    // ignored files would pass every assertion below by vacuity.
    expect(ignoreCountEverything()).toBeGreaterThan(0)
  })

  it('ignores nothing under a src/ tree', () => {
    const offenders = ignoredSourceFiles()
    if (offenders.length > 0) {
      throw new Error(
        `These source files are gitignored, so they are missing from every clean checkout:\n  ${offenders.join('\n  ')}\n\n` +
          'A local run cannot see this — the file is on disk, `git status` is clean, and `git ls-files` ' +
          'does not list it. Fix the `.gitignore` rule (a bare directory name matches at EVERY depth; ' +
          'anchor it with a leading `/`) and add the files.',
      )
    }
    expect(offenders).toEqual([])
  })
})
