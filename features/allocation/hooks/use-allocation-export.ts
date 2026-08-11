import { useMutation } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { allocationKeys } from './query-keys';
import { FiltersInput } from '@/lib/gql/graphql';

const EXPORT_ALLOCATION_QUERY = graphql(`
  query ExportEligibleClientsForLand($limit: Int!, $filters: FiltersInput) {
    eligibleClientsForLand(page: 1, limit: $limit, filters: $filters) {
      data {
        ...AllocationTableRowFragment
      }
      count
    }
  }
`);

interface AllocationExportParams {
  limit?: number;
  assetName?: string | null;
  assetType?: string | null;
  percentage?: number | null;
  search?: string | null;
  allocationStatus?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export const useAllocationExport = () => {
  return useMutation({
    mutationKey: allocationKeys.export(),
    mutationFn: (params: AllocationExportParams) => {
      const gqlFilters = {
        assetName: params.assetName || undefined,
        assetType: params.assetType || undefined,
        percentage: params.percentage ?? undefined,
        search: params.search || undefined,
        allocationStatus: params.allocationStatus || undefined,
        // API supports date range for this endpoint; generated FiltersInput is currently stale.
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
      };

      return execute(EXPORT_ALLOCATION_QUERY, {
        limit: params.limit ?? 1_000_000,
        filters: gqlFilters as FiltersInput & { startDate?: string; endDate?: string },
      });
    },
  });
};
