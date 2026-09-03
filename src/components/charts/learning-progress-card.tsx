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

import { cn } from "@/lib/utils";
import type { ProgressPoint } from "@/types";

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

  return (
    <div className="rounded-xl bg-white px-4 py-3 shadow-elevated ring-1 ring-outline-variant/40">
      <p className="font-mono text-label-sm uppercase text-on-surface-variant">
        {format(parseISO(point.month), "MMMM yyyy")}
      </p>

      {/* Every series is a share of what was available to this student that
          month, so each carries a % — they are not counts and must not be
          added together. */}
      <div className="mt-2 space-y-1.5 text-body-sm">
        <p>
          <span className="font-semibold">{point.lessons}%</span> of lessons
          completed
        </p>

        <p>
          <span className="font-semibold">{point.quizzes}%</span> of quizzes
          completed
        </p>

        <p>
          <span className="font-semibold">{point.assignments}%</span> of
          assignments submitted
        </p>

        <p>
          <span className="font-semibold">{point.attendance}%</span> attendance
        </p>

        <p>
          <span className="font-semibold">{point.notes}%</span> of notes read
        </p>
      </div>
    </div>
  );
}

interface LearningProgressCardProps {
  progress: ProgressPoint[];
  className?: string;
}

/**
 * Monthly learning progress, shared by the dashboard and the progress page.
 *
 * One component rather than one per page: the two were separate charts of
 * different data, so the dashboard showed daily minutes while the progress page
 * showed monthly activity, and only one of them was the chart people meant by
 * "learning progress".
 */
export function LearningProgressCard({
  progress,
  className,
}: LearningProgressCardProps) {
  // The series are percentages, so they cannot be summed into a total. What is
  // worth stating is whether anything has been recorded at all.
  const hasActivity = useMemo(
    () =>
      progress.some(
        (point) =>
          point.lessons > 0 ||
          point.quizzes > 0 ||
          point.assignments > 0 ||
          point.attendance > 0 ||
          point.notes > 0,
      ),
    [progress],
  );

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <p className="font-mono text-label-sm uppercase text-primary">
          Last 12 months
        </p>

        <CardTitle>Learning progress</CardTitle>

        <CardDescription>
          {hasActivity
            ? "How much of your lessons, quizzes, assignments, attendance and notes you completed each month."
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
            aria-label="Monthly percentage completed for lessons, quizzes, assignments, attendance and notes"
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
                  domain={[0, 100]}
                  tickFormatter={(value: number) => `${value}%`}
                  tick={{
                    fill: chart.tick,
                    fontSize: 11,
                    fontFamily: monoFont,
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
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