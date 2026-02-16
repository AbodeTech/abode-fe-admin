"use client";

import { useSystemUsersOverview } from "../../hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Briefcase, UserPlus, Activity, Box, Zap, Crown, UserX, UserMinus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function SystemUserOverview() {
  const { data: metrics, isLoading } = useSystemUsersOverview();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[#101828]">System Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border border-[#E5EAEF] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#667085]">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-[#98A2B3]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#101828]">{stat.value?.toLocaleString() ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
