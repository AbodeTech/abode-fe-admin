import { MockHttpError, type MockRoutes } from '../router';
import { PEOPLE, findPerson } from './people';
import { paged } from './util';

/* ============================================================
 * Agencies — /admin/agencies/* and PATCH /admin/users/:user_id/org.
 *
 * Agencies and memberships are held in mutable maps, so creating, suspending,
 * moving a member and deleting all change what the lists return — and
 * `member_count` moves with them, which is what gates the delete.
 *
 * Membership is modelled the way the BE does it: a user's `org` field points
 * at an agency, so the roster is derived rather than stored on the agency.
 *
 * Not mocked: GET /admin/agencies/:id/commissions/export. The real route
 * streams CSV with @SkipTransform; matching flex-leads and
 * purchase-confirmations, the export hook refuses in mock mode instead.
 * ============================================================ */

type MockAgency = {
  id: string;
  name: string;
  code: string;
  commission_percentage: number;
  owner_user_id: string;
  status: 'active' | 'suspended';
  is_suspended: boolean;
  suspension_reason: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
};

const agencies = new Map<string, MockAgency>();

/** user id → agency id. The BE's `User.org`, inverted for lookup. */
const membership = new Map<string, string>();

type MockOwner = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  phoneNumber: string;
  referral_status?: string | null;
};

/**
 * Owners invented by `owner_mode: 'new'`. The BE really does create the user,
 * so they have to be resolvable afterwards — otherwise the new agency's roster
 * would render empty while `member_count` still counted them, and the delete
 * guard could never be satisfied.
 */
const createdOwners = new Map<string, MockOwner>();

const resolvePerson = (id: string | null | undefined): MockOwner | undefined => {
  if (!id) return undefined;
  const seeded = findPerson(id);
  if (seeded) return seeded as MockOwner;
  return createdOwners.get(id);
};

const iso = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86_400_000).toISOString();

for (const seed of [
  {
    id: '665faaaa00000000000000a1',
    name: 'Horizon Realty Partners',
    code: 'AG-HRZN0001',
    commission_percentage: 10,
    owner_user_id: PEOPLE[0]._id,
    createdDaysAgo: 240,
  },
  {
    id: '665faaaa00000000000000a2',
    name: 'Lagos Land Collective',
    code: 'AG-LGLC0002',
    commission_percentage: 12.5,
    owner_user_id: PEOPLE[1]._id,
    createdDaysAgo: 160,
  },
  {
    id: '665faaaa00000000000000a3',
    name: 'Pearl Estate Agency',
    code: 'AG-PRLE0003',
    commission_percentage: 8,
    owner_user_id: PEOPLE[2]._id,
    createdDaysAgo: 75,
  },
] as const) {
  agencies.set(seed.id, {
    id: seed.id,
    name: seed.name,
    code: seed.code,
    commission_percentage: seed.commission_percentage,
    owner_user_id: seed.owner_user_id,
    status: 'active',
    is_suspended: false,
    suspension_reason: null,
    contact_email: `ops@${seed.code.toLowerCase()}.example.com`,
    contact_phone: '+2348030000000',
    created_at: iso(seed.createdDaysAgo),
    updated_at: iso(seed.createdDaysAgo - 5),
  });
  membership.set(seed.owner_user_id, seed.id);
}

// One suspended agency, so the reactivate path and the status filter both have
// something to act on.
const suspended = agencies.get('665faaaa00000000000000a3')!;
suspended.status = 'suspended';
suspended.is_suspended = true;
suspended.suspension_reason =
  'Repeated misrepresentation of plot availability to prospective buyers.';

// A few extra members spread across the two active agencies.
membership.set(PEOPLE[3]._id, '665faaaa00000000000000a1');
membership.set(PEOPLE[4]._id, '665faaaa00000000000000a1');
membership.set(PEOPLE[5]._id, '665faaaa00000000000000a2');

function requireAgency(id: string): MockAgency {
  const agency = agencies.get(id);
  if (!agency) throw new MockHttpError(404, 'Agency not found', 'AGENCY_NOT_FOUND');
  return agency;
}

const memberIds = (agencyId: string) =>
  [...membership.entries()]
    .filter(([userId, id]) => id === agencyId && resolvePerson(userId))
    .map(([userId]) => userId);

const memberCount = (agencyId: string) => memberIds(agencyId).length;

/** Deterministic per-agency commission total, so the tile isn't always zero. */
const commissionTotal = (agencyId: string) =>
  commissionRows(agencyId).reduce((sum, row) => sum + (row.net_commission ?? 0), 0);

function commissionRows(agencyId: string) {
  const agency = agencies.get(agencyId);
  if (!agency) return [];

  // Six rows per agency, derived from the code so they're stable across reloads.
  const seed = agency.code.charCodeAt(3) % 5;
  return Array.from({ length: 6 }, (_, i) => {
    const gross = 250_000 + (seed + i) * 45_000;
    const wht = Math.round(gross * 0.05);
    const buyer = PEOPLE[(seed + i) % PEOPLE.length];
    const paidTo = resolvePerson(agency.owner_user_id);
    return {
      id: `${agency.id}-comm-${i + 1}`,
      date: iso(i * 21 + 3),
      buyer_name: `${buyer.firstName} ${buyer.lastName}`,
      asset_name: ['Ibeju Grove', 'Lekki Rise', 'Ajah Meadows'][(seed + i) % 3],
      paid_to_name: paidTo ? `${paidTo.firstName} ${paidTo.lastName}` : null,
      paid_to_user_id: agency.owner_user_id,
      rate: agency.commission_percentage,
      wht_rate: 5,
      gross_commission: gross,
      wht_deducted: wht,
      net_commission: gross - wht,
      payment_plan_id: `${agency.id}-plan-${i + 1}`,
    };
  });
}

const withinRange = (dateIso: string, start?: unknown, end?: unknown) => {
  const at = new Date(dateIso).getTime();
  if (start && at < new Date(String(start)).getTime()) return false;
  // An end date with no time component means "through the end of that day".
  if (end && at > new Date(`${String(end)}T23:59:59.999Z`).getTime()) return false;
  return true;
};

export const agencyRoutes: MockRoutes = {
  'GET /admin/agencies': ({ query }) => {
    let rows = [...agencies.values()];

    const q = String(query.q ?? '').toLowerCase();
    if (q) {
      rows = rows.filter(
        (a) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q)
      );
    }
    if (query.status) {
      rows = rows.filter((a) => a.status === query.status);
    }

    const sort = String(query.sort ?? 'created_at');
    const direction = query.order === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name) * direction;
      if (sort === 'commission_percentage') {
        return (a.commission_percentage - b.commission_percentage) * direction;
      }
      return (
        (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction
      );
    });

    const page = paged(rows, query);
    return {
      ...page,
      data: page.data.map((agency) => ({
        ...agency,
        member_count: memberCount(agency.id),
      })),
    };
  },

  'GET /admin/agencies/:agency_id': ({ params }) => {
    const agency = requireAgency(params.agency_id);
    const owner = resolvePerson(agency.owner_user_id);

    return {
      ...agency,
      owner: owner
        ? {
            id: owner._id,
            first_name: owner.firstName,
            last_name: owner.lastName,
            email: owner.email,
            user_name: owner.userName,
            phone_number: owner.phoneNumber,
          }
        : null,
      member_count: memberCount(agency.id),
      total_commission_to_date: commissionTotal(agency.id),
    };
  },

  'POST /admin/agencies': ({ body }) => {
    const dto = (body ?? {}) as {
      name?: string;
      commission_percentage?: number;
      owner_mode?: 'existing' | 'new';
      owner_user_id?: string;
      new_owner?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        userName?: string;
        phoneNumber?: string;
      };
      contact_email?: string;
      contact_phone?: string;
    };

    const name = String(dto.name ?? '').trim();
    if (!name) throw new MockHttpError(400, 'name should not be empty');

    let ownerId: string;
    if (dto.owner_mode === 'existing') {
      const owner = resolvePerson(dto.owner_user_id);
      if (!owner) {
        throw new MockHttpError(404, 'Owner user not found', 'OWNER_USER_NOT_FOUND');
      }
      if (membership.get(owner._id) && isOwnerOfSome(owner._id)) {
        throw new MockHttpError(
          400,
          'That user already owns another agency',
          'USER_ALREADY_AGENCY_OWNER'
        );
      }
      ownerId = owner._id;
    } else {
      // The BE creates the user and emails them a temporary password. Nothing
      // about the account comes back in the response, but it has to exist
      // afterwards — the roster and the delete guard both read it.
      const spec = dto.new_owner ?? {};
      ownerId = `665fcccc${Date.now().toString(16).slice(-16)}`;
      createdOwners.set(ownerId, {
        _id: ownerId,
        firstName: String(spec.firstName ?? 'New'),
        lastName: String(spec.lastName ?? 'Owner'),
        email: String(spec.email ?? `owner-${ownerId.slice(-6)}@example.com`),
        userName: String((spec as { userName?: string }).userName ?? `owner${ownerId.slice(-4)}`),
        phoneNumber: String((spec as { phoneNumber?: string }).phoneNumber ?? '+2348030000000'),
        referral_status: null,
      });
    }

    const id = `665faaaa${Date.now().toString(16).slice(-16)}`;
    const now = new Date().toISOString();
    const agency: MockAgency = {
      id,
      name,
      code: `AG-${id.slice(-8).toUpperCase()}`,
      commission_percentage: Number(dto.commission_percentage ?? 0),
      owner_user_id: ownerId,
      status: 'active',
      is_suspended: false,
      suspension_reason: null,
      contact_email: dto.contact_email ?? null,
      contact_phone: dto.contact_phone ?? null,
      created_at: now,
      updated_at: now,
    };

    agencies.set(id, agency);
    membership.set(ownerId, id);
    return agency;
  },

  'PATCH /admin/agencies/:agency_id': ({ params, body }) => {
    const agency = requireAgency(params.agency_id);
    const dto = (body ?? {}) as Partial<
      Pick<MockAgency, 'name' | 'commission_percentage' | 'contact_email' | 'contact_phone'>
    >;

    if (dto.name !== undefined) agency.name = String(dto.name).trim();
    if (dto.commission_percentage !== undefined) {
      agency.commission_percentage = Number(dto.commission_percentage);
    }
    // null clears; undefined leaves alone. That distinction is the point.
    if (dto.contact_email !== undefined) agency.contact_email = dto.contact_email;
    if (dto.contact_phone !== undefined) agency.contact_phone = dto.contact_phone;
    agency.updated_at = new Date().toISOString();

    return agency;
  },

  'POST /admin/agencies/:agency_id/suspend': ({ params, body }) => {
    const agency = requireAgency(params.agency_id);
    const reason = String((body as { suspension_reason?: string })?.suspension_reason ?? '').trim();
    if (reason.length < 20) {
      throw new MockHttpError(
        400,
        'Suspension reason must be at least 20 characters',
        'SUSPENSION_REASON_TOO_SHORT'
      );
    }

    agency.status = 'suspended';
    agency.is_suspended = true;
    agency.suspension_reason = reason;
    agency.updated_at = new Date().toISOString();
    return agency;
  },

  'POST /admin/agencies/:agency_id/reactivate': ({ params }) => {
    const agency = requireAgency(params.agency_id);
    if (!agency.is_suspended) {
      throw new MockHttpError(400, 'That agency is not suspended', 'AGENCY_NOT_SUSPENDED');
    }

    agency.status = 'active';
    agency.is_suspended = false;
    agency.suspension_reason = null;
    agency.updated_at = new Date().toISOString();
    return agency;
  },

  'DELETE /admin/agencies/:agency_id': ({ params }) => {
    const agency = requireAgency(params.agency_id);
    const count = memberCount(agency.id);
    if (count > 0) {
      throw new MockHttpError(
        400,
        'Move every member out of the agency before deleting it',
        'AGENCY_MEMBER_COUNT_NOT_ZERO'
      );
    }

    agencies.delete(agency.id);
    return { message: 'Agency deleted successfully' };
  },

  'POST /admin/agencies/:agency_id/change-owner': ({ params, body }) => {
    const agency = requireAgency(params.agency_id);
    const dto = (body ?? {}) as {
      new_owner_user_id?: string;
      retain_old_owner_as_member?: boolean;
    };

    const nextOwner = resolvePerson(dto.new_owner_user_id);
    if (!nextOwner) {
      throw new MockHttpError(404, 'Owner user not found', 'OWNER_USER_NOT_FOUND');
    }
    if (isOwnerOfSome(nextOwner._id) && membership.get(nextOwner._id) !== agency.id) {
      throw new MockHttpError(
        400,
        'That user already owns another agency',
        'USER_ALREADY_AGENCY_OWNER'
      );
    }

    const previousOwnerId = agency.owner_user_id;
    agency.owner_user_id = nextOwner._id;
    agency.updated_at = new Date().toISOString();
    membership.set(nextOwner._id, agency.id);

    if (dto.retain_old_owner_as_member === false && previousOwnerId !== nextOwner._id) {
      membership.delete(previousOwnerId);
    }

    const owner = resolvePerson(agency.owner_user_id);
    return {
      ...agency,
      owner: owner
        ? {
            id: owner._id,
            first_name: owner.firstName,
            last_name: owner.lastName,
            email: owner.email,
            user_name: owner.userName,
            phone_number: owner.phoneNumber,
          }
        : null,
      member_count: memberCount(agency.id),
      total_commission_to_date: commissionTotal(agency.id),
    };
  },

  'GET /admin/agencies/:agency_id/members': ({ params, query }) => {
    const agency = requireAgency(params.agency_id);
    const includeOwner = query.include_owner !== 'false' && query.include_owner !== false;

    let rows = memberIds(agency.id)
      .map((userId) => resolvePerson(userId))
      .filter((person): person is NonNullable<typeof person> => Boolean(person))
      .filter((person) => includeOwner || person._id !== agency.owner_user_id);

    const q = String(query.q ?? '').toLowerCase();
    if (q) {
      rows = rows.filter((person) =>
        [person.firstName, person.lastName, person.email, person.userName, person.phoneNumber]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q))
      );
    }

    const page = paged(rows, query);
    return {
      ...page,
      data: page.data.map((person, index) => ({
        id: person._id,
        first_name: person.firstName,
        last_name: person.lastName,
        email: person.email,
        user_name: person.userName,
        phone_number: person.phoneNumber,
        referral_status: person.referral_status ?? null,
        is_owner: person._id === agency.owner_user_id,
        joined_at: iso(30 + index * 12),
      })),
    };
  },

  'GET /admin/agencies/:agency_id/commissions': ({ params, query }) => {
    const agency = requireAgency(params.agency_id);
    const rows = commissionRows(agency.id).filter((row) =>
      withinRange(row.date, query.start_date, query.end_date)
    );
    return paged(rows, query);
  },

  'PATCH /admin/users/:user_id/org': ({ params, body }) => {
    const user = resolvePerson(params.user_id);
    if (!user) throw new MockHttpError(404, 'Owner user not found', 'OWNER_USER_NOT_FOUND');

    const agencyId = (body as { agency_id?: string | null })?.agency_id ?? null;

    if (agencyId === null) {
      membership.delete(user._id);
      return { message: 'Membership updated', user_id: user._id, agency_id: null };
    }

    const agency = requireAgency(agencyId);
    if (agency.is_suspended) {
      throw new MockHttpError(
        400,
        'Cannot move a user into a suspended agency',
        'INVALID_ORG_MUTATION'
      );
    }

    membership.set(user._id, agency.id);
    return { message: 'Membership updated', user_id: user._id, agency_id: agency.id };
  },
};

/** Does this user own any agency? Owning one blocks owning another. */
function isOwnerOfSome(userId: string): boolean {
  return [...agencies.values()].some((agency) => agency.owner_user_id === userId);
}
