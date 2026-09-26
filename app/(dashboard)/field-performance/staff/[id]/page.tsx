import { redirect } from "next/navigation";

/** Folded into /field-performance. Kept so old links still land; the page fixes the role tab itself. */
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
  redirect(`/field-performance?${next.toString()}`);
}
