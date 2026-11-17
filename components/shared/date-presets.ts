import { isSameDay, startOfDay, startOfYear, subDays, subWeeks } from "date-fns";

export type DateOption =
  | "all"
  | "today"
  | "yesterday"
  | "7days"
  | "2weeks"
  | "4weeks"
  | "year"
  | "custom";

export type PresetOption = Exclude<DateOption, "all" | "custom">;

/** Every page gets these. The rest are opt-in, per page. */
export const BASE_PRESETS: readonly PresetOption[] = ["7days", "2weeks", "4weeks"];

export interface PresetFlags {
  /** "Today" and "Yesterday" — Sales only (the yesterday's-sales view). */
  showDayOptions?: boolean;
  /** "All year" — Top Associates only. */
  showYearOption?: boolean;
}

export function presetsFor({ showDayOptions = false, showYearOption = false }: PresetFlags = {}): readonly PresetOption[] {
  return [
    ...(showDayOptions ? (["today", "yesterday"] as const) : []),
    ...BASE_PRESETS,
    ...(showYearOption ? (["year"] as const) : []),
  ];
}

/** Inclusive local-day bounds for a preset, relative to `now`. */
export function presetBounds(option: PresetOption, now: Date = new Date()): { from: Date; to: Date } {
  const today = startOfDay(now);
  switch (option) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const yesterday = subDays(today, 1);
      return { from: yesterday, to: yesterday };
    }
    case "7days":
      return { from: subDays(today, 7), to: today };
    case "2weeks":
      return { from: subWeeks(today, 2), to: today };
    case "4weeks":
      return { from: subWeeks(today, 4), to: today };
    case "year":
      return { from: startOfYear(today), to: today };
  }
}

/** Which of `presets` a URL range corresponds to, or "custom" when none match exactly. */
export function matchPreset(
  from: Date,
  to: Date,
  presets: readonly PresetOption[],
  now: Date = new Date()
): DateOption {
  for (const option of presets) {
    const preset = presetBounds(option, now);
    if (isSameDay(from, preset.from) && isSameDay(to, preset.to)) return option;
  }
  return "custom";
}
