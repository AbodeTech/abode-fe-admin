/**
 * Helpers for building StatCard.breakdown arrays from the BE attribution shape.
 * The BE contract lives in guidelines/Manager_Dashboard_Attribution_Breakdowns.md.
 *
 * Two flavours:
 *   - Source split (managed / unassigned / users / associate) — combined + system views
 *   - Per-pro contributors + "others" remainder — single-manager views
 */

import type { BreakdownSegment } from "../components/StatCard";

/* ────────────────────────────────────────────────────────────────
 * Source palette
 * The colours read as "our team's contribution" (teal) → "opportunity"
 * (amber) → two quiet neutrals (slate + purple). Semantic colours stay
 * reserved for target-progress states, so no red/green here.
 * ──────────────────────────────────────────────────────────────── */

export const SOURCE_COLORS = {
  managed: "bg-[#00695C]",
  unassigned: "bg-amber-500",
  users: "bg-slate-500",
  associate: "bg-purple-500",
} as const;

export const SOURCE_LABELS = {
  managed: "managed",
  unassigned: "unassigned",
  users: "users",
  associate: "associates",
} as const;

/** BE-shape mirror. */
export interface SourceBreakdownShape {
  managed: number;
  unassigned: number;
  users: number;
  associate: number;
}

/** Build a stacked-bar breakdown from a BE source-attribution object.
 * `formatValue` maps a raw value to the display string for the legend
 * (e.g. `n.toLocaleString()` for counts, or a currency formatter). */
export const sourceBreakdown = (
  data: SourceBreakdownShape | null | undefined,
  opts?: {
    formatValue?: (n: number) => string;
    onClick?: (key: keyof SourceBreakdownShape) => void;
  }
): BreakdownSegment[] => {
  if (!data) return [];
  const fmt = opts?.formatValue ?? ((n: number) => n.toLocaleString());
  return (Object.keys(SOURCE_COLORS) as Array<keyof SourceBreakdownShape>).map(
    (key) => ({
      label: SOURCE_LABELS[key],
      value: data[key] ?? 0,
      color: SOURCE_COLORS[key],
      display: fmt(data[key] ?? 0),
      onClick: opts?.onClick ? () => opts.onClick!(key) : undefined,
    })
  );
};

/* ────────────────────────────────────────────────────────────────
 * Contributor palette
 * Fixed rotation so segments read consistently across cards; the
 * legend attaches names so colour identity is secondary. Top pro gets
 * the accent — the rest are visual filler in a defined order.
 * ──────────────────────────────────────────────────────────────── */

const CONTRIBUTOR_COLORS = [
  "bg-[#00695C]",
  "bg-blue-500",
  "bg-orange-500",
  "bg-purple-500",
  "bg-slate-500",
  "bg-pink-500",
];
const OTHERS_COLOR = "bg-gray-300";

/** BE-shape mirror for a contributor. Same shape for count + float variants. */
export interface ContributorShape {
  proId: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  count?: number | null;
  amount?: number | null;
}

const contributorName = (c: ContributorShape) => {
  const full = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
  if (full) return full;
  if (c.email) return c.email.split("@")[0];
  return "Unnamed pro";
};

/** Build a contributor breakdown from a top-N list + "others" remainder.
 * `getValue` picks the count-or-amount field from each contributor. */
export const contributorBreakdown = (
  top: ContributorShape[] | null | undefined,
  othersValue: number | null | undefined,
  opts?: {
    getValue?: (c: ContributorShape) => number;
    formatValue?: (n: number) => string;
    onClick?: (contributor: ContributorShape) => void;
  }
): BreakdownSegment[] => {
  const list = top ?? [];
  const others = othersValue ?? 0;
  const getValue = opts?.getValue ?? ((c: ContributorShape) => c.count ?? 0);
  const fmt = opts?.formatValue ?? ((n: number) => n.toLocaleString());

  const segments: BreakdownSegment[] = list.map((c, i) => {
    const raw = getValue(c);
    return {
      label: contributorName(c),
      value: raw,
      color: CONTRIBUTOR_COLORS[i % CONTRIBUTOR_COLORS.length],
      display: fmt(raw),
      onClick: opts?.onClick ? () => opts.onClick!(c) : undefined,
    };
  });

  if (others > 0) {
    segments.push({
      label: "others",
      value: others,
      color: OTHERS_COLOR,
      display: fmt(others),
    });
  }
  return segments;
};

/* ────────────────────────────────────────────────────────────────
 * View-mode helper
 * The BE population matrix means: single-manager views read the
 * per-pro contributors; combined + system views read the source split.
 * This picks the right one so consumers stay lean.
 * ──────────────────────────────────────────────────────────────── */

export type AttributionMode = "single" | "combined" | "system";

/** True when this view should render per-pro contributor breakdowns; false
 * when it should render source (managed/unassigned/users/associate) splits. */
export const isPerProAttribution = (mode: AttributionMode) => mode === "single";

/* ────────────────────────────────────────────────────────────────
 * Short currency format for revenue-card legends.
 * ₦246.5M rather than ₦246,514,232 so the legend fits under the bar.
 * ──────────────────────────────────────────────────────────────── */

export const formatCurrencyShort = (n: number): string => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
};
