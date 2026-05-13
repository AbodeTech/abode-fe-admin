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
  const assetType = searchParams.get("assettype");
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
        router.push(`?${params.toString()}`, { scroll: false });
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
    assetType: assetType === "all" ? null : assetType,
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
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-16 sm:px-4 sm:pb-20">
      {/* Search Bar */}
      <div className="relative min-w-0 max-w-2xl bg-white">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for asset by name, location..."
          className="h-11 bg-white pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <FilterSelect
          queryKey="salestype"
          placeholder="All Sales Type"
          data={[
            { label: "All Sales Type", value: "all" },
            { label: "Asset Purchase", value: "ap" },
            { label: "Reccurring Asset Purchase", value: "rap" },
          ]}
        />

        <FilterSelect
          queryKey="transactionstatus"
          placeholder="All Transactions Status"
          data={[
            { label: "All Transactions Status", value: "all" },
            { label: "Approved", value: "completed" },
            { label: "Rejected", value: "failed" },
            { label: "Pending", value: "pending" },
          ]}
        />

        <FilterSelect
          queryKey="transactiontype"
          placeholder="All Transactions Type"
          data={[
            { label: "All Transactions Type", value: "all" },
            { label: "Transfer", value: "transfer" },
            { label: "Wallet", value: "wallet" },
            { label: "Paystack", value: "paystack" },
          ]}
        />

        <FilterSelect
          queryKey="assettype"
          placeholder="All Asset Type"
          data={[
            { label: "All Asset Type", value: "all" },
            { label: "Flex", value: "flex" },
            { label: "Full-Ownership", value: "full-ownership" },
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
      <div className="min-w-0 overflow-hidden rounded-md border border-[#E5EAEF] bg-white pb-10">
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
