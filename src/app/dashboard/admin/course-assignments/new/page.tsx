"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DEPARTMENT_LABELS, LEARNING_CATEGORY_LABELS, LEVEL_LABELS, levelsForFilter } from "@/constants/navigation";
import { useAssignableCourses } from "@/hooks/use-courses";
import { useAdminUsers } from "@/hooks/use-operations";
import { useAssignCourse } from "@/hooks/use-course-assignments";
import { levelToBadgeVariant } from "@/lib/status-styles";
import { cn } from "@/lib/utils";
import type { DepartmentId, LearningCategory, LearningLevel } from "@/types";

type Scope = "org" | "department" | "user";

export default function AssignCoursesPage() {
  const router = useRouter();
  const { data: courses = [], isLoading: coursesLoading } = useAssignableCourses();
  const { data: users = [] } = useAdminUsers();
  const assign = useAssignCourse();

  const [courseSearch, setCourseSearch] = React.useState("");
  const [filterDept, setFilterDept] = React.useState<DepartmentId | "all">("all");
  const [filterLevel, setFilterLevel] = React.useState<LearningLevel | "all">("all");
  const [filterCategory, setFilterCategory] = React.useState<LearningCategory | "all">("all");
  const [selectedCourseIds, setSelectedCourseIds] = React.useState<string[]>([]);

  const [scope, setScope] = React.useState<Scope>("department");
  const [audienceDept, setAudienceDept] = React.useState<DepartmentId | "">("");
  const [userIds, setUserIds] = React.useState<string[]>([]);
  const [userSearch, setUserSearch] = React.useState("");
  const [mandatory, setMandatory] = React.useState(true);
  const [startDate, setStartDate] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");

  const departments = Object.entries(DEPARTMENT_LABELS) as [DepartmentId, string][];

  const filteredCourses = React.useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    return courses.filter((c) => {
      if (filterDept !== "all" && c.departmentId !== filterDept) return false;
      if (filterLevel !== "all" && c.level !== filterLevel) return false;
      if (filterCategory !== "all" && c.learningCategory !== filterCategory) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [courses, courseSearch, filterDept, filterLevel, filterCategory]);

  const filteredUsers = React.useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (DEPARTMENT_LABELS[u.department] ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, userSearch]);

  const toggleCourse = (id: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const ids = filteredCourses.map((c) => c.id);
    setSelectedCourseIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const clearCourseSelection = () => setSelectedCourseIds([]);

  const toggleUser = (id: string) => {
    setUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const canSubmit =
    selectedCourseIds.length > 0 &&
    (scope === "org" ||
      (scope === "department" && Boolean(audienceDept)) ||
      (scope === "user" && userIds.length > 0));

  const onAssign = async () => {
    try {
      const result = await assign.mutateAsync({
        courseIds: selectedCourseIds,
        scope,
        departmentId: audienceDept || undefined,
        userIds: scope === "user" ? userIds : undefined,
        mandatory,
        startDate: startDate || null,
        dueDate: dueDate || null,
        source: "manual",
      });
      toast.success(
        `Assigned ${result.courseCount} course${result.courseCount === 1 ? "" : "s"}` +
          ` → ${result.inserted} new enrollment${result.inserted === 1 ? "" : "s"}` +
          (result.skipped ? ` (${result.skipped} already assigned)` : "")
      );
      router.push("/dashboard/admin/course-assignments");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not assign courses");
    }
  };

  return (
    <div className="space-y-6 pb-28">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/admin/course-assignments">
            <ArrowLeft className="h-4 w-4 stroke-[1.75]" />
            Back
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Assign courses"
        description="Select one or more published courses, choose the audience, then set dates and mandatory status."
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Course picker */}
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <CardTitle>Select courses</CardTitle>
                <p className="mt-1 text-sm text-description">
                  {selectedCourseIds.length} selected
                  {filteredCourses.length !== courses.length
                    ? ` · ${filteredCourses.length} shown`
                    : ` · ${courses.length} published`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={selectAllFiltered}>
                  Select filtered
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearCourseSelection}
                  disabled={selectedCourseIds.length === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 stroke-[1.75] text-muted-foreground" />
                <Input
                  placeholder="Search courses…"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterDept}
                onChange={(e) => {
                  const next = e.target.value as DepartmentId | "all";
                  setFilterDept(next);
                  if (filterLevel !== "all" && !levelsForFilter(next).includes(filterLevel)) {
                    setFilterLevel("all");
                  }
                }}
                className="h-12 rounded-full bg-secondary px-4 text-sm font-medium text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All departments</option>
                {departments.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as LearningLevel | "all")}
                className="h-12 rounded-full bg-secondary px-4 text-sm font-medium text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All levels</option>
                {levelsForFilter(filterDept).map((level) => (
                  <option key={level} value={level}>
                    {LEVEL_LABELS[level]}
                  </option>
                ))}
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as LearningCategory | "all")}
                className="h-12 rounded-full bg-secondary px-4 text-sm font-medium text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All categories</option>
                <option value="role">{LEARNING_CATEGORY_LABELS.role}</option>
                <option value="goal">{LEARNING_CATEGORY_LABELS.goal}</option>
              </select>
            </div>
          </CardHeader>

          <CardContent className="max-h-[560px] space-y-2 overflow-y-auto pr-2">
            {coursesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : filteredCourses.length === 0 ? (
              <p className="py-10 text-center text-sm text-description">
                No courses match these filters.
              </p>
            ) : (
              filteredCourses.map((course) => {
                const selected = selectedCourseIds.includes(course.id);
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => toggleCourse(course.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200",
                      selected
                        ? "bg-secondary ring-2 ring-primary/40"
                        : "bg-muted/40 hover:bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card"
                      )}
                    >
                      {selected ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{course.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-sm text-description">
                        {course.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="secondary">
                          {DEPARTMENT_LABELS[course.departmentId] ?? course.departmentId}
                        </Badge>
                        <Badge variant={levelToBadgeVariant(course.level)}>
                          {LEVEL_LABELS[course.level] ?? course.level}
                        </Badge>
                        <Badge variant={course.learningCategory === "goal" ? "goal" : "role"}>
                          {LEARNING_CATEGORY_LABELS[course.learningCategory] ??
                            course.learningCategory}
                        </Badge>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Audience + schedule */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["org", "All employees"],
                    ["department", "Department"],
                    ["user", "Individuals"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScope(value)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                      scope === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {scope === "department" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Target department</label>
                  <select
                    className="flex h-12 w-full rounded-2xl bg-card px-4 text-sm shadow-(--shadow-sm) focus:outline-none focus:ring-2 focus:ring-ring"
                    value={audienceDept}
                    onChange={(e) => setAudienceDept(e.target.value as DepartmentId)}
                  >
                    <option value="">Select department…</option>
                    {departments.map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {scope === "user" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Employees ({userIds.length} selected)
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 stroke-[1.75] text-muted-foreground" />
                    <Input
                      placeholder="Search employees…"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="max-h-56 space-y-1 overflow-y-auto rounded-2xl bg-muted/40 p-2">
                    {filteredUsers.map((u) => (
                      <label
                        key={u.id}
                        className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm hover:bg-card"
                      >
                        <input
                          type="checkbox"
                          checked={userIds.includes(u.id)}
                          onChange={() => toggleUser(u.id)}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {u.name}{" "}
                          <span className="text-caption">
                            · {DEPARTMENT_LABELS[u.department]}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {scope === "org" && (
                <p className="text-sm text-description">
                  This will assign the selected courses to every active employee in the organization.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule & type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Start date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Due date</label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <label className="flex items-center gap-2.5 text-sm font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded"
                  checked={mandatory}
                  onChange={(e) => setMandatory(e.target.checked)}
                />
                Mandatory (counts toward compliance)
              </label>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/80 bg-background/95 backdrop-blur-md lg:left-[240px]">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
          <p className="text-sm text-description">
            <span className="font-semibold text-foreground">{selectedCourseIds.length}</span> course
            {selectedCourseIds.length === 1 ? "" : "s"}
            {scope === "user"
              ? ` · ${userIds.length} employee${userIds.length === 1 ? "" : "s"}`
              : scope === "department" && audienceDept
                ? ` · ${DEPARTMENT_LABELS[audienceDept]}`
                : scope === "org"
                  ? " · entire organization"
                  : ""}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/dashboard/admin/course-assignments">Cancel</Link>
            </Button>
            <Button onClick={() => void onAssign()} disabled={!canSubmit || assign.isPending}>
              {assign.isPending ? "Assigning…" : "Assign courses"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
