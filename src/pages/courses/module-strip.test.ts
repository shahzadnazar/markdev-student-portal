import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { defaultModuleId, orderedLessons, orderedModules, selectedModule } from "./module-strip";
import type { LessonSummary, Module } from "@/types";

function lesson(id: number, position: number, done: boolean): LessonSummary {
  return {
    id,
    module_id: 0,
    course_id: 1,
    title: `Lesson ${id}`,
    type: "video",
    duration_minutes: 10,
    position,
    is_preview: false,
    is_completed: done,
  };
}

function module_(id: number, position: number, lessons: LessonSummary[]): Module {
  return {
    id,
    course_id: 1,
    title: `Module ${position}`,
    position,
    duration_minutes: lessons.length * 10,
    lessons_count: lessons.length,
    lessons,
  };
}

/** Four modules of three lessons; `doneThrough` completes that many, in course order. */
function course(doneThrough: number): Module[] {
  let seen = 0;

  const modules = [1, 2, 3, 4].map((position) =>
    module_(100 + position, position, [1, 2, 3].map((n) => lesson(position * 10 + n, n, ++seen <= doneThrough))),
  );

  // Handed back out of position order, and with ids that disagree with
  // positions, so anything leaning on arrival order or on id is caught.
  return modules.reverse();
}

describe("module ordering", () => {
  it("orders by position, not by id or by arrival", () => {
    expect(orderedModules(course(0)).map((m) => m.position)).toEqual([1, 2, 3, 4]);
  });

  it("does not reorder the array it was given", () => {
    // The query cache hands out the array it holds; sorting in place would
    // reorder it for every other reader of the same cache entry.
    const modules = course(0);
    const before = modules.map((m) => m.id);

    orderedModules(modules);

    expect(modules.map((m) => m.id)).toEqual(before);
  });

  it("orders lessons within a module by position", () => {
    const shuffled = module_(1, 1, [lesson(3, 3, false), lesson(1, 1, false), lesson(2, 2, false)]);

    expect(orderedLessons(shuffled).map((l) => l.position)).toEqual([1, 2, 3]);
  });

  it("survives a course with no modules", () => {
    expect(orderedModules(undefined)).toEqual([]);
    expect(orderedModules([])).toEqual([]);
    expect(orderedLessons(undefined)).toEqual([]);
    expect(defaultModuleId([])).toBeNull();
    expect(selectedModule([], null)).toBeNull();
  });
});

describe("which module the page opens on", () => {
  it("opens on module 1 for a student who has started nothing", () => {
    expect(selectedModule(course(0), null)?.position).toBe(1);
  });

  it("opens on the module holding the next incomplete lesson, not module 1", () => {
    // Nine lessons done: modules 1-3 finished, so the next one is in module 4.
    expect(selectedModule(course(9), null)?.position).toBe(4);
  });

  it("opens mid-module when the student is part-way through one", () => {
    // Four done: module 1 finished, one lesson into module 2.
    expect(selectedModule(course(4), null)?.position).toBe(2);
  });

  it("opens on the last module when everything is complete", () => {
    // Not module 1: a student who finished the course did not finish at the start.
    expect(selectedModule(course(12), null)?.position).toBe(4);
  });

  it("skips an empty module when choosing on its own", () => {
    const modules = [
      module_(1, 1, []),
      module_(2, 2, [lesson(20, 1, false)]),
    ];

    expect(defaultModuleId(modules)).toBe(2);
  });

  it("still opens on something when no module has any lessons", () => {
    const modules = [module_(1, 1, []), module_(2, 2, [])];

    // The strip renders, the panel below says the module is empty; it does not
    // land on nothing and render a blank card.
    expect(selectedModule(modules, null)?.id).toBe(1);
  });
});

describe("clicking a module", () => {
  it("shows that module, whatever the default was", () => {
    const modules = course(0);

    expect(selectedModule(modules, 102)?.position).toBe(2);
    expect(orderedLessons(selectedModule(modules, 102)!).map((l) => l.id)).toEqual([21, 22, 23]);
  });

  it("can select an empty module the default would have skipped", () => {
    const modules = [module_(1, 1, []), module_(2, 2, [lesson(20, 1, false)])];

    expect(selectedModule(modules, 1)?.id).toBe(1);
    expect(orderedLessons(selectedModule(modules, 1)!)).toEqual([]);
  });

  it("falls back to the default when the clicked module is gone", () => {
    // A refetch that drops it must not leave the strip with nothing lit.
    expect(selectedModule(course(0), 999)?.position).toBe(1);
  });
});

/**
 * The block this replaced drew five day-boxes from `new Date()`. Nothing in
 * the strip may go back to that: a "Week of" label, a day number, an "N days
 * left" — all of it would be the browser's clock deciding what a course looks
 * like, which is what was wrong with it.
 */
describe("nothing on the courses page comes from the browser clock", () => {
  const code = [
    readFileSync(path.resolve(__dirname, "courses-page.tsx"), "utf8"),
    readFileSync(path.resolve(__dirname, "module-strip.ts"), "utf8"),
  ]
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

  it("reads no clock", () => {
    expect(code).not.toMatch(/new Date\(/);
    expect(code).not.toMatch(/Date\.now\(/);
    expect(code).not.toMatch(/getDay\(\)|getDate\(\)|setDate\(/);
  });

  it("keeps the weekly schedule gone", () => {
    expect(code).not.toMatch(/weekDays|Weekly Schedule/);
    expect(code).toContain("Course Modules");
  });

  it("gives the arrows something to do", () => {
    // They scrolled nothing before. Either they scroll, or they are not there.
    expect(code).toMatch(/ChevronLeft/);
    expect(code).toMatch(/scrollBy\(/);
    expect(code).toMatch(/aria-label="Scroll modules (left|right)"/);
  });

  it("shows the lessons of the selected module, not the first three of the course", () => {
    expect(code).not.toMatch(/lessons\.slice\(0, 3\)/);
    expect(code).toMatch(/orderedLessons\(/);
  });
});
