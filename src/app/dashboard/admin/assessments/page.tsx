"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DEPARTMENT_LABELS } from "@/constants/navigation";
import {
  useAdminAssessments,
  useCreateAssessment,
  useDeleteAssessment,
  useUpdateAssessment,
} from "@/hooks/use-assessments";
import { useAdminCourseOptions } from "@/hooks/use-certification";
import type { DepartmentId } from "@/types";

export default function AdminAssessmentsPage() {
  const router = useRouter();
  const { data = [], isLoading } = useAdminAssessments();
  const { data: courses = [] } = useAdminCourseOptions();
  const createAssessment = useCreateAssessment();
  const updateAssessment = useUpdateAssessment();
  const deleteAssessment = useDeleteAssessment();
  const [open, setOpen] = React.useState(false);
  const [courseQuery, setCourseQuery] = React.useState("");
  const [courseError, setCourseError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    departmentId: "development" as DepartmentId,
    courseId: "",
  });

  const filteredCourses = courses.filter((c) => {
    if (c.id === form.courseId) return true;
    return c.title.toLowerCase().includes(courseQuery.trim().toLowerCase());
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Assessment Builder" description="Create exams, question banks, and publish for learners.">
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setCourseError(null);
              setCourseQuery("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New assessment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setCourseError(null);
                try {
                  const result = await createAssessment.mutateAsync({
                    title: form.title,
                    description: form.description || "Assessment description",
                    departmentId: form.departmentId,
                    courseId: form.courseId || null,
                  });
                  if (!result.ok) {
                    setCourseError(result.fieldErrors?.courseId?.[0] ?? "Invalid input.");
                    toast.error("Failed to create assessment");
                    return;
                  }
                  setOpen(false);
                  toast.success("Assessment created");
                  router.push(`/dashboard/admin/assessments/${result.id}`);
                } catch {
                  toast.error("Failed to create assessment");
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Create assessment</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <Input
                  placeholder="Title"
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
                  className="h-11 w-full rounded-2xl border border-input bg-card px-3 text-sm"
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
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="create-course-link">
                    Link a course (optional)
                  </label>
                  <Input
                    placeholder="Search published courses"
                    value={courseQuery}
                    onChange={(e) => setCourseQuery(e.target.value)}
                  />
                  <select
                    id="create-course-link"
                    className="h-11 w-full rounded-2xl border border-input bg-card px-3 text-sm"
                    value={form.courseId}
                    onChange={(e) => {
                      setCourseError(null);
                      setForm((f) => ({ ...f, courseId: e.target.value }));
                    }}
                    aria-invalid={!!courseError}
                  >
                    <option value="">No course</option>
                    {filteredCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  {courseError && <p className="text-xs text-destructive">{courseError}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create draft</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No assessments yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.title}</p>
                    <StatusBadge status={item.publishStatus} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {DEPARTMENT_LABELS[item.departmentId]}
                    {item.courseTitle ? ` · ${item.courseTitle}` : ""} · {item.questionsCount}{" "}
                    questions · {item.durationMinutes}m · pass {item.passingScore}%
                  </p>
                </div>
                {item.publishStatus !== "published" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const result = await updateAssessment.mutateAsync({
                        id: item.id,
                        publishStatus: "published",
                      });
                      if (!result.ok) {
                        toast.error("Could not publish");
                        return;
                      }
                      toast.success("Published");
                    }}
                  >
                    Publish
                  </Button>
                )}
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/admin/assessments/${item.id}`}>
                    <Edit className="h-4 w-4" /> Builder
                  </Link>
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => deleteAssessment.mutate(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
