import { z } from 'zod';

/* ============================================================
 * Allocation.
 *
 * All four schemas below are confirmed against abode-be-v2's allocation
 * module on `origin/staging` (2026-08-28) — read directly from
 * `allocation-admin.controller.ts` / `allocation.service.ts` /
 * `schemas/plot.schema.ts`, since that branch isn't deployed to the
 * environment this app talks to yet. Re-check against a live call once it
 * ships.
 *
 * `allocation_status` on a plan is exactly `pending | allocated | email_sent`
 * — "reassigned" is an `AllocationHistory` action, not a status a plan sits
 * in: `reassignPlots` releases the old plots and re-claims new ones, but
 * leaves the plan's own status at `allocated`.
 * ============================================================ */

export const ALLOCATION_STATUSES = ['pending', 'allocated', 'email_sent'] as const;
export const AllocationStatusSchema = z.enum(ALLOCATION_STATUSES);
export type AllocationStatus = z.infer<typeof AllocationStatusSchema>;

/**
 * `GET /admin/allocation/eligible-clients` — one row per eligible payment
 * plan (a client with several plans gets several rows).
 *
 * Note: `payment_percentage` is not bounded to 0–100 — it runs well past
 * 100 in live data (e.g. 3600), so it isn't "% of total price paid". Treat it
 * as an opaque figure from the BE rather than a percentage of anything on
 * this row.
 */
export const AllocationClientSchema = z.object({
  payment_plan_id: z.string(),
  user_id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),

  asset_id: z.string(),
  asset_name: z.string(),
  asset_location: z.string().nullable().optional(),
  asset_type: z.string().nullable().optional(),
  unique_asset_id: z.string().nullable().optional(),

  size: z.number(),
  no_of_units: z.number(),

  amount_paid: z.number(),
  amount_payable: z.number(),
  balance: z.number(),
  payment_percentage: z.number(),

  allocation_status: AllocationStatusSchema,
  allocation_date: z.string().nullable().optional(),
  plan_status: z.string(),
  date_joined: z.string().nullable().optional(),
});

export type AllocationClient = z.infer<typeof AllocationClientSchema>;

/**
 * `GET /admin/allocation/assets/:asset_id/available-plots` — every
 * unallocated plot on an asset, optionally narrowed to one size via
 * `?size=`. The aggregation projects exactly these five fields (plus `_id`)
 * — `payment_plan` / `allocated_date` exist on the Plot schema but are not
 * part of this response.
 */
export const AllocationPlotSchema = z.object({
  _id: z.string(),
  block: z.string(),
  block_label: z.string(),
  plot_number: z.number(),
  size: z.number(),
  status: z.enum(['available', 'allocated']),
});

export type AllocationPlot = z.infer<typeof AllocationPlotSchema>;

/** One plot claimed by (or released from) a plan — the `allocations[]` shape. */
export const AllocationEntrySchema = z.object({
  plot_id: z.string(),
  block_label: z.string(),
  plot_number: z.number(),
  size: z.number(),
});

export type AllocationEntry = z.infer<typeof AllocationEntrySchema>;

/**
 * Response body of `POST .../allocate` and `.../reassign` — both return
 * `mutationResult()` in `allocation.service.ts`.
 *
 * `warnings` is non-empty only for a `developer_plot` asset, where a plot
 * total that doesn't match `plan.size × plan.no_of_units` is accepted rather
 * than rejected (`SIZE_MISMATCH` is a hard 400 for every other asset type).
 */
export const AllocateResultSchema = z.object({
  asset_name: z.string().nullable(),
  user_snapshot: z.object({
    name: z.string(),
    email: z.string().nullable(),
  }),
  allocations: z.array(AllocationEntrySchema),
  warnings: z.array(z.string()),
});

export type AllocateResult = z.infer<typeof AllocateResultSchema>;

/**
 * Response body of `POST .../send-email` — `sendAllocationEmail()` in
 * `allocation.service.ts` returns `{ data: { asset_name, queued }, message }`,
 * a smaller shape than `AllocateResultSchema` (no `user_snapshot`,
 * `allocations`, or `warnings`).
 *
 * ⚠️ Known backend gap (found reading the source, 2026-08-28): this enqueues
 * an email job of `type: 'allocation-document'`, but neither the queue
 * processor (`email.processor.ts`) nor the template renderer
 * (`email.templates.ts`) has a case for that type — the render throws
 * `Unknown email template: allocation-document` inside the queue, silently,
 * after this endpoint has already returned `queued: true` and flipped the
 * plan to `email_sent`. The toast success here does not mean the client
 * actually received anything yet.
 */
export const SendAllocationEmailResultSchema = z.object({
  asset_name: z.string().nullable(),
  queued: z.boolean(),
});

export type SendAllocationEmailResult = z.infer<typeof SendAllocationEmailResultSchema>;

export const ALLOCATION_HISTORY_ACTIONS = [
  'allocated',
  'deallocated',
  'reassigned',
  'email_sent',
  'auto_released',
] as const;
export const AllocationHistoryActionSchema = z.enum(ALLOCATION_HISTORY_ACTIONS);
export type AllocationHistoryAction = z.infer<typeof AllocationHistoryActionSchema>;

/**
 * `GET /admin/allocation/payment-plans/:plan_id/history` — one row per
 * `AllocationHistory` document, newest first. `findHistoryByPlan()` in
 * `allocation.repository.ts` does **not** `.populate()` — `user` and `actor`
 * come back as bare ObjectId strings, same "ticket 13" pattern as the
 * upgrade queue and commission overrides elsewhere in this app. `actor` is
 * absent for an `auto_released` row (the cascade has no admin actor).
 */
export const AllocationHistoryRowSchema = z.object({
  _id: z.string(),
  payment_plan: z.string(),
  user: z.string().nullable().optional(),
  allocations: z.array(AllocationEntrySchema),
  actor: z.string().nullable().optional(),
  action: AllocationHistoryActionSchema,
  reason: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AllocationHistoryRow = z.infer<typeof AllocationHistoryRowSchema>;

/**
 * Option row for the asset filter dropdown — a minimal slice of the real
 * `GET /admin/assets` response (`features/assets/schemas/asset.schema.ts`),
 * duplicated rather than imported: features stay cross-import-free per
 * CLAUDE.md, and this filter only ever needs an id + a label.
 */
export const AllocationAssetOptionSchema = z.object({
  _id: z.string(),
  name: z.string(),
});

export type AllocationAssetOption = z.infer<typeof AllocationAssetOptionSchema>;
