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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye } from "lucide-react";
import { ClientRequest } from "../hooks/use-client-requests";

interface RequestsTableProps {
  requests?: ClientRequest[];
  isLoading?: boolean;
}

const statusTone: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  declined: "bg-rose-100 text-rose-800",
  rejected: "bg-rose-100 text-rose-800",
  completed: "bg-emerald-100 text-emerald-800",
  under_review: "bg-blue-100 text-blue-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-gray-100 text-gray-800",
};

const paymentTone: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800",
  unpaid: "bg-rose-100 text-rose-800",
};

const formatFieldLabel = (key: string) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

function RequestDetailsModal({ request }: { request: ClientRequest }) {
  const details = request.details || {};
  const entries = Object.entries(details);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="View request details">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request details</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Request type</span>
                <p className="font-medium capitalize">{request.requestType?.replaceAll("_", " ") || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <p className="font-medium">{request.status || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Payment status</span>
                <p className="font-medium">{request.paymentStatus || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Submitted</span>
                <p className="font-medium">
                  {request.createdAt ? new Date(request.createdAt).toLocaleString() : "—"}
                </p>
              </div>
            </div>

            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No structured details available for this request.</p>
            ) : (
              <div className="space-y-2">
                {entries.map(([key, value]) => (
                  <div key={key} className="rounded-md border p-3">
                    <p className="text-xs uppercase text-muted-foreground tracking-wide">{formatFieldLabel(key)}</p>
                    <pre className="mt-1 text-sm break-words whitespace-pre-wrap font-sans">
                      {typeof value === "object" && value !== null
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function RequestsTable({ requests, isLoading }: RequestsTableProps) {
  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  const rows = requests ?? [];

  return (
    <Card className="border border-gray-200 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request ID</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                No requests found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((req) => {
              const status = (req.status || "").toLowerCase();
              const payment = (req.paymentStatus || "").toLowerCase();
              return (
                <TableRow key={req._id}>
                  <TableCell className="font-medium">
                    {req.requestId || (req._id ? req._id.slice(-8) : "—")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {req.user?.firstName || req.user?.lastName
                        ? `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim()
                        : "Unknown user"}
                    </div>
                    <div className="text-xs text-muted-foreground">{req.user?.email || "—"}</div>
                  </TableCell>
                  <TableCell className="capitalize">{req.requestType?.replaceAll("_", " ")}</TableCell>
                  <TableCell>
                    <Badge className={statusTone[status] || "bg-gray-100 text-gray-800"}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={paymentTone[payment] || "bg-gray-100 text-gray-800"}>
                      {req.paymentStatus || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>₦{Math.round(req.fee || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    {req.createdAt
                      ? new Date(req.createdAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <RequestDetailsModal request={req} />
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
