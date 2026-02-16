import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, Package, PieChart, ShoppingCart, Warehouse } from "lucide-react";
import { getAssetByName } from "@/lib/api/admin/assets";
import { AssetSizesInventory } from "./AssetSizesInventory";

interface Props {
  id: string;
  assetType: string;
}

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function AssetInventory({ id, assetType }: Props) {
  const data = await getAssetByName(decodeURIComponent(id), assetType);
  const contentData = data.viewAssetByName;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Asset Inventory</h2>

        {/* Main Inventory Card */}
        <Card className="mb-12 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-primary/5 dark:bg-primary/10">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Warehouse className="h-6 w-6" />
              Overall Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="flex items-center gap-4">
                <LayoutGrid className="h-10 w-10 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Sizes</p>
                  <p className="text-lg font-semibold">{contentData?.sizes?.join(", ") || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Package className="h-10 w-10 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Units</p>
                  <p className="text-lg font-semibold">{contentData?.available_unit ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <svg
                  className="h-10 w-10 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 11H8.5C7.67157 11 7 11.6716 7 12.5C7 13.3284 7.67157 14 8.5 14H15.5C16.3284 14 17 14.6716 17 15.5C17 16.3284 16.3284 17 15.5 17H10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 19V5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Value</p>
                  <p className="text-lg font-semibold">{formatNaira(contentData?.total_value ?? 0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ShoppingCart className="h-10 w-10 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Units Sold</p>
                  <p className="text-lg font-semibold">{contentData?.unit_sold ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <PieChart className="h-10 w-10 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expected Returns</p>
                  <p className="text-lg font-semibold">{formatNaira(contentData?.expected_return ?? 0)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <AssetSizesInventory id={id} assetType={assetType} />
      </div>
    </section>
  );
}
