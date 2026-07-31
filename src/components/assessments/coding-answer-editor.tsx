"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { CodingCheck, CodingLanguage } from "@/types/coding";

const LANG_LABEL: Record<CodingLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  sql: "SQL",
  java: "Java",
  other: "Code",
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  language?: CodingLanguage;
  starterCode?: string;
  checks?: Pick<CodingCheck, "id" | "label">[];
  readOnly?: boolean;
};

export function CodingAnswerEditor({
  value,
  onChange,
  language = "javascript",
  starterCode = "",
  checks = [],
  readOnly = false,
}: Props) {
  void checks;
  const lineCount = Math.max(1, (value || "").split(/\r?\n/).length);

  React.useEffect(() => {
    if (!value && starterCode && !readOnly) {
      onChange(starterCode);
    }
    // Only seed once when empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{LANG_LABEL[language]}</Badge>
          <span className="text-xs text-muted-foreground">
            {lineCount} line{lineCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-input bg-code-surface shadow-(--shadow-sm)">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-[11px] text-slate-400">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2">solution.{language === "python" ? "py" : language === "sql" ? "sql" : "js"}</span>
        </div>
        <div className="flex min-h-48">
          <pre
            aria-hidden
            className="select-none border-r border-white/10 bg-black/20 px-2 py-3 text-right font-mono text-[12px] leading-6 text-slate-500"
          >
            {Array.from({ length: lineCount }, (_, i) => i + 1).join("\n")}
          </pre>
          <textarea
            className="min-h-48 w-full resize-y bg-transparent px-3 py-3 font-mono text-[13px] leading-6 text-slate-100 outline-none placeholder:text-slate-500"
            spellCheck={false}
            readOnly={readOnly}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={starterCode || "// Write your solution here"}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Your solution is reviewed after you submit.
      </p>
    </div>
  );
}
