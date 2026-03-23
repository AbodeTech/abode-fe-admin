"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#82ca9d", "#e76f51", "#8884d8", "#a8dadc"];

const REGISTRATION_TREND = [
  { month: "Apr '24", count: 120 },
  { month: "May '24", count: 185 },
  { month: "Jun '24", count: 210 },
  { month: "Jul '24", count: 175 },
  { month: "Aug '24", count: 230 },
  { month: "Sep '24", count: 290 },
  { month: "Oct '24", count: 340 },
  { month: "Nov '24", count: 410 },
  { month: "Dec '24", count: 370 },
  { month: "Jan '25", count: 450 },
  { month: "Feb '25", count: 520 },
  { month: "Mar '25", count: 610 },
];

const HOW_YOU_HEARD = [
  { name: "Someone invited me", value: 1420 },
  { name: "Social Media", value: 870 },
  { name: "Associate", value: 640 },
  { name: "Billboard", value: 310 },
  { name: "Email Newsletter", value: 195 },
  { name: "African Wealth Festival", value: 140 },
  { name: "Other", value: 85 },
];

const TOTAL_USERS = 3660;
const REFERRAL_COUNT = 2060;
const ORGANIC_COUNT = 1600;

const REFERRAL_VS_ORGANIC = [
  { label: "Via Referral", count: REFERRAL_COUNT, color: "#0088FE" },
  { label: "Organic", count: ORGANIC_COUNT, color: "#00C49F" },
];

interface Props {
  startDate?: string | null;
  endDate?: string | null;
  userStatus?: string | null;
}

export function UserAnalyticsAcquisition({ startDate: _startDate, endDate: _endDate, userStatus: _userStatus }: Props) {
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
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={REGISTRATION_TREND}>
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
          </CardContent>
        </Card>

        {/* Referral vs Organic */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Referral vs Organic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              {REFERRAL_VS_ORGANIC.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.round((item.count / TOTAL_USERS) * 100)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((item.count / TOTAL_USERS) * 100)}% of total
                  </p>
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Total Users</span>
                  <span className="font-bold">{TOTAL_USERS.toLocaleString()}</span>
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
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={HOW_YOU_HEARD}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                dataKey="value"
                paddingAngle={2}
              >
                {HOW_YOU_HEARD.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value.toLocaleString(), "Users"]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </section>
  );
}
