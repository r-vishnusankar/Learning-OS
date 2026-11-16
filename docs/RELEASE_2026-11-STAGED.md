# Staged production release (2026-11)

## Wave 1 — Shipped

- **PR:** [#4](https://github.com/r-vishnusankar/Learning-OS/pull/4) → `main` @ `4ac2acb`
- **Prod:** https://learning-dashboard-teal-ten.vercel.app
- YouTube iframe Strict Mode / black player fix

## Wave 2 — Multi-dept + thumbnail (this PR)

| Risk | Severity | Mitigation |
|------|----------|------------|
| `course_department` missing | Medium | Server falls back to `course.department_id`; run SQL for full multi-dept |
| Blob token missing | Low | Upload API returns CONFIG error; URL thumbnail unchanged |
| Partial reader update | Low | Grep-reviewed: catalog, hub, eligibility, assignments |
| neon-http no transactions | Low | Sequential sync delete+insert in sync helper |
| Department head assigns other depts | High | Blocked server-side |
| Duplicate assignments multi-dept | Medium | Existing skip logic + per-dept insert |

### Pre-prod gates (you run)

1. `scripts/sql/2026-11-course-department.sql` on Neon (staging → prod).
2. Vercel Blob + `BLOB_READ_WRITE_TOKEN` (Production + Preview).

### Rollback

Revert Wave 2 merge; join table can stay. Wave 1 remains unless full revert.

See `scripts/MULTI_DEPT_THUMBNAIL_QA.md`.