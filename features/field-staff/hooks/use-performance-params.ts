'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { FIELD_STAFF_TYPES, type FieldStaffType } from '../schemas/field-staff.schema';

export const ALL = 'all';

/**
 * Everything the Field Performance page shows lives in the URL, so a view is
 * shareable and the back button works: `?role=&person=&site=&year=&month=`.
 * `person` and `site` are ids, or "all".
 */
export function usePerformanceParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const now = new Date();
  const role: FieldStaffType = FIELD_STAFF_TYPES.find((t) => t === params.get('role')) ?? 'site_manager';
  const person = params.get('person') || ALL;
  const site = params.get('site') || ALL;
  const year = Number(params.get('year')) || now.getFullYear();
  const month = Number(params.get('month')) || now.getMonth() + 1;

  /** Set some params; `null` removes one. Changing role or person resets what depends on it. */
  const update = (patch: Partial<Record<'role' | 'person' | 'site', string | null>>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === ALL) next.delete(key);
      else next.set(key, value);
    }
    // A higher level clears the ones below it — unless the patch sets them too.
    if ('role' in patch) {
      if (!('person' in patch)) next.delete('person');
      if (!('site' in patch)) next.delete('site');
    }
    if ('person' in patch && !('site' in patch)) next.delete('site');
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return { role, person, site, year, month, update };
}
