"use client";

import { EditFlexAssetForm, useAssets, useAssetDetails } from "@/features/assets";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAssetIdStore } from "@/store/assetid-store";

export default function EditFlexAssetPageClient({ assetName }: { assetName: string }) {
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

  const formData = {
    id: detailData._id!,
    asset_name: detailData.asset_name!,
    asset_location: detailData.asset_location!,
    title: detailData.title!,
    asset_type: detailData.asset_type || "flex",
    description: detailData.description!,
    allocation_qualification: detailData.basic_details?.[0]?.allocation_qualification || 0,
    amenities: (detailData.amenities || []).join(", "),
    estate_layout: detailData.documents?.estate_layout || "",
    asset_pictures: (detailData.asset_pictures || []).filter((p: unknown): p is string => typeof p === "string" && !!p),
    deed_of_assignment: detailData.documents?.deed_of_assignment || "",
    survey: detailData.documents?.survey || "",
    contract_of_sales: detailData.documents?.contract_of_sales || "",
    asset_option: (detailData.asset_option || []).map((opt: unknown) => ({
      size: (opt as { size?: number })?.size || 0,
      flex_payment_plans: ((opt as { flex_payment_plans?: unknown[] }).flex_payment_plans || []).map((plan: unknown) => ({
        description: (plan as { description?: string })?.description || "",
        duration_months: (plan as { duration_months?: number })?.duration_months || 0,
        initial_payment: (plan as { initial_payment?: number })?.initial_payment || 0,
        monthly_installment: (plan as { monthly_installment?: number })?.monthly_installment || 0,
        price: (plan as { price?: number })?.price || 0,
        unit: (plan as { unit?: number })?.unit || 0,
      })),
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
          <Link href={`/assets/flex/${encodeURIComponent(assetName)}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Edit Flex Asset</h1>
          <p className="break-words text-muted-foreground">{assetName}</p>
        </div>
      </div>

      <div className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-6">
        <EditFlexAssetForm initialData={formData} />
      </div>
    </div>
  );
}
