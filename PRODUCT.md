# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary (inferred from app copy & roles):** Company employees using an internal learning portal to complete assigned courses, pass knowledge checks, earn certificates, and become eligible for level-based promotion.

**Secondary (inferred from admin surfaces & role model):** Instructors, department heads, managers, and super admins who assign courses/homework, build assessments, review submissions, approve promotions, and track employee progress.

Roles in product: Employee, Manager, Instructor, Department Admin, Super Admin.

## Product Purpose

**Nexus** (tagline: *Enterprise Learning Platform* / Learning OS) is the company’s internal system for role- and goal-based learning tied to career advancement.

Success for a learner means: complete mandatory courses for their level (lessons + passed assessment), earn certificates, reach **Eligible for promotion**, and receive admin-approved level advancement.

Success for admins means: manage catalog and assignments, run assessments (including coding), review homework, oversee promotions, and see progress across departments.

## Positioning

Learning is gated to a **career loop**, not open-ended course browsing alone: mandatory course assignments → lessons → knowledge-check assessment → certificate → promotion eligibility → admin approval. Neighboring LMS tools may host courses; Nexus couples certification to internal career levels (Beginner → Expert) across seven departments.

## Operating Context

- Authenticated web app (`/login` → `/dashboard`); Microsoft Entra SSO intended for production, with local demo credentials for development.
- Departments: QA, Development, BA, HR, Marketing, UI/UX, DevOps.
- Learning levels: Beginner, Associate, Intermediate, Advanced, Senior, Lead, Architect, Expert (3 catalog courses per department × level).
- Learner rituals: Dashboard career card, My Learning, Courses, Assessments, Assignments (incl. coding), Certificates, Skills, Leaderboard, AI Mentor, Help.
- Admin rituals: course & media management, course assignments, assessments & question banks, homework assignments, certificates, promotions, employee progress, catalog audit.
- Stack in use: Next.js App Router, React, TypeScript, Tailwind CSS, Neon Postgres, Drizzle, Auth.js, TanStack Query.

## Capabilities and Constraints

**Confirmed capabilities**
- Department/level course catalog with intro video, core concepts, practice lab.
- Course progress, assessments (MCQ and other types including coding with automated checks), homework assignments (text/url/github/coding).
- Certificates, learning paths, skill matrix, leaderboard, analytics.
- Promotion eligibility and admin promotion approval.
- AI Mentor (advisory; not a substitute for assessments).

**Constraints / terminology**
- Brand name: **Nexus**.
- “Mandatory / assigned courses” drive promotion; open catalog is supplementary.
- Passing the course knowledge check is required for certification—not lessons alone.
- [Open] Exact production tenant branding, legal entity, and HR policy ownership beyond in-app help copy.

## Brand Commitments

- Product name: **Nexus**.
- Positioning language already in UI: “Enterprise Learning Platform”, career progress, certification, promotion eligibility.
- Incumbent UI tokens exist in `src/app/globals.css` (primary purple `#8759f2`, pastel surfaces, large card radius). Treat as **incumbent visual system** until `/impeccable document` or an explicit redesign; init does not redefine aesthetics.

## Evidence on Hand

- In-app Help (`src/app/dashboard/help/page.tsx`) documenting career/promotion loop.
- Seeded department course catalog (~168 courses) and related docs/scripts under `src/db/catalog/` and `docs/` when present.
- Demo login path documented in `README.md`.
- Do **not** invent customer logos, testimonials, or enterprise case studies that are not in the repo.

## Product Principles

1. **Career-gated learning** — Mandatory certification paths matter more than unlimited catalog browsing.
2. **Evidence of skill** — Lessons plus passed assessments (and graded assignments) prove readiness.
3. **Role clarity** — Employees learn and submit; admins assign, grade, and promote.
4. **Department realism** — Content and progression are organized by real company functions.
5. **Guidance without shortcuts** — AI Mentor helps study; it does not replace exams or admin approval.

## Accessibility & Inclusion

[Open — no explicit WCAG target found in repo.] Default expectation for an enterprise internal tool: keyboard-usable navigation, readable contrast, and labels on interactive controls; confirm standard with stakeholders later.
