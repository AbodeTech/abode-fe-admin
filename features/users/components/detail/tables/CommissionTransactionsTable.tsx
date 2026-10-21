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
  getPaymentMethodColor,
  getPaymentMethodLabel,
  parseCommissionDescription
} from "@/lib/utils/transaction-utils"
import { TransactionListResponse } from "@/lib/api/admin/transactions.types"
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table"

interface CommissionTransactionsTableProps {
  transactions: TransactionListResponse[]
}

const EMPTY = "—"

function toNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// Every commission, v2 or migrated from v1, carries its details as fields.
// The description is read only for the wallet balance, which migrated rows
// keep there ("... & Balance at Transaction: Y"). Its "WHT" figure is the
// payment the commission came from, not tax, so it is never shown.
function toCommissionRow(transaction: TransactionListResponse) {
  const parsed = parseCommissionDescription(transaction.description)
  return {
    ...transaction,
    commissionType: transaction.commission_type ?? null,
    clientName: transaction.source_user_name ?? null,
    assetName: transaction.source_asset_name ?? null,
    rate: transaction.rate_applied ?? null,
    gross: transaction.gross_commission ?? null,
    wht: transaction.wht_deducted ?? null,
    balance:
      transaction.wallet_balance_after ?? (parsed.isCommission ? toNumber(parsed.balance) : null),
  }
}

type CommissionRow = ReturnType<typeof toCommissionRow>
type SortField = keyof CommissionRow

const NUMERIC_FIELDS = new Set<SortField>(["amount", "rate", "gross", "wht", "balance"])

const formatMoney = (value: number | null) => (value == null ? EMPTY : formatAmount(value))
const formatRate = (rate: number | null) =>
  rate == null ? EMPTY : `${Number((rate * 100).toFixed(2))}%`
const formatType = (type: string | null) =>
  type ? type.charAt(0).toUpperCase() + type.slice(1) : EMPTY

function sortValue(row: CommissionRow, field: SortField): string | number | null {
  if (field === "time_of_transaction") return new Date(row.time_of_transaction).getTime()
  const value = row[field]
  if (value == null || value === "") return null
  if (NUMERIC_FIELDS.has(field)) return Number(value)
  return typeof value === "number" ? value : String(value)
}

export function CommissionTransactionsTable({ transactions }: CommissionTransactionsTableProps) {
  const [sortField, setSortField] = useState<SortField>("time_of_transaction")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Rows without a value sort last in either direction.
  const sortedTransactions = transactions.map(toCommissionRow).sort((a, b) => {
    const aValue = sortValue(a, sortField)
    const bValue = sortValue(b, sortField)
    if (aValue === bValue) return 0
    if (aValue == null) return 1
    if (bValue == null) return -1
    const order =
      typeof aValue === "string" && typeof bValue === "string"
        ? aValue.localeCompare(bValue)
        : Number(aValue) - Number(bValue)
    return sortDirection === "asc" ? order : -order
  })

  const sortableHead = (field: SortField, label: string, className = "") => (
    <TableHead key={field} className={`cursor-pointer whitespace-nowrap ${className}`} onClick={() => handleSort(field)}>
      {label}
      {sortField === field && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-4 w-4" /> : <ArrowDownIcon className="inline ml-1 h-4 w-4" />)}
    </TableHead>
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Commission Transactions</CardTitle>
        <CardDescription>View and manage commission transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <AdminMobileStack className="mb-4 space-y-3">
          {sortedTransactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No commission transactions found</p>
          ) : (
            sortedTransactions.map((transaction) => (
              <AdminMobileCard key={transaction._id} title={transaction._id} subtitle={formatDate(transaction.time_of_transaction)}>
                <AdminMobileField label="Type" value={formatType(transaction.commissionType)} />
                <AdminMobileField label="Client" value={transaction.clientName || EMPTY} />
                <AdminMobileField label="Asset" value={transaction.assetName || EMPTY} />
                <AdminMobileField label="Rate" value={formatRate(transaction.rate)} />
                <AdminMobileField label="Gross" value={formatMoney(transaction.gross)} />
                <AdminMobileField label="WHT" value={formatMoney(transaction.wht)} />
                <AdminMobileField label="Amount" value={formatAmount(transaction.amount)} />
                <AdminMobileField label="Wallet balance" value={formatMoney(transaction.balance)} />
                <AdminMobileField
                  label="Payment method"
                  value={
                    <Badge variant="outline" className={getPaymentMethodColor(transaction.payment_method)}>
                      {getPaymentMethodLabel(transaction.payment_method)}
                    </Badge>
                  }
                />
                <AdminMobileField
                  label="Status"
                  value={
                    <Badge variant="outline" className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  }
                />
              </AdminMobileCard>
            ))
          )}
        </AdminMobileStack>

        <AdminDesktopTableWrap>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {sortableHead("_id", "ID", "w-[150px]")}
                {sortableHead("time_of_transaction", "Time")}
                {sortableHead("commissionType", "Type")}
                {sortableHead("clientName", "Client")}
                {sortableHead("assetName", "Asset")}
                {sortableHead("rate", "Rate")}
                {sortableHead("gross", "Gross")}
                {sortableHead("wht", "WHT")}
                {sortableHead("amount", "Amount")}
                {sortableHead("balance", "Wallet Balance")}
                {sortableHead("payment_method", "Payment Method")}
                {sortableHead("status", "Status")}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.length > 0 ? (
                sortedTransactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell className="font-medium">{transaction._id}</TableCell>
                    <TableCell>{formatDate(transaction.time_of_transaction)}</TableCell>
                    <TableCell>{formatType(transaction.commissionType)}</TableCell>
                    <TableCell>{transaction.clientName || EMPTY}</TableCell>
                    <TableCell>{transaction.assetName || EMPTY}</TableCell>
                    <TableCell>{formatRate(transaction.rate)}</TableCell>
                    <TableCell>{formatMoney(transaction.gross)}</TableCell>
                    <TableCell>{formatMoney(transaction.wht)}</TableCell>
                    <TableCell className="font-medium">{formatAmount(transaction.amount)}</TableCell>
                    <TableCell>{formatMoney(transaction.balance)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPaymentMethodColor(transaction.payment_method)}>
                        {getPaymentMethodLabel(transaction.payment_method)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-4">
                    No commission transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        </AdminDesktopTableWrap>
      </CardContent>
    </Card>
  )
}
