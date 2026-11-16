import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { courseDepartments } from "@/db/schema/courses";
import { effectiveDepartmentIds } from "@/lib/course-departments";
import type { DepartmentId } from "@/types";

export async function listDepartmentIdsByCourseIds(
  courseIds: string[]
): Promise<Map<string, DepartmentId[]>> {
  const map = new Map<string, DepartmentId[]>();
  if (courseIds.length === 0) return map;

  const db = getDb();
  try {
    const rows = await db
      .select({
        courseId: courseDepartments.courseId,
        departmentId: courseDepartments.departmentId,
      })
      .from(courseDepartments)
      .where(inArray(courseDepartments.courseId, courseIds));

    for (const row of rows) {
      const list = map.get(row.courseId) ?? [];
      list.push(row.departmentId);
      map.set(row.courseId, list);
    }
  } catch {
    // Table may not exist yet on old schema — callers fall back to primary department.
  }
  return map;
}

export async function listDepartmentIdsForCourse(courseId: string): Promise<DepartmentId[]> {
  const map = await listDepartmentIdsByCourseIds([courseId]);
  return map.get(courseId) ?? [];
}

export async function syncCourseDepartments(courseId: string, departmentIds: DepartmentId[]) {
  if (departmentIds.length === 0) return;
  const unique = effectiveDepartmentIds(departmentIds[0], departmentIds);
  const db = getDb();

  try {
    await db.delete(courseDepartments).where(eq(courseDepartments.courseId, courseId));
    for (const departmentId of unique) {
      await db.insert(courseDepartments).values({ courseId, departmentId });
    }
  } catch {
    // Join table missing — primary department_id still updated by course service.
  }
}
