import {
  countGenericPrompts,
  isGenericPrompt,
} from "../src/lib/generic-question";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function run(): void {
  assert(
    isGenericPrompt('Which statement best reflects a core concept of "Git"?') === true,
    "core-concept stem"
  );
  assert(
    isGenericPrompt(
      'True or false: Completing lessons alone (without passing this knowledge check) is enough to certify "Git" for promotion eligibility.'
    ) === true,
    "lessons-alone stem"
  );
  assert(isGenericPrompt('Which focus area belongs to "Git"?') === true, "focus-area stem");
  assert(
    isGenericPrompt('True or false: This assessment is the knowledge check for the course "Git".') ===
      true,
    "identity stem"
  );
  assert(
    isGenericPrompt('After you pass the "Git" knowledge check, what happens in the career loop?') ===
      true,
    "career-loop stem"
  );
  assert(isGenericPrompt("") === false, "empty");
  assert(
    isGenericPrompt(
      "Which consistency model does a strongly consistent distributed database typically guarantee?"
    ) === false,
    "System Design exam is not a template"
  );
  assert(
    countGenericPrompts([
      'Which statement best reflects a core concept of "Git"?',
      "Which consistency model does a strongly consistent distributed database typically guarantee?",
    ]) === 1,
    "count mixed list"
  );
}

run();
console.log("test-generic-question: all assertions passed");
