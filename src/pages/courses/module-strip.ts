import type { Module } from "@/types";

/**
 * The course's modules in the order the instructor put them in.
 *
 * `position` is the instructor's ordering and the API's `id` is not — a module
 * inserted between two others gets the next id and the earlier position. Sort
 * on a copy: the query cache hands out the array it is holding, and sorting it
 * in place would reorder what every other reader sees.
 */
export function orderedModules(modules: readonly Module[] | undefined): Module[] {
  return [...(modules ?? [])].sort((a, b) => a.position - b.position);
}

/** A module's lessons, in the instructor's order. */
export function orderedLessons(module: Module | undefined) {
  return [...(module?.lessons ?? [])].sort((a, b) => a.position - b.position);
}

/**
 * Which module to show when the page opens.
 *
 * The one holding the student's next incomplete lesson — a student coming back
 * to module 4 opens on module 4, not on a module they finished in week one.
 * "Next" is the first incomplete lesson in course order, which is the same
 * lesson the Next Lesson card offers, so the two halves of the page agree.
 *
 * When every lesson is done there is no next one, and the last module is the
 * honest answer: it is where they finished. Falling back to the first module
 * would send someone who completed the course back to the beginning.
 *
 * Empty modules are skipped as a default — landing on a module with nothing in
 * it looks like a page that failed to load. They stay in the strip and stay
 * clickable; they are just not where the page opens on its own.
 */
export function defaultModuleId(modules: readonly Module[] | undefined): number | null {
  const ordered = orderedModules(modules);
  const withLessons = ordered.filter((module) => orderedLessons(module).length > 0);

  if (withLessons.length === 0) {
    return ordered[0]?.id ?? null;
  }

  const next = withLessons.find((module) =>
    orderedLessons(module).some((lesson) => !lesson.is_completed),
  );

  return (next ?? withLessons[withLessons.length - 1]).id;
}

/**
 * The module actually on screen.
 *
 * A student's click wins, but only while it still names a module this course
 * has: a module deleted under them, or a refetch that returns a different
 * course's modules, would otherwise leave the strip with nothing selected and
 * an empty panel below it.
 */
export function selectedModule(
  modules: readonly Module[] | undefined,
  clickedId: number | null,
): Module | null {
  const ordered = orderedModules(modules);
  const clicked = clickedId === null ? undefined : ordered.find((module) => module.id === clickedId);

  if (clicked) return clicked;

  const fallbackId = defaultModuleId(modules);

  return ordered.find((module) => module.id === fallbackId) ?? null;
}
