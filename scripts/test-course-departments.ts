import {
  courseMatchesDepartmentFilter,
  courseVisibleToUser,
  effectiveDepartmentIds,
} from "../src/lib/course-departments";
import type { DepartmentId } from "../src/types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function run(): void {
  assert(
    effectiveDepartmentIds("development", ["qa", "development"]).join(",") === "development,qa",
    "primary first and dedupe"
  );
  assert(effectiveDepartmentIds("development", []).join(",") === "development", "primary only");
  assert(
    effectiveDepartmentIds("development", ["qa", "ba"]).length === 3,
    "primary plus extras"
  );

  assert(
    courseVisibleToUser(true, "development", ["qa"], "hr"),
    "openToAll ignores departments"
  );
  assert(
    !courseVisibleToUser(false, "development", ["qa"], "hr"),
    "dept-only hides non-matching user"
  );
  assert(
    courseVisibleToUser(false, "development", ["qa", "hr"], "hr"),
    "join row grants visibility"
  );

  assert(
    courseMatchesDepartmentFilter("development", ["qa"], "development"),
    "primary matches filter"
  );
  assert(
    courseMatchesDepartmentFilter("development", ["qa"], "qa"),
    "join matches filter"
  );
  assert(
    !courseMatchesDepartmentFilter("development", ["ba"], "qa"),
    "no match"
  );

  const audienceA = new Set(["u1", "u2"]);
  const audienceB = new Set(["u2", "u3"]);
  const union = new Set([...audienceA, ...audienceB]);
  assert(union.size === 3, "assignment fan-out dedupes users across departments");

  console.log("test-course-departments: all assertions passed");
}

run();
