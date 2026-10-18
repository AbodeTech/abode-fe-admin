import { redirect } from "next/navigation";

/**
 * Split into /field-performance/site-managers and /surveyors. Kept so old
 * links (including `?role=surveyor`) still land on the right page; a person
 * link without a role lands on Site Managers and the page moves it if needed.
 */
export default async function FieldPerformanceRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { role, ...rest } = await searchParams;
  const next = new URLSearchParams(
    Object.entries(rest).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
  const path = role === "surveyor" ? "/field-performance/surveyors" : "/field-performance/site-managers";
  const query = next.toString();
  redirect(query ? `${path}?${query}` : path);
}
