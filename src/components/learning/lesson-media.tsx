"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveMediaEmbed } from "@/lib/media-embed";
import { cn } from "@/lib/utils";

/** YouTube IFrame API — minimal typings (no @types/youtube dependency). */
type YtPlayerInstance = { destroy: () => void };

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: string | HTMLElement,
        opts: { events?: { onStateChange?: (e: { data: number }) => void } }
      ) => YtPlayerInstance;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeIframeApiPromise: Promise<void> | null = null;

function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  youtubeIframeApiPromise ??= new Promise<void>((resolve, reject) => {
    const done = () => {
      if (window.YT?.Player) resolve();
      else reject(new Error("YouTube IFrame API ready but YT.Player is missing"));
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.onerror = () => reject(new Error("YouTube iframe API script failed to load"));
      document.head.appendChild(tag);
    }

    const prev = window.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(() => {
      reject(new Error("YouTube iframe API load timed out"));
    }, 20000);

    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      prev?.();
      done();
    };

    if (window.YT?.Player) {
      window.clearTimeout(timeout);
      window.onYouTubeIframeAPIReady = prev;
      done();
    }
  }).catch((err) => {
    youtubeIframeApiPromise = null;
    throw err;
  });

  return youtubeIframeApiPromise;
}

type LessonMediaProps = {
  type: string;
  content: string | null;
  title: string;
  /** Fill parent height instead of fixed 16:9 block */
  fill?: boolean;
  onEnded?: () => void;
  onError?: () => void;
};

export function LessonMedia({
  type,
  content,
  title,
  fill = false,
  onEnded,
  onError,
}: LessonMediaProps) {
  if (type === "article") {
    return null;
  }

  if (!content?.trim()) {
    return (
      <p className="text-sm text-muted-foreground">
        This lesson has no content yet. Ask an admin to add a video URL in the course builder.
      </p>
    );
  }

  if (type === "external_link") {
    const embed = resolveMediaEmbed(content);
    if (embed && (embed.kind === "youtube" || embed.kind === "vimeo" || embed.kind === "video")) {
      return (
        <EmbedPlayer
          embed={embed}
          title={title}
          originalUrl={content}
          fill={fill}
          onEnded={onEnded}
          onError={onError}
        />
      );
    }
    return (
      <div className="flex h-full items-center justify-center">
        <Button asChild>
          <a href={content} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> Open resource
          </a>
        </Button>
      </div>
    );
  }

  if (type === "pdf" || type === "presentation") {
    return (
      <iframe
        src={content}
        title={title}
        className={cn("w-full rounded-2xl border-0 bg-muted", fill ? "h-full min-h-0" : "h-[70vh]")}
      />
    );
  }

  if (type === "video") {
    const embed = resolveMediaEmbed(content);
    if (!embed) {
      return (
        <p className="text-sm text-muted-foreground">
          Could not play this video URL. Use a YouTube, Vimeo, or direct .mp4 link.
        </p>
      );
    }
    return (
      <EmbedPlayer
        embed={embed}
        title={title}
        originalUrl={content}
        fill={fill}
        onEnded={onEnded}
        onError={onError}
      />
    );
  }

  return null;
}

function withPlayerApi(src: string, kind: string): string {
  try {
    const url = new URL(src);
    if (kind === "youtube") {
      url.searchParams.set("enablejsapi", "1");
      if (typeof window !== "undefined") url.searchParams.set("origin", window.location.origin);
    }
    if (kind === "vimeo") {
      url.searchParams.set("api", "1");
    }
    return url.toString();
  } catch {
    return src;
  }
}

function EmbedPlayer({
  embed,
  title,
  originalUrl,
  fill,
  onEnded,
  onError,
}: {
  embed: NonNullable<ReturnType<typeof resolveMediaEmbed>>;
  title: string;
  originalUrl: string;
  fill: boolean;
  onEnded?: () => void;
  onError?: () => void;
}) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const endedRef = React.useRef(onEnded);

  React.useEffect(() => {
    endedRef.current = onEnded;
  }, [onEnded]);

  /** Vimeo: postMessage "finish" (unchanged). */
  React.useEffect(() => {
    if (!onEnded || embed.kind !== "vimeo") return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin.replace(/\/$/, "") !== "https://player.vimeo.com") return;

      let payload: unknown = event.data;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }
      if (!payload || typeof payload !== "object") return;
      const data = payload as { event?: string };

      if (data.event === "finish") {
        endedRef.current?.();
      }
      if (data.event === "ready") {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ method: "addEventListener", value: "finish" }),
          "https://player.vimeo.com"
        );
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [embed.kind, onEnded]);

  /**
   * YouTube: official IFrame API `onStateChange` → ENDED (0).
   * Replaces fragile postMessage subscription that often never fired.
   */
  React.useEffect(() => {
    if (!onEnded || embed.kind !== "youtube") return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    let cancelled = false;
    let player: YtPlayerInstance | null = null;
    let endedFired = false;

    const fireEnded = () => {
      if (endedFired) return;
      endedFired = true;
      endedRef.current?.();
    };

    void (async () => {
      try {
        await loadYouTubeIframeApi();
        if (cancelled || !iframeRef.current) return;
        const YT = window.YT;
        if (!YT?.Player) {
          onError?.();
          return;
        }
        player = new YT.Player(iframe, {
          events: {
            onStateChange: (e: { data: number }) => {
              if (e.data === 0) fireEnded();
            },
          },
        });
      } catch {
        if (!cancelled) onError?.();
      }
    })();

    return () => {
      cancelled = true;
      try {
        player?.destroy();
      } catch {
        /* ignore */
      }
      player = null;
    };
  }, [embed.kind, embed.src, onEnded, onError]);

  if (embed.kind === "video") {
    return (
      <div className={cn("overflow-hidden rounded-2xl bg-black", fill ? "h-full" : undefined)}>
        <video
          className={cn(fill ? "h-full w-full object-contain" : "aspect-video w-full")}
          controls
          playsInline
          preload="metadata"
          src={embed.src}
          onEnded={() => onEnded?.()}
          onError={() => onError?.()}
        >
          <track kind="captions" />
          Your browser does not support embedded video.
        </video>
      </div>
    );
  }

  const src = onEnded ? withPlayerApi(embed.src, embed.kind) : embed.src;

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-black", fill ? "h-full w-full" : "aspect-video w-full")}>
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <a
        href={originalUrl}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] text-white/90 backdrop-blur-sm hover:bg-black/80"
      >
        <ExternalLink className="h-3 w-3" /> Open tab
      </a>
    </div>
  );
}
