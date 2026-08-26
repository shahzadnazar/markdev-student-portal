/**
 * Turns a stream of playback positions into the ranges that were actually
 * played.
 *
 * A position on its own can't tell watching from seeking — drag the scrubber to
 * the end and the position says "finished". So each tick either extends the
 * open range (the position advanced by about the wall-clock time that passed)
 * or closes it and starts a new one (the position jumped). The union of the
 * closed ranges is the time genuinely watched.
 */

export type Segment = [number, number];

/** A jump larger than this is a seek, not playback. */
const CONTINUITY_TOLERANCE_SECONDS = 2;
/** Ranges shorter than this are scrubbing noise. */
const MIN_SEGMENT_SECONDS = 1;

export class WatchTracker {
  private segments: Segment[] = [];
  private openStart: number | null = null;
  private lastPosition: number | null = null;
  private duration = 0;
  private furthest = 0;

  setDuration(seconds: number) {
    if (Number.isFinite(seconds) && seconds > 0) this.duration = Math.round(seconds);
  }

  getDuration() {
    return this.duration;
  }

  getFurthest() {
    return Math.round(this.furthest);
  }

  /** Feed the current playhead position, in seconds, while playing. */
  tick(position: number) {
    if (!Number.isFinite(position) || position < 0) return;
    this.furthest = Math.max(this.furthest, position);

    if (this.openStart === null || this.lastPosition === null) {
      this.openStart = position;
      this.lastPosition = position;
      return;
    }

    const delta = position - this.lastPosition;

    // Continuous playback (including a modest speed-up) extends the range;
    // anything else means the playhead moved without the content being seen.
    if (delta >= 0 && delta <= CONTINUITY_TOLERANCE_SECONDS) {
      this.lastPosition = position;
      return;
    }

    this.closeOpenSegment();
    this.openStart = position;
    this.lastPosition = position;
  }

  /** Playback stopped (pause, seek, buffer, ended, page hidden). */
  pause() {
    this.closeOpenSegment();
    this.openStart = null;
    this.lastPosition = null;
  }

  private closeOpenSegment() {
    if (this.openStart === null || this.lastPosition === null) return;

    const start = Math.min(this.openStart, this.lastPosition);
    const end = Math.max(this.openStart, this.lastPosition);

    if (end - start >= MIN_SEGMENT_SECONDS) this.segments.push([start, end]);
  }

  /**
   * Ranges recorded since the last drain, including the range still open, so a
   * student who never pauses still has their progress reported.
   */
  drain(): Segment[] {
    this.closeOpenSegment();

    const drained = this.segments;
    this.segments = [];

    // Keep the open range going from here so continuous play isn't split.
    if (this.openStart !== null && this.lastPosition !== null) {
      this.openStart = this.lastPosition;
    }

    return drained;
  }

  hasPending() {
    if (this.segments.length > 0) return true;
    if (this.openStart === null || this.lastPosition === null) return false;
    return this.lastPosition - this.openStart >= MIN_SEGMENT_SECONDS;
  }
}
