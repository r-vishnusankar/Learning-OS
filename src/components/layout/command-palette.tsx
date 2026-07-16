"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Trophy,
  Award,
  Sparkles,
  Settings,
  User,
  Building2,
  ClipboardCheck,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

const commands = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Navigate" },
  { label: "My Learning", href: "/dashboard/learning", icon: BookOpen, group: "Navigate" },
  { label: "Courses", href: "/dashboard/courses", icon: GraduationCap, group: "Navigate" },
  { label: "Assessments", href: "/dashboard/assessments", icon: ClipboardCheck, group: "Navigate" },
  { label: "Certificates", href: "/dashboard/certificates", icon: Award, group: "Navigate" },
  { label: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy, group: "Navigate" },
  { label: "Departments", href: "/dashboard/departments", icon: Building2, group: "Navigate" },
  { label: "AI Mentor", href: "/dashboard/ai-mentor", icon: Sparkles, group: "Navigate" },
  { label: "Profile", href: "/dashboard/profile", icon: User, group: "Account" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, group: "Account" },
];

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useUIStore();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const router = useRouter();

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
                    i === active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
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
