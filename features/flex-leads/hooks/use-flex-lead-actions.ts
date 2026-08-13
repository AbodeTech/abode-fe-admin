"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { executeRaw } from "@/lib/graphql-client";

import {
  updateDummyFlexLead,
  USE_DUMMY_FLEX_LEADS,
} from "./dummy-flex-leads";
import { flexLeadKeys } from "./query-keys";
import type { FlexLeadStatus } from "./types";

/* ============================================================
 * Admin actions on a Flex lead.
 *
 * Expected BE mutation:
 *   updateFlexLead(id, status, adminNotes) → updated lead
 * ============================================================ */

type UpdateFlexLeadResponse = {
  updateFlexLead: {
    id: string;
    status: string;
    adminNotes: string | null;
  };
};

const UPDATE_FLEX_LEAD_MUTATION = `
  mutation UpdateFlexLead($id: ID!, $status: String, $adminNotes: String) {
    updateFlexLead(id: $id, status: $status, adminNotes: $adminNotes) {
      id
      status
      adminNotes
    }
  }
`;

export function useUpdateFlexLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      status: FlexLeadStatus;
      adminNotes?: string | null;
    }) => {
      if (USE_DUMMY_FLEX_LEADS) {
        return { updateFlexLead: updateDummyFlexLead(input) };
      }
      return executeRaw<UpdateFlexLeadResponse>(UPDATE_FLEX_LEAD_MUTATION, {
        id: input.id,
        status: input.status,
        adminNotes: input.adminNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flexLeadKeys.all });
    },
  });
}
