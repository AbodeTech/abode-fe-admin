"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useSalesAssetBreakdown, type SalesAnalyticsFilters } from "@/features/analytics";

interface AssetBreakdownProps {
  filters: SalesAnalyticsFilters;
}

export function AssetBreakdown({ filters }: AssetBreakdownProps) {
  const { data, isLoading, error } = useSalesAssetBreakdown(filters);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (isLoading) {
    return <div className="h-[360px] w-full animate-pulse bg-muted rounded-xl mx-6 mb-8" />;
  }

  if (error) {
    return (
      <div className="mx-6 mb-8 rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
        <h3 className="font-semibold">Unable to load asset breakdown</h3>
        <p className="text-sm">{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  const assets = data || [];

  const topAssets = [...assets]
    .sort((a, b) => {
      const aEfficiency = (Number(a?.expected_amount || 0) > 0)
        ? Number(a?.total_received || 0) / Number(a?.expected_amount || 0)
        : 0;
      const bEfficiency = (Number(b?.expected_amount || 0) > 0)
        ? Number(b?.total_received || 0) / Number(b?.expected_amount || 0)
        : 0;
      return bEfficiency - aEfficiency;
    })
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-8 px-6 py-8 bg-muted/30">
      <div>
        <div className="flex flex-col gap-1 mb-6">
          <h3 className="text-xl font-bold tracking-tight">Top Performing Assets</h3>
          <p className="text-xs text-muted-foreground italic">
            Ranked by collection efficiency for selected filters.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topAssets.length > 0 ? topAssets.map((asset) => {
            const expected = Number(asset?.expected_amount || 0);
            const received = Number(asset?.total_received || 0);
            const performance = expected > 0 ? Math.min(Math.round((received / expected) * 100), 100) : 0;

            return (
              <div key={asset.asset_id} className="flex flex-col gap-4 p-5 bg-background rounded-xl border shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-base">{asset?.asset_name || "-"}</h4>
                    <p className="text-xs text-muted-foreground">{asset?.asset_location || "Unknown location"}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase">{asset?.asset_type || "N/A"}</Badge>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Collection Rate</span>
                    <span className="font-bold">{performance}%</span>
                  </div>
                  <Progress value={performance} className="h-1.5" />
                </div>
                <div className="flex justify-between items-end mt-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Received</span>
                    <span className="text-sm font-bold">{formatCurrency(received)}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-right">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Expected</span>
                    <span className="text-sm font-medium">{formatCurrency(expected)}</span>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full rounded-xl border bg-background p-6 text-center text-sm text-muted-foreground">
              No asset breakdown data available for current filters.
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold tracking-tight">Full Asset Inventory Breakdown</h3>
          </div>
          <span className="text-sm text-muted-foreground">Showing {assets.length} assets</span>
        </div>
        <div className="rounded-xl border bg-background overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold py-4">Asset Name</TableHead>
                <TableHead className="font-bold">Type</TableHead>
                <TableHead className="font-bold">Location</TableHead>
                <TableHead className="font-bold">Collection Efficiency</TableHead>
                <TableHead className="font-bold">Buyers</TableHead>
                <TableHead className="text-right font-bold pr-6">Outstanding Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length > 0 ? assets.map((asset) => {
                const expected = Number(asset?.expected_amount || 0);
                const received = Number(asset?.total_received || 0);
                const efficiency = expected > 0 ? Math.min(Math.round((received / expected) * 100), 100) : 0;

                return (
                  <TableRow key={asset.asset_id} className="hover:bg-muted/20">
                    <TableCell className="font-medium py-4">{asset?.asset_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">{asset?.asset_type || "N/A"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium">{asset?.asset_location || "Unknown"}</TableCell>
                    <TableCell className="min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${efficiency}%` }} />
                        </div>
                        <span className="text-xs font-bold tabular-nums">{efficiency}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{Number(asset?.total_buyers || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold pr-6">{formatCurrency(Number(asset?.outstanding_balance || 0))}</TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No asset data available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
