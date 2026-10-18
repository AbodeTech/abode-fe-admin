"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Download, Loader2, MoreHorizontal, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { Pagination } from "@/components/shared/Pagination";
import { cn } from "@/lib/utils";
import { ReassignProDialog } from "./dialogs/ReassignProDialog";
import { BulkReassignDialog } from "./dialogs/BulkReassignDialog";
import { OnboardingDialog } from "./dialogs/OnboardingDialog";
import type { RosterRow } from "../schemas/manager-dashboard.schema";
import {
  PRO_GROUP_OPTIONS,
  PRO_SORT_OPTIONS,
  proGroupOptionsForScope,
} from "../lib/roster-filter-options";

const PAGE_SIZE = 25;

import type { AssociatePro, ProStatus } from "../mock-data";

interface Props {
  pros: RosterRow[];
  /** The Admin id of the manager whose roster is being viewed. */
  sourceManagerId: string | null;
  /**
   * Which dashboard scope the roster came from. Drives the group dropdown:
   * the contributor groups credit an individual pro, which the BE answers
   * with an empty roster on the combined scope.
   */
  scope?: "single" | "combined";
  /** Filtered roster count from the server (`associate_pros_group_total`). */
  groupTotal?: number;
  isLoading?: boolean;
  onExport?: () => void;
  isExporting?: boolean;
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

const STATUS_STYLES: Record<
  ProStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  active: {
    bg: "bg-[#E0F2F1]",
    text: "text-[#00695C]",
    dot: "bg-[#00695C]",
    label: "Active",
  },
  inactive: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Inactive",
  },
  abandoned: {
    bg: "bg-red-50",
    text: "text-[#AD1F2A]",
    dot: "bg-[#AD1F2A]",
    label: "Abandoned",
  },
};

const normalizeStatus = (s: string): ProStatus => {
  if (s === "active" || s === "inactive" || s === "abandoned") return s;
  return "inactive";
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[normalizeStatus(status)];
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent gap-1.5 font-medium",
        s.bg,
        s.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </Badge>
  );
}

const fullName = (p: RosterRow) =>
  `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email || "Pro";

/** Adapter: live RosterRow → legacy AssociatePro shape that the
 * Reassign/Bulk dialogs still consume. Removed once those dialogs are refactored. */
const toLegacyPro = (p: RosterRow): AssociatePro => ({
  id: p.id,
  name: fullName(p),
  email: p.email ?? "",
  phone: p.phone_number ?? null,
  status: normalizeStatus(p.status),
  recruitedAt: p.date_recruited
    ? new Date(p.date_recruited).toISOString().slice(0, 10)
    : "",
  onboardedAt: p.onboarded_at
    ? new Date(p.onboarded_at).toISOString().slice(0, 10)
    : null,
  totalSales: p.total_sales,
  totalRevenue: p.revenue_generated,
  lastLogin: p.last_login
    ? formatRelativeOrDate(p.last_login)
    : "Never",
});

export function AssociateProsTable({
  pros,
  sourceManagerId,
  scope = "single",
  groupTotal,
  isLoading = false,
  onExport,
  isExporting = false,
}: Props) {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const searchParam = searchParams.get("search") || "";

  const [search, setSearch] = useState(searchParam);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [singleReassign, setSingleReassign] =
    useState<RosterRow | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [onboardingFor, setOnboardingFor] =
    useState<RosterRow | null>(null);

  const filtered = useMemo(() => {
    let rows = pros;

    const term = search.trim().toLowerCase();
    if (term) {
      rows = rows.filter((p) => {
        const name = fullName(p).toLowerCase();
        return (
          name.includes(term) ||
          (p.email?.toLowerCase().includes(term) ?? false) ||
          (p.phone_number?.toLowerCase().includes(term) ?? false)
        );
      });
    }

    return rows;
  }, [pros, search]);

  const start = (page - 1) * PAGE_SIZE;
  const paginated = filtered.slice(start, start + PAGE_SIZE);

  const pageIds = paginated.map((p) => p.id);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPageSelected = pageIds.some((id) => selected.has(id));

  const togglePro = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const selectedProsLegacy = useMemo(
    () => pros.filter((p) => selected.has(p.id)).map(toLegacyPro),
    [pros, selected]
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Associate Pros
          </h2>
          {(() => {
            const proGroup = searchParams.get("pro_group");
            if (!proGroup || proGroup === "all") return null;
            const label =
              PRO_GROUP_OPTIONS.find((o) => o.value === proGroup)?.label ??
              proGroup;
            return (
              <p className="text-xs text-gray-500 mt-0.5">
                Showing {(groupTotal ?? filtered.length).toLocaleString()} ·{" "}
                <span className="font-medium">{label}</span>
              </p>
            );
          })()}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or phone"
              className="pl-8 h-10 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <FilterSelect
            data={[...proGroupOptionsForScope(scope)]}
            queryKey="pro_group"
            placeholder="Roster group"
          />
          <FilterSelect
            data={[...PRO_SORT_OPTIONS]}
            queryKey="pro_sort"
            placeholder="Sort by"
          />
          {onExport && (
            <Button
              type="button"
              variant="outline"
              className="h-10 bg-white"
              onClick={onExport}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting…" : "Export CSV"}
            </Button>
          )}
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
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      allOnPageSelected
                        ? true
                        : someOnPageSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={togglePage}
                    aria-label="Select all on this page"
                  />
                </TableHead>
                <TableHead className="font-semibold text-gray-700">Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Date Recruited</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Total Sales</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Revenue Generated</TableHead>
                <TableHead className="font-semibold text-gray-700">Last Login</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                    No Associate Pros match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((pro) => {
                  const isSelected = selected.has(pro.id);
                  return (
                    <TableRow
                      key={pro.id}
                      className={cn(
                        "hover:bg-gray-50/60",
                        isSelected && "bg-[#E0F2F1]/40"
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => togglePro(pro.id)}
                          aria-label={`Select ${fullName(pro)}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900">
                              {fullName(pro)}
                            </span>
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
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Row actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => setOnboardingFor(pro)}
                            >
                              {pro.onboarded_at
                                ? "View onboarding"
                                : "Onboard Associate Pro"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => setSingleReassign(pro)}
                            >
                              Reassign to manager
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

        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-[#E5EAEF]">
            <Pagination
              count={groupTotal ?? filtered.length}
              currentIdx={page}
              limit={PAGE_SIZE}
            />
          </div>
        )}
      </div>

      {/* Bulk action bar — sticky to viewport bottom */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto bg-gray-900 text-white rounded-full shadow-lg pl-5 pr-2 py-2 flex items-center gap-4">
            <span className="text-sm font-medium">
              {selected.size} {selected.size === 1 ? "Pro" : "Pros"} selected
            </span>
            <div className="h-4 w-px bg-white/30" />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setBulkOpen(true)}
              className="bg-white text-gray-900 hover:bg-gray-100 rounded-full"
            >
              Reassign to manager
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={clearSelection}
              className="h-8 w-8 text-white hover:bg-white/10 rounded-full"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ReassignProDialog
        open={!!singleReassign}
        onOpenChange={(open) => !open && setSingleReassign(null)}
        pro={
          singleReassign
            ? {
                id: singleReassign.id,
                name: fullName(singleReassign),
                email: singleReassign.email ?? "",
              }
            : null
        }
        currentManagerId={sourceManagerId}
      />

      <BulkReassignDialog
        open={bulkOpen}
        onOpenChange={(open) => {
          setBulkOpen(open);
          if (!open) clearSelection();
        }}
        pros={selectedProsLegacy}
        sourceManagerId={sourceManagerId}
      />

      <OnboardingDialog
        open={!!onboardingFor}
        onOpenChange={(open) => !open && setOnboardingFor(null)}
        pro={
          onboardingFor
            ? {
                id: onboardingFor.id,
                name: fullName(onboardingFor),
                email: onboardingFor.email ?? "",
                phone: onboardingFor.phone_number ?? null,
              }
            : null
        }
      />
    </section>
  );
}
