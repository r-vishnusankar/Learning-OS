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
  Image,
  ChevronLeft,
  LogOut,
  HelpCircle,
  UserRoundSearch,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn, isExamRoute } from "@/lib/utils";
import { ADMIN_NAV, APP_NAME, SIDEBAR_NAV } from "@/constants/navigation";
import { canAccessAdmin } from "@/lib/roles";
import { useUIStore } from "@/store/ui-store";
import { useUnreadNotificationCount } from "@/hooks/use-operations";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NexusLogo } from "@/components/brand/nexus-logo";

const SIDEBAR_WIDTH = 240;

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
  Image,
  HelpCircle,
  UserRoundSearch,
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
        "group relative flex min-w-0 items-center gap-2.5 rounded-xl py-2 text-[13px] font-medium leading-5 tracking-normal transition-all duration-200 ease-out",
        collapsed ? "justify-center px-2" : "px-2.5 pl-3",
        active
          ? "bg-secondary text-primary"
          : "text-sidebar-foreground hover:bg-secondary/70 hover:text-primary"
      )}
    >
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
      )}
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 stroke-[1.75] transition-colors duration-200",
          active ? "text-primary" : "text-muted-foreground group-hover:text-primary"
        )}
      />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate tracking-normal">{title}</span>
          {badge ? (
            <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-strong px-1.5 text-[11px] font-semibold leading-none text-white">
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
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore();
  const { data: session } = useSession();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const showAdmin = canAccessAdmin(session?.user?.role);
  const learnerNav = SIDEBAR_NAV.map((item) =>
    item.href === "/dashboard/notifications"
      ? { ...item, badge: unreadCount > 0 ? unreadCount : undefined }
      : item
  );

  if (isExamRoute(pathname)) return null;

  const content = (
    <aside
      className={cn(
        "flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground shadow-(--shadow-sm) transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-[240px]"
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2.5 px-3",
          sidebarCollapsed && "justify-center px-2"
        )}
      >
        <NexusLogo size={32} className="shrink-0" />
        {!sidebarCollapsed && (
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate font-display text-[15px] font-semibold leading-5 tracking-normal text-foreground">
              {APP_NAME}
            </p>
            <p className="truncate text-[12px] leading-4 tracking-normal text-muted-foreground">
              Learning Platform
            </p>
          </div>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2">
        <nav className="space-y-0.5 py-2">
          {learnerNav.map((item) => (
            <NavLink key={item.href} {...item} collapsed={sidebarCollapsed} />
          ))}
        </nav>

        {showAdmin && (
          <>
            <div className="mx-2 my-3 h-px bg-border" />

            {!sidebarCollapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-muted-foreground">
                Admin
              </p>
            )}
            <nav className="space-y-0.5 pb-2">
              {ADMIN_NAV.map((item) => (
                <NavLink key={item.href} {...item} collapsed={sidebarCollapsed} />
              ))}
            </nav>
          </>
        )}
      </ScrollArea>

      <div className="shrink-0 space-y-1 border-t border-border/60 p-2">
        <div className="flex min-w-0 items-center gap-1">
          {!sidebarCollapsed && (
            <Link
              href="/dashboard/settings"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium leading-5 tracking-normal text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-primary"
            >
              <Settings className="h-4 w-4 shrink-0 stroke-[1.75]" />
              <span className="truncate">Settings</span>
            </Link>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex shrink-0 items-center justify-center rounded-xl p-2 text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-primary"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 stroke-[1.75] transition-transform",
                sidebarCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        {!sidebarCollapsed && (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium leading-5 tracking-normal text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 shrink-0 stroke-[1.75]" />
            <span className="truncate">Log out</span>
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
              className="fixed inset-0 z-40 bg-scrim lg:hidden"
              onClick={() => setSidebarMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -SIDEBAR_WIDTH }}
              animate={{ x: 0 }}
              exit={{ x: -SIDEBAR_WIDTH }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 w-[240px] lg:hidden"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
