import { useMemo } from "react";
import { format, parseISO, startOfWeek } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDuration } from "@/lib/format";
import type { ProgressOverview } from "@/types";

type ActivityPoint = ProgressOverview["activity"][number];

interface WeeklyPoint {
  /** ISO date of the Monday starting the week. */
  week_start: string;
  minutes: number;
}

/**
 * Chart colors are pinned to the design tokens in src/index.css —
 * SVG presentation attributes are the one place we can't lean on classes.
 */
const chart = {
  bar: "#0c5abd", // --color-primary (Deep Ocean Blue)
  grid: "#e8e8ea", // --color-surface-container-high
  tick: "#727784", // --color-outline
} as const;

const monoFont = "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace";

/** Fold ~84 daily points into 12 weekly sums so the chart stays legible. */
function toWeekly(activity: ActivityPoint[]): WeeklyPoint[] {
  const buckets = new Map<string, number>();
  for (const point of activity) {
    const weekStart = format(startOfWeek(parseISO(point.date), { weekStartsOn: 1 }), "yyyy-MM-dd");
    buckets.set(weekStart, (buckets.get(weekStart) ?? 0) + point.minutes);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week_start, minutes]) => ({ week_start, minutes }));
}

/** Compact tick label: minutes under an hour, whole hours above. */
function minutesTick(value: number): string {
  return value >= 60 ? `${Math.round(value / 60)}h` : `${value}m`;
}

interface WeeklyTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: WeeklyPoint }>;
}

function WeeklyTooltip({ active, payload }: WeeklyTooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-xl bg-white px-3.5 py-2.5 shadow-elevated ring-1 ring-outline-variant/40">
      <p className="font-mono text-label-sm text-on-surface-variant uppercase">
        Week of {formatDate(point.week_start)}
      </p>
      <p className="mt-0.5 text-body-sm font-semibold text-on-surface">
        {point.minutes > 0 ? formatDuration(point.minutes) : "No activity"}
      </p>
    </div>
  );
}

interface ProgressActivityCardProps {
  activity: ActivityPoint[];
}

/** "Learning activity" — weekly learning time over the trailing 12 weeks. */
export function ProgressActivityCard({ activity }: ProgressActivityCardProps) {
  const weekly = useMemo(() => toWeekly(activity), [activity]);
  const totalMinutes = useMemo(
    () => activity.reduce((sum, point) => sum + point.minutes, 0),
    [activity],
  );

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-label-sm text-primary uppercase">Last 12 weeks</p>
        <CardTitle>Learning activity</CardTitle>
        <CardDescription>
          {totalMinutes > 0
            ? `${formatDuration(totalMinutes)} of learning logged across the last twelve weeks.`
            : "Your weekly learning time will chart here as you study."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {weekly.length === 0 ? (
          <p className="flex h-64 items-center justify-center text-center text-body-sm text-on-surface-variant">
            No activity recorded yet — open a lesson to start the chart.
          </p>
        ) : (
          <div
            className="h-64 w-full"
            role="img"
            aria-label="Bar chart of weekly learning time over the last twelve weeks"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="progress-weekly-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chart.bar} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={chart.bar} stopOpacity={0.45} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={chart.grid} />
                <XAxis
                  dataKey="week_start"
                  tickFormatter={(value: string) => format(parseISO(value), "MMM d")}
                  tick={{ fill: chart.tick, fontSize: 11, fontFamily: monoFont }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={16}
                  interval="preserveStartEnd"
                />
                <YAxis
                  width={40}
                  tickFormatter={minutesTick}
                  tick={{ fill: chart.tick, fontSize: 11, fontFamily: monoFont }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<WeeklyTooltip />}
                  cursor={{ fill: "rgba(12, 90, 189, 0.06)" }}
                />
                <Bar
                  dataKey="minutes"
                  name="Minutes"
                  fill="url(#progress-weekly-gradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
