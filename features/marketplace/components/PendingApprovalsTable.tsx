"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ClipboardList, User as UserIcon, CheckCircle, XCircle, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import type { MarketplaceListingAdmin } from "../hooks/use-marketplace-listings";

interface PendingApprovalsTableProps {
  data: MarketplaceListingAdmin[] | null | undefined;
  isLoading?: boolean;
  onApprove?: (listing: MarketplaceListingAdmin) => void;
  onReject?: (listing: MarketplaceListingAdmin) => void;
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
    return format(new Date(dateString), "dd MMM yyyy HH:mm");
  } catch {
    return "N/A";
  }
};

export function PendingApprovalsTable({
  data,
  isLoading,
  onApprove,
  onReject,
}: PendingApprovalsTableProps) {
  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading pending approvals...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ClipboardList className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending approvals</h3>
        <p className="text-gray-600 text-center max-w-md">
          All receipt-based purchases have been reviewed.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full overflow-x-auto rounded-lg border border-[#E5EAEF]">
      <Table className="min-w-[900px]">
        <TableHeader className="border-b border-[#E5EAEF] bg-[#F9FAFB]">
          <TableRow className="text-xs font-medium text-[#5D6679]">
            <TableHead className="px-3 py-3 font-medium sm:px-4 sm:py-4">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 shrink-0" />
                Buyer
              </div>
            </TableHead>
            <TableHead className="px-3 py-3 font-medium sm:px-4 sm:py-4">Seller</TableHead>
            <TableHead className="px-3 py-3 font-medium sm:px-4 sm:py-4">Asset</TableHead>
            <TableHead className="px-3 py-3 font-medium sm:px-4 sm:py-4">
              <div className="flex items-center gap-2">Price</div>
            </TableHead>
            <TableHead className="px-3 py-3 font-medium sm:px-4 sm:py-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 shrink-0" />
                Receipt
              </div>
            </TableHead>
            <TableHead className="px-3 py-3 font-medium sm:px-4 sm:py-4">Receipt Amt</TableHead>
            <TableHead className="px-3 py-3 font-medium sm:px-4 sm:py-4">Reference</TableHead>
            <TableHead className="px-3 py-3 font-medium sm:px-4 sm:py-4">Submitted</TableHead>
            <TableHead className="px-3 py-3 font-medium sm:px-4 sm:py-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((listing) => (
            <TableRow
              key={listing._id}
              className="border-b border-[#E5EAEF] bg-white transition-colors hover:bg-gray-50"
            >
              <TableCell className="max-w-36 px-3 py-4 text-sm font-medium text-[#333333] sm:px-4 sm:py-5">
                <span className="line-clamp-2 wrap-break-word" title={listing.buyer ? `${listing.buyer.firstName} ${listing.buyer.lastName}` : undefined}>
                  {listing.buyer
                    ? `${listing.buyer.firstName} ${listing.buyer.lastName}`
                    : "N/A"}
                </span>
              </TableCell>
              <TableCell className="max-w-36 px-3 py-4 text-sm text-[#667085] sm:px-4 sm:py-5">
                <span className="line-clamp-2 wrap-break-word" title={listing.seller ? `${listing.seller.firstName} ${listing.seller.lastName}` : undefined}>
                  {listing.seller
                    ? `${listing.seller.firstName} ${listing.seller.lastName}`
                    : "N/A"}
                </span>
              </TableCell>
              <TableCell className="max-w-44 px-3 py-4 text-sm text-[#667085] sm:px-4 sm:py-5">
                <span className="line-clamp-2 wrap-break-word" title={listing.asset?.asset_name ?? undefined}>
                  {listing.asset?.asset_name || "N/A"}
                </span>
              </TableCell>
              <TableCell className="px-3 py-4 text-sm font-semibold tabular-nums wrap-break-word text-[#333333] sm:px-4 sm:py-5">
                {formatCurrency(listing.listing_price)}
              </TableCell>
              <TableCell className="px-3 py-4 sm:px-4 sm:py-5">
                {listing.receipt_image ? (
                  <a
                    href={listing.receipt_image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View
                  </a>
                ) : (
                  <span className="text-gray-400 text-sm">None</span>
                )}
              </TableCell>
              <TableCell className="px-3 py-4 text-sm tabular-nums wrap-break-word text-[#333333] sm:px-4 sm:py-5">
                {listing.receipt_amount ? formatCurrency(listing.receipt_amount) : "N/A"}
              </TableCell>
              <TableCell className="max-w-32 px-3 py-4 font-mono text-sm wrap-break-word text-[#667085] sm:px-4 sm:py-5">
                {listing.receipt_reference || "N/A"}
              </TableCell>
              <TableCell className="whitespace-nowrap px-3 py-4 text-sm text-[#333333] sm:px-4 sm:py-5">
                {formatDate(listing.createdAt)}
              </TableCell>
              <TableCell className="px-3 py-4 sm:px-4 sm:py-5">
                <div className="flex items-center gap-1">
                  {onApprove && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600 hover:text-green-800 hover:bg-green-50"
                      onClick={() => onApprove(listing)}
                      title="Approve"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {onReject && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => onReject(listing)}
                      title="Reject"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
