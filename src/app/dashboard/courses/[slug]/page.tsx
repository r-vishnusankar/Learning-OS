"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Lock, Play } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DEPARTMENT_LABELS, LEARNING_CATEGORY_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { useCourseBySlug } from "@/hooks/use-courses";
import { cn, formatHours } from "@/lib/utils";

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const { data: course, isLoading } = useCourseBySlug(params.slug);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <PageHeader title="Course" description="This course could not be found." backHref="/dashboard/courses" backLabel="Courses" />
      </div>
    );
  }

  const firstLesson = course.modules.flatMap((m) => m.lessons).find((l) => !l.locked);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl">
        <div className="relative aspect-[21/9] min-h-[200px]">
          <Image src={course.thumbnail} alt={course.title} fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="absolute left-4 top-4 z-10 gap-1 bg-black/40 text-white hover:bg-black/55 hover:text-white"
          >
            <Link href="/dashboard/courses">
              <ArrowLeft className="h-4 w-4" /> Courses
            </Link>
          </Button>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white">{DEPARTMENT_LABELS[course.department]}</Badge>
              <Badge className="bg-white/20 text-white">{LEVEL_LABELS[course.level]}</Badge>
              <Badge
                variant={course.learningCategory === "goal" ? "goal" : "role"}
                className="shadow-(--shadow-sm) ring-1 ring-black/10"
              >
                {LEARNING_CATEGORY_LABELS[course.learningCategory] ?? "Role based"}
              </Badge>
            </div>
            <h1 className="mt-3 font-display text-3xl font-semibold">{course.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85">{course.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" /> {formatHours(course.durationHours)}
              </span>
              <span>{course.lessonsCount} lessons</span>
              <span>Instructor: {course.instructor.name}</span>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Your progress</p>
              <Progress value={course.progress} className="mt-2 h-2" />
            </div>
            <p className="text-lg font-semibold text-primary">{course.progress}%</p>
            {firstLesson && (
              <Button asChild>
                <Link href={`/dashboard/courses/${course.slug}/lessons/${firstLesson.id}`}>
                  <Play className="h-4 w-4" /> Continue
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <PageHeader title="Curriculum" description="Modules and lessons for this course." />

      <div className="space-y-4">
        {course.modules.map((mod) => (
          <Card key={mod.id}>
            <CardContent className="py-4">
              <h3 className="font-semibold">{mod.title}</h3>
              <div className="mt-3 space-y-2">
                {mod.lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={
                      lesson.locked
                        ? "#"
                        : `/dashboard/courses/${course.slug}/lessons/${lesson.id}`
                    }
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition",
                      lesson.locked ? "cursor-not-allowed opacity-50" : "hover:border-primary/30 hover:bg-muted/40",
                      lesson.completed && "border-success/20 bg-success/5"
                    )}
                  >
                    {lesson.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : lesson.locked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 text-primary" />
                    )}
                    <span className="flex-1">{lesson.title}</span>
                    <span className="text-xs text-muted-foreground">{lesson.durationMinutes}m</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
