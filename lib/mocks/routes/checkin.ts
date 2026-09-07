import { MockHttpError, type MockRoutes } from '../router';
import { body } from './util';

/* ============================================================
 * ABO-21 — Check-in kiosk mocks (BE ABO-62–65).
 * QR payload is a URL with ?id=<registration_id>.
 * ============================================================ */

type CheckinSession = {
  id: string;
  slug: string;
  name: string;
  starts_at: string;
  ends_at: string;
  venue: string | null;
  access_type: 'physical';
  cohort_id: string;
  cohort_label: string;
};

type Attendee = {
  id: string;
  session_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  registration_status: 'registered' | 'waitlisted' | 'cancelled';
  is_abode_associate: 'yes' | 'no';
  checked_in: boolean;
  checked_in_at: string | null;
};

const now = () => new Date().toISOString();
const hoursFromNow = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

const sessions: CheckinSession[] = [
  {
    id: '665fmt0000000000000000s4',
    slug: 'rcp-sep-session-4',
    name: 'RCP Sep — Session 4 (physical)',
    starts_at: hoursFromNow(0.5),
    ends_at: hoursFromNow(3.5),
    venue: 'Abode HQ, Lekki Phase 1',
    access_type: 'physical',
    cohort_id: 'cohort_sep_2026',
    cohort_label: 'Realtor Certification Program — September 2026',
  },
];

const attendees: Attendee[] = [
  {
    id: 'reg_1',
    session_id: sessions[0].id,
    first_name: 'Ada',
    last_name: 'Okafor',
    email: 'ada@example.com',
    phone: '+2348011111111',
    registration_status: 'registered',
    is_abode_associate: 'no',
    checked_in: false,
    checked_in_at: null,
  },
  {
    id: 'reg_2',
    session_id: sessions[0].id,
    first_name: 'Chidi',
    last_name: 'Eze',
    email: 'chidi@example.com',
    phone: '+2348022222222',
    registration_status: 'registered',
    is_abode_associate: 'yes',
    checked_in: true,
    checked_in_at: hoursFromNow(-0.2),
  },
  {
    id: 'reg_3',
    session_id: sessions[0].id,
    first_name: 'Bola',
    last_name: 'Adeyemi',
    email: 'bola@example.com',
    phone: '+2348033333333',
    registration_status: 'registered',
    is_abode_associate: 'no',
    checked_in: false,
    checked_in_at: null,
  },
];

function sessionAttendees(sessionId: string) {
  return attendees.filter((a) => a.session_id === sessionId);
}

function statsFor(sessionId: string) {
  const rows = sessionAttendees(sessionId).filter((a) => a.registration_status === 'registered');
  const checked_in = rows.filter((a) => a.checked_in).length;
  return {
    checked_in,
    total: rows.length,
    remaining: Math.max(0, rows.length - checked_in),
  };
}

function parseRegistrationId(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    const id = url.searchParams.get('id');
    if (id) return id;
  } catch {
    // not a URL — treat as raw id
  }
  if (/^reg_[a-z0-9_]+$/i.test(text)) return text;
  return text;
}

function checkIn(attendee: Attendee, force = false) {
  if (attendee.registration_status !== 'registered') {
    throw new MockHttpError(400, 'This registration is not eligible for check-in', 'INVALID_STATUS');
  }
  if (attendee.checked_in && !force) {
    return {
      outcome: 'already' as const,
      id: attendee.id,
      name: `${attendee.first_name} ${attendee.last_name}`.trim(),
      first_name: attendee.first_name,
      checked_in_at: attendee.checked_in_at,
      is_abode_associate: attendee.is_abode_associate,
      registration_status: attendee.registration_status,
    };
  }
  attendee.checked_in = true;
  attendee.checked_in_at = now();
  return {
    outcome: 'success' as const,
    id: attendee.id,
    name: `${attendee.first_name} ${attendee.last_name}`.trim(),
    first_name: attendee.first_name,
    is_abode_associate: attendee.is_abode_associate,
    registration_status: attendee.registration_status,
    checked_in_at: attendee.checked_in_at,
  };
}

export const checkinRoutes: MockRoutes = {
  'GET /admin/checkin/sessions': () =>
    body(
      sessions.map((s) => ({
        ...s,
        stats: statsFor(s.id),
      })),
    ),

  'GET /admin/checkin/sessions/:id/stats': ({ params }) => {
    const session = sessions.find((s) => s.id === params.id || s.slug === params.id);
    if (!session) throw new MockHttpError(404, 'Session not found', 'NOT_FOUND');
    return body({ session_id: session.id, ...statsFor(session.id) });
  },

  'GET /admin/checkin/sessions/:id/search': ({ params, query }) => {
    const session = sessions.find((s) => s.id === params.id || s.slug === params.id);
    if (!session) throw new MockHttpError(404, 'Session not found', 'NOT_FOUND');
    const q = String(query.q ?? '')
      .trim()
      .toLowerCase();
    if (!q) return body([]);

    const rows = sessionAttendees(session.id)
      .filter((a) => {
        const hay = `${a.first_name} ${a.last_name} ${a.email} ${a.phone}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 20)
      .map((a) => ({
        id: a.id,
        first_name: a.first_name,
        last_name: a.last_name,
        email: a.email,
        phone: a.phone,
        checked_in: a.checked_in,
        checked_in_at: a.checked_in_at,
        registration_status: a.registration_status,
        is_abode_associate: a.is_abode_associate,
      }));

    return body(rows);
  },

  'POST /admin/checkin/sessions/:id/check-in': ({ params, body: raw }) => {
    const session = sessions.find((s) => s.id === params.id || s.slug === params.id);
    if (!session) throw new MockHttpError(404, 'Session not found', 'NOT_FOUND');

    const input = (raw ?? {}) as {
      registration_id?: string;
      qr_payload?: string;
      force?: boolean;
    };
    const registrationId = parseRegistrationId(
      input.registration_id || input.qr_payload || '',
    );
    if (!registrationId) {
      throw new MockHttpError(400, 'registration_id or qr_payload is required', 'VALIDATION_ERROR');
    }

    const attendee = attendees.find(
      (a) => a.session_id === session.id && a.id === registrationId,
    );
    if (!attendee) {
      throw new MockHttpError(404, 'Attendee not found for this session', 'NOT_FOUND');
    }

    return body(checkIn(attendee, Boolean(input.force)));
  },
};
