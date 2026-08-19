import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * The per-manager dashboard moved to /customer-managers?manager=<id> (the
 * manager is picked from a dropdown now, APM-style). Kept as a redirect so
 * existing links and bookmarks still land on the right manager.
 */
export default async function CustomerManagerDetailRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/customer-managers?manager=${encodeURIComponent(id)}`);
}
