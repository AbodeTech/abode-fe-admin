"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import { useAssetDetail } from "../../hooks/use-asset-detail";
import {
  DEFAULT_ESTATE_UPDATES_LIMIT,
  useEstateUpdates,
} from "../../hooks/use-estate-updates";
import {
  ESTATE_UPDATE_STATUSES,
  ESTATE_UPDATE_STATUS_LABELS,
  type EstateUpdate,
  type EstateUpdateStatus,
} from "../../schemas/estate-update.schema";
import { EstateUpdateFormDialog } from "./EstateUpdateFormDialog";
import { EstateUpdatesTable } from "./EstateUpdatesTable";

const ALL = "all";

const STATUS_SET = new Set<string>(ESTATE_UPDATE_STATUSES);

/**
 * The Updates tab: progress posts on this one estate. There is deliberately no
 * list across estates; an update is always written from the estate it is about.
 *
 * Status and page live in the URL, like the Customers tab, so a filtered view
 * can be linked and `Pagination` reads `page` from there.
 *
 * Two permissions. `view_estate_updates` gates the tab's content (the tab
 * itself stays in the nav, as every asset tab does). `manage_estate_updates`
 * adds New update, the form dialog and the row actions. Status only moves
 * through the row actions; the form never touches it.
 */
export function AssetEstateUpdates({ assetId }: { assetId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const rawStatus = searchParams.get("status");
  const status =
    rawStatus && STATUS_SET.has(rawStatus) ? (rawStatus as EstateUpdateStatus) : null;

  const setParams = (next: Record<string, string | null>, resetPage = true) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    });
    if (resetPage) params.set("page", "1");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const permissions = useAdminPermissions();
  const canView = permissions.has("view_estate_updates");
  const canManage = permissions.has("manage_estate_updates");

  const { data, isLoading, isFetching, error } = useEstateUpdates(assetId, {
    page,
    status,
    enabled: canView,
  });
  // Same cache entry the detail shell already filled, so this costs no
  // request. The form uses the name to catch a headline that repeats it.
  const { data: asset } = useAssetDetail(assetId);
  const assetName = asset?.name ?? null;

  // A page past the end comes back empty with a non-zero total: a stale
  // ?page= link, or publishing or archiving the last row on a filtered page.
  // The empty state would then claim there are no updates and hide Pagination,
  // so step back to the last page that has rows instead.
  const total = data?.meta.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / DEFAULT_ESTATE_UPDATES_LIMIT));
  const pageOutOfRange = !!data && data.items.length === 0 && page > lastPage;

  useEffect(() => {
    if (pageOutOfRange) setParams({ page: String(lastPage) }, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageOutOfRange, lastPage]);

  // `update` is kept when the dialog closes, so its content doesn't blank out
  // mid close animation; opening always sets it afresh.
  const [dialog, setDialog] = useState<{ open: boolean; update: EstateUpdate | null }>({
    open: false,
    update: null,
  });

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-medium">You do not have permission to view this estate&apos;s updates.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            An admin can grant the view_estate_updates permission.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-lg">Estate updates</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Progress posts buyers see on their plot page and home feed.
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center md:w-auto">
          <Select
            value={status ?? ALL}
            onValueChange={(value) => setParams({ status: value === ALL ? null : value })}
          >
            <SelectTrigger className="h-9 w-full sm:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {ESTATE_UPDATE_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {ESTATE_UPDATE_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canManage && (
            <Button
              className="h-9 w-full shrink-0 sm:w-auto"
              onClick={() => setDialog({ open: true, update: null })}
            >
              <Plus className="mr-2 h-4 w-4" />
              New update
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="rounded-lg border bg-muted/30 py-12 text-center">
            <p className="font-medium">Couldn&apos;t load updates</p>
            <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
          </div>
        ) : isLoading || !data || pageOutOfRange ? (
          <Skeleton className="h-80 w-full rounded-xl" />
        ) : data.items.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <p className="font-medium">
              {status
                ? `No ${ESTATE_UPDATE_STATUS_LABELS[status].toLowerCase()} updates`
                : "No updates yet"}
            </p>
            {canManage && !status && (
              <p className="mt-1 text-sm text-muted-foreground">
                Post the first one with New update.
              </p>
            )}
          </div>
        ) : (
          <>
            <EstateUpdatesTable
              assetId={assetId}
              rows={data.items}
              isFetching={isFetching}
              canManage={canManage}
              onEdit={(update) => setDialog({ open: true, update })}
            />

            <Pagination
              count={total}
              currentIdx={page}
              limit={DEFAULT_ESTATE_UPDATES_LIMIT}
            />
          </>
        )}
      </CardContent>

      {canManage && (
        <EstateUpdateFormDialog
          assetId={assetId}
          assetName={assetName}
          open={dialog.open}
          update={dialog.update}
          onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        />
      )}
    </Card>
  );
}
