"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Bug,
  Code2,
  Megaphone,
  Palette,
  TrendingUp,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { departments } from "@/data/mock";
import { cn } from "@/lib/utils";

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const deptIcons: Record<string, LucideIcon> = {
  Bug,
  Code2,
  Briefcase,
  Users,
  Megaphone,
  Palette,
  Workflow,
};

export default function DepartmentsPage() {
  const totalEmployees = departments.reduce((sum, d) => sum + d.employeeCount, 0);
  const totalCourses = departments.reduce((sum, d) => sum + d.courseCount, 0);
  const avgCompletion = Math.round(
    departments.reduce((sum, d) => sum + d.avgCompletion, 0) / departments.length
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Explore learning programs, completion rates, and roadmaps across every department."
      >
        <Badge variant="secondary">{departments.length} departments</Badge>
      </PageHeader>

      <motion.section {...fade} transition={{ duration: 0.4 }} className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total employees</p>
              <p className="font-display text-2xl font-semibold">{totalEmployees.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-info/10 text-info">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total courses</p>
              <p className="font-display text-2xl font-semibold">{totalCourses}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg completion</p>
              <p className="font-display text-2xl font-semibold">{avgCompletion}%</p>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <motion.section
        {...fade}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {departments.map((dept, i) => {
          const Icon = deptIcons[dept.icon] ?? Users;
          return (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
            >
              <Link
                href={`/dashboard/departments/${dept.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-(--shadow-sm) transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-(--shadow-md)"
              >
                <div className="relative h-2" style={{ backgroundColor: dept.color }} />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-105"
                      style={{ backgroundColor: `${dept.color}18`, color: dept.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>

                  <h3 className="mt-4 font-display text-lg font-semibold">{dept.name}</h3>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">{dept.description}</p>

                  <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-muted/60 p-2">
                      <p className="text-sm font-semibold">{dept.employeeCount}</p>
                      <p className="text-[10px] text-muted-foreground">Employees</p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2">
                      <p className="text-sm font-semibold">{dept.courseCount}</p>
                      <p className="text-[10px] text-muted-foreground">Courses</p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2">
                      <p className={cn("text-sm font-semibold", dept.avgCompletion >= 75 ? "text-success" : "")}>
                        {dept.avgCompletion}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">Completion</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                      <span>Avg completion</span>
                      <span>{dept.avgCompletion}%</span>
                    </div>
                    <Progress value={dept.avgCompletion} className="h-1.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.section>
    </div>
  );
}
