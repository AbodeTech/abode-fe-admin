import { z } from 'zod';
import { AnalysisMoneySchema } from './recruitment-analysis.schema';

export const CohortCostCategorySchema = z.enum(['ads', 'events_venue', 'facilitators', 'tools_messaging', 'other']);
export const COHORT_COST_LABELS: Record<z.infer<typeof CohortCostCategorySchema>, string> = {
  ads: 'Ads', events_venue: 'Events and venue', facilitators: 'Facilitators', tools_messaging: 'Tools and messaging', other: 'Other',
};
const NairaSchema = z.number().min(0).max(Number.MAX_SAFE_INTEGER / 100).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001, 'Use at most 2 decimal places');
export const CreateCohortCostSchema = z.object({
  category: CohortCostCategorySchema,
  amount: NairaSchema,
  description: z.string().trim().max(300).optional(),
  incurred_on: z.iso.date().optional(),
});
export const DeleteCohortCostSchema = z.object({ reason: z.string().trim().min(15, 'Please give a reason of at least 15 characters').max(500) });
export const UpdateCohortCostSchema = CreateCohortCostSchema.partial().extend(DeleteCohortCostSchema.shape);
export const CohortCostEntrySchema = z.object({
  id: z.string(), category: CohortCostCategorySchema, label: z.string(), amount: AnalysisMoneySchema,
  description: z.string().nullable(), incurred_on: z.string().nullable(), created_by: z.string().nullable(),
  created_at: z.string(), updated_at: z.string(),
});
export const CohortCostsSchema = z.object({
  cohort_id: z.string(), recorded: z.boolean(), total: AnalysisMoneySchema,
  by_category: z.array(z.object({ category: CohortCostCategorySchema, label: z.string(), total: AnalysisMoneySchema })),
  entries: z.array(CohortCostEntrySchema),
});
export const CohortCostFormSchema = z.object({
  category: CohortCostCategorySchema,
  amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount in naira, with up to 2 decimal places').refine(value => NairaSchema.safeParse(Number(value)).success, 'Enter a valid amount'),
  description: z.string().trim().max(300), incurred_on: z.union([z.literal(''), z.iso.date()]), reason: z.string().trim().max(500),
});
export type CreateCohortCost = z.infer<typeof CreateCohortCostSchema>;
export type UpdateCohortCost = z.infer<typeof UpdateCohortCostSchema>;
export type DeleteCohortCost = z.infer<typeof DeleteCohortCostSchema>;
export type CohortCostEntry = z.infer<typeof CohortCostEntrySchema>;
export type CohortCostForm = z.infer<typeof CohortCostFormSchema>;

// The API stores spent dates at midnight Lagos (23:00 UTC on the preceding day).
export const cohortCostDate = (value: string | null) => value
  ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value)) : '';
