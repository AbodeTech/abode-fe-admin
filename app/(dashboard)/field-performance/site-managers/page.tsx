import { redirect } from "next/navigation";

/** Folded into /field-performance. Kept so old links still land. */
export default async function SiteManagersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { year, month } = await searchParams;
  const params = new URLSearchParams({ role: "site_manager", ...(year && { year }), ...(month && { month }) });
  redirect(`/field-performance?${params.toString()}`);
}
