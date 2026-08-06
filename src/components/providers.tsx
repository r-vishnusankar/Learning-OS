"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        storageKey="nexus-theme"
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster richColors position="top-right" closeButton />
          </TooltipProvider>
        </QueryClientProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
}
