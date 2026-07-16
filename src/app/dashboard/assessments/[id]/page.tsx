"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  FileText,
  ListChecks,
  Sparkles,
  Timer,
  Trophy,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { CircularProgress } from "@/components/charts/circular-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { assessments } from "@/data/mock";
import { DEPARTMENT_LABELS } from "@/constants/navigation";
import { cn } from "@/lib/utils";

type QuestionType = "mcq" | "checkbox" | "coding" | "case_study";

interface DemoQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  points: number;
}

const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: "q1",
    type: "mcq",
    prompt: "Which consistency model does a strongly consistent distributed database typically guarantee?",
    options: ["Eventual consistency", "Linearizability", "Causal consistency", "Session consistency"],
    points: 5,
  },
  {
    id: "q2",
    type: "checkbox",
    prompt: "Select all valid strategies for reducing read latency in a high-traffic system:",
    options: ["CDN edge caching", "Database read replicas", "Single monolithic database", "Application-level caching"],
    points: 5,
  },
  {
    id: "q3",
    type: "coding",
    prompt: "Implement a rate limiter using the token bucket algorithm. Your solution should accept maxTokens and refillRate parameters and expose an `allowRequest()` method.",
    points: 15,
  },
  {
    id: "q4",
    type: "case_study",
    prompt: "Design a URL shortener service for 500M monthly active users. Describe your API design, database schema, caching strategy, and how you would handle hot keys. Include trade-offs for your architectural decisions.",
    points: 25,
  },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function QuestionTypeIcon({ type }: { type: QuestionType }) {
  const icons = { mcq: ListChecks, checkbox: CheckCircle2, coding: Code2, case_study: FileText };
  const Icon = icons[type];
  return <Icon className="h-4 w-4" />;
}

function AssessmentResults({ score, passingScore, title }: { score: number; passingScore: number; title: string }) {
  const passed = score >= passingScore;

  const breakdown = [
    { category: "Architecture & Design", score: 88, total: 100 },
    { category: "Scalability Patterns", score: 92, total: 100 },
    { category: "Data & Caching", score: 85, total: 100 },
    { category: "Trade-off Analysis", score: 90, total: 100 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="overflow-hidden">
        <div className={cn("h-1.5 w-full", passed ? "bg-success" : "bg-destructive")} />
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              {passed ? <Trophy className="h-8 w-8 text-primary" /> : <XCircle className="h-8 w-8 text-destructive" />}
            </div>
            <div className="flex-1">
              <Badge variant={passed ? "success" : "destructive"} className="mb-2">
                {passed ? "Passed" : "Did not pass"}
              </Badge>
              <h2 className="font-display text-2xl font-semibold">{title}</h2>
              <p className="mt-1 text-muted-foreground">
                {passed
                  ? "Congratulations! You've demonstrated proficiency in this assessment area."
                  : `You scored below the passing threshold of ${passingScore}%. Review the AI feedback below.`}
              </p>
            </div>
            <CircularProgress value={score} size={140} label="Final score" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Performance Analysis
            </CardTitle>
            <CardDescription>Personalized feedback based on your responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Your strongest area was <strong className="text-foreground">Scalability Patterns</strong>, where you
              demonstrated solid understanding of horizontal scaling and load distribution strategies.
            </p>
            <p>
              Consider reviewing <strong className="text-foreground">caching invalidation patterns</strong> and{" "}
              <strong className="text-foreground">consistency trade-offs</strong> in distributed systems. Your case
              study response showed good architectural thinking but could benefit from more explicit failure mode analysis.
            </p>
            <div className="rounded-lg border border-primary/20 bg-accent/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">Recommended next steps</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-foreground">
                <li>Review Module 2: Data & Caching in System Design Mastery</li>
                <li>Practice 2 more case study prompts before retake</li>
                <li>Schedule a 15-min AI Mentor session for weak areas</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Breakdown</CardTitle>
            <CardDescription>Score by competency area</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {breakdown.map((item) => (
              <div key={item.category}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span>{item.category}</span>
                  <span className="font-semibold">{item.score}%</span>
                </div>
                <Progress value={item.score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/dashboard/assessments">
            <ArrowLeft className="h-4 w-4" /> Back to assessments
          </Link>
        </Button>
        {!passed && <Button>Retake assessment</Button>}
        {passed && (
          <Button asChild>
            <Link href="/dashboard/certificates">View certificates</Link>
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function AssessmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const assessment = assessments.find((a) => a.id === id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [reviewMode, setReviewMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const isCompleted = assessment?.status === "completed" || assessment?.status === "failed";
  const questions = DEMO_QUESTIONS;
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  useEffect(() => {
    if (assessment && !isCompleted) {
      setTimeLeft(assessment.durationMinutes * 60);
    }
  }, [assessment, isCompleted]);

  useEffect(() => {
    if (isCompleted || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [isCompleted, timeLeft]);

  const setMcqAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const toggleCheckboxAnswer = useCallback((questionId: string, option: string) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) ?? [];
      const next = current.includes(option) ? current.filter((o) => o !== option) : [...current, option];
      return { ...prev, [questionId]: next };
    });
  }, []);

  const isQuestionAnswered = useMemo(() => {
    return (qId: string) => {
      const ans = answers[qId];
      if (Array.isArray(ans)) return ans.length > 0;
      return typeof ans === "string" && ans.trim().length > 0;
    };
  }, [answers]);

  if (!assessment) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assessment not found" description="This assessment may have been removed or archived." />
        <Button asChild variant="outline">
          <Link href="/dashboard/assessments">
            <ArrowLeft className="h-4 w-4" /> Back to assessments
          </Link>
        </Button>
      </div>
    );
  }

  if (isCompleted && assessment.score != null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assessment Results" description={assessment.description} />
        <AssessmentResults score={assessment.score} passingScore={assessment.passingScore} title={assessment.title} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 gap-1 text-muted-foreground">
            <Link href="/dashboard/assessments">
              <ArrowLeft className="h-4 w-4" /> Assessments
            </Link>
          </Button>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{assessment.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{assessment.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">{DEPARTMENT_LABELS[assessment.department]}</Badge>
            <Badge variant="secondary">Attempt {assessment.attempts + 1} of {assessment.maxAttempts}</Badge>
            <Badge variant="outline">Passing: {assessment.passingScore}%</Badge>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3",
            timeLeft < 300 ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"
          )}
        >
          <Timer className={cn("h-5 w-5", timeLeft < 300 ? "text-destructive" : "text-primary")} />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Time remaining</p>
            <p className={cn("font-mono text-xl font-semibold tabular-nums", timeLeft < 300 && "text-destructive")}>
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="font-medium">{progressPct}% complete</span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 capitalize">
                <QuestionTypeIcon type={currentQuestion.type} />
                {currentQuestion.type.replace("_", " ")}
              </Badge>
              <Badge variant="secondary">{currentQuestion.points} pts</Badge>
            </div>
            <CardTitle className="mt-3 text-lg leading-relaxed">{currentQuestion.prompt}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {currentQuestion.type === "mcq" && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option) => (
                  <label
                    key={option}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition hover:border-primary/40",
                      answers[currentQuestion.id] === option
                        ? "border-primary bg-accent/60"
                        : "border-border bg-card"
                    )}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      checked={answers[currentQuestion.id] === option}
                      onChange={() => setMcqAnswer(currentQuestion.id, option)}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === "checkbox" && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option) => {
                  const selected = ((answers[currentQuestion.id] as string[]) ?? []).includes(option);
                  return (
                    <label
                      key={option}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition hover:border-primary/40",
                        selected ? "border-primary bg-accent/60" : "border-border bg-card"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleCheckboxAnswer(currentQuestion.id, option)}
                        className="h-4 w-4 rounded accent-[var(--primary)]"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === "coding" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-[#0f1419] p-4 font-mono text-xs text-emerald-400">
                  <span className="text-muted-foreground">// Token Bucket Rate Limiter</span>
                  <br />
                  class RateLimiter {"{"}
                  <br />
                  &nbsp;&nbsp;constructor(maxTokens, refillRate) {"{ }"}
                  <br />
                  &nbsp;&nbsp;allowRequest() {"{ /* your code */ }"}
                  <br />
                  {"}"}
                </div>
                <textarea
                  value={(answers[currentQuestion.id] as string) ?? ""}
                  onChange={(e) => setMcqAnswer(currentQuestion.id, e.target.value)}
                  placeholder="Write your solution here..."
                  rows={12}
                  className="w-full resize-y rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  spellCheck={false}
                />
              </div>
            )}

            {currentQuestion.type === "case_study" && (
              <textarea
                value={(answers[currentQuestion.id] as string) ?? ""}
                onChange={(e) => setMcqAnswer(currentQuestion.id, e.target.value)}
                placeholder="Structure your response with sections: Requirements, Architecture, Data Model, Caching, Trade-offs..."
                rows={14}
                className="w-full resize-y rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            )}

            {reviewMode && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-muted-foreground">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                Review mode — navigate between questions to verify your answers before submitting.
              </div>
            )}

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setReviewMode((r) => !r)}>
                  <BookOpen className="h-4 w-4" />
                  {reviewMode ? "Exit review" : "Review answers"}
                </Button>
                {currentIndex < questions.length - 1 ? (
                  <Button onClick={() => setCurrentIndex((i) => i + 1)}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button disabled={answeredCount < questions.length}>
                    Submit assessment
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Question Navigator</CardTitle>
              <CardDescription className="text-xs">Jump to any question</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition",
                      i === currentIndex && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                      isQuestionAnswered(q.id)
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-muted text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Answered</span>
                <span className="font-semibold">
                  {answeredCount}/{questions.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="flex items-center gap-1 font-semibold">
                  <Clock className="h-3.5 w-3.5" /> {assessment.durationMinutes} min
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total points</span>
                <span className="font-semibold">{questions.reduce((s, q) => s + q.points, 0)}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
