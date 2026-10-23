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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  formatAmount,
  formatDate,
  formatTransactionType,
  getStatusColor,
  getPaymentMethodColor,
  getPaymentMethodLabel,
  getTypeColor,
} from "@/lib/utils/transaction-utils"
import { TransactionListResponse } from "@/lib/api/admin/transactions.types"
import revalidate from "@/lib/serverActions/admin/revalidate"
import {
  FORCED_REPROCESS_REASON_MIN,
  REPROCESS_REASON_MIN,
  reprocessTransaction,
  sendTransactionReceipt,
} from "../../../lib/transaction-actions"
import { ViewTransactionEvidenceModal } from "../../modals/ViewTransactionEvidenceModal"
import { getErrorMessage } from "../../../utils/error-message"
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table"

interface OtherTransactionsTableProps {
  transactions: TransactionListResponse[]
}

type SortValue = string | number | null | undefined

/** Type badge, plus an "Admin" badge when an admin recorded the transaction. */
function TransactionTypeBadges({ transaction }: { transaction: TransactionListResponse }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge variant="outline" className={getTypeColor(transaction.type)}>
        {formatTransactionType(transaction.type)}
      </Badge>
      {transaction.created_via === "admin" && (
        <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
          Admin
        </Badge>
      )}
    </div>
  )
}

export function OtherTransactionsTable({ transactions }: OtherTransactionsTableProps) {
  const [sortField, setSortField] = useState<string>("time_of_transaction")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // State for actions
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [receiptProcessingId, setReceiptProcessingId] = useState<string | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null)
  const [reprocessReason, setReprocessReason] = useState("")
  const [forceReprocess, setForceReprocess] = useState(false)

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
    setReprocessReason("")
    setForceReprocess(false)
    setIsConfirmOpen(true)
  }

  // The BE asks for a reason, and a longer one to fire commission a second time.
  const reasonMin = forceReprocess ? FORCED_REPROCESS_REASON_MIN : REPROCESS_REASON_MIN
  const reasonLength = reprocessReason.trim().length
  const canConfirmReprocess = reasonLength >= reasonMin

  const handleCloseConfirm = () => {
    setIsConfirmOpen(false)
    setPendingTransactionId(null)
  }

  const handleReprocess = async () => {
    if (!pendingTransactionId || !userId || !canConfirmReprocess) return

    const transactionId = pendingTransactionId
    const input = { reason: reprocessReason.trim(), force: forceReprocess }
    setProcessingId(transactionId)
    handleCloseConfirm() // Close modal immediately

    try {
      const result = await reprocessTransaction(userId, transactionId, input)
      toast.success(result.message ?? "Transaction reprocessed successfully")
      await revalidate(userId)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to reprocess transaction"))
    } finally {
      setProcessingId(null)
    }
  }

  const handleSendReceipt = async (transactionId: string) => {
    if (!userId) return
    setReceiptProcessingId(transactionId)
    try {
      const result = await sendTransactionReceipt(userId, transactionId)
      toast.success(result.message ?? "Receipt email sent successfully")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to send receipt email"))
    } finally {
      setReceiptProcessingId(null)
    }
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Other Transactions</CardTitle>
          <CardDescription>View and manage non-commission transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminMobileStack className="mb-4 space-y-3">
            {sortedTransactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No other transactions found</p>
            ) : (
              sortedTransactions.map((transaction) => {
                const evidenceFile = transaction?.transfer_file?.file
                const canReprocess =
                  transaction.type === "asset" ||
                  transaction.description?.startsWith("AP") ||
                  transaction.description?.startsWith("RAP")
                const canSendReceipt =
                  transaction.description?.startsWith("AP") ||
                  transaction.description?.startsWith("RAP") ||
                  transaction.description?.startsWith("DP")
                const isProcessing = processingId === transaction._id
                const isSendingReceipt = receiptProcessingId === transaction._id
                return (
                  <AdminMobileCard key={transaction._id} title={transaction._id} subtitle={formatDate(transaction.time_of_transaction)}>
                    <AdminMobileField
                      label="Type"
                      value={<TransactionTypeBadges transaction={transaction} />}
                    />
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
                    <AdminMobileField label="Amount" value={formatAmount(transaction.amount)} />
                    <AdminMobileField label="Description" value={transaction.description} />
                    <div className="border-t border-border pt-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="w-full" disabled={isProcessing || isSendingReceipt}>
                            {isProcessing || isSendingReceipt ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actions"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {evidenceFile ? (
                            <ViewTransactionEvidenceModal
                              image={evidenceFile}
                              trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}>View Receipt</DropdownMenuItem>}
                            />
                          ) : (
                            <DropdownMenuItem disabled>View Receipt (N/A)</DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            disabled={!canReprocess || isProcessing}
                            onSelect={(event) => {
                              event.preventDefault()
                              handleOpenConfirm(transaction._id)
                            }}
                          >
                            {isProcessing ? "Reprocessing..." : "Reprocess Transaction"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!canSendReceipt || isSendingReceipt}
                            onSelect={async (event) => {
                              event.preventDefault()
                              await handleSendReceipt(transaction._id)
                            }}
                          >
                            {isSendingReceipt ? "Sending..." : "Send Receipt Email"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </AdminMobileCard>
                )
              })
            )}
          </AdminMobileStack>

          <AdminDesktopTableWrap>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px] cursor-pointer" onClick={() => handleSort("_id")}>
                    ID
                    {sortField === "_id" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-4 w-4" /> : <ArrowDownIcon className="inline ml-1 h-4 w-4" />)}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("time_of_transaction")}>
                    Time
                    {sortField === "time_of_transaction" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-4 w-4" /> : <ArrowDownIcon className="inline ml-1 h-4 w-4" />)}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
                    Type
                    {sortField === "type" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-4 w-4" /> : <ArrowDownIcon className="inline ml-1 h-4 w-4" />)}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("payment_method")}>
                    Payment Method
                    {sortField === "payment_method" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-4 w-4" /> : <ArrowDownIcon className="inline ml-1 h-4 w-4" />)}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                    Status
                    {sortField === "status" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-4 w-4" /> : <ArrowDownIcon className="inline ml-1 h-4 w-4" />)}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("amount")}>
                    Amount
                    {sortField === "amount" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-4 w-4" /> : <ArrowDownIcon className="inline ml-1 h-4 w-4" />)}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("description")}>
                    Description
                    {sortField === "description" && (sortDirection === "asc" ? <ArrowUpIcon className="inline ml-1 h-4 w-4" /> : <ArrowDownIcon className="inline ml-1 h-4 w-4" />)}
                  </TableHead>
                  <TableHead>Actions</TableHead>
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
                      transaction.description?.startsWith("RAP") ||
                      transaction.description?.startsWith("DP")

                    const isProcessing = processingId === transaction._id
                    const isSendingReceipt = receiptProcessingId === transaction._id

                    return (
                      <TableRow key={transaction._id}>
                        <TableCell className="font-medium">{transaction._id}</TableCell>
                        <TableCell>{formatDate(transaction.time_of_transaction)}</TableCell>
                        <TableCell>
                          <TransactionTypeBadges transaction={transaction} />
                        </TableCell>
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
                        <TableCell className="font-medium">{formatAmount(transaction.amount)}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="flex items-center gap-2" disabled={isProcessing || isSendingReceipt}>
                                {isProcessing || isSendingReceipt ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actions"}
                                <MoreVertical className="h-4 w-4" />
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
                                disabled={!canReprocess || isProcessing}
                                onSelect={(event) => {
                                  event.preventDefault()
                                  handleOpenConfirm(transaction._id)
                                }}
                              >
                                {isProcessing ? "Reprocessing..." : "Reprocess Transaction"}
                              </DropdownMenuItem>

                              {/* Send Receipt */}
                              <DropdownMenuItem
                                disabled={!canSendReceipt || isSendingReceipt}
                                onSelect={async (event) => {
                                  event.preventDefault()
                                  await handleSendReceipt(transaction._id)
                                }}
                              >
                                {isSendingReceipt ? "Sending..." : "Send Receipt Email"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    No other transactions found
                  </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          </AdminDesktopTableWrap>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              Continuing pays commission on this payment to the realtors saved on its plan. Please confirm you want to proceed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reprocess-reason" className="text-sm font-medium">
                Reason
              </Label>
              <Textarea
                id="reprocess-reason"
                value={reprocessReason}
                onChange={(e) => setReprocessReason(e.target.value)}
                placeholder="Why does this payment need its commission processed?"
                maxLength={2000}
                rows={3}
              />
              <p className={`text-xs ${canConfirmReprocess ? "text-muted-foreground" : "text-destructive"}`}>
                {reasonLength}/{reasonMin} characters minimum
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="reprocess-force"
                checked={forceReprocess}
                onCheckedChange={(checked) => setForceReprocess(checked === true)}
              />
              <Label htmlFor="reprocess-force" className="text-sm font-normal leading-snug">
                Commission already paid on this payment — pay it again where the plan&apos;s
                realtors have changed (needs a {FORCED_REPROCESS_REASON_MIN}-character reason)
              </Label>
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleCloseConfirm}>Cancel</Button>
            <Button onClick={handleReprocess} disabled={!canConfirmReprocess}>
              Continue
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
