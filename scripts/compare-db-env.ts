/**
 * Compare DATABASE_URL hostnames (no secrets printed).
 *   npx tsx scripts/compare-db-env.ts
 */
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

function hostFromUrl(url: string | undefined): string | null {
  if (!url || url.includes("[SENSITIVE]")) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function loadEnv(file: string): Record<string, string> {
  const p = path.resolve(process.cwd(), file);
  if (!fs.existsSync(p)) return {};
  return dotenv.parse(fs.readFileSync(p));
}

async function columnCheck(label: string, url: string | undefined) {
  if (!url) {
    console.log(`${label}: DATABASE_URL unset`);
    return;
  }
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);
  const profileCol = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'profile' AND column_name = 'last_activity_date'
  `;
  const reviewerCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'lms_assignment_submission'
      AND column_name IN ('reviewed_by', 'reviewed_at')
    ORDER BY column_name
  `;
  console.log(`${label} host: ${hostFromUrl(url)}`);
  console.log(`  last_activity_date: ${profileCol.length ? "present" : "MISSING"}`);
  console.log(
    `  reviewed_by/reviewed_at: ${reviewerCols.length}/2 present` +
      (reviewerCols.length ? ` (${reviewerCols.map((r: { column_name: string }) => r.column_name).join(", ")})` : "")
  );
}

async function main() {
  const local = loadEnv(".env.local");
  const vercel = loadEnv(".env.vercel.prod");
  const lh = hostFromUrl(local.DATABASE_URL);
  const vh = hostFromUrl(vercel.DATABASE_URL);
  console.log("=== Database environment comparison ===");
  console.log(`local .env.local host:     ${lh ?? "(unset)"}`);
  console.log(`Vercel production host:    ${vh ?? "(unset — run: vercel env pull .env.vercel.prod --environment=production)"}`);
  console.log(`Same Neon host:            ${lh && vh ? String(lh === vh) : "unknown"}`);
  console.log("");
  if (local.DATABASE_URL) await columnCheck("Local", local.DATABASE_URL);
  console.log("");
  if (vercel.DATABASE_URL) await columnCheck("Vercel production", vercel.DATABASE_URL);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
