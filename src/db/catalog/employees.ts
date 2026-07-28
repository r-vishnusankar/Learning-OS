import { LEVELS } from "@/constants/navigation";
import type { DepartmentId, LearningLevel, UserRole } from "@/types";

/** Org unit labels from the HR roster (PM / Finance excluded from catalog). */
export type RosterOrgUnit =
  | "Development"
  | "QA"
  | "BA"
  | "HR"
  | "Digital Marketing"
  | "Marketing & Branding"
  | "UI"
  | "UX"
  | "DevOps";

export type EmployeeRosterRow = {
  name: string;
  orgUnit: RosterOrgUnit;
  designation: string;
  /** Years of experience (decimal from HR export). */
  experienceYears: number;
};

/**
 * Source-of-truth employee roster for seed / level assignment.
 * Excludes Project Management and Finance & Accounting (deferred).
 */
export const EMPLOYEE_ROSTER: EmployeeRosterRow[] = [
  { name: "Riju Thomas", orgUnit: "Development", designation: "Technical Architect", experienceYears: 11.27 },
  { name: "Muhammad Shafeeqe D", orgUnit: "Development", designation: "Associate Technical Architect", experienceYears: 9.37 },
  { name: "Naseef O", orgUnit: "Development", designation: "Technical Lead", experienceYears: 7.63 },
  { name: "Shibin Mepparambil", orgUnit: "Development", designation: "Technical Lead", experienceYears: 7.48 },
  { name: "Indrajith C", orgUnit: "Development", designation: "Technical Lead", experienceYears: 6.78 },
  { name: "Shamseer B", orgUnit: "UI", designation: "Senior UI Developer", experienceYears: 6.77 },
  { name: "Anagha Chandrababu", orgUnit: "Development", designation: "Senior Software Engineer", experienceYears: 6.17 },
  { name: "Vishnuprasad P S", orgUnit: "UI", designation: "UI Lead", experienceYears: 5.91 },
  { name: "Midhun Murali", orgUnit: "Development", designation: "Technical Lead", experienceYears: 5.37 },
  { name: "Devika Thulasi", orgUnit: "Development", designation: "Technical Lead", experienceYears: 5.36 },
  { name: "Minna Ancy Mathew", orgUnit: "Development", designation: "Senior Software Engineer", experienceYears: 5.33 },
  { name: "Soyadha Ravindran", orgUnit: "QA", designation: "Senior QA Engineer", experienceYears: 5.02 },
  { name: "Tinoy Thomas", orgUnit: "QA", designation: "Senior QA Engineer", experienceYears: 5.02 },
  { name: "Kishore kumar P", orgUnit: "Development", designation: "Senior Software Engineer", experienceYears: 4.95 },
  { name: "Neeraj R", orgUnit: "Development", designation: "Senior Software Engineer", experienceYears: 4.88 },
  { name: "Nithin R", orgUnit: "Development", designation: "Senior Software Engineer", experienceYears: 4.83 },
  { name: "Sandeep Raj V R", orgUnit: "QA", designation: "Senior QA Engineer", experienceYears: 4.33 },
  { name: "Aarshit S L", orgUnit: "QA", designation: "Senior QA Engineer", experienceYears: 4.3 },
  { name: "Rameshwari Subburaman", orgUnit: "BA", designation: "Business Analyst", experienceYears: 4.1 },
  { name: "Aju Joseph", orgUnit: "HR", designation: "Assistant Manager - HR", experienceYears: 3.94 },
  { name: "Greeshma George", orgUnit: "QA", designation: "Senior QA Engineer", experienceYears: 3.85 },
  { name: "Midhina M B", orgUnit: "QA", designation: "Senior QA Automation Engineer", experienceYears: 3.78 },
  { name: "Shaan Jess Francis", orgUnit: "Marketing & Branding", designation: "Senior Graphic Designer", experienceYears: 3.72 },
  { name: "Unnimaya B", orgUnit: "QA", designation: "Senior QA Engineer", experienceYears: 3.64 },
  { name: "Sivaprasad T P", orgUnit: "Development", designation: "Senior Software Engineer", experienceYears: 3.64 },
  { name: "Arya Devi V S", orgUnit: "QA", designation: "QA Engineer", experienceYears: 3.55 },
  { name: "Vishakh B S", orgUnit: "Development", designation: "Senior Software Engineer", experienceYears: 3.55 },
  { name: "Sopal Soman", orgUnit: "Development", designation: "Senior Software Engineer", experienceYears: 3.43 },
  { name: "Janajith D", orgUnit: "Development", designation: "Senior Software Engineer", experienceYears: 2.88 },
  { name: "Shilpa S Nair", orgUnit: "HR", designation: "HR Generalist", experienceYears: 2.49 },
  { name: "Kevin Millet", orgUnit: "Digital Marketing", designation: "Digital Marketing Executive", experienceYears: 1.59 },
  { name: "Syamily Divakaran", orgUnit: "Development", designation: "Junior Software Engineer", experienceYears: 1.49 },
  { name: "Amarnath A", orgUnit: "Development", designation: "Junior Software Engineer", experienceYears: 1.49 },
  { name: "Gouri S Govind", orgUnit: "BA", designation: "Junior Business Analyst", experienceYears: 1.13 },
  { name: "Archa R", orgUnit: "HR", designation: "Associate- TA", experienceYears: 1.03 },
  { name: "Ram S Madhav", orgUnit: "Development", designation: "Junior Software Engineer", experienceYears: 0.96 },
  { name: "Diljith Girish", orgUnit: "DevOps", designation: "Junior Software Engineer-DevOps", experienceYears: 0.9 },
  { name: "Nanda Kishor V", orgUnit: "Digital Marketing", designation: "Digital Marketing Executive", experienceYears: 0.65 },
  { name: "Ashna S", orgUnit: "BA", designation: "Junior Business Analyst", experienceYears: 0.65 },
  { name: "Kalyani Sunilkumar", orgUnit: "Development", designation: "Junior Software Engineer", experienceYears: 0.52 },
  { name: "Rohith Mohan", orgUnit: "Development", designation: "Junior Software Engineer", experienceYears: 0.52 },
  { name: "Anagha Anil Kumar", orgUnit: "QA", designation: "Junior QA Engineer", experienceYears: 0.5 },
  { name: "Navaneesh Chandran R", orgUnit: "Marketing & Branding", designation: "Graphic Designer", experienceYears: 0.4 },
  { name: "Shinin Babu", orgUnit: "UX", designation: "UX Designer", experienceYears: 0.3 },
  { name: "Dhanush S", orgUnit: "Development", designation: "Junior Software Engineer", experienceYears: 0.2 },
  { name: "Hridya A", orgUnit: "UI", designation: "Junior UI Developer", experienceYears: 0.2 },
  { name: "Revathi Sunitha R A", orgUnit: "Digital Marketing", designation: "Junior Executive - Digital Marketing", experienceYears: 0.1 },
  { name: "Jeffin Jiju", orgUnit: "QA", designation: "Juinor QA Engineer", experienceYears: 0.1 },
  { name: "Chandana G", orgUnit: "Digital Marketing", designation: "Digital Marketing Executive", experienceYears: 0.12 },
];

const ORG_TO_DEPT: Record<RosterOrgUnit, DepartmentId> = {
  Development: "development",
  QA: "qa",
  BA: "ba",
  HR: "hr",
  "Digital Marketing": "marketing",
  "Marketing & Branding": "marketing",
  UI: "uiux",
  UX: "uiux",
  DevOps: "devops",
};

export function mapDepartment(orgUnit: RosterOrgUnit): DepartmentId {
  return ORG_TO_DEPT[orgUnit];
}

export function inferLevel(designation: string): LearningLevel {
  const d = designation.toLowerCase();
  if (
    d.includes("junior") ||
    d.includes("juinor") || // roster typo
    d.includes("associate- ta") ||
    d.includes("associate-ta") ||
    d.includes("junior executive")
  ) {
    return "beginner";
  }
  if (d.includes("architect")) return "architect";
  if (d.includes(" lead") || d.endsWith("lead") || d.includes("technical lead") || d.includes("ui lead")) {
    return "lead";
  }
  if (d.includes("assistant manager") || d.includes("manager")) return "lead";
  if (d.includes("senior")) return "senior";
  return "associate";
}

export function inferRole(designation: string): UserRole {
  const d = designation.toLowerCase();
  if (d.includes("assistant manager") || d.includes("manager")) return "manager";
  return "employee";
}

export function emailFor(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return `${slug}@nexus.local`;
}

export function nextLearningLevel(level: LearningLevel): LearningLevel | null {
  const idx = LEVELS.indexOf(level as (typeof LEVELS)[number]);
  if (idx < 0 || idx >= LEVELS.length - 1) return null;
  return LEVELS[idx + 1];
}

export type ResolvedEmployee = EmployeeRosterRow & {
  email: string;
  department: DepartmentId;
  level: LearningLevel;
  role: UserRole;
  experienceYearsRounded: number;
};

export function resolveEmployee(row: EmployeeRosterRow): ResolvedEmployee {
  return {
    ...row,
    email: emailFor(row.name),
    department: mapDepartment(row.orgUnit),
    level: inferLevel(row.designation),
    role: inferRole(row.designation),
    experienceYearsRounded: Math.round(row.experienceYears),
  };
}

export function buildResolvedEmployeeCatalog(): ResolvedEmployee[] {
  return EMPLOYEE_ROSTER.map(resolveEmployee);
}
