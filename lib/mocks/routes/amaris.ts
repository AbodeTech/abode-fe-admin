import { MockHttpError, type MockRoutes } from '../router';
import { findPerson } from './people';

/* ============================================================
 * Amaris mocks — GET /admin/amaris/queries and /queries/counts.
 *
 * Rows are the repository's flattened `AmarisQueryRow` shape: every key
 * always present, `answered` already derived from the no_answer sentinel.
 * Fixtures cover both audiences, both channels, answered and gap rows, and
 * one anonymous WhatsApp asker (phone only, no account) — the states the
 * log exists to render.
 * ============================================================ */

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

type MockAmarisRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  channel: 'web' | 'whatsapp';
  audience: 'customer' | 'associate';
  question: string;
  answer: string | null;
  answered: boolean;
  createdAt: string;
};

const fromPerson = (id: string) => {
  const person = findPerson(id);
  return person
    ? {
        email: person.email,
        firstName: person.firstName,
        lastName: person.lastName,
        phone: person.phoneNumber ?? null,
      }
    : { email: '', firstName: null, lastName: null, phone: null };
};

const rows: MockAmarisRow[] = [
  {
    id: '665fam0000000000000000q1',
    ...fromPerson('665fcccc00000000000000c1'),
    channel: 'web',
    audience: 'customer',
    question: 'How do I change the name on my deed of assignment after marriage?',
    answer:
      'You can submit a Document Change request from your dashboard under Requests. It carries a ₦20,000 processing fee and needs your marriage certificate attached.',
    answered: true,
    createdAt: daysAgo(0.2),
  },
  {
    id: '665fam0000000000000000q2',
    ...fromPerson('665fcccc00000000000000c2'),
    channel: 'whatsapp',
    audience: 'associate',
    question: 'When is commission paid on a transfer purchase I referred?',
    answer:
      'Commission is paid when an admin approves the transfer payment — approval creates the payment plan and pays commission in the same step.',
    answered: true,
    createdAt: daysAgo(1),
  },
  {
    id: '665fam0000000000000000q3',
    ...fromPerson('665fcccc00000000000000c9'),
    channel: 'web',
    audience: 'customer',
    question: 'Can I pay my Harmony Gardens installment in US dollars from abroad?',
    answer: null,
    answered: false,
    createdAt: daysAgo(2.5),
  },
  {
    // Anonymous WhatsApp asker — no account, phone only.
    id: '665fam0000000000000000q4',
    email: '',
    firstName: null,
    lastName: null,
    phone: '+2348099887766',
    channel: 'whatsapp',
    audience: 'customer',
    question: 'Do you have commercial plots in Abuja and what do they cost?',
    answer: null,
    answered: false,
    createdAt: daysAgo(4),
  },
  {
    id: '665fam0000000000000000q5',
    ...fromPerson('665fcccc00000000000000c3'),
    channel: 'web',
    audience: 'associate',
    question: 'What documents does a client need for KYC before withdrawing commission?',
    answer:
      'A government-issued ID, a TIN, and bank details matching the registered name. KYC is reviewed within two working days.',
    answered: true,
    createdAt: daysAgo(6),
  },
];

/** `YYYY-MM-DD` as the start of that day in Lagos (WAT, UTC+1), the way the BE reads it. */
const lagosDayStart = (date: string) => new Date(`${date}T00:00:00.000+01:00`).getTime();

/** The filters the list and the counts share — the BE applies one query to both. */
function filterRows(query: Record<string, unknown>): MockAmarisRow[] {
  let filtered = rows;
  const audience = String(query.audience ?? '');
  const channel = String(query.channel ?? '');
  const answered = String(query.answered ?? '');
  const q = String(query.q ?? '').trim();
  const startDate = String(query.start_date ?? '');
  const endDate = String(query.end_date ?? '');

  if (startDate && endDate && startDate > endDate) {
    throw new MockHttpError(400, 'The start date must be on or before the end date.', 'INVALID_QUERY_DATE_RANGE');
  }

  if (audience) filtered = filtered.filter((row) => row.audience === audience);
  if (channel) filtered = filtered.filter((row) => row.channel === channel);
  if (answered) filtered = filtered.filter((row) => row.answered === (answered === 'true'));
  if (q) {
    const needle = q.toLowerCase();
    filtered = filtered.filter((row) => {
      if (row.question.toLowerCase().includes(needle)) return true;
      if (row.answer?.toLowerCase().includes(needle)) return true;
      if (row.email.toLowerCase().includes(needle)) return true;
      if (row.phone?.includes(q)) return true;
      // Names are already flattened onto the row — the BE searches only
      // question/answer/email/phone, but matching the visible name too
      // costs nothing and surprises nobody in mock mode.
      return `${row.lastName ?? ''} ${row.firstName ?? ''}`.toLowerCase().includes(needle);
    });
  }
  if (startDate) filtered = filtered.filter((row) => new Date(row.createdAt).getTime() >= lagosDayStart(startDate));
  // The end date is inclusive: anything before the start of the next Lagos day.
  if (endDate) {
    filtered = filtered.filter((row) => new Date(row.createdAt).getTime() < lagosDayStart(endDate) + 86_400_000);
  }
  return filtered;
}

export const amarisRoutes: MockRoutes = {
  /** Declared before `:anything` patterns would matter — literal path, safe. */
  'GET /admin/amaris/queries/counts': ({ query }) => {
    // Every card applies every filter, as the BE does.
    const filtered = filterRows(query);
    return {
      customer: filtered.filter((row) => row.audience === 'customer').length,
      associate: filtered.filter((row) => row.audience === 'associate').length,
      answered: filtered.filter((row) => row.answered).length,
      noAnswer: filtered.filter((row) => !row.answered).length,
      web: filtered.filter((row) => row.channel === 'web').length,
      whatsapp: filtered.filter((row) => row.channel === 'whatsapp').length,
      total: filtered.length,
    };
  },

  'GET /admin/amaris/queries': ({ query }) => {
    const filtered = filterRows(query);

    // ⛔ ticket 26 — the deployed endpoint returns a BARE ARRAY: the
    // envelope interceptor eats the service's `count`. The mock mirrors the
    // broken truth; a mock that returned the count would hide the bug.
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25) || 25));
    const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted.slice((page - 1) * limit, page * limit);
  },
};
