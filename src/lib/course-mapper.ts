import type { Course, CourseModule, CourseStatus, Lesson } from "@/types";
import type { LessonContentType } from "@/db/schema/courses";

type DbCourseRow = {
  course: {
    id: string;
    slug: string;
    title: string;
    description: string;
    thumbnailUrl: string | null;
    departmentId: string;
    level: Course["level"];
    difficulty: Course["difficulty"];
    learningCategory: Course["learningCategory"];
    durationMinutes: number;
    publishStatus: string;
    xpReward: number;
    tags: string[];
    enrolledCount: number;
    rating: number;
    isTrending: boolean;
    updatedAt: Date;
  };
  instructor: {
    id: string;
    name: string;
    avatar: string | null;
    title: string;
    bio: string | null;
  } | null;
  category?: { name: string } | null;
  progress?: number;
};

type DbModule = {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Array<{
    id: string;
    title: string;
    type: LessonContentType;
    durationMinutes: number;
    orderIndex: number;
    isPreview: boolean;
  }>;
};

function mapLessonType(type: LessonContentType): Lesson["type"] {
  if (type === "video") return "video";
  return "reading";
}

function deriveCourseStatus(progress: number): CourseStatus {
  if (progress >= 100) return "completed";
  if (progress > 0) return "in_progress";
  return "not_started";
}

export function mapCourseToUi(
  row: DbCourseRow,
  modules: DbModule[] = [],
  progressMap: Record<string, { completed: boolean }> = {},
  isSaved = false
): Course {
  const progress = row.progress ?? 0;
  let lessonIndex = 0;

  const mappedModules: CourseModule[] = modules.map((mod) => {
    const mappedLessons: Lesson[] = mod.lessons.map((lesson) => {
      lessonIndex += 1;
      const prog = progressMap[lesson.id];
      const completed = prog?.completed ?? false;
      // Lock only if a prior lesson exists and that prior one is not completed
      const priorId =
        lessonIndex > 1
          ? modules
              .flatMap((m) => m.lessons)
              .at(lessonIndex - 2)?.id
          : undefined;
      const priorDone = priorId ? Boolean(progressMap[priorId]?.completed) : true;
      const locked = !lesson.isPreview && lessonIndex > 1 && !priorDone && !completed;

      return {
        id: lesson.id,
        title: lesson.title,
        type: mapLessonType(lesson.type),
        durationMinutes: lesson.durationMinutes,
        completed,
        locked,
      };
    });

    return {
      id: mod.id,
      title: mod.title,
      durationMinutes: mod.lessons.reduce((sum, l) => sum + l.durationMinutes, 0),
      lessons: mappedLessons,
      completed: mappedLessons.length > 0 && mappedLessons.every((l) => l.completed),
    };
  });

  const lessonsCount = modules.reduce((sum, m) => sum + m.lessons.length, 0);

  // Compute duration from real lesson data when available; fall back to stored
  // column only when no modules were loaded (lean list endpoints).
  // Never floor at 1h — 0 means "unknown" and renders as "—".
  const computedMinutes =
    modules.length > 0
      ? modules.reduce((sum, m) => sum + m.lessons.reduce((s, l) => s + l.durationMinutes, 0), 0)
      : row.course.durationMinutes;
  const durationHours = computedMinutes / 60;

  return {
    id: row.course.id,
    slug: row.course.slug,
    title: row.course.title,
    description: row.course.description,
    thumbnail: row.course.thumbnailUrl ?? "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
    department: row.course.departmentId as Course["department"],
    level: row.course.level,
    difficulty: row.course.difficulty,
    learningCategory: row.course.learningCategory ?? "role",
    instructor: {
      id: row.instructor?.id ?? "unknown",
      name: row.instructor?.name ?? "Instructor",
      avatar: row.instructor?.avatar ?? "https://api.dicebear.com/9.x/avataaars/svg?seed=Instructor",
      title: row.instructor?.title ?? "Educator",
      bio: row.instructor?.bio ?? "",
    },
    durationHours,
    lessonsCount,
    enrolledCount: row.course.enrolledCount,
    rating: row.course.rating / 10,
    progress,
    status: deriveCourseStatus(progress),
    tags: row.course.tags,
    category: row.category?.name ?? "General",
    xpReward: row.course.xpReward,
    isSaved,
    isTrending: row.course.isTrending,
    lastAccessed: row.course.updatedAt.toISOString(),
    modules: mappedModules,
  };
}

export type AdminCourseListItem = DbCourseRow["course"] & {
  instructorName: string | null;
  lessonsCount: number;
};
