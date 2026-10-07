import { z } from 'zod';

/* ============================================================
 * "Preserve offer configuration history" — GET /admin/assets/:assetId/offers/history.
 *
 * 🚧 Provisional, layered onto the real Offer/Size/Plan contract (see
 * asset-detail.schema.ts's PlanSchema doc comment for the same "provisional
 * addition to a real base" status).
 *
 * Unlike Land Account / Costs / Selling Charges, the six real offer/size/plan
 * endpoints have no `reason` field and no `expected_version` guard — they are
 * an already-shipped backend contract (tickets 18/19) this work must not
 * reshape. So this is an ACTIVITY LOG, not a diffable version history like
 * LandConfigurationHistory or SellingChargesHistorySheet: each entry is a
 * server-derived summary of what a mutation did, not an admin-authored
 * reason, and there is no before/after snapshot to diff against.
 * ============================================================ */

export const OFFER_CONFIG_ACTIONS = [
  'add-offer',
  'update-offer',
  'add-size',
  'update-size',
  'delete-size',
  'add-plan',
  'update-plan',
  'delete-plan',
  // Flex 2.0 — a base-plan pricing version went live, or a tenor-list size moved onto one.
  'publish-pricing',
  'convert-pricing',
] as const;
export const OfferConfigActionSchema = z.enum(OFFER_CONFIG_ACTIONS);
export type OfferConfigAction = z.infer<typeof OfferConfigActionSchema>;

export const OFFER_CONFIG_ACTION_LABELS: Record<OfferConfigAction, string> = {
  'add-offer': 'Added offer',
  'update-offer': 'Updated offer',
  'add-size': 'Added size',
  'update-size': 'Updated size',
  'delete-size': 'Deleted size',
  'add-plan': 'Added plan',
  'update-plan': 'Updated plan',
  'delete-plan': 'Deleted plan',
  'publish-pricing': 'Pricing published',
  'convert-pricing': 'Converted to base plan',
};

export const OfferConfigRevisionSchema = z.object({
  version: z.number(),
  action: OfferConfigActionSchema,
  summary: z.string(),
  changed_by: z.string().nullable(),
  changed_at: z.string(),
  /** Pricing actions only (docs/FLEX-2.0-ENDPOINTS.pdf §3.1) — absent on every other action. */
  size_id: z.string().nullable().optional(),
  pricing_version: z.number().int().optional(),
  purchase_count: z.number().int().optional(),
  pending_transfer_count: z.number().int().optional(),
  superseded: z.boolean().optional(),
});

export type OfferConfigRevision = z.infer<typeof OfferConfigRevisionSchema>;
