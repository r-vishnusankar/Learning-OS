"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Briefcase,
  Brain,
  FileQuestion,
  Lightbulb,
  MessageSquare,
  Mic,
  Send,
  Sparkles,
  Target,
  Video,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownMessage } from "@/components/ai/markdown-message";
import { usePublishedCourses } from "@/hooks/use-courses";
import { useCurrentUser } from "@/hooks/use-me";
import { cn } from "@/lib/utils";
import { isActiveCourseStatus } from "@/lib/course-progress";

type Msg = { role: "user" | "assistant"; content: string; streaming?: boolean };

const suggestions = [
  { label: "Summarize videos", icon: Video, prompt: "Summarize my latest System Design video lessons" },
  { label: "Explain concepts", icon: Lightbulb, prompt: "Explain CAP theorem in simple terms with examples" },
  { label: "Generate quizzes", icon: FileQuestion, prompt: "Generate a 5-question quiz on Redis caching" },
  { label: "Career advice", icon: Briefcase, prompt: "What skills should I focus on for a Staff Engineer role?" },
  { label: "Mock interview", icon: Mic, prompt: "Start a mock system design interview for a URL shortener" },
  { label: "Learning recommendation", icon: BookOpen, prompt: "What should I learn next based on my progress?" },
  { label: "Skill analysis", icon: Target, prompt: "Analyze my skill gaps across engineering domains" },
];

const mockResponses: Record<string, string> = {
  "Summarize my latest System Design video lessons":
    "Here's a summary of your recent lessons:\n\n**Database Sharding** — Horizontal partitioning splits data across nodes; choose shard keys carefully to avoid hotspots.\n\n**Redis Caching Strategies** — Cache-aside is most common; write-through suits consistency-critical paths. TTLs prevent stale reads.\n\nYou're 64% through the course. Completing the Redis lab will unlock Case Studies.",
  "Explain CAP theorem in simple terms with examples":
    "The **CAP theorem** states a distributed system can guarantee at most two of three properties:\n\n• **Consistency** — Every read returns the latest write\n• **Availability** — Every request gets a response\n• **Partition tolerance** — System works despite network splits\n\n**Example:** During a network partition, you choose CP (banking — consistency) or AP (social feeds — availability). Most modern systems use eventual consistency with tunable guarantees.",
  "Generate a 5-question quiz on Redis caching":
    "Here's your practice quiz:\n\n1. What is cache-aside pattern?\n2. When would you use write-through vs write-behind?\n3. How do you prevent cache stampede?\n4. What's an appropriate TTL for session data?\n5. How does Redis handle cache invalidation on updates?\n\nReply **\"answers\"** for solutions, or **\"harder\"** for advanced questions.",
  "What skills should I focus on for a Staff Engineer role?":
    "Based on your profile (Senior SWE, 78 skill score), focus on:\n\n1. **System Design** (72→90) — Your biggest leverage for Staff\n2. **Technical Leadership** — Mentoring, RFC writing, cross-team influence\n3. **DevOps** (55→75) — Critical for platform-level delivery\n4. **Communication** — Stakeholder alignment and executive summaries\n\nRecommend: Finish System Design Mastery + CI/CD path in the next 8 weeks.",
  "Start a mock system design interview for a URL shortener":
    "**Mock Interview — URL Shortener**\n\n*Interviewer:* Design a URL shortening service like bit.ly. 100M URLs/day, 10:1 read/write ratio.\n\nTake 2 minutes to clarify requirements, then outline your high-level design. I'll probe on:\n• Encoding strategy (base62 vs hash)\n• Database choice and sharding\n• Cache layer\n• Analytics tracking\n\nReady? Share your clarifying questions first.",
  "What should I learn next based on my progress?":
    "Given your progress:\n\n**Priority 1:** Complete Redis Caching lab (System Design, 64%)\n**Priority 2:** Schedule System Design Certification (due Jul 25)\n**Priority 3:** Start CI/CD with GitHub Actions\n\n**This week:** 45 min/day on caching + 1 pipeline module. This keeps your 14-day streak and closes your biggest skill gap.",
  "Analyze my skill gaps across engineering domains":
    "**Skill Gap Analysis**\n\n| Domain | Current | Target | Gap |\n|--------|---------|--------|-----|\n| System Design | 72 | 90 | -18 |\n| DevOps | 55 | 75 | -20 |\n| Test Automation | 60 | 80 | -20 |\n| TypeScript | 88 | 95 | -7 |\n\n**Critical gap:** DevOps. **Strength:** TypeScript/React. Recommend DevOps Excellence Track as secondary after System Design.",
};

const defaultResponse =
  "I've analyzed your learning profile and current progress. You're doing well in TypeScript and React, with System Design at 72%. I'd recommend focusing on the Redis Caching lab today and scheduling your certification exam. Would you like me to create a personalized study plan?";

const capabilities = [
  "Summarize course videos and reading materials",
  "Explain complex concepts with real-world examples",
  "Generate practice quizzes and assessments",
  "Provide career path and promotion guidance",
  "Conduct mock technical interviews",
  "Recommend courses based on skill gaps",
  "Analyze your skill matrix and progress",
];

const tips = [
  "Be specific about the course or topic you need help with",
  "Ask for step-by-step explanations when stuck on labs",
  "Request quizzes to test understanding before assessments",
  "Use mock interviews to prepare for certification exams",
];

export default function AiMentorPage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: courses = [] } = usePublishedCourses();
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const inProgressCount = courses.filter((c) => isActiveCourseStatus(c.status)).length;
  const streak = user?.streak ?? 0;
  const skillScore = user?.skillScore ?? 0;

  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [greetingReady, setGreetingReady] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (userLoading || greetingReady) return;
    setMessages([
      {
        role: "assistant",
        content: `Hi ${firstName} — I'm your Skillrr AI Mentor. I can summarize lessons, explain concepts, generate quizzes, run mock interviews, and analyze your skills. How can I help today?`,
      },
    ]);
    setGreetingReady(true);
  }, [userLoading, firstName, greetingReady]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const send = (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsTyping(true);

    const response = mockResponses[text.trim()] ?? defaultResponse;
    const words = response.split(" ");
    let current = "";

    setMessages((m) => [...m, { role: "assistant", content: "", streaming: true }]);

    let i = 0;
    const interval = setInterval(() => {
      if (i < words.length) {
        current += (i > 0 ? " " : "") + words[i];
        i++;
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: current, streaming: true };
          return copy;
        });
      } else {
        clearInterval(interval);
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: response };
          return copy;
        });
        setIsTyping(false);
      }
    }, 35);
  };

  if (userLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="AI Mentor" description="Loading your mentor context…" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Mentor"
        description="Your personal learning assistant — summarize, explain, quiz, and guide your career growth."
      >
        <Badge variant="info" className="gap-1">
          <Sparkles className="h-3 w-3" /> Enterprise secure
        </Badge>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-[calc(100vh-220px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-(--shadow-sm)"
        >
          <div className="flex items-center gap-3 border-b bg-linear-to-r from-teal-700 to-teal-600 px-5 py-4 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display font-semibold">Skillrr AI Mentor</p>
              <p className="text-xs text-teal-100">Powered by enterprise AI · Context-aware</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "assistant"
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {m.role === "assistant" ? (
                    <MarkdownMessage content={m.content} />
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                  {m.streaming && (
                    <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-primary/60" />
                  )}
                </div>
              </div>
            ))}
            {isTyping && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Brain className="h-4 w-4 animate-pulse text-primary" />
                Thinking…
              </div>
            )}
          </div>

          <div className="border-t px-4 py-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => send(s.prompt)}
                  disabled={isTyping}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                >
                  <s.icon className="h-3 w-3" />
                  {s.label}
                </button>
              ))}
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your learning journey…"
                disabled={isTyping}
                className="h-11 flex-1 rounded-xl border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Capabilities
              </CardTitle>
              <CardDescription>What your AI Mentor can do</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {capabilities.map((cap) => (
                <div key={cap} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {cap}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversation tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tips.map((tip) => (
                <p key={tip} className="text-sm text-muted-foreground">• {tip}</p>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <p className="text-sm font-medium">Your context</p>
              <p className="mt-2 text-xs text-muted-foreground">
                AI Mentor has access to your courses, assessments, skill matrix, and learning goals for personalized guidance.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">{streak}-day streak</Badge>
                <Badge variant="outline">{skillScore} skill score</Badge>
                <Badge variant="outline">{inProgressCount} active courses</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.aside>
      </div>
    </div>
  );
}
