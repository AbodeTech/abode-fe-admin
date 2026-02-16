"use client"

import { useState } from "react"
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
import { formatAmount, formatDate, getStatusColor, } from "@/lib/utils/transaction-utils"
import { UserReferralResponse } from "@/lib/api/admin/referrals.types"
import { UserReferralActions } from "../UserReferralActions"

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
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredData =
    statusFilter === "all"
      ? referrals
      : referrals.filter((referral) => referral.userReferralStatus === statusFilter)

  if (!referrals || referrals.length === 0) {
    return null // Don't show if no referrals? Or show empty state. Legacy shows empty table.
  }

  return (
    <Card className="mt-8 border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Referrals ({filteredData.length})
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
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Referral Status</TableHead>
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
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No referrals found
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
      </CardContent>
    </Card>
  )
}
