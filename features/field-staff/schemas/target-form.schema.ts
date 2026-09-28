import { z } from 'zod';

import {
  FieldMetricKeySchema,
  type FieldMetricDefinition,
  type FieldScorecard,
  type ScorecardTargetInput,
} from './scorecard.schema';

/* ============================================================
 * The targets form. One row per metric the role can be given (from the
 * metrics endpoint); a row that isn't `included` is left off the scorecard.
 *
 * Numbers are held as strings so an emptied input stays empty instead of
 * snapping to 0. Row rules apply to every save; "weights total exactly 100"
 * applies only when publishing, so a draft can be saved half-done.
 * Mirrors ScorecardTargetDto: target and weight above 0, two decimals max.
 * ============================================================ */

const numeric = (value: string) => (value.trim() === '' ? NaN : Number(value));
const twoDecimals = (n: number) => Math.abs(Math.round(n * 100) - n * 100) < 1e-9;

export const TargetRowSchema = z
  .object({
    metric_key: FieldMetricKeySchema,
    included: z.boolean(),
    target: z.string(),
    weight: z.string(),
    note: z.string().max(300, 'Keep the note under 300 characters'),
  })
  .superRefine((row, ctx) => {
    if (!row.included) return;

    const target = numeric(row.target);
    if (!(target > 0) || !twoDecimals(target)) {
      ctx.addIssue({ code: 'custom', path: ['target'], message: 'Enter a target above 0' });
    }
    const weight = numeric(row.weight);
    if (!(weight > 0) || weight > 100 || !twoDecimals(weight)) {
      ctx.addIssue({ code: 'custom', path: ['weight'], message: 'Above 0, up to 100' });
    }
  });

export type TargetRowValues = z.infer<typeof TargetRowSchema>;

export const makeTargetFormSchema = (requireReason: boolean) =>
  z
    .object({
      rows: z.array(TargetRowSchema),
      reason: z.string().max(300, 'Keep the reason under 300 characters'),
    })
    .superRefine((values, ctx) => {
      if (requireReason && !values.reason.trim()) {
        ctx.addIssue({ code: 'custom', path: ['reason'], message: 'Say why the targets are changing' });
      }
    });

export type TargetFormValues = z.infer<ReturnType<typeof makeTargetFormSchema>>;

/** Every metric the role can have, prefilled from an existing scorecard where it has a row. */
export function targetFormDefaults(
  metrics: FieldMetricDefinition[],
  scorecard?: FieldScorecard | null
): TargetFormValues {
  return {
    reason: '',
    rows: metrics.map((metric) => {
      const existing = scorecard?.targets.find((t) => t.metric_key === metric.key);
      return {
        metric_key: metric.key,
        // A new scorecard starts with every metric in; the admin removes what doesn't apply.
        included: scorecard ? !!existing : true,
        target: existing ? String(existing.target) : '',
        weight: existing ? String(existing.weight) : metrics.length === 1 ? '100' : '',
        note: existing?.note ?? '',
      };
    }),
  };
}

/** Included rows only, exactly as ScorecardTargetDto takes them. */
export function toTargetInputs(rows: TargetRowValues[]): ScorecardTargetInput[] {
  return rows
    .filter((row) => row.included)
    .map((row) => ({
      metric_key: row.metric_key,
      target: Number(row.target),
      weight: Number(row.weight),
      ...(row.note.trim() && { note: row.note.trim() }),
    }));
}

/** Sum of included weights, ignoring blanks — drives the live "weights total" line. */
export function includedWeightTotal(rows: Pick<TargetRowValues, 'included' | 'weight'>[]): number {
  const total = rows.reduce((sum, row) => {
    const weight = numeric(row.weight);
    return row.included && Number.isFinite(weight) ? sum + weight : sum;
  }, 0);
  return Math.round(total * 100) / 100;
}
