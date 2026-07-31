"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCourseUrlAuditAction } from "@/services/course-url-audit";

export function useCourseUrlAudit() {
  return useQuery({
    queryKey: ["course-url-audit"],
    queryFn: () => fetchCourseUrlAuditAction(),
  });
}
