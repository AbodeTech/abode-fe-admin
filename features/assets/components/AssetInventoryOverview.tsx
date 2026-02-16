import { StatCard } from "@/features/assets/components/StatCard";
import { Boxes, Box, BoxSelect } from "lucide-react";
import { graphql, FragmentType, useFragment } from "@/lib/gql";

export const AssetInventoryOverviewFragment = graphql(`
  fragment AssetInventoryOverview_statistics on AssetInventoryStatistics {
    totalAssets
    totalWorth
    totalFlexAssets
    totalFlexWorth
    totalFullOwnershipAssets
    totalFullOwnershipWorth
  }
`);

interface Props {
  data: FragmentType<typeof AssetInventoryOverviewFragment> | null | undefined;
}

export function AssetInventoryOverview({ data }: Props) {
  const inventoryData = useFragment(AssetInventoryOverviewFragment, data);

  const items = inventoryData
    ? [
      { title: "Total Assets", value: inventoryData.totalAssets ?? 0, subValue: inventoryData.totalWorth ?? 0, icon: Boxes },
      { title: "Flex Assets", value: inventoryData.totalFlexAssets ?? 0, subValue: inventoryData.totalFlexWorth ?? 0, icon: Box },
      { title: "Full Ownership Assets", value: inventoryData.totalFullOwnershipAssets ?? 0, subValue: inventoryData.totalFullOwnershipWorth ?? 0, icon: BoxSelect },
    ]
    : [
      { title: "Total Assets", value: 0, subValue: 0, icon: Boxes },
      { title: "Flex Assets", value: 0, subValue: 0, icon: Box },
      { title: "Full Ownership Assets", value: 0, subValue: 0, icon: BoxSelect },
    ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item, index) => (
        <StatCard key={index} title={item.title} value={item.value} subValue={item.subValue} icon={item.icon} />
      ))}
    </div>
  );
}
