import { z } from 'zod';

/* ============================================================
 * Ground confirmation — "Separate system allocation from ground
 * confirmation". Until this file, `PLOT_STATUS_LABELS`'s "System allocated"
 * label (block-plot.schema.ts) was the whole of that ticket: a relabel with
 * no real "Ground confirmed" data behind it anywhere in this codebase.
 *
 * 🚧 Provisional, fully greenfield — a per-plot field submission, distinct
 * from `Plot.status` (a DB flag set the instant POST .../allocate runs): this
 * is about ONE plot, confirmed on the ground by whoever visits it. A
 * submission is not authoritative until an admin verifies it in person.
 *
 * GET/POST /admin/plots/:plotId/ground-confirmation(/:id/verify).
 * ============================================================ */

export const GroundConfirmationSchema = z.object({
  _id: z.string(),
  plot_id: z.string(),
  submitted_by: z.string(),
  submitted_at: z.string(),
  verified_by: z.string().nullable(),
  verified_at: z.string().nullable(),
  notes: z.string().nullable(),
});

export type GroundConfirmation = z.infer<typeof GroundConfirmationSchema>;

export const submitGroundConfirmationFormSchema = z.object({
  notes: z.string().trim().optional(),
});

export type SubmitGroundConfirmationFormValues = z.infer<typeof submitGroundConfirmationFormSchema>;

/** A plot's real ground-confirmed status: at least one VERIFIED submission — matches lib/mocks/routes/assets.ts's isGroundConfirmed() exactly. */
export function isGroundConfirmed(history: Pick<GroundConfirmation, 'verified_at'>[]): boolean {
  return history.some((entry) => entry.verified_at !== null);
}
