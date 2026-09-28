import { redirect } from "next/navigation";

/** Folded into /field-performance. Kept so old links still land. */
export default async function SiteRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; assetId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id, assetId } = await params;
  const { year, month } = await searchParams;
  const next = new URLSearchParams({ person: id, site: assetId, ...(year && { year }), ...(month && { month }) });
  redirect(`/field-performance?${next.toString()}`);
}
