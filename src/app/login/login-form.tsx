"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { NexusLogo } from "@/components/brand/nexus-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEV_PASSWORD = "nexus123";

const PRESETS = [
  {
    label: "Admin",
    email: "demo@nexus.local",
    hint: "Alex Rivera · full admin + Promotions",
  },
  {
    label: "Employee",
    email: "riju.thomas@nexus.local",
    hint: "Riju Thomas · Technical Architect · assigned courses",
  },
] as const;

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState(PRESETS[0].email);
  const [password, setPassword] = React.useState(DEV_PASSWORD);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    const dest =
      email.toLowerCase() === "demo@nexus.local"
        ? "/dashboard/admin"
        : "/dashboard";
    router.push(dest);
    router.refresh();
  };

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <NexusLogo size={56} />
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Nexus
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Sign in to continue. Use Admin or Employee presets below to test the career loop.
          </p>
        </div>
      </div>

      <div className="flex w-full max-w-sm gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.email}
            type="button"
            variant={email === p.email ? "default" : "outline"}
            className="flex-1"
            onClick={() => {
              setEmail(p.email);
              setPassword(DEV_PASSWORD);
              setError(null);
            }}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <div className="space-y-2 text-left">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2 text-left">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          type="submit"
          size="lg"
          className="h-12 rounded-full text-base font-semibold"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="w-full max-w-sm space-y-3 rounded-2xl bg-pastel-purple px-4 py-3 text-left text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Test accounts (password: nexus123)</p>
        {PRESETS.map((p) => (
          <div key={p.email}>
            <p className="font-medium text-foreground">{p.label}</p>
            <p className="font-mono">{p.email}</p>
            <p>{p.hint}</p>
          </div>
        ))}
        <p className="pt-1">
          Any seeded <span className="font-mono">*@nexus.local</span> employee works with the same
          password.
        </p>
      </div>
    </div>
  );
}
