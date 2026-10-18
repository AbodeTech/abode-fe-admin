import { addDays } from 'date-fns';

import type { FilterFormValues } from '../schemas/payment-plans-filter.schema';

export type PresetFilter = Partial<FilterFormValues>;

export interface Preset {
  key: string;
  label: string;
  filter: PresetFilter;
}

export const PRESET_PARAM_KEYS = ['status', 'has_defaults', 'next_payment_due_before'] as const;

export function upcomingDueBefore(): string {
  return addDays(new Date(), 7).toISOString();
}

export const PRESETS: Preset[] = [
  { key: 'active', label: 'All active', filter: { status: ['active'] } },
  { key: 'overdue', label: 'Overdue', filter: { status: ['overdue'] } },
  { key: 'suspended', label: 'Suspended', filter: { status: ['suspended'] } },
  { key: 'terminated', label: 'Terminated', filter: { status: ['cancelled'] } },
  { key: 'completed', label: 'Completed', filter: { status: ['completed'] } },
  { key: 'closed', label: 'Closed', filter: { status: ['closed'] } },
  { key: 'defaulted', label: 'Defaulted', filter: { has_defaults: true } },
  {
    key: 'upcoming',
    label: 'Upcoming due (7 days)',
    filter: { status: ['active'], next_payment_due_before: upcomingDueBefore() },
  },
];

function sameStatus(a: string[] | undefined, b: string[] | undefined): boolean {
  const left = a ?? [];
  const right = b ?? [];
  if (left.length !== right.length) return false;
  return left.every((value) => right.includes(value));
}

export function matchesPreset(activeFilter: FilterFormValues, presetFilter: PresetFilter): boolean {
  if (presetFilter.has_defaults === true) {
    return activeFilter.has_defaults === true;
  }

  if (presetFilter.next_payment_due_before) {
    return (
      sameStatus(activeFilter.status, ['active']) && Boolean(activeFilter.next_payment_due_before)
    );
  }

  if (presetFilter.status?.length) {
    return (
      sameStatus(activeFilter.status, presetFilter.status) &&
      activeFilter.has_defaults !== true &&
      !activeFilter.next_payment_due_before
    );
  }

  return false;
}
