-- Additive: last qualifying learning activity as an IST calendar date (YYYY-MM-DD).
-- Nullable so existing rows keep working. Do not drop or rename streak.

ALTER TABLE profile
  ADD COLUMN IF NOT EXISTS last_activity_date text;

-- Verification
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'profile' AND column_name = 'last_activity_date';
