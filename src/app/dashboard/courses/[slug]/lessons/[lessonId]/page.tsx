"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ListChecks,
  Loader2,
} from "lucide-react";
import { LessonArticle } from "@/components/learning/lesson-article";
import { LessonMedia } from "@/components/learning/lesson-media";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompleteLesson, useLessonPlayer, useUpsertProgress } from "@/hooks/use-courses";
import { cn } from "@/lib/utils";

export default function LessonPlayerPage() {
  const params = useParams<{ slug: string; lessonId: string }>();
  const router = useRouter();
  const { data, isLoading } = useLessonPlayer(params.lessonId);
  const upsertProgress = useUpsertProgress();
  const completeLesson = useCompleteLesson();
  const [videoEnded, setVideoEnded] = React.useState(false);
  const [videoFailed, setVideoFailed] = React.useState(false);

  React.useEffect(() => {
    if (!params.lessonId) return;
    setVideoEnded(false);
    setVideoFailed(false);
    upsertProgress.mutate({ lessonId: params.lessonId, percentage: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- track view once per lesson
  }, [params.lessonId]);

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[50vh] w-full rounded-3xl" />
      </div>
    );
  }

  const { lesson, course, progress, nextLessonId, lessonIndex, lessonTotal } = data;
  const pct = progress?.percentage ?? 0;
  const objectives = lesson.learningObjectives ?? [];
  const prerequisites = lesson.prerequisites ?? [];
  const isArticle = lesson.type === "article";
  const isMedia =
    lesson.type === "video" ||
    lesson.type === "pdf" ||
    lesson.type === "presentation" ||
    lesson.type === "external_link";
  const typeLabel =
    lesson.type === "external_link"
      ? "Resource"
      : lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1);

  const handleMarkComplete = async () => {
    try {
      const result = await completeLesson.mutateAsync(lesson.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      if (result.nextLessonId && result.courseSlug) {
        toast.success("Lesson completed — opening next…");
        router.push(`/dashboard/courses/${result.courseSlug}/lessons/${result.nextLessonId}`);
        return;
      }
      if (result.courseComplete && result.assessmentId) {
        toast.success("Course complete — opening assessment…");
        router.push(`/dashboard/assessments/${result.assessmentId}`);
        return;
      }
      toast.success("Course curriculum complete!");
      router.push(`/dashboard/courses/${course.slug}`);
    } catch {
      toast.error("Could not mark lesson complete");
    }
  };

  const isVideo = lesson.type === "video";
  const watchedEnough =
    Boolean(progress?.completed) ||
    (progress?.percentage ?? 0) >= 100 ||
    videoEnded;
  const completeDisabled =
    completeLesson.isPending ||
    Boolean(progress?.completed) ||
    (isVideo && !watchedEnough);

  const actions = (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Button
        size="sm"
        onClick={() => void handleMarkComplete()}
        disabled={completeDisabled}
      >
        {completeLesson.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        {progress?.completed
          ? "Completed"
          : nextLessonId
            ? "Mark complete & continue"
            : "Mark complete"}
      </Button>
      {progress?.completed && nextLessonId && (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            router.push(`/dashboard/courses/${course.slug}/lessons/${nextLessonId}`)
          }
        >
          Next lesson
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  // Video / media: single viewport, no page scroll
  if (isMedia) {
    return (
      <div className="flex h-[calc(100dvh-7.25rem)] w-full flex-col gap-3 overflow-hidden">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button variant="ghost" size="sm" className="-ml-2 shrink-0 text-muted-foreground" asChild>
              <Link href={`/dashboard/courses/${course.slug}`}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{course.title}</p>
              <h1 className="truncate font-display text-base font-semibold leading-tight md:text-lg">
                {lesson.title}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1 font-normal">
              <BookOpen className="h-3 w-3" />
              {typeLabel}
            </Badge>
            <Badge variant="secondary" className="gap-1 font-normal">
              <Clock className="h-3 w-3" />
              {lesson.durationMinutes}m
            </Badge>
            {lessonTotal > 0 && (
              <Badge variant="outline" className="tabular-nums">
                {lessonIndex}/{lessonTotal}
              </Badge>
            )}
            {progress?.completed && (
              <Badge variant="success" className="gap-1 font-normal">
                <CheckCircle2 className="h-3 w-3" />
                Done
              </Badge>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Progress value={pct} className="h-1.5 flex-1" />
          <span className="w-10 text-right text-xs font-medium tabular-nums text-muted-foreground">
            {pct}%
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border/80 bg-card p-2">
          <LessonMedia
            type={lesson.type}
            content={lesson.content}
            title={lesson.title}
            fill
            onEnded={
              isVideo
                ? () => {
                    setVideoEnded(true);
                    upsertProgress.mutate({
                      lessonId: lesson.id,
                      percentage: 100,
                      completed: false,
                    });
                  }
                : undefined
            }
            onError={isVideo ? () => setVideoFailed(true) : undefined}
          />
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2 pr-20">
          {isVideo && videoFailed && !watchedEnough ? (
            <p className="min-w-0 flex-1 text-xs text-destructive">
              This video could not be played. Contact your administrator — Mark complete stays
              locked until playback reaches the end.
            </p>
          ) : isVideo && !watchedEnough ? (
            <p className="min-w-0 flex-1 text-xs text-muted-foreground">
              Watch the video to the end to enable Mark complete.
            </p>
          ) : objectives.length > 0 ? (
            <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Focus: </span>
              {objectives[0]}
              {objectives.length > 1 ? ` · +${objectives.length - 1} more` : ""}
            </p>
          ) : (
            <span className="text-xs text-muted-foreground">
              {nextLessonId ? "Complete to continue" : "Last lesson in this course"}
            </span>
          )}
          {actions}
        </div>
      </div>
    );
  }

  // Articles: full-width readable layout (may scroll)
  return (
    <div className="relative w-full">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
          <Link href={`/dashboard/courses/${course.slug}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to course
          </Link>
        </Button>
        {lessonTotal > 0 && (
          <p className="text-xs font-medium tabular-nums text-muted-foreground">
            {lessonIndex} / {lessonTotal}
          </p>
        )}
      </div>

      <header className="mb-6 space-y-3">
        <div>
          <p className="text-sm font-medium text-primary/90">{course.title}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
            {lesson.title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 font-normal">
            <BookOpen className="h-3 w-3" />
            {typeLabel}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 font-normal">
            <Clock className="h-3 w-3" />
            {lesson.durationMinutes} min
          </Badge>
          {progress?.completed && (
            <Badge variant="success" className="gap-1.5 font-normal">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Progress value={pct} className="h-1.5 flex-1" />
          <span className="text-xs font-medium tabular-nums text-muted-foreground">{pct}%</span>
        </div>
      </header>

      {objectives.length > 0 && (
        <Card className="mb-5 border-primary/15 bg-secondary/30">
          <CardContent className="py-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <ListChecks className="h-4 w-4 text-primary" />
              Learning objectives
            </div>
            <ul className="space-y-1.5">
              {objectives.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {prerequisites.length > 0 && (
        <Card className="mb-5">
          <CardContent className="py-4">
            <p className="mb-2 text-sm font-semibold">Prerequisites</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {prerequisites.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <section
        className={cn(
          "overflow-hidden rounded-3xl border border-border/80 bg-card",
          isArticle ? "px-5 py-6 md:px-8 md:py-8" : "p-3"
        )}
      >
        <LessonArticle content={lesson.content ?? "*No content yet.*"} />
      </section>

      <div className="sticky bottom-3 z-20 mt-6 pr-20">
        <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/95 p-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{lesson.title}</p>
            <p className="text-xs text-muted-foreground">
              {nextLessonId ? "Complete to continue" : "Last lesson in this course"}
            </p>
          </div>
          {actions}
        </div>
      </div>
    </div>
  );
}
