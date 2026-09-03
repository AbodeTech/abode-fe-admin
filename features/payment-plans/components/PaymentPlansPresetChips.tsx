'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';

import { PRESET_PARAM_KEYS, PRESETS, matchesPreset, upcomingDueBefore } from '../constants/presets';
import type { FilterFormValues } from '../schemas/payment-plans-filter.schema';

export function PaymentPlansPresetChips({ activeFilter }: { activeFilter: FilterFormValues }) {
  const router = useRouter();
  const currentUrl = useSearchParams();

  const apply = (preset: (typeof PRESETS)[number]) => {
    const params = new URLSearchParams(currentUrl.toString());
    PRESET_PARAM_KEYS.forEach((key) => params.delete(key));

    if (!matchesPreset(activeFilter, preset.filter)) {
      const filter =
        preset.key === 'upcoming'
          ? { status: ['active'] as const, next_payment_due_before: upcomingDueBefore() }
          : preset.filter;
      Object.entries(filter).forEach(([key, value]) => {
        if (value == null || value === '') return;
        params.set(key, Array.isArray(value) ? value.join(',') : String(value));
      });
    }

    params.set('page', '1');
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {PRESETS.map((preset) => (
        <button
          key={preset.key}
          type="button"
          onClick={() => apply(preset)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm border',
            matchesPreset(activeFilter, preset.filter)
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-foreground border-border hover:bg-muted'
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
