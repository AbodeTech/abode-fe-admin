'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiPatch, apiPost } from '@/lib/api-client';

import { companyEventKeys } from './query-keys';

const RegisterResultSchema = z.looseObject({ registered: z.boolean(), pass_sent: z.boolean(), waitlisted: z.boolean() });
const PickupResultSchema = z.looseObject({ updated: z.boolean(), pass_sent: z.boolean().optional() });

export function useRegisterAttendeeOnBehalf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, registrationId, ...body }: {
      eventId: string;
      registrationId: string;
      pickup_location_id?: string;
      category?: 'associate_pro' | 'associate' | 'client';
      name?: string;
      phone?: string;
      email?: string;
    }) => apiPost(`/admin/company-events/${eventId}/registrations/${registrationId}/register`, body, RegisterResultSchema),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyEventKeys.all }),
  });
}

export function useChangeAttendeePickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, registrationId, pickup_location_id, notify }: {
      eventId: string;
      registrationId: string;
      pickup_location_id: string;
      notify: boolean;
    }) => apiPatch(`/admin/company-events/${eventId}/registrations/${registrationId}/pickup`, { pickup_location_id, notify }, PickupResultSchema),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyEventKeys.all }),
  });
}
