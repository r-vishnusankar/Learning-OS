# QA sign-off matrix (production)

Use this template **per backlog row** before marking Fixed in the tracker. Merged PR ≠ fixed until prod evidence exists.

## Row template

| Field | Value |
|-------|--------|
| **Tracker ID** | e.g. VIDEO-COMPLETE |
| **Environment** | `https://skillrr.vercel.app` (or canonical prod URL) |
| **Deployment SHA** | `git rev-parse` from Vercel deployment / `VERCEL_GIT_COMMIT_SHA` |
| **Date (IST)** | |
| **Tester** | |
| **Role tested** | admin \| employee \| department_head |
| **Account** | email (no password in ticket) |

### Steps

1. …
2. …

### Expected

- …

### Evidence

- [ ] Screenshot (attach to ticket)
- [ ] DB query result (sanitized)

#### DB examples (Neon read-only)

```sql
-- Lesson completion (#55 / VIDEO-COMPLETE)
SELECT lesson_id, completed, percentage, last_viewed_at
FROM lesson_progress
WHERE user_id = '<uuid>' AND lesson_id = '<uuid>';

-- Course active (#54)
SELECT status FROM course_progress WHERE user_id = '<uuid>' AND course_id = '<uuid>';
-- (if using derived status only, capture UI + lesson_progress rows instead)
```

### Result

- [ ] Pass  
- [ ] Fail — notes: …

---

## Batch release checklist (RELEASE-0x)

| ID | SHA | Role | Pass |
|----|-----|------|------|
| VIDEO-COMPLETE | | employee | |
| CONTINUE-LEARNING (#54) | | employee | |
| DEPT-METRICS (#12/13) | | admin | |
| ADMIN-ACCESS (#28) | | employee | |
| P24 reject comment | | admin + employee | |

---

## Manual: YouTube Mark complete

See [scripts/YOUTUBE_MARK_COMPLETE_QA.md](../scripts/YOUTUBE_MARK_COMPLETE_QA.md).
