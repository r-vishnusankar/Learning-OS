"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
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
import { currentUser, notifications } from "@/data/mock";
import { formatNumber } from "@/lib/utils";
import { DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";

export function Header() {
  const { setSidebarMobileOpen, setCommandOpen, setNotificationsOpen } = useUIStore();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCommandOpen]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 bg-background/90 px-4 backdrop-blur-xl md:px-8">
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-xl lg:hidden"
        onClick={() => setSidebarMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden min-w-0 flex-col sm:flex">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          Welcome back {currentUser.name.split(" ")[0]} 👋
        </h1>
        <p className="text-xs text-muted-foreground">
          {currentUser.designation} · {DEPARTMENT_LABELS[currentUser.department]}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="mx-auto flex h-12 max-w-md flex-1 items-center gap-3 rounded-full border-0 bg-card px-5 text-sm text-muted-foreground shadow-(--shadow-sm) transition hover:shadow-(--shadow)"
      >
        <Search className="h-4 w-4 text-primary" />
        <span className="flex-1 text-left">Search here...</span>
        <kbd className="hidden rounded-lg bg-muted px-2 py-0.5 font-mono text-[10px] sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-pastel-yellow px-3 py-1.5 text-xs font-semibold text-foreground sm:flex">
          <Zap className="h-3.5 w-3.5 text-[#c9a227]" />
          {formatNumber(currentUser.xp)} XP
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-pastel-purple px-3 py-1.5 text-xs font-semibold text-primary md:flex">
          <Coins className="h-3.5 w-3.5" />
          {formatNumber(currentUser.coins)}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full bg-card shadow-(--shadow-sm)"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full bg-card text-primary shadow-(--shadow-sm)"
          onClick={() => setNotificationsOpen(true)}
        >
          <Bell className="h-4 w-4 fill-primary/20" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="rounded-full ring-2 ring-primary/20 transition hover:ring-primary/40">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback>AR</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span>{currentUser.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{currentUser.email}</span>
                <Badge variant="secondary" className="mt-1 w-fit rounded-full">
                  {LEVEL_LABELS[currentUser.level]}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <User className="h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
