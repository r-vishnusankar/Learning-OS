import type { DepartmentId } from "@/types";

/** Primary department first, then any join rows (deduped). */
export function effectiveDepartmentIds(
  primaryDepartmentId: DepartmentId,
  joinRows: DepartmentId[] | undefined
): DepartmentId[] {
  const seen = new Set<DepartmentId>();
  const out: DepartmentId[] = [];
  const add = (id: DepartmentId) => {
    if (seen.has(id)) return;
    seen.add(id);
    out.push(id);
  };
  add(primaryDepartmentId);
  for (const id of joinRows ?? []) {
    add(id);
  }
  return out;
}

export function courseVisibleToUser(
  openToAll: boolean,
  primaryDepartmentId: DepartmentId,
  joinRows: DepartmentId[] | undefined,
  userDepartmentId?: string
): boolean {
  if (openToAll) return true;
  if (!userDepartmentId) return false;
  return effectiveDepartmentIds(primaryDepartmentId, joinRows).includes(
    userDepartmentId as DepartmentId
  );
}

export function courseMatchesDepartmentFilter(
  primaryDepartmentId: DepartmentId,
  joinRows: DepartmentId[] | undefined,
  filterDepartmentId: DepartmentId
): boolean {
  return effectiveDepartmentIds(primaryDepartmentId, joinRows).includes(filterDepartmentId);
}
