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
  if (n < 1) return `${Math.round(n * 60)}m`;
  return `${n.toFixed(n % 1 === 0 ? 0 : 1)}h`;
}
