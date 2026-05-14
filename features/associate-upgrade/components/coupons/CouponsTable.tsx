"use client";

import React from "react";
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
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { MoreVertical, Ticket } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { EditCouponDialog } from "./EditCouponDialog";
import type { Coupon } from "@/lib/gql/graphql";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

interface CouponsTableProps {
  data?: (Coupon | null)[] | null;
  onStatusChange: (code: string, status: string) => void;
  onDelete: (code: string) => void;
  onUpdate: (input: {
    couponCode: string;
    discountPercentage: number;
    usageLimitType: string;
    usageLimit?: number;
    expiryType: string;
    startDate?: Date;
    endDate?: Date;
    expiryDate?: Date;
  }) => Promise<void>;
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

export function CouponsTable({ data, onStatusChange, onDelete, onUpdate, onViewUsage, isLoading }: CouponsTableProps) {
  const [editingCoupon, setEditingCoupon] = React.useState<Coupon | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [deletingCode, setDeletingCode] = React.useState<string | null>(null);

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
    <Card className="min-w-0 overflow-hidden border border-gray-200">
      <AdminMobileStack className="border-b border-gray-200 p-3">
        {rows.map((row) => {
          const coupon = row;
          const isActive = coupon.status === "active";
          return (
            <AdminMobileCard key={coupon._id} title={<span className="font-mono">{coupon.couponCode}</span>} subtitle={formatDate(coupon.expiryDate)}>
              <AdminMobileField label="Discount" value={`${coupon.discountPercentage}%`} />
              <AdminMobileField
                label="Usage limit"
                value={coupon.usageLimitType === "unlimited" ? "Unlimited" : String(coupon.usageLimit ?? "—")}
              />
              <AdminMobileField
                label="Status"
                value={
                  <Badge className={statusTone[coupon.status?.toLowerCase() || ""] || "bg-gray-100 text-gray-800"}>
                    {coupon.status}
                  </Badge>
                }
              />
              <div className="flex justify-end border-t border-[#E5EAEF] pt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4 mr-1" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onViewUsage && (
                      <DropdownMenuItem onClick={() => onViewUsage(coupon.couponCode)}>
                        View Usage
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingCoupon(row);
                        setIsEditOpen(true);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(coupon.couponCode, isActive ? "inactive" : "active")}>
                      {isActive ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => setDeletingCode(coupon.couponCode)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </AdminMobileCard>
          );
        })}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
      <div className="min-w-0 overflow-x-auto">
      <Table className="min-w-[720px]">
        <TableHeader className="bg-gray-50 border-b border-gray-200">
          <TableRow className="text-sm font-bold text-black">
            <TableHead className="py-4 font-semibold">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Code
              </div>
            </TableHead>
            <TableHead className="py-4 font-semibold">Discount</TableHead>
            <TableHead className="py-4 font-semibold">Usage Limit</TableHead>
            <TableHead className="py-4 font-semibold">Expiry</TableHead>
            <TableHead className="py-4 font-semibold">Status</TableHead>
            <TableHead className="py-4 font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                No coupons found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const coupon = row;
              const isActive = coupon.status === "active";
              return (
                <TableRow key={coupon._id} className="text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors border-gray-200">
                  <TableCell className="max-w-[180px] py-4 font-mono text-sm font-semibold wrap-break-word text-gray-900 sm:max-w-none">
                    {coupon.couponCode}
                  </TableCell>
                  <TableCell className="py-4 text-gray-700 font-medium">{coupon.discountPercentage}%</TableCell>
                  <TableCell>
                    {coupon.usageLimitType === "unlimited" ? "Unlimited" : coupon.usageLimit ?? "—"}
                  </TableCell>
                  <TableCell>{formatDate(coupon.expiryDate)}</TableCell>
                  <TableCell className="py-4">
                    <Badge className={statusTone[coupon.status?.toLowerCase() || ""] || "bg-gray-100 text-gray-800"}>
                      {coupon.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onViewUsage && (
                          <DropdownMenuItem onClick={() => onViewUsage(coupon.couponCode)}>
                            View Usage
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingCoupon(row);
                            setIsEditOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(coupon.couponCode, isActive ? "inactive" : "active")}>
                          {isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => setDeletingCode(coupon.couponCode)}>
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
      </div>
      </AdminDesktopTableWrap>
      <AlertDialog open={deletingCode !== null} onOpenChange={(open) => { if (!open) setDeletingCode(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete coupon <span className="font-mono font-semibold">{deletingCode}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { onDelete(deletingCode!); setDeletingCode(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editingCoupon && (
        <EditCouponDialog
          key={editingCoupon._id}
          coupon={editingCoupon}
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) setEditingCoupon(null);
          }}
          onSubmit={onUpdate}
        />
      )}
    </Card>
  );
}
