import { cn } from "@/lib/utils";

interface NexusLogoProps {
  className?: string;
  size?: number;
}

export function NexusLogo({ className, size = 40 }: NexusLogoProps) {
  const id = `nx${size}`;
  return (
    <div className={cn("shrink-0", className)} style={{ width: size, height: size }} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${id}g`} x1="6" y1="0" x2="34" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A78BFA" />
            <stop offset="0.5" stopColor="#8759F2" />
            <stop offset="1" stopColor="#6D28D9" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${id}g)`} />
        <path d="M13 27.5V12.5h3.4l7.8 10.2V12.5H28v15h-3.4L16.8 17.3v10.2H13Z" fill="#fff" />
        <circle cx="29.5" cy="12" r="1.75" fill="#FFE180" />
      </svg>
    </div>
  );
}
