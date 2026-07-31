"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCurrentUserAction,
  fetchDashboardHomeAction,
  fetchMyPreferencesAction,
  fetchMySkillsAction,
  toggleSavedCourseAction,
  updateMyPreferencesAction,
  updateMyProfileAction,
} from "@/services/me";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => fetchCurrentUserAction(),
  });
}

export function useDashboardHome() {
  return useQuery({
    queryKey: ["dashboard-home"],
    queryFn: () => fetchDashboardHomeAction(),
  });
}

export function useMyPreferences() {
  return useQuery({
    queryKey: ["me-preferences"],
    queryFn: () => fetchMyPreferencesAction(),
  });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMyProfileAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["dashboard-home"] });
    },
  });
}

export function useUpdateMyPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMyPreferencesAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me-preferences"] });
      qc.invalidateQueries({ queryKey: ["dashboard-home"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useToggleSavedCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleSavedCourseAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me-preferences"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["dashboard-home"] });
    },
  });
}

export function useMySkills() {
  return useQuery({
    queryKey: ["my-skills"],
    queryFn: () => fetchMySkillsAction(),
  });
}
