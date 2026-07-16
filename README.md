# Nexus — Enterprise Learning Platform

Internal enterprise learning & certification dashboard built with Next.js App Router.

## Stack

- Next.js (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Framer Motion, Lucide React, Recharts
- TanStack Query, Zustand, React Hook Form-ready (Zod)
- next-themes, Sonner

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/dashboard`.

## Key routes

| Route | Description |
|-------|-------------|
| `/dashboard` | Analytics home |
| `/dashboard/learning` | Netflix-style learning hub |
| `/dashboard/courses` | Course catalog |
| `/dashboard/courses/[id]` | Course detail + curriculum |
| `/dashboard/paths` | Learning paths |
| `/dashboard/assessments` | Assessments |
| `/dashboard/certificates` | Certificates |
| `/dashboard/skills` | Skill matrix |
| `/dashboard/leaderboard` | Rankings + achievements |
| `/dashboard/departments` | Department roadmaps |
| `/dashboard/analytics` | Reports |
| `/dashboard/admin` | Admin overview |
| `/dashboard/ai-mentor` | Full-page AI mentor |
| `/dashboard/settings` | Preferences |

## Architecture

```
src/
  app/dashboard/     # App Router pages
  components/        # ui, layout, cards, charts, shared
  data/mock.ts       # Mock API data (swap for real services later)
  store/             # Zustand UI state
  types/             # Shared TypeScript types
  constants/         # Navigation & labels
  lib/               # Utilities
```

Mock data lives in `src/data/mock.ts` and is structured for easy replacement with API services.
