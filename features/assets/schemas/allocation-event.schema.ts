import { z } from 'zod';

/* ============================================================
 * A minimal, read-only slice of GET /admin/company-events, duplicated here
 * rather than importing features/company-events/schemas/company-event.schema.ts
 * — this codebase's features are self-contained, no cross-feature imports
 * (CLAUDE.md), the same rule that already makes features/company-events/
 * duplicate a slice of asset data (`CompanyEventAssetOptionSchema`) instead
 * of importing from features/assets/. This is the reverse of that same
 * pattern: only the fields the Asset Detail "Allocation events" card needs,
 * kept in sync by hand if the real shape changes.
 * ============================================================ */

export const ASSET_ALLOCATION_EVENT_STATUSES = ['draft', 'published', 'closed'] as const;
export const AssetAllocationEventStatusSchema = z.enum(ASSET_ALLOCATION_EVENT_STATUSES);
export type AssetAllocationEventStatus = z.infer<typeof AssetAllocationEventStatusSchema>;

export const AssetAllocationEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  time: z.string(),
  starts_at: z.string(),
  status: AssetAllocationEventStatusSchema,
  available_size: z.number().nullable().optional(),
  reserved_size: z.number(),
  remaining_capacity: z.number().nullable(),
  size_unit: z.string().nullable().optional(),
});

export type AssetAllocationEvent = z.infer<typeof AssetAllocationEventSchema>;
