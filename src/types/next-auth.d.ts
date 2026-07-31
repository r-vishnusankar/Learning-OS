import type { DefaultSession } from "next-auth";
import type { DepartmentId, LearningLevel, UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      department: DepartmentId;
      designation: string;
      level: LearningLevel;
      xp: number;
      coins: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    department?: DepartmentId;
    designation?: string;
    level?: LearningLevel;
    xp?: number;
    coins?: number;
  }
}
