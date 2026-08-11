# Skillrr QA — Part A Setup Block

Copy this block and prepend it to every Part B module run.

```
## Environment

App URL: http://localhost:3000
How to run the app: npm install → ensure .env.local → npm run db:push && npm run db:seed (and optional catalog/career seeds) → npm run dev
Framework / stack: Next.js 16 (App Router) + React 19 + TypeScript, Tailwind CSS v4, Auth.js (next-auth v5), Neon Postgres + Drizzle ORM, TanStack Query, Zustand, Framer Motion, next-themes, Sonner
Repo root: c:\Users\Vishnu\Desktop\AI_Product_Lab\02_Experiments\Learning Dashboard

## Test accounts

Role 1 (admin / demo learner):  demo@nexus.local / nexus123
  — Seeded as platform admin (profiles.role = "admin"). This is the only credentials login that works today.
Role 2 (employee / manager / etc.):  NO separate password logins
  — Employee roster can be seeded via `npm run db:seed-employees` / `db:setup-career-loop` (profiles exist in Neon), but Credentials auth only accepts DEV_LOGIN_EMAIL + DEV_LOGIN_PASSWORD. Role/permission testing requires either changing the demo user's role in DB/admin UI, or Entra SSO once configured.
Role 3 (Microsoft Entra SSO):  NOT CONFIGURED
  — AUTH_MICROSOFT_ENTRA_ID_* in .env.local are still placeholders; SSO button appears only when real Entra vars are set.

## Seeded data

Courses available:
  - Core seed (`db:seed` → seed-courses): System Design Mastery, TypeScript for Enterprise Apps, Product Design Systems
  - Optional catalog seed (`db:seed-catalog`): large multi-department course catalog from `src/db/catalog/department-courses.ts`
Lessons per course:
  - System Design Mastery: 2 modules / 6 lessons (seeded curriculum)
  - TypeScript for Enterprise Apps: 2 modules / ~6 lessons (seeded curriculum)
  - Product Design Systems: course row only unless catalog/resync added curriculum
  - Catalog courses: curriculum generated when seeded via catalog scripts
Challenges / assessments available:
  - System Design Fundamentals Exam (MCQ / multi-select / true-false, pass 70%, maxAttempts 3) via seed-assessments
  - Additional course-linked assessments possible via `db:seed-course-assessments` / career-loop setup
  - Learning path: Senior Systems Engineer Track (course → assessment → certificate gate) via seed-certification
Achievements defined:
  - UI/mock list in `src/data/mock.ts` (8 achievements: First Steps, Week Warrior, Certified Pro, Night Owl, Top 10, Architect Path, Mentor Mode, Perfect Score)
  - Not a fully live unlock engine — treat gamification as partly mock unless a module run proves otherwise against Neon
Any user with partial progress:
  - Demo user may have ops notifications / team membership from seed-operations
  - Partial lesson/assessment progress depends on prior manual use of this Neon DB (not guaranteed by seed alone)
  - Mock "Alex Rivera" progress in `src/data/mock.ts` is not the logged-in demo user

## Out of scope — do not file bugs against these

- Microsoft Entra SSO end-to-end (credentials placeholders; company IdP not wired)
- AI Mentor as a real LLM — responses are hardcoded mocks in `src/app/dashboard/ai-mentor/page.tsx`
- Skills matrix data from `getSkills()` — still served from `src/data/mock.ts`
- Achievement unlock engine / live mastery states if still driven by mock achievement arrays
- README still mentions some mock service-layer gaps; live Neon domains (courses, assessments, certificates, paths, ops) are in progress — flag hardcoded/mock renders when found, but do not treat unfinished IdP or mock mentor as product defects
- Cloudflare tunnel / production deploy concerns
- UploadThing / media CDN production configuration unless explicitly in scope for that module

## Tooling available to you

Browser automation available:  NO
If YES, name the tool: (none connected — no Playwright/Puppeteer/browser MCP in this Cursor session)
Can you read the browser console:  NO
Can you inspect network requests:  NO

Note: `npm run dev` is typically already running on port 3000. Without browser automation, each module run is a **code-level audit** (and optional manual verification only if the human performs steps). Reports must label evidence [VERIFIED] / [INFERRED] / [NOT TESTED] accordingly. Honesty rules in Part B are mandatory.
```

## Part C run order (reminder)

1. Auth
2. Navigation
3. Courses
4. Learning
5. Challenges / assessments
6. Gamification
7. Forms
8. Profile, settings, dashboard, notifications
9. Roles and permissions
10. Cross-cutting sweep (dark mode + responsive)

Reports: save under `qa/reports/` as one file per module (e.g. `qa/reports/01-auth.md`).
