"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Bell,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Download,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEPARTMENT_LABELS, LEVEL_LABELS, levelsForFilter } from "@/constants/navigation";
import {
  useAdminAssignmentConsole,
  useBulkRevokeCourseAssignments,
  useBulkUpdateAssignmentDueDates,
  useRemindCourseAssignments,
  useRevokeCourseAssignment,
} from "@/hooks/use-course-assignments";
import type {
  AdminEnrollmentRow,
  CourseAggregate,
  LearnerAggregate,
  LearnerAssignmentStatus,
} from "@/db/queries/course-assignments";
import type { DepartmentId, LearningLevel } from "@/types";
type DueWindow = "all" | "overdue" | "due_7" | "due_30" | "none";
type TypeFilter = "all" | "mandatory" | "optional";
type ScopeFilter = "all" | "org" | "department" | "user";
type StatusFilter = "all" | LearnerAssignmentStatus;

const PAGE_SIZES = [25, 50] as const;

function filterEnrollments(
  rows: AdminEnrollmentRow[],
  opts: {
    search: string;
    department: DepartmentId | "all";
    level: LearningLevel | "all";
    status: StatusFilter;
    dueWindow: DueWindow;
    type: TypeFilter;
    scope: ScopeFilter;
  }
) {
  const q = opts.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (opts.department !== "all" && row.userDepartment !== opts.department) return false;
    if (opts.level !== "all" && row.userLevel !== opts.level) return false;
    if (opts.status !== "all" && row.status !== opts.status) return false;
    if (opts.type === "mandatory" && !row.mandatory) return false;
    if (opts.type === "optional" && row.mandatory) return false;
    if (opts.scope !== "all" && row.scope !== opts.scope) return false;
    if (opts.dueWindow === "overdue" && row.status !== "overdue") return false;
    if (opts.dueWindow === "due_7") {
      if (
        row.daysRemaining == null ||
        row.daysRemaining < 0 ||
        row.daysRemaining > 7 ||
        row.status === "completed"
      )
        return false;
    }
    if (opts.dueWindow === "due_30") {
      if (
        row.daysRemaining == null ||
        row.daysRemaining < 0 ||
        row.daysRemaining > 30 ||
        row.status === "completed"
      )
        return false;
    }
    if (opts.dueWindow === "none" && row.dueDate) return false;
    if (!q) return true;
    return (
      row.userName.toLowerCase().includes(q) ||
      row.userEmail.toLowerCase().includes(q) ||
      row.courseTitle.toLowerCase().includes(q)
    );
  });
}

function reaggregate(enrollments: AdminEnrollmentRow[]) {
  const byLearnerMap = new Map<string, LearnerAggregate>();
  for (const row of enrollments) {
    const existing = byLearnerMap.get(row.userId);
    if (!existing) {
      byLearnerMap.set(row.userId, {
        userId: row.userId,
        userName: row.userName,
        userEmail: row.userEmail,
        userDepartment: row.userDepartment,
        userLevel: row.userLevel,
        total: 1,
        completed: row.status === "completed" ? 1 : 0,
        overdue: row.status === "overdue" ? 1 : 0,
        mandatoryOpen: row.mandatory && row.status !== "completed" ? 1 : 0,
        dueSoon:
          row.daysRemaining != null &&
          row.daysRemaining >= 0 &&
          row.daysRemaining <= 7 &&
          row.status !== "completed"
            ? 1
            : 0,
        avgProgress: row.progress,
        enrollments: [row],
      });
      continue;
    }
    existing.total += 1;
    if (row.status === "completed") existing.completed += 1;
    if (row.status === "overdue") existing.overdue += 1;
    if (row.mandatory && row.status !== "completed") existing.mandatoryOpen += 1;
    if (
      row.daysRemaining != null &&
      row.daysRemaining >= 0 &&
      row.daysRemaining <= 7 &&
      row.status !== "completed"
    ) {
      existing.dueSoon += 1;
    }
    existing.enrollments.push(row);
    existing.avgProgress = Math.round(
      existing.enrollments.reduce((s, e) => s + e.progress, 0) / existing.enrollments.length
    );
  }

  const byCourseMap = new Map<string, CourseAggregate>();
  for (const row of enrollments) {
    const existing = byCourseMap.get(row.courseId);
    if (!existing) {
      byCourseMap.set(row.courseId, {
        courseId: row.courseId,
        courseTitle: row.courseTitle,
        courseLevel: row.courseLevel,
        total: 1,
        completed: row.status === "completed" ? 1 : 0,
        overdue: row.status === "overdue" ? 1 : 0,
        mandatory: row.mandatory ? 1 : 0,
        avgProgress: row.progress,
        completionRate: row.status === "completed" ? 100 : 0,
        enrollments: [row],
      });
      continue;
    }
    existing.total += 1;
    if (row.status === "completed") existing.completed += 1;
    if (row.status === "overdue") existing.overdue += 1;
    if (row.mandatory) existing.mandatory += 1;
    existing.enrollments.push(row);
    existing.avgProgress = Math.round(
      existing.enrollments.reduce((s, e) => s + e.progress, 0) / existing.enrollments.length
    );
    existing.completionRate = Math.round((existing.completed / existing.total) * 100);
  }

  const byLearner = [...byLearnerMap.values()].sort((a, b) => {
    if (b.overdue !== a.overdue) return b.overdue - a.overdue;
    if (b.mandatoryOpen !== a.mandatoryOpen) return b.mandatoryOpen - a.mandatoryOpen;
    return a.userName.localeCompare(b.userName);
  });

  const byCourse = [...byCourseMap.values()].sort((a, b) => {
    if (b.overdue !== a.overdue) return b.overdue - a.overdue;
    return a.courseTitle.localeCompare(b.courseTitle);
  });

  const completed = enrollments.filter((e) => e.status === "completed").length;
  const kpis = {
    enrollments: enrollments.length,
    uniqueLearners: byLearner.length,
    mandatoryOpen: enrollments.filter((e) => e.mandatory && e.status !== "completed").length,
    overdue: enrollments.filter((e) => e.status === "overdue").length,
    dueIn7d: enrollments.filter(
      (e) =>
        e.daysRemaining != null &&
        e.daysRemaining >= 0 &&
        e.daysRemaining <= 7 &&
        e.status !== "completed"
    ).length,
    completionPct: enrollments.length === 0 ? 0 : Math.round((completed / enrollments.length) * 100),
  };

  return { byLearner, byCourse, kpis };
}

function exportCsv(rows: AdminEnrollmentRow[]) {
  const headers = [
    "Learner",
    "Email",
    "Department",
    "Level",
    "Course",
    "Mandatory",
    "Scope",
    "Status",
    "Progress %",
    "Due",
    "Assigned at",
  ];
  const lines = rows.map((r) =>
    [
      r.userName,
      r.userEmail,
      DEPARTMENT_LABELS[r.userDepartment] ?? r.userDepartment,
      LEVEL_LABELS[r.userLevel] ?? r.userLevel,
      r.courseTitle,
      r.mandatory ? "Yes" : "No",
      r.scope,
      r.status,
      String(r.progress),
      r.dueDate ? format(new Date(r.dueDate), "yyyy-MM-dd") : "",
      format(new Date(r.assignedAt), "yyyy-MM-dd"),
    ]
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(",")
  );
  const blob = new Blob([[headers.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `course-assignments-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function EnrollmentDetailTable({
  rows,
  selected,
  onToggle,
  onRevoke,
}: {
  rows: AdminEnrollmentRow[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onRevoke: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70 bg-background">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <th className="w-10 px-3 py-2.5" />
            <th className="px-3 py-2.5 font-medium">Course / Learner</th>
            <th className="px-3 py-2.5 font-medium">Type</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
            <th className="px-3 py-2.5 font-medium">Progress</th>
            <th className="px-3 py-2.5 font-medium">Due</th>
            <th className="px-3 py-2.5 font-medium text-right"> </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/50 last:border-0">
              <td className="px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={selected.has(row.id)}
                  onChange={() => onToggle(row.id)}
                  className="h-4 w-4 accent-primary"
                  aria-label={`Select ${row.courseTitle}`}
                />
              </td>
              <td className="px-3 py-2.5">
                <p className="font-medium">{row.courseTitle}</p>
                <p className="text-caption">
                  {row.userName} · {DEPARTMENT_LABELS[row.userDepartment]}
                </p>
              </td>
              <td className="px-3 py-2.5">
                {row.mandatory ? (
                  <Badge variant="warning">Mandatory</Badge>
                ) : (
                  <Badge variant="draft">Optional</Badge>
                )}
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-3 py-2.5 min-w-[120px]">
                <div className="flex items-center gap-2">
                  <Progress value={row.progress} className="h-1.5 flex-1" />
                  <span className="w-8 text-caption tabular-nums">{row.progress}%</span>
                </div>
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {row.dueDate ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 stroke-[1.75]" />
                    {format(new Date(row.dueDate), "MMM d, yyyy")}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-2.5 text-right">
                <Button size="icon-sm" variant="ghost" onClick={() => onRevoke(row.id)}>
                  <Trash2 className="h-4 w-4 stroke-[1.75] text-destructive" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminCourseAssignmentsPage() {
  const router = useRouter();
  const { data, isLoading } = useAdminAssignmentConsole();
  const revoke = useRevokeCourseAssignment();
  const bulkRevoke = useBulkRevokeCourseAssignments();
  const bulkDue = useBulkUpdateAssignmentDueDates();
  const remind = useRemindCourseAssignments();

  const [tab, setTab] = React.useState("learners");
  const [search, setSearch] = React.useState("");
  const [department, setDepartment] = React.useState<DepartmentId | "all">("all");
  const [level, setLevel] = React.useState<LearningLevel | "all">("all");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [dueWindow, setDueWindow] = React.useState<DueWindow>("all");
  const [type, setType] = React.useState<TypeFilter>("all");
  const [scope, setScope] = React.useState<ScopeFilter>("all");
  const [pageSize, setPageSize] = React.useState<(typeof PAGE_SIZES)[number]>(25);
  const [page, setPage] = React.useState(0);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkDueDate, setBulkDueDate] = React.useState("");

  const departments = Object.entries(DEPARTMENT_LABELS) as [DepartmentId, string][];

  const filtered = React.useMemo(() => {
    const enrollments = filterEnrollments(data?.enrollments ?? [], {
      search,
      department,
      level,
      status,
      dueWindow,
      type,
      scope,
    });
    return reaggregate(enrollments);
  }, [data?.enrollments, search, department, level, status, dueWindow, type, scope]);

  React.useEffect(() => {
    setPage(0);
  }, [search, department, level, status, dueWindow, type, scope, tab, pageSize]);

  const listItems = tab === "courses" ? filtered.byCourse : filtered.byLearner;
  const pageCount = Math.max(1, Math.ceil(listItems.length / pageSize));
  const pageItems = listItems.slice(page * pageSize, page * pageSize + pageSize);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectVisibleEnrollments = () => {
    const ids = pageItems.flatMap((item) =>
      ("enrollments" in item ? item.enrollments : []).map((e) => e.id)
    );
    setSelected(new Set(ids));
  };

  const handleRevokeOne = async (assignmentId: string) => {
    try {
      await revoke.mutateAsync({ assignmentId });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(assignmentId);
        return next;
      });
      toast.success("Assignment removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not revoke");
    }
  };

  const selectedIds = [...selected];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Assignments"
        description="Track required learning by learner or course. Catalog browsing stays available — this console manages enrollments, due dates, and compliance."
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            disabled={(filtered.kpis.enrollments ?? 0) === 0}
            onClick={() =>
              exportCsv(
                filterEnrollments(data?.enrollments ?? [], {
                  search,
                  department,
                  level,
                  status,
                  dueWindow,
                  type,
                  scope,
                })
              )
            }
          >
            <Download className="h-4 w-4 stroke-[1.75]" /> Export CSV
          </Button>
          <Button asChild className="gap-2">
            <Link href="/dashboard/admin/course-assignments/new">
              <Plus className="h-4 w-4 stroke-[1.75]" /> Assign courses
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Enrollments", value: filtered.kpis.enrollments },
          { label: "Learners", value: filtered.kpis.uniqueLearners },
          { label: "Mandatory open", value: filtered.kpis.mandatoryOpen },
          { label: "Overdue", value: filtered.kpis.overdue },
          { label: "Due in 7 days", value: filtered.kpis.dueIn7d },
          { label: "Completion", value: `${filtered.kpis.completionPct}%` },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-1.5 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="font-display text-2xl font-semibold tabular-nums">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground stroke-[1.75]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search learner or course…"
              className="pl-9"
            />
          </div>
          <select
            className="h-10 rounded-full border border-input bg-background px-3 text-sm"
            value={department}
            onChange={(e) => {
              const next = e.target.value as DepartmentId | "all";
              setDepartment(next);
              if (level !== "all" && !levelsForFilter(next).includes(level)) {
                setLevel("all");
              }
            }}
          >
            <option value="all">All departments</option>
            {departments.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-full border border-input bg-background px-3 text-sm"
            value={level}
            onChange={(e) => setLevel(e.target.value as LearningLevel | "all")}
          >
            <option value="all">All levels</option>
            {levelsForFilter(department).map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABELS[l]}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-full border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
          >
            <option value="all">All statuses</option>
            <option value="overdue">Overdue</option>
            <option value="in_progress">In progress</option>
            <option value="not_started">Not started</option>
            <option value="completed">Completed</option>
            <option value="upcoming">Upcoming</option>
          </select>
          <select
            className="h-10 rounded-full border border-input bg-background px-3 text-sm"
            value={dueWindow}
            onChange={(e) => setDueWindow(e.target.value as DueWindow)}
          >
            <option value="all">Any due window</option>
            <option value="overdue">Overdue</option>
            <option value="due_7">Due in 7 days</option>
            <option value="due_30">Due in 30 days</option>
            <option value="none">No due date</option>
          </select>
          <select
            className="h-10 rounded-full border border-input bg-background px-3 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as TypeFilter)}
          >
            <option value="all">Mandatory & optional</option>
            <option value="mandatory">Mandatory only</option>
            <option value="optional">Optional only</option>
          </select>
          <select
            className="h-10 rounded-full border border-input bg-background px-3 text-sm"
            value={scope}
            onChange={(e) => setScope(e.target.value as ScopeFilter)}
          >
            <option value="all">All scopes</option>
            <option value="org">Org</option>
            <option value="department">Department</option>
            <option value="user">Individual</option>
          </select>
        </CardContent>
      </Card>

      {selectedIds.length > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-(--shadow-sm) backdrop-blur">
          <p className="mr-2 text-sm font-medium">{selectedIds.length} selected</p>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={remind.isPending}
            onClick={async () => {
              try {
                const res = await remind.mutateAsync({ assignmentIds: selectedIds });
                toast.success(`Reminded ${res.reminded} learner(s)`);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Remind failed");
              }
            }}
          >
            <Bell className="h-3.5 w-3.5 stroke-[1.75]" /> Remind
          </Button>
          <Input
            type="date"
            value={bulkDueDate}
            onChange={(e) => setBulkDueDate(e.target.value)}
            className="h-9 w-auto rounded-full"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!bulkDueDate || bulkDue.isPending}
            onClick={async () => {
              try {
                await bulkDue.mutateAsync({
                  assignmentIds: selectedIds,
                  dueDate: bulkDueDate,
                });
                toast.success("Due dates updated");
                setSelected(new Set());
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Update failed");
              }
            }}
          >
            Set due date
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5"
            disabled={bulkRevoke.isPending}
            onClick={async () => {
              if (!confirm(`Revoke ${selectedIds.length} enrollment(s)?`)) return;
              try {
                await bulkRevoke.mutateAsync({ assignmentIds: selectedIds });
                toast.success("Enrollments revoked");
                setSelected(new Set());
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Revoke failed");
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5 stroke-[1.75]" /> Revoke
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : (data?.enrollments.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6 stroke-[1.75]" />}
          title="No course assignments yet"
          description="Assign published courses to the org, a department, or individuals."
          actionLabel="Assign courses"
          onAction={() => router.push("/dashboard/admin/course-assignments/new")}
        />
      ) : filtered.kpis.enrollments === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6 stroke-[1.75]" />}
          title="No matches"
          description="Try clearing filters or broadening your search."
        />
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="learners">By learner</TabsTrigger>
              <TabsTrigger value="courses">By course</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button size="sm" variant="ghost" onClick={selectVisibleEnrollments}>
                Select page
              </Button>
              <select
                className="h-9 rounded-full border border-input bg-background px-3 text-sm"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) as 25 | 50)}
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            </div>
          </div>

          <TabsContent value="learners" className="space-y-2">
            {pageItems.map((item) => {
              const learner = item as LearnerAggregate;
              const open = expanded.has(learner.userId);
              return (
                <Card key={learner.userId} className="overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30"
                    onClick={() => toggleExpand(learner.userId)}
                  >
                    {open ? (
                      <ChevronDown className="h-4 w-4 shrink-0 stroke-[1.75] text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 stroke-[1.75] text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{learner.userName}</p>
                      <p className="truncate text-caption">
                        {learner.userEmail} · {DEPARTMENT_LABELS[learner.userDepartment]} ·{" "}
                        {LEVEL_LABELS[learner.userLevel]}
                      </p>
                    </div>
                    <div className="hidden items-center gap-3 sm:flex">
                      {learner.overdue > 0 && (
                        <Badge variant="destructive">{learner.overdue} overdue</Badge>
                      )}
                      {learner.mandatoryOpen > 0 && (
                        <Badge variant="warning">{learner.mandatoryOpen} mandatory</Badge>
                      )}
                      <span className="text-caption tabular-nums">
                        {learner.completed}/{learner.total} done
                      </span>
                      <div className="w-24">
                        <Progress value={learner.avgProgress} className="h-1.5" />
                      </div>
                    </div>
                  </button>
                  {open && (
                    <div className="border-t border-border px-4 py-3">
                      <EnrollmentDetailTable
                        rows={learner.enrollments}
                        selected={selected}
                        onToggle={toggleSelect}
                        onRevoke={handleRevokeOne}
                      />
                    </div>
                  )}
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="courses" className="space-y-2">
            {pageItems.map((item) => {
              const course = item as CourseAggregate;
              const open = expanded.has(course.courseId);
              return (
                <Card key={course.courseId} className="overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30"
                    onClick={() => toggleExpand(course.courseId)}
                  >
                    {open ? (
                      <ChevronDown className="h-4 w-4 shrink-0 stroke-[1.75] text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 stroke-[1.75] text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{course.courseTitle}</p>
                      <p className="truncate text-caption">
                        {LEVEL_LABELS[course.courseLevel]} · {course.total} learners ·{" "}
                        {course.completionRate}% complete
                      </p>
                    </div>
                    <div className="hidden items-center gap-3 sm:flex">
                      {course.overdue > 0 && (
                        <Badge variant="destructive">{course.overdue} overdue</Badge>
                      )}
                      <span className="text-caption tabular-nums">
                        {course.completed}/{course.total}
                      </span>
                      <div className="w-24">
                        <Progress value={course.avgProgress} className="h-1.5" />
                      </div>
                    </div>
                  </button>
                  {open && (
                    <div className="border-t border-border px-4 py-3">
                      <EnrollmentDetailTable
                        rows={course.enrollments}
                        selected={selected}
                        onToggle={toggleSelect}
                        onRevoke={handleRevokeOne}
                      />
                    </div>
                  )}
                </Card>
              );
            })}
          </TabsContent>

          <div className="flex items-center justify-between pt-2">
            <p className="text-caption">
              Showing {page * pageSize + 1}–
              {Math.min((page + 1) * pageSize, listItems.length)} of {listItems.length}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </Tabs>
      )}

      <p className="text-caption">
        Homework graded work remains under{" "}
        <Link
          href="/dashboard/admin/assignments"
          className="text-primary underline-offset-2 hover:underline"
        >
          Assignments
        </Link>
        .
      </p>
    </div>
  );
}
