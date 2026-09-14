'use client';

import { BarChart3, Calendar, MapPin, TrendingDown, TrendingUp, Users } from 'lucide-react';

/** Ported from Abode Academy's `components/admin/stat-cards.tsx`. */

interface CohortStatCardsProps {
  total: number;
  periodCount: number;
  statesCovered: number;
  avgPerDay: number;
  comparison?: { delta: number; pctChange: number };
  rangeLabel?: string;
}

export function CohortStatCards({
  total,
  periodCount,
  statesCovered,
  avgPerDay,
  comparison,
  rangeLabel,
}: CohortStatCardsProps) {
  const showDelta = comparison && comparison.pctChange !== 0;
  const isUp = (comparison?.delta ?? 0) >= 0;

  const cards = [
    { label: 'All-time total', value: total, icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    {
      label: rangeLabel ? `In ${rangeLabel}` : 'In period',
      value: periodCount,
      icon: Calendar,
      iconBg: 'bg-[#E8713A]/10',
      iconColor: 'text-[#E8713A]',
      delta: showDelta
        ? { value: `${isUp ? '+' : ''}${comparison!.pctChange}%`, isUp, label: 'vs prev period' }
        : undefined,
    },
    { label: 'Avg / day', value: avgPerDay, icon: BarChart3, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'States covered', value: statesCovered, icon: MapPin, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{card.value.toLocaleString()}</p>
                {'delta' in card && card.delta ? (
                  <div className="mt-1.5 flex items-center gap-1">
                    {card.delta.isUp ? (
                      <TrendingUp size={12} className="text-emerald-500" />
                    ) : (
                      <TrendingDown size={12} className="text-rose-500" />
                    )}
                    <span className={`text-xs font-semibold ${card.delta.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {card.delta.value}
                    </span>
                    <span className="text-[10px] text-slate-400">{card.delta.label}</span>
                  </div>
                ) : null}
              </div>
              <div className={`rounded-xl p-2.5 ${card.iconBg}`}>
                <Icon size={18} className={card.iconColor} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
