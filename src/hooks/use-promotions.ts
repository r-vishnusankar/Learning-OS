"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approvePromotionAction,
  fetchMyEligibilityAction,
  fetchPromotionConsoleAction,
  rejectPromotionAction,
  remindPromotionCandidateAction,
} from "@/services/promotions";

export function useMyEligibility() {
  return useQuery({
    queryKey: ["my-eligibility"],
    queryFn: () => fetchMyEligibilityAction(),
  });
}

export function usePromotionConsole(filters?: {
  departmentId?: string;
  status?: "in_progress" | "eligible" | "blocked" | "max_level" | "all";
  search?: string;
}) {
  return useQuery({
    queryKey: ["promotion-console", filters],
    queryFn: () => fetchPromotionConsoleAction(filters),
  });
}

export function useApprovePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approvePromotionAction,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["promotion-console"] });
      void qc.invalidateQueries({ queryKey: ["my-eligibility"] });
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
      void qc.invalidateQueries({ queryKey: ["my-course-assignments"] });
    },
  });
}

export function useRejectPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rejectPromotionAction,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["promotion-console"] });
    },
  });
}

export function useRemindPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: remindPromotionCandidateAction,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["promotion-console"] });
    },
  });
}
