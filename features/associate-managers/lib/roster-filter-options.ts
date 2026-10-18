import {
  isSingleScopeOnlyGroup,
  type ProGroup,
  type ProSort,
} from '../schemas/manager-dashboard.schema';

/**
 * Roster filter and sort controls.
 *
 * These now cover the BE's full vocabulary — the period-scoped groups and the
 * `onboarded_at_desc` sort that the v2 module originally lacked are all
 * implemented, so nothing here is offered without a backing filter.
 */

interface GroupOption {
  label: string;
  value: ProGroup;
}

const ALL_PRO_GROUP_OPTIONS: readonly GroupOption[] = [
  { label: 'All pros', value: 'all' },
  { label: 'Recruited this period', value: 'recruited_in_period' },
  { label: 'Upgraded this period', value: 'upgraded_in_period' },
  { label: 'Onboarded this period', value: 'onboarded_in_period' },
  { label: 'Selling this period', value: 'selling_in_period' },
  { label: 'Not yet onboarded', value: 'recruited_not_onboarded' },
  { label: 'Recruited someone this period', value: 'active_recruiter' },
  { label: 'Drove an upgrade this period', value: 'active_promoter' },
  { label: 'Generated revenue this period', value: 'active_revenue_generator' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Abandoned', value: 'abandoned' },
];

export const PRO_GROUP_OPTIONS = ALL_PRO_GROUP_OPTIONS;

/**
 * The groups worth offering for a given scope.
 *
 * The three contributor groups credit an individual pro, which the BE answers
 * with an empty roster on the combined and system scopes. An empty table reads
 * as "nobody qualified" rather than "this question doesn't apply here", so they
 * are dropped from the org-wide views instead.
 */
export const proGroupOptionsForScope = (
  scope: 'single' | 'combined' | 'system'
): readonly GroupOption[] =>
  scope === 'single'
    ? ALL_PRO_GROUP_OPTIONS
    : ALL_PRO_GROUP_OPTIONS.filter((o) => !isSingleScopeOnlyGroup(o.value));

export const PRO_SORT_OPTIONS: ReadonlyArray<{ label: string; value: ProSort }> = [
  { label: 'Name (A-Z)', value: 'name_asc' },
  { label: 'Name (Z-A)', value: 'name_desc' },
  { label: 'Date recruited (newest)', value: 'recruited_desc' },
  { label: 'Onboarded (recent)', value: 'onboarded_at_desc' },
  { label: 'Last login (recent)', value: 'last_login_desc' },
  { label: 'Last sale (recent)', value: 'last_sale_desc' },
  { label: 'Last recruit (recent)', value: 'last_recruit_desc' },
  { label: 'Total sales (high)', value: 'sales_desc' },
  { label: 'Revenue (high)', value: 'revenue_desc' },
];
