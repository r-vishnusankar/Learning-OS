"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, Target } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { useAssessmentDetail, useStartAttempt } from "@/hooks/use-assessments";

export default function AssessmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useAssessmentDetail(params.id);
  const startAttempt = useStartAttempt();

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data) return <p className="text-muted-foreground">Assessment not found.</p>;

  const { assessment, inProgressAttemptId, recentAttempts } = data;

  const begin = async () => {
    try {
      if (inProgressAttemptId) {
        router.push(`/dashboard/assessments/${assessment.id}/attempt/${inProgressAttemptId}`);
        return;
      }
      const attempt = await startAttempt.mutateAsync(assessment.id);
      router.push(`/dashboard/assessments/${assessment.id}/attempt/${attempt.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start attempt");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={assessment.title} description={assessment.description}>
        <StatusBadge status={assessment.status} />
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Department</CardTitle>
          </CardHeader>
          <CardContent className="text-base font-medium">
            {DEPARTMENT_LABELS[assessment.department]}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Level</CardTitle>
          </CardHeader>
          <CardContent className="text-base font-medium">
            {LEVEL_LABELS[assessment.level]}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attempts</CardTitle>
          </CardHeader>
          <CardContent className="text-base font-medium">
            {assessment.attempts} / {assessment.maxAttempts}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-5 text-base text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4" /> {assessment.durationMinutes} minutes
          </span>
          <span className="inline-flex items-center gap-2">
            <Target className="h-4 w-4" /> Pass {assessment.passingScore}%
          </span>
          <span>{assessment.questionsCount} questions</span>
          {assessment.score != null && <span>Best score: {assessment.score}%</span>}
        </CardContent>
      </Card>

      <Button onClick={begin} disabled={startAttempt.isPending || assessment.status === "expired"}>
        {inProgressAttemptId ? "Continue attempt" : "Start assessment"}
      </Button>

      {recentAttempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent attempts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {recentAttempts.map((a) => {
              const attemptStatus =
                a.passed === true ? "passed" : a.passed === false ? "failed" : a.status;
              return (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 px-4 py-3"
                >
                  <span className="text-sm text-muted-foreground">
                    {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold tabular-nums">
                      {a.percentage ?? "—"}%
                    </span>
                    <StatusBadge status={attemptStatus} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Button variant="ghost" asChild>
        <Link href="/dashboard/assessments">Back to list</Link>
      </Button>
    </div>
  );
}
