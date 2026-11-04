# Skillrr release readiness report

**Branch:** `fix/skillrr-audit-corrections`
**Baseline:** `de2d068` (`origin/main` before release candidate)
**Issue:** Correction-mode work was completed in the working tree but not committed; production at `de2d068` could not include P25/P26/P2 fixes.

## Release candidate commit

**SHA:** `94bda8d` — `fix(release): recover audit corrections P25/P26/P2 and migration docs`

Merge to `main`, Vercel deploy, and production Neon migrations are **separate human approvals**.

## Files in this release

**Application**

- P25: `eligibility.ts`, `promotion-display-status.ts`, `promotions.ts`, validators, hooks, admin promotions, learning page
- P26 / P2: `header.tsx`, `sidebar.tsx` (fresh profile role/designation)
- Disclosures: `ai-mentor`, `analytics`, `leaderboard` pages
- Build: `tsconfig.json` excludes `scripts/` from Next.js typecheck

**Documentation**

- `PRODUCTION_DATABASE_MIGRATIONS.md`
- `FIX_VERIFICATION_POST_CORRECTION.md`
- This report

**Scripts (not bundled in app)**

- `compare-db-env.ts` — hostname + column presence (no secrets printed)
- `fix-course-level-from-slug.ts` — dry-run by default; `--apply` for DB data fix
- `test-promotion-display-status.ts`, `test-submission-reviewer-columns.ts`

**Note:** P24 assignment reject logic is already in baseline `0512264` / tip `de2d068`; this RC adds migration guidance and reviewer column check only.

## Excluded from commit

`.impeccable/`, `Skillrr.docx`, prompt markdown, demo seed scripts, generated `COURSE_*` audit docs, temporary audit logs. No `.env` or secrets.

## Local validation (not production)

| Check | Result |
|-------|--------|
| `npm run build` | PASS |
| All `scripts/test-*.ts` + `npm run test:course-url-audit` | PASS |
| `npm run lint` | Not clean (pre-existing repo debt) |

## Production database (manual approval)

Apply on **Vercel Production Neon** (do not assume `.env.local` is the same DB):

1. `src/db/sql/add-profile-last-activity-date.sql`
2. `src/db/sql/add-submission-reviewer.sql`
3. Optional: `npx tsx scripts/fix-course-level-from-slug.ts --apply` after dry-run

See `docs/PRODUCTION_DATABASE_MIGRATIONS.md`.

## Known limitations

- AI Mentor: scripted demo (P30 not implemented)
- Analytics: mock datasets (disclosed in UI)
- dept_head admin UX vs server guards: unchanged (`PRODUCT.md`)
- Production E2E and prod schema: not verified as part of this RC

## Blockers before “production ready”

1. Merge RC → `main` (approval)
2. Deploy; record Vercel deployment SHA
3. Apply prod SQL on correct Neon
4. Authenticated production verification + clean Vercel logs

## Release lifecycle

Bug → fix → local verify → **commit** → staging verify → deploy → prod verify. **DB migration approval is separate from code approval.**
