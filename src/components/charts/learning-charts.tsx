"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint, Skill } from "@/types";

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

export function HoursChart({ data, height = 220 }: { data: ChartPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="fillPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="value" stroke="var(--chart-1)" fill="url(#fillPrimary)" strokeWidth={2} name="You" />
        <Area type="monotone" dataKey="secondary" stroke="var(--chart-2)" fill="transparent" strokeWidth={2} strokeDasharray="4 4" name="Team avg" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SkillGrowthChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="fillSkill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[40, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="value" stroke="var(--chart-2)" fill="url(#fillSkill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SkillRadarChart({ skills }: { skills: Skill[] }) {
  const data = skills.map((s) => ({
    skill: s.name.split(" ")[0],
    current: s.current,
    target: s.target,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="skill" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
        <Radar name="Current" dataKey="current" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.25} />
        <Radar name="Target" dataKey="target" stroke="var(--chart-2)" fill="transparent" strokeDasharray="4 4" />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function LearningHeatmap({ data }: { data: number[][] }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-muted-foreground">
        {days.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>
      <div className="space-y-1.5">
        {data.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map((v, di) => (
              <div
                key={`${wi}-${di}`}
                title={`${v} sessions`}
                className={`aspect-square rounded-sm heat-${v} transition hover:ring-2 hover:ring-ring`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1.5 pt-1 text-[10px] text-muted-foreground">
        <span>Less</span>
        {[0, 1, 2, 3].map((v) => (
          <div key={v} className={`h-3 w-3 rounded-sm heat-${v}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
