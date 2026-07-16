"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Route,
  Building2,
  GraduationCap,
  ClipboardCheck,
  FileText,
  Award,
  Radar,
  Trophy,
  BarChart3,
  Calendar,
  Sparkles,
  Bell,
  Settings,
  Shield,
  Folders,
  Users,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, APP_NAME, SIDEBAR_NAV } from "@/constants/navigation";
import { useUIStore } from "@/store/ui-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NexusLogo } from "@/components/brand/nexus-logo";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  BookOpen,
  Route,
  Building2,
  GraduationCap,
  ClipboardCheck,
  FileText,
  Award,
  Radar,
  Trophy,
  BarChart3,
  Calendar,
  Sparkles,
  Bell,
  Settings,
  Shield,
  Folders,
  Users,
};

function NavLink({
  href,
  title,
  icon,
  badge,
  collapsed,
}: {
  href: string;
  title: string;
  icon: string;
  badge?: number;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  const Icon = icons[icon] ?? LayoutDashboard;

  const link = (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-sidebar-active text-primary shadow-sm"
          : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground")} />
      {!collapsed && (
        <>
          <span className="truncate">{title}</span>
          {badge ? (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-white">
              {badge}
            </span>
          ) : null}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{title}</TooltipContent>
      </Tooltip>
    );
  }
  return link;
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore();

  const content = (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
        sidebarCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div
        className={cn(
          "flex h-20 items-center gap-3 px-5",
          sidebarCollapsed && "justify-center px-2"
        )}
      >
        <NexusLogo size={40} />
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold tracking-tight text-foreground">
              {APP_NAME}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">Learning Platform</p>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-0.5 py-2">
          {SIDEBAR_NAV.map((item) => (
            <NavLink key={item.href} {...item} collapsed={sidebarCollapsed} />
          ))}
        </nav>

        <div className="my-3 h-px bg-sidebar-border" />

        {!sidebarCollapsed && (
          <p className="mb-2 px-3.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Admin
          </p>
        )}
        <nav className="space-y-0.5 pb-2">
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.href} {...item} collapsed={sidebarCollapsed} />
          ))}
        </nav>
      </ScrollArea>

      <div className="space-y-3 p-3">
        <div className="flex items-center gap-1">
          {!sidebarCollapsed && (
            <Link
              href="/dashboard/settings"
              className="flex flex-1 items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex items-center justify-center rounded-2xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
          </button>
        </div>

        {!sidebarCollapsed && (
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-pastel-pink hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex">{content}</div>
      <AnimatePresence>
        {sidebarMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setSidebarMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 w-[260px] lg:hidden"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
