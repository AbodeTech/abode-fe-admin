"use client";

import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RequestDetailModal } from "./RequestDetailModal";
import type { ClientRequest } from "../hooks/use-client-requests";

interface RequestsTableProps {
  requests?: ClientRequest[];
  isLoading?: boolean;
  requestTypeFilter?: string;
}

const statusTone: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  under_review: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200",
};

function statusBadge(status?: string) {
  const key = (status || "pending").toLowerCase();
  const label = (status || "Pending").replaceAll("_", " ");
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full border ${
        statusTone[key] || statusTone.pending
      }`}
    >
      {label}
    </span>
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString("en-GB") : "—";
}

function renderUser(req: ClientRequest) {
  const userId = req.user?._id;
  const fullName = `${req.user?.lastName ?? ""} ${req.user?.firstName ?? ""}`.trim() || "Unknown user";
  if (!userId) return <span className="font-medium">{fullName}</span>;
  return (
    <Link href={`/users/${userId}`} className="text-black hover:text-gray-700 font-medium hover:underline transition-colors">
      {fullName}
    </Link>
  );
}

function getCustomDetails(req: ClientRequest) {
  const details = asRecord(req.details) || {};
  return {
    title: asString(details.title) || "—",
    category: asString(details.category) || "—",
  };
}

function getDocumentDetails(req: ClientRequest) {
  const details = asRecord(req.details) || {};
  const asset = asRecord(details.assetId);
  const currentName = asString(details.currentName);
  const newName = asString(details.newName);
  const currentAddress = asString(details.currentAddress);
  const newAddress = asString(details.newAddress);

  return {
    assetName: asString(details.assetName) || asString(asset?.asset_name) || "—",
    assetLocation: asString(asset?.asset_location) || "—",
    nameChanged: !!currentName && !!newName && currentName !== newName,
    addressChanged: !!currentAddress && !!newAddress && currentAddress !== newAddress,
  };
}

function getLocationDetails(req: ClientRequest) {
  const details = asRecord(req.details) || {};
  return {
    currentAssetName: asString(details.currentAssetName) || "—",
    currentAssetLocation: asString(details.currentAssetLocation) || "—",
    newAssetName: asString(details.newAssetName) || "—",
    newAssetLocation: asString(details.newAssetLocation) || "—",
    currentAssetSize: asNumber(details.currentAssetSize),
    newAssetSize: asNumber(details.newAssetSize),
  };
}

function getAssetUpdateDetails(req: ClientRequest) {
  const details = asRecord(req.details) || {};
  const asset = asRecord(details.assetId);
  const currentSize = asNumber(details.currentSize);
  const newSize = asNumber(details.newSize);
  const currentUnits = asNumber(details.currentUnits);
  const newUnits = asNumber(details.newUnits);

  return {
    assetName: asString(details.assetName) || asString(asset?.asset_name) || "—",
    assetLocation: asString(asset?.asset_location) || "—",
    currentSize,
    newSize,
    currentUnits,
    newUnits,
    currentTotalPrice: asNumber(details.currentTotalPrice),
    newTotalPrice: asNumber(details.newTotalPrice),
  };
}

function renderNoRows(colSpan: number) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center text-sm text-muted-foreground py-12">
        No requests found.
      </TableCell>
    </TableRow>
  );
}

export function RequestsTable({ requests, isLoading, requestTypeFilter }: RequestsTableProps) {
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
  const type = requestTypeFilter || "generic";

  return (
    <Card className="border border-gray-200">
      <Table className="min-w-[1180px]">
        <TableHeader className="bg-gray-50 border-b border-gray-200">
          <TableRow className="text-sm font-bold text-black">
            <TableHead className="py-4 font-semibold">Request ID</TableHead>
            <TableHead className="py-4 font-semibold">User</TableHead>
            {type === "custom_request" && (
              <>
                <TableHead className="py-4 font-semibold">Title</TableHead>
                <TableHead className="py-4 font-semibold">Category</TableHead>
                <TableHead className="py-4 font-semibold">Asset</TableHead>
              </>
            )}
            {type === "document_change" && (
              <>
                <TableHead className="py-4 font-semibold">Asset Name</TableHead>
                <TableHead className="py-4 font-semibold">Name Change</TableHead>
                <TableHead className="py-4 font-semibold">Address Change</TableHead>
              </>
            )}
            {type === "location_change" && (
              <>
                <TableHead className="py-4 font-semibold">Current Asset</TableHead>
                <TableHead className="py-4 font-semibold">New Asset</TableHead>
                <TableHead className="py-4 font-semibold">Size Change</TableHead>
              </>
            )}
            {type === "asset_update" && (
              <>
                <TableHead className="py-4 font-semibold">Asset</TableHead>
                <TableHead className="py-4 font-semibold">Change Details</TableHead>
                <TableHead className="py-4 font-semibold">Impact</TableHead>
              </>
            )}
            {!["custom_request", "document_change", "location_change", "asset_update"].includes(type) && (
              <>
                <TableHead className="py-4 font-semibold">Type</TableHead>
                <TableHead className="py-4 font-semibold">Payment</TableHead>
                <TableHead className="py-4 font-semibold">Fee</TableHead>
              </>
            )}
            <TableHead className="py-4 font-semibold">Date</TableHead>
            <TableHead className="py-4 font-semibold">Status</TableHead>
            <TableHead className="py-4 font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length === 0 && renderNoRows(8)}

          {rows.map((req, idx) => {
            const strip = idx % 2 === 0 ? "bg-gray-50/50" : "bg-white";
            const requestId = req.requestId || (req._id ? req._id.slice(-8) : "—");

            if (type === "custom_request") {
              const details = getCustomDetails(req);
              return (
                <TableRow key={req._id} className={`text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors border-gray-200 ${strip}`}>
                  <TableCell className="py-4 font-semibold text-gray-700">{requestId}</TableCell>
                  <TableCell className="py-4 max-w-[150px]">{renderUser(req)}</TableCell>
                  <TableCell className="py-4 text-gray-700 max-w-[250px] truncate" title={details.title}>{details.title}</TableCell>
                  <TableCell className="py-4 text-gray-700">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">{details.category}</Badge>
                  </TableCell>
                  <TableCell className="py-4 text-gray-700"><span className="text-gray-400 text-xs">N/A</span></TableCell>
                  <TableCell className="py-4 text-gray-700">{formatDate(req.createdAt)}</TableCell>
                  <TableCell className="py-4">{statusBadge(req.status)}</TableCell>
                  <TableCell className="py-4">
                    <RequestDetailModal request={req} />
                  </TableCell>
                </TableRow>
              );
            }

            if (type === "document_change") {
              const details = getDocumentDetails(req);
              return (
                <TableRow key={req._id} className={`text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors border-gray-200 ${strip}`}>
                  <TableCell className="py-4 font-semibold text-gray-700">{requestId}</TableCell>
                  <TableCell className="py-4 max-w-[150px]">{renderUser(req)}</TableCell>
                  <TableCell className="py-4 text-gray-700 max-w-[200px]">
                    <p className="font-medium truncate" title={details.assetName}>{details.assetName}</p>
                    <p className="text-xs text-gray-600 truncate">{details.assetLocation}</p>
                  </TableCell>
                  <TableCell className="py-4 text-gray-700">
                    {details.nameChanged ? (
                      <div className="flex items-center gap-1 text-green-600"><Check className="h-4 w-4" />Yes</div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-400"><X className="h-4 w-4" />No</div>
                    )}
                  </TableCell>
                  <TableCell className="py-4 text-gray-700">
                    {details.addressChanged ? (
                      <div className="flex items-center gap-1 text-green-600"><Check className="h-4 w-4" />Yes</div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-400"><X className="h-4 w-4" />No</div>
                    )}
                  </TableCell>
                  <TableCell className="py-4 text-gray-700">{formatDate(req.createdAt)}</TableCell>
                  <TableCell className="py-4">{statusBadge(req.status)}</TableCell>
                  <TableCell className="py-4">
                    <RequestDetailModal request={req} />
                  </TableCell>
                </TableRow>
              );
            }

            if (type === "location_change") {
              const details = getLocationDetails(req);
              return (
                <TableRow key={req._id} className={`text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors border-gray-200 ${strip}`}>
                  <TableCell className="py-4 font-semibold text-gray-700">{requestId}</TableCell>
                  <TableCell className="py-4 max-w-[150px]">{renderUser(req)}</TableCell>
                  <TableCell className="py-4 text-gray-700 max-w-[200px]">
                    <p className="font-medium truncate" title={details.currentAssetName}>{details.currentAssetName}</p>
                    <p className="text-xs text-gray-600 truncate">{details.currentAssetLocation}</p>
                  </TableCell>
                  <TableCell className="py-4 text-gray-700 max-w-[200px]">
                    <p className="font-medium truncate" title={details.newAssetName}>{details.newAssetName}</p>
                    <p className="text-xs text-gray-600 truncate">{details.newAssetLocation}</p>
                  </TableCell>
                  <TableCell className="py-4 text-gray-700">
                    <div className="flex items-center gap-2">
                      <span>{details.currentAssetSize}sqm</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className={details.newAssetSize > details.currentAssetSize ? "text-green-600 font-semibold" : details.newAssetSize < details.currentAssetSize ? "text-orange-600 font-semibold" : ""}>
                        {details.newAssetSize}sqm
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-gray-700">{formatDate(req.createdAt)}</TableCell>
                  <TableCell className="py-4">{statusBadge(req.status)}</TableCell>
                  <TableCell className="py-4">
                    <RequestDetailModal request={req} />
                  </TableCell>
                </TableRow>
              );
            }

            if (type === "asset_update") {
              const details = getAssetUpdateDetails(req);
              const hasSizeChange = details.currentSize !== details.newSize;
              const hasUnitsChange = details.currentUnits !== details.newUnits;
              const diff = details.newTotalPrice - details.currentTotalPrice;

              return (
                <TableRow key={req._id} className={`text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors border-gray-200 ${strip}`}>
                  <TableCell className="py-4 font-semibold text-gray-700">{requestId}</TableCell>
                  <TableCell className="py-4 max-w-[150px]">{renderUser(req)}</TableCell>
                  <TableCell className="py-4 text-gray-700 max-w-[200px]">
                    <p className="font-medium truncate" title={details.assetName}>{details.assetName}</p>
                    <p className="text-xs text-gray-600 truncate">{details.assetLocation}</p>
                  </TableCell>
                  <TableCell className="py-4 text-gray-700">
                    <div className="space-y-1">
                      {hasSizeChange && (
                        <div className="flex items-center gap-2 text-sm">
                          <span>Size: {details.currentSize}sqm</span>
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <span className={details.newSize > details.currentSize ? "text-orange-600 font-semibold" : "text-green-600 font-semibold"}>
                            {details.newSize}sqm
                          </span>
                        </div>
                      )}
                      {hasUnitsChange && (
                        <div className="flex items-center gap-2 text-sm">
                          <span>Units: {details.currentUnits}</span>
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <span className={details.newUnits > details.currentUnits ? "text-orange-600 font-semibold" : "text-green-600 font-semibold"}>
                            {details.newUnits}
                          </span>
                        </div>
                      )}
                      {!hasSizeChange && !hasUnitsChange && <span className="text-gray-500 text-sm">No change details</span>}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    {details.currentTotalPrice > 0 || details.newTotalPrice > 0 ? (
                      <span className={`text-sm font-semibold ${diff >= 0 ? "text-orange-600" : "text-green-600"}`}>
                        {diff >= 0 ? "+" : "-"}₦{Math.abs(diff).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 text-gray-700">{formatDate(req.createdAt)}</TableCell>
                  <TableCell className="py-4">{statusBadge(req.status)}</TableCell>
                  <TableCell className="py-4">
                    <RequestDetailModal request={req} />
                  </TableCell>
                </TableRow>
              );
            }

            return (
              <TableRow key={req._id}>
                <TableCell className="font-medium font-mono text-xs">{requestId}</TableCell>
                <TableCell>{renderUser(req)}</TableCell>
                <TableCell className="capitalize">{req.requestType?.replaceAll("_", " ")}</TableCell>
                <TableCell>{req.paymentStatus || "N/A"}</TableCell>
                <TableCell>₦{Math.round(req.fee || 0).toLocaleString()}</TableCell>
                <TableCell>{formatDate(req.createdAt)}</TableCell>
                <TableCell>{statusBadge(req.status)}</TableCell>
                <TableCell>
                  <RequestDetailModal request={req} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
