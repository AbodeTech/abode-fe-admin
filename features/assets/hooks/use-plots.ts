import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// NOTE: GraphQL operations commented out until staging deploys v2 block/plot allocation API.
//
// const GET_BLOCK_PLOTS_QUERY = graphql(`
//   query GetBlockPlots($blockId: ID!, $size: Int, $status: PlotStatus) {
//     getBlockPlots(blockId: $blockId, size: $size, status: $status) {
//       _id
//       block
//       block_label
//       plot_number
//       size
//       status
//       payment_plan
//       allocated_date
//     }
//   }
// `);
//
// const CREATE_PLOTS_MUTATION = graphql(`
//   mutation CreatePlots($blockId: ID!, $ranges: [PlotRangeInput!]!) {
//     createPlots(blockId: $blockId, ranges: $ranges) {
//       _id
//       block
//       block_label
//       plot_number
//       size
//       status
//     }
//   }
// `);
//
// const UPDATE_PLOT_SIZE_MUTATION = graphql(`
//   mutation UpdatePlotSize($plotId: ID!, $size: Int!, $override: Boolean) {
//     updatePlotSize(plotId: $plotId, size: $size, override: $override) {
//       _id
//       size
//       status
//     }
//   }
// `);

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

export const plotKeys = {
  all: ["plots"] as const,
  list: (blockId: string, filters?: { size?: number; status?: PlotStatus }) =>
    [...plotKeys.all, "list", blockId, filters ?? {}] as const,
};

const NOT_DEPLOYED = new Error(
  "Block/plot allocation v2 API is not yet available on the backend"
);

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
  return useQuery<Plot[]>({
    queryKey: plotKeys.list(blockId, { size, status }),
    queryFn: () => Promise.resolve([] as Plot[]),
    enabled: enabled && !!blockId && false,
  });
};

export interface CreatePlotsInput {
  blockId: string;
  ranges: PlotRangeInput[];
}

export const useCreatePlots = (blockId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (_input: CreatePlotsInput) => Promise.reject<Plot[]>(NOT_DEPLOYED),
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
    mutationFn: (_input: UpdatePlotSizeInput) => Promise.reject<Plot>(NOT_DEPLOYED),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: plotKeys.list(blockId) });
    },
  });
};
