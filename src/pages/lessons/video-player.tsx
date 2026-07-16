import type { Video } from "@/types";

interface VideoPlayerProps {
  video: Video;
  /** Lesson title, used for the iframe accessible name. */
  title: string;
}

/**
 * 16:9 lesson video. YouTube/Vimeo render through their embed iframe;
 * self-hosted files use a native `<video>` element with optional captions.
 */
export function VideoPlayer({ video, title }: VideoPlayerProps) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-elevated">
      {video.provider === "self_hosted" ? (
        <video
          controls
          src={video.url}
          poster={video.thumbnail_url ?? undefined}
          preload="metadata"
          className="size-full"
        >
          {video.captions_url ? (
            <track
              kind="captions"
              src={video.captions_url}
              srcLang="en"
              label="English"
              default
            />
          ) : null}
          Your browser does not support embedded video.
        </video>
      ) : (
        <iframe
          src={video.embed_url ?? video.url}
          title={title}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="size-full"
        />
      )}
    </div>
  );
}
