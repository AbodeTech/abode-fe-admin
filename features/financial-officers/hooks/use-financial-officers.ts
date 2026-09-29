'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

import {
  AdminPickerRowSchema,
  FinancialOfficerSummarySchema,
} from '../schemas/financial-officer.schema';
import { financialOfficerKeys } from './query-keys';

/** GET /admin/financial-officers — bare array, no pagination. */
export const useFinancialOfficers = () =>
  useQuery({
    queryKey: financialOfficerKeys.list(),
    queryFn: () => apiGet('/admin/financial-officers', z.array(FinancialOfficerSummarySchema)),
  });

/** GET /admin/admins — the picker source for promoting an officer. */
export const useFinancialOfficerAdminPicker = (enabled = true) =>
  useQuery({
    queryKey: financialOfficerKeys.adminPicker(),
    queryFn: () => apiGet('/admin/admins', z.array(AdminPickerRowSchema)),
    enabled,
  });

/**
 * Whether the logged-in admin is a Financial Officer, and which one.
 *
 * Matched by email, not id — `POST /auth/admin/login` doesn't return the
 * admin's own `_id` (same constraint as useIsCurrentCSManager).
 */
export const useIsCurrentFinancialOfficer = (): {
  isOfficer: boolean;
  officerId: string | null;
  isLoading: boolean;
} => {
  const { user } = useAuthStore();
  const { data, isLoading } = useFinancialOfficers();

  if (isLoading || !user?.email || !data) {
    return { isOfficer: false, officerId: null, isLoading };
  }

  const email = user.email.toLowerCase();
  const match = data.find((o) => o.officer?.email?.toLowerCase() === email);

  return { isOfficer: !!match, officerId: match?.officer?.id ?? null, isLoading: false };
};
