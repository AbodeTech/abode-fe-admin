"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { DateFilter } from "@/components/shared/DateFilter";

import { graphql, FragmentType, useFragment } from "@/lib/gql";

export const SummaryCardsFragment = graphql(`
  fragment SummaryCards_dashboard on SalesDashboard {
    totalTransactionValue
    expectedTransactionValue
    totalReceivedTransactionValue
    outstandingTransactionValue
    totalFlexTransactionValue
    expectedFlexTransactionValue
    totalReceivedFlexTransactionValue
    outstandingFlexTransactionValue
    totalFullOwnershipTransactionValue
    expectedFullOwnershipTransactionValue
    totalReceivedFullOwnershipTransactionValue
    outstandingFullOwnershipTransactionValue
  }
`);

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="w-full">
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{percentage}%</p>
    </div>
  );
}

function SalesCard({
  title,
  total,
  received,
  outstanding,
  accentColor,
  bgColor,
  progressColor,
}: {
  title: string;
  total: number;
  received: number;
  outstanding: number;
  accentColor: string;
  bgColor: string;
  progressColor: string;
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <div className={`h-1.5 ${accentColor}`} />
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`rounded-lg p-3 ${bgColor}`}>
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-lg font-bold tabular-nums wrap-break-word sm:text-xl md:text-2xl">
            {formatCurrency(total)}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <div className="mb-1 flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Received</p>
              <p className="text-xs font-semibold tabular-nums wrap-break-word sm:text-sm">
                {formatCurrency(received)}
              </p>
            </div>
            <ProgressBar value={received} max={total} color={progressColor} />
          </div>

          <div>
            <div className="mb-1 flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-xs font-semibold tabular-nums wrap-break-word text-amber-600 sm:text-sm">
                {formatCurrency(outstanding)}
              </p>
            </div>
            <ProgressBar value={outstanding} max={total} color="bg-amber-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ data }: { data: FragmentType<typeof SummaryCardsFragment> }) {
  const summary = useFragment(SummaryCardsFragment, data);
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const currentSearch = searchParams.get("search") || "";

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    const nextSearch = searchInputRef.current?.value?.trim() || "";
    if (nextSearch) params.set("search", nextSearch);
    else params.delete("search");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex w-full min-w-0 max-w-full gap-2 sm:max-w-md">
          <Input
            ref={searchInputRef}
            key={currentSearch}
            defaultValue={currentSearch}
            placeholder="Search sales data..."
            className="min-w-0"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button type="button" onClick={handleSearch} size="icon" className="shrink-0">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <FilterSelect
            data={[
              { label: "All Asset Type", value: "all" },
              { label: "flex", value: "flex" },
              { label: "full-ownership", value: "full-ownership" },
            ]}
            queryKey="assettype"
            placeholder="Asset type"
          />
          <div className="w-full min-w-0 sm:w-auto">
            <DateFilter />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 md:gap-4 lg:grid-cols-3">
        <SalesCard
          title="Overall"
          total={summary?.expectedTransactionValue ?? 0}
          received={summary?.totalReceivedTransactionValue ?? 0}
          outstanding={summary?.outstandingTransactionValue ?? 0}
          accentColor="bg-primary"
          bgColor="bg-primary/5"
          progressColor="bg-primary"
        />
        <SalesCard
          title="Flex"
          total={summary?.expectedFlexTransactionValue ?? 0}
          received={summary?.totalReceivedFlexTransactionValue ?? 0}
          outstanding={summary?.outstandingFlexTransactionValue ?? 0}
          accentColor="bg-blue-500"
          bgColor="bg-blue-50"
          progressColor="bg-blue-500"
        />
        <SalesCard
          title="Full Ownership"
          total={summary?.expectedFullOwnershipTransactionValue ?? 0}
          received={summary?.totalReceivedFullOwnershipTransactionValue ?? 0}
          outstanding={summary?.outstandingFullOwnershipTransactionValue ?? 0}
          accentColor="bg-green-500"
          bgColor="bg-green-50"
          progressColor="bg-green-500"
        />
      </div>
    </div>
  );
}
