'use client';

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
  BarChart,
  Bar,
  LabelList,
} from 'recharts';
import { format } from 'date-fns';

/**
 * Ported from the Abode Academy site's own admin dashboard
 * (components/admin/dashboard-charts.tsx) for visual parity across the two
 * apps — same palette, same chart types, same tooltip/legend treatment.
 * Adapted only where this app has no equivalent design token: literal hex
 * arbitrary-value classes instead of `abode-orange`, default font stack
 * instead of `--font-display`.
 */

const PALETTE = ['#E8713A', '#02B8CF', '#0F4C59', '#0593A5', '#f59e0b', '#64748b', '#a855f7'];

interface ChartDatum {
  name: string;
  value: number;
}
interface TimeDatum {
  date: string;
  count: number;
}

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-end justify-between">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle ? <span className="text-[10px] font-medium text-slate-400">{subtitle}</span> : null}
      </div>
      {children}
    </div>
  );
}

const tooltipStyle = { background: '#0f172a', border: 'none', borderRadius: 8, fontSize: 12, color: '#fff' };
const tooltipLabelStyle = { color: '#94a3b8' };
const tooltipItemStyle = { color: '#fff' };

export function RegistrationsLineChart({
  data,
  prevData,
  showComparison,
  title = 'Registrations over time',
  subtitle,
}: {
  data: TimeDatum[];
  prevData?: TimeDatum[];
  showComparison?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const merged = data.map((item, i) => ({
    date: format(new Date(item.date), 'MMM d'),
    current: item.count,
    previous: showComparison && prevData?.[i] ? prevData[i].count : undefined,
  }));

  return (
    <ChartCard
      title={title}
      subtitle={subtitle ?? (showComparison ? 'Orange = current, dashed = previous period' : undefined)}
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={merged} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            interval={Math.max(Math.floor(data.length / 8), 1)}
          />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
          <Line
            type="monotone"
            dataKey="current"
            name="Current"
            stroke="#E8713A"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#E8713A' }}
          />
          {showComparison ? (
            <Line
              type="monotone"
              dataKey="previous"
              name="Previous"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4, fill: '#94a3b8' }}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ReferralDonutChart({ data, title = 'How they heard about us' }: { data: ChartDatum[]; title?: string }) {
  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function GenderBarChart({ data }: { data: ChartDatum[] }) {
  return (
    <ChartCard title="Gender breakdown">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={80} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
          <Bar dataKey="value" fill="#02B8CF" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function AgeBarChart({ data }: { data: ChartDatum[] }) {
  return (
    <ChartCard title="Age bracket">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
          <Bar dataKey="value" fill="#E8713A" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function StatusDonutChart({ data, title = 'Registrant status' }: { data: ChartDatum[]; title?: string }) {
  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RegionBarChart({ data, title = 'Registrations by region' }: { data: ChartDatum[]; title?: string }) {
  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={110} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => {
              const t = i / Math.max(data.length - 1, 1);
              const r = Math.round(232 + (2 - 232) * t);
              const g = Math.round(113 + (184 - 113) * t);
              const b = Math.round(58 + (207 - 58) * t);
              return <Cell key={i} fill={`rgb(${r},${g},${b})`} />;
            })}
            <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: '#64748b' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PreviousAttendeesDonut({ data }: { data: ChartDatum[] }) {
  return (
    <ChartCard title="Previous attendees">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? '#02B8CF' : '#E8713A'} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function AssociateProDonut({ data }: { data: ChartDatum[] }) {
  return (
    <ChartCard title="Associate pro breakdown">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? '#0F4C59' : '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
