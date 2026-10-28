import type { DepartmentId, LearningLevel, NavGroup, NavItem } from "@/types";

export const APP_NAME = "Skillrr";
export const APP_TAGLINE = "Learning that unlocks achievement";

/** All valid career-level IDs (union across departments). Not a single progression track. */
export const LEVELS = [
  "beginner",
  "associate",
  "intermediate",
  "advanced",
  "senior",
  "lead",
  "architect",
  "expert",
  "qa_manager",
  "product_owner",
  "assistant_hr_manager",
  "hr_manager",
] as const satisfies readonly LearningLevel[];

export const LEVEL_LABELS: Record<LearningLevel, string> = {
  beginner: "Beginner",
  associate: "Associate",
  intermediate: "Intermediate",
  advanced: "Advanced",
  senior: "Senior",
  lead: "Lead",
  architect: "Architect",
  expert: "Expert",
  qa_manager: "QA Manager",
  product_owner: "Product Owner",
  assistant_hr_manager: "Assistant HR Manager",
  hr_manager: "HR Manager",
};

const STANDARD_TRACK = ["associate", "advanced", "senior", "lead", "architect"] as const satisfies readonly LearningLevel[];

/** Ordered career track per department. Digital Marketing keeps the original 8-level ladder. */
export const DEPARTMENT_LEVELS: Record<DepartmentId, readonly LearningLevel[]> = {
  development: STANDARD_TRACK,
  qa: ["associate", "advanced", "senior", "lead", "qa_manager"],
  ba: ["associate", "advanced", "senior", "lead", "product_owner"],
  hr: ["associate", "advanced", "assistant_hr_manager", "hr_manager"],
  marketing: [
    "beginner",
    "associate",
    "intermediate",
    "advanced",
    "senior",
    "lead",
    "architect",
    "expert",
  ],
  uiux: STANDARD_TRACK,
  devops: STANDARD_TRACK,
};

export function levelsForDepartment(departmentId: DepartmentId): readonly LearningLevel[] {
  return DEPARTMENT_LEVELS[departmentId];
}

export function levelsForFilter(departmentId: DepartmentId | "all"): readonly LearningLevel[] {
  if (departmentId === "all") return STANDARD_TRACK;
  return DEPARTMENT_LEVELS[departmentId];
}

export function firstLevelForDepartment(departmentId: DepartmentId): LearningLevel {
  return DEPARTMENT_LEVELS[departmentId][0]!;
}

export function isFirstDepartmentLevel(level: LearningLevel, departmentId: DepartmentId): boolean {
  return DEPARTMENT_LEVELS[departmentId][0] === level;
}

export function nextCareerLevel(
  level: LearningLevel,
  department: DepartmentId
): LearningLevel | null {
  const current = normalizeCareerLevel(level, department);
  const track = DEPARTMENT_LEVELS[department];
  const idx = track.indexOf(current);
  if (idx < 0 || idx >= track.length - 1) return null;
  return track[idx + 1] ?? null;
}

/** Map a stored/legacy level onto the department's current track. */
export function normalizeCareerLevel(level: LearningLevel, department: DepartmentId): LearningLevel {
  const track = DEPARTMENT_LEVELS[department];
  if (track.includes(level)) return level;

  const merged: Partial<Record<LearningLevel, LearningLevel>> = {
    beginner: "associate",
    intermediate: "advanced",
  };

  if (department === "qa") {
    merged.architect = "qa_manager";
    merged.expert = "qa_manager";
  } else if (department === "ba") {
    merged.architect = "product_owner";
    merged.expert = "product_owner";
  } else if (department === "hr") {
    merged.senior = "assistant_hr_manager";
    merged.lead = "assistant_hr_manager";
    merged.architect = "hr_manager";
    merged.expert = "hr_manager";
  } else if (department !== "marketing") {
    merged.expert = "architect";
  }

  const mapped = merged[level];
  if (mapped && track.includes(mapped)) return mapped;
  return track[0]!;
}

export const DEPARTMENT_LABELS: Record<string, string> = {
  qa: "Quality Assurance",
  development: "Development",
  ba: "Business Analyst",
  hr: "Human Resources",
  marketing: "Digital Marketing",
  uiux: "UI/UX Design",
  devops: "DevOps",
};

export const LEARNING_CATEGORY_LABELS: Record<"role" | "goal", string> = {
  role: "Role based",
  goal: "Goal Based",
};

/** Always-visible top-level learner links (not inside a collapsible group). */
export const SIDEBAR_PINNED: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
];

export const SIDEBAR_NAV_GROUPS: NavGroup[] = [
  {
    id: "learn",
    title: "Learn",
    icon: "BookOpen",
    defaultOpen: true,
    items: [
      { title: "My Learning", href: "/dashboard/learning", icon: "BookOpen" },
      { title: "Learning Paths", href: "/dashboard/paths", icon: "Route" },
      { title: "Departments", href: "/dashboard/departments", icon: "Building2" },
      { title: "Courses", href: "/dashboard/courses", icon: "GraduationCap" },
    ],
  },
  {
    id: "progress",
    title: "Progress",
    icon: "ClipboardCheck",
    items: [
      { title: "Assessments", href: "/dashboard/assessments", icon: "ClipboardCheck" },
      { title: "Assignments", href: "/dashboard/assignments", icon: "FileText" },
      { title: "Certificates", href: "/dashboard/certificates", icon: "Award" },
      { title: "Skill Matrix", href: "/dashboard/skills", icon: "Radar" },
    ],
  },
  {
    id: "engage",
    title: "Engage",
    icon: "Trophy",
    items: [
      { title: "Leaderboard", href: "/dashboard/leaderboard", icon: "Trophy" },
      { title: "Calendar", href: "/dashboard/calendar", icon: "Calendar" },
    ],
  },
  {
    id: "support",
    title: "Support",
    icon: "HelpCircle",
    items: [
      { title: "Help", href: "/dashboard/help", icon: "HelpCircle" },
      { title: "Notifications", href: "/dashboard/notifications", icon: "Bell" },
    ],
  },
];

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    id: "admin-oversight",
    title: "Oversight",
    icon: "Shield",
    defaultOpen: true,
    items: [
      { title: "Admin Overview", href: "/dashboard/admin", icon: "Shield" },
      { title: "Catalog Audit", href: "/dashboard/admin/catalog-audit", icon: "ClipboardCheck" },
      { title: "Employee Progress", href: "/dashboard/admin/employee-progress", icon: "UserRoundSearch" },
      { title: "Promotions", href: "/dashboard/admin/promotions", icon: "Award" },
    ],
  },
  {
    id: "admin-catalog",
    title: "Catalog",
    icon: "Folders",
    items: [
      { title: "Course Management", href: "/dashboard/admin/courses", icon: "Folders" },
      { title: "Course Assignments", href: "/dashboard/admin/course-assignments", icon: "Users" },
      { title: "Assessments", href: "/dashboard/admin/assessments", icon: "ClipboardCheck" },
      { title: "Learning Paths", href: "/dashboard/admin/paths", icon: "Route" },
    ],
  },
  {
    id: "admin-operations",
    title: "Operations",
    icon: "FileText",
    items: [
      { title: "Assignments", href: "/dashboard/admin/assignments", icon: "FileText" },
      { title: "Certificates", href: "/dashboard/admin/certificates", icon: "Award" },
      { title: "Media Library", href: "/dashboard/admin/media", icon: "Image" },
      { title: "User Management", href: "/dashboard/admin/users", icon: "Users" },
    ],
  },
];

/** Flat lists retained for any consumers that need every leaf link. */
export const SIDEBAR_NAV: NavItem[] = [
  ...SIDEBAR_PINNED,
  ...SIDEBAR_NAV_GROUPS.flatMap((group) => group.items),
  { title: "Settings", href: "/dashboard/settings", icon: "Settings" },
];

export const ADMIN_NAV: NavItem[] = ADMIN_NAV_GROUPS.flatMap((group) => group.items);
