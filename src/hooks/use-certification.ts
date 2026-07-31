"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completePathAction,
  createAssignmentAction,
  createPathAction,
  deleteAssignmentAction,
  deletePathAction,
  deletePathStepAction,
  enrollPathAction,
  fetchAdminAssignmentDetailAction,
  fetchAdminAssignmentsAction,
  fetchAdminCertificatesAction,
  fetchAdminPathBuilderAction,
  fetchAdminPathsAction,
  fetchAssignmentDetailAction,
  fetchCertificateDetailAction,
  fetchCoursesForAdminSelectAction,
  fetchLearnerAssignmentsAction,
  fetchLearnerCertificatesAction,
  fetchLearnerPathsAction,
  fetchPathDetailAction,
  reissueCertificateAction,
  reviewSubmissionAction,
  revokeCertificateAction,
  submitAssignmentAction,
  updateAssignmentAction,
  updatePathAction,
  upsertPathStepAction,
  verifyCredentialAction,
} from "@/services/certification";

export function useLearnerPaths() {
  return useQuery({
    queryKey: ["paths", "learner"],
    queryFn: () => fetchLearnerPathsAction(),
  });
}

export function usePathDetail(pathId: string) {
  return useQuery({
    queryKey: ["paths", pathId],
    queryFn: () => fetchPathDetailAction(pathId),
    enabled: !!pathId,
  });
}

export function useEnrollPath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enrollPathAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paths"] });
    },
  });
}

export function useCompletePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: completePathAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paths"] });
      qc.invalidateQueries({ queryKey: ["certificates"] });
    },
  });
}

export function useAdminPaths() {
  return useQuery({
    queryKey: ["admin-paths"],
    queryFn: () => fetchAdminPathsAction(),
  });
}

export function useAdminPathBuilder(pathId: string) {
  return useQuery({
    queryKey: ["admin-path-builder", pathId],
    queryFn: () => fetchAdminPathBuilderAction(pathId),
    enabled: !!pathId,
  });
}

export function useCreatePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPathAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-paths"] }),
  });
}

export function useUpdatePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePathAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-paths"] });
      qc.invalidateQueries({ queryKey: ["paths"] });
    },
  });
}

export function useDeletePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePathAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-paths"] }),
  });
}

export function useUpsertPathStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertPathStepAction,
    onSuccess: (_d, vars) => {
      const pathId = (vars as { pathId: string }).pathId;
      qc.invalidateQueries({ queryKey: ["admin-path-builder", pathId] });
    },
  });
}

export function useDeletePathStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePathStepAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-path-builder"] }),
  });
}

export function useLearnerAssignments() {
  return useQuery({
    queryKey: ["assignments", "learner"],
    queryFn: () => fetchLearnerAssignmentsAction(),
  });
}

export function useAssignmentDetail(id: string) {
  return useQuery({
    queryKey: ["assignments", id],
    queryFn: () => fetchAssignmentDetailAction(id),
    enabled: !!id,
  });
}

export function useSubmitAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitAssignmentAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useAdminAssignments() {
  return useQuery({
    queryKey: ["admin-assignments"],
    queryFn: () => fetchAdminAssignmentsAction(),
  });
}

export function useAdminAssignmentDetail(id: string) {
  return useQuery({
    queryKey: ["admin-assignment", id],
    queryFn: () => fetchAdminAssignmentDetailAction(id),
    enabled: !!id,
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAssignmentAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-assignments"] }),
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateAssignmentAction,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-assignments"] });
      qc.invalidateQueries({ queryKey: ["admin-assignment"] });
      qc.invalidateQueries({ queryKey: ["assignments"] });
      if (vars && typeof vars === "object" && "id" in vars) {
        qc.invalidateQueries({ queryKey: ["admin-assignment", (vars as { id: string }).id] });
        qc.invalidateQueries({ queryKey: ["assignments", (vars as { id: string }).id] });
      }
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAssignmentAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-assignments"] }),
  });
}

export function useReviewSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewSubmissionAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-assignment"] });
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useLearnerCertificates() {
  return useQuery({
    queryKey: ["certificates", "learner"],
    queryFn: () => fetchLearnerCertificatesAction(),
  });
}

export function useCertificateDetail(id: string) {
  return useQuery({
    queryKey: ["certificates", id],
    queryFn: () => fetchCertificateDetailAction(id),
    enabled: !!id,
  });
}

export function useAdminCertificates() {
  return useQuery({
    queryKey: ["admin-certificates"],
    queryFn: () => fetchAdminCertificatesAction(),
  });
}

export function useRevokeCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeCertificateAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-certificates"] });
      qc.invalidateQueries({ queryKey: ["certificates"] });
    },
  });
}

export function useReissueCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reissueCertificateAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-certificates"] });
      qc.invalidateQueries({ queryKey: ["certificates"] });
    },
  });
}

export function useVerifyCredential(credentialId: string) {
  return useQuery({
    queryKey: ["verify", credentialId],
    queryFn: () => verifyCredentialAction(credentialId),
    enabled: !!credentialId,
  });
}

export function useAdminCourseOptions() {
  return useQuery({
    queryKey: ["admin-course-options"],
    queryFn: () => fetchCoursesForAdminSelectAction(),
  });
}
