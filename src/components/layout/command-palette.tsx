"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  Folders,
  GraduationCap,
  LayoutDashboard,
  Radar,
  Route,
  Settings,
  Shield,
  Trophy,
  Award,
  User,
  Building2,
  Users,
  HelpCircle,
  UserRoundSearch,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUIStore } from "@/store/ui-store";
import { cn, isExamRoute } from "@/lib/utils";

const commands = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Navigate" },
  { label: "My Learning", href: "/dashboard/learning", icon: BookOpen, group: "Navigate" },
  { label: "Learning Paths", href: "/dashboard/paths", icon: Route, group: "Navigate" },
  { label: "Courses", href: "/dashboard/courses", icon: GraduationCap, group: "Navigate" },
  { label: "Assessments", href: "/dashboard/assessments", icon: ClipboardCheck, group: "Navigate" },
  { label: "Assignments", href: "/dashboard/assignments", icon: FileText, group: "Navigate" },
  { label: "Certificates", href: "/dashboard/certificates", icon: Award, group: "Navigate" },
  { label: "Skill Matrix", href: "/dashboard/skills", icon: Radar, group: "Navigate" },
  { label: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy, group: "Navigate" },
  { label: "Calendar", href: "/dashboard/calendar", icon: Calendar, group: "Navigate" },
  { label: "Departments", href: "/dashboard/departments", icon: Building2, group: "Navigate" },
  { label: "Help & employee guide", href: "/dashboard/help", icon: HelpCircle, group: "Navigate" },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell, group: "Navigate" },
  { label: "Admin Overview", href: "/dashboard/admin", icon: Shield, group: "Admin" },
  { label: "Catalog Audit", href: "/dashboard/admin/catalog-audit", icon: ClipboardCheck, group: "Admin" },
  { label: "Employee Progress", href: "/dashboard/admin/employee-progress", icon: UserRoundSearch, group: "Admin" },
  { label: "Admin Courses", href: "/dashboard/admin/courses", icon: Folders, group: "Admin" },
  { label: "Admin Users", href: "/dashboard/admin/users", icon: Users, group: "Admin" },
  { label: "Admin Promotions", href: "/dashboard/admin/promotions", icon: Award, group: "Admin" },
  { label: "Profile", href: "/dashboard/profile", icon: User, group: "Account" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, group: "Account" },
];

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useUIStore();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  React.useEffect(() => {
    if (commandOpen) {
      setQuery("");
      setActive(0);
    }
  }, [commandOpen]);

  const run = (href: string) => {
    setCommandOpen(false);
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[active]) {
      run(filtered[active].href);
    }
  };

  if (isExamRoute(pathname)) return null;

  return (
    <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg [&>button]:hidden">
        <div className="flex items-center border-b px-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Type a command or search…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No results found.</p>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => run(item.href)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                    i === active ? "bg-pastel-purple text-primary" : "hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4 opacity-70" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                    {item.group}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
