"use client";

import React from "react";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import { Card } from "@/components/ui/card";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export const CouponRowFragment = graphql(`
  fragment CouponRowFragment on Coupon {
    _id
    couponCode
    discountPercentage
    startDate
    endDate
    expiryDate
    expiryType
    usageLimit
    usageLimitType
    status
    activeImmediately
    createdAt
  }
`);

interface CouponsTableProps {
  data?: (FragmentType<typeof CouponRowFragment> | null)[] | null;
  onStatusChange: (code: string, status: string) => void;
  onDelete: (code: string) => void;
  onViewUsage?: (code: string) => void;
  isLoading?: boolean;
}

const statusTone: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-gray-100 text-gray-800",
  expired: "bg-amber-100 text-amber-800",
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, "MMM d, yyyy");
};

export function CouponsTable({ data, onStatusChange, onDelete, onViewUsage, isLoading }: CouponsTableProps) {
  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  const rows = (data ?? []).filter(
    (item): item is NonNullable<typeof item> => item !== null
  );

  return (
    <Card className="border border-gray-200 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                No coupons found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const coupon = getFragmentData(CouponRowFragment, row);
              return (
                <TableRow key={coupon._id}>
                  <TableCell className="font-medium">{coupon.couponCode}</TableCell>
                  <TableCell>{coupon.discountPercentage}%</TableCell>
                  <TableCell>
                    {coupon.usageLimitType === "unlimited"
                      ? "Unlimited"
                      : coupon.usageLimit ?? "—"}
                  </TableCell>
                  <TableCell>{formatDate(coupon.startDate)}</TableCell>
                  <TableCell>{formatDate(coupon.endDate || coupon.expiryDate)}</TableCell>
                  <TableCell>
                    <Badge className={statusTone[coupon.status?.toLowerCase() || ""] || "bg-gray-100 text-gray-800"}>
                      {coupon.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onStatusChange(coupon.couponCode, coupon.status === "active" ? "inactive" : "active")}>
                          {coupon.status === "active" ? "Set Inactive" : "Set Active"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(coupon.couponCode, "expired")}>
                          Mark Expired
                        </DropdownMenuItem>
                        {onViewUsage && (
                          <DropdownMenuItem onClick={() => onViewUsage(coupon.couponCode)}>
                            View Usage
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(coupon.couponCode)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
