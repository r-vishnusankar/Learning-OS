import { toPlainTextComment } from "@/lib/plain-text";

/** Plain-text reviewer comment for reject (trim, strip markup, max 1000). */
export function sanitizeRejectFeedback(raw: string | undefined): string {
  return toPlainTextComment(raw ?? "");
}

export type RejectSubmissionPatch = {
  status: "rejected";
  feedback: string;
  score: null;
  gradedAt: Date;
  reviewedBy: string;
  reviewedAt: Date;
};

export function buildRejectSubmissionPatch(params: {
  reason: string;
  reviewerId: string;
  reviewedAt: Date;
}): RejectSubmissionPatch {
  return {
    status: "rejected",
    feedback: params.reason,
    score: null,
    gradedAt: params.reviewedAt,
    reviewedBy: params.reviewerId,
    reviewedAt: params.reviewedAt,
  };
}

type SubmissionReviewSnapshot = {
  score: number | null;
  feedback: string | null;
  gradedAt: Date | null;
};

export type NonRejectReviewPatch = {
  status: "in_review" | "approved" | "rejected" | "graded";
  score: number | null;
  feedback: string | null | undefined;
  gradedAt: Date | null;
};

/** Approve / grade / in_review update — same fallback semantics as prior inline logic. */
export function buildNonRejectReviewPatch(params: {
  status: "in_review" | "approved" | "rejected" | "graded";
  score?: number;
  feedback?: string | null;
  submission: SubmissionReviewSnapshot;
  reviewedAt: Date;
}): NonRejectReviewPatch {
  const { status, score, feedback, submission, reviewedAt } = params;
  return {
    status,
    score: score ?? submission.score,
    feedback: feedback ?? submission.feedback,
    gradedAt:
      status === "graded" || status === "approved" ? reviewedAt : submission.gradedAt,
  };
}

export function buildAssignmentRevisionNotification(params: {
  assignmentTitle: string | null | undefined;
  assignmentId: string;
  reason: string;
}) {
  const titleLabel = params.assignmentTitle ?? "Assignment";
  return {
    title: "Assignment needs revision",
    message: `${titleLabel}: ${params.reason}`,
    type: "warning" as const,
    href: `/dashboard/assignments/${params.assignmentId}`,
  };
}

/** Resubmit payload after reject — replaces prior feedback/score when provided. */
export function buildSubmitAssignmentPayload(params: {
  content: string;
  url: string;
  submittedAt: Date;
  score: number | null;
  feedback: string | null;
}) {
  return {
    content: params.content,
    url: params.url || null,
    status: "submitted" as const,
    submittedAt: params.submittedAt,
    ...(params.score != null ? { score: params.score } : {}),
    ...(params.feedback != null ? { feedback: params.feedback } : {}),
  };
}
