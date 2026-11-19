/**
 * Whether "Resend email" applies. A waiting purchase always can. A resolved one
 * can too: `resolved` means the dispute was resolved and the buyer has not
 * confirmed since (once they do, the BE reports `confirmed`), and a resolution
 * does not itself ask the buyer to confirm again. The row's own `confirmed_at`
 * may be an older confirmation from before the dispute, so it is not consulted.
 */
export function canResendConfirmation(row: {
  status: "waiting" | "confirmed" | "disputed" | "resolved";
}): boolean {
  return row.status === "waiting" || row.status === "resolved";
}
