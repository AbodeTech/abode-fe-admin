"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AgencyTransactionDateFilter,
  AgencyTransactionFilters,
  AgencyTransactionSummaryCards,
  AgencyTransactionTabs,
  useAgency,
  useAgencyTransactions,
} from "@/features/agency";
import { getErrorMessage } from "@/features/agency/utils/error-message";

const toDateFilterRange = (dateFilter: AgencyTransactionDateFilter) => {
  if (dateFilter === "all") {
    return null;
  }

  const now = new Date();
  const start = new Date(now);

  if (dateFilter === "today") {
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (dateFilter === "week") {
    start.setDate(now.getDate() - 7);
    return start;
  }

  start.setDate(now.getDate() - 30);
  return start;
};

export default function AgencyTransactionsDetailPage() {
  const params = useParams();
  const agencyId = params?.id as string;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState<AgencyTransactionDateFilter>("all");

  const { data: agencyData, isLoading: agencyLoading, error: agencyError } = useAgency(agencyId);
  const {
    data: transactions,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useAgencyTransactions(agencyId);

  const filteredTransactions = useMemo(() => {
    const rows = transactions ?? [];
    const normalizedSearch = search.trim().toLowerCase();
    const minDate = toDateFilterRange(date);

    return rows.filter((row) => {
      const statusText = (row.status || "").toLowerCase();
      const matchesStatus =
        status === "all" ||
        (status === "approved" &&
          ["approved", "successful", "success"].includes(statusText)) ||
        (status === "rejected" &&
          ["rejected", "declined", "failed"].includes(statusText)) ||
        statusText === status;

      if (!matchesStatus) return false;

      if (minDate) {
        const transactionDate = row.time_of_transaction
          ? new Date(row.time_of_transaction)
          : null;
        if (!transactionDate || Number.isNaN(transactionDate.getTime()) || transactionDate < minDate) {
          return false;
        }
      }

      if (!normalizedSearch) return true;

      return [
        row._id,
        row.paystack_reference,
        row.transfer_reference,
        row.description,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [transactions, search, status, date]);

  if (agencyError || transactionsError) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading agency transactions</h3>
        <p>
          {getErrorMessage(
            agencyError || transactionsError,
            "An unexpected error occurred."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-4 sm:space-y-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-fit" asChild>
          <Link href="/agency/transactions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight wrap-break-word sm:text-2xl">
            {agencyData?.agency?.agency_name || "Agency"} Transactions
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Review commission and other wallet transactions for this agency.
          </p>
        </div>
      </div>

      <AgencyTransactionSummaryCards transactions={filteredTransactions} />

      <AgencyTransactionFilters
        search={search}
        status={status}
        date={date}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onDateChange={setDate}
        onReset={() => {
          setSearch("");
          setStatus("all");
          setDate("all");
        }}
      />

      <AgencyTransactionTabs transactions={filteredTransactions} />

      {(agencyLoading || transactionsLoading) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading transactions...
        </div>
      )}
    </div>
  );
}
