import { isActiveCourseStatus, type CourseProgressStatus } from "@/lib/course-progress";

export const ACTIVE_LEARNER_WINDOW_DAYS = 30;

export type DepartmentProgressCell = {
  percent: number;
  status: CourseProgressStatus;
};

export function rollupDepartmentCells(cells: DepartmentProgressCell[]): {
  avgCompletion: number;
  completedCount: number;
  inProgressCount: number;
  enrollmentRatePct: number | null;
} {
  if (cells.length === 0) {
    return {
      avgCompletion: 0,
      completedCount: 0,
      inProgressCount: 0,
      enrollmentRatePct: null,
    };
  }

  const sum = cells.reduce((s, c) => s + c.percent, 0);
  const started = cells.filter((c) => c.status !== "not_started").length;
  return {
    avgCompletion: Math.round(sum / cells.length),
    completedCount: cells.filter((c) => c.status === "completed").length,
    inProgressCount: cells.filter((c) => isActiveCourseStatus(c.status)).length,
    enrollmentRatePct: Math.round((started / cells.length) * 100),
  };
}

export function pickTopXp<T extends { xp: number; name: string; userId: string }>(
  members: T[]
): T | null {
  if (members.length === 0) return null;
  return [...members].sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    const byName = a.name.localeCompare(b.name);
    if (byName !== 0) return byName;
    return a.userId.localeCompare(b.userId);
  })[0]!;
}
