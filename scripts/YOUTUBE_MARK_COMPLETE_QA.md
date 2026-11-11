# Manual QA: YouTube → Mark complete (prod)

**Prereq:** Deployment includes hardened `lesson-media.tsx` (IFrame API + near-end poll + postMessage fallback).

## Setup

1. Note prod **deployment SHA** (Vercel → Deployment → Commit).
2. Employee account with an assigned course that has a **YouTube** lesson (short video preferred; also test ~6:28 Fireship-style).
3. Open DevTools → Network; filter `iframe_api` (optional).

## Test A — Full watch

1. Open lesson URL: `/dashboard/courses/<slug>/lessons/<lessonId>`.
2. Play embedded video to natural end (do not skip).
3. **Expected:** "Mark complete" becomes enabled within **2s** of video end (no page refresh).
4. Click Mark complete → success toast/navigation.
5. **DB:** `lesson_progress.completed = true`, `percentage >= 100`.

## Test B — Near-end (END event flaky)

1. Seek to **last 3 seconds** of video (if scrubbing allowed) or play from ~95%.
2. Let play to end.
3. Same expectations as Test A.

## Test C — Open in tab fallback

1. Use "Open tab" under player; watch to end in YouTube tab if embed fails.
2. Return to Skillrr tab — if embed still running, Mark complete should still work after A/B.

## Test D — Regression

| Type | Expected |
|------|----------|
| Vimeo lesson | Mark complete after `finish` event |
| MP4 direct | `onEnded` on `<video>` |
| Article | No Mark complete gate on video |

## Fail capture

- Screenshot of disabled Mark complete at t=0 after video ended  
- Console errors (YT API, CSP)  
- `lesson_progress` row before/after  
- Browser + OS version
