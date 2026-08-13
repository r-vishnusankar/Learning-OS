"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Circle,
  Filter,
  Info,
  Sparkles,
  TriangleAlert,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-operations";
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
  { value: "achievement", label: "Achievement" },
];

const typeConfig = {
  info: { variant: "info" as const, icon: Info },
  success: { variant: "success" as const, icon: CheckCheck },
  warning: { variant: "warning" as const, icon: TriangleAlert },
  reminder: { variant: "secondary" as const, icon: Sparkles },
  achievement: { variant: "warning" as const, icon: Trophy },
};

export default function NotificationsPage() {
  const { data: items = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay updated on assessments, assignments, courses, and learning milestones."
        backHref="/dashboard"
        backLabel="Dashboard"
      >
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && <Badge variant="secondary">{unreadCount} unread</Badge>}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => markAll.mutate()}
            disabled={unreadCount === 0 || markAll.isPending}
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
          <TabsList>
            {TYPE_FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button
          variant={showUnreadOnly ? "default" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={() => setShowUnreadOnly((v) => !v)}
        >
          <Filter className="h-3.5 w-3.5" /> Unread only
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You're all caught up."
          icon={<Bell className="h-6 w-6" />}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((n, i) => {
            const config = typeConfig[n.type] ?? typeConfig.info;
            const Icon = config.icon;
            const body = (
              <Card
                className={cn(
                  "transition hover:shadow-sm",
                  !n.read && "border-primary/25 bg-primary/5"
                )}
              >
                <CardContent className="flex gap-4 p-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{n.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                      </div>
                      {!n.read && <Circle className="mt-1 h-2.5 w-2.5 fill-primary text-primary" />}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={config.variant} className="capitalize">
                        {n.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                      </span>
                      {!n.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.preventDefault();
                            markRead.mutate({ notificationId: n.id });
                          }}
                        >
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );

            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                {n.href ? <Link href={n.href}>{body}</Link> : body}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
