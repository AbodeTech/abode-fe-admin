"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/shared/FilterSelect";

import {
  ADMIN_STATUSES,
  ADMIN_STATUS_LABELS,
  PAYMENT_PROVIDERS,
  PAYMENT_PROVIDER_LABELS,
} from "../schemas/withdrawal.schema";

const STATUS_OPTIONS = ADMIN_STATUSES.map((status) => ({
  label: ADMIN_STATUS_LABELS[status],
  value: status,
}));

const PROVIDER_OPTIONS = PAYMENT_PROVIDERS.map((provider) => ({
  label: PAYMENT_PROVIDER_LABELS[provider],
  value: provider,
}));

export function WithdrawalFilters() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <FilterSelect data={STATUS_OPTIONS} queryKey="admin_status" placeholder="All statuses" />
      <FilterSelect
        data={PROVIDER_OPTIONS}
        queryKey="payment_provider"
        placeholder="All providers"
      />

      {/*
        ⛔ tickets 13/14 — the queue has no `search` param, and it couldn't be
        faked client-side because rows don't carry the user's name either.
        Rendered but disabled, same as the upgrade queue: a live box that
        silently returned everything would read as "that person has no
        withdrawal", which is a confident wrong answer.
      */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          disabled
          className="pl-9"
          placeholder="Search unavailable — pending backend update"
          aria-label="Search withdrawals (unavailable)"
        />
      </div>
    </div>
  );
}
