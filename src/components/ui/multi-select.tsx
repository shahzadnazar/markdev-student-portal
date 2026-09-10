import { ChevronDown } from "lucide-react";
import { useId } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: ReadonlyArray<MultiSelectOption>;
  /** The ticked values. Empty means no filter, never "match nothing". */
  value: string[];
  onChange: (value: string[]) => void;
  /** Shown on the trigger when nothing is ticked. */
  placeholder?: string;
  /** Names the control for a screen reader. */
  label: string;
  allLabel?: string;
  className?: string;
}

/**
 * What the trigger says and what state Select all is in.
 *
 * Pulled out of the component so it can be tested: the suite runs in node with
 * no DOM, and this is the part with actual decisions in it — the three states
 * of the header checkbox, and the count that tells you how many of how many.
 */
export function multiSelectState(total: number, picked: number, placeholder: string) {
  const every = total > 0 && picked === total;
  const some = picked > 0 && !every;

  return {
    every,
    some,
    /** Radix takes the half-state as a value and renders aria-checked="mixed". */
    allChecked: (some ? "indeterminate" : every) as boolean | "indeterminate",
    summary:
      picked === 0
        ? placeholder
        : every
          ? `All ${total} selected`
          : `${picked} of ${total} selected`,
  };
}

/**
 * A checkbox dropdown: tick several options and see everything matching any.
 *
 * Mirrors the admin panel's x-form.multiselect — a Select all row carrying a
 * real indeterminate state, a count, and the options as checkboxes below — but
 * built on the Radix primitives already in the project rather than ported.
 *
 * The indeterminate state is the part worth naming. Radix's Checkbox takes
 * `checked="indeterminate"` as a first-class value and renders
 * `aria-checked="mixed"` from it, so unlike the Blade side there is no DOM
 * property to write by hand; the work here was giving that state a look.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Any",
  label,
  allLabel = "Select all",
  className,
}: MultiSelectProps) {
  const id = useId();
  const { allChecked, summary } = multiSelectState(options.length, value.length, placeholder);

  const toggle = (option: string, checked: boolean) => {
    onChange(checked ? [...value, option] : value.filter((v) => v !== option));
  };

  return (
    <Popover>
      <PopoverTrigger
        aria-label={label}
        className={cn(
          "flex h-10 items-center justify-between gap-2 rounded-lg border border-outline-variant bg-white px-3 text-body-sm",
          "transition-colors hover:border-outline focus-visible:ring-4 focus-visible:ring-primary/25 focus-visible:outline-none",
          value.length === 0 ? "text-on-surface-variant" : "text-on-surface",
          className,
        )}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className="size-4 shrink-0 text-outline" aria-hidden="true" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-56 p-2">
        {options.length > 0 ? (
          <>
            <label
              htmlFor={`${id}-all`}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-body-sm text-on-surface hover:bg-surface-ice"
            >
              <Checkbox
                id={`${id}-all`}
                // Radix takes the half-state as a value and announces it as
                // aria-checked="mixed" without further help.
                checked={allChecked}
                onCheckedChange={(checked) =>
                  onChange(checked === true ? options.map((o) => o.value) : [])
                }
              />
              <span className="font-medium">{allLabel}</span>
            </label>

            <div className="my-1 border-t border-outline-variant/40" />
          </>
        ) : null}

        {options.map((option) => (
          <label
            key={option.value}
            htmlFor={`${id}-${option.value}`}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-body-sm text-on-surface hover:bg-surface-ice"
          >
            <Checkbox
              id={`${id}-${option.value}`}
              checked={value.includes(option.value)}
              onCheckedChange={(checked) => toggle(option.value, checked === true)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}
