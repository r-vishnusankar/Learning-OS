# Multi-department courses + thumbnail upload — manual QA

## Prerequisites

- Run `scripts/sql/2026-11-course-department.sql` on your Neon database (staging first).
- Set `BLOB_READ_WRITE_TOKEN` in `.env.local` (Vercel Blob store connected to the project).

## Admin

1. **Create course** — select two departments; confirm course list shows both labels.
2. **Edit course** — add a third department, save; remove back to one; confirm visibility copy mentions "departments".
3. **Thumbnail** — Attach photo (PNG &lt; 4MB); confirm preview and employee course card image.
4. **Thumbnail reject** — try PDF and &gt;4MB file; expect error toast.
5. **Assign** — scope Department, pick two departments; confirm enrollments; assign again (no duplicates).
6. Light and dark theme on course builder metadata card (1280px+).

## Employee

1. Course **Open to all off**, departments Dev + QA — Dev user sees it; HR user does not.
2. Toggle **Open to all on** — HR user sees it.
3. Assigned course from step 5 appears on learning dashboard.
