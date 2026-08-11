# Skillrr QA — Courses + Lessons + Progress

**Module:** Courses + Lessons + Progress (one flow)  
**Evidence mode:** Code-level audit only — browser NO, console NO, network NO  
**Date:** 2026-08-10  
**Rule:** Report only. No fixes.

---

### 1. Coverage

| Item | Count found | Traced in code | Not established |
|---|---|---|---|
| Pages / routes | 3 (`/courses`, `/courses/[slug]`, `/courses/[slug]/lessons/[lessonId]`) + learning/home CTAs | 3 | Runtime empty/error UI |
| Interactive elements (CTAs, curriculum links, mark complete, next) | ~12 major | 12 | Hover/focus/a11y |
| Forms | 0 in this spine | 0 | — |
| Roles | Catalog uses session dept; admin builder out of scope | Learner path traced | Admin/instructor authoring |
| Enrollment writes | 0 course-enrollment table | Confirmed absent | Whether product intends assignments-as-enrollment |
| Progress write paths | 2 (`upsertProgressAction`, `completeLessonAction`) | 2 | Concurrent DB races under load |

**browser NO · console NO · network NO**

---

### End-to-end traces

#### Enrollment

| Hop | Location |
|---|---|
| UI “Start / Continue / enrolled” | `course-card.tsx` L28, L80–85 — `enrolled = progress > 0 \|\| status…`; CTA label only |
| UI links | Card → `/dashboard/courses/{slug}` (`course-card.tsx` L23) — never writes enrollment |
| Hook | `usePublishedCourses` / `useCourseBySlug` — read only |
| Server | No `enrollCourseAction`. Path enroll is separate (`enrollPathAction` in certification) |
| DB | Progress: `lesson_progress` PK `(user_id, lesson_id)` (`schema/progress.ts` L5–21). Assignments: `course_assignments` (admin-assigned, parallel system) |
| Schema | `courses.enrolledCount` (`schema/courses.ts` L71) — seed/marketing counter; not incremented on Start |

**Break:** There is no course-enrollment record on Start. Second “enrollment” is a no-op because nothing is written. “Already completed” still has no enroll gate — user can reopen curriculum.

#### Start vs Continue

| Hop | Location |
|---|---|
| Catalog / learning CTA | `progress > 0 ? "Continue" : "Start"` → **course detail URL**, not a lesson (`learning/page.tsx` L480–483; `course-card.tsx` L80–85, L23) |
| Home Resume | `continueHref` → course slug only (`dashboard/page.tsx` L267–268, L565–568) |
| Course detail Continue | `firstLesson = modules.flatMap(lessons).find(l => !l.locked)` → that lesson (`courses/[slug]/page.tsx` L34, L74–78) |
| Lock map | `mapCourseToUi` (`course-mapper.ts` L74–82): completed lessons never locked; first incomplete after incomplete prior is locked; **first lesson / completed lessons stay unlocked** |
| Dead resume helper | `getContinueLearning` (`queries/courses.ts` L241–260) orders by `lastViewedAt` — **never called** from services |

**Break:** Continue resolves to the **first unlocked** lesson (almost always lesson 1, including when already completed), not the next incomplete lesson.

#### Lesson completion

| Hop | Location |
|---|---|
| UI | `handleMarkComplete` → `completeLesson.mutateAsync` (`lessons/[lessonId]/page.tsx` L63–80); button disabled if `progress?.completed` or pending (L88) |
| Hook | `useCompleteLesson` → `completeLessonAction` (`hooks/use-courses.ts` L134–142) |
| Action | `requireUserId()` then `markLessonComplete` (`progress.ts` L64–66) |
| Query | `upsertLessonProgress` 100%/completed (`queries/progress.ts` L46–47, L23–41) `onConflictDoUpdate` on PK |
| Schema | `lesson_progress` (`schema/progress.ts` L5–21) |

**View tracker (separate write):** mount effect `upsertProgress.mutate({ lessonId, percentage: 10 })` (`lessons/[lessonId]/page.tsx` L33–37) → `upsertProgressAction` (`progress.ts` L42–50) → same upsert; `completed = input.completed ?? percentage >= 100` (`queries/progress.ts` L13) → **10 ⇒ completed false**, overwrites prior complete.

**Idempotency:** Complete→complete is safe (same PK values). **Complete→revisit is not:** view write clears `completed`. Double-click: UI disables while pending; server has no mutex. `userId` always from session (`requireUserId`); client sends only `lessonId` / `percentage` / optional `completed` (`validators/course.ts` L106–109) — client cannot spoof another user, but **can** set `completed: true` on any lesson UUID via `upsertProgressAction` with no sequence check.

#### Completion percentage

| Hop | Location |
|---|---|
| List/home | `completedCount / lessonIds.length` (`services/courses.ts` L92–97, L125–127); 0 lessons → 0 |
| Detail / complete | `getCourseProgressPercent` (`queries/courses.ts` L190–218): denominator `countCourseLessons`; numerator completed rows in those lesson IDs; 0 lessons → 0 |
| Cap | `Math.round` ratio; completed filtered to current lesson set → cannot exceed 100 from this formula |
| Curriculum change | Recomputes from current lessons; adding lessons lowers %; orphan progress on removed lessons ignored in numerator |

#### Resume / module boundary / all done

| Hop | Location |
|---|---|
| Next after complete | Flatten modules by `orderIndex`, then lessons (`progress.ts` L9–12, L76–79) — crosses module boundary correctly in code |
| UI navigate | If `nextLessonId` → push next lesson; else if `courseComplete && assessmentId` → assessment; else course page (`lessons/[lessonId]/page.tsx` L66–77) |
| All done, no assessment | Toast “Course curriculum complete!” → course detail |

#### Visibility & direct URL

| Hop | Location |
|---|---|
| Catalog filter | SQL `publishStatus = published` then in-memory `openToAll \|\| departmentId === userDept` (`queries/courses.ts` L62–79) via `fetchPublishedCoursesAction` (`services/courses.ts` L75–84) — **server-side for list**; other-dept rows not returned to client |
| Course by slug | `publishStatus !== "published"` → null (`services/courses.ts` L133–137); **no department / openToAll check** |
| Lesson player | `publishStatus !== "published"` → null (`progress.ts` L17–19); **no enrollment, department, or lock check**; URL `slug` unused for authz (load by `lessonId` only) |
| UI lock | Curriculum `href="#"` when locked (`courses/[slug]/page.tsx` L97–99) — client only |
| Null lesson UI | `isLoading \|\| !data` always Skeleton (`lessons/[lessonId]/page.tsx` L39–45) — unpublished/missing never shows “not found” |

---

### 2. Summary table

| ID | Title | Severity | Evidence | Area |
|---|---|---|---|---|
| SKL-101 | Revisit completed lesson resets completion via view upsert at 10% | Critical | INFERRED | Progress |
| SKL-102 | Course detail “Continue” opens first unlocked lesson, not next incomplete | High | INFERRED | Resume |
| SKL-103 | Lesson lock / sequence not enforced server-side | High | INFERRED | AuthZ / Progress |
| SKL-104 | Department / openToAll not enforced on course slug or lesson player | High | INFERRED | Visibility |
| SKL-105 | No course enrollment write; Start is browse-only | Medium | INFERRED | Enrollment |
| SKL-106 | Unpublished/missing lesson URL leaves infinite skeleton | Medium | INFERRED | Lesson player |
| SKL-107 | Course-complete assessment notification re-inserted without dedupe | Medium | INFERRED | Progress |
| SKL-108 | `lastAccessed` is course `updatedAt`, not learner activity | Low | INFERRED | Resume UX |
| SKL-109 | `getContinueLearning` unused; Resume never deep-links a lesson | Low | INFERRED | Resume |
| SKL-110 | Catalog `enrolledCount` / default thumbnails / rating÷10 are display synthesis | Low | INFERRED | Listing |

---

### 3. Detail — Critical and High

**SKL-101 — Revisit completed lesson resets completion via view upsert at 10%**  
Severity / Priority: Critical / P0  
Evidence: INFERRED  

Code path:
1. Mount: `upsertProgress.mutate({ lessonId, percentage: 10 })` — `lessons/[lessonId]/page.tsx` L33–37  
2. `upsertProgressAction` — `services/progress.ts` L42–50  
3. `completed = input.completed ?? input.percentage >= 100` — `queries/progress.ts` L13 → false  
4. `onConflictDoUpdate` sets `percentage: 10`, `completed: false` — L33–40  
5. Course % uses `completed === true` only — `getCourseProgressPercent` L204–216; list L92–97  

Expected: Reopening a completed lesson keeps it completed (or only bumps `lastViewedAt`).  
Actual: Write clears completion and can drop course progress / re-lock later lessons in the UI mapper.  
Technical finding: View telemetry and completion share one upsert without “never downgrade completed” guard.  
Likely root cause: Fire-and-forget 10% progress on every visit overwrites completion state.

---

**SKL-102 — Course detail “Continue” opens first unlocked lesson, not next incomplete**  
Severity / Priority: High / P1  
Evidence: INFERRED  

Code path:
1. `firstLesson = …find((l) => !l.locked)` — `courses/[slug]/page.tsx` L34, L74–78  
2. Lock: `locked = !isPreview && lessonIndex > 1 && !priorDone && !completed` — `course-mapper.ts` L74–82  
3. Completed lessons: `!completed` false → **not locked** → `find` returns lesson 1 if completed  

Expected: Continue / Resume → first incomplete lesson (or next after last completed).  
Actual: Continues to first unlocked, typically lesson 1 forever after any progress.  
Home/learning “Continue” only deep-links the course page (`dashboard/page.tsx` L267–268; `learning/page.tsx` L480–483), then hits the same bug.  
Likely root cause: CTA uses “first unlocked” instead of “first where !completed”.

---

**SKL-103 — Lesson lock / sequence not enforced server-side**  
Severity / Priority: High / P1  
Evidence: INFERRED  

Code path:
1. UI-only lock — `courses/[slug]/page.tsx` L97–99  
2. `fetchLessonPlayerAction` — published check only — `progress.ts` L15–19  
3. `completeLessonAction` / `upsertProgressAction` — `requireUserId` + lesson id, no prior-lesson check — L42–66  
4. Client may pass `completed: true` — `validators/course.ts` L106–109  

Expected: Cannot load/complete lesson N until N−1 complete (if product requires linear curriculum).  
Actual: Any authenticated user with a lesson UUID can load and complete out of order.  
Likely root cause: Locking implemented only in `mapCourseToUi` for display.

---

**SKL-104 — Department / openToAll not enforced on course slug or lesson player**  
Severity / Priority: High / P1  
Evidence: INFERRED  

Code path:
1. List filtered — `getPublishedCourses` L76–79  
2. `fetchCourseBySlugAction` — published only — `services/courses.ts` L133–137  
3. `fetchLessonPlayerAction` — published only — `progress.ts` L17–19  

Expected: Restricted (`openToAll === false` and other department) courses/lessons inaccessible by direct URL.  
Actual: List hides them; slug and lessonId routes still serve published restricted content and accept progress writes.  
Likely root cause: Visibility rules applied only on catalog query, not on detail/player/progress writes.

---

### 4. Medium and Low

- **SKL-105** [INFERRED] No course enrollment row on Start; “enrollment” is implied by `lesson_progress` / optional `course_assignments`; `enrolledCount` not updated — `course-card.tsx` L28; no enroll action in `services/courses.ts`.  
- **SKL-106** [INFERRED] Null player payload keeps Skeleton forever — `lessons/[lessonId]/page.tsx` L39–45 vs course detail’s not-found L30–31.  
- **SKL-107** [INFERRED] Each time `courseComplete && assessmentId` after complete, inserts a new notification with no dedupe — `progress.ts` L85–101.  
- **SKL-108** [INFERRED] `lastAccessed: row.course.updatedAt.toISOString()` — `course-mapper.ts` L133; Resume copy can show wrong “last activity”.  
- **SKL-109** [INFERRED] `getContinueLearning` never wired — `queries/courses.ts` L241–260.  
- **SKL-110** [INFERRED] Display synthesis: default Unsplash thumb / Dicebear instructor (`course-mapper.ts` L110–119), `rating / 10` (L125), `durationHours` floor at 1 (L122), seed `enrolledCount`.

---

### 5. Not tested

- Actual Neon row states after complete → revisit → complete (needs DB or browser).  
- Concurrent double-submit races under latency.  
- Whether Product Design Systems (0 lessons) empty curriculum UX is acceptable in UI.  
- Admin assignment “enrollment” console interaction with this learner spine.  
- XP/streak side effects on lesson complete (none found in `progress.ts`; not traced into other services).  
- Visual lock/disabled states, toasts, and navigation timing.

Need: browser + session as learner, or SQL against `lesson_progress` / `notifications` while exercising the player.

---

### 6. Questions

- Is open catalog (no enroll record) intentional, with `course_assignments` as the only true enrollment?  
- Is linear lesson locking a product requirement, or cosmetic guidance?  
- Should revisiting a lesson auto-write progress at all, or only `lastViewedAt`?  
- On 0-lesson published courses, is hiding Continue (no `firstLesson`) the intended empty state?

---

### 7. Observed elsewhere

- Path enrollment (`enrollPathAction`) is a separate certification flow, not course Start.  
- Assessment due dates may be synthesized when null (`assessments.ts` L79) — outside this module.

---

### 8. Verdict for this module

**Not ready** — driven by **SKL-101**: the lesson view tracker can wipe `completed` on every reopen, undermining progress persistence (the spine’s core promise).

Stop. Awaiting instruction; no fixes applied.
