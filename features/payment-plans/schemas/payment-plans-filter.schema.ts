import { z } from 'zod';

import { PAYMENT_PLAN_ASSET_TYPES, PAYMENT_PLAN_STATUSES } from './payment-plan-row.schema';

export const DEFAULT_CONDITION_VALUES = ['currently_owing', 'any'] as const;

export const FilterFormSchema = z.object({
  status: z.array(z.enum(PAYMENT_PLAN_STATUSES)).optional(),
  asset_type: z.array(z.enum(PAYMENT_PLAN_ASSET_TYPES)).optional(),
  has_defaults: z.boolean().optional(),
  default_condition: z.enum(DEFAULT_CONDITION_VALUES).optional(),
  has_referrer: z.boolean().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  next_payment_due_before: z.string().optional(),
  next_payment_due_after: z.string().optional(),
  min_outstanding: z.number().optional(),
  max_outstanding: z.number().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
});

export type FilterFormValues = z.infer<typeof FilterFormSchema>;
