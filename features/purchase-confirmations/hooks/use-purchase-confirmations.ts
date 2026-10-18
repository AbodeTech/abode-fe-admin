"use client";

import { useQuery } from "@tanstack/react-query";

import { apiGet, apiGetPaged } from "@/lib/api-client";

import {
  AdminConfirmationRowSchema,
  ConfirmationCountsSchema,
  type AdminConfirmationRow,
} from "../schemas/purchase-confirmation.schema";
import {
  purchaseConfirmationKeys,
  type ConfirmationListFilters,
} from "./query-keys";

/* ============================================================
 * Purchase Confirmations — admin list + counts.
 *
 * GET /admin/purchase-confirmations — standard paged envelope (data[] +
 * meta{total,page,limit,totalPages}), per admin-purchase-confirmation.dto.ts's
 * own comment: explicitly NOT {count, data} because that shape can't survive
 * the global TransformInterceptor (see ticket #26 for the Amaris case this
 * BE comment is citing).
 *
 * The BE row (buyer / snapshot / disputes) is flattened into
 * `PurchaseConfirmationRow` in `select` so components consume plain rows,
 * same as before this was a REST endpoint.
 * ============================================================ */

export const DEFAULT_CONFIRMATIONS_LIMIT = 20;

export type AdminConfirmationStatus = "waiting" | "confirmed" | "disputed";

export type ConfirmationProduct = "full-ownership" | "flex";

export type PurchaseConfirmationRow = {
  id: string;
  uniqueAssetId: string;
  buyerName: string;
  buyerEmail: string;
  referrerName: string | null;
  assetName: string;
  product: ConfirmationProduct;
  nameOnDocument: string;
  sizeSqm: number;
  units: number;
  planLabel: string;
  totalPayable: number;
  purchasedAt: string;
  emailSentAt: string | null;
  remindersSent: number;
  status: AdminConfirmationStatus;
  confirmedAt: string | null;
  disputedAt: string | null;
  disputeNote: string | null;
  resolvedAt: string | null;
};

const toStatus = (value: string): AdminConfirmationStatus =>
  value === "confirmed" || value === "disputed" ? value : "waiting";

const toProduct = (value: string | null | undefined): ConfirmationProduct =>
  value === "flex" ? "flex" : "full-ownership";

function mapRow(row: AdminConfirmationRow): PurchaseConfirmationRow {
  const disputes = row.disputes;
  // Latest unresolved entry; falls back to the most recent one.
  const activeDispute =
    [...disputes].reverse().find((entry) => !entry.resolved_at) ??
    disputes[disputes.length - 1] ??
    null;
  const resolvedAt =
    disputes
      .map((entry) => entry.resolved_at)
      .filter((entry): entry is string => entry !== null)
      .sort()
      .at(-1) ?? null;
  const buyerName = [row.buyer?.first_name, row.buyer?.last_name].filter(Boolean).join(" ").trim();

  return {
    id: row.plan_id,
    uniqueAssetId: row.unique_asset_id,
    buyerName: buyerName || "Unknown buyer",
    buyerEmail: row.buyer?.email ?? "",
    referrerName: row.referrer,
    assetName: row.asset ?? "Unknown asset",
    product: toProduct(row.snapshot.product),
    nameOnDocument: row.snapshot.name_on_document || "—",
    sizeSqm: row.snapshot.size,
    units: row.snapshot.units,
    planLabel: row.snapshot.plan_label || "—",
    totalPayable: row.snapshot.total,
    purchasedAt: row.createdAt,
    emailSentAt: row.email_sent_at,
    remindersSent: row.reminders_sent.length,
    status: toStatus(row.status),
    confirmedAt: row.confirmed_at,
    disputedAt: activeDispute?.disputed_at ?? null,
    disputeNote: row.open_dispute_note ?? activeDispute?.note ?? null,
    resolvedAt,
  };
}

export function usePurchaseConfirmations(filters: ConfirmationListFilters) {
  return useQuery({
    queryKey: purchaseConfirmationKeys.list(filters),
    queryFn: () =>
      apiGetPaged("/admin/purchase-confirmations", AdminConfirmationRowSchema, {
        params: {
          status: filters.status === "all" ? undefined : filters.status,
          product: filters.product === "all" ? undefined : filters.product,
          q: filters.search.trim() || undefined,
          page: filters.page,
          limit: filters.limit,
        },
      }),
    select: (data) => ({
      count: data.meta.total ?? 0,
      data: data.items.map(mapRow),
    }),
  });
}

export function useConfirmationCounts() {
  return useQuery({
    queryKey: purchaseConfirmationKeys.counts(),
    queryFn: () => apiGet("/admin/purchase-confirmations/counts", ConfirmationCountsSchema),
  });
}
