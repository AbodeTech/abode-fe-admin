"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAdminPermissions } from "@/hooks/use-admin-permission";

import { useAssetDetail } from "../../hooks/use-asset-detail";
import { useEstateUpdate } from "../../hooks/use-estate-updates";
import {
  ESTATE_UPDATE_AUDIENCE_LABELS,
  ESTATE_UPDATE_CATEGORY_LABELS,
  ESTATE_UPDATE_STATUS_LABELS,
  type EstateUpdate,
  type EstateUpdateStatus,
} from "../../schemas/estate-update.schema";
import { EstateUpdateActions } from "./EstateUpdateActions";
import { EstateUpdateFormDialog } from "./EstateUpdateFormDialog";

// Full literals per status, so Tailwind's JIT can see every class.
const STATUS_STYLES: Record<EstateUpdateStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  published: "bg-green-100 text-green-800",
  archived: "bg-orange-100 text-orange-800",
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-NG");
}

/**
 * One estate update, at full size. The list can only say "2 images", so this is
 * where an admin actually sees what a buyer will: every photo large, the whole
 * body, and the dates that matter (published, and whether plot holders were
 * emailed).
 *
 * Same permissions as the tab: `view_estate_updates` to read, and the row
 * actions gate themselves on `manage_estate_updates`.
 */
export function EstateUpdateDetail({
  assetId,
  updateId,
}: {
  assetId: string;
  updateId: string;
}) {
  const canView = useAdminPermissions().has("view_estate_updates");
  const { data, isLoading, isFetching, error } = useEstateUpdate(assetId, updateId, {
    enabled: canView,
  });
  // Already in the cache from the detail shell, so the estate name costs no request.
  const { data: asset } = useAssetDetail(assetId);
  const [editing, setEditing] = useState(false);

  const backHref = `/assets/${assetId}/updates`;

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-medium">You don&apos;t have access to estate updates</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask an administrator for the view_estate_updates permission.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to updates
      </Link>

      {error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-medium">Couldn&apos;t load this update</p>
            <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      ) : isLoading || !data ? (
        <Card>
          <CardContent className="py-6">
            <Skeleton className="h-96 w-full rounded-xl" />
          </CardContent>
        </Card>
      ) : (
        <Card className={cn(isFetching && "opacity-60 transition-opacity")}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-xl leading-snug break-words">{data.headline}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {asset?.name ? `${asset.name} · ` : ""}
                {ESTATE_UPDATE_CATEGORY_LABELS[data.category]} ·{" "}
                {ESTATE_UPDATE_AUDIENCE_LABELS[data.audience]}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge className={cn("font-normal", STATUS_STYLES[data.status])}>
                {ESTATE_UPDATE_STATUS_LABELS[data.status]}
              </Badge>
              <EstateUpdateActions
                assetId={assetId}
                update={data}
                isFetching={isFetching}
                onEdit={() => setEditing(true)}
              />
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            {data.progress_percent !== null && (
              <Progress value={data.progress_percent} />
            )}

            {data.body ? (
              <p className="whitespace-pre-line break-words text-sm leading-relaxed">{data.body}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No body text on this update.</p>
            )}

            <Photos headline={data.headline} images={data.images} />

            <dl className="grid grid-cols-1 gap-3 border-t pt-4 text-sm sm:grid-cols-2">
              <Fact label="Published" value={formatDateTime(data.published_at)} />
              <Fact
                label="Plot holders emailed"
                value={
                  data.notified_at ? formatDateTime(data.notified_at) : "Not emailed"
                }
              />
              <Fact label="Created" value={formatDateTime(data.created_at)} />
              <Fact label="Last edited" value={formatDateTime(data.updated_at)} />
            </dl>
          </CardContent>
        </Card>
      )}

      {data && (
        <EstateUpdateFormDialog
          assetId={assetId}
          assetName={asset?.name ?? ""}
          open={editing}
          update={data}
          onOpenChange={setEditing}
        />
      )}
    </div>
  );
}

function Progress({ value }: { value: number }) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium tabular-nums">{pct}%</span>
    </div>
  );
}

/**
 * The reason this page exists. Each photo opens in a new tab at full size —
 * the buyer app shows the same URLs, so what renders here is what they get.
 */
function Photos({ headline, images }: { headline: string; images: EstateUpdate["images"] }) {
  if (images.length === 0) {
    return <p className="text-sm text-muted-foreground">No photos on this update.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        {images.length} {images.length === 1 ? "photo" : "photos"}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {images.map((src, i) => (
          <a
            key={`${i}-${src}`}
            href={src}
            target="_blank"
            rel="noreferrer"
            className="group relative overflow-hidden rounded-lg border"
          >
            {/* Plain img: these are admin-uploaded URLs, and next/image only loads
                hosts listed in next.config remotePatterns. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${headline}, photo ${i + 1}`}
              loading="lazy"
              className="h-64 w-full bg-muted object-cover"
            />
            <span className="absolute right-2 top-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <ExternalLink className="h-4 w-4" />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

