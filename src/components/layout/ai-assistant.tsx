"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import { MarkdownMessage } from "@/components/ai/markdown-message";
import { cn, isExamRoute } from "@/lib/utils";
import { usePathname } from "next/navigation";

const suggestions = [
  "Summarize my current course",
  "What should I learn next?",
  "Generate a quiz on system design",
  "Analyze my skill gaps",
];

type Msg = { role: "user" | "assistant"; content: string };

export function AiAssistant() {
  const pathname = usePathname();
  const { aiOpen, setAiOpen } = useUIStore();
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm your Skillrr AI Mentor. I can summarize lessons, recommend paths, generate quizzes, and help with career guidance.",
    },
  ]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "This mentor is a preview and isn't connected to your live course data yet. Check back soon for personalized guidance.",
        },
      ]);
    }, 700);
  };

  if (isExamRoute(pathname)) return null;

  return (
    <>
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-[length:var(--radius-lg)] bg-foreground text-background shadow-(--shadow-md)"
        aria-label="Open AI Mentor"
      >
        <Sparkles className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[length:var(--radius-lg)] border border-border bg-card shadow-(--shadow-lg)"
          >
            <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 text-foreground">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <div>
                  <p className="text-sm font-semibold">AI Mentor</p>
                  <p className="text-[11px] text-muted-foreground">Always on · Enterprise secure</p>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:bg-secondary" onClick={() => setAiOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-[length:var(--radius)] px-3 py-2 text-sm leading-relaxed",
                    m.role === "assistant"
                      ? "bg-secondary text-foreground"
                      : "ml-auto bg-foreground text-background"
                  )}
                >
                  {m.role === "assistant" ? (
                    <MarkdownMessage content={m.content} />
                  ) : (
                    m.content
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 border-t px-3 py-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-[length:var(--radius)] border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground transition-colors duration-150 hover:border-border-control hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>

            <form
              className="flex items-center gap-2 border-t p-3"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything…"
                className="h-8 flex-1 rounded-[length:var(--radius-control)] border border-border bg-background px-3 text-sm outline-none transition-colors hover:border-border-control focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <Button type="submit" size="icon" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
