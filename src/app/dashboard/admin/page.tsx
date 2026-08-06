"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Brain,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  Folders,
  GraduationCap,
  Route,
  Shield,
  TrendingUp,
  UserRoundSearch,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics, useDepartmentsLive, useLeaderboardLive } from "@/hooks/use-operations";
import { DEPARTMENT_LABELS } from "@/constants/navigation";
import { cn, formatNumber } from "@/lib/utils";

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
};

type QuickLink = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const primaryActions = [
  {
    title: "Employee Progress",
    href: "/dashboard/admin/employee-progress",
    icon: UserRoundSearch,
  },
  {
    title: "Promotions",
    href: "/dashboard/admin/promotions",
    icon: TrendingUp,
  },
] as const;

const adminTools: QuickLink[] = [
  {
    title: "Course assignments",
    description: "Assign mandatory courses by level",
    href: "/dashboard/admin/course-assignments",
    icon: BookOpen,
  },
  {
    title: "Course management",
    description: "Publish and archive catalog courses",
    href: "/dashboard/admin/courses",
    icon: Folders,
  },
  {
    title: "Assessments",
    description: "Build quizzes and knowledge checks",
    href: "/dashboard/admin/assessments",
    icon: ClipboardCheck,
  },
  {
    title: "Homework",
    description: "Create and review submissions",
    href: "/dashboard/admin/assignments",
    icon: FileText,
  },
  {
    title: "Learning paths",
    description: "Design multi-course journeys",
    href: "/dashboard/admin/paths",
    icon: Route,
  },
  {
    title: "Users",
    description: "Roles, invites, and access",
    href: "/dashboard/admin/users",
    icon: Users,
  },
  {
    title: "Certificates",
    description: "Issue, revoke, and reissue",
    href: "/dashboard/admin/certificates",
    icon: Award,
  },
  {
    title: "Catalog audit",
    description: "Validate course URLs and media",
    href: "/dashboard/admin/catalog-audit",
    icon: ClipboardCheck,
  },
];

function SectionLink({ href, children }: { href: string; children: ReactNode }) {
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

export default function AdminPage() {
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { data: departments = [], isLoading: deptsLoading } = useDepartmentsLive();
  const { data: leaderboard = [], isLoading: lbLoading } = useLeaderboardLive();

  if (analyticsLoading || deptsLoading || lbLoading || !analytics) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const { snapshot } = analytics;
  const avgCompletion =
    snapshot.departments.length === 0
      ? 0
      : Math.round(
          snapshot.departments.reduce((s, d) => s + d.avgCompletion, 0) /
            snapshot.departments.length
        );

  const sortedByCompletion = [...snapshot.departments].sort(
    (a, b) => a.avgCompletion - b.avgCompletion
  );
  const lowest = sortedByCompletion[0];
  const highest = sortedByCompletion[sortedByCompletion.length - 1];

  const insights = [
    lowest
      ? {
          title: `${lowest.name} needs support`,
          description: `Completion at ${lowest.avgCompletion}% vs ${avgCompletion}% org average.`,
          priority: "high" as const,
        }
      : null,
    highest
      ? {
          title: `${highest.name} leads adoption`,
          description: `${highest.avgCompletion}% completion — share their playbook.`,
          priority: "medium" as const,
        }
      : null,
    {
      title: "Assessment activity",
      description: `${snapshot.assessmentsTaken} taken · ${snapshot.avgAssessmentScore}% avg score.`,
      priority: "low" as const,
    },
  ].filter(Boolean) as {
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }[];

  const displayDepartments = departments.length > 0 ? departments : snapshot.departments;
  const learningHours = Math.round(snapshot.completedLessons * 0.5);

  const metrics = [
    {
      label: "Employees",
      value: formatNumber(snapshot.totalUsers),
      meta: `${snapshot.activeUsers} active`,
      icon: Users,
    },
    {
      label: "Active courses",
      value: String(snapshot.publishedCourses),
      meta: `${snapshot.publishedAssessments} assessments`,
      icon: BookOpen,
    },
    {
      label: "Learning hours",
      value: formatNumber(learningHours),
      meta: `${formatNumber(snapshot.completedLessons)} lessons`,
      icon: Clock,
    },
    {
      label: "Completion",
      value: `${avgCompletion}%`,
      meta: `${formatNumber(snapshot.certificatesEarned)} certificates`,
      icon: GraduationCap,
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* 1. Header */}
      <motion.header {...fade} className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Admin Overview</h1>
              <Badge variant="outline" className="gap-1 font-normal">
                <Shield className="h-3 w-3" />
                Department Head
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Org health, who needs attention, and the tools to act.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {primaryActions.map((action) => (
              <Button key={action.href} asChild size="sm" variant={action === primaryActions[0] ? "default" : "outline"} className="h-9 gap-1.5">
                <Link href={action.href}>
                  <action.icon className="h-3.5 w-3.5" />
                  {action.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </motion.header>

      {/* 2. KPI strip — one composition, not four competing cards */}
      <motion.section
        {...fade}
        transition={{ ...fade.transition, delay: 0.03 }}
        className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4"
      >
        {metrics.map((m) => (
          <div key={m.label} className="bg-card px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <m.icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            </div>
            <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight tabular-nums">
              {m.value}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{m.meta}</p>
          </div>
        ))}
      </motion.section>

      {/* 3. Attention + Top performers */}
      <motion.section
        {...fade}
        transition={{ ...fade.transition, delay: 0.05 }}
        className="grid gap-4 lg:grid-cols-12 lg:gap-5"
      >
        <div className="flex min-h-0 flex-col rounded-xl border border-border bg-card lg:col-span-7">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-sm font-semibold tracking-tight">Needs attention</h2>
            </div>
            <span className="text-[11px] text-muted-foreground">{insights.length} signals</span>
          </div>
          <ul className="divide-y divide-border">
            {insights.map((insight) => (
              <li key={insight.title} className="flex gap-3 px-4 py-3">
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    insight.priority === "high" && "bg-destructive",
                    insight.priority === "medium" && "bg-warning",
                    insight.priority === "low" && "bg-muted-foreground/40"
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <Badge
                      variant={
                        insight.priority === "high"
                          ? "destructive"
                          : insight.priority === "medium"
                            ? "warning"
                            : "secondary"
                      }
                      className="px-1.5 py-0 text-[10px] capitalize"
                    >
                      {insight.priority}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{insight.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-h-0 flex-col rounded-xl border border-border bg-card lg:col-span-5">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold tracking-tight">Top performers</h2>
            <SectionLink href="/dashboard/leaderboard">Leaderboard</SectionLink>
          </div>
          <ul className="divide-y divide-border">
            {leaderboard.slice(0, 5).map((entry) => (
              <li key={entry.userId} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                  {entry.rank}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={entry.avatar} alt="" />
                  <AvatarFallback className="text-xs">{entry.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{entry.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {DEPARTMENT_LABELS[entry.department]} · {formatNumber(entry.xp)} XP
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] tabular-nums text-muted-foreground">
                  <Award className="h-3 w-3" aria-hidden />
                  {entry.certificates}
                </span>
              </li>
            ))}
            {leaderboard.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                No leaderboard data yet.
              </li>
            )}
          </ul>
        </div>
      </motion.section>

      {/* 4. Department health */}
      <motion.section
        {...fade}
        transition={{ ...fade.transition, delay: 0.07 }}
        className="rounded-xl border border-border bg-card"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Department completion</h2>
            <p className="text-[11px] text-muted-foreground">
              Average course completion · org avg {avgCompletion}%
            </p>
          </div>
          <SectionLink href="/dashboard/departments">Departments</SectionLink>
        </div>
        <div className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2">
          {displayDepartments.slice(0, 8).map((dept) => (
            <div key={dept.id}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium">{dept.name}</span>
                <span
                  className={cn(
                    "shrink-0 tabular-nums text-xs",
                    dept.avgCompletion < avgCompletion
                      ? "font-medium text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {dept.avgCompletion}%
                </span>
              </div>
              <Progress value={dept.avgCompletion} className="h-1.5" />
            </div>
          ))}
          {displayDepartments.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
              No department data yet.
            </p>
          )}
        </div>
      </motion.section>

      {/* 5. Admin tools — dense grid, not stacked cards */}
      <motion.section {...fade} transition={{ ...fade.transition, delay: 0.09 }} className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Admin tools</h2>
          <p className="text-[11px] text-muted-foreground">Jump to the console you need</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {adminTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card px-3.5 py-3 transition-colors hover:border-primary/35 hover:bg-muted/30"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                <tool.icon className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight group-hover:text-primary">
                  {tool.title}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                  {tool.description}
                </p>
              </div>
              <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
