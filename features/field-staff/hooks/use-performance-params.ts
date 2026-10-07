'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { FieldStaffType } from '../schemas/field-staff.schema';

export const ALL = 'all';

/** Each role has its own page and its own sidebar entry. */
export const ROLE_PATHS: Record<FieldStaffType, string> = {
  site_manager: '/field-performance/site-managers',
  surveyor: '/field-performance/surveyors',
};

/**
 * Everything a Field Performance page shows lives in the URL, so a view is
 * shareable and the back button works. The role is the page itself
 * (`/field-performance/site-managers` or `/surveyors`); the rest is
 * `?person=&site=&year=&month=`. `person` and `site` are ids, or "all".
 */
export function usePerformanceParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const now = new Date();
  const role: FieldStaffType = pathname.startsWith(ROLE_PATHS.surveyor) ? 'surveyor' : 'site_manager';
  const person = params.get('person') || ALL;
  const site = params.get('site') || ALL;
  const year = Number(params.get('year')) || now.getFullYear();
  const month = Number(params.get('month')) || now.getMonth() + 1;

  /**
   * Set some params; `null` removes one. Changing role moves to that role's
   * page; changing role or person resets what depends on it.
   */
  const update = (
    patch: Partial<Record<'role' | 'person' | 'site', string | null>>,
    { replace = false }: { replace?: boolean } = {}
  ) => {
    const next = new URLSearchParams(params.toString());
    const { role: nextRole, ...rest } = patch;
    for (const [key, value] of Object.entries(rest)) {
      if (value === null || value === ALL) next.delete(key);
      else next.set(key, value);
    }
    // A higher level clears the ones below it — unless the patch sets them too.
    if ('role' in patch) {
      if (!('person' in patch)) next.delete('person');
      if (!('site' in patch)) next.delete('site');
    }
    if ('person' in patch && !('site' in patch)) next.delete('site');
    next.delete('role');

    const path = nextRole && nextRole in ROLE_PATHS ? ROLE_PATHS[nextRole as FieldStaffType] : pathname;
    const url = `${path}?${next.toString()}`;
    if (replace) router.replace(url, { scroll: false });
    else router.push(url, { scroll: false });
  };

  return { role, person, site, year, month, update };
}
