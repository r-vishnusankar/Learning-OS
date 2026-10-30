import { bucketWeeklyHours, istDateKey, startOfIstWeek, toIstParts } from "../src/lib/ist";
import { formatHours, formatTrackedHours } from "../src/lib/utils";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function run(): void {
  // 2026-10-30 10:00 UTC = 2026-10-30 15:30 IST Friday
  const fridayUtc = new Date("2026-10-30T10:00:00.000Z");
  const parts = toIstParts(fridayUtc);
  assert(parts.year === 2026 && parts.month === 9 && parts.day === 30, "IST calendar date");
  assert(parts.weekday === 5, "Friday weekday");
  assert(istDateKey(fridayUtc) === "2026-10-30", "IST date key");

  const weekStart = startOfIstWeek(fridayUtc);
  assert(weekStart.toISOString() === "2026-10-25T18:30:00.000Z", "Monday 00:00 IST");

  const previousSunday = new Date("2026-10-25T10:00:00.000Z");
  const fridayLesson = new Date("2026-10-30T09:00:00.000Z");
  const mondayLesson = new Date("2026-10-26T00:00:00.000Z"); // 05:30 IST Monday

  const weekly = bucketWeeklyHours(
    [
      { completedAt: previousSunday, durationMinutes: 60 },
      { completedAt: mondayLesson, durationMinutes: 30 },
      { completedAt: fridayLesson, durationMinutes: 20 },
      { completedAt: null, durationMinutes: 45 },
    ],
    fridayUtc
  );

  assert(weekly.hours.length === 7, "7 weekday bars");
  assert(weekly.hours[0].label === "Mon" && weekly.hours[0].value === 0.5, "Monday 30m");
  assert(weekly.hours[4].label === "Fri" && weekly.hours[4].value === 20 / 60, "Friday 20m");
  assert(weekly.hours[6].value === 0, "Sunday previous week excluded");
  assert(weekly.todayMinutes === 20, "today is Friday 20m");
  assert(weekly.completedCount === 2, "two dated completions this week");

  const empty = bucketWeeklyHours([], fridayUtc);
  assert(empty.todayMinutes === 0 && empty.completedCount === 0, "new user weekly zeros");
  assert(empty.hours.every((p) => p.value === 0), "new user bars are 0");

  assert(formatHours(0) === "—", "formatHours 0 stays unknown");
  assert(formatTrackedHours(0) === "0h", "tracked 0 is 0h");
  assert(formatTrackedHours(20 / 60) === "20m", "20 minutes displays as 20m");
}

run();
console.log("test-ist: all assertions passed");
