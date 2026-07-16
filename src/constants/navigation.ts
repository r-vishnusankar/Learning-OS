import type { NavItem } from "@/types";

export const APP_NAME = "Nexus";
export const APP_TAGLINE = "Enterprise Learning Platform";

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

export const SIDEBAR_NAV: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "My Learning", href: "/dashboard/learning", icon: "BookOpen" },
  { title: "Learning Paths", href: "/dashboard/paths", icon: "Route" },
  { title: "Departments", href: "/dashboard/departments", icon: "Building2" },
  { title: "Courses", href: "/dashboard/courses", icon: "GraduationCap" },
  { title: "Assessments", href: "/dashboard/assessments", icon: "ClipboardCheck" },
  { title: "Assignments", href: "/dashboard/assignments", icon: "FileText" },
  { title: "Certificates", href: "/dashboard/certificates", icon: "Award" },
  { title: "Skill Matrix", href: "/dashboard/skills", icon: "Radar" },
  { title: "Leaderboard", href: "/dashboard/leaderboard", icon: "Trophy" },
  { title: "Reports", href: "/dashboard/analytics", icon: "BarChart3" },
  { title: "Calendar", href: "/dashboard/calendar", icon: "Calendar" },
  { title: "AI Mentor", href: "/dashboard/ai-mentor", icon: "Sparkles" },
  { title: "Notifications", href: "/dashboard/notifications", icon: "Bell", badge: 5 },
  { title: "Settings", href: "/dashboard/settings", icon: "Settings" },
];

export const ADMIN_NAV: NavItem[] = [
  { title: "Admin Overview", href: "/dashboard/admin", icon: "Shield" },
  { title: "Course Management", href: "/dashboard/admin/courses", icon: "Folders" },
  { title: "User Management", href: "/dashboard/admin/users", icon: "Users" },
];
