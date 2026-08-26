import { ExternalLink, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Video } from "@/types";

interface VideoPlayerProps {
  video: Video;
  /** Lesson title, used for the iframe accessible name. */
  title: string;
}

const providerLabels: Record<Video["provider"], string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  self_hosted: "the course library",
};

/**
 * 16:9 lesson video. YouTube/Vimeo render through their embed iframe;
 * self-hosted files use a native `<video>` element with optional captions.
 */
export function VideoPlayer({ video, title }: VideoPlayerProps) {
  if (video.provider === "self_hosted") {
    return (
      <Frame>
        <video
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

  /*
    Only an embed URL can be framed — YouTube and Vimeo send X-Frame-Options on
    their watch pages, so framing `url` renders a blank box with no explanation.
    Offer the video on its own site instead.
  */
  if (!video.embed_url) {
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

  return (
    <Frame>
      <iframe
        src={video.embed_url}
        title={title}
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        className="size-full"
      />
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
