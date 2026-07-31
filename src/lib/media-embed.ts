export type EmbedKind = "youtube" | "vimeo" | "video" | "iframe" | "unknown";

export type ResolvedEmbed = {
  kind: EmbedKind;
  src: string;
};

/** Normalize watch / share / short URLs into something an in-page player can load. */
export function resolveMediaEmbed(raw: string | null | undefined): ResolvedEmbed | null {
  if (!raw?.trim()) return null;
  const input = raw.trim();

  try {
    const url = new URL(input);
    const start =
      url.searchParams.get("start") ??
      url.searchParams.get("t")?.replace(/s$/i, "") ??
      undefined;

    // YouTube: watch, youtu.be, shorts, embed
    const ytHost = url.hostname.replace(/^www\./, "");
    if (ytHost === "youtube.com" || ytHost === "m.youtube.com" || ytHost === "music.youtube.com") {
      let id = url.searchParams.get("v");
      if (!id && url.pathname.startsWith("/embed/")) {
        id = url.pathname.split("/")[2];
      }
      if (!id && url.pathname.startsWith("/shorts/")) {
        id = url.pathname.split("/")[2];
      }
      if (!id && url.pathname.startsWith("/live/")) {
        id = url.pathname.split("/")[2];
      }
      if (id) {
        const qs = new URLSearchParams({ rel: "0" });
        if (start && /^\d+$/.test(start)) qs.set("start", start);
        return { kind: "youtube", src: `https://www.youtube.com/embed/${id}?${qs}` };
      }
    }
    if (ytHost === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0];
      if (id) {
        const qs = new URLSearchParams({ rel: "0" });
        if (start && /^\d+$/.test(start)) qs.set("start", start);
        return { kind: "youtube", src: `https://www.youtube.com/embed/${id}?${qs}` };
      }
    }

    // Vimeo
    if (ytHost === "vimeo.com" || ytHost === "player.vimeo.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      const id = parts.find((p) => /^\d+$/.test(p));
      if (id) {
        return { kind: "vimeo", src: `https://player.vimeo.com/video/${id}` };
      }
    }

    // Direct video file
    if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url.pathname)) {
      return { kind: "video", src: input };
    }

    // Already an embed or generic iframeable URL
    if (url.pathname.includes("/embed/") || url.hostname.includes("player.")) {
      return { kind: "iframe", src: input };
    }

    return { kind: "iframe", src: input };
  } catch {
    // Not a URL — treat as raw HTML? skip
    return null;
  }
}

/** YouTube video id for comparison (ignores query params / URL format). */
export function youtubeVideoId(raw: string | null | undefined): string | null {
  const embed = resolveMediaEmbed(raw);
  if (!embed || embed.kind !== "youtube") return null;
  const match = embed.src.match(/\/embed\/([^/?]+)/);
  return match?.[1] ?? null;
}
