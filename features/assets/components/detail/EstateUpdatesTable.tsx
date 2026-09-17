"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  ESTATE_UPDATE_AUDIENCE_LABELS,
  ESTATE_UPDATE_CATEGORY_LABELS,
  ESTATE_UPDATE_STATUS_LABELS,
  type EstateUpdate,
  type EstateUpdateStatus,
} from "../../schemas/estate-update.schema";
import { EstateUpdateActions } from "./EstateUpdateActions";

// Full literals per status, so Tailwind's JIT can see every class.
const STATUS_STYLES: Record<EstateUpdateStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  published: "bg-green-100 text-green-800",
  archived: "bg-orange-100 text-orange-800",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-NG");
}

function ProgressCell({ value }: { value: EstateUpdate["progress_percent"] }) {
  if (value === null) return <span className="text-sm text-muted-foreground">—</span>;
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="flex min-w-24 items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums">{pct}%</span>
    </div>
  );
}

/**
 * One estate's updates, drafts and archived included. Rows take the full
 * `EstateUpdate` because Edit hands the row to the form dialog, which fills
 * every field from it.
 *
 * The actions column only exists for `manage_estate_updates`, so a view-only
 * admin gets a read-only table rather than a column of empty cells.
 * `EstateUpdateActions` checks the permission again on its own; this just
 * decides whether the column is drawn.
 */
export function EstateUpdatesTable({
  assetId,
  rows,
  isFetching,
  canManage,
  onEdit,
}: {
  assetId: string;
  rows: EstateUpdate[];
  isFetching?: boolean;
  canManage: boolean;
  onEdit: (update: EstateUpdate) => void;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border",
        isFetching && "opacity-60 transition-opacity"
      )}
    >
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead>Headline</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Audience</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Published</TableHead>
            {canManage && <TableHead className="w-px" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="min-w-56 whitespace-normal">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{row.headline}</span>
                  {row.images.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {row.images.length} {row.images.length === 1 ? "image" : "images"}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {ESTATE_UPDATE_CATEGORY_LABELS[row.category]}
              </TableCell>
              <TableCell>
                <ProgressCell value={row.progress_percent} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {ESTATE_UPDATE_AUDIENCE_LABELS[row.audience]}
              </TableCell>
              <TableCell>
                <Badge className={cn("font-normal", STATUS_STYLES[row.status])}>
                  {ESTATE_UPDATE_STATUS_LABELS[row.status]}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {formatDate(row.published_at)}
              </TableCell>
              {canManage && (
                <TableCell className="text-right">
                  <EstateUpdateActions
                    assetId={assetId}
                    update={row}
                    isFetching={isFetching}
                    onEdit={() => onEdit(row)}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
