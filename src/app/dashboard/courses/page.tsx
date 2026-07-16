"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Filter, Search } from "lucide-react";
import { CourseCard } from "@/components/cards/course-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { courses } from "@/data/mock";
import { DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import type { CourseStatus, DepartmentId, LearningLevel } from "@/types";

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<DepartmentId | "all">("all");
  const [level, setLevel] = useState<LearningLevel | "all">("all");
  const [status, setStatus] = useState<CourseStatus | "all">("all");
  const [tab, setTab] = useState("all");

  const filtered = useMemo(() => {
    let result = [...courses];

    if (tab === "in_progress") result = result.filter((c) => c.status === "in_progress");
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

    return result;
  }, [search, department, level, status, tab]);

  const counts = {
    all: courses.length,
    in_progress: courses.filter((c) => c.status === "in_progress").length,
    completed: courses.filter((c) => c.status === "completed").length,
  };

  const departments = Object.entries(DEPARTMENT_LABELS) as [DepartmentId, string][];
  const levels = Object.entries(LEVEL_LABELS) as [LearningLevel, string][];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Catalog"
        description="Browse the full library of enterprise courses across all departments."
      />

      <motion.div
        {...fade}
        transition={{ duration: 0.35 }}
        className="rounded-xl border border-border bg-card p-4 shadow-(--shadow-sm)"
      >
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
            </div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as DepartmentId | "all")}
              className="h-9 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All departments</option>
              {departments.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as LearningLevel | "all")}
              className="h-9 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All levels</option>
              {levels.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CourseStatus | "all")}
              className="h-9 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All statuses</option>
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">
            All <Badge variant="secondary" className="ml-1.5">{counts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress <Badge variant="secondary" className="ml-1.5">{counts.in_progress}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed <Badge variant="secondary" className="ml-1.5">{counts.completed}</Badge>
          </TabsTrigger>
        </TabsList>

        {(["all", "in_progress", "completed"] as const).map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue}>
            {filtered.length > 0 ? (
              <motion.div
                {...fade}
                transition={{ duration: 0.35 }}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {filtered.map((course, i) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <CourseCard course={course} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <EmptyState
                title="No courses match your filters"
                description="Try changing your search or filter criteria."
                actionLabel="Reset filters"
                onAction={() => {
                  setSearch("");
                  setDepartment("all");
                  setLevel("all");
                  setStatus("all");
                }}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
