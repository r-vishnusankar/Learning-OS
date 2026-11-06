/**
 * Pure-function tests for assignment review/display helpers.
 * Does NOT exercise certification service or database integration.
 */
import { formatLearnerSubmissionFeedback } from "../src/lib/assignment-feedback-display";
import {
  buildAssignmentRevisionNotification,
  buildNonRejectReviewPatch,
  buildRejectSubmissionPatch,
  buildSubmitAssignmentPayload,
  sanitizeRejectFeedback,
} from "../src/lib/assignment-review";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function runDisplayTests(): void {
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
}

function runReviewBuilderTests(): void {
  const adminReason = "Please revise this submission by adding the missing implementation details.";
  const at = new Date("2026-11-04T12:00:00Z");
  const reviewerId = "reviewer-uuid";

  const rejectPatch = buildRejectSubmissionPatch({
    reason: adminReason,
    reviewerId,
    reviewedAt: at,
  });
  assert(rejectPatch.status === "rejected", "reject patch status");
  assert(rejectPatch.feedback === adminReason, "reject patch feedback");
  assert(rejectPatch.score === null, "reject patch clears score");
  assert(rejectPatch.gradedAt === at, "reject patch gradedAt");
  assert(rejectPatch.reviewedBy === reviewerId, "reject patch reviewedBy");
  assert(rejectPatch.reviewedAt === at, "reject patch reviewedAt");

  const submission = {
    score: 70,
    feedback: "Old feedback",
    gradedAt: new Date("2026-01-01T00:00:00Z"),
  };

  const approved = buildNonRejectReviewPatch({
    status: "approved",
    score: 90,
    feedback: "Looks good",
    submission,
    reviewedAt: at,
  });
  assert(approved.status === "approved", "approved status");
  assert(approved.score === 90, "approved uses provided score");
  assert(approved.feedback === "Looks good", "approved feedback");
  assert(approved.gradedAt === at, "approved sets gradedAt");

  const inReview = buildNonRejectReviewPatch({
    status: "in_review",
    submission,
    reviewedAt: at,
  });
  assert(inReview.score === 70, "in_review falls back to submission score");
  assert(inReview.feedback === "Old feedback", "in_review falls back to submission feedback");
  assert(inReview.gradedAt === submission.gradedAt, "in_review keeps prior gradedAt");

  const notice = buildAssignmentRevisionNotification({
    assignmentTitle: "Homework 1",
    assignmentId: "asg-1",
    reason: adminReason,
  });
  assert(notice.title === "Assignment needs revision", "notification title");
  assert(notice.type === "warning", "notification type");
  assert(notice.href === "/dashboard/assignments/asg-1", "notification href");
  assert(notice.message === `Homework 1: ${adminReason}`, "notification message");

  const noticeDefaultTitle = buildAssignmentRevisionNotification({
    assignmentTitle: undefined,
    assignmentId: "asg-2",
    reason: "Fix it",
  });
  assert(noticeDefaultTitle.message === "Assignment: Fix it", "notification default title label");

  assert(
    sanitizeRejectFeedback("  <b>hi</b>  ") === sanitizeRejectFeedback("<b>hi</b>"),
    "sanitizeRejectFeedback strips markup"
  );

  const submitPayload = buildSubmitAssignmentPayload({
    content: "answer",
    url: "",
    submittedAt: at,
    score: null,
    feedback: "auto",
  });
  assert(submitPayload.status === "submitted", "submit status");
  assert(submitPayload.url === null, "empty url becomes null");
  assert(submitPayload.content === "answer", "submit content");
  assert(!("score" in submitPayload), "null score omitted from payload");
  assert(submitPayload.feedback === "auto", "submit feedback included");

  const withScore = buildSubmitAssignmentPayload({
    content: "x",
    url: "https://example.com",
    submittedAt: at,
    score: 100,
    feedback: null,
  });
  assert(withScore.score === 100, "non-null score included");
  assert(!("feedback" in withScore), "null feedback omitted");
}

runDisplayTests();
runReviewBuilderTests();
console.log("test-assignment-reviewer-feedback: all pure-function assertions passed");
