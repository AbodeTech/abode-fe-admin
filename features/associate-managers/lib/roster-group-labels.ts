import { PRO_GROUPS, type ProGroup } from '../schemas/manager-dashboard.schema';

/**
 * Copy for each roster group. Activity thresholds quoted here are the BE's own
 * (`ACTIVE_WINDOW_DAYS = 30`, `ABANDONED_AFTER_DAYS = 60`) measured across last
 * login, last sale and last recruit — not login alone.
 */
export const GROUP_LABELS: Record<
  ProGroup,
  { title: string; associateTitle: string; description: string }
> = {
  all: {
    title: 'All Associate Pros',
    associateTitle: 'All Associates',
    description: 'Everyone on the roster for the selected period.',
  },

  // ── What happened TO the pro in the window ──
  recruited_in_period: {
    title: 'New Recruits This Period',
    associateTitle: 'New Recruits This Period',
    description: 'People who joined the roster during the selected period.',
  },
  upgraded_in_period: {
    title: 'Promoted to Associate Pro',
    associateTitle: 'Promoted to Associate Pro',
    description: 'Roster members who became associate pros during this period.',
  },
  onboarded_in_period: {
    title: 'Onboarded This Period',
    associateTitle: 'Onboarded This Period',
    description: 'Roster members whose onboarding call was answered in this period.',
  },
  recruited_not_onboarded: {
    title: 'Onboarding Queue',
    associateTitle: 'Onboarding Queue',
    description:
      'Recruited but never successfully onboarded — not period-scoped, this is the whole backlog.',
  },

  // ── What the pro DROVE in the window ──
  selling_in_period: {
    title: 'Selling Associate Pros',
    associateTitle: 'Selling Associates',
    description:
      'Roster members who closed at least one new (initial) sale during the selected period.',
  },
  active_recruiter: {
    title: 'Recruiting This Period',
    associateTitle: 'Recruiting This Period',
    description: 'Roster members who brought in at least one recruit during the period.',
  },
  active_promoter: {
    title: 'Driving Upgrades This Period',
    associateTitle: 'Driving Upgrades This Period',
    description: 'Roster members whose recruits upgraded to associate pro this period.',
  },
  active_revenue_generator: {
    title: 'Generating Revenue This Period',
    associateTitle: 'Generating Revenue This Period',
    description:
      'Roster members who generated ANY revenue this period, recurring included — wider than "selling", which counts new sales only.',
  },

  // ── Activity buckets ──
  active: {
    title: 'Active Associate Pros',
    associateTitle: 'Active Associates',
    description: 'Logged in, sold, or recruited within the last 30 days.',
  },
  inactive: {
    title: 'Inactive Associate Pros',
    associateTitle: 'Inactive Associates',
    description: 'Last login, sale or recruit was 30-60 days ago.',
  },
  abandoned: {
    title: 'Abandoned Associate Pros',
    associateTitle: 'Abandoned Associates',
    description: 'No login, sale or recruit in over 60 days — or none ever.',
  },

  // ── v2-era aliases, kept so a stored URL keeps working ──
  recruiting: {
    title: 'Recruiting This Period',
    associateTitle: 'Recruiting This Period',
    description: 'Roster members who brought in at least one recruit during the period.',
  },
  selling: {
    title: 'Selling Associate Pros',
    associateTitle: 'Selling Associates',
    description:
      'Roster members who closed at least one new (initial) sale during the selected period.',
  },
};

export function getGroupLabel(
  group: ProGroup,
  roster: 'associate-pro' | 'associate' = 'associate-pro'
) {
  const entry = GROUP_LABELS[group];
  return roster === 'associate' ? entry.associateTitle : entry.title;
}

export function getGroupDescription(group: ProGroup) {
  return GROUP_LABELS[group].description;
}

/** Parse URL `open_group` into a supported group, or null. */
export function parseOpenGroupParam(value: string | null): ProGroup | null {
  if (!value) return null;
  return (PRO_GROUPS as readonly string[]).includes(value) ? (value as ProGroup) : null;
}
