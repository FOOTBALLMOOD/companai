# The translation catalogs — one source, five locales, one checker that covers three

**Written 2026-10-20, after the first CI run found the unit suite blocked by a formatting rule.**

## 1. The rule

Every module carries `i18n/en.json` plus one file per locale. **English is the source**: a key that
exists in `en.json` must exist in every other locale, and every file is **flat and sorted** (dotted
keys, `"auth.roles.title": "…"`, alphabetical). Placeholders are ICU-style and must survive
translation verbatim: `{grantor}`, `{grantee}`, `{date}`, `{members}`, `{records}`, `{subject}`,
`{roles}`, `{tenant}`.

## 2. What enforces it

`scripts/i18n-check-sync.ts`, run by `ci.yml` as **"Check i18n sync"** — the **second step** of the
`test` job, before typecheck and before any unit test. That position is deliberate: a translation file
that disagrees with English is a defect in the build, not a later annoyance. It also means the check
**blocks everything behind it** — which is exactly what happened on 2026-10-20 (`CC-142`).

```bash
yarn i18n:check-sync          # report; exit 1 on any discrepancy
yarn i18n:check-sync --fix    # sort, add missing keys, remove extras
```

## 3. ★ The trap in `--fix`, and why the 86 keys were written by hand

`--fix` repairs a missing key by **copying the English text into the locale**
(`scripts/i18n-check-sync.ts:165` — `fixedFlat[key] = localeFlat[key] ?? enFlat[key]`). That is a
placeholder, not a translation: it makes the check green while a Polish user reads English. It is the
right behaviour for a formatter and the wrong behaviour for a product, and the two are one flag apart.

**So the order matters: translate first, then `--fix`.** With nothing missing, `--fix` can only sort,
which is what it was used for on 2026-10-20 (12 files across `apps/mercato/src`, `api_keys`,
`audit_logs`).

## 4. The 2026-10-20 record — 86 keys × 3 locales, written by hand

`auth` had **86 keys missing in `pl`, `es` and `de`** — five features added in English only:

| Group | Keys | What it covers |
|---|---:|---|
| `auth.delegations.*` | 19 | authority lent from one person to another |
| `auth.denials.*` | 20 | one permission withheld from one person |
| `auth.projects.*` | 17 | the matters work is organised into, and their grades G0–G4 |
| `auth.recordLocks.*` | 16 | records that refuse writes whoever asks |
| `auth.trust.*` | 14 | the autonomy a worker has earned, tiers T0–T4 |

They were translated by hand, in each locale's existing register (informal address, and the
terminology already in the file: *uprawnienie* / *permiso* / *Berechtigung*, *rola* / *rol* / *Rolle*,
*rekord* / *registro* / *Datensatz*, *Superadministrator*). Every placeholder was asserted to survive:
a translation that drops `{grantee}` renders a broken string, and no test would catch it.

**⚠ These 258 strings have not been reviewed by a native speaker.** They are accurate and idiomatic
as far as a careful translation goes, but the register is the product's voice. Treat a native review
as outstanding work, not as a formality — and if one is done, correct the file in place; the checker
only cares that the keys exist and are sorted.

## 5. ★ Arabic is a supported locale the checker does not cover — `CC-144`

`packages/shared/src/lib/i18n/config.ts:14` offers **five** locales: `['en','pl','es','de','ar']`, and
`direction.ts` renders Arabic right-to-left. But `scripts/i18n-check-sync.ts:25` reads
`TARGET_LOCALES = ['pl','es','de']` — **Arabic is not checked**, and it shows:
`auth/i18n/ar.json` holds **40 of 377 keys**, so 337 strings render as raw dotted keys in an Arabic UI.

Adding `'ar'` to that array is the fix, but it turns the check red on the next run until the
translations exist — which is why it is a row (`CC-144`) and not a one-line change. **A check that
covers three of five offered locales is a check that reports "all in sync" while two-fifths of the
product is untranslated.**

## 6. Adding a key

1. Add it to `en.json` — that is the source of truth.
2. Add the same key to `pl`, `es`, `de` (and `ar` once `CC-144` lands), translated, placeholders intact.
3. Run `yarn i18n:check-sync`; it must print **"All translation files are in sync."**
4. If a file is merely unsorted, `--fix` is safe — nothing is missing, so it can only reorder.
