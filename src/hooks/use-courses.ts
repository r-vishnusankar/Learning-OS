"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveCourseAction,
  createCourseAction,
  deleteCourseAction,
  fetchAdminCoursesAction,
  fetchAssignableCoursesAction,
  fetchCourseBuilderAction,
  fetchCourseBySlugAction,
  fetchMyActiveCoursesAction,
  fetchPublishedCoursesAction,
  fetchRecommendedCoursesAction,
  publishCourseAction,
  updateCourseAction,
} from "@/services/courses";
import { completeLessonAction, fetchLessonPlayerAction, upsertProgressAction } from "@/services/progress";

export function usePublishedCourses() {
  return useQuery({
    queryKey: ["courses", "published"],
    queryFn: () => fetchPublishedCoursesAction(),
    staleTime: 60_000,
  });
}

/** Dashboard home: 12 lean catalog cards, no curriculum payload. */
export function useRecommendedCourses(limit = 12) {
  return useQuery({
    queryKey: ["courses", "recommended", limit],
    queryFn: () => fetchRecommendedCoursesAction(limit),
    staleTime: 120_000,
  });
}

/** Dashboard home: only courses with learner progress (fast). */
export function useMyActiveCourses(limit = 8) {
  return useQuery({
    queryKey: ["courses", "active", limit],
    queryFn: () => fetchMyActiveCoursesAction(limit),
    staleTime: 60_000,
  });
}


export function useCourseBySlug(slug: string) {
  return useQuery({
    queryKey: ["courses", slug],
    queryFn: () => fetchCourseBySlugAction(slug),
    enabled: !!slug,
  });
}

export function useAdminCourses(filters?: {
  search?: string;
  departmentId?: string;
  publishStatus?: "draft" | "review" | "published" | "archived";
  level?: import("@/types").LearningLevel;
  difficulty?: import("@/types").Difficulty;
  learningCategory?: import("@/types").LearningCategory;
}) {
  return useQuery({
    queryKey: ["admin-courses", filters],
    queryFn: () => fetchAdminCoursesAction(filters),
  });
}

export function useAssignableCourses() {
  return useQuery({
    queryKey: ["assignable-courses"],
    queryFn: () => fetchAssignableCoursesAction(),
  });
}

export function useCourseBuilder(courseId: string) {
  return useQuery({
    queryKey: ["course-builder", courseId],
    queryFn: () => fetchCourseBuilderAction(courseId),
    enabled: !!courseId,
  });
}

export function useLessonPlayer(lessonId: string) {
  return useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => fetchLessonPlayerAction(lessonId),
    enabled: !!lessonId,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCourseAction,
    onSuccess: (data) => {
      if (data?.ok !== false) qc.invalidateQueries({ queryKey: ["admin-courses"] });
    },
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateCourseAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCourseAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courses"] }),
  });
}

export function usePublishCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: publishCourseAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courses"] }),
  });
}

export function useArchiveCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archiveCourseAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courses"] }),
  });
}

export function useUpsertProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertProgressAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["lesson"] });
    },
  });
}

export function useCompleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: completeLessonAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["lesson"] });
    },
  });
}
