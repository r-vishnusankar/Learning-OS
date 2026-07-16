/**
 * Service layer — currently backed by mock data.
 * Swap implementations here for real API / React Query hooks later.
 */
import {
  assessments,
  assignments,
  certificates,
  courses,
  currentUser,
  departments,
  leaderboard,
  learningPaths,
  notifications,
  skills,
} from "@/data/mock";
import type { Assessment, Certificate, Course, DepartmentId } from "@/types";

export async function getCurrentUser() {
  return currentUser;
}

export async function getCourses(filters?: { department?: DepartmentId; status?: Course["status"] }) {
  let result = [...courses];
  if (filters?.department) result = result.filter((c) => c.department === filters.department);
  if (filters?.status) result = result.filter((c) => c.status === filters.status);
  return result;
}

export async function getCourseById(id: string): Promise<Course | undefined> {
  return courses.find((c) => c.id === id);
}

export async function getLearningPaths() {
  return learningPaths;
}

export async function getAssessments() {
  return assessments;
}

export async function getAssessmentById(id: string): Promise<Assessment | undefined> {
  return assessments.find((a) => a.id === id);
}

export async function getCertificates() {
  return certificates;
}

export async function getCertificateById(id: string): Promise<Certificate | undefined> {
  return certificates.find((c) => c.id === id);
}

export async function getAssignments() {
  return assignments;
}

export async function getDepartments() {
  return departments;
}

export async function getSkills() {
  return skills;
}

export async function getLeaderboard() {
  return leaderboard;
}

export async function getNotifications() {
  return notifications;
}
