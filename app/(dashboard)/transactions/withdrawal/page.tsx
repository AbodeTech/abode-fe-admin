"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Pagination } from "@/components/shared/Pagination";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import {
  ADMIN_STATUSES,
  DEFAULT_WITHDRAWAL_LIMIT,
  PAYMENT_PROVIDERS,
  ReviewWithdrawalDialogs,
  useWithdrawals,
  WithdrawalExportButton,
  WithdrawalFilters,
  WithdrawalStatCards,
  WithdrawalsTable,
  type AdminStatus,
  type PaymentProvider,
  type ReviewAction,
  type Withdrawal,
  type WithdrawalListFilters,
} from "@/features/withdrawals";

function parseEnum<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function WithdrawalsPageContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") ?? undefined;
  const adminStatus = parseEnum<AdminStatus>(searchParams.get("admin_status"), ADMIN_STATUSES);
  const provider = parseEnum<PaymentProvider>(
    searchParams.get("payment_provider"),
    PAYMENT_PROVIDERS
  );

  const [action, setAction] = useState<ReviewAction | null>(null);

  const filters: WithdrawalListFilters = {
    search,
    admin_status: adminStatus,
    payment_provider: provider,
  };

  const { data, isLoading, error } = useWithdrawals({ ...filters, page });

  const rows = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const filtered = Boolean(search || adminStatus || provider);

  const open = (kind: ReviewAction["kind"]) => (row: Withdrawal) => setAction({ kind, row });

  return (
    <>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">Withdrawals</h1>
        <p className="text-muted-foreground">
          Requests holding real money. Approving initiates the bank transfer; declining returns
          the held funds to the user&apos;s wallet.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading withdrawals</h3>
          <p>{error.message}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <WithdrawalExportButton filters={filters} />
          </div>

          <WithdrawalStatCards />

          <WithdrawalFilters />

          <WithdrawalsTable
            rows={rows}
            isLoading={isLoading}
            onApprove={open("approve")}
            onDecline={open("decline")}
            onRetry={open("retry")}
            emptyState={
              filtered ? (
                <EmptyState
                  title="No withdrawals match these filters"
                  body={
                    search
                      ? "Search matches the requester's name, email or username — not the destination account. Clear or widen the filters to see the rest of the queue."
                      : "Clear or widen the filters to see the rest of the queue."
                  }
                />
              ) : (
                <EmptyState
                  title="The queue is empty"
                  body="No withdrawal requests right now."
                />
              )
            }
          />

          {!isLoading && total > 0 ? (
            <Pagination count={total} currentIdx={page} limit={DEFAULT_WITHDRAWAL_LIMIT} />
          ) : null}
        </div>
      )}

      <ReviewWithdrawalDialogs action={action} onClose={() => setAction(null)} />
    </>
  );
}

export default function WithdrawalsPage() {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <Suspense fallback={<PageContentLoader label="Loading withdrawals…" />}>
        <WithdrawalsPageContent />
      </Suspense>
    </div>
  );
}
