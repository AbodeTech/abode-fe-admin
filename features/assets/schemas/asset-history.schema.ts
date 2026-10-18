import { z } from 'zod';

import type { AssetAllocationEvent } from './allocation-event.schema';
import type { CostHistoryEntry } from './cost-ledger.schema';
import type { LandConfigurationHistoryEntry } from './land-configuration.schema';
import type { BoundaryVersion } from './site-setup.schema';

/* ============================================================
 * Asset history — the design's Updates tab: "material land, price, cost and
 * physical-readiness changes" in one timeline.
 *
 * The backend has no such feed. It keeps history per area, each behind its
 * own endpoint, so this file turns each area's rows into one common entry
 * shape and merges them by date:
 *
 *   land      GET .../land-configuration/history   land account versions
 *   boundary  GET .../boundary                     approved boundary versions
 *   field     GET .../field-history                verified field work
 *   cost      the cost records' entries            (see cost-ledger.schema.ts)
 *   event     GET /admin/company-events            allocation events already held
 *
 * Nothing here is inferred: every entry is one row from one of those reads,
 * reworded. What the design shows that no endpoint returns — a purchase
 * closed and its land released, plans added to an allocation event, offer and
 * plan edits — is simply absent.
 * ============================================================ */

/* -------------------- verified field work -------------------- */

export const FIELD_METRIC_KEYS = [
  'fencing_new_metres',
  'allocation_customers',
  'parcelation_plots',
  'clearing_sqm',
  'boundary_metres',
] as const;

/** The backend's own labels (`FIELD_METRICS` in field-staff/scorecards/field-metrics.ts). */
export const FIELD_METRIC_LABELS: Record<(typeof FIELD_METRIC_KEYS)[number], string> = {
  fencing_new_metres: 'New fencing',
  allocation_customers: 'Customers allocated on the ground',
  parcelation_plots: 'Plots parcelled',
  clearing_sqm: 'Land cleared',
  boundary_metres: 'Boundary established',
};

/**
 * One row of GET /admin/assets/:assetId/field-history — field work that has
 * been verified (or later corrected or reversed), newest first. Transcribed
 * from `SiteSetupService.fieldHistory()`. `summary` is the submission's own
 * free-form payload and is not read here.
 */
export const FieldHistoryRowSchema = z.object({
  submission_id: z.string(),
  metric_key: z.enum(FIELD_METRIC_KEYS),
  summary: z.unknown(),
  quantity: z.number().nullable(),
  unit: z.string().nullable(),
  status: z.string(),
  work_date: z.string().nullable(),
  amount_spent: z.number().nullable(),
  field_staff: z.object({ id: z.string(), full_name: z.string().nullable() }).nullable(),
});
export type FieldHistoryRow = z.infer<typeof FieldHistoryRowSchema>;

/* -------------------- the common entry -------------------- */

export const ASSET_HISTORY_KINDS = ['land', 'boundary', 'field', 'cost', 'event'] as const;
export type AssetHistoryKind = (typeof ASSET_HISTORY_KINDS)[number];

export const ASSET_HISTORY_KIND_LABELS: Record<AssetHistoryKind, string> = {
  land: 'Land account',
  boundary: 'Boundary',
  field: 'Field work',
  cost: 'Cost',
  event: 'Allocation event',
};

export type AssetHistoryEntry = {
  /** Unique across kinds, for React keys. */
  id: string;
  kind: AssetHistoryKind;
  /** When it happened. `null` sorts last. */
  at: string | null;
  title: string;
  /** The pieces of the smaller second line; empty ones are dropped. */
  detail: string[];
};

const sqm = (value: number | null | undefined) => (value == null ? null : `${value.toLocaleString()} sqm`);
const naira = (value: number) => `₦${value.toLocaleString()}`;
const present = (parts: (string | null | undefined | false)[]) => parts.filter((part): part is string => Boolean(part));

export function landHistoryEntries(rows: LandConfigurationHistoryEntry[]): AssetHistoryEntry[] {
  return rows.map((row) => ({
    id: `land-${row.version}`,
    kind: 'land',
    at: row.changed_at,
    title: `Land account changed to version ${row.version}`,
    detail: present([
      row.reason,
      sqm(row.summary.total_land_sqm) && `${sqm(row.summary.total_land_sqm)} total`,
      row.summary.unclassified_sqm > 0 && `${sqm(row.summary.unclassified_sqm)} unclassified`,
      row.changed_by_email ?? null,
    ]),
  }));
}

const BOUNDARY_SOURCE_WORDS: Record<string, string> = {
  admin: 'entered by an admin',
  surveyor_submission: 'from a surveyor submission',
};

export function boundaryHistoryEntries(rows: BoundaryVersion[]): AssetHistoryEntry[] {
  return rows.map((row) => ({
    id: `boundary-${row.version}`,
    kind: 'boundary',
    at: row.approved_at,
    title: `Boundary version ${row.version} approved`,
    detail: present([
      `${row.perimeter_metres.toLocaleString()} m perimeter`,
      BOUNDARY_SOURCE_WORDS[row.source] ?? row.source,
      row.note,
    ]),
  }));
}

export function fieldHistoryEntries(rows: FieldHistoryRow[]): AssetHistoryEntry[] {
  return rows.map((row) => {
    const amount = row.quantity == null ? null : `${row.quantity.toLocaleString()}${row.unit ? ` ${row.unit}` : ''}`;
    const label = FIELD_METRIC_LABELS[row.metric_key];
    return {
      id: `field-${row.submission_id}`,
      kind: 'field',
      at: row.work_date,
      title: amount ? `${label}: ${amount}` : label,
      detail: present([
        // "verified" is the normal state; only the exceptions are worth saying.
        row.status === 'verified' ? 'Verified field work' : `Field work, ${row.status}`,
        row.field_staff?.full_name,
        row.amount_spent != null && `${naira(row.amount_spent)} spent`,
      ]),
    };
  });
}

const COST_STATUS_WORDS: Record<string, string> = {
  draft: 'awaiting approval',
  approved: 'approved',
  reversed: 'reversed',
  archived: 'archived',
};

export function costHistoryEntries(rows: CostHistoryEntry[]): AssetHistoryEntry[] {
  return rows.map(({ event, recordTitle, itemName, at }) => ({
    id: `cost-${event.id}`,
    kind: 'cost',
    at,
    title: `${event.amount == null ? 'Amount not set' : naira(event.amount)} ${event.stage_label.toLowerCase()}`,
    detail: present([
      recordTitle,
      itemName,
      COST_STATUS_WORDS[event.status] ?? event.status,
      event.reversal_reason ?? event.note,
    ]),
  }));
}

/** Allocation events that have already taken place. A future event is a plan, not history. */
export function eventHistoryEntries(rows: AssetAllocationEvent[], now: number = Date.now()): AssetHistoryEntry[] {
  return rows
    .filter((row) => new Date(row.starts_at).getTime() <= now)
    .map((row) => ({
      id: `event-${row.id}`,
      kind: 'event',
      at: row.starts_at,
      title: `Allocation event held: ${row.title}`,
      detail: present([
        `${row.reserved_size.toLocaleString()} ${row.size_unit ?? 'sqm'} reserved`,
        row.status === 'closed' ? 'closed' : null,
      ]),
    }));
}

/** One timeline, newest first; entries with no date go to the end. */
export function mergeAssetHistory(...groups: AssetHistoryEntry[][]): AssetHistoryEntry[] {
  const time = (entry: AssetHistoryEntry) => (entry.at ? new Date(entry.at).getTime() : Number.NEGATIVE_INFINITY);
  return groups.flat().sort((a, b) => time(b) - time(a));
}
