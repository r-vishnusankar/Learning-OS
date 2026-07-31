"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Search, UserRoundSearch } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { useEmployeesProgressSearch } from "@/hooks/use-employee-progress";
import type { DepartmentId } from "@/types";

export default function AdminEmployeeProgressPage() {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [department, setDepartment] = React.useState<DepartmentId | "all">("all");
  const [status, setStatus] = React.useState<"all" | "active" | "inactive">("active");

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data: employees = [], isLoading } = useEmployeesProgressSearch({
    search: debouncedSearch || undefined,
    department: department === "all" ? undefined : department,
    status: status === "all" ? undefined : status,
  });

  const behind = employees.filter((e) => e.overdue > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Progress"
        description="Search any employee and open a full learning progress dashboard — completion, overdue work, Role/Goal tracks, and activity."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Employees shown</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{employees.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Behind schedule</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-destructive">
              {behind}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avg completion</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {employees.length === 0
                ? "0%"
                : `${Math.round(
                    employees.reduce((s, e) => s + e.overallCompletionPct, 0) /
                      employees.length
                  )}%`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, employee ID, email, or department…"
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
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | "active" | "inactive")}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All statuses</option>
          </select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Try another name, email, employee ID, or department."
          icon={<UserRoundSearch className="h-6 w-6 stroke-[1.75]" />}
        />
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => (
            <Card
              key={emp.id}
              className={emp.overdue > 0 ? "ring-1 ring-destructive/30" : undefined}
            >
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={emp.image ?? undefined} alt={emp.name} />
                    <AvatarFallback>{emp.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{emp.name}</p>
                      <StatusBadge status={emp.status} />
                      {emp.overdue > 0 ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {emp.overdue} overdue
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {emp.designation} · {DEPARTMENT_LABELS[emp.department]} ·{" "}
                      {LEVEL_LABELS[emp.level] ?? emp.level}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID {emp.employeeId} · {emp.email}
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-72">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overall progress</span>
                    <span className="font-semibold tabular-nums">
                      {emp.overallCompletionPct}%
                    </span>
                  </div>
                  <Progress
                    value={emp.overallCompletionPct}
                    className={emp.overdue > 0 ? "h-2 [&>div]:bg-destructive" : "h-2"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {emp.completed}/{emp.assigned} completed · {emp.inProgress} in progress ·{" "}
                    {emp.pending} pending
                  </p>
                  <Button asChild size="sm" className="mt-1 self-start sm:self-end">
                    <Link href={`/dashboard/admin/employee-progress/${emp.id}`}>
                      View progress
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
