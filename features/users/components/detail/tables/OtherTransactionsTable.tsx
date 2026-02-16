"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { ArrowDownIcon, ArrowUpIcon, MoreVertical, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import {
  formatAmount,
  formatDate,
  getStatusColor,
  getTransactionTypeColor,
  getTypeColor,
} from "@/lib/utils/transaction-utils"
import {
  TransactionListResponse,
  ProcessCommissionInput,
} from "@/lib/api/admin/transactions.types"
import {
  processComissionTransaction,
  sendReceiptEmail,
} from "@/lib/api/admin/transactions.client"
import revalidate from "@/lib/serverActions/admin/revalidate"
import { ViewTransactionEvidenceModal } from "../../modals/ViewTransactionEvidenceModal"
import { getErrorMessage } from "../../../utils/error-message"

interface OtherTransactionsTableProps {
  transactions: TransactionListResponse[]
}

type SortValue = string | number | null | undefined

const COMMISSION_TYPE_OPTIONS = [
  { label: "Direct Commission", value: "direct" },
  { label: "Topline Commission", value: "topline" },
  { label: "Upline Commission", value: "upline" },
] as const

export function OtherTransactionsTable({ transactions }: OtherTransactionsTableProps) {
  const [sortField, setSortField] = useState<string>("time_of_transaction")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // State for actions
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [receiptProcessingId, setReceiptProcessingId] = useState<string | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null)
  const [selectedCommissionTypes, setSelectedCommissionTypes] = useState<string[]>(["direct", "topline", "upline"])

  const params = useParams()
  const userId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''

  // Sorting
  const sortedTransactions = [...transactions].sort((a, b) => {
    let aValue: SortValue = a[sortField as keyof typeof a] as SortValue
    let bValue: SortValue = b[sortField as keyof typeof b] as SortValue

    if (sortField === "time_of_transaction") {
      aValue = new Date(a.time_of_transaction).getTime()
      bValue = new Date(b.time_of_transaction).getTime()
    }

    if (sortField === "amount") {
      aValue = Number(a.amount)
      bValue = Number(b.amount)
    }

    if (aValue === bValue) return 0

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return sortDirection === "asc"
      ? (Number(aValue) - Number(bValue))
      : (Number(bValue) - Number(aValue))
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Actions Logic
  const handleOpenConfirm = (transactionId: string) => {
    setPendingTransactionId(transactionId)
    setSelectedCommissionTypes(["direct", "topline", "upline"])
    setIsConfirmOpen(true)
  }

  const handleCloseConfirm = () => {
    setIsConfirmOpen(false)
    setPendingTransactionId(null)
  }

  const handleReprocess = async () => {
    if (!pendingTransactionId || !userId) return

    setProcessingId(pendingTransactionId)
    handleCloseConfirm() // Close modal immediately

    try {
      await processComissionTransaction({
        userId,
        transactionId: pendingTransactionId,
        commissionTypes: selectedCommissionTypes as ProcessCommissionInput['commissionTypes'],
      })
      toast.success("Transaction reprocessed successfully")
      await revalidate(userId)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to reprocess transaction"))
    } finally {
      setProcessingId(null)
    }
  }

  const handleSendReceipt = async (transactionId: string) => {
    setReceiptProcessingId(transactionId)
    try {
      await sendReceiptEmail(transactionId)
      toast.success("Receipt email sent successfully")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to send receipt email"))
    } finally {
      setReceiptProcessingId(null)
    }
  }

  return (
    <>
      <Card className="w-full border-none shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Other Transactions</CardTitle>
          <CardDescription>View and manage non-commission transactions</CardDescription>
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
                  <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
                    Type
                    {sortField === "type" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-3 w-3" /> : <ArrowDownIcon className="inline ml-1 h-3 w-3" />)}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("transaction_type")}>
                    Tx Type
                    {sortField === "transaction_type" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-3 w-3" /> : <ArrowDownIcon className="inline ml-1 h-3 w-3" />)}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                    Status
                    {sortField === "status" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-3 w-3" /> : <ArrowDownIcon className="inline ml-1 h-3 w-3" />)}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("amount")}>
                    Amount
                    {sortField === "amount" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-3 w-3" /> : <ArrowDownIcon className="inline ml-1 h-3 w-3" />)}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("description")}>
                    Description
                    {sortField === "description" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-3 w-3" /> : <ArrowDownIcon className="inline ml-1 h-3 w-3" />)}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTransactions.length > 0 ? (
                  sortedTransactions.map((transaction) => {
                    const evidenceFile = transaction?.transfer_file?.file
                    const canReprocess =
                      transaction.type === "asset" ||
                      transaction.description?.startsWith("AP") ||
                      transaction.description?.startsWith("RAP")
                    const canSendReceipt =
                      transaction.description?.startsWith("AP") ||
                      transaction.description?.startsWith("RAP")

                    const isProcessing = processingId === transaction._id
                    const isSendingReceipt = receiptProcessingId === transaction._id

                    return (
                      <TableRow key={transaction._id}>
                        <TableCell className="font-mono text-xs">{transaction._id.substring(0, 8)}...</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{formatDate(transaction.time_of_transaction)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTypeColor(transaction.type)}>
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTransactionTypeColor(transaction.transaction_type)}>
                            {transaction.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{formatAmount(transaction.amount)}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={transaction.description}>{transaction.description}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={isProcessing || isSendingReceipt}>
                                {isProcessing || isSendingReceipt ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* View Receipt */}
                              {evidenceFile ? (
                                <ViewTransactionEvidenceModal
                                  image={evidenceFile}
                                  trigger={
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>View Receipt</DropdownMenuItem>
                                  }
                                />
                              ) : (
                                <DropdownMenuItem disabled>View Receipt (N/A)</DropdownMenuItem>
                              )}

                              {/* Reprocess */}
                              <DropdownMenuItem
                                disabled={!canReprocess}
                                onSelect={() => handleOpenConfirm(transaction._id)}
                              >
                                Reprocess Transaction
                              </DropdownMenuItem>

                              {/* Send Receipt */}
                              <DropdownMenuItem
                                disabled={!canSendReceipt}
                                onSelect={() => handleSendReceipt(transaction._id)}
                              >
                                Send Receipt Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No other transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              Continuing will process this transaction and pay out commission to every realtor involved. Please confirm you want to proceed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Commission Types to Process:</Label>
              <MultiSelect
                options={[...COMMISSION_TYPE_OPTIONS]}
                selected={selectedCommissionTypes}
                onChange={setSelectedCommissionTypes}
                placeholder="Select commission types..."
              />
            </div>
            {selectedCommissionTypes.length === 0 && (
              <p className="text-sm text-destructive">
                Please select at least one commission type to proceed.
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleCloseConfirm}>Cancel</Button>
            <Button onClick={handleReprocess} disabled={selectedCommissionTypes.length === 0}>
              Continue
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
