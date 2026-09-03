"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatAmount, formatDate, getStatusColor, } from "@/lib/utils/transaction-utils"
import { UserReferralResponse } from "@/lib/api/admin/referrals.types"
import { UserReferralActions } from "../UserReferralActions"
import { addUserReferralByAdmin } from "@/lib/api/admin/referrals.client"
import { userKeys } from "../../../hooks/query-keys"
import { getErrorMessage } from "../../../utils/error-message"
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table"

// Extend transaction-utils with getAssociateColor if not present or create local helper
const getAssociateColorHelper = (status: string) => {
  switch (status.toLowerCase()) {
    case "user":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200"
    case "associate":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200"
    case "associate-pro":
    case "associate_pro":
      return "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200"
  }
}

interface UserReferralsTableProps {
  referrals: UserReferralResponse[]
}

export function UserReferralsTable({ referrals }: UserReferralsTableProps) {
  const params = useParams<{ id: string }>()
  const userId = params.id
  const user = useAuthStore((state) => state.user)
  const canAddReferral =
    Boolean(user?.role?.is_super_admin) || (user?.permissions ?? []).includes("add-referral")
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [referralEmail, setReferralEmail] = useState("")

  const filteredData =
    statusFilter === "all"
      ? referrals
      : referrals.filter((referral) => referral.userReferralStatus === statusFilter)

  const addReferral = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User ID is required")
      if (!referralEmail.trim()) throw new Error("Referral email is required")
      return addUserReferralByAdmin(userId, referralEmail.trim())
    },
  })

  const handleAddReferral = async () => {
    try {
      await addReferral.mutateAsync()
      toast.success("Referral added successfully")
      setIsAddOpen(false)
      setReferralEmail("")
      queryClient.invalidateQueries({ queryKey: userKeys.referrals(userId) })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) })
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to add referral"))
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">
          Referrals: {filteredData.length}
          {statusFilter !== "all" && (
            <span className="text-sm font-normal text-muted-foreground ml-2">(filtered by {statusFilter})</span>
          )}
        </CardTitle>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="associate">Associate</SelectItem>
              <SelectItem value="associate-pro">Associate Pro</SelectItem>
            </SelectContent>
          </Select>
          {canAddReferral && (
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Referral
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <AdminMobileStack className="mb-4 space-y-3">
          {filteredData.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No referrals found{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}
            </p>
          ) : (
            filteredData.map((referral) => (
              <AdminMobileCard key={referral._id} title={referral.name} subtitle={referral.email}>
                <AdminMobileField
                  label="Status"
                  value={
                    <Badge variant="outline" className={getAssociateColorHelper(referral.userReferralStatus)}>
                      {referral.userReferralStatus}
                    </Badge>
                  }
                />
                <AdminMobileField label="Phone" value={referral.phoneNumber} />
                <AdminMobileField
                  label="Account"
                  value={
                    <Badge variant="outline" className={getStatusColor(referral.status)}>
                      {referral.status}
                    </Badge>
                  }
                />
                <AdminMobileField label="Commission" value={formatAmount(referral.commission)} />
                <AdminMobileField label="Joined" value={formatDate(referral.createdAt)} />
                <div className="flex justify-end border-t border-border pt-2">
                  <UserReferralActions referralId={referral._id} referralName={referral.name} />
                </div>
              </AdminMobileCard>
            ))
          )}
        </AdminMobileStack>

        <AdminDesktopTableWrap>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead>Commission Gained</TableHead>
                <TableHead>Date Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                    No referrals found{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((referral) => (
                  <TableRow key={referral._id}>
                    <TableCell className="font-medium">{referral.name}</TableCell>
                    <TableCell>{referral.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getAssociateColorHelper(referral.userReferralStatus)}>
                        {referral.userReferralStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{referral.phoneNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(referral.status)}>
                        {referral.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatAmount(referral.commission)}
                    </TableCell>
                    <TableCell>{formatDate(referral.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <UserReferralActions
                        referralId={referral._id}
                        referralName={referral.name}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        </AdminDesktopTableWrap>
      </CardContent>

      <Dialog open={isAddOpen && canAddReferral} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Referral</DialogTitle>
            <DialogDescription>Enter the referral email to add to this user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              type="email"
              value={referralEmail}
              onChange={(event) => setReferralEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={addReferral.isPending}>
              Cancel
            </Button>
            <Button onClick={handleAddReferral} disabled={addReferral.isPending || !referralEmail.trim()}>
              Add Referral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
