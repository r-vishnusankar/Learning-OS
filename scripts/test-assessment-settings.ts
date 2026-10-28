import {
  createAssessmentSchema,
  updateAssessmentSchema,
} from "../src/validators/assessment";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

const SAMPLE_ID = "11111111-1111-4111-8111-111111111111";

function run(): void {
  const publishOnly = updateAssessmentSchema.safeParse({
    id: SAMPLE_ID,
    publishStatus: "published",
  });
  assert(publishOnly.success, "publish-only payload is valid");
  if (publishOnly.success) {
    assert(publishOnly.data.durationMinutes === undefined, "publish must not default duration");
    assert(publishOnly.data.passingScore === undefined, "publish must not default passing score");
    assert(publishOnly.data.maxAttempts === undefined, "publish must not default max attempts");
    assert(publishOnly.data.title === undefined, "publish must not default title");
    assert(publishOnly.data.randomize === undefined, "publish must not default randomize");
  }

  const saved = updateAssessmentSchema.safeParse({
    id: SAMPLE_ID,
    durationMinutes: 45,
    passingScore: 80,
    maxAttempts: 2,
  });
  assert(saved.success, "explicit settings are valid");
  if (saved.success) {
    assert(saved.data.durationMinutes === 45, "duration 45 persists");
    assert(saved.data.passingScore === 80, "passing score 80 persists");
    assert(saved.data.maxAttempts === 2, "max attempts 2 persists");
  }

  const tooShort = updateAssessmentSchema.safeParse({ id: SAMPLE_ID, durationMinutes: 0 });
  assert(!tooShort.success, "duration 0 is rejected");

  const badPass = updateAssessmentSchema.safeParse({ id: SAMPLE_ID, passingScore: 101 });
  assert(!badPass.success, "passing score 101 is rejected");

  const oneMinute = updateAssessmentSchema.safeParse({ id: SAMPLE_ID, durationMinutes: 1 });
  assert(oneMinute.success, "duration 1 minute is allowed");

  const created = createAssessmentSchema.safeParse({
    title: "Knowledge Check",
    departmentId: "development",
  });
  assert(created.success, "create with title+department is valid");
  if (created.success) {
    assert(created.data.durationMinutes === 60, "create still defaults duration to 60");
    assert(created.data.passingScore === 70, "create still defaults passing score to 70");
    assert(created.data.maxAttempts === 3, "create still defaults max attempts to 3");
  }
}

run();
console.log("test-assessment-settings: all assertions passed");
