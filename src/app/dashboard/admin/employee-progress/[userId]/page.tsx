"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  History,
  Target,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DEPARTMENT_LABELS,
  LEARNING_CATEGORY_LABELS,
  LEVEL_LABELS,
} from "@/constants/navigation";
import { useEmployeeProgress } from "@/hooks/use-employee-progress";
import type { LearningCategory } from "@/types";
import type { LearnerAssignmentStatus } from "@/db/queries/course-assignments";

const STATUS_COLORS: Record<string, string> = {
  Completed: "var(--chart-1)",
  "In progress": "var(--chart-2)",
  Pending: "var(--chart-3)",
  Overdue: "var(--destructive)",
};

type StatusFilter = "all" | LearnerAssignmentStatus;
type CategoryFilter = "all" | LearningCategory;

export default function AdminEmployeeProgressDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const { data, isLoading } = useEmployeeProgress(userId);

  const [categoryFilter, setCategoryFilter] = React.useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const filteredCourses = React.useMemo(() => {
    if (!data) return [];
    return data.courses.filter((c) => {
      if (categoryFilter !== "all" && c.learningCategory !== categoryFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (departmentFilter !== "all" && c.departmentId !== departmentFilter) return false;
      if (dateFrom || dateTo) {
        const ref = c.dueDate ?? c.assignedAt;
        if (!ref) return false;
        const t = new Date(ref).getTime();
        if (dateFrom && t < new Date(dateFrom).getTime()) return false;
        if (dateTo && t > new Date(dateTo + "T23:59:59").getTime()) return false;
      }
      return true;
    });
  }, [data, categoryFilter, statusFilter, departmentFilter, dateFrom, dateTo]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <p>Employee not found.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/admin/employee-progress">Back</Link>
        </Button>
      </div>
    );
  }

  const { employee, manager, summary } = data;
  const courseDepartments = [
    ...new Set(data.courses.map((c) => c.departmentId)),
  ];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
        <Link href="/dashboard/admin/employee-progress">
          <ArrowLeft className="h-4 w-4" /> Employees
        </Link>
      </Button>

      <PageHeader
        title={employee.name}
        description={`${employee.designation} · ${DEPARTMENT_LABELS[employee.department]} · ID ${employee.employeeId}`}
      >
        {summary.overdue > 0 ? (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            {summary.overdue} overdue
          </Badge>
        ) : (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> On track
          </Badge>
        )}
      </PageHeader>

      {/* Employee profile */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={employee.avatar ?? undefined} alt={employee.name} />
              <AvatarFallback>{employee.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Email:</span> {employee.email}
              </p>
              <p>
                <span className="text-muted-foreground">Level:</span>{" "}
                {LEVEL_LABELS[employee.level] ?? employee.level} ·{" "}
                <span className="text-muted-foreground">Status:</span>{" "}
                <StatusBadge status={employee.status} />
              </p>
              <p>
                <span className="text-muted-foreground">Joined:</span> {employee.joinDate} ·{" "}
                <span className="text-muted-foreground">Exp:</span> {employee.experienceYears} yrs
              </p>
              <p>
                <span className="text-muted-foreground">Manager:</span>{" "}
                {manager ? `${manager.name} (${manager.email})` : "Unassigned"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-2xl bg-muted/50 px-3 py-2">
              <p className="font-semibold tabular-nums">{employee.xp}</p>
              <p className="text-muted-foreground">XP</p>
            </div>
            <div className="rounded-2xl bg-muted/50 px-3 py-2">
              <p className="font-semibold tabular-nums">{employee.streak}</p>
              <p className="text-muted-foreground">Streak</p>
            </div>
            <div className="rounded-2xl bg-muted/50 px-3 py-2">
              <p className="font-semibold tabular-nums">{employee.skillScore}</p>
              <p className="text-muted-foreground">Skill</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Overall completion", value: `${summary.overallCompletionPct}%`, warn: false },
          { label: "Assigned", value: summary.assigned, warn: false },
          { label: "Completed", value: summary.completed, warn: false },
          { label: "In progress", value: summary.inProgress, warn: false },
          { label: "Pending", value: summary.pending, warn: false },
          { label: "Overdue", value: summary.overdue, warn: summary.overdue > 0 },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p
                className={`mt-1 text-2xl font-semibold tabular-nums ${
                  k.warn ? "text-destructive" : ""
                }`}
              >
                {k.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role / Goal + charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" /> Role based
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Avg progress</span>
              <span className="font-semibold">{summary.role.avgProgress}%</span>
            </div>
            <Progress value={summary.role.avgProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {summary.role.completed}/{summary.role.total} completed · {summary.role.overdue}{" "}
              overdue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" /> Goal Based
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Avg progress</span>
              <span className="font-semibold">{summary.goal.avgProgress}%</span>
            </div>
            <Progress value={summary.goal.avgProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {summary.goal.completed}/{summary.goal.total} completed · {summary.goal.overdue}{" "}
              overdue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status mix</CardTitle>
          </CardHeader>
          <CardContent className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.chartStatus.filter((d) => d.value > 0)}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                >
                  {data.chartStatus
                    .filter((d) => d.value > 0)
                    .map((entry) => (
                      <Cell
                        key={entry.label}
                        fill={STATUS_COLORS[entry.label] ?? "var(--chart-4)"}
                      />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Role vs Goal progress</CardTitle>
        </CardHeader>
        <CardContent className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chartCategory} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" name="Avg %" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:flex-wrap lg:items-center">
          <select
            className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
          >
            <option value="all">All course types</option>
            <option value="role">{LEARNING_CATEGORY_LABELS.role}</option>
            <option value="goal">{LEARNING_CATEGORY_LABELS.goal}</option>
          </select>
          <select
            className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In progress</option>
            <option value="not_started">Pending</option>
            <option value="upcoming">Upcoming</option>
            <option value="overdue">Overdue</option>
          </select>
          <select
            className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">All course departments</option>
            {courseDepartments.map((id) => (
              <option key={id} value={id}>
                {DEPARTMENT_LABELS[id] ?? id}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="h-11 w-auto"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="From date"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="date"
              className="h-11 w-auto"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="To date"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setCategoryFilter("all");
              setStatusFilter("all");
              setDepartmentFilter("all");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear filters
          </Button>
        </CardContent>
      </Card>

      {/* Course table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Courses & tasks ({filteredCourses.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses match these filters.</p>
          ) : (
            filteredCourses.map((course) => (
              <div
                key={course.id}
                className={`rounded-2xl border p-4 ${
                  course.status === "overdue" ? "border-destructive/40 bg-destructive/5" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{course.title}</p>
                      <StatusBadge status={course.status} />
                      <Badge variant={course.learningCategory === "goal" ? "goal" : "role"}>
                        {LEARNING_CATEGORY_LABELS[course.learningCategory]}
                      </Badge>
                      {course.mandatory ? <Badge variant="outline">Mandatory</Badge> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {DEPARTMENT_LABELS[course.departmentId] ?? course.departmentId}
                      {course.dueDate
                        ? ` · Due ${format(new Date(course.dueDate), "MMM d, yyyy")}`
                        : ""}
                      {course.completedAt
                        ? ` · Completed ${format(new Date(course.completedAt), "MMM d, yyyy")}`
                        : ""}
                    </p>
                  </div>
                  <div className="w-full max-w-[200px] space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span className="font-semibold">{course.progress}%</span>
                    </div>
                    <Progress
                      value={course.progress}
                      className={
                        course.status === "overdue" ? "h-1.5 [&>div]:bg-destructive" : "h-1.5"
                      }
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4" /> Upcoming due dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingDue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming due dates.</p>
            ) : (
              data.upcomingDue.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.dueDate ? format(new Date(c.dueDate), "MMM d, yyyy") : "—"}
                    </p>
                  </div>
                  <Badge variant="pending">
                    {c.daysRemaining == null
                      ? "—"
                      : c.daysRemaining === 0
                        ? "Due today"
                        : `${c.daysRemaining}d left`}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Overdue items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.overdueItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No overdue assignments.</p>
            ) : (
              data.overdueItems.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.dueDate ? format(new Date(c.dueDate), "MMM d, yyyy") : "—"} ·{" "}
                      {c.progress}% done
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {c.daysRemaining == null ? "Overdue" : `${Math.abs(c.daysRemaining)}d late`}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4" /> Completion history
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.completionHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed courses yet.</p>
          ) : (
            data.completionHistory.map((c) => (
              <div
                key={`${c.courseId}-${c.completedAt}`}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{c.title}</p>
                  <Badge variant={c.learningCategory === "goal" ? "goal" : "role"}>
                    {LEARNING_CATEGORY_LABELS[c.learningCategory]}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {format(new Date(c.completedAt), "MMM d, yyyy")}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" /> Learning timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-border pl-5">
              {data.timeline.map((item, idx) => (
                <li key={`${item.at}-${item.title}-${idx}`} className="relative">
                  <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <Badge variant="outline" className="capitalize">
                      {item.type.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  {item.detail ? (
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  ) : null}
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="h-3 w-3" />
                    {format(new Date(item.at), "MMM d, yyyy · h:mm a")}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
