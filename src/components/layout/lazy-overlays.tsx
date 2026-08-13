"use client";

import dynamic from "next/dynamic";

export const AiAssistant = dynamic(
  () => import("@/components/layout/ai-assistant").then((m) => ({ default: m.AiAssistant })),
  { ssr: false, loading: () => null }
);

export const NotificationPanel = dynamic(
  () => import("@/components/layout/notification-panel").then((m) => ({ default: m.NotificationPanel })),
  { ssr: false, loading: () => null }
);
