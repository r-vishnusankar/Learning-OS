"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Flame,
  Mail,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/cards/stat-card";
import { CircularProgress } from "@/components/charts/circular-progress";
import { SkillRadarChart } from "@/components/charts/learning-charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  achievements,
  certificates,
  courses,
  currentUser,
  dashboardStats,
  recentActivity,
  skills,
} from "@/data/mock";
import { DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { cn, formatNumber } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const careerMilestones = [
  { date: "Mar 2022", title: "Joined Nexus Corp", description: "Onboarded as Software Engineer in Development" },
  { date: "Aug 2023", title: "Promoted to Senior Engineer", description: "Led microservices migration initiative" },
  { date: "Nov 2025", title: "First Certificate Earned", description: "TypeScript Professional certification" },
  { date: "Jul 2026", title: "Top 10 Company Rank", description: "Reached #8 on company leaderboard" },
];

const rarityColors = {
  common: "bg-muted text-muted-foreground",
  rare: "bg-info/15 text-info",
  epic: "bg-primary/15 text-primary",
  legendary: "bg-warning/15 text-warning",
};

export default function ProfilePage() {
  const earnedCerts = certificates.filter((c) => c.status === "earned");
  const inProgressCourses = courses.filter((c) => c.status === "in_progress");
  const earnedAchievements = achievements.filter((a) => a.earned);

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Your learning journey, credentials, and career progress at Nexus." />

      <motion.section
        {...fade}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-(--shadow-sm) md:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[auto_1fr_auto]">
          <Avatar className="h-24 w-24 border-4 border-background shadow-(--shadow-md) md:h-28 md:w-28">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
          </Avatar>

          <div>
            <h2 className="font-display text-2xl font-semibold md:text-3xl">{currentUser.name}</h2>
            <p className="mt-1 text-muted-foreground">{currentUser.designation}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{DEPARTMENT_LABELS[currentUser.department]}</Badge>
              <Badge variant="outline">{LEVEL_LABELS[currentUser.level]}</Badge>
              <Badge variant="success" className="gap-1">
                <Flame className="h-3 w-3" /> {currentUser.streak}-day streak
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> {currentUser.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Joined {new Date(currentUser.joinDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
              <span>{currentUser.experienceYears} years experience</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 text-sm">
                <Zap className="h-4 w-4 text-warning" />
                <span className="font-semibold">{formatNumber(currentUser.xp)} XP</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 text-sm">
                <Trophy className="h-4 w-4 text-primary" />
                <span>#{currentUser.companyRank} company · #{currentUser.departmentRank} dept</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <CircularProgress value={currentUser.skillScore} size={130} label="Skill score" sublabel="Target: 90" />
          </div>
        </div>
      </motion.section>

      <motion.section {...fade} transition={{ delay: 0.05 }} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Courses Completed" value={dashboardStats.coursesCompleted} icon={BookOpen} trend="+2 this month" />
        <StatCard title="Hours Learned" value={dashboardStats.hoursLearned} icon={TrendingUp} subtitle="Lifetime" accent="#0284C7" />
        <StatCard title="Certificates" value={earnedCerts.length} icon={Award} subtitle={`${certificates.length - earnedCerts.length} in progress`} accent="#D97706" />
        <StatCard title="Average Score" value={`${dashboardStats.averageScore}%`} icon={Target} trend="+4%" accent="#0F766E" />
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div {...fade} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Career timeline</CardTitle>
              <CardDescription>Key milestones in your Nexus journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-0">
                {careerMilestones.map((milestone, i) => (
                  <div key={milestone.title} className="relative flex gap-4 pb-8 last:pb-0">
                    {i < careerMilestones.length - 1 && (
                      <div className="absolute left-[11px] top-6 h-full w-px bg-border" />
                    )}
                    <div className="relative z-10 mt-1 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-primary bg-card">
                      <div className="absolute inset-1 rounded-full bg-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-primary">{milestone.date}</p>
                      <p className="text-sm font-semibold">{milestone.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fade} transition={{ delay: 0.15 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Goals</CardTitle>
              <CardDescription>Your active learning objectives</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentUser.goals.map((goal) => (
                <div key={goal} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm">{goal}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Certificates</CardTitle>
            <CardDescription>Earned and in-progress credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {certificates.map((cert) => (
              <div key={cert.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  cert.status === "earned" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
                )}>
                  <Award className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{cert.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {cert.status === "earned" ? `Issued ${cert.issuedAt} · Score ${cert.score}%` : cert.status}
                  </p>
                </div>
                <Badge variant={cert.status === "earned" ? "success" : "secondary"} className="capitalize shrink-0">
                  {cert.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills overview</CardTitle>
            <CardDescription>Proficiency across tracked competencies</CardDescription>
          </CardHeader>
          <CardContent>
            <SkillRadarChart skills={skills} />
            <div className="mt-4 space-y-2">
              {skills.slice(0, 4).map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="w-28 truncate text-xs">{s.name}</span>
                  <Progress value={s.current} className="h-1.5 flex-1" />
                  <span className="w-10 text-right text-xs font-medium">{s.current}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Learning history</CardTitle>
              <CardDescription>Recent courses and activity</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/learning">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    {activity.meta ? ` · ${activity.meta}` : ""}
                  </p>
                </div>
              </div>
            ))}
            <div className="pt-2">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">In progress</p>
              {inProgressCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/dashboard/courses/${course.id}`}
                  className="mb-2 flex items-center gap-3 rounded-lg border border-border p-3 transition hover:border-primary/30"
                >
                  <BookOpen className="h-4 w-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{course.title}</p>
                    <Progress value={course.progress} className="mt-2 h-1.5" />
                  </div>
                  <span className="text-xs font-medium text-primary">{course.progress}%</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>{earnedAchievements.length} of {achievements.length} unlocked</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={cn(
                  "rounded-lg border p-3",
                  ach.earned ? "border-border" : "border-dashed border-border/60 opacity-50"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{ach.title}</p>
                  <Badge className={cn("capitalize", rarityColors[ach.rarity])} variant="outline">
                    {ach.rarity}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{ach.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance stats</CardTitle>
          <CardDescription>Key metrics for your learning performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Skill score", value: currentUser.skillScore, target: 90 },
              { label: "Avg assessment", value: dashboardStats.averageScore, target: 85 },
              { label: "Completion rate", value: Math.round((dashboardStats.coursesCompleted / courses.length) * 100), target: 80 },
              { label: "Today's goal", value: Math.round((dashboardStats.todayCompletedMinutes / dashboardStats.todayGoalMinutes) * 100), target: 100 },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 font-display text-2xl font-semibold">{stat.value}%</p>
                <Progress value={stat.value} className="mt-3 h-2" />
                <p className="mt-1 text-[11px] text-muted-foreground">Target: {stat.target}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
