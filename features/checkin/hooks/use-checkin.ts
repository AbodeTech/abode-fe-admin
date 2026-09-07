'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet, apiPost } from '@/lib/api-client';

import {
  CheckinResultSchema,
  CheckinSearchRowSchema,
  CheckinSessionSchema,
  CheckinStatsSchema,
} from '../schemas/checkin.schema';

const checkinKeys = {
  all: ['checkin'] as const,
  sessions: () => [...checkinKeys.all, 'sessions'] as const,
  stats: (id: string) => [...checkinKeys.all, 'stats', id] as const,
  search: (id: string, q: string) => [...checkinKeys.all, 'search', id, q] as const,
};

export function useCheckinSessions() {
  return useQuery({
    queryKey: checkinKeys.sessions(),
    queryFn: () => apiGet('/admin/checkin/sessions', z.array(CheckinSessionSchema)),
  });
}

export function useCheckinStats(sessionId: string) {
  return useQuery({
    queryKey: checkinKeys.stats(sessionId),
    queryFn: () =>
      apiGet(`/admin/checkin/sessions/${sessionId}/stats`, CheckinStatsSchema),
    enabled: Boolean(sessionId),
    refetchInterval: 5_000,
  });
}

export function useCheckinSearch(sessionId: string, q: string) {
  return useQuery({
    queryKey: checkinKeys.search(sessionId, q),
    queryFn: () =>
      apiGet(`/admin/checkin/sessions/${sessionId}/search`, z.array(CheckinSearchRowSchema), {
        params: { q },
      }),
    enabled: Boolean(sessionId) && q.trim().length >= 2,
  });
}

export function useCheckInAttendee(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { registration_id?: string; qr_payload?: string; force?: boolean }) =>
      apiPost(`/admin/checkin/sessions/${sessionId}/check-in`, input, CheckinResultSchema),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: checkinKeys.stats(sessionId) });
      void qc.invalidateQueries({ queryKey: [...checkinKeys.all, 'search', sessionId] });
    },
  });
}
