-- ============================================================
-- Migration: one knowledge check per course (I4 / #44)
-- Additive only — unique index on lms_assessment.course_id.
-- Postgres unique indexes allow multiple NULLs, so unlinked
-- assessments are unchanged.
-- ============================================================

-- ── STEP 1: DRY-RUN / VERIFY ────────────────────────────────
-- Duplicate links that would block the index. Expected: 0 rows.
-- Do NOT invent which duplicate to keep; resolve manually first.

SELECT course_id, count(*) AS n, array_agg(id) AS assessment_ids
FROM   lms_assessment
WHERE  course_id IS NOT NULL
GROUP  BY course_id
HAVING count(*) > 1;

-- Index already present? Expected: false before apply.

SELECT EXISTS (
  SELECT FROM pg_indexes
  WHERE  schemaname = 'public'
    AND  indexname  = 'lms_assessment_course_unique'
) AS "index_already_exists";

-- ── STEP 2: APPLY ────────────────────────────────────────────
-- Run only after STEP 1 duplicate query returns 0 rows.

CREATE UNIQUE INDEX IF NOT EXISTS lms_assessment_course_unique
  ON lms_assessment (course_id);

-- ── STEP 3: POST-APPLY VERIFY ────────────────────────────────

SELECT indexname, indexdef
FROM   pg_indexes
WHERE  schemaname = 'public'
  AND  indexname  = 'lms_assessment_course_unique';
