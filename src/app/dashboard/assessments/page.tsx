"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Target,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { useLearnerAssessments } from "@/hooks/use-assessments";
import type { AssessmentStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { value: AssessmentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

const statusConfig: Record<
  AssessmentStatus,
  {
    variant: "success" | "warning" | "pending" | "info" | "draft" | "destructive";
    icon: typeof CheckCircle2;
  }
> = {
  available: { variant: "success", icon: CheckCircle2 },
  upcoming: { variant: "info", icon: Calendar },
  in_progress: { variant: "pending", icon: Clock },
  completed: { variant: "success", icon: CheckCircle2 },
  failed: { variant: "destructive", icon: XCircle },
  expired: { variant: "draft", icon: XCircle },
};

export default function AssessmentsPage() {
  const { data: assessments = [], isLoading, isError: assessmentsError } = useLearnerAssessments();
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | "all">("all");

  const filtered = useMemo(
    () => (statusFilter === "all" ? assessments : assessments.filter((a) => a.status === statusFilter)),
    [assessments, statusFilter]
  );

  const stats = useMemo(
    () => ({
      total: assessments.length,
      available: assessments.filter((a) => a.status === "available" || a.status === "in_progress").length,
      completed: assessments.filter((a) => a.status === "completed").length,
      avgScore:
        assessments.filter((a) => a.score != null).reduce((sum, a) => sum + (a.score ?? 0), 0) /
          (assessments.filter((a) => a.score != null).length || 1),
    }),
    [assessments]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        description="Live certification exams from your organization question banks."
      />

      {!assessmentsError && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle>{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Available</CardDescription>
              <CardTitle>{stats.available}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg score</CardDescription>
              <CardTitle>{Math.round(stats.avgScore || 0)}%</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as AssessmentStatus | "all")}>
        <TabsList>
          {STATUS_FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {assessmentsError ? (
        <EmptyState
          icon={<XCircle className="h-6 w-6 stroke-[1.75]" />}
          title="Couldn't load assessments"
          description="Assessments could not be loaded — this list may be incomplete."
          className="ring-1 ring-warning/25"
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No assessments" description="Published assessments will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((assessment) => {
            const cfg = statusConfig[assessment.status];
            const Icon = cfg.icon;
            return (
              <motion.div key={assessment.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{assessment.title}</CardTitle>
                      <Badge variant={cfg.variant} className="gap-1">
                        <Icon className="h-3 w-3" />
                        {assessment.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{assessment.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      {DEPARTMENT_LABELS[assessment.department]} · {LEVEL_LABELS[assessment.level]}
                    </p>
                    <p className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {assessment.durationMinutes}m
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ClipboardList className="h-3.5 w-3.5" /> {assessment.questionsCount} questions
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" /> Pass {assessment.passingScore}%
                      </span>
                    </p>
                    {assessment.score != null && (
                      <p className={cn("font-medium", assessment.score >= assessment.passingScore ? "text-success" : "text-destructive")}>
                        Best score: {assessment.score}%
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/dashboard/assessments/${assessment.id}`}>
                        Open <ArrowRight className="h-4 w-4" />
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
