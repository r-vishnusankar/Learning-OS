"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Target, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/cards/stat-card";
import { CircularProgress } from "@/components/charts/circular-progress";
import { SkillGrowthChart, SkillRadarChart } from "@/components/charts/learning-charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { courses, departments, skills, skillGrowth, currentUser } from "@/data/mock";
import { DEPARTMENT_LABELS } from "@/constants/navigation";
import { cn, formatPercent } from "@/lib/utils";
import type { Course, Skill } from "@/types";

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function careerReadiness(skillsList: Skill[]) {
  const score = Math.round(
    skillsList.reduce((sum, s) => sum + (s.current / s.target) * 100, 0) / skillsList.length
  );
  const gaps = skillsList.filter((s) => s.current < s.target * 0.8).length;
  return { score, gaps };
}

function findCoursesForSkill(skill: Skill): Course[] {
  return courses.filter(
    (c) =>
      c.department === skill.department ||
      c.tags.some((t) => skill.name.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(skill.name.split(" ")[0].toLowerCase()))
  );
}

export default function SkillsPage() {
  const sortedByGap = [...skills].sort((a, b) => b.target - b.current - (a.target - a.current));
  const lowestSkills = sortedByGap.slice(0, 4);
  const readiness = careerReadiness(skills);
  const maxDeptCompletion = Math.max(...departments.map((d) => d.avgCompletion));

  const recommendations = lowestSkills
    .map((skill) => ({
      skill,
      courses: findCoursesForSkill(skill).slice(0, 1),
    }))
    .filter((r) => r.courses.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill Matrix"
        description="Track proficiency gaps, compare departments, and get personalized learning recommendations."
      >
        <Badge variant="secondary">{DEPARTMENT_LABELS[currentUser.department]}</Badge>
      </PageHeader>

      <motion.section {...fade} transition={{ duration: 0.4 }} className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Career Readiness</CardTitle>
            <CardDescription>Composite readiness vs role targets</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pb-6">
            <CircularProgress value={readiness.score} size={140} label="Ready" sublabel={`${readiness.gaps} skill gaps`} />
            <div className="grid w-full grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-lg border border-border bg-muted/50 p-2">
                <p className="font-semibold text-foreground">{skills.length}</p>
                <p className="text-muted-foreground">Tracked</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-2">
                <p className="font-semibold text-foreground">{currentUser.skillScore}</p>
                <p className="text-muted-foreground">Skill score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-3">
          <StatCard title="Strongest Skill" value={sortedByGap[sortedByGap.length - 1]?.name ?? "—"} icon={TrendingUp} subtitle={`${sortedByGap[sortedByGap.length - 1]?.current ?? 0}% proficiency`} accent="#0F766E" />
          <StatCard title="Biggest Gap" value={sortedByGap[0]?.name ?? "—"} icon={Target} subtitle={`${(sortedByGap[0]?.target ?? 0) - (sortedByGap[0]?.current ?? 0)} pts to target`} accent="#DC2626" />
          <StatCard title="Courses Matched" value={recommendations.length} icon={BookOpen} subtitle="Based on skill gaps" accent="#0284C7" />
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-2">
        <motion.div {...fade} transition={{ delay: 0.05, duration: 0.4 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Skill radar</CardTitle>
              <CardDescription>Current proficiency vs target benchmarks</CardDescription>
            </CardHeader>
            <CardContent>
              <SkillRadarChart skills={skills} />
              <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-4 rounded-sm bg-(--chart-1)" /> Current
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-0.5 w-4 border-t-2 border-dashed border-(--chart-2)" /> Target
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fade} transition={{ delay: 0.1, duration: 0.4 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Skill gap analysis</CardTitle>
              <CardDescription>Current vs target with gap indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {skills.map((skill) => {
                const gap = skill.target - skill.current;
                const pct = (skill.current / skill.target) * 100;
                return (
                  <div key={skill.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{skill.name}</p>
                        <p className="text-[11px] text-muted-foreground">{skill.category}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-xs">
                        <span className="font-semibold text-primary">{skill.current}%</span>
                        <span className="text-muted-foreground">/ {skill.target}%</span>
                        {gap > 15 && <Badge variant="warning">-{gap}</Badge>}
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={skill.current} className="h-2" />
                      <div
                        className="absolute top-0 h-2 rounded-full border-r-2 border-dashed border-foreground/30"
                        style={{ left: `${skill.target}%` }}
                        title={`Target: ${skill.target}%`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{formatPercent(pct)} of target</span>
                      <span className={cn(gap <= 5 ? "text-success" : gap <= 15 ? "text-warning" : "text-destructive")}>
                        {gap <= 0 ? "On track" : `${gap} pts gap`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div {...fade} transition={{ delay: 0.15, duration: 0.4 }} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Department comparison</CardTitle>
              <CardDescription>Average completion by department</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...departments]
                .sort((a, b) => b.avgCompletion - a.avgCompletion)
                .map((dept) => (
                  <div key={dept.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn(dept.id === currentUser.department && "font-semibold text-primary")}>
                        {dept.name}
                        {dept.id === currentUser.department && (
                          <Badge className="ml-2 bg-accent text-accent-foreground" variant="outline">
                            Yours
                          </Badge>
                        )}
                      </span>
                      <span className="text-xs font-medium">{dept.avgCompletion}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(dept.avgCompletion / maxDeptCompletion) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: dept.color }}
                      />
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fade} transition={{ delay: 0.2, duration: 0.4 }} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recommended learning</CardTitle>
              <CardDescription>Courses to close your lowest skill gaps</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {recommendations.map(({ skill, courses: matched }) => {
                const course = matched[0];
                return (
                  <Link
                    key={skill.id}
                    href={`/dashboard/courses/${course.id}`}
                    className="group flex flex-col rounded-xl border border-border p-4 transition hover:border-primary/40 hover:shadow-(--shadow-md)"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="destructive" className="shrink-0">
                        Gap: {skill.target - skill.current} pts
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                    <p className="mt-3 text-sm font-semibold">{course.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Improves <span className="font-medium text-foreground">{skill.name}</span> · {course.durationHours}h · +{course.xpReward} XP
                    </p>
                    <Progress value={course.progress} className="mt-3 h-1.5" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div {...fade} transition={{ delay: 0.25, duration: 0.4 }}>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Skill growth trend</CardTitle>
              <CardDescription>Your composite skill score over the past 7 months</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/profile">View profile</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <SkillGrowthChart data={skillGrowth} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
