"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type LessonArticleProps = {
  content: string;
  className?: string;
};

/** Readable markdown renderer for course lesson articles. */
export function LessonArticle({ content, className }: LessonArticleProps) {
  return (
    <div
      className={cn(
        "lesson-article text-[15px] leading-7 text-foreground/90",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
    >
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 font-display text-2xl font-semibold tracking-tight text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-8 border-b border-border/70 pb-2 font-display text-lg font-semibold tracking-tight text-foreground first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-6 font-display text-base font-semibold text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-4 text-muted-foreground last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground marker:text-primary/70">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-2 pl-5 text-muted-foreground marker:font-medium marker:text-primary">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-5 rounded-r-2xl border-l-4 border-primary/50 bg-secondary/40 px-4 py-3 text-sm text-foreground/90">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-8 border-border" />,
          code: ({ children, className: codeClass }) => {
            const isBlock = Boolean(codeClass);
            if (isBlock) {
              return (
                <code className="my-4 block overflow-x-auto rounded-2xl bg-muted px-4 py-3 font-mono text-xs text-foreground">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-2xl bg-muted p-4 font-mono text-xs">
              {children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
