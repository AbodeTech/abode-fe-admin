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

/** The soonest event that hasn't happened or been closed yet, or `null` when there is none. */
export function nextAllocationEvent(
  events: AssetAllocationEvent[],
  now: number = Date.now()
): AssetAllocationEvent | null {
  const upcoming = events
    .filter((event) => event.status !== 'closed' && new Date(event.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  return upcoming[0] ?? null;
}

/** `2026-10-03T…` → `"3 Oct 2026"`. */
export function formatEventDate(startsAt: string): string {
  return new Date(startsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
