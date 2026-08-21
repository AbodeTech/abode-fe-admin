import { z } from 'zod';

/* ============================================================
 * GET /admin/dashboard/top-products?limit=
 * GET /admin/dashboard/top-associates?limit=
 *
 * Lifetime rankings — never date-filtered (AD-5 / controller docs).
 * Default limit 5, max 20.
 * ============================================================ */

export const DEFAULT_TOP_LIST_LIMIT = 5;
/** BE max for top-associates / top-products. */
export const MAX_TOP_LIST_LIMIT = 20;

export const TopProductSchema = z.looseObject({
  asset_id: z.string(),
  name: z.string(),
  asset_location: z.string().nullable().optional(),
  asset_type: z.string().nullable().optional(),
  plans_sold: z.number(),
  total_collected: z.number(),
});
export type TopProduct = z.infer<typeof TopProductSchema>;

export const TopProductsSchema = z.array(TopProductSchema);

export const TopAssociateSchema = z.looseObject({
  user_id: z.string(),
  name: z.string(),
  email: z.string().nullable().optional(),
  referral_status: z.string().nullable().optional(),
  total_commission: z.number(),
  commission_transactions: z.number(),
});
export type TopAssociate = z.infer<typeof TopAssociateSchema>;

export const TopAssociatesSchema = z.array(TopAssociateSchema);
