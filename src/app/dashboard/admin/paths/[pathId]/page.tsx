"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminPathBuilder,
  useDeletePathStep,
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
  const [stepTitle, setStepTitle] = React.useState("");
  const [stepType, setStepType] = React.useState<"course" | "assessment">("course");
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
            <Input
              className="min-w-[200px] flex-1"
              placeholder="Step title"
              value={stepTitle}
              onChange={(e) => setStepTitle(e.target.value)}
            />
            <select
              className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
              value={stepType}
              onChange={(e) => setStepType(e.target.value as "course" | "assessment")}
            >
              <option value="course">Course</option>
              <option value="assessment">Assessment</option>
            </select>
            <Button
              onClick={async () => {
                if (!stepTitle.trim()) return;
                await upsertStep.mutateAsync({
                  pathId,
                  title: stepTitle.trim(),
                  stepType,
                });
                setStepTitle("");
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
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {i + 1}. {step.title}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">{step.stepType}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await deleteStep.mutateAsync(step.id);
                    toast.success("Removed");
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
