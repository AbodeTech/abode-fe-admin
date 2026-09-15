"use client";

import Link from "next/link";

import { CompanyEventForm } from "@/features/company-events";

export default function CompanyEventNewPage() {
  return (
    <div className="w-full max-w-2xl space-y-4 p-4 md:p-6">
      <Link href="/company-events" className="text-xs text-slate-500 hover:underline">
        ← Company Events
      </Link>
      <div>
        <h1 className="text-xl font-semibold">New company event</h1>
        <p className="mt-1 text-sm text-slate-500">
          Site inspections need only a site, date, and time. Allocation days also set a target
          size and pickup locations for the eligibility batch.
        </p>
      </div>
      <CompanyEventForm />
    </div>
  );
}
