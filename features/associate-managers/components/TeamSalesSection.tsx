"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TeamSalesTable } from "./TeamSalesTable";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useAdminManagerTeamSales,
  useManagerTeamSales,
  DEFAULT_TEAM_SALES_LIMIT,
} from "../hooks/use-team-sales";
import { useExportManagerSalesRecord } from "../hooks/use-export-manager-sales";

interface Props {
  viewAs: "super-admin" | "manager";
  activeManagerId: string | null;
  /** Date range from the URL filter, shared with the dashboard panels above. */
  startDate?: string | null;
  endDate?: string | null;
}

export function TeamSalesSection({
  viewAs,
  activeManagerId,
  startDate,
  endDate,
}: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const filters = {
    search: debouncedSearch || null,
    startDate: startDate ?? null,
    endDate: endDate ?? null,
  };

  const adminQuery = useAdminManagerTeamSales(activeManagerId, {
    page,
    limit: DEFAULT_TEAM_SALES_LIMIT,
    filters,
    enabled: viewAs === "super-admin",
  });
  const selfQuery = useManagerTeamSales({
    page,
    limit: DEFAULT_TEAM_SALES_LIMIT,
    filters,
    enabled: viewAs === "manager",
  });

  const query = viewAs === "super-admin" ? adminQuery : selfQuery;
  const records = (query.data?.data ?? []).filter(
    (r): r is NonNullable<typeof r> => r !== null
  );
  const count = query.data?.count ?? 0;

  const { mutateAsync: exportSales, isPending: isExportingSales } =
    useExportManagerSalesRecord();

  const handleExportSales = async () => {
    try {
      await exportSales({
        managerId: viewAs === "manager" ? null : activeManagerId,
        filters,
        filenamePrefix: "team-sales",
      });
      toast.success("Team sales exported successfully.");
    } catch (err) {
      const message = (err as Error).message || "";
      if (/Export limit exceeded|EXPORT_LIMIT_EXCEEDED/i.test(message)) {
        toast.error("Too many rows to export — narrow your date range or search.");
      } else {
        toast.error(message || "Failed to export team sales.");
      }
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Team Sales</h2>
          <p className="text-xs text-gray-500">
            Purchases by customers your Pros referred
            {count > 0 ? ` · ${count.toLocaleString()} total` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by buyer, asset, or referrer"
              className="pl-8 h-10 bg-white"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 bg-white"
            onClick={handleExportSales}
            disabled={isExportingSales}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExportingSales ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
      </div>

      <div className="bg-white border border-[#E5EAEF] rounded-lg overflow-hidden">
        {query.isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading team sales…
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            No sales yet from customers your team referred.
          </div>
        ) : (
          <>
            <TeamSalesTable records={records} />
            {count > DEFAULT_TEAM_SALES_LIMIT && (
              <TeamSalesPager
                count={count}
                page={page}
                limit={DEFAULT_TEAM_SALES_LIMIT}
                onChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}

/** Local pagination — section-scoped state to avoid clashing with the
 * AssociateProsTable's URL `?page=` param on the same page. */
function TeamSalesPager({
  count,
  page,
  limit,
  onChange,
}: {
  count: number;
  page: number;
  limit: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(count / limit));
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#E5EAEF]">
      <p className="text-xs text-gray-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
