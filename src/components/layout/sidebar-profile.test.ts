import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { paths } from "@/routes/paths";

/**
 * The name and role at the foot of the sidebar open the student's own profile.
 *
 * The suite runs in node with no DOM and the project has no renderer, so this
 * reads the component's source for the three things that decide the
 * behaviour — the destination, the element, and the label. That is weaker than
 * rendering it, and it is stated plainly rather than dressed up: what it can
 * prove is that the footer is a NavLink to the profile path with an accessible
 * name, which is exactly what makes it clickable, keyboard reachable and
 * announced.
 */
const source = readFileSync(new URL("./sidebar.tsx", import.meta.url), "utf8");

/** The footer block, from its comment to the end of the component. */
const footer = source.slice(source.indexOf("{/* Current student"));

describe("sidebar profile footer", () => {
  it("points at the profile page that already exists", () => {
    expect(paths.profile).toBeTruthy();
    expect(footer).toContain("to={paths.profile}");
  });

  it("is a NavLink, so it is in the tab order and can be active", () => {
    // Not a <div onClick>: that would pass a click test and still be
    // unreachable by keyboard and silent to a screen reader.
    expect(footer).toMatch(/<NavLink\b/);
  });

  it("announces itself", () => {
    expect(footer).toContain('aria-label="Your profile"');
  });

  it("highlights when the profile is open, like the other nav items", () => {
    expect(footer).toContain("isActive");
    expect(footer).toContain("bg-primary/[0.06]");
  });

  it("keeps the link when the sidebar is collapsed, hiding only the text", () => {
    // The name and role are dropped; the anchor and the avatar are not.
    expect(footer).toMatch(/collapsed \? null : \(/);
    expect(footer).toContain("<Avatar");
  });

  it("closes the mobile drawer on navigate, like every other item", () => {
    expect(footer).toContain("onClick={onNavigate}");
  });

  it("shows the account's own roles rather than a hardcoded label", () => {
    expect(footer).toContain("user?.roles");
    expect(footer).not.toMatch(/>\s*Student\s*</);
  });

  it("names no user, so it cannot open anyone else's profile", () => {
    // paths.profile is a fixed string with no id segment.
    expect(paths.profile).not.toMatch(/:|\$\{/);
    expect(footer).not.toMatch(/user\?\.id|user\.id/);
  });
});
