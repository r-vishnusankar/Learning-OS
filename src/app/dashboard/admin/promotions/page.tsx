"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Search, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import {
  useApprovePromotion,
  usePromotionConsole,
  useRejectPromotion,
  useRemindPromotion,
} from "@/hooks/use-promotions";
import type { DepartmentId } from "@/types";

type StatusFilter = "all" | "eligible" | "in_progress" | "blocked" | "max_level";

export default function AdminPromotionsPage() {
  const [status, setStatus] = React.useState<StatusFilter>("eligible");
  const [department, setDepartment] = React.useState<DepartmentId | "all">("all");
  const [search, setSearch] = React.useState("");
  const [rejectReason, setRejectReason] = React.useState<Record<string, string>>({});

  const { data, isLoading } = usePromotionConsole({
    status,
    departmentId: department === "all" ? undefined : department,
    search: search.trim() || undefined,
  });
  const approve = useApprovePromotion();
  const reject = useRejectPromotion();
  const remind = useRemindPromotion();

  const rows = data?.rows ?? [];
  const kpis = data?.kpis;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotions"
        description="Employees who completed their level courses and assessments become eligible. Approve to advance learning level and assign the next band."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Eligible", value: kpis?.eligible ?? 0 },
          { label: "In progress", value: kpis?.inProgress ?? 0 },
          { label: "Blocked", value: kpis?.blocked ?? 0 },
          { label: "Tracked", value: kpis?.total ?? 0 },
        ].map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, email, designation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={department}
            onChange={(e) => setDepartment(e.target.value as DepartmentId | "all")}
          >
            <option value="all">All departments</option>
            {Object.entries(DEPARTMENT_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
          >
            <option value="eligible">Eligible</option>
            <option value="in_progress">In progress</option>
            <option value="blocked">Blocked</option>
            <option value="max_level">Max level</option>
            <option value="all">All</option>
          </select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-6 w-6" />}
          title="No employees in this view"
          description="Adjust filters, or wait until learners complete courses and pass assessments."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const pct =
              row.requiredCount > 0
                ? Math.round((row.certifiedCount / row.requiredCount) * 100)
                : 0;
            return (
              <Card key={row.userId}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{row.name}</p>
                        <Badge variant="secondary">{DEPARTMENT_LABELS[row.department]}</Badge>
                        <Badge variant="outline">{LEVEL_LABELS[row.currentLevel]}</Badge>
                        <Badge
                          variant={
                            row.status === "eligible"
                              ? "success"
                              : row.status === "blocked"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {row.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {row.designation} · {row.email}
                      </p>
                      <p className="text-sm">
                        {row.nextLevel
                          ? `${LEVEL_LABELS[row.currentLevel]} → ${LEVEL_LABELS[row.nextLevel]}`
                          : "At highest learning level"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {row.status === "eligible" && (
                        <Button
                          size="sm"
                          disabled={approve.isPending}
                          onClick={async () => {
                            try {
                              await approve.mutateAsync({ userId: row.userId });
                              toast.success(`Promoted ${row.name}`);
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Approve failed");
                            }
                          }}
                        >
                          {approve.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Approve
                        </Button>
                      )}
                      {row.status !== "eligible" && row.status !== "max_level" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={remind.isPending}
                          onClick={async () => {
                            try {
                              await remind.mutateAsync({ userId: row.userId });
                              toast.success("Reminder sent");
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Remind failed");
                            }
                          }}
                        >
                          Remind
                        </Button>
                      )}
                      {row.status === "eligible" && (
                        <div className="flex gap-2">
                          <Input
                            className="h-9 w-40"
                            placeholder="Reject reason"
                            value={rejectReason[row.userId] ?? ""}
                            onChange={(e) =>
                              setRejectReason((s) => ({ ...s, [row.userId]: e.target.value }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={reject.isPending || !(rejectReason[row.userId] ?? "").trim()}
                            onClick={async () => {
                              try {
                                await reject.mutateAsync({
                                  userId: row.userId,
                                  reason: rejectReason[row.userId]!.trim(),
                                });
                                toast.success("Rejection recorded");
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Reject failed");
                              }
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        Certified {row.certifiedCount}/{row.requiredCount} courses
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {row.courses.map((c) => (
                      <div
                        key={c.courseId}
                        className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                      >
                        <p className="font-medium line-clamp-1">{c.courseTitle}</p>
                        <p className="text-muted-foreground capitalize">
                          {c.state.replace("_", " ")} · {c.lessonProgress}%
                        </p>
                        <div className="mt-1 flex gap-2">
                          <Link
                            className="text-primary hover:underline"
                            href={`/dashboard/courses/${c.courseSlug}`}
                          >
                            Course
                          </Link>
                          {c.assessmentId && (
                            <Link
                              className="text-primary hover:underline"
                              href={`/dashboard/assessments/${c.assessmentId}`}
                            >
                              Assessment
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
