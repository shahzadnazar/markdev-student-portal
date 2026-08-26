import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { lessonsRepository } from "@/api/repositories";
import { qk } from "@/lib/query-keys";
import { WatchTracker } from "@/lib/watch-tracker";
import type { PlaybackSample } from "@/pages/lessons/video-player";
import type { VideoProgress } from "@/types";

/** How often watched ranges are flushed to the server while playing. */
const FLUSH_MS = 15_000;

interface Options {
  courseId: number | string;
  lessonId: number | string;
  /** Server-side progress the lesson arrived with. */
  initial: VideoProgress | null | undefined;
  enabled: boolean;
}

/**
 * Measures how much of a lesson video is actually played and reports it.
 *
 * Ranges are batched rather than sent per tick: a 10-minute video would
 * otherwise be 600 requests. The server merges each batch into what it already
 * holds, so a dropped flush costs a few seconds of credit, never the whole
 * record.
 */
export function useVideoProgress({ courseId, lessonId, initial, enabled }: Options) {
  const queryClient = useQueryClient();
  const trackerRef = useRef(new WatchTracker());
  const [progress, setProgress] = useState<VideoProgress | null>(initial ?? null);
  const inFlight = useRef(false);

  // A new lesson is a new recording.
  useEffect(() => {
    trackerRef.current = new WatchTracker();
    setProgress(initial ?? null);
  }, [lessonId]);

  useEffect(() => {
    if (initial) setProgress((current) => current ?? initial);
  }, [initial]);

  const flush = useCallback(
    async () => {
      const tracker = trackerRef.current;
      if (!enabled || inFlight.current || !tracker.hasPending()) return;

      const duration = tracker.getDuration();
      if (duration <= 0) return;

      const segments = tracker.drain();
      if (segments.length === 0) return;

      inFlight.current = true;
      try {
        const updated = await lessonsRepository.videoProgress(courseId, lessonId, {
          duration,
          position: tracker.getFurthest(),
          segments,
        });
        setProgress(updated);
        // The lesson payload carries this too; keep them from disagreeing.
        void queryClient.invalidateQueries({ queryKey: qk.lesson(courseId, lessonId) });
      } catch {
        /* Offline or rejected — the next flush re-reports from the tracker. */
      } finally {
        inFlight.current = false;
      }
    },
    [courseId, lessonId, enabled, queryClient],
  );

  const onSample = useCallback(
    (sample: PlaybackSample) => {
      const tracker = trackerRef.current;
      tracker.setDuration(sample.duration);
      tracker.tick(sample.position);
    },
    [],
  );

  const onPause = useCallback(() => {
    trackerRef.current.pause();
    void flush();
  }, [flush]);

  // Periodic flush so a student who never pauses still gets credited.
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => void flush(), FLUSH_MS);
    return () => window.clearInterval(timer);
  }, [enabled, flush]);

  /*
    Switching away flushes what's been watched so far. A hard tab close can
    still lose the final stretch — axios can't outlive the document — but the
    periodic flush caps that at FLUSH_MS of credit, and the next visit resumes
    from the stored coverage.
  */
  useEffect(() => {
    if (!enabled) return;

    const handle = () => {
      trackerRef.current.pause();
      void flush();
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") handle();
    };

    window.addEventListener("pagehide", handle);
    document.addEventListener("visibilitychange", onHidden);

    return () => {
      window.removeEventListener("pagehide", handle);
      document.removeEventListener("visibilitychange", onHidden);
      handle();
    };
  }, [enabled, flush]);

  return { progress, onSample, onPause };
}
