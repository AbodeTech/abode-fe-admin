"use client";

/** ABO-22 shell — ON HOLD with ABO-22–26. */
export default function CompanyEventsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Company Events</h1>
        <p className="mt-1 text-sm text-slate-500">
          Site inspections and allocation days — ON HOLD (ABO-22–26).
        </p>
      </div>

      <div className="rounded-xl border border-dashed bg-white p-10 text-center">
        <p className="font-medium text-slate-900">Company events on hold</p>
        <p className="mt-2 text-sm text-slate-500">
          ABO-22–26 are deferred. Use Check-in for physical recruitment sessions in the meantime.
        </p>
      </div>
    </div>
  );
}
