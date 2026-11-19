"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/shared/Pagination";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import { useHasPermission } from "@/hooks/use-admin-permission";
import {
  ApproveUpgradeDialog,
  DeclineUpgradeDialog,
  DEFAULT_UPGRADE_LIMIT,
  ELIGIBLE_UPGRADE_TIERS,
  EligibleUpgradesTable,
  useEligibleUpgrades,
  ManualUpgradeDialog,
  UpgradeExportButton,
  UpgradeFilters,
  UpgradeStatCards,
  UpgradesTable,
  useUpgrades,
  type EligibleUpgradeTier,
  type Upgrade,
  type UpgradeListFilters,
  type UpgradePaymentMethod,
  type UpgradeStatus,
  type UserTier,
} from "@/features/upgrades";

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

const ELIGIBLE_LIMIT = 20;

/**
 * Members who finished the course their next tier requires (item 12). Only
 * shown once the BE serves `upgrades/eligible` (`upgrade_eligibility`).
 */
function EligibleView({ canReview }: { canReview: boolean }) {
  // The BE requires a tier here (it rejects a request without one), so there
  // is no "any tier" option.
  const [toTier, setToTier] = useState<EligibleUpgradeTier>("associate");
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useEligibleUpgrades({
    to_tier: toTier,
    page,
    limit: ELIGIBLE_LIMIT,
  });
  const total = data?.meta.total ?? 0;
  const totalPages = Math.ceil(total / ELIGIBLE_LIMIT);

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading eligible members</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Members who completed the course their next tier requires and passed its quiz.
        </p>
        <Select
          value={toTier}
          onValueChange={(value) => {
            setToTier(value as EligibleUpgradeTier);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full bg-white sm:w-48" aria-label="Eligible for">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ELIGIBLE_UPGRADE_TIERS.map((tier) => (
              <SelectItem key={tier} value={tier}>
                {tier === "associate" ? "Associate" : "Associate Pro"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <EligibleUpgradesTable
        rows={data?.items ?? []}
        isLoading={isLoading}
        canUpgrade={canReview}
        emptyState={
          <EmptyState
            title="Nobody is waiting on an upgrade"
            body="Members appear here once they pass the course set for this tier. If it stays empty, check that a course is set for the tier in the Academy settings."
          />
        }
      />
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {page} of {totalPages} · {total} members
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function UpgradesPageContent() {
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") ?? undefined;
  const status = (searchParams.get("status") as UpgradeStatus) ?? undefined;
  const paymentMethod = (searchParams.get("payment_method") as UpgradePaymentMethod) ?? undefined;
  const toTier = (searchParams.get("to_tier") as UserTier) ?? undefined;
  const startDate = searchParams.get("start_date") ?? undefined;
  const endDate = searchParams.get("end_date") ?? undefined;

  // Both review actions are guarded by `modify_referral_status` on the BE, so
  // without it the buttons could only ever produce a 403.
  const canReview = useHasPermission("modify_referral_status");
  const router = useRouter();
  const pathname = usePathname();
  const view = searchParams.get("view") === "eligible" ? "eligible" : "requests";
  const setView = (next: "requests" | "eligible") => {
    const params = new URLSearchParams();
    if (next === "eligible") params.set("view", "eligible");
    router.push(params.size ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  };

  const [approving, setApproving] = useState<Upgrade | null>(null);
  const [declining, setDeclining] = useState<Upgrade | null>(null);

  const filters: UpgradeListFilters = {
    search,
    status,
    payment_method: paymentMethod,
    to_tier: toTier,
    start_date: startDate,
    end_date: endDate,
  };

  const { data, isLoading, error } = useUpgrades({
    ...filters,
    page,
    limit: DEFAULT_UPGRADE_LIMIT,
  });

  const rows = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const hasFilters = Boolean(search || status || paymentMethod || toTier || startDate || endDate);

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading upgrade requests</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  const viewSwitch = (
    <div className="inline-flex rounded-md border bg-white p-0.5" role="tablist" aria-label="Upgrade view">
      {(["requests", "eligible"] as const).map((v) => (
        <Button
          key={v}
          type="button"
          size="sm"
          role="tab"
          aria-selected={view === v}
          variant={view === v ? "default" : "ghost"}
          onClick={() => setView(v)}
        >
          {v === "requests" ? "Requests" : "Eligible after course"}
        </Button>
      ))}
    </div>
  );

  if (view === "eligible") {
    return (
      <div className="space-y-4">
        {viewSwitch}
        <EligibleView canReview={canReview} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {viewSwitch}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <UpgradeExportButton filters={filters} />
        {canReview ? <ManualUpgradeDialog /> : null}
        <Button asChild className="w-full shrink-0 sm:w-auto">
          <Link href="/associate-upgrade/coupons">Coupon management</Link>
        </Button>
      </div>

      <UpgradeFilters />

      <UpgradeStatCards filters={filters} />

      <UpgradesTable
        rows={rows}
        isLoading={isLoading}
        canReview={canReview}
        onApprove={setApproving}
        onDecline={setDeclining}
        emptyState={
          hasFilters ? (
            <EmptyState
              title="No upgrades match these filters"
              body={
                search
                  ? "Search matches the applicant's name, email or username — not the referrer's. Clear or widen the filters to see the rest of the queue."
                  : "Clear or widen the filters to see the rest of the queue."
              }
            />
          ) : (
            <EmptyState
              title="Nothing in the queue"
              body="Upgrade requests appear here as members submit them."
            />
          )
        }
      />

      <Pagination count={total} currentIdx={page} limit={DEFAULT_UPGRADE_LIMIT} />

      <ApproveUpgradeDialog
        upgrade={approving}
        onOpenChange={(next) => (next ? undefined : setApproving(null))}
      />
      <DeclineUpgradeDialog
        upgrade={declining}
        onOpenChange={(next) => (next ? undefined : setDeclining(null))}
      />
    </div>
  );
}

export default function AssociateUpgradePage() {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">Associate upgrades</h1>
        <p className="text-muted-foreground">
          Review upgrade requests. Approving moves the applicant to the new tier, completes their
          payment, and pays referral commission.
        </p>
      </div>

      <Suspense fallback={<PageContentLoader label="Loading upgrade requests…" />}>
        <UpgradesPageContent />
      </Suspense>
    </div>
  );
}
