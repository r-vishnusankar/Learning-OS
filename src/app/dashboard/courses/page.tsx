"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { CourseCard } from "@/components/cards/course-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DEPARTMENT_LABELS, LEARNING_CATEGORY_LABELS, LEVEL_LABELS, levelsForFilter } from "@/constants/navigation";
import { usePublishedCourses } from "@/hooks/use-courses";
import type { CourseStatus, DepartmentId, LearningCategory, LearningLevel } from "@/types";
import { isActiveCourseStatus } from "@/lib/course-progress";

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function CoursesPage() {
  const { data: courses = [], isLoading } = usePublishedCourses();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<DepartmentId | "all">("all");
  const [level, setLevel] = useState<LearningLevel | "all">("all");
  const [status, setStatus] = useState<CourseStatus | "all">("all");
  const [learningCategory, setLearningCategory] = useState<LearningCategory | "all">("all");
  const [tab, setTab] = useState("all");

  const filtered = useMemo(() => {
    let result = [...courses];
    if (tab === "in_progress") result = result.filter((c) => isActiveCourseStatus(c.status));
    else if (tab === "completed") result = result.filter((c) => c.status === "completed");
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    if (department !== "all") result = result.filter((c) => c.department === department);
    if (level !== "all") result = result.filter((c) => c.level === level);
    if (status !== "all") result = result.filter((c) => c.status === status);
    if (learningCategory !== "all") {
      result = result.filter((c) => c.learningCategory === learningCategory);
    }
    return result;
  }, [courses, search, department, level, status, learningCategory, tab]);

  const counts = {
    all: courses.length,
    in_progress: courses.filter((c) => isActiveCourseStatus(c.status)).length,
    completed: courses.filter((c) => c.status === "completed").length,
  };

  const departments = Object.entries(DEPARTMENT_LABELS) as [DepartmentId, string][];
  const levels = levelsForFilter(department);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Catalog"
        description="Browse live courses from your organization library."
      />

      <motion.div {...fade} className="rounded-xl border border-border bg-card p-4 shadow-(--shadow-sm)">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
            value={department}
            onChange={(e) => {
              const next = e.target.value as DepartmentId | "all";
              setDepartment(next);
              if (level !== "all" && !levelsForFilter(next).includes(level)) {
                setLevel("all");
              }
            }}
          >
            <option value="all">All departments</option>
            {departments.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
            value={level}
            onChange={(e) => setLevel(e.target.value as LearningLevel | "all")}
          >
            <option value="all">All levels</option>
            {levels.map((id) => (
              <option key={id} value={id}>
                {LEVEL_LABELS[id]}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
            value={learningCategory}
            onChange={(e) => setLearningCategory(e.target.value as LearningCategory | "all")}
          >
            <option value="all">All categories</option>
            <option value="role">{LEARNING_CATEGORY_LABELS.role}</option>
            <option value="goal">{LEARNING_CATEGORY_LABELS.goal}</option>
          </select>
        </div>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="in_progress">In progress ({counts.in_progress})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-6">
          {filtered.length === 0 ? (
            <EmptyState title="No courses found" description="Try adjusting filters or check back later." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
