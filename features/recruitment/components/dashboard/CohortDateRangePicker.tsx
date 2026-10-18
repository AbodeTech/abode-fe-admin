'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';

/** Ported from Abode Academy's `components/admin/date-range-picker.tsx`. */

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

const presets: { label: string; getRange: () => { from: Date; to: Date } }[] = [
  {
    label: 'Today',
    getRange: () => {
      const now = new Date();
      return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()), to: now };
    },
  },
  { label: 'Last 7 days', getRange: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: 'Last 14 days', getRange: () => ({ from: subDays(new Date(), 13), to: new Date() }) },
  { label: 'Last 30 days', getRange: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  {
    label: 'This week',
    getRange: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: new Date() }),
  },
  {
    label: 'Last week',
    getRange: () => {
      const lastWeek = subWeeks(new Date(), 1);
      return { from: startOfWeek(lastWeek, { weekStartsOn: 1 }), to: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
    },
  },
  { label: 'This month', getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  {
    label: 'Last month',
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    },
  },
  { label: 'Last 90 days', getRange: () => ({ from: subDays(new Date(), 89), to: new Date() }) },
];

interface CohortDateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function CohortDateRangePicker({ value, onChange }: CohortDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCustomOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectPreset(preset: (typeof presets)[number]) {
    const range = preset.getRange();
    onChange({ from: range.from, to: range.to, label: preset.label });
    setOpen(false);
    setCustomOpen(false);
  }

  function applyCustom() {
    if (!customFrom || !customTo) return;
    const from = new Date(customFrom);
    const to = new Date(customTo);
    if (from > to) return;
    onChange({ from, to, label: `${format(from, 'MMM d')} - ${format(to, 'MMM d, yyyy')}` });
    setOpen(false);
    setCustomOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <CalendarDays size={15} className="text-slate-400" />
        <span>{value.label}</span>
        <ChevronDown size={14} className={`text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <div className="mb-1 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Quick ranges
          </div>
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => selectPreset(preset)}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                value.label === preset.label ? 'bg-[#E8713A]/5 font-medium text-[#E8713A]' : 'text-slate-600'
              }`}
            >
              {preset.label}
            </button>
          ))}

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            onClick={() => setCustomOpen(!customOpen)}
            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50"
          >
            Custom range…
          </button>

          {customOpen ? (
            <div className="mt-1 space-y-2 rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-medium uppercase tracking-wide text-slate-400">From</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-[#E8713A] focus:ring-1 focus:ring-[#E8713A]/20"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-medium uppercase tracking-wide text-slate-400">To</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-[#E8713A] focus:ring-1 focus:ring-[#E8713A]/20"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={applyCustom}
                disabled={!customFrom || !customTo}
                className="w-full rounded-lg bg-[#E8713A] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#E8713A]/90 disabled:opacity-40"
              >
                Apply range
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
