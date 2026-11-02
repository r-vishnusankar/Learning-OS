"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type SelectHTMLAttributes } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  AlertTriangle,
  BookOpen,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  TrendingUp,
} from "lucide-react";
import { CourseCard } from "@/components/cards/course-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEPARTMENT_LABELS, LEARNING_CATEGORY_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { usePublishedCourses } from "@/hooks/use-courses";
import { useMyCourseAssignments } from "@/hooks/use-course-assignments";
import { useCurrentUser } from "@/hooks/use-me";
import { useMyEligibility } from "@/hooks/use-promotions";
import type { Course, DepartmentId, Difficulty, LearningCategory } from "@/types";
import { cn } from "@/lib/utils";
import { isActiveCourseStatus } from "@/lib/course-progress";
import { format } from "date-fns";

type SortOption = "recommended" | "rating" | "newest" | "duration";

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function FilterSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative shrink-0 text-secondary-foreground">
      <select
        {...props}
        className={cn(
          "h-10 cursor-pointer appearance-none rounded-full py-0 pl-4 pr-9 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring",
          className,
        )}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 stroke-[1.75] text-current opacity-70"
      />
    </div>
  );
}

function CourseRow({
  title,
  description,
  items,
  variant = "default",
  viewAllHref,
}: {
  title: string;
  description?: string;
  items: Course[];
  variant?: "default" | "featured";
  viewAllHref?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(max > 4 && el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [items.length, updateScrollState]);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.min(320, Math.round(el.clientWidth * 0.75));
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <motion.section {...fade} transition={{ duration: 0.25 }} className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-section">{title}</h2>
          {description && <p className="text-description text-sm">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={!canPrev}
            onClick={() => scrollBy(-1)}
            aria-label="Scroll previous courses"
          >
            <ChevronLeft className="h-4 w-4 stroke-[1.75]" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={!canNext}
            onClick={() => scrollBy(1)}
            aria-label="Scroll next courses"
          >
            <ChevronRight className="h-4 w-4 stroke-[1.75]" />
          </Button>
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "ml-1 gap-1")}
            >
              View all <ChevronRight className="h-4 w-4 stroke-[1.75]" />
            </Link>
          ) : null}
        </div>
      </div>
      <div className="relative -mx-1">
        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto px-1 pb-2 scrollbar-none"
        >
          {items.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className={cn(
                "shrink-0",
                variant === "featured" ? "w-[300px] sm:w-[320px]" : "w-[280px] sm:w-[300px]"
              )}
            >
              <CourseCard course={course} />
            </motion.div>
          ))}
        </div>
        {canPrev && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-linear-to-r from-background to-transparent"
          />
        )}
        {canNext && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-background to-transparent"
          />
        )}
      </div>
    </motion.section>
  );
}

export default function LearningPage() {
  const router = useRouter();
  const { data: courses = [], isLoading: coursesLoading, isError: coursesError } = usePublishedCourses();
  const { data: myAssignments = [] } = useMyCourseAssignments();
  const { data: eligibility } = useMyEligibility();
  const { data: user } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<DepartmentId | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [learningCategory, setLearningCategory] = useState<LearningCategory | "all">("all");
  const [sort, setSort] = useState<SortOption>("recommended");

  const courseCareer = useMemo(() => {
    const map = new Map<string, { state: string; assessmentId: string | null }>();
    for (const c of eligibility?.courses ?? []) {
      map.set(c.courseId, { state: c.state, assessmentId: c.assessmentId });
    }
    return map;
  }, [eligibility]);

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
    if (learningCategory !== "all") {
      result = result.filter((c) => c.learningCategory === learningCategory);
    }

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
          const score = (c: Course) => {
            let s =
              (c.isTrending ? 2 : 0) +
              (isActiveCourseStatus(c.status) ? 3 : 0) +
              c.rating / 10;
            if (c.learningCategory === "role" && user?.department === c.department) s += 2;
            if (c.learningCategory === "goal" && c.status === "not_started") s += 1.5;
            return s;
          };
          return score(b) - score(a);
        });
    }

    return result;
  }, [courses, search, department, difficulty, learningCategory, sort, user?.department]);

  const continueLearning = courses.filter((c) => isActiveCourseStatus(c.status));
  const recommended = [...courses]
    .filter((c) => c.status === "not_started" || c.isTrending)
    .sort((a, b) => {
      const score = (c: Course) => {
        let s = (c.isTrending ? 2 : 0) + c.rating / 10;
        if (c.learningCategory === "role" && user?.department === c.department) s += 3;
        if (c.learningCategory === "goal") s += 2;
        return s;
      };
      return score(b) - score(a);
    })
    .slice(0, 6);
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

  const hasFilters =
    Boolean(search) ||
    department !== "all" ||
    difficulty !== "all" ||
    learningCategory !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Learning"
        description="Your personalized learning hub — pick up where you left off or discover something new."
      />

      {eligibility && (
        <motion.div
          {...fade}
          className="rounded-2xl border bg-card p-4 shadow-(--shadow-card)"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">
                {LEVEL_LABELS[eligibility.currentLevel]} track ·{" "}
                {eligibility.certifiedCount}/{eligibility.requiredCount} certified
              </p>
              <p className="text-sm text-muted-foreground capitalize">
                Status: {eligibility.status.replaceAll("_", " ")}
                {eligibility.status === "eligible" && eligibility.nextLevel
                  ? ` — awaiting approval for ${LEVEL_LABELS[eligibility.nextLevel]}`
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {eligibility.status === "eligible" && (
                <Badge variant="success">Eligible for promotion</Badge>
              )}
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/help">Employee guide</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        {...fade}
        transition={{ duration: 0.25 }}
        className="flex min-h-14 flex-col gap-3 rounded-2xl bg-card p-2 shadow-(--shadow-card) sm:flex-row sm:items-center sm:gap-2"
      >
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 stroke-[1.75] text-primary" />
          <Input
            placeholder="Search courses, skills, or topics…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 border-0 bg-transparent pl-11 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 px-1 pb-1 sm:pb-0">
          <FilterSelect
            value={department}
            onChange={(e) => setDepartment(e.target.value as DepartmentId | "all")}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <option value="all">All departments</option>
            {departments.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty | "all")}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            {difficulties.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={learningCategory}
            onChange={(e) => setLearningCategory(e.target.value as LearningCategory | "all")}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <option value="all">All categories</option>
            <option value="role">{LEARNING_CATEGORY_LABELS.role}</option>
            <option value="goal">{LEARNING_CATEGORY_LABELS.goal}</option>
          </FilterSelect>
          <FilterSelect
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="bg-muted text-foreground hover:bg-muted/80"
          >
            <option value="recommended">Recommended</option>
            <option value="rating">Highest rated</option>
            <option value="newest">Recently viewed</option>
            <option value="duration">Shortest first</option>
          </FilterSelect>
        </div>
      </motion.div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-small">
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
          {learningCategory !== "all" && (
            <Badge variant="secondary">{LEARNING_CATEGORY_LABELS[learningCategory]}</Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setDepartment("all");
              setDifficulty("all");
              setLearningCategory("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {hasFilters ? (
        filtered.length > 0 ? (
          <motion.section {...fade} className="space-y-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 stroke-[1.75] text-muted-foreground" />
              <h2 className="text-section">Search results</h2>
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
        <div className="space-y-8">
          {myAssignments.length > 0 && (
            <motion.section {...fade} transition={{ duration: 0.25 }} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-section">Assigned to you</h2>
                <p className="text-description text-sm">
                  Required and recommended courses from your managers — separate from the open catalog below.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {myAssignments.slice(0, 6).map((item) => {
                  const career = courseCareer.get(item.courseId);
                  const assessmentPending = career?.state === "assessment_pending";
                  const certified = career?.state === "certified";
                  return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="space-y-3 p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.mandatory ? (
                          <Badge variant="warning">Mandatory</Badge>
                        ) : (
                          <Badge variant="draft">Optional</Badge>
                        )}
                        <StatusBadge status={item.status} />
                        {assessmentPending && <Badge variant="info">Assessment pending</Badge>}
                        {certified && <Badge variant="success">Certified</Badge>}
                      </div>
                      <div>
                        <Link
                          href={`/dashboard/courses/${item.courseSlug}`}
                          className="text-card-title hover:text-primary"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-sm text-description">{item.description}</p>
                      </div>
                      <Progress value={item.progress} className="h-1.5" />
                      <div className="flex flex-wrap items-center justify-between gap-2 text-caption">
                        <span>{item.progress}% complete</span>
                        {item.dueDate ? (
                          <span>
                            Due {format(new Date(item.dueDate), "MMM d")}
                            {item.daysRemaining != null && item.daysRemaining >= 0
                              ? ` · ${item.daysRemaining}d left`
                              : item.daysRemaining != null
                                ? " · overdue"
                                : ""}
                          </span>
                        ) : (
                          <span>No due date</span>
                        )}
                      </div>
                      {assessmentPending && career?.assessmentId ? (
                        <Button asChild size="sm" className="w-full">
                          <Link href={`/dashboard/assessments/${career.assessmentId}`}>
                            Take assessment
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm" className="w-full">
                          <Link href={`/dashboard/courses/${item.courseSlug}`}>
                            {item.progress > 0 ? "Continue" : "Start"}
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            </motion.section>
          )}

          {coursesLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : coursesError ? (
            <EmptyState
              icon={<AlertTriangle className="h-6 w-6 stroke-[1.75]" />}
              title="Couldn't load courses"
              description="Courses could not be loaded — this list may be incomplete."
              className="ring-1 ring-warning/25"
            />
          ) : continueLearning.length > 0 ? (
            <CourseRow
              title="Continue Learning"
              description="Pick up right where you left off"
              items={continueLearning}
              variant="featured"
              viewAllHref="/dashboard/courses"
            />
          ) : (
            <EmptyState
              icon={<BookOpen className="h-6 w-6 stroke-[1.75]" />}
              title="No courses in progress"
              description="Start a course to see it here."
              actionLabel="Browse catalog"
              onAction={() => router.push("/dashboard/courses")}
            />
          )}

          <div id="recommended">
            <CourseRow
              title="Recommended for you"
              description="AI-matched to your role and skill gaps"
              items={recommended}
              viewAllHref="/dashboard/courses"
            />
          </div>

          <CourseRow
            title="Trending now"
            description="Popular across your organization"
            items={trending}
            viewAllHref="/dashboard/courses"
          />

          {recentlyViewed.length > 0 && (
            <CourseRow
              title="Recently viewed"
              description="Courses you've opened lately"
              items={recentlyViewed}
              viewAllHref="/dashboard/courses"
            />
          )}

          {saved.length > 0 && (
            <CourseRow
              title="Saved for later"
              description="Your bookmarked courses"
              items={saved}
              viewAllHref="/dashboard/courses"
            />
          )}

          {completed.length > 0 && (
            <CourseRow
              title="Completed"
              description="Courses you've finished"
              items={completed}
              viewAllHref="/dashboard/courses"
            />
          )}
        </div>
      )}

      {!hasFilters && (
        <motion.div
          {...fade}
          transition={{ delay: 0.1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            { label: "In progress", value: continueLearning.length, icon: Clock, color: "text-primary" },
            { label: "Saved", value: saved.length, icon: Bookmark, color: "text-primary" },
            { label: "Completed", value: completed.length, icon: BookOpen, color: "text-success" },
            { label: "Trending", value: trending.length, icon: TrendingUp, color: "text-info" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-[28px] bg-card p-5 shadow-(--shadow-card)"
            >
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary",
                  stat.color
                )}
              >
                <stat.icon className="h-5 w-5 stroke-[1.75]" />
              </div>
              <div>
                <p className="font-display text-2xl font-semibold tracking-tight">{stat.value}</p>
                <p className="text-small">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
