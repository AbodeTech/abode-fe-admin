'use client';

import { useState } from 'react';
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
const MAX_DONUT_CATEGORIES = 6;
const MAX_REGION_ROWS = 8;

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
  // Historical cohorts can have a referral entry for every individual
  // username. Sending all of those to Recharts' Legend creates an unbounded
  // list that spills over the dashboard. Keep the largest categories visible
  // and group the remainder without changing the total represented by the pie.
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const chartData = sortedData.length > MAX_DONUT_CATEGORIES
    ? [
        ...sortedData.slice(0, MAX_DONUT_CATEGORIES - 1),
        {
          name: 'Other',
          value: sortedData
            .slice(MAX_DONUT_CATEGORIES - 1)
            .reduce((total, item) => total + item.value, 0),
        },
      ]
    : data;

  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
            {chartData.map((_, i) => (
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
  const [showAllRegions, setShowAllRegions] = useState(false);
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const chartData = sortedData.length > MAX_REGION_ROWS
    ? [
        ...sortedData.slice(0, MAX_REGION_ROWS - 1),
        {
          name: 'Other',
          value: sortedData
            .slice(MAX_REGION_ROWS - 1)
            .reduce((total, item) => total + item.value, 0),
        },
      ]
    : sortedData;
  const totalRegistrations = sortedData.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tickFormatter={(name: string) => name.length > 18 ? `${name.slice(0, 17)}…` : name}
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            width={126}
          />
          <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
            {chartData.map((_, i) => {
              const t = i / Math.max(chartData.length - 1, 1);
              const r = Math.round(232 + (2 - 232) * t);
              const g = Math.round(113 + (184 - 113) * t);
              const b = Math.round(58 + (207 - 58) * t);
              return <Cell key={i} fill={`rgb(${r},${g},${b})`} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {data.length > MAX_REGION_ROWS ? (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setShowAllRegions((visible) => !visible)}
            aria-expanded={showAllRegions}
            className="text-xs font-semibold text-[#E8713A] transition hover:text-[#cf5f2e]"
          >
            {showAllRegions ? 'Show less' : `View all ${data.length} regions`}
          </button>
          {showAllRegions ? (
            <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-slate-100">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-b border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <span>Region</span><span className="text-right">Registrations</span><span className="w-12 text-right">Share</span>
              </div>
              {sortedData.map((item) => {
                const share = totalRegistrations > 0 ? (item.value / totalRegistrations) * 100 : 0;
                return (
                  <div key={item.name} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-slate-50 px-3 py-2 text-xs last:border-0">
                    <span className="truncate text-slate-600" title={item.name}>{item.name}</span>
                    <span className="text-right font-medium tabular-nums text-slate-700">{item.value.toLocaleString()}</span>
                    <span className="w-12 text-right tabular-nums text-slate-400">{share.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
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
