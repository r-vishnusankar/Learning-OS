"use client";

import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col transition-all duration-300",
        collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
      )}
    >
      {children}
    </div>
  );
}
