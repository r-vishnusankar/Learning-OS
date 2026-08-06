"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import {
  ChevronDown,
  Code2,
  Eye,
  EyeOff,
  Headphones,
  Lock,
  Mail,
} from "lucide-react";
import { canAccessAdmin } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const DEV_PASSWORD = "nexus123";

const PRESETS = [
  { label: "Admin", email: "demo@nexus.local" },
  { label: "Employee", email: "riju.thomas@nexus.local" },
] as const;

const isDevLoginUi = process.env.NODE_ENV !== "production";

function MicrosoftMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 21 21"
      fill="none"
      aria-hidden
    >
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

const fieldClass = cn(
  "flex h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm text-foreground",
  "placeholder:text-muted-foreground",
  "transition-colors duration-150",
  "hover:border-border-control",
  "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/25"
);

export function LoginForm({ entraEnabled = false }: { entraEnabled?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [forgotHint, setForgotHint] = React.useState(false);
  const [supportHint, setSupportHint] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [microsoftLoading, setMicrosoftLoading] = React.useState(false);
  const [devOpen, setDevOpen] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setForgotHint(false);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }

    const session = await getSession();
    const role = session?.user?.role as UserRole | undefined;
    const dest = canAccessAdmin(role) ? "/dashboard/admin" : "/dashboard";

    router.push(dest);
    router.refresh();
  };

  const handleMicrosoft = async () => {
    setError(null);
    if (!entraEnabled) {
      setError("Microsoft sign-in is not configured for this environment.");
      return;
    }
    setMicrosoftLoading(true);
    await signIn("microsoft-entra-id", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="w-full max-w-[420px]">
      <div className="rounded-2xl border border-border/80 bg-card p-7 shadow-(--shadow-md) sm:p-8">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground">Sign in to continue to Nexus</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email address
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                id="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                placeholder="demo@nexus.local"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError(null);
                }}
                required
                disabled={loading || microsoftLoading}
                aria-invalid={error ? true : undefined}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError(null);
                }}
                required
                disabled={loading || microsoftLoading}
                aria-invalid={error ? true : undefined}
                className={cn(fieldClass, "pr-11")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={loading || microsoftLoading}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                className="text-xs font-medium text-primary transition-colors hover:text-primary-hover focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                onClick={() => {
                  setForgotHint((v) => !v);
                  setSupportHint(false);
                }}
              >
                Forgot password?
              </button>
            </div>
            {forgotHint ? (
              <p className="text-xs text-muted-foreground">
                Contact your administrator to reset your password.
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || microsoftLoading}
            className={cn(
              "mt-5 flex h-11 w-full items-center justify-center rounded-lg",
              "bg-primary-strong text-sm font-semibold text-primary-foreground",
              "transition-colors duration-150",
              "hover:bg-primary-hover",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:pointer-events-none disabled:opacity-60"
            )}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3" aria-hidden>
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or sign in with</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleMicrosoft}
          disabled={loading || microsoftLoading}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2.5 rounded-lg",
            "border border-border bg-card text-sm font-medium text-foreground",
            "transition-colors duration-150",
            "hover:bg-muted/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
            "disabled:pointer-events-none disabled:opacity-60"
          )}
        >
          <MicrosoftMark />
          {microsoftLoading ? "Redirecting…" : "Sign in with Microsoft"}
        </button>

        <div className="mt-6 border-t border-border pt-5">
          <button
            type="button"
            onClick={() => {
              setSupportHint((v) => !v);
              setForgotHint(false);
            }}
            className="mx-auto flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Headphones className="h-3.5 w-3.5" aria-hidden />
            <span>
              Need help?{" "}
              <span className="font-medium text-primary">Contact support</span>
            </span>
          </button>
          {supportHint ? (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Reach your IT administrator for account access and sign-in help.
            </p>
          ) : null}
        </div>
      </div>

      {isDevLoginUi ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-border/80 bg-muted/50">
          <button
            type="button"
            onClick={() => setDevOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={devOpen}
          >
            <Code2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="flex-1 font-medium">Test accounts (for development only)</span>
            <ChevronDown
              className={cn("h-3.5 w-3.5 shrink-0 transition-transform", devOpen && "rotate-180")}
            />
          </button>

          {devOpen ? (
            <div className="space-y-1 border-t border-border/80 px-3 py-3 text-xs text-muted-foreground">
              {PRESETS.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  className="flex w-full flex-col gap-0.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-card hover:text-foreground"
                  onClick={() => {
                    setEmail(p.email);
                    setPassword(DEV_PASSWORD);
                    setError(null);
                    setForgotHint(false);
                  }}
                >
                  <span className="font-medium text-foreground">{p.label}</span>
                  <span className="font-mono text-[11px]">{p.email}</span>
                </button>
              ))}
              <p className="px-2 pt-1.5">
                Password: <span className="font-mono text-foreground">{DEV_PASSWORD}</span>
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
