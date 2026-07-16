"use client";

import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  commandOpen: boolean;
  aiOpen: boolean;
  notificationsOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setSidebarMobileOpen: (v: boolean) => void;
  setCommandOpen: (v: boolean) => void;
  setAiOpen: (v: boolean) => void;
  setNotificationsOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  commandOpen: false,
  aiOpen: false,
  notificationsOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setSidebarMobileOpen: (v) => set({ sidebarMobileOpen: v }),
  setCommandOpen: (v) => set({ commandOpen: v }),
  setAiOpen: (v) => set({ aiOpen: v }),
  setNotificationsOpen: (v) => set({ notificationsOpen: v }),
}));
