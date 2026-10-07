import { redirect } from "next/navigation";

/** Folded into the role pages. Kept so old links still land; the page moves surveyors to their own. */
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
  redirect(`/field-performance/site-managers?${next.toString()}`);
}
