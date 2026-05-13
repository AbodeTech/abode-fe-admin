"use client";

import { useSystemUsersOverview } from "../../hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Briefcase, UserPlus, Activity, Box, Zap, Crown, UserX, UserMinus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SystemUserOverviewProps {
  startDate?: string;
  endDate?: string;
}

export function SystemUserOverview({ startDate, endDate }: SystemUserOverviewProps) {
  const { data: metrics, isLoading } = useSystemUsersOverview({ startDate, endDate });

  if (isLoading) {
    return (
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const stats = [
    {
      title: "All Users",
      value: metrics.totalUsers,
      icon: Users,
    },
    {
      title: "Customers",
      value: metrics.referralStatusCounts.user,
      icon: UserCheck,
    },
    {
      title: "Associates Pro",
      value: metrics.referralStatusCounts.associatePro,
      icon: Briefcase,
    },
    {
      title: "Associates",
      value: metrics.referralStatusCounts.associate,
      icon: UserPlus,
    },
    {
      title: "No Referrer",
      value: metrics.noReferralUsers,
      icon: UserMinus,
    },
    {
      title: "Active Associates Pro",
      value: metrics.active_associate_pro,
      icon: Activity,
    },
    {
      title: "Active Associates",
      value: metrics.active_associate,
      icon: Activity,
    },
    {
      title: "With Assets",
      value: metrics.users_with_assets,
      icon: Box,
    },
    {
      title: "Flex Subscribers",
      value: metrics.flexSubscribers,
      icon: Zap,
    },
    {
      title: "Full Ownership",
      value: metrics.fullOwnershipSubscribers,
      icon: Crown,
    },
    {
      title: "Default Users",
      value: metrics.defaultUsers,
      icon: UserCheck,
    },
    {
      title: "Overdue Users",
      value: metrics.overdueUsers,
      icon: UserX,
    },
  ];

  return (
    <div className="min-w-0 space-y-4">
      <h2 className="text-lg font-semibold text-[#101828] sm:text-xl">System Overview</h2>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="min-w-0 overflow-hidden border border-[#E5EAEF] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="min-w-0 pr-2 text-sm font-medium text-[#667085]">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 shrink-0 text-[#98A2B3]" />
            </CardHeader>
            <CardContent>
              <div className="wrap-break-word text-xl font-bold text-[#101828] sm:text-2xl">{stat.value?.toLocaleString() ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
