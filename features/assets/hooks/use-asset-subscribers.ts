import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { assetKeys } from './query-keys';

const VIEW_SUBSCRIBED_CUSTOMERS_ON_ASSET_QUERY = graphql(`
  query ViewSubscribedCustomersOnAsset($assetName: String!, $assetType: String, $filter: String, $size: Int, $startDate: String, $endDate: String, $subscriberType: String) {
    viewSubscribedCustomersOnAsset(assetName: $assetName, assetType: $assetType, filter: $filter, size: $size, startDate: $startDate, endDate: $endDate, subscriberType: $subscriberType) {
      totalSubscribers
      userDetails {
        _id
        name
        email
        phone_number
        salesPerson
        assetName
        sizeBought
        unitPurchased
        landPrice
        landAmountPaid
        documentPrice
        documentAmountPaid
        month_subscription
        startDate
        nextPaymentDate
        isDefaulted
        isSuspended
      }
      unitSold
      earningReceived
      expectedEarning
      defaultedUsers
      suspendedUsers
      completedPayments
      totalPlotsSold
    }
  }
`);

interface UseAssetSubscribersParams {
  assetName: string;
  assetType: string;
  size?: number;
  startDate?: string;
  endDate?: string;
  subscriberType?: string;
}

export const useAssetSubscribers = (params: UseAssetSubscribersParams) => {
  const { assetName, assetType, ...filters } = params;

  return useQuery({
    queryKey: assetKeys.subscribers(assetName, assetType, filters),
    queryFn: () =>
      execute(VIEW_SUBSCRIBED_CUSTOMERS_ON_ASSET_QUERY, {
        assetName,
        assetType,
        size: filters.size,
        startDate: filters.startDate,
        endDate: filters.endDate,
        subscriberType: filters.subscriberType,
      }),
    select: (data) => data.viewSubscribedCustomersOnAsset,
    enabled: !!assetName && !!assetType,
  });
};

export type AssetSubscribersData = NonNullable<ReturnType<typeof useAssetSubscribers>['data']>;
