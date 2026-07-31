"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  useAdminAssignments,
  useAdminCourseOptions,
  useCreateAssignment,
  useDeleteAssignment,
  useUpdateAssignment,
} from "@/hooks/use-certification";
import { useAdminUsers } from "@/hooks/use-operations";
import { DEFAULT_CODING_CHECKS } from "@/lib/coding-checks";
import type { DepartmentId } from "@/types";
import type { CodingCheck, CodingLanguage } from "@/types/coding";

type AudienceScope = "department" | "user";
type SubmissionType = "text" | "url" | "github" | "coding";

function parseChecks(text: string): CodingCheck[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [label, kind, ...rest] = line.split("|").map((s) => s.trim());
      const value = rest.join("|");
      const allowed = ["contains", "not_contains", "regex", "min_lines", "min_chars"] as const;
      const k = allowed.includes(kind as (typeof allowed)[number])
        ? (kind as CodingCheck["kind"])
        : "contains";
      return {
        id: `check-${i + 1}`,
        label: label || `Check ${i + 1}`,
        kind: k,
        value: value || "",
      };
    })
    .filter((c) => c.value.length > 0 || c.kind === "min_lines" || c.kind === "min_chars");
}

const DEFAULT_CHECKS_TEXT =
  "Has a real implementation|min_lines|3\nNo leftover TODO|not_contains|TODO\nDefines solve function|contains|function solve";

export default function AdminAssignmentsPage() {
  const router = useRouter();
  const { data = [], isLoading } = useAdminAssignments();
  const { data: courses = [] } = useAdminCourseOptions();
  const { data: users = [] } = useAdminUsers();
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    courseId: "",
    maxScore: 100,
    submissionType: "text" as SubmissionType,
    codingLanguage: "javascript" as CodingLanguage,
    starterCode: "// Write your solution\nfunction solve() {\n  \n}\n",
    checksText: DEFAULT_CHECKS_TEXT,
    scope: "department" as AudienceScope,
    departmentId: "" as DepartmentId | "",
    userIds: [] as string[],
    userSearch: "",
  });

  const departments = Object.entries(DEPARTMENT_LABELS) as [DepartmentId, string][];

  const filteredUsers = React.useMemo(() => {
    const q = form.userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (DEPARTMENT_LABELS[u.department] ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, form.userSearch]);

  const toggleUser = (id: string) => {
    setForm((f) => ({
      ...f,
      userIds: f.userIds.includes(id)
        ? f.userIds.filter((x) => x !== id)
        : [...f.userIds, id],
    }));
  };

  const canCreate =
    Boolean(form.title.trim()) &&
    (form.scope === "department"
      ? Boolean(form.departmentId)
      : form.userIds.length > 0);

  const audienceLabel = (row: (typeof data)[number]) => {
    if (row.scope === "department" && row.departmentId) {
      return DEPARTMENT_LABELS[row.departmentId] ?? row.departmentId;
    }
    if (row.scope === "user") {
      return `${row.assigneeCount ?? 0} people`;
    }
    return "Everyone";
  };

  const resetForm = () =>
    setForm({
      title: "",
      description: "",
      courseId: "",
      maxScore: 100,
      submissionType: "text",
      codingLanguage: "javascript",
      starterCode: "// Write your solution\nfunction solve() {\n  \n}\n",
      checksText: DEFAULT_CHECKS_TEXT,
      scope: "department",
      departmentId: "",
      userIds: [],
      userSearch: "",
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Assign homework to a department or specific people. Only they can see and submit it."
      >
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!canCreate) {
                  toast.error(
                    form.scope === "department"
                      ? "Pick a department"
                      : "Select at least one person"
                  );
                  return;
                }
                try {
                  const checks = parseChecks(form.checksText);
                  const created = await createAssignment.mutateAsync({
                    title: form.title,
                    description: form.description || "Assignment brief",
                    courseId: form.courseId || null,
                    maxScore: form.maxScore,
                    dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
                    submissionType: form.submissionType,
                    meta:
                      form.submissionType === "coding"
                        ? {
                            coding: {
                              language: form.codingLanguage,
                              starterCode: form.starterCode,
                              checks: checks.length ? checks : DEFAULT_CODING_CHECKS,
                            },
                          }
                        : {},
                    scope: form.scope,
                    departmentId:
                      form.scope === "department" ? form.departmentId || null : null,
                    userIds: form.scope === "user" ? form.userIds : undefined,
                  });
                  setOpen(false);
                  resetForm();
                  toast.success(
                    form.submissionType === "coding"
                      ? "Coding assignment created"
                      : "Assignment created"
                  );
                  router.push(`/dashboard/admin/assignments/${created.id}`);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed to create assignment");
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Create assignment</DialogTitle>
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
                  value={form.submissionType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      submissionType: e.target.value as SubmissionType,
                    }))
                  }
                >
                  <option value="text">Text response</option>
                  <option value="url">URL / document link</option>
                  <option value="github">GitHub link</option>
                  <option value="coding">Coding assignment</option>
                </select>
                {form.submissionType === "coding" && (
                  <div className="space-y-3 rounded-2xl border border-dashed border-border p-3">
                    <p className="text-sm font-medium">Coding setup</p>
                    <select
                      className="h-11 w-full rounded-2xl border border-input bg-card px-3 text-sm"
                      value={form.codingLanguage}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          codingLanguage: e.target.value as CodingLanguage,
                        }))
                      }
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="sql">SQL</option>
                      <option value="java">Java</option>
                      <option value="other">Other</option>
                    </select>
                    <textarea
                      className="min-h-24 w-full rounded-2xl border border-input bg-card px-3 py-2 font-mono text-xs"
                      placeholder="Starter code"
                      value={form.starterCode}
                      onChange={(e) => setForm((f) => ({ ...f, starterCode: e.target.value }))}
                    />
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">
                        Checks (one per line): <code>label|kind|value</code>
                      </p>
                      <textarea
                        className="min-h-24 w-full rounded-2xl border border-input bg-card px-3 py-2 font-mono text-xs"
                        value={form.checksText}
                        onChange={(e) => setForm((f) => ({ ...f, checksText: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
                <select
                  className="h-11 w-full rounded-2xl border border-input bg-card px-3 text-sm"
                  value={form.courseId}
                  onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
                >
                  <option value="">No course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Assign to</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={form.scope === "department" ? "default" : "outline"}
                      onClick={() => setForm((f) => ({ ...f, scope: "department" }))}
                    >
                      Department
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={form.scope === "user" ? "default" : "outline"}
                      onClick={() => setForm((f) => ({ ...f, scope: "user" }))}
                    >
                      People
                    </Button>
                  </div>
                </div>

                {form.scope === "department" ? (
                  <select
                    className="h-11 w-full rounded-2xl border border-input bg-card px-3 text-sm"
                    value={form.departmentId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        departmentId: e.target.value as DepartmentId | "",
                      }))
                    }
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2 rounded-2xl border border-border p-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search people…"
                        value={form.userSearch}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, userSearch: e.target.value }))
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {form.userIds.length} selected
                    </p>
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                      {filteredUsers.map((u) => {
                        const selected = form.userIds.includes(u.id);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => toggleUser(u.id)}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                              selected
                                ? "bg-primary/10 text-foreground"
                                : "hover:bg-muted/60"
                            }`}
                          >
                            <span>
                              <span className="font-medium">{u.name}</span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {u.email} · {DEPARTMENT_LABELS[u.department]}
                              </span>
                            </span>
                            {selected ? (
                              <span className="text-xs font-medium text-primary">Selected</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createAssignment.isPending || !canCreate}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="space-y-3">
          {data.map((row) => (
            <Card key={row.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{row.title}</p>
                    {row.submissionType === "coding" && (
                      <Badge variant="secondary">Coding</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {audienceLabel(row)} · {row.submissionsCount} submissions · max {row.maxScore}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={row.publishStatus} />
                  {row.publishStatus !== "published" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await updateAssignment.mutateAsync({
                          id: row.id,
                          publishStatus: "published",
                        });
                        toast.success("Published");
                      }}
                    >
                      Publish
                    </Button>
                  ) : null}
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/dashboard/admin/assignments/${row.id}`}>
                      <Edit className="h-3.5 w-3.5" /> Edit / Review
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await deleteAssignment.mutateAsync(row.id);
                      toast.success("Deleted");
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
