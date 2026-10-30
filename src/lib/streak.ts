import { istDateKey, shiftIstDateKey } from "@/lib/ist";

export type StreakState = {
  streak: number;
  lastActivityDate: string | null;
};

export function streakCalendarKeys(now: Date = new Date()): {
  todayKey: string;
  yesterdayKey: string;
} {
  const todayKey = istDateKey(now);
  return { todayKey, yesterdayKey: shiftIstDateKey(todayKey, -1) };
}

/** First activity of the IST day updates; same day is a no-op; yesterday +1; gap resets to 1. */
export function nextStreakState(current: StreakState, now: Date = new Date()): StreakState {
  const { todayKey, yesterdayKey } = streakCalendarKeys(now);
  if (current.lastActivityDate === todayKey) {
    return current;
  }
  if (current.lastActivityDate === yesterdayKey) {
    return { streak: current.streak + 1, lastActivityDate: todayKey };
  }
  return { streak: 1, lastActivityDate: todayKey };
}

/** If last activity was before yesterday, show 0 even when the stored streak is stale. */
export function displayedStreak(
  stored: number,
  lastActivityDate: string | null | undefined,
  now: Date = new Date()
): number {
  if (!lastActivityDate) return 0;
  const { todayKey, yesterdayKey } = streakCalendarKeys(now);
  if (lastActivityDate === todayKey || lastActivityDate === yesterdayKey) {
    return stored;
  }
  return 0;
}
