"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Award, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import {
  useCompletePath,
  useEnrollPath,
  usePathDetail,
} from "@/hooks/use-certification";

export default function PathDetailPage() {
  const params = useParams();
  const pathId = params.pathId as string;
  const { data, isLoading } = usePathDetail(pathId);
  const enroll = useEnrollPath();
  const complete = useCompletePath();

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data) {
    return (
      <div className="space-y-4">
        <p>Path not found</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/paths">Back</Link>
        </Button>
      </div>
    );
  }

  const { path, steps, enrolled } = data;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
        <Link href="/dashboard/paths">
          <ArrowLeft className="h-4 w-4" /> Paths
        </Link>
      </Button>

      <PageHeader
        title={path.title}
        description={`${DEPARTMENT_LABELS[path.department]} · ${LEVEL_LABELS[path.level]}`}
      >
        {!enrolled ? (
          <Button
            onClick={async () => {
              await enroll.mutateAsync({ pathId });
              toast.success("Enrolled in path");
            }}
            disabled={enroll.isPending}
          >
            Enroll
          </Button>
        ) : path.progress < 100 ? (
          <Button
            onClick={async () => {
              await complete.mutateAsync(pathId);
              toast.success("Path completed — certificate issued if configured");
            }}
            disabled={complete.isPending}
          >
            Mark complete & mint cert
          </Button>
        ) : (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
          </Badge>
        )}
      </PageHeader>

      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-sm text-muted-foreground">{path.description}</p>
          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{path.progress}%</span>
            </div>
            <Progress value={path.progress} className="h-2" />
          </div>
          {path.certificateTitle && (
            <p className="flex items-center gap-2 text-sm">
              <Award className="h-4 w-4 text-warning" />
              Earn: <span className="font-medium">{path.certificateTitle}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Track steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {steps.map((step, i) => {
            const href = step.href;
            const title = step.courseTitle || step.title;
            const statusLabel =
              step.cta === "unlinked"
                ? "Unlinked item"
                : step.cta === "unavailable"
                  ? "Unavailable"
                  : `${step.stepType}${step.progressPercent != null ? ` · ${step.progressPercent}%` : ""}`;

            return (
              <div
                key={step.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
              >
                <div className="min-w-0">
                  {href ? (
                    <Link
                      href={href}
                      className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {i + 1}. {title}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">
                      {i + 1}. {title}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{statusLabel}</p>
                </div>
                {step.cta === "open_course" && href ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={href}>Open course</Link>
                  </Button>
                ) : step.cta === "take_exam" && href ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={href}>Take exam</Link>
                  </Button>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
