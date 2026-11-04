"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import {
  Bell,
  Menu,
  Moon,
  Search,
  Sun,
  User,
  Settings,
  LogOut,
  Zap,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/store/ui-store";
import { useUnreadNotificationCount } from "@/hooks/use-operations";
import { useCurrentUser } from "@/hooks/use-me";
import { formatNumber, isExamRoute } from "@/lib/utils";
import { DEPARTMENT_LABELS, LEVEL_LABELS, firstLevelForDepartment, normalizeCareerLevel } from "@/constants/navigation";
import { levelToBadgeVariant } from "@/lib/status-styles";
import { usePathname } from "next/navigation";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: me } = useCurrentUser();
  const { setSidebarMobileOpen, setCommandOpen, setNotificationsOpen } = useUIStore();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { data: unread = 0 } = useUnreadNotificationCount();

  const user = session?.user;
  const profile = me ?? user;
  const designation = profile?.designation ?? "Team Member";
  const departmentKey = profile?.department ?? user?.department;
  const department = departmentKey ? DEPARTMENT_LABELS[departmentKey] : "Development";
  const level = profile?.level
    ? departmentKey
      ? normalizeCareerLevel(profile.level, departmentKey)
      : profile.level
    : departmentKey
      ? firstLevelForDepartment(departmentKey)
      : "associate";
  const xp = profile?.xp ?? user?.xp ?? 0;
  const coins = profile?.coins ?? user?.coins ?? 0;

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        if (isExamRoute(pathname)) return;
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, setCommandOpen]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  if (isExamRoute(pathname)) return null;

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={() => setSidebarMobileOpen(true)}
      >
        <Menu className="h-4 w-4 stroke-[1.5]" />
      </Button>

      <div className="hidden min-w-0 shrink-0 flex-col sm:flex">
        <p className="text-caption">
          {designation} · {department}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="flex h-7 w-full max-w-[280px] items-center gap-2 rounded-[length:var(--radius)] border border-border bg-card px-3 text-muted-foreground transition-colors duration-150 hover:border-border-control hover:text-foreground"
      >
        <Search className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
        <span className="flex-1 truncate text-left text-xs">Search…</span>
        <kbd className="hidden rounded bg-muted px-1 py-px font-mono text-[10px] sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-1 rounded-[length:var(--radius)] border border-border bg-card px-2.5 py-1 font-data text-xs font-medium text-foreground sm:flex">
          <Zap className="h-3 w-3 stroke-[1.5] text-muted-foreground" />
          {formatNumber(xp)} XP
        </div>
        <div className="hidden items-center gap-1 rounded-[length:var(--radius)] border border-border bg-card px-2.5 py-1 font-data text-xs font-medium text-foreground md:flex">
          <Coins className="h-3 w-3 stroke-[1.5] text-muted-foreground" />
          {formatNumber(coins)}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4 stroke-[1.5]" />
          ) : (
            <Moon className="h-4 w-4 stroke-[1.5]" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          onClick={() => setNotificationsOpen(true)}
        >
          <Bell className="h-4 w-4 stroke-[1.5] text-foreground" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-destructive ring-1 ring-background" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-[length:var(--radius)] transition-colors duration-150 hover:ring-2 hover:ring-border"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
                <AvatarFallback className="text-xs">{initials(user?.name ?? "U")}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-[length:var(--radius-lg)] border border-border shadow-(--shadow-md)">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">{me?.name ?? user?.name ?? "Signed in user"}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                <Badge variant={levelToBadgeVariant(level)} className="mt-0.5 w-fit">
                  {LEVEL_LABELS[level]}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <User className="h-3.5 w-3.5 stroke-[1.5]" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="h-3.5 w-3.5 stroke-[1.5]" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-3.5 w-3.5 stroke-[1.5]" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
