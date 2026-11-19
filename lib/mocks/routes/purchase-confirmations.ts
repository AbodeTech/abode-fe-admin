import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';
import { findPerson } from './people';

/* ============================================================
 * Purchase confirmations mocks — /admin/purchase-confirmations/* (list,
 * counts, resolve-dispute, resend). No export route on purpose: the real
 * endpoint streams CSV with @SkipTransform, which the mock transport
 * cannot represent — the FE hook refuses in mock mode with a clear
 * message rather than faking a file (matches flex-leads).
 *
 * Fixtures cover both products, all three statuses, an anonymous buyer
 * (findPerson miss), and a multi-dispute row to exercise the "most recent
 * open dispute" fallback in the FE's row mapper.
 * ============================================================ */

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

type MockDispute = {
  note: string;
  disputed_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
  /** Proposed in the response (item 11): who resolved it. */
  resolved_by?: { id: string; name: string } | null;
};

/** The admin the mock records as resolving disputes. */
const MOCK_RESOLVER = { id: '665fad0e00000000000000d1', name: 'Ngozi Eze' };

/**
 * The BE's derived status (item 11, as of staging 6410b76): an open dispute
 * beats everything; after a resolution the row stays `resolved` until the buyer
 * confirms AFTER the latest resolution, then it is `confirmed` again.
 */
export const statusOf = (
  c: Pick<MockConfirmation, 'disputes' | 'confirmed_at'>
): 'waiting' | 'disputed' | 'resolved' | 'confirmed' => {
  if (c.disputes.some((d) => !d.resolved_at)) return 'disputed';
  const resolvedTimes = c.disputes.flatMap((d) => (d.resolved_at ? [new Date(d.resolved_at).getTime()] : []));
  if (resolvedTimes.length > 0) {
    const latest = Math.max(...resolvedTimes);
    return c.confirmed_at && new Date(c.confirmed_at).getTime() > latest ? 'confirmed' : 'resolved';
  }
  return c.confirmed_at ? 'confirmed' : 'waiting';
};

type MockConfirmation = {
  _id: string;
  plan_id: string;
  unique_asset_id: string;
  status: 'waiting' | 'disputed' | 'confirmed';
  buyer: string;
  referrer: string | null;
  asset: string | null;
  snapshot: {
    name_on_document: string;
    size: number;
    units: number;
    plan_label: string;
    land_amount: number;
    development_levy: number;
    total: number;
    product: 'flex' | 'full-ownership';
  };
  email_sent_at: string | null;
  confirmed_at: string | null;
  reminders_sent: string[];
  escalated_at: string | null;
  disputes: MockDispute[];
  createdAt: string;
};

const confirmations: MockConfirmation[] = [
  {
    _id: '665fpc0000000000000000h1',
    plan_id: '665fplan000000000000pc01',
    unique_asset_id: 'AVC-FL-014',
    status: 'waiting',
    buyer: '665fcccc00000000000000c1',
    referrer: null,
    asset: 'Aviation City',
    snapshot: {
      name_on_document: 'John Okafor',
      size: 300,
      units: 1,
      plan_label: '12-month flex',
      land_amount: 4_000_000,
      development_levy: 200_000,
      total: 4_200_000,
      product: 'flex',
    },
    email_sent_at: daysAgo(1),
    confirmed_at: null,
    reminders_sent: [],
    escalated_at: null,
    disputes: [],
    createdAt: daysAgo(1),
  },
  {
    _id: '665fpc0000000000000000h2',
    plan_id: '665fplan000000000000pc02',
    unique_asset_id: 'HG-FO-007',
    status: 'disputed',
    buyer: '665fcccc00000000000000c2',
    referrer: 'Chuka Obi',
    asset: 'Harmony Gardens',
    snapshot: {
      name_on_document: 'Okafor Chinelo',
      size: 500,
      units: 1,
      plan_label: 'Outright',
      land_amount: 11_500_000,
      development_levy: 500_000,
      total: 12_000_000,
      product: 'full-ownership',
    },
    email_sent_at: daysAgo(6),
    confirmed_at: null,
    reminders_sent: [daysAgo(4), daysAgo(2)],
    escalated_at: daysAgo(1),
    disputes: [
      {
        note: 'Name on the document is misspelled — should be "Chinelo" not "Chinello".',
        disputed_at: daysAgo(3),
        resolved_at: null,
        resolution_note: null,
      },
    ],
    createdAt: daysAgo(6),
  },
  {
    _id: '665fpc0000000000000000h3',
    plan_id: '665fplan000000000000pc03',
    unique_asset_id: 'AVC-FL-021',
    status: 'confirmed',
    buyer: '665fcccc00000000000000c3',
    referrer: null,
    asset: 'Aviation City',
    snapshot: {
      name_on_document: 'Amaka Obi',
      size: 300,
      units: 1,
      plan_label: '6-month flex',
      land_amount: 2_850_000,
      development_levy: 150_000,
      total: 3_000_000,
      product: 'flex',
    },
    email_sent_at: daysAgo(15),
    confirmed_at: daysAgo(12),
    reminders_sent: [daysAgo(13)],
    escalated_at: null,
    // Resolved dispute in the history — exercises the resolvedAt fallback path.
    disputes: [
      {
        note: 'Wrong unit size shown.',
        disputed_at: daysAgo(14),
        resolved_at: daysAgo(13),
        resolution_note: 'Corrected the size on the asset record.',
        resolved_by: MOCK_RESOLVER,
      },
    ],
    createdAt: daysAgo(15),
  },
  {
    _id: '665fpc0000000000000000h4',
    plan_id: '665fplan000000000000pc04',
    unique_asset_id: 'HG-FO-012',
    status: 'waiting',
    // No matching PEOPLE fixture — exercises the "unknown buyer" fallback.
    buyer: '665fzzzz000000000000nope1',
    referrer: null,
    asset: 'Harmony Gardens',
    snapshot: {
      name_on_document: 'Unlisted Buyer',
      size: 350,
      units: 1,
      plan_label: 'Outright',
      land_amount: 8_700_000,
      development_levy: 500_000,
      total: 9_200_000,
      product: 'full-ownership',
    },
    email_sent_at: null,
    confirmed_at: null,
    reminders_sent: [],
    escalated_at: null,
    disputes: [],
    createdAt: daysAgo(0.3),
  },
  {
    // Disputed, then resolved two days ago; the buyer has not confirmed since.
    _id: '665fpc0000000000000000h5',
    plan_id: '665fplan000000000000pc05',
    unique_asset_id: 'AVC-FL-022',
    status: 'waiting',
    buyer: '665fcccc00000000000000c3',
    referrer: null,
    asset: 'Aviation City',
    snapshot: {
      name_on_document: 'Amaka Obi',
      size: 300,
      units: 1,
      plan_label: '6-month flex',
      land_amount: 2_850_000,
      development_levy: 150_000,
      total: 3_000_000,
      product: 'flex',
    },
    email_sent_at: daysAgo(9),
    confirmed_at: null,
    reminders_sent: [],
    escalated_at: null,
    disputes: [
      {
        note: 'Name is spelled wrong on the document.',
        disputed_at: daysAgo(5),
        resolved_at: daysAgo(2),
        resolution_note: 'Corrected the name on the document.',
        resolved_by: MOCK_RESOLVER,
      },
    ],
    createdAt: daysAgo(10),
  },
];

function toRow(c: MockConfirmation) {
  const person = findPerson(c.buyer);
  const openDispute = [...c.disputes].reverse().find((d) => !d.resolved_at) ?? null;
  return {
    id: c._id,
    plan_id: c.plan_id,
    unique_asset_id: c.unique_asset_id,
    status: statusOf(c),
    buyer: person
      ? {
          id: person._id,
          first_name: person.firstName,
          last_name: person.lastName,
          email: person.email,
          phone_number: person.phoneNumber ?? null,
        }
      : null,
    referrer: c.referrer,
    asset: c.asset,
    snapshot: c.snapshot,
    email_sent_at: c.email_sent_at,
    confirmed_at: c.confirmed_at,
    reminders_sent: c.reminders_sent,
    escalated_at: c.escalated_at,
    open_dispute_note: openDispute?.note ?? null,
    disputes: c.disputes.map((d) => ({ ...d, resolved_by: d.resolved_by ?? null, snapshot_at_dispute: null })),
    createdAt: c.createdAt,
  };
}

function findConfirmation(planId: string): MockConfirmation {
  const found = confirmations.find((c) => c.plan_id === planId);
  if (!found) throw new MockHttpError(404, 'Purchase confirmation not found', 'NOT_FOUND');
  return found;
}

export const purchaseConfirmationRoutes: MockRoutes = {
  'GET /admin/purchase-confirmations': ({ query }) => {
    let rows = confirmations;
    const status = String(query.status ?? '');
    const product = String(query.product ?? '');
    const q = String(query.q ?? '').trim().toLowerCase();

    if (status) rows = rows.filter((c) => statusOf(c) === status);
    if (product) rows = rows.filter((c) => c.snapshot.product === product);
    if (q) {
      rows = rows.filter((c) => {
        const person = findPerson(c.buyer);
        const name = person ? `${person.firstName} ${person.lastName}`.toLowerCase() : '';
        return (
          name.includes(q) ||
          (person?.email.toLowerCase().includes(q) ?? false) ||
          c.unique_asset_id.toLowerCase().includes(q)
        );
      });
    }

    const sorted = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return paged(sorted.map(toRow), query, 20);
  },

  'GET /admin/purchase-confirmations/counts': () => ({
    waiting: confirmations.filter((c) => statusOf(c) === 'waiting').length,
    disputed: confirmations.filter((c) => statusOf(c) === 'disputed').length,
    confirmed: confirmations.filter((c) => statusOf(c) === 'confirmed').length,
    resolved: confirmations.filter((c) => statusOf(c) === 'resolved').length,
  }),

  'POST /admin/purchase-confirmations/:plan_id/resolve-dispute': ({ params, body: raw }) => {
    const confirmation = findConfirmation(params.plan_id);
    const dto = body<{ note: string; request_reconfirm?: boolean }>(raw);
    if (!dto.note?.trim() || dto.note.trim().length < 3) {
      throw new MockHttpError(400, 'note must be at least 3 characters', 'VALIDATION_FAILED');
    }

    const now = new Date().toISOString();
    let resolvedAny = false;
    for (const dispute of confirmation.disputes) {
      if (!dispute.resolved_at) {
        dispute.resolved_at = now;
        dispute.resolution_note = dto.note.trim();
        dispute.resolved_by = MOCK_RESOLVER;
        resolvedAny = true;
      }
    }
    if (!resolvedAny) {
      throw new MockHttpError(400, 'No open dispute on this plan', 'NO_OPEN_DISPUTE');
    }
    confirmation.escalated_at = null;

    const resent = !!dto.request_reconfirm;
    if (resent) {
      confirmation.email_sent_at = now;
      confirmation.reminders_sent = [];
    }

    return { plan_id: confirmation.plan_id, status: statusOf(confirmation), resent };
  },

  'POST /admin/purchase-confirmations/:plan_id/resend': ({ params }) => {
    const confirmation = findConfirmation(params.plan_id);
    confirmation.email_sent_at = new Date().toISOString();
    return {
      plan_id: confirmation.plan_id,
      resent: true,
      message: 'Confirmation email re-sent',
    };
  },
};
