"use server";

import {
  getEmployeeProgressDetail,
  listEmployeesForProgressTracking,
} from "@/db/queries/employee-progress";
import { requireAdminOrInstructor } from "@/lib/auth-utils";
import type { DepartmentId } from "@/types";

export async function searchEmployeesProgressAction(filters?: {
  search?: string;
  department?: DepartmentId;
  status?: "active" | "inactive";
}) {
  await requireAdminOrInstructor();
  return listEmployeesForProgressTracking({
    search: filters?.search?.trim() || undefined,
    department: filters?.department,
    status: filters?.status,
  });
}

export async function fetchEmployeeProgressAction(userId: string) {
  await requireAdminOrInstructor();
  if (!userId) return null;
  return getEmployeeProgressDetail(userId);
}
