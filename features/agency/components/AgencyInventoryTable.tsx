"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

import { useAgencyInventory } from "../hooks/use-agency-performance";

const naira = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

/**
 * The agency's "inventory": land its clients bought, per asset (item 7).
 * Agencies own no land on the BE, so this is the only meaning it can have.
 */
export function AgencyInventoryTable({ agencyId }: { agencyId: string }) {
  const { data, isLoading, error } = useAgencyInventory(agencyId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        Couldn&apos;t load this agency&apos;s inventory.
      </p>
    );
  }

  const rows = [...(data ?? [])].sort((a, b) => b.sqm_sold - a.sqm_sold);
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">This agency&apos;s clients haven&apos;t bought any land yet.</p>;
  }

  const collected = (row: (typeof rows)[number]) =>
    row.expected_amount > 0 ? `${Math.round((row.total_received / row.expected_amount) * 100)}%` : "—";

  return (
    <>
      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Land sold</TableHead>
              <TableHead>Buyers</TableHead>
              <TableHead>Sales value</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Outstanding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.asset_id}>
                <TableCell className="whitespace-normal">
                  <p className="font-medium">{row.asset_name ?? "Unknown asset"}</p>
                  <p className="text-xs text-muted-foreground">{row.asset_location ?? "—"}</p>
                </TableCell>
                <TableCell className="tabular-nums">{row.sqm_sold.toLocaleString()} sqm</TableCell>
                <TableCell className="tabular-nums">{row.total_buyers.toLocaleString()}</TableCell>
                <TableCell className="tabular-nums">{naira(row.expected_amount)}</TableCell>
                <TableCell className="tabular-nums">
                  {naira(row.total_received)}
                  <span className="ml-1 text-xs text-muted-foreground">({collected(row)})</span>
                </TableCell>
                <TableCell className="tabular-nums">{naira(row.outstanding_balance)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDesktopTableWrap>

      <AdminMobileStack>
        {rows.map((row) => (
          <AdminMobileCard key={row.asset_id} title={row.asset_name ?? "Unknown asset"} subtitle={row.asset_location ?? undefined}>
            <AdminMobileField label="Land sold" value={`${row.sqm_sold.toLocaleString()} sqm`} />
            <AdminMobileField label="Buyers" value={row.total_buyers.toLocaleString()} />
            <AdminMobileField label="Sales value" value={naira(row.expected_amount)} />
            <AdminMobileField label="Received" value={`${naira(row.total_received)} (${collected(row)})`} />
            <AdminMobileField label="Outstanding" value={naira(row.outstanding_balance)} />
          </AdminMobileCard>
        ))}
      </AdminMobileStack>
    </>
  );
}
