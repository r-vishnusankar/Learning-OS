"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Mail,
  MoreHorizontal,
  Search,
  Trash2,
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
import { Skeleton } from "@/components/ui/skeleton";
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
import { DEPARTMENT_LABELS } from "@/constants/navigation";
import { ROLE_LABELS } from "@/lib/roles";
import {
  useAdminUsers,
  useAuditLogs,
  useBulkImportUsers,
  useDeleteUser,
  useInviteUser,
  useUpdateUser,
} from "@/hooks/use-operations";
import { useCurrentUser } from "@/hooks/use-me";
import { isProtectedAdminEmail } from "@/lib/dev-credentials";
import type { DepartmentId, UserRole } from "@/types";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const ROLES: UserRole[] = ["employee", "manager", "department_head", "instructor", "admin"];
const DEPTS = Object.keys(DEPARTMENT_LABELS) as DepartmentId[];

export default function AdminUsersPage() {
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<"active" | "inactive" | "all">("all");
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteForm, setInviteForm] = React.useState({
    name: "",
    email: "",
    department: "development" as DepartmentId,
    role: "employee" as UserRole,
  });
  const fileRef = React.useRef<HTMLInputElement>(null);

  const { data: users = [], isLoading } = useAdminUsers({
    search: search || undefined,
    role: roleFilter === "all" ? undefined : roleFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const { data: auditLogs = [] } = useAuditLogs();
  const { data: me } = useCurrentUser();
  const inviteUser = useInviteUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const bulkImport = useBulkImportUsers();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteUser.mutateAsync({
        name: inviteForm.name,
        email: inviteForm.email,
        department: inviteForm.department,
        role: inviteForm.role,
      });
      setInviteForm({ name: "", email: "", department: "development", role: "employee" });
      setInviteOpen(false);
      toast.success("User invited");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invite failed");
    }
  };

  const handleCsv = async (file: File) => {
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      toast.error("CSV needs a header and at least one row");
      return;
    }
    const rows = lines.slice(1).map((line) => {
      const [name, email, department, role, designation] = line.split(",").map((c) => c.trim());
      return {
        name,
        email,
        department: (department || "development") as DepartmentId,
        role: (role || "employee") as UserRole,
        designation,
      };
    });
    try {
      const result = await bulkImport.mutateAsync({ rows });
      toast.success(`Imported ${result.created} users`, {
        description: result.skipped ? `${result.skipped} skipped (already exist)` : undefined,
      });
    } catch {
      toast.error("CSV import failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Invite users, assign roles and departments, and manage access."
      >
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleCsv(file);
              e.target.value = "";
            }}
          />
          <Button variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Bulk CSV
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
                <DialogDescription>
                  Creates a Skillrr account profile. CSV format: name,email,department,role,designation
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <Input
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  required
                />
                <Input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Email"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={inviteForm.department}
                    onChange={(e) =>
                      setInviteForm((f) => ({ ...f, department: e.target.value as DepartmentId }))
                    }
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                  >
                    {DEPTS.map((id) => (
                      <option key={id} value={id}>
                        {DEPARTMENT_LABELS[id]}
                      </option>
                    ))}
                  </select>
                  <select
                    value={inviteForm.role}
                    onChange={(e) =>
                      setInviteForm((f) => ({ ...f, role: e.target.value as UserRole }))
                    }
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gap-2" disabled={inviteUser.isPending}>
                    <Mail className="h-4 w-4" /> Create user
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
              className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
            >
              <option value="all">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "active" | "inactive" | "all")}
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
        <motion.section {...fade} className="xl:col-span-2">
          <Card>
            {isLoading ? (
              <Skeleton className="m-4 h-64" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-sm text-muted-foreground">
                      <th className="px-5 py-3.5 font-medium">User</th>
                      <th className="px-5 py-3.5 font-medium">Department</th>
                      <th className="px-5 py-3.5 font-medium">Role</th>
                      <th className="px-5 py-3.5 font-medium">Status</th>
                      <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-border/60 transition hover:bg-muted/30">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={user.department}
                            onChange={async (e) => {
                              await updateUser.mutateAsync({
                                userId: user.id,
                                department: e.target.value as DepartmentId,
                              });
                              toast.success("Department updated");
                            }}
                            className="h-8 rounded-md border border-input bg-card px-2 text-xs"
                          >
                            {DEPTS.map((id) => (
                              <option key={id} value={id}>
                                {DEPARTMENT_LABELS[id]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={user.role}
                            onChange={async (e) => {
                              await updateUser.mutateAsync({
                                userId: user.id,
                                role: e.target.value as UserRole,
                              });
                              toast.success("Role updated");
                            }}
                            className="h-8 rounded-md border border-input bg-card px-2 text-xs"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            variant={user.status === "active" ? "success" : "draft"}
                            className="capitalize"
                          >
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
                              <DropdownMenuItem disabled>
                                {user.designation}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === "inactive" ? (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    await updateUser.mutateAsync({
                                      userId: user.id,
                                      status: "active",
                                    });
                                    toast.success("User reactivated");
                                  }}
                                >
                                  <UserPlus className="h-4 w-4" /> Reactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={async () => {
                                    await updateUser.mutateAsync({
                                      userId: user.id,
                                      status: "inactive",
                                    });
                                    toast.success("User deactivated");
                                  }}
                                >
                                  <UserMinus className="h-4 w-4" /> Deactivate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                disabled={
                                  deleteUser.isPending ||
                                  user.id === me?.id ||
                                  isProtectedAdminEmail(user.email)
                                }
                                onClick={async () => {
                                  const ok = window.confirm(
                                    `Delete ${user.name} (${user.email}) permanently? This cannot be undone.`
                                  );
                                  if (!ok) return;
                                  try {
                                    await deleteUser.mutateAsync({ userId: user.id });
                                    toast.success("User deleted");
                                  } catch (err) {
                                    toast.error(
                                      err instanceof Error ? err.message : "Delete failed"
                                    );
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.section>

        <motion.section {...fade}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Activity log
              </CardTitle>
              <CardDescription>Recent admin actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {auditLogs.length === 0 && (
                <p className="text-sm text-muted-foreground">No audited actions yet.</p>
              )}
              {auditLogs.map((log) => (
                <div key={log.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{log.action}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {log.entityType}
                    {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}
