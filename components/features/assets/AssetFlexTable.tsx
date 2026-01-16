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
import { AdminAsset } from "@/lib/api/admin/assets";

function transformAssetData(asset: AdminAsset) {
  return {
    id: asset._id,
    name: asset.asset_name,
    availableSizes: asset.asset_option.map((opt) => `${opt.size}sqm`).join(", "),
    location: asset.asset_location,
    status: asset.sold === "true" ? "Sold" : "Active",
    unitsAvailable: asset.asset_option.reduce((total, opt) => {
      // If flex_payment_plans exists, sum up units from all payment plans
      if (opt.flex_payment_plans && opt.flex_payment_plans.length > 0) {
        const optionUnits = opt.flex_payment_plans.reduce(
          (sum, plan) => sum + plan.unit,
          0
        );
        return total + optionUnits;
      }
      // Fallback to opt.unit for legacy data or full ownership
      return total + (opt.unit || 0);
    }, 0),
    minPrice: Math.min(
      ...asset.asset_option.flatMap((opt) => {
        // If flex_payment_plans exists, get prices from payment plans
        if (opt.flex_payment_plans && opt.flex_payment_plans.length > 0) {
          return opt.flex_payment_plans.map((plan) => plan.price);
        }
        // Fallback to opt.price for legacy data or full ownership
        return [opt.price || 0];
      })
    ),
    maxPrice: Math.max(
      ...asset.asset_option.flatMap((opt) => {
        // If flex_payment_plans exists, get prices from payment plans
        if (opt.flex_payment_plans && opt.flex_payment_plans.length > 0) {
          return opt.flex_payment_plans.map((plan) => plan.price);
        }
        // Fallback to opt.price for legacy data or full ownership
        return [opt.price || 0];
      })
    ),
  };
}

interface Props {
  data: AdminAsset[];
}

export function FlexAssetsTable({ data }: Props) {
  // Filter for flex assets (logic from legacy)
  const flexNewAsset = data.filter(
    (asset) => asset.asset_type === "flex" && asset.asset_option.length > 0
  );

  const transformedFlexNewAsset = flexNewAsset.map((asset) =>
    transformAssetData(asset)
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Flex Assets</h2>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset Name</TableHead>
              <TableHead>Available Sizes</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Units Available</TableHead>
              <TableHead>Min. Price (₦)</TableHead>
              <TableHead>Max. Price (₦)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transformedFlexNewAsset.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              transformedFlexNewAsset.map((asset) => (
                <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link
                      href={`/assets/flex/${asset.id}`}
                      className="block w-full h-full"
                    >
                      {asset.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {asset.availableSizes}
                  </TableCell>
                  <TableCell>
                    {asset.location}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${asset.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                        }`}
                    >
                      {asset.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {asset.unitsAvailable}
                  </TableCell>
                  <TableCell>
                    {asset.minPrice.toLocaleString("en-NG", {
                      style: "currency",
                      currency: "NGN",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </TableCell>
                  <TableCell>
                    {asset.maxPrice.toLocaleString("en-NG", {
                      style: "currency",
                      currency: "NGN",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
