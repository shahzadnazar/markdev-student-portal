import type { Video } from "@/types";

/**
 * YouTube and Vimeo send X-Frame-Options on their watch pages, so only an
 * `/embed/` (or `player.vimeo.com`) URL can go in an iframe. The API normally
 * supplies one, but a lesson saved with just a watch URL can still arrive
 * without it — deriving it here keeps the video playing either way.
 */

const YOUTUBE_ID =
  /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)([\w-]{6,})/i;

const VIMEO_ID = /vimeo\.com\/(?:video\/)?(\d+)/i;

/** Extract the start offset (`?t=90`, `?start=90`, `?t=1m30s`) if present. */
function startSeconds(url: string): number | null {
  const match = /[?&](?:t|start)=([\dhms]+)/i.exec(url);
  if (!match) return null;

  const raw = match[1];
  if (/^\d+$/.test(raw)) return Number(raw);

  const parts = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i.exec(raw);
  if (!parts) return null;

  const total =
    Number(parts[1] ?? 0) * 3600 + Number(parts[2] ?? 0) * 60 + Number(parts[3] ?? 0);
  return total > 0 ? total : null;
}

/**
 * The URL to put in the iframe, or null when the video genuinely can't be
 * framed. A usable `embed_url` from the API always wins.
 */
export function embedUrlFor(video: Pick<Video, "provider" | "url" | "embed_url">): string | null {
  if (video.provider === "self_hosted") return null;

  const supplied = video.embed_url?.trim();
  if (supplied && /\/embed\/|player\.vimeo\.com/i.test(supplied)) return supplied;

  const url = video.url?.trim() ?? "";
  if (!url) return supplied || null;

  const youtube = YOUTUBE_ID.exec(url);
  if (youtube) {
    const start = startSeconds(url);
    return `https://www.youtube.com/embed/${youtube[1]}${start ? `?start=${start}` : ""}`;
  }

  const vimeo = VIMEO_ID.exec(url);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  // An embed_url we don't recognise is still worth trying — it may be another
  // provider's player. A bare watch URL is not: framing it is always blank.
  return supplied || null;
}
