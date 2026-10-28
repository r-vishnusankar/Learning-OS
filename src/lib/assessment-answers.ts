/** Shared client/server helper: has the learner given an answer for this question. */
export function isQuestionAnswered(value: string | string[] | undefined | null): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.some((v) => v.trim().length > 0);
  return value.trim().length > 0;
}

/** 1-based question numbers in `questionOrder` that have no answer. */
export function unansweredQuestionNumbers(
  questionOrder: string[],
  answers: Record<string, string | string[]>
): number[] {
  const numbers: number[] = [];
  questionOrder.forEach((id, i) => {
    if (!isQuestionAnswered(answers[id])) numbers.push(i + 1);
  });
  return numbers;
}
