import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildDepartmentCourseCatalog } from "../src/db/catalog/department-courses";
import { DEPARTMENT_LABELS, DEPARTMENT_LEVELS, LEVEL_LABELS, LEVELS } from "../src/constants/navigation";
import type { DepartmentId } from "../src/types";

const catalog = buildDepartmentCourseCatalog();
const generatedAt = new Date().toISOString().slice(0, 10);

const depts = [...new Set(catalog.map((c) => c.departmentId))] as DepartmentId[];

let md = `# Nexus Course Catalog

**Generated:** ${generatedAt}  
**Total courses:** ${catalog.length}  
**Tracks:** department-specific career levels (Digital Marketing unchanged at 8×3; most departments 5 levels with merged 6-course bands; HR 4 levels).  

Source of truth in code: \`src/db/catalog/department-courses.ts\`  
Seed / refresh: \`npm run db:seed-catalog\`  
Thumbnail refresh: \`npm run db:update-catalog-thumbs\`

Each course includes:
- 1 module
- 3 lessons (intro video · concepts article · practice lab)
- Unique thumbnail (\`picsum.photos/seed/{slug}\`)
- Published status in Neon

---

## Quick stats

| Department | Courses |
|------------|---------|
${depts.map((d) => `| ${DEPARTMENT_LABELS[d]} | ${catalog.filter((c) => c.departmentId === d).length} |`).join("\n")}

| Level | Courses |
|-------|---------|
${LEVELS.filter((l) => catalog.some((c) => c.level === l))
  .map((l) => `| ${LEVEL_LABELS[l]} | ${catalog.filter((c) => c.level === l).length} |`)
  .join("\n")}

---

## How to find courses in the app

| Surface | URL |
|---------|-----|
| Learner catalog | \`/dashboard/courses\` |
| Departments | \`/dashboard/departments\` |
| Admin course list | \`/dashboard/admin/courses\` |
| Direct course | \`/dashboard/courses/{slug}\` |

---

## Full matrix by department

`;

for (const dept of depts) {
  md += `### ${DEPARTMENT_LABELS[dept]}\n\n`;
  for (const level of DEPARTMENT_LEVELS[dept]) {
    const rows = catalog.filter((c) => c.departmentId === dept && c.level === level);
    if (!rows.length) continue;
    md += `#### ${LEVEL_LABELS[level]}\n\n`;
    md += `| # | Title | Slug | Duration | XP | Thumbnail |\n`;
    md += `|---|-------|------|----------|----|-----------|\n`;
    rows.forEach((c, i) => {
      md += `| ${i + 1} | ${c.title} | \`${c.slug}\` | ${Math.round(c.durationMinutes / 60)}h | ${c.xpReward} | [img](${c.thumbnailUrl}) |\n`;
    });
    md += `\n`;
  }
}

md += `---

## Lesson pattern (every course)

1. **Introduction** — video (department-relevant YouTube embed, preview unlocked)
2. **Core Concepts** — markdown article
3. **Practice Lab** — article or external resource link

---

## Related docs

- Product roadmap: \`docs/PRODUCT_ROADMAP.md\`
- Catalog canvas (IDE): \`canvases/department-course-catalog.canvas.tsx\`
`;

const out = join(process.cwd(), "docs", "COURSE_CATALOG.md");
writeFileSync(out, md, "utf8");
console.log(`Wrote ${out} (${catalog.length} courses)`);
