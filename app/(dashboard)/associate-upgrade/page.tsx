"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import { useHasPermission } from "@/hooks/use-admin-permission";
import {
  ApproveUpgradeDialog,
  DeclineUpgradeDialog,
  DEFAULT_UPGRADE_LIMIT,
  ManualUpgradeDialog,
  UpgradeExportButton,
  UpgradeFilters,
  UpgradesTable,
  useUpgrades,
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

function UpgradesPageContent() {
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") ?? undefined;
  const status = (searchParams.get("status") as UpgradeStatus) ?? undefined;
  const paymentMethod = (searchParams.get("payment_method") as UpgradePaymentMethod) ?? undefined;
  const toTier = (searchParams.get("to_tier") as UserTier) ?? undefined;

  // Both review actions are guarded by `modify_referral_status` on the BE, so
  // without it the buttons could only ever produce a 403.
  const canReview = useHasPermission("modify_referral_status");

  const [approving, setApproving] = useState<Upgrade | null>(null);
  const [declining, setDeclining] = useState<Upgrade | null>(null);

  const filters: UpgradeListFilters = {
    search,
    status,
    payment_method: paymentMethod,
    to_tier: toTier,
  };

  const { data, isLoading, error } = useUpgrades({
    ...filters,
    page,
    limit: DEFAULT_UPGRADE_LIMIT,
  });

  const rows = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const hasFilters = Boolean(search || status || paymentMethod || toTier);

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading upgrade requests</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <UpgradeExportButton filters={filters} />
        {canReview ? <ManualUpgradeDialog /> : null}
        <Button asChild className="w-full shrink-0 sm:w-auto">
          <Link href="/associate-upgrade/coupons">Coupon management</Link>
        </Button>
      </div>

      <UpgradeFilters />

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
