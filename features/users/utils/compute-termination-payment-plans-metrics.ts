const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

export type TerminationPaymentPlansMetrics = {
  totalPlans: number;
  totalUnits: number;
  totalAmountPaid: number;
  totalOutstanding: number;
  flexPlans: number;
  fullOwnershipPlans: number;
};

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
