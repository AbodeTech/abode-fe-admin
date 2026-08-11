import { useMutation, useQueryClient } from "@tanstack/react-query";
import { csManagerKeys } from "./use-cs-manager-dashboard";
import { csManagersListKeys } from "./use-cs-managers-list";
import type { CSManagerSummary } from "../types";

/**
 * Super-admin mutations for CS Manager role + customer assignment —
 * TEMPORARY MOCK. When BE ships:
 *   - addCSManager → addCSManager mutation (promotes an Admin)
 *   - removeCSManager → removeCSManager mutation (demotes back)
 *   - assignCustomersToCSManager → assignCustomersToCSManager mutation
 * Consumer dialogs don't change.
 */

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: csManagersListKeys.managers() });
  qc.invalidateQueries({ queryKey: csManagersListKeys.unassigned() });
  qc.invalidateQueries({ queryKey: csManagerKeys.dashboards() });
};

export const useAddCSManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (adminId: string): Promise<CSManagerSummary> => {
      // Replace with: execute(ADD_CS_MANAGER_MUTATION, { adminId })
      await new Promise((r) => setTimeout(r, 200));
      return {
        _id: `csm-mock-${adminId}`,
        manager: {
          _id: adminId,
          firstName: "Newly",
          lastName: "Promoted",
          email: `${adminId}@abode.ng`,
        },
        assignedCustomersCount: 0,
        assignedPlansCount: 0,
        currentPeriodScore: null,
        activeSince: new Date().toISOString(),
      };
    },
    onSuccess: () => invalidateAll(qc),
  });
};

export const useRemoveCSManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (managerId: string) => {
      // Replace with: execute(REMOVE_CS_MANAGER_MUTATION, { managerId })
      await new Promise((r) => setTimeout(r, 200));
      return { removed: true, managerId };
    },
    onSuccess: () => invalidateAll(qc),
  });
};

export interface AssignCustomersToCSMInput {
  customerIds: string[];
  managerId: string;
}

export const useAssignCustomersToCSM = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AssignCustomersToCSMInput) => {
      // Replace with: execute(ASSIGN_CUSTOMERS_TO_CSM_MUTATION, { input })
      await new Promise((r) => setTimeout(r, 200));
      return { assigned: input.customerIds.length, managerId: input.managerId };
    },
    onSuccess: () => invalidateAll(qc),
  });
};
