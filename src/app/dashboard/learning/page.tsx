"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  BookOpen,
  Bookmark,
  ChevronRight,
  Clock,
  Filter,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { CourseCard } from "@/components/cards/course-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { courses } from "@/data/mock";
import { DEPARTMENT_LABELS } from "@/constants/navigation";
import type { Course, DepartmentId, Difficulty } from "@/types";
import { cn } from "@/lib/utils";

type SortOption = "recommended" | "rating" | "newest" | "duration";

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function CourseRow({
  title,
  description,
  items,
  variant = "default",
}: {
  title: string;
  description?: string;
  items: Course[];
  variant?: "default" | "featured";
}) {
  if (items.length === 0) return null;

  return (
    <motion.section {...fade} transition={{ duration: 0.35 }} className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <Button variant="ghost" size="sm" className="shrink-0 gap-1 text-muted-foreground">
          View all <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="relative -mx-1">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin px-1">
          {items.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={cn(
                "shrink-0",
                variant === "featured" ? "w-[280px] sm:w-[300px]" : "w-[240px] sm:w-[260px]"
              )}
            >
              <CourseCard course={course} variant="pastel" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export default function LearningPage() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<DepartmentId | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [sort, setSort] = useState<SortOption>("recommended");

  const filtered = useMemo(() => {
    let result = [...courses];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (department !== "all") result = result.filter((c) => c.department === department);
    if (difficulty !== "all") result = result.filter((c) => c.difficulty === difficulty);

    switch (sort) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        result.sort((a, b) => {
          const aDate = a.lastAccessed ? new Date(a.lastAccessed).getTime() : 0;
          const bDate = b.lastAccessed ? new Date(b.lastAccessed).getTime() : 0;
          return bDate - aDate;
        });
        break;
      case "duration":
        result.sort((a, b) => a.durationHours - b.durationHours);
        break;
      default:
        result.sort((a, b) => {
          const score = (c: Course) =>
            (c.isTrending ? 2 : 0) + (c.status === "in_progress" ? 3 : 0) + c.rating / 10;
          return score(b) - score(a);
        });
    }

    return result;
  }, [search, department, difficulty, sort]);

  const continueLearning = courses.filter((c) => c.status === "in_progress");
  const recommended = courses.filter((c) => c.status === "not_started" || c.isTrending).slice(0, 6);
  const trending = courses.filter((c) => c.isTrending);
  const recentlyViewed = courses
    .filter((c) => c.lastAccessed)
    .sort((a, b) => new Date(b.lastAccessed!).getTime() - new Date(a.lastAccessed!).getTime());
  const saved = courses.filter((c) => c.isSaved);
  const completed = courses.filter((c) => c.status === "completed");

  const departments = Object.entries(DEPARTMENT_LABELS) as [DepartmentId, string][];
  const difficulties: { value: Difficulty | "all"; label: string }[] = [
    { value: "all", label: "All levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "expert", label: "Expert" },
  ];

  const hasFilters = search || department !== "all" || difficulty !== "all";

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Learning"
        description="Your personalized learning hub — pick up where you left off or discover something new."
      >
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" /> AI Recommendations
        </Button>
      </PageHeader>

      {/* Search & Filters */}
      <motion.div
        {...fade}
        transition={{ duration: 0.35 }}
        className="rounded-xl border border-border bg-card p-4 shadow-(--shadow-sm)"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses, skills, or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" /> Filters
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
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty | "all")}
              className="h-9 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {difficulties.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="h-9 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="recommended">Recommended</option>
              <option value="rating">Highest rated</option>
              <option value="newest">Recently viewed</option>
              <option value="duration">Shortest first</option>
            </select>
          </div>
        </div>
        {hasFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            <span className="text-xs text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
            {search && (
              <Badge variant="secondary" className="gap-1">
                &quot;{search}&quot;
              </Badge>
            )}
            {department !== "all" && (
              <Badge variant="secondary">{DEPARTMENT_LABELS[department]}</Badge>
            )}
            {difficulty !== "all" && (
              <Badge variant="secondary" className="capitalize">
                {difficulty}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setSearch("");
                setDepartment("all");
                setDifficulty("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </motion.div>

      {/* Filtered results or rows */}
      {hasFilters ? (
        filtered.length > 0 ? (
          <motion.section {...fade} className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-lg font-semibold">Search results</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </motion.section>
        ) : (
          <EmptyState
            title="No courses found"
            description="Try adjusting your search or filters to find what you're looking for."
            actionLabel="Clear filters"
            onAction={() => {
              setSearch("");
              setDepartment("all");
              setDifficulty("all");
            }}
          />
        )
      ) : (
        <div className="space-y-10">
          {continueLearning.length > 0 ? (
            <CourseRow
              title="Continue Learning"
              description="Pick up right where you left off"
              items={continueLearning}
              variant="featured"
            />
          ) : (
            <EmptyState
              icon={<BookOpen className="h-6 w-6" />}
              title="No courses in progress"
              description="Start a course to see it here."
              actionLabel="Browse catalog"
            />
          )}

          <CourseRow
            title="Recommended for you"
            description="AI-matched to your role and skill gaps"
            items={recommended}
          />

          <CourseRow
            title="Trending now"
            description="Popular across your organization"
            items={trending}
          />

          {recentlyViewed.length > 0 && (
            <CourseRow
              title="Recently viewed"
              description="Courses you've opened lately"
              items={recentlyViewed}
            />
          )}

          {saved.length > 0 && (
            <CourseRow
              title="Saved for later"
              description="Your bookmarked courses"
              items={saved}
            />
          )}

          {completed.length > 0 && (
            <CourseRow
              title="Completed"
              description="Courses you've finished"
              items={completed}
            />
          )}
        </div>
      )}

      {/* Quick stats */}
      {!hasFilters && (
        <motion.div
          {...fade}
          transition={{ delay: 0.1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            { label: "In progress", value: continueLearning.length, icon: Clock, color: "text-primary" },
            { label: "Saved", value: saved.length, icon: Bookmark, color: "text-warning" },
            { label: "Completed", value: completed.length, icon: BookOpen, color: "text-success" },
            { label: "Trending", value: trending.length, icon: TrendingUp, color: "text-info" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-(--shadow-sm)"
            >
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-muted", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
