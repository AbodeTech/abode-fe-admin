import { useMutation } from '@tanstack/react-query';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { parse } from 'graphql';
import { execute } from '@/lib/graphql-client';
import { allocationKeys } from './query-keys';
import type { FiltersInput } from '@/lib/gql/graphql';

/* ============================================================
 * Still GraphQL — this calls the old `eligibleClientsForLand` resolver, a
 * different backend path from the REST `GET /admin/allocation/eligible-clients`
 * the table now reads (use-allocation-clients.ts). Its row shape is the old
 * GraphQL `EligibleClient` type (camelCase), NOT `AllocationClient` from
 * schemas/allocation.schema.ts — the two are unrelated until export migrates
 * too, so don't reuse that type here.
 *
 * Fields inlined rather than spreading the table's fragment: the fragment
 * used to live in AllocationTable.tsx, which is REST now and no longer
 * defines it.
 *
 * Hand-parsed like use-allocate-land.ts, not `graphql()`: codegen can't reach
 * the GraphQL schema from this environment (the endpoint 404s on introspect —
 * the backend it pointed at is being retired as part of this migration), so
 * this file is excluded from codegen (see codegen.ts) and types are declared
 * by hand instead of generated.
 * ============================================================ */

export interface AllocationExportRow {
  allocation: string | null;
  allocationStatus: string | null;
  allocationDate: string | null;
  amountPaid: number | null;
  assetName: string | null;
  assetSize: number | null;
  assetType: string | null;
  duration: number | null;
  email: string;
  end_date: string | null;
  firstName: string;
  lastName: string;
  location: string | null;
  paymentPlan: string | null;
  paymentPercentage: string | number | null;
  phoneNumber: string | null;
  referral: string | null;
  referralStatus: string | null;
  totalPrice: number | null;
  unit: number | null;
}

const EXPORT_ALLOCATION_QUERY = parse(`
  query ExportEligibleClientsForLand($limit: Int!, $filters: FiltersInput) {
    eligibleClientsForLand(page: 1, limit: $limit, filters: $filters) {
      data {
        allocation
        allocationStatus
        allocationDate
        amountPaid
        assetName
        assetSize
        assetType
        duration
        email
        end_date
        firstName
        lastName
        location
        paymentPlan
        paymentPercentage
        phoneNumber
        referral
        referralStatus
        totalPrice
        unit
      }
      count
    }
  }
`) as unknown as TypedDocumentNode<
  { eligibleClientsForLand: { data: AllocationExportRow[]; count: number } },
  { limit: number; filters?: FiltersInput & { startDate?: string; endDate?: string } }
>;

interface AllocationExportParams {
  limit?: number;
  assetName?: string | null;
  assetType?: string | null;
  percentage?: number | null;
  search?: string | null;
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
