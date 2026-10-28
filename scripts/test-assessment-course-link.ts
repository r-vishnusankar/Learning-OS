import { createAssessmentSchema, updateAssessmentSchema } from "../src/validators/assessment";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

const SAMPLE_ID = "11111111-1111-4111-8111-111111111111";
const COURSE_ID = "22222222-2222-4222-8222-222222222222";

function run(): void {
  const unlinked = createAssessmentSchema.safeParse({
    title: "Standalone quiz",
    departmentId: "development",
    courseId: null,
  });
  assert(unlinked.success, "unlinked create is valid");

  const linked = createAssessmentSchema.safeParse({
    title: "Course knowledge check",
    departmentId: "qa",
    courseId: COURSE_ID,
  });
  assert(linked.success, "linked create is valid");
  if (linked.success) assert(linked.data.courseId === COURSE_ID, "courseId is stored");

  const unlink = updateAssessmentSchema.safeParse({
    id: SAMPLE_ID,
    courseId: null,
  });
  assert(unlink.success, "unlink (courseId null) is valid");
  if (unlink.success) assert(unlink.data.courseId === null, "unlink writes null");

  const relink = updateAssessmentSchema.safeParse({
    id: SAMPLE_ID,
    courseId: COURSE_ID,
  });
  assert(relink.success, "relink is valid");
}

run();
console.log("test-assessment-course-link: all assertions passed");
