"use client"

import { useState } from "react"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  formatAmount,
  formatDate,
  getStatusColor,
  getTransactionTypeColor,
  parseCommissionDescription
} from "@/lib/utils/transaction-utils"
import { TransactionListResponse } from "@/lib/api/admin/transactions.types"

interface CommissionTransactionsTableProps {
  transactions: TransactionListResponse[]
}

type SortValue = string | number | null | undefined

export function CommissionTransactionsTable({ transactions }: CommissionTransactionsTableProps) {
  const [sortField, setSortField] = useState<string>("time_of_transaction")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Process transactions to extract commission details
  const processedTransactions = transactions.map((transaction) => {
    const parsedDescription = parseCommissionDescription(transaction.description)
    return {
      ...transaction,
      assetType: parsedDescription.isCommission ? parsedDescription.assetType : null,
      clientName: parsedDescription.isCommission ? parsedDescription.clientName : null,
      vatAmount: parsedDescription.isCommission ? parsedDescription.vatAmount : null,
      balance: parsedDescription.isCommission ? parsedDescription.balance : null,
    }
  })

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Sort transactions
  const sortedTransactions = [...processedTransactions].sort((a, b) => {
    let aValue: SortValue = a[sortField as keyof typeof a] as SortValue
    let bValue: SortValue = b[sortField as keyof typeof b] as SortValue

    if (sortField === "vatAmount") {
      aValue = a.vatAmount ? Number(a.vatAmount) + Number(a.amount) : 0
      bValue = b.vatAmount ? Number(b.vatAmount) + Number(b.amount) : 0
    }

    if (sortField === "time_of_transaction") {
      aValue = new Date(a.time_of_transaction).getTime()
      bValue = new Date(b.time_of_transaction).getTime()
    }

    if (sortField === "amount" || sortField === "balance") {
      aValue = Number(aValue || 0)
      bValue = Number(bValue || 0)
    }

    if (aValue === bValue) return 0

    // String comparison for other fields
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    // Number comparison
    return sortDirection === "asc"
      ? (Number(aValue) - Number(bValue))
      : (Number(bValue) - Number(aValue))
  })

  return (
    <Card className="w-full border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Commission Transactions</CardTitle>
        <CardDescription>View and manage commission transactions</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort("_id")}>
                  ID
                  {sortField === "_id" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-3 w-3" /> : <ArrowDownIcon className="inline ml-1 h-3 w-3" />)}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("time_of_transaction")}>
                  Time
                  {sortField === "time_of_transaction" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-3 w-3" /> : <ArrowDownIcon className="inline ml-1 h-3 w-3" />)}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("amount")}>
                  Amount
                  {sortField === "amount" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-3 w-3" /> : <ArrowDownIcon className="inline ml-1 h-3 w-3" />)}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("transaction_type")}>
                  Type
                  {sortField === "transaction_type" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-3 w-3" /> : <ArrowDownIcon className="inline ml-1 h-3 w-3" />)}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("vatAmount")}>
                  Total (VAT included)
                  {sortField === "vatAmount" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-3 w-3" /> : <ArrowDownIcon className="inline ml-1 h-3 w-3" />)}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("assetType")}>
                  Asset Type
                  {sortField === "assetType" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-3 w-3" /> : <ArrowDownIcon className="inline ml-1 h-3 w-3" />)}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("clientName")}>
                  Client Name
                  {sortField === "clientName" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-3 w-3" /> : <ArrowDownIcon className="inline ml-1 h-3 w-3" />)}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("balance")}>
                  Wallet Balance
                  {sortField === "balance" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-3 w-3" /> : <ArrowDownIcon className="inline ml-1 h-3 w-3" />)}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                  Status
                  {sortField === "status" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-3 w-3" /> : <ArrowDownIcon className="inline ml-1 h-3 w-3" />)}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.length > 0 ? (
                sortedTransactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell className="font-mono text-xs">{transaction._id.substring(0, 8)}...</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(transaction.time_of_transaction)}</TableCell>
                    <TableCell className="font-medium">{formatAmount(transaction.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTransactionTypeColor(transaction.transaction_type)}>
                        {transaction.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transaction.vatAmount ? formatAmount(Number(transaction.vatAmount) + Number(transaction.amount)) : "N/A"}
                    </TableCell>
                    <TableCell className="capitalize">{transaction.assetType || "N/A"}</TableCell>
                    <TableCell>{transaction.clientName || "N/A"}</TableCell>
                    <TableCell>{transaction.balance ? formatAmount(transaction.balance) : "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No commission transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
