export type DepartmentId =
  | "qa"
  | "development"
  | "ba"
  | "hr"
  | "marketing"
  | "uiux"
  | "devops";

export type LearningLevel =
  | "beginner"
  | "associate"
  | "intermediate"
  | "advanced"
  | "senior"
  | "lead"
  | "architect"
  | "expert";

export type CourseStatus = "not_started" | "in_progress" | "completed" | "archived";
export type AssessmentStatus = "upcoming" | "available" | "in_progress" | "completed" | "failed" | "expired";
export type AssignmentStatus = "pending" | "submitted" | "graded" | "overdue";
export type CertificateStatus = "earned" | "locked" | "expired" | "pending";
export type UserRole = "employee" | "manager" | "department_head" | "admin" | "instructor";
export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";
/** Role-based (career/level track) vs Goal-based (skill or personal objective). */
export type LearningCategory = "role" | "goal";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  designation: string;
  department: DepartmentId;
  level: LearningLevel;
  xp: number;
  coins: number;
  streak: number;
  companyRank: number;
  departmentRank: number;
  skillScore: number;
  joinDate: string;
  experienceYears: number;
  goals: string[];
}

export interface Department {
  id: DepartmentId;
  name: string;
  description: string;
  employeeCount: number;
  courseCount: number;
  avgCompletion: number;
  color: string;
  icon: string;
}

export interface Course {
  id: string;
  slug?: string;
  title: string;
  description: string;
  thumbnail: string;
  department: DepartmentId;
  level: LearningLevel;
  difficulty: Difficulty;
  learningCategory: LearningCategory;
  instructor: Instructor;
  durationHours: number;
  lessonsCount: number;
  enrolledCount: number;
  rating: number;
  progress: number;
  status: CourseStatus;
  tags: string[];
  category: string;
  xpReward: number;
  isSaved: boolean;
  isTrending: boolean;
  lastAccessed?: string;
  modules: CourseModule[];
}

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  title: string;
  bio: string;
}

export interface CourseModule {
  id: string;
  title: string;
  durationMinutes: number;
  lessons: Lesson[];
  completed: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  type: "video" | "reading" | "lab" | "quiz";
  durationMinutes: number;
  completed: boolean;
  locked: boolean;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  department: DepartmentId;
  level: LearningLevel;
  coursesCount: number;
  durationHours: number;
  progress: number;
  enrolledCount: number;
  thumbnail: string;
  skills: string[];
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  department: DepartmentId;
  level: LearningLevel;
  status: AssessmentStatus;
  attempts: number;
  maxAttempts: number;
  dueDate: string;
  score?: number;
  passingScore: number;
  durationMinutes: number;
  questionsCount: number;
  type: "mcq" | "mixed" | "coding" | "case_study";
}

export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  status: AssignmentStatus;
  dueDate: string;
  submittedAt?: string;
  score?: number;
  maxScore: number;
}

export interface Certificate {
  id: string;
  title: string;
  department: DepartmentId;
  level: LearningLevel;
  status: CertificateStatus;
  issuedAt?: string;
  expiresAt?: string;
  credentialId: string;
  score?: number;
  skills: string[];
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  current: number;
  target: number;
  department: DepartmentId;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  department: DepartmentId;
  xp: number;
  streak: number;
  certificates: number;
  badges: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface ActivityItem {
  id: string;
  type: "course" | "assessment" | "certificate" | "achievement" | "assignment";
  title: string;
  description: string;
  timestamp: string;
  meta?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "reminder" | "achievement";
  read: boolean;
  timestamp: string;
  href?: string | null;
}

export interface ChartPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: number;
}

export interface NavGroup {
  id: string;
  title: string;
  icon: string;
  items: NavItem[];
  defaultOpen?: boolean;
}
