"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  BookOpen,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Filter,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DEPARTMENT_LABELS } from "@/constants/navigation";
import { useLearnerAssessments } from "@/hooks/use-assessments";
import { useLearnerAssignments, useLearnerCertificates } from "@/hooks/use-certification";
import { cn } from "@/lib/utils";

type EventType = "assessment" | "session" | "ceremony" | "deadline";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: EventType;
  meta?: string;
  href?: string;
  description?: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_EVENTS = 2;

const TYPE_ORDER: EventType[] = ["assessment", "session", "deadline", "ceremony"];

const typeConfig: Record<
  EventType,
  {
    label: string;
    shortLabel: string;
    icon: typeof CalendarIcon;
    dot: string;
    chip: string;
    badge: "warning" | "info" | "success" | "secondary";
  }
> = {
  assessment: {
    label: "Assessment",
    shortLabel: "Assessment",
    icon: ClipboardCheck,
    dot: "bg-warning",
    chip: "bg-warning/10 text-warning-foreground",
    badge: "warning",
  },
  session: {
    label: "Learning Session",
    shortLabel: "Session",
    icon: BookOpen,
    dot: "bg-info",
    chip: "bg-info/10 text-info",
    badge: "info",
  },
  deadline: {
    label: "Assignment",
    shortLabel: "Assignment",
    icon: FileText,
    dot: "bg-primary",
    chip: "bg-primary/10 text-primary",
    badge: "secondary",
  },
  ceremony: {
    label: "Certificate Ceremony",
    shortLabel: "Ceremony",
    icon: Award,
    dot: "bg-success",
    chip: "bg-success/10 text-success-on-light",
    badge: "success",
  },
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toDateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDayHeading(dateKey: string, today: string) {
  if (dateKey === today) return "Today";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  if (dateKey === tomorrowKey) return "Tomorrow";
  return new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }).toUpperCase();
}

function formatFullDate(dateKey: string) {
  return new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth());
  const [selectedDate, setSelectedDate] = React.useState<string | null>(todayKey());
  const [activeTypes, setActiveTypes] = React.useState<Set<EventType>>(
    () => new Set(TYPE_ORDER)
  );
  const [dayDialogOpen, setDayDialogOpen] = React.useState(false);
  const [activeEvent, setActiveEvent] = React.useState<CalendarEvent | null>(null);
  const [highlightEventId, setHighlightEventId] = React.useState<string | null>(null);
  const [mobileShowAgenda, setMobileShowAgenda] = React.useState(false);

  const { data: assessments = [], isLoading: assessmentsLoading, isError: assessmentsError } =
    useLearnerAssessments();
  const { data: assignments = [], isLoading: assignmentsLoading, isError: assignmentsError } =
    useLearnerAssignments();
  const { data: certificates = [], isLoading: certsLoading, isError: certsError } =
    useLearnerCertificates();
  const eventsError = assessmentsError || assignmentsError || certsError;

  const events = React.useMemo<CalendarEvent[]>(() => {
    const assessmentEvents: CalendarEvent[] = assessments
      .filter((a) => a.dueDate)
      .map((a) => ({
        id: `assessment-${a.id}`,
        title: a.title,
        date: toDateKey(a.dueDate),
        time: formatTime(a.dueDate),
        type: "assessment" as const,
        meta: DEPARTMENT_LABELS[a.department] ?? a.department,
        href: `/dashboard/assessments/${a.id}`,
        description: `${a.durationMinutes} min · ${a.questionsCount} questions`,
      }));

    const deadlineEvents: CalendarEvent[] = assignments
      .filter((a) => a.dueDate)
      .map((a) => ({
        id: `assignment-${a.id}`,
        title: a.title,
        date: toDateKey(a.dueDate),
        time: formatTime(a.dueDate),
        type: "deadline" as const,
        meta: a.courseTitle,
        href: `/dashboard/assignments/${a.id}`,
        description: a.courseTitle,
      }));

    const ceremonyEvents: CalendarEvent[] = certificates
      .filter((c) => c.status === "earned" && c.issuedAt)
      .map((c) => ({
        id: `cert-${c.id}`,
        title: `${c.title} Ceremony`,
        date: toDateKey(c.issuedAt!),
        time: formatTime(c.issuedAt!),
        type: "ceremony" as const,
        meta: DEPARTMENT_LABELS[c.department] ?? c.department,
        href: `/dashboard/certificates/${c.id}`,
        description: "Credential celebration",
      }));

    return [...assessmentEvents, ...deadlineEvents, ...ceremonyEvents];
  }, [assessments, assignments, certificates]);

  const filteredEvents = React.useMemo(
    () => events.filter((e) => activeTypes.has(e.type)),
    [events, activeTypes]
  );

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const calendarDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null);
  }

  const eventsByDate = filteredEvents.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {});

  Object.values(eventsByDate).forEach((list) => {
    list.sort((a, b) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title));
  });

  const today = todayKey();
  const upcoming = [...filteredEvents]
    .filter((e) => e.date >= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.time.localeCompare(b.time) ||
        a.title.localeCompare(b.title)
    )
    .slice(0, 24);

  const upcomingGroups = upcoming.reduce<{ date: string; events: CalendarEvent[] }[]>(
    (groups, event) => {
      const last = groups[groups.length - 1];
      if (last && last.date === event.date) {
        last.events.push(event);
      } else {
        groups.push({ date: event.date, events: [event] });
      }
      return groups;
    },
    []
  );

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];
  const monthEventCount = filteredEvents.filter((e) => {
    const [y, m] = e.date.split("-").map(Number);
    return y === year && m === month + 1;
  }).length;

  const presentTypes = TYPE_ORDER.filter((type) => events.some((e) => e.type === type));
  const filterTypes = presentTypes.length > 0 ? presentTypes : TYPE_ORDER;

  const dateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const goPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    const n = new Date();
    setYear(n.getFullYear());
    setMonth(n.getMonth());
    setSelectedDate(todayKey());
  };

  const toggleType = (type: EventType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size === 1) return prev;
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const selectDate = (key: string, options?: { openDialog?: boolean; eventId?: string }) => {
    const [y, m] = key.split("-").map(Number);
    setYear(y);
    setMonth(m - 1);
    setSelectedDate(key);
    if (options?.eventId) {
      setHighlightEventId(options.eventId);
      window.setTimeout(() => setHighlightEventId(null), 1600);
    }
    if (options?.openDialog) {
      setDayDialogOpen(true);
    }
  };

  const weekCount = calendarDays.length / 7;

  const openEvent = (event: CalendarEvent, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveEvent(event);
    setSelectedDate(event.date);
  };

  if (assessmentsLoading || assignmentsLoading || certsLoading) {
    return (
      <div className="flex h-[calc(100dvh-6.5rem)] flex-col gap-2 overflow-hidden">
        <Skeleton className="h-12 w-full shrink-0 rounded-xl" />
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,22%)]">
          <Skeleton className="h-full w-full rounded-2xl" />
          <Skeleton className="hidden h-full w-full rounded-2xl lg:block" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-6.5rem)] flex-col gap-2 overflow-hidden">
      {/* Compact toolbar — stays in viewport with the calendar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Learning Calendar</h1>
            <Badge variant="outline" className="gap-1 px-2 py-0.5 text-[11px]">
              <CalendarIcon className="h-3 w-3" />
              {monthEventCount} this month
            </Badge>
          </div>
          <p className="mt-0.5 hidden text-xs text-muted-foreground md:block">
            Assessments, sessions, assignments, and ceremonies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Filter className="h-3 w-3" />
            Filter
          </span>
          {filterTypes.map((type) => {
            const config = typeConfig[type];
            const active = activeTypes.has(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                aria-pressed={active}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-2 text-[11px] font-medium transition-colors",
                  active
                    ? "border-border bg-card text-foreground shadow-(--shadow-sm)"
                    : "border-transparent bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
                {config.shortLabel}
              </button>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-[11px] lg:hidden"
            onClick={() => setMobileShowAgenda((v) => !v)}
          >
            {mobileShowAgenda ? "Calendar" : "Agenda"}
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,22%)]">
        {/* Calendar */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-(--shadow-sm) dark:border-border-subtle",
            mobileShowAgenda && "hidden lg:flex"
          )}
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={goPrev}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="min-w-[8.5rem] text-center text-sm font-semibold tracking-tight">
                {monthName}
              </h2>
              <button
                type="button"
                onClick={goNext}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-[11px]"
              onClick={goToday}
            >
              Today
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col p-1.5 sm:p-2">
            <div className="grid shrink-0 grid-cols-7 border-b border-border">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="px-1 py-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {d}
                </div>
              ))}
            </div>

            <div
              className="grid min-h-0 flex-1 grid-cols-7 border-l border-t border-border"
              style={{ gridTemplateRows: `repeat(${weekCount}, minmax(0, 1fr))` }}
            >
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${i}`}
                      className="min-h-0 border-b border-r border-border bg-muted/20"
                    />
                  );
                }

                const key = dateKey(day);
                const dayEvents = eventsByDate[key] ?? [];
                const isSelected = selectedDate === key;
                const isToday = key === today;
                const hasEvents = dayEvents.length > 0;
                const visible = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
                const overflow = dayEvents.length - visible.length;

                return (
                  <div
                    key={key}
                    role="gridcell"
                    aria-selected={isSelected}
                    onClick={() => selectDate(key)}
                    className={cn(
                      "group relative flex min-h-0 cursor-pointer flex-col items-stretch gap-0.5 overflow-hidden border-b border-r border-border p-1 transition-colors",
                      "hover:bg-muted/40",
                      isSelected && "bg-primary/[0.06]"
                    )}
                  >
                    {isSelected && (
                      <span
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-0.5 bg-primary"
                      />
                    )}

                    <div className="flex shrink-0 items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => selectDate(key)}
                        aria-label={`${formatFullDate(key)}${hasEvents ? `, ${dayEvents.length} events` : ""}`}
                        aria-pressed={isSelected}
                        className={cn(
                          "inline-flex h-5 w-5 items-center justify-center text-[11px] font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-6 sm:w-6 sm:text-xs",
                          isToday &&
                            "rounded-full bg-primary text-primary-foreground",
                          !isToday && isSelected && "rounded-full bg-primary/15 text-primary",
                          !isToday && !isSelected && "rounded-full text-foreground hover:bg-muted"
                        )}
                      >
                        {day}
                      </button>
                      {dayEvents.length > 3 && (
                        <span className="hidden text-[10px] font-medium text-muted-foreground xl:inline">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                      {visible.map((event) => {
                        const config = typeConfig[event.type];
                        return (
                          <button
                            key={event.id}
                            type="button"
                            onClick={(e) => openEvent(event, e)}
                            className={cn(
                              "flex min-w-0 shrink items-center gap-1 overflow-hidden rounded px-1 py-0.5 text-left text-[10px] leading-tight transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                              config.chip,
                              highlightEventId === event.id && "ring-1 ring-primary"
                            )}
                            title={event.title}
                          >
                            <span
                              className={cn("h-1 w-1 shrink-0 rounded-full", config.dot)}
                            />
                            <span className="truncate font-medium">{event.title}</span>
                          </button>
                        );
                      })}
                      {overflow > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectDate(key, { openDialog: true });
                          }}
                          className="shrink-0 px-1 text-left text-[10px] font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          +{overflow} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected day — capped height so the month grid stays in view */}
          <AnimatePresence initial={false}>
            {selectedDate && (
              <motion.div
                key={selectedDate}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="shrink-0 overflow-hidden border-t border-border"
              >
                <div className="max-h-[22vh] overflow-y-auto px-2.5 py-2">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold tracking-tight">
                        {formatFullDate(selectedDate)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedEvents.length === 0
                          ? "No learning activities scheduled."
                          : `${selectedEvents.length} activit${selectedEvents.length === 1 ? "y" : "ies"}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      {selectedEvents.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => setDayDialogOpen(true)}
                        >
                          View all
                        </Button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedDate(null)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Clear selected date"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {eventsError ? (
                    <p className="text-[11px] text-warning">
                      Events could not be loaded — this list may be incomplete.
                    </p>
                  ) : selectedEvents.length === 0 ? null : (
                    <ul className="space-y-1">
                      {selectedEvents.slice(0, 4).map((event) => {
                        const config = typeConfig[event.type];
                        return (
                          <li key={event.id}>
                            <button
                              type="button"
                              onClick={() => openEvent(event)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/50",
                                highlightEventId === event.id && "bg-primary/[0.06]"
                              )}
                            >
                              <span
                                className={cn("h-1.5 w-1.5 shrink-0 rounded-full", config.dot)}
                              />
                              <p className="min-w-0 flex-1 truncate text-xs font-medium">
                                {event.title}
                              </p>
                              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                                {event.time}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                      {selectedEvents.length > 4 && (
                        <li>
                          <button
                            type="button"
                            onClick={() => setDayDialogOpen(true)}
                            className="px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                          >
                            +{selectedEvents.length - 4} more
                          </button>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Upcoming agenda */}
        <motion.aside
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-(--shadow-sm) dark:border-border-subtle",
            !mobileShowAgenda && "hidden lg:flex"
          )}
        >
          <div className="shrink-0 border-b border-border px-3 py-2">
            <h2 className="text-sm font-semibold tracking-tight">Upcoming</h2>
            <p className="text-[11px] text-muted-foreground">Next scheduled activities</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {eventsError ? (
              <p className="px-1 py-3 text-xs text-warning">
                Events could not be loaded — this list may be incomplete.
              </p>
            ) : upcomingGroups.length === 0 ? (
              <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                No upcoming learning activities.
              </p>
            ) : (
              <div className="space-y-2.5">
                {upcomingGroups.map((group) => (
                  <div key={group.date}>
                    <p className="sticky top-0 z-[1] bg-card px-1 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {formatDayHeading(group.date, today)}
                    </p>
                    <ul className="space-y-0.5">
                      {group.events.map((event) => {
                        const config = typeConfig[event.type];
                        const isSelectedDay = selectedDate === event.date;
                        return (
                          <li key={event.id}>
                            <button
                              type="button"
                              onClick={() =>
                                selectDate(event.date, { eventId: event.id })
                              }
                              onDoubleClick={() => openEvent(event)}
                              className={cn(
                                "flex w-full gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                isSelectedDay && "bg-primary/[0.05]"
                              )}
                            >
                              <div className="w-12 shrink-0 pt-0.5">
                                <p className="text-[11px] font-medium tabular-nums text-foreground">
                                  {event.time}
                                </p>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-xs font-medium leading-snug">
                                  {event.title}
                                </p>
                                <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[10px] text-muted-foreground">
                                  <span className="inline-flex items-center gap-1">
                                    <span
                                      className={cn("h-1.5 w-1.5 rounded-full", config.dot)}
                                    />
                                    {config.shortLabel}
                                  </span>
                                  {event.meta ? (
                                    <>
                                      <span aria-hidden>·</span>
                                      <span className="truncate">{event.meta}</span>
                                    </>
                                  ) : null}
                                </p>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border px-3 py-2">
            <p className="mb-1 text-[10px] font-medium text-muted-foreground">Legend</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
              {filterTypes.map((type) => (
                <div key={type} className="flex items-center gap-1.5 text-[10px] text-foreground">
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", typeConfig[type].dot)} />
                  <span className="truncate">{typeConfig[type].shortLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>
      </div>

      {/* Full day dialog for overflow */}
      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="max-w-md gap-3 p-5 sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedDate ? formatFullDate(selectedDate) : "Day schedule"}
            </DialogTitle>
            <DialogDescription>
              {selectedEvents.length === 0
                ? "No learning activities scheduled."
                : `${selectedEvents.length} activit${selectedEvents.length === 1 ? "y" : "ies"}`}
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
            {selectedEvents.map((event) => {
              const config = typeConfig[event.type];
              const Icon = config.icon;
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setDayDialogOpen(false);
                      openEvent(event);
                    }}
                    className="flex w-full items-start gap-3 rounded-xl border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        config.chip
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.time} · {config.label}
                        {event.meta ? ` · ${event.meta}` : ""}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>

      {/* Event detail */}
      <Dialog open={!!activeEvent} onOpenChange={(open) => !open && setActiveEvent(null)}>
        <DialogContent className="max-w-md gap-4 p-5 sm:rounded-2xl">
          {activeEvent && (
            <>
              <DialogHeader>
                <div className="mb-1">
                  <Badge variant={typeConfig[activeEvent.type].badge} className="px-2 py-0.5 text-xs">
                    {typeConfig[activeEvent.type].label}
                  </Badge>
                </div>
                <DialogTitle className="text-lg leading-snug">{activeEvent.title}</DialogTitle>
                <DialogDescription>
                  {formatFullDate(activeEvent.date)} · {activeEvent.time}
                  {activeEvent.meta ? ` · ${activeEvent.meta}` : ""}
                </DialogDescription>
              </DialogHeader>
              {activeEvent.description && (
                <p className="text-sm text-muted-foreground">{activeEvent.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {activeEvent.href && (
                  <Button asChild size="sm" className="h-10 px-4">
                    <Link href={activeEvent.href}>Open details</Link>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 px-4"
                  onClick={() => {
                    selectDate(activeEvent.date, { eventId: activeEvent.id });
                    setActiveEvent(null);
                  }}
                >
                  Show on calendar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
