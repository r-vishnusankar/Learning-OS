import { displayedStreak, nextStreakState } from "../src/lib/streak";
import { istDateKey } from "../src/lib/ist";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function run(): void {
  const monday = new Date("2026-10-26T10:00:00.000Z"); // 15:30 IST Monday
  const tuesday = new Date("2026-10-27T10:00:00.000Z");
  const wednesday = new Date("2026-10-28T10:00:00.000Z");
  const friday = new Date("2026-10-30T10:00:00.000Z");

  const first = nextStreakState({ streak: 0, lastActivityDate: null }, monday);
  assert(first.streak === 1 && first.lastActivityDate === "2026-10-26", "first activity → 1");

  const sameDay = nextStreakState(first, new Date("2026-10-26T18:00:00.000Z"));
  assert(sameDay.streak === 1 && sameDay.lastActivityDate === "2026-10-26", "same IST day twice → no change");

  const consecutive = nextStreakState(first, tuesday);
  assert(consecutive.streak === 2 && consecutive.lastActivityDate === "2026-10-27", "yesterday → +1");

  const three = nextStreakState(consecutive, wednesday);
  assert(three.streak === 3, "third consecutive day");

  const gap = nextStreakState(three, friday);
  assert(gap.streak === 1 && gap.lastActivityDate === "2026-10-30", "gap > 1 day → reset to 1");

  const seeded = displayedStreak(14, null, friday);
  assert(seeded === 0, "stored streak with no last activity displays 0");

  assert(displayedStreak(3, "2026-10-30", friday) === 3, "activity today displays stored");
  assert(displayedStreak(3, "2026-10-29", friday) === 3, "activity yesterday still displays");
  assert(displayedStreak(3, "2026-10-28", friday) === 0, "activity before yesterday displays 0");

  // 18:29 UTC 29 Oct = 23:59 IST 29 Oct; 18:30 UTC = 00:00 IST 30 Oct
  const beforeMidnightIst = new Date("2026-10-29T18:29:00.000Z");
  const atMidnightIst = new Date("2026-10-29T18:30:00.000Z");
  assert(istDateKey(beforeMidnightIst) === "2026-10-29", "23:59 IST is still the 29th");
  assert(istDateKey(atMidnightIst) === "2026-10-30", "00:00 IST is the 30th");

  const late = nextStreakState({ streak: 4, lastActivityDate: "2026-10-28" }, beforeMidnightIst);
  assert(late.streak === 5 && late.lastActivityDate === "2026-10-29", "23:59 IST continues from 28th");

  const rolled = nextStreakState({ streak: 4, lastActivityDate: "2026-10-28" }, atMidnightIst);
  assert(rolled.streak === 1 && rolled.lastActivityDate === "2026-10-30", "00:00 IST gap resets");

  const utc2330 = new Date("2026-10-29T23:30:00.000Z"); // 05:00 IST 30 Oct
  assert(istDateKey(utc2330) === "2026-10-30", "23:30 UTC is next IST day");
}

run();
console.log("test-streak: all assertions passed");
