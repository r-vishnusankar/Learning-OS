"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { CircularProgress } from "@/components/charts/circular-progress";
import { SkillGrowthChart, SkillRadarChart } from "@/components/charts/learning-charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublishedCourses } from "@/hooks/use-courses";
import { useCurrentUser, useMySkills } from "@/hooks/use-me";
import { useDepartmentsLive } from "@/hooks/use-operations";
import { DEPARTMENT_LABELS } from "@/constants/navigation";
import { cn, formatPercent } from "@/lib/utils";
import type { Course, Skill } from "@/types";

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function skillGap(skill: Skill) {
  return skill.target - skill.current;
}

function InsightCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">{children}</CardContent>
    </Card>
  );
}

function SkillMeter({ skill, trailing }: { skill: Skill; trailing: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium">{skill.name}</p>
        <div className="shrink-0 font-data text-xs tabular-nums">{trailing}</div>
      </div>
      <Progress value={skill.current} className="h-1.5" />
    </div>
  );
}

function careerReadiness(skillsList: Skill[]) {
  if (skillsList.length === 0) return { score: 0, gaps: 0 };
  const score = Math.round(
    skillsList.reduce((sum, s) => sum + (s.current / s.target) * 100, 0) / skillsList.length
  );
  const gaps = skillsList.filter((s) => s.current < s.target * 0.8).length;
  return { score, gaps };
}

function findCoursesForSkill(skill: Skill, courses: Course[]): Course[] {
  return courses
    .filter(
      (c) =>
        c.department === skill.department ||
        c.tags.some(
          (t) =>
            skill.name.toLowerCase().includes(t.toLowerCase()) ||
            t.toLowerCase().includes(skill.name.split(" ")[0].toLowerCase())
        )
    )
    .sort((a, b) => {
      // Prefer goal-based courses for skill-gap recommendations
      const rank = (c: Course) => (c.learningCategory === "goal" ? 2 : 0) + c.rating;
      return rank(b) - rank(a);
    });
}

export default function SkillsPage() {
  const { data: courses = [] } = usePublishedCourses();
  const { data: user } = useCurrentUser();
  const { data: skillsData, isLoading } = useMySkills();
  const { data: departments = [] } = useDepartmentsLive();

  const skills = skillsData?.skills ?? [];
  const skillGrowth = skillsData?.skillGrowth ?? [];
  const skillScore = skillsData?.skillScore ?? user?.skillScore ?? 0;
  const department = skillsData?.department ?? user?.department;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Skill Matrix" description="Loading your skill matrix…" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const sortedByGap = [...skills].sort((a, b) => skillGap(b) - skillGap(a));
  const strongest = [...skills].sort((a, b) => b.current - a.current).slice(0, 3);
  const biggestGaps = sortedByGap.filter((s) => skillGap(s) > 0).slice(0, 3);
  const lowestSkills = sortedByGap.slice(0, 4);
  const readiness = careerReadiness(skills);
  const onTrack = skills.filter((s) => skillGap(s) <= 5).length;
  const close = skills.filter((s) => skillGap(s) > 5 && skillGap(s) <= 15).length;
  const atRisk = skills.filter((s) => skillGap(s) > 15).length;
  const maxDeptCompletion = Math.max(1, ...departments.map((d) => d.avgCompletion));

  const nextActions = lowestSkills.slice(0, 3).map((skill) => ({
    skill,
    course: findCoursesForSkill(skill, courses)[0] ?? null,
  }));

  const recommendations = nextActions.filter(
    (r): r is { skill: Skill; course: Course } => r.course !== null
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill Matrix"
        description="Track proficiency gaps, compare departments, and get personalized learning recommendations."
      >
        {department && <Badge variant="secondary">{DEPARTMENT_LABELS[department]}</Badge>}
      </PageHeader>

      <motion.section {...fade} transition={{ duration: 0.4 }} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard title="Career Readiness" description="Composite readiness vs role targets">
          <div className="flex flex-1 flex-col items-center justify-between gap-4">
            <CircularProgress
              value={readiness.score}
              size={112}
              label="Ready"
              sublabel={`Score ${skillScore}`}
            />
            <ul className="grid w-full grid-cols-3 gap-2 text-center">
              <li>
                <p className="font-data text-sm font-semibold tabular-nums text-success">{onTrack}</p>
                <p className="text-[11px] text-muted-foreground">On track</p>
              </li>
              <li>
                <p className="font-data text-sm font-semibold tabular-nums text-warning">{close}</p>
                <p className="text-[11px] text-muted-foreground">Close</p>
              </li>
              <li>
                <p className="font-data text-sm font-semibold tabular-nums text-destructive">{atRisk}</p>
                <p className="text-[11px] text-muted-foreground">At risk</p>
              </li>
            </ul>
          </div>
        </InsightCard>

        <InsightCard title="Strongest skills" description="Highest current proficiency">
          {strongest.length === 0 ? (
            <p className="text-sm text-muted-foreground">Complete courses to build your matrix.</p>
          ) : (
            strongest.map((skill) => (
              <SkillMeter
                key={skill.id}
                skill={skill}
                trailing={
                  <span className="text-success">
                    {skill.current}%
                    <span className="text-muted-foreground"> / {skill.target}%</span>
                  </span>
                }
              />
            ))
          )}
        </InsightCard>

        <InsightCard title="Biggest gaps" description="Furthest behind role targets">
          {biggestGaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">All tracked skills are on target.</p>
          ) : (
            biggestGaps.map((skill) => (
              <SkillMeter
                key={skill.id}
                skill={skill}
                trailing={
                  <span className="text-warning">
                    −{skillGap(skill)}
                    <span className="text-muted-foreground"> pts</span>
                  </span>
                }
              />
            ))
          )}
        </InsightCard>

        <InsightCard title="Close next" description="Courses that close your lowest gaps">
          {nextActions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No skill gaps yet.{" "}
              <Link href="/dashboard/learning" className="font-medium text-foreground underline-offset-2 hover:underline">
                Browse catalog
              </Link>
            </p>
          ) : (
            nextActions.map(({ skill, course }) =>
              course ? (
                <Link
                  key={skill.id}
                  href={`/dashboard/courses/${course.slug ?? course.id}`}
                  className="rounded-lg p-2 -mx-2 transition-colors hover:bg-muted/70"
                >
                  <p className="truncate text-sm font-medium">{course.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {skill.name} · −{skillGap(skill)} pts · {course.durationHours}h
                  </p>
                </Link>
              ) : (
                <div key={skill.id} className="px-0 py-1">
                  <p className="truncate text-sm font-medium">{skill.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">No matching course yet · −{skillGap(skill)} pts</p>
                </div>
              )
            )
          )}
        </InsightCard>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-2">
        <motion.div {...fade} transition={{ delay: 0.05, duration: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Skill radar</CardTitle>
              <CardDescription>Current proficiency vs target benchmarks</CardDescription>
            </CardHeader>
            <CardContent>
              <SkillRadarChart skills={skills} />
              <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
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

        <motion.div
          {...fade}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex min-h-0 max-h-[28rem] flex-col overflow-hidden xl:h-0 xl:max-h-none xl:min-h-full"
        >
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <CardHeader className="shrink-0">
              <CardTitle>Skill gap analysis</CardTitle>
              <CardDescription>Current vs target with gap indicators</CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-hidden pt-0">
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills tracked yet. Complete courses to build your matrix.</p>
              ) : (
                <ScrollArea className="h-full pr-3">
                  <div className="space-y-4">
                    {skills.map((skill) => {
                      const gap = skillGap(skill);
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
                  </div>
                </ScrollArea>
              )}
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
                      <span className={cn(dept.id === department && "font-semibold text-primary")}>
                        {dept.name}
                        {dept.id === department && (
                          <Badge className="ml-2 bg-pastel-purple text-primary" variant="outline">
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
              {recommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground sm:col-span-2">No matching courses for your current skill gaps.</p>
              ) : (
                recommendations.map(({ skill, course }) => (
                    <Link
                      key={skill.id}
                      href={`/dashboard/courses/${course.slug ?? course.id}`}
                      className="group flex flex-col rounded-xl border border-border p-4 transition hover:border-primary/40 hover:shadow-(--shadow-md)"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="destructive" className="shrink-0">
                          Gap: {skillGap(skill)} pts
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                      <p className="mt-3 text-sm font-semibold">{course.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Improves <span className="font-medium text-foreground">{skill.name}</span> · {course.durationHours}h · +{course.xpReward} XP
                      </p>
                      <Progress value={course.progress} className="mt-3 h-1.5" />
                    </Link>
                ))
              )}
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
