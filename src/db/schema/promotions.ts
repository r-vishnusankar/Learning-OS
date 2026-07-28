import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { LearningLevel } from "@/types";
import { users } from "./auth";

export type PromotionStatus =
  | "eligible"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "superseded";

export const promotions = pgTable("lms_promotion", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fromLevel: text("from_level").$type<LearningLevel>().notNull(),
  toLevel: text("to_level").$type<LearningLevel>().notNull(),
  fromDesignation: text("from_designation"),
  toDesignation: text("to_designation"),
  status: text("status").$type<PromotionStatus>().notNull().default("eligible"),
  eligibleAt: timestamp("eligible_at", { mode: "date" }).notNull().defaultNow(),
  decidedAt: timestamp("decided_at", { mode: "date" }),
  decidedBy: text("decided_by").references(() => users.id, { onDelete: "set null" }),
  reason: text("reason"),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
