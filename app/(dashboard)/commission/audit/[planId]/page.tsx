"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PlanAuditView } from "@/features/commission";

export default function CommissionAuditPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = use(params);

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="min-w-0">
        <Link
          href="/commission/audit"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Look up another plan
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Plan audit</h1>
        <p className="break-all font-mono text-sm text-muted-foreground">{planId}</p>
      </div>

      <PlanAuditView paymentPlanId={planId} />
    </div>
  );
}
