import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/layout/command-palette";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AiAssistant, NotificationPanel } from "@/components/layout/lazy-overlays";
import { accountMaySignIn, readAccountStatus } from "@/lib/account-status";
import { getProfileByUserId } from "@/lib/profile";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user) {
    const status = await readAccountStatus(session.user.id, session.user.email);
    if (!accountMaySignIn(status)) {
      // Session cookies can't be cleared during render; this route handler signs out.
      redirect("/account-inactive");
    }
  }

  // Fetch fresh role from DB (not JWT) so the palette filter is always accurate,
  // even if the JWT role is stale after a role change.
  const profile = session?.user?.id
    ? await getProfileByUserId(session.user.id)
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <DashboardShell>
        <Header />
        <main className="w-full flex-1 px-4 py-5 md:px-6 lg:px-8">
          {children}
        </main>
      </DashboardShell>
      <CommandPalette role={profile?.role} />
      <NotificationPanel />
      <AiAssistant />
    </div>
  );
}
