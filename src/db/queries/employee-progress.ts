import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  courses,
  lessonProgress,
  lessons,
  modules,
  profiles,
  users,
} from "@/db/schema";
import {
  listAssignmentsForUser,
  type LearnerAssignmentStatus,
} from "@/db/queries/course-assignments";
import type { DepartmentId, LearningCategory, LearningLevel } from "@/types";

export type EmployeeProgressCourse = Awaited<
  ReturnType<typeof listAssignmentsForUser>
>[number] & {
  completedAt: string | null;
};

export type EmployeeProgressTimelineItem = {
  at: string;
  type: "lesson_completed" | "course_assigned" | "course_completed" | "lesson_viewed";
  title: string;
  detail?: string;
  courseId?: string;
};

export type CategoryProgress = {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  avgProgress: number;
};

export type EmployeeProgressPayload = {
  employee: {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
    department: DepartmentId;
    designation: string;
    level: LearningLevel;
    status: string;
    joinDate: string;
    experienceYears: number;
    xp: number;
    streak: number;
    skillScore: number;
  };
  manager: {
    id: string;
    name: string;
    email: string;
  } | null;
  summary: {
    overallCompletionPct: number;
    assigned: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
    dueSoon: number;
    mandatory: number;
    role: CategoryProgress;
    goal: CategoryProgress;
  };
  courses: EmployeeProgressCourse[];
  completionHistory: Array<{
    courseId: string;
    title: string;
    learningCategory: LearningCategory;
    completedAt: string;
    progress: number;
  }>;
  upcomingDue: EmployeeProgressCourse[];
  overdueItems: EmployeeProgressCourse[];
  timeline: EmployeeProgressTimelineItem[];
  chartStatus: Array<{ label: string; value: number }>;
  chartCategory: Array<{ label: string; value: number; secondary?: number }>;
};

export type EmployeeProgressListItem = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  image: string | null;
  department: DepartmentId;
  designation: string;
  level: LearningLevel;
  status: string;
  joinDate: string;
  assigned: number;
  completed: number;
  overdue: number;
  inProgress: number;
  pending: number;
  overallCompletionPct: number;
};

function emptyCategory(): CategoryProgress {
  return {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    overdue: 0,
    avgProgress: 0,
  };
}

function rollupCategory(
  items: Array<{ status: LearnerAssignmentStatus; progress: number }>
): CategoryProgress {
  if (items.length === 0) return emptyCategory();
  const completed = items.filter((i) => i.status === "completed").length;
  const inProgress = items.filter((i) => i.status === "in_progress").length;
  const overdue = items.filter((i) => i.status === "overdue").length;
  const pending = items.filter(
    (i) => i.status === "not_started" || i.status === "upcoming"
  ).length;
  const avgProgress = Math.round(
    items.reduce((sum, i) => sum + i.progress, 0) / items.length
  );
  return {
    total: items.length,
    completed,
    inProgress,
    pending,
    overdue,
    avgProgress,
  };
}

async function getCourseCompletionDates(userId: string, courseIds: string[]) {
  const result = new Map<string, string | null>();
  if (courseIds.length === 0) return result;

  const db = getDb();
  const lessonRows = await db
    .select({
      courseId: modules.courseId,
      lessonId: lessons.id,
    })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .where(inArray(modules.courseId, courseIds));

  const lessonsByCourse = new Map<string, string[]>();
  for (const row of lessonRows) {
    const list = lessonsByCourse.get(row.courseId) ?? [];
    list.push(row.lessonId);
    lessonsByCourse.set(row.courseId, list);
  }

  const allLessonIds = lessonRows.map((r) => r.lessonId);
  const progressRows =
    allLessonIds.length === 0
      ? []
      : await db
          .select({
            lessonId: lessonProgress.lessonId,
            completed: lessonProgress.completed,
            completedAt: lessonProgress.completedAt,
          })
          .from(lessonProgress)
          .where(
            and(
              eq(lessonProgress.userId, userId),
              inArray(lessonProgress.lessonId, allLessonIds)
            )
          );

  const progressByLesson = new Map(
    progressRows.map((p) => [p.lessonId, p] as const)
  );

  for (const courseId of courseIds) {
    const ids = lessonsByCourse.get(courseId) ?? [];
    if (ids.length === 0) {
      result.set(courseId, null);
      continue;
    }
    const done = ids.every((id) => progressByLesson.get(id)?.completed);
    if (!done) {
      result.set(courseId, null);
      continue;
    }
    let latest: Date | null = null;
    for (const id of ids) {
      const at = progressByLesson.get(id)?.completedAt;
      if (at && (!latest || at > latest)) latest = at;
    }
    result.set(courseId, latest?.toISOString() ?? null);
  }

  return result;
}

async function getLearningTimeline(userId: string, limit = 40) {
  const db = getDb();
  const rows = await db
    .select({
      lessonId: lessonProgress.lessonId,
      completed: lessonProgress.completed,
      completedAt: lessonProgress.completedAt,
      lastViewedAt: lessonProgress.lastViewedAt,
      lessonTitle: lessons.title,
      courseId: modules.courseId,
      courseTitle: courses.title,
    })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .innerJoin(courses, eq(courses.id, modules.courseId))
    .where(eq(lessonProgress.userId, userId))
    .orderBy(
      desc(
        sql`coalesce(${lessonProgress.completedAt}, ${lessonProgress.lastViewedAt})`
      )
    )
    .limit(limit);

  const items: EmployeeProgressTimelineItem[] = [];
  for (const row of rows) {
    if (row.completed && row.completedAt) {
      items.push({
        at: row.completedAt.toISOString(),
        type: "lesson_completed",
        title: `Completed lesson: ${row.lessonTitle}`,
        detail: row.courseTitle,
        courseId: row.courseId,
      });
    } else if (row.lastViewedAt) {
      items.push({
        at: row.lastViewedAt.toISOString(),
        type: "lesson_viewed",
        title: `Viewed lesson: ${row.lessonTitle}`,
        detail: row.courseTitle,
        courseId: row.courseId,
      });
    }
  }
  return items;
}

export async function getEmployeeProgressDetail(
  userId: string
): Promise<EmployeeProgressPayload | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: profiles.role,
      department: profiles.department,
      designation: profiles.designation,
      level: profiles.level,
      status: profiles.status,
      joinDate: profiles.joinDate,
      experienceYears: profiles.experienceYears,
      xp: profiles.xp,
      streak: profiles.streak,
      skillScore: profiles.skillScore,
      managerId: profiles.managerId,
    })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return null;

  let manager: EmployeeProgressPayload["manager"] = null;
  if (row.managerId) {
    const [mgr] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, row.managerId))
      .limit(1);
    if (mgr) {
      manager = {
        id: mgr.id,
        name: mgr.name ?? "Manager",
        email: mgr.email ?? "",
      };
    }
  }

  const assignments = await listAssignmentsForUser(userId);
  const completionDates = await getCourseCompletionDates(
    userId,
    assignments.map((a) => a.courseId)
  );

  const coursesWithDates: EmployeeProgressCourse[] = assignments.map((a) => ({
    ...a,
    completedAt:
      a.status === "completed" ? (completionDates.get(a.courseId) ?? null) : null,
  }));

  const roleItems = coursesWithDates.filter((c) => c.learningCategory === "role");
  const goalItems = coursesWithDates.filter((c) => c.learningCategory === "goal");
  const role = rollupCategory(roleItems);
  const goal = rollupCategory(goalItems);

  const completed = coursesWithDates.filter((c) => c.status === "completed").length;
  const inProgress = coursesWithDates.filter((c) => c.status === "in_progress").length;
  const overdue = coursesWithDates.filter((c) => c.status === "overdue").length;
  const pending = coursesWithDates.filter(
    (c) => c.status === "not_started" || c.status === "upcoming"
  ).length;
  const dueSoon = coursesWithDates.filter(
    (c) =>
      c.daysRemaining != null &&
      c.daysRemaining >= 0 &&
      c.daysRemaining <= 7 &&
      c.status !== "completed"
  ).length;
  const mandatory = coursesWithDates.filter((c) => c.mandatory).length;

  const overallCompletionPct =
    coursesWithDates.length === 0
      ? 0
      : Math.round(
          coursesWithDates.reduce((sum, c) => sum + c.progress, 0) /
            coursesWithDates.length
        );

  const completionHistory = coursesWithDates
    .filter((c) => c.status === "completed" && c.completedAt)
    .map((c) => ({
      courseId: c.courseId,
      title: c.title,
      learningCategory: c.learningCategory,
      completedAt: c.completedAt!,
      progress: c.progress,
    }))
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

  const overdueItems = coursesWithDates
    .filter((c) => c.status === "overdue")
    .sort((a, b) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0));

  const upcomingDue = coursesWithDates
    .filter(
      (c) =>
        c.dueDate &&
        c.status !== "completed" &&
        c.status !== "overdue" &&
        (c.daysRemaining == null || c.daysRemaining <= 30)
    )
    .sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999));

  const activity = await getLearningTimeline(userId);
  const assignEvents: EmployeeProgressTimelineItem[] = coursesWithDates.map(
    (c) => ({
      at: c.assignedAt,
      type: "course_assigned" as const,
      title: `Assigned: ${c.title}`,
      detail: c.mandatory ? "Mandatory" : "Optional",
      courseId: c.courseId,
    })
  );
  const completeEvents: EmployeeProgressTimelineItem[] = completionHistory.map(
    (c) => ({
      at: c.completedAt,
      type: "course_completed" as const,
      title: `Completed course: ${c.title}`,
      detail: c.learningCategory === "goal" ? "Goal Based" : "Role based",
      courseId: c.courseId,
    })
  );

  const timeline = [...activity, ...assignEvents, ...completeEvents]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 50);

  return {
    employee: {
      id: row.id,
      employeeId: row.id.slice(0, 8).toUpperCase(),
      name: row.name ?? "Learner",
      email: row.email ?? "",
      avatar: row.image,
      role: row.role,
      department: row.department,
      designation: row.designation,
      level: row.level,
      status: row.status,
      joinDate: row.joinDate,
      experienceYears: row.experienceYears,
      xp: row.xp,
      streak: row.streak,
      skillScore: row.skillScore,
    },
    manager,
    summary: {
      overallCompletionPct,
      assigned: coursesWithDates.length,
      completed,
      inProgress,
      pending,
      overdue,
      dueSoon,
      mandatory,
      role,
      goal,
    },
    courses: coursesWithDates,
    completionHistory,
    upcomingDue,
    overdueItems,
    timeline,
    chartStatus: [
      { label: "Completed", value: completed },
      { label: "In progress", value: inProgress },
      { label: "Pending", value: pending },
      { label: "Overdue", value: overdue },
    ],
    chartCategory: [
      {
        label: "Role based",
        value: role.avgProgress,
        secondary: role.total,
      },
      {
        label: "Goal Based",
        value: goal.avgProgress,
        secondary: goal.total,
      },
    ],
  };
}

export async function listEmployeesForProgressTracking(opts?: {
  search?: string;
  department?: DepartmentId;
  status?: "active" | "inactive";
}): Promise<EmployeeProgressListItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      department: profiles.department,
      designation: profiles.designation,
      level: profiles.level,
      status: profiles.status,
      joinDate: profiles.joinDate,
    })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .orderBy(asc(users.name));

  const filtered = rows.filter((row) => {
    if (opts?.department && row.department !== opts.department) return false;
    if (opts?.status && row.status !== opts.status) return false;
    if (opts?.search) {
      const q = opts.search.toLowerCase();
      const employeeId = row.id.slice(0, 8).toLowerCase();
      const hay =
        `${row.name ?? ""} ${row.email ?? ""} ${row.id} ${employeeId} ${row.designation ?? ""} ${row.department ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const { listAdminCourseAssignments } = await import(
    "@/db/queries/course-assignments"
  );
  const enrollments = await listAdminCourseAssignments(
    opts?.department ? { departmentId: opts.department } : undefined
  );

  const byUser = new Map<
    string,
    { progressSum: number; total: number; completed: number; overdue: number; inProgress: number; pending: number }
  >();

  for (const e of enrollments) {
    const cur = byUser.get(e.userId) ?? {
      progressSum: 0,
      total: 0,
      completed: 0,
      overdue: 0,
      inProgress: 0,
      pending: 0,
    };
    cur.total += 1;
    cur.progressSum += e.progress;
    if (e.status === "completed") cur.completed += 1;
    else if (e.status === "overdue") cur.overdue += 1;
    else if (e.status === "in_progress") cur.inProgress += 1;
    else cur.pending += 1;
    byUser.set(e.userId, cur);
  }

  return filtered.slice(0, 100).map((row) => {
    const stats = byUser.get(row.id);
    return {
      id: row.id,
      employeeId: row.id.slice(0, 8).toUpperCase(),
      name: row.name ?? "Learner",
      email: row.email ?? "",
      image: row.image,
      department: row.department,
      designation: row.designation,
      level: row.level,
      status: row.status,
      joinDate: row.joinDate,
      assigned: stats?.total ?? 0,
      completed: stats?.completed ?? 0,
      overdue: stats?.overdue ?? 0,
      inProgress: stats?.inProgress ?? 0,
      pending: stats?.pending ?? 0,
      overallCompletionPct:
        stats && stats.total > 0
          ? Math.round(stats.progressSum / stats.total)
          : 0,
    };
  });
}
