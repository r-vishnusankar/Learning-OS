# SKILLRR-RELEASE-01 – Promotion reconsideration workflow

**Status:** Backlog (post audit-corrections RC)  
**Recorded:** 2026-11-04  
**Context:** RC `fix/skillrr-audit-corrections` keeps rejected promotions as **rejected**; approve after reject is blocked by design until this work ships.

## Product decisions (release RC)

1. **P25 — Approve after rejection:** For this release, a rejected promotion **stays rejected**. Do not silently reopen eligibility. Implement reconsideration explicitly in this item.
2. **P26 — Header refresh:** RC scope is header + dropdown via fresh profile (`useCurrentUser`). Other JWT-only surfaces are out of scope for this PR.

## Requirements

- Admin can **reconsider** a rejected promotion (explicit action, not implicit re-eligibility).
- **Previous rejection history** remains visible (do not delete or overwrite rejected rows; use superseded or append-only decisions).
- **Audit trail:** who reconsidered, when, and why (align with existing `writeAuditLog` / `lms_promotion` patterns).
- **Approval after reconsideration** follows normal eligibility rules (`computePromotionEligibility` must show `eligible`, not `rejected`, only after a valid reconsideration path).

## Non-goals (v1 reconsideration TBD)

- Auto-clear rejection when course progress changes without admin action.
- Renaming existing promotion status enum values.

## Suggested implementation notes (for planning only)

- Supersede or close out `rejected` row when reconsideration opens a new cycle; latest decided row drives display (extend `applyLatestPromotionDecision` or equivalent).
- Admin UI: action on **Rejected** filter view, separate from **Eligible** approve.
- Server: idempotent reconsider + approve; block double-approve.

## Related code (RC baseline)

- `src/lib/promotion-display-status.ts`
- `src/db/queries/eligibility.ts`
- `src/services/promotions.ts`
- `src/app/dashboard/admin/promotions/page.tsx`
