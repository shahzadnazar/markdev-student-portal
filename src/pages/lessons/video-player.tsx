import { useEffect, useRef } from "react";
import { ExternalLink, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadScript, VIMEO_API, withJsApi, youtubeReady } from "@/lib/player-api";
import { embedUrlFor } from "@/lib/video";
import type { Video } from "@/types";

/** Emitted while playing so the caller can measure what was actually watched. */
export interface PlaybackSample {
  position: number;
  duration: number;
}

interface VideoPlayerProps {
  video: Video;
  /** Lesson title, used for the iframe accessible name. */
  title: string;
  onSample?: (sample: PlaybackSample) => void;
  onPause?: () => void;
}

const providerLabels: Record<Video["provider"], string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  self_hosted: "the course library",
};

/** How often the playhead is read while a video is playing. */
const SAMPLE_MS = 1000;

export function VideoPlayer({ video, title, onSample, onPause }: VideoPlayerProps) {
  const embedUrl = video.provider === "self_hosted" ? null : embedUrlFor(video);

  if (video.provider === "self_hosted") {
    return <SelfHostedPlayer video={video} onSample={onSample} onPause={onPause} />;
  }

  /*
    Only an embed URL can be framed — YouTube and Vimeo send X-Frame-Options on
    their watch pages, so framing `url` renders a blank box with no explanation.
  */
  if (!embedUrl) {
    return (
      <Frame className="flex flex-col items-center justify-center gap-4 p-6 text-center">
        <PlayCircle className="size-12 text-white/70" aria-hidden="true" />
        <div>
          <p className="font-display text-body-lg font-semibold text-white">
            This video can't play here
          </p>
          <p className="mt-1 text-body-sm text-white/70">
            It has to be watched on {providerLabels[video.provider]}.
          </p>
        </div>
        {video.url ? (
          <Button variant="secondary" size="sm" asChild>
            <a href={video.url} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden="true" />
              Watch on {providerLabels[video.provider]}
            </a>
          </Button>
        ) : null}
      </Frame>
    );
  }

  return video.provider === "vimeo" ? (
    <VimeoPlayer embedUrl={embedUrl} title={title} onSample={onSample} onPause={onPause} />
  ) : (
    <YouTubePlayer embedUrl={embedUrl} title={title} onSample={onSample} onPause={onPause} />
  );
}

/* ------------------------------- self-hosted ------------------------------ */

function SelfHostedPlayer({
  video,
  onSample,
  onPause,
}: Pick<VideoPlayerProps, "video" | "onSample" | "onPause">) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const report = () => {
      if (element.paused || element.ended) return;
      onSample?.({ position: element.currentTime, duration: element.duration });
    };
    const stop = () => onPause?.();

    // `timeupdate` fires roughly 4x a second, which is finer than needed and
    // varies by browser, so the sampling cadence is our own.
    const timer = window.setInterval(report, SAMPLE_MS);
    element.addEventListener("pause", stop);
    element.addEventListener("ended", stop);
    element.addEventListener("seeking", stop);
    element.addEventListener("waiting", stop);

    return () => {
      window.clearInterval(timer);
      element.removeEventListener("pause", stop);
      element.removeEventListener("ended", stop);
      element.removeEventListener("seeking", stop);
      element.removeEventListener("waiting", stop);
    };
  }, [onSample, onPause]);

  return (
    <Frame>
      <video
        ref={ref}
        controls
        src={video.url}
        poster={video.thumbnail_url ?? undefined}
        preload="metadata"
        className="size-full"
      >
        {video.captions_url ? (
          <track kind="captions" src={video.captions_url} srcLang="en" label="English" default />
        ) : null}
        Your browser does not support embedded video.
      </video>
    </Frame>
  );
}

/* --------------------------------- YouTube -------------------------------- */

interface EmbedPlayerProps {
  embedUrl: string;
  title: string;
  onSample?: (sample: PlaybackSample) => void;
  onPause?: () => void;
}

function YouTubePlayer({ embedUrl, title, onSample, onPause }: EmbedPlayerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  // Held in refs so re-renders never tear the player down mid-playback.
  const sampleRef = useRef(onSample);
  const pauseRef = useRef(onPause);
  sampleRef.current = onSample;
  pauseRef.current = onPause;

  useEffect(() => {
    let player: { destroy?: () => void; getCurrentTime?: () => number; getDuration?: () => number } | null =
      null;
    let timer: number | undefined;
    let cancelled = false;

    void youtubeReady()
      .then(() => {
        if (cancelled || !hostRef.current) return;

        const YT = (window as unknown as { YT: any }).YT;
        const url = new URL(withJsApi(embedUrl));
        const videoId = url.pathname.split("/").pop() ?? "";

        player = new YT.Player(hostRef.current, {
          videoId,
          playerVars: {
            enablejsapi: 1,
            origin: window.location.origin,
            start: Number(url.searchParams.get("start") ?? 0) || undefined,
          },
          events: {
            onStateChange: (event: { data: number }) => {
              // 1 = playing; everything else means the playhead stopped moving.
              if (event.data === YT.PlayerState.PLAYING) {
                window.clearInterval(timer);
                timer = window.setInterval(() => {
                  const position = player?.getCurrentTime?.() ?? 0;
                  const duration = player?.getDuration?.() ?? 0;
                  sampleRef.current?.({ position, duration });
                }, SAMPLE_MS);
                return;
              }
              window.clearInterval(timer);
              pauseRef.current?.();
            },
          },
        });
      })
      .catch(() => {
        /* Script blocked — the iframe below still plays, only tracking is lost. */
      });

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      player?.destroy?.();
    };
  }, [embedUrl]);

  return (
    <Frame>
      <div ref={hostRef} title={title} className="size-full" />
    </Frame>
  );
}

/* ---------------------------------- Vimeo --------------------------------- */

function VimeoPlayer({ embedUrl, title, onSample, onPause }: EmbedPlayerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sampleRef = useRef(onSample);
  const pauseRef = useRef(onPause);
  sampleRef.current = onSample;
  pauseRef.current = onPause;

  useEffect(() => {
    let player: { destroy?: () => void } | null = null;
    let cancelled = false;

    void loadScript(VIMEO_API)
      .then(() => {
        if (cancelled || !hostRef.current) return;

        const Vimeo = (window as unknown as { Vimeo: any }).Vimeo;
        player = new Vimeo.Player(hostRef.current, { url: embedUrl, responsive: false });

        const instance = player as any;
        instance.on("timeupdate", (data: { seconds: number; duration: number }) => {
          sampleRef.current?.({ position: data.seconds, duration: data.duration });
        });
        instance.on("pause", () => pauseRef.current?.());
        instance.on("ended", () => pauseRef.current?.());
        instance.on("seeked", () => pauseRef.current?.());
      })
      .catch(() => {
        /* Script blocked — fall through to no tracking. */
      });

    return () => {
      cancelled = true;
      player?.destroy?.();
    };
  }, [embedUrl]);

  return (
    <Frame>
      <div ref={hostRef} title={title} className="size-full [&>iframe]:size-full" />
    </Frame>
  );
}

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-elevated${
        className ? ` ${className}` : ""
      }`}
    >
      {children}
    </div>
  );
}
