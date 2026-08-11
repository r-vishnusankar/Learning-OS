"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  commandOpen: boolean;
  aiOpen: boolean;
  notificationsOpen: boolean;
  /** Explicit open/closed overrides keyed by NavGroup.id */
  navGroupOpen: Record<string, boolean>;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setSidebarMobileOpen: (v: boolean) => void;
  setCommandOpen: (v: boolean) => void;
  setAiOpen: (v: boolean) => void;
  setNotificationsOpen: (v: boolean) => void;
  setNavGroupOpen: (id: string, open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      commandOpen: false,
      aiOpen: false,
      notificationsOpen: false,
      navGroupOpen: {},
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setSidebarMobileOpen: (v) => set({ sidebarMobileOpen: v }),
      setCommandOpen: (v) => set({ commandOpen: v }),
      setAiOpen: (v) => set({ aiOpen: v }),
      setNotificationsOpen: (v) => set({ notificationsOpen: v }),
      setNavGroupOpen: (id, open) =>
        set((s) => ({ navGroupOpen: { ...s.navGroupOpen, [id]: open } })),
    }),
    {
      name: "skillrr-ui-nav-groups",
      partialize: (state) => ({
        navGroupOpen: state.navGroupOpen,
      }),
    }
  )
);
