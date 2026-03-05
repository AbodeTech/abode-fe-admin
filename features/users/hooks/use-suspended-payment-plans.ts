import { useQuery, useMutation } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql, useFragment as getFragmentData } from '@/lib/gql';
import { userKeys } from './query-keys';
import { exportToCsv } from '../utils/export-csv';
import { SuspendedPaymentPlansRowFragment } from '../components/suspended-payment-plans/SuspendedPaymentPlansTable';


const GET_SUSPENDED_PAYMENT_PLANS_QUERY = graphql(`
  query GetSuspendedPaymentPlans($page: Int!, $limit: Int!, $searchQuery: String, $assetType: String) {
    getSuspendedPaymentPlans(page: $page, limit: $limit, searchQuery: $searchQuery, assetType: $assetType) {
      count
      data {
        ...SuspendedPaymentPlansRow_plan
      }
    }
  }
`);


const EXPORT_SUSPENDED_PAYMENT_PLANS_QUERY = graphql(`
  query ExportSuspendedPaymentPlans($page: Int!, $limit: Int!, $searchQuery: String, $assetType: String) {
    getSuspendedPaymentPlans(page: $page, limit: $limit, searchQuery: $searchQuery, assetType: $assetType) {
      data {
        ...SuspendedPaymentPlansRow_plan
      }
    }
  }
`);

export const SUSPENDED_PAYMENT_PLANS_PAGE_SIZE = 25;
const EXPORT_LIMIT = 1_000_000;

export const useSuspendedPaymentPlans = (params: { page?: number; limit?: number; searchQuery?: string | null; assetType?: string | null }) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? SUSPENDED_PAYMENT_PLANS_PAGE_SIZE;
  const searchQuery = params.searchQuery ?? null;
  const assetType = params.assetType ?? null;

  return useQuery({
    queryKey: userKeys.list({ page, limit, searchQuery, assetType, list: 'suspended-payment-plans' }),
    queryFn: () =>
      execute(GET_SUSPENDED_PAYMENT_PLANS_QUERY, {
        page,
        limit,
        searchQuery,
        assetType,
      }),
    select: (data) => data.getSuspendedPaymentPlans,
  });
};

export const useExportSuspendedPaymentPlans = () => {
  return useMutation({
    mutationFn: (filters: { searchQuery?: string | null; assetType?: string | null }) =>
      execute(EXPORT_SUSPENDED_PAYMENT_PLANS_QUERY, {
        page: 1,
        limit: EXPORT_LIMIT,
        searchQuery: filters.searchQuery ?? null,
        assetType: filters.assetType ?? null,
      }),
    onSuccess: (data) => {
      const plansRaw = data.getSuspendedPaymentPlans?.data ?? [];
      const rows = plansRaw.map((plan) => getFragmentData(SuspendedPaymentPlansRowFragment, plan));
      const validRows = rows.filter((plan): plan is NonNullable<typeof plan> => plan !== null && plan !== undefined);

      if (!validRows.length) return;

      exportToCsv(validRows, [
        { header: 'First Name', accessor: (r) => r.firstName },
        { header: 'Last Name', accessor: (r) => r.lastName },
        { header: 'Email', accessor: (r) => r.email },
        { header: 'Phone Number', accessor: (r) => r.phoneNumber },
        { header: 'Referrer', accessor: (r) => r.referrer },
        { header: 'Asset Name', accessor: (r) => r.asset_name },
        { header: 'Size', accessor: (r) => r.size },
        { header: 'Asset Type', accessor: (r) => r.asset_type },
        { header: 'No. of Units', accessor: (r) => r.no_of_units },
        { header: 'Amount Paid', accessor: (r) => r.amount_paid },
        { header: 'Amount Left', accessor: (r) => r.balance },
        { header: 'Start Date', accessor: (r) => r.start_date },
        { header: 'End Date', accessor: (r) => r.next_date },
      ], 'suspended-payment-plans.csv');
    },
  });
};
