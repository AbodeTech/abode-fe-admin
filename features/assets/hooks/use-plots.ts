'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';

import { PlotSchema, type PlotDraft } from '../schemas/block-plot.schema';
import { assetKeys } from './query-keys';

/**
 * Plots within one block.
 *
 *   GET    /admin/blocks/:block_id/plots
 *   POST   /admin/blocks/:block_id/plots        { plot_number, size }
 *   POST   /admin/blocks/:block_id/plots/bulk   { plots: [{ plot_number, size }] }
 *   PATCH  /admin/plots/:plot_id                { plot_number?, size? }
 *   DELETE /admin/plots/:plot_id
 *
 * The form works in ranges. A range that comes to exactly one plot goes to
 * the single-plot POST; anything more goes to /bulk. Either way it is one
 * request.
 *
 * PATCH and DELETE are refused outright on an allocated plot (400
 * PLOT_ALLOCATED). The UI doesn't offer them there; this is the second guard.
 */
const WriteResultSchema = z.unknown();

export const useBlockPlots = ({
  blockId,
  enabled = true,
}: {
  blockId: string;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: assetKeys.plots(blockId),
    queryFn: () => apiGet(`/admin/blocks/${blockId}/plots`, z.array(PlotSchema)),
    enabled: enabled && !!blockId,
  });

/**
 * Plot counts drive the block cards, so a plot write invalidates the block
 * list too — otherwise the card behind the dialog keeps a stale tally.
 */
function usePlotMutation<TVariables, TData>(
  { blockId, assetId }: { blockId: string; assetId: string },
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.plots(blockId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.blocks(assetId) });
      // The tab's summary strip and plot table read the asset-wide endpoints.
      queryClient.invalidateQueries({ queryKey: assetKeys.plotInventory(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.plotSummary(assetId) });
    },
  });
}

export const useCreatePlots = (ids: { blockId: string; assetId: string }) =>
  usePlotMutation(ids, (plots: PlotDraft[]) =>
    plots.length === 1
      ? apiPost(`/admin/blocks/${ids.blockId}/plots`, plots[0], WriteResultSchema)
      : apiPost(`/admin/blocks/${ids.blockId}/plots/bulk`, { plots }, WriteResultSchema)
  );

export const useUpdatePlot = (ids: { blockId: string; assetId: string }) =>
  usePlotMutation(
    ids,
    ({ plotId, ...payload }: { plotId: string; plot_number?: number; size?: number }) =>
      apiPatch(`/admin/plots/${plotId}`, payload, WriteResultSchema)
  );

export const useDeletePlot = (ids: { blockId: string; assetId: string }) =>
  usePlotMutation(ids, (plotId: string) =>
    apiDelete(`/admin/plots/${plotId}`, WriteResultSchema)
  );
