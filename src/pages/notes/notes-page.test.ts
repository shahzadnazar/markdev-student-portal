import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The Notes page shows published material — note files AND course resources —
 * and tells the student which is which.
 *
 * A source check rather than a rendered one: this repo's vitest runs in node
 * with no DOM, so there is nothing to render into. What is actually at risk
 * here is someone later reaching for `file_url` again, or dropping the
 * source check around markNoteRead, and both are visible in the source.
 */

const PAGE = path.resolve(__dirname, "notes-page.tsx");

/** Code only. A guard that trips on its own explanation is a guard people delete. */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

const code = stripComments(readFileSync(PAGE, "utf8"));

describe("the Notes page", () => {
  it("opens whatever the row points at, not only a stored file", () => {
    // `url` is the one field that is right for both kinds. `file_url` is null
    // on a link, so opening on it would render a link with no way to follow it.
    expect(code).toContain("window.open(");
    expect(code).toMatch(/if\s*\(note\.url\)/);
    expect(code).toMatch(/\{note\.url \?/);
  });

  it("marks a note read but never a resource", () => {
    // ids are unique within a source, not across them: posting a resource id
    // to /notes/{id}/read would mark some unrelated note as read.
    expect(code).toMatch(/note\.source === "note"[\s\S]{0,120}markNoteRead\.mutate/);
  });

  it("keys rows on source and id together", () => {
    expect(code).toContain("`${note.source}-${note.id}`");
    // Not on the id alone — a note and a resource can share one.
    expect(code).not.toMatch(/key=\{note\.id\}/);
  });

  it("gives a link its own icon and its own verb", () => {
    expect(code).toMatch(/note\.kind === "link"/);
    expect(code).toContain("Youtube");
    expect(code).toContain("LinkIcon");
    expect(code).toContain("ExternalLink");
    // The accessible name has to say what the button does, not always "Download".
    expect(code).toMatch(/aria-label=\{`\$\{note\.kind === "link" \? "Open" : "Download"\}/);
  });

  it("does not filter or scope by enrollment in the browser", () => {
    // Which courses a student is enrolled in is the server's answer; a portal
    // that re-decides it is a portal that can be told otherwise.
    expect(code).not.toMatch(/enroll/i);
  });

  it("shows the row's own description, so a lesson resource can name its lesson", () => {
    // The API sends "From lesson: ..." on a lesson-level resource. A card that
    // always printed the generic fallback would drop that attribution.
    expect(code).toMatch(/\{note\.description \?\?/);
  });

  it("shows no private notes", () => {
    // Private notes are the student's own writing on the lesson player. They
    // are not published material and have no route through this page.
    expect(code).not.toMatch(/private/i);
  });
});
