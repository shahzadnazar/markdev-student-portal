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
  /** Code only — the comments here name the very lines these guards forbid. */
  const jsx = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  // `jsx` above is the comments-stripped source. Counting elements, and
  // forbidding a line, both have to read the code only: this component's
  // docblock spells out why there is one input and why the drop assigns a
  // single-file list, so a guard reading the raw file matches its own
  // explanation and passes on broken code — which is how guards get deleted.

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

  it("puts the dropped file onto the real input, and only that one", () => {
    // Two things at once. Without the assignment a form posting with no
    // JavaScript would carry nothing. Assigning event.dataTransfer.files
    // whole was the other half of the bug: this zone holds ONE file, so
    // dropping two left two on the input while the card showed one —
    // measured on the fee receipt. The input is what a no-JS submit posts,
    // so the input and the card disagreeing is not cosmetic.
    expect(jsx).toContain("const one = new DataTransfer()");
    expect(jsx).toContain("one.items.add(dropped)");
    expect(jsx).toContain("inputRef.current.files = one.files");
    expect(jsx).not.toContain("inputRef.current.files = event.dataTransfer.files");
  });

  it("has no multiple mode, which is why it cannot duplicate on Browse", () => {
    // The Blade component grew this fault: it appends to the input's own
    // files, and on a change the browser has already put the new selection
    // there, so Browse counted every file twice. This component takes
    // files[0] on both paths and never appends, so the fault has nowhere to
    // live. If a `multiple` prop is ever added here, the change path must
    // replace and only the drop path may append — see
    // DropzoneTest::test_take_is_told_whether_it_is_a_drop_or_a_change.
    expect(jsx).not.toContain("multiple");
    expect(jsx).toContain("event.target.files?.[0]");
    expect(jsx).toContain("event.dataTransfer.files?.[0]");
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
    // SubmitAssignmentRequest is max:5120 — kilobytes — so the constant is
    // that number, not a rounder one someone liked the look of. 5 MB is the
    // "other files" limit: this field has no mimes list, so it takes anything
    // including an archive.
    expect(page).toContain("const SUBMISSION_MAX_BYTES = 5120 * 1024");
  });

  it("tells the student an archive is allowed, since the chip cannot", () => {
    // The chip reads "Any file", which is accurate — the server has no mimes
    // list — but it does not answer someone wondering whether a .zip of their
    // project counts. Naming a type list instead would be NARROWER than what
    // the server takes, which is the worse error.
    expect(page).toContain(".zip is fine");
    expect(page).not.toMatch(/<Dropzone[\s\S]*?acceptLabel/);
  });
});

describe("the fee receipt keeps its field name and its real limits", () => {
  const dialog = readFileSync(
    new URL("../../pages/payments/fee-receipt-dialog.tsx", import.meta.url),
    "utf8",
  );
  const repo = readFileSync(
    new URL("../../api/repositories/billing.repository.ts", import.meta.url),
    "utf8",
  );
  /** Code only. The comments here name the very calls these guards forbid. */
  const code = dialog.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  it("posts under the same field name the controller reads", () => {
    // The zone's id is fee-receipt so the dialog's other ids stay unique; the
    // NAME is what the server sees, and it has to stay `receipt`.
    expect(dialog).toMatch(/<Dropzone[\s\S]*?name="receipt"/);
    expect(repo).toContain('form.append("receipt", payload.receipt)');
  });

  it("sizes the chip from SubmitFeeRequest's own max", () => {
    // max:5120 is kilobytes. Written as 5120 * 1024 rather than 5 * 1024 * 1024
    // so the rule is legible in the constant.
    expect(dialog).toContain("const MAX_RECEIPT_BYTES = 5120 * 1024");
  });

  it("names WEBP, which the server has always taken", () => {
    // The old hint read "PNG, JPG, PDF (max 5MB)" while mimes: allowed webp —
    // the client was refusing to admit to a format the server accepts.
    expect(dialog).toContain('const ACCEPTED_LABEL = "PNG, JPG, WEBP, PDF"');
    expect(dialog).toContain('"image/webp"');
  });

  it("stays required and keeps its zod rules", () => {
    expect(dialog).toMatch(/<Dropzone[\s\S]*?required[\s\S]*?\/>/);
    expect(dialog).toContain("Attach your payment receipt");
    expect(dialog).toContain("file.size <= MAX_RECEIPT_BYTES");
  });

  it("clears the field with setValue, because resetField does not", () => {
    // Measured against this branch's HEAD: the old × called
    // resetField("receipt"), emptyValues() never mentioned the field, so there
    // was no default to reset to and the file stayed. The remove button did
    // nothing at all.
    expect(code).toContain('form.setValue("receipt", undefined as unknown as File');
    expect(code).not.toContain("resetField(");
  });

  it("has no second hand-rolled zone left behind", () => {
    // The point of one component is that there is one. This dialog had its own
    // dashed button, its own dragging state and its own preview URL.
    expect(code).not.toContain("border-dashed");
    expect(code).not.toContain("setDragging");
    expect(code).not.toContain("createObjectURL");
  });
});

describe("the profile photo badge", () => {
  const page = readFileSync(new URL("../../pages/profile/profile-page.tsx", import.meta.url), "utf8");

  it("shares the zones' check rather than hand-rolling its own", () => {
    // It is NOT a Dropzone — it uploads on pick and its target is the avatar,
    // so there is no form to hold a file and nowhere to put chips. The check
    // is shared even though the shape is not.
    expect(page).toContain("rejectionReason(file, \"image/*\", MAX_AVATAR_BYTES)");
    expect(page).not.toContain("<Dropzone");
  });

  it("matches UpdateAvatarRequest's max:1024", () => {
    // An image field, so the 1 MB image limit.
    expect(page).toContain("const MAX_AVATAR_BYTES = 1024 * 1024");
  });
});

describe("the two size limits, as the portal states them", () => {
  /**
   * Images 1 MB, everything else 5 MB — decided by what a field ACCEPTS.
   *
   * The receipt is the field that had to be decided rather than derived: it
   * takes images AND pdf, and splitting it (1 MB for a JPG, 5 for a PDF)
   * would refuse most real receipts, which are 2-4 MB phone photos of a bank
   * slip. One limit for the whole field. The server tests for all of this are
   * in the API suite; these pin the numbers the CLIENT shows, because a chip
   * out of step with the rule is the lie the drop zone exists to prevent.
   */
  const IMAGE_MAX_BYTES = 1024 * 1024;
  const OTHER_MAX_BYTES = 5120 * 1024;

  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

  it("gives the avatar the image limit", () => {
    expect(read("../../pages/profile/profile-page.tsx")).toContain(
      `const MAX_AVATAR_BYTES = ${IMAGE_MAX_BYTES / 1024} * 1024`,
    );
  });

  it("gives the assignment submission the other-files limit", () => {
    expect(read("../../pages/assignments/assignment-detail-page.tsx")).toContain(
      `const SUBMISSION_MAX_BYTES = ${OTHER_MAX_BYTES / 1024} * 1024`,
    );
  });

  it("gives the whole fee receipt one limit, not one per type", () => {
    const dialog = read("../../pages/payments/fee-receipt-dialog.tsx");

    expect(dialog).toContain(`const MAX_RECEIPT_BYTES = ${OTHER_MAX_BYTES / 1024} * 1024`);
    // One constant for the field. A second, image-only threshold here would
    // be the split this decision rejected.
    expect(dialog).not.toMatch(/MAX_RECEIPT_IMAGE|IMAGE_MAX|imageMaxBytes/);
  });

  it("keeps every client threshold at one of the two limits", () => {
    // A third number appearing anywhere is a field that drifted out of the
    // policy — which is how "images 1 MB, files 5 MB" quietly becomes six
    // different sizes.
    for (const path of [
      "../../pages/profile/profile-page.tsx",
      "../../pages/assignments/assignment-detail-page.tsx",
      "../../pages/payments/fee-receipt-dialog.tsx",
    ]) {
      const code = read(path).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      for (const [, kb] of code.matchAll(/MAX_[A-Z_]*BYTES = (\d+) \* 1024/g)) {
        expect([IMAGE_MAX_BYTES / 1024, OTHER_MAX_BYTES / 1024]).toContain(Number(kb));
      }
    }
  });
});
