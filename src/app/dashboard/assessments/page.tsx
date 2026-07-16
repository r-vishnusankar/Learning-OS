"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Filter,
  Target,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { assessments } from "@/data/mock";
import { DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import type { AssessmentStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { value: AssessmentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "upcoming", label: "Upcoming" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

const statusConfig: Record<
  AssessmentStatus,
  { variant: "success" | "warning" | "info" | "secondary" | "destructive"; icon: typeof CheckCircle2 }
> = {
  available: { variant: "success", icon: CheckCircle2 },
  upcoming: { variant: "info", icon: Calendar },
  in_progress: { variant: "warning", icon: Clock },
  completed: { variant: "success", icon: CheckCircle2 },
  failed: { variant: "destructive", icon: XCircle },
  expired: { variant: "secondary", icon: XCircle },
};

const typeLabels: Record<string, string> = {
  mcq: "Multiple Choice",
  mixed: "Mixed Format",
  coding: "Coding Challenge",
  case_study: "Case Study",
};

export default function AssessmentsPage() {
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | "all">("all");

  const filtered = useMemo(
    () => (statusFilter === "all" ? assessments : assessments.filter((a) => a.status === statusFilter)),
    [statusFilter]
  );

  const stats = useMemo(
    () => ({
      total: assessments.length,
      available: assessments.filter((a) => a.status === "available" || a.status === "in_progress").length,
      completed: assessments.filter((a) => a.status === "completed").length,
      avgScore:
        assessments.filter((a) => a.score != null).reduce((sum, a) => sum + (a.score ?? 0), 0) /
          assessments.filter((a) => a.score != null).length || 0,
    }),
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        description="Validate your skills with certification exams, coding challenges, and case studies."
      >
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          {filtered.length} shown
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total assessments", value: stats.total, icon: ClipboardCheck },
          { label: "Active / available", value: stats.available, icon: Clock },
          { label: "Average score", value: `${Math.round(stats.avgScore)}%`, icon: Target },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as AssessmentStatus | "all")}>
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {STATUS_FILTERS.map((f) => (
            <TabsTrigger
              key={f.value}
              value={f.value}
              className="rounded-full border border-transparent px-4 data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              {f.label}
              {f.value !== "all" && (
                <span className="ml-1.5 text-muted-foreground">
                  ({assessments.filter((a) => a.status === f.value).length})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          title="No assessments found"
          description="Try adjusting your status filter to see more assessments."
          icon={<ClipboardCheck className="h-6 w-6" />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((assessment, i) => {
            const config = statusConfig[assessment.status];
            const StatusIcon = config.icon;
            const dueDate = new Date(assessment.dueDate);
            const isOverdue = dueDate < new Date() && !["completed", "failed"].includes(assessment.status);

            return (
              <motion.div
                key={assessment.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
              >
                <Card className="group flex h-full flex-col transition hover:border-primary/30 hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="capitalize">
                        {typeLabels[assessment.type]}
                      </Badge>
                      <Badge variant={config.variant} className="gap-1 capitalize">
                        <StatusIcon className="h-3 w-3" />
                        {assessment.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <CardTitle className="mt-3 line-clamp-2 text-base leading-snug group-hover:text-primary">
                      {assessment.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">{assessment.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Attempts
                        </p>
                        <p className="mt-0.5 font-semibold">
                          {assessment.attempts}/{assessment.maxAttempts}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Passing
                        </p>
                        <p className="mt-0.5 font-semibold">{assessment.passingScore}%</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Duration
                        </p>
                        <p className="mt-0.5 font-semibold">{assessment.durationMinutes} min</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Questions
                        </p>
                        <p className="mt-0.5 font-semibold">{assessment.questionsCount}</p>
                      </div>
                    </div>

                    {assessment.score != null && (
                      <div
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2",
                          assessment.score >= assessment.passingScore
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        <span className="text-sm font-medium">Your score</span>
                        <span className="text-lg font-bold">{assessment.score}%</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{DEPARTMENT_LABELS[assessment.department]}</Badge>
                      <Badge variant="outline">{LEVEL_LABELS[assessment.level]}</Badge>
                    </div>

                    <p
                      className={cn(
                        "flex items-center gap-1.5 text-xs",
                        isOverdue ? "font-medium text-destructive" : "text-muted-foreground"
                      )}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Due {dueDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      {isOverdue && " · Overdue"}
                    </p>
                  </CardContent>

                  <CardFooter className="border-t border-border/60 pt-4">
                    <Button asChild className="w-full gap-2" variant={assessment.status === "completed" ? "outline" : "default"}>
                      <Link href={`/dashboard/assessments/${assessment.id}`}>
                        {assessment.status === "completed" || assessment.status === "failed"
                          ? "View results"
                          : assessment.status === "in_progress"
                            ? "Continue assessment"
                            : "Start assessment"}
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
