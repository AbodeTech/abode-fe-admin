'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet, apiPost } from '@/lib/api-client';

import { companyEventKeys } from './query-keys';

export const ConfirmationSheetRowSchema = z.object({
  attendance_id: z.string(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  pickup_location: z.string().nullable(),
  size_reserved: z.number(),
  eligibility_tier: z.string().nullable(),
  plots: z.string(),
  boarded: z.boolean(),
  given: z.boolean(),
  confirmed_at: z.string().nullable(),
});
const ConfirmationSheetSchema = z.object({
  event_id: z.string(),
  title: z.string(),
  date: z.string(),
  count: z.number(),
  rows: z.array(ConfirmationSheetRowSchema),
});
const SheetResultSchema = z.object({
  rows_received: z.number(),
  ticked: z.number(),
  newly_confirmed: z.number(),
  already_confirmed: z.number(),
  unmatched: z.array(z.string()),
  applied: z.boolean(),
});

export type ConfirmationSheetRow = z.infer<typeof ConfirmationSheetRowSchema>;
export type ConfirmationSheetResult = z.infer<typeof SheetResultSchema>;

export function useConfirmationSheet(eventId: string | undefined, pickupLocationId?: string) {
  return useQuery({
    queryKey: [...companyEventKeys.all, 'confirmation-sheet', eventId, pickupLocationId],
    queryFn: () => apiGet(`/admin/company-events/${eventId}/confirmation-sheet`, ConfirmationSheetSchema, {
      params: pickupLocationId ? { pickup_location_id: pickupLocationId } : undefined,
    }),
    enabled: !!eventId,
  });
}

export function useApplyConfirmationSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, rows, apply }: {
      eventId: string;
      rows: { attendance_id: string; given: boolean }[];
      apply: boolean;
    }) => apiPost(`/admin/company-events/${eventId}/confirmation-sheet`, { rows, apply }, SheetResultSchema),
    onSuccess: (result) => {
      if (result.applied) queryClient.invalidateQueries({ queryKey: companyEventKeys.all });
    },
  });
}
