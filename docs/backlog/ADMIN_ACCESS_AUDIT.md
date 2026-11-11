# Admin access audit (#28 / ADMIN-ACCESS)

## Findings

| Layer | Enforcement | Gap (before fix) |
|-------|-------------|------------------|
| `src/app/dashboard/admin/layout.tsx` | Server redirect unless `admin \| instructor \| department_head` | OK |
| `src/proxy.ts` | Login only | No role check (by design) |
| JWT (`src/auth.ts`) | Role copied at sign-in | **Stale** after profile role change |
| Sidebar (`sidebar.tsx`) | `canAccessAdmin(me?.role ?? session?.user?.role)` | **Stale JWT** could show Admin nav |
| Command palette | `canAccessAdmin(role)` from session hook | Same risk if role from session |

## Fixes applied

1. **JWT refresh:** On every token refresh (`token.id` without new `user`), re-read `profiles` and update `role`, `department`, designation, level, xp, coins.
2. **Sidebar:** Admin section uses **`me?.role` only** (from `fetchCurrentUserAction` / DB), not JWT fallback.

## Manual verification

1. Demote test user from `admin` → `employee` in DB (or admin UI).
2. Without sign-out, navigate dashboard — **Admin** nav should disappear within one navigation (me query + refreshed JWT on next auth request).
3. Hit `/dashboard/admin` directly — redirect to `/dashboard`.
4. Promote user — Admin nav appears after me refetch / new session.

Record in [QA_SIGNOFF_MATRIX.md](../QA_SIGNOFF_MATRIX.md).
