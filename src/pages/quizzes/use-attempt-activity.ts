import { useEffect, useRef } from "react";

import { tokenStorage } from "@/lib/storage";

/**
 * The shortest absence worth counting, in milliseconds.
 *
 * Focus leaves the window for a moment whenever a native control takes it —
 * the address bar, a permission prompt, a file dialog, an OS notification
 * being dismissed. Counting those would inflate the number with things that
 * are not leaving the quiz, and an inflated number is worse than none: the
 * whole value of the figure is that six switches should mean something. The
 * server applies the same floor when it caps the count.
 */
const MIN_AWAY_MS = 1000;

/**
 * Records that the student left the quiz tab, and for how long.
 *
 * WHY BOTH SIGNALS, AND WHY THEY CANNOT DOUBLE-COUNT
 *
 * `visibilitychange` catches a tab switch or a minimised window but not a
 * second monitor, an app dragged over the top, or a window that merely lost
 * focus — the tab is still "visible" for all of those. `blur`/`focus` catch
 * those and miss nothing, but a plain tab switch fires BOTH, so listening to
 * the two as separate events would count one departure as two.
 *
 * So neither event is counted. They are treated as notifications that
 * something changed, and the single question `document.hidden ||
 * !document.hasFocus()` is re-asked each time. One round trip is one count no
 * matter which events fired, or how many.
 *
 * WHY CUMULATIVE TOTALS, NOT DELTAS
 *
 * Every message carries the running totals for the attempt and the server
 * keeps whichever is larger. A retry therefore changes nothing and a message
 * lost in flight is repaired by the next one — which matters because these
 * are sent from a tab that is being hidden. Deltas would double-count on
 * exactly the retry that unloading makes likely.
 *
 * WHY fetch(keepalive), NOT sendBeacon
 *
 * `navigator.sendBeacon` survives unload but cannot set headers, and this API
 * authenticates with a Bearer token — a beacon would mean putting the token
 * in the request body, where it does not belong. `fetch` with
 * `keepalive: true` survives unload in the same way AND sends headers, so it
 * is the same guarantee without moving the credential.
 *
 * WHAT THIS CANNOT SEE
 *
 * A phone, a second device, a printed page, a screenshot, someone reading over
 * a shoulder. It sees one browser tab losing focus, and nothing else. Nothing
 * in the student-facing UI shows any of this, and nothing here can block,
 * warn, delay or fail an attempt: if every request below fails, the quiz
 * submits and scores exactly as it would have.
 */
export function useAttemptActivity(quizId: string, attemptId: number | null, active: boolean) {
  // Cumulative for the life of the attempt, so any message can stand alone.
  const countRef = useRef(0);
  const secondsRef = useRef(0);
  /** When the current absence began, or null while they are here. */
  const awaySinceRef = useRef<number | null>(null);
  /** Whether the absence in progress has already been counted. */
  const countedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || attemptId === null) return;

    const url = `${import.meta.env.VITE_API_URL ?? ""}/api/v1/quizzes/${quizId}/attempts/${attemptId}/activity`;

    /**
     * Send the running totals. Never throws, never awaited by anything the
     * student is waiting on, and its failure is not reported anywhere.
     */
    const flush = (extraSeconds = 0) => {
      const token = tokenStorage.get();
      if (!token) return;

      try {
        void fetch(url, {
          method: "POST",
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            away_count: countRef.current,
            away_seconds: Math.round(secondsRef.current + extraSeconds),
          }),
        }).catch(() => {
          // Telemetry. A student mid-quiz must never see this fail.
        });
      } catch {
        // Same: an environment without fetch/keepalive simply records nothing.
      }
    };

    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const isAway = () => document.hidden || !document.hasFocus();

    const sync = () => {
      const away = isAway();

      if (away && awaySinceRef.current === null) {
        awaySinceRef.current = Date.now();
        countedRef.current = false;

        // Counted once the absence outlasts the flicker threshold, rather
        // than on the way out — so a student who never comes back is still
        // recorded, without a moment's focus loss being recorded at all.
        clearTimer();
        timerRef.current = window.setTimeout(() => {
          if (awaySinceRef.current === null || countedRef.current) return;
          countedRef.current = true;
          countRef.current += 1;
          flush(MIN_AWAY_MS / 1000);
        }, MIN_AWAY_MS);

        return;
      }

      if (!away && awaySinceRef.current !== null) {
        const elapsed = Date.now() - awaySinceRef.current;
        awaySinceRef.current = null;
        clearTimer();

        if (elapsed < MIN_AWAY_MS) {
          // Flicker, not a departure. If the timer had already counted it the
          // count stands — the server would keep the higher number anyway.
          return;
        }

        if (!countedRef.current) {
          countedRef.current = true;
          countRef.current += 1;
        }
        secondsRef.current += elapsed / 1000;
        flush();
      }
    };

    /** Leaving for good: send what is known, including the absence in flight. */
    const finalFlush = () => {
      const pending = awaySinceRef.current === null ? 0 : (Date.now() - awaySinceRef.current) / 1000;
      flush(pending);
    };

    document.addEventListener("visibilitychange", sync);
    window.addEventListener("blur", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("pagehide", finalFlush);

    return () => {
      clearTimer();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("blur", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("pagehide", finalFlush);
      // Unmounting mid-absence (submitting from a background tab, navigating
      // away) still reports what happened up to this point.
      if (awaySinceRef.current !== null) finalFlush();
    };
  }, [active, attemptId, quizId]);
}
