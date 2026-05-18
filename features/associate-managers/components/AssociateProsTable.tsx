"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
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
import { OnboardingDetailsDialog } from "./dialogs/OnboardingDetailsDialog";
import {
  getOnboardedAllTimeCount,
  getOnboardedThisMonthCount,
  type AssociateManager,
  type AssociatePro,
  type ProStatus,
} from "../mock-data";

const PAGE_SIZE = 25;

interface Props {
  pros: AssociatePro[];
  sourceManager: AssociateManager | null;
}

const STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Abandoned", value: "abandoned" },
];

const formatCurrency = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const STATUS_STYLES: Record<ProStatus, { bg: string; text: string; dot: string; label: string }> = {
  active: { bg: "bg-[#E0F2F1]", text: "text-[#00695C]", dot: "bg-[#00695C]", label: "Active" },
  inactive: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Inactive" },
  abandoned: { bg: "bg-red-50", text: "text-[#AD1F2A]", dot: "bg-[#AD1F2A]", label: "Abandoned" },
};

const TODAY_MONTH = "2026-05"; // matches mock TODAY_ISO

const isOnboardedThisMonth = (pro: AssociatePro) =>
  pro.onboardedAt?.slice(0, 7) === TODAY_MONTH;

function StatusBadge({ status }: { status: ProStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <Badge variant="outline" className={cn("border-transparent gap-1.5 font-medium", s.bg, s.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </Badge>
  );
}

function OnboardedBadge({ onboarded }: { onboarded: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
        onboarded
          ? "bg-[#E0F2F1] text-[#00695C]"
          : "bg-gray-100 text-gray-500"
      )}
    >
      {onboarded ? (
        <CheckCircle2 className="h-2.5 w-2.5" />
      ) : (
        <Circle className="h-2.5 w-2.5" />
      )}
      {onboarded ? "Onboarded" : "Not onboarded"}
    </span>
  );
}

export function AssociateProsTable({ pros, sourceManager }: Props) {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const statusParam = searchParams.get("status");
  const searchParam = searchParams.get("search") || "";

  const [search, setSearch] = useState(searchParam);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [singleReassign, setSingleReassign] = useState<AssociatePro | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [onboardingFor, setOnboardingFor] = useState<AssociatePro | null>(null);
  const [detailsFor, setDetailsFor] = useState<AssociatePro | null>(null);
  const [onboardedThisMonthFilter, setOnboardedThisMonthFilter] = useState(false);

  const onboardedThisMonthCount = sourceManager
    ? getOnboardedThisMonthCount(sourceManager.id)
    : pros.filter(isOnboardedThisMonth).length;
  const onboardedAllTimeCount = sourceManager
    ? getOnboardedAllTimeCount(sourceManager.id)
    : pros.filter((p) => p.onboardedAt !== null).length;

  const filtered = useMemo(() => {
    let rows = pros;

    if (statusParam && statusParam !== "all") {
      rows = rows.filter((p) => p.status === statusParam);
    }

    if (onboardedThisMonthFilter) {
      rows = rows.filter(isOnboardedThisMonth);
    }

    const term = search.trim().toLowerCase();
    if (term) {
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.email.toLowerCase().includes(term) ||
          (p.phone?.toLowerCase().includes(term) ?? false)
      );
    }

    return rows;
  }, [pros, statusParam, search, onboardedThisMonthFilter]);

  const start = (page - 1) * PAGE_SIZE;
  const paginated = filtered.slice(start, start + PAGE_SIZE);

  const pageIds = paginated.map((p) => p.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
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
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const selectedPros = useMemo(
    () => pros.filter((p) => selected.has(p.id)),
    [pros, selected]
  );

  const handleResendPack = (pro: AssociatePro) => {
    toast.success(`Pack resent to ${pro.name}`);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-base font-semibold text-gray-900">Associate Pros</h2>
          <button
            type="button"
            onClick={() => setOnboardedThisMonthFilter((v) => !v)}
            aria-pressed={onboardedThisMonthFilter}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              onboardedThisMonthFilter
                ? "bg-[#00695C] text-white"
                : "bg-[#E0F2F1] text-[#00695C] hover:bg-[#c8e6e2]"
            )}
            title="Click to filter to Pros onboarded this month"
          >
            <CheckCircle2 className="h-3 w-3" />
            {onboardedThisMonthCount} onboarded this month
            <span className="text-[#00695C]/70 group-hover:text-[#00695C]">
              · {onboardedAllTimeCount} all-time
            </span>
          </button>
          {onboardedThisMonthFilter && (
            <button
              type="button"
              onClick={() => setOnboardedThisMonthFilter(false)}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900"
            >
              <X className="h-3 w-3" />
              Clear filter
            </button>
          )}
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
          <FilterSelect data={STATUS_OPTIONS} queryKey="status" placeholder="Status" />
        </div>
      </div>

      <div className="bg-white border border-[#E5EAEF] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/60">
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false
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
                  const isOnboarded = pro.onboardedAt !== null;

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
                          aria-label={`Select ${pro.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{pro.name}</span>
                            <OnboardedBadge onboarded={isOnboarded} />
                          </div>
                          <span className="text-xs text-gray-500">
                            {pro.email}
                            {pro.phone ? ` · ${pro.phone}` : ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={pro.status} />
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {formatDate(pro.recruitedAt)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-gray-900">
                        {pro.totalSales}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-gray-900">
                        {formatCurrency(pro.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-gray-600">{pro.lastLogin}</TableCell>
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
                            {isOnboarded ? (
                              <>
                                <DropdownMenuItem onSelect={() => handleResendPack(pro)}>
                                  Resend onboarding pack
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setDetailsFor(pro)}>
                                  View onboarding details
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem onSelect={() => setOnboardingFor(pro)}>
                                Onboard Associate Pro
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setSingleReassign(pro)}>
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
            <Pagination count={filtered.length} currentIdx={page} limit={PAGE_SIZE} />
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
        pro={singleReassign}
        currentManager={sourceManager}
      />

      <BulkReassignDialog
        open={bulkOpen}
        onOpenChange={(open) => {
          setBulkOpen(open);
          if (!open) clearSelection();
        }}
        pros={selectedPros}
        sourceManager={sourceManager}
      />

      <OnboardingDialog
        open={!!onboardingFor}
        onOpenChange={(open) => !open && setOnboardingFor(null)}
        pro={onboardingFor}
      />

      <OnboardingDetailsDialog
        open={!!detailsFor}
        onOpenChange={(open) => !open && setDetailsFor(null)}
        pro={detailsFor}
      />
    </section>
  );
}
