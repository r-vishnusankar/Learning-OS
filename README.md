# Nexus — Enterprise Learning Platform

Internal enterprise learning & certification dashboard built with Next.js App Router.

## Stack

- Next.js (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Auth.js (Microsoft Entra SSO) + Neon Postgres + Drizzle ORM
- Framer Motion, Lucide React, Recharts
- TanStack Query, Zustand, React Hook Form-ready (Zod)
- next-themes, Sonner

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | Random secret — `openssl rand -base64 32` |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | Azure app registration client ID |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | Azure client secret |
| `AUTH_MICROSOFT_ENTRA_ID_ISSUER` | `https://login.microsoftonline.com/{tenant-id}/v2.0` |

### 3. Set up Neon

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string into `DATABASE_URL`
3. Push the schema and seed departments:

```bash
npm run db:push
npm run db:seed
```

### 4. Set up Microsoft Entra ID (Azure AD)

1. In [Azure Portal](https://portal.azure.com) → **App registrations** → **New registration**
2. Name: `Nexus Learning OS`
3. Redirect URI (Web): `http://localhost:3000/api/auth/callback/microsoft-entra-id`
4. Copy **Application (client) ID** → `AUTH_MICROSOFT_ENTRA_ID_ID`
5. Create a **Client secret** → `AUTH_MICROSOFT_ENTRA_ID_SECRET`
6. Copy **Directory (tenant) ID** → build issuer: `https://login.microsoftonline.com/{tenant-id}/v2.0`

For production, add your deployed URL as an additional redirect URI.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — unauthenticated users go to `/login`.

### Temporary dev login

Until company Microsoft Entra ID is configured, use:

| Field | Value |
|-------|-------|
| Email | `demo@nexus.local` |
| Password | `nexus123` |

Override via `DEV_LOGIN_EMAIL` and `DEV_LOGIN_PASSWORD` in `.env.local`. Microsoft SSO appears automatically once Entra env vars are set.

After sign-in, users are synced to Neon and redirected to `/dashboard`.

## Database commands

| Command | Description |
|---------|-------------|
| `npm run db:push` | Push schema to Neon |
| `npm run db:generate` | Generate SQL migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed department reference data |

## Key routes

| Route | Description |
|-------|-------------|
| `/login` | Microsoft SSO sign-in |
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
  app/
    api/auth/        # Auth.js handlers
    dashboard/       # App Router pages
    login/           # SSO sign-in
  auth.ts            # Auth.js + Entra + Drizzle adapter
  proxy.ts           # Route protection (Next.js 16)
  db/                # Drizzle schema + Neon client
  lib/profile.ts     # User profile sync on sign-in
  components/        # ui, layout, cards, charts, shared
  data/mock.ts       # Mock learning data (courses, assessments, etc.)
  services/api.ts    # Service layer — getCurrentUser from Neon; rest mocked
  store/             # Zustand UI state
  types/             # Shared TypeScript types
```

**Auth flow:** Microsoft Entra → Auth.js → Neon (`user`, `account`, `profile` tables). Dashboard routes are protected via `src/proxy.ts`. Course/assessment content still uses mock data until Phase 2.
