import type { PromotionEligibility } from "@/db/queries/eligibility";
import type { PromotionStatus } from "@/db/schema/promotions";

export type ComputedCareerStatus = PromotionEligibility["status"];

/** Latest decided promotion row for the current level step (if any). */
export type LatestPromotionDecision = {
  status: Extract<PromotionStatus, "rejected" | "approved">;
  reason: string | null;
  decidedAt: Date | null;
} | null;

/**
 * When an admin rejected this promotion step, do not show the learner as "eligible"
 * until requirements or admin action change (re-approve path stays on eligible + approve).
 */
export function applyLatestPromotionDecision(
  computed: ComputedCareerStatus,
  latest: LatestPromotionDecision
): ComputedCareerStatus {
  if (computed === "eligible" && latest?.status === "rejected") {
    return "rejected";
  }
  return computed;
}
