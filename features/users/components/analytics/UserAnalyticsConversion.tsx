"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Crown, UserCheck, Users } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useSystemUsersOverview } from "@/features/users/hooks/use-users";

interface Props {
  startDate?: string | null;
  endDate?: string | null;
  userStatus?: string | null;
}

export function UserAnalyticsConversion({ startDate, endDate }: Props) {
  const { data: metrics, isLoading } = useSystemUsersOverview({
    startDate: startDate ?? undefined,
    endDate: endDate ?? undefined,
  });

  const totalUsers = metrics?.total_users.value ?? 0;
  const totalAssociates = metrics?.total_associates.value ?? 0;
  const totalAssociatePro = metrics?.total_associate_pros.value ?? 0;
  const activeAssociate = metrics?.active_associates.value ?? 0;
  const activeAssociatePro = metrics?.active_associate_pros.value ?? 0;

  const userToProRate = totalUsers > 0 ? Math.round((totalAssociatePro / totalUsers) * 100) : 0;
  const assocToProRate = totalAssociates > 0 ? Math.round((totalAssociatePro / totalAssociates) * 100) : 0;

  const totalAssociatesAll = totalAssociates + totalAssociatePro;
  const activeAll = activeAssociate + activeAssociatePro;
  const dormantAll = totalAssociatesAll - activeAll;
  const activityRate = totalAssociatesAll > 0 ? Math.round((activeAll / totalAssociatesAll) * 100) : 0;

  const ACTIVITY_DATA = [
    { name: "Active", value: activeAll },
    { name: "Dormant", value: dormantAll },
  ];

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Conversion & Growth</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Conversion & Growth</h2>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* User → Associate Pro */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              User → Associate Pro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-center flex-1">
                  <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="text-center flex-1">
                  <Crown className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                  <p className="text-2xl font-bold text-yellow-600">
                    {totalAssociatePro.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Associate Pro</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Conversion rate</span>
                  <span className="font-semibold text-foreground">{userToProRate}%</span>
                </div>
                <Progress value={userToProRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Associate → Associate Pro */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Associate → Associate Pro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-center flex-1">
                  <UserCheck className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-2xl font-bold">{totalAssociates.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Associates</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="text-center flex-1">
                  <Crown className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                  <p className="text-2xl font-bold text-yellow-600">
                    {totalAssociatePro.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Associate Pro</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Upgrade rate</span>
                  <span className="font-semibold text-foreground">{assocToProRate}%</span>
                </div>
                <Progress value={assocToProRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Associate Activity Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Associate Activity Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={ACTIVITY_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={56}
                    dataKey="value"
                    paddingAngle={3}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#00C49F" />
                    <Cell fill="#E5E7EB" />
                  </Pie>
                  <Tooltip formatter={(value: number) => [value.toLocaleString(), "Associates"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center -mt-1">
                <p className="text-3xl font-bold">{activityRate}%</p>
                <p className="text-xs text-muted-foreground">active this period</p>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#00C49F]" />
                  <span className="text-muted-foreground">
                    Active:{" "}
                    <span className="font-semibold text-foreground">{activeAll.toLocaleString()}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-gray-200" />
                  <span className="text-muted-foreground">
                    Dormant:{" "}
                    <span className="font-semibold text-foreground">{dormantAll.toLocaleString()}</span>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
