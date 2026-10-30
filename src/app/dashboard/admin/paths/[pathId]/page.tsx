"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminAssessmentOptions,
  useAdminCourseOptions,
  useAdminPathBuilder,
  useDeletePathStep,
  useReorderPathSteps,
  useUpdatePath,
  useUpsertPathStep,
} from "@/hooks/use-certification";

export default function AdminPathBuilderPage() {
  const params = useParams();
  const pathId = params.pathId as string;
  const { data, isLoading } = useAdminPathBuilder(pathId);
  const updatePath = useUpdatePath();
  const upsertStep = useUpsertPathStep();
  const deleteStep = useDeletePathStep();
  const reorderSteps = useReorderPathSteps();
  const { data: courseOptions = [] } = useAdminCourseOptions();
  const { data: assessmentOptions = [] } = useAdminAssessmentOptions();
  const [stepType, setStepType] = React.useState<"course" | "assessment">("course");
  const [pickedId, setPickedId] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [linkPick, setLinkPick] = React.useState<Record<string, string>>({});
  const [meta, setMeta] = React.useState({ title: "", description: "", certificateTitle: "" });

  React.useEffect(() => {
    if (data?.path) {
      setMeta({
        title: data.path.title,
        description: data.path.description,
        certificateTitle: data.path.certificateTitle ?? "",
      });
    }
  }, [data?.path]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data) {
    return (
      <div className="space-y-4">
        <p>Path not found</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/admin/paths">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
        <Link href="/dashboard/admin/paths">
          <ArrowLeft className="h-4 w-4" /> Paths
        </Link>
      </Button>

      <PageHeader title="Path builder" description="Order courses and assessments toward a certificate." />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={meta.title}
            onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
            placeholder="Title"
          />
          <Input
            value={meta.description}
            onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
            placeholder="Description"
          />
          <Input
            value={meta.certificateTitle}
            onChange={(e) => setMeta((m) => ({ ...m, certificateTitle: e.target.value }))}
            placeholder="Certificate title on completion"
          />
          <Button
            onClick={async () => {
              await updatePath.mutateAsync({
                id: pathId,
                title: meta.title,
                description: meta.description,
                certificateTitle: meta.certificateTitle || null,
              });
              toast.success("Saved");
            }}
          >
            Save details
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Steps ({data.steps.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <select
              className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
              value={stepType}
              onChange={(e) => {
                setStepType(e.target.value as "course" | "assessment");
                setPickedId("");
                setSearch("");
              }}
            >
              <option value="course">Course</option>
              <option value="assessment">Assessment</option>
            </select>
            <Input
              className="min-w-[160px] flex-1"
              placeholder={stepType === "course" ? "Search published courses" : "Search published assessments"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="h-11 min-w-[220px] flex-1 rounded-2xl border border-input bg-card px-3 text-sm"
              value={pickedId}
              onChange={(e) => setPickedId(e.target.value)}
            >
              <option value="">
                {stepType === "course" ? "Select a published course" : "Select a published assessment"}
              </option>
              {(stepType === "course" ? courseOptions : assessmentOptions)
                .filter((opt) => opt.title.toLowerCase().includes(search.trim().toLowerCase()))
                .map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.title}
                  </option>
                ))}
            </select>
            <Button
              disabled={!pickedId || upsertStep.isPending}
              onClick={async () => {
                const options = stepType === "course" ? courseOptions : assessmentOptions;
                const picked = options.find((o) => o.id === pickedId);
                if (!picked) return;
                const result = await upsertStep.mutateAsync({
                  pathId,
                  title: picked.title,
                  stepType,
                  courseId: stepType === "course" ? picked.id : null,
                  assessmentId: stepType === "assessment" ? picked.id : null,
                });
                if (result && "ok" in result && !result.ok) {
                  toast.error(result.message);
                  return;
                }
                setPickedId("");
                setSearch("");
                toast.success("Step added");
              }}
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>

          <div className="space-y-2">
            {data.steps.map((step, i) => (
              <div
                key={step.id}
                className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {i + 1}. {step.linkedTitle || step.title}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {step.stepType}
                    {!step.linked
                      ? " · Unlinked item"
                      : step.targetPublished === false
                        ? " · Unpublished"
                        : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!step.linked && (
                    <>
                      <select
                        className="h-9 max-w-[220px] rounded-xl border border-input bg-card px-2 text-xs"
                        value={linkPick[step.id] ?? ""}
                        onChange={(e) =>
                          setLinkPick((m) => ({ ...m, [step.id]: e.target.value }))
                        }
                      >
                        <option value="">Link to course</option>
                        {courseOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.title}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!linkPick[step.id] || upsertStep.isPending}
                        onClick={async () => {
                          const courseId = linkPick[step.id];
                          if (!courseId) return;
                          const picked = courseOptions.find((o) => o.id === courseId);
                          const result = await upsertStep.mutateAsync({
                            pathId,
                            id: step.id,
                            title: picked?.title || step.title,
                            stepType: "course",
                            courseId,
                          });
                          if (result && "ok" in result && !result.ok) {
                            toast.error(result.message);
                            return;
                          }
                          toast.success("Linked");
                        }}
                      >
                        Link
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={i === 0 || reorderSteps.isPending}
                    onClick={async () => {
                      const ids = data.steps.map((s) => s.id);
                      [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
                      await reorderSteps.mutateAsync({ pathId, stepIds: ids });
                    }}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={i === data.steps.length - 1 || reorderSteps.isPending}
                    onClick={async () => {
                      const ids = data.steps.map((s) => s.id);
                      [ids[i + 1], ids[i]] = [ids[i], ids[i + 1]];
                      await reorderSteps.mutateAsync({ pathId, stepIds: ids });
                    }}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={deleteStep.isPending}
                    onClick={async () => {
                      await deleteStep.mutateAsync(step.id);
                      toast.success("Removed");
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
