import {
  courseCtaLabel,
  courseProgress,
  courseResumePath,
  isActiveCourseStatus,
  remainingLessonTime,
} from "../src/lib/course-progress";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

const four = [
  { id: "l1" },
  { id: "l2" },
  { id: "l3" },
  { id: "l4" },
];

function run(): void {
  const empty = courseProgress({ lessons: [], completedLessonIds: [] });
  assert(empty.percent === 0, "0 lessons: percent 0");
  assert(empty.status === "not_started", "0 lessons: not_started");
  assert(empty.nextAction.type === "none", "0 lessons: no next action");

  const noAssessment = courseProgress({
    lessons: four,
    completedLessonIds: ["l1", "l2"],
  });
  assert(noAssessment.percent === 50, "no assessment 2/4 = 50");
  assert(noAssessment.status === "in_progress", "no assessment partial = in_progress");
  assert(noAssessment.nextAction.type === "lesson", "no assessment next is lesson");
  assert(noAssessment.nextAction.id === "l3", "no assessment next is first incomplete");

  const noAssessmentDone = courseProgress({
    lessons: four,
    completedLessonIds: ["l1", "l2", "l3", "l4"],
  });
  assert(noAssessmentDone.percent === 100, "no assessment all lessons = 100");
  assert(noAssessmentDone.status === "completed", "no assessment all lessons = completed");
  assert(noAssessmentDone.nextAction.type === "none", "no assessment complete has no next");

  const exam = { id: "a1", required: true, passed: false };
  const fourPlusOnePending = courseProgress({
    lessons: four,
    completedLessonIds: ["l1", "l2", "l3", "l4"],
    assessment: exam,
  });
  assert(fourPlusOnePending.percent === 80, "4+1 not passed = 80");
  assert(fourPlusOnePending.status === "content_complete", "4+1 not passed = content_complete");
  assert(fourPlusOnePending.nextAction.type === "assessment", "4+1 next is assessment");
  assert(fourPlusOnePending.nextAction.id === "a1", "4+1 next id is assessment");

  const fourPlusOnePassed = courseProgress({
    lessons: four,
    completedLessonIds: ["l1", "l2", "l3", "l4"],
    assessment: { id: "a1", required: true, passed: true },
  });
  assert(fourPlusOnePassed.percent === 100, "4+1 passed = 100");
  assert(fourPlusOnePassed.status === "completed", "4+1 passed = completed");
  assert(fourPlusOnePassed.nextAction.type === "none", "4+1 passed has no next");

  const removedLesson = courseProgress({
    lessons: [{ id: "l1" }, { id: "l2" }, { id: "l3" }],
    completedLessonIds: ["l1", "l2", "l3", "l4"],
    assessment: exam,
  });
  assert(removedLesson.percent === 75, "removed lesson: 3/4 = 75");
  assert(removedLesson.status === "content_complete", "removed lesson still content_complete");
  assert(removedLesson.nextAction.id === "a1", "removed lesson next is assessment");

  const noneComplete = courseProgress({
    lessons: four,
    completedLessonIds: [],
    assessment: exam,
  });
  assert(noneComplete.percent === 0, "none complete = 0");
  assert(noneComplete.status === "not_started", "none complete = not_started");

  const startedOnly = courseProgress({
    lessons: four,
    completedLessonIds: [],
    startedLessonIds: ["l1"],
    assessment: exam,
  });
  assert(startedOnly.percent === 0, "started only = 0%");
  assert(startedOnly.status === "in_progress", "started only = in_progress");
  assert(startedOnly.nextAction.id === "l1", "started only next is l1");

  const resumePrefersLastViewed = courseProgress({
    lessons: four,
    completedLessonIds: [],
    startedLessonIds: ["l1", "l3"],
    resumeLessonId: "l3",
    assessment: exam,
  });
  assert(resumePrefersLastViewed.nextAction.id === "l3", "resume picks last viewed lesson");
  assert(noneComplete.nextAction.type === "lesson", "none complete next is first lesson");
  assert(noneComplete.nextAction.id === "l1", "none complete next is l1");

  const orphans = courseProgress({
    lessons: four,
    completedLessonIds: ["gone", "also-gone", "l1"],
    assessment: exam,
  });
  assert(orphans.percent === 20, "orphan ids ignored: 1/5 = 20");
  assert(orphans.status === "in_progress", "orphan leftover still in_progress");
  assert(orphans.nextAction.id === "l2", "next skips completed l1");

  const examOnly = courseProgress({
    lessons: [],
    completedLessonIds: [],
    assessment: exam,
  });
  assert(examOnly.percent === 0, "exam-only pending = 0");
  assert(examOnly.status === "content_complete", "exam-only pending = content_complete");
  assert(examOnly.nextAction.type === "assessment", "exam-only next is assessment");

  const notRequired = courseProgress({
    lessons: four,
    completedLessonIds: ["l1", "l2", "l3", "l4"],
    assessment: { id: "a1", required: false, passed: false },
  });
  assert(notRequired.percent === 100, "optional assessment not in denominator");
  assert(notRequired.status === "completed", "optional assessment does not block completed");

  assert(isActiveCourseStatus("in_progress") === true, "in_progress is active");
  assert(isActiveCourseStatus("content_complete") === true, "content_complete is active");
  assert(isActiveCourseStatus("completed") === false, "completed is not active");
  assert(courseCtaLabel("content_complete") === "Take assessment", "cta for exam pending");
  assert(
    courseResumePath("git", "c1", { type: "assessment", id: "a1" }) ===
      "/dashboard/assessments/a1",
    "resume path for exam"
  );
  assert(
    courseResumePath("git", "c1", { type: "lesson", id: "l3" }) ===
      "/dashboard/courses/git/lessons/l3",
    "resume path for next lesson"
  );

  const remainingDone = remainingLessonTime([
    { completed: true, durationMinutes: 20 },
    { completed: true, durationMinutes: 10 },
  ]);
  assert(remainingDone.kind === "done", "all lessons complete → Completed");

  const remainingUnknown = remainingLessonTime([
    { completed: true, durationMinutes: 20 },
    { completed: false, durationMinutes: 0 },
  ]);
  assert(remainingUnknown.kind === "unknown", "incomplete 0-minute lessons → unknown");

  const remainingHours = remainingLessonTime([
    { completed: true, durationMinutes: 20 },
    { completed: false, durationMinutes: 15 },
    { completed: false, durationMinutes: 15 },
  ]);
  assert(remainingHours.kind === "hours", "incomplete with duration → hours");
  if (remainingHours.kind === "hours") {
    assert(remainingHours.hours === 0.5, "15+15 minutes = 0.5h remaining");
  }

  const remainingPartialUnknown = remainingLessonTime([
    { completed: false, durationMinutes: 0 },
    { completed: false, durationMinutes: 12 },
  ]);
  assert(
    remainingPartialUnknown.kind === "hours" && remainingPartialUnknown.hours === 0.2,
    "sum known incomplete minutes; 0-minute lessons do not force unknown"
  );

  const remainingEmpty = remainingLessonTime([]);
  assert(remainingEmpty.kind === "done", "no lessons → done");
}

run();
console.log("test-course-progress: all assertions passed");
