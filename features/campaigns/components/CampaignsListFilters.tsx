"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

import { CAMPAIGN_STATUSES, type CampaignStatus } from "../schemas/campaign.schema";

function setParam(router: ReturnType<typeof useRouter>, searchParams: URLSearchParams, key: string, value: string) {
  const params = new URLSearchParams(searchParams.toString());
  if (value) params.set(key, value);
  else params.delete(key);
  params.set("page", "1");
  router.push(`?${params.toString()}`, { scroll: false });
}

export function CampaignsListFilters({
  currentStatus,
  currentSearch,
}: {
  currentStatus: CampaignStatus | null;
  currentSearch: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(currentSearch);
  const [prevSearch, setPrevSearch] = useState(currentSearch);
  if (currentSearch !== prevSearch) {
    setPrevSearch(currentSearch);
    setValue(currentSearch);
  }
  const debounced = useDebounce(value, 400);

  useEffect(() => {
    if (debounced === (searchParams.get("search") ?? "")) return;
    setParam(router, new URLSearchParams(searchParams.toString()), "search", debounced);
  }, [debounced, router, searchParams]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="pl-9"
          placeholder="Search campaign name"
          aria-label="Search campaigns"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={!currentStatus ? "default" : "outline"}
          onClick={() => setParam(router, new URLSearchParams(searchParams.toString()), "status", "")}
        >
          All
        </Button>
        {CAMPAIGN_STATUSES.map((status) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={currentStatus === status ? "default" : "outline"}
            className="capitalize"
            onClick={() => setParam(router, new URLSearchParams(searchParams.toString()), "status", status)}
          >
            {status}
          </Button>
        ))}
      </div>
    </div>
  );
}
