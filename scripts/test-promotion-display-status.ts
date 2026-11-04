import { applyLatestPromotionDecision } from "../src/lib/promotion-display-status";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function run(): void {
  assert(
    applyLatestPromotionDecision("eligible", { status: "rejected", reason: "x", decidedAt: null }) ===
      "rejected",
    "eligible + latest rejected → rejected"
  );
  assert(
    applyLatestPromotionDecision("in_progress", { status: "rejected", reason: "x", decidedAt: null }) ===
      "in_progress",
    "in_progress stays in_progress"
  );
  assert(
    applyLatestPromotionDecision("eligible", null) === "eligible",
    "no decision keeps eligible"
  );
  assert(
    applyLatestPromotionDecision("eligible", { status: "approved", reason: null, decidedAt: null }) ===
      "eligible",
    "approved decision does not override computed eligible"
  );
}

run();
console.log("test-promotion-display-status: all assertions passed");
