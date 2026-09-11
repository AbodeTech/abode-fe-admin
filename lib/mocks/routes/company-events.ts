import { MockHttpError, type MockRoutes } from '../router';
import { MOCK_USERS, formatMockDate } from '../shared';
import { MOCK_ASSET_DIRECTORY } from './assets';
import { body, paged } from './util';

/* ============================================================
 * Company Events — /admin/company-events/*.
 *
 * The backend module landed 2026-09-11 (abode-be-v2 staging, PR #67
 * "allocation-event"); PR #69 ("company-events-offline") then added
 * `GET /:id/allocations`, `GET /:id/analytics`, and `GET /:id/registrations`
 * — every route below, including those three, now mirrors
 * `company-events-admin.controller.ts` / `.service.ts` / `.repository.ts`
 * read directly from that branch, not a forward guess. Nothing here is
 * mock-only or gated on `isMockApiEnabled()` anymore.
 *
 * QR check-in/offline sync (plan §3.5–§3.6, `checkin/event-checkin.controller.ts`)
 * has real backend routes too but no FE work consumes them yet — out of
 * scope for this pass, no routes claimed here for them. The public
 * registration endpoint (`event-registration.controller.ts`) is likewise
 * unclaimed — only its data is modeled here (as `registrations`), seeded
 * directly rather than gone through its own mock route.
 * ============================================================ */

const MOCK_ADMIN_ID = 'mock-admin-001';
const LAGOS_OFFSET = '+01:00';

type MockPickupLocation = { id: string; name: string; seat_limit: number | null };

type MockCompanyEvent = {
  id: string;
  title: string;
  type: 'site_inspection' | 'allocation';
  asset_id: string;
  /** Internal only — not part of the real response, stripped by `publicEvent()`. */
  asset_name: string;
  date: string;
  time: string;
  starts_at: string;
  pickup_locations: MockPickupLocation[];
  available_size: number | null;
  reserved_size: number;
  size_unit: string | null;
  status: 'draft' | 'published' | 'closed';
  created_by: string | null;
  createdAt: string;
  updatedAt: string;
};

type MockEligibleClient = {
  payment_plan_id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  asset_id: string;
  /** Per-unit size — real commit size is `size * no_of_units`. */
  size: number;
  no_of_units: number;
  eligibility_tier: 'land' | 'land_and_dev_levy';
  land_completed_at: string;
  plan_status: string;
};

type EventAllocationStatus = 'allocated' | 'email_sent' | 'registered' | 'checked_in' | 'confirmed' | 'cancelled';
type InviteEmailStatus = 'not_sent' | 'queued' | 'sent' | 'failed';
type RegistrantCategory = 'associate_pro' | 'associate' | 'client';
const REGISTRANT_CATEGORIES: RegistrantCategory[] = ['associate_pro', 'associate', 'client'];

type MockEventAllocation = {
  allocation_id: string;
  event_id: string;
  payment_plan_id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  size_reserved: number;
  eligibility_tier: 'land' | 'land_and_dev_levy';
  status: EventAllocationStatus;
  email_status: InviteEmailStatus;
  invite_sent_at: string | null;
  registered_at: string | null;
  checked_in_at: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  actor: string;
  created_at: string;
};

/**
 * One public form submission — mirrors `EventRegistration` field-for-field.
 * `event_allocation_id` is `null` for a site-inspection registrant (no
 * `EventAllocation` exists for that event type at all) — see
 * docs/SITE-INSPECTION-REGISTRATION-BACKEND-REQUEST.md, which proposes
 * relaxing the real schema's `required: true` the same way. Modeled ahead
 * of that shipping, same as the rest of this file's forward-simulated bits.
 */
type MockEventRegistration = {
  registration_id: string;
  event_allocation_id: string | null;
  event_id: string;
  full_name: string;
  phone: string;
  email: string;
  category: RegistrantCategory;
  preferred_pickup_location_id: string;
  submitted_at: string;
};

/** ~30 rows per asset — enough to demo pagination, capacity fill, and FCFS ordering. */
const ROWS_PER_ASSET = 30;

/** Built once and mutated in place, so a mutation is visible on the next fetch. */
function buildEligiblePool(): MockEligibleClient[] {
  const rows: MockEligibleClient[] = [];
  MOCK_ASSET_DIRECTORY.forEach(({ _id: assetId }) => {
    for (let i = 0; i < ROWS_PER_ASSET; i++) {
      const user = MOCK_USERS[i % MOCK_USERS.length];
      const cycle = Math.floor(i / MOCK_USERS.length);
      const suffix = cycle > 0 ? ` ${cycle + 1}` : '';
      rows.push({
        payment_plan_id: `pp-evt-${assetId}-${i}`,
        user_id: cycle > 0 ? `${user._id}-${cycle}` : user._id,
        name: `${user.firstName} ${user.lastName}${suffix}`,
        email: cycle > 0 ? user.email.replace('@', `+${cycle}@`) : user.email,
        phone: user.phoneNumber,
        asset_id: assetId,
        size: [250, 300, 400, 500, 600][i % 5],
        no_of_units: 1 + (i % 3 === 0 ? 1 : 0),
        // Roughly a third only have land paid; the rest have land + dev levy.
        eligibility_tier: i % 3 === 0 ? 'land' : 'land_and_dev_levy',
        plan_status: 'active',
        // Earlier in the array completed land payment longer ago (bigger
        // daysAgo) — FCFS sort is ascending land_completed_at.
        land_completed_at: formatMockDate(400 - i * 7),
      });
    }
  });
  return rows;
}

const eligiblePool: MockEligibleClient[] = buildEligiblePool();
const events: MockCompanyEvent[] = [];
const allocations: MockEventAllocation[] = [];
const registrations: MockEventRegistration[] = [];
let eventSeq = 0;
let allocationSeq = 0;
let registrationSeq = 0;
let seeded = false;

function assetNameFor(assetId: string): string | null {
  return MOCK_ASSET_DIRECTORY.find((a) => a._id === assetId)?.name ?? null;
}

function requireEvent(id: string): MockCompanyEvent {
  const event = events.find((e) => e.id === id);
  if (!event) throw new MockHttpError(404, 'Company event not found', 'EVENT_NOT_FOUND');
  return event;
}

function requireAllocationEvent(id: string): MockCompanyEvent {
  const event = requireEvent(id);
  if (event.type !== 'allocation') {
    throw new MockHttpError(400, 'This action is only available on an allocation event', 'NOT_AN_ALLOCATION_EVENT');
  }
  return event;
}

/** Every payment-plan id with a currently-live (non-cancelled) allocation, anywhere. */
function livePlanIds(): Set<string> {
  return new Set(allocations.filter((a) => a.status !== 'cancelled').map((a) => a.payment_plan_id));
}

function pickupNameFor(event: MockCompanyEvent, locationId: string | null): string | null {
  if (!locationId) return null;
  return event.pickup_locations.find((p) => p.id === locationId)?.name ?? null;
}

/** `date` (yyyy-mm-dd) + `time` (HH:mm) in Africa/Lagos → the authoritative UTC instant. */
function resolveStartsAt(date: string, time: string): string {
  return new Date(`${date}T${time}:00${LAGOS_OFFSET}`).toISOString();
}

/** Strips mock-internal fields and shapes the response exactly like the real `toEventDto()`. */
function publicEvent(e: MockCompanyEvent) {
  const remaining_capacity = e.available_size == null ? null : Math.max(0, e.available_size - e.reserved_size);
  return {
    id: e.id,
    title: e.title,
    type: e.type,
    asset_id: e.asset_id,
    date: e.date,
    time: e.time,
    starts_at: e.starts_at,
    pickup_locations: e.pickup_locations,
    available_size: e.available_size,
    reserved_size: e.reserved_size,
    remaining_capacity,
    size_unit: e.size_unit,
    status: e.status,
    created_by: e.created_by,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

// Legal status moves — mirrors `STATUS_TRANSITIONS` in `company-events.service.ts`
// (PR #70, staging `ba31456`). `closed → published` is the reopen path.
const STATUS_TRANSITIONS: Record<MockCompanyEvent['status'], MockCompanyEvent['status'][]> = {
  draft: ['published', 'closed'],
  published: ['closed'],
  closed: ['published'],
};

function transitionStatus(event: MockCompanyEvent, target: MockCompanyEvent['status']) {
  if (event.status === target) return publicEvent(event);
  if (!STATUS_TRANSITIONS[event.status]?.includes(target)) {
    throw new MockHttpError(400, 'That event status change is not allowed', 'INVALID_STATUS_TRANSITION');
  }
  event.status = target;
  event.updatedAt = new Date().toISOString();
  return publicEvent(event);
}

/** Shapes one allocation exactly like the real `listEventAllocations()` response row. */
function publicAllocation(a: MockEventAllocation, event: MockCompanyEvent) {
  const registration = registrations.find((r) => r.event_allocation_id === a.allocation_id) ?? null;
  return {
    allocation_id: a.allocation_id,
    user_id: a.user_id,
    payment_plan_id: a.payment_plan_id,
    name: a.name,
    email: a.email,
    phone: a.phone,
    category: registration?.category ?? null,
    pickup_location: registration ? pickupNameFor(event, registration.preferred_pickup_location_id) : null,
    status: a.status,
    eligibility_tier: a.eligibility_tier,
    size_reserved: a.size_reserved,
    email_status: a.email_status,
    invite_sent_at: a.invite_sent_at,
    registered_at: a.registered_at,
    checked_in_at: a.checked_in_at,
    confirmed_at: a.confirmed_at,
    cancelled_at: a.cancelled_at,
    created_at: a.created_at,
  };
}

function seedIfNeeded(): void {
  if (seeded) return;
  seeded = true;

  const inspection = createEvent({
    title: `${MOCK_ASSET_DIRECTORY[0].name} — Site Inspection Day`,
    type: 'site_inspection',
    asset_id: MOCK_ASSET_DIRECTORY[0]._id,
    date: formatMockDate(-14).slice(0, 10),
    time: '10:00',
    pickup_locations: [],
    available_size: null,
    size_unit: null,
  });
  inspection.status = 'published';

  // Site inspection has no `EventAllocation` to hang a registrant off of —
  // these are seeded directly against the event, `event_allocation_id: null`,
  // so the Registrants table on a site-inspection event has something real
  // to render ahead of the real public form shipping.
  MOCK_USERS.slice(0, 4).forEach((user, i) => {
    registrations.push({
      registration_id: `evt-reg-si-${++registrationSeq}`,
      event_allocation_id: null,
      event_id: inspection.id,
      full_name: `${user.firstName} ${user.lastName}`,
      phone: user.phoneNumber,
      email: user.email,
      category: REGISTRANT_CATEGORIES[i % REGISTRANT_CATEGORIES.length],
      preferred_pickup_location_id: '',
      submitted_at: formatMockDate(-3 - i),
    });
  });

  const allocation = createEvent({
    title: `${MOCK_ASSET_DIRECTORY[1].name} — October Allocation`,
    type: 'allocation',
    asset_id: MOCK_ASSET_DIRECTORY[1]._id,
    date: formatMockDate(-21).slice(0, 10),
    time: '09:00',
    pickup_locations: ['Ikeja Bus Park', 'Lekki Phase 1 Roundabout'],
    available_size: 3000,
    size_unit: 'sqm',
  });
  allocation.status = 'published';

  // Pre-populate a spread of lifecycle stages (one cancelled) so the
  // "Allocated" table, the analytics funnel, and the registrations table
  // all have something real to render on first load.
  const STAGE_ORDER: EventAllocationStatus[] = ['allocated', 'email_sent', 'registered', 'checked_in', 'confirmed'];
  const demoStatuses: EventAllocationStatus[] = [
    'allocated',
    'email_sent',
    'registered',
    'registered',
    'checked_in',
    'checked_in',
    'confirmed',
    'cancelled',
  ];

  eligiblePool
    .filter((c) => c.asset_id === MOCK_ASSET_DIRECTORY[1]._id)
    .slice(0, demoStatuses.length)
    .forEach((client, i) => {
      const size = client.size * client.no_of_units;
      const status = demoStatuses[i];
      const allocationId = `evt-alloc-${++allocationSeq}`;

      const reachesStage = (stage: EventAllocationStatus) =>
        status !== 'cancelled' && STAGE_ORDER.indexOf(status) >= STAGE_ORDER.indexOf(stage);

      const row: MockEventAllocation = {
        allocation_id: allocationId,
        event_id: allocation.id,
        payment_plan_id: client.payment_plan_id,
        user_id: client.user_id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        size_reserved: size,
        eligibility_tier: client.eligibility_tier,
        status,
        email_status: status === 'allocated' ? 'not_sent' : 'sent',
        invite_sent_at: status === 'allocated' ? null : formatMockDate(-19),
        registered_at: reachesStage('registered') ? formatMockDate(-18) : null,
        checked_in_at: reachesStage('checked_in') ? formatMockDate(-14) : null,
        confirmed_at: reachesStage('confirmed') ? formatMockDate(-14) : null,
        cancelled_at: status === 'cancelled' ? formatMockDate(-15) : null,
        actor: MOCK_ADMIN_ID,
        created_at: formatMockDate(-20),
      };
      allocations.push(row);

      if (status !== 'cancelled') {
        allocation.reserved_size += size;
      }
      if (reachesStage('registered')) {
        const location = allocation.pickup_locations[i % Math.max(1, allocation.pickup_locations.length)];
        registrations.push({
          registration_id: `evt-reg-${++registrationSeq}`,
          event_allocation_id: allocationId,
          event_id: allocation.id,
          full_name: client.name,
          phone: client.phone,
          email: client.email,
          category: REGISTRANT_CATEGORIES[i % REGISTRANT_CATEGORIES.length],
          preferred_pickup_location_id: location?.id ?? '',
          submitted_at: formatMockDate(-18),
        });
      }
    });
}

function createEvent(input: {
  title: string;
  type: 'site_inspection' | 'allocation';
  asset_id: string;
  date: string;
  time: string;
  pickup_locations: (string | { name: string; seat_limit?: number })[];
  available_size: number | null;
  size_unit: string | null;
}): MockCompanyEvent {
  const assetName = assetNameFor(input.asset_id);
  if (!assetName) throw new MockHttpError(404, 'Asset not found', 'ASSET_NOT_FOUND');

  const now = new Date().toISOString();
  const id = `evt-${++eventSeq}`;
  const isAllocation = input.type === 'allocation';
  const event: MockCompanyEvent = {
    id,
    title: input.title,
    type: input.type,
    asset_id: input.asset_id,
    asset_name: assetName,
    date: input.date,
    time: input.time,
    starts_at: resolveStartsAt(input.date, input.time),
    pickup_locations: input.pickup_locations.map((p, idx) => {
      const loc = typeof p === 'string' ? { name: p } : p;
      return { id: `${id}-loc-${idx}`, name: loc.name, seat_limit: loc.seat_limit ?? null };
    }),
    available_size: isAllocation ? input.available_size : null,
    reserved_size: 0,
    size_unit: isAllocation ? input.size_unit ?? 'sqm' : null,
    status: 'draft',
    created_by: MOCK_ADMIN_ID,
    createdAt: now,
    updatedAt: now,
  };
  events.unshift(event);
  return event;
}

export const companyEventsRoutes: MockRoutes = {
  'GET /admin/company-events': ({ query }) => {
    seedIfNeeded();
    let rows = events as MockCompanyEvent[];

    const type = query.type ? String(query.type) : null;
    if (type) rows = rows.filter((e) => e.type === type);

    const status = query.status ? String(query.status) : null;
    if (status) rows = rows.filter((e) => e.status === status);

    const assetId = query.asset_id ? String(query.asset_id) : null;
    if (assetId) rows = rows.filter((e) => e.asset_id === assetId);

    // Real ListCompanyEventsQueryDto's search param is `q` (title only).
    const q = String(query.q ?? '').trim().toLowerCase();
    if (q) rows = rows.filter((e) => e.title.toLowerCase().includes(q));

    const result = paged(rows, query, 20);
    return { ...result, data: result.data.map(publicEvent) };
  },

  'POST /admin/company-events': ({ body: raw }) => {
    seedIfNeeded();
    const dto = body<{
      title?: string;
      type?: 'site_inspection' | 'allocation';
      asset_id?: string;
      date?: string;
      time?: string;
      available_size?: number;
      size_unit?: string;
      pickup_locations?: { name: string; seat_limit?: number }[];
    }>(raw);

    if (!dto.title?.trim()) throw new MockHttpError(400, 'title is required', 'VALIDATION_ERROR');
    if (dto.type !== 'site_inspection' && dto.type !== 'allocation') {
      throw new MockHttpError(400, 'type must be site_inspection or allocation', 'VALIDATION_ERROR');
    }
    if (!dto.asset_id) throw new MockHttpError(400, 'asset_id is required', 'VALIDATION_ERROR');
    if (!dto.date) throw new MockHttpError(400, 'date is required', 'VALIDATION_ERROR');
    if (!dto.time) throw new MockHttpError(400, 'time is required', 'VALIDATION_ERROR');

    const event = createEvent({
      title: dto.title.trim(),
      type: dto.type,
      asset_id: dto.asset_id,
      date: dto.date,
      time: dto.time,
      pickup_locations: dto.pickup_locations ?? [],
      available_size: dto.available_size ?? null,
      size_unit: dto.size_unit ?? 'sqm',
    });
    return publicEvent(event);
  },

  'GET /admin/company-events/:id': ({ params }) => {
    seedIfNeeded();
    return publicEvent(requireEvent(params.id));
  },

  'PATCH /admin/company-events/:id/status': ({ params, body: raw }) => {
    seedIfNeeded();
    const event = requireEvent(params.id);
    const dto = body<{ status?: MockCompanyEvent['status'] }>(raw);
    if (!dto.status) throw new MockHttpError(400, 'status is required', 'VALIDATION_ERROR');
    return transitionStatus(event, dto.status);
  },

  'POST /admin/company-events/:id/publish': ({ params }) => {
    seedIfNeeded();
    return transitionStatus(requireEvent(params.id), 'published');
  },

  'POST /admin/company-events/:id/close': ({ params }) => {
    seedIfNeeded();
    return transitionStatus(requireEvent(params.id), 'closed');
  },

  'GET /admin/company-events/:id/eligible-clients': ({ params, query }) => {
    seedIfNeeded();
    const event = requireAllocationEvent(params.id);

    const excludedIds = livePlanIds();
    let rows = eligiblePool.filter((c) => c.asset_id === event.asset_id && !excludedIds.has(c.payment_plan_id));

    const search = String(query.search ?? '').trim().toLowerCase();
    if (search) {
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          r.email.toLowerCase().includes(search) ||
          r.phone.toLowerCase().includes(search)
      );
    }

    const eligibilityTier = query.eligibility_tier ? String(query.eligibility_tier) : null;
    if (eligibilityTier) rows = rows.filter((r) => r.eligibility_tier === eligibilityTier);

    // FCFS — server-side sort, not left to the client.
    rows = [...rows].sort(
      (a, b) => new Date(a.land_completed_at).getTime() - new Date(b.land_completed_at).getTime()
    );

    return paged(rows, query, 25);
  },

  'GET /admin/company-events/:id/allocations': ({ params, query }) => {
    seedIfNeeded();
    const event = requireAllocationEvent(params.id);

    let rows = allocations.filter((a) => a.event_id === params.id);

    const status = query.status ? String(query.status) : null;
    if (status) rows = rows.filter((a) => a.status === status);

    const search = String(query.search ?? '').trim().toLowerCase();
    if (search) {
      rows = rows.filter(
        (a) =>
          a.name.toLowerCase().includes(search) ||
          a.email.toLowerCase().includes(search) ||
          a.phone.toLowerCase().includes(search)
      );
    }

    rows = [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const result = paged(rows, query, 50);
    return { ...result, data: result.data.map((a) => publicAllocation(a, event)) };
  },

  'POST /admin/company-events/:id/allocations': ({ params, body: raw }) => {
    seedIfNeeded();
    const event = requireAllocationEvent(params.id);
    if (event.status === 'closed') {
      throw new MockHttpError(403, 'This event is closed to further changes', 'EVENT_CLOSED');
    }
    if (event.available_size == null) {
      throw new MockHttpError(400, 'This allocation event has no available size configured', 'CAPACITY_NOT_SET');
    }

    const dto = body<{ payment_plan_ids?: string[] }>(raw);
    const requestedIds = [...new Set(dto.payment_plan_ids ?? [])];

    const available = event.available_size;
    let running = event.reserved_size;
    const excludedIds = livePlanIds();

    // FCFS within the batch: earliest land-payment completion wins scarce capacity.
    const byId = new Map(eligiblePool.map((c) => [c.payment_plan_id, c]));
    const ordered = [...requestedIds].sort((a, b) => {
      const da = byId.get(a)?.land_completed_at ? new Date(byId.get(a)!.land_completed_at).getTime() : Infinity;
      const db = byId.get(b)?.land_completed_at ? new Date(byId.get(b)!.land_completed_at).getTime() : Infinity;
      return da - db;
    });

    const succeeded: { payment_plan_id: string; event_allocation_id: string; size_reserved: number }[] = [];
    const failed: { payment_plan_id: string; reason: 'ALREADY_ALLOCATED' | 'NO_LONGER_ELIGIBLE' | 'CAPACITY_EXCEEDED' }[] = [];

    for (const paymentPlanId of ordered) {
      if (excludedIds.has(paymentPlanId)) {
        failed.push({ payment_plan_id: paymentPlanId, reason: 'ALREADY_ALLOCATED' });
        continue;
      }

      const client = byId.get(paymentPlanId);
      if (!client || client.asset_id !== event.asset_id) {
        failed.push({ payment_plan_id: paymentPlanId, reason: 'NO_LONGER_ELIGIBLE' });
        continue;
      }

      const size = client.size * client.no_of_units;
      if (running + size > available) {
        failed.push({ payment_plan_id: paymentPlanId, reason: 'CAPACITY_EXCEEDED' });
        continue;
      }

      running += size;
      const allocation: MockEventAllocation = {
        allocation_id: `evt-alloc-${++allocationSeq}`,
        event_id: event.id,
        payment_plan_id: client.payment_plan_id,
        user_id: client.user_id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        size_reserved: size,
        eligibility_tier: client.eligibility_tier,
        status: 'allocated',
        email_status: 'not_sent',
        invite_sent_at: null,
        registered_at: null,
        checked_in_at: null,
        confirmed_at: null,
        cancelled_at: null,
        actor: MOCK_ADMIN_ID,
        created_at: new Date().toISOString(),
      };
      allocations.push(allocation);
      excludedIds.add(client.payment_plan_id);
      succeeded.push({
        payment_plan_id: client.payment_plan_id,
        event_allocation_id: allocation.allocation_id,
        size_reserved: size,
      });
    }

    event.reserved_size = running;
    event.updatedAt = new Date().toISOString();

    return {
      succeeded,
      failed,
      remaining_capacity: Math.max(0, available - running),
    };
  },

  'DELETE /admin/company-events/:id/allocations/:allocationId': ({ params, body: raw }) => {
    seedIfNeeded();
    const event = requireAllocationEvent(params.id);
    const alloc = allocations.find((a) => a.allocation_id === params.allocationId && a.event_id === params.id);
    if (!alloc) throw new MockHttpError(404, 'Event allocation not found', 'ALLOCATION_NOT_FOUND');

    // Idempotent — an already-cancelled allocation frees nothing further,
    // same as the real service.
    if (alloc.status === 'cancelled') {
      return { deallocated: false, already_cancelled: true, freed: 0 };
    }

    void body<{ reason?: string }>(raw); // accepted, not stored — no admin-facing history endpoint exists.
    alloc.status = 'cancelled';
    alloc.cancelled_at = new Date().toISOString();
    event.reserved_size = Math.max(0, event.reserved_size - alloc.size_reserved);
    event.updatedAt = new Date().toISOString();

    return { deallocated: true, already_cancelled: false, freed: alloc.size_reserved };
  },

  'GET /admin/company-events/:id/analytics': ({ params }) => {
    seedIfNeeded();
    const event = requireAllocationEvent(params.id);

    const live = allocations.filter((a) => a.event_id === event.id && a.status !== 'cancelled');
    const cancelled = allocations.filter((a) => a.event_id === event.id && a.status === 'cancelled').length;

    const allocated = live.length;
    const registered = live.filter((a) => a.registered_at).length;
    const checked_in = live.filter((a) => a.checked_in_at).length;
    const confirmed = live.filter((a) => a.confirmed_at).length;
    const no_show = live.filter((a) => a.registered_at && !a.checked_in_at).length;

    const eventRegistrations = registrations.filter((r) => r.event_id === event.id);
    const category_mix = REGISTRANT_CATEGORIES.map((category) => ({
      category,
      count: eventRegistrations.filter((r) => r.category === category).length,
    }));

    const pickup_load = event.pickup_locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      seat_limit: loc.seat_limit,
      registered: eventRegistrations.filter((r) => r.preferred_pickup_location_id === loc.id).length,
    }));

    const available = event.available_size;
    const reserved = event.reserved_size;

    return {
      event_id: event.id,
      title: event.title,
      funnel: { allocated, registered, checked_in, confirmed },
      registration_split: { registered, not_registered: Math.max(0, allocated - registered) },
      no_show,
      cancelled,
      category_mix,
      pickup_load,
      capacity: {
        available_size: available,
        reserved_size: reserved,
        remaining: available != null ? Math.max(0, available - reserved) : null,
        utilization_pct: available ? Math.round((reserved / available) * 1000) / 10 : null,
        size_unit: event.size_unit ?? 'sqm',
      },
    };
  },

  // Real `listEventRegistrations()` doesn't gate on event type (only
  // `getEventAnalytics()` does) — a site-inspection event's registrants use
  // this same endpoint, so this stays `requireEvent`, not
  // `requireAllocationEvent`.
  'GET /admin/company-events/:id/registrations': ({ params, query }) => {
    seedIfNeeded();
    const event = requireEvent(params.id);

    let rows = registrations.filter((r) => r.event_id === params.id);

    const category = query.category ? String(query.category) : null;
    if (category) rows = rows.filter((r) => r.category === category);

    const search = String(query.search ?? '').trim().toLowerCase();
    if (search) {
      rows = rows.filter(
        (r) =>
          r.full_name.toLowerCase().includes(search) ||
          r.email.toLowerCase().includes(search) ||
          r.phone.toLowerCase().includes(search)
      );
    }

    rows = [...rows].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

    const result = paged(rows, query, 25);
    return {
      ...result,
      data: result.data.map((r) => ({
        registration_id: r.registration_id,
        allocation_id: r.event_allocation_id,
        name: r.full_name,
        phone: r.phone,
        email: r.email,
        category: r.category,
        pickup_location: pickupNameFor(event, r.preferred_pickup_location_id),
        submitted_at: r.submitted_at,
      })),
    };
  },
};
