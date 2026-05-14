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

import { AssetFlexTable_AssetFragment } from "@/lib/gql/graphql";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

export const AssetFlexTableFragment = graphql(`
  fragment AssetFlexTable_asset on Asset {
    _id
    asset_name
    asset_location
    sold
    asset_type
    collectionEfficiencyRate
    asset_option {
      size
      unit
      price
      flex_payment_plans {
        price
        unit
      }
    }
  }
`);

function transformAssetData(data: AssetFlexTable_AssetFragment) {
  const options = data.asset_option?.filter((opt): opt is NonNullable<typeof opt> => opt !== null && opt !== undefined) || [];

  return {
    id: data._id,
    name: data.asset_name,
    availableSizes: options.map((opt) => `${opt.size}sqm`).join(", ") || "",
    location: data.asset_location || "",
    status: data.sold === true ? "Sold" : "Active",
    unitsAvailable: options.reduce((total, opt) => {
      if (opt.flex_payment_plans && opt.flex_payment_plans.length > 0) {
        const optionUnits = opt.flex_payment_plans.reduce(
          (sum, plan) => sum + (plan?.unit || 0),
          0
        );
        return total + optionUnits;
      }
      return total + (opt.unit ? Number(opt.unit) : 0);
    }, 0) || 0,
    minPrice: options.length > 0 ? Math.min(
      ...options.flatMap((opt) => {
        if (opt.flex_payment_plans && opt.flex_payment_plans.length > 0) {
          return opt.flex_payment_plans.map((plan) => plan?.price || 0);
        }
        return [opt.price || 0];
      })
    ) : 0,
    maxPrice: options.length > 0 ? Math.max(
      ...options.flatMap((opt) => {
        if (opt.flex_payment_plans && opt.flex_payment_plans.length > 0) {
          return opt.flex_payment_plans.map((plan) => plan?.price || 0);
        }
        return [opt.price || 0];
      })
    ) : 0,
    efficiency: data.collectionEfficiencyRate ?? 0,
  };
}

interface Props {
  data: FragmentType<typeof AssetFlexTableFragment>[];
}

export function FlexAssetsTable({ data }: Props) {
  const { updateAssetId } = useAssetIdStore();

  // Unwrap the array of fragments
  const assets = useFragment(AssetFlexTableFragment, data);

  // Filter for flex assets (logic from legacy)
  const flexNewAsset = assets.filter(
    (asset) => asset != null && asset.asset_type === "flex" && (asset.asset_option?.length || 0) > 0
  );

  const transformedFlexNewAsset = flexNewAsset.map((asset) =>
    transformAssetData(asset)
  );

  return (
    <>
      <AdminMobileStack className="space-y-3">
        {transformedFlexNewAsset.length === 0 ? (
          <p className="rounded-xl border bg-background py-8 text-center text-muted-foreground italic">No active assets found.</p>
        ) : (
          transformedFlexNewAsset.map((asset) => (
            <AdminMobileCard key={asset.id} title={asset.name} subtitle={asset.location}>
              <AdminMobileField label="Status" value={asset.status} />
              <AdminMobileField label="Sizes" value={asset.availableSizes} />
              <AdminMobileField label="Units" value={asset.unitsAvailable} />
              <AdminMobileField
                label="Pricing"
                value={
                  asset.minPrice === asset.maxPrice
                    ? asset.minPrice.toLocaleString("en-NG", {
                        style: "currency",
                        currency: "NGN",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                    : `${asset.minPrice.toLocaleString("en-NG", {
                        style: "currency",
                        currency: "NGN",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })} – ${asset.maxPrice.toLocaleString("en-NG", {
                        style: "currency",
                        currency: "NGN",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}`
                }
              />
              <AdminMobileField label="Health" value={`${asset.efficiency.toFixed(1)}%`} />
              <div className="flex gap-2 border-t border-border pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/assets/flex/${asset.name}`} onClick={() => updateAssetId(asset.id || "")}>
                    View
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/assets/flex/${asset.name}/edit`} onClick={() => updateAssetId(asset.id || "")}>
                    Edit
                  </Link>
                </Button>
              </div>
            </AdminMobileCard>
          ))
        )}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
    <div className="min-w-0 overflow-x-auto rounded-xl border bg-background shadow-sm">
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
            <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transformedFlexNewAsset.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground italic">
                No active assets found.
              </TableCell>
            </TableRow>
          ) : (
            transformedFlexNewAsset.map((asset) => (
              <TableRow key={asset.id} className="group hover:bg-muted/30 transition-colors">
                <TableCell className="max-w-40 cursor-pointer font-bold wrap-break-word text-slate-900 transition-colors group-hover:text-primary" onClick={() => { updateAssetId(asset.id || ""); window.location.href = `/assets/flex/${asset.name}`; }}>
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
                <TableCell className="text-xs font-medium tabular-nums text-slate-600 wrap-break-word sm:whitespace-nowrap">
                  {asset.minPrice === asset.maxPrice
                    ? asset.minPrice.toLocaleString("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0, maximumFractionDigits: 0 })
                    : `${asset.minPrice.toLocaleString("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0, maximumFractionDigits: 0 })} – ${asset.maxPrice.toLocaleString("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                  }
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{asset.efficiency.toFixed(1)}%</span>
                    <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
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
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/assets/flex/${asset.name}`}
                          onClick={() => updateAssetId(asset.id || "")}
                        >
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/assets/flex/${asset.name}/edit`}
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
      </AdminDesktopTableWrap>
    </>
  );
}
