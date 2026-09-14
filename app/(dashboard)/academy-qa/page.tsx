"use client";

import Link from "next/link";

const ADMIN_CHECKS = [
  { href: "/meetings", label: "Meetings list", id: "A2" },
  { href: "/recruitment", label: "Programmes", id: "A5" },
  { href: "/checkin", label: "Check-in kiosk", id: "A11" },
  { href: "/email-designs", label: "Email designs", id: "A12" },
  { href: "/company-events", label: "Company events (ON HOLD)", id: "—" },
];

const ACADEMY_CHECKS = [
  { path: "/register?cohort=rcp-september-2026", label: "Register (cohort)", id: "P1" },
  { path: "/series/rcp-september-2026-sessions", label: "Series link", id: "P3" },
  { path: "/join/rcp-sep-session-4", label: "Physical join → QR", id: "P5" },
  { path: "/join/rcp-physical-pending-venue", label: "Physical join → pending QR", id: "P6" },
  { path: "/test/rcp-sep-2026-final", label: "Public test", id: "P7" },
];

/** ABO-28 — in-app jump list for mock FE QA. Full checklist: docs/ACADEMY-FE-QA.md */
export default function AcademyQaPage() {
  const academyBase =
    process.env.NEXT_PUBLIC_ACADEMY_PUBLIC_URL || "http://localhost:3000";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Academy FE QA</h1>
        <p className="mt-1 text-sm text-slate-500">
          ABO-28 — smoke paths against <strong>mock data</strong>. Checklist:{" "}
          <code className="text-xs">docs/ACADEMY-FE-QA.md</code>
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Admin is on <code className="text-xs">NEXT_PUBLIC_USE_MOCKS=true</code>. Academy public flows use
        in-repo mock sessions / cohorts / tests until BE ABO-33–69 is live.
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</h2>
        <ul className="divide-y rounded-xl border bg-white">
          {ADMIN_CHECKS.map((item) => (
            <li key={item.href} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-400">{item.id}</p>
              </div>
              <Link href={item.href} className="text-sm font-medium text-[#0F4C59] underline">
                Open
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Academy (public)
        </h2>
        <ul className="divide-y rounded-xl border bg-white">
          {ACADEMY_CHECKS.map((item) => (
            <li key={item.path} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-400">
                  {item.id} · {item.path}
                </p>
              </div>
              <a
                href={`${academyBase}${item.path}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-[#0F4C59] underline"
              >
                Open
              </a>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500">
          Demo email: <code>ada@example.com</code>
        </p>
      </section>
    </div>
  );
}
