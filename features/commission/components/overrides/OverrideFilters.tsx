"use client";

import { FilterSelect } from "@/components/shared/FilterSelect";

import { OFFER_TYPES, OFFER_TYPE_LABELS } from "../../schemas/commission.schema";
import { OVERRIDE_TYPES, OVERRIDE_TYPE_LABELS } from "../../schemas/override.schema";

const TYPE_OPTIONS = OVERRIDE_TYPES.map((type) => ({
  label: OVERRIDE_TYPE_LABELS[type],
  value: type,
}));

const OFFER_TYPE_OPTIONS = OFFER_TYPES.map((offerType) => ({
  label: OFFER_TYPE_LABELS[offerType],
  value: offerType,
}));

/**
 * `include_inactive` is a boolean on the backend, presented as a scope so it
 * reuses the app's `FilterSelect` rather than introducing a bespoke
 * checkbox-to-URL control.
 */
const SCOPE_OPTIONS = [{ label: "Include expired and revoked", value: "all" }];

/**
 * Filters live in the URL, so a filtered view is linkable and survives a
 * reload — the same convention as every other table in the app.
 *
 * ⛔ ticket 9a — there is deliberately no referrer or asset picker yet. The
 * backend returns bare ObjectIds, so a picker would have nothing to show but
 * IDs. `user_id` and `asset_id` are still honoured from the URL, so links
 * pointing at a specific subject already work; the picker arrives with names.
 */
export function OverrideFilters() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <FilterSelect data={TYPE_OPTIONS} queryKey="type" placeholder="All types" />
      <FilterSelect data={OFFER_TYPE_OPTIONS} queryKey="offer_type" placeholder="All offer types" />
      <FilterSelect data={SCOPE_OPTIONS} queryKey="scope" placeholder="Active only" />
    </div>
  );
}
