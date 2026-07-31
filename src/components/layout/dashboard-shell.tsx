"use client";

import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/ui-store";
import { cn, isExamRoute } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const exam = isExamRoute(pathname);

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col transition-all duration-300",
        !exam && (collapsed ? "lg:pl-16" : "lg:pl-[240px]")
      )}
    >
      {children}
    </div>
  );
}
