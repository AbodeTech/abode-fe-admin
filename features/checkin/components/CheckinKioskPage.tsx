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
          <p className="text-xs text-white/70">ABO-21 · physical sessions</p>
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

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-[#151616] md:left-[var(--sidebar-width,0px)]">
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
      <p className="mt-3 text-xs text-white/30">Demo ids: reg_1 (Ada), reg_2 (already in), reg_3</p>
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
