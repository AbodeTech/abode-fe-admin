"use client";

import { UserDetail } from "../../types/user.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Wallet, ShoppingCart, Calendar } from "lucide-react";
import { format } from "date-fns";

interface UserStatsCardsProps {
  user: UserDetail;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch {
    return "N/A";
  }
};

export function UserStatsCards({ user }: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="border border-[#E5EAEF] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#667085]">Virtual Net Worth</CardTitle>
          <DollarSign className="h-4 w-4 text-[#98A2B3]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#101828]">
            {formatCurrency(user.virtual_networth || 0)}
          </div>
          <p className="text-xs text-[#667085] mt-1">Total property value</p>
        </CardContent>
      </Card>

      <Card className="border border-[#E5EAEF] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#667085]">Wallet Balance</CardTitle>
          <Wallet className="h-4 w-4 text-[#98A2B3]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#101828]">
            {formatCurrency(user.wallet?.balance || 0)}
          </div>
          <p className="text-xs text-[#667085] mt-1">Available funds</p>
        </CardContent>
      </Card>

      <Card className="border border-[#E5EAEF] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#667085]">Products Purchased</CardTitle>
          <ShoppingCart className="h-4 w-4 text-[#98A2B3]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#101828]">
            {user.virtual_subscriptions || 0}
          </div>
          <p className="text-xs text-[#667085] mt-1">
            {user.units_purchased ? `${user.units_purchased} Units` : "No units"}
          </p>
        </CardContent>
      </Card>

      <Card className="border border-[#E5EAEF] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#667085]">Next Payment</CardTitle>
          <Calendar className="h-4 w-4 text-[#98A2B3]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#101828]">
            {user.next_date_of_payment ? formatDate(user.next_date_of_payment) : "N/A"}
          </div>
          {user.amount_payable > 0 && (
            <p className="text-xs text-[#667085] mt-1">
              Due: {formatCurrency(user.amount_payable)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
