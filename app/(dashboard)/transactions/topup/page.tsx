"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useTopupTransactions, TopupTransactionsTable, useApproveTopupTransaction, useDeclineTopupTransaction } from "@/features/transactions";
import { TransactionDataPoints } from "@/components/shared/TransactionDataPoints";
import { Pagination } from "@/components/shared/Pagination";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

function TopupTransactionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;
  const limit = 10;

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");

  // Debounce search update to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentSearch = searchParams.get("search") || "";

      if (searchTerm !== currentSearch) {
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
  }, [searchTerm, router, searchParams]);

  const { data, isLoading, error } = useTopupTransactions({ page, limit });
  const { mutateAsync: approveTransaction } = useApproveTopupTransaction();
  const { mutateAsync: declineTransaction } = useDeclineTopupTransaction();

  const totalCount = data?.count || 0;

  const handleApprove = async (id: string) => {
    try {
      await approveTransaction(id);
      toast.success("Top-up approved");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to approve top-up";
      toast.error(message);
    }
  };

  const handleDecline = async (id: string, message: string) => {
    try {
      await declineTransaction({ transactionId: id, message });
      toast.success("Top-up declined");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to decline top-up";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-16 sm:px-4 sm:pb-20">
      {/* Search Bar */}
      <div className="relative min-w-0 max-w-2xl bg-white">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for user by firstname, lastname or email"
          className="h-11 bg-white pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Title */}
      <h3 className="font-sans font-semibold text-[#333333] text-xl uppercase">
        Topup Transactions
      </h3>

      {error && (
        <div className="p-3 rounded-md border border-red-200 bg-red-50 text-sm text-red-600">
          {(error as Error).message ?? "Unable to load top-up transactions"}
        </div>
      )}

      {/* Statistics Cards */}
      <TransactionDataPoints type="credit" />

      {/* Transaction Table */}
      <div className="min-w-0 overflow-hidden rounded-md border border-[#E5EAEF] bg-white pb-6">
        <TopupTransactionsTable
          data={data?.data}
          isLoading={isLoading}
          onApprove={handleApprove}
          onDecline={handleDecline}
          filterQuery={searchTerm}
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

export default function TopupTransactionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <TopupTransactionsContent />
    </Suspense>
  );
}
