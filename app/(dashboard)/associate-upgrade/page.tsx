"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Info } from "lucide-react";

import { Pagination } from "@/components/shared/Pagination";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import {
  ApproveUpgradeDialog,
  DeclineUpgradeDialog,
  DEFAULT_UPGRADE_LIMIT,
  UpgradeFilters,
  UpgradesTable,
  useUpgrades,
  type Upgrade,
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
  const status = (searchParams.get("status") as UpgradeStatus) ?? undefined;
  const paymentMethod = (searchParams.get("payment_method") as UpgradePaymentMethod) ?? undefined;
  const toTier = (searchParams.get("to_tier") as UserTier) ?? undefined;

  const [approving, setApproving] = useState<Upgrade | null>(null);
  const [declining, setDeclining] = useState<Upgrade | null>(null);

  const { data, isLoading, error } = useUpgrades({
    page,
    limit: DEFAULT_UPGRADE_LIMIT,
    status,
    payment_method: paymentMethod,
    to_tier: toTier,
  });

  const rows = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const hasFilters = Boolean(status || paymentMethod || toTier);

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
      <UpgradeFilters />

      {/*
        ⛔ ticket 13 — applicant and referrer names aren't populated yet, so
        they render as em-dashes. Said out loud so the blanks read as a known
        gap rather than as missing data.
      */}
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Applicant and referrer names aren&apos;t available from the API yet — they show as
        &ldquo;—&rdquo;. Hover one to copy its ID. Everything else on the row is live.
      </p>

      <UpgradesTable
        rows={rows}
        isLoading={isLoading}
        onApprove={setApproving}
        onDecline={setDeclining}
        emptyState={
          hasFilters ? (
            <EmptyState
              title="No upgrades match these filters"
              body="Clear or widen the filters to see the rest of the queue."
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
