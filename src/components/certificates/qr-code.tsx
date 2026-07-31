"use client";

import * as React from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

export function CertificateQr({
  value,
  className,
  size = 128,
  onReady,
}: {
  value: string;
  className?: string;
  size?: number;
  onReady?: (dataUrl: string) => void;
}) {
  const [src, setSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#111111", light: "#ffffff" },
    }).then((url) => {
      if (cancelled) return;
      setSrc(url);
      onReady?.(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size, onReady]);

  if (!src) {
    return <div className={cn("animate-pulse rounded bg-muted", className)} style={{ width: size, height: size }} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Credential QR code" width={size} height={size} className={cn("rounded", className)} />
  );
}
