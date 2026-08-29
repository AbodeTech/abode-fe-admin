import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { UserAnalyticsSchema, type LabelCount } from '../schemas/user.schema';
import { bothOrNeitherDates } from '../utils/admin-users-query';
import { userKeys } from './query-keys';

export type AnalyticsDataPoint = LabelCount;

export interface RegistrationTrendPoint {
  month: string;
  count: number;
}

export interface HowYouHeardPoint {
  source: string;
  count: number;
}

/** UI shape — mapped from UserAnalyticsDto so charts keep camelCase keys. */
export interface UserAnalyticsData {
  totalUsers: number;
  referredCount: number;
  notReferredCount: number;
  referredPercentage: number;
  notReferredPercentage: number;
  acquisition: {
    registrationTrend: RegistrationTrendPoint[];
    howYouHeard: HowYouHeardPoint[];
  };
  demographics: {
    gender: AnalyticsDataPoint[];
    ageGroups: AnalyticsDataPoint[];
    maritalStatus: AnalyticsDataPoint[];
    locations: AnalyticsDataPoint[];
    employmentStatus: AnalyticsDataPoint[];
    educationLevel: AnalyticsDataPoint[];
    experienceLevel: AnalyticsDataPoint[];
    topOccupations: AnalyticsDataPoint[];
  };
}

interface UseUserAnalyticsParams {
  startDate?: string | null;
  endDate?: string | null;
  userStatus?: string | null;
}

const toOptional = (value?: string | null) => {
  if (!value || value === 'all') return undefined;
  return value;
};

/**
 * GET /admin/users/analytics — requires `view_user_analytics`.
 * Query: date_from, date_to, user_status (tier).
 */
export const useUserAnalytics = (params?: UseUserAnalyticsParams) => {
  const dateRange = bothOrNeitherDates(params?.startDate, params?.endDate);
  const userStatus = toOptional(params?.userStatus);

  return useQuery({
    queryKey: userKeys.analytics({
      dateFrom: dateRange.date_from,
      dateTo: dateRange.date_to,
      userStatus,
    }),
    queryFn: () =>
      apiGet('/admin/users/analytics', UserAnalyticsSchema, {
        params: {
          ...dateRange,
          user_status: userStatus,
        },
      }),
    select: (data): UserAnalyticsData => ({
      totalUsers: data.totals.total_users,
      referredCount: data.totals.referred,
      notReferredCount: data.totals.not_referred,
      referredPercentage: data.totals.referred_percentage,
      notReferredPercentage: data.totals.not_referred_percentage,
      acquisition: {
        registrationTrend: data.registration_trend,
        howYouHeard: data.acquisition.sources,
      },
      demographics: {
        gender: data.demographics.gender,
        ageGroups: data.demographics.age_buckets,
        maritalStatus: data.demographics.marital_status,
        locations: data.demographics.location,
        employmentStatus: data.demographics.employment_status,
        educationLevel: data.demographics.education_level,
        experienceLevel: data.demographics.experience_level,
        topOccupations: data.demographics.occupations,
      },
    }),
  });
};
