import { motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarClock,
  CalendarOff,
  ClipboardList,
  Clock,
  Coins,
  FileText,
  Mail,
  Percent,
  Scale,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRules } from "@/hooks/use-engagement";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AttendanceWeight, RuleSection, RulesSlot, UpcomingHoliday } from "@/types";

/**
 * Rules & Regulations.
 *
 * Every sentence and every number on this page is served finished by
 * /api/v1/rules. Nothing here holds a default, computes a percentage or
 * assembles a sentence from a value — an admin changing a setting or rewording
 * a rule has to change what a student reads with nothing redeployed, and that
 * only holds if this file contains no figure of its own.
 *
 * The one exception is decoration: which icon sits beside which section, and
 * how a weight bar is drawn. Those say nothing a student could act on.
 */

/** Section icons, keyed by the server's section key. Decoration only. */
const sectionIcons: Record<string, LucideIcon> = {
  attendance: Clock,
  leave: CalendarOff,
  absence: Scale,
  fees: Coins,
  assignments: FileText,
  percentage: Percent,
  contact: Mail,
};

/** Bar colour per status. Carries no number — the weight comes from the API. */
const weightTone: Record<AttendanceWeight["status"], string> = {
  present: "bg-success",
  late: "bg-warning",
  leave: "bg-secondary",
  absent: "bg-error",
};

export default function RulesPage() {
  const rulesQuery = useRules();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        eyebrow="Account"
        title="Rules & Regulations"
        description="How attendance, leave, fines and fees work here. Everything below is what the system actually does."
        actions={
          rulesQuery.data?.updated_at ? (
            <span className="font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">
              Updated {formatDate(rulesQuery.data.updated_at)}
            </span>
          ) : null
        }
      />

      {rulesQuery.isLoading ? (
        <RulesSkeleton />
      ) : rulesQuery.isError ? (
        <ErrorState
          title="Couldn't load the rules"
          error={rulesQuery.error}
          onRetry={() => {
            void rulesQuery.refetch();
          }}
          className="py-12"
        />
      ) : rulesQuery.data ? (
        <div className="space-y-4">
          {rulesQuery.data.slot ? <SlotCard slot={rulesQuery.data.slot} /> : null}

          {rulesQuery.data.sections.map((section, index) => (
            <SectionCard
              key={section.key}
              section={section}
              index={index}
              weights={section.key === "percentage" ? rulesQuery.data.weights : null}
              holidays={section.key === "attendance" ? rulesQuery.data.holidays : null}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** The student's own slot, called out above the rules that refer to it. */
function SlotCard({ slot }: { slot: RulesSlot }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* flex-row explicitly: Card is a flex column by default, and without
          this the three blocks stack and centre instead of sitting in a row. */}
      <Card className="flex-row flex-wrap items-start gap-x-10 gap-y-4 border-l-4 border-l-primary p-6">
        <div>
          <p className="font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">Your slot</p>
          <p className="mt-1 text-title-md font-semibold text-on-surface">{slot.name}</p>
        </div>
        <div>
          <p className="font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">Timing</p>
          {/* Already 12-hour from the server — never reformatted here. */}
          <p className="mt-1 text-body-md text-on-surface">
            {slot.starts_at} – {slot.ends_at}
          </p>
        </div>
        <div>
          <p className="font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">Runs on</p>
          <p className="mt-1 text-body-md text-on-surface">{slot.days}</p>
        </div>
      </Card>
    </motion.div>
  );
}

function SectionCard({
  section,
  index,
  weights,
  holidays,
}: {
  section: RuleSection;
  index: number;
  weights: AttendanceWeight[] | null;
  holidays: UpcomingHoliday[] | null;
}) {
  const Icon = sectionIcons[section.key] ?? ClipboardList;

  return (
    <motion.section
      aria-labelledby={`rules-${section.key}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 6) * 0.04, ease: "easeOut" }}
    >
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-4.5" aria-hidden />
          </span>
          <h2 id={`rules-${section.key}`} className="text-title-md font-semibold text-on-surface">
            {section.title}
          </h2>
        </div>

        <ul className="mt-4 space-y-2.5">
          {section.rules.map((rule) => (
            <li key={rule.key} className="flex gap-3">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary/70" aria-hidden />
              {/* Rendered exactly as served: the numbers are already in it. */}
              <p className="text-body-md leading-6 text-on-surface-variant">{rule.text}</p>
            </li>
          ))}
        </ul>

        {weights ? <WeightTable weights={weights} /> : null}
        {holidays && holidays.length > 0 ? <HolidayList holidays={holidays} /> : null}
      </Card>
    </motion.section>
  );
}

/** The four weights, exactly as the settings hold them. */
function WeightTable({ weights }: { weights: AttendanceWeight[] }) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-outline-variant/40">
      <table className="w-full text-left">
        <caption className="sr-only">What one marked day is worth</caption>
        <thead className="bg-surface-container">
          <tr>
            <th scope="col" className="px-4 py-2 font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">
              Day marked
            </th>
            <th scope="col" className="px-4 py-2 font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">
              Counts as
            </th>
          </tr>
        </thead>
        <tbody>
          {weights.map((weight) => (
            <tr key={weight.status} className="border-t border-outline-variant/30">
              <th scope="row" className="px-4 py-2.5 text-body-sm font-medium text-on-surface">
                {weight.label}
              </th>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="w-11 shrink-0 font-display text-body-md font-bold text-on-surface">
                    {weight.weight}%
                  </span>
                  <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container">
                    <span
                      className={cn("block h-full rounded-full", weightTone[weight.status])}
                      style={{ width: `${weight.weight}%` }}
                    />
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Days the academy is closed ahead — dates and labels both from the server. */
function HolidayList({ holidays }: { holidays: UpcomingHoliday[] }) {
  return (
    <div className="mt-5 rounded-xl bg-surface-container/60 p-4">
      <p className="flex items-center gap-2 font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">
        <CalendarClock className="size-3.5" aria-hidden /> Upcoming holidays
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {holidays.map((holiday) => (
          <li key={holiday.date} className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge variant="secondary">{holiday.name}</Badge>
            <span className="text-body-sm text-on-surface-variant">{holiday.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RulesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="mt-4 space-y-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-9/12" />
          </div>
        </Card>
      ))}
    </div>
  );
}
