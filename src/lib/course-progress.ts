/**
 * Pure course progress. No DB, no UI.
 * Items = current lessons + one required assessment (if any). Equal weight.
 */

export type CourseProgressStatus =
  | "not_started"
  | "in_progress"
  | "content_complete"
  | "completed";

export type CourseProgressNextAction = {
  type: "lesson" | "assessment" | "none";
  id: string | null;
};

export type CourseProgressLesson = {
  id: string;
};

export type CourseProgressAssessment = {
  id: string;
  required: boolean;
  passed: boolean;
};

export type CourseProgressInput = {
  lessons: CourseProgressLesson[];
  completedLessonIds: Iterable<string>;
  assessment?: CourseProgressAssessment | null;
};

export type CourseProgressResult = {
  percent: number;
  status: CourseProgressStatus;
  nextAction: CourseProgressNextAction;
};

function uniqueLessons(lessons: CourseProgressLesson[]): CourseProgressLesson[] {
  const seen = new Set<string>();
  const out: CourseProgressLesson[] = [];
  for (const lesson of lessons) {
    if (!lesson?.id || seen.has(lesson.id)) continue;
    seen.add(lesson.id);
    out.push(lesson);
  }
  return out;
}

function none(): CourseProgressNextAction {
  return { type: "none", id: null };
}

export function courseProgress(input: CourseProgressInput): CourseProgressResult {
  const lessons = uniqueLessons(input.lessons ?? []);
  const completed = new Set(input.completedLessonIds ?? []);
  const completedCount = lessons.filter((l) => completed.has(l.id)).length;
  const assessment = input.assessment?.required ? input.assessment : null;
  const assessmentItem = assessment ? 1 : 0;
  const assessmentDone = assessment?.passed ? 1 : 0;
  const total = lessons.length + assessmentItem;

  if (total === 0) {
    return { percent: 0, status: "not_started", nextAction: none() };
  }

  const percent = Math.round(((completedCount + assessmentDone) / total) * 100);
  const allLessonsDone = completedCount === lessons.length;

  if (allLessonsDone && (!assessment || assessment.passed)) {
    return { percent, status: "completed", nextAction: none() };
  }

  if (allLessonsDone && assessment && !assessment.passed) {
    return {
      percent,
      status: "content_complete",
      nextAction: { type: "assessment", id: assessment.id || null },
    };
  }

  const nextLesson = lessons.find((l) => !completed.has(l.id));
  const status: CourseProgressStatus =
    completedCount > 0 || assessmentDone > 0 ? "in_progress" : "not_started";

  return {
    percent,
    status,
    nextAction: nextLesson
      ? { type: "lesson", id: nextLesson.id }
      : none(),
  };
}

/** in_progress + waiting on the knowledge check. */
export function isActiveCourseStatus(status: string | null | undefined): boolean {
  return status === "in_progress" || status === "content_complete";
}

export function courseResumePath(
  slug: string | undefined,
  courseId: string,
  nextAction: CourseProgressNextAction | undefined
): string {
  if (nextAction?.type === "assessment" && nextAction.id) {
    return `/dashboard/assessments/${nextAction.id}`;
  }
  const base = `/dashboard/courses/${slug ?? courseId}`;
  if (nextAction?.type === "lesson" && nextAction.id) {
    return `${base}/lessons/${nextAction.id}`;
  }
  return base;
}

export function courseCtaLabel(status: string | null | undefined): string {
  if (status === "completed") return "Review";
  if (status === "content_complete") return "Take assessment";
  if (status === "in_progress") return "Continue";
  return "Start course";
}
