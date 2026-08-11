"use client";

import { useQuery } from "@tanstack/react-query";
import type { ResultOf } from "@graphql-typed-document-node/core";

import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";

import {
  purchaseConfirmationKeys,
  type ConfirmationListFilters,
} from "./query-keys";

/* ============================================================
 * Purchase Confirmations — admin list + counts.
 *
 * Buyers get an email after a confirmed purchase asking them to review
 * and confirm the details that go on their property documents
 * (/purchase/confirm/[unique_asset_id] on the user app). This section
 * is the admin view of that loop: who confirmed, who is still waiting,
 * and who reported a problem.
 *
 * Backed by `viewPurchaseConfirmations` / `purchaseConfirmationCounts`.
 * The nested BE row (buyer / snapshot / disputes) is flattened into
 * `PurchaseConfirmationRow` in `select` so components consume plain
 * typed rows.
 * ============================================================ */

export const DEFAULT_CONFIRMATIONS_LIMIT = 10;

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

/* --------------------- queries --------------------- */

const VIEW_PURCHASE_CONFIRMATIONS_QUERY = graphql(`
  query ViewPurchaseConfirmations(
    $filter: PurchaseConfirmationFilterInput
    $page: Int
    $limit: Int
  ) {
    viewPurchaseConfirmations(filter: $filter, page: $page, limit: $limit) {
      count
      data {
        planId
        uniqueAssetId
        status
        buyer {
          firstName
          lastName
          email
        }
        referrer
        asset
        snapshot {
          name_on_document
          size
          units
          plan_label
          total
          product
        }
        emailSentAt
        confirmedAt
        remindersSent
        openDisputeNote
        disputes {
          note
          disputed_at
          resolved_at
        }
        createdAt
      }
    }
  }
`);

const PURCHASE_CONFIRMATION_COUNTS_QUERY = graphql(`
  query PurchaseConfirmationCounts {
    purchaseConfirmationCounts {
      disputed
      waiting
      confirmed
    }
  }
`);

/* --------------------- BE row → PurchaseConfirmationRow --------------------- */

type ApiConfirmationRow = ResultOf<
  typeof VIEW_PURCHASE_CONFIRMATIONS_QUERY
>["viewPurchaseConfirmations"]["data"][number];

/** The `Date` scalar is untyped (`any`) — normalize ISO strings or epochs. */
const toIsoDate = (value: unknown): string | null => {
  if (value == null) return null;
  let input = value;
  if (typeof input === "string" && /^\d+$/.test(input)) input = Number(input);
  if (typeof input === "string" || typeof input === "number") {
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
};

const toStatus = (value: string): AdminConfirmationStatus =>
  value === "confirmed" || value === "disputed" ? value : "waiting";

const toProduct = (value: string | null | undefined): ConfirmationProduct =>
  value === "flex" ? "flex" : "full-ownership";

function mapRow(row: ApiConfirmationRow): PurchaseConfirmationRow {
  const disputes = row.disputes ?? [];
  // Latest unresolved entry; falls back to the most recent one.
  const activeDispute =
    [...disputes].reverse().find((entry) => !entry.resolved_at) ??
    disputes[disputes.length - 1] ??
    null;
  const resolvedAt =
    disputes
      .map((entry) => toIsoDate(entry.resolved_at))
      .filter((entry): entry is string => entry !== null)
      .sort()
      .at(-1) ?? null;
  const buyerName = [row.buyer?.firstName, row.buyer?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: String(row.planId),
    uniqueAssetId: row.uniqueAssetId,
    buyerName: buyerName || "Unknown buyer",
    buyerEmail: row.buyer?.email ?? "",
    referrerName: row.referrer ?? null,
    assetName: row.asset ?? "Unknown asset",
    product: toProduct(row.snapshot.product),
    nameOnDocument: row.snapshot.name_on_document ?? "—",
    sizeSqm: row.snapshot.size ?? 0,
    units: row.snapshot.units ?? 0,
    planLabel: row.snapshot.plan_label ?? "—",
    totalPayable: row.snapshot.total ?? 0,
    purchasedAt: toIsoDate(row.createdAt) ?? "",
    emailSentAt: toIsoDate(row.emailSentAt),
    remindersSent: row.remindersSent?.length ?? 0,
    status: toStatus(row.status),
    confirmedAt: toIsoDate(row.confirmedAt),
    disputedAt: toIsoDate(activeDispute?.disputed_at),
    disputeNote: row.openDisputeNote ?? activeDispute?.note ?? null,
    resolvedAt,
  };
}

/* --------------------- hooks --------------------- */

export function usePurchaseConfirmations(filters: ConfirmationListFilters) {
  return useQuery({
    queryKey: purchaseConfirmationKeys.list(filters),
    queryFn: () =>
      execute(VIEW_PURCHASE_CONFIRMATIONS_QUERY, {
        filter: {
          status: filters.status,
          product: filters.product,
          search: filters.search.trim() || undefined,
        },
        page: filters.page,
        limit: filters.limit,
      }),
    select: (data) => ({
      count: data.viewPurchaseConfirmations.count,
      data: data.viewPurchaseConfirmations.data.map(mapRow),
    }),
  });
}

export function useConfirmationCounts() {
  return useQuery({
    queryKey: purchaseConfirmationKeys.counts(),
    queryFn: () => execute(PURCHASE_CONFIRMATION_COUNTS_QUERY),
    select: (data) => data.purchaseConfirmationCounts,
  });
}
