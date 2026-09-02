import type { MockRoutes } from '../router';
import { PEOPLE, matchesPersonSearch } from './people';
import { paged } from './util';

/* ============================================================
 * Admin users — GET /admin/users, /:id (+ stats/kyc/bank/assets/transactions/
 * referrals/associate-pro/campaign-standings), /overview, /analytics.
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

  'GET /admin/users/:id': ({ params }) => {
    const index = PEOPLE.findIndex((person) => person._id === params.id);
    const person = index >= 0 ? PEOPLE[index] : PEOPLE[0];
    const referrer = index > 0 ? PEOPLE[index - 1] : null;
    const upline = index > 1 ? PEOPLE[index - 2] : null;
    return {
      id: person._id,
      first_name: person.firstName,
      last_name: person.lastName,
      user_name: person.userName,
      email: person.email,
      phone_number: person.phoneNumber,
      profile_pic: null,
      verified: person.tin?.state === 'approved',
      is_suspended: false,
      tier: person.referral_status === 'default' ? 'user' : person.referral_status,
      country: 'Nigeria',
      state: 'Lagos',
      lga: 'Eti-Osa',
      address: `${20 + Math.max(index, 0)} Admiralty Way, Lekki`,
      gender: index % 2 === 0 ? 'female' : 'male',
      education_level: 'Bachelors',
      experience_level: 'Mid',
      employment_status: 'Employed',
      occupation: 'Professional',
      date_of_birth: '1992-04-12T00:00:00.000Z',
      marital_status: index % 2 === 0 ? 'Married' : 'Single',
      acquisition_source: 'referral',
      tin_masked: person.tin ? `****${person.tin.value.slice(-4)}` : null,
      created_at: '2025-01-15T10:00:00.000Z',
      referrer_chain: [
        referrer && {
          level: 1,
          id: referrer._id,
          first_name: referrer.firstName,
          last_name: referrer.lastName,
          email: referrer.email,
          tier: referrer.referral_status,
        },
        upline && {
          level: 2,
          id: upline._id,
          first_name: upline.firstName,
          last_name: upline.lastName,
          email: upline.email,
          tier: upline.referral_status,
        },
      ].filter(Boolean),
    };
  },

  'GET /admin/users/:id/stats': ({ params }) => {
    const index = Math.max(PEOPLE.findIndex((person) => person._id === params.id), 0);
    return {
      subscriptions: 1 + (index % 3),
      networth: (index + 1) * 2_500_000,
      total_paid: (index + 1) * 800_000,
      total_payable: (index + 1) * 1_200_000,
      balance: (index + 1) * 400_000,
      total_units: 1 + (index % 2),
      next_payment: '2026-09-15T00:00:00.000Z',
      unsigned_contracts: index % 2,
      wallet: {
        balance: (index + 1) * 150_000,
        available_balance: (index + 1) * 140_000,
        currency: 'NGN',
        is_active: true,
      },
    };
  },

  'GET /admin/users/:id/kyc': ({ params }) => {
    const person = PEOPLE.find((row) => row._id === params.id) ?? PEOPLE[0];
    if (!person.tin) return null;
    return {
      id: `kyc-${person._id}`,
      id_document: { state: 'approved' },
      facial: { state: 'approved' },
      tin: {
        state: person.tin.state,
        value_masked: `****${person.tin.value.slice(-4)}`,
      },
      created_at: '2025-02-01T10:00:00.000Z',
      updated_at: '2025-02-02T10:00:00.000Z',
    };
  },

  'GET /admin/users/:id/bank-details': ({ params }) => {
    const person = PEOPLE.find((row) => row._id === params.id) ?? PEOPLE[0];
    return [
      {
        id: `bank-${person._id}`,
        bank_name: 'GTBank',
        bank_code: '058',
        account_name: `${person.firstName} ${person.lastName}`,
        account_number_masked: '****4412',
        recipient_code_masked: '****AB12CD',
        is_default: true,
        created_at: '2025-03-01T10:00:00.000Z',
      },
    ];
  },

  'GET /admin/users/:id/assets': ({ params, query }) => {
    const person = PEOPLE.find((row) => row._id === params.id) ?? PEOPLE[0];
    const rows = [
      {
        _id: `plan-flex-${person._id}`,
        status: 'active',
        asset_type: 'flex',
        unique_asset_id: `UA-F-${person._id.slice(-4)}`,
        size: 300,
        no_of_units: 1,
        amount_paid: 400_000,
        balance: 200_000,
        month_subscription: 24,
        month_remaining: 8,
        default_amount: 0,
        next_date_of_payment: '2026-09-15T00:00:00.000Z',
        asset_price: 600_000,
        months_covered: 16,
        start_date: '2025-01-15T00:00:00.000Z',
        amount_payable: 600_000,
        land_price: 0,
        document_price: 0,
        asset: { name: 'Abode Flex Lekki', asset_type: 'flex' },
        acquisition: {
          name_of_property: `${person.firstName} ${person.lastName}`,
          address: 'Lekki',
          unique_asset_id: `UA-F-${person._id.slice(-4)}`,
        },
      },
      {
        _id: `plan-fo-${person._id}`,
        status: 'active',
        asset_type: 'full-ownership',
        unique_asset_id: `UA-O-${person._id.slice(-4)}`,
        size: 500,
        no_of_units: 1,
        amount_paid: 1_000_000,
        balance: 2_000_000,
        month_subscription: 36,
        month_remaining: 24,
        default_amount: 0,
        next_date_of_payment: '2026-10-01T00:00:00.000Z',
        asset_price: 3_000_000,
        months_covered: 12,
        start_date: '2025-03-01T00:00:00.000Z',
        amount_payable: 3_000_000,
        land_price: 2_500_000,
        document_price: 500_000,
        asset: { name: 'Abode Gardens', asset_type: 'full-ownership' },
        document_plan: { amount_paid: 100_000, balance: 400_000, asset_price: 500_000 },
        acquisition: {
          name_of_property: `${person.firstName} ${person.lastName}`,
          address: 'Sangotedo',
          unique_asset_id: `UA-O-${person._id.slice(-4)}`,
        },
      },
    ];
    return paged(rows, query, 20);
  },

  'GET /admin/users/:id/transactions': ({ params, query }) => {
    const person = PEOPLE.find((row) => row._id === params.id) ?? PEOPLE[0];
    const rows = [
      {
        _id: `tx-c-${person._id}`,
        type: 'commission',
        status: 'completed',
        amount: 45_000,
        net_commission: 45_000,
        description: 'Commission for Flex sale - Ada Okafor VAT: 3375 Balance: 0',
        createdAt: '2026-08-01T10:00:00.000Z',
      },
      {
        _id: `tx-m-${person._id}`,
        type: 'marketplace_referral_commission',
        status: 'completed',
        amount: 12_000,
        createdAt: '2026-08-10T10:00:00.000Z',
        description: 'Marketplace referral',
      },
      {
        _id: `tx-p-${person._id}`,
        type: 'payment',
        status: 'completed',
        amount: 200_000,
        createdAt: '2026-08-12T10:00:00.000Z',
        description: 'Plan installment',
        paystack_reference: 'PSK_abc',
      },
    ];
    const category = String(query.category ?? 'all');
    const filtered =
      category === 'commission'
        ? rows.filter((row) =>
            ['commission', 'marketplace_referral_commission'].includes(row.type)
          )
        : category === 'other'
          ? rows.filter(
              (row) => !['commission', 'marketplace_referral_commission'].includes(row.type)
            )
          : rows;
    return paged(filtered, query, 20);
  },

  'GET /admin/users/:id/referrals': ({ params, query }) => {
    const index = PEOPLE.findIndex((person) => person._id === params.id);
    const referee = PEOPLE[(Math.max(index, 0) + 1) % PEOPLE.length];
    return paged(
      [
        {
          _id: `ref-${params.id}`,
          status: 'active',
          createdAt: '2025-06-01T10:00:00.000Z',
          commission_earned: 25_000,
          referee: {
            _id: referee._id,
            firstName: referee.firstName,
            lastName: referee.lastName,
            email: referee.email,
            phoneNumber: referee.phoneNumber,
            referral_status: referee.referral_status,
          },
        },
      ],
      query,
      20
    );
  },

  'GET /admin/users/:id/associate-pro': ({ params }) => {
    const index = PEOPLE.findIndex((person) => person._id === params.id);
    const upline = PEOPLE.slice(0, Math.max(index, 0))
      .reverse()
      .find((person) => person.referral_status === 'associate-pro');
    if (!upline) return { associate_pro: null, agency: null };
    return {
      associate_pro: {
        id: upline._id,
        first_name: upline.firstName,
        last_name: upline.lastName,
        email: upline.email,
        phone_number: upline.phoneNumber,
        level: 1,
      },
      agency: null,
    };
  },

  'GET /admin/users/:id/campaign-standings': () => [
    {
      campaign: { _id: 'camp-1', name: 'Q3 Sales Push', status: 'active' },
      buyer: { rewards: 2, total_sqm: 600 },
      referrer: { rewards: 5, total_sqm: 1500 },
      rank: 4,
      total_paid: 800_000,
      total_payable: 1_200_000,
    },
  ],

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
