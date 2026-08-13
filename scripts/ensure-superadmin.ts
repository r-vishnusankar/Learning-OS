/**
 * Ensures the universal Skillrr superadmin account exists with role=admin.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { SUPERADMIN_EMAIL, SUPERADMIN_NAME } from "@/lib/dev-credentials";
import { profiles, users } from "@/db/schema";

function avatar(name: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const db = drizzle(neon(databaseUrl));
  const email = SUPERADMIN_EMAIL;
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  let userId = existing?.id;
  if (!userId) {
    const [created] = await db
      .insert(users)
      .values({
        email,
        name: SUPERADMIN_NAME,
        image: avatar(SUPERADMIN_NAME),
      })
      .returning();
    userId = created.id;
    console.log("Created superadmin user:", userId);
  } else {
    await db
      .update(users)
      .set({ name: SUPERADMIN_NAME, image: avatar(SUPERADMIN_NAME) })
      .where(eq(users.id, userId));
    console.log("Superadmin user already exists:", userId);
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  const profileValues = {
    role: "admin" as const,
    status: "active" as const,
    designation: "Platform Super Admin",
    department: "development" as const,
    level: "expert" as const,
  };

  if (!profile) {
    await db.insert(profiles).values({
      userId,
      ...profileValues,
      joinDate: new Date().toISOString().slice(0, 10),
      goals: [],
      preferences: { rosterSource: "superadmin" },
    });
  } else {
    await db.update(profiles).set(profileValues).where(eq(profiles.userId, userId));
  }

  console.log(`Superadmin ready: ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
