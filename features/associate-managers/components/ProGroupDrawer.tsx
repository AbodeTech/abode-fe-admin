"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, Download, Loader2, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  ManagerDashboardFilterInput,
  ManagerDashboardProRow,
  ProRosterSort,
} from "@/lib/gql/graphql";
import { ProRosterGroup } from "@/lib/gql/graphql";
import {
  DRAWER_PAGE_SIZE,
  useDashboardProsGroup,
  type DashboardProsViewMode,
} from "../hooks/use-dashboard-pros-group";
import { useExportManagerDashboardPros } from "../hooks/use-export-manager-pros";
import {
  formatPeriodRange,
  formatProCurrency,
  formatProDate,
  formatProFullName,
  formatProRelativeOrDate,
} from "../lib/format-pro";
import {
  getGroupDescription,
  getGroupLabel,
  parseOpenGroupParam,
} from "../lib/roster-group-labels";
import { PRO_SORT_OPTIONS } from "../lib/roster-filter-options";

interface Props {
  viewMode: DashboardProsViewMode;
  managerId: string | null;
  periodFilter: ManagerDashboardFilterInput;
  roster?: "associate-pro" | "associate";
  exportFilenamePrefix?: string;
  exportManagerId?: string | null;
}

type ProStatus = "active" | "inactive" | "abandoned";

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

const normalizeStatus = (s: string): ProStatus =>
  s === "active" || s === "inactive" || s === "abandoned" ? s : "inactive";

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[normalizeStatus(status)];
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent gap-1.5 font-medium shrink-0", s.bg, s.text)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </Badge>
  );
}

function ProGroupCard({ pro }: { pro: ManagerDashboardProRow }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">
              {formatProFullName(pro)}
            </h3>
            {pro.onboardedAt && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium px-1.5 py-0.5 border border-emerald-100"
                title={`Onboarded ${formatProDate(pro.onboardedAt)}`}
              >
                <CheckCircle2 className="h-3 w-3" />
                Onboarded
              </span>
            )}
          </div>
          {pro.email && (
            <p className="text-sm text-gray-600 truncate mt-0.5">{pro.email}</p>
          )}
          {pro.phoneNumber && (
            <p className="text-sm text-gray-500">{pro.phoneNumber}</p>
          )}
        </div>
        <StatusBadge status={pro.status} />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-gray-500 text-xs">Total sales</dt>
          <dd className="font-medium text-gray-900">{pro.totalSales.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-gray-500 text-xs">Revenue generated</dt>
          <dd className="font-medium text-gray-900">
            {formatProCurrency(pro.revenueGenerated)}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 text-xs">Last login</dt>
          <dd className="font-medium text-gray-900">
            {formatProRelativeOrDate(pro.lastLogin)}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 text-xs">Date recruited</dt>
          <dd className="font-medium text-gray-900">
            {formatProDate(pro.dateRecruited)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function ProGroupDrawer({
  viewMode,
  managerId,
  periodFilter,
  roster = "associate-pro",
  exportFilenamePrefix = "roster",
  exportManagerId = null,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const openGroup = parseOpenGroupParam(searchParams.get("open_group"));
  const groupSortRaw = searchParams.get("group_sort");
  const groupSort =
    groupSortRaw &&
    PRO_SORT_OPTIONS.some((o) => o.value === groupSortRaw && o.value !== "all")
      ? (groupSortRaw as ProRosterSort)
      : null;
  const groupPage = Math.max(1, Number(searchParams.get("group_page")) || 1);

  const query = useDashboardProsGroup({
    viewMode,
    managerId,
    periodFilter,
    group: openGroup ?? ProRosterGroup.SellingInPeriod,
    sort: groupSort,
    page: groupPage,
    enabled: !!openGroup,
  });

  const { mutateAsync: exportPros, isPending: isExporting } =
    useExportManagerDashboardPros();

  const updateDrawerParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const closeDrawer = () => {
    updateDrawerParams({
      open_group: null,
      group_sort: null,
      group_page: null,
    });
  };

  const total = query.data?.associateProsGroupTotal ?? 0;
  const rows = query.data?.associatePros ?? [];
  const totalPages = Math.max(1, Math.ceil(total / DRAWER_PAGE_SIZE));
  const periodLabel = formatPeriodRange(query.data?.period);

  const canExport = viewMode === "admin" || viewMode === "self";

  const handleExport = async () => {
    if (!canExport || !openGroup) return;
    try {
      await exportPros({
        managerId: exportManagerId,
        filter: {
          ...periodFilter,
          proGroup: openGroup,
          ...(groupSort ? { proSort: groupSort } : {}),
        },
        filenamePrefix: `${exportFilenamePrefix}-${openGroup}`,
      });
      toast.success("List exported successfully.");
    } catch (err) {
      const message = (err as Error).message || "";
      if (/Export limit exceeded|EXPORT_LIMIT_EXCEEDED/i.test(message)) {
        toast.error(
          "Too many rows to export — narrow your date range or apply a filter."
        );
      } else {
        toast.error(message || "Failed to export list.");
      }
    }
  };

  return (
    <Sheet
      open={!!openGroup}
      onOpenChange={(open) => {
        if (!open) closeDrawer();
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="border-b border-gray-200 px-6 py-5 pr-12 space-y-3 text-left">
          <div className="flex items-center gap-2 text-[#00695C]">
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Roster drill-down
            </span>
          </div>
          <SheetTitle className="text-xl text-gray-900">
            {openGroup ? getGroupLabel(openGroup, roster) : "Roster"}
          </SheetTitle>
          <SheetDescription className="text-gray-600 leading-relaxed">
            {openGroup ? getGroupDescription(openGroup) : ""}
          </SheetDescription>
          {openGroup && (
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">
                {total.toLocaleString()}
              </span>{" "}
              {total === 1 ? "person" : "people"} · {periodLabel}
            </p>
          )}
        </SheetHeader>

        <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50/80">
          <Select
            value={groupSort ?? "all"}
            onValueChange={(value) => {
              updateDrawerParams({
                group_sort: value === "all" ? null : value,
                group_page: "1",
              });
            }}
          >
            <SelectTrigger className="w-[200px] h-9 bg-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {PRO_SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canExport ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-white"
              onClick={handleExport}
              disabled={isExporting || total === 0}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export CSV
            </Button>
          ) : (
            <div className="w-[100px]" />
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 relative min-h-0">
          {query.isFetching && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {query.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {(query.error as Error).message || "Failed to load roster."}
            </div>
          )}

          {!query.isError && rows.length === 0 && !query.isFetching && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Users className="h-10 w-10 text-gray-300 mb-3" />
              <p className="font-medium text-gray-900">No one in this group</p>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                Try widening the date range or pick a different metric.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {rows.map((pro) => (
              <ProGroupCard key={pro.id} pro={pro} />
            ))}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-white">
            <p className="text-sm text-gray-500">
              Page {groupPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={groupPage <= 1 || query.isFetching}
                onClick={() =>
                  updateDrawerParams({ group_page: String(groupPage - 1) })
                }
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={groupPage >= totalPages || query.isFetching}
                onClick={() =>
                  updateDrawerParams({ group_page: String(groupPage + 1) })
                }
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
