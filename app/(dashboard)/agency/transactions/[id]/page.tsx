"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AgencyTransactionsTable, useAgency } from "@/features/agency";
import { getErrorMessage } from "@/features/agency/utils/error-message";

export default function AgencyTransactionsDetailPage() {
  const params = useParams();
  const agencyId = params?.id as string;

  const { data, isLoading, error } = useAgency(agencyId);

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading agency transactions</h3>
        <p>{getErrorMessage(error, "An unexpected error occurred.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/agency/transactions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{data?.agency?.agency_name || "Agency"} Transactions</h1>
          <p className="text-muted-foreground">Detailed transaction history for this agency.</p>
        </div>
      </div>

      <AgencyTransactionsTable transactions={data?.agency?.transactions} />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading transactions...
        </div>
      )}
    </div>
  );
}
