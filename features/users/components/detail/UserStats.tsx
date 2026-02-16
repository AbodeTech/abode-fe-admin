"use client";

import { UserDetail } from "../../types/user.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, Bookmark, Package, DollarSign, PiggyBank, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface UserStatsProps {
  user: UserDetail;
}

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDateWord = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch {
    return "N/A";
  }
};

const DataPoint = ({ title, value, icon, isEven }: { title: string; value: string; icon: React.ReactNode; isEven: boolean }) => (
  <Card className={`${isEven ? "bg-[#F9FAFB]" : "bg-[#101828] text-white"} border-none shadow-sm`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className={`text-sm font-medium ${isEven ? "text-[#667085]" : "text-gray-300"}`}>{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${isEven ? "text-[#101828]" : "text-white"}`}>{value}</div>
    </CardContent>
  </Card>
);

export function UserStats({ user }: UserStatsProps) {
  const stats = [
    {
      title: "Wallet Balance",
      value: formatNaira(user.wallet?.balance || 0),
      icon: <Wallet className="h-4 w-4 text-muted-foreground" />,
      isEven: false,
    },
    {
      title: "Net Worth",
      value: formatNaira(user.virtual_networth || 0),
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      isEven: true,
    },
    {
      title: "Subscriptions",
      value: (user.virtual_subscriptions || 0).toString(),
      icon: <Bookmark className="h-4 w-4 text-muted-foreground" />,
      isEven: false,
    },
    {
      title: "Unit Purchased",
      value: (user.units_purchased || 0).toString(),
      icon: <Package className="h-4 w-4 text-muted-foreground" />,
      isEven: true,
    },
    {
      title: "Amount Paid",
      value: formatNaira(user.amount_paid || 0),
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      isEven: false,
    },
    {
      title: "Balance",
      value: formatNaira(user.balance_payable || 0),
      icon: <PiggyBank className="h-4 w-4 text-muted-foreground" />,
      isEven: true,
    },
    {
      title: "Next Payment Date",
      value: user.next_date_of_payment ? formatDateWord(user.next_date_of_payment) : "N/A",
      icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
      isEven: false,
    },
    {
      title: "Last Login",
      value: user.last_login ? formatDateWord(user.last_login) : "N/A",
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      isEven: true,
    },
  ];

  return (
    <div className="mt-8 space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-[#101828]">User Data Points</h3>
        {/* Actions for suspend/unsuspend can be added here */}
        <Button variant="destructive" className="bg-[#D92D20] hover:bg-[#B42318]">Suspend User</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <DataPoint
            key={i}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            isEven={stat.isEven}
          />
        ))}
      </div>
    </div>
  );
}
