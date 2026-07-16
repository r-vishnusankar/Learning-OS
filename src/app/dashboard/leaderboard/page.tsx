"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Building,
  Flame,
  Footprints,
  Medal,
  Moon,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { achievements, currentUser, leaderboard } from "@/data/mock";
import { DEPARTMENT_LABELS } from "@/constants/navigation";
import { cn, formatNumber } from "@/lib/utils";
import type { Achievement, LeaderboardEntry } from "@/types";

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const achievementIcons: Record<string, LucideIcon> = {
  Footprints,
  Flame,
  Award,
  Moon,
  Trophy,
  Building,
  Users,
  Star,
};

const rarityStyles: Record<Achievement["rarity"], { badge: string; border: string; glow: string }> = {
  common: { badge: "bg-muted text-muted-foreground", border: "border-border", glow: "" },
  rare: { badge: "bg-info/15 text-info", border: "border-info/30", glow: "" },
  epic: { badge: "bg-primary/15 text-primary", border: "border-primary/40", glow: "shadow-[0_0_20px_rgba(15,118,110,0.15)]" },
  legendary: { badge: "bg-warning/15 text-warning", border: "border-warning/40", glow: "shadow-[0_0_24px_rgba(217,119,6,0.2)]" },
};

const podiumConfig = [
  { place: 2, height: "h-28", medal: "text-muted-foreground", delay: 0.15 },
  { place: 1, height: "h-36", medal: "text-warning", delay: 0 },
  { place: 3, height: "h-24", medal: "text-[#B45309]", delay: 0.3 },
];

function rerank(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return entries
    .sort((a, b) => b.xp - a.xp)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const top3 = entries.slice(0, 3);
  const ordered = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="flex items-end justify-center gap-4 px-4 py-6 md:gap-8">
      {ordered.map((entry, idx) => {
        const config = podiumConfig[idx];
        if (!entry || !config) return null;
        const isCurrentUser = entry.userId === currentUser.id;

        return (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: config.delay, duration: 0.5, ease: "easeOut" }}
            className="flex w-28 flex-col items-center md:w-36"
          >
            <div className="relative mb-3">
              <Avatar className={cn("h-16 w-16 border-4 md:h-20 md:w-20", isCurrentUser ? "border-primary" : "border-card")}>
                <AvatarImage src={entry.avatar} />
                <AvatarFallback>{entry.name[0]}</AvatarFallback>
              </Avatar>
              <div className={cn("absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-card shadow-(--shadow-md)", config.medal)}>
                <Medal className="h-4 w-4" />
              </div>
            </div>
            <p className="truncate text-center text-sm font-semibold">{entry.name.split(" ")[0]}</p>
            <p className="text-xs text-muted-foreground">{formatNumber(entry.xp)} XP</p>
            {isCurrentUser && (
              <Badge className="mt-1 bg-accent text-accent-foreground">You</Badge>
            )}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              transition={{ delay: config.delay + 0.2, duration: 0.6 }}
              className={cn("mt-3 w-full rounded-t-xl bg-linear-to-t from-primary/20 to-primary/5", config.height)}
            >
              <p className="pt-3 text-center font-display text-2xl font-bold text-primary">#{config.place}</p>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-[auto_1fr_repeat(4,minmax(0,auto))] gap-3 border-b border-border bg-muted/50 px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground max-md:hidden">
        <span className="w-8">Rank</span>
        <span>Learner</span>
        <span className="w-20 text-right">XP</span>
        <span className="w-16 text-right">Streak</span>
        <span className="w-16 text-right">Certs</span>
        <span className="w-16 text-right">Badges</span>
      </div>
      <div className="divide-y divide-border">
        {entries.map((entry) => {
          const isCurrentUser = entry.userId === currentUser.id;
          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: entry.rank * 0.03 }}
              className={cn(
                "grid grid-cols-1 items-center gap-3 px-4 py-3 transition md:grid-cols-[auto_1fr_repeat(4,minmax(0,auto))]",
                isCurrentUser && "bg-primary/5 ring-1 ring-inset ring-primary/20"
              )}
            >
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold md:w-8", entry.rank <= 3 ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground")}>
                {entry.rank}
              </span>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={entry.avatar} />
                  <AvatarFallback>{entry.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {entry.name}
                    {isCurrentUser && <Badge className="ml-2 bg-accent text-accent-foreground">You</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">{DEPARTMENT_LABELS[entry.department]}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm md:contents">
                <span className="font-semibold md:w-20 md:text-right">{formatNumber(entry.xp)}</span>
                <span className="inline-flex items-center gap-1 md:w-16 md:justify-end">
                  <Flame className="h-3.5 w-3.5 text-warning" /> {entry.streak}
                </span>
                <span className="md:w-16 md:text-right">{entry.certificates}</span>
                <span className="md:w-16 md:text-right">{entry.badges}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState("company");

  const companyEntries = useMemo(() => leaderboard, []);
  const departmentEntries = useMemo(
    () => rerank(leaderboard.filter((e) => e.department === currentUser.department)),
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaderboard"
        description="Celebrate top learners across the company and within your department."
      >
        <Badge variant="secondary" className="gap-1">
          <Trophy className="h-3 w-3" /> Rank #{currentUser.companyRank} company
        </Badge>
      </PageHeader>

      <motion.section {...fade} transition={{ duration: 0.4 }}>
        <Card className="overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-primary/5 to-transparent" />
          <CardHeader className="text-center">
            <CardTitle className="font-display text-xl">Top performers</CardTitle>
            <CardDescription>Company-wide podium · updated daily</CardDescription>
          </CardHeader>
          <CardContent>
            <Podium entries={companyEntries} />
          </CardContent>
        </Card>
      </motion.section>

      <motion.section {...fade} transition={{ delay: 0.05, duration: 0.4 }}>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="department">Department</TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Full rankings</CardTitle>
                <CardDescription>All learners ranked by XP earned</CardDescription>
              </CardHeader>
              <CardContent>
                <LeaderboardTable entries={companyEntries} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="department">
            <Card>
              <CardHeader>
                <CardTitle>{DEPARTMENT_LABELS[currentUser.department]} rankings</CardTitle>
                <CardDescription>
                  Your department rank: #{currentUser.departmentRank}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaderboardTable entries={departmentEntries} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.section>

      <motion.section {...fade} transition={{ delay: 0.1, duration: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>Your badge collection with rarity tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {achievements.map((ach) => {
                const Icon = achievementIcons[ach.icon] ?? Trophy;
                const style = rarityStyles[ach.rarity];
                return (
                  <motion.div
                    key={ach.id}
                    whileHover={{ y: -4 }}
                    className={cn(
                      "relative rounded-xl border p-4 transition",
                      style.border,
                      ach.earned ? style.glow : "opacity-60 grayscale",
                      !ach.earned && "border-dashed"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", style.badge)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge className={cn("capitalize", style.badge)} variant="outline">
                        {ach.rarity}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm font-semibold">{ach.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{ach.description}</p>
                    {ach.earned && ach.earnedAt && (
                      <p className="mt-2 text-[11px] text-success">Earned {ach.earnedAt}</p>
                    )}
                    {!ach.earned && (
                      <p className="mt-2 text-[11px] text-muted-foreground">Locked</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
