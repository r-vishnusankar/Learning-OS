import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { profiles, users } from "@/db/schema";

config({ path: ".env.local" });

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  const email = process.env.DEV_LOGIN_EMAIL ?? "demo@nexus.local";
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  let userId = existing?.id;
  if (!userId) {
    const [created] = await db
      .insert(users)
      .values({
        email,
        name: "Alex Rivera",
        image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex",
      })
      .returning();
    userId = created.id;
    await db.insert(profiles).values({
      userId,
      role: "admin",
      department: "development",
      designation: "Platform Administrator",
      level: "senior",
      joinDate: new Date().toISOString().slice(0, 10),
      status: "active",
      goals: [],
      preferences: {},
    });
    console.log("Created demo user:", userId);
  } else {
    await db
      .update(profiles)
      .set({ role: "admin", status: "active", designation: "Platform Administrator" })
      .where(eq(profiles.userId, userId));
    console.log("Demo user already exists:", userId);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
