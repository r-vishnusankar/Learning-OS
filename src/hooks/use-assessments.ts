"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAssessmentAction,
  createQuestionAction,
  deleteAssessmentAction,
  deleteQuestionAction,
  fetchAdminAssessmentsAction,
  fetchAssessmentBuilderAction,
  fetchAssessmentDetailAction,
  fetchAttemptSessionAction,
  fetchLearnerAssessmentsAction,
  saveAnswersAction,
  startAttemptAction,
  submitAttemptAction,
  updateAssessmentAction,
  updateQuestionAction,
} from "@/services/assessments";

export function useLearnerAssessments() {
  return useQuery({
    queryKey: ["assessments", "learner"],
    queryFn: () => fetchLearnerAssessmentsAction(),
  });
}

export function useAssessmentDetail(id: string) {
  return useQuery({
    queryKey: ["assessments", id],
    queryFn: () => fetchAssessmentDetailAction(id),
    enabled: !!id,
  });
}

export function useAdminAssessments() {
  return useQuery({
    queryKey: ["admin-assessments"],
    queryFn: () => fetchAdminAssessmentsAction(),
  });
}

export function useAssessmentBuilder(id: string) {
  return useQuery({
    queryKey: ["assessment-builder", id],
    queryFn: () => fetchAssessmentBuilderAction(id),
    enabled: !!id,
  });
}

export function useAttemptSession(attemptId: string) {
  return useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () => fetchAttemptSessionAction(attemptId),
    enabled: !!attemptId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useCreateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAssessmentAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-assessments"] }),
  });
}

export function useUpdateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateAssessmentAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-assessments"] });
      qc.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useDeleteAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAssessmentAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-assessments"] }),
  });
}

export function useCreateQuestion(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createQuestionAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessment-builder", assessmentId] }),
  });
}

export function useUpdateQuestion(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateQuestionAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessment-builder", assessmentId] }),
  });
}

export function useDeleteQuestion(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteQuestionAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessment-builder", assessmentId] }),
  });
}

export function useStartAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: startAttemptAction,
    onSuccess: (data) => {
      if (data?.ok) qc.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useSaveAnswers() {
  return useMutation({ mutationFn: saveAnswersAction });
}

export function useSubmitAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitAttemptAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessments"] }),
  });
}
