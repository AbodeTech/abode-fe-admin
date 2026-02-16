"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionListResponse } from "@/lib/api/admin/transactions.types"
import { CommissionTransactionsTable } from "./tables/CommissionTransactionsTable"
import { OtherTransactionsTable } from "./tables/OtherTransactionsTable"

interface UserTransactionsProps {
  transactions: TransactionListResponse[]
}

export function UserTransactions({ transactions }: UserTransactionsProps) {
  // Safe filtering
  const safeTransactions = transactions || []
  const commissionTransactions = safeTransactions.filter((t) => t.type === "commission")
  const otherTransactions = safeTransactions.filter((t) => t.type !== "commission")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">User Transactions</h2>
      </div>

      <Tabs defaultValue="commission" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="commission">Commission ({commissionTransactions.length})</TabsTrigger>
          <TabsTrigger value="other">Other ({otherTransactions.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="commission" className="mt-4">
          <CommissionTransactionsTable transactions={commissionTransactions} />
        </TabsContent>
        <TabsContent value="other" className="mt-4">
          <OtherTransactionsTable transactions={otherTransactions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
