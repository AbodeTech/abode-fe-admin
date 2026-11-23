"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Pagination } from "@/components/shared/Pagination";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import {
  DEFAULT_REFUND_PAYOUT_LIMIT,
  REFUND_PAYOUT_STATUSES,
  RefundPayoutDialogs,
  RefundPayoutExportButton,
  RefundPayoutFilters,
  RefundPayoutStatCards,
  RefundPayoutsTable,
  useRefundPayouts,
  type RefundPayoutAction,
  type RefundPayoutListFilters,
  type RefundPayoutStatus,
} from "@/features/refund-payouts";

function parseStatus(value: string | null): RefundPayoutStatus | undefined {
  return value && (REFUND_PAYOUT_STATUSES as readonly string[]).includes(value)
    ? (value as RefundPayoutStatus)
    : undefined;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function RefundsPageContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") ?? undefined;
  const status = parseStatus(searchParams.get("status"));
  const [action, setAction] = useState<RefundPayoutAction | null>(null);

  const filters: RefundPayoutListFilters = { search, status };
  const { data, isLoading, error } = useRefundPayouts({ ...filters, page });
  const rows = data?.items ?? [];
  const total = data?.meta.total ?? 0;

  return (
    <>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">Refunds</h1>
        <p className="text-muted-foreground">
          Recovery refunds approved on the Recovery period record, paid straight to the customer&apos;s bank. They
          never go into the wallet. A failed transfer stays owed until it&apos;s sent again or paid by hand.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading refunds</h3>
          <p>{error.message}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <RefundPayoutExportButton filters={filters} />
          </div>
          <RefundPayoutStatCards />
          <RefundPayoutFilters />
          <RefundPayoutsTable
            rows={rows}
            isLoading={isLoading}
            onSend={(row) => setAction({ kind: "send", row })}
            onMarkPaid={(row) => setAction({ kind: "mark_paid", row })}
            emptyState={
              search || status ? (
                <EmptyState
                  title="No refunds match these filters"
                  body="Search matches the customer's name or email, the estate, or a transfer reference."
                />
              ) : (
                <EmptyState
                  title="No refunds yet"
                  body="A refund appears here once finance approves it on the Recovery period record."
                />
              )
            }
          />
          {!isLoading && total > 0 ? (
            <Pagination count={total} currentIdx={page} limit={DEFAULT_REFUND_PAYOUT_LIMIT} />
          ) : null}
        </div>
      )}

      <RefundPayoutDialogs
        key={action ? `${action.kind}-${action.row.id}` : "none"}
        action={action}
        onClose={() => setAction(null)}
      />
    </>
  );
}

export default function RefundsPage() {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <Suspense fallback={<PageContentLoader label="Loading refunds…" />}>
        <RefundsPageContent />
      </Suspense>
    </div>
  );
}
