import Link from "next/link";
import Image from "next/image";
import { Bookmark, Clock, MessageSquare, Paperclip, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { Course } from "@/types";
import { cn, formatHours } from "@/lib/utils";
import { LEVEL_LABELS } from "@/constants/navigation";

const pastelThemes = [
  {
    bg: "bg-[#EDE4FF] dark:bg-[#2f2548]",
    ring: "#8759F2",
    ringDark: "#a78bfa",
  },
  {
    bg: "bg-[#FFF3C4] dark:bg-[#3d3520]",
    ring: "#C9A227",
    ringDark: "#ffe180",
  },
  {
    bg: "bg-[#FFD6E8] dark:bg-[#3d2030]",
    ring: "#FF3E80",
    ringDark: "#fb7185",
  },
  {
    bg: "bg-[#DCE9FF] dark:bg-[#1e2a40]",
    ring: "#3B82F6",
    ringDark: "#60a5fa",
  },
];

function themeFor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return pastelThemes[n % pastelThemes.length];
}

interface CourseCardProps {
  course: Course;
  variant?: "default" | "compact" | "featured" | "pastel";
  className?: string;
}

export function CourseCard({ course, variant = "default", className }: CourseCardProps) {
  const theme = themeFor(course.id);

  if (variant === "compact") {
    return (
      <Link
        href={`/dashboard/courses/${course.id}`}
        className={cn(
          "flex gap-3 rounded-2xl bg-card p-3 shadow-(--shadow-sm) transition hover:shadow-(--shadow)",
          className
        )}
      >
        <div className={cn("relative h-16 w-24 shrink-0 overflow-hidden rounded-xl", theme.bg)}>
          <Image src={course.thumbnail} alt={course.title} fill className="object-cover opacity-90" unoptimized />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{course.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
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

  if (variant === "pastel") {
    return (
      <Link
        href={`/dashboard/courses/${course.id}`}
        className={cn(
          "group flex flex-col overflow-hidden rounded-3xl border-2 border-transparent p-5 shadow-[0_4px_16px_rgba(52,52,52,0.06)] transition-all duration-300 ease-out dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)]",
          "hover:-translate-y-2 hover:scale-[1.03] hover:border-primary/40 hover:shadow-[0_16px_40px_rgba(135,89,242,0.22)]",
          "focus-visible:outline-none focus-visible:-translate-y-2 focus-visible:scale-[1.03] focus-visible:border-primary focus-visible:shadow-[0_16px_40px_rgba(135,89,242,0.22)]",
          theme.bg,
          className
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge className="rounded-full border-0 bg-white text-[#343434] shadow-sm dark:bg-white/20 dark:text-white">
              {course.category}
            </Badge>
            <Badge className="rounded-full border-0 bg-white/90 text-[#343434] dark:bg-white/15 dark:text-white">
              {LEVEL_LABELS[course.level]}
            </Badge>
          </div>
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm dark:bg-white/15">
            <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" className="stroke-black/10 dark:stroke-white/20" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke={theme.ring}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${Math.max(course.progress, 4)} 100`}
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-[#343434] dark:text-white">
              {course.progress}%
            </span>
          </div>
        </div>

        <h3 className="mt-4 font-display text-base font-semibold leading-snug text-[#343434] dark:text-white">
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-[#5b6573] dark:text-zinc-300">
          {course.description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-5 text-xs text-[#5b6573] dark:text-zinc-300">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-7 w-7 rounded-full border-2 border-white bg-white shadow-sm dark:border-white/30"
                style={{
                  backgroundImage: `url(https://api.dicebear.com/9.x/avataaars/svg?seed=${course.id}${i})`,
                  backgroundSize: "cover",
                }}
              />
            ))}
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white text-[9px] font-semibold text-[#343434] shadow-sm dark:border-white/30 dark:bg-white/20 dark:text-white">
              +{Math.max(1, Math.floor(course.enrolledCount / 100))}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3 w-3" /> {course.lessonsCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> 12
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/dashboard/courses/${course.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl bg-card shadow-(--shadow-sm) transition duration-300 hover:-translate-y-1 hover:shadow-(--shadow-md)",
        className
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {course.isTrending && (
            <Badge className="rounded-full border-0 bg-destructive text-white">Trending</Badge>
          )}
          <Badge className="rounded-full border-0 bg-white/90 text-[#343434]">
            {LEVEL_LABELS[course.level]}
          </Badge>
        </div>
        <button
          type="button"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#343434] backdrop-blur transition hover:bg-white"
          onClick={(e) => e.preventDefault()}
        >
          <Bookmark className={cn("h-4 w-4", course.isSaved && "fill-primary text-primary")} />
        </button>
        {course.progress > 0 && course.progress < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div className="h-full bg-primary" style={{ width: `${course.progress}%` }} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 font-display text-sm font-semibold leading-snug">{course.title}</p>
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{course.description}</p>
        <div className="mt-auto flex items-center gap-3 pt-4 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3 w-3 fill-[#FFE180] text-[#c9a227]" /> {course.rating}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatHours(course.durationHours)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" /> {course.enrolledCount.toLocaleString()}
          </span>
        </div>
        {course.progress > 0 && (
          <div className="mt-3 flex items-center justify-between gap-2">
            <Progress value={course.progress} className="h-1.5 flex-1" />
            <span className="text-xs font-semibold text-primary">{course.progress}%</span>
          </div>
        )}
        {course.status === "not_started" && (
          <Button size="sm" className="mt-3 w-full" variant="outline">
            Start Course
          </Button>
        )}
        {course.status === "in_progress" && (
          <Button size="sm" className="mt-3 w-full">
            Continue
          </Button>
        )}
      </div>
    </Link>
  );
}
