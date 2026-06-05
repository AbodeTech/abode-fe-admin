"use client";

import { EditFullOwnershipAssetForm, useAssets, useAssetDetails } from "@/features/assets";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAssetIdStore } from "@/store/assetid-store";

export default function EditFullOwnershipAssetPageClient({ assetName }: { assetName: string }) {
  const { assetId: storedAssetId, updateAssetId } = useAssetIdStore();
  const { data: assetsData, isLoading: isLoadingAssets } = useAssets({ limit: 5000 });
  const asset = assetsData?.data?.find(
    (a) => a != null && (a as { asset_name?: string }).asset_name === assetName
  ) as { _id?: string; asset_name?: string } | undefined;
  const assetId = storedAssetId || asset?._id;

  if (!storedAssetId && asset?._id) {
    updateAssetId(asset._id);
  }

  const { data: detailData, isLoading: isLoadingDetails, error } = useAssetDetails(assetId as string);

  const isLoading = isLoadingAssets || (!!assetId && isLoadingDetails);

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[40vh] w-full min-w-0 max-w-[1600px] items-center justify-center px-3 sm:px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assetId) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Asset not found</h3>
          <p>Could not find asset with name: {assetName}</p>
          <p className="mt-2 text-sm text-gray-500">Note: Ensure standard URL encoding rules apply.</p>
        </div>
      </div>
    );
  }

  if (error || !detailData) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading asset details</h3>
          <p>{(error as Error)?.message || "Failed to load details."}</p>
        </div>
      </div>
    );
  }

  const documents = detailData.documents || detailData.asset_documents || {};
  const formData = {
    id: detailData._id!,
    asset_name: detailData.asset_name!,
    asset_location: detailData.asset_location!,
    title: detailData.title!,
    asset_type: detailData.asset_type || "full-ownership",
    description: detailData.description!,
    allocation_qualification: detailData.basic_details?.[0]?.allocation_qualification || 0,
    amenities: (detailData.amenities || []).join(", "),
    asset_purpose: detailData.asset_purpose || "",
    google_map: detailData.google_map || detailData.gogle_map || "",
    landmark: (detailData.landmark || []).filter((l: unknown): l is string => typeof l === "string" && !!l).join(", "),
    estate_layout: documents?.estate_layout || "",
    asset_pictures: (detailData.asset_pictures || []).filter((p: unknown): p is string => typeof p === "string" && !!p),
    deed_of_assignment: documents?.deed_of_assignment || "",
    survey: documents?.survey || "",
    contract_of_sales: documents?.contract_of_sales || "",
    asset_option: (detailData.asset_option || []).map((opt: unknown) => ({
      size: (opt as { size?: number })?.size || 0,
      unit: (opt as { unit?: number })?.unit ? Number((opt as { unit?: number }).unit) : 0,
      price: (opt as { price?: number })?.price || 0,
      zero_months: (opt as { zero_months?: number })?.zero_months || 0,
      three_months: (opt as { three_months?: number })?.three_months || 0,
      six_months: (opt as { six_months?: number })?.six_months || 0,
      twelve_months: (opt as { twelve_months?: number })?.twelve_months || 0,
      one_month: (opt as { one_month?: number })?.one_month || 0,
      five_months: (opt as { five_months?: number })?.five_months || 0,
      seven_months: (opt as { seven_months?: number })?.seven_months || 0,
      development_fee: (opt as { development_fee?: number })?.development_fee || 0,
      initial_payment: (opt as { initial_payment?: number })?.initial_payment || 0,
      monthly_installment: (opt as { monthly_installment?: number })?.monthly_installment || 0,
      one_month_initial_payment: (opt as { one_month_initial_payment?: number })?.one_month_initial_payment || 0,
      five_months_initial_payment: (opt as { five_months_initial_payment?: number })?.five_months_initial_payment || 0,
      seven_months_initial_payment: (opt as { seven_months_initial_payment?: number })?.seven_months_initial_payment || 0,
    })),
    asset_history: detailData.asset_history
      ? Object.entries(detailData.asset_history).map(([year, value]) => ({
          year: parseInt(year),
          value: Number(value),
        }))
      : [],
  };

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" className="shrink-0" asChild>
          <Link href={`/assets/fullownership/${encodeURIComponent(assetName)}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Edit Full Ownership Asset</h1>
          <p className="break-words text-muted-foreground">{assetName}</p>
        </div>
      </div>

      <div className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-6">
        <EditFullOwnershipAssetForm initialData={formData} />
      </div>
    </div>
  );
}
