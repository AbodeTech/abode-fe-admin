import { useFragment as getFragmentData } from "@/lib/gql";
import { SuspendedPaymentPlansRowFragment } from "../components/suspended-payment-plans/SuspendedPaymentPlansTable";
import type { FragmentType } from "@/lib/gql";

type PlanRowRef = FragmentType<typeof SuspendedPaymentPlansRowFragment>;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const isFlexAssetType = (assetType: string | null | undefined) =>
  (assetType ?? "").trim().toLowerCase() === "flex";

export type TerminationPaymentPlansMetrics = {
  totalPlans: number;
  totalUnits: number;
  totalAmountPaid: number;
  totalOutstanding: number;
  flexPlans: number;
  fullOwnershipPlans: number;
};

export function parseTerminationPaymentPlanRows(
  plans: (PlanRowRef | null)[] | null | undefined
) {
  return (plans ?? [])
    .map((plan) => (plan != null ? getFragmentData(SuspendedPaymentPlansRowFragment, plan) : null))
    .filter((plan): plan is NonNullable<typeof plan> => plan != null);
}

export function computeTerminationPaymentPlansMetrics(
  rows: ReturnType<typeof parseTerminationPaymentPlanRows>,
  totalCount: number
): TerminationPaymentPlansMetrics {
  return rows.reduce<TerminationPaymentPlansMetrics>(
    (acc, row) => {
      const flex = isFlexAssetType(row.asset_type);
      return {
        totalPlans: totalCount,
        totalUnits: acc.totalUnits + (row.no_of_units ?? 0),
        totalAmountPaid: acc.totalAmountPaid + (row.amount_paid ?? 0),
        totalOutstanding: acc.totalOutstanding + (row.balance ?? 0),
        flexPlans: acc.flexPlans + (flex ? 1 : 0),
        fullOwnershipPlans: acc.fullOwnershipPlans + (flex ? 0 : 1),
      };
    },
    {
      totalPlans: totalCount,
      totalUnits: 0,
      totalAmountPaid: 0,
      totalOutstanding: 0,
      flexPlans: 0,
      fullOwnershipPlans: 0,
    }
  );
}

export function formatTerminationPaymentPlansMetricValue(
  key: keyof TerminationPaymentPlansMetrics,
  metrics: TerminationPaymentPlansMetrics
): string {
  switch (key) {
    case "totalAmountPaid":
    case "totalOutstanding":
      return formatCurrency(metrics[key]);
    default:
      return metrics[key].toLocaleString();
  }
}
