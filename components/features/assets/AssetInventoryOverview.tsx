import { StatCard } from "@/components/features/assets/StatCard";
import { Boxes, Box, BoxSelect } from "lucide-react";
import { AssetInventoryData } from "@/lib/api/admin/assets";

interface Props {
  data: AssetInventoryData['getAssetInventoryData']['statistics'] | null;
}

export function AssetInventoryOverview({ data }: Props) {
  const inventoryData = data
    ? [
      { title: "Total Assets", value: data.totalAssets, subValue: data.totalWorth, icon: Boxes },
      { title: "Flex Assets", value: data.totalFlexAssets, subValue: data.totalFlexWorth, icon: Box },
      { title: "Full Ownership Assets", value: data.totalFullOwnershipAssets, subValue: data.totalFullOwnershipWorth, icon: BoxSelect },
    ]
    : [
      { title: "Total Assets", value: 0, subValue: 0, icon: Boxes },
      { title: "Flex Assets", value: 0, subValue: 0, icon: Box },
      { title: "Full Ownership Assets", value: 0, subValue: 0, icon: BoxSelect },
    ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {inventoryData.map((item, index) => (
        <StatCard key={index} title={item.title} value={item.value} subValue={item.subValue} icon={item.icon} />
      ))}
    </div>
  );
}
