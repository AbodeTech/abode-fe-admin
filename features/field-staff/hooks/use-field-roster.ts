'use client';

import type { FieldStaff, FieldStaffType } from '../schemas/field-staff.schema';
import type { PerformanceSummary, StaffMonth } from '../schemas/performance.schema';
import { useFieldPerformanceSummary } from './use-field-performance';
import { useFieldStaffList } from './use-field-staff';

export type RosterRow = {
  staff: FieldStaff;
  /** Null for invited and disabled people — the summary only covers active workers. */
  month: StaffMonth | null;
};

/**
 * The team table for one role and month. The performance summary only
 * includes **active** workers, so it's joined onto the full staff list to keep
 * invited and disabled people visible.
 */
export function useFieldRoster(staffType: FieldStaffType, year: number, month: number) {
  const staff = useFieldStaffList({ staff_type: staffType, limit: 100 });
  const summary = useFieldPerformanceSummary(staffType, year, month);

  const byId = new Map((summary.data?.workers ?? []).map((w) => [w.field_staff.id, w]));
  const rows: RosterRow[] = (staff.data?.items ?? []).map((person) => ({
    staff: person,
    month: byId.get(person.id) ?? null,
  }));

  return {
    rows,
    summary: summary.data as PerformanceSummary | undefined,
    isLoading: staff.isLoading || summary.isLoading,
    error: staff.error ?? summary.error,
  };
}
