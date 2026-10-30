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
import { Skeleton } from "@/components/ui/skeleton";
import { DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { useLearnerCertificates } from "@/hooks/use-certification";
import { usePublishedCourses } from "@/hooks/use-courses";
import { useCurrentUser, useDashboardHome, useMySkills } from "@/hooks/use-me";
import { cn, formatNumber, formatTrackedHours } from "@/lib/utils";
import { isActiveCourseStatus } from "@/lib/course-progress";
import { formatDistanceToNow } from "date-fns";

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser();
  const { data: home } = useDashboardHome();
  const { data: skillsData } = useMySkills();
  const { data: certificates = [] } = useLearnerCertificates();
  const { data: courses = [] } = usePublishedCourses();

  if (isLoading || !user) {
    return (
      <div className="space-y-4">
        <PageHeader title="My Profile" description="Loading your profile…" backHref="/dashboard" backLabel="Dashboard" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const earnedCerts = certificates.filter((c) => c.status === "earned");
  const inProgressCourses = courses.filter((c) => isActiveCourseStatus(c.status));
  const skills = skillsData?.skills ?? [];
  const stats = home?.stats;

  const milestones = [
    {
      date: user.joinDate
        ? new Date(user.joinDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        : "—",
      title: "Joined Skillrr",
      description: `Onboarded as ${user.designation} in ${DEPARTMENT_LABELS[user.department]}`,
    },
    ...earnedCerts.slice(0, 3).map((c) => ({
      date: c.issuedAt
        ? new Date(c.issuedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        : "Issued",
      title: "Certificate earned",
      description: c.title,
    })),
  ];

  const activity = [
    ...inProgressCourses.slice(0, 3).map((c) => ({
      id: c.id,
      title: c.title,
      description: `Course · ${c.progress}% complete`,
      timestamp: c.lastAccessed ?? new Date().toISOString(),
    })),
    ...earnedCerts.slice(0, 3).map((c) => ({
      id: c.id,
      title: c.title,
      description: `Certificate · ${c.credentialId}`,
      timestamp: c.issuedAt ?? new Date().toISOString(),
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Your learning journey, credentials, and career progress at Skillrr."
        backHref="/dashboard"
        backLabel="Dashboard"
      />

      <motion.section
        {...fade}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-(--shadow-sm) md:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[auto_1fr_auto]">
          <Avatar className="h-24 w-24 border-4 border-background shadow-(--shadow-md) md:h-28 md:w-28">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>

          <div>
            <h2 className="font-display text-2xl font-semibold md:text-3xl">{user.name}</h2>
            <p className="mt-1 text-muted-foreground">{user.designation}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{DEPARTMENT_LABELS[user.department]}</Badge>
              <Badge variant="outline">{LEVEL_LABELS[user.level]}</Badge>
              <Badge variant="success" className="gap-1">
                <Flame className="h-3 w-3" /> {user.streak}-day streak
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> {user.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Joined{" "}
                {new Date(user.joinDate).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span>{user.experienceYears} years experience</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 text-sm">
                <Zap className="h-4 w-4 text-warning" />
                <span className="font-semibold">{formatNumber(user.xp)} XP</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 text-sm">
                <Trophy className="h-4 w-4 text-primary" />
                <span>
                  #{stats?.companyRank || user.companyRank || "—"} company · #
                  {stats?.departmentRank || user.departmentRank || "—"} dept
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <CircularProgress
              value={skillsData?.skillScore ?? user.skillScore}
              size={130}
              label="Skill score"
              sublabel="Live"
            />
          </div>
        </div>
      </motion.section>

      <motion.section {...fade} transition={{ delay: 0.05 }} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Courses in progress" value={inProgressCourses.length} icon={BookOpen} />
        <StatCard
          title="Hours Learned"
          value={formatTrackedHours(stats?.hoursLearned ?? 0)}
          icon={TrendingUp}
          subtitle="Completed lessons"
        />
        <StatCard
          title="Certificates"
          value={earnedCerts.length}
          icon={Award}
          subtitle={`${certificates.filter((c) => c.status === "locked").length} locked`}
        />
        <StatCard
          title="Average Score"
          value={`${stats?.averageScore ?? 0}%`}
          icon={Target}
        />
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Career timeline</CardTitle>
            <CardDescription>Milestones from your Skillrr account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-0">
              {milestones.map((milestone, i) => (
                <div key={`${milestone.title}-${i}`} className="relative flex gap-4 pb-8 last:pb-0">
                  {i < milestones.length - 1 && (
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

        <Card>
          <CardHeader>
            <CardTitle>Goals</CardTitle>
            <CardDescription>Your active learning objectives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(user.goals.length ? user.goals : ["Complete a learning path", "Earn a certificate"]).map(
              (goal) => (
                <div key={goal} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm">{goal}</p>
                </div>
              )
            )}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/settings">Edit in settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Certificates</CardTitle>
            <CardDescription>Earned and locked credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {certificates.length === 0 && (
              <p className="text-sm text-muted-foreground">No certificates yet.</p>
            )}
            {certificates.slice(0, 6).map((cert) => (
              <Link
                key={cert.id}
                href={`/dashboard/certificates/${cert.id}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition hover:border-primary/30"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    cert.status === "earned"
                      ? "bg-warning/15 text-warning"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Award className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{cert.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{cert.status}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills overview</CardTitle>
            <CardDescription>From your courses and certificates</CardDescription>
          </CardHeader>
          <CardContent>
            {skills.length > 0 ? (
              <>
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
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Complete courses to build your skill matrix.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Learning history</CardTitle>
            <CardDescription>Recent courses and credentials</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/learning">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {activity.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          <div className="pt-2">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              In progress
            </p>
            {inProgressCourses.map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.slug ?? course.id}`}
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
    </div>
  );
}
