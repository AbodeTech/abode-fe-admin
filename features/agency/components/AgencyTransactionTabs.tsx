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
    <Tabs defaultValue="commission" className="w-full">
      <TabsList className="grid w-full grid-cols-2 h-auto">
        <TabsTrigger value="commission" className="py-2.5">
          Commission Transactions ({commissionTransactions.length})
        </TabsTrigger>
        <TabsTrigger value="other" className="py-2.5">
          Other Transactions ({otherTransactions.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="commission" className="mt-4">
        <AgencyWalletTransactionsTable
          transactions={commissionTransactions}
          emptyText="No commission transactions found."
        />
      </TabsContent>
      <TabsContent value="other" className="mt-4">
        <AgencyWalletTransactionsTable
          transactions={otherTransactions}
          emptyText="No non-commission transactions found."
        />
      </TabsContent>
    </Tabs>
  );
}
