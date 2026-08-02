"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";
import { useActionRequests } from "../hooks/use-action-requests";
import type { ClientRequest } from "../hooks/use-client-requests";

// ── helpers ──────────────────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  under_review: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-3 py-1 text-sm font-medium rounded-full border ${
        statusStyles[status.toLowerCase()] ?? statusStyles.pending
      }`}
    >
      {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

const nairaKeys = new Set([
  "fee", "processingFee", "totalPrice", "currentTotalPrice", "newTotalPrice",
  "price", "amount", "balance", "feesCollected",
]);

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    return nairaKeys.has(key)
      ? `₦${Math.round(value).toLocaleString()}`
      : value.toLocaleString();
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  const str = String(value);
  // ISO date
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    return new Date(str).toLocaleDateString("en-NG", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }
  return str;
}

function humanLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── main component ────────────────────────────────────────────────────────────

interface RequestDetailModalProps {
  request: ClientRequest;
}

export function RequestDetailModal({ request }: RequestDetailModalProps) {
  const isPending = request.status?.toLowerCase() === "pending";
  const details = request.details || {};
  const detailEntries = Object.entries(details);

  const { updateStatus, approveLocationChange, approveDocumentChange, approveAssetUpdate } = useActionRequests();

  const [open, setOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [systemApproveOpen, setSystemApproveOpen] = useState(false);
  const [manualApproveOpen, setManualApproveOpen] = useState(false);

  const handleSuccess = () => {
    setSystemApproveOpen(false);
    setManualApproveOpen(false);
    setDeclineOpen(false);
    setOpen(false);
  };

  const handleDecline = () => {
    if (!declineReason.trim()) return;
    updateStatus.mutate(
      { requestId: request._id, status: "declined", declineReason },
      { onSuccess: handleSuccess }
    );
  };

  const handleManualApprove = () => {
    updateStatus.mutate(
      {
        requestId: request._id,
        status: "approved",
        adminMessage: "Approved for manual processing. Changes will be completed within 72 hours.",
        estimatedCompletionHours: 72,
      },
      { onSuccess: handleSuccess }
    );
  };

  const handleSystemApprove = () => {
    if (request.requestType === "location_change") {
      approveLocationChange.mutate(request._id, { onSuccess: handleSuccess });
    } else if (request.requestType === "document_change") {
      approveDocumentChange.mutate(request._id, { onSuccess: handleSuccess });
    } else if (request.requestType === "asset_update") {
      approveAssetUpdate.mutate(request._id, { onSuccess: handleSuccess });
    }
  };

  const isSystemProcessing =
    approveLocationChange.isPending || approveDocumentChange.isPending || approveAssetUpdate.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="View request details">
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col">
          {/* ── Header ── */}
          <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-xl font-bold">
                {humanLabel(request.requestType)} Details
              </DialogTitle>
              <StatusBadge status={request.status || "unknown"} />
            </div>
            {request.requestId && (
              <p className="text-sm text-muted-foreground mt-1 font-mono">{request.requestId}</p>
            )}
          </DialogHeader>

          {/* ── Scrollable body ── */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-6 space-y-5">

              {/* User Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Full Name</p>
                      <p className="font-medium">
                        {request.user?.lastName || request.user?.firstName
                          ? `${request.user.lastName ?? ""} ${request.user.firstName ?? ""}`.trim()
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{request.user?.email || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Request Overview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Request Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">
                        {request.requestType?.replaceAll("_", " ") || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{request.status || "—"}</p>
                    </div>
                    {request.paymentStatus && (
                      <div>
                        <p className="text-muted-foreground">Payment Status</p>
                        <p className="font-medium capitalize">{request.paymentStatus}</p>
                      </div>
                    )}
                    {request.fee !== undefined && (
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Processing Fee
                        </p>
                        <p className="font-medium">₦{Math.round(request.fee).toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Submitted
                      </p>
                      <p className="font-medium">
                        {request.createdAt
                          ? new Date(request.createdAt).toLocaleDateString("en-NG", {
                              day: "2-digit", month: "short", year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Request Details */}
              {detailEntries.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4" />
                      Request Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {detailEntries.map(([key, value]) => {
                        const isLong =
                          typeof value === "string" && value.length > 60;
                        const isObject = typeof value === "object" && value !== null;
                        const isWide = isLong || isObject;
                        return (
                          <div key={key} className={isWide ? "sm:col-span-2" : ""}>
                            <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1">
                              {humanLabel(key)}
                            </p>
                            {isObject ? (
                              <pre className="text-xs bg-gray-50 rounded p-2 whitespace-pre-wrap font-mono border">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : (
                              <p className="font-medium">{formatValue(key, value)}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {detailEntries.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No structured details available for this request.
                </p>
              )}
            </div>
          </ScrollArea>

          {/* ── Sticky footer with actions ── */}
          {isPending && (
            <div className="p-6 border-t bg-gray-50 flex flex-wrap gap-3 justify-end flex-shrink-0">
              <Button
                variant="outline"
                className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => setDeclineOpen(true)}
              >
                <XCircle className="h-4 w-4" />
                Decline
              </Button>

              {request.requestType === "location_change" && (
                <>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                    onClick={() => setManualApproveOpen(true)}
                  >
                    <Clock className="h-4 w-4" />
                    Manual Approve
                  </Button>
                  <Button
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => setSystemApproveOpen(true)}
                  >
                    <CheckCircle className="h-4 w-4" />
                    System Approve
                  </Button>
                </>
              )}

              {request.requestType === "document_change" && (
                <Button
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  onClick={() => setSystemApproveOpen(true)}
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve & Process
                </Button>
              )}

              {request.requestType === "asset_update" && (
                <>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                    onClick={() => setManualApproveOpen(true)}
                  >
                    <Clock className="h-4 w-4" />
                    Manual Approve
                  </Button>
                  <Button
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => setSystemApproveOpen(true)}
                  >
                    <CheckCircle className="h-4 w-4" />
                    System Approve
                  </Button>
                </>
              )}

              {request.requestType === "custom_request" && (
                <Button
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  onClick={() => setManualApproveOpen(true)}
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Request
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Decline ── */}
      <AlertDialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for declining this request. This will be sent to the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="decline-reason">Reason for Decline *</Label>
            <Textarea
              id="decline-reason"
              placeholder="Enter reason for declining this request..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeclineReason("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDecline();
              }}
              disabled={updateStatus.isPending || !declineReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {updateStatus.isPending ? "Declining..." : "Decline Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── System Approve ── */}
      <AlertDialog open={systemApproveOpen} onOpenChange={setSystemApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>System Approve Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will automatically process the request, update database ledgers, and notify the
              user to confirm completion. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSystemApprove();
              }}
              disabled={isSystemProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSystemProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Approve & Process"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Manual Approve ── */}
      <AlertDialog open={manualApproveOpen} onOpenChange={setManualApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Manual Approve Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the request for manual processing. The user will be notified that the
              operation may take up to 72 hours. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleManualApprove();
              }}
              disabled={updateStatus.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateStatus.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Approve for Manual Processing"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
