"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const TOP_ASSETS = [
  { name: "Abode Heights Ph I", type: "Flex", location: "Epe, Lagos", received: 120000000, expected: 150000000, performance: 80 },
  { name: "Greenfield Estate", type: "Full Ownership", location: "Ibeju-Lekki", received: 95000000, expected: 100000000, performance: 95 },
  { name: "The Vantage Flex", type: "Flex", location: "Lekki Ph 1", received: 45000000, expected: 80000000, performance: 56 },
];

export function AssetBreakdown() {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="flex flex-col gap-8 px-6 py-8 bg-muted/30">
      <div>
        <div className="flex flex-col gap-1 mb-6">
          <h3 className="text-xl font-bold tracking-tight">Top Performing Assets</h3>
          <p className="text-xs text-muted-foreground italic">
            * Performance metrics exclude defaulted and terminated contracts.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TOP_ASSETS.map((asset) => (
            <div key={asset.name} className="flex flex-col gap-4 p-5 bg-background rounded-xl border shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-base">{asset.name}</h4>
                  <p className="text-xs text-muted-foreground">{asset.location}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] font-bold uppercase">{asset.type}</Badge>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Collection Rate</span>
                  <span className="font-bold">{asset.performance}%</span>
                </div>
                <Progress value={asset.performance} className="h-1.5" />
              </div>
              <div className="flex justify-between items-end mt-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Received</span>
                  <span className="text-sm font-bold">{formatCurrency(asset.received)}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5 text-right">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Expected</span>
                  <span className="text-sm font-medium">{formatCurrency(asset.expected)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold tracking-tight">Full Asset Inventory Breakdown</h3>
            <p className="text-xs text-muted-foreground italic">
              * Showing active and viable contributions only.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">Showing 12 assets</span>
        </div>
        <div className="rounded-xl border bg-background overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold py-4">Asset Name</TableHead>
                <TableHead className="font-bold">Type</TableHead>
                <TableHead className="font-bold">Location</TableHead>
                <TableHead className="font-bold">Collection Efficiency</TableHead>
                <TableHead className="text-right font-bold pr-6">Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-muted/20">
                  <TableCell className="font-medium py-4">Epe Heritage Gardens Ph {i + 1}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold">Flex</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-medium">Epe, Lagos</TableCell>
                  <TableCell className="min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: "72%" }} />
                      </div>
                      <span className="text-xs font-bold tabular-nums">72%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold pr-6">₦24,500,000</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
