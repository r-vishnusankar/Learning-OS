"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Clock, Route, Users, Zap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { useLearnerPaths } from "@/hooks/use-certification";
import { cn, formatHours } from "@/lib/utils";

export default function LearningPathsPage() {
  const { data: learningPaths = [], isLoading } = useLearnerPaths();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Paths"
        description="Structured career tracks designed to take you from fundamentals to mastery."
      >
        <Button variant="outline" className="gap-2" asChild>
          <Link href="/dashboard/courses">
            <Route className="h-4 w-4" /> Browse courses
          </Link>
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : learningPaths.length === 0 ? (
        <EmptyState
          title="No learning paths published"
          description="Paths will appear here once an admin publishes a track."
          icon={<Route className="h-6 w-6" />}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-2">
          {learningPaths.map((path, i) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
            >
              <Card className="group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-(--shadow-md)">
                <div className="relative aspect-[2.5/1] overflow-hidden bg-muted">
                  <Image
                    src={path.thumbnail}
                    alt={path.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge className="bg-primary/90 text-primary-foreground">
                        {DEPARTMENT_LABELS[path.department]}
                      </Badge>
                      <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur">
                        {LEVEL_LABELS[path.level]}
                      </Badge>
                    </div>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-lg">{path.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{path.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" /> {path.coursesCount} steps
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {formatHours(path.durationHours)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {path.enrolledCount.toLocaleString()} enrolled
                    </span>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span
                        className={cn(
                          "font-semibold",
                          path.progress > 0 ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {path.progress}%
                      </span>
                    </div>
                    <Progress value={path.progress} className="h-2" />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {path.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-[11px]">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="gap-2">
                  <Button asChild className="flex-1 gap-2">
                    <Link href={`/dashboard/paths/${path.id}`}>
                      {path.progress > 0 ? (
                        <>
                          <Zap className="h-4 w-4" /> Continue Path
                        </>
                      ) : (
                        "View path"
                      )}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
