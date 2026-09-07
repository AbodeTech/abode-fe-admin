'use client';

import { useMemo, useState } from 'react';

import {
  DEFAULT_EMAIL_SAMPLE,
  EVENT_EMAIL_KINDS,
  EVENT_EMAIL_META,
  renderEventEmail,
  type EventEmailKind,
} from '../templates';

export function EventEmailDesignsPage() {
  const [kind, setKind] = useState<EventEmailKind>('registration');
  const rendered = useMemo(() => renderEventEmail(kind, DEFAULT_EMAIL_SAMPLE), [kind]);
  const meta = EVENT_EMAIL_META[kind];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Event email designs</h1>
        <p className="mt-1 text-sm text-slate-500">
          ABO-27 — HTML designs for lifecycle emails. Preview only; sending is BE (ABO-70+).
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 space-y-2 lg:w-64">
          {EVENT_EMAIL_KINDS.map((k) => {
            const item = EVENT_EMAIL_META[k];
            const active = k === kind;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                  active
                    ? 'border-[#0F4C59] bg-[#0F4C59]/5'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.description}</p>
              </button>
            );
          })}
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Subject</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{rendered.subject}</p>
            <p className="mt-2 text-xs text-slate-500">{meta.description}</p>
          </div>

          <div className="overflow-hidden rounded-xl border bg-slate-100">
            <div className="flex items-center justify-between border-b bg-white px-4 py-2">
              <p className="text-xs font-medium text-slate-500">Desktop preview (~560px)</p>
              <p className="text-[10px] text-slate-400">Sample: {DEFAULT_EMAIL_SAMPLE.first_name}</p>
            </div>
            <div className="p-2 md:p-4">
              <iframe
                title={`${meta.title} preview`}
                srcDoc={rendered.html}
                className="mx-auto h-[720px] w-full max-w-[600px] rounded-lg border bg-white shadow-sm"
              />
            </div>
          </div>

          <details className="rounded-xl border bg-white p-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-800">
              HTML source (handoff to BE)
            </summary>
            <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-100">
              {rendered.html}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
