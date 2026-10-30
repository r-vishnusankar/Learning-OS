"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkImportUsersAction,
  createTeamAction,
  deleteUserAction,
  fetchAdminUsersAction,
  fetchAnalyticsAction,
  fetchAuditLogsAction,
  fetchDepartmentsAction,
  fetchDepartmentHubAction,
  fetchLeaderboardAction,
  fetchNotificationsAction,
  fetchTeamsAction,
  fetchUnreadNotificationCountAction,
  inviteUserAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  updateUserAction,
} from "@/services/operations";
import type { DepartmentId, UserRole } from "@/types";

export function useAdminUsers(filters?: {
  search?: string;
  role?: UserRole;
  status?: "active" | "inactive";
  department?: DepartmentId;
}) {
  return useQuery({
    queryKey: ["admin-users", filters],
    queryFn: () => fetchAdminUsersAction(filters),
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inviteUserAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateUserAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUserAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

export function useBulkImportUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkImportUsersAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => fetchAuditLogsAction(),
  });
}

export function useDepartmentsLive() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => fetchDepartmentsAction(),
  });
}

export function useDepartmentHub(departmentId: string | undefined) {
  return useQuery({
    queryKey: ["department-hub", departmentId],
    queryFn: () => fetchDepartmentHubAction(departmentId!),
    enabled: Boolean(departmentId),
  });
}

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: () => fetchTeamsAction(),
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTeamAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotificationsAction(),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => fetchUnreadNotificationCountAction(),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationReadAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsReadAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetchAnalyticsAction(),
  });
}

export function useLeaderboardLive() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetchLeaderboardAction(),
  });
}
