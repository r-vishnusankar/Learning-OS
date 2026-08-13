"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Bell,
  BookOpen,
  Eye,
  Moon,
  Palette,
  Save,
  Shield,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCurrentUser,
  useMyPreferences,
  useUpdateMyPreferences,
  useUpdateMyProfile,
} from "@/hooks/use-me";
import { DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { cn } from "@/lib/utils";
import type { DepartmentId, LearningLevel } from "@/types";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary-strong" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: prefs, isLoading: prefsLoading } = useMyPreferences();
  const updateProfile = useUpdateMyProfile();
  const updatePrefs = useUpdateMyPreferences();

  React.useEffect(() => setMounted(true), []);

  const activeTheme = mounted ? (theme ?? "system") : "light";
  const [profile, setProfile] = React.useState({
    name: "",
    email: "",
    designation: "",
    department: "development" as DepartmentId,
    level: "intermediate" as LearningLevel,
  });
  const [notifications, setNotifications] = React.useState({
    emailDigest: true,
    assessmentReminders: true,
    streakAlerts: true,
    courseUpdates: false,
    teamActivity: true,
    marketingEmails: false,
  });
  const [learningPrefs, setLearningPrefs] = React.useState({
    dailyGoalMinutes: 45,
    preferredDifficulty: "intermediate",
    autoEnrollPaths: true,
    showLeaderboard: true,
    aiRecommendations: true,
  });
  const [privacy, setPrivacy] = React.useState({
    profileVisible: true,
    showProgress: true,
    showCertificates: true,
    analyticsOptIn: true,
  });

  React.useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.name,
      email: user.email,
      designation: user.designation,
      department: user.department,
      level: user.level,
    });
  }, [user]);

  React.useEffect(() => {
    if (!prefs) return;
    setNotifications((n) => ({
      emailDigest: prefs.emailDigest ?? n.emailDigest,
      assessmentReminders: prefs.assessmentReminders ?? n.assessmentReminders,
      streakAlerts: prefs.streakAlerts ?? n.streakAlerts,
      courseUpdates: prefs.courseUpdates ?? n.courseUpdates,
      teamActivity: prefs.teamActivity ?? n.teamActivity,
      marketingEmails: prefs.marketingEmails ?? n.marketingEmails,
    }));
    setLearningPrefs((p) => ({
      dailyGoalMinutes: prefs.dailyGoalMinutes ?? p.dailyGoalMinutes,
      preferredDifficulty: prefs.preferredDifficulty ?? p.preferredDifficulty,
      autoEnrollPaths: prefs.autoEnrollPaths ?? p.autoEnrollPaths,
      showLeaderboard: prefs.showLeaderboard ?? p.showLeaderboard,
      aiRecommendations: prefs.aiRecommendations ?? p.aiRecommendations,
    }));
    setPrivacy((p) => ({
      profileVisible: prefs.profileVisible ?? p.profileVisible,
      showProgress: prefs.showProgress ?? p.showProgress,
      showCertificates: prefs.showCertificates ?? p.showCertificates,
      analyticsOptIn: prefs.analyticsOptIn ?? p.analyticsOptIn,
    }));
  }, [prefs]);

  const saveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        name: profile.name,
        designation: profile.designation,
      });
      await updatePrefs.mutateAsync({
        dailyGoalMinutes: learningPrefs.dailyGoalMinutes,
      });
      toast.success("Settings saved", { description: "Profile preferences updated successfully." });
    } catch {
      toast.error("Could not save profile");
    }
  };

  const saveNotifications = async () => {
    try {
      await updatePrefs.mutateAsync(notifications);
      toast.success("Settings saved", { description: "Notification preferences updated successfully." });
    } catch {
      toast.error("Could not save notifications");
    }
  };

  const saveLearning = async () => {
    try {
      await updatePrefs.mutateAsync(learningPrefs);
      toast.success("Settings saved", { description: "Learning preferences updated successfully." });
    } catch {
      toast.error("Could not save learning preferences");
    }
  };

  const savePrivacy = async () => {
    try {
      await updatePrefs.mutateAsync(privacy);
      toast.success("Settings saved", { description: "Privacy preferences updated successfully." });
    } catch {
      toast.error("Could not save privacy settings");
    }
  };

  if (userLoading || prefsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Loading your preferences…" backHref="/dashboard" backLabel="Dashboard" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Your session is out of sync with the database (common after a DB region change)."
          backHref="/dashboard"
          backLabel="Dashboard"
        />
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-muted-foreground">
              Sign out and sign back in with{" "}
              <span className="font-mono">vishnu.sankar@valoriz.com</span> to refresh your session,
              then reopen Settings.
            </p>
            <Button asChild>
              <a href="/login">Go to login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, notifications, appearance, and learning preferences."
        backHref="/dashboard"
        backLabel="Dashboard"
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-3.5 w-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5">
            <Palette className="h-3.5 w-3.5" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="learning" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Learning
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <motion.div {...fade} transition={{ duration: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your public profile and account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{profile.name[0] ?? "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{profile.name}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="secondary">{DEPARTMENT_LABELS[profile.department]}</Badge>
                      <Badge variant="outline">{LEVEL_LABELS[profile.level]}</Badge>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full name</label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" value={profile.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Designation</label>
                    <Input
                      value={profile.designation}
                      onChange={(e) => setProfile((p) => ({ ...p, designation: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Daily learning goal (minutes)</label>
                    <Input
                      type="number"
                      value={learningPrefs.dailyGoalMinutes}
                      onChange={(e) =>
                        setLearningPrefs((p) => ({ ...p, dailyGoalMinutes: Number(e.target.value) }))
                      }
                    />
                  </div>
                </div>
                <Button
                  className="gap-2"
                  onClick={() => void saveProfile()}
                  disabled={updateProfile.isPending || updatePrefs.isPending}
                >
                  <Save className="h-4 w-4" /> Save profile
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications">
          <motion.div {...fade} transition={{ duration: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle>Notification preferences</CardTitle>
                <CardDescription>Choose what updates you receive</CardDescription>
              </CardHeader>
              <CardContent>
                <Toggle
                  checked={notifications.emailDigest}
                  onChange={(v) => setNotifications((n) => ({ ...n, emailDigest: v }))}
                  label="Weekly email digest"
                  description="Summary of your learning progress and recommendations"
                />
                <Separator />
                <Toggle
                  checked={notifications.assessmentReminders}
                  onChange={(v) => setNotifications((n) => ({ ...n, assessmentReminders: v }))}
                  label="Assessment reminders"
                  description="Alerts before assessment due dates"
                />
                <Separator />
                <Toggle
                  checked={notifications.streakAlerts}
                  onChange={(v) => setNotifications((n) => ({ ...n, streakAlerts: v }))}
                  label="Streak alerts"
                  description="Reminders to maintain your learning streak"
                />
                <Separator />
                <Toggle
                  checked={notifications.courseUpdates}
                  onChange={(v) => setNotifications((n) => ({ ...n, courseUpdates: v }))}
                  label="Course updates"
                  description="New lessons and content in enrolled courses"
                />
                <Separator />
                <Toggle
                  checked={notifications.teamActivity}
                  onChange={(v) => setNotifications((n) => ({ ...n, teamActivity: v }))}
                  label="Team activity"
                  description="Department announcements and milestones"
                />
                <Separator />
                <Toggle
                  checked={notifications.marketingEmails}
                  onChange={(v) => setNotifications((n) => ({ ...n, marketingEmails: v }))}
                  label="Product updates"
                  description="Skillrr platform news and feature announcements"
                />
                <Button
                  className="mt-4 gap-2"
                  onClick={() => void saveNotifications()}
                  disabled={updatePrefs.isPending}
                >
                  <Save className="h-4 w-4" /> Save notifications
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="appearance">
          <motion.div {...fade} transition={{ duration: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how Skillrr looks on your device</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Theme changes apply instantly. Skillrr uses a clean design system optimized for extended learning sessions.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(["light", "dark", "system"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border p-4 transition",
                        theme === t || (!mounted && t === "light")
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      {t === "light" && <Palette className="h-6 w-6 text-primary" />}
                      {t === "dark" && <Moon className="h-6 w-6 text-primary" />}
                      {t === "system" && <Eye className="h-6 w-6 text-primary" />}
                      <span className="text-sm font-medium capitalize">{t}</span>
                      {mounted && activeTheme === t && (
                        <Badge variant="secondary" className="rounded-full text-[10px]">
                          Active
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
                <Button
                  className="gap-2"
                  onClick={() =>
                    toast.success("Settings saved", {
                      description: "Appearance preferences updated successfully.",
                    })
                  }
                >
                  <Save className="h-4 w-4" /> Save appearance
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="learning">
          <motion.div {...fade} transition={{ duration: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle>Learning preferences</CardTitle>
                <CardDescription>Personalize your learning experience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-2">
                  <label className="text-sm font-medium">Preferred difficulty</label>
                  <select
                    value={learningPrefs.preferredDifficulty}
                    onChange={(e) =>
                      setLearningPrefs((p) => ({ ...p, preferredDifficulty: e.target.value }))
                    }
                    className="flex h-10 w-full max-w-xs rounded-lg border border-input bg-card px-3 text-sm"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <Toggle
                  checked={learningPrefs.autoEnrollPaths}
                  onChange={(v) => setLearningPrefs((p) => ({ ...p, autoEnrollPaths: v }))}
                  label="Auto-enroll in recommended paths"
                  description="Automatically enroll when AI recommends a learning path"
                />
                <Separator />
                <Toggle
                  checked={learningPrefs.showLeaderboard}
                  onChange={(v) => setLearningPrefs((p) => ({ ...p, showLeaderboard: v }))}
                  label="Show on leaderboard"
                  description="Display your rank on company and department leaderboards"
                />
                <Separator />
                <Toggle
                  checked={learningPrefs.aiRecommendations}
                  onChange={(v) => setLearningPrefs((p) => ({ ...p, aiRecommendations: v }))}
                  label="AI-powered recommendations"
                  description="Receive personalized course and skill suggestions"
                />
                <Button
                  className="mt-4 gap-2"
                  onClick={() => void saveLearning()}
                  disabled={updatePrefs.isPending}
                >
                  <Save className="h-4 w-4" /> Save learning preferences
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="privacy">
          <motion.div {...fade} transition={{ duration: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle>Privacy</CardTitle>
                <CardDescription>Control what others can see about your learning activity</CardDescription>
              </CardHeader>
              <CardContent>
                <Toggle
                  checked={privacy.profileVisible}
                  onChange={(v) => setPrivacy((p) => ({ ...p, profileVisible: v }))}
                  label="Public profile"
                  description="Allow colleagues to view your profile"
                />
                <Separator />
                <Toggle
                  checked={privacy.showProgress}
                  onChange={(v) => setPrivacy((p) => ({ ...p, showProgress: v }))}
                  label="Show course progress"
                  description="Display enrolled courses and completion status"
                />
                <Separator />
                <Toggle
                  checked={privacy.showCertificates}
                  onChange={(v) => setPrivacy((p) => ({ ...p, showCertificates: v }))}
                  label="Show certificates"
                  description="Display earned credentials on your profile"
                />
                <Separator />
                <Toggle
                  checked={privacy.analyticsOptIn}
                  onChange={(v) => setPrivacy((p) => ({ ...p, analyticsOptIn: v }))}
                  label="Learning analytics"
                  description="Help improve Skillrr with anonymized usage data"
                />
                <Button
                  className="mt-4 gap-2"
                  onClick={() => void savePrivacy()}
                  disabled={updatePrefs.isPending}
                >
                  <Save className="h-4 w-4" /> Save privacy settings
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
