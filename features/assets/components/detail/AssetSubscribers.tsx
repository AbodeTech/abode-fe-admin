"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/shared/Pagination";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";
import { formatNairaCompact } from "@/lib/utils/format";

import {
  DEFAULT_SUBSCRIBERS_LIMIT,
  useAssetSubscribers,
  type AssetSubscribersFilters,
} from "../../hooks/use-asset-subscribers";
import { useExportAssetSubscribers } from "../../hooks/use-export-asset-subscribers";
import { usePlotInventory } from "../../hooks/use-plot-inventory";
import {
  SUBSCRIBER_SORT_FIELDS,
  SUBSCRIBER_TYPES,
  SUBSCRIBER_TYPE_LABELS,
  customerLandPosition,
  paymentPercentage,
  plotsByPlanId,
  type PurchaseTone,
  type SubscriberRow,
  type SubscriberSortField,
  type SubscriberType,
} from "../../schemas/asset-subscribers.schema";
import { DetailPanel } from "./DetailPanel";

const SORT_LABELS: Record<SubscriberSortField, string> = {
  created_at: "Date joined",
  amount_paid: "Amount paid",
  balance: "Balance",
  asset_price: "Asset price",
  next_payment_date: "Next payment",
};

const ALL = "all";
/** The plot endpoint's own page cap. */
const ALLOCATED_PLOTS_LIMIT = 200;

const HEAD =
  "whitespace-nowrap border-b px-2.5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground first:text-left";
const CELL = "px-2.5 py-2.5 text-right align-top";

const TONE_CLASS: Record<PurchaseTone, string> = {
  good: "bg-emerald-500/10 text-emerald-600",
  warn: "bg-amber-500/10 text-amber-600",
  bad: "bg-rose-500/10 text-rose-600",
  neutral: "bg-muted text-foreground",
};

function shortDate(value: string | Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** A second, smaller line under a cell's main value. */
function Sub({ children }: { children: React.ReactNode }) {
  return <span className="block text-[10px] font-normal text-muted-foreground">{children}</span>;
}

const SORT_FIELD_SET = new Set<string>(SUBSCRIBER_SORT_FIELDS);
const TYPE_SET = new Set<string>(SUBSCRIBER_TYPES);

/**
 * The Customers tab — the design's "Customer land position" table: who bought
 * what on this estate, the state of the purchase, what happens to the land,
 * and which plot (if any) they have been given.
 *
 * Two reads, joined by plan id:
 *  - GET /admin/assets/:id/subscribers   one row per payment plan — buyer,
 *    product, size, payments and plan status.
 *  - GET /admin/assets/:id/plots?allocation=allocated   the allocated plots
 *    and the plan each belongs to; this is the only source of the Allocation
 *    column.
 *
 * The design's six columns are kept. What the old twelve-column list showed
 * (referrer, tenor, paid, balance, progress, next payment, date joined) is
 * still here, as the smaller second line in the cell it belongs to. See
 * `customerLandPosition` for how each state is worked out.
 *
 * Filters live in the URL, like every other list in the app — a link to a
 * filtered view works, and `Pagination` reads `page` from there.
 */
export function AssetSubscribers({ assetId }: { assetId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const rawType = searchParams.get("subscriber_type");
  const subscriberType =
    rawType && TYPE_SET.has(rawType) ? (rawType as SubscriberType) : null;
  const rawSort = searchParams.get("sort_by");
  const sortBy: SubscriberSortField = rawSort && SORT_FIELD_SET.has(rawSort)
    ? (rawSort as SubscriberSortField)
    : "created_at";
  const sortDir: "asc" | "desc" = searchParams.get("sort_dir") === "asc" ? "asc" : "desc";
  const search = searchParams.get("q") ?? "";

  const setParams = (next: Record<string, string | null>, resetPage = true) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    });
    if (resetPage) params.set("page", "1");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Typing shouldn't rewrite the URL per keystroke, so the box holds its own
  // value and pushes to the URL once the user pauses. Seeded from the URL on
  // mount; nothing else writes `q`, so it never needs syncing back.
  const [searchTerm, setSearchTerm] = useState(search);
  useEffect(() => {
    if (searchTerm === search) return;
    const timer = setTimeout(() => setParams({ q: searchTerm || null }), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, search]);

  const permissions = useAdminPermissions();
  const canView = permissions.has("view_asset_subscribers");
  const canExport = permissions.has("export_asset_subscribers");
  // The plot inventory sits behind its own permission.
  const canViewPlots = permissions.has("view_field_performance");

  const filters: AssetSubscribersFilters = {
    page,
    limit: DEFAULT_SUBSCRIBERS_LIMIT,
    q: search,
    subscriberType,
    sortBy,
    sortDir,
  };

  const { data, isLoading, isFetching, error } = useAssetSubscribers(assetId, {
    ...filters,
    enabled: canView,
  });
  const allocated = usePlotInventory(
    assetId,
    { allocation: "allocated", limit: ALLOCATED_PLOTS_LIMIT },
    { enabled: canView && canViewPlots }
  );
  const exportMutation = useExportAssetSubscribers(assetId);

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-medium">You do not have permission to view this asset&apos;s subscribers.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            An admin can grant the view_asset_subscribers permission.
          </p>
        </CardContent>
      </Card>
    );
  }

  const rows = data?.items ?? [];
  const total = data?.meta?.total ?? 0;
  const aggregates = data?.aggregates;

  const plotsByPlan = plotsByPlanId(allocated.data?.data.plots ?? []);
  // Known only when every allocated plot was read: with more than one page, a
  // plan with no match might still hold a plot on a page that wasn't fetched.
  const plotsKnown = Boolean(allocated.data) && (allocated.data?.meta.totalPages ?? 1) <= 1;

  const runExport = async () => {
    try {
      // The export covers the whole filter set, so page/limit are dropped —
      // only the filters and ordering carry over.
      await exportMutation.mutateAsync({ q: search, subscriberType, sortBy, sortDir });
      toast.success("Subscriber list downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not export subscribers");
    }
  };

  return (
    <div className="space-y-4">
      <DetailPanel
        title="Customer land position"
        description="Commercial status and physical allocation remain separate"
        flush
        action={
          canExport ? (
            <Button variant="outline" size="sm" disabled={exportMutation.isPending} onClick={runExport}>
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export CSV
                </>
              )}
            </Button>
          ) : null
        }
      >
        {aggregates ? (
          <div className="grid grid-cols-2 gap-px border-b bg-border sm:grid-cols-3 xl:grid-cols-6">
            {[
              ["Customers", aggregates.total_subscribers.toLocaleString()],
              ["Units sold", aggregates.units_sold.toLocaleString()],
              ["Land sold", `${aggregates.total_sqm.toLocaleString()} sqm`],
              ["Expected", formatNairaCompact(aggregates.earnings_expected)],
              ["Received", formatNairaCompact(aggregates.earnings_received)],
              ["Defaulted / suspended", `${aggregates.defaulted_count} / ${aggregates.suspended_count}`],
            ].map(([label, value]) => (
              <div key={label} className="bg-background px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex min-w-0 flex-col gap-2 border-b px-4 py-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:max-w-xs sm:flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Name, email or phone"
              className="h-9 pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select
            value={subscriberType ?? ALL}
            onValueChange={(value) => setParams({ subscriber_type: value === ALL ? null : value })}
          >
            <SelectTrigger className="h-9 w-full sm:w-44">
              <SelectValue placeholder="All subscribers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All subscribers</SelectItem>
              {SUBSCRIBER_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {SUBSCRIBER_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={`${sortBy}:${sortDir}`}
            onValueChange={(value) => {
              const [field, dir] = value.split(":");
              setParams({ sort_by: field, sort_dir: dir });
            }}
          >
            <SelectTrigger className="h-9 w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUBSCRIBER_SORT_FIELDS.flatMap((field) => [
                <SelectItem key={`${field}:desc`} value={`${field}:desc`}>
                  {SORT_LABELS[field]} — high to low
                </SelectItem>,
                <SelectItem key={`${field}:asc`} value={`${field}:asc`}>
                  {SORT_LABELS[field]} — low to high
                </SelectItem>,
              ])}
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <div className="py-12 text-center">
            <p className="font-medium">Could not load subscribers for this asset.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "An unexpected error occurred."}
            </p>
          </div>
        ) : isLoading ? (
          <div className="p-4">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-medium">No subscribers match these filters.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nobody has bought into this asset under the current filter.
            </p>
          </div>
        ) : (
          <div className={cn("overflow-x-auto", isFetching && "opacity-60 transition-opacity")}>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40">
                  <th className={HEAD}>Customer</th>
                  <th className={HEAD}>Product</th>
                  <th className={HEAD}>Size</th>
                  <th className={HEAD}>Purchase state</th>
                  <th className={HEAD}>Land treatment</th>
                  <th className={HEAD}>Allocation</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <CustomerRow key={row.plan_id} row={row} plotsByPlan={plotsByPlan} plotsKnown={plotsKnown} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DetailPanel>

      {rows.length > 0 ? <Pagination count={total} currentIdx={page} limit={DEFAULT_SUBSCRIBERS_LIMIT} /> : null}
    </div>
  );
}

function CustomerRow({
  row,
  plotsByPlan,
  plotsKnown,
}: {
  row: SubscriberRow;
  plotsByPlan: ReadonlyMap<string, string[]>;
  plotsKnown: boolean;
}) {
  const position = customerLandPosition(row, plotsByPlan, plotsKnown);
  const name = row.buyer_name || row.buyer_email || "—";
  const joined = shortDate(row.createdAt);
  const nextPayment = shortDate(row.next_payment_date);

  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/40">
      <td className="px-2.5 py-2.5 text-left align-top">
        {row.buyer_id ? (
          <Link href={`/users/${row.buyer_id}`} className="font-semibold hover:underline">
            {name}
          </Link>
        ) : (
          <span className="font-semibold">{name}</span>
        )}
        <Sub>
          {[row.buyer_name ? row.buyer_email || row.buyer_phone : row.buyer_phone, joined ? `joined ${joined}` : null]
            .filter(Boolean)
            .join(" · ")}
        </Sub>
        {row.referrer_name ? <Sub>Referred by {row.referrer_name}</Sub> : null}
      </td>

      <td className={CELL}>
        {position.product ?? "—"}
        <Sub>{row.month_subscription ? `${row.month_subscription} months` : "Outright"}</Sub>
      </td>

      <td className={cn(CELL, "whitespace-nowrap tabular-nums")}>
        {row.size != null ? `${row.size.toLocaleString()} sqm` : "—"}
        {row.no_of_units > 1 ? <Sub>{row.no_of_units} units</Sub> : null}
      </td>

      <td className={CELL}>
        <span
          className={cn(
            "inline-block rounded-full px-2 py-1 text-[10px] font-semibold",
            TONE_CLASS[position.purchaseState.tone]
          )}
        >
          {position.purchaseState.label}
        </span>
        <span className="mt-1 block text-[10px] tabular-nums text-muted-foreground">
          {formatNairaCompact(row.amount_paid)} of {formatNairaCompact(row.amount_payable)} ·{" "}
          {paymentPercentage(row).toFixed(0)}% paid
        </span>
        {row.balance > 0 ? (
          <Sub>
            {formatNairaCompact(row.balance)} owed{nextPayment ? ` · next ${nextPayment}` : ""}
          </Sub>
        ) : null}
      </td>

      <td className={CELL}>
        {position.landTreatment ?? (
          <span
            className="text-muted-foreground"
            title="Whether a cancelled or closed plan's land was released or kept is not reported for this list"
          >
            —
          </span>
        )}
      </td>

      <td className={CELL}>
        {position.allocation === "awaiting" ? (
          <span className="text-muted-foreground">Awaiting allocation</span>
        ) : position.allocation ? (
          <span className="font-semibold">{position.allocation.join(", ")}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
}
