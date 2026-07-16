"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  Clock,
  Folders,
  GraduationCap,
  Lightbulb,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/cards/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { departments, leaderboard } from "@/data/mock";
import { DEPARTMENT_LABELS } from "@/constants/navigation";
import { formatNumber } from "@/lib/utils";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const totalEmployees = departments.reduce((s, d) => s + d.employeeCount, 0);
const totalCourses = departments.reduce((s, d) => s + d.courseCount, 0);
const avgCompletion = Math.round(
  departments.reduce((s, d) => s + d.avgCompletion, 0) / departments.length
);
const totalHours = Math.round(totalEmployees * 42.5);

const aiInsights = [
  {
    title: "DevOps needs support",
    description: "DevOps completion rate (66%) is below org average. Schedule mentorship sessions.",
    priority: "high",
  },
  {
    title: "HR leads adoption",
    description: "Human Resources at 81% completion — share their onboarding playbook with other departments.",
    priority: "medium",
  },
  {
    title: "Course demand spike",
    description: "System Design and CI/CD paths saw 34% enrollment increase this month.",
    priority: "low",
  },
];

const quickLinks = [
  { title: "Course Management", description: "Create, publish, and archive department courses", href: "/dashboard/admin/courses", icon: Folders },
  { title: "User Management", description: "Invite users, assign roles, and manage access", href: "/dashboard/admin/users", icon: Users },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Overview"
        description="Organization analytics, top performers, and administrative quick actions."
      >
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" /> Department Head
        </Badge>
      </PageHeader>

      <motion.section
        {...fade}
        transition={{ duration: 0.4 }}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard title="Total Employees" value={formatNumber(totalEmployees)} icon={Users} subtitle="Across 7 departments" accent="#0D9488" />
        <StatCard title="Active Courses" value={totalCourses} icon={BookOpen} trend="+6 new" accent="#0284C7" />
        <StatCard title="Learning Hours" value={formatNumber(totalHours)} icon={Clock} subtitle="Org-wide YTD" accent="#059669" />
        <StatCard title="Completion Rate" value={`${avgCompletion}%`} icon={GraduationCap} trend="+4%" accent="#CA8A04" />
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.section
          {...fade}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">AI Insights</h2>
          </div>
          <div className="space-y-3">
            {aiInsights.map((insight) => (
              <Card key={insight.title}>
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{insight.title}</p>
                      <Badge
                        variant={
                          insight.priority === "high"
                            ? "destructive"
                            : insight.priority === "medium"
                              ? "warning"
                              : "secondary"
                        }
                        className="capitalize"
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        <motion.section {...fade} transition={{ delay: 0.1, duration: 0.4 }} className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Quick Links</h2>
          {quickLinks.map((link) => (
            <Card key={link.href} className="group transition hover:border-primary/40">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                    <link.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{link.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{link.description}</p>
                    <Button asChild variant="ghost" size="sm" className="mt-2 h-8 gap-1 px-0 text-primary">
                      <Link href={link.href}>
                        Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Performers
            </CardTitle>
            <CardDescription>Company leaderboard — highest XP earners</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {leaderboard.slice(0, 5).map((entry) => (
              <div key={entry.userId} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                  {entry.rank}
                </span>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={entry.avatar} />
                  <AvatarFallback>{entry.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {DEPARTMENT_LABELS[entry.department]} · {formatNumber(entry.xp)} XP
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Award className="h-3.5 w-3.5" />
                  {entry.certificates}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department completion rates</CardTitle>
            <CardDescription>Average course completion by department</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {departments.slice(0, 6).map((dept) => (
              <div key={dept.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{dept.name}</span>
                  <span className="text-muted-foreground">{dept.avgCompletion}%</span>
                </div>
                <Progress value={dept.avgCompletion} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
