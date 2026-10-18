# Check-in kiosk migration — Academy site + abode-be-v2 (DC-06)

Guide for building the check-in kiosk where it belongs: a public, PIN-gated page on
the Academy site, backed by public endpoints on `abode-be-v2`. Written from the
component as it existed in `abode-fe-admin` before removal — this is a **move**,
not a rewrite. The full original source is reproduced below so nothing has to be
reconstructed from memory.

Companion doc: `ACADEMY-BACKEND-CONTRACT.md` §2.4 and §3.6 carry the short version
of this contract; this file is the implementation guide.

---

## 1. Why this moves at all

`view_academy` gates the *page* in Admin, not the *sidebar around it*. Any account
that could open the kiosk could open everything else that permission's role
allows — wrong for volunteers running a door on a shared phone at a venue, all
day. They should not hold Abode Admin accounts at all. The Academy site already
has the right model for this: a public route behind a shared PIN
(`x-checkin-pin` header), no login. This guide moves the kiosk to match that
model instead of inventing a new one.

**What stays in Admin:** nothing operational. The physical session's attendance
list is visible on the session detail page, and `checked_in` stays a column and
filter on the cohort's Registrants tab (`GET /admin/academy/cohorts/:id/registrants`).
Ops reads the numbers in Admin; volunteers do the door on the kiosk. Don't build
a second read path for this in the Academy repo — Admin already has it.

---

## 2. Target shape

```
Academy site (FE)                    abode-be-v2 (BE)
──────────────────                   ─────────────────
/checkin  (public route)      ──►    GET  /checkin/sessions
  PIN gate (x-checkin-pin)           GET  /checkin/sessions/:id/stats
  CheckinKioskPage (ported as-is)    GET  /checkin/sessions/:id/search
                                     POST /checkin/sessions/:id/check-in
```

No `/admin/*` prefix, no admin JWT. Auth is the PIN header only, validated
server-side against an env-configured value — never trust a client-side check
alone, since the page itself is public and its JS is inspectable.

---

## 3. abode-be-v2 — endpoints

Base path `/api/v1`, same envelope as every other route
(`{ success, message, data, meta? }`).

| Method | Path | Notes |
|---|---|---|
| GET | `/checkin/sessions` | Every physical Meeting session available for kiosk use (+ live stats) |
| GET | `/checkin/sessions/:id/stats` | `:id` = Meeting id or slug → `{ session_id, checked_in, total, remaining }` |
| GET | `/checkin/sessions/:id/search` | Query `q` (min 2 chars) → `CheckinSearchRow[]`, cap ~20 |
| POST | `/checkin/sessions/:id/check-in` | `{ registration_id? \| qr_payload?, force? }` → `CheckinResult` |

**Auth:** a guard reading `x-checkin-pin` from the request header and comparing
it to an env secret (e.g. `CHECKIN_KIOSK_PIN`) with a constant-time compare.
401 on mismatch or missing header. No user/session concept at all — this is a
shared-device PIN, not per-volunteer auth. Rate-limit it (the PIN is memorable
and the surface is public).

**Duplicate check-in:** prefer `outcome: 'already'` in a `200` response so the
kiosk can show the prior `checked_in_at` without treating it as a hard error
(a 409 with the same body works too, but the FE below expects `200 + outcome`
today — pick one and keep the FE in sync).

### Response shapes

```ts
CheckinSession = {
  id: string
  slug: string
  name: string
  starts_at: string
  ends_at: string
  venue: string | null
  city: string | null          // added with DC-02 — surface it here too if useful for multi-venue kiosks
  access_type: 'physical'
  cohort_id: string
  cohort_label: string
  stats?: { checked_in: number; total: number; remaining: number }
}

CheckinStats = {
  session_id: string
  checked_in: number
  total: number
  remaining: number
}

CheckinSearchRow = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  checked_in: boolean
  checked_in_at: string | null
  registration_status: 'registered' | 'waitlisted' | 'cancelled' | string
  is_abode_associate: string   // 'yes' | 'no'
}

CheckinResult = {
  outcome: 'success' | 'already'
  id: string
  name: string
  first_name: string
  is_abode_associate: string
  registration_status: string
  checked_in_at: string | null
}
```

### Data model

A "checkin session" **is** a physical Meeting (`access_type: 'physical'`, per
DC-02) — don't create a parallel table. `GET /checkin/sessions` is a filtered
view: physical Meetings whose `starts_at`/`ends_at` window makes them relevant
for check-in today (BE's call how wide that window is; the old FE mock used
"any physical session," which is fine to keep for a first cut).

An "attendee" is a cohort **Registrant** (from `abode_academy` DC-02/07 domain),
not a new entity. Check-in state (`checked_in`, `checked_in_at`) already lives
on the Registrant per the existing Admin contract (§1.3 in
`ACADEMY-BACKEND-CONTRACT.md`) — write to that same row so Admin's Registrants
tab reflects kiosk activity with no separate sync step.

**QR payload:** a URL containing `?id=<registration_id>` (optionally
`&session=<slug>`). The kiosk also accepts a raw `reg_*` id typed or pasted
directly — see `parseRegistrationId` in the reference mock below.

**Constraints:** check-in unique per `(meeting_id, registration_id)` unless
`force: true` is passed (walk-up override for a known duplicate scan).

---

## 4. Academy site — FE port

### Route

`/checkin` (public, App Router). Wrap it in a PIN gate:

- Simplest: a client-side form that POSTs the PIN once, stores it (e.g.
  `sessionStorage`), and sends it as `x-checkin-pin` on every kiosk API call —
  the *real* enforcement is the BE guard above, this is just UX so a volunteer
  doesn't retype the PIN between scans.
- Every hook below (`use-checkin.ts`) needs its `apiGet`/`apiPost` calls to
  attach that header — check whatever the Academy repo's API client helper
  looks like and add the header there, the same way `abode-fe-admin`'s
  `api-client.ts` attaches the admin JWT.

### Files to port, unchanged

Copy these three files into the Academy repo as `features/checkin/**` (or
wherever that repo keeps feature modules) — **kept exactly as built**, this is
a move:

- `features/checkin/schemas/checkin.schema.ts` — Zod shapes, reproduced in §3 above and in full at the end of this doc.
- `features/checkin/hooks/use-checkin.ts` — React Query hooks. Only change: swap the `/admin/checkin/*` paths for `/checkin/*`, and make sure whatever `apiGet`/`apiPost` equivalent the Academy repo has attaches `x-checkin-pin`.
- `features/checkin/components/CheckinKioskPage.tsx` — the 410-line kiosk itself: scanner (via `@zxing/browser`, dynamically imported — check it's a dependency in the Academy repo, or add it), manual paste fallback, search fallback, running count footer, duplicate/not-found overlay. **No changes needed** beyond the import paths.

Full source for all three is in §6 below so nothing has to be reconstructed —
this is the actual content that shipped in `abode-fe-admin` before DC-06 removed it.

### What to double check while porting

- **`@zxing/browser`** — confirm it's installed in the Academy repo (`package.json`); the component already handles it being unavailable (falls back to manual paste), so it's not a hard blocker, but live scanning is the point of a kiosk.
- **Styling** — the component is self-contained (`bg-[#0c0d0d]`, `bg-[#0F4C59]`, `#F26B35` accent) and doesn't depend on Admin's design tokens. It'll render correctly dropped into any Next.js page with Tailwind configured; verify the Academy site's Tailwind setup resolves the same arbitrary-value syntax (`bg-[#0c0d0d]`) it already uses elsewhere for the Academy site's own `#0494A4` masthead.
- **Header change** — the "ABO-21 · physical sessions" label in the top bar is an internal ticket reference; drop it or replace with something meaningful to whoever reads the kiosk screen at a venue.

---

## 5. Migration checklist

1. **BE (abode-be-v2):**
   - [ ] Add a `CheckinPinGuard` (or equivalent) reading `x-checkin-pin`, comparing against `process.env.CHECKIN_KIOSK_PIN`
   - [ ] Add the four routes under `/checkin/*` (§3), reusing the Meeting and Registrant models — no new tables
   - [ ] Rate-limit the PIN check and the search endpoint
   - [ ] Confirm `checked_in` / `checked_in_at` writes land on the same Registrant row Admin's Registrants tab reads
2. **Academy site (FE):**
   - [ ] Create the `/checkin` public route + PIN entry gate
   - [ ] Port `checkin.schema.ts`, `use-checkin.ts`, `CheckinKioskPage.tsx` verbatim (§6)
   - [ ] Point `use-checkin.ts` at `/checkin/*` and attach `x-checkin-pin` on every call
   - [ ] Confirm `@zxing/browser` is available (or add it)
   - [ ] Manual QA: scan (or paste) a QR, search fallback, duplicate check-in shows "already," running counts update
3. **abode-fe-admin (already done, DC-06):**
   - [x] `app/(dashboard)/checkin` deleted
   - [x] `features/checkin/**` deleted
   - [x] `Check-in` removed from the sidebar
   - [x] `lib/mocks/routes/checkin.ts` deleted, unregistered from `lib/mocks/routes/index.ts`
   - [ ] Once the kiosk is live on Academy, confirm the physical session detail page (Admin) actually surfaces attendance — if that view doesn't exist yet, it's the one piece of "what stays in Admin" (§1) that still needs building here

---

## 6. Reference source — as it existed before DC-06 removal

### `checkin.schema.ts`

```ts
import { z } from 'zod';

export const CheckinSessionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  starts_at: z.string(),
  ends_at: z.string(),
  venue: z.string().nullable(),
  access_type: z.literal('physical'),
  cohort_id: z.string(),
  cohort_label: z.string(),
  stats: z
    .object({
      checked_in: z.number(),
      total: z.number(),
      remaining: z.number(),
    })
    .optional(),
});

export const CheckinStatsSchema = z.object({
  session_id: z.string(),
  checked_in: z.number(),
  total: z.number(),
  remaining: z.number(),
});

export const CheckinSearchRowSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string(),
  checked_in: z.boolean(),
  checked_in_at: z.string().nullable(),
  registration_status: z.string(),
  is_abode_associate: z.string(),
});

export const CheckinResultSchema = z.object({
  outcome: z.enum(['success', 'already']),
  id: z.string(),
  name: z.string(),
  first_name: z.string(),
  is_abode_associate: z.string(),
  registration_status: z.string(),
  checked_in_at: z.string().nullable(),
});

export type CheckinSession = z.infer<typeof CheckinSessionSchema>;
export type CheckinStats = z.infer<typeof CheckinStatsSchema>;
export type CheckinSearchRow = z.infer<typeof CheckinSearchRowSchema>;
export type CheckinResult = z.infer<typeof CheckinResultSchema>;
```

### `use-checkin.ts`

```ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet, apiPost } from '@/lib/api-client'; // swap for the Academy repo's client

import {
  CheckinResultSchema,
  CheckinSearchRowSchema,
  CheckinSessionSchema,
  CheckinStatsSchema,
} from '../schemas/checkin.schema';

const checkinKeys = {
  all: ['checkin'] as const,
  sessions: () => [...checkinKeys.all, 'sessions'] as const,
  stats: (id: string) => [...checkinKeys.all, 'stats', id] as const,
  search: (id: string, q: string) => [...checkinKeys.all, 'search', id, q] as const,
};

export function useCheckinSessions() {
  return useQuery({
    queryKey: checkinKeys.sessions(),
    queryFn: () => apiGet('/checkin/sessions', z.array(CheckinSessionSchema)),
  });
}

export function useCheckinStats(sessionId: string) {
  return useQuery({
    queryKey: checkinKeys.stats(sessionId),
    queryFn: () =>
      apiGet(`/checkin/sessions/${sessionId}/stats`, CheckinStatsSchema),
    enabled: Boolean(sessionId),
    refetchInterval: 5_000,
  });
}

export function useCheckinSearch(sessionId: string, q: string) {
  return useQuery({
    queryKey: checkinKeys.search(sessionId, q),
    queryFn: () =>
      apiGet(`/checkin/sessions/${sessionId}/search`, z.array(CheckinSearchRowSchema), {
        params: { q },
      }),
    enabled: Boolean(sessionId) && q.trim().length >= 2,
  });
}

export function useCheckInAttendee(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { registration_id?: string; qr_payload?: string; force?: boolean }) =>
      apiPost(`/checkin/sessions/${sessionId}/check-in`, input, CheckinResultSchema),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: checkinKeys.stats(sessionId) });
      void qc.invalidateQueries({ queryKey: [...checkinKeys.all, 'search', sessionId] });
    },
  });
}
```

*(Only the four path strings changed from the original — `/admin/checkin/...` →
`/checkin/...`. Everything else, including the query keys and invalidation
logic, is untouched.)*

### `CheckinKioskPage.tsx`

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, CheckCircle2, Loader2, Search, XCircle } from 'lucide-react';

import {
  useCheckInAttendee,
  useCheckinSearch,
  useCheckinSessions,
  useCheckinStats,
} from '../hooks/use-checkin';
import type { CheckinResult, CheckinSearchRow } from '../schemas/checkin.schema';

type Overlay =
  | { type: null }
  | {
      type: 'success' | 'already' | 'not_found';
      name?: string;
      first_name?: string;
      checked_in_at?: string | null;
      registration_status?: string;
      is_abode_associate?: string;
    };

function extractRegistrationId(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    const id = url.searchParams.get('id');
    if (id) return id;
  } catch {
    // not a URL
  }
  return text;
}

export function CheckinKioskPage() {
  const sessionsQuery = useCheckinSessions();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [tab, setTab] = useState<'scan' | 'search'>('scan');
  const [overlay, setOverlay] = useState<Overlay>({ type: null });

  const sessionId = selectedSessionId ?? sessionsQuery.data?.[0]?.id ?? '';

  const statsQuery = useCheckinStats(sessionId);
  const checkIn = useCheckInAttendee(sessionId);

  async function processPayload(payload: string) {
    const registrationId = extractRegistrationId(payload);
    if (!registrationId || !sessionId) {
      setOverlay({ type: 'not_found' });
      return;
    }
    try {
      const result = await checkIn.mutateAsync({
        registration_id: registrationId,
        qr_payload: payload,
      });
      showResult(result);
    } catch {
      setOverlay({ type: 'not_found' });
    }
  }

  function showResult(result: CheckinResult) {
    setOverlay({
      type: result.outcome === 'success' ? 'success' : 'already',
      name: result.name,
      first_name: result.first_name,
      checked_in_at: result.checked_in_at,
      registration_status: result.registration_status,
      is_abode_associate: result.is_abode_associate,
    });
  }

  const stats = statsQuery.data ?? { checked_in: 0, total: 0, remaining: 0 };
  const attendance =
    stats.total > 0 ? ((stats.checked_in / stats.total) * 100).toFixed(1) : '0.0';

  if (sessionsQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="-m-4 flex min-h-[calc(100vh-4rem)] flex-col bg-[#0c0d0d] text-white md:-m-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0F4C59] px-5 py-4">
        <div>
          <p className="text-base font-bold tracking-tight">Check-in kiosk</p>
          <p className="text-xs text-white/70">Physical sessions</p>
        </div>
        <select
          value={sessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="max-w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm outline-none"
        >
          {(sessionsQuery.data ?? []).map((s) => (
            <option key={s.id} value={s.id} className="text-slate-900">
              {s.name}
              {s.venue ? ` · ${s.venue}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="flex border-b border-white/10">
        {(['scan', 'search'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`relative flex-1 py-3.5 text-sm font-medium transition ${
              tab === key ? 'text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {key === 'scan' ? 'Scan / paste QR' : 'Search'}
            {tab === key ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F26B35]" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {tab === 'scan' ? (
          <ScanPane
            paused={overlay.type !== null}
            onPayload={processPayload}
            busy={checkIn.isPending}
          />
        ) : (
          <SearchPane
            sessionId={sessionId}
            onCheckIn={async (row) => {
              try {
                const result = await checkIn.mutateAsync({ registration_id: row.id });
                showResult(result);
              } catch {
                setOverlay({ type: 'not_found' });
              }
            }}
            busy={checkIn.isPending}
          />
        )}
      </div>

      {overlay.type ? (
        <ResultOverlay overlay={overlay} onDismiss={() => setOverlay({ type: null })} />
      ) : null}

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-[#151616]">
        <div className="grid grid-cols-4 divide-x divide-white/5">
          <StatCell label="Checked in" value={String(stats.checked_in)} color="text-emerald-400" />
          <StatCell label="Registered" value={String(stats.total)} color="text-white" />
          <StatCell label="Remaining" value={String(stats.remaining)} color="text-rose-400" />
          <StatCell label="Attendance" value={`${attendance}%`} color="text-[#02B8CF]" />
        </div>
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center py-3">
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      <span className="mt-0.5 text-[10px] text-white/30">{label}</span>
    </div>
  );
}

function ScanPane({
  paused,
  onPayload,
  busy,
}: {
  paused: boolean;
  onPayload: (payload: string) => void;
  busy: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pausedRef = useRef(false);
  const onPayloadRef = useRef(onPayload);
  const [cameraError, setCameraError] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [manual, setManual] = useState('');

  useEffect(() => {
    onPayloadRef.current = onPayload;
  }, [onPayload]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;

    async function start() {
      if (!videoRef.current) return;
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (!result || pausedRef.current) return;
            pausedRef.current = true;
            onPayloadRef.current(result.getText());
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        stop = () => controls.stop();
        setScannerReady(true);
      } catch {
        if (!cancelled) setCameraError(true);
      }
    }

    void start();
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  return (
    <div className="flex flex-col items-center px-4 py-6">
      {cameraError ? (
        <div className="mb-6 flex w-full max-w-md flex-col items-center rounded-2xl border border-white/10 px-6 py-10 text-center">
          <Camera className="mb-3 h-10 w-10 text-white/25" />
          <p className="text-sm font-semibold text-white/70">Camera / scanner unavailable</p>
          <p className="mt-2 text-xs text-white/40">
            Paste a QR URL or registration id below, or use Search. Install{' '}
            <code className="text-white/60">@zxing/browser</code> when network allows for live scan.
          </p>
        </div>
      ) : (
        <div className="relative mb-6 w-full max-w-[500px] overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} className="w-full" playsInline muted />
          {!scannerReady ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <p className="text-sm text-white/60">Starting camera…</p>
            </div>
          ) : null}
        </div>
      )}

      <form
        className="flex w-full max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!manual.trim() || busy) return;
          onPayload(manual);
          setManual('');
        }}
      >
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Paste QR URL or reg_1"
          className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-white/30"
        />
        <button
          type="submit"
          disabled={busy || !manual.trim()}
          className="rounded-xl bg-[#0F4C59] px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          Check in
        </button>
      </form>
    </div>
  );
}

function SearchPane({
  sessionId,
  onCheckIn,
  busy,
}: {
  sessionId: string;
  onCheckIn: (row: CheckinSearchRow) => void;
  busy: boolean;
}) {
  const [q, setQ] = useState('');
  const search = useCheckinSearch(sessionId, q);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, or phone"
          className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-white/30"
        />
      </div>

      <div className="mt-4 space-y-2">
        {(search.data ?? []).map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold">
                {row.first_name} {row.last_name}
              </p>
              <p className="text-xs text-white/40">{row.email}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-white/30">
                {row.registration_status}
                {row.checked_in ? ' · checked in' : ''}
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => onCheckIn(row)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {row.checked_in ? 'Re-scan' : 'Check in'}
            </button>
          </div>
        ))}
        {q.trim().length >= 2 && !search.isLoading && (search.data?.length ?? 0) === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">No matches</p>
        ) : null}
      </div>
    </div>
  );
}

function ResultOverlay({
  overlay,
  onDismiss,
}: {
  overlay: Exclude<Overlay, { type: null }>;
  onDismiss: () => void;
}) {
  const config = {
    success: {
      bg: 'bg-emerald-500',
      icon: <CheckCircle2 className="h-16 w-16 text-white" />,
      title: 'Checked in',
    },
    already: {
      bg: 'bg-amber-500',
      icon: <AlertTriangle className="h-16 w-16 text-white" />,
      title: 'Already checked in',
    },
    not_found: {
      bg: 'bg-rose-500',
      icon: <XCircle className="h-16 w-16 text-white" />,
      title: 'Not found',
    },
  }[overlay.type];

  useEffect(() => {
    const t = setTimeout(onDismiss, 2500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <button
      type="button"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${config.bg} px-6 text-center`}
      onClick={onDismiss}
    >
      {config.icon}
      <p className="mt-4 text-2xl font-bold text-white">{config.title}</p>
      {overlay.name ? <p className="mt-2 text-lg text-white/90">{overlay.name}</p> : null}
      {overlay.registration_status ? (
        <p className="mt-1 text-sm text-white/80">Status: {overlay.registration_status}</p>
      ) : null}
      {overlay.type === 'already' && overlay.checked_in_at ? (
        <p className="mt-2 text-sm text-white/80">
          Earlier at{' '}
          {new Date(overlay.checked_in_at).toLocaleTimeString('en-NG', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      ) : null}
      {overlay.is_abode_associate === 'yes' ? (
        <p className="mt-3 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
          Abode associate
        </p>
      ) : null}
    </button>
  );
}
```

*(Two intentional edits from the original for the new home: the "ABO-21" ticket
reference in the header is gone, and the "Demo ids: reg_1 (Ada)..." helper line
under the manual-entry form is gone — that was a mock-data hint that doesn't
belong once this talks to a real BE.)*

### Reference: the old admin mock (`lib/mocks/routes/checkin.ts`), for shaping BE tests

This never ships in either target repo — it's here purely so whoever implements
the `abode-be-v2` endpoints has a concrete example of the request/response
behavior (including the duplicate-check-in and not-eligible edge cases) to write
tests against.

```ts
import { MockHttpError, type MockRoutes } from '../router';
import { body } from './util';

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

function statsFor(sessionId: string, attendees: Attendee[]) {
  const rows = attendees.filter(
    (a) => a.session_id === sessionId && a.registration_status === 'registered',
  );
  const checked_in = rows.filter((a) => a.checked_in).length;
  return { checked_in, total: rows.length, remaining: Math.max(0, rows.length - checked_in) };
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
  attendee.checked_in_at = new Date().toISOString();
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

// POST /checkin/sessions/:id/check-in — the shape a BE controller test should assert:
//   - unknown session id/slug          -> 404 NOT_FOUND
//   - missing registration_id/qr_payload -> 400 VALIDATION_ERROR
//   - attendee not in this session     -> 404 NOT_FOUND
//   - registration_status !== 'registered' -> 400 INVALID_STATUS
//   - already checked in, no force     -> 200 { outcome: 'already', ...prior checked_in_at }
//   - already checked in, force: true  -> 200 { outcome: 'success', ...new checked_in_at }
//   - not yet checked in               -> 200 { outcome: 'success', ...new checked_in_at }
```
