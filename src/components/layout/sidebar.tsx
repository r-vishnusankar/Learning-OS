"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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
  ChevronDown,
  LogOut,
  HelpCircle,
  UserRoundSearch,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn, isExamRoute } from "@/lib/utils";
import {
  ADMIN_NAV_GROUPS,
  APP_NAME,
  SIDEBAR_NAV_GROUPS,
  SIDEBAR_PINNED,
} from "@/constants/navigation";
import { canAccessAdmin } from "@/lib/roles";
import { useUIStore } from "@/store/ui-store";
import { useUnreadNotificationCount } from "@/hooks/use-operations";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SkillrrIcon, SkillrrLogo } from "@/components/brand/skillrr-logo";
import type { NavGroup, NavItem } from "@/types";

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

function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  // Exact-only for section roots so they don't steal child active states
  if (href === "/dashboard" || href === "/dashboard/admin") return false;
  return pathname.startsWith(`${href}/`);
}

function groupContainsPath(group: NavGroup, pathname: string) {
  return group.items.some((item) => isNavActive(pathname, item.href));
}

function resolveGroupOpen(
  group: NavGroup,
  pathname: string,
  navGroupOpen: Record<string, boolean>
) {
  if (Object.prototype.hasOwnProperty.call(navGroupOpen, group.id)) {
    return navGroupOpen[group.id]!;
  }
  if (groupContainsPath(group, pathname)) return true;
  return group.defaultOpen ?? false;
}

function NavLink({
  href,
  title,
  icon,
  badge,
  collapsed,
  nested = false,
}: {
  href: string;
  title: string;
  icon: string;
  badge?: number;
  collapsed: boolean;
  nested?: boolean;
}) {
  const pathname = usePathname();
  const active = isNavActive(pathname, href);
  const Icon = icons[icon] ?? LayoutDashboard;

  const link = (
    <Link
      href={href}
      className={cn(
        "group flex min-w-0 items-center gap-2 rounded-[length:var(--radius)] py-1.5 text-[13px] leading-5 transition-colors duration-150",
        collapsed ? "justify-center px-2" : nested ? "px-2.5" : "px-2.5",
        active
          ? "bg-sidebar-active font-medium text-foreground"
          : "font-normal text-sidebar-foreground hover:bg-sidebar-active/60 hover:text-foreground"
      )}
    >
      {!nested && (
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 stroke-[1.5] transition-colors duration-150",
            active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
          )}
        />
      )}
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{title}</span>
          {badge ? (
            <span className="ml-auto flex h-4 min-w-4 shrink-0 items-center justify-center rounded-[3px] bg-foreground/10 px-1 text-[10px] font-medium leading-none text-foreground">
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

function NavGroupSection({
  group,
  collapsed,
  items,
}: {
  group: NavGroup;
  collapsed: boolean;
  items: NavItem[];
}) {
  const pathname = usePathname();
  const navGroupOpen = useUIStore((s) => s.navGroupOpen);
  const setNavGroupOpen = useUIStore((s) => s.setNavGroupOpen);
  const open = resolveGroupOpen(group, pathname, navGroupOpen);
  const sectionActive = groupContainsPath(group, pathname);
  const Icon = icons[group.icon] ?? LayoutDashboard;
  const badgeTotal = items.reduce((sum, item) => sum + (item.badge ?? 0), 0);

  // Open the group that owns the active route when the path changes (allows manual collapse after).
  useEffect(() => {
    if (!group.items.some((item) => isNavActive(pathname, item.href))) return;
    if (useUIStore.getState().navGroupOpen[group.id] === true) return;
    setNavGroupOpen(group.id, true);
    // Intentionally keyed to pathname so a manual collapse sticks until the next navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- group.items is stable per id
  }, [pathname, group.id, setNavGroupOpen]);

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={group.title}
            className={cn(
              "flex w-full items-center justify-center rounded-[length:var(--radius)] px-2 py-1.5 transition-colors duration-150",
              sectionActive
                ? "bg-sidebar-active text-foreground"
                : "text-muted-foreground hover:bg-sidebar-active/60 hover:text-foreground"
            )}
            aria-label={group.title}
          >
            <Icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="min-w-44">
          <DropdownMenuLabel>{group.title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.map((item) => {
            const ItemIcon = icons[item.icon] ?? LayoutDashboard;
            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href} className="flex items-center gap-2">
                  <ItemIcon className="h-4 w-4 stroke-[1.5]" />
                  <span className="flex-1">{item.title}</span>
                  {item.badge ? (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setNavGroupOpen(group.id, !open)}
        aria-expanded={open}
        aria-controls={`nav-group-${group.id}`}
        className={cn(
          "group flex w-full min-w-0 items-center gap-2 rounded-[length:var(--radius)] px-2.5 py-1.5 text-[13px] leading-5 transition-colors duration-150",
          sectionActive
            ? "bg-sidebar-active/70 font-medium text-foreground"
            : "font-normal text-sidebar-foreground hover:bg-sidebar-active/60 hover:text-foreground"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 stroke-[1.5] transition-colors duration-150",
            sectionActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
          )}
        />
        <span className="min-w-0 flex-1 truncate text-left">{group.title}</span>
        {badgeTotal > 0 && !open ? (
          <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-[3px] bg-foreground/10 px-1 text-[10px] font-medium leading-none text-foreground">
            {badgeTotal}
          </span>
        ) : null}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 stroke-[1.75] text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`nav-group-${group.id}`}
            key={group.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="relative ml-[18px] space-y-0.5 border-l border-border/80 py-0.5 pl-2.5">
              {items.map((item) => (
                <NavLink key={item.href} {...item} collapsed={false} nested />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function withNotificationBadge(items: NavItem[], unreadCount: number): NavItem[] {
  return items.map((item) =>
    item.href === "/dashboard/notifications"
      ? { ...item, badge: unreadCount > 0 ? unreadCount : undefined }
      : item
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore();
  const { data: session } = useSession();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const showAdmin = canAccessAdmin(session?.user?.role);

  const learnerGroups = SIDEBAR_NAV_GROUPS.map((group) => ({
    ...group,
    items: withNotificationBadge(group.items, unreadCount),
  }));

  if (isExamRoute(pathname)) return null;

  const content = (
    <aside
      className={cn(
        "flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-[240px]"
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2.5 px-3",
          sidebarCollapsed && "justify-center px-2"
        )}
      >
        {sidebarCollapsed ? (
          <SkillrrIcon size={32} />
        ) : (
          <SkillrrLogo size={28} />
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2">
        <nav className="space-y-0.5 py-2">
          {SIDEBAR_PINNED.map((item) => (
            <NavLink key={item.href} {...item} collapsed={sidebarCollapsed} />
          ))}
          {learnerGroups.map((group) => (
            <NavGroupSection
              key={group.id}
              group={group}
              collapsed={sidebarCollapsed}
              items={group.items}
            />
          ))}
        </nav>

        {showAdmin && (
          <>
            <div className="mx-2 my-3 h-px bg-border" />

            {!sidebarCollapsed && (
              <p className="mb-1 px-2.5 text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-muted-foreground/70">
                Admin
              </p>
            )}
            <nav className="space-y-0.5 pb-2">
              {ADMIN_NAV_GROUPS.map((group) => (
                <NavGroupSection
                  key={group.id}
                  group={group}
                  collapsed={sidebarCollapsed}
                  items={group.items}
                />
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
              className="flex min-w-0 flex-1 items-center gap-2 rounded-[length:var(--radius)] px-2.5 py-1.5 text-[13px] leading-5 text-muted-foreground transition-colors duration-150 hover:bg-sidebar-active/60 hover:text-foreground"
            >
              <Settings className="h-4 w-4 shrink-0 stroke-[1.75]" />
              <span className="truncate">Settings</span>
            </Link>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex shrink-0 items-center justify-center rounded-[length:var(--radius)] p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-sidebar-active/60 hover:text-foreground"
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
            className="flex w-full min-w-0 items-center gap-2 rounded-[length:var(--radius)] px-2.5 py-1.5 text-[13px] leading-5 text-muted-foreground transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
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
