import { EditFlexAssetForm, useAssetByName, useAssets, useAssetDetails } from "@/features/assets";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFlexAssetPage({ params }: PageProps) {
  const { id } = await params;
  const assetName = decodeURIComponent(id);

  return <EditFlexAssetPageClient assetName={assetName} />;
}

function EditFlexAssetPageClient({ assetName }: { assetName: string }) {
  // 1. Fetch all assets to find ID by name
  const { data: assetsData, isLoading: isLoadingAssets } = useAssets({ limit: 5000 });
  const asset = assetsData?.data?.find((a: any) => a.asset_name === assetName);
  const assetId = asset?._id;

  // 2. Fetch details using ID
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

  // Transform data for form
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
    asset_pictures: (detailData.asset_pictures || []).filter((p): p is string => !!p),
    deed_of_assignment: detailData.documents?.deed_of_assignment || "",
    survey: detailData.documents?.survey || "",
    contract_of_sales: detailData.documents?.contract_of_sales || "",
    asset_option: (detailData.asset_option || []).map((opt) => ({
      size: opt?.size || 0,
      flex_payment_plans: (opt?.flex_payment_plans || []).map((plan) => ({
        description: plan?.description || "",
        duration_months: plan?.duration_months || 0,
        initial_payment: plan?.initial_payment || 0,
        monthly_installment: plan?.monthly_installment || 0,
        price: plan?.price || 0,
        unit: plan?.unit || 0,
      })),
    })),
    asset_history: detailData.asset_history ? Object.entries(detailData.asset_history).map(([year, value]) => ({
      year: parseInt(year),
      value: Number(value),
    })) : [],
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/assets/flex/${encodeURIComponent(assetName)}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Flex Asset</h1>
          <p className="text-muted-foreground">{assetName}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <EditFlexAssetForm initialData={formData} />
      </div>
    </div>
  );
}
