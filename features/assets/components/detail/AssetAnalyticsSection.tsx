"use client";

import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAssetIdStore } from "@/store/assetid-store";
import { useAssetAnalytics } from "@/features/assets/hooks/use-assets";
import { AssetHealthBar } from "./AssetHealthBar";
import { PaymentPlanMatrix } from "./PaymentPlanMatrix";

export function AssetAnalyticsSection() {
  const { assetId } = useAssetIdStore();
  const searchParams = useSearchParams();

  const startDate = searchParams.get("start_date") ?? undefined;
  const endDate = searchParams.get("end_date") ?? undefined;
  const filter = startDate && endDate ? "custom" : "all_time";

  const { data, isLoading, error } = useAssetAnalytics({
    assetId: assetId ?? "",
    filter,
    startDate,
    endDate,
  });

  if (!assetId) {
    return (
      <div className="mb-8 rounded-2xl border bg-muted/20 p-8 text-center text-muted-foreground text-sm">
        Asset details unavailable. Please navigate from the assets list.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mb-8 flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 p-4 rounded-xl bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading asset analytics</h3>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <>
      <AssetHealthBar data={data} />
      <PaymentPlanMatrix data={data} />
    </>
  );
}
