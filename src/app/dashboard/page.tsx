"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Flame,
  Play,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useLearnerAssessments } from "@/hooks/use-assessments";
import { useLearnerAssignments } from "@/hooks/use-certification";
import { useMyActiveCourses, useRecommendedCourses } from "@/hooks/use-courses";
import { useDashboardHome } from "@/hooks/use-me";
import { useMyAssignmentStats, useMyCourseAssignments } from "@/hooks/use-course-assignments";
import { useMyEligibility } from "@/hooks/use-promotions";
import { DEPARTMENT_LABELS, LEVEL_LABELS, nextCareerLevel, normalizeCareerLevel } from "@/constants/navigation";
import { cn, formatHours, formatNumber } from "@/lib/utils";
import {
  courseCtaLabel,
  courseResumePath,
  isActiveCourseStatus,
} from "@/lib/course-progress";
import type { Course, LearningLevel } from "@/types";

type RecommendedItem = {
  course: Course;
  reason: string;
};

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
};

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function toDateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

type DueUrgency = "overdue" | "today" | "soon" | "upcoming" | "open";

type DueItem = {
  id: string;
  title: string;
  meta: string;
  href: string;
  urgency: DueUrgency;
  kind: "course" | "assignment" | "assessment";
  dueLabel?: string;
};

const URGENCY_RANK: Record<DueUrgency, number> = {
  overdue: 0,
  today: 1,
  soon: 2,
  upcoming: 3,
  open: 4,
};

const URGENCY_LABEL: Record<DueUrgency, string> = {
  overdue: "Overdue",
  today: "Due today",
  soon: "Due soon",
  upcoming: "Upcoming",
  open: "Available",
};

function urgencyFromDueDate(iso: string | null | undefined, isOverdue?: boolean): DueUrgency {
  if (isOverdue) return "overdue";
  if (!iso) return "open";
  const key = toDateKey(iso);
  const today = todayKey();
  if (key < today) return "overdue";
  if (key === today) return "today";
  const due = new Date(iso);
  const now = new Date();
  const days = Math.ceil((due.getTime() - now.getTime()) / 86400000);
  if (days <= 7) return "soon";
  return "upcoming";
}

function KindIcon({ kind }: { kind: DueItem["kind"] }) {
  const Icon =
    kind === "course" ? BookOpen : kind === "assignment" ? FileText : ClipboardCheck;
  return <Icon className="h-3.5 w-3.5" />;
}

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
      <ChevronRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export default function DashboardPage() {
  const { data: home, isLoading: homeLoading, isError: homeError } = useDashboardHome();
  const { data: courses = [], isLoading: coursesLoading } = useMyActiveCourses(8);
  const { data: catalog = [], isLoading: catalogLoading } = useRecommendedCourses(12);
  const { data: assessments = [], isLoading: assessmentsLoading, isError: assessmentsError } =
    useLearnerAssessments();
  const { data: assignments = [], isLoading: assignmentsLoading, isError: assignmentsError } =
    useLearnerAssignments();
  const { data: courseAssignStats } = useMyAssignmentStats();
  const { data: myCourseAssignments = [], isLoading: courseAssignLoading, isError: courseAssignError } =
    useMyCourseAssignments();
  const {
    data: eligibility,
    isLoading: eligibilityLoading,
    isError: eligibilityError,
    isFetched: eligibilityFetched,
  } = useMyEligibility();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const user = home?.user;
  const stats = home?.stats;
  const continueCourse =
    courses.find((c) => c.status === "content_complete") ??
    courses.find((c) => c.status === "in_progress");
  const myCourses = courses
    .filter(
      (c) =>
        (isActiveCourseStatus(c.status) || c.status === "completed") &&
        c.id !== continueCourse?.id
    )
    .slice(0, 3);
  const dueError = assessmentsError || assignmentsError || courseAssignError;

  const dueItems: DueItem[] = React.useMemo(() => {
    const items: DueItem[] = [];

    for (const a of myCourseAssignments.filter((x) => x.status !== "completed")) {
      items.push({
        id: `ca-${a.id}`,
        title: a.title,
        meta: a.mandatory ? "Mandatory course" : "Assigned course",
        dueLabel: a.dueDate
          ? new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : undefined,
        href: `/dashboard/courses/${a.courseSlug}`,
        urgency: urgencyFromDueDate(a.dueDate, a.status === "overdue"),
        kind: "course",
      });
    }

    for (const a of assignments.filter((x) => x.status === "pending" || x.status === "overdue")) {
      items.push({
        id: `hw-${a.id}`,
        title: a.title,
        meta: "Homework",
        dueLabel: new Date(a.dueDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        href: `/dashboard/assignments/${a.id}`,
        urgency: urgencyFromDueDate(a.dueDate, a.status === "overdue"),
        kind: "assignment",
      });
    }

    for (const a of assessments.filter((x) =>
      ["available", "upcoming", "in_progress"].includes(x.status)
    )) {
      items.push({
        id: `ex-${a.id}`,
        title: a.title,
        meta: a.status === "in_progress" ? "Assessment · In progress" : "Assessment",
        dueLabel: a.dueDate
          ? new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : undefined,
        href: `/dashboard/assessments/${a.id}`,
        urgency: a.status === "in_progress" ? "soon" : urgencyFromDueDate(a.dueDate),
        kind: "assessment",
      });
    }

    return items.sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]).slice(0, 8);
  }, [myCourseAssignments, assignments, assessments]);

  const dueGroups = React.useMemo(() => {
    const order: DueUrgency[] = ["overdue", "today", "soon", "upcoming", "open"];
    return order
      .map((urgency) => ({
        urgency,
        items: dueItems.filter((i) => i.urgency === urgency),
      }))
      .filter((g) => g.items.length > 0);
  }, [dueItems]);

  // Don't block What's Due on slow assessments — render once course/homework queries settle
  const dueCoreSettled = !courseAssignLoading && !assignmentsLoading;
  const showDueSkeleton = !dueCoreSettled && dueItems.length === 0;

  if (homeError) {
    return (
      <div className="w-full rounded-lg border border-border px-5 py-6 text-sm text-muted-foreground">
        Couldn&apos;t load your dashboard. Refresh to try again — other pages still work.
      </div>
    );
  }

  if (homeLoading || !stats || !user) {
    return (
      <div className="w-full space-y-5">
        <Skeleton className="h-14 w-full max-w-md rounded-lg" />
        <div className="grid gap-4 lg:grid-cols-12">
          <Skeleton className="h-28 rounded-lg lg:col-span-8" />
          <Skeleton className="h-28 rounded-lg lg:col-span-4" />
        </div>
        <div className="grid gap-4 lg:grid-cols-12">
          <Skeleton className="h-48 rounded-lg lg:col-span-8" />
          <Skeleton className="h-48 rounded-lg lg:col-span-4" />
        </div>
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] ?? "there";
  const xp = user.xp ?? 0;
  const streak = stats.streak ?? 0;
  const overdueCount =
    (courseAssignStats?.overdue ?? 0) +
    assignments.filter((a) => a.status === "overdue").length;
  const dueSoonCount = courseAssignStats?.dueSoon ?? 0;
  const dueTodayCount = dueItems.filter((i) => i.urgency === "today").length;
  const openDueCount = dueItems.length;

  const leaderboard = home.leaderboard ?? [];
  const topThree = leaderboard.slice(0, 3);
  const meOnBoard = leaderboard.find((e) => e.userId === user.id);
  const myRank = stats.companyRank || meOnBoard?.rank || 0;

  let nudge = "Continue where you left off and stay on track.";
  if (overdueCount > 0) {
    nudge = `You have ${overdueCount} overdue item${overdueCount === 1 ? "" : "s"} — clear them first.`;
  } else if (dueTodayCount > 0) {
    nudge = `${dueTodayCount} item${dueTodayCount === 1 ? "" : "s"} due today.`;
  } else if (continueCourse) {
    nudge = `Pick up ${continueCourse.title} — you're ${continueCourse.progress}% through.`;
  } else if (dueSoonCount > 0) {
    nudge = `${dueSoonCount} assignment${dueSoonCount === 1 ? "" : "s"} due this week.`;
  }

  const continueHref = continueCourse
    ? courseResumePath(continueCourse.slug, continueCourse.id, continueCourse.nextAction)
    : dueItems[0]?.href ?? "/dashboard/learning";

  const level = (user.level
    ? normalizeCareerLevel(user.level as LearningLevel, user.department)
    : "associate") as LearningLevel;
  const fallbackNextLevel = nextCareerLevel(level, user.department);
  const careerRemaining = eligibility
    ? Math.max(0, eligibility.requiredCount - eligibility.certifiedCount)
    : 0;
  const careerPct =
    eligibility && eligibility.requiredCount > 0
      ? Math.round((eligibility.certifiedCount / eligibility.requiredCount) * 100)
      : 0;

  const careerCtaHref =
    eligibility?.status === "eligible"
      ? "/dashboard/learning"
      : eligibility?.courses.find((c) => c.state === "assessment_pending")?.assessmentId
        ? `/dashboard/assessments/${
            eligibility.courses.find((c) => c.state === "assessment_pending")!.assessmentId
          }`
        : "/dashboard/learning";

  const remainingHours =
    continueCourse && continueCourse.progress < 100
      ? Math.max(
          0.5,
          Math.round(
            ((continueCourse.durationHours ?? 0) * (100 - continueCourse.progress)) / 100 * 10
          ) / 10
        )
      : null;

  const continueLessons = continueCourse?.modules.flatMap((m) => m.lessons) ?? [];
  const lessonsTotal = continueLessons.length;
  const lessonsDone = continueLessons.filter((l) => l.completed).length;

  const weekHours = home.weeklyHours ?? [];
  const weekTotal = weekHours.reduce((sum, p) => sum + (p.value ?? 0), 0);
  const weekMax = Math.max(0.25, ...weekHours.map((p) => p.value ?? 0));
  const weeklyGoalHours = Math.max(
    1,
    Math.round((((stats.todayGoalMinutes ?? 45) * 5) / 60) * 10) / 10
  );
  const activeDays = weekHours.filter((p) => (p.value ?? 0) > 0).length;
  const completedActivities =
    weekTotal > 0 ? Math.max(1, Math.round(weekTotal * 2)) : 0;

  const nextDue = dueItems[0];
  const dueSummaryCount =
    overdueCount > 0 ? overdueCount : openDueCount || dueSoonCount;

  const recommendations = ((): RecommendedItem[] => {
    const dept = user.department;
    const busyIds = new Set<string>(
      [
        continueCourse?.id,
        ...myCourses.map((c) => c.id),
        ...          catalog
          .filter((c) => isActiveCourseStatus(c.status) || c.status === "completed")
          .map((c) => c.id),
      ].filter(Boolean) as string[]
    );

    const picked: RecommendedItem[] = [];
    const used = new Set<string>();

    const take = (course: Course | undefined, reason: string) => {
      if (!course || used.has(course.id) || busyIds.has(course.id)) return;
      if (picked.length >= 3) return;
      picked.push({ course, reason });
      used.add(course.id);
    };

    // 1) Path gaps — highest career value
    if (eligibility?.courses?.length) {
      const pathReason = eligibility.nextLevel
        ? `Next for ${LEVEL_LABELS[eligibility.nextLevel]}`
        : "On your path";
      const pathOrdered = [...eligibility.courses]
        .filter((row) => row.state !== "certified")
        .sort((a, b) => {
          const rank = (s: string) =>
            s === "assessment_pending" ? 0 : s === "in_progress" ? 1 : 2;
          return rank(a.state) - rank(b.state);
        });
      for (const row of pathOrdered) {
        if (picked.length >= 1) break;
        const match =
          catalog.find((c) => c.id === row.courseId) ??
          catalog.find((c) => c.slug === row.courseSlug);
        if (match && match.status !== "in_progress") {
          take(
            match,
            row.state === "assessment_pending" ? "Assessment pending" : pathReason
          );
        }
      }
    }

    // 2) Trending in learner's department
    const deptTrending = catalog
      .filter(
        (c) =>
          c.department === dept &&
          c.isTrending &&
          c.status === "not_started" &&
          !used.has(c.id) &&
          !busyIds.has(c.id)
      )
      .sort((a, b) => b.rating - a.rating);
    for (const c of deptTrending) {
      if (picked.length >= 2) break;
      take(c, `Trending in ${DEPARTMENT_LABELS[dept] ?? dept}`);
    }

    // 3) One cross-department hot topic
    const adjacent = catalog
      .filter(
        (c) =>
          c.department !== dept &&
          c.isTrending &&
          c.status === "not_started" &&
          !used.has(c.id) &&
          !busyIds.has(c.id)
      )
      .sort((a, b) => b.rating - a.rating);
    if (adjacent[0]) {
      take(
        adjacent[0],
        `Hot in ${DEPARTMENT_LABELS[adjacent[0].department] ?? adjacent[0].department}`
      );
    }

    // Fill to 3 with strong role/goal matches
    if (picked.length < 3) {
      const fill = catalog
        .filter(
          (c) =>
            c.status === "not_started" && !used.has(c.id) && !busyIds.has(c.id)
        )
        .sort((a, b) => {
          const score = (c: Course) =>
            c.rating +
            (c.department === dept ? 3 : 0) +
            (c.isTrending ? 2 : 0) +
            (c.learningCategory === "role" ? 1 : 0);
          return score(b) - score(a);
        });
      for (const c of fill) {
        if (picked.length >= 3) break;
        take(
          c,
          c.department === dept
            ? "For your role"
            : `From ${DEPARTMENT_LABELS[c.department] ?? c.department}`
        );
      }
    }

    return picked;
  })();

  return (
    <div className="w-full space-y-6">
      {/* 1. Header / learner summary */}
      <motion.header {...fade} className="space-y-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {mounted ? greetingForHour(new Date().getHours()) : "Hello"}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">{nudge}</p>
        </div>

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{LEVEL_LABELS[level] ?? level}</span>
          <span aria-hidden>·</span>
          <span>
            <span className="font-semibold tabular-nums text-foreground">{stats.hoursLearned}h</span>{" "}
            learned
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Flame className={cn("h-3 w-3", streak > 0 && "text-warning")} />
            <span className="font-semibold tabular-nums text-foreground">{streak}d</span> streak
          </span>
          <span aria-hidden>·</span>
          <span>
            <span className="font-semibold tabular-nums text-foreground">
              {stats.coursesCompleted}
            </span>{" "}
            completed
          </span>
          <span aria-hidden>·</span>
          <span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                overdueCount > 0 ? "text-destructive" : "text-foreground"
              )}
            >
              {dueSummaryCount}
            </span>{" "}
            due
          </span>
          <span aria-hidden>·</span>
          <span>
            Avg{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {stats.averageScore}%
            </span>
          </span>
          {myRank > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                Rank{" "}
                <span className="font-semibold tabular-nums text-foreground">#{myRank}</span>
              </span>
            </>
          )}
          {nextDue && (
            <>
              <span aria-hidden className="hidden sm:inline">
                ·
              </span>
              <span className="hidden sm:inline">
                Next due:{" "}
                <Link href={nextDue.href} className="font-medium text-foreground hover:underline">
                  {nextDue.title}
                </Link>
                {nextDue.dueLabel ? ` · ${nextDue.dueLabel}` : ""}
              </span>
            </>
          )}
        </p>
      </motion.header>

      {/* 2–3. Continue Learning + Career Progress */}
      <motion.section
        {...fade}
        transition={{ ...fade.transition, delay: 0.03 }}
        className="grid gap-4 lg:grid-cols-12 lg:gap-5"
      >
        <div className="lg:col-span-8">
          {continueCourse ? (
            <div className="flex gap-4 rounded-lg border border-border bg-card p-4">
              <div className="relative hidden h-[88px] w-[132px] shrink-0 overflow-hidden rounded-md bg-muted sm:block">
                <Image
                  src={continueCourse.thumbnail}
                  alt=""
                  fill
                  sizes="132px"
                  className="object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Continue learning</p>
                    <h2 className="mt-0.5 truncate text-lg font-semibold tracking-tight">
                      {continueCourse.title}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {DEPARTMENT_LABELS[continueCourse.department] ?? continueCourse.department}
                      {" · "}
                      {LEVEL_LABELS[continueCourse.level] ?? continueCourse.level}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {lessonsTotal > 0
                          ? `${lessonsDone} of ${lessonsTotal} lessons`
                          : `${continueCourse.lessonsCount} lessons`}
                        {" · "}
                        <span className="font-semibold tabular-nums text-foreground">
                          {continueCourse.progress}%
                        </span>
                      </span>
                    </div>
                    <Progress value={continueCourse.progress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">
                      {remainingHours != null ? `~${remainingHours}h remaining` : "In progress"}
                      {continueCourse.lastAccessed
                        ? ` · Last activity ${new Date(
                            continueCourse.lastAccessed
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}`
                        : ""}
                    </p>
                  </div>
                </div>
                <Button asChild className="h-10 shrink-0 gap-2 px-4">
                  <Link href={continueHref}>
                    <Play className="h-4 w-4" />
                    {continueCourse.status === "content_complete"
                      ? "Take assessment"
                      : "Resume"}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Continue learning</p>
                <h2 className="mt-0.5 text-base font-semibold tracking-tight">
                  Nothing in progress
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start an assigned task or open the catalog.
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" className="h-9 px-3">
                  <Link href={dueItems[0]?.href ?? "/dashboard/learning"}>
                    {dueItems[0] ? "Start next task" : "My Learning"}
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="h-9 px-3">
                  <Link href="/dashboard/courses">Catalog</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="flex flex-col gap-3 rounded-lg border border-border px-4 py-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Career progress</p>
              {eligibilityLoading && !eligibilityFetched ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-1.5 w-full" />
                  <Skeleton className="h-3 w-44" />
                </div>
              ) : eligibility ? (
                <>
                  <p className="text-base font-semibold tracking-tight">
                    {LEVEL_LABELS[eligibility.currentLevel]}
                    {eligibility.nextLevel ? (
                      <span className="font-normal text-muted-foreground">
                        {" → "}
                        {LEVEL_LABELS[eligibility.nextLevel]}
                      </span>
                    ) : (
                      <span className="font-normal text-muted-foreground"> · Max level</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {eligibility.certifiedCount} of {eligibility.requiredCount} requirements
                    completed
                  </p>
                  <Progress value={careerPct} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    {careerRemaining === 0
                      ? "All requirements met"
                      : `${careerRemaining} requirement${careerRemaining === 1 ? "" : "s"} remaining`}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold tracking-tight">
                    {LEVEL_LABELS[level] ?? level}
                    {fallbackNextLevel ? (
                      <span className="font-normal text-muted-foreground">
                        {" → "}
                        {LEVEL_LABELS[fallbackNextLevel]}
                      </span>
                    ) : (
                      <span className="font-normal text-muted-foreground"> · Max level</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {eligibilityError
                      ? "Couldn’t load promotion requirements."
                      : "Open your learning path to track certification requirements."}
                  </p>
                </>
              )}
            </div>
            <Link
              href={eligibility ? careerCtaHref : "/dashboard/learning"}
              className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
            >
              View path
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>
      </motion.section>

      {/* 4–6. What's Due + This Week + Leaderboard */}
      <div className="grid items-start gap-6 lg:grid-cols-12 lg:gap-5">
        <motion.section
          {...fade}
          transition={{ ...fade.transition, delay: 0.05 }}
          className="lg:col-span-8"
        >
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight">What&apos;s due</h2>
            <SectionLink href="/dashboard/learning">View all</SectionLink>
          </div>

          {showDueSkeleton ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-md" />
              ))}
            </div>
          ) : dueError && dueItems.length === 0 ? (
            <div className="flex items-start gap-2.5 py-1">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div>
                <p className="text-sm font-medium">Couldn&apos;t load assignments</p>
                <p className="text-xs text-muted-foreground">Refresh to try again.</p>
              </div>
            </div>
          ) : dueItems.length === 0 ? (
            <div className="flex items-start gap-2.5 py-1">
              <Award className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <div>
                <p className="text-sm font-medium">You&apos;re clear</p>
                <p className="text-xs text-muted-foreground">
                  {assessmentsLoading
                    ? "No course or homework deadlines right now. Checking assessments…"
                    : "No urgent work — continue a course or explore the catalog."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {dueGroups.map((group) => (
                <div key={group.urgency}>
                  <p
                    className={cn(
                      "mb-1.5 text-[11px] font-semibold uppercase tracking-wide",
                      group.urgency === "overdue" && "text-destructive",
                      (group.urgency === "today" || group.urgency === "soon") &&
                        "text-warning-foreground",
                      (group.urgency === "upcoming" || group.urgency === "open") &&
                        "text-muted-foreground"
                    )}
                  >
                    {URGENCY_LABEL[group.urgency]}
                  </p>
                  <ul className="divide-y divide-border border-y border-border">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/30"
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                              group.urgency === "overdue" &&
                                "bg-destructive/10 text-destructive",
                              (group.urgency === "today" || group.urgency === "soon") &&
                                "bg-warning/10 text-warning-foreground",
                              (group.urgency === "upcoming" || group.urgency === "open") &&
                                "bg-muted text-muted-foreground"
                            )}
                          >
                            <KindIcon kind={item.kind} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{item.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {item.meta}
                              {item.dueLabel ? ` · ${item.dueLabel}` : ""}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        <aside className="space-y-6 lg:col-span-4">
          {/* 5. This week */}
          <motion.section {...fade} transition={{ ...fade.transition, delay: 0.06 }}>
            <h2 className="mb-3 text-base font-semibold tracking-tight">This week</h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-sm font-semibold tabular-nums tracking-tight">
                  {weekTotal.toFixed(1)}h
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    / {weeklyGoalHours}h
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Weekly goal</p>
              </div>
              <div>
                <p className="text-sm font-semibold tabular-nums tracking-tight">{activeDays}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Active days</p>
              </div>
              <div>
                <p className="text-sm font-semibold tabular-nums tracking-tight">
                  {completedActivities}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Activities</p>
              </div>
            </div>
            <div className="mt-3 flex h-8 items-end gap-1">
              {weekHours.map((point) => (
                <div
                  key={point.label}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1"
                  title={`${point.label}: ${point.value ?? 0}h`}
                >
                  <div
                    className={cn(
                      "w-full rounded-sm",
                      (point.value ?? 0) > 0 ? "bg-primary/70" : "bg-muted"
                    )}
                    style={{
                      height:
                        (point.value ?? 0) > 0
                          ? `${Math.max(12, ((point.value ?? 0) / weekMax) * 100)}%`
                          : "12%",
                    }}
                  />
                  <span className="text-[9px] text-muted-foreground">
                    {String(point.label).slice(0, 1)}
                  </span>
                </div>
              ))}
            </div>
          </motion.section>

          {/* 6. Leaderboard */}
          <motion.section {...fade} transition={{ ...fade.transition, delay: 0.07 }}>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold tracking-tight">Leaderboard</h2>
              <SectionLink href="/dashboard/leaderboard">Full board</SectionLink>
            </div>
            <ul className="space-y-1">
              {topThree.map((entry) => {
                const isYou = entry.userId === user.id;
                return (
                  <li
                    key={entry.userId}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-1 py-1.5",
                      isYou && "bg-muted/50"
                    )}
                  >
                    <span className="w-5 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                      #{entry.rank}
                    </span>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={entry.avatar} />
                      <AvatarFallback className="text-[9px]">{entry.name[0]}</AvatarFallback>
                    </Avatar>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {entry.name}
                      {isYou ? " (you)" : ""}
                    </p>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatNumber(entry.xp)} XP
                    </span>
                  </li>
                );
              })}
              {topThree.length === 0 && (
                <p className="text-xs text-muted-foreground">Leaderboard is warming up.</p>
              )}
            </ul>
            {myRank > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Your rank:{" "}
                <span className="font-semibold text-foreground">#{myRank}</span>
              </p>
            )}
          </motion.section>
        </aside>
      </div>

      {/* 7. Your Courses — natural flow below */}
      <motion.section {...fade} transition={{ ...fade.transition, delay: 0.08 }}>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight">Your courses</h2>
          <SectionLink href="/dashboard/learning">My Learning</SectionLink>
        </div>

        {coursesLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-lg" />
            ))}
          </div>
        ) : myCourses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {continueCourse
              ? "Other enrollments will appear here as you start more courses."
              : "No courses in progress yet. "}
            {!continueCourse && (
              <Link
                href="/dashboard/courses"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Browse the catalog
              </Link>
            )}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {myCourses.map((c) => {
              const href = courseResumePath(c.slug, c.id, c.nextAction);
              const action = courseCtaLabel(c.status);
              return (
                <li key={c.id}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/30"
                  >
                    <div className="relative h-12 w-[72px] shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={c.thumbnail}
                        alt=""
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-medium">{c.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {DEPARTMENT_LABELS[c.department] ?? c.department}
                        {" · "}
                        {LEVEL_LABELS[c.level] ?? c.level}
                      </p>
                      {c.status !== "completed" && (
                        <div className="flex items-center gap-2">
                          <Progress value={c.progress} className="h-1 flex-1" />
                          <span className="text-[11px] tabular-nums text-muted-foreground">
                            {c.progress}%
                          </span>
                        </div>
                      )}
                      <p className="text-[11px] font-medium text-primary">
                        {c.status === "completed" ? "Completed" : `${action} →`}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </motion.section>

      {/* 8. Recommended for you — discovery, tertiary */}
      {(catalogLoading || recommendations.length > 0) && (
        <motion.section {...fade} transition={{ ...fade.transition, delay: 0.09 }}>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Recommended for you</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Path gaps, department trending, and adjacent skills
              </p>
            </div>
            <SectionLink href="/dashboard/courses">Browse catalog</SectionLink>
          </div>

          {catalogLoading && recommendations.length === 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[84px] rounded-lg" />
              ))}
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recommendations.map(({ course: c, reason }) => {
                const href = `/dashboard/courses/${c.slug ?? c.id}`;
                return (
                  <li key={c.id}>
                    <Link
                      href={href}
                      className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/30"
                    >
                      <div className="relative h-12 w-[72px] shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={c.thumbnail}
                          alt=""
                          fill
                          sizes="72px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-[11px] font-medium text-muted-foreground">
                          {reason}
                        </p>
                        <p className="truncate text-sm font-medium">{c.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {DEPARTMENT_LABELS[c.department] ?? c.department}
                          {" · "}
                          {LEVEL_LABELS[c.level] ?? c.level}
                          {" · "}
                          {formatHours(c.durationHours)}
                        </p>
                        <p className="text-[11px] font-medium text-primary">Explore →</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.section>
      )}
    </div>
  );
}
