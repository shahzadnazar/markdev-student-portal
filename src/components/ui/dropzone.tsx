import { FileText, Upload, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * What a zone will take, and what the server will take.
 *
 * `accept` is the input's own filter and the label on the chip; `maxBytes` is
 * the size chip. Both are passed in rather than assumed, because they differ
 * per upload point and the chips have to say what the SERVER enforces — a zone
 * promising 10 MB where the API allows 2 is a promise it cannot keep.
 */
export interface DropzoneProps {
  /** Field id, so the FormField label points at a real input. */
  id: string;
  /** Submitted field name. Defaults to the id — set it where they differ. */
  name?: string;
  /** The `accept` attribute — e.g. ".pdf,.doc" or "image/*". */
  accept?: string;
  /** Human list for the chip — e.g. "PDF, JPG, PNG". Omit for "Any file". */
  acceptLabel?: string;
  /** The server's own max, in bytes. */
  maxBytes: number;
  file: File | null;
  onFile: (file: File | null) => void;
  /** Marks the input required so a no-JS submit is refused too. */
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
}

/** A friendly reason this file will not do, or null if it will. */
export function rejectionReason(file: File, accept: string | undefined, maxBytes: number): string | null {
  if (file.size > maxBytes) {
    return `${file.name} is ${formatBytes(file.size)} — the limit is ${formatBytes(maxBytes)}.`;
  }

  if (!accept) return null;

  const patterns = accept.split(",").map((p) => p.trim().toLowerCase()).filter(Boolean);
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  const ok = patterns.some((pattern) =>
    pattern.startsWith(".")
      ? name.endsWith(pattern)
      : pattern.endsWith("/*")
        ? type.startsWith(pattern.slice(0, -1))
        : type === pattern,
  );

  return ok ? null : `${file.name} is not a file type this accepts.`;
}

/**
 * Drag a file in, or click to browse.
 *
 * There is a genuine <input type="file"> underneath, visually hidden but
 * present, focusable and labelled. That matters for three separate reasons: a
 * form submits without any JavaScript, the control keeps its place in the tab
 * order, and a screen reader announces it as a file input rather than as a
 * div someone has decorated. The drop zone is a label pointing at it, so a
 * click anywhere opens the picker for free — no click handler to keep in step.
 *
 * ONE label and ONE input, mounted for the life of the component, with only
 * their contents and classes switching between "empty zone" and "file chosen".
 * Two branches each rendering their own input looks equivalent and is not:
 * React unmounts one and mounts the other when a file arrives, `inputRef`
 * follows the new node, and a FileList assigned on drop goes with the node
 * that was thrown away. Measured — the card showed the file and the input
 * carried nothing. Keep this single-node.
 *
 * Native drag events, no library. React's synthetic onDragOver/onDrop are
 * enough and nothing in package.json does this already; adding one more
 * dependency for four event handlers is not worth carrying for a decade.
 *
 * The client-side message is a courtesy, never the rule. Anything it lets
 * through still meets the server's validator, which is where required, mimes
 * and max actually live.
 */
export function Dropzone({
  id,
  name,
  accept,
  acceptLabel,
  maxBytes,
  file,
  onFile,
  required = false,
  invalid = false,
  describedBy,
  className,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const hintId = useId();

  const take = (candidate: File | null) => {
    if (!candidate) {
      setRejected(null);
      onFile(null);
      return;
    }

    const reason = rejectionReason(candidate, accept, maxBytes);
    setRejected(reason);

    // A file the client refuses must not stay on the input either, or a submit
    // would post it anyway and lean on the server to say no twice.
    if (reason && inputRef.current) inputRef.current.value = "";

    onFile(reason ? null : candidate);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    take(event.target.files?.[0] ?? null);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);

    const dropped = event.dataTransfer.files?.[0] ?? null;
    if (!dropped) return;

    // Put it on the real input too, so a form that posts without JavaScript
    // carries the dropped file rather than nothing.
    if (inputRef.current) {
      inputRef.current.files = event.dataTransfer.files;
    }
    take(dropped);
  };

  const clear = () => {
    if (inputRef.current) inputRef.current.value = "";
    take(null);
  };

  // The parent clears the field on its own too — a successful submit resets
  // the form. The prop is the truth, so the input has to follow it back to
  // empty; left alone it would keep a FileList the form no longer knows
  // about, satisfy `required` on the next submit, and post last time's work.
  useEffect(() => {
    if (!file && inputRef.current?.files?.length) {
      inputRef.current.value = "";
      setRejected(null);
    }
  }, [file]);

  return (
    <div className={className}>
      {/* A label, not a button: clicking it opens the picker because it is
          bound to the input, and the input keeps its own focus ring and its
          own place in the tab order. */}
      <label
        htmlFor={id}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer rounded-xl border transition-colors duration-150",
          "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/25",
          file
            ? "items-center gap-3 border-outline-variant/60 bg-surface-ice px-4 py-3"
            : "flex-col items-center justify-center gap-2 border-dashed px-4 py-7 text-center",
          !file &&
            (dragging
              ? "border-primary bg-primary/[0.06]"
              : invalid
                ? "border-error/60 bg-error-container/20"
                : "border-outline-variant hover:border-primary/50 hover:bg-surface-ice"),
          file && dragging && "border-primary bg-primary/[0.06]",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          name={name ?? id}
          type="file"
          accept={accept}
          required={required}
          className="sr-only"
          aria-invalid={invalid || undefined}
          aria-describedby={[describedBy, file ? null : hintId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
        />

        {file ? (
          <>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="size-4 text-primary" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body-sm font-medium text-on-surface">{file.name}</span>
              <span className="block font-mono text-label-sm text-on-surface-variant">{formatBytes(file.size)}</span>
            </span>
            {/* Inside the label on purpose. A button is interactive content, so
                the label's activation behaviour skips it and this does not also
                open the picker — but preventDefault as well, because that rule
                is easier to rely on when it is written down. */}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                clear();
              }}
              aria-label={`Remove ${file.name}`}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <Upload className={cn("size-5", dragging ? "text-primary" : "text-outline")} aria-hidden="true" />
            <span className="text-body-sm text-on-surface-variant">
              Drop {required ? "your file" : "files"} here — or{" "}
              <span className="font-medium text-primary underline underline-offset-2">Browse</span>
            </span>

            <span id={hintId} className="flex flex-wrap items-center justify-center gap-1.5">
              <span className="rounded-full bg-surface-ice px-2 py-0.5 font-mono text-label-sm text-on-surface-variant">
                {acceptLabel ?? "Any file"}
              </span>
              <span className="rounded-full bg-surface-ice px-2 py-0.5 font-mono text-label-sm text-on-surface-variant">
                Max {formatBytes(maxBytes)}
              </span>
            </span>
          </>
        )}
      </label>

      {rejected ? (
        <p className="mt-2 text-body-sm text-error" role="status">
          {rejected}
        </p>
      ) : null}
    </div>
  );
}
