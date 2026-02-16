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

export const AssetFlexTableFragment = graphql(`
  fragment AssetFlexTable_asset on Asset {
    _id
    asset_name
    asset_location
    sold
    asset_type
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
              <TableHead>Actions</TableHead>
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
                      href={`/assets/flex/${asset.name}`}
                      className="block w-full h-full"
                      onClick={() => updateAssetId(asset.id || "")}
                    >
                      {asset.name}
                    </Link>
                  </TableCell>
                  <TableCell>{asset.availableSizes}</TableCell>
                  <TableCell>{asset.location}</TableCell>
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
                  <TableCell>{asset.unitsAvailable}</TableCell>
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
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem asChild>
                          <Link href={`/assets/flex/${asset.name}`}>View</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/assets/flex/${asset.name}/edit`}
                            onClick={() => updateAssetId(asset.id || "")}
                          >
                            Edit
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
    </div>
  );
}
