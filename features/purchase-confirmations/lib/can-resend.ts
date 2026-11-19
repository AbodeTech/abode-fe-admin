/**
 * Whether "Resend email" applies. A waiting purchase always can; a resolved one
 * can until the buyer confirms again, because a resolution ends the dispute but
 * does not ask the buyer to confirm (the BE sends that only on request).
 */
export function canResendConfirmation(row: {
  status: "waiting" | "confirmed" | "disputed" | "resolved";
  confirmedAt: string | null;
}): boolean {
  return row.status === "waiting" || (row.status === "resolved" && row.confirmedAt === null);
}
