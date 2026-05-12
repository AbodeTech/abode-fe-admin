"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useUserAnalytics } from "@/features/users/hooks/use-user-analytics";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#82ca9d", "#e76f51", "#8884d8", "#a8dadc"];

interface Props {
  startDate?: string | null;
  endDate?: string | null;
  userStatus?: string | null;
}

export function UserAnalyticsAcquisition({ startDate, endDate, userStatus }: Props) {
  const { data, isLoading } = useUserAnalytics({ startDate, endDate, userStatus });

  const totalUsers = data?.totalUsers ?? 0;
  const referredCount = data?.referredCount ?? 0;
  const notReferredCount = data?.notReferredCount ?? 0;
  const registrationTrend = data?.acquisition.registrationTrend ?? [];
  const howYouHeard = (data?.acquisition.howYouHeard ?? []).map((e) => ({
    name: e.source,
    value: e.count,
  }));

  const referralVsOrganic = [
    { label: "Via Referral", count: referredCount, color: "#0088FE" },
    { label: "Organic", count: notReferredCount, color: "#00C49F" },
  ];

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Acquisition</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-65 rounded-xl" />
          <Skeleton className="h-65 rounded-xl" />
        </div>
        <Skeleton className="h-72.5 rounded-xl" />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Acquisition</h2>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Registration Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Registration Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {registrationTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground py-16 text-center">No data for selected period</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={registrationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [value.toLocaleString(), "New Users"]} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0088FE"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="New Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Referral vs Organic */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Referral vs Organic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              {referralVsOrganic.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: totalUsers > 0 ? `${Math.round((item.count / totalUsers) * 100)}%` : "0%",
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0}% of total
                  </p>
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Total Users</span>
                  <span className="font-bold">{totalUsers.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How You Heard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">How Users Found Us</CardTitle>
        </CardHeader>
        <CardContent>
          {howYouHeard.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">No data for selected period</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={howYouHeard}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {howYouHeard.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value.toLocaleString(), "Users"]} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
