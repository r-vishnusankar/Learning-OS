"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveMediaEmbed } from "@/lib/media-embed";
import { cn } from "@/lib/utils";

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
  endedRef.current = onEnded;

  React.useEffect(() => {
    if (!onEnded) return;
    if (embed.kind !== "youtube" && embed.kind !== "vimeo") return;

    const onMessage = (event: MessageEvent) => {
      const origin = event.origin.replace(/\/$/, "");
      const youtube = origin === "https://www.youtube.com" || origin === "https://www.youtube-nocookie.com";
      const vimeo = origin === "https://player.vimeo.com";
      if (embed.kind === "youtube" && !youtube) return;
      if (embed.kind === "vimeo" && !vimeo) return;

      let payload: unknown = event.data;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }
      if (!payload || typeof payload !== "object") return;
      const data = payload as { event?: string; info?: number; method?: string };

      if (embed.kind === "youtube" && data.event === "onStateChange" && data.info === 0) {
        endedRef.current?.();
      }
      if (embed.kind === "vimeo" && data.event === "finish") {
        endedRef.current?.();
      }
      if (embed.kind === "vimeo" && data.event === "ready") {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ method: "addEventListener", value: "finish" }),
          "https://player.vimeo.com"
        );
      }
    };

    window.addEventListener("message", onMessage);
    const iframe = iframeRef.current;
    if (embed.kind === "youtube" && iframe?.contentWindow) {
      iframe.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1 }), "https://www.youtube.com");
    }
    return () => window.removeEventListener("message", onMessage);
  }, [embed.kind, onEnded]);

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
