import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { ProgressOverview } from "@/types";

type ProgressPoint = ProgressOverview["progress"][number];

const chart = {
  lessons: "#124389",
  quizzes: "#7C5CE5",
  assignments: "#3B82A0",
  attendance: "#16A34A",
  notes: "#F59E0B",
  grid: "#e8e8ea",
  tick: "#727784",
};

const monoFont =
  "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace";

interface ProgressTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{
    payload?: ProgressPoint;
  }>;
}

function ProgressTooltip({
  active,
  payload,
}: ProgressTooltipProps) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  const total =
    point.lessons +
    point.quizzes +
    point.assignments +
    point.attendance +
    point.notes;

  return (
    <div className="rounded-xl bg-white px-4 py-3 shadow-elevated ring-1 ring-outline-variant/40">
      <p className="font-mono text-label-sm uppercase text-on-surface-variant">
        {format(parseISO(point.month), "MMMM yyyy")}
      </p>

      <div className="mt-2 space-y-1.5 text-body-sm">
        <p>
          <span className="font-semibold">
            {point.lessons}
          </span>{" "}
          lessons completed
        </p>

        <p>
          <span className="font-semibold">
            {point.quizzes}
          </span>{" "}
          quizzes completed
        </p>

        <p>
          <span className="font-semibold">
            {point.assignments}
          </span>{" "}
          assignments submitted
        </p>

        <p>
          <span className="font-semibold">
            {point.attendance}%
          </span>{" "}
          attendance
        </p>

        <p>
          <span className="font-semibold">
            {point.notes}
          </span>{" "}
          notes read
        </p>

        <p className="border-t pt-1.5 font-semibold">
          {total} total activities
        </p>
      </div>
    </div>
  );
}

interface ProgressProgressCardProps {
  progress: ProgressPoint[];
}

export function ProgressProgressCard({
  progress,
}: ProgressProgressCardProps) {
  const totalActivities = useMemo(
    () =>
      progress.reduce(
        (total, point) =>
          total +
          point.lessons +
          point.quizzes +
          point.assignments +
          point.notes,
        0,
      ),
    [progress],
  );

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-label-sm uppercase text-primary">
          Last 12 months
        </p>

        <CardTitle>Learning progress</CardTitle>

        <CardDescription>
          {totalActivities > 0
            ? `${totalActivities} learning activities completed across the last twelve months.`
            : "Your lessons, quizzes, assignments, attendance and notes will appear here."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {progress.length === 0 ? (
          <p className="flex h-64 items-center justify-center text-center text-body-sm text-on-surface-variant">
            No progress recorded yet.
          </p>
        ) : (
          <div
            className="h-80 w-full"
            role="img"
            aria-label="Monthly learning progress showing lessons, quizzes, assignments, attendance and notes"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={progress}
                margin={{
                  top: 8,
                  right: 16,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke={chart.grid}
                />

                <XAxis
                  dataKey="month"
                  tickFormatter={(value: string) => {
                    const date = parseISO(value);

                    return format(date, "MMM");
                  }}
                  tick={{
                    fill: chart.tick,
                    fontSize: 11,
                    fontFamily: monoFont,
                  }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={20}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fill: chart.tick,
                    fontSize: 11,
                    fontFamily: monoFont,
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />

                <Tooltip
                  content={<ProgressTooltip />}
                  cursor={{
                    stroke: chart.grid,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="lessons"
                  name="Lessons"
                  stroke={chart.lessons}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />

                <Line
                  type="monotone"
                  dataKey="quizzes"
                  name="Quizzes"
                  stroke={chart.quizzes}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />

                <Line
                  type="monotone"
                  dataKey="assignments"
                  name="Assignments"
                  stroke={chart.assignments}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />

                <Line
                  type="monotone"
                  dataKey="attendance"
                  name="Attendance"
                  stroke={chart.attendance}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />

                <Line
                  type="monotone"
                  dataKey="notes"
                  name="Notes"
                  stroke={chart.notes}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: chart.lessons }}
            />
            Lessons
          </div>

          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: chart.quizzes }}
            />
            Quizzes
          </div>

          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: chart.assignments }}
            />
            Assignments
          </div>

          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: chart.attendance }}
            />
            Attendance
          </div>

          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: chart.notes }}
            />
            Notes
          </div>
        </div>
      </CardContent>
    </Card>
  );
}