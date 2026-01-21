import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Package, PieChart, ShoppingCart } from "lucide-react";
import { getAssetOptionDataByName } from "@/lib/api/admin/assets";

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

export async function AssetSizesInventory({ id, assetType }: Props) {
  const data = await getAssetOptionDataByName(decodeURIComponent(id), assetType);
  const sizeData = data.viewAssetOptionDataByName.sizes || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {sizeData.map((size, index) => (
        <Card key={index} className="shadow-md hover:shadow-lg transition-shadow duration-300 relative">
          {size?.available_unit === 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              Sold Out
            </div>
          )}
          <CardHeader className="bg-secondary/10 dark:bg-secondary/20">
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {size?.size} sqm
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Units</p>
                  <p className="text-lg font-semibold">{size.available_unit}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <svg
                  className="h-5 w-5 text-secondary"
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
                  <p className="text-lg font-semibold">{formatNaira(size.value)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Units Sold</p>
                  <p className="text-lg font-semibold">{size.unit_sold}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PieChart className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expected Returns</p>
                  <p className="text-lg font-semibold">{formatNaira(size.expected_return)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
