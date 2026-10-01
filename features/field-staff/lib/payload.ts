import type { FieldSubmission } from '../schemas/submission.schema';
import { formatNaira, formatQuantity } from './format';

/* ============================================================
 * Reading a submission's `payload`, which differs per metric
 * (abode-be-v2 `submission-payloads.ts`). The server validated it when the
 * worker submitted, but it arrives as an open record — every read here is
 * defensive so an unexpected shape shows "—" rather than crashing.
 * ============================================================ */

type Payload = FieldSubmission['payload'];

const str = (p: Payload, key: string): string | null => {
  const v = p[key];
  return typeof v === 'string' && v.trim() ? v : null;
};
const num = (p: Payload, key: string): number | null => {
  const v = p[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};

const SIDE_LABELS: Record<string, string> = { front: 'Front', right: 'Right', back: 'Back', left: 'Left' };

export type ProposedSides = Partial<Record<'front' | 'right' | 'back' | 'left', number>>;

/** Boundary work only: the new sides the Surveyor measured, if any. */
export function proposedSides(sub: FieldSubmission): ProposedSides | null {
  if (sub.metric_key !== 'boundary_metres') return null;
  const raw = sub.payload.proposed_sides;
  if (!raw || typeof raw !== 'object') return null;
  const sides: ProposedSides = {};
  for (const side of ['front', 'right', 'back', 'left'] as const) {
    const v = (raw as Record<string, unknown>)[side];
    if (typeof v === 'number') sides[side] = v;
  }
  return Object.keys(sides).length ? sides : null;
}

export function sidesText(sides: ProposedSides): string {
  return (['front', 'right', 'back', 'left'] as const)
    .filter((side) => sides[side] !== undefined)
    .map((side) => `${SIDE_LABELS[side]} ${sides[side]} m`)
    .join(' · ');
}

export type Fact = { label: string; value: string };

/** The measured facts for a submission, in the order a reviewer checks them. `plotLabels` come from the detail call. */
export function submissionFacts(sub: FieldSubmission, plotLabels: string[]): Fact[] {
  const p = sub.payload;
  const facts: Fact[] = [];
  const plots = plotLabels.length
    ? plotLabels.length <= 6
      ? plotLabels.join(', ')
      : `${plotLabels.slice(0, 6).join(', ')} +${plotLabels.length - 6} more`
    : null;

  switch (sub.metric_key) {
    case 'fencing_new_metres': {
      const side = str(p, 'side');
      const metres = num(p, 'metres');
      facts.push(
        { label: 'Boundary side', value: side ? (SIDE_LABELS[side] ?? side) : '—' },
        { label: 'Metres', value: metres !== null ? formatQuantity(metres, 'metres') : '—' },
        { label: 'Type of work', value: str(p, 'work_type') === 'repair' ? 'Repair' : 'New fencing' }
      );
      const from = str(p, 'start_reference');
      const to = str(p, 'end_reference');
      if (from || to) facts.push({ label: 'From → to', value: `${from ?? '—'} → ${to ?? '—'}` });
      break;
    }
    case 'parcelation_plots':
      facts.push({ label: 'Plots', value: plots ?? `${sub.plot_ids.length} plots` });
      if (p.is_rework === true) facts.push({ label: 'Rework reason', value: str(p, 'rework_reason') ?? '—' });
      break;
    case 'clearing_sqm': {
      const sqm = num(p, 'actual_sqm');
      facts.push(
        { label: 'Cleared', value: sqm !== null ? formatQuantity(sqm, 'sqm') : '—' },
        { label: 'Coverage', value: str(p, 'coverage') === 'partial' ? 'Partly cleared' : 'Fully cleared' }
      );
      if (str(p, 'mapping') === 'unmapped') {
        facts.push(
          { label: 'Area', value: str(p, 'description') ?? '—' },
          { label: 'Markers', value: str(p, 'markers') ?? '—' },
          { label: 'Plots', value: plots ?? 'Not linked yet' }
        );
      } else {
        facts.push({ label: 'Plots', value: plots ?? `${sub.plot_ids.length} plots` });
      }
      break;
    }
    case 'boundary_metres': {
      const metres = num(p, 'metres');
      facts.push(
        { label: 'Established', value: metres !== null ? formatQuantity(metres, 'metres') : '—' },
        { label: 'References', value: str(p, 'references') ?? '—' }
      );
      const proposed = proposedSides(sub);
      if (proposed) facts.push({ label: 'Proposed boundary', value: sidesText(proposed) });
      break;
    }
    case 'allocation_customers':
      break;
  }

  facts.push({ label: 'Amount spent', value: sub.amount_spent !== null ? formatNaira(sub.amount_spent) : 'None reported' });
  if (sub.amount_spent !== null) {
    facts.push(
      { label: 'Vendor', value: sub.vendor ?? '—' },
      { label: 'Payment reference', value: sub.payment_reference ?? '—' }
    );
  }
  return facts;
}

/**
 * How much work was done, as a figure and unit. The BE's `quantity` is what
 * *scores* — 0 for repairs and rework — so for those read the real amount
 * from the work details instead.
 */
export function workAmount(sub: FieldSubmission): { value: number; unit: string | null } {
  if (sub.counts_towards_target) return { value: sub.quantity, unit: sub.unit };
  switch (sub.metric_key) {
    case 'fencing_new_metres':
      return { value: num(sub.payload, 'metres') ?? 0, unit: 'metres' };
    case 'parcelation_plots':
      return { value: sub.plot_ids.length, unit: 'plots' };
    default:
      return { value: sub.quantity, unit: sub.unit };
  }
}

/** Notes the worker wrote: on the work itself, and on the submission. */
export function workNotes(sub: FieldSubmission): string[] {
  return [str(sub.payload, 'note'), sub.note].filter((n): n is string => !!n);
}
