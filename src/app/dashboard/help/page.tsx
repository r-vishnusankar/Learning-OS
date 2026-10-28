"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Route,
  Search,
  Target,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const fade = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: React.ReactNode;
  links?: { label: string; href: string }[];
};

const STEPS = [
  {
    title: "See your assigned courses",
    body: "Open My Learning. Mandatory courses for your department and current level appear under “Assigned to you”.",
    href: "/dashboard/learning",
    icon: BookOpen,
  },
  {
    title: "Complete every lesson",
    body: "Open each course, watch/read lessons, and mark them complete. Progress must reach 100%.",
    href: "/dashboard/courses",
    icon: GraduationCap,
  },
  {
    title: "Pass the course assessment",
    body: "When lessons are done, Skillrr opens (or prompts) the knowledge check for that course. You must pass it — lessons alone are not enough.",
    href: "/dashboard/assessments",
    icon: ClipboardCheck,
  },
  {
    title: "Become eligible for promotion",
    body: "When all mandatory courses for your level are certified (lessons + passed exam), your status becomes Eligible. An admin must approve the level advance.",
    href: "/dashboard",
    icon: TrendingUp,
  },
  {
    title: "Advance and start the next level",
    body: "After approval, your learning level increases and new courses for the next level are assigned automatically. Repeat the loop.",
    href: "/dashboard/learning",
    icon: Target,
  },
];

const FAQS: FaqItem[] = [
  {
    id: "what-is-skillrr",
    category: "Getting started",
    question: "What is Skillrr and what should I do first?",
    answer: (
      <p>
        Skillrr is your company learning and career platform. Start on the{" "}
        <strong>Dashboard</strong> to see career progress, then go to{" "}
        <strong>My Learning</strong> for courses assigned to your role and level. Finish those
        courses and pass their assessments to become promotion-eligible.
      </p>
    ),
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "My Learning", href: "/dashboard/learning" },
    ],
  },
  {
    id: "career-card",
    category: "Getting started",
    question: "What does the Career progress card mean?",
    answer: (
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Level</strong> — your current learning band (e.g. Senior → Lead).
        </li>
        <li>
          <strong>X/Y certified</strong> — how many mandatory courses you have fully certified
          (lessons done + assessment passed).
        </li>
        <li>
          <strong>In progress</strong> — still finishing courses or exams.
        </li>
        <li>
          <strong>Eligible</strong> — you finished the level; waiting for admin approval.
        </li>
        <li>
          <strong>Blocked</strong> — something is missing (no assignments or no linked assessment).
          Contact your admin if this persists.
        </li>
      </ul>
    ),
    links: [{ label: "Open Dashboard", href: "/dashboard" }],
  },
  {
    id: "assigned-vs-catalog",
    category: "Courses",
    question: "What is the difference between Assigned courses and the course catalog?",
    answer: (
      <p>
        <strong>Assigned</strong> courses are required for your current level and count toward
        promotion. The open <strong>Courses</strong> catalog is for extra learning — useful, but it
        does not replace completing your mandatory assignments.
      </p>
    ),
    links: [
      { label: "My Learning", href: "/dashboard/learning" },
      { label: "All courses", href: "/dashboard/courses" },
    ],
  },
  {
    id: "how-complete-course",
    category: "Courses",
    question: "How do I complete a course?",
    answer: (
      <ol className="list-decimal space-y-1 pl-5">
        <li>Open the course from My Learning or Courses.</li>
        <li>Go through each lesson (video, article, lab, etc.).</li>
        <li>Click <strong>Mark complete</strong> on every lesson.</li>
        <li>
          When the last lesson is done, you are taken to the course{" "}
          <strong>knowledge check (assessment)</strong>.
        </li>
      </ol>
    ),
    links: [{ label: "My Learning", href: "/dashboard/learning" }],
  },
  {
    id: "bookmark",
    category: "Courses",
    question: "What does the bookmark icon on a course card do?",
    answer: (
      <p>
        Bookmark saves the course for later. Saved courses appear in My Learning under your saved
        list so you can find them quickly. It does not enroll you or count toward promotion.
      </p>
    ),
  },
  {
    id: "assessment-required",
    category: "Assessments",
    question: "Do I have to take an assessment after every course?",
    answer: (
      <p>
        Yes for <strong>mandatory level courses</strong>. Completing lessons alone is not enough for
        promotion. You must <strong>pass</strong> the linked knowledge check. You usually get a few
        attempts (check the assessment page for max attempts and passing score, often 70%).
      </p>
    ),
    links: [{ label: "Assessments", href: "/dashboard/assessments" }],
  },
  {
    id: "fail-assessment",
    category: "Assessments",
    question: "What if I fail an assessment?",
    answer: (
      <p>
        Retry while you still have attempts left. Review the course lessons, then start a new
        attempt from the assessment page. If you run out of attempts, contact your manager or
        admin — they can help with next steps.
      </p>
    ),
    links: [{ label: "Assessments", href: "/dashboard/assessments" }],
  },
  {
    id: "certificates",
    category: "Assessments",
    question: "When do I get a certificate?",
    answer: (
      <p>
        Passing a course knowledge check typically mints a certificate automatically. You can view
        and verify credentials under <strong>Certificates</strong>.
      </p>
    ),
    links: [{ label: "Certificates", href: "/dashboard/certificates" }],
  },
  {
    id: "how-promotion",
    category: "Promotion",
    question: "How do I become eligible for promotion?",
    answer: (
      <ol className="list-decimal space-y-1 pl-5">
        <li>Complete all mandatory courses assigned for your current level.</li>
        <li>Pass each course’s assessment.</li>
        <li>
          Check Dashboard / My Learning — status should show <strong>Eligible for promotion</strong>.
        </li>
        <li>An admin reviews and Approves on the Promotions console.</li>
        <li>Your level advances and next-level courses are assigned.</li>
      </ol>
    ),
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "My Learning", href: "/dashboard/learning" },
    ],
  },
  {
    id: "who-approves",
    category: "Promotion",
    question: "Can I promote myself?",
    answer: (
      <p>
        No. You cannot change your learning level in Settings. Only an admin (or department admin)
        can approve a promotion after you are eligible. You will get a notification when it is
        approved or rejected.
      </p>
    ),
    links: [{ label: "Notifications", href: "/dashboard/notifications" }],
  },
  {
    id: "zero-one-paths",
    category: "Getting started",
    question: "I have 0–1 years of experience — what should I follow?",
    answer: (
      <p>
        Open <strong>Learning Paths</strong> and enroll in (or open) your department’s{" "}
        <strong>0–1 Year Journey</strong> track. It sequences first-level courses and their knowledge
        checks. You should also complete the same courses under <strong>My Learning</strong>{" "}
        (mandatory assignments) so they count toward promotion eligibility.
      </p>
    ),
    links: [
      { label: "Learning Paths", href: "/dashboard/paths" },
      { label: "My Learning", href: "/dashboard/learning" },
    ],
  },
  {
    id: "paths-vs-promotion",
    category: "Promotion",
    question: "Do Learning Paths count toward promotion?",
    answer: (
      <p>
        Paths guide you through the right order. Promotion eligibility still requires completing
        mandatory <strong>assigned courses</strong> and <strong>passing</strong> each course
        assessment. The 0–1 Year Journey paths use those same first-level courses — finish both the
        path steps and your My Learning assignments.
      </p>
    ),
    links: [{ label: "Learning Paths", href: "/dashboard/paths" }],
  },
  {
    id: "homework",
    category: "Other features",
    question: "What are Assignments (homework)?",
    answer: (
      <p>
        Assignments are separate homework/submissions (text, URL, GitHub). They may be required by
        your team, but they are not the same as course knowledge checks and are not the promotion
        gate by themselves.
      </p>
    ),
    links: [{ label: "Assignments", href: "/dashboard/assignments" }],
  },
  {
    id: "notifications",
    category: "Other features",
    question: "What notifications should I watch for?",
    answer: (
      <ul className="list-disc space-y-1 pl-5">
        <li>New mandatory course assigned</li>
        <li>Course complete — take assessment</li>
        <li>Eligible for promotion</li>
        <li>Promotion approved / not approved</li>
        <li>Learning reminders from managers</li>
      </ul>
    ),
    links: [{ label: "Notifications", href: "/dashboard/notifications" }],
  },
  {
    id: "stuck",
    category: "Troubleshooting",
    question: "I’m stuck — courses done but not eligible. What now?",
    answer: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Confirm every assigned course shows <strong>Certified</strong> (not only 100% lessons).</li>
        <li>Open each course’s assessment and check you have a passing attempt.</li>
        <li>Refresh Dashboard / My Learning career status.</li>
        <li>If still blocked, ask your admin to check assignments and linked assessments.</li>
      </ul>
    ),
    links: [
      { label: "My Learning", href: "/dashboard/learning" },
      { label: "Assessments", href: "/dashboard/assessments" },
    ],
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(FAQS.map((f) => f.category)))];

function FaqRow({ item, open, onToggle }: { item: FaqItem; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <div className="space-y-1">
          <Badge variant="secondary" className="text-[11px]">
            {item.category}
          </Badge>
          <p className="font-medium text-foreground">{item.question}</p>
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="space-y-3 border-t px-4 py-3 text-sm text-muted-foreground">
          <div className="space-y-2 text-foreground/90">{item.answer}</div>
          {item.links && item.links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.links.map((l) => (
                <Button key={l.href} asChild size="sm" variant="outline">
                  <Link href={l.href}>{l.label}</Link>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("All");
  const [openId, setOpenId] = React.useState<string | null>("how-promotion");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((f) => {
      if (category !== "All" && f.category !== category) return false;
      if (!q) return true;
      const hay = `${f.question} ${f.category}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, category]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & employee guide"
        description="Everything you need to learn, certify courses, and become eligible for promotion."
      >
        <Badge variant="info" className="gap-1">
          <HelpCircle className="h-3.5 w-3.5" /> Employee guidance
        </Badge>
      </PageHeader>

      <motion.section {...fade}>
        <Card className="overflow-hidden border-primary/20 bg-linear-to-br from-primary/5 via-card to-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              How promotion works (read this first)
            </CardTitle>
            <CardDescription>
              Skillrr gates career level advancement on learning proof — not courses alone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Assigned courses → finish all lessons → pass each course assessment → become{" "}
              <strong className="text-foreground">Eligible</strong> → admin Approves → next level
              courses unlock.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <Link
                    key={step.title}
                    href={step.href}
                    className="rounded-2xl border bg-card/80 p-3 transition hover:border-primary/40 hover:shadow-(--shadow-sm)"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{step.body}</p>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <motion.section
        {...fade}
        transition={{ delay: 0.04 }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          {
            title: "Dashboard",
            desc: "Career progress & CTAs",
            href: "/dashboard",
            icon: LayoutDashboard,
          },
          {
            title: "My Learning",
            desc: "Mandatory courses",
            href: "/dashboard/learning",
            icon: BookOpen,
          },
          {
            title: "Assessments",
            desc: "Pass knowledge checks",
            href: "/dashboard/assessments",
            icon: ClipboardCheck,
          },
          {
            title: "Certificates",
            desc: "Proof you passed",
            href: "/dashboard/certificates",
            icon: Award,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-(--shadow-card)">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </motion.section>

      <motion.section {...fade} transition={{ delay: 0.06 }} className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-section">Questions & answers</h2>
            <p className="text-sm text-muted-foreground">
              Search or filter — open any question for the full answer and shortcuts.
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search help…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={category === c ? "default" : "outline"}
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No matching topics. Try another search, or ask your manager.
              </CardContent>
            </Card>
          ) : (
            filtered.map((item) => (
              <FaqRow
                key={item.id}
                item={item}
                open={openId === item.id}
                onToggle={() => setOpenId((id) => (id === item.id ? null : item.id))}
              />
            ))
          )}
        </div>
      </motion.section>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
            <div>
              <p className="font-semibold">Still need help?</p>
              <p className="text-sm text-muted-foreground">
                Contact your manager / admin for assignment issues.
                Learning Paths are optional and do not replace mandatory course certifications.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/paths">
                <Route className="h-4 w-4" /> Paths (optional)
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/learning">Go to My Learning</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
