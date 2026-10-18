import { redirect } from "next/navigation";

/**
 * v1 ranked agencies by sales volume, which abode-be-v2 does not expose.
 * Commission rate is the only performance-adjacent field the list can sort
 * on, so this lands there rather than on a screen of zeroes.
 */
export default function TopPerformingAgenciesPage() {
  redirect("/agency/lists?sort=commission_percentage&order=desc");
}
