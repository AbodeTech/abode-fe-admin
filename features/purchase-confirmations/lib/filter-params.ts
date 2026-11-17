/** Status the page shows when the URL has none. */
export const DEFAULT_CONFIRMATION_STATUS = "disputed";

/**
 * Applies one filter change to the page's URL params and resets pagination.
 * A value is left out of the URL only when it is that filter's default:
 * "disputed" for status (the page's default), "all" for the rest. Dropping
 * `status=all` would land the reader back on Disputed.
 */
export function applyConfirmationFilter(
  current: URLSearchParams,
  key: string,
  value: string
): URLSearchParams {
  const params = new URLSearchParams(current);
  const isDefault = key === "status" ? value === DEFAULT_CONFIRMATION_STATUS : value === "all";
  if (value && !isDefault) params.set(key, value);
  else params.delete(key);
  params.delete("page");
  return params;
}
