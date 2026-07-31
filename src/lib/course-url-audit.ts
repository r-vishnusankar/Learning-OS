import type { CatalogCourse } from "@/db/catalog/department-courses";
import { youtubeVideoId } from "@/lib/media-embed";
import type { DepartmentId, LearningLevel } from "@/types";

export const COURSE_URL_PREFIX = "/dashboard/courses/";

export type AuditStatus = "Pass" | "Fail";

export type CourseUrlAuditRow = {
  courseName: string;
  courseId: string | null;
  expectedCourseUrl: string;
  actualCourseUrl: string;
  urlStatus: AuditStatus;
  urlNotes: string;
  expectedVideoUrl: string;
  actualVideoUrl: string;
  videoStatus: AuditStatus;
  videoNotes: string;
  overallStatus: AuditStatus;
  slug: string;
  departmentId: DepartmentId;
  level: LearningLevel;
};

export type DbCourseAuditSnapshot = {
  id: string;
  slug: string;
  title: string;
  departmentId: string;
  level: string;
  introVideoContent: string | null;
};

export type CourseUrlAuditResult = {
  rows: CourseUrlAuditRow[];
  summary: {
    total: number;
    urlPass: number;
    urlFail: number;
    videoPass: number;
    videoFail: number;
    overallPass: number;
    overallFail: number;
    missingInDb: number;
    duplicateSlugs: string[];
    extraInDb: Array<{ id: string; slug: string; title: string }>;
    sharedVideoWarnings: Array<{ videoId: string; courseTitles: string[] }>;
  };
};

const DEPTS: DepartmentId[] = [
  "qa",
  "development",
  "ba",
  "hr",
  "marketing",
  "uiux",
  "devops",
];

const LEVELS: LearningLevel[] = [
  "beginner",
  "associate",
  "intermediate",
  "advanced",
  "senior",
  "lead",
  "architect",
  "expert",
];

function courseUrlForSlug(slug: string): string {
  return `${COURSE_URL_PREFIX}${slug}`;
}

function slugMatchesDeptLevel(slug: string, departmentId: string, level: string): boolean {
  const parts = slug.split("-");
  if (!DEPTS.includes(parts[0] as DepartmentId) || !LEVELS.includes(parts[1] as LearningLevel)) {
    return false;
  }
  return parts[0] === departmentId && parts[1] === level;
}

function evaluateUrl(
  expected: CatalogCourse,
  db: DbCourseAuditSnapshot | undefined
): Pick<CourseUrlAuditRow, "actualCourseUrl" | "urlStatus" | "urlNotes" | "courseId"> {
  if (!db) {
    return {
      courseId: null,
      actualCourseUrl: "",
      urlStatus: "Fail",
      urlNotes: "Missing in database",
    };
  }

  const expectedUrl = courseUrlForSlug(expected.slug);
  const actualUrl = courseUrlForSlug(db.slug);
  const notes: string[] = [];

  if (db.slug !== expected.slug) {
    notes.push(`Slug mismatch (db: ${db.slug})`);
  }
  if (db.departmentId !== expected.departmentId || db.level !== expected.level) {
    notes.push(
      `Dept/level mismatch (db: ${db.departmentId}/${db.level})`
    );
  }
  if (!slugMatchesDeptLevel(db.slug, db.departmentId, db.level)) {
    notes.push("Slug prefix does not match department_id/level columns");
  }
  if (db.title !== expected.title) {
    notes.push("Title mismatch vs catalog");
  }

  const pass =
    db.slug === expected.slug &&
    actualUrl === expectedUrl &&
    db.departmentId === expected.departmentId &&
    db.level === expected.level &&
    slugMatchesDeptLevel(db.slug, db.departmentId, db.level);

  return {
    courseId: db.id,
    actualCourseUrl: actualUrl,
    urlStatus: pass ? "Pass" : "Fail",
    urlNotes: notes.length ? notes.join("; ") : "OK",
  };
}

function evaluateVideo(
  expectedVideoUrl: string,
  actualContent: string | null | undefined
): Pick<CourseUrlAuditRow, "actualVideoUrl" | "videoStatus" | "videoNotes"> {
  const expectedId = youtubeVideoId(expectedVideoUrl);
  const actualRaw = actualContent?.trim() ?? "";
  const actualId = youtubeVideoId(actualRaw);

  if (!expectedVideoUrl) {
    return {
      actualVideoUrl: actualRaw,
      videoStatus: "Fail",
      videoNotes: "Catalog missing expected video",
    };
  }

  if (!actualRaw) {
    return {
      actualVideoUrl: "",
      videoStatus: "Fail",
      videoNotes: "No intro video lesson in database",
    };
  }

  if (!expectedId || !actualId) {
    return {
      actualVideoUrl: actualRaw,
      videoStatus: "Fail",
      videoNotes: "Could not parse YouTube id from URL",
    };
  }

  if (expectedId !== actualId) {
    return {
      actualVideoUrl: actualRaw,
      videoStatus: "Fail",
      videoNotes: `Video id mismatch (expected ${expectedId}, actual ${actualId})`,
    };
  }

  return {
    actualVideoUrl: actualRaw,
    videoStatus: "Pass",
    videoNotes: "OK",
  };
}

export function buildCourseUrlAudit(
  catalog: CatalogCourse[],
  dbCourses: DbCourseAuditSnapshot[]
): CourseUrlAuditResult {
  const bySlug = new Map(dbCourses.map((c) => [c.slug, c]));
  const catalogSlugs = new Set(catalog.map((c) => c.slug));

  const slugCounts = new Map<string, number>();
  for (const c of dbCourses) {
    slugCounts.set(c.slug, (slugCounts.get(c.slug) ?? 0) + 1);
  }
  const duplicateSlugs = [...slugCounts.entries()]
    .filter(([, n]) => n > 1)
    .map(([slug]) => slug);

  const extraInDb = dbCourses
    .filter((c) => !catalogSlugs.has(c.slug))
    .map((c) => ({ id: c.id, slug: c.slug, title: c.title }));

  const rows: CourseUrlAuditRow[] = catalog.map((expected) => {
    const db = bySlug.get(expected.slug);
    const expectedVideo =
      expected.expectedVideoUrl ||
      expected.lessons.find((l) => l.type === "video")?.content ||
      "";

    const urlEval = evaluateUrl(expected, db);
    const videoEval = evaluateVideo(expectedVideo, db?.introVideoContent);

    const overallStatus: AuditStatus =
      urlEval.urlStatus === "Pass" && videoEval.videoStatus === "Pass" ? "Pass" : "Fail";

    return {
      courseName: expected.title,
      slug: expected.slug,
      departmentId: expected.departmentId,
      level: expected.level,
      courseId: urlEval.courseId,
      expectedCourseUrl: courseUrlForSlug(expected.slug),
      actualCourseUrl: urlEval.actualCourseUrl,
      urlStatus: urlEval.urlStatus,
      urlNotes: urlEval.urlNotes,
      expectedVideoUrl: expectedVideo,
      actualVideoUrl: videoEval.actualVideoUrl,
      videoStatus: videoEval.videoStatus,
      videoNotes: videoEval.videoNotes,
      overallStatus,
    };
  });

  // Shared video across different course titles (catalog expected ids)
  const byVideoId = new Map<string, string[]>();
  for (const r of rows) {
    const id = youtubeVideoId(r.expectedVideoUrl);
    if (!id) continue;
    const titles = byVideoId.get(id) ?? [];
    titles.push(r.courseName);
    byVideoId.set(id, titles);
  }
  const sharedVideoWarnings = [...byVideoId.entries()]
    .filter(([, titles]) => titles.length > 1)
    .map(([videoId, courseTitles]) => ({ videoId, courseTitles }));

  let urlPass = 0;
  let urlFail = 0;
  let videoPass = 0;
  let videoFail = 0;
  let overallPass = 0;
  let overallFail = 0;
  let missingInDb = 0;

  for (const r of rows) {
    if (r.urlStatus === "Pass") urlPass++;
    else urlFail++;
    if (r.videoStatus === "Pass") videoPass++;
    else videoFail++;
    if (r.overallStatus === "Pass") overallPass++;
    else overallFail++;
    if (!r.courseId) missingInDb++;
  }

  if (duplicateSlugs.length) {
    for (const r of rows) {
      if (duplicateSlugs.includes(r.slug)) {
        if (r.urlStatus === "Pass") {
          r.urlStatus = "Fail";
          r.urlNotes =
            r.urlNotes === "OK"
              ? "Duplicate slug in database"
              : `${r.urlNotes}; Duplicate slug in database`;
        }
        r.overallStatus = "Fail";
      }
    }
    urlPass = rows.filter((r) => r.urlStatus === "Pass").length;
    urlFail = rows.length - urlPass;
    overallPass = rows.filter((r) => r.overallStatus === "Pass").length;
    overallFail = rows.length - overallPass;
  }

  return {
    rows,
    summary: {
      total: rows.length,
      urlPass,
      urlFail,
      videoPass,
      videoFail,
      overallPass,
      overallFail,
      missingInDb,
      duplicateSlugs,
      extraInDb,
      sharedVideoWarnings,
    },
  };
}

function escMdCell(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

/** Course name vs expected/actual intro video — primary release checklist for videos. */
export function formatCourseVideoCheckSection(rows: CourseUrlAuditRow[]): string {
  const sorted = [...rows].sort((a, b) => a.courseName.localeCompare(b.courseName));

  let md = `## Course ↔ video check

Per-course intro video: **Expected** (catalog) vs **Actual** (first video lesson in DB).

| Course | Expected video URL | Actual video URL | Video check |
|--------|--------------------|------------------|-------------|
`;

  for (const r of sorted) {
    const actual = r.actualVideoUrl || "—";
    const note =
      r.videoStatus === "Fail" && r.videoNotes && r.videoNotes !== "OK"
        ? ` — ${r.videoNotes}`
        : "";
    md += `| ${escMdCell(r.courseName)} | ${escMdCell(r.expectedVideoUrl)} | ${escMdCell(actual)} | ${r.videoStatus}${escMdCell(note)} |\n`;
  }

  md += `\n### Expected video → courses\n\n`;
  md += `Grouped by YouTube id from **expected** catalog video (shared ids are placeholders).\n\n`;
  md += `| YouTube ID | Watch URL | Courses |\n|------------|-----------|--------|\n`;

  const byVideoId = new Map<string, { embed: string; titles: string[] }>();
  for (const r of rows) {
    const id = youtubeVideoId(r.expectedVideoUrl) ?? r.expectedVideoUrl;
    const existing = byVideoId.get(id);
    if (existing) {
      existing.titles.push(r.courseName);
    } else {
      byVideoId.set(id, {
        embed: r.expectedVideoUrl,
        titles: [r.courseName],
      });
    }
  }

  const groups = [...byVideoId.entries()].sort(
    (a, b) => b[1].titles.length - a[1].titles.length || a[0].localeCompare(b[0])
  );

  for (const [id, { titles }] of groups) {
    const watch =
      id.length === 11 && !id.startsWith("http")
        ? `https://www.youtube.com/watch?v=${id}`
        : id;
    md += `| \`${id}\` | ${watch} | ${escMdCell(titles.join("; "))} |\n`;
  }

  md += `\n`;
  return md;
}

export function formatCourseUrlAuditMarkdown(result: CourseUrlAuditResult): string {
  const { summary, rows } = result;
  const date = new Date().toISOString().slice(0, 10);

  let md = `# Course URL + Video Audit

**Generated:** ${date}  
**Catalog courses:** ${summary.total}  
**Overall Pass:** ${summary.overallPass} · **Fail:** ${summary.overallFail}

## Summary

| Check | Count |
|-------|-------|
| URL Pass | ${summary.urlPass} |
| URL Fail | ${summary.urlFail} |
| Video Pass | ${summary.videoPass} |
| Video Fail | ${summary.videoFail} |
| Missing in DB | ${summary.missingInDb} |
| Duplicate slugs | ${summary.duplicateSlugs.length} |
| Extra (non-catalog) in DB | ${summary.extraInDb.length} |
| Shared-video warnings | ${summary.sharedVideoWarnings.length} |

`;

  if (summary.duplicateSlugs.length) {
    md += `### Duplicate slugs\n\n${summary.duplicateSlugs.map((s) => `- \`${s}\``).join("\n")}\n\n`;
  }

  if (summary.extraInDb.length) {
    md += `### Extra courses in DB (not in catalog matrix)\n\n`;
    md += `| Slug | Title |\n|------|-------|\n`;
    md += summary.extraInDb.map((e) => `| \`${e.slug}\` | ${e.title} |`).join("\n");
    md += `\n\n`;
  }

  if (summary.sharedVideoWarnings.length) {
    md += `### Shared video warnings (same YouTube id, multiple courses)\n\n`;
    for (const w of summary.sharedVideoWarnings) {
      md += `- **${w.videoId}**: ${w.courseTitles.join(", ")}\n`;
    }
    md += `\n`;
  }

  md += formatCourseVideoCheckSection(rows);

  md += `## Full audit table

| Course Name | Course ID | Expected Course URL | Actual Course URL | URL Status | Expected Video URL | Actual Video URL | Video Status | Overall Status |
|-------------|-----------|---------------------|-------------------|------------|--------------------|------------------|--------------|----------------|
`;

  for (const r of rows) {
    md += `| ${escMdCell(r.courseName)} | ${r.courseId ?? "—"} | ${escMdCell(r.expectedCourseUrl)} | ${escMdCell(r.actualCourseUrl || "—")} | ${r.urlStatus} | ${escMdCell(r.expectedVideoUrl)} | ${escMdCell(r.actualVideoUrl || "—")} | ${r.videoStatus} | ${r.overallStatus} |\n`;
  }

  md += `\nRun: \`npm run db:audit-catalog\`\n`;
  return md;
}
