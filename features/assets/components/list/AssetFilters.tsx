"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { useDebounce } from "@/hooks/use-debounce";

import {
  OFFER_TYPES,
  OFFER_TYPE_LABELS,
  VISIBILITIES,
  VISIBILITY_LABELS,
} from "../../schemas/asset.schema";

const VISIBILITY_OPTIONS = VISIBILITIES.map((visibility) => ({
  label: VISIBILITY_LABELS[visibility],
  value: visibility,
}));

const OFFER_TYPE_OPTIONS = OFFER_TYPES.map((offerType) => ({
  label: OFFER_TYPE_LABELS[offerType],
  value: offerType,
}));

const SOLD_OPTIONS = [{ label: "Sold out only", value: "true" }];
const DELETED_OPTIONS = [{ label: "Include deleted", value: "true" }];

/**
 * Search is real here — the backend regex-matches `name` and `asset_location`
 * server-side, unlike the upgrade queue which has no search at all.
 *
 * Debounced and written to the URL so a filtered view is linkable, matching
 * the app's convention.
 */
function AssetSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(() => searchParams.get("search") ?? "");
  const debounced = useDebounce(value, 400);

  const current = searchParams.get("search") ?? "";

  useEffect(() => {
    if (debounced === current) return;

    const params = new URLSearchParams(searchParams.toString());
    if (debounced) params.set("search", debounced);
    else params.delete("search");
    params.set("page", "1");

    router.push(`?${params.toString()}`, { scroll: false });
  }, [debounced, current, router, searchParams]);

  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="pl-9"
        placeholder="Search name or location"
        aria-label="Search assets"
      />
    </div>
  );
}

export function AssetFilters() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <AssetSearch />
      <FilterSelect data={VISIBILITY_OPTIONS} queryKey="visibility" placeholder="All visibility" />
      {/*
        A facet, not a mode switch: this filters to assets that *have* the
        offer and narrows each row's offers[] to it — it does not bring back
        the two separate tables v1 had.
      */}
      <FilterSelect data={OFFER_TYPE_OPTIONS} queryKey="offer_type" placeholder="All offers" />
      <FilterSelect data={SOLD_OPTIONS} queryKey="sold" placeholder="Any availability" />
      <FilterSelect data={DELETED_OPTIONS} queryKey="include_deleted" placeholder="Active only" />
    </div>
  );
}
