'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

import {
  AdminPickerRowSchema,
  FinancialOfficerSummarySchema,
} from '../schemas/financial-officer.schema';
import { financialOfficerKeys } from './query-keys';

/**
 * GET /admin/financial-officers — bare array, no pagination. Needs the view
 * permission (super admins only by default), so officers never call it.
 */
export const useFinancialOfficers = (enabled = true) =>
  useQuery({
    queryKey: financialOfficerKeys.list(),
    queryFn: () => apiGet('/admin/financial-officers', z.array(FinancialOfficerSummarySchema)),
    enabled,
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
 * GET /admin/financial-officers/me — any admin may call it; null when they
 * aren't an officer. Login doesn't return the admin's own `_id`, and officers
 * can't read the full list, so this is the only way an officer finds their id.
 */
export const useIsCurrentFinancialOfficer = (): {
  isOfficer: boolean;
  officerId: string | null;
  isLoading: boolean;
} => {
  const { data, isLoading } = useQuery({
    queryKey: financialOfficerKeys.me(),
    queryFn: () => apiGet('/admin/financial-officers/me', FinancialOfficerSummarySchema.nullable()),
  });

  const officerId = data?.officer?.id ?? null;
  return { isOfficer: !!officerId, officerId, isLoading };
};
