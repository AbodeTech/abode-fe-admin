"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  useAssetTransactions,
  AssetTransactionsTable,
  AssetTransactionDataPoints,
  useApproveAssetTransaction,
  useDeclineAssetTransaction,
} from "@/features/transactions";
import { Pagination } from "@/components/shared/Pagination";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { DateFilter } from "@/components/shared/DateFilter";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function AssetTransactionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;
  const limit = 10;

  // Read filters directly from URL
  const salesType = searchParams.get("salestype");
  const status = searchParams.get("transactionstatus");
  const transactionType = searchParams.get("transactiontype");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const search = searchParams.get("search") || "";

  const [searchTerm, setSearchTerm] = useState(search);

  // Debounce search update to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (searchTerm !== search) {
        if (searchTerm) {
          params.set("search", searchTerm);
        } else {
          params.delete("search");
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, router, searchParams, search]);

  const { data, isLoading, error } = useAssetTransactions({
    page,
    limit,
    search: searchTerm,
    salesType: salesType === "all" ? null : salesType,
    status: status === "all" ? null : status,
    transactionType: transactionType === "all" ? null : transactionType,
    startDate,
    endDate,
  });

  const { mutateAsync: approveTransaction } = useApproveAssetTransaction();
  const { mutateAsync: declineTransaction } = useDeclineAssetTransaction();

  const totalCount = data?.count || 0;

  const handleApprove = async (id: string) => {
    await approveTransaction(id);
  };

  const handleDecline = async (id: string, message: string) => {
    await declineTransaction({ transactionId: id, message });
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Search Bar */}
      <div className="relative bg-white max-w-2xl">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for asset by name, location..."
          className="pl-8 h-11 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <FilterSelect
          queryKey="salestype"
          placeholder="All Sales Type"
          data={[
            { label: "All Sales Type", value: "all" },
            { label: "Land Banking", value: "land_banking" },
            { label: "Flex", value: "flex" },
            { label: "Full Ownership", value: "full_ownership" },
          ]}
        />

        <FilterSelect
          queryKey="transactionstatus"
          placeholder="All Status"
          data={[
            { label: "All Status", value: "all" },
            { label: "Pending", value: "pending" },
            { label: "Approved", value: "approved" },
            { label: "Declined", value: "declined" },
          ]}
        />

        <FilterSelect
          queryKey="transactiontype"
          placeholder="All Types"
          data={[
            { label: "All Types", value: "all" },
            { label: "Credit", value: "credit" },
            { label: "Debit", value: "debit" },
          ]}
        />

        <DateFilter />
      </div>

      {/* Title */}
      <h3 className="font-sans font-semibold text-[#333333] text-xl uppercase">
        Asset Transactions
      </h3>

      {error && (
        <div className="p-3 rounded-md border border-red-200 bg-red-50 text-sm text-red-600">
          {(error as Error).message ?? "Unable to load asset transactions"}
        </div>
      )}

      {/* Statistics Cards */}
      <AssetTransactionDataPoints />

      {/* Transaction Table */}
      <div className="bg-white border border-[#E5EAEF] rounded-md overflow-hidden pb-10">
        <AssetTransactionsTable
          data={data?.data}
          isLoading={isLoading}
          onApprove={handleApprove}
          onDecline={handleDecline}
        />

        {!isLoading && totalCount > 0 && (
          <div className="mt-6 px-4">
            <Pagination count={totalCount} currentIdx={page} limit={limit} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssetTransactionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <AssetTransactionsContent />
    </Suspense>
  );
}
