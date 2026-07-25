import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge must know our custom type-scale tokens, otherwise it
 * mistakes `text-body-sm` for a text COLOR and silently drops real color
 * classes like `text-white` that appear earlier in the class list.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "headline-xl",
            "headline-lg",
            "headline-md",
            "body-lg",
            "body-md",
            "body-sm",
            "label-md",
            "label-sm",
          ],
        },
      ],
    },
  },
});

/** Merge conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
