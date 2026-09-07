"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

/** ABO-23 shell */
export default function CompanyEventNewPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <Link href="/company-events" className="text-xs text-slate-500 hover:underline">
        ← Company Events
      </Link>
      <h1 className="text-xl font-semibold">New company event</h1>
      <p className="text-sm text-slate-500">
        ABO-23 — estate, date, type (site inspection / allocation day), registration status,
        pickup points with seat limits. Form lands when BE create APIs are ready.
      </p>
      <Button variant="outline" asChild>
        <Link href="/company-events">Back</Link>
      </Button>
    </div>
  );
}
