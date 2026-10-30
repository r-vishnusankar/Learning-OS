import { pickTopXp, rollupDepartmentCells } from "../src/lib/department-metrics";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function run(): void {
  const empty = rollupDepartmentCells([]);
  assert(empty.avgCompletion === 0, "empty avg 0");
  assert(empty.completedCount === 0 && empty.inProgressCount === 0, "empty counts 0");
  assert(empty.enrollmentRatePct === null, "empty enrollment is unknown");

  const nobodyStarted = rollupDepartmentCells([
    { percent: 0, status: "not_started" },
    { percent: 0, status: "not_started" },
    { percent: 0, status: "not_started" },
  ]);
  assert(nobodyStarted.avgCompletion === 0, "nobody started → 0% not a seeded 75");
  assert(nobodyStarted.completedCount === 0 && nobodyStarted.inProgressCount === 0, "nobody started counts");
  assert(nobodyStarted.enrollmentRatePct === 0, "nobody started enrollment 0");

  const mixed = rollupDepartmentCells([
    { percent: 100, status: "completed" },
    { percent: 80, status: "content_complete" },
    { percent: 0, status: "not_started" },
    { percent: 50, status: "in_progress" },
  ]);
  assert(mixed.avgCompletion === 58, "round (100+80+0+50)/4 = 58");
  assert(mixed.completedCount === 1, "one completed pair");
  assert(mixed.inProgressCount === 2, "content_complete + in_progress");
  assert(mixed.enrollmentRatePct === 75, "3 of 4 started");

  assert(pickTopXp([]) === null, "no members → no top XP");
  const tied = pickTopXp([
    { userId: "b", name: "Bea", xp: 100 },
    { userId: "a", name: "Ada", xp: 100 },
    { userId: "c", name: "Cy", xp: 90 },
  ]);
  assert(tied?.userId === "a", "XP tie broken by name then id");
}

run();
console.log("test-department-hub: all assertions passed");
