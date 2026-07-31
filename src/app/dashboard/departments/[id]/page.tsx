"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FlaskConical,
  Lock,
  Trophy,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/cards/stat-card";
import { CourseCard } from "@/components/cards/course-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublishedCourses } from "@/hooks/use-courses";
import { useDepartmentsLive, useLeaderboardLive } from "@/hooks/use-operations";
import { LEVELS, LEVEL_LABELS } from "@/constants/navigation";
import { cn, formatNumber } from "@/lib/utils";
import type { DepartmentId, LearningLevel } from "@/types";

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

interface LevelRoadmap {
  videos: number;
  reading: number;
  assignments: number;
  labs: number;
  assessment: string;
  certificate: string;
  xp: number;
  badge: string;
  unlock: string;
}

const levelRoadmaps: Record<LearningLevel, LevelRoadmap> = {
  beginner: { videos: 6, reading: 4, assignments: 2, labs: 0, assessment: "Foundations Quiz", certificate: "Foundation Certificate", xp: 200, badge: "Rising Star", unlock: "None — open to all" },
  associate: { videos: 8, reading: 5, assignments: 3, labs: 1, assessment: "Core Skills Exam", certificate: "Associate Certificate", xp: 400, badge: "Quick Learner", unlock: "Complete Beginner level" },
  intermediate: { videos: 10, reading: 6, assignments: 4, labs: 2, assessment: "Applied Skills Test", certificate: "Intermediate Professional", xp: 650, badge: "Skill Builder", unlock: "Associate cert + 80% avg score" },
  advanced: { videos: 12, reading: 7, assignments: 5, labs: 3, assessment: "Advanced Case Study", certificate: "Advanced Specialist", xp: 900, badge: "Deep Diver", unlock: "Intermediate cert + 2 courses" },
  senior: { videos: 14, reading: 8, assignments: 6, labs: 4, assessment: "Senior Capstone", certificate: "Senior Professional", xp: 1200, badge: "Trailblazer", unlock: "Advanced cert + mentor approval" },
  lead: { videos: 10, reading: 6, assignments: 4, labs: 2, assessment: "Leadership Assessment", certificate: "Team Lead Certificate", xp: 1000, badge: "Team Catalyst", unlock: "Senior cert + 1 year tenure" },
  architect: { videos: 16, reading: 10, assignments: 6, labs: 5, assessment: "Architecture Review Board", certificate: "Architect Credential", xp: 1500, badge: "Visionary", unlock: "Senior cert + portfolio review" },
  expert: { videos: 8, reading: 5, assignments: 3, labs: 3, assessment: "Expert Panel Evaluation", certificate: "Expert Mastery Badge", xp: 2000, badge: "Nexus Legend", unlock: "Architect cert + contribution score 90+" },
};

export default function DepartmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: departments = [], isLoading: deptsLoading } = useDepartmentsLive();
  const { data: leaderboard = [], isLoading: lbLoading } = useLeaderboardLive();
  const { data: allCourses = [], isLoading: coursesLoading } = usePublishedCourses();

  const department = departments.find((d) => d.id === id);

  const deptCourses = useMemo(
    () => (department ? allCourses.filter((c) => c.department === department.id) : []),
    [department, allCourses]
  );

  const topPerformers = useMemo(
    () =>
      department
        ? leaderboard
            .filter((e) => e.department === department.id)
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 5)
        : [],
    [department, leaderboard]
  );

  if (deptsLoading || lbLoading || coursesLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Department" description="Loading department hub…" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!department) {
    return (
      <div className="space-y-6">
        <PageHeader title="Department" description="Department learning hub" />
        <EmptyState
          title="Department not found"
          description="The department you're looking for doesn't exist or may have been moved."
          actionLabel="Browse departments"
          onAction={() => router.push("/dashboard/departments")}
        />
      </div>
    );
  }

  const completedCourses = deptCourses.filter((c) => c.status === "completed").length;
  const inProgressCourses = deptCourses.filter((c) => c.status === "in_progress").length;

  return (
    <div className="space-y-6">
      <PageHeader title={department.name} description={department.description}>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/departments">All departments</Link>
        </Button>
      </PageHeader>

      <motion.section
        {...fade}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-(--shadow-sm)"
        style={{ borderTopColor: department.color, borderTopWidth: 4 }}
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl"
          style={{ backgroundColor: `${department.color}15` }}
        />
        <div className="relative grid gap-6 md:grid-cols-4">
          {[
            { label: "Employees", value: department.employeeCount, icon: Users },
            { label: "Courses", value: department.courseCount, icon: BookOpen },
            { label: "Avg completion", value: `${department.avgCompletion}%`, icon: CheckCircle2 },
            { label: "Active learners", value: Math.round(department.employeeCount * 0.72), icon: Trophy },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${department.color}18`, color: department.color }}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="font-display text-xl font-semibold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section {...fade} transition={{ delay: 0.05 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Dept Completion" value={`${department.avgCompletion}%`} icon={CheckCircle2} accent="primary" />
        <StatCard title="Available Courses" value={deptCourses.length || department.courseCount} icon={BookOpen} subtitle={`${inProgressCourses} in progress`} accent="info" />
        <StatCard title="Completed" value={completedCourses} icon={Award} subtitle="By current user" accent="warning" />
        <StatCard title="Top XP" value={formatNumber(topPerformers[0]?.xp ?? 0)} icon={Trophy} subtitle={topPerformers[0]?.name.split(" ")[0] ?? "—"} accent="success" />
      </motion.section>

      <motion.section {...fade} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle>Learning roadmap</CardTitle>
            <CardDescription>Progression path from Beginner to Expert with unlock requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-4 top-0 hidden h-full w-px bg-border md:block" />
              <div className="space-y-6">
                {LEVELS.map((level, i) => {
                  const roadmap = levelRoadmaps[level];
                  const isUnlocked = i <= 3;
                  return (
                    <motion.div
                      key={level}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "relative rounded-xl border p-5 md:ml-8",
                        isUnlocked ? "border-border bg-card" : "border-dashed border-border/60 bg-muted/30"
                      )}
                    >
                      <div
                        className="absolute -left-8 top-6 hidden h-4 w-4 rounded-full border-2 border-background md:block"
                        style={{ backgroundColor: isUnlocked ? department.color : "var(--muted-foreground)" }}
                      />
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-base font-semibold">{LEVEL_LABELS[level]}</h3>
                            {!isUnlocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                            <Badge variant={isUnlocked ? "success" : "secondary"}>
                              {isUnlocked ? "Unlocked" : "Locked"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Unlock: {roadmap.unlock}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="gap-1">
                            <Zap className="h-3 w-3" /> {roadmap.xp} XP
                          </Badge>
                          <Badge variant="outline">{roadmap.badge}</Badge>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          { icon: Video, label: "Videos", value: roadmap.videos },
                          { icon: BookOpen, label: "Reading", value: roadmap.reading },
                          { icon: FileText, label: "Assignments", value: roadmap.assignments },
                          { icon: FlaskConical, label: "Labs", value: roadmap.labs },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">{item.label}</p>
                              <p className="text-sm font-semibold">{item.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-primary">
                          <ClipboardCheck className="h-3.5 w-3.5" /> {roadmap.assessment}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-warning/10 px-2.5 py-1 text-warning">
                          <Award className="h-3.5 w-3.5" /> {roadmap.certificate}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div {...fade} transition={{ delay: 0.15 }} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Top performers</CardTitle>
              <CardDescription>Highest XP earners in {department.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topPerformers.length > 0 ? (
                topPerformers.map((entry, i) => (
                  <div key={entry.userId} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <span className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                      i === 0 ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
                    )}>
                      {i + 1}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.avatar} />
                      <AvatarFallback>{entry.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.name}</p>
                      <p className="text-[11px] text-muted-foreground">{formatNumber(entry.xp)} XP · {entry.streak}d streak</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No performers data available.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fade} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Department courses</CardTitle>
                <CardDescription>Available learning content for {department.name}</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/courses">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {deptCourses.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {deptCourses.map((course) => (
                    <CourseCard key={course.id} course={course} variant="compact" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {deptCourses.slice(0, 2).map((course) => (
                    <CourseCard key={course.id} course={{ ...course, department: department.id as DepartmentId }} variant="compact" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.section {...fade} transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Department learning metrics and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Enrollment rate", value: 84, color: department.color },
                { label: "Course completion", value: department.avgCompletion, color: "#059669" },
                { label: "Assessment pass rate", value: 76, color: "#0284C7" },
                { label: "Avg weekly hours", value: 4.2, isHours: true, color: "#D97706" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 font-display text-2xl font-semibold">
                    {metric.isHours ? `${metric.value}h` : `${metric.value}%`}
                  </p>
                  {!metric.isHours && <Progress value={metric.value as number} className="mt-3 h-2" />}
                  {metric.isHours && (
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${(metric.value / 8) * 100}%`, backgroundColor: metric.color }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { label: "Certificates issued", value: Math.round(department.employeeCount * 0.35) },
                { label: "Active streaks", value: Math.round(department.employeeCount * 0.48) },
                { label: "Mentor sessions", value: Math.round(department.employeeCount * 0.12) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
