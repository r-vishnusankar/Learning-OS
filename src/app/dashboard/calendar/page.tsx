"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EventType = "assessment" | "session" | "ceremony";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: EventType;
  description?: string;
}

const mockEvents: CalendarEvent[] = [
  { id: "e1", title: "System Design Certification Exam", date: "2026-07-15", time: "10:00 AM", type: "assessment", description: "90 min · 40 questions" },
  { id: "e2", title: "CI/CD Pipeline Workshop", date: "2026-07-14", time: "2:00 PM", type: "session", description: "CI/CD with GitHub Actions" },
  { id: "e3", title: "Rate Limiter Assignment Due", date: "2026-07-15", time: "11:59 PM", type: "assessment", description: "System Design Mastery" },
  { id: "e4", title: "Playwright Lab Session", date: "2026-07-16", time: "3:00 PM", type: "session", description: "API Testing with Playwright" },
  { id: "e5", title: "CI/CD Pipeline Design", date: "2026-07-18", time: "9:00 AM", type: "assessment", description: "75 min case study" },
  { id: "e6", title: "TypeScript Professional Ceremony", date: "2026-07-22", time: "4:00 PM", type: "ceremony", description: "Virtual credential celebration" },
  { id: "e7", title: "Team Learning Sprint", date: "2026-07-23", time: "1:00 PM", type: "session", description: "Development department" },
  { id: "e8", title: "QA Automation Practical", date: "2026-07-25", time: "10:00 AM", type: "assessment", description: "Playwright coding challenge" },
  { id: "e9", title: "QA Automation Certificate Ceremony", date: "2026-07-28", time: "3:30 PM", type: "ceremony", description: "QA team recognition" },
  { id: "e10", title: "Redis Caching Lab Session", date: "2026-07-13", time: "5:00 PM", type: "session", description: "System Design Mastery" },
];

const MONTH = 6;
const YEAR = 2026;
const MONTH_NAME = "July 2026";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const typeConfig: Record<EventType, { icon: typeof CalendarIcon; color: string; badge: "warning" | "info" | "success" }> = {
  assessment: { icon: ClipboardCheck, color: "bg-warning/15 text-warning border-warning/30", badge: "warning" },
  session: { icon: BookOpen, color: "bg-info/15 text-info border-info/30", badge: "info" },
  ceremony: { icon: Award, color: "bg-success/15 text-success border-success/30", badge: "success" },
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = React.useState<string | null>("2026-07-13");
  const daysInMonth = getDaysInMonth(YEAR, MONTH);
  const firstDay = getFirstDayOfMonth(YEAR, MONTH);

  const calendarDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const eventsByDate = mockEvents.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {});

  const upcoming = [...mockEvents]
    .filter((e) => new Date(e.date) >= new Date("2026-07-13"))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] ?? [] : [];

  const dateKey = (day: number) =>
    `${YEAR}-${String(MONTH + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Calendar"
        description="Track assessments, learning sessions, and certificate ceremonies."
      >
        <Badge variant="outline" className="gap-1">
          <CalendarIcon className="h-3 w-3" /> {MONTH_NAME}
        </Badge>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{MONTH_NAME}</CardTitle>
                <CardDescription>Click a day to view events</CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="rounded-lg p-2 transition hover:bg-muted" aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-lg p-2 transition hover:bg-muted" aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                {DAYS.map((d) => (
                  <div key={d} className="py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (day === null) {
                    return <div key={`empty-${i}`} className="aspect-square" />;
                  }
                  const key = dateKey(day);
                  const dayEvents = eventsByDate[key] ?? [];
                  const isSelected = selectedDate === key;
                  const isToday = key === "2026-07-13";

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDate(key)}
                      className={cn(
                        "relative flex aspect-square flex-col items-center justify-start rounded-lg border p-1 text-sm transition",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-transparent hover:border-border hover:bg-muted/50",
                        isToday && !isSelected && "ring-2 ring-primary/30"
                      )}
                    >
                      <span className={cn("font-medium", isToday && "text-primary")}>{day}</span>
                      {dayEvents.length > 0 && (
                        <div className="mt-auto flex gap-0.5 pb-0.5">
                          {dayEvents.slice(0, 3).map((e) => (
                            <span
                              key={e.id}
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                e.type === "assessment" && "bg-warning",
                                e.type === "session" && "bg-info",
                                e.type === "ceremony" && "bg-success"
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <div className="mt-6 border-t border-border pt-5">
                  <p className="mb-3 text-sm font-medium">
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  {selectedEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events scheduled.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedEvents.map((event) => {
                        const config = typeConfig[event.type];
                        const Icon = config.icon;
                        return (
                          <div
                            key={event.id}
                            className={cn("flex items-start gap-3 rounded-lg border p-3", config.color)}
                          >
                            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{event.title}</p>
                              <p className="text-xs opacity-80">{event.time}{event.description ? ` · ${event.description}` : ""}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
              <CardDescription>Next scheduled events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.map((event) => {
                const config = typeConfig[event.type];
                const Icon = config.icon;
                return (
                  <div
                    key={event.id}
                    className="flex gap-3 rounded-lg border border-border p-3 transition hover:border-primary/30"
                  >
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", config.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {event.time}
                      </p>
                      <Badge variant={config.badge} className="mt-1.5 capitalize text-[10px]">
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                Assessments due
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-info" />
                Learning sessions
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                Certificate ceremonies
              </div>
            </CardContent>
          </Card>
        </motion.aside>
      </div>
    </div>
  );
}
