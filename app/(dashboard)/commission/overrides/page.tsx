"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Info, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import {
  AssetOverrideDialog,
  OverrideFilters,
  OverridesTable,
  OVERRIDE_TYPES,
  RevokeOverrideDialog,
  SubjectOverrideDialog,
  useOverrides,
  type NormalisedOverride,
  type OfferType,
  type OverrideType,
} from "@/features/commission";

function isOverrideType(value: string | null): value is OverrideType {
  return value != null && (OVERRIDE_TYPES as readonly string[]).includes(value);
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function OverridesPageContent() {
  const searchParams = useSearchParams();

  const typeFilter = searchParams.get("type");
  const offerType = searchParams.get("offer_type");
  const includeInactive = searchParams.get("scope") === "all";
  const userId = searchParams.get("user_id") ?? undefined;
  const assetId = searchParams.get("asset_id") ?? undefined;

  // Which dialog is open, and the row it is editing (absent when creating).
  const [dialogType, setDialogType] = useState<OverrideType | null>(null);
  const [editing, setEditing] = useState<NormalisedOverride | undefined>();
  const [revoking, setRevoking] = useState<NormalisedOverride | null>(null);

  const { data, isLoading, error } = useOverrides({
    offer_type: (offerType as OfferType) ?? undefined,
    user_id: userId,
    asset_id: assetId,
    include_inactive: includeInactive,
  });

  // Type is filtered client-side: the backend has no `type` param — it returns
  // all three collections and applies one filter object to each.
  const rows = useMemo(() => {
    const all = data ?? [];
    return isOverrideType(typeFilter) ? all.filter((row) => row.type === typeFilter) : all;
  }, [data, typeFilter]);

  const hasAny = (data ?? []).length > 0;

  const openCreate = (type: OverrideType) => {
    setEditing(undefined);
    setDialogType(type);
  };

  // An override's own type decides which form can edit it.
  const openEdit = (override: NormalisedOverride) => {
    setEditing(override);
    setDialogType(override.type);
  };

  const closeDialog = () => {
    setDialogType(null);
    setEditing(undefined);
  };

  return (
    <>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Commission overrides</h1>
          <p className="text-muted-foreground">
            Special rates that beat the defaults, resolved most-specific-first: asset + referrer,
            then referrer, then asset. Changes apply to new payment plans only — existing plans keep
            the rate they were created with.
          </p>
        </div>
        <div className="w-full shrink-0 sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New override
              </Button>
            </DropdownMenuTrigger>
            {/* Ordered least to most specific, matching how they resolve. */}
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Applies to</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openCreate("asset")}>
                <span className="flex flex-col items-start">
                  <span>An asset</span>
                  <span className="text-xs text-muted-foreground">
                    Every referrer selling it
                  </span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreate("user")}>
                <span className="flex flex-col items-start">
                  <span>A referrer</span>
                  <span className="text-xs text-muted-foreground">All of their sales</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreate("asset-user")}>
                <span className="flex flex-col items-start">
                  <span>A referrer on one asset</span>
                  <span className="text-xs text-muted-foreground">Beats both of the above</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading overrides</h3>
          <p>{error.message}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <OverrideFilters />

          {userId ? (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Filtered to one referrer. Asset overrides are not referrer-specific, so they are
              excluded from these results even though they may still apply to this person&apos;s
              sales.
            </p>
          ) : null}

          <OverridesTable
            rows={rows}
            isLoading={isLoading}
            onEdit={openEdit}
            onRevoke={setRevoking}
            emptyState={
              hasAny ? (
                <EmptyState
                  title="No overrides match these filters"
                  body="Clear or widen the filters to see the rest."
                />
              ) : (
                <EmptyState
                  title="No special rates set"
                  body="Every referrer is earning the default rates from the rates page."
                />
              )
            }
          />
        </div>
      )}

      <AssetOverrideDialog
        open={dialogType === "asset"}
        onOpenChange={(next) => (next ? undefined : closeDialog())}
        override={editing}
      />
      <SubjectOverrideDialog
        type="user"
        open={dialogType === "user"}
        onOpenChange={(next) => (next ? undefined : closeDialog())}
        override={editing}
      />
      <SubjectOverrideDialog
        type="asset-user"
        open={dialogType === "asset-user"}
        onOpenChange={(next) => (next ? undefined : closeDialog())}
        override={editing}
      />
      <RevokeOverrideDialog
        override={revoking}
        onOpenChange={(next) => (next ? undefined : setRevoking(null))}
      />
    </>
  );
}

export default function CommissionOverridesPage() {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <Suspense fallback={<PageContentLoader label="Loading overrides…" />}>
        <OverridesPageContent />
      </Suspense>
    </div>
  );
}
