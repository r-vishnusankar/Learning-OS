"use client";

import * as React from "react";
import { toast } from "sonner";
import { FileImage, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createMediaAssetAction,
  deleteMediaAssetAction,
  listMediaAssetsAction,
} from "@/services/courses";

type MediaAsset = {
  id: string;
  name: string;
  url: string;
  type: string;
  createdAt: Date;
};

export default function MediaLibraryPage() {
  const [assets, setAssets] = React.useState<MediaAsset[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState({ name: "", url: "", type: "image" });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listMediaAssetsAction();
      setAssets(rows as MediaAsset[]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMediaAssetAction(form);
      setForm({ name: "", url: "", type: "image" });
      toast.success("Asset added");
      load();
    } catch {
      toast.error("Failed to add asset — use a valid URL");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description="Central repository for images, videos, PDFs, and documents. Paste URLs for now; UploadThing tokens unlock direct upload later."
      />

      <Card>
        <CardContent className="py-4">
          <form onSubmit={add} className="grid gap-3 md:grid-cols-4">
            <Input
              placeholder="Asset name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              placeholder="https://..."
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              required
            />
            <select
              className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
              <option value="document">Document</option>
              <option value="other">Other</option>
            </select>
            <Button type="submit">
              <Plus className="h-4 w-4" /> Add asset
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : assets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
            <FileImage className="h-8 w-8" />
            No media assets yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {assets.map((asset) => (
            <Card key={asset.id}>
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{asset.name}</p>
                    <Badge variant="secondary">{asset.type}</Badge>
                  </div>
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-xs text-primary hover:underline"
                  >
                    {asset.url}
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={async () => {
                    await deleteMediaAssetAction(asset.id);
                    load();
                  }}
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
