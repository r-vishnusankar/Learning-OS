/**
 * Moves existing roster users from @nexus.local to official @valoriz.com emails
 * and creates any missing Valoriz accounts. Idempotent by email + name.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  VALORIZ_EMAIL_BY_NAME,
  buildResolvedEmployeeCatalog,
  legacyNexusEmail,
} from "@/db/catalog/employees";
import { profiles, users } from "@/db/schema";

function avatar(name: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const db = drizzle(neon(databaseUrl));
  const catalog = buildResolvedEmployeeCatalog();
  let updated = 0;
  let created = 0;
  let unchanged = 0;

  const extraNames = Object.keys(VALORIZ_EMAIL_BY_NAME).filter(
    (name) => !catalog.some((emp) => emp.name === name)
  );

  const targets = [
    ...catalog.map((emp) => ({ name: emp.name, email: emp.email, fromRoster: true })),
    ...extraNames.map((name) => ({
      name,
      email: VALORIZ_EMAIL_BY_NAME[name],
      fromRoster: false,
    })),
  ];

  for (const person of targets) {
    const email = person.email.toLowerCase();
    const [byNewEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (byNewEmail) {
      unchanged += 1;
      continue;
    }

    const [byName] = await db.select().from(users).where(eq(users.name, person.name)).limit(1);
    const [byLegacy] = await db
      .select()
      .from(users)
      .where(eq(users.email, legacyNexusEmail(person.name)))
      .limit(1);
    const existing = byName ?? byLegacy;

    if (existing) {
      await db
        .update(users)
        .set({ email, name: person.name, image: avatar(person.name) })
        .where(eq(users.id, existing.id));
      updated += 1;
      console.log(`Updated ${person.name} → ${email}`);
      continue;
    }

    const [createdUser] = await db
      .insert(users)
      .values({
        name: person.name,
        email,
        image: avatar(person.name),
      })
      .returning();

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, createdUser.id))
      .limit(1);

    const roster = catalog.find((emp) => emp.name === person.name);
    if (!profile) {
      await db.insert(profiles).values({
        userId: createdUser.id,
        role: email === "vishnu.sankar@valoriz.com" ? "admin" : "employee",
        department: roster?.department ?? "development",
        designation: roster?.designation ?? "Team Member",
        level: roster?.level ?? "beginner",
        joinDate: new Date().toISOString().slice(0, 10),
        goals: [],
        preferences: { rosterSource: "career-loop" },
      });
    }

    created += 1;
    console.log(`Created ${person.name} → ${email}`);
  }

  console.log(`Employee emails: updated=${updated} created=${created} unchanged=${unchanged}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
