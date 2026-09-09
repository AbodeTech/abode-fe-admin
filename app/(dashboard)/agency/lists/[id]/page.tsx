"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { PageContentLoader } from "@/components/shared/page-content-loader";
import { useDebounce } from "@/hooks/use-debounce";
import { useHasPermission } from "@/hooks/use-admin-permission";
import {
  AgencyCommissionsTable,
  AgencyDetailView,
  AgencyMembersTable,
  DEFAULT_AGENCY_LIMIT,
  useAgency,
  useAgencyCommissions,
  useAgencyMembers,
  useExportAgencyCommissions,
  useSetUserOrg,
  type AgencyMember,
} from "@/features/agency";
import { getErrorMessage } from "@/features/agency/utils/error-message";

/**
 * Agency detail. Each tab owns its own query state, so paging the roster
 * doesn't reset the ledger's date range and vice versa — hence the local
 * state here rather than shared URL params.
 */
function MembersTab({ agencyId }: { agencyId: string }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const canManage = useHasPermission("manage_agencies");
  const { mutateAsync: setUserOrg, isPending, variables } = useSetUserOrg();

  const { data, isLoading, error } = useAgencyMembers(agencyId, {
    page,
    limit: DEFAULT_AGENCY_LIMIT,
    q: debouncedSearch || null,
  });

  const handleRemove = async (member: Pick<AgencyMember, "id">) => {
    try {
      await setUserOrg({ userId: member.id, agencyId: null });
      toast.success("Member removed from the agency");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove member"));
    }
  };

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        {getErrorMessage(error, "Failed to load members.")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AgencyMembersTable
        rows={data?.items}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onRemove={canManage ? handleRemove : undefined}
        removingId={isPending ? (variables?.userId ?? null) : null}
      />
      <TabPager
        total={data?.meta.total ?? 0}
        limit={data?.meta.limit ?? DEFAULT_AGENCY_LIMIT}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}

/**
 * A local pager. The shared `Pagination` drives the URL, which would make the
 * two tabs fight over the same `?page` param.
 */
function TabPager({
  total,
  limit,
  page,
  onPageChange,
}: {
  total: number;
  limit: number;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-md border border-gray-200 px-3 py-1.5 disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="rounded-md border border-gray-200 px-3 py-1.5 disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function CommissionsTab({ agencyId }: { agencyId: string }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const canExport = useHasPermission("export_agencies");
  const { mutateAsync: exportCsv, isPending: exporting } =
    useExportAgencyCommissions(agencyId);

  const filters = {
    page,
    limit: DEFAULT_AGENCY_LIMIT,
    start_date: startDate || null,
    end_date: endDate || null,
  };

  const { data, isLoading, error } = useAgencyCommissions(agencyId, filters);

  const handleExport = async () => {
    try {
      await exportCsv(filters);
      toast.success("Export downloaded");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to export commissions"));
    }
  };

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        {getErrorMessage(error, "Failed to load the commission ledger.")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AgencyCommissionsTable
        rows={data?.items}
        isLoading={isLoading}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={(value) => {
          setStartDate(value);
          setPage(1);
        }}
        onEndDateChange={(value) => {
          setEndDate(value);
          setPage(1);
        }}
        onExport={canExport ? handleExport : undefined}
        isExporting={exporting}
      />
      <TabPager
        total={data?.meta.total ?? 0}
        limit={data?.meta.limit ?? DEFAULT_AGENCY_LIMIT}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}

export default function AgencyDetailPage() {
  const params = useParams();
  const agencyId = params?.id as string;

  const { data, isLoading, error } = useAgency(agencyId);

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading agency details</h3>
        <p>{getErrorMessage(error, "An unexpected error occurred.")}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <PageContentLoader label="Loading agency details…" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-700">
        Agency not found.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-4 sm:space-y-6">
      <AgencyDetailView
        agency={data}
        membersSlot={<MembersTab agencyId={agencyId} />}
        commissionsSlot={<CommissionsTab agencyId={agencyId} />}
      />
    </div>
  );
}
