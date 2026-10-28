import {
  isQuestionAnswered,
  unansweredQuestionNumbers,
} from "../src/lib/assessment-answers";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function run(): void {
  assert(isQuestionAnswered("A") === true, "string answer");
  assert(isQuestionAnswered("  ") === false, "whitespace is unanswered");
  assert(isQuestionAnswered("") === false, "empty string");
  assert(isQuestionAnswered(["A"]) === true, "multi-select");
  assert(isQuestionAnswered([]) === false, "empty multi-select");
  assert(isQuestionAnswered(undefined) === false, "missing");

  const order = ["q1", "q2", "q3"];
  assert(
    unansweredQuestionNumbers(order, { q1: "A" }).join(",") === "2,3",
    "unanswered numbers are 1-based"
  );
  assert(unansweredQuestionNumbers(order, { q1: "A", q2: "B", q3: "C" }).length === 0, "all answered");
}

run();
console.log("test-assessment-answers: all assertions passed");
