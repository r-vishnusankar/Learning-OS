import type { CodingCheck, CodingCheckResult } from "@/types/coding";

export function evaluateCodingChecks(
  code: string,
  checks: CodingCheck[]
): CodingCheckResult[] {
  const text = code ?? "";
  const lines = text.split(/\r?\n/);

  return checks.map((check) => {
    let passed = false;
    let detail = "";

    switch (check.kind) {
      case "contains": {
        passed = text.toLowerCase().includes(check.value.toLowerCase());
        detail = passed
          ? `Found expected snippet.`
          : `Missing required content for “${check.label}”.`;
        break;
      }
      case "not_contains": {
        passed = !text.toLowerCase().includes(check.value.toLowerCase());
        detail = passed
          ? `No forbidden pattern found.`
          : `Remove or replace the disallowed pattern for “${check.label}”.`;
        break;
      }
      case "regex": {
        try {
          const re = new RegExp(check.value, "im");
          passed = re.test(text);
          detail = passed
            ? `Pattern matched.`
            : `Code does not match the expected pattern for “${check.label}”.`;
        } catch {
          passed = false;
          detail = `Invalid check pattern configured for “${check.label}”.`;
        }
        break;
      }
      case "min_lines": {
        const min = Math.max(1, Number(check.value) || 1);
        const nonEmpty = lines.filter((l) => l.trim().length > 0).length;
        passed = nonEmpty >= min;
        detail = passed
          ? `${nonEmpty} non-empty lines (need ≥ ${min}).`
          : `Only ${nonEmpty} non-empty lines — need at least ${min}.`;
        break;
      }
      case "min_chars": {
        const min = Math.max(1, Number(check.value) || 1);
        const len = text.trim().length;
        passed = len >= min;
        detail = passed
          ? `${len} characters (need ≥ ${min}).`
          : `Only ${len} characters — need at least ${min}.`;
        break;
      }
      default:
        detail = "Unknown check type.";
    }

    return { id: check.id, label: check.label, passed, detail };
  });
}

export function codingChecksSummary(results: CodingCheckResult[]) {
  const passed = results.filter((r) => r.passed).length;
  return {
    passed,
    total: results.length,
    allPassed: results.length > 0 && passed === results.length,
    percentage: results.length ? Math.round((passed / results.length) * 100) : 0,
  };
}

export const DEFAULT_CODING_CHECKS: CodingCheck[] = [
  {
    id: "min-lines",
    label: "Has a real implementation (not empty)",
    kind: "min_lines",
    value: "3",
  },
  {
    id: "no-todo",
    label: "No leftover TODO / placeholder",
    kind: "not_contains",
    value: "TODO",
  },
  {
    id: "no-pass",
    label: "No stub `pass` / `...` only answers",
    kind: "not_contains",
    value: "...",
  },
];
