import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Bookmark, BookOpen, Clock, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { Course } from "@/types";
import { cn, formatHours } from "@/lib/utils";
import { DEPARTMENT_LABELS, LEARNING_CATEGORY_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { learningCategoryToBadgeVariant, levelToBadgeVariant } from "@/lib/status-styles";
import { useToggleSavedCourse } from "@/hooks/use-me";

interface CourseCardProps {
  course: Course;
  variant?: "default" | "compact" | "featured" | "pastel";
  className?: string;
}

export function CourseCard({ course, variant = "default", className }: CourseCardProps) {
  const toggleSaved = useToggleSavedCourse();
  const href = `/dashboard/courses/${course.slug ?? course.id}`;
  const levelVariant = levelToBadgeVariant(course.level);
  const category = course.learningCategory ?? "role";
  const categoryVariant = learningCategoryToBadgeVariant(category);
  const categoryLabel = LEARNING_CATEGORY_LABELS[category] ?? category;
  const enrolled = course.progress > 0 || course.status === "in_progress" || course.status === "completed";

  const onToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved.mutate(course.id, {
      onSuccess: (prefs) => {
        const saved = prefs.savedCourseIds?.includes(course.id);
        toast.success(saved ? "Saved for later" : "Removed from saved");
      },
      onError: () => toast.error("Could not update bookmark"),
    });
  };

  if (variant === "compact") {
    return (
      <Link
        href={href}
        className={cn(
          "group flex gap-3 rounded-[length:var(--radius)] border border-border bg-card p-3 transition-colors duration-150 hover:bg-secondary/40",
          className
        )}
      >
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-[length:var(--radius)] bg-muted">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover transition duration-200 group-hover:scale-105"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1">
            <Badge variant={categoryVariant} className="text-xs">
              {categoryLabel}
            </Badge>
          </div>
          <p className="truncate text-sm font-semibold text-foreground">{course.title}</p>
          <p className="mt-1 text-caption">
            {formatHours(course.durationHours)} · {course.lessonsCount} lessons
          </p>
          {course.progress > 0 && (
            <div className="mt-2">
              <Progress value={course.progress} className="h-1.5" />
            </div>
          )}
        </div>
      </Link>
    );
  }

  const ctaLabel =
    course.status === "completed"
      ? "Review"
      : course.status === "in_progress" || course.progress > 0
        ? "Continue"
        : "Start course";

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[length:var(--radius)] border border-border bg-card transition-colors duration-150 hover:border-border-control",
        className
      )}
    >
      <Link href={href} className="relative block h-[190px] shrink-0 overflow-hidden bg-muted">
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          className="object-cover transition duration-200 ease-out group-hover:scale-105"
          unoptimized
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
          <Badge variant={levelVariant} className="bg-card/90 backdrop-blur-sm">
            {LEVEL_LABELS[course.level] ?? course.level}
          </Badge>
          <Badge variant={categoryVariant} className="bg-card/90 backdrop-blur-sm">
            {categoryLabel}
          </Badge>
        </div>
        <button
          type="button"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-[length:var(--radius)] border border-border/80 bg-card/90 text-foreground backdrop-blur-sm transition-colors duration-150 hover:bg-card"
          onClick={onToggleSave}
          aria-label={course.isSaved ? "Unsave course" : "Save course"}
        >
          <Bookmark
            className={cn(
              "h-4 w-4 stroke-[1.75] text-foreground",
              course.isSaved && "fill-primary text-primary"
            )}
          />
        </button>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={categoryVariant}>{categoryLabel}</Badge>
          </div>
          <Link href={href}>
            <h3 className="text-card-title line-clamp-2 transition-colors duration-150 group-hover:text-foreground/70">
              {course.title}
            </h3>
          </Link>
          <p className="line-clamp-2 text-sm leading-relaxed text-description">{course.description}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <div
            className="h-7 w-7 shrink-0 rounded-full bg-secondary bg-cover bg-center"
            style={{ backgroundImage: `url(${course.instructor.avatar})` }}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{course.instructor.name}</p>
            <p className="truncate text-caption">{DEPARTMENT_LABELS[course.department]}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 stroke-[1.75]" />
            {formatHours(course.durationHours)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 stroke-[1.75]" />
            {course.lessonsCount} lessons
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-star-fill stroke-star-stroke stroke-[1.75]" />
            {course.rating.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 stroke-[1.75]" />
            {course.enrolledCount.toLocaleString()}
          </span>
        </div>

        {enrolled && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-caption">
              <span>Progress</span>
              <span className="font-data font-medium text-foreground">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-1.5" />
          </div>
        )}

        <div className="mt-auto pt-1">
          <Button asChild size="sm" className="w-full" variant={enrolled ? "default" : "secondary"}>
            <Link href={href}>{ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
