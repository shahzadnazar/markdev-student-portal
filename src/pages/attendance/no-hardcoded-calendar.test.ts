import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The portal must not hold a calendar of its own.
 *
 * Which weekdays the academy opens is the `academy_working_days` setting and
 * holidays are rows in a table; both reach the portal through
 * /api/v1/attendance/calendar. An academy that opens on Saturdays, or closes
 * for an Eid whose date moves every year, has to be right here without a
 * redeploy — which it cannot be if any of it is written down in this repo.
 *
 * A grep rather than a behavioural test on purpose: the failure this guards
 * against is someone adding a shortcut later, and a shortcut is visible in the
 * source before it is visible in behaviour.
 */

const SRC = path.resolve(__dirname, "../..");

/**
 * Code only — comments are prose.
 *
 * The files that are most careful about this say so in a comment ("an academy
 * that opens on Saturdays, or closes for Eid, is drawn from the API"), and a
 * guard that fires on the explanation of the rule is a guard people delete.
 */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);

    if (statSync(full).isDirectory()) return sourceFiles(full);

    return /\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [full] : [];
  });
}

describe("the portal holds no calendar of its own", () => {
  const files = sourceFiles(SRC).map((file) => ({
    file: path.relative(SRC, file),
    code: stripComments(readFileSync(file, "utf8")),
  }));

  it("finds source files to check", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("names no weekday as a weekend", () => {
    // e.g. `=== "Saturday"`, `["Sat","Sun"]`, `getDay() === 0`.
    const weekendish = /(Saturday|Sunday)|(["'](Sat|Sun)["'])|getDay\(\)\s*[=!]==?\s*[06]/;

    for (const { file, code } of files) {
      expect(weekendish.test(code), `${file} decides a weekend locally`).toBe(false);
    }
  });

  it("writes no holiday name or fixed holiday date", () => {
    // Eid moves every year; 14 August does not, and neither belongs in here.
    const holidayish = /Eid|Muharram|Ramadan|Ashura|Independence Day|\b(08-14|12-25|01-01)\b/;

    for (const { file, code } of files) {
      expect(holidayish.test(code), `${file} names a holiday`).toBe(false);
    }
  });

  it("reads working days from the served calendar, not a constant", () => {
    const calendar = files.find((entry) => entry.file.endsWith("attendance/leave-cost.ts"));

    expect(calendar).toBeDefined();
    // The only source of which days are working.
    expect(calendar!.code).toContain("calendar.working_days.includes");
    // And no list of ISO weekdays written down beside it.
    expect(calendar!.code).not.toMatch(/\[\s*1\s*,\s*2\s*,\s*3\s*,\s*4\s*,\s*5\s*\]/);
  });
});
