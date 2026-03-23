"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#82ca9d", "#e76f51", "#8884d8", "#a8dadc"];

// --- Mock Data ---

const GENDER = [
  { label: "Male", count: 2210 },
  { label: "Female", count: 1340 },
  { label: "Prefer not to say", count: 110 },
];

const AGE_GROUPS = [
  { label: "18–25", count: 480 },
  { label: "26–35", count: 1340 },
  { label: "36–45", count: 1020 },
  { label: "46–55", count: 570 },
  { label: "55+", count: 250 },
];

const MARITAL_STATUS = [
  { label: "Single", count: 1850 },
  { label: "Married", count: 1490 },
  { label: "Divorced", count: 210 },
  { label: "Widowed", count: 110 },
];

const LOCATIONS = [
  { label: "Lagos", count: 1420 },
  { label: "Abuja", count: 680 },
  { label: "Port Harcourt", count: 430 },
  { label: "Enugu", count: 310 },
  { label: "Ibadan", count: 265 },
  { label: "Kano", count: 190 },
  { label: "Ogun", count: 175 },
  { label: "Delta", count: 140 },
  { label: "Rivers", count: 130 },
  { label: "Diaspora", count: 120 },
];

const EMPLOYMENT_STATUS = [
  { label: "Employed (Full-time)", count: 1680 },
  { label: "Self-employed", count: 920 },
  { label: "Business Owner", count: 540 },
  { label: "Student", count: 310 },
  { label: "Unemployed", count: 140 },
  { label: "Retired", count: 70 },
];

const EDUCATION_LEVEL = [
  { label: "BSc / BA", count: 1540 },
  { label: "MSc / MBA", count: 820 },
  { label: "HND", count: 610 },
  { label: "OND", count: 320 },
  { label: "PhD", count: 190 },
  { label: "SSCE", count: 180 },
];

const EXPERIENCE_LEVEL = [
  { label: "Mid-level (3–7 yrs)", count: 1290 },
  { label: "Senior (7–15 yrs)", count: 980 },
  { label: "Entry (0–3 yrs)", count: 740 },
  { label: "Expert (15+ yrs)", count: 650 },
];

const TOP_OCCUPATIONS = [
  { label: "Software Engineer", count: 480 },
  { label: "Business Owner", count: 420 },
  { label: "Medical Doctor", count: 310 },
  { label: "Lawyer", count: 290 },
  { label: "Banker", count: 265 },
  { label: "Civil Servant", count: 230 },
  { label: "Accountant", count: 210 },
  { label: "Teacher / Lecturer", count: 190 },
  { label: "Marketing / Sales", count: 175 },
  { label: "Engineer (Other)", count: 160 },
];

// --- Sub-components ---

function HorizontalBarChart({ data, color }: { data: { label: string; count: number }[]; color: string }) {
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

function DonutChart({ data }: { data: { label: string; count: number }[] }) {
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

// --- Main Component ---

interface Props {
  startDate?: string | null;
  endDate?: string | null;
  userStatus?: string | null;
}

export function UserAnalyticsDemographics({ startDate: _startDate, endDate: _endDate, userStatus: _userStatus }: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Demographics</h2>

      {/* Row 1: Gender, Age, Marital */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DemographicCard title="Gender">
          <DonutChart data={GENDER} />
        </DemographicCard>

        <DemographicCard title="Age Groups">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={AGE_GROUPS}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => [value.toLocaleString(), "Users"]} />
              <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </DemographicCard>

        <DemographicCard title="Marital Status">
          <DonutChart data={MARITAL_STATUS} />
        </DemographicCard>
      </div>

      {/* Row 2: Location, Employment */}
      <div className="grid gap-4 md:grid-cols-2">
        <DemographicCard title="Top Locations">
          <HorizontalBarChart data={LOCATIONS} color="#00C49F" />
        </DemographicCard>

        <DemographicCard title="Employment Status">
          <HorizontalBarChart data={EMPLOYMENT_STATUS} color="#0088FE" />
        </DemographicCard>
      </div>

      {/* Row 3: Education, Experience */}
      <div className="grid gap-4 md:grid-cols-2">
        <DemographicCard title="Education Level">
          <HorizontalBarChart data={EDUCATION_LEVEL} color="#FFBB28" />
        </DemographicCard>

        <DemographicCard title="Experience Level">
          <HorizontalBarChart data={EXPERIENCE_LEVEL} color="#FF8042" />
        </DemographicCard>
      </div>

      {/* Row 4: Top Occupations (full width) */}
      <DemographicCard title="Top Occupations">
        <HorizontalBarChart data={TOP_OCCUPATIONS} color="#82ca9d" />
      </DemographicCard>
    </section>
  );
}
