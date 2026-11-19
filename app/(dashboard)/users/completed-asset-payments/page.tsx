import { redirect } from "next/navigation";

/**
 * Users who have paid in full are a filter on All Users now. This route stays
 * so old links and bookmarks still land somewhere.
 */
export default function CompletedAssetPaymentsRedirect() {
  redirect("/users?hasCompletedAsset=true");
}
