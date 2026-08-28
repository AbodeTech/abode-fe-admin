import { z } from 'zod';

import {
  FoLandPlanDetailSchema,
  FoLandPlanSchema,
} from '@/features/asset-transactions/schemas/fo-plan.schema';

/* ============================================================
 * Commercial plot payment plans — the admin surface that exists on
 * abode-be-v2 staging:
 *
 *   GET  /admin/commercial/purchase/plans
 *   GET  /admin/commercial/purchase/plans/:id
 *
 * Suspend / unsuspend / allocate are the shared acquisition routes the FO
 * land-plan UI already uses — commercial has no separate action paths, and
 * no transaction / document-plan admin family.
 *
 * Response bodies are undocumented (0 of N operations declare a 2xx schema).
 * The shape is the FO land-plan model (`usesFoModel`); extra populated
 * user/asset fields are kept via looseObject.
 * ============================================================ */

export const CommercialPlanSchema = FoLandPlanSchema.extend({
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type CommercialPlan = z.infer<typeof CommercialPlanSchema>;

export const CommercialPlanDetailSchema = FoLandPlanDetailSchema;

const personLike = z.looseObject({
  _id: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
});

const assetLike = z.looseObject({
  _id: z.string().optional(),
  name: z.string().optional(),
  asset_location: z.string().optional(),
});

function personName(value: unknown): { id: string | null; label: string } {
  if (!value) return { id: null, label: '' };
  if (typeof value === 'string') return { id: value, label: '' };
  const parsed = personLike.safeParse(value);
  if (!parsed.success) return { id: null, label: '' };
  const { _id, firstName, lastName, email } = parsed.data;
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  return { id: _id ?? null, label: name || email || '' };
}

function assetName(value: unknown): { id: string | null; label: string } {
  if (!value) return { id: null, label: '' };
  if (typeof value === 'string') return { id: value, label: '' };
  const parsed = assetLike.safeParse(value);
  if (!parsed.success) return { id: null, label: '' };
  const { _id, name, asset_location } = parsed.data;
  const label = [name, asset_location].filter(Boolean).join(' · ');
  return { id: _id ?? null, label: label };
}

export function commercialBuyer(plan: CommercialPlan): { id: string | null; label: string } {
  return personName((plan as { user?: unknown }).user);
}

export function commercialAsset(plan: CommercialPlan): { id: string | null; label: string } {
  return assetName((plan as { asset?: unknown }).asset);
}
