"use client";

import Link from "next/link";
import { MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

import { availableUnits, type Asset } from "../../schemas/asset.schema";
import { AssetOffersCell } from "./AssetOffersCell";
import { AssetStatusBadges } from "./AssetStatusBadges";

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Allocation from the asset's own counters — `sales_cap`, `sold_units` and
 * `reserved_units` are real fields and `available_units` is a backend virtual.
 * Unlike the analytics panels above the table, none of this is sample data.
 */
function Inventory({ asset }: { asset: Asset }) {
  const available = availableUnits(asset);
  const allocated = asset.sales_cap > 0 ? 1 - available / asset.sales_cap : 0;

  return (
    <div className="min-w-0 space-y-1">
      <p className="text-sm font-medium tabular-nums">
        {available.toLocaleString()}{" "}
        <span className="font-normal text-muted-foreground">
          of {asset.sales_cap.toLocaleString()} left
        </span>
      </p>

      <div className="h-1 w-full max-w-[9rem] overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/60"
          style={{ width: `${Math.min(100, Math.max(0, allocated * 100))}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground tabular-nums">
        {asset.sold_units.toLocaleString()} sold
        {asset.reserved_units > 0 ? ` · ${asset.reserved_units.toLocaleString()} reserved` : ""}
      </p>
    </div>
  );
}

function RowActions({ asset, onDelete }: { asset: Asset; onDelete: (asset: Asset) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${asset.name}`}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/assets/${asset._id}`}>View</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/assets/${asset._id}/edit`}>Edit</Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(asset)}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AssetName({ asset }: { asset: Asset }) {
  return (
    <div className="min-w-0">
      <Link
        href={`/assets/${asset._id}`}
        className="font-medium wrap-break-word hover:underline"
      >
        {asset.name}
      </Link>
      {asset.asset_location ? (
        <p className="truncate text-xs text-muted-foreground">{asset.asset_location}</p>
      ) : null}
    </div>
  );
}

interface AssetsTableProps {
  rows: Asset[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onDelete: (asset: Asset) => void;
}

export function AssetsTable({ rows, isLoading, emptyState, onDelete }: AssetsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) return <>{emptyState}</>;

  return (
    <>
      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Offers</TableHead>
              <TableHead>Inventory</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((asset) => (
              <TableRow key={asset._id}>
                <TableCell className="max-w-[18rem]">
                  <AssetName asset={asset} />
                </TableCell>
                <TableCell className="max-w-[18rem]">
                  <AssetOffersCell offers={asset.offers} />
                </TableCell>
                <TableCell>
                  <Inventory asset={asset} />
                </TableCell>
                <TableCell>
                  <AssetStatusBadges
                    visibility={asset.visibility}
                    sold={asset.sold}
                    deletedAt={asset.deleted_at}
                  />
                </TableCell>
                <TableCell className="text-sm tabular-nums whitespace-nowrap">
                  {formatDate(asset.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <RowActions asset={asset} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDesktopTableWrap>

      <AdminMobileStack>
        {rows.map((asset) => (
          <AdminMobileCard
            key={asset._id}
            title={<AssetName asset={asset} />}
            subtitle={
              <AssetStatusBadges
                visibility={asset.visibility}
                sold={asset.sold}
                deletedAt={asset.deleted_at}
              />
            }
          >
            <AdminMobileField label="Offers" value={<AssetOffersCell offers={asset.offers} />} />
            <AdminMobileField label="Inventory" value={<Inventory asset={asset} />} />
            <AdminMobileField label="Created" value={formatDate(asset.createdAt)} />
            <div className="flex justify-end pt-1">
              <RowActions asset={asset} onDelete={onDelete} />
            </div>
          </AdminMobileCard>
        ))}
      </AdminMobileStack>
    </>
  );
}
