"use client";

import { EditFullOwnershipAssetForm, useAssets, useAssetDetails } from "@/features/assets";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAssetIdStore } from "@/store/assetid-store";

export default function EditFullOwnershipAssetPageClient({ assetName }: { assetName: string }) {
  const { assetId: storedAssetId, updateAssetId } = useAssetIdStore();
  const { data: assetsData, isLoading: isLoadingAssets } = useAssets({ limit: 5000 });
  const asset = assetsData?.data?.find((a: any) => a.asset_name === assetName);
  const assetId = storedAssetId || asset?._id;

  if (!storedAssetId && asset?._id) {
    updateAssetId(asset._id);
  }

  const { data: detailData, isLoading: isLoadingDetails, error } = useAssetDetails(assetId as string);

  const isLoading = isLoadingAssets || (!!assetId && isLoadingDetails);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assetId) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Asset not found</h3>
        <p>Could not find asset with name: {assetName}</p>
        <p className="text-sm mt-2 text-gray-500">Note: Ensure standard URL encoding rules apply.</p>
      </div>
    );
  }

  if (error || !detailData) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading asset details</h3>
        <p>{(error as Error)?.message || "Failed to load details."}</p>
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
    landmark: (detailData.landmark || []).filter((l: any): l is string => !!l).join(", "),
    estate_layout: documents?.estate_layout || "",
    asset_pictures: (detailData.asset_pictures || []).filter((p: any): p is string => !!p),
    deed_of_assignment: documents?.deed_of_assignment || "",
    survey: documents?.survey || "",
    contract_of_sales: documents?.contract_of_sales || "",
    asset_option: (detailData.asset_option || []).map((opt: any) => ({
      size: opt?.size || 0,
      unit: opt?.unit ? Number(opt.unit) : 0,
      price: opt?.price || 0,
      zero_months: opt?.zero_months || 0,
      three_months: opt?.three_months || 0,
      six_months: opt?.six_months || 0,
      twelve_months: opt?.twelve_months || 0,
      one_month: opt?.one_month || 0,
      five_months: opt?.five_months || 0,
      seven_months: opt?.seven_months || 0,
      development_fee: opt?.development_fee || 0,
      initial_payment: opt?.initial_payment || 0,
      monthly_installment: opt?.monthly_installment || 0,
      one_month_initial_payment: opt?.one_month_initial_payment || 0,
      five_months_initial_payment: opt?.five_months_initial_payment || 0,
      seven_months_initial_payment: opt?.seven_months_initial_payment || 0,
    })),
    asset_history: detailData.asset_history
      ? Object.entries(detailData.asset_history).map(([year, value]) => ({
          year: parseInt(year),
          value: Number(value),
        }))
      : [],
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/assets/fullownership/${encodeURIComponent(assetName)}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Full Ownership Asset</h1>
          <p className="text-muted-foreground">{assetName}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <EditFullOwnershipAssetForm initialData={formData} />
      </div>
    </div>
  );
}
