/** Loads a third-party player script once, reusing the promise on re-mount. */
const loaded = new Map<string, Promise<void>>();

export function loadScript(src: string): Promise<void> {
  const existing = loaded.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = src;
    tag.async = true;
    tag.onload = () => resolve();
    tag.onerror = () => {
      // Let a later mount retry rather than caching the failure forever.
      loaded.delete(src);
      reject(new Error(`Failed to load ${src}`));
    };
    document.head.appendChild(tag);
  });

  loaded.set(src, promise);
  return promise;
}

export const YOUTUBE_API = "https://www.youtube.com/iframe_api";
export const VIMEO_API = "https://player.vimeo.com/api/player.js";

/**
 * The YouTube IFrame API signals readiness through a single global callback,
 * so every caller has to queue behind whoever installed it first.
 */
export function youtubeReady(): Promise<void> {
  const w = window as unknown as {
    YT?: { Player?: unknown };
    onYouTubeIframeAPIReady?: () => void;
  };

  if (w.YT?.Player) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    void loadScript(YOUTUBE_API);
  });
}

/** Playback needs `enablejsapi` before the API can read the position. */
export function withJsApi(embedUrl: string): string {
  try {
    const url = new URL(embedUrl);
    url.searchParams.set("enablejsapi", "1");
    if (typeof window !== "undefined") url.searchParams.set("origin", window.location.origin);
    return url.toString();
  } catch {
    return embedUrl;
  }
}
