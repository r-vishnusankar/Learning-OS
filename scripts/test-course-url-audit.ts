import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CatalogCourse } from "../src/db/catalog/department-courses";
import { buildDepartmentCourseCatalog } from "../src/db/catalog/department-courses";
import { runCourseUrlAudit } from "../src/db/queries/course-url-audit";
import {
  buildCourseUrlAudit,
  formatCourseUrlAuditMarkdown,
  formatCourseVideoCheckSection,
  type DbCourseAuditSnapshot,
} from "../src/lib/course-url-audit";

config({ path: ".env.local" });

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function mockCatalog(partial: Pick<CatalogCourse, "slug" | "title" | "departmentId" | "level" | "expectedVideoUrl">): CatalogCourse {
  return {
    ...partial,
    description: "",
    difficulty: "beginner",
    durationMinutes: 60,
    xpReward: 100,
    tags: [],
    thumbnailUrl: "",
    lessons: [],
  };
}

function runUnitTests(): void {
  const video = "https://www.youtube.com/embed/rfscVS0vtbw";
  const catalog = [
    mockCatalog({
      slug: "development-beginner-programming-fundamentals",
      title: "Programming Fundamentals",
      departmentId: "development",
      level: "beginner",
      expectedVideoUrl: video,
    }),
  ];

  const passDb: DbCourseAuditSnapshot[] = [
    {
      id: "id-1",
      slug: "development-beginner-programming-fundamentals",
      title: "Programming Fundamentals",
      departmentId: "development",
      level: "beginner",
      introVideoContent: video,
    },
  ];

  const passResult = buildCourseUrlAudit(catalog, passDb);
  assert(passResult.rows.length === 1, "one catalog row");
  assert(passResult.rows[0]!.videoStatus === "Pass", "matching video passes");
  assert(passResult.rows[0]!.urlStatus === "Pass", "matching url passes");

  const mismatchDb: DbCourseAuditSnapshot[] = [
    {
      ...passDb[0]!,
      introVideoContent: "https://www.youtube.com/embed/wrong000000",
    },
  ];
  const failResult = buildCourseUrlAudit(catalog, mismatchDb);
  assert(failResult.rows[0]!.videoStatus === "Fail", "mismatch video fails");
  assert(failResult.summary.videoFail === 1, "video fail count");

  const missingDb = buildCourseUrlAudit(catalog, []);
  assert(missingDb.rows[0]!.videoStatus === "Fail", "missing db fails video");
  assert(missingDb.summary.missingInDb === 1, "missing in db counted");

  const mdSection = formatCourseVideoCheckSection(passResult.rows);
  assert(mdSection.includes("Course ↔ video check"), "video check section title");
  assert(mdSection.includes("Expected video → courses"), "grouped video section");
  assert(mdSection.includes("Programming Fundamentals"), "course name in section");

  const fullMd = formatCourseUrlAuditMarkdown(passResult);
  assert(fullMd.includes("Course ↔ video check"), "full md includes video check");
}

function runCatalogStructureTests(): void {
  const catalog = buildDepartmentCourseCatalog();
  assert(catalog.length === 168, `catalog has 168 courses (got ${catalog.length})`);

  const titles = catalog.map((c) => c.title);
  assert(new Set(titles).size === titles.length, "no duplicate course titles");

  const byDept = new Map<string, typeof catalog>();
  for (const c of catalog) {
    const list = byDept.get(c.departmentId) ?? [];
    list.push(c);
    byDept.set(c.departmentId, list);
  }

  for (const dept of ["development", "qa", "ba", "uiux", "devops"] as const) {
    const rows = byDept.get(dept) ?? [];
    assert(rows.length === 24, `${dept} has 24 courses (got ${rows.length})`);
  }
  assert((byDept.get("hr") ?? []).length === 24, "hr has 24 courses");
  assert((byDept.get("marketing") ?? []).length === 24, "marketing has 24 courses");

  const levelsOf = (dept: string) =>
    [...new Set((byDept.get(dept) ?? []).map((c) => c.level))];

  assert(
    levelsOf("development").join(",") === "associate,advanced,senior,lead,architect",
    "development level order"
  );
  assert(levelsOf("qa").join(",") === "associate,advanced,senior,lead,qa_manager", "qa level order");
  assert(
    levelsOf("ba").join(",") === "associate,advanced,senior,lead,product_owner",
    "ba level order"
  );
  assert(
    levelsOf("hr").join(",") === "associate,advanced,assistant_hr_manager,hr_manager",
    "hr level order"
  );
  assert(
    levelsOf("marketing").join(",") ===
      "beginner,associate,intermediate,advanced,senior,lead,architect,expert",
    "marketing level order unchanged"
  );

  const count = (dept: string, level: string) =>
    (byDept.get(dept) ?? []).filter((c) => c.level === level).length;

  assert(count("development", "associate") === 6, "dev associate has 6 courses");
  assert(count("development", "advanced") === 6, "dev advanced has 6 courses");
  assert(count("development", "senior") === 3, "dev senior has 3 courses");
  assert(count("development", "architect") === 6, "dev architect has 6 courses");
  assert(count("qa", "qa_manager") === 6, "qa manager has 6 courses");
  assert(count("ba", "product_owner") === 6, "product owner has 6 courses");
  assert(count("hr", "assistant_hr_manager") === 6, "assistant hr manager has 6 courses");
  assert(count("hr", "hr_manager") === 6, "hr manager has 6 courses");
  assert(count("marketing", "beginner") === 3, "marketing beginner still 3");
  assert(count("marketing", "expert") === 3, "marketing expert still 3");

  const marketingTitles = (byDept.get("marketing") ?? []).map((c) => c.title);
  for (const title of [
    "Digital Marketing Foundations",
    "Brand Messaging Basics",
    "Content Writing 101",
    "SEO Essentials",
    "CMO Partnership",
  ]) {
    assert(marketingTitles.includes(title), `marketing still has ${title}`);
  }

  assert(
    catalog.some((c) => c.slug === "development-associate-programming-fundamentals"),
    "Programming Fundamentals moved to associate slug"
  );
  assert(
    !catalog.some((c) => c.departmentId === "development" && c.level === "beginner"),
    "development has no beginner level"
  );
}

async function runIntegrationTests(): Promise<void> {
  const catalog = buildDepartmentCourseCatalog();
  assert(catalog.length === 168, `catalog has 168 courses (got ${catalog.length})`);

  if (!process.env.DATABASE_URL) {
    console.log("  SKIP DB integration (DATABASE_URL not set)");
    return;
  }

  const result = await runCourseUrlAudit();
  assert(result.summary.total === 168, `audit total 168 (got ${result.summary.total})`);
  assert(result.summary.videoFail === 0, `video fail 0 (got ${result.summary.videoFail})`);
  assert(result.summary.urlFail === 0, `url fail 0 (got ${result.summary.urlFail})`);
  assert(result.summary.missingInDb === 0, `missing in db 0 (got ${result.summary.missingInDb})`);

  const orgWide = result.rows.find((r) => r.slug.includes("org-wide-technical-strategy"));
  assert(!!orgWide, "Org-Wide Technical Strategy in audit");
  assert(orgWide!.videoStatus === "Pass", "Org-Wide video sync pass");
  assert(!!orgWide!.expectedVideoUrl, "Org-Wide has expected video");

  const videoIds = new Set(
    result.rows.map((r) => r.expectedVideoUrl).filter(Boolean)
  );
  assert(videoIds.size === 168, `expected 168 unique videos (got ${videoIds.size})`);
  assert(result.summary.sharedVideoWarnings.length === 0, "no shared-video warnings");

  const md = formatCourseUrlAuditMarkdown(result);
  const courseVideoRows = (md.match(/\| Pass \|\n/g) ?? []).length;
  assert(courseVideoRows >= 168, "markdown has Pass rows in video check table");

  const auditPath = join(process.cwd(), "docs", "COURSE_URL_AUDIT.md");
  const onDisk = readFileSync(auditPath, "utf8");
  assert(onDisk.includes("## Course ↔ video check"), "COURSE_URL_AUDIT.md has video check section");
  const passInVideoTable = onDisk.split("## Course ↔ video check")[1]?.split("## Full audit")[0] ?? "";
  const videoPassCount = (passInVideoTable.match(/\| Pass \|/g) ?? []).length;
  assert(videoPassCount === 168, `on-disk video pass count 168 (got ${videoPassCount})`);
}

async function main() {
  console.log("Course URL audit — unit tests");
  runUnitTests();
  console.log("  OK");

  console.log("Course catalog — structure tests");
  runCatalogStructureTests();
  console.log("  OK");

  console.log("Course URL audit — integration (DB + docs)");
  await runIntegrationTests();
  console.log("  OK");

  console.log("\nAll tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
