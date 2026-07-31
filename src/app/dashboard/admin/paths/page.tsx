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
  useAdminPaths,
  useCreatePath,
  useDeletePath,
  useUpdatePath,
} from "@/hooks/use-certification";
import type { DepartmentId } from "@/types";

export default function AdminPathsPage() {
  const router = useRouter();
  const { data = [], isLoading } = useAdminPaths();
  const createPath = useCreatePath();
  const updatePath = useUpdatePath();
  const deletePath = useDeletePath();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    departmentId: "development" as DepartmentId,
    certificateTitle: "",
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Learning Paths" description="Build career tracks that end in certification.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New path
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const created = await createPath.mutateAsync({
                    title: form.title,
                    description: form.description || "Path description",
                    departmentId: form.departmentId,
                    certificateTitle: form.certificateTitle || null,
                    skills: [],
                  });
                  setOpen(false);
                  toast.success("Path created");
                  router.push(`/dashboard/admin/paths/${created.id}`);
                } catch {
                  toast.error("Failed to create path");
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Create learning path</DialogTitle>
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
                <Input
                  placeholder="Certificate title (on completion)"
                  value={form.certificateTitle}
                  onChange={(e) => setForm((f) => ({ ...f, certificateTitle: e.target.value }))}
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
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createPath.isPending}>
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
          {data.map((path) => (
            <Card key={path.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{path.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {DEPARTMENT_LABELS[path.departmentId]} · {path.stepsCount} steps
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={path.publishStatus} />
                  {path.publishStatus !== "published" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await updatePath.mutateAsync({ id: path.id, publishStatus: "published" });
                        toast.success("Published");
                      }}
                    >
                      Publish
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await updatePath.mutateAsync({ id: path.id, publishStatus: "draft" });
                        toast.success("Unpublished");
                      }}
                    >
                      Unpublish
                    </Button>
                  )}
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/dashboard/admin/paths/${path.id}`}>
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await deletePath.mutateAsync(path.id);
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
