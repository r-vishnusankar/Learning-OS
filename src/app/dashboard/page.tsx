"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award,
  Bell,
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  Flame,
  MoreVertical,
  Play,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatCard } from "@/components/cards/stat-card";
import { CourseCard } from "@/components/cards/course-card";
import { HoursChart } from "@/components/charts/learning-charts";
import {
  assignments,
  courses,
  currentUser,
  dashboardStats,
  leaderboard,
  weeklyHours,
  certificates,
  assessments,
} from "@/data/mock";
import { formatNumber } from "@/lib/utils";

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const taskToday = [
  { id: 1, title: "Finish Redis Caching lab", time: "10:00–11:00", priority: true },
  { id: 2, title: "Review System Design quiz", time: "14:00–14:45", priority: true },
  { id: 3, title: "Watch CI/CD intro module", time: "16:00–16:30", priority: false },
  { id: 4, title: "Update learning goals", time: "17:00–17:15", priority: false },
  { id: 5, title: "Peer review assignment", time: "18:00–18:30", priority: false },
];

const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);

export default function DashboardPage() {
  const continueCourse = courses.find((c) => c.status === "in_progress");
  const myCourses = courses.filter((c) => c.status === "in_progress" || c.status === "completed").slice(0, 3);
  const upcomingAssessment = assessments.find((a) =>
    ["available", "upcoming", "in_progress"].includes(a.status)
  );
  const pendingAssignment = assignments.find((a) => a.status === "pending" || a.status === "overdue");
  const goalPct = Math.round(
    (dashboardStats.todayCompletedMinutes / dashboardStats.todayGoalMinutes) * 100
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      {/* Main column */}
      <div className="space-y-6">
        {/* My courses */}
        <motion.section {...fade} transition={{ duration: 0.4 }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">My courses</h2>
            <Button asChild variant="ghost" size="sm" className="text-primary">
              <Link href="/dashboard/learning">View all</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myCourses.map((c) => (
              <CourseCard key={c.id} course={c} variant="pastel" />
            ))}
          </div>
        </motion.section>

        {/* Charts row */}
        <motion.section
          {...fade}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="grid gap-4 lg:grid-cols-2"
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Hours Activity</CardTitle>
                <CardDescription>This week&apos;s learning</CardDescription>
              </div>
              <Badge variant="secondary" className="rounded-full font-normal">
                +2h vs last week
              </Badge>
            </CardHeader>
            <CardContent>
              <HoursChart data={weeklyHours} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completed tasks</CardTitle>
              <CardDescription>By learning category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="var(--pastel-purple)" strokeWidth="5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="5"
                      strokeDasharray="55 100"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="var(--destructive)"
                      strokeWidth="5"
                      strokeDasharray="25 100"
                      strokeDashoffset="-55"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#FFE180"
                      strokeWidth="5"
                      strokeDasharray="20 100"
                      strokeDashoffset="-80"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="font-display text-2xl font-semibold">{dashboardStats.coursesCompleted * 8}</p>
                    <p className="text-[10px] text-muted-foreground">Tasks</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Engineering</span>
                    <span className="ml-auto font-semibold">55%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
                    <span className="text-muted-foreground">QA / Testing</span>
                    <span className="ml-auto font-semibold">25%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FFE180]" />
                    <span className="text-muted-foreground">DevOps</span>
                    <span className="ml-auto font-semibold">20%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Upcoming submission */}
        {(pendingAssignment || upcomingAssessment) && (
          <motion.section {...fade} transition={{ delay: 0.1, duration: 0.4 }}>
            <Card className="overflow-hidden">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pastel-purple text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Upcoming submission
                    </p>
                    <h3 className="mt-1 font-display text-base font-semibold">
                      {pendingAssignment?.title ?? upcomingAssessment?.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {pendingAssignment
                        ? `${pendingAssignment.courseTitle} · Due ${new Date(pendingAssignment.dueDate).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}`
                        : `Assessment · Due ${upcomingAssessment ? new Date(upcomingAssessment.dueDate).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }) : ""}`}
                    </p>
                  </div>
                </div>
                <Button asChild className="shrink-0">
                  <Link
                    href={
                      pendingAssignment
                        ? "/dashboard/assignments"
                        : `/dashboard/assessments/${upcomingAssessment?.id}`
                    }
                  >
                    Submit task
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Stats */}
        <motion.section
          {...fade}
          transition={{ delay: 0.12, duration: 0.4 }}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard title="Courses Completed" value={dashboardStats.coursesCompleted} icon={BookOpen} trend="+2 this month" />
          <StatCard title="Hours Learned" value={dashboardStats.hoursLearned} icon={Clock} subtitle="Lifetime" accent="#8759F2" />
          <StatCard title="Certificates" value={dashboardStats.certificates} icon={Award} subtitle={`${certificates.filter((c) => c.status === "earned").length} earned`} accent="#FF3E80" />
          <StatCard title="Avg Score" value={`${dashboardStats.averageScore}%`} icon={TrendingUp} trend="+4%" />
        </motion.section>

        {/* Continue + leaderboard strip */}
        <div className="grid gap-4 lg:grid-cols-2">
          {continueCourse && (
            <Card className="bg-linear-to-br from-pastel-purple to-card">
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-full border-0 bg-white/90 text-primary dark:bg-white/15 dark:text-primary">
                      <Flame className="mr-1 h-3 w-3" /> {currentUser.streak}-day streak
                    </Badge>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{continueCourse.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {dashboardStats.todayCompletedMinutes}/{dashboardStats.todayGoalMinutes} min today · {goalPct}% of goal
                  </p>
                  <Progress value={continueCourse.progress} className="mt-3 h-2" />
                  <div className="mt-4 flex gap-2">
                    <Button asChild size="sm">
                      <Link href={`/dashboard/courses/${continueCourse.id}`}>
                        <Play className="h-3.5 w-3.5" /> Continue
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="bg-white/60 dark:bg-white/10">
                      <Link href="/dashboard/ai-mentor">
                        <Sparkles className="h-3.5 w-3.5" /> Ask AI
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="relative flex h-28 w-28 shrink-0 items-center justify-center self-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${continueCourse.progress} 100`}
                    />
                  </svg>
                  <span className="absolute font-display text-xl font-semibold">{continueCourse.progress}%</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" /> Top learners
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/leaderboard">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard.slice(0, 4).map((entry) => (
                <div key={entry.userId} className="flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-bold text-muted-foreground">
                    {entry.rank}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={entry.avatar} />
                    <AvatarFallback>{entry.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{entry.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatNumber(entry.xp)} XP</p>
                  </div>
                  {entry.userId === currentUser.id && (
                    <Badge variant="accent" className="rounded-full">You</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right panel — EduSphere style */}
      <motion.aside
        {...fade}
        transition={{ delay: 0.08, duration: 0.4 }}
        className="space-y-5"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="h-4 w-4 text-primary" /> July 2026
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={`${d}-${i}`}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* July 2026 starts Wednesday */}
              {[0, 1, 2].map((i) => (
                <span key={`empty-${i}`} />
              ))}
              {calendarDays.map((day) => {
                const isToday = day === 14;
                const hasEvent = [13, 14, 15, 18, 22, 25].includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    className={`flex h-8 items-center justify-center rounded-full text-xs transition ${
                      isToday
                        ? "bg-primary font-semibold text-white shadow-(--shadow-sm)"
                        : hasEvent
                          ? "bg-pastel-purple font-medium text-primary hover:bg-primary/20"
                          : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Task today</CardTitle>
            <CardDescription>Your daily learning plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {taskToday.map((task) => (
              <div
                key={task.id}
                className={`rounded-2xl p-3 ${
                  task.priority ? "bg-pastel-yellow" : "bg-muted/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium leading-snug">{task.title}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{task.time}</p>
                  </div>
                  {task.priority ? (
                    <Bell className="h-3.5 w-3.5 shrink-0 text-[#c9a227]" />
                  ) : (
                    <MoreVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
            <Button className="mt-2 w-full" asChild>
              <Link href="/dashboard/assignments">
                <Target className="h-4 w-4" /> Create a New Task
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-pastel-pink">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
              Company rank
            </p>
            <p className="mt-1 font-display text-3xl font-semibold">#{dashboardStats.companyRank}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Dept rank #{dashboardStats.departmentRank} · Skill score {dashboardStats.skillScore}
            </p>
          </CardContent>
        </Card>
      </motion.aside>
    </div>
  );
}
