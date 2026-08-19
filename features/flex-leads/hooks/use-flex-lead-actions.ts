"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { executeRaw } from "@/lib/graphql-client";

import { flexLeadKeys } from "./query-keys";
import type { FlexLeadStatus } from "./types";

const UPDATE_FLEX_LEAD_MUTATION = `
  mutation UpdateFlexLead($id: ID!, $status: String, $adminNotes: String) {
    updateFlexLead(id: $id, status: $status, adminNotes: $adminNotes) {
      id
      status
      adminNotes
    }
  }
`;

type UpdateFlexLeadResponse = {
  updateFlexLead: {
    id: string;
    status: string;
    adminNotes: string | null;
  };
};

export function useUpdateFlexLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      status: FlexLeadStatus;
      adminNotes?: string | null;
    }) =>
      executeRaw<UpdateFlexLeadResponse>(UPDATE_FLEX_LEAD_MUTATION, {
        id: input.id,
        status: input.status,
        adminNotes: input.adminNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flexLeadKeys.all });
    },
  });
}
