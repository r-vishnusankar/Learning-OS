import type { UserRole } from "@/types";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Super Admin",
  department_head: "Department Admin",
  instructor: "Instructor",
  manager: "Manager",
  employee: "Employee",
};

export function canAccessAdmin(role: UserRole | undefined | null) {
  return role === "admin" || role === "instructor" || role === "department_head";
}

export function canManageUsers(role: UserRole | undefined | null) {
  return role === "admin" || role === "department_head";
}
