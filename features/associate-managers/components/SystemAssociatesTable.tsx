"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { cn } from "@/lib/utils";
import type { RosterRow } from "../schemas/manager-dashboard.schema";
import {
  PRO_GROUP_OPTIONS,
  PRO_SORT_OPTIONS,
  proGroupOptionsForScope,
} from "../lib/roster-filter-options";

interface Props {
  rows: RosterRow[];
  /** Total count from the server (for pagination). When the BE already
   * paginates, pass the server count; we paginate via callback only. */
  totalCount?: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

const formatCurrency = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const formatDate = (iso: Date | string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatRelativeOrDate = (iso: Date | string | null | undefined) => {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diffMs < hr) return `${Math.max(1, Math.round(diffMs / min))}m ago`;
  if (diffMs < day) return `${Math.round(diffMs / hr)}h ago`;
  if (diffMs < 7 * day) return `${Math.round(diffMs / day)}d ago`;
  return formatDate(iso);
};

type Status = "active" | "inactive" | "abandoned";

const normalizeStatus = (s: string): Status =>
  s === "active" || s === "inactive" || s === "abandoned" ? s : "inactive";

const STATUS_STYLES: Record<
  Status,
  { bg: string; text: string; dot: string; label: string }
> = {
  active: { bg: "bg-[#E0F2F1]", text: "text-[#00695C]", dot: "bg-[#00695C]", label: "Active" },
  inactive: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Inactive" },
  abandoned: { bg: "bg-red-50", text: "text-[#AD1F2A]", dot: "bg-[#AD1F2A]", label: "Abandoned" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[normalizeStatus(status)];
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent gap-1.5 font-medium", s.bg, s.text)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </Badge>
  );
}

const fullName = (p: RosterRow) =>
  `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email || "Associate";

export function SystemAssociatesTable({
  rows,
  totalCount,
  page,
  limit,
  onPageChange,
  isLoading = false,
}: Props) {
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const proGroup = searchParams.get("pro_group");
  const activeGroupLabel =
    proGroup && proGroup !== "all"
      ? (PRO_GROUP_OPTIONS.find((o) => o.value === proGroup)?.label ?? proGroup)
      : null;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((p) => {
      const name = fullName(p).toLowerCase();
      return (
        name.includes(term) ||
        (p.email?.toLowerCase().includes(term) ?? false) ||
        (p.phone_number?.toLowerCase().includes(term) ?? false)
      );
    });
  }, [rows, search]);

  const count = totalCount ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(count / limit));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Associates</h2>
          <p className="text-xs text-gray-500">
            {activeGroupLabel ? (
              <>
                Showing {count.toLocaleString()} ·{" "}
                <span className="font-medium">{activeGroupLabel}</span>
              </>
            ) : (
              <>
                All associate-tier users
                {count > 0 ? ` · ${count.toLocaleString()} total` : ""}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search this page by name, email or phone"
              className="pl-8 h-10 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <FilterSelect
            data={[...proGroupOptionsForScope("system")]}
            queryKey="pro_group"
            placeholder="Roster group"
          />
          <FilterSelect
            data={[...PRO_SORT_OPTIONS]}
            queryKey="pro_sort"
            placeholder="Sort by"
          />
        </div>
      </div>

      <div className="relative bg-white border border-[#E5EAEF] rounded-lg overflow-hidden">
        {isLoading && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-white/70"
            aria-live="polite"
            aria-busy="true"
          >
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/60">
                <TableHead className="font-semibold text-gray-700">Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Date Recruited</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Total Sales</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Revenue Generated</TableHead>
                <TableHead className="font-semibold text-gray-700">Last Login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    No associates match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((pro) => (
                  <TableRow key={pro.id} className="hover:bg-gray-50/60">
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{fullName(pro)}</span>
                          {pro.onboarded_at && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium px-1.5 py-0.5 border border-emerald-100"
                              title={`Onboarded ${formatDate(pro.onboarded_at)}`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Onboarded
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {pro.email}
                          {pro.phone_number ? ` · ${pro.phone_number}` : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={pro.status} />
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {formatDate(pro.date_recruited)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-gray-900">
                      {pro.total_sales}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-gray-900">
                      {formatCurrency(pro.revenue_generated)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {formatRelativeOrDate(pro.last_login)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {count > limit && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#E5EAEF]">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isLoading}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
