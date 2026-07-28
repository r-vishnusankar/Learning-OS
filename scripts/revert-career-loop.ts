/**
 * Reverts career-loop seed data (roster users, rule assignments, course assessments, promotions).
 * Does NOT drop unrelated LMS tables. Safe to re-run.
 *
 * Keeps demo@nexus.local and any users without preferences.rosterSource = career-loop.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { and, eq, inArray, sql } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { buildResolvedEmployeeCatalog } from "@/db/catalog/employees";
import {
  assessmentAttempts,
  assessments,
  courseAssignments,
  departments,
  notifications,
  profiles,
  promotions,
  questions,
  users,
} from "@/db/schema";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const db = drizzle(neon(databaseUrl));
  const rosterEmails = buildResolvedEmployeeCatalog().map((e) => e.email);

  // 1) Delete rule-sourced course assignments for roster users
  const rosterUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.email, rosterEmails));

  const rosterIds = rosterUsers.map((u) => u.id);

  if (rosterIds.length > 0) {
    await db
      .delete(courseAssignments)
      .where(
        and(
          inArray(courseAssignments.userId, rosterIds),
          eq(courseAssignments.source, "rule")
        )
      );

    await db.delete(promotions).where(inArray(promotions.userId, rosterIds));
    await db.delete(notifications).where(inArray(notifications.userId, rosterIds));
    await db.delete(profiles).where(inArray(profiles.userId, rosterIds));
    await db.delete(users).where(inArray(users.id, rosterIds));
  }

  // 2) Remove assessments created for courses (title pattern Knowledge Check) that are linked
  const linked = await db
    .select({ id: assessments.id })
    .from(assessments)
    .where(sql`${assessments.title} LIKE '%— Knowledge Check'`);

  const assessmentIds = linked.map((a) => a.id);
  if (assessmentIds.length > 0) {
    await db
      .delete(assessmentAttempts)
      .where(inArray(assessmentAttempts.assessmentId, assessmentIds));
    await db.delete(questions).where(inArray(questions.assessmentId, assessmentIds));
    await db.delete(assessments).where(inArray(assessments.id, assessmentIds));
  }

  // 3) Optionally drop promotions table data already cleared; leave table structure

  // Refresh dept counts
  const counts = await db
    .select({
      department: profiles.department,
      count: sql<number>`count(*)::int`,
    })
    .from(profiles)
    .where(eq(profiles.status, "active"))
    .groupBy(profiles.department);

  for (const row of counts) {
    await db
      .update(departments)
      .set({ employeeCount: row.count })
      .where(eq(departments.id, row.department));
  }

  console.log(
    `Career-loop reverted: removed ${rosterIds.length} roster users, ${assessmentIds.length} course knowledge-check assessments.`
  );
  console.log("Code revert: git checkout main  (or git revert <career-loop commit>)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
