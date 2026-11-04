"use client";

import { motion } from "framer-motion";
import {
  Award,
  BarChart3,
  Brain,
  Building2,
  Clock,
  Download,
  GraduationCap,
  Lightbulb,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/cards/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HoursChart,
  MonthlyChart,
  SkillGrowthChart,
} from "@/components/charts/learning-charts";
import {
  departments,
  monthlyLearning,
  skillGrowth,
  weeklyHours,
} from "@/data/mock";
import { formatNumber } from "@/lib/utils";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

const departmentComparison = departments.map((d) => ({
  name: d.name.split(" ")[0],
  completion: d.avgCompletion,
  hours: Math.round(d.employeeCount * 4.2),
  enrolled: d.courseCount * 12,
}));

const assessmentPerformance = [
  { label: "Jan", value: 78, secondary: 72 },
  { label: "Feb", value: 82, secondary: 74 },
  { label: "Mar", value: 79, secondary: 76 },
  { label: "Apr", value: 85, secondary: 78 },
  { label: "May", value: 88, secondary: 80 },
  { label: "Jun", value: 86, secondary: 81 },
  { label: "Jul", value: 91, secondary: 83 },
];

const certificationTrends = [
  { label: "Jan", value: 42 },
  { label: "Feb", value: 58 },
  { label: "Mar", value: 51 },
  { label: "Apr", value: 67 },
  { label: "May", value: 74 },
  { label: "Jun", value: 82 },
  { label: "Jul", value: 69 },
];

const engagementMetrics = [
  { label: "Mon", value: 82 },
  { label: "Tue", value: 88 },
  { label: "Wed", value: 76 },
  { label: "Thu", value: 91 },
  { label: "Fri", value: 85 },
  { label: "Sat", value: 62 },
  { label: "Sun", value: 48 },
];

const aiInsights = [
  {
    title: "Completion velocity up 12%",
    description: "Development and DevOps teams are outpacing Q2 targets. Consider accelerating advanced path releases.",
    icon: TrendingUp,
    variant: "success" as const,
  },
  {
    title: "Assessment gap in QA",
    description: "QA automation practical scores trail department average by 14%. Recommend targeted lab sessions.",
    icon: Target,
    variant: "warning" as const,
  },
  {
    title: "Certification surge",
    description: "69 credentials issued in July — 18% above forecast. TypeScript Professional driving adoption.",
    icon: Award,
    variant: "info" as const,
  },
  {
    title: "Engagement dip weekends",
    description: "Weekend activity is 38% below weekday average. Micro-learning nudges could improve consistency.",
    icon: Lightbulb,
    variant: "secondary" as const,
  },
];

const totalEmployees = departments.reduce((s, d) => s + d.employeeCount, 0);
const totalCourses = departments.reduce((s, d) => s + d.courseCount, 0);
const avgCompletion = Math.round(
  departments.reduce((s, d) => s + d.avgCompletion, 0) / departments.length
);
const totalHours = departmentComparison.reduce((s, d) => s + d.hours, 0);

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Organization-wide learning trends, performance insights, and AI-powered recommendations."
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Export report
        </Button>
      </PageHeader>

      <div
        role="status"
        className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
      >
        Charts on this page use sample datasets from <code className="text-xs">src/data/mock.ts</code>{" "}
        (department counts, weekly hours, trends). They are not wired to live org analytics yet.
      </div>

      <motion.section
        {...fade}
        transition={{ duration: 0.4 }}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard title="Total Learners" value={formatNumber(totalEmployees)} icon={Users} trend="+8%" accent="success" />
        <StatCard title="Active Courses" value={totalCourses} icon={GraduationCap} subtitle="Across 7 departments" accent="info" />
        <StatCard title="Learning Hours" value={formatNumber(totalHours)} icon={Clock} trend="+15% MoM" accent="success" />
        <StatCard title="Avg Completion" value={`${avgCompletion}%`} icon={BarChart3} subtitle="Org-wide rate" accent="warning" />
      </motion.section>

      <motion.section {...fade} transition={{ delay: 0.05, duration: 0.4 }}>
        <div className="mb-4 flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">AI Insights</h2>
          <Badge variant="info" className="gap-1">
            <Zap className="h-3 w-3" /> Skillrr AI
          </Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {aiInsights.map((insight) => (
            <Card key={insight.title} className="border-l-4 border-l-primary/60">
              <CardContent className="flex gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <insight.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{insight.title}</p>
                    <Badge variant={insight.variant} className="text-[10px]">Insight</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{insight.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Completion trends</CardTitle>
                <CardDescription>Monthly learning hours — you vs team average</CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyChart data={monthlyLearning} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Learning hours</CardTitle>
                <CardDescription>Weekly activity breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <HoursChart data={weeklyHours} />
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Skill growth trajectory</CardTitle>
                <CardDescription>Composite skill score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <SkillGrowthChart data={skillGrowth} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Certification trends</CardTitle>
                <CardDescription>Credentials issued per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={certificationTrends} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} name="Certificates" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Department comparison
              </CardTitle>
              <CardDescription>Completion rates and learning hours by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={departmentComparison} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="completion" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="Completion %" />
                  <Bar dataKey="hours" fill="var(--chart-2)" radius={[4, 4, 0, 0]} name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.slice(0, 6).map((dept) => (
              <Card key={dept.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{dept.name}</p>
                    <Badge variant="outline">{dept.avgCompletion}%</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>{dept.employeeCount} employees</span>
                    <span>{dept.courseCount} courses</span>
                  </div>
                  <div
                    className="mt-3 h-1.5 rounded-full"
                    style={{ background: `${dept.color}30` }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${dept.avgCompletion}%`, background: dept.color }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment performance</CardTitle>
              <CardDescription>Average scores vs passing threshold over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={assessmentPerformance} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[60, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 4 }} name="Avg score" />
                  <Line type="monotone" dataKey="secondary" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Passing avg" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Pass Rate" value="87%" icon={Target} trend="+3%" accent="success" />
            <StatCard title="Avg Score" value="86%" icon={BarChart3} subtitle="Across all assessments" accent="info" />
            <StatCard title="Attempts" value="1,284" icon={GraduationCap} subtitle="This quarter" accent="success" />
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily engagement score</CardTitle>
                <CardDescription>Active learner participation index</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={engagementMetrics} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[40, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="value" stroke="var(--chart-1)" fill="url(#fillEngagement)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard title="DAU" value="412" icon={Users} trend="+6%" accent="success" />
              <StatCard title="Session Avg" value="38m" icon={Clock} subtitle="Per active learner" accent="info" />
              <StatCard title="Streak Rate" value="64%" icon={Zap} subtitle="7+ day streaks" accent="warning" />
              <StatCard title="Return Rate" value="78%" icon={TrendingUp} trend="+2%" accent="success" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
