import { presentPathStep } from "../src/lib/path-step";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function run(): void {
  const linked = presentPathStep({
    title: "Free text",
    stepType: "course",
    courseId: "c1",
    assessmentId: null,
    course: { slug: "git", title: "Git Basics", publishStatus: "published" },
    assessment: null,
  });
  assert(linked.cta === "open_course", "published course opens");
  assert(linked.href === "/dashboard/courses/git", "course href from slug");
  assert(linked.title === "Git Basics", "title from course not free text");

  const legacy = presentPathStep({
    title: "Exploratory Testing Basics",
    stepType: "course",
    courseId: null,
    assessmentId: null,
    course: null,
    assessment: null,
  });
  assert(legacy.cta === "unlinked", "legacy title-only is unlinked");
  assert(legacy.href === null, "legacy has no href");

  const unpublished = presentPathStep({
    title: "Hidden",
    stepType: "course",
    courseId: "c2",
    assessmentId: null,
    course: { slug: "hidden", title: "Hidden", publishStatus: "draft" },
    assessment: null,
  });
  assert(unpublished.cta === "unavailable", "unpublished course is unavailable");
  assert(unpublished.href === null, "unpublished has no learner href");

  const deleted = presentPathStep({
    title: "Gone",
    stepType: "course",
    courseId: "c3",
    assessmentId: null,
    course: null,
    assessment: null,
  });
  assert(deleted.cta === "unavailable", "missing course (deleted) is unavailable");

  const exam = presentPathStep({
    title: "Exam",
    stepType: "assessment",
    courseId: null,
    assessmentId: "a1",
    course: null,
    assessment: { id: "a1", title: "Knowledge Check", publishStatus: "published" },
  });
  assert(exam.cta === "take_exam" && exam.href === "/dashboard/assessments/a1", "published exam");
}

run();
console.log("test-path-step: all assertions passed");
