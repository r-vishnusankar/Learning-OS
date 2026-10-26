"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { changePasswordAction } from "@/services/auth-actions";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  // Client-side policy hint (server enforces authoritatively)
  const policyMet = newPassword.length >= 8 && /\d/.test(newPassword);
  const matchesMet = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const result = await changePasswordAction({ currentPassword, newPassword, confirmPassword });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast.success("Password updated. Please sign in again.");
      // Redirect to login so the JWT refreshes cleanly with mustChangePassword = false
      router.push("/login");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Banner shown for forced password change */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Your account was set up with a temporary password. You must create a new password before
            continuing.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Set your password
            </CardTitle>
            <CardDescription>
              Enter the temporary password your administrator provided, then choose a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Current (temporary) password */}
              <div className="space-y-1.5">
                <label htmlFor="current" className="text-sm font-medium">
                  Temporary password
                </label>
                <div className="relative">
                  <Input
                    id="current"
                    type={showCurrent ? "text" : "password"}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                    disabled={pending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    disabled={pending}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none disabled:opacity-50"
                    aria-label={showCurrent ? "Hide password" : "Show password"}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label htmlFor="new" className="text-sm font-medium">
                  New password
                </label>
                <div className="relative">
                  <Input
                    id="new"
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                    disabled={pending}
                    aria-invalid={newPassword.length > 0 && !policyMet ? true : undefined}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    disabled={pending}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none disabled:opacity-50"
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  <li className={newPassword.length >= 8 ? "text-green-600 dark:text-green-400" : ""}>
                    {newPassword.length >= 8 ? "✓" : "·"} At least 8 characters
                  </li>
                  <li className={/\d/.test(newPassword) ? "text-green-600 dark:text-green-400" : ""}>
                    {/\d/.test(newPassword) ? "✓" : "·"} At least one number
                  </li>
                </ul>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label htmlFor="confirm" className="text-sm font-medium">
                  Confirm new password
                </label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  disabled={pending}
                  aria-invalid={confirmPassword.length > 0 && !matchesMet ? true : undefined}
                />
                {confirmPassword.length > 0 && !matchesMet && (
                  <p className="text-xs text-destructive">Passwords do not match.</p>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={pending || !policyMet || !matchesMet}
              >
                {pending ? "Saving…" : "Set password and continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
