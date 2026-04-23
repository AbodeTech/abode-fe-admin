"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
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
import { useUserAnalytics, type AnalyticsDataPoint } from "@/features/users/hooks/use-user-analytics";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#82ca9d", "#e76f51", "#8884d8", "#a8dadc"];

function HorizontalBarChart({ data, color }: { data: AnalyticsDataPoint[]; color: string }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No data available</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value: number) => [value.toLocaleString(), "Users"]} />
        <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DonutChart({ data }: { data: AnalyticsDataPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-16 text-center">No data available</p>;
  }
  const chartData = data.map((d) => ({ name: d.label, value: d.count }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          dataKey="value"
          paddingAngle={3}
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [value.toLocaleString(), "Users"]} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function DemographicCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface Props {
  startDate?: string | null;
  endDate?: string | null;
  userStatus?: string | null;
}

export function UserAnalyticsDemographics({ startDate, endDate, userStatus }: Props) {
  const { data, isLoading } = useUserAnalytics({ startDate, endDate, userStatus });

  const d = data?.demographics;

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Demographics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-60 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-60 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Demographics</h2>

      {/* Row 1: Gender, Age, Marital */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DemographicCard title="Gender">
          <DonutChart data={d?.gender ?? []} />
        </DemographicCard>

        <DemographicCard title="Age Groups">
          {(d?.ageGroups ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={d?.ageGroups ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [value.toLocaleString(), "Users"]} />
                <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </DemographicCard>

        <DemographicCard title="Marital Status">
          <DonutChart data={d?.maritalStatus ?? []} />
        </DemographicCard>
      </div>

      {/* Row 2: Location, Employment */}
      <div className="grid gap-4 md:grid-cols-2">
        <DemographicCard title="Top Locations">
          <HorizontalBarChart data={d?.locations ?? []} color="#00C49F" />
        </DemographicCard>

        <DemographicCard title="Employment Status">
          <HorizontalBarChart data={d?.employmentStatus ?? []} color="#0088FE" />
        </DemographicCard>
      </div>

      {/* Row 3: Education, Experience */}
      <div className="grid gap-4 md:grid-cols-2">
        <DemographicCard title="Education Level">
          <HorizontalBarChart data={d?.educationLevel ?? []} color="#FFBB28" />
        </DemographicCard>

        <DemographicCard title="Experience Level">
          <HorizontalBarChart data={d?.experienceLevel ?? []} color="#FF8042" />
        </DemographicCard>
      </div>

      {/* Row 4: Top Occupations (full width) */}
      <DemographicCard title="Top Occupations">
        <HorizontalBarChart data={d?.topOccupations ?? []} color="#82ca9d" />
      </DemographicCard>
    </section>
  );
}
