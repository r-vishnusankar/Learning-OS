import { boolean, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { lessons } from "./courses";
import { users } from "./auth";

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    completed: boolean("completed").notNull().default(false),
    percentage: integer("percentage").notNull().default(0),
    lastViewedAt: timestamp("last_viewed_at", { mode: "date" }),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.lessonId] }),
  })
);
