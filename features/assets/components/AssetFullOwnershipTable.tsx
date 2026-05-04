"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAssetIdStore } from "@/store/assetid-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { graphql, FragmentType, useFragment } from "@/lib/gql";

import { AssetFullOwnershipTable_AssetFragment } from "@/lib/gql/graphql";

export const AssetFullOwnershipTableFragment = graphql(`
  fragment AssetFullOwnershipTable_asset on Asset {
    _id
    asset_name
    asset_location
    sold
    asset_type
    collectionEfficiencyRate
    asset_option {
      size
      unit
      zero_months
    }
  }
`);

function transformAssetData(data: AssetFullOwnershipTable_AssetFragment) {
  const options = data.asset_option?.filter((opt): opt is NonNullable<typeof opt> => opt !== null && opt !== undefined) || [];

  return {
    id: data._id,
    name: data.asset_name,
    availableSizes: options.map((opt) => `${opt.size}sqm`).join(", ") || "",
    location: data.asset_location || "",
    status: data.sold === true ? "Sold" : "Active",
    unitsAvailable: options.reduce((total, opt) => total + Number(opt.unit || 0), 0) || 0,
    minPrice: options.length > 0 ? Math.min(...options.map((opt) => opt.zero_months || 0)) : 0,
    maxPrice: options.length > 0 ? Math.max(...options.map((opt) => opt.zero_months || 0)) : 0,
    efficiency: data.collectionEfficiencyRate ?? 0,
  };
}

interface Props {
  data: FragmentType<typeof AssetFullOwnershipTableFragment>[];
}

export function FullOwnershipAssetsTable({ data }: Props) {
  const { updateAssetId } = useAssetIdStore();
  const assets = useFragment(AssetFullOwnershipTableFragment, data);
  const fullOwnershipNewAssets = assets.filter(
    (asset) => asset != null && asset.asset_type === "full-ownership" && (asset.asset_option?.length || 0) > 0
  );

  const transformedFullOwnershipNewAssets = fullOwnershipNewAssets.map((asset) =>
    transformAssetData(asset)
  );

  return (
    <div className="rounded-xl border bg-background overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 w-[20%]">Asset Name</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 hidden md:table-cell">Location</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 hidden sm:table-cell">Status</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 hidden lg:table-cell">Available Sizes</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 hidden lg:table-cell text-center">Units</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">Pricing (₦)</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 text-right">Health</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transformedFullOwnershipNewAssets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground italic">
                No active assets found.
              </TableCell>
            </TableRow>
          ) : (
            transformedFullOwnershipNewAssets.map((asset) => (
              <TableRow key={asset.id} className="group hover:bg-muted/30 transition-colors">
                <TableCell
                  className="font-bold text-slate-900 group-hover:text-primary transition-colors cursor-pointer"
                  onClick={() => {
                    updateAssetId(asset.id || "");
                    window.location.href = `/assets/fullownership/${asset.name}`;
                  }}
                >
                  {asset.name}
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-500 hidden md:table-cell uppercase tracking-tight"> {asset.location} </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-sm border ${
                    asset.status?.toLowerCase() === "active" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-white border-slate-200 text-slate-500"
                  }`}>
                    {asset.status}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-bold tabular-nums hidden lg:table-cell"> {asset.availableSizes} </TableCell>
                <TableCell className="text-xs font-bold tabular-nums text-center hidden lg:table-cell"> {asset.unitsAvailable} </TableCell>
                <TableCell className="text-[10px] font-medium text-slate-600">
                  {asset.minPrice.toLocaleString("en-NG", {
                    style: "currency",
                    currency: "NGN",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tabular-nums">{asset.efficiency.toFixed(1)}%</span>
                    <div
                      className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={asset.efficiency}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Collection Efficiency"
                    >
                      <div
                        className={cn(
                          "h-full transition-all duration-1000 ease-in-out",
                          asset.efficiency > 85 ? "bg-emerald-500" : asset.efficiency > 60 ? "bg-amber-500" : "bg-rose-500"
                        )}
                        style={{ width: `${asset.efficiency}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/assets/fullownership/${asset.name}`}
                          onClick={() => updateAssetId(asset.id || "")}
                        >
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/assets/fullownership/${asset.name}/edit`}
                          onClick={() => updateAssetId(asset.id || "")}
                        >
                          Modify Asset
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
