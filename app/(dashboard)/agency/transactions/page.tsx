import { redirect } from "next/navigation";

/**
 * v1's agency wallet feed. v2's nearest equivalent is the per-agency
 * commission ledger, which lives on the agency detail page — so this routes
 * to the list to pick an agency first.
 */
export default function AgencyTransactionsPage() {
  redirect("/agency/lists");
}
