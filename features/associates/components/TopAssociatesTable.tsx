"use client";

import React, { useState } from "react";
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
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import type { TopAssociate } from "../schemas/top-associate.schema";

interface TopAssociatesTableProps {
  data?: TopAssociate[] | null;
  isLoading?: boolean;
  /** Rank continues across pages, so page 2 starts at 26, not 1. */
  rankOffset?: number;
}

const formatCurrency = (amount?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount ?? 0);

const formatNumber = (value?: number | null) =>
  new Intl.NumberFormat("en-NG").format(value ?? 0);

interface ClientBreakdownProps {
  total: number;
  users: number;
  associates: number;
  associatePros: number;
}

function ClientBreakdown({ total, users, associates, associatePros }: ClientBreakdownProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold tabular-nums leading-none">{formatNumber(total)}</span>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[10px] tabular-nums text-muted-foreground/70 leading-none">
          <span className="font-black text-slate-500">{users}</span>
          <span className="ml-0.5 font-medium">usr</span>
        </span>
        <span className="text-[10px] tabular-nums text-muted-foreground/70 leading-none">
          <span className="font-black text-emerald-600">{associates}</span>
          <span className="ml-0.5 font-medium">asc</span>
        </span>
        <span className="text-[10px] tabular-nums text-muted-foreground/70 leading-none">
          <span className="font-black text-blue-700">{associatePros}</span>
          <span className="ml-0.5 font-medium">pro</span>
        </span>
      </div>
    </div>
  );
}

// Rank accent: top 3 get a coloured left border + faint row bg
const rankStyle = (rank: number) => {
  if (rank === 1) return { border: "border-l-4 border-l-amber-400",   bg: "bg-amber-50/60" };
  if (rank === 2) return { border: "border-l-4 border-l-slate-400",   bg: "bg-slate-50/60" };
  if (rank === 3) return { border: "border-l-4 border-l-orange-400",  bg: "bg-orange-50/40" };
  return         { border: "border-l-4 border-l-transparent",        bg: "" };
};

const rankLabel = (rank: number) => {
  if (rank === 1) return <span className="text-lg font-black text-amber-500 tabular-nums leading-none">1</span>;
  if (rank === 2) return <span className="text-lg font-black text-slate-400 tabular-nums leading-none">2</span>;
  if (rank === 3) return <span className="text-lg font-black text-orange-400 tabular-nums leading-none">3</span>;
  return <span className="text-sm font-bold text-muted-foreground/50 tabular-nums leading-none">{rank}</span>;
};

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  if (status === "associate-pro")
    return (
      <Badge className="text-[9px] bg-blue-500 hover:bg-blue-500 uppercase font-black tracking-wider px-1.5 py-0 h-4">
        Pro
      </Badge>
    );
  if (status === "associate")
    return (
      <Badge className="text-[9px] bg-emerald-500 hover:bg-emerald-500 uppercase font-black tracking-wider px-1.5 py-0 h-4">
        Assoc
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0 h-4">
      {status}
    </Badge>
  );
}

function EfficiencyBar({ rate }: { rate: number }) {
  const color =
    rate >= 90 ? "bg-emerald-500" : rate >= 70 ? "bg-amber-400" : "bg-rose-500";
  return (
    <div className="flex min-w-0 items-center gap-2 sm:min-w-[100px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span
        className={cn(
          "text-xs font-black tabular-nums w-8 text-right",
          rate >= 90 ? "text-emerald-600" : rate >= 70 ? "text-amber-600" : "text-rose-600"
        )}
      >
        {rate}%
      </span>
    </div>
  );
}

export function TopAssociatesTable({
  data,
  isLoading,
  rankOffset = 0,
}: TopAssociatesTableProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (idx: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });

  const associates = data ?? [];

  if (isLoading) {
    return (
      <div className="min-w-0 overflow-x-auto rounded-xl border bg-background shadow-sm">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="flex min-w-[280px] items-center gap-4 border-b px-4 py-4 last:border-0 sm:px-6"
          >
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24 ml-auto" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (associates.length === 0) {
    return (
      <div className="rounded-xl border bg-background shadow-sm px-8 py-16 text-center">
        <p className="text-sm font-semibold text-muted-foreground">No associates found.</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <>
      <AdminMobileStack className="space-y-3">
        {associates.map((associate, idx) => {
          const rank = rankOffset + idx + 1;
          const balance = associate.balance;
          const rate = associate.collection_rate;
          return (
            <AdminMobileCard key={associate.user_id} title={associate.name} subtitle={associate.email || undefined}>
              <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                <div className="flex items-center gap-2">{rankLabel(rank)}</div>
                <StatusBadge status={associate.status} />
              </div>
              <div className="py-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Clients</span>
                <ClientBreakdown
                  total={associate.no_of_clients ?? 0}
                  users={associate.referred_user_count ?? 0}
                  associates={associate.referred_associate_count ?? 0}
                  associatePros={associate.referred_associate_pro_count ?? 0}
                />
              </div>
              <AdminMobileField label="Expected" value={formatCurrency(associate.expected)} />
              <AdminMobileField label="Received" value={formatCurrency(associate.received)} />
              <AdminMobileField label="Balance" value={formatCurrency(balance)} />
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Collection</span>
                <EfficiencyBar rate={rate} />
              </div>
              <AdminMobileField label="Commission" value={formatCurrency(associate.commission)} />
              <AdminMobileField label="Referred by" value={associate.sales_person || "—"} />
              <AdminMobileField label="Units sold" value={formatNumber(associate.units_sold)} />
              <AdminMobileField label="Size sold" value={`${formatNumber(associate.size_sold)} sqm`} />
            </AdminMobileCard>
          );
        })}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
    <div className="min-w-0 overflow-x-auto rounded-xl border bg-background shadow-sm">
      <Table className="min-w-[1180px]">
        <TableHeader className="bg-muted/20">
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="w-12 pl-3 text-[10px] font-bold uppercase tracking-wider sm:pl-5">#</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider">Associate</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider">Clients</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right">Expected</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right">Received</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right">Balance</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider">Collection</TableHead>
            <TableHead className="pr-3 text-right text-[10px] font-bold uppercase tracking-wider sm:pr-6">Commission</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {associates.map((associate, idx) => {
            const rank = rankOffset + idx + 1;
            const { border, bg } = rankStyle(rank);
            const isOpen = expanded.has(idx);
            const balance = associate.balance;
            const rate = associate.collection_rate;

            return (
              <React.Fragment key={associate.user_id}>
                {/* Primary row */}
                <TableRow
                  className={cn(
                    "group transition-colors cursor-pointer",
                    border,
                    bg,
                    "hover:brightness-95"
                  )}
                  onClick={() => toggle(idx)}
                >
                  {/* Rank */}
                  <TableCell className="w-12 pl-3 sm:pl-5">
                    {rankLabel(rank)}
                  </TableCell>

                  {/* Associate identity */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold leading-tight">
                          {associate.name}
                        </span>
                      </div>
                      <StatusBadge status={associate.status} />
                    </div>
                  </TableCell>

                  {/* Clients */}
                  <TableCell>
                    <ClientBreakdown
                      total={associate.no_of_clients ?? 0}
                      users={associate.referred_user_count ?? 0}
                      associates={associate.referred_associate_count ?? 0}
                      associatePros={associate.referred_associate_pro_count ?? 0}
                    />
                  </TableCell>

                  {/* Expected */}
                  <TableCell className="text-right">
                    <span className="text-sm tabular-nums text-muted-foreground font-medium">
                      {formatCurrency(associate.expected)}
                    </span>
                  </TableCell>

                  {/* Received */}
                  <TableCell className="text-right">
                    <span className="text-sm font-bold tabular-nums text-emerald-600">
                      {formatCurrency(associate.received)}
                    </span>
                  </TableCell>

                  {/* Balance */}
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        balance > 0 ? "text-amber-600" : "text-muted-foreground"
                      )}
                    >
                      {formatCurrency(balance)}
                    </span>
                  </TableCell>

                  {/* Collection rate */}
                  <TableCell>
                    <EfficiencyBar rate={rate} />
                  </TableCell>

                  {/* Commission */}
                  <TableCell className="pr-3 text-right sm:pr-6">
                    <span className="text-sm font-bold tabular-nums">
                      {formatCurrency(associate.commission)}
                    </span>
                  </TableCell>

                  {/* Expand toggle */}
                  <TableCell className="w-8 pr-3">
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </TableCell>
                </TableRow>

                {/* Expanded detail row */}
                {isOpen && (
                  <TableRow className={cn("hover:bg-transparent", bg)}>
                    <TableCell colSpan={9} className="py-0 pl-12 pr-6 pb-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-xs pt-1 border-t border-dashed border-border/50">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Email</span>
                          <span className="font-medium truncate">{associate.email || "—"}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Referred by</span>
                          <span className="font-medium">{associate.sales_person || "—"}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Units Sold</span>
                          <span className="font-bold tabular-nums">{formatNumber(associate.units_sold)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Size Sold</span>
                          <span className="font-bold tabular-nums">{formatNumber(associate.size_sold)} sqm</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
      </AdminDesktopTableWrap>
    </>
  );
}
