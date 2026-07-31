"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Clock,
  FileText,
  Flame,
  Play,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseCard } from "@/components/cards/course-card";
import { HoursChart } from "@/components/charts/learning-charts";
import { StatusBadge } from "@/components/shared/status-badge";
import { useLearnerAssessments } from "@/hooks/use-assessments";
import {
  useLearnerAssignments,
  useLearnerCertificates,
} from "@/hooks/use-certification";
import { useMyActiveCourses } from "@/hooks/use-courses";
import { useDashboardHome } from "@/hooks/use-me";
import { useMyAssignmentStats, useMyCourseAssignments } from "@/hooks/use-course-assignments";
import { useMyEligibility } from "@/hooks/use-promotions";
import { LEVEL_LABELS } from "@/constants/navigation";
import { levelToBadgeVariant } from "@/lib/status-styles";
import { cn, formatNumber } from "@/lib/utils";
import type { LearningLevel } from "@/types";

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const XP_BAND = 1000;

function xpBandProgress(xp: number) {
  const floor = Math.floor(xp / XP_BAND) * XP_BAND;
  const next = floor + XP_BAND;
  const into = xp - floor;
  return {
    floor,
    next,
    into,
    remaining: Math.max(0, next - xp),
    pct: Math.min(100, Math.round((into / XP_BAND) * 100)),
  };
}

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type DueItem = {
  id: string;
  title: string;
  meta: string;
  href: string;
  urgency: "overdue" | "soon" | "open";
  kind: "course" | "assignment" | "assessment";
};

export default function DashboardPage() {
  const { data: home, isLoading: homeLoading, isError: homeError } = useDashboardHome();
  const { data: courses = [], isLoading: coursesLoading } = useMyActiveCourses(8);
  const { data: assessments = [], isLoading: assessmentsLoading, isError: assessmentsError } = useLearnerAssessments();
  const { data: assignments = [], isLoading: assignmentsLoading, isError: assignmentsError } = useLearnerAssignments();
  const { data: certificates = [] } = useLearnerCertificates();
  const { data: courseAssignStats } = useMyAssignmentStats();
  const { data: myCourseAssignments = [], isLoading: courseAssignLoading, isError: courseAssignError } =
    useMyCourseAssignments();
  const { data: eligibility } = useMyEligibility();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const user = home?.user;
  const stats = home?.stats;
  const continueCourse = courses.find((c) => c.status === "in_progress");
  const myCourses = courses
    .filter(
      (c) =>
        (c.status === "in_progress" || c.status === "completed") &&
        c.id !== continueCourse?.id
    )
    .slice(0, 4);
  const earnedCerts = certificates.filter((c) => c.status === "earned").length;
  const dueLoading = assessmentsLoading || assignmentsLoading || courseAssignLoading;
  const dueError = assessmentsError || assignmentsError || courseAssignError;

  const dueItems: DueItem[] = React.useMemo(() => {
    const items: DueItem[] = [];

    for (const a of myCourseAssignments.filter((x) => x.status !== "completed")) {
      const overdue = a.status === "overdue";
      const soon =
        a.daysRemaining != null && a.daysRemaining >= 0 && a.daysRemaining <= 7;
      items.push({
        id: `ca-${a.id}`,
        title: a.title,
        meta: [
          a.mandatory ? "Mandatory course" : "Assigned course",
          a.dueDate
            ? `Due ${new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
            : null,
          `${a.progress}%`,
        ]
          .filter(Boolean)
          .join(" · "),
        href: `/dashboard/courses/${a.courseSlug}`,
        urgency: overdue ? "overdue" : soon ? "soon" : "open",
        kind: "course",
      });
    }

    for (const a of assignments.filter((x) => x.status === "pending" || x.status === "overdue")) {
      items.push({
        id: `hw-${a.id}`,
        title: a.title,
        meta: `Homework · Due ${new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        href: `/dashboard/assignments/${a.id}`,
        urgency: a.status === "overdue" ? "overdue" : "soon",
        kind: "assignment",
      });
    }

    for (const a of assessments.filter((x) =>
      ["available", "upcoming", "in_progress"].includes(x.status)
    )) {
      items.push({
        id: `ex-${a.id}`,
        title: a.title,
        meta: a.dueDate
          ? `Assessment · Due ${new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          : "Assessment · Available",
        href: `/dashboard/assessments/${a.id}`,
        urgency: a.status === "in_progress" ? "soon" : "open",
        kind: "assessment",
      });
    }

    const rank = { overdue: 0, soon: 1, open: 2 };
    return items.sort((a, b) => rank[a.urgency] - rank[b.urgency]).slice(0, 6);
  }, [myCourseAssignments, assignments, assessments]);

  if (homeError) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Couldn&apos;t load your dashboard. Refresh to try again — other pages still work.
        </CardContent>
      </Card>
    );
  }

  if (homeLoading || !stats || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-[28px]" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-[28px]" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-[28px]" />
            <Skeleton className="h-56 w-full rounded-[28px]" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-[28px]" />
            <Skeleton className="h-56 w-full rounded-[28px]" />
          </div>
        </div>
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] ?? "there";
  const xp = user.xp ?? 0;
  const xpProg = xpBandProgress(xp);
  const streak = stats.streak ?? 0;
  const completedMin = stats.todayCompletedMinutes;
  const goalMin = Math.max(1, stats.todayGoalMinutes);
  const goalPct = Math.round((completedMin / goalMin) * 100);
  const goalBarPct = Math.min(100, goalPct);
  const overdueCount =
    (courseAssignStats?.overdue ?? 0) +
    assignments.filter((a) => a.status === "overdue").length;
  const dueSoonCount = courseAssignStats?.dueSoon ?? 0;

  const leaderboard = home.leaderboard ?? [];
  const top = leaderboard[0];
  const meOnBoard = leaderboard.find((e) => e.userId === user.id);
  const myRank = stats.companyRank || meOnBoard?.rank || 0;
  const xpBehindTop = top ? Math.max(0, top.xp - xp) : 0;

  let nudge = `Hit your ${stats.todayGoalMinutes}-minute goal and keep climbing.`;
  if (overdueCount > 0) {
    nudge = `You have ${overdueCount} overdue item${overdueCount === 1 ? "" : "s"} — clear them today.`;
  } else if (dueSoonCount > 0) {
    nudge = `${dueSoonCount} assignment${dueSoonCount === 1 ? "" : "s"} due this week. Stay ahead.`;
  } else if (streak === 0) {
    nudge = "Start a streak today — even 15 focused minutes counts.";
  } else if (streak >= 7) {
    nudge = `${streak}-day streak on fire. Don't break it — study a little more.`;
  } else if (xpBehindTop > 0 && top) {
    nudge = `${formatNumber(xpBehindTop)} XP behind ${top.name.split(" ")[0]} — close the gap.`;
  }

  const continueHref = continueCourse
    ? `/dashboard/courses/${continueCourse.slug ?? continueCourse.id}`
    : dueItems[0]?.href ?? "/dashboard/learning";

  const level = (user.level ?? "beginner") as LearningLevel;

  return (
    <div className="space-y-6">
      {/* Hero: identity + nudge */}
      <motion.section
        {...fade}
        className="relative overflow-hidden rounded-[28px] bg-card p-6 sm:p-8"
      >
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={levelToBadgeVariant(level)}>{LEVEL_LABELS[level] ?? level}</Badge>
              {streak > 0 && (
                <Badge className="gap-1 border-0 bg-warning/15 text-warning">
                  <Flame className="h-3.5 w-3.5 stroke-[1.75]" /> {streak}-day streak
                </Badge>
              )}
              {myRank > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Trophy className="h-3.5 w-3.5 stroke-[1.75]" /> Rank #{myRank}
                </Badge>
              )}
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {mounted ? greetingForHour(new Date().getHours()) : "Hello"}, {firstName}
            </h1>
            <p className="max-w-xl text-description">{nudge}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="lg" className="gap-2">
                <Link href={continueHref}>
                  <Play className="h-4 w-4 stroke-[1.75]" />
                  {continueCourse ? "Continue learning" : dueItems[0] ? "Start next task" : "Browse learning"}
                </Link>
              </Button>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-2xl bg-pastel-purple p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Zap className="h-4 w-4 text-primary stroke-[1.75]" />
                {formatNumber(xp)} XP
              </p>
              <p className="text-caption">{formatNumber(xpProg.remaining)} to next band</p>
            </div>
            <Progress value={xpProg.pct} className="h-2.5" />
            <p className="mt-2 text-caption">
              Today {completedMin}/{goalMin} min · {goalPct}% of daily goal
            </p>
            <Progress value={goalBarPct} className="mt-1.5 h-1.5" />
          </div>
        </div>
      </motion.section>

      {eligibility && (
        <motion.section {...fade} transition={{ delay: 0.02 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-primary" />
                Career progress
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm">
                  Level{" "}
                  <span className="font-semibold">
                    {LEVEL_LABELS[eligibility.currentLevel]}
                  </span>
                  {eligibility.nextLevel
                    ? ` → ${LEVEL_LABELS[eligibility.nextLevel]}`
                    : " (max)"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {eligibility.certifiedCount}/{eligibility.requiredCount} courses certified
                  {" · "}
                  <span className="capitalize">
                    {eligibility.status.replaceAll("_", " ")}
                  </span>
                </p>
                <Progress
                  value={
                    eligibility.requiredCount > 0
                      ? Math.round(
                          (eligibility.certifiedCount / eligibility.requiredCount) * 100
                        )
                      : 0
                  }
                  className="mt-2 h-1.5 max-w-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link
                    href={
                      eligibility.status === "eligible"
                        ? "/dashboard/learning"
                        : eligibility.courses.find((c) => c.state === "assessment_pending")
                              ?.assessmentId
                          ? `/dashboard/assessments/${
                              eligibility.courses.find((c) => c.state === "assessment_pending")!
                                .assessmentId
                            }`
                          : "/dashboard/learning"
                    }
                  >
                    {eligibility.status === "eligible"
                      ? "Waiting for admin approval"
                      : eligibility.courses.some((c) => c.state === "assessment_pending")
                        ? "Take assessment"
                        : "Continue learning"}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard/help">How this works</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* Momentum strip */}
      <motion.section
        {...fade}
        transition={{ delay: 0.04 }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        {[
          {
            label: "Hours learned",
            value: stats.hoursLearned,
            icon: Clock,
            tone: "text-primary",
            hint: "Estimated from lessons",
          },
          {
            label: "Streak",
            value: `${streak}d`,
            icon: Flame,
            tone: streak > 0 ? "text-warning" : "text-muted-foreground",
            hint: streak > 0 ? "Keep it alive" : "Start today",
          },
          {
            label: "Completed",
            value: stats.coursesCompleted,
            icon: BookOpen,
            tone: "text-success",
            hint: `${earnedCerts} certificate${earnedCerts === 1 ? "" : "s"}`,
          },
          {
            label: "Due / overdue",
            value: overdueCount > 0 ? overdueCount : dueSoonCount,
            icon: Target,
            tone: overdueCount > 0 ? "text-destructive" : "text-pastel-yellow-foreground",
            hint:
              overdueCount > 0
                ? "Overdue now"
                : dueSoonCount > 0
                  ? "Due this week"
                  : dueItems.length === 0
                    ? "All clear"
                    : "Open work",
          },
          {
            label: "Avg score",
            value: `${stats.averageScore}%`,
            icon: Target,
            tone: "text-primary",
            hint: stats.averageScore > 0 ? "Across assessments" : "",
          },
        ].map((s) => (
          <Card key={s.label} className="overflow-hidden">
            <CardContent className="flex items-start justify-between gap-2 p-4">
              <div className="min-w-0">
                <p className="text-caption uppercase tracking-wide">{s.label}</p>
                <p className={cn("mt-1 font-display text-2xl font-semibold tabular-nums", s.tone)}>
                  {s.value}
                </p>
                <p className="mt-0.5 truncate text-caption">{s.hint}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <s.icon className="h-4 w-4 stroke-[1.75]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        {/* Continue + due */}
        <div className="space-y-6">
          {continueCourse && (
            <motion.section {...fade} transition={{ delay: 0.06 }}>
              <Card className="overflow-hidden border-0 bg-linear-to-br from-primary/10 via-card to-card shadow-(--shadow)">
                <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 space-y-3">
                    <p className="text-caption font-semibold uppercase tracking-wide text-primary">
                      Pick up where you left off
                    </p>
                    <h2 className="font-display text-xl font-semibold leading-snug">
                      {continueCourse.title}
                    </h2>
                    <div className="flex items-center gap-3">
                      <Progress value={continueCourse.progress} className="h-2 flex-1" />
                      <span className="text-sm font-semibold tabular-nums">
                        {continueCourse.progress}%
                      </span>
                    </div>
                    <Button asChild className="gap-2">
                      <Link href={continueHref}>
                        <Play className="h-4 w-4 stroke-[1.75]" /> Resume course
                      </Link>
                    </Button>
                  </div>
                  <div className="relative mx-auto flex h-28 w-28 shrink-0 items-center justify-center sm:mx-0">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        className="stroke-muted"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        className="stroke-primary"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${continueCourse.progress} 100`}
                      />
                    </svg>
                    <span className="absolute font-display text-xl font-semibold">
                      {continueCourse.progress}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          )}

          <motion.section {...fade} transition={{ delay: 0.08 }}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">What&apos;s due</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/learning">View all</Link>
              </Button>
            </div>
            {dueLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : dueError ? (
              <Card>
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15 text-warning">
                    <AlertTriangle className="h-5 w-5 stroke-[1.75]" />
                  </div>
                  <div>
                    <p className="font-medium">Couldn&apos;t load assignments</p>
                    <p className="text-caption">
                      Assignments could not be loaded — this list may be incomplete.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : dueItems.length === 0 ? (
              <Card>
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
                    <Award className="h-5 w-5 stroke-[1.75]" />
                  </div>
                  <div>
                    <p className="font-medium">You&apos;re clear</p>
                    <p className="text-caption">
                      No urgent work — push XP with a new lesson or challenge the leaderboard.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {dueItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 shadow-(--shadow-sm) transition hover:shadow-(--shadow)",
                      item.urgency === "overdue" && "ring-1 ring-destructive/25",
                      item.urgency === "soon" && "ring-1 ring-warning/25"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        item.kind === "course" && "bg-primary/10 text-primary",
                        item.kind === "assignment" && "bg-pastel-yellow text-pastel-yellow-foreground",
                        item.kind === "assessment" && "bg-info/15 text-info"
                      )}
                    >
                      {item.kind === "course" ? (
                        <BookOpen className="h-4 w-4 stroke-[1.75]" />
                      ) : item.kind === "assignment" ? (
                        <FileText className="h-4 w-4 stroke-[1.75]" />
                      ) : (
                        <Target className="h-4 w-4 stroke-[1.75]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="truncate text-caption">{item.meta}</p>
                    </div>
                    <StatusBadge
                      status={
                        item.urgency === "overdue"
                          ? "overdue"
                          : item.urgency === "soon"
                            ? "pending"
                            : "available"
                      }
                    />
                  </Link>
                ))}
              </div>
            )}
          </motion.section>

          <motion.section {...fade} transition={{ delay: 0.1 }}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Your courses</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/learning">My Learning</Link>
              </Button>
            </div>
            {coursesLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[88px] rounded-2xl" />
                ))}
              </div>
            ) : myCourses.length === 0 ? (
              <Card>
                <CardContent className="p-5 text-sm text-muted-foreground">
                  No courses in progress yet.{" "}
                  <Link href="/dashboard/courses" className="font-medium text-primary underline-offset-2 hover:underline">
                    Browse the catalog
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {myCourses.map((c) => (
                  <CourseCard key={c.id} course={c} variant="compact" />
                ))}
              </div>
            )}
          </motion.section>
        </div>

        {/* Competition + hours */}
        <div className="space-y-6">
          <motion.section {...fade} transition={{ delay: 0.06 }}>
            <Card className="overflow-hidden">
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4 text-primary stroke-[1.75]" /> Race the leaders
                  </CardTitle>
                  <p className="mt-1 text-caption">
                    {leaderboard.slice(0, 5).length > 0 &&
                    leaderboard.slice(0, 5).every((e) => (e.xp ?? 0) === 0)
                      ? "Leaderboard is warming up"
                      : xpBehindTop > 0 && top
                        ? `${formatNumber(xpBehindTop)} XP behind #1 · Dept rank #${stats.departmentRank || "—"}`
                        : myRank === 1
                          ? "You're #1 — defend the lead"
                          : `Skill score ${stats.skillScore}`}
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/leaderboard">Full board</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {leaderboard.slice(0, 5).map((entry) => {
                  const isYou = entry.userId === user.id;
                  const isTop = entry.rank === 1;
                  return (
                    <div
                      key={entry.userId}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3 py-2.5",
                        isYou && "bg-primary/10 ring-1 ring-primary/20",
                        !isYou && isTop && "bg-warning/10"
                      )}
                    >
                      <span
                        className={cn(
                          "w-6 text-center text-xs font-bold tabular-nums",
                          isTop ? "text-warning" : "text-muted-foreground"
                        )}
                      >
                        {entry.rank}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.avatar} />
                        <AvatarFallback>{entry.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {entry.name}
                          {isYou ? " (you)" : ""}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatNumber(entry.xp)} XP
                          {!isYou && entry.xp > xp
                            ? ` · +${formatNumber(entry.xp - xp)} ahead`
                            : !isYou && xp > entry.xp
                              ? ` · you lead by ${formatNumber(xp - entry.xp)}`
                              : ""}
                        </p>
                      </div>
                      {isTop && <Flame className="h-4 w-4 text-warning stroke-[1.75]" />}
                    </div>
                  );
                })}
                {!leaderboard.slice(0, 5).some((e) => e.userId === user.id) && myRank > 0 && (
                  <div className="flex items-center gap-3 rounded-2xl bg-primary/10 px-3 py-2.5 ring-1 ring-primary/20">
                    <span className="w-6 text-center text-xs font-bold text-primary tabular-nums">
                      {myRank}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{user.name} (you)</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatNumber(xp)} XP · climb into the top 5
                      </p>
                    </div>
                  </div>
                )}
                <Button asChild className="mt-2 w-full gap-2">
                  <Link href={continueHref}>
                    <Zap className="h-4 w-4 stroke-[1.75]" /> Earn XP — study now
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section {...fade} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Hours this week</CardTitle>
                <p className="text-caption">From your lesson activity</p>
              </CardHeader>
              <CardContent>
                <HoursChart data={home.weeklyHours} />
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
