import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";
import type { DepartmentId, LearningLevel, UserRole } from "@/types";

export type EmployeeStatus = "active" | "inactive";
export type NotificationType = "info" | "success" | "warning" | "reminder" | "achievement";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
);

export const departments = pgTable("department", {
  id: text("id").$type<DepartmentId>().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  employeeCount: integer("employee_count").notNull().default(0),
  courseCount: integer("course_count").notNull().default(0),
  avgCompletion: integer("avg_completion").notNull().default(0),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
});

export const profiles = pgTable("profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").$type<UserRole>().notNull().default("employee"),
  department: text("department").$type<DepartmentId>().notNull().default("development"),
  designation: text("designation").notNull().default("Team Member"),
  level: text("level").$type<LearningLevel>().notNull().default("beginner"),
  xp: integer("xp").notNull().default(0),
  coins: integer("coins").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  companyRank: integer("company_rank").notNull().default(0),
  departmentRank: integer("department_rank").notNull().default(0),
  skillScore: integer("skill_score").notNull().default(0),
  joinDate: text("join_date").notNull(),
  experienceYears: integer("experience_years").notNull().default(0),
  goals: jsonb("goals").$type<string[]>().notNull().default([]),
  status: text("status").$type<EmployeeStatus>().notNull().default("active"),
  managerId: text("manager_id"),
  preferences: jsonb("preferences").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
