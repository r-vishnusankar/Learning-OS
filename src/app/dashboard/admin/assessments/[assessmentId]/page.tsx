"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAssessmentBuilder,
  useCreateQuestion,
  useDeleteQuestion,
  useUpdateAssessment,
  useUpdateQuestion,
} from "@/hooks/use-assessments";
import type { QuestionType } from "@/db/schema/assessments";
import { CodingAnswerEditor } from "@/components/assessments/coding-answer-editor";
import { DEFAULT_CODING_CHECKS } from "@/lib/coding-checks";
import type { CodingCheck, CodingLanguage, QuestionMeta } from "@/types/coding";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "mcq", label: "MCQ" },
  { value: "multi_select", label: "Multi-select" },
  { value: "true_false", label: "True / False" },
  { value: "fill_blank", label: "Fill in the blank" },
  { value: "coding", label: "Coding" },
  { value: "case_study", label: "Case study" },
  { value: "essay", label: "Essay" },
];

const TYPE_LABEL: Record<QuestionType, string> = Object.fromEntries(
  QUESTION_TYPES.map((t) => [t.value, t.label])
) as Record<QuestionType, string>;

function needsOptions(type: QuestionType) {
  return type === "mcq" || type === "multi_select" || type === "true_false";
}

function needsCorrectAnswers(type: QuestionType) {
  return (
    type === "mcq" ||
    type === "multi_select" ||
    type === "true_false" ||
    type === "fill_blank"
  );
}

const emptyForm = {
  prompt: "",
  type: "mcq" as QuestionType,
  options: "Option A, Option B, Option C, Option D",
  correctAnswers: "Option A",
  points: 5,
  codingLanguage: "javascript" as CodingLanguage,
  starterCode: "// Write your solution\nfunction solve() {\n  \n}\n",
  checksText:
    "Has a real implementation|min_lines|3\nNo leftover TODO|not_contains|TODO\nDefines solve function|contains|function solve",
};

/** lines: label|kind|value */
function parseChecks(text: string): CodingCheck[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [label, kind, ...rest] = line.split("|").map((s) => s.trim());
      const value = rest.join("|");
      const allowed = ["contains", "not_contains", "regex", "min_lines", "min_chars"] as const;
      const k = allowed.includes(kind as (typeof allowed)[number])
        ? (kind as CodingCheck["kind"])
        : "contains";
      return {
        id: `check-${i + 1}`,
        label: label || `Check ${i + 1}`,
        kind: k,
        value: value || "",
      };
    })
    .filter((c) => c.value.length > 0 || c.kind === "min_lines" || c.kind === "min_chars");
}

function checksToText(checks: CodingCheck[]) {
  if (!checks.length) {
    return emptyForm.checksText;
  }
  return checks.map((c) => `${c.label}|${c.kind}|${c.value}`).join("\n");
}

type PreviewQuestion = {
  prompt: string;
  type: QuestionType;
  options: string[];
  points: number;
  meta?: QuestionMeta;
};

function QuestionPreview({ question }: { question: PreviewQuestion }) {
  const [demo, setDemo] = React.useState<string | string[]>("");

  React.useEffect(() => {
    setDemo(question.type === "multi_select" ? [] : "");
  }, [question]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {TYPE_LABEL[question.type]} · {question.points} points · learner preview
      </p>
      <p className="font-medium leading-relaxed">{question.prompt || "(empty prompt)"}</p>

      {(question.type === "mcq" || question.type === "true_false") &&
        (question.options.length ? question.options : ["True", "False"]).map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm hover:bg-muted/40"
          >
            <input
              type="radio"
              name="preview"
              checked={demo === option}
              onChange={() => setDemo(option)}
            />
            {option}
          </label>
        ))}

      {question.type === "multi_select" &&
        question.options.map((option) => {
          const current = Array.isArray(demo) ? demo : [];
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
                  setDemo(
                    checked ? current.filter((c) => c !== option) : [...current, option]
                  );
                }}
              />
              {option}
            </label>
          );
        })}

      {(question.type === "fill_blank" ||
        question.type === "case_study" ||
        question.type === "essay") && (
        <textarea
          className="min-h-32 w-full rounded-2xl border border-input bg-card px-4 py-3 font-mono text-sm"
          value={typeof demo === "string" ? demo : ""}
          onChange={(e) => setDemo(e.target.value)}
          placeholder="Type your answer..."
        />
      )}

      {question.type === "coding" && (
        <CodingAnswerEditor
          value={typeof demo === "string" ? demo : ""}
          onChange={setDemo}
          language={question.meta?.coding?.language ?? "javascript"}
          starterCode={question.meta?.coding?.starterCode ?? ""}
          checks={question.meta?.coding?.checks ?? DEFAULT_CODING_CHECKS}
        />
      )}
    </div>
  );
}

export default function AssessmentBuilderPage() {
  const params = useParams<{ assessmentId: string }>();
  const id = params.assessmentId;
  const { data, isLoading, refetch } = useAssessmentBuilder(id);
  const createQuestion = useCreateQuestion(id);
  const updateQuestion = useUpdateQuestion(id);
  const deleteQuestion = useDeleteQuestion(id);
  const updateAssessment = useUpdateAssessment();

  const [form, setForm] = React.useState(emptyForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<PreviewQuestion | null>(null);

  const setType = (type: QuestionType) => {
    setForm((f) => ({
      ...f,
      type,
      options:
        type === "true_false"
          ? "True, False"
          : needsOptions(type)
            ? f.options || "Option A, Option B, Option C, Option D"
            : "",
      correctAnswers: needsCorrectAnswers(type)
        ? type === "true_false"
          ? "True"
          : f.correctAnswers
        : "",
      starterCode:
        type === "coding"
          ? f.starterCode || emptyForm.starterCode
          : f.starterCode,
      checksText:
        type === "coding" ? f.checksText || emptyForm.checksText : f.checksText,
    }));
  };

  const parseList = (value: string) =>
    value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const buildMeta = (): QuestionMeta => {
    if (form.type !== "coding") return {};
    const checks = parseChecks(form.checksText);
    return {
      coding: {
        language: form.codingLanguage,
        starterCode: form.starterCode,
        checks: checks.length ? checks : DEFAULT_CODING_CHECKS,
      },
    };
  };

  const saveQuestion = async () => {
    if (!form.prompt.trim()) {
      toast.error("Enter a question prompt");
      return;
    }

    const type = form.type;
    const options = needsOptions(type) ? parseList(form.options) : [];
    const correctAnswers = needsCorrectAnswers(type) ? parseList(form.correctAnswers) : [];
    const meta = buildMeta();

    if (needsOptions(type) && options.length < 2) {
      toast.error("Add at least two options for this question type");
      return;
    }

    try {
      if (editingId) {
        await updateQuestion.mutateAsync({
          id: editingId,
          prompt: form.prompt,
          type,
          options,
          correctAnswers,
          points: form.points,
          meta,
        });
        toast.success(`Updated as ${TYPE_LABEL[type]}`);
      } else {
        await createQuestion.mutateAsync({
          assessmentId: id,
          prompt: form.prompt,
          type,
          options,
          correctAnswers,
          points: form.points,
          meta,
        });
        toast.success(`Added as ${TYPE_LABEL[type]}`);
      }
      setForm(emptyForm);
      setEditingId(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save question");
    }
  };

  if (isLoading || !data) {
    return <Skeleton className="h-64 w-full" />;
  }

  const { assessment, questions } = data;

  return (
    <div className="space-y-6">
      <PageHeader title={assessment.title} description="Build the question bank for this assessment.">
        <div className="flex gap-2">
          <Badge>{assessment.publishStatus}</Badge>
          <Button
            size="sm"
            onClick={() => {
              updateAssessment.mutate({ id, publishStatus: "published" });
              toast.success("Published");
              refetch();
            }}
          >
            Publish
          </Button>
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input
            type="number"
            defaultValue={assessment.durationMinutes}
            onBlur={(e) =>
              updateAssessment.mutate({ id, durationMinutes: Number(e.target.value) || 60 })
            }
          />
          <Input
            type="number"
            defaultValue={assessment.passingScore}
            onBlur={(e) =>
              updateAssessment.mutate({ id, passingScore: Number(e.target.value) || 70 })
            }
          />
          <Input
            type="number"
            defaultValue={assessment.maxAttempts}
            onBlur={(e) =>
              updateAssessment.mutate({ id, maxAttempts: Number(e.target.value) || 3 })
            }
          />
          <p className="text-xs text-muted-foreground md:col-span-3">
            Duration (minutes) · Passing score (%) · Max attempts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            {editingId ? "Edit question" : "Add question"}
          </CardTitle>
          {editingId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              <X className="h-4 w-4" /> Cancel edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="min-h-20 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm"
            placeholder="Question prompt"
            value={form.prompt}
            onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="h-11 rounded-2xl border border-input bg-card px-3 text-sm"
              value={form.type}
              onChange={(e) => setType(e.target.value as QuestionType)}
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <Input
              type="number"
              value={form.points}
              onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) || 5 }))}
            />
            {needsOptions(form.type) && (
              <Input
                placeholder="Options (comma separated)"
                value={form.options}
                onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
              />
            )}
            {needsCorrectAnswers(form.type) && (
              <Input
                placeholder={
                  form.type === "fill_blank"
                    ? "Accepted answer(s), comma separated"
                    : "Correct answer(s), comma separated"
                }
                value={form.correctAnswers}
                onChange={(e) => setForm((f) => ({ ...f, correctAnswers: e.target.value }))}
              />
            )}
          </div>
          {form.type === "coding" && (
            <div className="space-y-3 rounded-2xl border border-dashed border-border p-4">
              <p className="text-sm font-medium">Coding setup</p>
              <select
                className="h-11 w-full rounded-2xl border border-input bg-card px-3 text-sm md:max-w-xs"
                value={form.codingLanguage}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    codingLanguage: e.target.value as CodingLanguage,
                  }))
                }
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="sql">SQL</option>
                <option value="java">Java</option>
                <option value="other">Other</option>
              </select>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-input bg-card px-4 py-3 font-mono text-sm"
                placeholder="Starter code shown to learners"
                value={form.starterCode}
                onChange={(e) => setForm((f) => ({ ...f, starterCode: e.target.value }))}
              />
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  Automated checks (one per line): <code>label|kind|value</code>
                  <br />
                  kinds: contains, not_contains, regex, min_lines, min_chars
                </p>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-input bg-card px-4 py-3 font-mono text-xs"
                  value={form.checksText}
                  onChange={(e) => setForm((f) => ({ ...f, checksText: e.target.value }))}
                />
              </div>
            </div>
          )}
          {!needsOptions(form.type) && form.type !== "coding" && (
            <p className="text-xs text-muted-foreground">
              {TYPE_LABEL[form.type]} questions use a free-text answer box for learners
              {form.type === "case_study" || form.type === "essay"
                ? " and need manual grading."
                : "."}
            </p>
          )}
          {form.type === "coding" && (
            <p className="text-xs text-muted-foreground">
              Learners get a code editor + <span className="font-medium">Run checks</span> feedback.
              Passing checks awards partial auto-score; failed checks still flag for review.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={saveQuestion}
              disabled={createQuestion.isPending || updateQuestion.isPending}
            >
              <Plus className="h-4 w-4" />
              {editingId ? "Save changes" : "Add to bank"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setPreview({
                  prompt: form.prompt,
                  type: form.type,
                  options: needsOptions(form.type)
                    ? parseList(form.options)
                    : [],
                  points: form.points,
                  meta: buildMeta(),
                })
              }
            >
              <Eye className="h-4 w-4" /> Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {questions.map((q, index) => (
          <Card key={q.id}>
            <CardContent className="flex items-start justify-between gap-3 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-muted-foreground">Q{index + 1}</p>
                  <Badge variant="secondary">{TYPE_LABEL[q.type as QuestionType] ?? q.type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {q.points} pts · {q.difficulty}
                  </span>
                </div>
                <p className="mt-1 font-medium">{q.prompt}</p>
                {q.options.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">{q.options.join(" · ")}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Preview"
                  onClick={() =>
                    setPreview({
                      prompt: q.prompt,
                      type: q.type as QuestionType,
                      options: q.options,
                      points: q.points,
                      meta: (q.meta as QuestionMeta) ?? {},
                    })
                  }
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Edit"
                  onClick={() => {
                    const meta = (q.meta as QuestionMeta) ?? {};
                    setEditingId(q.id);
                    setForm({
                      prompt: q.prompt,
                      type: q.type as QuestionType,
                      options: q.options.join(", "),
                      correctAnswers: q.correctAnswers.join(", "),
                      points: q.points,
                      codingLanguage: meta.coding?.language ?? "javascript",
                      starterCode: meta.coding?.starterCode ?? emptyForm.starterCode,
                      checksText: checksToText(meta.coding?.checks ?? []),
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Delete"
                  onClick={async () => {
                    await deleteQuestion.mutateAsync(q.id);
                    if (editingId === q.id) {
                      setEditingId(null);
                      setForm(emptyForm);
                    }
                    refetch();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Question preview</DialogTitle>
            <DialogDescription>
              How this question appears to learners during an attempt.
            </DialogDescription>
          </DialogHeader>
          {preview && <QuestionPreview question={preview} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
