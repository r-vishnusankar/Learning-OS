"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DEPARTMENT_LABELS } from "@/constants/navigation";
import { useCourseUrlAudit } from "@/hooks/use-course-url-audit";
import type { DepartmentId } from "@/types";
import { cn } from "@/lib/utils";

export default function AdminCatalogAuditPage() {
  const { data, isLoading, refetch, isFetching } = useCourseUrlAudit();
  const [search, setSearch] = React.useState("");
  const [department, setDepartment] = React.useState<DepartmentId | "all">("all");
  const [overall, setOverall] = React.useState<"all" | "Pass" | "Fail">("all");

  const rows = React.useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.rows.filter((r) => {
      if (department !== "all" && r.departmentId !== department) return false;
      if (overall !== "all" && r.overallStatus !== overall) return false;
      if (!q) return true;
      return (
        r.courseName.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        (r.courseId ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, search, department, overall]);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Catalog Audit" description="Loading audit…" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalog Audit"
        description="Side-by-side validation of course URLs and intro video embeds (catalog vs database). Run before each release."
      >
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Catalog courses", value: summary.total },
          { label: "Overall Pass", value: summary.overallPass },
          { label: "Overall Fail", value: summary.overallFail, warn: summary.overallFail > 0 },
          { label: "Video Fail", value: summary.videoFail, warn: summary.videoFail > 0 },
          { label: "URL Fail", value: summary.urlFail, warn: summary.urlFail > 0 },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p
                className={cn(
                  "mt-1 text-2xl font-semibold tabular-nums",
                  k.warn && "text-destructive"
                )}
              >
                {k.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(summary.duplicateSlugs.length > 0 || summary.sharedVideoWarnings.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Warnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {summary.duplicateSlugs.length > 0 && (
              <p>
                Duplicate slugs: {summary.duplicateSlugs.map((s) => `\`${s}\``).join(", ")}
              </p>
            )}
            {summary.sharedVideoWarnings.slice(0, 8).map((w) => (
              <p key={w.videoId}>
                Shared video <code className="text-xs">{w.videoId}</code>:{" "}
                {w.courseTitles.length} courses
              </p>
            ))}
            {summary.sharedVideoWarnings.length > 8 && (
              <p>…and {summary.sharedVideoWarnings.length - 8} more shared-video groups</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search course, slug, or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
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
            className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
            value={overall}
            onChange={(e) => setOverall(e.target.value as "all" | "Pass" | "Fail")}
          >
            <option value="all">All statuses</option>
            <option value="Pass">Pass only</option>
            <option value="Fail">Fail only</option>
          </select>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-medium">Course</th>
              <th className="px-3 py-3 font-medium">Expected URL</th>
              <th className="px-3 py-3 font-medium">Actual URL</th>
              <th className="px-3 py-3 font-medium">URL</th>
              <th className="px-3 py-3 font-medium">Expected video</th>
              <th className="px-3 py-3 font-medium">Actual video</th>
              <th className="px-3 py-3 font-medium">Video</th>
              <th className="px-3 py-3 font-medium">Overall</th>
              <th className="px-3 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.slug}
                className={cn(
                  "border-b border-border/60 align-top",
                  r.overallStatus === "Fail" && "bg-destructive/5"
                )}
              >
                <td className="px-3 py-3">
                  <p className="font-medium">{r.courseName}</p>
                  <p className="text-xs text-muted-foreground">
                    {DEPARTMENT_LABELS[r.departmentId]} · {r.slug}
                  </p>
                  {r.courseId ? (
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{r.courseId}</p>
                  ) : null}
                </td>
                <td className="max-w-[140px] truncate px-3 py-3 font-mono text-xs">
                  {r.expectedCourseUrl}
                </td>
                <td className="max-w-[140px] truncate px-3 py-3 font-mono text-xs">
                  {r.actualCourseUrl || "—"}
                </td>
                <td className="px-3 py-3">
                  <StatusChip status={r.urlStatus} title={r.urlNotes} />
                </td>
                <td className="max-w-[120px] truncate px-3 py-3 font-mono text-[10px]">
                  {r.expectedVideoUrl}
                </td>
                <td className="max-w-[120px] truncate px-3 py-3 font-mono text-[10px]">
                  {r.actualVideoUrl || "—"}
                </td>
                <td className="px-3 py-3">
                  <StatusChip status={r.videoStatus} title={r.videoNotes} />
                </td>
                <td className="px-3 py-3">
                  <StatusChip status={r.overallStatus} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    {r.actualCourseUrl ? (
                      <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                        <Link href={r.expectedCourseUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" /> View
                        </Link>
                      </Button>
                    ) : null}
                    {r.courseId ? (
                      <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                        <Link href={`/dashboard/admin/courses/${r.courseId}`}>Builder</Link>
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        CLI report: <code className="rounded bg-muted px-1">npm run db:audit-catalog</code> writes{" "}
        <code className="rounded bg-muted px-1">docs/COURSE_URL_AUDIT.md</code>
      </p>
    </div>
  );
}

function StatusChip({ status, title }: { status: "Pass" | "Fail"; title?: string }) {
  return (
    <Badge
      variant={status === "Pass" ? "success" : "destructive"}
      className="tabular-nums"
      title={title}
    >
      {status === "Pass" ? "Pass" : "Fail"}
    </Badge>
  );
}
