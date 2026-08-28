"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import { UnresolvedRef } from "@/components/shared/UnresolvedRef";
import { FoPlanActions } from "@/features/asset-transactions";
import { formatNaira } from "@/lib/utils/format";

import { useCommercialPlan } from "../hooks/use-commercial-plans";
import { commercialAsset, commercialBuyer } from "../schemas/commercial-plan.schema";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm wrap-break-word">
        {value || <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

export function CommercialPlanDetail() {
  const params = useParams<{ id: string }>();
  const planId = params.id;
  const { data: plan, isLoading, error } = useCommercialPlan(planId);

  if (isLoading) {
    return <PageContentLoader label="Loading commercial plot plan…" />;
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading commercial plot plan</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!plan) return null;

  const buyer = commercialBuyer(plan);
  const asset = commercialAsset(plan);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="gap-2 px-0" asChild>
        <Link href="/commercial-plots">
          <ArrowLeft className="h-4 w-4" />
          Back to commercial plots
        </Link>
      </Button>

      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {asset.label || "Commercial plot plan"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Commercial purchases reuse the full-ownership plan model. Approve lives on the
          shared acquisition transaction routes; this page is the plan that exists after
          that.
        </p>
      </div>

      <section className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="font-medium">Buyer and asset</h2>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Buyer"
            value={
              <UnresolvedRef
                name={buyer.label || null}
                id={buyer.id}
                href={buyer.id ? `/users/${buyer.id}` : null}
                kind="buyer"
              />
            }
          />
          <Field
            label="Asset"
            value={
              <UnresolvedRef
                name={asset.label || null}
                id={asset.id}
                href={asset.id ? `/assets/${asset.id}` : null}
                kind="asset"
              />
            }
          />
          {plan.unique_asset_id ? (
            <Field label="Unique asset id" value={plan.unique_asset_id} />
          ) : null}
          {plan.amount_payable != null ? (
            <Field
              label="Amount payable"
              value={<span className="tabular-nums">{formatNaira(plan.amount_payable)}</span>}
            />
          ) : null}
        </div>
      </section>

      <FoPlanActions
        planId={planId}
        usePlan={useCommercialPlan}
        title="Commercial plot plan"
        allocateDescription="Commercial allocation is a single block and plot pair on the land plan, same as full ownership."
      />
    </div>
  );
}
