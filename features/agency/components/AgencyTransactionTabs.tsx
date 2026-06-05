"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgencyWalletTransactionRow } from "../hooks/use-agency-transactions";
import { AgencyWalletTransactionsTable } from "./AgencyWalletTransactionsTable";

interface AgencyTransactionTabsProps {
  transactions: AgencyWalletTransactionRow[];
}

export function AgencyTransactionTabs({ transactions }: AgencyTransactionTabsProps) {
  const commissionTransactions = transactions.filter(
    (item) => (item.type || "").toLowerCase() === "commission"
  );
  const otherTransactions = transactions.filter(
    (item) => (item.type || "").toLowerCase() !== "commission"
  );

  return (
    <Tabs defaultValue="commission" className="w-full min-w-0">
      <TabsList className="flex h-auto w-full min-w-0 flex-nowrap justify-start gap-1 overflow-x-auto rounded-md bg-muted p-1 sm:grid sm:max-w-none sm:grid-cols-2 sm:overflow-visible">
        <TabsTrigger value="commission" className="shrink-0 px-3 py-2.5 whitespace-nowrap sm:whitespace-normal">
          Commission ({commissionTransactions.length})
        </TabsTrigger>
        <TabsTrigger value="other" className="shrink-0 px-3 py-2.5 whitespace-nowrap sm:whitespace-normal">
          Other ({otherTransactions.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="commission" className="mt-4 min-w-0">
        <AgencyWalletTransactionsTable
          transactions={commissionTransactions}
          emptyText="No commission transactions found."
        />
      </TabsContent>
      <TabsContent value="other" className="mt-4 min-w-0">
        <AgencyWalletTransactionsTable
          transactions={otherTransactions}
          emptyText="No non-commission transactions found."
        />
      </TabsContent>
    </Tabs>
  );
}
