/**
 * Seeds the 49-person employee roster into users + profiles.
 * Idempotent by email. Revert: npm run db:revert-career-loop
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq, sql } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { buildResolvedEmployeeCatalog } from "@/db/catalog/employees";
import { departments, profiles, users } from "@/db/schema";

function avatar(name: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const db = drizzle(neon(databaseUrl));
  const catalog = buildResolvedEmployeeCatalog();

  // Company rank by experience (desc)
  const byExp = [...catalog].sort((a, b) => b.experienceYears - a.experienceYears);
  const companyRank = new Map<string, number>();
  byExp.forEach((e, i) => companyRank.set(e.email, i + 1));

  // Department rank within each dept
  const deptRank = new Map<string, number>();
  const byDept = new Map<string, typeof catalog>();
  for (const e of catalog) {
    const list = byDept.get(e.department) ?? [];
    list.push(e);
    byDept.set(e.department, list);
  }
  for (const [, list] of byDept) {
    list
      .sort((a, b) => b.experienceYears - a.experienceYears)
      .forEach((e, i) => deptRank.set(e.email, i + 1));
  }

  let created = 0;
  let updated = 0;

  for (const emp of catalog) {
    const [existing] = await db.select().from(users).where(eq(users.email, emp.email)).limit(1);

    let userId = existing?.id;
    if (!userId) {
      const [u] = await db
        .insert(users)
        .values({
          name: emp.name,
          email: emp.email,
          image: avatar(emp.name),
        })
        .returning();
      userId = u.id;
      created += 1;
    } else {
      await db
        .update(users)
        .set({ name: emp.name, image: avatar(emp.name) })
        .where(eq(users.id, userId));
      updated += 1;
    }

    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    const profileValues = {
      role: emp.role,
      department: emp.department,
      designation: emp.designation,
      level: emp.level,
      experienceYears: emp.experienceYearsRounded,
      companyRank: companyRank.get(emp.email) ?? 0,
      departmentRank: deptRank.get(emp.email) ?? 0,
      status: "active" as const,
      joinDate: "2024-01-15",
      updatedAt: new Date(),
    };

    if (!profile) {
      await db.insert(profiles).values({
        userId,
        ...profileValues,
        goals: ["Complete current level certifications"],
        preferences: { rosterSource: "career-loop" },
      });
    } else {
      await db
        .update(profiles)
        .set({
          ...profileValues,
          preferences: {
            ...(typeof profile.preferences === "object" && profile.preferences
              ? profile.preferences
              : {}),
            rosterSource: "career-loop",
          },
        })
        .where(eq(profiles.userId, userId));
    }
  }

  // Refresh department employee counts
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
    `Employees seeded: ${catalog.length} roster · created=${created} · updated=${updated}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
