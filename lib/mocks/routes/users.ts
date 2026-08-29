import type { MockRoutes } from '../router';
import { PEOPLE, matchesPersonSearch } from './people';
import { paged } from './util';

/* ============================================================
 * Admin users — GET /admin/users, /overview, /analytics (PR #52).
 *
 * List rows match UserRowDto (snake_case, `id` not `_id`). The picker and
 * the users table share this route.
 * ============================================================ */

function toRow(person: (typeof PEOPLE)[number], index: number) {
  const referrerPerson = index > 0 ? PEOPLE[index - 1] : null;
  return {
    id: person._id,
    first_name: person.firstName,
    last_name: person.lastName,
    email: person.email,
    phone_number: person.phoneNumber,
    tier: person.referral_status === 'default' ? 'user' : person.referral_status,
    verified: Boolean(person.tin?.state === 'approved'),
    is_suspended: false,
    created_at: '2025-01-15T10:00:00.000Z',
    networth: (index + 1) * 250000,
    subscriptions: index % 3,
    has_asset: index % 3 > 0,
    has_referral: Boolean(referrerPerson),
    how_you_heard: ['referral', 'social-media', 'billboard', 'other'][index % 4],
    referrer: referrerPerson
      ? {
          id: referrerPerson._id,
          first_name: referrerPerson.firstName,
          last_name: referrerPerson.lastName,
          email: referrerPerson.email,
        }
      : null,
  };
}

const ROWS = PEOPLE.map(toRow);

function lifetime(value: number) {
  return { value };
}

function period(value: number, delta_pct: number | null) {
  return { value, delta_pct };
}

function labelCounts(entries: Array<[string, number]>) {
  return entries.map(([label, count]) => ({ label, count }));
}

export const userRoutes: MockRoutes = {
  'GET /admin/users': ({ query }) => {
    const search = typeof query.search === 'string' ? query.search : '';
    let matched = ROWS.filter((row) => {
      const person = PEOPLE.find((p) => p._id === row.id);
      return person ? matchesPersonSearch(person, search) : true;
    });

    if (query.tier) matched = matched.filter((row) => row.tier === query.tier);
    if (query.has_asset === 'true' || query.has_asset === true) {
      matched = matched.filter((row) => row.has_asset);
    }
    if (query.has_asset === 'false' || query.has_asset === false) {
      matched = matched.filter((row) => !row.has_asset);
    }
    if (query.has_referral === 'true' || query.has_referral === true) {
      matched = matched.filter((row) => row.has_referral);
    }
    if (query.has_referral === 'false' || query.has_referral === false) {
      matched = matched.filter((row) => !row.has_referral);
    }
    if (query.how_you_hear_about_us) {
      matched = matched.filter((row) => row.how_you_heard === query.how_you_hear_about_us);
    }

    return paged(matched, query);
  },

  'GET /admin/users/overview': () => ({
    new_users: period(12, 8.5),
    new_associates: period(4, -2),
    new_associate_pros: period(2, 10),
    total_users: lifetime(128),
    total_associates: lifetime(40),
    total_associate_pros: lifetime(18),
    active_associates: lifetime(22),
    active_associate_pros: lifetime(14),
    suspended_users: lifetime(3),
    users_with_assets: lifetime(51),
    users_with_overdue_plans: lifetime(7),
    default_users: lifetime(5),
    founders: lifetime(2),
    premium_users: lifetime(6),
    overdueUsers: lifetime(7),
  }),

  'GET /admin/users/analytics': () => ({
    totals: {
      total_users: 128,
      referred: 80,
      not_referred: 48,
      referred_percentage: 62.5,
      not_referred_percentage: 37.5,
    },
    registration_trend: [
      { month: '2025-09', count: 8 },
      { month: '2025-10', count: 11 },
      { month: '2025-11', count: 9 },
      { month: '2025-12', count: 14 },
    ],
    acquisition: {
      sources: [
        { source: 'Social Media', count: 40 },
        { source: 'Referral', count: 50 },
        { source: 'Billboard', count: 20 },
        { source: 'Other', count: 18 },
      ],
    },
    demographics: {
      gender: labelCounts([
        ['Male', 70],
        ['Female', 52],
        ['Prefer not to say', 6],
      ]),
      age_buckets: labelCounts([
        ['18–25', 18],
        ['26–35', 54],
        ['36–45', 32],
        ['46–55', 16],
        ['55+', 8],
      ]),
      marital_status: labelCounts([
        ['Single', 60],
        ['Married', 58],
        ['Divorced', 10],
      ]),
      location: labelCounts([
        ['Lagos', 70],
        ['Abuja', 22],
        ['Port Harcourt', 14],
      ]),
      employment_status: labelCounts([
        ['Employed (Full-time)', 64],
        ['Self-employed', 40],
        ['Student', 12],
      ]),
      education_level: labelCounts([
        ['Bachelors', 72],
        ['Masters', 28],
        ['Secondary', 20],
      ]),
      experience_level: labelCounts([
        ['Mid', 50],
        ['Senior', 36],
        ['Entry', 24],
      ]),
      occupations: labelCounts([
        ['Engineer', 22],
        ['Trader', 18],
        ['Consultant', 14],
      ]),
    },
  }),
};
