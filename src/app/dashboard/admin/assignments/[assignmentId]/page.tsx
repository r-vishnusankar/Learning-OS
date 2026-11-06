"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEPARTMENT_LABELS } from "@/constants/navigation";
import {
  useAdminAssignmentDetail,
  useAdminCourseOptions,
  useReviewSubmission,
  useUpdateAssignment,
} from "@/hooks/use-certification";
import { useAdminUsers } from "@/hooks/use-operations";
import { DEFAULT_CODING_CHECKS } from "@/lib/coding-checks";
import type { DepartmentId } from "@/types";
import type { CodingCheck, CodingLanguage, QuestionMeta } from "@/types/coding";
import * as React from "react";

type AudienceScope = "org" | "department" | "user";
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

function checksToText(checks: CodingCheck[] | undefined) {
  if (!checks?.length) {
    return "Has a real implementation|min_lines|3\nNo leftover TODO|not_contains|TODO\nDefines solve function|contains|function solve";
  }
  return checks.map((c) => `${c.label}|${c.kind}|${c.value}`).join("\n");
}

export default function AdminAssignmentDetailPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;
  const { data, isLoading, refetch } = useAdminAssignmentDetail(assignmentId);
  const { data: courses = [] } = useAdminCourseOptions();
  const { data: users = [] } = useAdminUsers();
  const updateAssignment = useUpdateAssignment();
  const review = useReviewSubmission();
  const [scores, setScores] = React.useState<Record<string, string>>({});
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    courseId: "",
    maxScore: 100,
    dueDate: "",
    submissionType: "text" as SubmissionType,
    publishStatus: "draft" as "draft" | "review" | "published" | "archived",
    codingLanguage: "javascript" as CodingLanguage,
    starterCode: "",
    checksText: "",
    scope: "department" as AudienceScope,
    departmentId: "" as DepartmentId | "",
    userIds: [] as string[],
  });
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [rejectComment, setRejectComment] = React.useState("");
  const rejectReason = rejectComment.trim();
  const rejectReady = rejectReason.length > 0 && rejectReason.length <= 1000;

  React.useEffect(() => {
    if (!data?.assignment) return;
    const a = data.assignment;
    const meta = (a.meta as QuestionMeta) ?? {};
    setForm({
      title: a.title,
      description: a.description ?? "",
      courseId: a.courseId ?? "",
      maxScore: a.maxScore,
      dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 10) : "",
      submissionType: (a.submissionType as SubmissionType) || "text",
      publishStatus: a.publishStatus,
      codingLanguage: meta.coding?.language ?? "javascript",
      starterCode: meta.coding?.starterCode ?? "",
      checksText: checksToText(meta.coding?.checks),
      scope: (a.scope as AudienceScope) || "department",
      departmentId: (a.departmentId as DepartmentId) || "",
      userIds: (data.assignees ?? []).map((x) => x.userId),
    });
  }, [data]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data) {
    return (
      <div className="space-y-4">
        <p>Assignment not found</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/admin/assignments">Back</Link>
        </Button>
      </div>
    );
  }

  const departments = Object.entries(DEPARTMENT_LABELS) as [DepartmentId, string][];

  const saveEdit = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (form.scope === "department" && !form.departmentId) {
      toast.error("Pick a department");
      return;
    }
    if (form.scope === "user" && form.userIds.length === 0) {
      toast.error("Select at least one person");
      return;
    }

    try {
      const checks = parseChecks(form.checksText);
      await updateAssignment.mutateAsync({
        id: assignmentId,
        title: form.title,
        description: form.description,
        courseId: form.courseId || null,
        maxScore: form.maxScore,
        dueDate: form.dueDate
          ? new Date(`${form.dueDate}T23:59:59.000Z`).toISOString()
          : null,
        submissionType: form.submissionType,
        publishStatus: form.publishStatus,
        scope: form.scope,
        departmentId: form.scope === "department" ? form.departmentId || null : null,
        userIds: form.scope === "user" ? form.userIds : [],
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
      });
      toast.success("Assignment updated");
      setEditing(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
        <Link href="/dashboard/admin/assignments">
          <ArrowLeft className="h-4 w-4" /> Assignments
        </Link>
      </Button>

      <PageHeader
        title={data.assignment.title}
        description={data.assignment.description || "Edit assignment settings and review submissions."}
      >
        <div className="flex flex-wrap items-center gap-2">
          {data.assignment.submissionType === "coding" && (
            <Badge variant="secondary">Coding</Badge>
          )}
          <Badge variant="outline" className="capitalize">
            {data.assignment.publishStatus}
          </Badge>
          {!editing ? (
            <Button size="sm" onClick={() => setEditing(true)}>
              Edit assignment
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  refetch();
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={updateAssignment.isPending}>
                <Save className="h-3.5 w-3.5" /> Save changes
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit assignment (admin)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Title"
            />
            <textarea
              className="min-h-24 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
                value={form.submissionType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, submissionType: e.target.value as SubmissionType }))
                }
              >
                <option value="text">Text response</option>
                <option value="url">URL / document link</option>
                <option value="github">GitHub link</option>
                <option value="coding">Coding assignment</option>
              </select>
              <select
                className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
                value={form.publishStatus}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    publishStatus: e.target.value as typeof form.publishStatus,
                  }))
                }
              >
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <Input
                type="number"
                value={form.maxScore}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxScore: Number(e.target.value) || 100 }))
                }
                placeholder="Max score"
              />
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
              <select
                className="h-11 rounded-2xl border border-input bg-card px-3 text-sm md:col-span-2"
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
            </div>

            {form.submissionType === "coding" && (
              <div className="space-y-3 rounded-2xl border border-dashed border-border p-4">
                <p className="text-sm font-medium">Coding setup</p>
                <select
                  className="h-11 w-full rounded-2xl border border-input bg-card px-3 text-sm md:max-w-xs"
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
                  className="min-h-28 w-full rounded-2xl border border-input bg-card px-4 py-3 font-mono text-sm"
                  value={form.starterCode}
                  onChange={(e) => setForm((f) => ({ ...f, starterCode: e.target.value }))}
                  placeholder="Starter code"
                />
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-input bg-card px-4 py-3 font-mono text-xs"
                  value={form.checksText}
                  onChange={(e) => setForm((f) => ({ ...f, checksText: e.target.value }))}
                  placeholder="label|kind|value"
                />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Audience</p>
              <div className="flex flex-wrap gap-2">
                {(["department", "user", "org"] as AudienceScope[]).map((scope) => (
                  <Button
                    key={scope}
                    type="button"
                    size="sm"
                    variant={form.scope === scope ? "default" : "outline"}
                    onClick={() => setForm((f) => ({ ...f, scope }))}
                  >
                    {scope === "org" ? "Everyone" : scope === "user" ? "People" : "Department"}
                  </Button>
                ))}
              </div>
              {form.scope === "department" && (
                <select
                  className="h-11 w-full rounded-2xl border border-input bg-card px-3 text-sm"
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      departmentId: e.target.value as DepartmentId | "",
                    }))
                  }
                >
                  <option value="">Select department</option>
                  {departments.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
              {form.scope === "user" && (
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-2xl border border-border p-3">
                  {users.map((u) => {
                    const selected = form.userIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
                          selected ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                        }`}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            userIds: selected
                              ? f.userIds.filter((id) => id !== u.id)
                              : [...f.userIds, u.id],
                          }))
                        }
                      >
                        <span>
                          {u.name} · {u.email}
                        </span>
                        <span className="text-xs">{selected ? "Selected" : "Add"}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Audience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>
              {data.assignment.scope === "department" && data.assignment.departmentId
                ? `Department: ${DEPARTMENT_LABELS[data.assignment.departmentId] ?? data.assignment.departmentId}`
                : data.assignment.scope === "user"
                  ? `${data.assignees?.length ?? 0} assigned people`
                  : "Everyone (org-wide)"}
            </p>
            <p>
              Type: {data.assignment.submissionType}
              {data.assignment.dueDate
                ? ` · Due ${new Date(data.assignment.dueDate).toLocaleDateString()}`
                : ""}
              {` · Max ${data.assignment.maxScore}`}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Submissions ({data.submissions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          ) : (
            data.submissions.map((sub) => (
              <div key={sub.id} className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {sub.userName ?? sub.userEmail ?? sub.userId}
                    </p>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {sub.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {sub.submittedAt
                      ? new Date(sub.submittedAt).toLocaleString()
                      : "Not submitted"}
                  </span>
                </div>
                {sub.content && (
                  <pre
                    className={
                      data.assignment.submissionType === "coding"
                        ? "max-h-64 overflow-auto rounded-xl bg-code-surface p-3 font-mono text-xs text-slate-100"
                        : "whitespace-pre-wrap text-sm"
                    }
                  >
                    {sub.content}
                  </pre>
                )}
                {sub.feedback && (
                  <pre className="whitespace-pre-wrap rounded-xl bg-muted/40 p-3 font-sans text-xs text-muted-foreground">
                    {sub.feedback}
                  </pre>
                )}
                {sub.url && (
                  <a
                    href={sub.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline"
                  >
                    {sub.url}
                  </a>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    className="w-28"
                    placeholder="Score"
                    value={scores[sub.id] ?? (sub.score?.toString() ?? "")}
                    onChange={(e) => setScores((s) => ({ ...s, [sub.id]: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    disabled={review.isPending}
                    onClick={async () => {
                      const score = Number(scores[sub.id] ?? sub.score ?? 0);
                      await review.mutateAsync({
                        submissionId: sub.id,
                        status: "graded",
                        score,
                        feedback: "Graded by instructor",
                      });
                      toast.success("Graded");
                    }}
                  >
                    Approve / Grade
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={review.isPending}
                    onClick={() => {
                      setRejectingId(sub.id);
                      setRejectComment("");
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={rejectingId != null}
        onOpenChange={(open) => {
          if (!open && !review.isPending) {
            setRejectingId(null);
            setRejectComment("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject submission</DialogTitle>
            <DialogDescription>
              Tell the learner what to change. This comment is required and is stored with the
              latest review only.
            </DialogDescription>
          </DialogHeader>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm"
            value={rejectComment}
            maxLength={1000}
            disabled={review.isPending}
            onChange={(e) => setRejectComment(e.target.value.slice(0, 1000))}
            placeholder="Reason and required updates"
          />
          <p className="text-xs text-muted-foreground">{rejectComment.length}/1000</p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={review.isPending}
              onClick={() => {
                setRejectingId(null);
                setRejectComment("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!rejectReady || review.isPending}
              onClick={async () => {
                if (!rejectingId || !rejectReady) return;
                try {
                  const result = await review.mutateAsync({
                    submissionId: rejectingId,
                    status: "rejected",
                    feedback: rejectReason,
                  });
                  if (!result.ok) {
                    toast.error(result.message);
                    return;
                  }
                  toast.success("Rejected");
                  setRejectingId(null);
                  setRejectComment("");
                  await refetch();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Reject failed");
                }
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
