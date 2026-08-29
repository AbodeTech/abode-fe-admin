import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';

/* ============================================================
 * Flex-lead mocks — /admin/flex-leads list, counts, update, soft delete.
 *
 * No export route on purpose: the real endpoint streams CSV with
 * @SkipTransform, which the mock transport cannot represent — the FE hook
 * refuses in mock mode with a clear message rather than faking a file.
 *
 * Fixtures cover both types, all five statuses, and one soft-deleted row
 * (visible only with include_deleted, as on the server).
 * ============================================================ */

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

type MockFlexLead = {
  id: string;
  type: 'brochure' | 'site_inspection';
  full_name: string;
  email: string;
  phone: string;
  location: string | null;
  preferred_date: string | null;
  status: 'new' | 'contacted' | 'scheduled' | 'completed' | 'closed';
  admin_notes: string | null;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
};

const leads: MockFlexLead[] = [
  {
    id: '665ffl0000000000000000l1',
    type: 'site_inspection',
    full_name: 'Ngozi Adeleke',
    email: 'ngozi.adeleke@example.com',
    phone: '+2348031112233',
    location: 'Aviation City, Ibeju-Lekki',
    preferred_date: 'Saturday morning, any weekend this month',
    status: 'new',
    admin_notes: null,
    is_deleted: false,
    createdAt: daysAgo(0.4),
    updatedAt: daysAgo(0.4),
  },
  {
    id: '665ffl0000000000000000l2',
    type: 'brochure',
    full_name: 'Tunde Bakare',
    email: 'tunde.bakare@example.com',
    phone: '+2348054445566',
    location: null,
    preferred_date: null,
    status: 'new',
    admin_notes: null,
    is_deleted: false,
    createdAt: daysAgo(1.2),
    updatedAt: daysAgo(1.2),
  },
  {
    id: '665ffl0000000000000000l3',
    type: 'site_inspection',
    full_name: 'Halima Yusuf',
    email: 'halima.yusuf@example.com',
    phone: '+2348097778899',
    location: 'Harmony Gardens, Kuje',
    preferred_date: 'Weekday after 3pm',
    status: 'scheduled',
    admin_notes: 'Confirmed for Thursday 14:00 with the site team.',
    is_deleted: false,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2),
  },
  {
    id: '665ffl0000000000000000l4',
    type: 'brochure',
    full_name: 'Chidi Okereke',
    email: 'chidi.okereke@example.com',
    phone: '+2348022223344',
    location: null,
    preferred_date: null,
    status: 'contacted',
    admin_notes: 'Asked for flex pricing on 500sqm — sent the brochure follow-up.',
    is_deleted: false,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(5),
  },
  {
    id: '665ffl0000000000000000l5',
    type: 'site_inspection',
    full_name: 'Amaka Obi',
    email: 'amaka.obi@example.com',
    phone: '+2348011224455',
    location: 'Aviation City, Ibeju-Lekki',
    preferred_date: null,
    status: 'completed',
    admin_notes: 'Visited on the 12th; considering a 300sqm flex plan.',
    is_deleted: false,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(9),
  },
  {
    id: '665ffl0000000000000000l6',
    type: 'brochure',
    full_name: 'Seyi Ogunleye',
    email: 'seyi.ogunleye@example.com',
    phone: '+2348066778800',
    location: null,
    preferred_date: null,
    status: 'closed',
    admin_notes: 'Unreachable after three attempts.',
    is_deleted: false,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(15),
  },
  // Soft-deleted — surfaces only with include_deleted=true (FL-5).
  {
    id: '665ffl0000000000000000l7',
    type: 'brochure',
    full_name: 'Test Entry',
    email: 'test@example.com',
    phone: '+2340000000000',
    location: null,
    preferred_date: null,
    status: 'closed',
    admin_notes: 'Spam submission.',
    is_deleted: true,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(29),
  },
];

function visible(includeDeleted: boolean): MockFlexLead[] {
  return includeDeleted ? leads : leads.filter((lead) => !lead.is_deleted);
}

export const flexLeadRoutes: MockRoutes = {
  'GET /admin/flex-leads/counts': ({ query }) => {
    const rows = visible(String(query.include_deleted ?? '') === 'true');
    const count = (status: MockFlexLead['status']) =>
      rows.filter((lead) => lead.status === status).length;
    return {
      new: count('new'),
      contacted: count('contacted'),
      scheduled: count('scheduled'),
      completed: count('completed'),
      closed: count('closed'),
    };
  },

  'GET /admin/flex-leads': ({ query }) => {
    let rows = visible(String(query.include_deleted ?? '') === 'true');
    const status = String(query.status ?? '');
    const type = String(query.type ?? '');
    const q = String(query.q ?? '').trim().toLowerCase();

    if (status) rows = rows.filter((lead) => lead.status === status);
    if (type) rows = rows.filter((lead) => lead.type === type);
    if (q) {
      rows = rows.filter(
        (lead) =>
          lead.full_name.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.phone.includes(q)
      );
    }

    const sorted = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    // The deployed endpoint returns the standard paged envelope (data + meta).
    return paged(sorted, query, 25);
  },

  'PATCH /admin/flex-leads/:id': ({ params, body: raw }) => {
    const lead = leads.find((candidate) => candidate.id === params.id);
    if (!lead) throw new MockHttpError(404, 'Flex lead not found', 'FLEX_LEAD_NOT_FOUND');

    const dto = body<{ status?: MockFlexLead['status']; admin_notes?: string }>(raw);
    if (dto.status !== undefined) lead.status = dto.status;
    if (dto.admin_notes !== undefined) lead.admin_notes = dto.admin_notes || null;
    lead.updatedAt = new Date().toISOString();
    return lead;
  },

  'DELETE /admin/flex-leads/:id': ({ params }) => {
    const lead = leads.find((candidate) => candidate.id === params.id);
    if (!lead) throw new MockHttpError(404, 'Flex lead not found', 'FLEX_LEAD_NOT_FOUND');
    lead.is_deleted = true;
    lead.updatedAt = new Date().toISOString();
    return { id: lead.id, is_deleted: true };
  },
};
