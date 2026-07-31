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
import { formatNumber, isExamRoute } from "@/lib/utils";
import { DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
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
  const { setSidebarMobileOpen, setCommandOpen, setNotificationsOpen } = useUIStore();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { data: unread = 0 } = useUnreadNotificationCount();

  const user = session?.user;
  const designation = user?.designation ?? "Team Member";
  const department = user?.department ? DEPARTMENT_LABELS[user.department] : "Development";
  const level = user?.level ?? "beginner";
  const xp = user?.xp ?? 0;
  const coins = user?.coins ?? 0;

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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-background/85 px-4 backdrop-blur-xl md:px-8">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={() => setSidebarMobileOpen(true)}
      >
        <Menu className="h-5 w-5 stroke-[1.75]" />
      </Button>

      <div className="hidden min-w-0 shrink-0 flex-col sm:flex">
        <p className="text-caption">
          {designation} · {department}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="flex h-10 w-full max-w-sm items-center gap-2.5 rounded-full bg-card px-4 text-sm text-muted-foreground shadow-(--shadow-sm) transition-all duration-200 hover:shadow-(--shadow)"
      >
        <Search className="h-4 w-4 shrink-0 stroke-[1.75] text-primary" />
        <span className="flex-1 truncate text-left">Search…</span>
        <kbd className="hidden rounded-lg bg-muted px-1.5 py-0.5 font-mono text-caption sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-data text-sm font-semibold text-secondary-foreground shadow-(--shadow-sm) sm:flex">
          <Zap className="h-3.5 w-3.5 stroke-[1.75] text-primary" />
          {formatNumber(xp)} XP
        </div>
        <div className="hidden items-center gap-1.5 rounded-full bg-card px-3 py-1.5 font-data text-sm font-medium text-foreground shadow-(--shadow-sm) md:flex">
          <Coins className="h-3.5 w-3.5 stroke-[1.75] text-primary" />
          {formatNumber(coins)}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full bg-card shadow-(--shadow-sm)"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4 stroke-[1.75]" />
          ) : (
            <Moon className="h-4 w-4 stroke-[1.75]" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="relative rounded-full bg-card shadow-(--shadow-sm)"
          onClick={() => setNotificationsOpen(true)}
        >
          <Bell className="h-4 w-4 stroke-[1.75] text-foreground" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full transition-all duration-200 hover:ring-2 hover:ring-primary/25"
            >
              <Avatar className="h-9 w-9 shadow-(--shadow-sm)">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
                <AvatarFallback>{initials(user?.name ?? "U")}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl border-0 shadow-(--shadow-md)">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold">{user?.name ?? "Signed in user"}</span>
                <span className="text-sm font-normal text-description">{user?.email}</span>
                <Badge variant={levelToBadgeVariant(level)} className="mt-0.5 w-fit">
                  {LEVEL_LABELS[level]}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <User className="h-4 w-4 stroke-[1.75]" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4 stroke-[1.75]" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4 stroke-[1.75]" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
