"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { useSalesAssetOptions } from "../hooks/use-sales-asset-options";

/**
 * The controls over the sales table.
 *
 * Named FilterBar, not Filters: `SalesFilters` is already the type describing
 * the filter VALUES, and one name for the values and the control that sets them
 * reads as a mistake every time somebody imports it.
 *
 * Every one of these already reached the BE — the page has been reading
 * `search` and `assettype` out of the url since it was written, with nothing in
 * the UI to set them. Estate and location are new, and adding them without
 * controls would have made three unreachable filters instead of two.
 *
 * State lives in the url, like the rest of the dashboard, so a filtered view is
 * shareable and the export button picks up the same filters the table is
 * showing.
 */

const ANY = "__any__";

const ASSET_TYPES = [
  { value: "full-ownership", label: "Full ownership" },
  { value: "flex", label: "Flex" },
];

export function SalesFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { estates, locations } = useSalesAssetOptions();

  const urlSearch = searchParams.get("search") ?? "";
  const assetType = searchParams.get("assettype");
  const assetName = searchParams.get("asset_name");
  const assetLocation = searchParams.get("asset_location");

  const hasAny = !!(urlSearch || assetType || assetName || assetLocation);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    // Any narrowing changes how many rows there are, so page 5 of the old
    // result set is meaningless.
    next.delete("page");
    router.replace(`?${next.toString()}`, { scroll: false });
  };


  // Typed locally and pushed to the url only once typing settles. The dropdowns
  // write immediately — one click is one intent — but a keystroke is not, and
  // writing per character would re-run the query and the status counts on every
  // letter.
  const [searchDraft, setSearchDraft] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchDraft);

  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    update({ search: debouncedSearch || null });
    // `update` closes over searchParams and would re-fire this on every url
    // change; the guard above is what actually decides whether to write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // No effect syncing the url back into the draft: Clear resets it directly,
  // and mirroring state that is already owned here would mean a setState inside
  // an effect for the one case it would cover — the back button. Same shape as
  // the ticket inbox's search.

  return (
    <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Search</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Customer name or email…"
            className="h-10 bg-white pl-8 sm:h-9"
          />
        </div>
      </div>

      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Estate</Label>
        <Select
          value={assetName ?? ANY}
          onValueChange={(v) => update({ asset_name: v === ANY ? null : v })}
        >
          <SelectTrigger className="h-10 w-full min-w-0 bg-white sm:h-9">
            <SelectValue placeholder="All estates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All estates</SelectItem>
            {estates.map((e) => (
              <SelectItem key={e.id} value={e.name}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Location</Label>
        <Select
          value={assetLocation ?? ANY}
          onValueChange={(v) => update({ asset_location: v === ANY ? null : v })}
        >
          <SelectTrigger className="h-10 w-full min-w-0 bg-white sm:h-9">
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All locations</SelectItem>
            {locations.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Asset type</Label>
        <div className="flex items-center gap-2">
          <Select
            value={assetType ?? ANY}
            onValueChange={(v) => update({ assettype: v === ANY ? null : v })}
          >
            <SelectTrigger className="h-10 w-full min-w-0 bg-white sm:h-9">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All types</SelectItem>
              {ASSET_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasAny && (
            <button
              type="button"
              onClick={() => {
                setSearchDraft("");
                update({
                  search: null,
                  assettype: null,
                  asset_name: null,
                  asset_location: null,
                });
              }}
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-md px-2 text-xs text-gray-500 hover:text-gray-800"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
