import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { notifications, profiles, teams, teamMembers, users } from "@/db/schema";

config({ path: ".env.local" });

async function seedOperations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  const db = drizzle(neon(databaseUrl));

  const [demoUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "demo@nexus.local"))
    .limit(1);

  if (!demoUser) {
    console.log("Demo user missing — skip ops seed");
    return;
  }

  await db
    .update(profiles)
    .set({ role: "admin", status: "active", designation: "Platform Administrator" })
    .where(eq(profiles.userId, demoUser.id));

  const existingNotifs = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, demoUser.id))
    .limit(1);

  if (!existingNotifs.length) {
    await db.insert(notifications).values([
      {
        userId: demoUser.id,
        title: "Welcome to Nexus Ops",
        message: "Enterprise operations are live — manage users, teams, and analytics from Admin.",
        type: "success",
        href: "/dashboard/admin",
      },
      {
        userId: demoUser.id,
        title: "Assessment reminder",
        message: "System Design Fundamentals Exam is available when you are ready.",
        type: "reminder",
        href: "/dashboard/assessments",
      },
      {
        userId: demoUser.id,
        title: "Certificate issued",
        message: "A credential is waiting in your Certificates vault.",
        type: "achievement",
        href: "/dashboard/certificates",
      },
    ]);
    console.log("Seeded notifications");
  } else {
    console.log("Notifications already seeded");
  }

  const existingTeam = await db
    .select()
    .from(teams)
    .where(eq(teams.name, "Platform Engineering"))
    .limit(1);

  if (!existingTeam.length) {
    const [team] = await db
      .insert(teams)
      .values({
        name: "Platform Engineering",
        departmentId: "development",
        managerId: demoUser.id,
      })
      .returning();
    await db.insert(teamMembers).values({ teamId: team.id, userId: demoUser.id });
    console.log("Seeded team:", team.id);
  } else {
    console.log("Team already seeded");
  }

  console.log("Operations seed complete");
}

seedOperations().catch((error) => {
  console.error(error);
  process.exit(1);
});
