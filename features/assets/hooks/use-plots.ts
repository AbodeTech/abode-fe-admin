import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { parse } from "graphql";
import { execute } from "@/lib/graphql-client";

export type PlotStatus = "available" | "allocated";

export interface Plot {
  _id: string;
  block: string;
  block_label: string;
  plot_number: number;
  size: number;
  status: PlotStatus;
  payment_plan: string | null;
  allocated_date: string | null;
}

export interface PlotRangeInput {
  from: number;
  to: number;
  size: number;
}

// NOTE: this file is excluded from codegen (see codegen.ts), so the codegen
// `graphql()` helper returns `{}` at runtime and execute(print({})) crashes
// with an "AST node" error. Parse the operations manually instead.
const GET_BLOCK_PLOTS_QUERY = parse(`
  query GetBlockPlots($blockId: ID!, $size: Int, $status: PlotStatus) {
    getBlockPlots(blockId: $blockId, size: $size, status: $status) {
      _id
      block
      block_label
      plot_number
      size
      status
      payment_plan
      allocated_date
    }
  }
`) as unknown as TypedDocumentNode<
  { getBlockPlots: Plot[] },
  { blockId: string; size?: number; status?: PlotStatus }
>;

const CREATE_PLOTS_MUTATION = parse(`
  mutation CreatePlots($blockId: ID!, $ranges: [PlotRangeInput!]!) {
    createPlots(blockId: $blockId, ranges: $ranges)
  }
`) as unknown as TypedDocumentNode<
  { createPlots: number[] },
  { blockId: string; ranges: PlotRangeInput[] }
>;

const UPDATE_PLOT_SIZE_MUTATION = parse(`
  mutation UpdatePlotSize($plotId: ID!, $size: Int!, $override: Boolean) {
    updatePlotSize(plotId: $plotId, size: $size, override: $override) {
      _id
      size
      status
    }
  }
`) as unknown as TypedDocumentNode<
  { updatePlotSize: Plot },
  { plotId: string; size: number; override?: boolean }
>;

export const plotKeys = {
  all: ["plots"] as const,
  list: (blockId: string, filters?: { size?: number; status?: PlotStatus }) =>
    [...plotKeys.all, "list", blockId, filters ?? {}] as const,
};

export interface UseBlockPlotsParams {
  blockId: string;
  size?: number;
  status?: PlotStatus;
  enabled?: boolean;
}

export const useBlockPlots = ({
  blockId,
  size,
  status,
  enabled = true,
}: UseBlockPlotsParams) => {
  return useQuery({
    queryKey: plotKeys.list(blockId, { size, status }),
    queryFn: () =>
      execute(GET_BLOCK_PLOTS_QUERY, {
        blockId,
        size,
        status,
      }),
    select: (data) => data.getBlockPlots,
    enabled: enabled && !!blockId,
  });
};

export interface CreatePlotsInput {
  blockId: string;
  ranges: PlotRangeInput[];
}

export const useCreatePlots = (blockId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlotsInput) =>
      execute(CREATE_PLOTS_MUTATION, {
        blockId: input.blockId,
        ranges: input.ranges,
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: plotKeys.list(blockId) });
    },
  });
};

export interface UpdatePlotSizeInput {
  plotId: string;
  size: number;
  override?: boolean;
}

export const useUpdatePlotSize = (blockId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePlotSizeInput) =>
      execute(UPDATE_PLOT_SIZE_MUTATION, {
        plotId: input.plotId,
        size: input.size,
        override: input.override,
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: plotKeys.list(blockId) });
    },
  });
};
