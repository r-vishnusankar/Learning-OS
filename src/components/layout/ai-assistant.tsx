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
        "Hi — I'm your Nexus AI Mentor. I can summarize lessons, recommend paths, generate quizzes, and help with career guidance.",
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
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-primary-strong to-chart-2 text-primary-foreground shadow-lg shadow-primary/30"
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
            className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b bg-linear-to-r from-primary-strong to-chart-2 px-4 py-3 text-primary-foreground">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <div>
                  <p className="text-sm font-semibold">AI Mentor</p>
                  <p className="text-[11px] text-white/80">Always on · Enterprise secure</p>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" className="text-white hover:bg-white/15" onClick={() => setAiOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "assistant"
                      ? "bg-muted text-foreground"
                      : "ml-auto bg-primary text-primary-foreground"
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
                  className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
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
                className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
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
