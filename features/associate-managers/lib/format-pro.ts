export const formatProCurrency = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

export const formatProDate = (iso: Date | string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatProRelativeOrDate = (iso: Date | string | null | undefined) => {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diffMs < hr) return `${Math.max(1, Math.round(diffMs / min))}m ago`;
  if (diffMs < day) return `${Math.round(diffMs / hr)}h ago`;
  if (diffMs < 7 * day) return `${Math.round(diffMs / day)}d ago`;
  return formatProDate(iso);
};

export const formatProFullName = (pro: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}) => {
  const name = `${pro.firstName ?? ""} ${pro.lastName ?? ""}`.trim();
  return name || pro.email || "Unknown";
};

export const formatPeriodRange = (period?: {
  start?: unknown;
  end?: unknown;
  month?: number | null;
  year?: number | null;
  periodType?: string | null;
} | null) => {
  if (!period?.start || !period?.end) return "selected period";
  const start = new Date(period.start as string);
  const end = new Date(period.end as string);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "selected period";
  }
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();
  if (sameMonth && period.month && period.year) {
    return start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return `${fmt(start)} – ${fmt(end)}`;
};
