import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { parse } from "graphql";
import { execute } from "@/lib/graphql-client";
import { allocationKeys } from "./query-keys";

// NOTE: this file is excluded from codegen (see codegen.ts), so the codegen
// `graphql()` helper returns `{}` at runtime and execute(print({})) crashes
// with an "AST node" error. Parse the operation manually instead.
const ALLOCATE_LAND_MUTATION = parse(`
  mutation AllocateLand($paymentPlanId: ID!, $plotIds: [ID!]!) {
    allocateLand(paymentPlanId: $paymentPlanId, plotIds: $plotIds) {
      success
      message
      assetName
      allocations {
        plotId
        block_label
        plot_number
        size
      }
      user {
        name
        email
      }
    }
  }
`) as unknown as TypedDocumentNode<
  { allocateLand: AllocateLandResult },
  { paymentPlanId: string; plotIds: string[] }
>;

export interface AllocateLandInput {
  paymentPlanId: string;
  plotIds: string[];
}

export interface AllocationEntry {
  plotId: string;
  block_label: string;
  plot_number: number;
  size: number;
}

export interface AllocateLandResult {
  success: boolean;
  message: string;
  assetName: string;
  allocations: AllocationEntry[];
  user: { name: string; email: string };
}

export const useAllocateLand = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AllocateLandInput) =>
      execute(ALLOCATE_LAND_MUTATION, {
        paymentPlanId: input.paymentPlanId,
        plotIds: input.plotIds,
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
};
