import { z } from 'zod';

/* ============================================================
 * Land inventory — blocks and their plots.
 *
 * abode-be-v2's allocation module owns these (`BlockPlotController`), but the
 * screen is a tab on the asset, so the schema lives with the asset feature the
 * way it did before the migration.
 *
 *   GET/POST   /admin/assets/:asset_id/blocks
 *   PATCH/DEL  /admin/blocks/:block_id
 *   GET/POST   /admin/blocks/:block_id/plots   (+ /bulk)
 *   PATCH/DEL  /admin/plots/:plot_id
 *
 * Lists come back as plain arrays — the controller returns the repository
 * result directly, with no `meta`, so these are `apiGet` of an array and not
 * `apiGetPaged`.
 *
 * Two BE guards shape the UI, and neither can be worked around from here:
 * a block with allocated plots cannot be deleted, and an allocated plot cannot
 * be edited or deleted at all. v1 offered a "resize anyway" override; v2 has no
 * such escape hatch, so the affordance is gone rather than left to fail.
 * ============================================================ */

export const PLOT_STATUSES = ['available', 'allocated'] as const;
export const PlotStatusSchema = z.enum(PLOT_STATUSES);
export type PlotStatus = z.infer<typeof PlotStatusSchema>;

export const BlockSchema = z.looseObject({
  _id: z.string(),
  asset: z.string(),
  label: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Block = z.infer<typeof BlockSchema>;

export const PlotSchema = z.looseObject({
  _id: z.string(),
  block: z.string(),
  /** Denormalised on the BE at create time, so a plot renders as "A-12" alone. */
  block_label: z.string(),
  plot_number: z.number(),
  size: z.number(),
  status: PlotStatusSchema,
  payment_plan: z.string().nullable().optional(),
  allocated_date: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Plot = z.infer<typeof PlotSchema>;

export function plotName(plot: Plot): string {
  return `${plot.block_label}-${plot.plot_number}`;
}

export function isAllocated(plot: Plot): boolean {
  return plot.status === 'allocated';
}

/* -------------------- plot ranges -------------------- */

/**
 * The add-plots form still thinks in ranges ("1–20, 500sqm"), because that is
 * how land is actually laid out. v1's BE took the ranges; v2's bulk endpoint
 * takes explicit plots, so the expansion happens here instead.
 */
export type PlotRange = { from: number; to: number; size: number };

/** One row of the bulk DTO — exactly `CreatePlotDto`, no extra fields. */
export type PlotDraft = { plot_number: number; size: number };

/** Guards against a typo turning into tens of thousands of rows. */
export const MAX_PLOTS_PER_BULK = 500;

export type RangeExpansion =
  | { ok: true; plots: PlotDraft[]; totalSqm: number }
  | { ok: false; error: string };

export function expandPlotRanges(
  ranges: readonly PlotRange[],
  existingPlotNumbers: ReadonlySet<number>
): RangeExpansion {
  const plots: PlotDraft[] = [];
  const seen = new Set<number>();
  let totalSqm = 0;

  for (const { from, to, size } of ranges) {
    if (!Number.isInteger(from) || !Number.isInteger(to) || !Number.isInteger(size)) {
      return { ok: false, error: 'Plot numbers and sizes must be whole numbers' };
    }
    if (from < 1 || to < from) {
      return { ok: false, error: `Invalid range ${from}–${to}` };
    }
    if (size < 1) {
      return { ok: false, error: 'Size must be at least 1 sqm' };
    }

    for (let n = from; n <= to; n += 1) {
      if (existingPlotNumbers.has(n)) {
        return { ok: false, error: `Plot ${n} already exists in this block` };
      }
      if (seen.has(n)) {
        return { ok: false, error: `Plot ${n} appears in more than one range` };
      }
      seen.add(n);
      plots.push({ plot_number: n, size });
      totalSqm += size;
    }

    if (plots.length > MAX_PLOTS_PER_BULK) {
      return {
        ok: false,
        error: `That is over ${MAX_PLOTS_PER_BULK} plots in one go — split it into smaller batches`,
      };
    }
  }

  if (plots.length === 0) return { ok: false, error: 'Add at least one range' };
  return { ok: true, plots, totalSqm };
}

export type BlockStats = {
  total: number;
  allocated: number;
  available: number;
  totalSqm: number;
};

export function blockStats(plots: readonly Plot[]): BlockStats {
  const allocated = plots.filter(isAllocated).length;
  return {
    total: plots.length,
    allocated,
    available: plots.length - allocated,
    totalSqm: plots.reduce((sum, plot) => sum + plot.size, 0),
  };
}
