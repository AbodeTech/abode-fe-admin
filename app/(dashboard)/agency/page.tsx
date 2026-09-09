import { redirect } from "next/navigation";

/**
 * The sidebar's "Agency" entry.
 *
 * This was the v1 agency dashboard (clients recruited, land value sold, top
 * selling lands). abode-be-v2 exposes no agency aggregate endpoint, so the
 * agency list — which carries the counts that *are* derivable — is the
 * landing page until one exists.
 */
export default function AgencyIndexPage() {
  redirect("/agency/lists");
}
