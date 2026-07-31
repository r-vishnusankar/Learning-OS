"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/store/ui-store";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-operations";
import { cn, isExamRoute } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { usePathname } from "next/navigation";

const typeVariant = {
  info: "info",
  success: "success",
  warning: "warning",
  reminder: "secondary",
  achievement: "warning",
} as const;

export function NotificationPanel() {
  const pathname = usePathname();
  const { notificationsOpen, setNotificationsOpen } = useUIStore();
  const { data: notifications = [], isLoading, isError: notificationsError } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unread = notifications.filter((n) => !n.read).length;

  if (isExamRoute(pathname)) return null;

  return (
    <AnimatePresence>
      {notificationsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-scrim"
            onClick={() => setNotificationsOpen(false)}
          />
          <motion.aside
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Notifications</h2>
                {unread > 0 && <Badge variant="secondary">{unread}</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs"
                  disabled={unread === 0}
                  onClick={() => markAll.mutate()}
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Read all
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setNotificationsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : notificationsError ? (
                <p className="py-8 text-center text-sm text-warning">
                  Notifications could not be loaded — this list may be incomplete.
                </p>
              ) : notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No notifications</p>
              ) : (
                notifications.slice(0, 12).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={cn(
                      "w-full rounded-xl border border-border p-3 text-left transition hover:bg-muted/40",
                      !n.read && "border-primary/20 bg-primary/5"
                    )}
                    onClick={() => {
                      if (!n.read) markRead.mutate({ notificationId: n.id });
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      <Badge variant={typeVariant[n.type] ?? "secondary"} className="capitalize">
                        {n.type}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="border-t p-4">
              <Button asChild variant="outline" className="w-full" onClick={() => setNotificationsOpen(false)}>
                <Link href="/dashboard/notifications">View all</Link>
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
