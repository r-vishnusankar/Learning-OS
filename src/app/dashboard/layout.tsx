import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/layout/command-palette";
import { AiAssistant } from "@/components/layout/ai-assistant";
import { NotificationPanel } from "@/components/layout/notification-panel";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <DashboardShell>
        <Header />
        <main className="w-full flex-1 px-4 py-5 md:px-6 lg:px-8">
          {children}
        </main>
      </DashboardShell>
      <CommandPalette />
      <NotificationPanel />
      <AiAssistant />
    </div>
  );
}
