import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const interDisplay = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: {
    default: "Skillrr — Learning that unlocks achievement",
    template: "%s · Skillrr",
  },
  description:
    "Learning & certification platform for employee training, skill tracking, and career progression.",
};

/**
 * Pre-paint theme bootstrap — KEEP alongside next-themes.
 *
 * next-themes also injects a blocking script, but it renders as the first child of
 * <ThemeProvider>, which lives inside <body>. By then the stylesheet has loaded and
 * <body class="bg-background"> exists under a still-light <html>, so the first paint
 * can flash Paper White cards on a dark preference.
 *
 * This inline <head> script runs during HTML parse, before <body>, so `.dark` is on
 * <html> before any themed surface paints. Both scripts read `skillrr-theme` and write
 * the same class — no conflict, only ordering. Do not remove this as a "duplicate"
 * of next-themes without re-checking a hard reload of /login with dark active.
 */
const THEME_BOOTSTRAP = `(function(){try{var d=document.documentElement;var e=localStorage.getItem("skillrr-theme");var m=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var t=e==="system"?m:(e||"light");d.classList.remove("light","dark");d.classList.add(t);d.style.colorScheme=t}catch(n){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${interDisplay.variable} ${jetbrains.variable} h-full`}
    >
      <head>
        <script
          id="skillrr-theme-bootstrap"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }}
        />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
