"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionListResponse } from "@/lib/api/admin/transactions.types"
import { CommissionTransactionsTable } from "./tables/CommissionTransactionsTable"
import { OtherTransactionsTable } from "./tables/OtherTransactionsTable"

interface UserTransactionsProps {
  transactions?: TransactionListResponse[]
  commission?: TransactionListResponse[]
  other?: TransactionListResponse[]
}

export function UserTransactions({ transactions, commission, other }: UserTransactionsProps) {
  const safeTransactions = transactions || []
  const commissionTransactions =
    commission ?? safeTransactions.filter((t) => String(t.type).toLowerCase() === "commission")
  const otherTransactions =
    other ?? safeTransactions.filter((t) => String(t.type).toLowerCase() !== "commission")

  return (
    <div className="space-y-8 mt-16">
      <Tabs defaultValue="commission" className="w-full">
        <TabsList className="grid w-full grid-cols-2 !h-fit">
          <TabsTrigger value="commission" className="!py-3">Commission Transactions</TabsTrigger>
          <TabsTrigger value="other" className="!py-3">Other Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="commission">
          <CommissionTransactionsTable transactions={commissionTransactions} />
        </TabsContent>
        <TabsContent value="other">
          <OtherTransactionsTable transactions={otherTransactions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
