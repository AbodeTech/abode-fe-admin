import { useQuery } from '@tanstack/react-query';
import { executeRaw } from '@/lib/graphql-client';

const GET_USER_ANALYTICS_QUERY = `
  query GetUserAnalytics($startDate: String, $endDate: String) {
    getUserAnalytics(startDate: $startDate, endDate: $endDate) {
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

export interface UserAnalyticsResponse {
  getUserAnalytics: {
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
  };
}

interface UseUserAnalyticsParams {
  startDate?: string | null;
  endDate?: string | null;
}

export const useUserAnalytics = (params?: UseUserAnalyticsParams) => {
  const { startDate, endDate } = params ?? {};

  return useQuery({
    queryKey: ['users', 'analytics', { startDate, endDate }],
    queryFn: () =>
      executeRaw<UserAnalyticsResponse>(GET_USER_ANALYTICS_QUERY, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    select: (data) => data.getUserAnalytics,
  });
};
