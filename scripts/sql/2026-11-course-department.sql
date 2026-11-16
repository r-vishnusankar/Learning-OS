-- Additive: course ↔ department many-to-many (review before running on shared DB).
-- Idempotent. Safe to run multiple times.

CREATE TABLE IF NOT EXISTS course_department (
  course_id text NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  department_id text NOT NULL REFERENCES department(id),
  PRIMARY KEY (course_id, department_id)
);

-- Backfill from legacy single department_id column
INSERT INTO course_department (course_id, department_id)
SELECT id, department_id FROM course
ON CONFLICT DO NOTHING;

-- Verification (expect join count >= course count, each course has at least one row after backfill):
-- SELECT c.id, c.department_id, array_agg(cd.department_id ORDER BY cd.department_id) AS departments
-- FROM course c
-- LEFT JOIN course_department cd ON cd.course_id = c.id
-- GROUP BY c.id, c.department_id
-- HAVING count(cd.department_id) = 0;
