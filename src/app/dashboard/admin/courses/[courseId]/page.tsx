"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit, GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEPARTMENT_LABELS, LEARNING_CATEGORY_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { useCourseBuilder } from "@/hooks/use-courses";
import {
  createLessonAction,
  createModuleAction,
  deleteLessonAction,
  deleteModuleAction,
  reorderLessonsAction,
  reorderModulesAction,
  setCourseStatusAction,
  updateCourseAction,
  updateLessonAction,
} from "@/services/courses";
import type { DepartmentId, Difficulty, LearningCategory, LearningLevel } from "@/types";
import type { LessonContentType, PublishStatus } from "@/db/schema/courses";

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2">
      <button type="button" className="mt-3 cursor-grab text-muted-foreground" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

type LessonRow = {
  id: string;
  title: string;
  type: LessonContentType;
  content: string | null;
  durationMinutes: number;
  isPreview: boolean;
  learningObjectives: string[];
  prerequisites: string[];
};

export default function CourseBuilderPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const { data, isLoading, refetch } = useCourseBuilder(courseId);
  const [moduleTitle, setModuleTitle] = React.useState("");
  const [lessonForms, setLessonForms] = React.useState<Record<string, { title: string; type: string }>>({});
  const [editingLesson, setEditingLesson] = React.useState<(LessonRow & { moduleId: string }) | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const { course, modules } = data;
  const c = course.course;

  const handleModuleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = modules.map((m) => m.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    await reorderModulesAction(courseId, { ids: next });
    refetch();
  };

  const handleLessonDragEnd = async (moduleId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod) return;
    const ids = mod.lessons.map((l) => l.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    await reorderLessonsAction(moduleId, { ids: next });
    refetch();
  };

  const setStatus = async (status: PublishStatus) => {
    await setCourseStatusAction(courseId, status);
    refetch();
    toast.success(`Status set to ${status}`);
  };

  const saveLesson = async () => {
    if (!editingLesson) return;
    await updateLessonAction({
      id: editingLesson.id,
      title: editingLesson.title,
      type: editingLesson.type,
      content: editingLesson.content,
      durationMinutes: editingLesson.durationMinutes,
      isPreview: editingLesson.isPreview,
      learningObjectives: editingLesson.learningObjectives,
      prerequisites: editingLesson.prerequisites,
    });
    setEditingLesson(null);
    refetch();
    toast.success("Lesson saved");
  };

  return (
    <div className="space-y-6">
      <PageHeader title={c.title} description="Professional content authoring — modules, lessons, versioning.">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{c.publishStatus}</Badge>
          <Button size="sm" variant="outline" onClick={() => setStatus("draft")}>
            Draft
          </Button>
          <Button size="sm" variant="outline" onClick={() => setStatus("review")}>
            Send to review
          </Button>
          <Button size="sm" onClick={() => setStatus("published")}>
            Publish
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setStatus("archived")}>
            Archive
          </Button>
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Course metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input
            defaultValue={c.title}
            onBlur={async (e) => {
              await updateCourseAction({ id: courseId, title: e.target.value });
              refetch();
            }}
          />
          <Input
            placeholder="Thumbnail URL"
            defaultValue={c.thumbnailUrl ?? ""}
            onBlur={async (e) => {
              await updateCourseAction({ id: courseId, thumbnailUrl: e.target.value });
              refetch();
            }}
          />
          <textarea
            className="min-h-24 rounded-2xl border border-input bg-card px-4 py-3 text-sm md:col-span-2"
            defaultValue={c.description}
            onBlur={async (e) => {
              await updateCourseAction({ id: courseId, description: e.target.value });
              refetch();
            }}
          />
          <select
            className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
            defaultValue={c.departmentId}
            onChange={async (e) => {
              await updateCourseAction({ id: courseId, departmentId: e.target.value as DepartmentId });
              refetch();
            }}
          >
            {Object.entries(DEPARTMENT_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
            defaultValue={c.level}
            onChange={async (e) => {
              await updateCourseAction({ id: courseId, level: e.target.value as LearningLevel });
              refetch();
            }}
          >
            {Object.entries(LEVEL_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
            defaultValue={c.difficulty}
            onChange={async (e) => {
              await updateCourseAction({ id: courseId, difficulty: e.target.value as Difficulty });
              refetch();
            }}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
          <select
            className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
            defaultValue={c.learningCategory ?? "role"}
            onChange={async (e) => {
              await updateCourseAction({
                id: courseId,
                learningCategory: e.target.value as LearningCategory,
              });
              refetch();
            }}
            aria-label="Learning category"
          >
            <option value="role">{LEARNING_CATEGORY_LABELS.role}</option>
            <option value="goal">{LEARNING_CATEGORY_LABELS.goal}</option>
          </select>
          <Input
            placeholder="Tags (comma separated)"
            defaultValue={c.tags.join(", ")}
            onBlur={async (e) => {
              const tags = e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
              await updateCourseAction({ id: courseId, tags });
              refetch();
            }}
          />
          <Input
            placeholder="Learning objectives (comma separated)"
            defaultValue={(c.learningObjectives ?? []).join(", ")}
            onBlur={async (e) => {
              const learningObjectives = e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
              await updateCourseAction({ id: courseId, learningObjectives });
              refetch();
            }}
          />
          <Input
            placeholder="Prerequisites (comma separated)"
            defaultValue={(c.prerequisites ?? []).join(", ")}
            onBlur={async (e) => {
              const prerequisites = e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
              await updateCourseAction({ id: courseId, prerequisites });
              refetch();
            }}
          />
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Input
          placeholder="New module title"
          value={moduleTitle}
          onChange={(e) => setModuleTitle(e.target.value)}
        />
        <Button
          onClick={async () => {
            if (!moduleTitle.trim()) return;
            await createModuleAction({ courseId, title: moduleTitle });
            setModuleTitle("");
            refetch();
            toast.success("Module added");
          }}
        >
          <Plus className="h-4 w-4" /> Add module
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
        <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {modules.map((mod) => (
              <SortableRow key={mod.id} id={mod.id}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">{mod.title}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={async () => {
                        await deleteModuleAction(mod.id);
                        refetch();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => handleLessonDragEnd(mod.id, e)}
                    >
                      <SortableContext
                        items={mod.lessons.map((l) => l.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {mod.lessons.map((lesson) => (
                          <SortableRow key={lesson.id} id={lesson.id}>
                            <div className="mb-2 flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                              <div>
                                <p className="font-medium">{lesson.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {lesson.type} · {lesson.durationMinutes}m
                                  {lesson.content ? "" : " · missing content"}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() =>
                                    setEditingLesson({
                                      id: lesson.id,
                                      moduleId: mod.id,
                                      title: lesson.title,
                                      type: lesson.type,
                                      content: lesson.content,
                                      durationMinutes: lesson.durationMinutes,
                                      isPreview: lesson.isPreview,
                                      learningObjectives: lesson.learningObjectives ?? [],
                                      prerequisites: lesson.prerequisites ?? [],
                                    })
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={async () => {
                                    await deleteLessonAction(lesson.id);
                                    refetch();
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </SortableRow>
                        ))}
                      </SortableContext>
                    </DndContext>

                    <div className="flex gap-2 pt-2">
                      <Input
                        placeholder="Lesson title"
                        value={lessonForms[mod.id]?.title ?? ""}
                        onChange={(e) =>
                          setLessonForms((f) => ({
                            ...f,
                            [mod.id]: { title: e.target.value, type: f[mod.id]?.type ?? "video" },
                          }))
                        }
                      />
                      <select
                        className="rounded-2xl border border-input bg-card px-3 text-sm"
                        value={lessonForms[mod.id]?.type ?? "video"}
                        onChange={(e) =>
                          setLessonForms((f) => ({
                            ...f,
                            [mod.id]: { title: f[mod.id]?.title ?? "", type: e.target.value },
                          }))
                        }
                      >
                        <option value="video">Video</option>
                        <option value="pdf">PDF</option>
                        <option value="presentation">Presentation</option>
                        <option value="article">Article</option>
                        <option value="external_link">External link</option>
                      </select>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          const form = lessonForms[mod.id] ?? { title: "New lesson", type: "video" };
                          await createLessonAction({
                            moduleId: mod.id,
                            title: form.title || "New lesson",
                            type: form.type as LessonContentType,
                            content: "",
                            durationMinutes: 10,
                          });
                          refetch();
                          toast.success("Lesson added — click Edit to add content");
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={!!editingLesson} onOpenChange={(open) => !open && setEditingLesson(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit lesson</DialogTitle>
          </DialogHeader>
          {editingLesson && (
            <div className="space-y-3 py-2">
              <Input
                value={editingLesson.title}
                onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
              />
              <select
                className="h-11 w-full rounded-2xl border border-input bg-card px-3 text-sm"
                value={editingLesson.type}
                onChange={(e) =>
                  setEditingLesson({ ...editingLesson, type: e.target.value as LessonContentType })
                }
              >
                <option value="video">Video (YouTube/Vimeo embed URL)</option>
                <option value="pdf">PDF URL</option>
                <option value="presentation">Presentation URL</option>
                <option value="article">Article (Markdown)</option>
                <option value="external_link">External link</option>
              </select>
              <textarea
                className="min-h-40 w-full rounded-2xl border border-input bg-card px-4 py-3 font-mono text-sm"
                placeholder={
                  editingLesson.type === "article"
                    ? "## Lesson content\n\nWrite markdown here..."
                    : "Paste embed URL, PDF URL, or external link"
                }
                value={editingLesson.content ?? ""}
                onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
              />
              <Input
                type="number"
                min={0}
                value={editingLesson.durationMinutes}
                onChange={(e) =>
                  setEditingLesson({
                    ...editingLesson,
                    durationMinutes: Number(e.target.value) || 0,
                  })
                }
              />
              <Input
                placeholder="Learning objectives (comma separated)"
                value={editingLesson.learningObjectives.join(", ")}
                onChange={(e) =>
                  setEditingLesson({
                    ...editingLesson,
                    learningObjectives: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
              />
              <Input
                placeholder="Prerequisites (comma separated)"
                value={editingLesson.prerequisites.join(", ")}
                onChange={(e) =>
                  setEditingLesson({
                    ...editingLesson,
                    prerequisites: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editingLesson.isPreview}
                  onChange={(e) =>
                    setEditingLesson({ ...editingLesson, isPreview: e.target.checked })
                  }
                />
                Preview lesson (unlocked without progress)
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLesson(null)}>
              Cancel
            </Button>
            <Button onClick={saveLesson}>Save lesson</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
