"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Lookup, not a list — there is exactly one audit per payment plan, so an
 * index would just be the payment plans table under another name. The usual
 * route in is a commission payout row; this page covers support handing an
 * admin a plan ID directly.
 */
export default function CommissionAuditLookupPage() {
  const router = useRouter();
  const [planId, setPlanId] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const id = planId.trim();
    if (id) router.push(`/commission/audit/${id}`);
  };

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">Plan audit</h1>
        <p className="text-muted-foreground">
          Why a payment plan pays the commission it pays — the rates, recipients and overrides it
          froze at creation.
        </p>
      </div>

      <form onSubmit={submit} className="flex max-w-xl flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={planId}
            onChange={(event) => setPlanId(event.target.value)}
            className="pl-9 font-mono text-sm"
            placeholder="Payment plan ID"
            aria-label="Payment plan ID"
          />
        </div>
        <Button type="submit" disabled={!planId.trim()}>
          Look up
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        The usual way here is from a commission payout — each one links to the plan that produced
        it. Use this when you already have the plan&apos;s ID.
      </p>
    </div>
  );
}
