"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/shared/FilterSelect";

import {
  UPGRADE_PAYMENT_METHODS,
  UPGRADE_PAYMENT_METHOD_LABELS,
  UPGRADE_STATUSES,
  UPGRADE_STATUS_LABELS,
  UPGRADE_TARGET_TIERS,
  USER_TIER_LABELS,
} from "../schemas/upgrade.schema";

const STATUS_OPTIONS = UPGRADE_STATUSES.map((status) => ({
  label: UPGRADE_STATUS_LABELS[status],
  value: status,
}));

const METHOD_OPTIONS = UPGRADE_PAYMENT_METHODS.map((method) => ({
  label: UPGRADE_PAYMENT_METHOD_LABELS[method],
  value: method,
}));

const TIER_OPTIONS = UPGRADE_TARGET_TIERS.map((tier) => ({
  label: USER_TIER_LABELS[tier],
  value: tier,
}));

export function UpgradeFilters() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <FilterSelect data={STATUS_OPTIONS} queryKey="status" placeholder="All statuses" />
      <FilterSelect data={METHOD_OPTIONS} queryKey="payment_method" placeholder="All methods" />
      <FilterSelect data={TIER_OPTIONS} queryKey="to_tier" placeholder="All tiers" />

      {/*
        ⛔ ticket 14 — `UpgradeQueryDto` has no `search`, and it can't be faked
        client-side because the applicant's name isn't in the payload either
        (⛔ ticket 13). Rendered but disabled on purpose: a live box that
        silently returned the unfiltered list would read as "that person isn't
        in the queue", which is a confident wrong answer. Goes live by deleting
        `disabled`.
      */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          disabled
          className="pl-9"
          placeholder="Search unavailable — pending backend update"
          aria-label="Search applicants (unavailable)"
        />
      </div>
    </div>
  );
}
