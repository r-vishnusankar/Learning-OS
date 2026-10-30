import { toPlainTextComment } from "../src/lib/plain-text";
import { reviewSubmissionSchema } from "../src/validators/certification";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function run(): void {
  assert(toPlainTextComment("  Fix the tests  ") === "Fix the tests", "trim");
  assert(toPlainTextComment("<b>no html</b>") === "bno html/b", "strip angle brackets");
  assert(toPlainTextComment("a".repeat(1200)).length === 1000, "cap at 1000");
  assert(toPlainTextComment("<>") === "", "markup-only becomes empty");
  assert(toPlainTextComment("line1\nline2") === "line1\nline2", "newlines kept");

  const missing = reviewSubmissionSchema.safeParse({
    submissionId: "s1",
    status: "rejected",
  });
  assert(!missing.success, "reject without comment fails");

  const blank = reviewSubmissionSchema.safeParse({
    submissionId: "s1",
    status: "rejected",
    feedback: "   ",
  });
  assert(!blank.success, "reject whitespace-only fails");

  const tooLong = reviewSubmissionSchema.safeParse({
    submissionId: "s1",
    status: "rejected",
    feedback: "x".repeat(1001),
  });
  assert(!tooLong.success, "reject over 1000 fails");

  const okReject = reviewSubmissionSchema.safeParse({
    submissionId: "s1",
    status: "rejected",
    feedback: "Please add screenshots.",
  });
  assert(okReject.success, "reject with comment passes");

  const approve = reviewSubmissionSchema.safeParse({
    submissionId: "s1",
    status: "approved",
  });
  assert(approve.success, "approve without comment still allowed");

  const grade = reviewSubmissionSchema.safeParse({
    submissionId: "s1",
    status: "graded",
    score: 80,
    feedback: "Graded by instructor",
  });
  assert(grade.success, "grade path unchanged");
}

run();
console.log("test-reject-assignment: all assertions passed");
