/**
 * Compute profile.streak / last_activity_date from lesson_progress timestamps (IST days).
 * Default --dry-run prints before/after. Pass --apply to write. Do not run against prod.
 *
 *   npx tsx scripts/backfill-streaks.ts
 *   npx tsx scripts/backfill-streaks.ts --apply
 */
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as path from "path";
import { istDateKey, shiftIstDateKey } from "../src/lib/ist";
import { displayedStreak } from "../src/lib/streak";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL not set in .env.local");

const sql = neon(DATABASE_URL);
const apply = process.argv.includes("--apply");

function streakFromKeys(keys: string[]): { streak: number; lastActivityDate: string | null } {
  const unique = [...new Set(keys.filter(Boolean))].sort();
  if (unique.length === 0) return { streak: 0, lastActivityDate: null };
  const lastActivityDate = unique[unique.length - 1]!;
  let streak = 1;
  let cursor = lastActivityDate;
  while (true) {
    const prev = shiftIstDateKey(cursor, -1);
    if (!unique.includes(prev)) break;
    streak += 1;
    cursor = prev;
  }
  return { streak, lastActivityDate };
}

async function main() {
  console.log(apply ? "MODE: --apply" : "MODE: --dry-run (no writes)");
  const now = new Date();

  const rows = await sql`
    SELECT
      p.user_id,
      p.streak AS stored_streak,
      p.last_activity_date AS stored_last,
      lp.completed_at,
      lp.last_viewed_at,
      lp.completed,
      lp.percentage
    FROM profile p
    LEFT JOIN lesson_progress lp ON lp.user_id = p.user_id
  `;

  const byUser = new Map<
    string,
    { storedStreak: number; storedLast: string | null; keys: string[] }
  >();

  for (const row of rows) {
    const userId = String(row.user_id);
    let entry = byUser.get(userId);
    if (!entry) {
      entry = {
        storedStreak: Number(row.stored_streak ?? 0),
        storedLast: (row.stored_last as string | null) ?? null,
        keys: [],
      };
      byUser.set(userId, entry);
    }
    const qualifies = Boolean(row.completed) || Number(row.percentage ?? 0) > 0;
    if (!qualifies) continue;
    const stamp = (row.completed_at as Date | string | null) ?? (row.last_viewed_at as Date | string | null);
    if (!stamp) continue;
    entry.keys.push(istDateKey(new Date(stamp)));
  }

  const preview = [...byUser.entries()].map(([userId, entry]) => {
    const next = streakFromKeys(entry.keys);
    return {
      userId,
      stored_streak: entry.storedStreak,
      stored_last: entry.storedLast,
      next_streak: next.streak,
      next_last: next.lastActivityDate,
      displayed_now: displayedStreak(next.streak, next.lastActivityDate, now),
    };
  });

  console.table(preview);
  console.log(`users: ${preview.length}`);

  if (!apply) return;

  for (const row of preview) {
    await sql`
      UPDATE profile
      SET
        streak = ${row.next_streak},
        last_activity_date = ${row.next_last},
        updated_at = now()
      WHERE user_id = ${row.userId}
        AND (
          streak IS DISTINCT FROM ${row.next_streak}
          OR last_activity_date IS DISTINCT FROM ${row.next_last}
        )
    `;
  }
  console.log("backfill writes applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
