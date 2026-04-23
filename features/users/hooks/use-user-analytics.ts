import { useQuery } from '@tanstack/react-query';
import { executeRaw } from '@/lib/graphql-client';

const GET_USER_ANALYTICS_QUERY = `
  query GetUserAnalytics($startDate: String, $endDate: String, $userStatus: String) {
    getUserAnalytics(startDate: $startDate, endDate: $endDate, userStatus: $userStatus) {
      totalUsers
      referredCount
      notReferredCount
      referredPercentage
      notReferredPercentage
      acquisition {
        registrationTrend {
          month
          count
        }
        howYouHeard {
          source
          count
        }
      }
      demographics {
        gender { label count }
        ageGroups { label count }
        maritalStatus { label count }
        locations { label count }
        employmentStatus { label count }
        educationLevel { label count }
        experienceLevel { label count }
        topOccupations { label count }
      }
    }
  }
`;

export interface AnalyticsDataPoint {
  label: string;
  count: number;
}

export interface RegistrationTrendPoint {
  month: string;
  count: number;
}

export interface HowYouHeardPoint {
  source: string;
  count: number;
}

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

interface UserAnalyticsResponse {
  getUserAnalytics: UserAnalyticsData;
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

export const useUserAnalytics = (params?: UseUserAnalyticsParams) => {
  const startDate = toOptional(params?.startDate);
  const endDate = toOptional(params?.endDate);
  const userStatus = toOptional(params?.userStatus);

  return useQuery({
    queryKey: ['users', 'analytics', { startDate, endDate, userStatus }],
    queryFn: () =>
      executeRaw<UserAnalyticsResponse>(GET_USER_ANALYTICS_QUERY, {
        startDate,
        endDate,
        userStatus,
      }),
    select: (data) => data.getUserAnalytics,
  });
};
