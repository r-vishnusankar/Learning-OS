/**
 * Service layer facade — live domains hit Neon via server actions.
 */
import { fetchLearnerAssessmentsAction } from "@/services/assessments";
import {
  fetchCertificateDetailAction,
  fetchLearnerAssignmentsAction,
  fetchLearnerCertificatesAction,
  fetchLearnerPathsAction,
} from "@/services/certification";
import { fetchPublishedCoursesAction } from "@/services/courses";
import {
  fetchDepartmentsAction,
  fetchLeaderboardAction,
  fetchNotificationsAction,
} from "@/services/operations";
import {
  skills,
} from "@/data/mock";
import type { Assessment, Certificate, Course, DepartmentId, User } from "@/types";

export async function getCurrentUser(): Promise<User> {
  const { auth } = await import("@/auth");
  const { getUserWithProfile } = await import("@/lib/profile");
  const session = await auth();

  if (session?.user?.id) {
    const user = await getUserWithProfile(session.user.id);
    if (user) return user;
  }

  throw new Error("Unauthorized");
}

export async function getCourses(filters?: { department?: DepartmentId; status?: Course["status"] }) {
  let result = await fetchPublishedCoursesAction();
  if (filters?.department) result = result.filter((c) => c.department === filters.department);
  if (filters?.status) result = result.filter((c) => c.status === filters.status);
  return result;
}

export async function getCourseById(id: string): Promise<Course | undefined> {
  const all = await fetchPublishedCoursesAction();
  return all.find((c) => c.id === id || c.slug === id);
}

export async function getLearningPaths() {
  return fetchLearnerPathsAction();
}

export async function getAssessments() {
  return fetchLearnerAssessmentsAction();
}

export async function getAssessmentById(id: string): Promise<Assessment | undefined> {
  const all = await fetchLearnerAssessmentsAction();
  return all.find((a) => a.id === id);
}

export async function getCertificates() {
  return fetchLearnerCertificatesAction();
}

export async function getCertificateById(id: string): Promise<Certificate | undefined> {
  const detail = await fetchCertificateDetailAction(id);
  return detail?.certificate;
}

export async function getAssignments() {
  return fetchLearnerAssignmentsAction();
}

export async function getDepartments() {
  return fetchDepartmentsAction();
}

export async function getSkills() {
  return skills;
}

export async function getLeaderboard() {
  return fetchLeaderboardAction();
}

export async function getNotifications() {
  return fetchNotificationsAction();
}
