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
    <Card className="overflow-hidden">
      <div className={`h-1.5 ${accentColor}`} />
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`rounded-lg p-3 ${bgColor}`}>
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{formatCurrency(total)}</p>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-muted-foreground">Received</p>
              <p className="text-sm font-semibold">{formatCurrency(received)}</p>
            </div>
            <ProgressBar value={received} max={total} color={progressColor} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-sm font-semibold text-amber-600">{formatCurrency(outstanding)}</p>
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
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 max-w-md">
          <Input
            ref={searchInputRef}
            key={currentSearch}
            defaultValue={currentSearch}
            placeholder="Search sales data..."
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <FilterSelect
          data={[
            { label: "All Asset Type", value: "all" },
            { label: "flex", value: "flex" },
            { label: "full-ownership", value: "full-ownership" },
          ]}
          queryKey="assettype"
          placeholder="Asset type"
        />
        <DateFilter />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
