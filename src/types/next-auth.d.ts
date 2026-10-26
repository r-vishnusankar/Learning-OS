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
      /** True when the user was admin-invited and has not yet changed their temporary password. */
      mustChangePassword?: boolean;
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
    /** Mirrors user_credentials.must_change_password. Re-read from DB while true. */
    mustChangePassword?: boolean;
  }
}
