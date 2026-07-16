"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
  className?: string;
  /** Invert prose colors for primary (user) bubbles */
  inverted?: boolean;
}

export function MarkdownMessage({ content, className, inverted = false }: MarkdownMessageProps) {
  return (
    <div
      className={cn(
        "text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
    >
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className={cn("font-semibold", inverted ? "text-white" : "text-foreground")}>
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="mb-2.5 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2.5 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => (
            <h1 className="mb-2 font-display text-base font-semibold">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 font-display text-sm font-semibold">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1.5 font-display text-sm font-semibold">{children}</h3>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className={cn(
                "underline underline-offset-2",
                inverted ? "text-white" : "text-primary"
              )}
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          code: ({ children, className: codeClass }) => {
            const isBlock = Boolean(codeClass);
            if (isBlock) {
              return (
                <code className="my-2 block overflow-x-auto rounded-xl bg-black/5 px-3 py-2 font-mono text-xs dark:bg-white/10">
                  {children}
                </code>
              );
            }
            return (
              <code
                className={cn(
                  "rounded-md px-1.5 py-0.5 font-mono text-[12px]",
                  inverted ? "bg-white/20" : "bg-black/5 dark:bg-white/10"
                )}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded-xl bg-black/5 p-3 font-mono text-xs dark:bg-white/10">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full min-w-[240px] border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={cn(inverted ? "bg-white/15" : "bg-black/5 dark:bg-white/10")}>
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-border/60 px-2.5 py-1.5 font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border/40 px-2.5 py-1.5">{children}</td>
          ),
          hr: () => <hr className="my-3 border-border/60" />,
          blockquote: ({ children }) => (
            <blockquote
              className={cn(
                "my-2 border-l-2 pl-3 italic opacity-90",
                inverted ? "border-white/40" : "border-primary/40"
              )}
            >
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
