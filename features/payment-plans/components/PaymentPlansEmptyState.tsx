'use client';

import { PRESETS } from '../constants/presets';
import { matchesPreset } from '../constants/presets';
import type { FilterFormValues } from '../schemas/payment-plans-filter.schema';
import { Card, CardContent } from '@/components/ui/card';

function emptyMessage(filter: FilterFormValues): string {
  const hit = PRESETS.find((preset) => matchesPreset(filter, preset.filter));
  if (hit?.key === 'defaulted') return 'No defaulted plans matching your filter';
  if (hit?.key === 'terminated') return 'No cancelled plans matching your filter';
  if (hit?.key === 'suspended') return 'No suspended plans matching your filter';
  if (hit?.key === 'overdue') return 'No overdue plans matching your filter';
  if (hit?.key === 'completed') return 'No completed plans matching your filter';
  if (hit?.key === 'active') return 'No active plans matching your filter';
  if (hit?.key === 'upcoming') return 'No plans with upcoming payments matching your filter';
  if (filter.search) return `No payment plans matching “${filter.search}”`;
  return 'No payment plans matching your filter';
}

export function PaymentPlansEmptyState({ filter }: { filter: FilterFormValues }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="font-medium">{emptyMessage(filter)}</p>
        <p className="mt-1 text-sm text-muted-foreground">Try a different preset or clear filters.</p>
      </CardContent>
    </Card>
  );
}
