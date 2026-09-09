import { z } from 'zod';

import { AdminReasonSchema, MessageAckSchema } from './user-actions.schema';

export const ADMIN_CREATE_SUBTYPES = [
  'gift',
  'migration',
  'compensation',
  'developer_plot',
  'commercial_new',
  'other',
] as const;

const optionalPlanContext = {
  notify_user: z.boolean().optional(),
  start_date: z.string().optional(),
  plan_completed_at: z.string().optional(),
  source_of_funds: z.string().optional(),
  source_of_funds_other: z.string().optional(),
  desired_landuse: z.string().optional(),
  desired_landuse_other: z.string().optional(),
  mode_of_communication: z.string().optional(),
  how_you_hear_about_us: z.string().optional(),
  campaign_ids: z.array(z.string()).min(1).optional(),
  campaign_purchase_date: z.string().optional(),
  allocation_qualification_pct: z.number().int().min(1).max(100).optional(),
};

const AdminCreatePlanBaseSchema = z.object({
  admin_creation_subtype: z.enum(ADMIN_CREATE_SUBTYPES),
  fire_commission: z.boolean().optional(),
  queue_signature_reminder: z.boolean().optional(),
  create_purchase_transaction: z.boolean().optional(),
  reason: z.string().trim().min(30).max(2000),
  name_on_document: z.string().trim().min(2).max(200),
  address: z.string().trim().min(5).max(500),
  ...optionalPlanContext,
});

export const AdminCreateFlexPlanPayloadSchema = AdminCreatePlanBaseSchema.extend({
  asset_id: z.string().min(1),
  size_sqm: z.number().int().positive(),
  number_of_units: z.number().int().positive(),
  tenor_months: z.number().int().positive(),
  asset_price: z.number().nonnegative(),
  monthly_payment: z.number().positive(),
  initial_payment: z.number().nonnegative(),
  amount_paid: z.number().nonnegative(),
});

const AdminCreateLandPlanPayloadSchema = AdminCreatePlanBaseSchema.extend({
  asset_id: z.string().min(1),
  size_sqm: z.number().int().positive(),
  number_of_units: z.number().int().positive(),
  land_price: z.number().nonnegative(),
  land_initial_payment: z.number().nonnegative(),
  land_monthly_payment: z.number().nonnegative(),
  land_tenor_months: z.number().int().nonnegative(),
  land_amount_paid: z.number().nonnegative(),
  document_price: z.number().nonnegative(),
  document_amount_paid: z.number().nonnegative(),
  document_monthly_payment: z.number().nonnegative(),
  document_tenor_months: z.number().int().nonnegative(),
  document_start_date: z.string().optional(),
  document_completed_at: z.string().optional(),
});

export const AdminCreateOwnershipPlanPayloadSchema = AdminCreateLandPlanPayloadSchema.extend({
  payment_type: z.enum(['all-inclusive', 'partially-inclusive']),
});

export const AdminCreateDeveloperPlanPayloadSchema = AdminCreateLandPlanPayloadSchema.extend({
  payment_type: z.enum(['all-inclusive', 'partially-inclusive']).optional(),
});

export const AdminDeletePlanPayloadSchema = z.object({
  reason: z.string().trim().min(30).max(2000),
  refund_to_wallet: z.boolean().optional(),
  free_inventory: z.boolean().optional(),
  expected_updated_at: z.string().optional(),
  notify_user: z.boolean().optional(),
});

export const PlanMutationReasonSchema = AdminReasonSchema.extend({
  expected_updated_at: z.string().optional(),
});

export const AdminEditAssetQuestionPayloadSchema = PlanMutationReasonSchema.extend({
  name_of_property: z.string().trim().min(2).max(200).optional(),
  address: z.string().trim().min(5).max(500).optional(),
  name_on_document: z.string().trim().min(2).max(200).optional(),
});

export const AdminAdjustPlanBalancePayloadSchema = PlanMutationReasonSchema.extend({
  direction: z.enum(['credit', 'debit']),
  amount: z.number().int().positive(),
});

export const AdminOverridePaymentDatePayloadSchema = PlanMutationReasonSchema.extend({
  new_date: z.string(),
});

export const AdminUpdatePlanSpecPayloadSchema = PlanMutationReasonSchema.extend({
  reason: z.string().trim().min(30).max(2000),
  new_size_sqm: z.number().int().positive().optional(),
  new_number_of_units: z.number().int().positive().optional(),
  new_asset_price: z.number().nonnegative().optional(),
  new_land_price: z.number().nonnegative().optional(),
  new_document_price: z.number().nonnegative().optional(),
  new_initial_payment: z.number().nonnegative().optional(),
  new_monthly_payment: z.number().nonnegative().optional(),
  new_tenor_months: z.number().int().nonnegative().optional(),
  new_document_monthly_payment: z.number().nonnegative().optional(),
  new_document_tenor_months: z.number().int().nonnegative().optional(),
  new_payment_type: z.enum(['all-inclusive', 'partially-inclusive']).optional(),
});

export const RelocationPlanPayloadSchema = z.object({
  asset_type: z.enum(['flex', 'full-ownership', 'commercial', 'developer_plot']),
  asset_id: z.string().min(1),
  size_sqm: z.number().int().positive(),
  number_of_units: z.number().int().positive(),
  queue_signature_reminder: z.boolean().optional(),
  asset_price: z.number().nonnegative().optional(),
  initial_payment: z.number().nonnegative().optional(),
  monthly_payment: z.number().nonnegative().optional(),
  tenor_months: z.number().int().nonnegative().optional(),
  payment_type: z.enum(['all-inclusive', 'partially-inclusive']).optional(),
  land_price: z.number().nonnegative().optional(),
  land_initial_payment: z.number().nonnegative().optional(),
  land_monthly_payment: z.number().nonnegative().optional(),
  land_tenor_months: z.number().int().nonnegative().optional(),
  document_price: z.number().nonnegative().optional(),
  land_amount_paid: z.number().nonnegative().optional(),
  document_amount_paid: z.number().nonnegative().optional(),
  document_monthly_payment: z.number().nonnegative().optional(),
  document_tenor_months: z.number().int().nonnegative().optional(),
  allocation_qualification_pct: z.number().int().min(1).max(100).optional(),
});

export const AdminCloseAndRelocatePayloadSchema = PlanMutationReasonSchema.extend({
  reason: z.string().trim().min(30).max(2000),
  new_plan: RelocationPlanPayloadSchema,
});

export const AdminClosePlanPayloadSchema = PlanMutationReasonSchema.extend({
  reason: z.string().trim().min(30).max(2000),
});

export const PlanCommissionRecipientSchema = z.object({
  commission_type: z.enum(['direct', 'upline', 'topline', 'agency', 'founder']),
  user_id: z.string().optional(),
  agency_id: z.string().optional(),
  rate: z.number().min(0).max(1),
  tier_at_creation: z.string().optional(),
  override_source: z.string().optional(),
});

export const AdminEditPlanCommissionConfigPayloadSchema = PlanMutationReasonSchema.extend({
  reason: z.string().trim().min(30).max(2000),
  new_config_version: z.number().int().positive().optional(),
  recipient_rate_updates: z
    .array(z.object({ index: z.number().int().nonnegative(), new_rate: z.number().min(0).max(1) }))
    .optional(),
});

export const AdminEditPlanCommissionRecipientsPayloadSchema = PlanMutationReasonSchema.extend({
  reason: z.string().trim().min(30).max(2000),
  operation: z.enum(['replace', 'append', 'remove_by_index']),
  new_recipients: z.array(PlanCommissionRecipientSchema).optional(),
  new_recipient: PlanCommissionRecipientSchema.optional(),
  remove_index: z.number().int().nonnegative().optional(),
});

export const AdminPlanEmailPayloadSchema = z.object({
  reason: z.string().max(500).optional(),
  admin_message: z.string().max(500).optional(),
});

export const PlanMutationResultSchema = MessageAckSchema.extend({
  payment_plan_id: z.string().optional(),
  transaction_id: z.string().optional(),
  new_balance: z.number().optional(),
  new_amount_paid: z.number().optional(),
  new_status: z.string().optional(),
});

export const PlanCreationAssetSchema = z.object({
  _id: z.string(),
  name: z.string(),
  offers: z
    .array(
      z.looseObject({
        offer_type: z.enum(['flex', 'full-ownership', 'commercial']),
        is_active: z.boolean(),
      }),
    )
    .default([]),
});

export type AdminCreateFlexPlanPayload = z.infer<typeof AdminCreateFlexPlanPayloadSchema>;
export type AdminCreateOwnershipPlanPayload = z.infer<typeof AdminCreateOwnershipPlanPayloadSchema>;
export type AdminCreateDeveloperPlanPayload = z.infer<typeof AdminCreateDeveloperPlanPayloadSchema>;
export type AdminDeletePlanPayload = z.infer<typeof AdminDeletePlanPayloadSchema>;
export type PlanMutationReason = z.infer<typeof PlanMutationReasonSchema>;
export type AdminEditAssetQuestionPayload = z.infer<typeof AdminEditAssetQuestionPayloadSchema>;
export type AdminAdjustPlanBalancePayload = z.infer<typeof AdminAdjustPlanBalancePayloadSchema>;
export type AdminOverridePaymentDatePayload = z.infer<typeof AdminOverridePaymentDatePayloadSchema>;
export type AdminUpdatePlanSpecPayload = z.infer<typeof AdminUpdatePlanSpecPayloadSchema>;
export type AdminCloseAndRelocatePayload = z.infer<typeof AdminCloseAndRelocatePayloadSchema>;
export type AdminClosePlanPayload = z.infer<typeof AdminClosePlanPayloadSchema>;
export type AdminEditPlanCommissionConfigPayload = z.infer<
  typeof AdminEditPlanCommissionConfigPayloadSchema
>;
export type AdminEditPlanCommissionRecipientsPayload = z.infer<
  typeof AdminEditPlanCommissionRecipientsPayloadSchema
>;
export type AdminPlanEmailPayload = z.infer<typeof AdminPlanEmailPayloadSchema>;
