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
};

export const OfferConfigRevisionSchema = z.object({
  version: z.number(),
  action: OfferConfigActionSchema,
  summary: z.string(),
  changed_by: z.string().nullable(),
  changed_at: z.string(),
});

export type OfferConfigRevision = z.infer<typeof OfferConfigRevisionSchema>;
