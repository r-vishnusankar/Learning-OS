-- Additive reviewer identity on lms_assignment_submission.
-- Do not rename feedback or status values.

ALTER TABLE lms_assignment_submission
  ADD COLUMN IF NOT EXISTS reviewed_by text REFERENCES "user"(id) ON DELETE SET NULL;

ALTER TABLE lms_assignment_submission
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp;

-- Verification
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'lms_assignment_submission'
--   AND column_name IN ('reviewed_by', 'reviewed_at');
