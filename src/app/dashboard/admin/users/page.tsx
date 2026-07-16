"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Mail,
  MoreHorizontal,
  Search,
  Upload,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { currentUser, departments, leaderboard } from "@/data/mock";
import { DEPARTMENT_LABELS } from "@/constants/navigation";
import type { DepartmentId, UserRole } from "@/types";

type UserStatus = "active" | "inactive";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  department: DepartmentId;
  role: UserRole;
  status: UserStatus;
  designation: string;
  joinDate: string;
}

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const designations: Record<DepartmentId, string> = {
  qa: "QA Engineer",
  development: "Software Engineer",
  ba: "Business Analyst",
  hr: "HR Specialist",
  marketing: "Marketing Manager",
  uiux: "Product Designer",
  devops: "DevOps Engineer",
};

function buildMockUsers(): AdminUser[] {
  const fromLeaderboard: AdminUser[] = leaderboard.slice(0, 8).map((entry, i) => ({
    id: entry.userId,
    name: entry.name,
    email: `${entry.name.toLowerCase().replace(/\s+/g, ".")}@nexuscorp.com`,
    avatar: entry.avatar,
    department: entry.department,
    role: i === 0 ? "admin" : i < 3 ? "manager" : "employee",
    status: i === 7 ? "inactive" : "active",
    designation: designations[entry.department],
    joinDate: `202${3 + (i % 3)}-0${(i % 9) + 1}-15`,
  }));

  const alex: AdminUser = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    avatar: currentUser.avatar,
    department: currentUser.department,
    role: currentUser.role,
    status: "active",
    designation: currentUser.designation,
    joinDate: currentUser.joinDate,
  };

  if (!fromLeaderboard.find((u) => u.id === alex.id)) {
    fromLeaderboard.push(alex);
  }

  return fromLeaderboard.slice(0, 10);
}

const activityLog = [
  { id: "1", action: "User invited", user: "Priya Nair", detail: "Invited as employee · Development", timestamp: "2026-07-13T09:00:00Z" },
  { id: "2", action: "Role updated", user: "Samira Khan", detail: "Promoted to manager", timestamp: "2026-07-12T14:30:00Z" },
  { id: "3", action: "User deactivated", user: "Diego Alvarez", detail: "Account set to inactive", timestamp: "2026-07-11T11:00:00Z" },
  { id: "4", action: "Bulk upload", user: "Admin", detail: "24 users imported from CSV", timestamp: "2026-07-10T16:45:00Z" },
  { id: "5", action: "Department assigned", user: "Lisa Park", detail: "Moved to Business Analyst", timestamp: "2026-07-09T10:20:00Z" },
];

const ROLES: UserRole[] = ["employee", "manager", "admin"];

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<AdminUser[]>(buildMockUsers);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<UserStatus | "all">("all");
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteForm, setInviteForm] = React.useState({
    name: "",
    email: "",
    department: "development" as DepartmentId,
    role: "employee" as UserRole,
  });

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    const newUser: AdminUser = {
      id: `u${Date.now()}`,
      name: inviteForm.name,
      email: inviteForm.email,
      avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${inviteForm.name}`,
      department: inviteForm.department,
      role: inviteForm.role,
      status: "active",
      designation: designations[inviteForm.department],
      joinDate: new Date().toISOString().split("T")[0],
    };
    setUsers((prev) => [newUser, ...prev]);
    setInviteForm({ name: "", email: "", department: "development", role: "employee" });
    setInviteOpen(false);
    toast.success("Invitation sent", { description: `${newUser.name} has been invited to Nexus.` });
  };

  const updateUser = (id: string, updates: Partial<AdminUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    toast.success("User updated");
  };

  const deactivate = (id: string, name: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: "inactive" } : u)));
    toast.success("User deactivated", { description: `${name} can no longer access the platform.` });
  };

  const roleBadge = (role: UserRole) => {
    const variants = { employee: "secondary", manager: "info", admin: "default", department_head: "warning", instructor: "outline" } as const;
    return <Badge variant={variants[role] ?? "secondary"} className="capitalize">{role.replace("_", " ")}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Invite users, assign roles and departments, and manage access."
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => toast.success("Bulk upload started", { description: "Processing CSV file — 24 users queued." })}
          >
            <Upload className="h-4 w-4" /> Bulk upload
          </Button>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" /> Invite user
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite user</DialogTitle>
                <DialogDescription>Send an invitation to join your organization on Nexus.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full name</label>
                  <Input
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Jane Smith"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="jane.smith@nexuscorp.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Department</label>
                    <select
                      value={inviteForm.department}
                      onChange={(e) => setInviteForm((f) => ({ ...f, department: e.target.value as DepartmentId }))}
                      className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                      className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} className="capitalize">{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                  <Button type="submit" className="gap-2">
                    <Mail className="h-4 w-4" /> Send invite
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <motion.section {...fade} transition={{ duration: 0.4 }}>
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users…"
                className="pl-9"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
              className="h-9 rounded-lg border border-input bg-card px-3 text-sm capitalize"
            >
              <option value="all">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | "all")}
              className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </CardContent>
        </Card>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-3">
        <motion.section {...fade} transition={{ delay: 0.05, duration: 0.4 }} className="xl:col-span-2">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-5 py-3 font-medium">User</th>
                    <th className="px-5 py-3 font-medium">Department</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.id} className="border-b border-border/60 transition hover:bg-muted/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={user.department}
                          onChange={(e) => updateUser(user.id, { department: e.target.value as DepartmentId })}
                          className="h-8 rounded-md border border-input bg-card px-2 text-xs"
                        >
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>{DEPARTMENT_LABELS[d.id]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => updateUser(user.id, { role: e.target.value as UserRole })}
                          className="h-8 rounded-md border border-input bg-card px-2 text-xs capitalize"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={user.status === "active" ? "success" : "secondary"} className="capitalize">
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toast.info("View profile", { description: user.name })}>
                              View profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={user.status === "inactive"}
                              onClick={() => deactivate(user.id, user.name)}
                            >
                              <UserMinus className="h-4 w-4" /> Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.section>

        <motion.section {...fade} transition={{ delay: 0.1, duration: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Activity log
              </CardTitle>
              <CardDescription>Recent admin actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activityLog.map((log) => (
                <div key={log.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{log.action}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{log.user}</p>
                  <p className="text-xs text-muted-foreground">{log.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}
