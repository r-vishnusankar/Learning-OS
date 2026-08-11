import type { NavGroup, NavItem } from "@/types";

export const APP_NAME = "Skillrr";
export const APP_TAGLINE = "Learning that unlocks achievement";

export const LEVELS = [
  "beginner",
  "associate",
  "intermediate",
  "advanced",
  "senior",
  "lead",
  "architect",
  "expert",
] as const;

export const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  associate: "Associate",
  intermediate: "Intermediate",
  advanced: "Advanced",
  senior: "Senior",
  lead: "Lead",
  architect: "Architect",
  expert: "Expert",
};

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
