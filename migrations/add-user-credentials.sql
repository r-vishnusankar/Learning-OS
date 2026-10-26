-- ============================================================
-- Migration: add user_credentials table (BUG #24)
-- Additive only — no existing columns altered or dropped.
-- ============================================================

-- ── STEP 1: DRY-RUN / VERIFY ────────────────────────────────
-- Run this SELECT before applying. Expected: false.
-- If it returns true the table already exists; skip STEP 2.

SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name   = 'user_credentials'
) AS "table_already_exists";

-- ── STEP 2: APPLY ────────────────────────────────────────────
-- Run only after verifying STEP 1 returned false.

CREATE TABLE user_credentials (
  user_id              TEXT        PRIMARY KEY
                                   REFERENCES "user"(id)
                                   ON DELETE CASCADE,
  password_hash        TEXT        NOT NULL,
  must_change_password BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── STEP 3: POST-APPLY VERIFY ────────────────────────────────
-- Confirm the table was created with correct columns.

SELECT column_name, data_type, column_default, is_nullable
FROM   information_schema.columns
WHERE  table_schema = 'public'
  AND  table_name   = 'user_credentials'
ORDER  BY ordinal_position;

-- Expected 5 rows:
--   user_id              | text    | (none)      | NO
--   password_hash        | text    | (none)      | NO
--   must_change_password | boolean | true        | NO
--   created_at           | timestamptz | now()   | NO
--   updated_at           | timestamptz | now()   | NO
