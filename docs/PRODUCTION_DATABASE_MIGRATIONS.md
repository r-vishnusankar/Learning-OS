# Production database migrations (Skillrr)

Apply these on the **Neon database wired to Vercel Production `DATABASE_URL`**.

Do **not** assume `.env.local` is the same database. Compare hostnames in Neon console vs Vercel → Project → Settings → Environment Variables.

## Required for dashboard SSR (P19)

```sql
ALTER TABLE profile
  ADD COLUMN IF NOT EXISTS last_activity_date text;
```

File: `src/db/sql/add-profile-last-activity-date.sql`

Dry-run locally: `npx tsx scripts/migrate-last-activity-date.ts`
Apply locally: `npx tsx scripts/migrate-last-activity-date.ts --apply`

## Required for assignment review (P24)

```sql
ALTER TABLE lms_assignment_submission
  ADD COLUMN IF NOT EXISTS reviewed_by text REFERENCES "user"(id) ON DELETE SET NULL;

ALTER TABLE lms_assignment_submission
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp;
```

File: `src/db/sql/add-submission-reviewer.sql`

Dry-run: `npx tsx scripts/migrate-submission-reviewer.ts`  
Apply: `npx tsx scripts/migrate-submission-reviewer.ts --apply`

## Compare environments (hosts only)

```bash
npx vercel env pull .env.vercel.prod --environment=production
npx tsx scripts/compare-db-env.ts
```

If Vercel CLI redacts `DATABASE_URL` as `[SENSITIVE]`, open the Neon console and match the **pooler host** to Vercel’s production value manually.

## Data fix: course level vs slug (CAT-URL)

After code deploy, run on the same DB:

```bash
npx tsx scripts/fix-course-level-from-slug.ts --apply
```

(Dry-run first without `--apply`.)
