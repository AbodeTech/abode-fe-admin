import { redirect } from "next/navigation";

export default async function LegacyAgencyDetailAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/agency/lists/${id}`);
}
