import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The lesson player has no Resources tab, and no tab strip at all.
 *
 * Resources live on the Notes page now, where a student sees every piece of
 * material at once instead of opening each lesson to find what is attached to
 * it. That left one tab, and one tab is a heading with extra steps — so the
 * strip went too.
 *
 * A source check because this repo's vitest runs in node with no DOM. What is
 * at risk is someone reinstating the tab, and that is visible in the source.
 */

const LESSONS = path.resolve(__dirname);

/** Code only — a guard that trips on its own explanation is one people delete. */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

const player = stripComments(readFileSync(path.join(LESSONS, "lesson-player-page.tsx"), "utf8"));

describe("the lesson player", () => {
  it("has no Resources tab", () => {
    expect(player).not.toMatch(/ResourcesCard/);
    expect(player).not.toMatch(/value="resources"/);
    expect(player).not.toMatch(/lesson\.resources/);
  });

  it("has no tab strip", () => {
    for (const symbol of ["Tabs", "TabsList", "TabsTrigger", "TabsContent"]) {
      expect(player, `${symbol} is still in the player`).not.toMatch(new RegExp(`\\b${symbol}\\b`));
    }
  });

  it("still shows the video, the discussion and the private notebook", () => {
    expect(player).toContain("<LessonContent");
    expect(player).toContain("<LessonMetaCard");
    expect(player).toContain("<CommentsSection");
    expect(player).toContain("<PrivateNotesCard");
  });

  it("still tracks completion and playback", () => {
    // The tab strip went; nothing that feeds progress went with it.
    expect(player).toContain("useCompleteLesson");
    expect(player).toContain("useVideoProgress");
    expect(player).toContain("useTrackLessonActivity");
  });
});

describe("nothing renders a resources card any more", () => {
  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const full = path.join(dir, entry);

      if (statSync(full).isDirectory()) return sourceFiles(full);

      return /\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [full] : [];
    });
  }

  it("leaves no ResourcesCard behind for tsc to complain about", () => {
    const src = path.resolve(__dirname, "../..");

    for (const file of sourceFiles(src)) {
      expect(readFileSync(file, "utf8"), `${path.relative(src, file)} still mentions ResourcesCard`)
        .not.toMatch(/ResourcesCard/);
    }
  });

  it("imports nothing it no longer uses", () => {
    // noUnusedLocals is on, so tsc is the real check; this names the symbols
    // the removal orphaned so the next person sees why they went.
    const content = readFileSync(path.join(LESSONS, "lesson-content.tsx"), "utf8");
    const imports = content.slice(0, content.indexOf("export "));

    for (const symbol of ["Youtube", "LinkIcon", "ExternalLink", "Download", "formatBytes", "Resource"]) {
      expect(imports, `lesson-content still imports ${symbol}`).not.toMatch(new RegExp(`\\b${symbol}\\b`));
    }
    for (const symbol of ["Paperclip", "PlayCircle"]) {
      expect(player, `the player still imports ${symbol}`).not.toMatch(new RegExp(`\\b${symbol}\\b`));
    }
  });
});
