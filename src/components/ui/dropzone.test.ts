import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { rejectionReason } from "./dropzone";

/**
 * The drop zone's client-side check.
 *
 * A courtesy, never the rule — every message here has a server validator
 * behind it, and the tests that prove THAT live in the API suite. What is
 * worth pinning on this side is that the friendly message is accurate: it must
 * not reject something the server would take, or wave through something it
 * would not and leave the user guessing at a 422.
 */
/** File.size is read-only, so a test file needs its size defined onto it. */
const sized = (name: string, size: number, type = "") => {
  const f = new File([new Uint8Array(0)], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
};

describe("rejectionReason", () => {
  const TEN_MB = 10240 * 1024;

  it("accepts a file inside the limit with no accept filter", () => {
    expect(rejectionReason(sized("work.zip", 1000), undefined, TEN_MB)).toBeNull();
  });

  it("names the file and both sizes when it is too big", () => {
    const reason = rejectionReason(sized("huge.pdf", TEN_MB + 1), undefined, TEN_MB);

    expect(reason).toContain("huge.pdf");
    expect(reason).toContain("the limit is");
  });

  it("takes a file exactly on the limit", () => {
    // The server's max: is inclusive, so the client must not be stricter —
    // rejecting a file the server would have accepted is the worse error.
    expect(rejectionReason(sized("exact.pdf", TEN_MB), undefined, TEN_MB)).toBeNull();
  });

  it("matches an extension pattern", () => {
    expect(rejectionReason(sized("notes.pdf", 10), ".pdf,.doc", TEN_MB)).toBeNull();
    expect(rejectionReason(sized("notes.exe", 10), ".pdf,.doc", TEN_MB)).toContain("not a file type");
  });

  it("matches a wildcard mime pattern", () => {
    expect(rejectionReason(sized("a.png", 10, "image/png"), "image/*", TEN_MB)).toBeNull();
    expect(rejectionReason(sized("a.pdf", 10, "application/pdf"), "image/*", TEN_MB)).toContain("not a file type");
  });

  it("matches an exact mime pattern", () => {
    expect(rejectionReason(sized("a.pdf", 10, "application/pdf"), "application/pdf", TEN_MB)).toBeNull();
  });

  it("is case-insensitive about the extension", () => {
    // A phone camera hands back IMG_0001.JPG; refusing that would be a bug
    // the server does not have.
    expect(rejectionReason(sized("SCAN.PDF", 10), ".pdf", TEN_MB)).toBeNull();
  });

  it("checks size before type, so the bigger problem is the one reported", () => {
    const reason = rejectionReason(sized("huge.exe", TEN_MB + 1), ".pdf", TEN_MB);

    expect(reason).toContain("the limit is");
  });
});

describe("dropzone wiring", () => {
  const source = readFileSync(new URL("./dropzone.tsx", import.meta.url), "utf8");

  /**
   * The same source with its comments taken out.
   *
   * Counting elements has to read the JSX only. This component's docblock
   * spells out WHY there is one input and one label, so a naive count of
   * "<input" in the raw file counts the explanation too and the guard fails
   * on correct code — which is how guards get deleted.
   */
  const jsx = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  it("keeps a genuine file input, not a decorated div", () => {
    expect(source).toContain('type="file"');
    // sr-only, so it is hidden to the eye but present to the tab order, the
    // form and the screen reader.
    expect(source).toContain('className="sr-only"');
  });

  it("opens the picker by being a label bound to the input", () => {
    // Not an onClick: a label needs no handler kept in step, and it keeps the
    // input's own focus ring and tab position.
    expect(source).toContain("htmlFor={id}");
    expect(source).toContain("<label");
  });

  it("passes required through to the input so a no-JS submit is refused too", () => {
    expect(source).toContain("required={required}");
  });

  it("shows a focus ring when the hidden input is focused", () => {
    expect(source).toContain("has-[:focus-visible]:ring");
  });

  it("puts a dropped file onto the real input", () => {
    // Otherwise a form posting without JavaScript would carry nothing.
    expect(source).toContain("inputRef.current.files = event.dataTransfer.files");
  });

  it("renders exactly one input, mounted for the life of the component", () => {
    // This is the guard for a bug that was measured, not imagined. When the
    // empty zone and the chosen-file card were two return branches, each with
    // its own <input ref={inputRef}>, React unmounted one and mounted the
    // other the moment a file arrived: the ref moved to the new node and the
    // FileList assigned on drop went with the node that was discarded. The
    // card showed the file; the input carried nothing. One input, one label,
    // contents switching underneath — add a second and this trips.
    expect(jsx.match(/<input/g) ?? []).toHaveLength(1);
    expect(jsx.match(/<label/g) ?? []).toHaveLength(1);
  });

  it("submits under a field name, defaulting to the id", () => {
    // A hidden input with no name posts nothing at all.
    expect(source).toContain("name={name ?? id}");
  });

  it("takes a file the client refuses back off the input", () => {
    // Leaving it there would post it anyway and make the server say no to
    // something the user has already been told is no good.
    expect(source).toContain('if (reason && inputRef.current) inputRef.current.value = ""');
  });

  it("follows the prop back to empty when the parent clears the field", () => {
    // A successful submit calls reset(), which nulls the prop without going
    // through the × — the input would otherwise keep the FileList, satisfy
    // required on the next submit, and post the same work twice.
    expect(jsx).toContain("if (!file && inputRef.current?.files?.length)");
  });

  it("does not let the remove button open the picker", () => {
    // It sits inside the label. A button is interactive content so the label's
    // activation behaviour skips it, but the preventDefault says so out loud.
    expect(source).toMatch(/aria-label=\{`Remove/);
    expect(source).toMatch(/onClick=\{\(event\) => \{\s*event\.preventDefault\(\);\s*clear\(\);/);
  });

  it("handles drag events natively rather than through a library", () => {
    expect(source).toContain("onDragOver");
    expect(source).toContain("onDrop");

    // Asserted against package.json, not the source: the component's own
    // comment explains why react-dropzone was not added, and a guard that
    // trips on its own explanation is one people delete.
    const pkg = readFileSync(new URL("../../../package.json", import.meta.url), "utf8");
    expect(pkg).not.toContain("react-dropzone");
    expect(pkg).not.toContain("filepond");
  });

  it("takes its chips as props rather than hardcoding a file list", () => {
    expect(source).toContain("acceptLabel");
    expect(source).toContain("maxBytes");
    expect(source).not.toContain("PDF, DOC, DOCX");
  });
});

describe("the assignment submission stays required", () => {
  const page = readFileSync(
    new URL("../../pages/assignments/assignment-detail-page.tsx", import.meta.url),
    "utf8",
  );

  it("marks the zone required", () => {
    expect(page).toContain("<Dropzone");
    expect(page).toMatch(/<Dropzone[\s\S]*?required[\s\S]*?\/>/);
  });

  it("keeps the schema refine that refuses an empty submit", () => {
    // 9bed5dd. The zone must not make an obligation look optional, and the
    // form must not let one leave without a file.
    expect(page).toContain("Attach your work to submit.");
    expect(page).toContain("values.file !== null");
  });

  it("sizes the chip from the server's own limit", () => {
    // SubmitAssignmentRequest is max:10240 — kilobytes — so the constant is
    // that number, not a rounder one someone liked the look of.
    expect(page).toContain("const SUBMISSION_MAX_BYTES = 10240 * 1024");
  });
});
