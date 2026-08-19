import { z } from 'zod';

/* ============================================================
 * Flex leads — brochure downloads + site-inspection bookings,
 * GET/PATCH/DELETE /admin/flex-leads/*.
 *
 * Ported from main's design, which ran on an in-memory dummy layer
 * (`USE_DUMMY_FLEX_LEADS`) because the API didn't exist yet. It does now —
 * this feature is wired to the real module and the dummy layer is gone.
 *
 * Shapes are transcribed from the service's `FlexLeadRow` (flattened,
 * every key present) and the repository's `FlexLeadCounts`.
 * ============================================================ */

export const FLEX_LEAD_TYPES = ['brochure', 'site_inspection'] as const;
export const FlexLeadTypeSchema = z.enum(FLEX_LEAD_TYPES);
export type FlexLeadType = z.infer<typeof FlexLeadTypeSchema>;

export const FLEX_LEAD_TYPE_LABELS: Record<FlexLeadType, string> = {
  brochure: 'Brochure download',
  site_inspection: 'Site inspection',
};

export const FLEX_LEAD_STATUSES = ['new', 'contacted', 'scheduled', 'completed', 'closed'] as const;
export const FlexLeadStatusSchema = z.enum(FLEX_LEAD_STATUSES);
export type FlexLeadStatus = z.infer<typeof FlexLeadStatusSchema>;

export const FLEX_LEAD_STATUS_LABELS: Record<FlexLeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  scheduled: 'Scheduled',
  completed: 'Completed',
  closed: 'Closed',
};

/**
 * One lead, flattened server-side. `location` and `preferred_date` are only
 * ever set on site inspections (FL-12); `is_deleted` rows appear only when
 * `include_deleted` is requested (FL-5).
 */
export const FlexLeadRowSchema = z.looseObject({
  id: z.string(),
  type: FlexLeadTypeSchema,
  full_name: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string().nullable(),
  preferred_date: z.string().nullable(),
  status: FlexLeadStatusSchema,
  admin_notes: z.string().nullable(),
  is_deleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FlexLeadRow = z.infer<typeof FlexLeadRowSchema>;

/** GET /admin/flex-leads → `{count, data}` inside the envelope. */
export const FlexLeadListSchema = z.object({
  count: z.number(),
  data: z.array(FlexLeadRowSchema),
});

export type FlexLeadList = z.infer<typeof FlexLeadListSchema>;

/** GET /admin/flex-leads/counts — exactly the five statuses, no total. */
export const FlexLeadCountsSchema = z.looseObject({
  new: z.number(),
  contacted: z.number(),
  scheduled: z.number(),
  completed: z.number(),
  closed: z.number(),
});

export type FlexLeadCounts = z.infer<typeof FlexLeadCountsSchema>;

export const DeleteFlexLeadResultSchema = z.object({
  id: z.string(),
  is_deleted: z.boolean(),
});

/** Mirrors `UpdateFlexLeadDto` — notes cap at 2000 chars. */
export const FLEX_LEAD_NOTES_MAX = 2000;

/** FL-8 — the export refuses above this before opening a cursor. */
export const FLEX_LEAD_EXPORT_CAP = 50_000;
