import { redirect } from "next/navigation";

/** Folded into the role pages. Kept so old links still land; the page moves surveyors to their own. */
export default async function StaffRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const { year, month } = await searchParams;
  const next = new URLSearchParams({ person: id, ...(year && { year }), ...(month && { month }) });
  redirect(`/field-performance/site-managers?${next.toString()}`);
}
