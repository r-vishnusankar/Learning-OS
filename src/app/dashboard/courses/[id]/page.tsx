"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import * as Accordion from "@radix-ui/react-accordion";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileText,
  FlaskConical,
  HelpCircle,
  Lock,
  MessageSquare,
  Play,
  Sparkles,
  Star,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { courses } from "@/data/mock";
import { DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { cn, formatHours } from "@/lib/utils";
import type { Lesson } from "@/types";

const lessonIcons = {
  video: Video,
  reading: BookOpen,
  lab: FlaskConical,
  quiz: HelpCircle,
};

const mockComments = [
  { id: "1", author: "Jordan Lee", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jordan", text: "The CAP theorem explanation was crystal clear. Great real-world examples!", time: "2 days ago", likes: 12 },
  { id: "2", author: "Samira Khan", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Samira", text: "Anyone else struggling with the Redis lab? Happy to pair on it.", time: "4 days ago", likes: 8 },
  { id: "3", author: "Chris Okonkwo", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Chris", text: "Module 2 quiz was tougher than expected. Review the caching strategies section.", time: "1 week ago", likes: 5 },
];

const mockResources = [
  { name: "System Design Cheat Sheet.pdf", size: "2.4 MB", type: "PDF" },
  { name: "Architecture Diagram Templates.fig", size: "8.1 MB", type: "Figma" },
  { name: "Case Study Workbook.docx", size: "1.2 MB", type: "Document" },
  { name: "Reference Links.md", size: "12 KB", type: "Markdown" },
];

const mockTranscript = [
  { time: "00:00", text: "Welcome to System Design Mastery. In this module, we'll explore the foundations of building systems at scale." },
  { time: "01:24", text: "Let's start with the CAP theorem — Consistency, Availability, and Partition tolerance." },
  { time: "03:45", text: "In practice, you'll often need to make trade-offs depending on your use case and business requirements." },
  { time: "06:12", text: "Load balancing is one of the first tools in your toolkit when traffic starts to grow beyond a single server." },
  { time: "09:30", text: "We'll look at round-robin, least connections, and consistent hashing strategies." },
];

function LessonRow({ lesson }: { lesson: Lesson }) {
  const Icon = lessonIcons[lesson.type];
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 transition",
        lesson.locked ? "opacity-50" : "hover:border-primary/30 hover:bg-muted/40",
        lesson.completed && "border-success/20 bg-success/5"
      )}
    >
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted", lesson.completed && "bg-success/15 text-success")}>
        {lesson.completed ? <CheckCircle2 className="h-4 w-4" /> : lesson.locked ? <Lock className="h-3.5 w-3.5" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{lesson.title}</p>
        <p className="text-[11px] capitalize text-muted-foreground">
          {lesson.type} · {lesson.durationMinutes} min
        </p>
      </div>
      {!lesson.locked && !lesson.completed && (
        <Button variant="ghost" size="icon-sm" className="shrink-0">
          <Play className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const course = courses.find((c) => c.id === id);
  const [notes, setNotes] = useState("");

  if (!course) {
    return (
      <EmptyState
        title="Course not found"
        description="The course you're looking for doesn't exist or may have been removed."
        actionLabel="Back to catalog"
        onAction={() => (window.location.href = "/dashboard/courses")}
      />
    );
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0) || course.lessonsCount;
  const completedLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.completed).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-border"
      >
        <div className="absolute inset-0">
          <Image src={course.thumbnail} alt="" fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/70 to-black/40" />
        </div>
        <div className="relative p-6 md:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/90 text-primary-foreground">{DEPARTMENT_LABELS[course.department]}</Badge>
            <Badge variant="secondary" className="bg-white/15 text-white backdrop-blur">
              {LEVEL_LABELS[course.level]}
            </Badge>
            <Badge variant="secondary" className="bg-white/15 text-white capitalize backdrop-blur">
              {course.difficulty}
            </Badge>
            {course.isTrending && (
              <Badge className="bg-warning text-white">Trending</Badge>
            )}
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/80 md:text-base">{course.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <Avatar className="h-6 w-6">
                <AvatarImage src={course.instructor.avatar} />
                <AvatarFallback>{course.instructor.name[0]}</AvatarFallback>
              </Avatar>
              {course.instructor.name}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-warning text-warning" /> {course.rating}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatHours(course.durationHours)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" /> {course.enrolledCount.toLocaleString()} enrolled
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" className="gap-2">
              <Play className="h-4 w-4" />
              {course.status === "in_progress" ? "Continue Learning" : "Start Course"}
            </Button>
            <Button size="lg" variant="outline" className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20">
              <Sparkles className="h-4 w-4" /> Ask AI
            </Button>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="space-y-6">
          {/* Video player */}
          <Card className="overflow-hidden">
            <div className="relative flex aspect-video items-center justify-center bg-[#0a0f18]">
              <Image
                src={course.thumbnail}
                alt={course.title}
                fill
                className="object-cover opacity-30"
                unoptimized
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
              <button
                type="button"
                className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 hover:brightness-110"
              >
                <Play className="h-7 w-7 fill-current pl-1" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-black/50 px-4 py-3 backdrop-blur">
                <div className="h-1 flex-1 rounded-full bg-white/20">
                  <div className="h-full w-1/3 rounded-full bg-primary" />
                </div>
                <span className="text-xs text-white/80">12:34 / 38:00</span>
              </div>
            </div>
          </Card>

          {/* Curriculum */}
          {course.modules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Curriculum</CardTitle>
                <CardDescription>
                  {course.modules.length} modules · {totalLessons} lessons · {completedLessons} completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion.Root type="multiple" defaultValue={[course.modules[0]?.id]} className="space-y-2">
                  {course.modules.map((module, idx) => (
                    <Accordion.Item
                      key={module.id}
                      value={module.id}
                      className="overflow-hidden rounded-xl border border-border"
                    >
                      <Accordion.Header>
                        <Accordion.Trigger className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium">{module.title}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {module.lessons.length} lessons · {module.durationMinutes} min
                                {module.completed && " · Completed"}
                              </p>
                            </div>
                          </div>
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                        </Accordion.Trigger>
                      </Accordion.Header>
                      <Accordion.Content className="overflow-hidden">
                        <div className="space-y-1.5 border-t border-border/60 px-3 py-3">
                          {module.lessons.map((lesson) => (
                            <LessonRow key={lesson.id} lesson={lesson} />
                          ))}
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  ))}
                </Accordion.Root>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Card>
            <CardContent className="pt-5">
              <Tabs defaultValue="overview">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="discussion">Discussion</TabsTrigger>
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h3 className="font-display text-sm font-semibold">About this course</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{course.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="mt-0.5 text-sm font-medium">{course.category}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Lessons</p>
                      <p className="mt-0.5 text-sm font-medium">{totalLessons} lessons</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="resources" className="space-y-2">
                  {mockResources.map((res) => (
                    <div
                      key={res.name}
                      className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:border-primary/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{res.name}</p>
                          <p className="text-xs text-muted-foreground">{res.type} · {res.size}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon-sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="notes">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Take notes as you learn. Your notes are saved automatically."
                    className="min-h-[200px] w-full resize-y rounded-lg border border-input bg-card p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">Notes are private and synced to your account.</p>
                </TabsContent>

                <TabsContent value="discussion" className="space-y-4">
                  {mockComments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.avatar} />
                        <AvatarFallback>{comment.author[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{comment.author}</p>
                          <span className="text-[11px] text-muted-foreground">{comment.time}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{comment.text}</p>
                        <button type="button" className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                          <MessageSquare className="h-3 w-3" /> {comment.likes} likes
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input placeholder="Add a comment..." className="flex-1" />
                    <Button>Post</Button>
                  </div>
                </TabsContent>

                <TabsContent value="transcript" className="space-y-3">
                  {mockTranscript.map((line) => (
                    <div key={line.time} className="flex gap-3 text-sm">
                      <span className="shrink-0 font-mono text-xs text-primary">{line.time}</span>
                      <p className="text-muted-foreground">{line.text}</p>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Your progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="font-display text-4xl font-semibold text-primary">{course.progress}%</p>
                <p className="text-xs text-muted-foreground">Course completion</p>
              </div>
              <Progress value={course.progress} className="h-2" />
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated time</span>
                  <span className="font-medium">{formatHours(course.durationHours)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty</span>
                  <span className="font-medium capitalize">{course.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">XP reward</span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Zap className="h-3.5 w-3.5 text-warning" /> {course.xpReward} XP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lessons done</span>
                  <span className="font-medium">{completedLessons}/{totalLessons}</span>
                </div>
              </div>
              <Button className="w-full gap-2" size="lg">
                <Play className="h-4 w-4" />
                {course.status === "in_progress" ? "Continue" : "Start Course"}
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <Sparkles className="h-4 w-4" /> Ask AI about this course
              </Button>
            </CardContent>
          </Card>

          {/* Instructor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={course.instructor.avatar} />
                  <AvatarFallback>{course.instructor.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{course.instructor.name}</p>
                  <p className="text-xs text-muted-foreground">{course.instructor.title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{course.instructor.bio}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                <Link href="/dashboard/ai-mentor">Message instructor</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
