"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignCourseAction,
  bulkRevokeCourseAssignmentsAction,
  bulkUpdateAssignmentDueDatesAction,
  fetchAdminAssignmentConsoleAction,
  fetchAdminCourseAssignmentsAction,
  fetchAssignmentComplianceAction,
  fetchMyAssignmentStatsAction,
  fetchMyCourseAssignmentsAction,
  remindCourseAssignmentsAction,
  revokeCourseAssignmentAction,
} from "@/services/course-assignments";
import type { DepartmentId } from "@/types";

export function useMyCourseAssignments() {
  return useQuery({
    queryKey: ["course-assignments", "mine"],
    queryFn: () => fetchMyCourseAssignmentsAction(),
  });
}

export function useMyAssignmentStats() {
  return useQuery({
    queryKey: ["course-assignments", "stats"],
    queryFn: () => fetchMyAssignmentStatsAction(),
  });
}

export function useAdminCourseAssignments(filters?: {
  departmentId?: DepartmentId;
  courseId?: string;
}) {
  return useQuery({
    queryKey: ["course-assignments", "admin", filters],
    queryFn: () => fetchAdminCourseAssignmentsAction(filters),
  });
}

export function useAdminAssignmentConsole(filters?: {
  departmentId?: DepartmentId;
  courseId?: string;
}) {
  return useQuery({
    queryKey: ["course-assignments", "console", filters],
    queryFn: () => fetchAdminAssignmentConsoleAction(filters),
  });
}

export function useAssignmentCompliance() {
  return useQuery({
    queryKey: ["course-assignments", "compliance"],
    queryFn: () => fetchAssignmentComplianceAction(),
  });
}

export function useAssignCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assignCourseAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-assignments"] });
    },
  });
}

export function useRevokeCourseAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeCourseAssignmentAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-assignments"] });
    },
  });
}

export function useBulkRevokeCourseAssignments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkRevokeCourseAssignmentsAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-assignments"] });
    },
  });
}

export function useBulkUpdateAssignmentDueDates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkUpdateAssignmentDueDatesAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-assignments"] });
    },
  });
}

export function useRemindCourseAssignments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: remindCourseAssignmentsAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-assignments"] });
    },
  });
}
