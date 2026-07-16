"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Archive,
  Edit,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { courses as initialCourses, departments } from "@/data/mock";
import { DEPARTMENT_LABELS, LEVEL_LABELS, LEVELS } from "@/constants/navigation";
import type { Course, CourseStatus, DepartmentId, LearningLevel } from "@/types";

type AdminCourse = Course & { publishStatus: "draft" | "published" | "archived" };

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

function toAdminCourse(c: Course): AdminCourse {
  const publishStatus =
    c.status === "archived" ? "archived" : c.progress > 0 || c.enrolledCount > 1000 ? "published" : "draft";
  return { ...c, publishStatus };
}

export default function AdminCoursesPage() {
  const [courseList, setCourseList] = React.useState<AdminCourse[]>(() =>
    initialCourses.map(toAdminCourse)
  );
  const [search, setSearch] = React.useState("");
  const [deptFilter, setDeptFilter] = React.useState<DepartmentId | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "draft" | "published" | "archived">("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    department: "development" as DepartmentId,
    level: "intermediate" as LearningLevel,
    description: "",
  });

  const filtered = courseList.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "all" || c.department === deptFilter;
    const matchesStatus = statusFilter === "all" || c.publishStatus === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Course title is required");
      return;
    }
    const newCourse: AdminCourse = {
      id: `c${Date.now()}`,
      title: form.title,
      description: form.description || "No description provided.",
      thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
      department: form.department,
      level: form.level,
      difficulty: "intermediate",
      instructor: initialCourses[0].instructor,
      durationHours: 8,
      lessonsCount: 10,
      enrolledCount: 0,
      rating: 0,
      progress: 0,
      status: "not_started" as CourseStatus,
      tags: [],
      category: "General",
      xpReward: 400,
      isSaved: false,
      isTrending: false,
      modules: [],
      publishStatus: "draft",
    };
    setCourseList((prev) => [newCourse, ...prev]);
    setForm({ title: "", department: "development", level: "intermediate", description: "" });
    setDialogOpen(false);
    toast.success("Course created successfully", {
      description: `"${newCourse.title}" saved as draft.`,
    });
  };

  const updateStatus = (id: string, publishStatus: AdminCourse["publishStatus"]) => {
    setCourseList((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              publishStatus,
              status: publishStatus === "archived" ? ("archived" as CourseStatus) : c.status,
            }
          : c
      )
    );
    const action = publishStatus === "published" ? "published" : publishStatus === "archived" ? "archived" : "updated";
    toast.success(`Course ${action}`, {
      description: `Changes applied to course.`,
    });
  };

  const statusBadge = (status: AdminCourse["publishStatus"]) => {
    const variants = { draft: "secondary", published: "success", archived: "outline" } as const;
    return <Badge variant={variants[status]} className="capitalize">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Management"
        description="Create, publish, and manage courses for your department."
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create new course</DialogTitle>
              <DialogDescription>Add a course for your department. It will be saved as a draft.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Advanced API Design"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value as DepartmentId }))}
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Level</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as LearningLevel }))}
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief course overview…"
                  rows={3}
                  className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create course</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <motion.section {...fade} transition={{ duration: 0.4 }}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses…"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value as DepartmentId | "all")}
                  className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
                >
                  <option value="all">All departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
                >
                  <option value="all">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <motion.section {...fade} transition={{ delay: 0.05, duration: 0.4 }}>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Level</th>
                  <th className="px-5 py-3 font-medium">Enrolled</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((course) => (
                  <tr key={course.id} className="border-b border-border/60 transition hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <p className="font-medium">{course.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{course.description}</p>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{DEPARTMENT_LABELS[course.department]}</td>
                    <td className="px-5 py-4">
                      <Badge variant="outline">{LEVEL_LABELS[course.level]}</Badge>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{course.enrolledCount.toLocaleString()}</td>
                    <td className="px-5 py-4">{statusBadge(course.publishStatus)}</td>
                    <td className="px-5 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.info("Edit course", { description: `Opening editor for "${course.title}"` })}>
                            <Edit className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(course.id, "published")}>
                            <Send className="h-4 w-4" /> Publish
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => updateStatus(course.id, "archived")}
                          >
                            <Archive className="h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">No courses match your filters.</p>
            )}
          </div>
        </Card>
      </motion.section>
    </div>
  );
}
