# Skillrr QA backlog (deduplicated)

Consolidates overlapping tracker rows. **~28 engineering items** + **7 clarifications**. Close only with evidence per [QA_SIGNOFF_MATRIX.md](../QA_SIGNOFF_MATRIX.md).

## Consolidated work items

| ID | Tracks (legacy) | Title | Acceptance criteria |
|----|-----------------|-------|---------------------|
| **VIDEO-COMPLETE** | blocked, #55, #50 | Video end → Mark complete | On prod: watch Fireship-style YouTube to end (or within 1.5s); Mark complete enabled; `lesson_progress.completed=true` and `percentage>=100` after submit; Vimeo/HTML5 unchanged |
| **LP-ASSOC** | #22, #45 | Link course to learning path | Admin path builder: add course step, save persists, course appears on path detail for employee |
| **ADMIN-ACCESS** | #28, #53 | Admin nav / routes match profile | Non-admin JWT cannot see Admin section; `/dashboard/admin/*` redirects; role demotion reflects within one session refresh |
| **DEPT-METRICS** | #12, #13 | Department list matches hub | List `employeeCount`, `courseCount`, `avgCompletion`, `activeLearners` match hub detail for same dept (± rounding) |
| **CONTINUE-LEARNING** | #54 | Continue Learning after first view | Open any lesson (10% upsert); course appears under Continue Learning with status `in_progress` |
| **PENDING-CERTS** | blocked (certs) | Pending certificates tab | After VIDEO-COMPLETE: lessons → `content_complete` → pending cert row when assessment required |
| **ASSESS-GATE** | #44 | Assessment after lessons | After all lessons complete, next action is assessment; user can start attempt |
| **#6** | #6 | Course hours & instructor | Display matches lesson/video metadata rules (product doc) |
| **#24** | #24 | Admin invite password flow | Invitee can sign in with temp password and change password once |
| **#25** | #25 | Locked cert course list | Locked cert UI lists required courses |
| **#29** | #29 | Assessment fields persist | Admin edit assessment; reload shows saved values |
| **#34** | #34, #57 | Resume last viewed (optional) | Documented: resume = first incomplete unless last-viewed shipped |
| **#35** | #35 | Continue at 100% lessons | CTA shows Review when status `completed` |
| **#38** | #38 | Rejected promotion display | Rejected status visible admin + learner |
| **#40** | #40 | Attempt question statuses | Attempt review shows skipped/answered states |
| **#47** | #47 | Level / open-to-all on publish | Publish does not reset level or open-to-all |
| **#56** | #56 | Assessment result styling | Cosmetic pass per design |
| **#48–52** | improvements | See PRODUCT-CLARIFICATIONS + improvement backlog | P2 after P1 |

## Clarifications (product — not dev closure)

| ID | Topic |
|----|--------|
| #30–33 | Trending / Recommended / dashboard cards |
| #37 | Gamification copy vs behavior |
| #39 | Certificate naming |
| #46 | Path vs course enrollment rules |

Details: [SKILLRR-PRODUCT-CLARIFICATIONS.md](./SKILLRR-PRODUCT-CLARIFICATIONS.md).

## Dependency order

1. VIDEO-COMPLETE → PENDING-CERTS, ASSESS-GATE  
2. CONTINUE-LEARNING (independent)  
3. DEPT-METRICS, ADMIN-ACCESS  
4. Clarifications → remaining UX copy bugs
