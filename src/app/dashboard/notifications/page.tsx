"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Circle,
  Filter,
  Info,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notifications as initialNotifications } from "@/data/mock";
import type { NotificationItem } from "@/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type TypeFilter = NotificationItem["type"] | "all";

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "reminder", label: "Reminder" },
];

const typeConfig = {
  info: { variant: "info" as const, icon: Info },
  success: { variant: "success" as const, icon: CheckCheck },
  warning: { variant: "warning" as const, icon: TriangleAlert },
  reminder: { variant: "secondary" as const, icon: Sparkles },
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      if (showUnreadOnly && n.read) return false;
      return true;
    });
  }, [items, typeFilter, showUnreadOnly]);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay updated on assessments, assignments, courses, and learning milestones."
      >
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} unread</Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            {TYPE_FILTERS.map((f) => (
              <TabsTrigger
                key={f.value}
                value={f.value}
                className="rounded-full border border-transparent px-4 data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                {f.label}
                {f.value !== "all" && (
                  <span className="ml-1.5 text-muted-foreground">
                    ({items.filter((n) => n.type === f.value).length})
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Button
          variant={showUnreadOnly ? "default" : "outline"}
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => setShowUnreadOnly((v) => !v)}
        >
          <Filter className="h-3.5 w-3.5" />
          {showUnreadOnly ? "Showing unread" : "Unread only"}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No notifications"
          description={
            showUnreadOnly
              ? "You're all caught up — no unread notifications match this filter."
              : "No notifications match the selected type filter."
          }
          icon={<Bell className="h-6 w-6" />}
          actionLabel={showUnreadOnly ? "Show all" : undefined}
          onAction={showUnreadOnly ? () => setShowUnreadOnly(false) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((n, i) => {
            const config = typeConfig[n.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <Card
                  className={cn(
                    "transition hover:shadow-sm",
                    !n.read && "border-primary/25 bg-accent/30"
                  )}
                >
                  <CardContent className="flex gap-4 p-5">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        n.type === "info" && "bg-info/15 text-info",
                        n.type === "success" && "bg-success/15 text-success",
                        n.type === "warning" && "bg-warning/15 text-warning",
                        n.type === "reminder" && "bg-secondary text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {!n.read && <Circle className="h-2 w-2 fill-primary text-primary" />}
                          <h3 className="text-sm font-semibold">{n.title}</h3>
                        </div>
                        <Badge variant={config.variant} className="shrink-0 capitalize">
                          {n.type}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                      </p>
                    </div>

                    {!n.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 self-start text-xs"
                        onClick={() => markAsRead(n.id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
