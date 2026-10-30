/** India Standard Time. Store UTC; group calendar days in IST (UTC+5:30). */

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export const IST_WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type IstCalendarParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
};

/** IST wall-clock parts of a UTC instant. weekday: 0 = Sunday. */
export function toIstParts(date: Date): IstCalendarParts {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

export function istDateKey(date: Date): string {
  const p = toIstParts(date);
  const mm = String(p.month + 1).padStart(2, "0");
  const dd = String(p.day).padStart(2, "0");
  return `${p.year}-${mm}-${dd}`;
}

/** UTC instant of Monday 00:00 IST for the week containing `date`. */
export function startOfIstWeek(date: Date): Date {
  const p = toIstParts(date);
  const daysFromMonday = (p.weekday + 6) % 7;
  const mondayUtcMidnight = Date.UTC(p.year, p.month, p.day - daysFromMonday);
  return new Date(mondayUtcMidnight - IST_OFFSET_MS);
}

export type WeeklyHourPoint = { label: string; value: number };

export function bucketWeeklyHours(
  completions: { completedAt: Date | null; durationMinutes: number }[],
  now: Date
): { hours: WeeklyHourPoint[]; todayMinutes: number; completedCount: number } {
  const weekStartMs = startOfIstWeek(now).getTime();
  const todayKey = istDateKey(now);
  const minutesByDay = [0, 0, 0, 0, 0, 0, 0];
  let todayMinutes = 0;
  let completedCount = 0;

  for (const row of completions) {
    if (!row.completedAt) continue;
    if (row.completedAt.getTime() < weekStartMs) continue;
    const parts = toIstParts(row.completedAt);
    const idx = (parts.weekday + 6) % 7;
    const mins = row.durationMinutes ?? 0;
    minutesByDay[idx] += mins;
    completedCount += 1;
    if (istDateKey(row.completedAt) === todayKey) {
      todayMinutes += mins;
    }
  }

  return {
    hours: IST_WEEKDAY_LABELS.map((label, i) => ({
      label,
      value: minutesByDay[i] / 60,
    })),
    todayMinutes,
    completedCount,
  };
}
