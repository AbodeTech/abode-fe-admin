"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User as UserIcon, Calendar, Ban, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import type { MarketplaceListingAdmin } from "../hooks/use-marketplace-listings";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

interface MarketplaceListingsTableProps {
  data: MarketplaceListingAdmin[] | null | undefined;
  isLoading?: boolean;
  onSuspend?: (listing: MarketplaceListingAdmin) => void;
  onUnsuspend?: (listing: MarketplaceListingAdmin) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch {
    return "N/A";
  }
};

const statusStyles: Record<string, string> = {
  active: "bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]",
  pending_payment: "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]",
  pending_approval: "bg-[#FFF6ED] text-[#C4320A] border-[#F9DBAF]",
  sold: "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]",
  cancelled: "bg-[#F2F4F7] text-[#344054] border-[#E4E7EC]",
  expired: "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]",
  suspended: "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  pending_payment: "Pending Payment",
  pending_approval: "Pending Approval",
  sold: "Sold",
  cancelled: "Cancelled",
  expired: "Expired",
  suspended: "Suspended",
};

export function MarketplaceListingsTable({
  data,
  isLoading,
  onSuspend,
  onUnsuspend,
}: MarketplaceListingsTableProps) {
  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading listings...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings found</h3>
        <p className="text-gray-600 text-center max-w-md">
          There are no marketplace listings to display.
        </p>
      </div>
    );
  }

  return (
    <>
      <AdminMobileStack className="space-y-3">
        {data.map((listing) => (
          <AdminMobileCard
            key={listing._id}
            title={
              listing.seller ? `${listing.seller.lastName} ${listing.seller.firstName}` : "N/A"
            }
            subtitle={listing.asset?.asset_name || "N/A"}
          >
            <AdminMobileField label="Price" value={formatCurrency(listing.listing_price)} />
            <AdminMobileField label="Type" value={listing.asset_type} />
            <AdminMobileField label="Units" value={listing.no_of_units} />
            <AdminMobileField
              label="Status"
              value={
                <Badge variant="outline" className={`${statusStyles[listing.status] || statusStyles.cancelled} font-medium border`}>
                  {statusLabels[listing.status] || listing.status}
                </Badge>
              }
            />
            <AdminMobileField label="Listed" value={formatDate(listing.listed_at || listing.createdAt)} />
            <div className="flex justify-end gap-1 border-t border-border pt-2">
              {listing.status === "active" && onSuspend && (
                <Button variant="outline" size="sm" onClick={() => onSuspend(listing)}>
                  <Ban className="mr-1 h-4 w-4" />
                  Suspend
                </Button>
              )}
              {listing.status === "suspended" && onUnsuspend && (
                <Button variant="outline" size="sm" onClick={() => onUnsuspend(listing)}>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Unsuspend
                </Button>
              )}
            </div>
          </AdminMobileCard>
        ))}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
    <div className="min-w-0 w-full overflow-x-auto rounded-lg border border-[#E5EAEF]">
      <Table className="min-w-[720px]">
        <TableHeader className="border-b border-[#E5EAEF] bg-[#F9FAFB]">
          <TableRow className="text-xs font-medium text-[#5D6679]">
            <TableHead className="px-3 py-3 font-medium sm:px-4 sm:py-4">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 shrink-0" />
                Seller
              </div>
            </TableHead>
            <TableHead className="px-3 py-3 font-medium sm:px-4 sm:py-4">Asset</TableHead>
            <TableHead className="px-3 py-3 font-medium sm:px-4 sm:py-4">
              <div className="flex items-center gap-2">Price</div>
            </TableHead>
            <TableHead className="px-3 py-3 font-medium sm:px-4 sm:py-4">Type</TableHead>
            <TableHead className="px-3 py-3 text-center font-medium sm:px-4 sm:py-4">Units</TableHead>
            <TableHead className="px-3 py-3 font-medium sm:px-4 sm:py-4">Status</TableHead>
            <TableHead className="px-3 py-3 font-medium sm:px-4 sm:py-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                Listed
              </div>
            </TableHead>
            <TableHead className="px-3 py-3 font-medium sm:px-4 sm:py-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((listing) => (
            <TableRow
              key={listing._id}
              className="border-b border-[#E5EAEF] bg-white transition-colors hover:bg-gray-50"
            >
              <TableCell className="max-w-[10rem] px-3 py-4 text-sm font-medium text-[#333333] sm:px-4 sm:py-5">
                <span className="line-clamp-2 wrap-break-word" title={listing.seller ? `${listing.seller.lastName} ${listing.seller.firstName}` : undefined}>
                  {listing.seller
                    ? `${listing.seller.lastName} ${listing.seller.firstName}`
                    : "N/A"}
                </span>
              </TableCell>
              <TableCell className="max-w-[12rem] px-3 py-4 text-sm text-[#667085] sm:px-4 sm:py-5">
                <span className="line-clamp-2 wrap-break-word" title={listing.asset?.asset_name ?? undefined}>
                  {listing.asset?.asset_name || "N/A"}
                </span>
              </TableCell>
              <TableCell className="px-3 py-4 text-sm font-semibold tabular-nums wrap-break-word text-[#333333] sm:px-4 sm:py-5">
                {formatCurrency(listing.listing_price)}
              </TableCell>
              <TableCell className="px-3 py-4 text-sm capitalize text-[#667085] sm:px-4 sm:py-5">
                {listing.asset_type}
              </TableCell>
              <TableCell className="px-3 py-4 text-center text-sm font-medium text-[#333333] sm:px-4 sm:py-5">
                {listing.no_of_units}
              </TableCell>
              <TableCell className="px-3 py-4 sm:px-4 sm:py-5">
                <Badge
                  variant="outline"
                  className={`${statusStyles[listing.status] || statusStyles.cancelled} font-medium border`}
                >
                  {statusLabels[listing.status] || listing.status}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap px-3 py-4 text-sm text-[#333333] sm:px-4 sm:py-5">
                {formatDate(listing.listed_at || listing.createdAt)}
              </TableCell>
              <TableCell className="px-3 py-4 sm:px-4 sm:py-5">
                <div className="flex items-center gap-1">
                  {listing.status === "active" && onSuspend && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={() => onSuspend(listing)}
                      title="Suspend"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                  {listing.status === "suspended" && onUnsuspend && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-500 hover:text-green-700"
                      onClick={() => onUnsuspend(listing)}
                      title="Unsuspend"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
      </AdminDesktopTableWrap>
    </>
  );
}
