import { cssToken } from "@/lib/css-token";
import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDayLabel, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/types";

type ActivityPoint = DashboardData["activity"][number];

/**
 * Chart colors are pinned to the design tokens in src/index.css —
 * SVG presentation attributes are the one place we can't lean on classes.
 */
const chart = {
  stroke: cssToken("--color-primary", "#124389"),
  grid: "#e8e8ea", // --color-surface-container-high
  tick: "#727784", // --color-outline
} as const;

const monoFont = "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace";

interface ActivityTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ActivityPoint }>;
}

function ActivityTooltip({ active, payload }: ActivityTooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-xl bg-white px-3.5 py-2.5 shadow-elevated ring-1 ring-outline-variant/40">
      <p className="font-mono text-label-sm text-on-surface-variant uppercase">
        {formatDayLabel(point.date)}
      </p>
      <p className="mt-0.5 text-body-sm font-semibold text-on-surface">
        {point.minutes > 0 ? formatDuration(point.minutes) : "No activity"}
      </p>
    </div>
  );
}

interface ActivityChartCardProps {
  activity: ActivityPoint[];
  className?: string;
}

/** "Learning activity" card — minutes per day over the trailing 4 weeks. */
export function ActivityChartCard({ activity, className }: ActivityChartCardProps) {
  const totalMinutes = activity.reduce((sum, point) => sum + point.minutes, 0);

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <p className="font-mono text-label-sm text-primary uppercase">Last 4 weeks</p>
        <CardTitle>Learning activity</CardTitle>
        <CardDescription>
          {totalMinutes > 0
            ? `${formatDuration(totalMinutes)} of learning logged — keep it up.`
            : "Your daily learning minutes will chart here as you study."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {activity.length === 0 ? (
          <p className="flex h-60 items-center justify-center text-center text-body-sm text-on-surface-variant">
            No activity recorded yet — open a lesson to start the chart.
          </p>
        ) : (
          <div
            className="h-60 w-full"
            role="img"
            aria-label="Area chart of daily learning minutes over the last four weeks"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboard-activity-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chart.stroke} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={chart.stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={chart.grid} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => format(parseISO(value), "EEE")}
                  tick={{ fill: chart.tick, fontSize: 11, fontFamily: monoFont }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={28}
                  interval="preserveStartEnd"
                />
                <YAxis
                  width={40}
                  tickFormatter={(value: number) => `${value}m`}
                  tick={{ fill: chart.tick, fontSize: 11, fontFamily: monoFont }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ActivityTooltip />}
                  cursor={{ stroke: chart.stroke, strokeOpacity: 0.3 }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  name="Minutes"
                  stroke={chart.stroke}
                  strokeWidth={2}
                  fill="url(#dashboard-activity-gradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: chart.stroke, stroke: "#ffffff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
