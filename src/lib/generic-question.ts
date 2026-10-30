/**
 * Detects Skillrr's seeded title-template knowledge-check stems.
 * Used by admin UI and read-only audit scripts. Safe on client and server.
 */

export const GENERIC_QUESTION_STEMS = [
  "Which statement best reflects a core concept of",
  "Completing lessons alone (without passing this knowledge check)",
  "Which focus area belongs to",
  "This assessment is the knowledge check for the course",
  "what happens in the career loop",
  "Unrelated department onboarding trivia",
  "Memorize trivia unrelated to the course",
  "Option A, Option B, Option C, Option D",
] as const;

export function isGenericPrompt(prompt: string): boolean {
  if (!prompt) return false;
  return GENERIC_QUESTION_STEMS.some((stem) => prompt.includes(stem));
}

export function countGenericPrompts(prompts: readonly string[]): number {
  return prompts.filter((p) => isGenericPrompt(p)).length;
}
