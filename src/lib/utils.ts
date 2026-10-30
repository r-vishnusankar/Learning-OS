import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatPercent(n: number): string {
  return `${Math.round(n)}%`;
}

export function formatHours(n: number): string {
  if (n === 0) return "—";
  if (n < 1) return `${Math.round(n * 60)}m`;
  const h = Math.floor(n);
  const m = Math.round((n - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Tracked time: 0 means none learned, not unknown duration. */
export function formatTrackedHours(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0h";
  return formatHours(n);
}

/** True for in-progress assessment attempt routes: /dashboard/assessments/:id/attempt/:attemptId */
export function isExamRoute(pathname: string | null) {
  if (!pathname) return false;
  return /\/dashboard\/assessments\/[^/]+\/attempt\/[^/]+/.test(pathname);
}
