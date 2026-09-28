import type { AssetPlot, FieldCosts, SiteSetup, StaffMonth } from '../schemas/performance.schema';
import type { FieldSubmission } from '../schemas/submission.schema';

/* ============================================================
 * Before → after for one submission: what verifying it does (or did) to the
 * worker's score and the estate's field costs.
 *
 * The BE doesn't preview this, so it's worked out here with the BE's own rule
 * (field-performance.service.ts / scoreFor):
 *   earned = min(verified ÷ target, 1) × weight
 *   site score = Σ earned on that scorecard
 *   overall = mean of the person's scorecard scores
 * For work still waiting, "after" adds it. For verified work the BE figures
 * already include it, so "before" takes it back out.
 * ============================================================ */

const round2 = (n: number) => Math.round(n * 100) / 100;
const earned = (verified: number, target: number, weight: number) =>
  target > 0 ? round2(Math.min(verified / target, 1) * weight) : 0;

export type ScoreImpact =
  | { kind: 'none'; reason: string }
  | {
      kind: 'change';
      metricLabel: string;
      unit: string | null;
      target: number;
      weight: number;
      verified: [number, number];
      points: [number, number];
      siteScore: [number, number];
      /** Only when the person has more than one scored site this month. */
      overall: [number, number] | null;
      /** True when "after" passes the target — the extra doesn't add points. */
      capped: boolean;
    };

export function scoreImpact(sub: FieldSubmission, month: StaffMonth | undefined): ScoreImpact | null {
  if (!month) return null;
  if (!sub.counts_towards_target) {
    return {
      kind: 'none',
      reason:
        sub.metric_key === 'fencing_new_metres'
          ? "A repair — it's recorded but doesn't count towards the target."
          : "Rework — it's recorded but doesn't count towards the target.",
    };
  }

  const assetId = sub.asset?.id;
  const card = month.scorecards.find((c) => c.asset.id === assetId);
  if (!card) {
    return { kind: 'none', reason: `No published targets on this site for ${month.month_label}, so no score changes.` };
  }
  const metric = card.metrics.find((m) => m.metric_key === sub.metric_key);
  if (!metric) {
    return { kind: 'none', reason: `${sub.metric_label} isn't one of their targets on this site this month.` };
  }

  const applied = sub.status === 'verified';
  const before = applied ? round2(metric.verified - sub.quantity) : metric.verified;
  const after = applied ? metric.verified : round2(metric.verified + sub.quantity);

  const pointsBefore = earned(before, metric.target, metric.weight);
  const pointsAfter = earned(after, metric.target, metric.weight);
  const siteWithout = card.score - metric.earned_score;
  const siteBefore = round2(siteWithout + pointsBefore);
  const siteAfter = round2(siteWithout + pointsAfter);

  let overall: [number, number] | null = null;
  if (month.scorecards.length > 1) {
    const others = month.scorecards.filter((c) => c !== card).reduce((sum, c) => sum + c.score, 0);
    const n = month.scorecards.length;
    overall = [round2((others + siteBefore) / n), round2((others + siteAfter) / n)];
  }

  return {
    kind: 'change',
    metricLabel: metric.label,
    unit: sub.unit,
    target: metric.target,
    weight: metric.weight,
    verified: [before, after],
    points: [pointsBefore, pointsAfter],
    siteScore: [siteBefore, siteAfter],
    overall,
    capped: after > metric.target,
  };
}

/* -------------------- Site Setup and plots -------------------- */

export type ImpactRow = { label: string; before: string; after: string; note?: string };

const SIDE_LABELS: Record<string, string> = { front: 'Front', right: 'Right', back: 'Back', left: 'Left' };
const num = (p: FieldSubmission['payload'], key: string) => (typeof p[key] === 'number' ? (p[key] as number) : 0);
const fmt = (n: number) => round2(n).toLocaleString('en-NG');
const sidesText = (sides: Record<string, number>) =>
  ['front', 'right', 'back', 'left']
    .filter((s) => typeof sides[s] === 'number')
    .map((s) => `${SIDE_LABELS[s][0]} ${fmt(sides[s])}`)
    .join(' · ') + ' m';

/**
 * The estate's Site Setup figures this work moves, from the site-setup read.
 * Mirrors what verification writes (site-setup.service.ts): new fencing adds to
 * the side's fenced metres, repairs to its repaired metres; boundary work to
 * "established"; parcelation to plots parcelled (rework to re-pegged);
 * clearing to cleared sqm.
 */
export function siteSetupImpact(sub: FieldSubmission, setup: SiteSetup | undefined): ImpactRow[] {
  if (!setup) return [];
  const applied = sub.status === 'verified';
  const shift = (now: number, by: number): [number, number] => (applied ? [now - by, now] : [now, now + by]);
  const p = sub.payload;

  switch (sub.metric_key) {
    case 'fencing_new_metres': {
      const sideKey = String(p.side ?? '');
      const side = setup.fencing.sides.find((s) => s.side === sideKey);
      if (!side) return [];
      const metres = num(p, 'metres');
      const label = SIDE_LABELS[sideKey] ?? sideKey;
      if (p.work_type === 'repair') {
        const [before, after] = shift(side.repaired_metres, metres);
        return [
          { label: `${label} side repaired`, before: `${fmt(before)} m`, after: `${fmt(after)} m`, note: "Repairs don't add to the fenced length." },
        ];
      }
      const [before, after] = shift(side.fenced_metres, metres);
      const approved = side.approved_metres;
      const of = (x: number) => (approved !== null ? `${fmt(x)} of ${fmt(approved)} m` : `${fmt(x)} m`);
      return [
        {
          label: `${label} side fenced`,
          before: of(before),
          after: of(after),
          note:
            approved === null
              ? 'No approved boundary yet, so there is no side length to measure against.'
              : after > approved
                ? `Passes the approved length by ${fmt(after - approved)} m.`
                : undefined,
        },
      ];
    }
    case 'boundary_metres': {
      const [before, after] = shift(setup.boundary_established_metres, num(p, 'metres'));
      const rows: ImpactRow[] = [{ label: 'Boundary established', before: `${fmt(before)} m`, after: `${fmt(after)} m` }];
      const proposed = p.proposed_sides as Record<string, number> | null | undefined;
      if (!applied && proposed && Object.keys(proposed).length) {
        const current = setup.boundary?.sides;
        rows.push({
          label: 'Approved boundary',
          before: current ? sidesText(current) : 'not set',
          after: sidesText({ ...(current ?? {}), ...proposed }),
          note: 'Only if you tick "Also accept the proposed boundary" below.',
        });
      }
      return rows;
    }
    case 'parcelation_plots': {
      const count = sub.plot_ids.length;
      if (p.is_rework === true) {
        const [before, after] = shift(setup.parcelation.plots_re_pegged, count);
        return [{ label: 'Plots re-pegged on the estate', before: fmt(before), after: fmt(after) }];
      }
      const [before, after] = shift(setup.parcelation.plots_parcelled, count);
      return [{ label: 'Plots parcelled on the estate', before: fmt(before), after: fmt(after) }];
    }
    case 'clearing_sqm': {
      const [before, after] = shift(setup.clearing.cleared_sqm, num(p, 'actual_sqm'));
      return [{ label: 'Land cleared on the estate', before: `${fmt(before)} sqm`, after: `${fmt(after)} sqm` }];
    }
    default:
      return [];
  }
}

/**
 * Per-plot history rows for parcelation and mapped clearing, while the work
 * is still waiting. `selected` names the plots (from the submission detail);
 * `state` is their current record from the plot inventory.
 */
export function plotImpact(
  sub: FieldSubmission,
  selected: { id: string; label: string; size_sqm: number | null }[],
  state: AssetPlot[]
): ImpactRow[] {
  if (sub.status !== 'submitted' || !selected.length) return [];
  const byId = new Map(state.map((plot) => [plot.id, plot]));
  const p = sub.payload;

  if (sub.metric_key === 'parcelation_plots') {
    const rework = p.is_rework === true;
    return selected.map((s) => {
      const plot = byId.get(s.id);
      if (!plot) return { label: s.label, before: 'not loaded', after: rework ? 're-pegged' : 'parcelled' };
      const before = plot.parcelled
        ? plot.re_pegged_count
          ? `parcelled, re-pegged ${plot.re_pegged_count}×`
          : 'parcelled'
        : 'not parcelled';
      return {
        label: s.label,
        before,
        after: rework ? `re-pegged ${plot.re_pegged_count + 1}×` : 'parcelled',
        note: plot.parcelled && !rework ? 'Already parcelled — this may be a repeat.' : undefined,
      };
    });
  }

  if (sub.metric_key === 'clearing_sqm' && p.mapping === 'mapped') {
    const full = p.coverage !== 'partial';
    return selected.map((s) => {
      const plot = byId.get(s.id);
      const size = plot?.size_sqm ?? s.size_sqm;
      if (!plot) return { label: s.label, before: 'not loaded', after: full ? 'fully cleared' : 'partly cleared' };
      const already = size !== null && plot.cleared_sqm >= size;
      return {
        label: s.label,
        before: size !== null ? `${fmt(plot.cleared_sqm)} of ${fmt(size)} sqm cleared` : `${fmt(plot.cleared_sqm)} sqm cleared`,
        after: full ? 'fully cleared' : 'partly cleared',
        note: already ? 'Already fully cleared — this may be a repeat.' : undefined,
      };
    });
  }
  return [];
}

/** The block of a plot label ("B-12" → "B"), for fetching its plots. */
export const blockOf = (label: string) => label.split('-')[0];

export type CostImpact = { before: number; after: number; amount: number } | null;

export function costImpact(sub: FieldSubmission, costs: FieldCosts | undefined): CostImpact {
  if (!costs || sub.amount_spent === null || sub.amount_spent <= 0) return null;
  const applied = sub.status === 'verified';
  const counted = costs.entries.filter((e) => e.submission_id === sub.id).reduce((sum, e) => sum + e.amount, 0);
  return applied
    ? { before: round2(costs.total_amount - counted), after: costs.total_amount, amount: counted || sub.amount_spent }
    : { before: costs.total_amount, after: round2(costs.total_amount + sub.amount_spent), amount: sub.amount_spent };
}
