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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/shared/Pagination";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/utils/format";

import {
  DEFAULT_SUBSCRIBERS_LIMIT,
  useAssetSubscribers,
  type AssetSubscribersFilters,
} from "../../hooks/use-asset-subscribers";
import { useExportAssetSubscribers } from "../../hooks/use-export-asset-subscribers";
import {
  SUBSCRIBER_SORT_FIELDS,
  SUBSCRIBER_TYPES,
  SUBSCRIBER_TYPE_LABELS,
  paymentPercentage,
  type SubscriberRow,
  type SubscriberSortField,
  type SubscriberType,
} from "../../schemas/asset-subscribers.schema";

const SORT_LABELS: Record<SubscriberSortField, string> = {
  created_at: "Date joined",
  amount_paid: "Amount paid",
  balance: "Balance",
  asset_price: "Asset price",
  next_payment_date: "Next payment",
};

const ALL = "all";

function formatDate(value: string | Date | null): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-NG");
}

function StatusBadge({ row }: { row: Pick<SubscriberRow, "status" | "is_defaulted" | "is_suspended"> }) {
  const tone = row.is_suspended
    ? "bg-gray-200 text-gray-700"
    : row.is_defaulted
      ? "bg-rose-100 text-rose-800"
      : "bg-blue-100 text-blue-800";

  return (
    <span className={cn("whitespace-nowrap rounded-full px-2 py-1 text-xs capitalize", tone)}>
      {row.status || "—"}
    </span>
  );
}

function ProgressCell({ row }: { row: Pick<SubscriberRow, "payment_percentage"> }) {
  const pct = paymentPercentage(row);
  return (
    <div className="flex min-w-24 items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums">{pct.toFixed(0)}%</span>
    </div>
  );
}

const SORT_FIELD_SET = new Set<string>(SUBSCRIBER_SORT_FIELDS);
const TYPE_SET = new Set<string>(SUBSCRIBER_TYPES);

/**
 * Filters live in the URL, like every other list in the app — a link to a
 * filtered subscriber view works, and `Pagination` reads `page` from there
 * rather than taking a callback.
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
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Name, email or phone"
            className="h-9 pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
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

          {canExport && (
            <Button
              variant="outline"
              className="h-9 w-full shrink-0 sm:w-auto"
              disabled={exportMutation.isPending}
              onClick={runExport}
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-medium">Could not load subscribers for this asset.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "An unexpected error occurred."}
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Skeleton className="h-80 w-full rounded-xl" />
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-medium">No subscribers match these filters.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nobody has bought into this asset under the current filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div
            className={cn(
              "overflow-x-auto rounded-xl border",
              isFetching && "opacity-60 transition-opacity"
            )}
          >
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Plan value</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Tenor</TableHead>
                  <TableHead>Next payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.plan_id}>
                    <TableCell className="min-w-40">
                      <div className="flex flex-col">
                        {row.buyer_id ? (
                          <Link
                            href={`/users/${row.buyer_id}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {row.buyer_name || row.buyer_email || "—"}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium">
                            {row.buyer_name || row.buyer_email || "—"}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {row.buyer_email || row.buyer_phone || ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{row.referrer_name || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm tabular-nums">
                      {row.size != null ? `${row.size.toLocaleString()} SQM` : "—"}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{row.no_of_units}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm tabular-nums">
                      {formatNaira(row.amount_payable)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm tabular-nums">
                      {formatNaira(row.amount_paid)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm tabular-nums">
                      {formatNaira(row.balance)}
                    </TableCell>
                    <TableCell>
                      <ProgressCell row={row} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm tabular-nums">
                      {row.month_subscription ? `${row.month_subscription} mo` : "Outright"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(row.next_payment_date)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge row={row} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(row.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination count={total} currentIdx={page} limit={DEFAULT_SUBSCRIBERS_LIMIT} />
        </>
      )}
    </div>
  );
}
