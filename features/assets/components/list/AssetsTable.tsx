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

import type { Asset } from "../../schemas/asset.schema";
import { AssetOffersCell } from "./AssetOffersCell";
import { AssetStatusBadges } from "./AssetStatusBadges";

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

function Inventory({ asset }: { asset: Asset }) {
  return (
    <span className="text-sm text-muted-foreground">
      {asset.sqm_inventory_active ? "SQM inventory active" : "SQM inventory not active"}
    </span>
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
                <TableCell className="max-w-[18rem] whitespace-normal wrap-break-word">
                  <AssetName asset={asset} />
                </TableCell>
                <TableCell className="max-w-[18rem] whitespace-normal wrap-break-word">
                  <AssetOffersCell offers={asset.offers} />
                </TableCell>
                <TableCell>
                  <Inventory asset={asset} />
                </TableCell>
                <TableCell>
                  <AssetStatusBadges
                    visibility={asset.visibility}
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
