# I18n Sync Workflow Design

**Goal:** Make upstream updates safe and low-effort by reusing existing i18n keys and translations, while keeping a clean main branch and a stable i18n branch for local use.

## Context
The current `main` branch already contains substantial localization work. Upstream updates are frequent, so manual merges are costly. We need a repeatable workflow that preserves translations, reduces merge friction, and detects any newly introduced untranslated strings.

## Branch Model
- `main` tracks `upstream/main` only (no local localization changes).
- `i18n` holds all localization changes for local use.
- A temporary merge branch (e.g., `merge/upstream-YYYYMMDD`) is used to integrate upstream into `i18n` with minimal risk.

## Update Flow
1. Fetch upstream and fast-forward `main` to `upstream/main`.
2. Create a temporary merge branch from `i18n`.
3. Merge `main` into the temporary branch.
4. Resolve conflicts and run verification commands.
5. Merge the temporary branch back into `i18n` and delete the temp branch.

## Automation Script
Provide a small Node CLI (testable) with a thin shell wrapper to standardize steps 1-4 and reduce mistakes. The CLI should:
- Verify clean working tree and correct branch.
- Fetch upstream, fast-forward `main`.
- Create a temp merge branch from `i18n` with a date-based name.
- Merge `main` into the temp branch and report conflicts.
- Optionally run `npm run lint`, `npm run typecheck`, `npm run test:i18n`.

## Conflict Handling
Enable `git rerere` to reuse previous conflict resolutions for repeated upstream changes. The script should warn if rerere is disabled and provide instructions to enable it once.

## I18n Coverage
Do not regenerate keys. Reuse existing keys and translations. Add a scan step to detect newly added literal UI strings, output a report, and let the developer replace remaining strings manually.

## Safety and Rollback
All risky changes happen on the temporary branch. If a merge is problematic, the temp branch can be reset or deleted without impacting `main` or `i18n`.

## Testing
At minimum: `npm run lint`, then `npm run typecheck`, then `npm run test:i18n`. These commands confirm basic code health and translation key consistency.
