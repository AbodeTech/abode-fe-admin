"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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

export function SummaryCards({ data }: { data: FragmentType<typeof SummaryCardsFragment> }) {
  const summary = useFragment(SummaryCardsFragment, data);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const s = searchParams.get("search") || "";
    setSearch(s);
  }, [searchParams]);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) params.set("search", search.trim());
    else params.delete("search");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const cards = [
    {
      title: "Total Sales",
      expected: summary?.expectedTransactionValue ?? 0,
      received: summary?.totalReceivedTransactionValue ?? 0,
      outstanding: summary?.outstandingTransactionValue ?? 0,
      total: summary?.totalTransactionValue ?? 0,
    },
    {
      title: "Flex Sales",
      expected: summary?.expectedFlexTransactionValue ?? 0,
      received: summary?.totalReceivedFlexTransactionValue ?? 0,
      outstanding: summary?.outstandingFlexTransactionValue ?? 0,
      total: summary?.totalFlexTransactionValue ?? 0,
    },
    {
      title: "Full Ownership Sales",
      expected: summary?.expectedFullOwnershipTransactionValue ?? 0,
      received: summary?.totalReceivedFullOwnershipTransactionValue ?? 0,
      outstanding: summary?.outstandingFullOwnershipTransactionValue ?? 0,
      total: summary?.totalFullOwnershipTransactionValue ?? 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 max-w-md">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sales data..."
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{formatCurrency(card.total)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Expected</span>
                <span>{formatCurrency(card.expected)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Received</span>
                <span>{formatCurrency(card.received)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="text-amber-600">{formatCurrency(card.outstanding)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-medium text-emerald-600">
                  {card.expected > 0 ? ((card.received / card.expected) * 100).toFixed(1) : "0.0"}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
