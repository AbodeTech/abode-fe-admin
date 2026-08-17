"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import { UnresolvedRef } from "@/components/shared/UnresolvedRef";
import { formatNaira } from "@/lib/utils/format";

import {
  PAYMENT_METHOD_LABELS,
  assetId,
  assetName,
  buyerEmail,
  buyerId,
  buyerName,
  isReviewablePurchase,
  kindLabel,
  referrerId,
  referrerName,
  type Purchase,
} from "../schemas/purchase.schema";
import { useFoTransaction } from "../hooks/use-fo-transaction";
import { PurchaseStatusBadge } from "./PurchaseStatusBadge";
import { ReviewPurchaseDialog } from "./ReviewPurchaseDialog";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm wrap-break-word">
        {value || <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

function userHref(id: string | null): string | null {
  return id ? `/users/${id}` : null;
}

function TransactionPanel({
  title,
  row,
}: {
  title: string;
  row: Purchase;
}) {
  const details = row.purchase_details;

  return (
    <section className="rounded-lg border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="font-medium">{title}</h2>
        <PurchaseStatusBadge status={row.status} />
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Amount" value={<span className="tabular-nums">{formatNaira(row.amount)}</span>} />
        <Field label="Kind" value={kindLabel(details?.transaction_kind)} />
        <Field label="Method" value={PAYMENT_METHOD_LABELS[row.payment_method]} />
        <Field
          label="Buyer"
          value={
            <div className="space-y-0.5">
              <UnresolvedRef
                name={buyerName(row.user)}
                id={buyerId(row.user)}
                href={userHref(buyerId(row.user))}
                kind="buyer"
              />
              {buyerEmail(row.user) ? (
                <p className="text-xs text-muted-foreground">{buyerEmail(row.user)}</p>
              ) : null}
            </div>
          }
        />
        <Field
          label="Asset"
          value={
            <UnresolvedRef
              name={assetName(row.source_asset)}
              id={assetId(row.source_asset)}
              kind="asset"
            />
          }
        />
        <Field
          label="Referrer"
          value={
            referrerId(row.user) || referrerName(row.user) ? (
              <UnresolvedRef
                name={referrerName(row.user)}
                id={referrerId(row.user)}
                href={userHref(referrerId(row.user))}
                kind="referrer"
              />
            ) : (
              "No referrer"
            )
          }
        />
        {details?.size_sqm ? (
          <Field label="Size" value={`${details.size_sqm.toLocaleString()} sqm`} />
        ) : null}
        {details?.tenor_months != null ? (
          <Field
            label="Tenor"
            value={details.tenor_months === 0 ? "Outright" : `${details.tenor_months} months`}
          />
        ) : null}
        {details?.no_of_units ? <Field label="Units" value={details.no_of_units} /> : null}
        <Field label="Date" value={formatDate(row.createdAt)} />
        {row.admin_status ? <Field label="Review status" value={row.admin_status} /> : null}
        {row.decline_reason ? <Field label="Decline reason" value={row.decline_reason} /> : null}
      </div>

      {row.payment_method === "transfer" ? (
        <div className="border-t px-4 py-3">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Transfer evidence
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Bank" value={details?.transfer_bank_name} />
            <Field label="Reference" value={details?.transfer_reference_no} />
            <Field
              label="Receipt"
              value={
                details?.transfer_receipt_url ? (
                  <a
                    href={details.transfer_receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline underline-offset-4"
                  >
                    Open <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                ) : null
              }
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function siblingTitle(row: Purchase): string {
  const kind = row.purchase_details?.transaction_kind;
  if (kind === "fo_outright_doc") return "Document fee";
  if (kind === "fo_outright_land") return "Land purchase";
  return "Related transaction";
}

export function FoTransactionDetail() {
  const params = useParams<{ id: string }>();
  const txId = params.id;
  const { data, isLoading, error } = useFoTransaction(txId);
  const [reviewing, setReviewing] = useState<Purchase | null>(null);

  if (isLoading) {
    return <PageContentLoader label="Loading full-ownership transaction…" />;
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading transaction</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!data) return null;

  const canReview = isReviewablePurchase(data);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Link
          href="/transactions/assets"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to asset transactions
        </Link>
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">Full-ownership transaction</h1>
            <p className="text-muted-foreground">
              {kindLabel(data.purchase_details?.transaction_kind)} · {formatNaira(data.amount)}
            </p>
          </div>
          {canReview ? (
            <Button onClick={() => setReviewing(data)}>Review transfer</Button>
          ) : null}
        </div>
      </div>

      <TransactionPanel title="This payment" row={data} />

      {data.sibling ? (
        <TransactionPanel title={siblingTitle(data.sibling)} row={data.sibling} />
      ) : null}

      <ReviewPurchaseDialog row={reviewing} onClose={() => setReviewing(null)} />
    </div>
  );
}
