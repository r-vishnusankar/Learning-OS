"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchEmployeeProgressAction,
  searchEmployeesProgressAction,
} from "@/services/employee-progress";
import type { DepartmentId } from "@/types";

export function useEmployeesProgressSearch(filters?: {
  search?: string;
  department?: DepartmentId;
  status?: "active" | "inactive";
}) {
  return useQuery({
    queryKey: ["admin-employee-progress", filters],
    queryFn: () => searchEmployeesProgressAction(filters),
  });
}

export function useEmployeeProgress(userId: string) {
  return useQuery({
    queryKey: ["admin-employee-progress", userId],
    queryFn: () => fetchEmployeeProgressAction(userId),
    enabled: Boolean(userId),
  });
}
