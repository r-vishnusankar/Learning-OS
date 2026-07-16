"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/store/ui-store";
import { notifications } from "@/data/mock";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const typeVariant = {
  info: "info",
  success: "success",
  warning: "warning",
  reminder: "secondary",
} as const;

export function NotificationPanel() {
  const { notificationsOpen, setNotificationsOpen } = useUIStore();

  return (
    <AnimatePresence>
      {notificationsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20"
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
                <h2 className="font-display text-base font-semibold">Notifications</h2>
                <Badge variant="secondary">{notifications.filter((n) => !n.read).length} new</Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setNotificationsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4 scrollbar-thin">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "rounded-xl border p-4 transition",
                    n.read ? "border-border bg-card" : "border-primary/20 bg-accent/40"
                  )}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    <Badge variant={typeVariant[n.type]} className="shrink-0 capitalize">
                      {n.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
