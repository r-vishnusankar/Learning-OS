import Image from "next/image";
import { cn } from "@/lib/utils";

interface SkillrrLogoProps {
  className?: string;
  /** Height in pixels — width scales proportionally (~2.5:1 aspect ratio) */
  size?: number;
  /** Force a color variant regardless of theme */
  variant?: "dark" | "light";
}

/**
 * Official Skillrr wordmark logo.
 *
 * Uses the design-team PNG asset (`/skillrr-logo.png`) — black wordmark with
 * yellow achievement accent. In dark-mode contexts (or when `variant="light"`
 * is passed) the logo is CSS-inverted so the wordmark reads white.
 */
export function SkillrrLogo({ className, size = 32, variant }: SkillrrLogoProps) {
  const height = size;
  const width = Math.round(size * 2.5);

  return (
    <div
      className={cn(
        "relative shrink-0",
        !variant && "dark:brightness-0 dark:invert",
        variant === "light" && "brightness-0 invert",
        className
      )}
      style={{ width, height }}
      aria-hidden
    >
      <Image
        src="/skillrr-logo.png"
        alt="Skillrr"
        width={width}
        height={height}
        className="object-contain"
        priority
        unoptimized
      />
    </div>
  );
}

interface SkillrrIconProps {
  className?: string;
  size?: number;
}

/**
 * Square icon-mark version — the LL achievement badge with star.
 * Used in the sidebar collapsed state and favicon contexts.
 */
export function SkillrrIcon({ className, size = 32 }: SkillrrIconProps) {
  const id = `sk${size}`;
  return (
    <div className={cn("shrink-0", className)} style={{ width: size, height: size }} aria-hidden>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" rx="10" fill="currentColor" className="text-foreground" />
        {/* LL badge shape */}
        <path
          d="M12 8h6v18h-2l-4-6V8Zm10 0h6v20h-2V14l-4 6V8Z"
          fill="var(--card, #fff)"
          fillRule="evenodd"
        />
        {/* Star */}
        <path
          d="M20 22l-1.76 1.24.56-2.08L17 19.76l2.12-.08L20 17.7l.88 1.98 2.12.08-1.8 1.4.56 2.08Z"
          fill={`url(#${id}s)`}
        />
        {/* Yellow accent lines */}
        <line x1="18.5" y1="6" x2="18.5" y2="3" stroke="#FBBF24" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="20" y1="5.5" x2="20" y2="2" stroke="#FBBF24" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="21.5" y1="6" x2="21.5" y2="3" stroke="#FBBF24" strokeWidth="1.6" strokeLinecap="round" />
        <defs>
          <linearGradient id={`${id}s`} x1="18" y1="17" x2="22" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FBBF24" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
