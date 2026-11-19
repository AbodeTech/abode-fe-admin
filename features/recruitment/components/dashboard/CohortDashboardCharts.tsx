'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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

import { groupRegionsByState, topWithRemainder, type StateBreakdown } from '../../lib/dashboard-breakdowns';

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

export function ReferralDonutChart({
  data,
  title = 'How they heard about us',
  emptyMessage,
}: {
  data: ChartDatum[];
  title?: string;
  /** When set, an empty `data` shows this instead of a blank chart. */
  emptyMessage?: string;
}) {
  if (data.length === 0 && emptyMessage) {
    return (
      <ChartCard title={title}>
        <p className="flex h-60 items-center justify-center text-sm text-slate-400">{emptyMessage}</p>
      </ChartCard>
    );
  }
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

const REGION_DEFAULT_ROWS = 10;
const BAR_ROW_HEIGHT = 28;
const LGAS_IN_TOOLTIP = 5;

function StateTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: { payload: StateBreakdown }[];
  total: number;
}) {
  const state = payload?.[0]?.payload;
  if (!active || !state) return null;
  const share = total > 0 ? Math.round((state.value / total) * 1000) / 10 : 0;
  return (
    <div style={{ ...tooltipStyle, padding: '8px 12px', minWidth: 160 }}>
      <div style={{ fontWeight: 600 }}>{state.name}</div>
      <div style={tooltipLabelStyle}>
        {state.value.toLocaleString()} registrations · {share}%
      </div>
      {state.lgas.length > 0 ? (
        <ul style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #334155', listStyle: 'none' }}>
          {state.lgas.slice(0, LGAS_IN_TOOLTIP).map((lga) => (
            <li key={lga.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <span>{lga.name}</span>
              <span style={tooltipLabelStyle}>{lga.value.toLocaleString()}</span>
            </li>
          ))}
          {state.lgas.length > LGAS_IN_TOOLTIP ? (
            <li style={tooltipLabelStyle}>+{state.lgas.length - LGAS_IN_TOOLTIP} more areas</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * The backend groups region by its raw "LGA, State" string, which on real data
 * is hundreds of bars. Collapse to states, largest first, top rows by default;
 * hovering a state lists its biggest LGAs.
 */
export function RegionBarChart({ data, title = 'Registrations by state' }: { data: ChartDatum[]; title?: string }) {
  const [showAll, setShowAll] = useState(false);
  const states = useMemo(() => groupRegionsByState(data), [data]);
  const total = useMemo(() => states.reduce((sum, s) => sum + s.value, 0), [states]);
  const visible = showAll ? states : states.slice(0, REGION_DEFAULT_ROWS);
  const canToggle = states.length > REGION_DEFAULT_ROWS;

  return (
    <ChartCard
      title={title}
      subtitle={states.length > 0 ? `${states.length} states · ${total.toLocaleString()} registrations` : undefined}
    >
      {states.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">No region data in this period.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(visible.length * BAR_ROW_HEIGHT + 24, 120)}>
            <BarChart data={visible} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                width={110}
                interval={0}
              />
              <Tooltip content={<StateTooltip total={total} />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" fill="#E8713A" radius={[0, 6, 6, 0]} barSize={16}>
                <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: '#64748b' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {canToggle ? (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mt-2 text-xs font-semibold text-[#E8713A] hover:text-[#E8713A]/80"
            >
              {showAll ? `Show top ${REGION_DEFAULT_ROWS}` : `Show all ${states.length} states`}
            </button>
          ) : null}
        </>
      )}
    </ChartCard>
  );
}

const REFERRERS_DEFAULT_ROWS = 10;
const referrerLabel = (name: string) => (name.length > 22 ? `${name.slice(0, 21)}…` : name);

/**
 * The backend's `referralBreakdown` is one row per referrer username (not per
 * channel), so on real data it is hundreds of rows. Show the top referrers and
 * account for the rest in a footer; the full list lives on the Referrals page.
 */
export function TopReferrersChart({
  data,
  referralsHref,
  limit = REFERRERS_DEFAULT_ROWS,
}: {
  data: ChartDatum[];
  referralsHref: string;
  limit?: number;
}) {
  const { top, otherCount, otherValue } = useMemo(() => topWithRemainder(data, limit), [data, limit]);
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  const otherShare = total > 0 ? Math.round((otherValue / total) * 100) : 0;

  return (
    <ChartCard
      title="Top referrers"
      subtitle={data.length > 0 ? `${data.length.toLocaleString()} referrers · ${total.toLocaleString()} referred` : undefined}
    >
      {top.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">No referred registrations in this period.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(top.length * BAR_ROW_HEIGHT + 24, 120)}>
            <BarChart data={top} layout="vertical" margin={{ top: 0, right: 44, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                width={150}
                interval={0}
                tickFormatter={referrerLabel}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="value" name="Registrations" fill="#02B8CF" radius={[0, 6, 6, 0]} barSize={16}>
                <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: '#64748b' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              {otherCount > 0
                ? `+ ${otherCount.toLocaleString()} other referrers · ${otherValue.toLocaleString()} registrations (${otherShare}%)`
                : null}
            </span>
            <Link href={referralsHref} className="font-semibold text-[#E8713A] hover:text-[#E8713A]/80">
              View all referrers →
            </Link>
          </div>
        </>
      )}
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
