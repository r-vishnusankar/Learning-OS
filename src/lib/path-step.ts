export type PathStepCta = "open_course" | "take_exam" | "unlinked" | "unavailable";

export type PathStepPresentation = {
  title: string;
  href: string | null;
  cta: PathStepCta;
  linked: boolean;
};

export function presentPathStep(input: {
  title: string;
  stepType: "course" | "assessment";
  courseId: string | null;
  assessmentId: string | null;
  course: { slug: string; title: string; publishStatus: string } | null;
  assessment: { id: string; title: string; publishStatus: string } | null;
}): PathStepPresentation {
  if (input.stepType === "assessment" || input.assessmentId) {
    if (!input.assessmentId) {
      return {
        title: input.title || "Unlinked item",
        href: null,
        cta: "unlinked",
        linked: false,
      };
    }
    if (!input.assessment || input.assessment.publishStatus !== "published") {
      return {
        title: input.assessment?.title || input.title || "Assessment",
        href: null,
        cta: "unavailable",
        linked: Boolean(input.assessmentId),
      };
    }
    return {
      title: input.assessment.title,
      href: `/dashboard/assessments/${input.assessment.id}`,
      cta: "take_exam",
      linked: true,
    };
  }

  if (!input.courseId) {
    return {
      title: input.title || "Unlinked item",
      href: null,
      cta: "unlinked",
      linked: false,
    };
  }

  if (!input.course || input.course.publishStatus !== "published") {
    return {
      title: input.course?.title || input.title || "Course",
      href: null,
      cta: "unavailable",
      linked: true,
    };
  }

  return {
    title: input.course.title,
    href: `/dashboard/courses/${input.course.slug}`,
    cta: "open_course",
    linked: true,
  };
}
