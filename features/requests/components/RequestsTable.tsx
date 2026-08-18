"use client";

import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import { formatNaira } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

import {
  PAYMENT_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  refName,
  type ClientRequest,
  type RequestStatus,
  type RequestType,
} from "../schemas/request.schema";
import { RequestDetailModal } from "./RequestDetailModal";

interface RequestsTableProps {
  requests?: ClientRequest[];
  isLoading?: boolean;
  /** Which per-type columns to show. Absent → the generic mixed-type layout. */
  requestTypeFilter?: RequestType;
}

/** Complete literal class strings per status — Tailwind's JIT can't see concatenated ones. */
const STATUS_TONE: Record<RequestStatus, string> = {
  submitted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  under_review: "bg-blue-100 text-blue-800 border-blue-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={cn("px-2 py-1 text-xs font-medium rounded-full border", STATUS_TONE[status])}>
      {REQUEST_STATUS_LABELS[status]}
    </span>
  );
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("en-GB") : "—";
}

/** Populated by the backend — a real name, linking to the user page. */
function UserCell({ request }: { request: ClientRequest }) {
  const name = refName(request.user) ?? request.user?.email ?? "Unknown user";
  if (!request.user?.id) return <span className="font-medium">{name}</span>;
  return (
    <Link
      href={`/users/${request.user.id}`}
      className="font-medium text-black transition-colors hover:text-gray-700 hover:underline"
    >
      {name}
    </Link>
  );
}

function AssetCell({ name, sub }: { name: string | null | undefined; sub?: string | null }) {
  return (
    <div className="max-w-[200px]">
      <p className="truncate font-medium" title={name ?? undefined}>
        {name || "—"}
      </p>
      {sub ? <p className="truncate text-xs text-gray-600">{sub}</p> : null}
    </div>
  );
}

function YesNo({ value }: { value: boolean }) {
  return value ? (
    <div className="flex items-center gap-1 text-green-600">
      <Check className="h-4 w-4" />
      Yes
    </div>
  ) : (
    <div className="flex items-center gap-1 text-gray-400">
      <X className="h-4 w-4" />
      No
    </div>
  );
}

function ChangeArrow({
  label,
  from,
  to,
  unit = "",
}: {
  label: string;
  from: number;
  to: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>
        {label}: {from.toLocaleString()}
        {unit}
      </span>
      <ArrowRight className="h-3 w-3 text-gray-400" />
      <span className={cn("font-semibold", to > from ? "text-orange-600" : "text-green-600")}>
        {to.toLocaleString()}
        {unit}
      </span>
    </div>
  );
}

const rowClass = (idx: number) =>
  cn(
    "border-gray-200 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100",
    idx % 2 === 0 ? "bg-gray-50/50" : "bg-white"
  );

export function RequestsTable({ requests, isLoading, requestTypeFilter }: RequestsTableProps) {
  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <div className="space-y-3 p-4">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  const rows = requests ?? [];
  const type = requestTypeFilter;

  const typeHeaders: Record<RequestType, string[]> = {
    custom_request: ["Title", "Category", "Asset"],
    document_change: ["Asset", "Name Change", "Address Change"],
    asset_update: ["Asset", "Change Details", "Impact"],
  };
  const middleHeaders = type ? typeHeaders[type] : ["Type", "Payment", "Fee"];
  const colSpan = 5 + middleHeaders.length;

  return (
    <>
      <AdminMobileStack className="space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-gray-200 py-12 text-center text-sm text-muted-foreground">
            No requests found.
          </p>
        ) : (
          rows.map((req) => (
            <AdminMobileCard key={req.id} title={req.request_id} subtitle={formatDate(req.createdAt)}>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">User: </span>
                  <UserCell request={req} />
                </div>
                <div>
                  <RequestStatusBadge status={req.status} />
                </div>
                <RequestDetailModal request={req} />
              </div>
            </AdminMobileCard>
          ))
        )}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
        <Card className="border border-gray-200">
          <Table className="min-w-[1180px]">
            <TableHeader className="border-b border-gray-200 bg-gray-50">
              <TableRow className="text-sm font-bold text-black">
                <TableHead className="py-4 font-semibold">Request ID</TableHead>
                <TableHead className="py-4 font-semibold">User</TableHead>
                {middleHeaders.map((header) => (
                  <TableHead key={header} className="py-4 font-semibold">
                    {header}
                  </TableHead>
                ))}
                <TableHead className="py-4 font-semibold">Date</TableHead>
                <TableHead className="py-4 font-semibold">Status</TableHead>
                <TableHead className="py-4 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="py-12 text-center text-sm text-muted-foreground">
                    No requests found.
                  </TableCell>
                </TableRow>
              ) : null}

              {rows.map((req, idx) => {
                const common = (
                  <>
                    <TableCell className="py-4 font-mono text-xs font-semibold text-gray-700">
                      {req.request_id}
                    </TableCell>
                    <TableCell className="max-w-[150px] py-4">
                      <UserCell request={req} />
                    </TableCell>
                  </>
                );
                const tail = (
                  <>
                    <TableCell className="py-4 text-gray-700">{formatDate(req.createdAt)}</TableCell>
                    <TableCell className="py-4">
                      <RequestStatusBadge status={req.status} />
                    </TableCell>
                    <TableCell className="py-4">
                      <RequestDetailModal request={req} />
                    </TableCell>
                  </>
                );

                if (type === "custom_request") {
                  const d = req.custom_request_details;
                  return (
                    <TableRow key={req.id} className={rowClass(idx)}>
                      {common}
                      <TableCell className="max-w-[250px] truncate py-4 text-gray-700" title={d?.title}>
                        {d?.title ?? "—"}
                      </TableCell>
                      <TableCell className="py-4">
                        {d?.category ? (
                          <Badge className="border-blue-200 bg-blue-100 capitalize text-blue-800 hover:bg-blue-100">
                            {d.category}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-gray-700">
                        <AssetCell
                          name={refName(d?.related_asset) ?? d?.related_asset_name_snapshot}
                        />
                      </TableCell>
                      {tail}
                    </TableRow>
                  );
                }

                if (type === "document_change") {
                  const d = req.document_change_details;
                  return (
                    <TableRow key={req.id} className={rowClass(idx)}>
                      {common}
                      <TableCell className="py-4 text-gray-700">
                        <AssetCell name={refName(d?.asset) ?? d?.asset_name_snapshot} sub={d?.unique_asset_id} />
                      </TableCell>
                      <TableCell className="py-4 text-gray-700">
                        <YesNo value={Boolean(d && d.current_name !== d.new_name)} />
                      </TableCell>
                      <TableCell className="py-4 text-gray-700">
                        <YesNo value={Boolean(d && d.current_address !== d.new_address)} />
                      </TableCell>
                      {tail}
                    </TableRow>
                  );
                }

                if (type === "asset_update") {
                  const d = req.asset_update_details;
                  const delta = d?.computed_price_delta ?? 0;
                  return (
                    <TableRow key={req.id} className={rowClass(idx)}>
                      {common}
                      <TableCell className="py-4 text-gray-700">
                        <AssetCell name={refName(d?.asset) ?? d?.asset_name_snapshot} sub={d?.unique_asset_id} />
                      </TableCell>
                      <TableCell className="py-4 text-gray-700">
                        {d ? (
                          d.update_type === "size" ? (
                            <ChangeArrow label="Size" from={d.current_size} to={d.new_size} unit="sqm" />
                          ) : (
                            <ChangeArrow label="Units" from={d.current_units} to={d.new_units} />
                          )
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        {d ? (
                          <span
                            className={cn(
                              "text-sm font-semibold tabular-nums",
                              delta >= 0 ? "text-orange-600" : "text-green-600"
                            )}
                          >
                            {delta >= 0 ? "+" : "−"}
                            {formatNaira(Math.abs(delta))}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </TableCell>
                      {tail}
                    </TableRow>
                  );
                }

                // Mixed-type layout.
                return (
                  <TableRow key={req.id} className={rowClass(idx)}>
                    {common}
                    <TableCell className="py-4">{REQUEST_TYPE_LABELS[req.request_type]}</TableCell>
                    <TableCell className="py-4">{PAYMENT_STATUS_LABELS[req.payment_status]}</TableCell>
                    <TableCell className="py-4 tabular-nums">{formatNaira(req.processing_fee)}</TableCell>
                    {tail}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </AdminDesktopTableWrap>
    </>
  );
}
