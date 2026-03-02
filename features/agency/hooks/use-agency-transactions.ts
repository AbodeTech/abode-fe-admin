import { useQuery } from "@tanstack/react-query";

import { executeRaw } from "@/lib/graphql-client";
import { agencyKeys } from "./query-keys";

const GET_AGENCY_TRANSACTIONS = `
  query GetAgencyTransactions($agencyId: ID!) {
    getAgencyTransactions(agencyId: $agencyId) {
      _id
      time_of_transaction
      amount
      type
      status
      description
      transaction_type
      paystack_reference
      transfer_reference
      transfer_file {
        file
        amount
      }
    }
  }
`;

export interface AgencyWalletTransactionRow {
  _id: string;
  time_of_transaction?: string | null;
  amount?: number | null;
  type?: string | null;
  status?: string | null;
  description?: string | null;
  transaction_type?: string | null;
  paystack_reference?: string | null;
  transfer_reference?: string | null;
  transfer_file?: {
    file?: string | null;
    amount?: number | null;
  } | null;
}

interface AgencyTransactionsResponse {
  getAgencyTransactions?: Array<AgencyWalletTransactionRow | null> | null;
}

export const useAgencyTransactions = (agencyId: string) => {
  return useQuery({
    queryKey: agencyKeys.transactions(agencyId),
    queryFn: () =>
      executeRaw<AgencyTransactionsResponse>(GET_AGENCY_TRANSACTIONS, {
        agencyId,
      }),
    enabled: Boolean(agencyId),
    select: (data) =>
      (data.getAgencyTransactions ?? []).filter(
        (item): item is AgencyWalletTransactionRow => Boolean(item?._id)
      ),
  });
};

export type AgencyTransactionsData = NonNullable<
  ReturnType<typeof useAgencyTransactions>["data"]
>;
