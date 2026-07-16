"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Send,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assignments } from "@/data/mock";
import type { AssignmentStatus } from "@/types";
import { cn } from "@/lib/utils";

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const statusConfig: Record<
  AssignmentStatus,
  { label: string; variant: "secondary" | "success" | "warning" | "destructive" | "info"; icon: typeof Clock }
> = {
  pending: { label: "Pending", variant: "warning", icon: Clock },
  submitted: { label: "Submitted", variant: "info", icon: Send },
  graded: { label: "Graded", variant: "success", icon: CheckCircle2 },
  overdue: { label: "Overdue", variant: "destructive", icon: AlertCircle },
};

function isOverdue(dueDate: string, status: AssignmentStatus) {
  return status === "pending" && new Date(dueDate) < new Date();
}

export default function AssignmentsPage() {
  const sorted = [...assignments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const counts = {
    pending: assignments.filter((a) => a.status === "pending").length,
    submitted: assignments.filter((a) => a.status === "submitted").length,
    graded: assignments.filter((a) => a.status === "graded").length,
    overdue: assignments.filter((a) => a.status === "overdue").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Track your coursework submissions, due dates, and grades."
      />

      {/* Summary cards */}
      <motion.div
        {...fade}
        transition={{ duration: 0.35 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {(
          [
            { key: "pending", label: "Pending", color: "text-warning" },
            { key: "submitted", label: "Submitted", color: "text-info" },
            { key: "graded", label: "Graded", color: "text-success" },
            { key: "overdue", label: "Overdue", color: "text-destructive" },
          ] as const
        ).map((stat) => (
          <div
            key={stat.key}
            className="rounded-xl border border-border bg-card p-4 shadow-(--shadow-sm)"
          >
            <p className={cn("text-2xl font-semibold", stat.color)}>{counts[stat.key]}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {sorted.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All assignments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Assignment</th>
                    <th className="px-5 py-3 font-medium">Course</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Due date</th>
                    <th className="px-5 py-3 font-medium">Score</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((assignment, i) => {
                    const config = statusConfig[assignment.status];
                    const StatusIcon = config.icon;
                    const overdue = isOverdue(assignment.dueDate, assignment.status);

                    return (
                      <motion.tr
                        key={assignment.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-border/60 transition hover:bg-muted/30"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{assignment.title}</p>
                              {assignment.submittedAt && (
                                <p className="text-[11px] text-muted-foreground">
                                  Submitted {format(new Date(assignment.submittedAt), "MMM d, yyyy")}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/dashboard/courses/${assignment.courseId}`}
                            className="text-muted-foreground transition hover:text-primary"
                          >
                            {assignment.courseTitle}
                          </Link>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={config.variant} className="gap-1 capitalize">
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                          {overdue && assignment.status === "pending" && (
                            <Badge variant="destructive" className="ml-1.5">Overdue</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn(assignment.status === "overdue" && "text-destructive font-medium")}>
                            {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {assignment.score != null ? (
                            <span className="font-semibold text-success">
                              {assignment.score}/{assignment.maxScore}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {assignment.status === "pending" || assignment.status === "overdue" ? (
                            <Button size="sm">Submit</Button>
                          ) : assignment.status === "graded" ? (
                            <Button variant="ghost" size="sm" className="gap-1">
                              View <ExternalLink className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No assignments"
          description="You don't have any assignments at the moment."
        />
      )}
    </div>
  );
}
