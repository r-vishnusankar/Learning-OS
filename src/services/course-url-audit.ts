"use server";

import { runCourseUrlAudit } from "@/db/queries/course-url-audit";
import { requireAdminOrInstructor } from "@/lib/auth-utils";

export async function fetchCourseUrlAuditAction() {
  await requireAdminOrInstructor();
  return runCourseUrlAudit();
}
