import type { Metadata } from "next";
import { SkillrrLogo } from "@/components/brand/skillrr-logo";
import { isEntraConfigured } from "@/lib/dev-auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Skillrr to continue learning.",
};

/** Abstract network / transformation illustration — inline SVG, no external deps. */
function BrandIllustration() {
  return (
    <svg
      viewBox="0 0 560 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="h-full w-full max-h-[520px] max-w-[520px]"
    >
      <defs>
        {/* Core neutral gradient */}
        <radialGradient id="rg1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {/* Node highlight */}
        <radialGradient id="rg2" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#e6e3de" />
          <stop offset="100%" stopColor="#787774" />
        </radialGradient>
        {/* Soft node */}
        <radialGradient id="rg3" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#cfcac2" />
          <stop offset="100%" stopColor="#9b9a97" />
        </radialGradient>
        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Subtle blur for background orbs */}
        <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
        {/* Dash animation */}
        <style>{`
          @keyframes dash { to { stroke-dashoffset: -80; } }
          @keyframes pulse { 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
          .nx-dash { animation: dash 4s linear infinite; }
          .nx-dash-slow { animation: dash 7s linear infinite; }
          .nx-pulse { animation: pulse 3s ease-in-out infinite; }
          .nx-pulse-2 { animation: pulse 3s ease-in-out infinite; animation-delay: 1s; }
          .nx-pulse-3 { animation: pulse 3s ease-in-out infinite; animation-delay: 2s; }
          .nx-float { animation: float 6s ease-in-out infinite; }
        `}</style>
      </defs>

      {/* Background glow orbs */}
      <circle cx="280" cy="280" r="200" fill="url(#rg1)" filter="url(#soft)" />
      <circle cx="140" cy="160" r="90" fill="#ffffff" fillOpacity="0.05" filter="url(#soft)" />
      <circle cx="420" cy="400" r="100" fill="#ffffff" fillOpacity="0.05" filter="url(#soft)" />

      {/* ── Outer hexagonal frame lines ── */}
      {/* Top-left to top-right */}
      <line x1="168" y1="56" x2="392" y2="56" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />
      {/* Bottom */}
      <line x1="168" y1="504" x2="392" y2="504" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />
      {/* Left diagonal */}
      <line x1="56" y1="168" x2="168" y2="56" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />
      <line x1="56" y1="392" x2="168" y2="504" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />
      {/* Right diagonal */}
      <line x1="504" y1="168" x2="392" y2="56" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />
      <line x1="504" y1="392" x2="392" y2="504" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />
      {/* Vertical sides */}
      <line x1="56" y1="168" x2="56" y2="392" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />
      <line x1="504" y1="168" x2="504" y2="392" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />

      {/* ── Network connection lines (animated dashes) ── */}
      {/* Center to top-left node */}
      <path d="M280 280 Q200 220 148 148" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5"
        strokeDasharray="8 6" className="nx-dash" />
      {/* Center to top-right node */}
      <path d="M280 280 Q350 200 412 148" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5"
        strokeDasharray="8 6" className="nx-dash" strokeDashoffset="20" />
      {/* Center to bottom-left */}
      <path d="M280 280 Q210 350 148 412" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.5"
        strokeDasharray="8 6" className="nx-dash-slow" />
      {/* Center to bottom-right */}
      <path d="M280 280 Q350 360 412 412" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.5"
        strokeDasharray="8 6" className="nx-dash-slow" strokeDashoffset="30" />
      {/* Center to left */}
      <path d="M280 280 C240 280 180 260 100 280" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1.5"
        strokeDasharray="6 5" className="nx-dash" strokeDashoffset="10" />
      {/* Center to right */}
      <path d="M280 280 C320 280 380 260 460 280" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1.5"
        strokeDasharray="6 5" className="nx-dash" />
      {/* Center to top */}
      <path d="M280 280 C280 240 265 180 280 100" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1.5"
        strokeDasharray="6 5" className="nx-dash-slow" strokeDashoffset="15" />
      {/* Center to bottom */}
      <path d="M280 280 C280 320 265 380 280 460" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1.5"
        strokeDasharray="6 5" className="nx-dash-slow" />

      {/* Secondary cross-connections */}
      <path d="M148 148 Q280 180 412 148" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1"
        strokeDasharray="5 8" className="nx-dash-slow" />
      <path d="M148 412 Q280 380 412 412" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1"
        strokeDasharray="5 8" className="nx-dash-slow" strokeDashoffset="20" />
      <path d="M100 280 Q140 148 148 148" stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1"
        strokeDasharray="4 7" className="nx-dash" />
      <path d="M460 280 Q420 148 412 148" stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1"
        strokeDasharray="4 7" className="nx-dash" strokeDashoffset="12" />

      {/* ── Floating ring accents ── */}
      <circle cx="280" cy="280" r="96" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" fill="none" />
      <circle cx="280" cy="280" r="148" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" fill="none"
        strokeDasharray="3 6" />
      <circle cx="280" cy="280" r="200" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1" fill="none" />

      {/* ── Satellite nodes (outer ring) ── */}
      {/* Top-left */}
      <g filter="url(#glow)" className="nx-pulse">
        <circle cx="148" cy="148" r="14" fill="url(#rg2)" />
        <circle cx="148" cy="148" r="7" fill="white" fillOpacity="0.5" />
      </g>
      {/* Top-right */}
      <g filter="url(#glow)" className="nx-pulse-2">
        <circle cx="412" cy="148" r="14" fill="url(#rg2)" />
        <circle cx="412" cy="148" r="7" fill="white" fillOpacity="0.5" />
      </g>
      {/* Bottom-left */}
      <g filter="url(#glow)" className="nx-pulse-3">
        <circle cx="148" cy="412" r="14" fill="url(#rg3)" />
        <circle cx="148" cy="412" r="7" fill="white" fillOpacity="0.5" />
      </g>
      {/* Bottom-right */}
      <g filter="url(#glow)" className="nx-pulse">
        <circle cx="412" cy="412" r="14" fill="url(#rg3)" />
        <circle cx="412" cy="412" r="7" fill="white" fillOpacity="0.5" />
      </g>
      {/* Left mid */}
      <g filter="url(#glow)" className="nx-pulse-2">
        <circle cx="100" cy="280" r="10" fill="url(#rg3)" />
        <circle cx="100" cy="280" r="5" fill="white" fillOpacity="0.4" />
      </g>
      {/* Right mid */}
      <g filter="url(#glow)" className="nx-pulse-3">
        <circle cx="460" cy="280" r="10" fill="url(#rg2)" />
        <circle cx="460" cy="280" r="5" fill="white" fillOpacity="0.4" />
      </g>
      {/* Top mid */}
      <g filter="url(#glow)" className="nx-pulse">
        <circle cx="280" cy="100" r="10" fill="url(#rg2)" />
        <circle cx="280" cy="100" r="5" fill="white" fillOpacity="0.4" />
      </g>
      {/* Bottom mid */}
      <g filter="url(#glow)" className="nx-pulse-2">
        <circle cx="280" cy="460" r="10" fill="url(#rg3)" />
        <circle cx="280" cy="460" r="5" fill="white" fillOpacity="0.4" />
      </g>

      {/* ── Small accent dots (secondary network) ── */}
      <circle cx="196" cy="196" r="5" fill="#ffffff" fillOpacity="0.3" />
      <circle cx="364" cy="196" r="5" fill="#ffffff" fillOpacity="0.3" />
      <circle cx="196" cy="364" r="5" fill="#ffffff" fillOpacity="0.25" />
      <circle cx="364" cy="364" r="5" fill="#ffffff" fillOpacity="0.25" />
      <circle cx="196" cy="280" r="4" fill="#ffffff" fillOpacity="0.2" />
      <circle cx="364" cy="280" r="4" fill="#ffffff" fillOpacity="0.2" />
      <circle cx="280" cy="196" r="4" fill="#ffffff" fillOpacity="0.2" />
      <circle cx="280" cy="364" r="4" fill="#ffffff" fillOpacity="0.2" />

      {/* ── Central core node ── */}
      <circle cx="280" cy="280" r="40" fill="#ffffff" fillOpacity="0.06" />
      <circle cx="280" cy="280" r="28" fill="#ffffff" fillOpacity="0.08" />
      <g filter="url(#glow)">
        <circle cx="280" cy="280" r="20" fill="url(#rg2)" />
        <circle cx="280" cy="280" r="9" fill="white" fillOpacity="0.6" />
      </g>

      {/* ── Geometric hex accent (top-right quadrant) ── */}
      <g opacity="0.15" transform="translate(370, 90) rotate(15)">
        <polygon points="28,0 56,16 56,48 28,64 0,48 0,16"
          stroke="#ffffff" strokeWidth="1.5" fill="none" />
        <polygon points="28,12 44,22 44,42 28,52 12,42 12,22"
          stroke="#ffffff" strokeWidth="1" fill="none" />
      </g>
      {/* Hex accent bottom-left */}
      <g opacity="0.12" transform="translate(90, 370) rotate(-10)">
        <polygon points="24,0 48,14 48,42 24,56 0,42 0,14"
          stroke="#ffffff" strokeWidth="1.5" fill="none" />
      </g>

      {/* ── Flowing data-path curves (subtle) ── */}
      <path d="M56 168 Q120 120 148 148" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" fill="none"
        strokeDasharray="3 5" className="nx-dash-slow" />
      <path d="M56 392 Q100 420 148 412" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" fill="none"
        strokeDasharray="3 5" className="nx-dash-slow" strokeDashoffset="10" />
      <path d="M504 168 Q460 120 412 148" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" fill="none"
        strokeDasharray="3 5" className="nx-dash" />
      <path d="M504 392 Q460 420 412 412" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" fill="none"
        strokeDasharray="3 5" className="nx-dash" strokeDashoffset="10" />
    </svg>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const entraEnabled = isEntraConfigured();
  const { error } = await searchParams;
  const authError = typeof error === "string" ? error : undefined;

  return (
    <div className="min-h-dvh bg-background">
      <div className="grid min-h-dvh lg:grid-cols-[minmax(380px,1fr)_minmax(480px,1.1fr)]">

        {/* ── Left: branded panel — clean dark ── */}
        <aside className="relative hidden overflow-hidden border-r border-border bg-foreground lg:flex lg:flex-col">
          {/* Subtle dot-grid texture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Logo */}
          <div className="relative z-10 px-10 pt-10 xl:px-14 xl:pt-12">
            <SkillrrLogo size={36} variant="light" />
          </div>

          {/* Illustration + copy */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10 py-8 xl:px-14">
            <div className="w-full max-w-[380px] opacity-80">
              <BrandIllustration />
            </div>

            <div className="mt-8 max-w-sm space-y-2.5 text-center">
              <h1 className="text-2xl font-semibold leading-snug tracking-tight text-background">
                Empowering continuous learning
              </h1>
              <p className="text-sm leading-relaxed text-background/60">
                Career growth and workforce excellence through intelligent learning experiences.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 px-10 pb-8 xl:px-14 xl:pb-10">
            <p className="text-xs text-background/30">
              © {new Date().getFullYear()} Valoriz Digital · Skillrr
            </p>
          </div>
        </aside>

        {/* ── Right: authentication ── */}
        <main className="flex flex-col items-center justify-center px-5 py-12 sm:px-8 lg:px-12">
          {/* Mobile brand — visible only below lg */}
          <div className="mb-8 lg:hidden">
            <SkillrrLogo size={32} />
          </div>

          <LoginForm entraEnabled={entraEnabled} authError={authError} />
        </main>
      </div>
    </div>
  );
}
