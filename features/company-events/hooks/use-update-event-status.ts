'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';

import type { CompanyEventStatus } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

const SET_COMPANY_EVENT_STATUS_MUTATION = graphql(`
  mutation SetCompanyEventStatus($id: ID!, $status: String!) {
    setCompanyEventStatus(id: $id, status: $status) {
      id
      status
    }
  }
`);

export interface UpdateEventStatusInput {
  eventId: string;
  status: CompanyEventStatus;
}

/**
 * `setCompanyEventStatus` — one mutation covers every move. The server
 * enforces the legal graph (`draft → published | closed`,
 * `published → closed`, `closed → published`) and treats asking for the
 * status it already holds as a no-op rather than an error. An illegal move
 * throws, and the message is surfaced as-is rather than re-validated here.
 */
export const useUpdateEventStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status }: UpdateEventStatusInput) =>
      execute(SET_COMPANY_EVENT_STATUS_MUTATION, { id: eventId, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyEventKeys.all });
    },
  });
};
