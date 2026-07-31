export type CodingLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "sql"
  | "java"
  | "other";

export type CodingCheckKind =
  | "contains"
  | "not_contains"
  | "regex"
  | "min_lines"
  | "min_chars";

export type CodingCheck = {
  id: string;
  label: string;
  kind: CodingCheckKind;
  /** Needle, regex source, or numeric threshold as string */
  value: string;
};

export type CodingMeta = {
  language: CodingLanguage;
  starterCode?: string;
  checks: CodingCheck[];
};

export type CodingCheckResult = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type QuestionMeta = {
  coding?: CodingMeta;
};
