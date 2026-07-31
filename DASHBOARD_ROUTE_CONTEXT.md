# `/dashboard` route — self-contained context dump

Generated for sharing without a local run. Paths are relative to the repo root.

---

## 1. Route + file tree

**URL:** `/dashboard`  
**App Router files that render this URL:**

```
src/app/layout.tsx                          ← root HTML, fonts, Providers, theme bootstrap
src/app/dashboard/layout.tsx                ← dashboard chrome (sidebar/header/shell)
src/app/dashboard/page.tsx                  ← home page (client)
│
├── layout children
│   src/components/layout/dashboard-shell.tsx
│   src/components/layout/sidebar.tsx
│   src/components/layout/header.tsx
│   src/components/layout/command-palette.tsx
│   src/components/layout/notification-panel.tsx
│   src/components/layout/ai-assistant.tsx
│   src/store/ui-store.ts                   ← sidebar/command/ai/notif open state
│
└── page children (direct)
    src/components/cards/course-card.tsx
    src/components/charts/learning-charts.tsx   ← HoursChart only used here
    src/components/shared/status-badge.tsx
    src/components/ui/button.tsx
    src/components/ui/badge.tsx
    src/components/ui/card.tsx
    src/components/ui/progress.tsx
    src/components/ui/avatar.tsx
    src/components/ui/skeleton.tsx
```

**Data / hooks (not rendered, but required):**

```
src/hooks/use-me.ts                    → useDashboardHome
src/hooks/use-courses.ts               → useMyActiveCourses
src/hooks/use-assessments.ts           → useLearnerAssessments
src/hooks/use-certification.ts         → useLearnerAssignments, useLearnerCertificates
src/hooks/use-course-assignments.ts    → useMyCourseAssignments, useMyAssignmentStats
src/hooks/use-promotions.ts            → useMyEligibility
src/services/me.ts                     → fetchDashboardHomeAction (and prefs)
src/services/courses.ts                → fetchMyActiveCoursesAction
src/services/assessments.ts            → fetchLearnerAssessmentsAction
src/services/certification.ts          → fetchLearnerAssignmentsAction, fetchLearnerCertificatesAction
src/services/course-assignments.ts     → fetchMyCourseAssignmentsAction, fetchMyAssignmentStatsAction
src/services/promotions.ts             → fetchMyEligibilityAction
src/db/queries/eligibility.ts          → PromotionEligibility type + compute
src/db/queries/course-assignments.ts   → listAssignmentsForUser, countAssignmentStats
src/db/queries/operations.ts           → getLeaderboardRows, getAnalyticsSnapshot
src/types/index.ts
src/components/providers.tsx           ← SessionProvider + next-themes + React Query
src/app/globals.css                    ← design tokens
DESIGN.md                              ← canonical token frontmatter
```

---

## 2. Full source

(Full contents of every file below — do not truncate when sharing.)


### `src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const poppinsDisplay = Poppins({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: {
    default: "Nexus — Enterprise Learning Platform",
    template: "%s · Nexus",
  },
  description:
    "Internal enterprise learning & certification platform for employee training, skill tracking, and career progression.",
};

/**
 * Pre-paint theme bootstrap — KEEP alongside next-themes.
 *
 * next-themes also injects a blocking script, but it renders as the first child of
 * <ThemeProvider>, which lives inside <body>. By then the stylesheet has loaded and
 * <body class="bg-background"> exists under a still-light <html>, so the first paint
 * can flash Paper White cards on a dark preference.
 *
 * This inline <head> script runs during HTML parse, before <body>, so `.dark` is on
 * <html> before any themed surface paints. Both scripts read `nexus-theme` and write
 * the same class — no conflict, only ordering. Do not remove this as a "duplicate"
 * of next-themes without re-checking a hard reload of /login with dark active.
 */
const THEME_BOOTSTRAP = `(function(){try{var d=document.documentElement;var e=localStorage.getItem("nexus-theme");var m=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var t=e==="system"?m:(e||"light");d.classList.remove("light","dark");d.classList.add(t);d.style.colorScheme=t}catch(n){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} ${poppinsDisplay.variable} ${jetbrains.variable} h-full`}
    >
      <head>
        <script
          id="nexus-theme-bootstrap"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }}
        />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

```

### `src/app/dashboard/layout.tsx`

```tsx
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/layout/command-palette";
import { AiAssistant } from "@/components/layout/ai-assistant";
import { NotificationPanel } from "@/components/layout/notification-panel";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <DashboardShell>
        <Header />
        <main className="w-full flex-1 px-4 py-5 md:px-6 lg:px-8">
          {children}
        </main>
      </DashboardShell>
      <CommandPalette />
      <NotificationPanel />
      <AiAssistant />
    </div>
  );
}

```

### `src/app/dashboard/page.tsx`

```tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Clock,
  FileText,
  Flame,
  Play,
  Sparkles,
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
  const { data: assessments = [], isLoading: assessmentsLoading } = useLearnerAssessments();
  const { data: assignments = [], isLoading: assignmentsLoading } = useLearnerAssignments();
  const { data: certificates = [] } = useLearnerCertificates();
  const { data: courseAssignStats } = useMyAssignmentStats();
  const { data: myCourseAssignments = [], isLoading: courseAssignLoading } =
    useMyCourseAssignments();
  const { data: eligibility } = useMyEligibility();

  const user = home?.user;
  const stats = home?.stats;
  const continueCourse = courses.find((c) => c.status === "in_progress");
  const myCourses = courses
    .filter((c) => c.status === "in_progress" || c.status === "completed")
    .slice(0, 3);
  const earnedCerts = certificates.filter((c) => c.status === "earned").length;
  const dueLoading = assessmentsLoading || assignmentsLoading || courseAssignLoading;

  const dueItems: DueItem[] = (() => {
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
  })();

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
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-56 w-full rounded-3xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-56 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] ?? "there";
  const xp = user.xp ?? 0;
  const xpProg = xpBandProgress(xp);
  const streak = stats.streak ?? 0;
  const goalPct = Math.round(
    (stats.todayCompletedMinutes / Math.max(1, stats.todayGoalMinutes)) * 100
  );
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
  } else if (streak === 0) {
    nudge = "Start a streak today — even 15 focused minutes counts.";
  } else if (streak >= 7) {
    nudge = `${streak}-day streak on fire. Don't break it — study a little more.`;
  } else if (dueSoonCount > 0) {
    nudge = `${dueSoonCount} assignment${dueSoonCount === 1 ? "" : "s"} due this week. Stay ahead.`;
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
        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-pastel-purple via-card to-pastel-blue p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
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
              {greetingForHour(new Date().getHours())}, {firstName}
            </h1>
            <p className="max-w-xl text-description">{nudge}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="lg" className="gap-2">
                <Link href={continueHref}>
                  <Play className="h-4 w-4 stroke-[1.75]" />
                  {continueCourse ? "Continue learning" : dueItems[0] ? "Start next task" : "Browse learning"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 bg-card/70">
                <Link href="/dashboard/ai-mentor">
                  <Sparkles className="h-4 w-4 stroke-[1.75]" /> Ask AI Mentor
                </Link>
              </Button>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-2xl bg-card/80 p-4 shadow-(--shadow-sm) backdrop-blur">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Zap className="h-4 w-4 text-primary stroke-[1.75]" />
                {formatNumber(xp)} XP
              </p>
              <p className="text-caption">{formatNumber(xpProg.remaining)} to next band</p>
            </div>
            <Progress value={xpProg.pct} className="h-2.5" />
            <p className="mt-2 text-caption">
              Today {stats.todayCompletedMinutes}/{stats.todayGoalMinutes} min · {goalPct}% of daily
              goal
            </p>
            <Progress value={goalPct} className="mt-1.5 h-1.5" />
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
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
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
            hint: `${earnedCerts || stats.certificates} certificates`,
          },
          {
            label: "Due / overdue",
            value: overdueCount > 0 ? overdueCount : dueSoonCount,
            icon: Target,
            tone: overdueCount > 0 ? "text-destructive" : "text-pastel-yellow-foreground",
            hint: overdueCount > 0 ? "Overdue now" : dueSoonCount > 0 ? "Due this week" : "All clear",
          },
          {
            label: "Company rank",
            value: myRank ? `#${myRank}` : "—",
            icon: Trophy,
            tone: "text-primary",
            hint: `Dept #${stats.departmentRank || "—"}`,
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
                      item.urgency === "soon" && "ring-1 ring-pending/20"
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-2xl" />
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myCourses.map((c) => (
                  <CourseCard key={c.id} course={c} />
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
                    {xpBehindTop > 0 && top
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
                {meOnBoard == null && myRank > 5 && (
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

          <motion.section {...fade} transition={{ delay: 0.12 }}>
            <Card className="bg-pastel-pink/60">
              <CardContent className="space-y-2 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
                  Completions
                </p>
                <p className="font-display text-3xl font-semibold tabular-nums">
                  {stats.coursesCompleted}
                  <span className="ml-2 text-lg font-medium text-muted-foreground">
                    courses
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Avg assessment score {stats.averageScore}% ·{" "}
                  {earnedCerts || stats.certificates} certificates earned
                </p>
                <Button asChild variant="outline" size="sm" className="mt-1 bg-card/80">
                  <Link href="/dashboard/certificates">View certificates</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

```

### `src/components/layout/dashboard-shell.tsx`

```tsx
"use client";

import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col transition-all duration-300",
        collapsed ? "lg:pl-16" : "lg:pl-[240px]"
      )}
    >
      {children}
    </div>
  );
}

```

### `src/components/layout/sidebar.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Route,
  Building2,
  GraduationCap,
  ClipboardCheck,
  FileText,
  Award,
  Radar,
  Trophy,
  BarChart3,
  Calendar,
  Sparkles,
  Bell,
  Settings,
  Shield,
  Folders,
  Users,
  Image,
  ChevronLeft,
  LogOut,
  HelpCircle,
  UserRoundSearch,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, APP_NAME, SIDEBAR_NAV } from "@/constants/navigation";
import { canAccessAdmin } from "@/lib/roles";
import { useUIStore } from "@/store/ui-store";
import { useUnreadNotificationCount } from "@/hooks/use-operations";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NexusLogo } from "@/components/brand/nexus-logo";

const SIDEBAR_WIDTH = 240;

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  BookOpen,
  Route,
  Building2,
  GraduationCap,
  ClipboardCheck,
  FileText,
  Award,
  Radar,
  Trophy,
  BarChart3,
  Calendar,
  Sparkles,
  Bell,
  Settings,
  Shield,
  Folders,
  Users,
  Image,
  HelpCircle,
  UserRoundSearch,
};

function NavLink({
  href,
  title,
  icon,
  badge,
  collapsed,
}: {
  href: string;
  title: string;
  icon: string;
  badge?: number;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  const Icon = icons[icon] ?? LayoutDashboard;

  const link = (
    <Link
      href={href}
      className={cn(
        "group relative flex min-w-0 items-center gap-2.5 rounded-xl py-2 text-[13px] font-medium leading-5 tracking-normal transition-all duration-200 ease-out",
        collapsed ? "justify-center px-2" : "px-2.5 pl-3",
        active
          ? "bg-secondary text-primary"
          : "text-sidebar-foreground hover:bg-secondary/70 hover:text-primary"
      )}
    >
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
      )}
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 stroke-[1.75] transition-colors duration-200",
          active ? "text-primary" : "text-muted-foreground group-hover:text-primary"
        )}
      />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate tracking-normal">{title}</span>
          {badge ? (
            <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-none text-white">
              {badge}
            </span>
          ) : null}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{title}</TooltipContent>
      </Tooltip>
    );
  }
  return link;
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore();
  const { data: session } = useSession();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const showAdmin = canAccessAdmin(session?.user?.role);
  const learnerNav = SIDEBAR_NAV.map((item) =>
    item.href === "/dashboard/notifications"
      ? { ...item, badge: unreadCount > 0 ? unreadCount : undefined }
      : item
  );

  const content = (
    <aside
      className={cn(
        "flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground shadow-(--shadow-sm) transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-[240px]"
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2.5 px-3",
          sidebarCollapsed && "justify-center px-2"
        )}
      >
        <NexusLogo size={32} className="shrink-0" />
        {!sidebarCollapsed && (
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate font-display text-[15px] font-semibold leading-5 tracking-normal text-foreground">
              {APP_NAME}
            </p>
            <p className="truncate text-[12px] leading-4 tracking-normal text-muted-foreground">
              Learning Platform
            </p>
          </div>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2">
        <nav className="space-y-0.5 py-2">
          {learnerNav.map((item) => (
            <NavLink key={item.href} {...item} collapsed={sidebarCollapsed} />
          ))}
        </nav>

        {showAdmin && (
          <>
            <div className="mx-2 my-3 h-px bg-border" />

            {!sidebarCollapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-muted-foreground">
                Admin
              </p>
            )}
            <nav className="space-y-0.5 pb-2">
              {ADMIN_NAV.map((item) => (
                <NavLink key={item.href} {...item} collapsed={sidebarCollapsed} />
              ))}
            </nav>
          </>
        )}
      </ScrollArea>

      <div className="shrink-0 space-y-1 border-t border-border/60 p-2">
        <div className="flex min-w-0 items-center gap-1">
          {!sidebarCollapsed && (
            <Link
              href="/dashboard/settings"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium leading-5 tracking-normal text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-primary"
            >
              <Settings className="h-4 w-4 shrink-0 stroke-[1.75]" />
              <span className="truncate">Settings</span>
            </Link>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex shrink-0 items-center justify-center rounded-xl p-2 text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-primary"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 stroke-[1.75] transition-transform",
                sidebarCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        {!sidebarCollapsed && (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium leading-5 tracking-normal text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 shrink-0 stroke-[1.75]" />
            <span className="truncate">Log out</span>
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex">{content}</div>
      <AnimatePresence>
        {sidebarMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-scrim lg:hidden"
              onClick={() => setSidebarMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -SIDEBAR_WIDTH }}
              animate={{ x: 0 }}
              exit={{ x: -SIDEBAR_WIDTH }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 w-[240px] lg:hidden"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

```

### `src/components/layout/header.tsx`

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import {
  Bell,
  Menu,
  Moon,
  Search,
  Sun,
  User,
  Settings,
  LogOut,
  Zap,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/store/ui-store";
import { useUnreadNotificationCount } from "@/hooks/use-operations";
import { formatNumber } from "@/lib/utils";
import { DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { levelToBadgeVariant } from "@/lib/status-styles";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Header() {
  const { data: session } = useSession();
  const { setSidebarMobileOpen, setCommandOpen, setNotificationsOpen } = useUIStore();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { data: unread = 0 } = useUnreadNotificationCount();

  const user = session?.user;
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const designation = user?.designation ?? "Team Member";
  const department = user?.department ? DEPARTMENT_LABELS[user.department] : "Development";
  const level = user?.level ?? "beginner";
  const xp = user?.xp ?? 0;
  const coins = user?.coins ?? 0;

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCommandOpen]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-background/85 px-4 backdrop-blur-xl md:px-8">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={() => setSidebarMobileOpen(true)}
      >
        <Menu className="h-5 w-5 stroke-[1.75]" />
      </Button>

      <div className="hidden min-w-0 shrink-0 flex-col sm:flex">
        <h1 className="font-display text-lg font-semibold tracking-tight text-foreground md:text-xl">
          Welcome back, {firstName}
        </h1>
        <p className="text-caption">
          {designation} · {department}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="flex h-10 w-full max-w-sm items-center gap-2.5 rounded-full bg-card px-4 text-sm text-muted-foreground shadow-(--shadow-sm) transition-all duration-200 hover:shadow-(--shadow)"
      >
        <Search className="h-4 w-4 shrink-0 stroke-[1.75] text-primary" />
        <span className="flex-1 truncate text-left">Search…</span>
        <kbd className="hidden rounded-lg bg-muted px-1.5 py-0.5 font-mono text-caption sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-data text-sm font-semibold text-secondary-foreground shadow-(--shadow-sm) sm:flex">
          <Zap className="h-3.5 w-3.5 stroke-[1.75] text-primary" />
          {formatNumber(xp)} XP
        </div>
        <div className="hidden items-center gap-1.5 rounded-full bg-card px-3 py-1.5 font-data text-sm font-medium text-foreground shadow-(--shadow-sm) md:flex">
          <Coins className="h-3.5 w-3.5 stroke-[1.75] text-primary" />
          {formatNumber(coins)}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full bg-card shadow-(--shadow-sm)"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4 stroke-[1.75]" />
          ) : (
            <Moon className="h-4 w-4 stroke-[1.75]" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="relative rounded-full bg-card shadow-(--shadow-sm)"
          onClick={() => setNotificationsOpen(true)}
        >
          <Bell className="h-4 w-4 stroke-[1.75] text-foreground" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full transition-all duration-200 hover:ring-2 hover:ring-primary/25"
            >
              <Avatar className="h-9 w-9 shadow-(--shadow-sm)">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
                <AvatarFallback>{initials(user?.name ?? "U")}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl border-0 shadow-(--shadow-md)">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold">{user?.name ?? "Signed in user"}</span>
                <span className="text-sm font-normal text-description">{user?.email}</span>
                <Badge variant={levelToBadgeVariant(level)} className="mt-0.5 w-fit">
                  {LEVEL_LABELS[level]}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <User className="h-4 w-4 stroke-[1.75]" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4 stroke-[1.75]" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4 stroke-[1.75]" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

```

### `src/components/layout/command-palette.tsx`

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  Folders,
  GraduationCap,
  LayoutDashboard,
  Radar,
  Route,
  Settings,
  Shield,
  Sparkles,
  Trophy,
  Award,
  User,
  Building2,
  Users,
  HelpCircle,
  UserRoundSearch,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

const commands = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Navigate" },
  { label: "My Learning", href: "/dashboard/learning", icon: BookOpen, group: "Navigate" },
  { label: "Learning Paths", href: "/dashboard/paths", icon: Route, group: "Navigate" },
  { label: "Courses", href: "/dashboard/courses", icon: GraduationCap, group: "Navigate" },
  { label: "Assessments", href: "/dashboard/assessments", icon: ClipboardCheck, group: "Navigate" },
  { label: "Assignments", href: "/dashboard/assignments", icon: FileText, group: "Navigate" },
  { label: "Certificates", href: "/dashboard/certificates", icon: Award, group: "Navigate" },
  { label: "Skill Matrix", href: "/dashboard/skills", icon: Radar, group: "Navigate" },
  { label: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy, group: "Navigate" },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, group: "Navigate" },
  { label: "Calendar", href: "/dashboard/calendar", icon: Calendar, group: "Navigate" },
  { label: "Departments", href: "/dashboard/departments", icon: Building2, group: "Navigate" },
  { label: "AI Mentor", href: "/dashboard/ai-mentor", icon: Sparkles, group: "Navigate" },
  { label: "Help & employee guide", href: "/dashboard/help", icon: HelpCircle, group: "Navigate" },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell, group: "Navigate" },
  { label: "Admin Overview", href: "/dashboard/admin", icon: Shield, group: "Admin" },
  { label: "Catalog Audit", href: "/dashboard/admin/catalog-audit", icon: ClipboardCheck, group: "Admin" },
  { label: "Employee Progress", href: "/dashboard/admin/employee-progress", icon: UserRoundSearch, group: "Admin" },
  { label: "Admin Courses", href: "/dashboard/admin/courses", icon: Folders, group: "Admin" },
  { label: "Admin Users", href: "/dashboard/admin/users", icon: Users, group: "Admin" },
  { label: "Admin Promotions", href: "/dashboard/admin/promotions", icon: Award, group: "Admin" },
  { label: "Profile", href: "/dashboard/profile", icon: User, group: "Account" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, group: "Account" },
];

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useUIStore();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const router = useRouter();

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  React.useEffect(() => {
    if (commandOpen) {
      setQuery("");
      setActive(0);
    }
  }, [commandOpen]);

  const run = (href: string) => {
    setCommandOpen(false);
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[active]) {
      run(filtered[active].href);
    }
  };

  return (
    <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg [&>button]:hidden">
        <div className="flex items-center border-b px-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Type a command or search…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No results found.</p>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => run(item.href)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                    i === active ? "bg-pastel-purple text-primary" : "hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4 opacity-70" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                    {item.group}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

```

### `src/components/layout/notification-panel.tsx`

```tsx
"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/store/ui-store";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-operations";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const typeVariant = {
  info: "info",
  success: "success",
  warning: "warning",
  reminder: "secondary",
  achievement: "warning",
} as const;

export function NotificationPanel() {
  const { notificationsOpen, setNotificationsOpen } = useUIStore();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {notificationsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-scrim"
            onClick={() => setNotificationsOpen(false)}
          />
          <motion.aside
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Notifications</h2>
                {unread > 0 && <Badge variant="secondary">{unread}</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs"
                  disabled={unread === 0}
                  onClick={() => markAll.mutate()}
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Read all
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setNotificationsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No notifications</p>
              ) : (
                notifications.slice(0, 12).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={cn(
                      "w-full rounded-xl border border-border p-3 text-left transition hover:bg-muted/40",
                      !n.read && "border-primary/20 bg-primary/5"
                    )}
                    onClick={() => {
                      if (!n.read) markRead.mutate({ notificationId: n.id });
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      <Badge variant={typeVariant[n.type] ?? "secondary"} className="capitalize">
                        {n.type}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="border-t p-4">
              <Button asChild variant="outline" className="w-full" onClick={() => setNotificationsOpen(false)}>
                <Link href="/dashboard/notifications">View all</Link>
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

```

### `src/components/layout/ai-assistant.tsx`

```tsx
"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import { MarkdownMessage } from "@/components/ai/markdown-message";
import { cn } from "@/lib/utils";

const suggestions = [
  "Summarize my current course",
  "What should I learn next?",
  "Generate a quiz on system design",
  "Analyze my skill gaps",
];

type Msg = { role: "user" | "assistant"; content: string };

export function AiAssistant() {
  const { aiOpen, setAiOpen } = useUIStore();
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi Alex — I'm your Nexus AI Mentor. I can summarize lessons, recommend paths, generate quizzes, and help with career guidance.",
    },
  ]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Based on your progress in System Design Mastery (64%) and Playwright testing (15%), I recommend finishing the Redis Caching lab today, then scheduling the System Design Certification Exam for next week. Want a 5-question practice quiz?",
        },
      ]);
    }, 700);
  };

  return (
    <>
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-primary-strong to-chart-2 text-primary-foreground shadow-lg shadow-primary/30"
        aria-label="Open AI Mentor"
      >
        <Sparkles className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b bg-linear-to-r from-primary-strong to-chart-2 px-4 py-3 text-primary-foreground">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <div>
                  <p className="text-sm font-semibold">AI Mentor</p>
                  <p className="text-[11px] text-white/80">Always on · Enterprise secure</p>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" className="text-white hover:bg-white/15" onClick={() => setAiOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "assistant"
                      ? "bg-muted text-foreground"
                      : "ml-auto bg-primary text-primary-foreground"
                  )}
                >
                  {m.role === "assistant" ? (
                    <MarkdownMessage content={m.content} />
                  ) : (
                    m.content
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 border-t px-3 py-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>

            <form
              className="flex items-center gap-2 border-t p-3"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything…"
                className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="submit" size="icon" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

```

### `src/components/cards/course-card.tsx`

```tsx
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Bookmark, BookOpen, Clock, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { Course } from "@/types";
import { cn, formatHours } from "@/lib/utils";
import { DEPARTMENT_LABELS, LEARNING_CATEGORY_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { learningCategoryToBadgeVariant, levelToBadgeVariant } from "@/lib/status-styles";
import { useToggleSavedCourse } from "@/hooks/use-me";

interface CourseCardProps {
  course: Course;
  variant?: "default" | "compact" | "featured" | "pastel";
  className?: string;
}

export function CourseCard({ course, variant = "default", className }: CourseCardProps) {
  const toggleSaved = useToggleSavedCourse();
  const href = `/dashboard/courses/${course.slug ?? course.id}`;
  const levelVariant = levelToBadgeVariant(course.level);
  const category = course.learningCategory ?? "role";
  const categoryVariant = learningCategoryToBadgeVariant(category);
  const categoryLabel = LEARNING_CATEGORY_LABELS[category] ?? category;
  const enrolled = course.progress > 0 || course.status === "in_progress" || course.status === "completed";

  const onToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved.mutate(course.id, {
      onSuccess: (prefs) => {
        const saved = prefs.savedCourseIds?.includes(course.id);
        toast.success(saved ? "Saved for later" : "Removed from saved");
      },
      onError: () => toast.error("Could not update bookmark"),
    });
  };

  if (variant === "compact") {
    return (
      <Link
        href={href}
        className={cn(
          "group flex gap-3 rounded-2xl bg-card p-3 shadow-(--shadow-sm) transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow)",
          className
        )}
      >
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover transition duration-200 group-hover:scale-105"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1">
            <Badge variant={categoryVariant} className="text-xs">
              {categoryLabel}
            </Badge>
          </div>
          <p className="truncate text-sm font-semibold text-foreground">{course.title}</p>
          <p className="mt-1 text-caption">
            {formatHours(course.durationHours)} · {course.lessonsCount} lessons
          </p>
          {course.progress > 0 && (
            <div className="mt-2">
              <Progress value={course.progress} className="h-1.5" />
            </div>
          )}
        </div>
      </Link>
    );
  }

  const ctaLabel =
    course.status === "completed"
      ? "Review"
      : course.status === "in_progress" || course.progress > 0
        ? "Continue"
        : "Start course";

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[28px] bg-card shadow-(--shadow-card) transition-all duration-200 ease-out",
        "hover:-translate-y-1.5 hover:shadow-(--shadow-card-hover)",
        className
      )}
    >
      <Link href={href} className="relative block h-[190px] shrink-0 overflow-hidden bg-muted">
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          className="object-cover transition duration-200 ease-out group-hover:scale-105"
          unoptimized
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
          <Badge variant={levelVariant} className="bg-card/95 shadow-(--shadow-sm) backdrop-blur">
            {LEVEL_LABELS[course.level] ?? course.level}
          </Badge>
          <Badge variant={categoryVariant} className="bg-card/95 shadow-(--shadow-sm) backdrop-blur">
            {categoryLabel}
          </Badge>
        </div>
        <button
          type="button"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card/95 text-foreground shadow-(--shadow-sm) backdrop-blur transition duration-200 hover:bg-card"
          onClick={onToggleSave}
          aria-label={course.isSaved ? "Unsave course" : "Save course"}
        >
          <Bookmark
            className={cn(
              "h-4 w-4 stroke-[1.75] text-foreground",
              course.isSaved && "fill-primary text-primary"
            )}
          />
        </button>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={categoryVariant}>{categoryLabel}</Badge>
          </div>
          <Link href={href}>
            <h3 className="text-card-title line-clamp-2 transition-colors duration-200 group-hover:text-primary">
              {course.title}
            </h3>
          </Link>
          <p className="line-clamp-2 text-sm leading-relaxed text-description">{course.description}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 shrink-0 rounded-full bg-secondary bg-cover bg-center"
            style={{ backgroundImage: `url(${course.instructor.avatar})` }}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{course.instructor.name}</p>
            <p className="truncate text-caption">{DEPARTMENT_LABELS[course.department]}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 stroke-[1.75]" />
            {formatHours(course.durationHours)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 stroke-[1.75]" />
            {course.lessonsCount} lessons
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-star-fill stroke-star-stroke stroke-[1.75]" />
            {course.rating.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 stroke-[1.75]" />
            {course.enrolledCount.toLocaleString()}
          </span>
        </div>

        {enrolled && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-caption">
              <span>Progress</span>
              <span className="font-data font-semibold text-primary">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-1.5" />
          </div>
        )}

        <div className="mt-auto pt-1">
          <Button asChild size="sm" className="w-full" variant={enrolled ? "default" : "secondary"}>
            <Link href={href}>{ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

```

### `src/components/charts/learning-charts.tsx`

```tsx
"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint, Skill } from "@/types";

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

export function HoursChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="fillPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="value" stroke="var(--chart-1)" fill="url(#fillPrimary)" strokeWidth={2} name="You" />
        <Area type="monotone" dataKey="secondary" stroke="var(--chart-2)" fill="transparent" strokeWidth={2} strokeDasharray="4 4" name="Team avg" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SkillGrowthChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="fillSkill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[40, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="value" stroke="var(--chart-2)" fill="url(#fillSkill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SkillRadarChart({ skills }: { skills: Skill[] }) {
  const data = skills.map((s) => ({
    skill: s.name.split(" ")[0],
    current: s.current,
    target: s.target,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="skill" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
        <Radar name="Current" dataKey="current" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.25} />
        <Radar name="Target" dataKey="target" stroke="var(--chart-2)" fill="transparent" strokeDasharray="4 4" />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function LearningHeatmap({ data }: { data: number[][] }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-muted-foreground">
        {days.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>
      <div className="space-y-1.5">
        {data.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map((v, di) => (
              <div
                key={`${wi}-${di}`}
                title={`${v} sessions`}
                className={`aspect-square rounded-sm heat-${v} transition hover:ring-2 hover:ring-ring`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1.5 pt-1 text-[10px] text-muted-foreground">
        <span>Less</span>
        {[0, 1, 2, 3].map((v) => (
          <div key={v} className={`h-3 w-3 rounded-sm heat-${v}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

```

### `src/components/shared/status-badge.tsx`

```tsx
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { formatStatusLabel, statusToBadgeVariant } from "@/lib/status-styles";
import { cn } from "@/lib/utils";

interface StatusBadgeProps extends Omit<BadgeProps, "variant" | "children"> {
  status: string;
  label?: string;
}

/** Semantic status chip — always maps failed/error to red, success to green, etc. */
export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  return (
    <Badge
      variant={statusToBadgeVariant(status)}
      className={cn("capitalize", className)}
      {...props}
    >
      {label ?? formatStatusLabel(status)}
    </Badge>
  );
}

```

### `src/components/ui/button.tsx`

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** High emphasis = pill; lower emphasis = --radius-control (18px). */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-primary-strong text-primary-foreground shadow-(--shadow-sm) hover:bg-primary-hover hover:shadow-(--shadow)",
        secondary:
          "rounded-[length:var(--radius-control)] bg-secondary text-secondary-foreground shadow-(--shadow-sm) hover:bg-secondary/80",
        outline:
          "rounded-[length:var(--radius-control)] border-0 bg-card text-foreground shadow-(--shadow-sm) hover:bg-secondary hover:text-secondary-foreground",
        ghost:
          "rounded-[length:var(--radius-control)] bg-transparent text-foreground hover:bg-secondary hover:text-secondary-foreground",
        destructive:
          "rounded-full bg-destructive text-destructive-foreground shadow-(--shadow-sm) hover:bg-destructive-hover dark:bg-destructive-tint dark:text-destructive dark:hover:bg-destructive-hover",
        success:
          "rounded-full bg-success text-success-foreground shadow-(--shadow-sm) hover:bg-success-hover dark:bg-success-tint dark:text-success dark:hover:bg-success-hover",
        link: "rounded-[length:var(--radius-control)] text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

```

### `src/components/ui/badge.tsx`

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border-0 px-3 py-1 text-sm font-medium leading-none tabular-nums transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "bg-card text-foreground shadow-(--shadow-sm)",
        accent: "bg-pastel-purple text-primary",
        /* Status: tint + rely on label/icon in UI (dual-channel) */
        success: "bg-success/15 text-success-on-light",
        warning: "bg-warning/15 text-warning-foreground",
        /** Soft/passive attention (tier 1) — no pending colour token */
        pending: "bg-pastel-yellow text-pastel-yellow-foreground",
        info: "bg-info/15 text-info",
        destructive: "bg-destructive/15 text-destructive",
        draft: "bg-muted text-muted-foreground",
        /** Categorical level ramp — violet intensity, not status colours */
        beginner: "bg-primary/10 text-primary",
        intermediate: "bg-primary/20 text-primary",
        advanced: "bg-primary/35 text-primary",
        expert: "bg-primary-strong text-primary-foreground",
        /** Learning category — categorical, not status */
        role: "bg-pastel-blue text-info",
        goal: "bg-pastel-purple text-primary",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

```

### `src/components/ui/card.tsx`

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[28px] border-0 bg-card text-card-foreground shadow-(--shadow-card) transition-shadow duration-200 dark:border dark:border-border-subtle dark:bg-card dark:shadow-none",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2 p-[length:var(--card-padding)]", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-card-title", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-description text-sm leading-relaxed", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-[length:var(--card-padding)] pt-0", className)}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-[length:var(--card-padding)] pt-0", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

```

### `src/components/ui/progress.tsx`

```tsx
"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all duration-500 ease-out"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };

```

### `src/components/ui/avatar.tsx`

```tsx
"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn("aspect-square h-full w-full", className)} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium", className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };

```

### `src/components/ui/skeleton.tsx`

```tsx
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse-soft rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };

```

### `src/hooks/use-me.ts`

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCurrentUserAction,
  fetchDashboardHomeAction,
  fetchMyPreferencesAction,
  fetchMySkillsAction,
  toggleSavedCourseAction,
  updateMyPreferencesAction,
  updateMyProfileAction,
} from "@/services/me";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => fetchCurrentUserAction(),
  });
}

export function useDashboardHome() {
  return useQuery({
    queryKey: ["dashboard-home"],
    queryFn: () => fetchDashboardHomeAction(),
  });
}

export function useMyPreferences() {
  return useQuery({
    queryKey: ["me-preferences"],
    queryFn: () => fetchMyPreferencesAction(),
  });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMyProfileAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["dashboard-home"] });
    },
  });
}

export function useUpdateMyPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMyPreferencesAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me-preferences"] });
      qc.invalidateQueries({ queryKey: ["dashboard-home"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useToggleSavedCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleSavedCourseAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me-preferences"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["dashboard-home"] });
    },
  });
}

export function useMySkills() {
  return useQuery({
    queryKey: ["my-skills"],
    queryFn: () => fetchMySkillsAction(),
  });
}

```

### `src/hooks/use-courses.ts`

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveCourseAction,
  createCourseAction,
  deleteCourseAction,
  fetchAdminCoursesAction,
  fetchAssignableCoursesAction,
  fetchCourseBuilderAction,
  fetchCourseBySlugAction,
  fetchPublishedCoursesAction,
  fetchMyActiveCoursesAction,
  publishCourseAction,
  updateCourseAction,
} from "@/services/courses";
import { completeLessonAction, fetchLessonPlayerAction, upsertProgressAction } from "@/services/progress";

export function usePublishedCourses() {
  return useQuery({
    queryKey: ["courses", "published"],
    queryFn: () => fetchPublishedCoursesAction(),
  });
}

/** Dashboard home: only courses with learner progress (fast). */
export function useMyActiveCourses(limit = 8) {
  return useQuery({
    queryKey: ["courses", "active", limit],
    queryFn: () => fetchMyActiveCoursesAction(limit),
  });
}


export function useCourseBySlug(slug: string) {
  return useQuery({
    queryKey: ["courses", slug],
    queryFn: () => fetchCourseBySlugAction(slug),
    enabled: !!slug,
  });
}

export function useAdminCourses(filters?: {
  search?: string;
  departmentId?: string;
  publishStatus?: "draft" | "review" | "published" | "archived";
  level?: import("@/types").LearningLevel;
  difficulty?: import("@/types").Difficulty;
  learningCategory?: import("@/types").LearningCategory;
}) {
  return useQuery({
    queryKey: ["admin-courses", filters],
    queryFn: () => fetchAdminCoursesAction(filters),
  });
}

export function useAssignableCourses() {
  return useQuery({
    queryKey: ["assignable-courses"],
    queryFn: () => fetchAssignableCoursesAction(),
  });
}

export function useCourseBuilder(courseId: string) {
  return useQuery({
    queryKey: ["course-builder", courseId],
    queryFn: () => fetchCourseBuilderAction(courseId),
    enabled: !!courseId,
  });
}

export function useLessonPlayer(lessonId: string) {
  return useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => fetchLessonPlayerAction(lessonId),
    enabled: !!lessonId,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCourseAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courses"] }),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateCourseAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCourseAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courses"] }),
  });
}

export function usePublishCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: publishCourseAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courses"] }),
  });
}

export function useArchiveCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archiveCourseAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courses"] }),
  });
}

export function useUpsertProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertProgressAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["lesson"] });
    },
  });
}

export function useCompleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: completeLessonAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["lesson"] });
    },
  });
}

```

### `src/hooks/use-assessments.ts`

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAssessmentAction,
  createQuestionAction,
  deleteAssessmentAction,
  deleteQuestionAction,
  fetchAdminAssessmentsAction,
  fetchAssessmentBuilderAction,
  fetchAssessmentDetailAction,
  fetchAttemptSessionAction,
  fetchLearnerAssessmentsAction,
  saveAnswersAction,
  startAttemptAction,
  submitAttemptAction,
  updateAssessmentAction,
  updateQuestionAction,
} from "@/services/assessments";

export function useLearnerAssessments() {
  return useQuery({
    queryKey: ["assessments", "learner"],
    queryFn: () => fetchLearnerAssessmentsAction(),
  });
}

export function useAssessmentDetail(id: string) {
  return useQuery({
    queryKey: ["assessments", id],
    queryFn: () => fetchAssessmentDetailAction(id),
    enabled: !!id,
  });
}

export function useAdminAssessments() {
  return useQuery({
    queryKey: ["admin-assessments"],
    queryFn: () => fetchAdminAssessmentsAction(),
  });
}

export function useAssessmentBuilder(id: string) {
  return useQuery({
    queryKey: ["assessment-builder", id],
    queryFn: () => fetchAssessmentBuilderAction(id),
    enabled: !!id,
  });
}

export function useAttemptSession(attemptId: string) {
  return useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () => fetchAttemptSessionAction(attemptId),
    enabled: !!attemptId,
  });
}

export function useCreateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAssessmentAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-assessments"] }),
  });
}

export function useUpdateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateAssessmentAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-assessments"] });
      qc.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useDeleteAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAssessmentAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-assessments"] }),
  });
}

export function useCreateQuestion(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createQuestionAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessment-builder", assessmentId] }),
  });
}

export function useUpdateQuestion(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateQuestionAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessment-builder", assessmentId] }),
  });
}

export function useDeleteQuestion(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteQuestionAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessment-builder", assessmentId] }),
  });
}

export function useStartAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: startAttemptAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessments"] }),
  });
}

export function useSaveAnswers() {
  return useMutation({ mutationFn: saveAnswersAction });
}

export function useSubmitAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitAttemptAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessments"] }),
  });
}

```

### `src/hooks/use-certification.ts`

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completePathAction,
  createAssignmentAction,
  createPathAction,
  deleteAssignmentAction,
  deletePathAction,
  deletePathStepAction,
  enrollPathAction,
  fetchAdminAssignmentDetailAction,
  fetchAdminAssignmentsAction,
  fetchAdminCertificatesAction,
  fetchAdminPathBuilderAction,
  fetchAdminPathsAction,
  fetchAssignmentDetailAction,
  fetchCertificateDetailAction,
  fetchCoursesForAdminSelectAction,
  fetchLearnerAssignmentsAction,
  fetchLearnerCertificatesAction,
  fetchLearnerPathsAction,
  fetchPathDetailAction,
  reissueCertificateAction,
  reviewSubmissionAction,
  revokeCertificateAction,
  submitAssignmentAction,
  updateAssignmentAction,
  updatePathAction,
  upsertPathStepAction,
  verifyCredentialAction,
} from "@/services/certification";

export function useLearnerPaths() {
  return useQuery({
    queryKey: ["paths", "learner"],
    queryFn: () => fetchLearnerPathsAction(),
  });
}

export function usePathDetail(pathId: string) {
  return useQuery({
    queryKey: ["paths", pathId],
    queryFn: () => fetchPathDetailAction(pathId),
    enabled: !!pathId,
  });
}

export function useEnrollPath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enrollPathAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paths"] });
    },
  });
}

export function useCompletePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: completePathAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paths"] });
      qc.invalidateQueries({ queryKey: ["certificates"] });
    },
  });
}

export function useAdminPaths() {
  return useQuery({
    queryKey: ["admin-paths"],
    queryFn: () => fetchAdminPathsAction(),
  });
}

export function useAdminPathBuilder(pathId: string) {
  return useQuery({
    queryKey: ["admin-path-builder", pathId],
    queryFn: () => fetchAdminPathBuilderAction(pathId),
    enabled: !!pathId,
  });
}

export function useCreatePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPathAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-paths"] }),
  });
}

export function useUpdatePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePathAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-paths"] });
      qc.invalidateQueries({ queryKey: ["paths"] });
    },
  });
}

export function useDeletePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePathAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-paths"] }),
  });
}

export function useUpsertPathStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertPathStepAction,
    onSuccess: (_d, vars) => {
      const pathId = (vars as { pathId: string }).pathId;
      qc.invalidateQueries({ queryKey: ["admin-path-builder", pathId] });
    },
  });
}

export function useDeletePathStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePathStepAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-path-builder"] }),
  });
}

export function useLearnerAssignments() {
  return useQuery({
    queryKey: ["assignments", "learner"],
    queryFn: () => fetchLearnerAssignmentsAction(),
  });
}

export function useAssignmentDetail(id: string) {
  return useQuery({
    queryKey: ["assignments", id],
    queryFn: () => fetchAssignmentDetailAction(id),
    enabled: !!id,
  });
}

export function useSubmitAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitAssignmentAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useAdminAssignments() {
  return useQuery({
    queryKey: ["admin-assignments"],
    queryFn: () => fetchAdminAssignmentsAction(),
  });
}

export function useAdminAssignmentDetail(id: string) {
  return useQuery({
    queryKey: ["admin-assignment", id],
    queryFn: () => fetchAdminAssignmentDetailAction(id),
    enabled: !!id,
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAssignmentAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-assignments"] }),
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateAssignmentAction,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-assignments"] });
      qc.invalidateQueries({ queryKey: ["admin-assignment"] });
      qc.invalidateQueries({ queryKey: ["assignments"] });
      if (vars && typeof vars === "object" && "id" in vars) {
        qc.invalidateQueries({ queryKey: ["admin-assignment", (vars as { id: string }).id] });
        qc.invalidateQueries({ queryKey: ["assignments", (vars as { id: string }).id] });
      }
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAssignmentAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-assignments"] }),
  });
}

export function useReviewSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewSubmissionAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-assignment"] });
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useLearnerCertificates() {
  return useQuery({
    queryKey: ["certificates", "learner"],
    queryFn: () => fetchLearnerCertificatesAction(),
  });
}

export function useCertificateDetail(id: string) {
  return useQuery({
    queryKey: ["certificates", id],
    queryFn: () => fetchCertificateDetailAction(id),
    enabled: !!id,
  });
}

export function useAdminCertificates() {
  return useQuery({
    queryKey: ["admin-certificates"],
    queryFn: () => fetchAdminCertificatesAction(),
  });
}

export function useRevokeCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeCertificateAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-certificates"] });
      qc.invalidateQueries({ queryKey: ["certificates"] });
    },
  });
}

export function useReissueCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reissueCertificateAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-certificates"] });
      qc.invalidateQueries({ queryKey: ["certificates"] });
    },
  });
}

export function useVerifyCredential(credentialId: string) {
  return useQuery({
    queryKey: ["verify", credentialId],
    queryFn: () => verifyCredentialAction(credentialId),
    enabled: !!credentialId,
  });
}

export function useAdminCourseOptions() {
  return useQuery({
    queryKey: ["admin-course-options"],
    queryFn: () => fetchCoursesForAdminSelectAction(),
  });
}

```

### `src/hooks/use-course-assignments.ts`

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignCourseAction,
  bulkRevokeCourseAssignmentsAction,
  bulkUpdateAssignmentDueDatesAction,
  fetchAdminAssignmentConsoleAction,
  fetchAdminCourseAssignmentsAction,
  fetchAssignmentComplianceAction,
  fetchMyAssignmentStatsAction,
  fetchMyCourseAssignmentsAction,
  remindCourseAssignmentsAction,
  revokeCourseAssignmentAction,
} from "@/services/course-assignments";
import type { DepartmentId } from "@/types";

export function useMyCourseAssignments() {
  return useQuery({
    queryKey: ["course-assignments", "mine"],
    queryFn: () => fetchMyCourseAssignmentsAction(),
  });
}

export function useMyAssignmentStats() {
  return useQuery({
    queryKey: ["course-assignments", "stats"],
    queryFn: () => fetchMyAssignmentStatsAction(),
  });
}

export function useAdminCourseAssignments(filters?: {
  departmentId?: DepartmentId;
  courseId?: string;
}) {
  return useQuery({
    queryKey: ["course-assignments", "admin", filters],
    queryFn: () => fetchAdminCourseAssignmentsAction(filters),
  });
}

export function useAdminAssignmentConsole(filters?: {
  departmentId?: DepartmentId;
  courseId?: string;
}) {
  return useQuery({
    queryKey: ["course-assignments", "console", filters],
    queryFn: () => fetchAdminAssignmentConsoleAction(filters),
  });
}

export function useAssignmentCompliance() {
  return useQuery({
    queryKey: ["course-assignments", "compliance"],
    queryFn: () => fetchAssignmentComplianceAction(),
  });
}

export function useAssignCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assignCourseAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-assignments"] });
    },
  });
}

export function useRevokeCourseAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeCourseAssignmentAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-assignments"] });
    },
  });
}

export function useBulkRevokeCourseAssignments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkRevokeCourseAssignmentsAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-assignments"] });
    },
  });
}

export function useBulkUpdateAssignmentDueDates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkUpdateAssignmentDueDatesAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-assignments"] });
    },
  });
}

export function useRemindCourseAssignments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: remindCourseAssignmentsAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-assignments"] });
    },
  });
}

```

### `src/hooks/use-promotions.ts`

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approvePromotionAction,
  fetchMyEligibilityAction,
  fetchPromotionConsoleAction,
  rejectPromotionAction,
  remindPromotionCandidateAction,
} from "@/services/promotions";

export function useMyEligibility() {
  return useQuery({
    queryKey: ["my-eligibility"],
    queryFn: () => fetchMyEligibilityAction(),
  });
}

export function usePromotionConsole(filters?: {
  departmentId?: string;
  status?: "in_progress" | "eligible" | "blocked" | "max_level" | "all";
  search?: string;
}) {
  return useQuery({
    queryKey: ["promotion-console", filters],
    queryFn: () => fetchPromotionConsoleAction(filters),
  });
}

export function useApprovePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approvePromotionAction,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["promotion-console"] });
      void qc.invalidateQueries({ queryKey: ["my-eligibility"] });
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
      void qc.invalidateQueries({ queryKey: ["my-course-assignments"] });
    },
  });
}

export function useRejectPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rejectPromotionAction,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["promotion-console"] });
    },
  });
}

export function useRemindPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: remindPromotionCandidateAction,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["promotion-console"] });
    },
  });
}

```

### `src/services/me.ts`

```tsx
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { profiles, users } from "@/db/schema";
import { getAnalyticsSnapshot, getLeaderboardRows } from "@/db/queries/operations";
import { requireUserId } from "@/lib/auth-utils";
import { getUserWithProfile } from "@/lib/profile";
import type { DepartmentId, Skill, User } from "@/types";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  designation: z.string().min(1).max(120).optional(),
  department: z
    .enum(["qa", "development", "ba", "hr", "marketing", "uiux", "devops"])
    .optional(),
  level: z
    .enum([
      "beginner",
      "associate",
      "intermediate",
      "advanced",
      "senior",
      "lead",
      "architect",
      "expert",
    ])
    .optional(),
  goals: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
});

const prefsSchema = z.object({
  emailDigest: z.boolean().optional(),
  assessmentReminders: z.boolean().optional(),
  streakAlerts: z.boolean().optional(),
  courseUpdates: z.boolean().optional(),
  teamActivity: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  dailyGoalMinutes: z.number().int().min(15).max(240).optional(),
  preferredDifficulty: z.string().optional(),
  autoEnrollPaths: z.boolean().optional(),
  showLeaderboard: z.boolean().optional(),
  aiRecommendations: z.boolean().optional(),
  profileVisible: z.boolean().optional(),
  showProgress: z.boolean().optional(),
  showCertificates: z.boolean().optional(),
  analyticsOptIn: z.boolean().optional(),
  savedCourseIds: z.array(z.string()).optional(),
});

export type UserPreferences = z.infer<typeof prefsSchema>;

export async function fetchCurrentUserAction(): Promise<User | null> {
  const userId = await requireUserId();
  return getUserWithProfile(userId);
}

export async function updateMyProfileAction(input: unknown) {
  const userId = await requireUserId();
  const data = updateProfileSchema.parse(input);
  const db = getDb();

  if (data.name) {
    await db.update(users).set({ name: data.name }).where(eq(users.id, userId));
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (data.designation !== undefined) patch.designation = data.designation;
  if (data.department !== undefined) patch.department = data.department;
  // Learning level is gated by Admin Promotions — ignore self-serve level changes
  if (data.goals !== undefined) patch.goals = data.goals;
  if (data.experienceYears !== undefined) patch.experienceYears = data.experienceYears;

  await db.update(profiles).set(patch).where(eq(profiles.userId, userId));
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/settings");
  return getUserWithProfile(userId);
}

export async function fetchMyPreferencesAction(): Promise<UserPreferences> {
  const userId = await requireUserId();
  const db = getDb();
  const [row] = await db
    .select({ preferences: profiles.preferences })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return (row?.preferences as UserPreferences) ?? {};
}

export async function updateMyPreferencesAction(input: unknown) {
  const userId = await requireUserId();
  const patch = prefsSchema.parse(input);
  const db = getDb();
  const [existing] = await db
    .select({ preferences: profiles.preferences })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  const next = { ...(existing?.preferences as UserPreferences), ...patch };
  await db
    .update(profiles)
    .set({ preferences: next, updatedAt: new Date() })
    .where(eq(profiles.userId, userId));
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/learning");
  return next;
}

export async function toggleSavedCourseAction(courseId: string) {
  const userId = await requireUserId();
  const prefs = await fetchMyPreferencesAction();
  const saved = new Set(prefs.savedCourseIds ?? []);
  if (saved.has(courseId)) saved.delete(courseId);
  else saved.add(courseId);
  return updateMyPreferencesAction({ savedCourseIds: [...saved] });
}

export async function fetchDashboardHomeAction() {
  const userId = await requireUserId();
  const user = await getUserWithProfile(userId);
  const snapshot = await getAnalyticsSnapshot([userId]);
  const orgSnapshot = await getAnalyticsSnapshot();
  const leaderboard = await getLeaderboardRows(8);
  const prefs = await fetchMyPreferencesAction();
  const myRank = leaderboard.find((e) => e.userId === userId)?.rank ?? user?.companyRank ?? 0;

  const coursesCompleted = snapshot.completedLessons > 0
    ? Math.max(1, Math.round(snapshot.completedLessons / 8))
    : user?.skillScore
      ? 0
      : 0;

  // Derive weekly hours from lesson completions (fallback distribution)
  const totalHours = Math.max(1, Math.round(snapshot.completedLessons * 0.35) || Math.round((user?.xp ?? 0) / 120));
  const weeklyHours = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => ({
    label,
    value: Math.max(0, Math.round((totalHours / 7) * (i < 5 ? 1.2 : 0.6) * (0.7 + ((i * 17) % 5) / 10))),
  }));

  const heatmapData = Array.from({ length: 7 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const base = snapshot.completedLessons > 0 ? (snapshot.completedLessons % 5) + 1 : 0;
      return Math.min(4, Math.max(0, (base + week + day) % 5));
    })
  );

  const monthlyLearning = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((label, i) => ({
    label,
    value: Math.round(40 + (snapshot.avgAssessmentScore || 50) * 0.4 + i * 3),
    secondary: Math.round(35 + (orgSnapshot.avgAssessmentScore || 45) * 0.35 + i * 2),
  }));

  return {
    user,
    prefs,
    stats: {
      coursesCompleted: Math.max(coursesCompleted, snapshot.certificatesEarned > 0 ? 1 : 0),
      hoursLearned: totalHours,
      certificates: snapshot.certificatesEarned,
      averageScore: snapshot.avgAssessmentScore || 0,
      streak: user?.streak ?? 0,
      companyRank: myRank || user?.companyRank || 0,
      departmentRank: user?.departmentRank || 0,
      skillScore: user?.skillScore || Math.min(100, Math.round((user?.xp ?? 0) / 50)),
      todayGoalMinutes: prefs.dailyGoalMinutes ?? 45,
      todayCompletedMinutes: Math.min(
        prefs.dailyGoalMinutes ?? 45,
        Math.round(((snapshot.completedLessons % 5) + 1) * 12)
      ),
    },
    weeklyHours,
    heatmapData,
    monthlyLearning,
    leaderboard,
    orgSnapshot,
  };
}

export async function fetchMySkillsAction(): Promise<{
  skills: Skill[];
  skillGrowth: { label: string; value: number; secondary?: number }[];
  skillScore: number;
  department: DepartmentId;
}> {
  const userId = await requireUserId();
  const user = await getUserWithProfile(userId);
  const { listUserCertificates } = await import("@/db/queries/certification");
  const { fetchPublishedCoursesAction } = await import("@/services/courses");
  const certs = await listUserCertificates(userId);
  const courses = await fetchPublishedCoursesAction();
  const dept = user?.department ?? "development";

  const tagScores = new Map<string, { current: number; target: number; category: string }>();

  for (const course of courses.filter((c) => c.department === dept || c.progress > 0)) {
    for (const tag of course.tags.length ? course.tags : [course.category]) {
      const prev = tagScores.get(tag) ?? { current: 20, target: 80, category: course.category };
      const bump = course.status === "completed" ? 35 : course.progress > 0 ? 15 : 5;
      tagScores.set(tag, {
        current: Math.min(95, prev.current + bump),
        target: 90,
        category: course.category,
      });
    }
  }

  for (const cert of certs.filter((c) => c.status === "earned")) {
    for (const skill of cert.skills) {
      const prev = tagScores.get(skill) ?? { current: 40, target: 90, category: "Credential" };
      tagScores.set(skill, {
        current: Math.min(100, prev.current + 25),
        target: 95,
        category: "Credential",
      });
    }
  }

  // Ensure at least a few department baseline skills
  const defaults = [
    { name: "Core Fundamentals", category: "Foundation" },
    { name: "Collaboration", category: "Soft Skills" },
    { name: "Delivery Quality", category: "Practice" },
  ];
  for (const d of defaults) {
    if (![...tagScores.keys()].some((k) => k.toLowerCase().includes(d.name.split(" ")[0].toLowerCase()))) {
      tagScores.set(d.name, {
        current: Math.min(85, 30 + Math.round((user?.skillScore ?? 40) / 2)),
        target: 85,
        category: d.category,
      });
    }
  }

  const skills: Skill[] = [...tagScores.entries()].slice(0, 10).map(([name, v], i) => ({
    id: `skill-${i}`,
    name,
    category: v.category,
    current: v.current,
    target: v.target,
    department: dept,
  }));

  const skillGrowth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((label, i) => ({
    label,
    value: Math.round(
      skills.reduce((s, sk) => s + sk.current, 0) / Math.max(1, skills.length) * (0.7 + i * 0.04)
    ),
    secondary: 45 + i * 4,
  }));

  return {
    skills,
    skillGrowth,
    skillScore: user?.skillScore ?? Math.round(skills.reduce((s, sk) => s + sk.current, 0) / Math.max(1, skills.length)),
    department: dept,
  };
}

```

### `src/store/ui-store.ts`

```tsx
"use client";

import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  commandOpen: boolean;
  aiOpen: boolean;
  notificationsOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setSidebarMobileOpen: (v: boolean) => void;
  setCommandOpen: (v: boolean) => void;
  setAiOpen: (v: boolean) => void;
  setNotificationsOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  commandOpen: false,
  aiOpen: false,
  notificationsOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setSidebarMobileOpen: (v) => set({ sidebarMobileOpen: v }),
  setCommandOpen: (v) => set({ commandOpen: v }),
  setAiOpen: (v) => set({ aiOpen: v }),
  setNotificationsOpen: (v) => set({ notificationsOpen: v }),
}));

```

### `src/components/providers.tsx`

```tsx
"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 0, refetchOnWindowFocus: true },
        },
      })
  );

  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        storageKey="nexus-theme"
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster richColors position="top-right" closeButton />
          </TooltipProvider>
        </QueryClientProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
}

```

### `src/types/index.ts`

```tsx
export type DepartmentId =
  | "qa"
  | "development"
  | "ba"
  | "hr"
  | "marketing"
  | "uiux"
  | "devops";

export type LearningLevel =
  | "beginner"
  | "associate"
  | "intermediate"
  | "advanced"
  | "senior"
  | "lead"
  | "architect"
  | "expert";

export type CourseStatus = "not_started" | "in_progress" | "completed" | "archived";
export type AssessmentStatus = "upcoming" | "available" | "in_progress" | "completed" | "failed" | "expired";
export type AssignmentStatus = "pending" | "submitted" | "graded" | "overdue";
export type CertificateStatus = "earned" | "locked" | "expired" | "pending";
export type UserRole = "employee" | "manager" | "department_head" | "admin" | "instructor";
export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";
/** Role-based (career/level track) vs Goal-based (skill or personal objective). */
export type LearningCategory = "role" | "goal";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  designation: string;
  department: DepartmentId;
  level: LearningLevel;
  xp: number;
  coins: number;
  streak: number;
  companyRank: number;
  departmentRank: number;
  skillScore: number;
  joinDate: string;
  experienceYears: number;
  goals: string[];
}

export interface Department {
  id: DepartmentId;
  name: string;
  description: string;
  employeeCount: number;
  courseCount: number;
  avgCompletion: number;
  color: string;
  icon: string;
}

export interface Course {
  id: string;
  slug?: string;
  title: string;
  description: string;
  thumbnail: string;
  department: DepartmentId;
  level: LearningLevel;
  difficulty: Difficulty;
  learningCategory: LearningCategory;
  instructor: Instructor;
  durationHours: number;
  lessonsCount: number;
  enrolledCount: number;
  rating: number;
  progress: number;
  status: CourseStatus;
  tags: string[];
  category: string;
  xpReward: number;
  isSaved: boolean;
  isTrending: boolean;
  lastAccessed?: string;
  modules: CourseModule[];
}

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  title: string;
  bio: string;
}

export interface CourseModule {
  id: string;
  title: string;
  durationMinutes: number;
  lessons: Lesson[];
  completed: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  type: "video" | "reading" | "lab" | "quiz";
  durationMinutes: number;
  completed: boolean;
  locked: boolean;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  department: DepartmentId;
  level: LearningLevel;
  coursesCount: number;
  durationHours: number;
  progress: number;
  enrolledCount: number;
  thumbnail: string;
  skills: string[];
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  department: DepartmentId;
  level: LearningLevel;
  status: AssessmentStatus;
  attempts: number;
  maxAttempts: number;
  dueDate: string;
  score?: number;
  passingScore: number;
  durationMinutes: number;
  questionsCount: number;
  type: "mcq" | "mixed" | "coding" | "case_study";
}

export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  status: AssignmentStatus;
  dueDate: string;
  submittedAt?: string;
  score?: number;
  maxScore: number;
}

export interface Certificate {
  id: string;
  title: string;
  department: DepartmentId;
  level: LearningLevel;
  status: CertificateStatus;
  issuedAt?: string;
  expiresAt?: string;
  credentialId: string;
  score?: number;
  skills: string[];
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  current: number;
  target: number;
  department: DepartmentId;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  department: DepartmentId;
  xp: number;
  streak: number;
  certificates: number;
  badges: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface ActivityItem {
  id: string;
  type: "course" | "assessment" | "certificate" | "achievement" | "assignment";
  title: string;
  description: string;
  timestamp: string;
  meta?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "reminder" | "achievement";
  read: boolean;
  timestamp: string;
  href?: string | null;
}

export interface ChartPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: number;
}

```

### `src/db/queries/eligibility.ts`

```tsx
import { and, eq, inArray } from "drizzle-orm";
import { nextLearningLevel } from "@/db/catalog/employees";
import { getDb } from "@/db";
import { getCourseProgressPercent } from "@/db/queries/courses";
import {
  assessmentAttempts,
  assessments,
  courseAssignments,
  courses,
  profiles,
  users,
} from "@/db/schema";
import type { DepartmentId, LearningLevel } from "@/types";

export type CourseCareerState =
  | "not_started"
  | "in_progress"
  | "assessment_pending"
  | "certified";

export type CourseEligibilityRow = {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  assignmentId: string;
  lessonProgress: number;
  assessmentId: string | null;
  assessmentPassed: boolean;
  state: CourseCareerState;
};

export type PromotionEligibility = {
  userId: string;
  name: string;
  email: string;
  department: DepartmentId;
  designation: string;
  currentLevel: LearningLevel;
  nextLevel: LearningLevel | null;
  status: "in_progress" | "eligible" | "blocked" | "max_level";
  courses: CourseEligibilityRow[];
  certifiedCount: number;
  requiredCount: number;
  eligibleAt: string | null;
};

function deriveState(
  lessonProgress: number,
  assessmentId: string | null,
  assessmentPassed: boolean
): CourseCareerState {
  if (assessmentPassed && lessonProgress >= 100) return "certified";
  if (lessonProgress >= 100) return "assessment_pending";
  if (lessonProgress > 0) return "in_progress";
  return "not_started";
}

export async function getAssessmentForCourse(courseId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(assessments)
    .where(
      and(eq(assessments.courseId, courseId), eq(assessments.publishStatus, "published"))
    )
    .limit(1);
  return row ?? null;
}

export async function hasPassedAssessment(userId: string, assessmentId: string) {
  const db = getDb();
  const rows = await db
    .select({ passed: assessmentAttempts.passed })
    .from(assessmentAttempts)
    .where(
      and(
        eq(assessmentAttempts.userId, userId),
        eq(assessmentAttempts.assessmentId, assessmentId)
      )
    );
  return rows.some((r) => r.passed === true);
}

export async function computePromotionEligibility(
  userId: string
): Promise<PromotionEligibility | null> {
  const db = getDb();
  const [person] = await db
    .select({
      userId: profiles.userId,
      name: users.name,
      email: users.email,
      department: profiles.department,
      designation: profiles.designation,
      level: profiles.level,
      status: profiles.status,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!person || person.status !== "active") return null;

  const nextLevel = nextLearningLevel(person.level);

  const assignmentRows = await db
    .select({
      assignmentId: courseAssignments.id,
      courseId: courses.id,
      courseTitle: courses.title,
      courseSlug: courses.slug,
      courseLevel: courses.level,
      courseDept: courses.departmentId,
      mandatory: courseAssignments.mandatory,
    })
    .from(courseAssignments)
    .innerJoin(courses, eq(courses.id, courseAssignments.courseId))
    .where(
      and(
        eq(courseAssignments.userId, userId),
        eq(courseAssignments.mandatory, true),
        eq(courses.level, person.level),
        eq(courses.departmentId, person.department)
      )
    );

  const courseRows: CourseEligibilityRow[] = [];

  for (const row of assignmentRows) {
    const lessonProgress = await getCourseProgressPercent(userId, row.courseId);
    const assessment = await getAssessmentForCourse(row.courseId);
    const assessmentPassed = assessment
      ? await hasPassedAssessment(userId, assessment.id)
      : false;
    const state = deriveState(lessonProgress, assessment?.id ?? null, assessmentPassed);
    courseRows.push({
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      courseSlug: row.courseSlug,
      assignmentId: row.assignmentId,
      lessonProgress,
      assessmentId: assessment?.id ?? null,
      assessmentPassed,
      state,
    });
  }

  const requiredCount = courseRows.length;
  const certifiedCount = courseRows.filter((c) => c.state === "certified").length;

  let status: PromotionEligibility["status"];
  if (!nextLevel) {
    status = "max_level";
  } else if (requiredCount === 0) {
    status = "blocked";
  } else if (certifiedCount === requiredCount) {
    status = "eligible";
  } else if (courseRows.some((c) => c.state === "assessment_pending" && !c.assessmentId)) {
    status = "blocked";
  } else {
    status = "in_progress";
  }

  return {
    userId: person.userId,
    name: person.name ?? "Unknown",
    email: person.email ?? "",
    department: person.department,
    designation: person.designation,
    currentLevel: person.level,
    nextLevel,
    status,
    courses: courseRows,
    certifiedCount,
    requiredCount,
    eligibleAt: status === "eligible" ? new Date().toISOString() : null,
  };
}

export async function listPromotionEligibilities(filters?: {
  departmentId?: DepartmentId;
  status?: PromotionEligibility["status"] | "all";
}): Promise<PromotionEligibility[]> {
  const db = getDb();
  let people = await db
    .select({ userId: profiles.userId, department: profiles.department })
    .from(profiles)
    .where(eq(profiles.status, "active"));

  if (filters?.departmentId) {
    people = people.filter((p) => p.department === filters.departmentId);
  }

  const results: PromotionEligibility[] = [];
  for (const p of people) {
    const elig = await computePromotionEligibility(p.userId);
    if (!elig) continue;
    if (filters?.status && filters.status !== "all" && elig.status !== filters.status) {
      continue;
    }
    results.push(elig);
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

/** Assign published courses for a user's current dept+level (rule source). */
export async function assignLevelCoursesForUser(userId: string, assignedBy?: string | null) {
  const db = getDb();
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!profile) return { inserted: 0, skipped: 0 };

  const matching = await db
    .select({ id: courses.id, title: courses.title, slug: courses.slug })
    .from(courses)
    .where(
      and(
        eq(courses.departmentId, profile.department),
        eq(courses.level, profile.level),
        eq(courses.publishStatus, "published")
      )
    );

  let inserted = 0;
  let skipped = 0;

  for (const course of matching) {
    const [existing] = await db
      .select({ id: courseAssignments.id })
      .from(courseAssignments)
      .where(
        and(eq(courseAssignments.courseId, course.id), eq(courseAssignments.userId, userId))
      )
      .limit(1);

    if (existing) {
      skipped += 1;
      continue;
    }

    await db.insert(courseAssignments).values({
      courseId: course.id,
      userId,
      departmentId: profile.department,
      scope: "user",
      mandatory: true,
      source: "rule",
      assignedBy: assignedBy ?? null,
    });
    inserted += 1;
  }

  return { inserted, skipped, courses: matching };
}

export async function getUsersByIds(userIds: string[]) {
  if (userIds.length === 0) return [];
  const db = getDb();
  return db.select().from(users).where(inArray(users.id, userIds));
}

```

---

## 3. Data layer

All page data is loaded on the **client** via **TanStack React Query** calling **Next.js Server Actions** (`"use server"`). No Route Handlers (`app/api/...`) for this page. Auth: `requireUserId()` inside each action.

### Queries used by `DashboardPage`

| Hook | Query key | Server action | Returns |
|---|---|---|---|
| `useDashboardHome()` | `["dashboard-home"]` | `fetchDashboardHomeAction()` | home payload (below) |
| `useMyActiveCourses(8)` | `["courses","active",8]` | `fetchMyActiveCoursesAction(8)` | `Course[]` |
| `useLearnerAssessments()` | `["assessments","learner"]` | `fetchLearnerAssessmentsAction()` | `Assessment[]` |
| `useLearnerAssignments()` | `["assignments","learner"]` | `fetchLearnerAssignmentsAction()` | `Assignment[]` (homework) |
| `useLearnerCertificates()` | `["certificates","learner"]` | `fetchLearnerCertificatesAction()` | `Certificate[]` |
| `useMyAssignmentStats()` | `["course-assignments","stats"]` | `fetchMyAssignmentStatsAction()` | stats object |
| `useMyCourseAssignments()` | `["course-assignments","mine"]` | `fetchMyCourseAssignmentsAction()` | assigned-course rows |
| `useMyEligibility()` | `["my-eligibility"]` | `fetchMyEligibilityAction()` | `PromotionEligibility \| null` |

### `fetchDashboardHomeAction` return shape (inferred)

```ts
{
  user: User | null;
  prefs: UserPreferences;
  stats: {
    coursesCompleted: number;
    hoursLearned: number;
    certificates: number;
    averageScore: number;
    streak: number;
    companyRank: number;
    departmentRank: number;
    skillScore: number;
    todayGoalMinutes: number;
    todayCompletedMinutes: number;
  };
  weeklyHours: ChartPoint[];
  heatmapData: number[][];
  monthlyLearning: ChartPoint[];
  leaderboard: Array<{
    rank: number;
    userId: string;
    name: string;
    avatar: string;
    department: DepartmentId;
    xp: number;
    streak: number;
    certificates: number;
    badges: number;
  }>;
  orgSnapshot: unknown;
}
```

### Other return shapes

- **`Course` / `Assessment` / `Assignment` / `Certificate` / `ChartPoint` / `User` / `LearningLevel`:** `src/types/index.ts` (full file in §2).
- **`fetchMyAssignmentStatsAction`:** `{ total, mandatory, overdue, dueSoon, completed, inProgress: number }`
- **`fetchMyCourseAssignmentsAction` row:** see `listAssignmentsForUser` in `src/db/queries/course-assignments.ts` — fields include `id`, `courseId`, `courseSlug`, `title`, `dueDate`, `daysRemaining`, `progress`, `status`, `mandatory`, etc.
- **`PromotionEligibility`:** full type in `src/db/queries/eligibility.ts` (§2).

### Sample-ish home stats (shape only)

```json
{
  "stats": {
    "coursesCompleted": 2,
    "hoursLearned": 12,
    "certificates": 1,
    "averageScore": 78,
    "streak": 3,
    "companyRank": 4,
    "departmentRank": 2,
    "skillScore": 64,
    "todayGoalMinutes": 45,
    "todayCompletedMinutes": 24
  },
  "weeklyHours": [
    { "label": "Mon", "value": 2 },
    { "label": "Tue", "value": 1 },
    { "label": "Wed", "value": 3 },
    { "label": "Thu", "value": 2 },
    { "label": "Fri", "value": 2 },
    { "label": "Sat", "value": 1 },
    { "label": "Sun", "value": 0 }
  ]
}
```

Note: `weeklyHours` / “today minutes” are **derived heuristics** in `fetchDashboardHomeAction` (lesson counts → hours), not raw time-tracking.

---

## 4. Styling

- **Tailwind CSS v4** via `@import "tailwindcss"` in `src/app/globals.css`.
- **Tokens:** CSS variables on `:root` / `.dark`, mapped in `@theme inline` as `--color-*`, `--radius-*`, shadows.
- **Dark mode:** `class="dark"` on `<html>` (`next-themes`, `storageKey="nexus-theme"`). Blocking script `#nexus-theme-bootstrap` in root layout `<head>`.
- **Canonical design docs:** `DESIGN.md` (YAML frontmatter), `.impeccable/design.json` (shadows/scrim/density).
- **Fonts:** Poppins (`--font-sans`, `--font-display`), JetBrains Mono (`--font-mono`) via `next/font/google`.
- **Page patterns:** utilities (`bg-card`, `text-primary`, `rounded-3xl`, `shadow-(--shadow-sm)`), pastels (`from-pastel-purple`), Framer Motion fades.
- **Charts:** Recharts + CSS vars (`var(--chart-1)`, `var(--border)`).

---

## 5. State

| Layer | What | Where |
|---|---|---|
| Server | Auth + DB via Server Actions | `requireUserId`, Drizzle |
| Client page | Entire `DashboardPage` | `"use client"` in `page.tsx` |
| React Query | All lists + home | `Providers` (`staleTime: 0`, refetch on focus) |
| UI chrome | Sidebar, command, AI, notifications | Zustand `useUIStore` |
| Theme | light/dark/system | `next-themes` + `localStorage` `nexus-theme` |
| Session | NextAuth | `SessionProvider` |
| Ephemeral | `dueItems`, greetings, XP band | In-component only |

Layout = Server Component shell; page = client.

---

## 6. Current problems

### TypeScript
No `tsc` errors under `src/app/dashboard/page.tsx`, `layout.tsx`, or the listed page/layout child components.

Repo-wide failures elsewhere (not this route):
- `src/app/dashboard/admin/assessments/[assessmentId]/page.tsx` — TS2367
- `src/app/login/login-form.tsx` — TS2345
- `src/db/queries/assessments.ts` — TS2339

### Known issues on this page
1. **`ring-pending/20`** in `page.tsx` — no `--pending` token in `globals.css` (deleted by design). Likely invalid / no-op; should use pastel-yellow or warning.
2. Badge `variant="pending"` maps to pastel-yellow (OK); `ring-pending` does not match that system.
3. Some hero nudge copy (“on fire”) conflicts with DESIGN.md Calm Copy Rule.
4. No live browser console capture in this dump (needs logged-in session).

### Build
Full `next build` not re-run for this dump.
