"use client";

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
};

export function LessonMedia({ type, content, title, fill = false }: LessonMediaProps) {
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
      return <EmbedPlayer embed={embed} title={title} originalUrl={content} fill={fill} />;
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
    return <EmbedPlayer embed={embed} title={title} originalUrl={content} fill={fill} />;
  }

  return null;
}

function EmbedPlayer({
  embed,
  title,
  originalUrl,
  fill,
}: {
  embed: NonNullable<ReturnType<typeof resolveMediaEmbed>>;
  title: string;
  originalUrl: string;
  fill: boolean;
}) {
  if (embed.kind === "video") {
    return (
      <div className={cn("overflow-hidden rounded-2xl bg-black", fill ? "h-full" : undefined)}>
        <video
          className={cn(fill ? "h-full w-full object-contain" : "aspect-video w-full")}
          controls
          playsInline
          preload="metadata"
          src={embed.src}
        >
          <track kind="captions" />
          Your browser does not support embedded video.
        </video>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-black", fill ? "h-full w-full" : "aspect-video w-full")}>
      <iframe
        src={embed.src}
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
