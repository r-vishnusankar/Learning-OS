"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CodingAnswerEditor } from "@/components/assessments/coding-answer-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssignmentDetail, useSubmitAssignment } from "@/hooks/use-certification";
import { DEFAULT_CODING_CHECKS } from "@/lib/coding-checks";
import type { CodingLanguage } from "@/types/coding";

export default function AssignmentDetailPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;
  const { data, isLoading } = useAssignmentDetail(assignmentId);
  const submit = useSubmitAssignment();
  const [content, setContent] = React.useState("");
  const [url, setUrl] = React.useState("");

  React.useEffect(() => {
    if (data?.submission) {
      setContent(data.submission.content ?? "");
      setUrl(data.submission.url ?? "");
    } else if (data?.assignment.submissionType === "coding") {
      const starter = data.assignment.meta?.coding?.starterCode ?? "";
      if (starter) setContent(starter);
    }
  }, [data?.submission, data?.assignment]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data) {
    return (
      <div className="space-y-4">
        <p>Assignment not found</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/assignments">Back</Link>
        </Button>
      </div>
    );
  }

  const { assignment, submission } = data;
  const locked = submission?.status === "graded" || submission?.status === "approved";
  const isCoding = assignment.submissionType === "coding";
  const coding = assignment.meta?.coding;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
        <Link href="/dashboard/assignments">
          <ArrowLeft className="h-4 w-4" /> Assignments
        </Link>
      </Button>

      <PageHeader title={assignment.title} description={assignment.description}>
        <div className="flex flex-wrap items-center gap-2">
          {isCoding && <Badge variant="secondary">Coding</Badge>}
          {submission && <StatusBadge status={submission.status} />}
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{isCoding ? "Your code" : "Your submission"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isCoding ? (
            <CodingAnswerEditor
              value={content}
              onChange={setContent}
              language={(coding?.language as CodingLanguage) ?? "javascript"}
              starterCode={coding?.starterCode ?? ""}
              checks={coding?.checks?.length ? coding.checks : DEFAULT_CODING_CHECKS}
              readOnly={locked}
            />
          ) : (
            <>
              <textarea
                className="min-h-32 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base md:text-sm"
                placeholder="Write your response…"
                value={content}
                disabled={locked}
                onChange={(e) => setContent(e.target.value)}
              />
              <Input
                placeholder="GitHub or document URL (optional)"
                value={url}
                disabled={locked}
                onChange={(e) => setUrl(e.target.value)}
              />
            </>
          )}

          {submission?.feedback && (
            <pre className="whitespace-pre-wrap rounded-xl bg-muted/50 p-3 font-sans text-sm">
              {submission.feedback}
              {submission.score != null
                ? `\n\nAuto/score: ${submission.score}/${assignment.maxScore}`
                : ""}
            </pre>
          )}
          {!locked && (
            <Button
              onClick={async () => {
                try {
                  if (isCoding && !content.trim()) {
                    toast.error("Write your code before submitting");
                    return;
                  }
                  const result = await submit.mutateAsync({
                    assignmentId,
                    content,
                    url: isCoding ? "" : url,
                  });
                  toast.success(
                    isCoding && result.score != null
                      ? `Submitted — checks scored ${result.score}/${assignment.maxScore}`
                      : "Submitted for review"
                  );
                } catch {
                  toast.error("Submit failed");
                }
              }}
              disabled={submit.isPending}
            >
              Submit assignment
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
