/** How learner assignment detail shows submission feedback (review vs auto-check). */
export function formatLearnerSubmissionFeedback(params: {
  status: string;
  feedback: string | null | undefined;
  score: number | null | undefined;
  maxScore: number;
}): string | null {
  const text = params.feedback?.trim();
  if (!text) return null;

  if (params.status === "rejected") {
    return text;
  }

  if (params.score != null && (params.status === "graded" || params.status === "approved")) {
    return `${text}\n\nScore: ${params.score}/${params.maxScore}`;
  }

  if (params.score != null && params.status === "submitted") {
    return `${text}\n\nAuto/score: ${params.score}/${params.maxScore}`;
  }

  return text;
}

/** Fields applied when an admin rejects a submission (for tests and server action). */
export function rejectedSubmissionReviewPatch(reason: string, reviewedAt: Date) {
  return {
    status: "rejected" as const,
    feedback: reason,
    score: null,
    gradedAt: reviewedAt,
  };
}
