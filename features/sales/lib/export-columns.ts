/**
 * The name and address the buyer wants on their documents (from the asset
 * questions). Ops reconciles documents against these, so they belong in every
 * sales download by default.
 */
export const DOCUMENT_COLUMNS = ["nameOnDocument", "addressOnDocument"] as const;

/**
 * Add any missing document column to a saved column order, right after the
 * contact columns (phone, else email, else name; else at the end).
 *
 * A saved order — last used, or a template — is restored as-is and wins over
 * the defaults, so a column added later never reaches anyone who had already
 * exported. Returns the same array when nothing is missing.
 */
export const withDocumentColumns = (order: string[]): string[] => {
  const missing = DOCUMENT_COLUMNS.filter((c) => !order.includes(c));
  if (missing.length === 0) return order;
  const anchor = ["phone", "email", "name"]
    .map((k) => order.indexOf(k))
    .find((i) => i >= 0);
  const at = anchor === undefined ? order.length : anchor + 1;
  return [...order.slice(0, at), ...missing, ...order.slice(at)];
};
