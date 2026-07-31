"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CodingAnswerEditor } from "@/components/assessments/coding-answer-editor";
import { useAttemptSession, useSaveAnswers, useSubmitAttempt } from "@/hooks/use-assessments";
import type { CodingLanguage } from "@/types/coding";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function AssessmentAttemptPage() {
  const params = useParams<{ id: string; attemptId: string }>();
  const router = useRouter();
  const { data, isLoading, isError } = useAttemptSession(params.attemptId);
  const saveAnswers = useSaveAnswers();
  const submitAttempt = useSubmitAttempt();
  const [answers, setAnswers] = React.useState<Record<string, string | string[]>>({});
  const [index, setIndex] = React.useState(0);
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null);
  const [saveFailed, setSaveFailed] = React.useState(false);
  const submittedRef = React.useRef(false);
  const hydratedRef = React.useRef(false);

  React.useEffect(() => {
    if (!data) return;
    if (hydratedRef.current) return;
    setAnswers(data.attempt.answers ?? {});
    hydratedRef.current = true;
  }, [data]);

  React.useEffect(() => {
    if (!data) return;
    const elapsed = Math.floor((Date.now() - new Date(data.attempt.startedAt).getTime()) / 1000);
    const total = data.assessment.durationMinutes * 60;
    setSecondsLeft(Math.max(0, total - elapsed));
  }, [data]);

  React.useEffect(() => {
    if (secondsLeft == null) return;
    if (secondsLeft <= 0 && data && !submittedRef.current) {
      submittedRef.current = true;
      submitAttempt.mutate(
        { attemptId: params.attemptId, answers },
        {
          onSuccess: (result) => {
            toast.message("Time is up — assessment submitted");
            router.push(`/dashboard/assessments/${params.id}?result=${result.percentage}`);
          },
        }
      );
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s == null ? s : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, data, answers, params.attemptId, params.id, router, submitAttempt]);

  if (isError) {
    return (
      <Card className="border-warning/30">
        <CardContent className="space-y-3 py-8 text-center">
          <p className="font-semibold text-warning">Attempt could not be loaded</p>
          <p className="text-sm text-muted-foreground">
            Your saved answers are still on the server. Reopen this attempt from the assessment
            page when your connection is stable.
          </p>
          <Button onClick={() => router.push("/dashboard/assessments")}>
            Back to assessments
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) return <Skeleton className="h-96 w-full" />;

  if (data.attempt.status !== "in_progress") {
    return (
      <Card>
        <CardContent className="space-y-3 py-8 text-center">
          <p className="font-semibold">Attempt already submitted</p>
          <p className="text-sm text-muted-foreground">
            Score: {data.attempt.percentage ?? "—"}%
          </p>
          <Button onClick={() => router.push(`/dashboard/assessments/${params.id}`)}>
            Back to assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { questions, assessment } = data;
  const question = questions[index];
  const progress = Math.round(((index + 1) / questions.length) * 100);

  const setAnswer = (value: string | string[]) => {
    if (!question) return;
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    saveAnswers.mutate(
      { attemptId: params.attemptId, answers: { [question.id]: value } },
      {
        onSuccess: () => setSaveFailed(false),
        onError: () => {
          setSaveFailed(true);
          toast.error("Answer could not be saved — check your connection.");
        },
      }
    );
  };

  const onSubmit = async () => {
    try {
      const result = await submitAttempt.mutateAsync({ attemptId: params.attemptId, answers });
      toast.success(
        result.needsManual
          ? `Submitted for review (${result.percentage}% auto-scored)`
          : result.passed
            ? `Passed with ${result.percentage}%`
            : `Scored ${result.percentage}% — not yet passing`
      );
      router.push(`/dashboard/assessments/${params.id}`);
    } catch {
      toast.error("Submit failed");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{assessment.title}</p>
          <h1 className="font-display text-xl font-semibold">
            Question {index + 1} of {questions.length}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saveFailed && (
            <Badge variant="destructive">Answers may not be saved</Badge>
          )}
          <Badge variant={secondsLeft != null && secondsLeft < 60 ? "destructive" : "secondary"}>
            {secondsLeft != null ? formatTime(secondsLeft) : "--:--"}
          </Badge>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      {!question ? (
        <Card className="border-warning/30">
          <CardHeader>
            <CardTitle className="text-base leading-relaxed">Question unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              This question is no longer available (it may have been removed or changed while your
              attempt was in progress). Use Previous or Next to continue with the rest of the
              assessment, then submit when ready.
            </p>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardHeader>
          <CardTitle className="text-base leading-relaxed">{question.prompt}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {question.type} · {question.points} points
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {(question.type === "mcq" || question.type === "true_false") &&
            (question.options.length
              ? question.options
              : question.type === "true_false"
                ? ["True", "False"]
                : []
            ).map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm hover:bg-muted/40"
              >
                <input
                  type="radio"
                  name={question.id}
                  checked={answers[question.id] === option}
                  onChange={() => setAnswer(option)}
                />
                {option}
              </label>
            ))}

          {question.type === "multi_select" &&
            question.options.map((option) => {
              const current = Array.isArray(answers[question.id])
                ? (answers[question.id] as string[])
                : [];
              const checked = current.includes(option);
              return (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? current.filter((c) => c !== option)
                        : [...current, option];
                      setAnswer(next);
                    }}
                  />
                  {option}
                </label>
              );
            })}

          {question.type === "coding" && (
            <CodingAnswerEditor
              value={(answers[question.id] as string) ?? ""}
              onChange={(code) => setAnswer(code)}
              language={(question.meta?.coding?.language as CodingLanguage) ?? "javascript"}
              starterCode={question.meta?.coding?.starterCode ?? ""}
              checks={question.meta?.coding?.checks ?? []}
            />
          )}

          {(question.type === "fill_blank" ||
            question.type === "case_study" ||
            question.type === "essay") && (
            <textarea
              className="min-h-32 w-full rounded-2xl border border-input bg-card px-4 py-3 font-mono text-sm"
              value={(answers[question.id] as string) ?? ""}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={
                question.type === "fill_blank"
                  ? "Type the missing word/phrase..."
                  : "Type your answer..."
              }
            />
          )}
        </CardContent>
      </Card>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          Previous
        </Button>
        <div className="flex gap-2">
          {index < questions.length - 1 ? (
            <Button onClick={() => setIndex((i) => i + 1)}>Next</Button>
          ) : (
            <Button onClick={onSubmit} disabled={submitAttempt.isPending}>
              Submit assessment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
