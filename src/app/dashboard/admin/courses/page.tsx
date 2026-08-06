"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit, MoreHorizontal, Plus, Search, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { DEPARTMENT_LABELS, LEARNING_CATEGORY_LABELS, LEVEL_LABELS, LEVELS } from "@/constants/navigation";
import {
  useAdminCourses,
  useArchiveCourse,
  useCreateCourse,
  useDeleteCourse,
  usePublishCourse,
} from "@/hooks/use-courses";
import type { DepartmentId, Difficulty, LearningCategory, LearningLevel } from "@/types";
import type { PublishStatus } from "@/db/schema/courses";

const selectClass =
  "h-11 w-full rounded-2xl border border-input bg-card px-4 text-sm sm:w-auto sm:min-w-[10.5rem]";

const DIFFICULTIES: { value: Difficulty | "all"; label: string }[] = [
  { value: "all", label: "All difficulties" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

const STATUSES: { value: PublishStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default function AdminCoursesPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState<DepartmentId | "all">("all");
  const [levelFilter, setLevelFilter] = React.useState<LearningLevel | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<PublishStatus | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = React.useState<Difficulty | "all">("all");
  const [learningCategoryFilter, setLearningCategoryFilter] = React.useState<
    LearningCategory | "all"
  >("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    departmentId: "development" as DepartmentId,
    learningCategory: "role" as LearningCategory,
    openToAll: true,
  });

  const { data: courses = [], isLoading } = useAdminCourses({
    search: search || undefined,
    departmentId: departmentFilter === "all" ? undefined : departmentFilter,
    level: levelFilter === "all" ? undefined : levelFilter,
    publishStatus: statusFilter === "all" ? undefined : statusFilter,
    difficulty: difficultyFilter === "all" ? undefined : difficultyFilter,
    learningCategory: learningCategoryFilter === "all" ? undefined : learningCategoryFilter,
  });
  const createCourse = useCreateCourse();
  const deleteCourse = useDeleteCourse();
  const publishCourse = usePublishCourse();
  const archiveCourse = useArchiveCourse();

  const hasFilters =
    Boolean(search.trim()) ||
    departmentFilter !== "all" ||
    levelFilter !== "all" ||
    statusFilter !== "all" ||
    difficultyFilter !== "all" ||
    learningCategoryFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("all");
    setLevelFilter("all");
    setStatusFilter("all");
    setDifficultyFilter("all");
    setLearningCategoryFilter("all");
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const created = await createCourse.mutateAsync({
        title: form.title,
        description: form.description || "Course description pending.",
        departmentId: form.departmentId,
        learningCategory: form.learningCategory,
        openToAll: form.openToAll,
      });
      toast.success("Course created");
      setDialogOpen(false);
      setForm({
        title: "",
        description: "",
        departmentId: "development",
        learningCategory: "role",
        openToAll: true,
      });
      router.push(`/dashboard/admin/courses/${created.id}`);
    } catch {
      toast.error("Failed to create course");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Builder"
        description="Create, publish, and manage enterprise courses."
        children={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> New Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create course</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-4">
                  <Input
                    placeholder="Course title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                  />
                  <Input
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                  <select
                    className="h-11 w-full rounded-2xl border border-input bg-card px-4 text-sm"
                    value={form.departmentId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, departmentId: e.target.value as DepartmentId }))
                    }
                  >
                    {Object.entries(DEPARTMENT_LABELS).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Learning category</p>
                    <div className="flex gap-2">
                      {(["role", "goal"] as const).map((value) => (
                        <Button
                          key={value}
                          type="button"
                          size="sm"
                          variant={form.learningCategory === value ? "default" : "outline"}
                          onClick={() => setForm((f) => ({ ...f, learningCategory: value }))}
                        >
                          {LEARNING_CATEGORY_LABELS[value]}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Role-based = career track · Goal-based = skill or objective learning
                    </p>
                  </div>
                  <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-input bg-card px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Open to all employees</p>
                      <p className="text-xs text-muted-foreground">
                        When off, only employees in the selected department can see this course
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.openToAll}
                      onClick={() => setForm((f) => ({ ...f, openToAll: !f.openToAll }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${form.openToAll ? "bg-primary" : "bg-input"}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg transition-transform ${form.openToAll ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </button>
                  </label>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createCourse.isPending}>
                    Create draft
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search title, description, slug, or tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <select
              className={selectClass}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value as DepartmentId | "all")}
              aria-label="Filter by department"
            >
              <option value="all">All departments</option>
              {Object.entries(DEPARTMENT_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className={selectClass}
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as LearningLevel | "all")}
              aria-label="Filter by learning level"
            >
              <option value="all">All levels</option>
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {LEVEL_LABELS[level]}
                </option>
              ))}
            </select>
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PublishStatus | "all")}
              aria-label="Filter by publish status"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              className={selectClass}
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as Difficulty | "all")}
              aria-label="Filter by difficulty"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <select
              className={selectClass}
              value={learningCategoryFilter}
              onChange={(e) =>
                setLearningCategoryFilter(e.target.value as LearningCategory | "all")
              }
              aria-label="Filter by learning category"
            >
              <option value="all">All categories</option>
              <option value="role">{LEARNING_CATEGORY_LABELS.role}</option>
              <option value="goal">{LEARNING_CATEGORY_LABELS.goal}</option>
            </select>
            {hasFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4" /> Clear filters
              </Button>
            )}
          </div>
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{courses.length}</span> course
              {courses.length === 1 ? "" : "s"}
              {hasFilters ? " matching filters" : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No courses match your filters.{" "}
            {hasFilters ? (
              <button type="button" className="text-primary underline" onClick={clearFilters}>
                Clear filters
              </button>
            ) : (
              "Create a new course to get started."
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{course.title}</p>
                    <StatusBadge status={course.publishStatus} />
                    <Badge variant="secondary">{LEVEL_LABELS[course.level] ?? course.level}</Badge>
                    <Badge variant="outline" className="capitalize">
                      {course.difficulty}
                    </Badge>
                    <Badge
                      variant={
                        course.learningCategory === "goal" ? "goal" : "role"
                      }
                    >
                      {LEARNING_CATEGORY_LABELS[course.learningCategory] ??
                        course.learningCategory}
                    </Badge>
                    <Badge variant={course.openToAll ? "secondary" : "outline"}>
                      {course.openToAll ? "Open to all" : "Dept. only"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {DEPARTMENT_LABELS[course.departmentId as DepartmentId]} · {course.lessonsCount}{" "}
                    lessons
                    {course.slug ? ` · ${course.slug}` : ""}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/admin/courses/${course.id}`}>
                    <Edit className="h-4 w-4" /> Builder
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {course.publishStatus !== "published" && (
                      <DropdownMenuItem onClick={() => publishCourse.mutate(course.id)}>
                        Publish
                      </DropdownMenuItem>
                    )}
                    {course.publishStatus === "published" && (
                      <DropdownMenuItem onClick={() => archiveCourse.mutate(course.id)}>
                        Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteCourse.mutate(course.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
