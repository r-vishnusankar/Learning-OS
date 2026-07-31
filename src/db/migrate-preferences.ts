import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`ALTER TABLE profile ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}'::jsonb`;
  console.log("profile.preferences ready");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
