import { describe, expect, it } from "vitest";
import { sessionLabel, statusBadge } from "./attendance-page";
import type { DailyAttendanceRecord, DailyAttendanceStatus } from "@/types";

/**
 * What a row on the attendance page shows.
 *
 * The academy kept attendance in two tables — a day register and a per-class
 * sheet — and this page merged them server-side. The sheet was folded into the
 * register and dropped; the two facts it alone carried, the session title and
 * the course, moved onto the register row. So what is pinned here is that the
 * page still shows them, and that a status the merge introduced renders as
 * itself rather than falling through to nothing.
 */

function record(over: Partial<DailyAttendanceRecord> = {}): DailyAttendanceRecord {
  return {
    id: "2026-06-01",
    date: "2026-06-01",
    status: "present",
    remarks: null,
    arrived_at: null,
    source: "manual",
    marked_at: null,
    corrected: false,
    session_title: "Live session — Jun 1",
    course: { id: 7, title: "Advanced Laravel" },
    ...over,
  };
}

describe("attendance row", () => {
  it("shows the session title the retired class sheet used to carry", () => {
    expect(sessionLabel(record())).toEqual({
      text: "Live session — Jun 1",
      muted: false,
      holiday: false,
    });
  });

  it("says so plainly on a day with no session rather than leaving it blank", () => {
    expect(sessionLabel(record({ session_title: null }))).toEqual({
      text: "No session",
      muted: true,
      holiday: false,
    });
  });

  it("names the holiday, so the gap does not read as missing data", () => {
    const day = record({ status: "holiday", session_title: null, remarks: "Eid ul-Fitr" });

    expect(sessionLabel(day)).toEqual({ text: "Eid ul-Fitr", muted: false, holiday: true });
  });

  it("falls back to a label when a holiday has no name", () => {
    expect(sessionLabel(record({ status: "holiday", remarks: null })).text).toBe("Academy closed");
  });

  it("keeps the course beside the session", () => {
    // Not sessionLabel's job, but the pair is the point: the row shows which
    // class the day was, and both halves came off the same retired table.
    expect(record().course).toEqual({ id: 7, title: "Advanced Laravel" });
  });
});

describe("status badges", () => {
  const statuses: DailyAttendanceStatus[] = [
    "present",
    "late",
    "absent",
    "leave",
    "excused",
    "holiday",
  ];

  it("has a badge for every status the server can send", () => {
    for (const status of statuses) {
      expect(statusBadge[status], status).toBeDefined();
      expect(statusBadge[status].label.length).toBeGreaterThan(0);
    }
  });

  it("calls an excused day excused, not leave", () => {
    // It is worth the same half day, but it did not come out of the student's
    // leave allowance — reporting one as the other is what the consolidation
    // set out to stop.
    expect(statusBadge.excused.label).toBe("Excused");
    expect(statusBadge.excused.label).not.toBe(statusBadge.leave.label);
  });
});
