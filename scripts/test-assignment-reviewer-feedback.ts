import {
  formatLearnerSubmissionFeedback,
  rejectedSubmissionReviewPatch,
} from "../src/lib/assignment-feedback-display";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function run(): void {
  const adminReason = "Please revise this submission by adding the missing implementation details.";
  assert(
    formatLearnerSubmissionFeedback({
      status: "rejected",
      feedback: adminReason,
      score: 100,
      maxScore: 100,
    }) === adminReason,
    "rejected shows reviewer comment only (no auto score suffix)"
  );

  assert(
    formatLearnerSubmissionFeedback({
      status: "rejected",
      feedback: adminReason,
      score: null,
      maxScore: 100,
    }) === adminReason,
    "rejected with null score"
  );

  const autoSubmitted = formatLearnerSubmissionFeedback({
    status: "submitted",
    feedback: "Automated checks: 3/3 passed.",
    score: 100,
    maxScore: 100,
  });
  assert(
    autoSubmitted?.includes("Auto/score: 100/100") === true,
    "submitted keeps auto score line"
  );

  const graded = formatLearnerSubmissionFeedback({
    status: "graded",
    feedback: "Graded by instructor",
    score: 85,
    maxScore: 100,
  });
  assert(graded?.includes("Score: 85/100") === true, "graded shows score line");

  const at = new Date("2026-11-04T12:00:00Z");
  const patch = rejectedSubmissionReviewPatch(adminReason, at);
  assert(patch.status === "rejected", "patch status");
  assert(patch.feedback === adminReason, "patch feedback");
  assert(patch.score === null, "patch clears score");
  assert(patch.gradedAt === at, "patch gradedAt");
}

run();
console.log("test-assignment-reviewer-feedback: all assertions passed");
