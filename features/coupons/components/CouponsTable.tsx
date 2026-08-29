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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoreVertical, Ticket } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { EditCouponDialog } from "./EditCouponDialog";
import {
  COUPON_STATUS_LABELS,
  type Coupon,
  type ManualCouponStatus,
  type UpdateCouponInput,
} from "../schemas/coupon.schema";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

interface CouponsTableProps {
  data?: Coupon[] | null;
  onStatusChange: (code: string, status: ManualCouponStatus, reason?: string) => void;
  onDelete: (code: string) => void;
  onUpdate: (input: { couponCode: string } & UpdateCouponInput) => Promise<void>;
  onViewUsage?: (code: string) => void;
  isLoading?: boolean;
}

const statusTone: Record<string, string> = {
  pending: "bg-sky-100 text-sky-800",
  active: "bg-emerald-100 text-emerald-800",
  paused: "bg-gray-100 text-gray-800",
  expired: "bg-amber-100 text-amber-800",
};

const PAUSE_REASON_MIN = 3;

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, "MMM d, yyyy");
};

function nextStatusAction(coupon: Coupon): { label: string; status: ManualCouponStatus } | null {
  if (coupon.status === "active") return { label: "Pause", status: "paused" };
  if (coupon.status === "paused" || coupon.status === "pending") {
    return { label: "Activate", status: "active" };
  }
  return null;
}

export function CouponsTable({ data, onStatusChange, onDelete, onUpdate, onViewUsage, isLoading }: CouponsTableProps) {
  const [editingCoupon, setEditingCoupon] = React.useState<Coupon | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [deletingCode, setDeletingCode] = React.useState<string | null>(null);
  const [pausingCoupon, setPausingCoupon] = React.useState<Coupon | null>(null);
  const [pauseReason, setPauseReason] = React.useState("");

  const handleStatusClick = (coupon: Coupon) => {
    const action = nextStatusAction(coupon);
    if (!action) return;

    if (action.status === "paused") {
      setPauseReason("");
      setPausingCoupon(coupon);
      return;
    }

    onStatusChange(coupon.couponCode, action.status);
  };

  const handlePauseConfirm = () => {
    if (!pausingCoupon) return;
    const reason = pauseReason.trim();
    if (reason.length < PAUSE_REASON_MIN) return;
    onStatusChange(pausingCoupon.couponCode, "paused", reason);
    setPausingCoupon(null);
    setPauseReason("");
  };

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

  const rows = data ?? [];
  const pauseReasonLength = pauseReason.trim().length;

  return (
    <Card className="min-w-0 overflow-hidden border border-gray-200">
      <AdminMobileStack className="border-b border-gray-200 p-3">
        {rows.map((coupon) => {
          const action = nextStatusAction(coupon);
          return (
            <AdminMobileCard
              key={coupon._id}
              title={<span className="font-mono">{coupon.couponCode}</span>}
              subtitle={formatDate(coupon.ends_at)}
            >
              <AdminMobileField label="Discount" value={`${coupon.discount_percentage}%`} />
              <AdminMobileField
                label="Usage limit"
                value={
                  coupon.usage_limit_type === "unlimited"
                    ? "Unlimited"
                    : String(coupon.usage_limit ?? "—")
                }
              />
              <AdminMobileField
                label="Status"
                value={
                  <Badge className={statusTone[coupon.status] || "bg-gray-100 text-gray-800"}>
                    {COUPON_STATUS_LABELS[coupon.status]}
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
                      disabled={coupon.status === "expired"}
                      onClick={() => {
                        setEditingCoupon(coupon);
                        setIsEditOpen(true);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    {action && (
                      <DropdownMenuItem onClick={() => handleStatusClick(coupon)}>
                        {action.label}
                      </DropdownMenuItem>
                    )}
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
            rows.map((coupon) => {
              const action = nextStatusAction(coupon);
              return (
                <TableRow key={coupon._id} className="text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors border-gray-200">
                  <TableCell className="max-w-[180px] py-4 font-mono text-sm font-semibold wrap-break-word text-gray-900 sm:max-w-none">
                    {coupon.couponCode}
                  </TableCell>
                  <TableCell className="py-4 text-gray-700 font-medium">{coupon.discount_percentage}%</TableCell>
                  <TableCell>
                    {coupon.usage_limit_type === "unlimited" ? "Unlimited" : coupon.usage_limit ?? "—"}
                  </TableCell>
                  <TableCell>{formatDate(coupon.ends_at)}</TableCell>
                  <TableCell className="py-4">
                    <Badge className={statusTone[coupon.status] || "bg-gray-100 text-gray-800"}>
                      {COUPON_STATUS_LABELS[coupon.status]}
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
                          disabled={coupon.status === "expired"}
                          onClick={() => {
                            setEditingCoupon(coupon);
                            setIsEditOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        {action && (
                          <DropdownMenuItem onClick={() => handleStatusClick(coupon)}>
                            {action.label}
                          </DropdownMenuItem>
                        )}
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

      <Dialog
        open={pausingCoupon !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPausingCoupon(null);
            setPauseReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pause coupon</DialogTitle>
            <DialogDescription>
              Pausing{" "}
              <span className="font-mono font-semibold text-foreground">
                {pausingCoupon?.couponCode}
              </span>{" "}
              stops new redemptions until you activate it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="pause-reason">Reason</Label>
            <Textarea
              id="pause-reason"
              rows={4}
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              placeholder="Why is this coupon being paused?"
            />
            <p className="text-xs text-muted-foreground">
              At least {PAUSE_REASON_MIN} characters — {pauseReasonLength} so far.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPausingCoupon(null);
                setPauseReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handlePauseConfirm}
              disabled={pauseReasonLength < PAUSE_REASON_MIN}
            >
              Pause coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingCode !== null} onOpenChange={(open) => { if (!open) setDeletingCode(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete coupon <span className="font-mono font-semibold">{deletingCode}</span>. Redemption history is preserved.
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
