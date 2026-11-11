# Product clarifications (blocks QA closure)

Items **#30–33, #37, #39, #46** need product sign-off before engineering treats related rows as bugs.

## #30–33 — Dashboard & Learning recommendations

**Current behavior (code):** Heuristic scoring on enrollments, completion, department, and level — not ML. Copy may say "AI-matched."

**Options:**

| Option | Description |
|--------|-------------|
| A (Recommended) | Update copy to "Recommended for you" / "Popular in your department"; keep heuristics |
| B | Build explicit rules doc in admin (weights per department) |
| C | Defer ML integration |

**Sign-off:** Product owner __________ Date __________

## #37 — Gamification (XP, coins, streak)

**Current:** XP/coins from completions; streak from `lastActivityDate` + lesson activity (IST user day).

**Question:** Should streak break on missed calendar day only, or any 24h gap?

**Recommended:** Calendar day in user TZ (matches existing streak lib).

**Sign-off:** __________

## #39 — Certificate titles

**Current:** Template from course/path name + issue date.

**Question:** Custom org prefix or legal name on PDF?

**Recommended:** Keep course title; add org name in footer only if legal requires.

**Sign-off:** __________

## #46 — Path vs course enrollment

**Current:** Courses enroll directly; paths assign steps separately.

**Question:** Must path enrollment auto-enroll all path courses?

**Recommended:** Yes for assigned paths only (auto-enroll on path assignment) — **not implemented** (#48-related).

**Sign-off:** __________

## Improvements gated on clarifications

- **#48** Multi-department course assign — needs ownership model  
- **#49** Thumbnail upload — confirm Uploadthing prod keys  
- **#51** Assessment ↔ course dropdown — confirm single-course vs path-only assessments
