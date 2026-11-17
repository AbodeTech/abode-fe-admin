/**
 * Campaign list sort — the proposed BE params `sort_by` + `sort_dir`
 * (Admin v2 — Backend Requirements, item 15). The URL carries one `sort`
 * value, `<sort_by>:<sort_dir>`; no value means the BE default (newest first).
 */
export const CAMPAIGN_SORTS = [
  { value: "created_at:desc", label: "Newest first" },
  { value: "created_at:asc", label: "Oldest first" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "start_date:desc", label: "Start date, latest" },
  { value: "start_date:asc", label: "Start date, earliest" },
  { value: "end_date:asc", label: "Ending soonest" },
  { value: "total_sqm_target:desc", label: "Largest sqm target" },
] as const;

export type CampaignSortValue = (typeof CAMPAIGN_SORTS)[number]["value"];

export const DEFAULT_CAMPAIGN_SORT: CampaignSortValue = "created_at:desc";

export function parseCampaignSort(raw: string | null | undefined): CampaignSortValue {
  return CAMPAIGN_SORTS.some((s) => s.value === raw) ? (raw as CampaignSortValue) : DEFAULT_CAMPAIGN_SORT;
}

/** BE params for a sort; the default sends nothing, so it matches today's BE exactly. */
export function campaignSortParams(sort: CampaignSortValue): { sort_by?: string; sort_dir?: "asc" | "desc" } {
  if (sort === DEFAULT_CAMPAIGN_SORT) return {};
  const [sort_by, sort_dir] = sort.split(":") as [string, "asc" | "desc"];
  return { sort_by, sort_dir };
}
