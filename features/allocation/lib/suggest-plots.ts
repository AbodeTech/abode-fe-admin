import type { Plot } from "@/features/assets";

interface ChainNode {
  idx: number;
  prev: ChainNode | null;
}

interface Cell {
  count: number;
  chain: ChainNode | null;
}

// DP array is O(target) — sqm targets are small, but guard against garbage input.
const MAX_TARGET = 500_000;

/**
 * 0/1 subset-sum over plot sizes, minimizing the number of plots used.
 * Chains are immutable snapshots so reconstruction can never reuse a plot.
 * Returns the selected plots, or null when no exact combination exists.
 */
function subsetSum(plots: Plot[], target: number): Plot[] | null {
  const dp: (Cell | null)[] = new Array(target + 1).fill(null);
  dp[0] = { count: 0, chain: null };

  for (let i = 0; i < plots.length; i++) {
    const size = plots[i].size;
    if (!Number.isInteger(size) || size <= 0 || size > target) continue;
    for (let s = target; s >= size; s--) {
      const from = dp[s - size];
      if (!from) continue;
      const existing = dp[s];
      if (!existing || from.count + 1 < existing.count) {
        dp[s] = { count: from.count + 1, chain: { idx: i, prev: from.chain } };
      }
    }
  }

  const hit = dp[target];
  if (!hit) return null;
  const result: Plot[] = [];
  for (let node = hit.chain; node; node = node.prev) {
    result.push(plots[node.idx]);
  }
  return result;
}

/**
 * Suggest a set of available plots whose sizes sum exactly to `target` sqm.
 * Prefers a combination within a single block (contiguous-ish allocation),
 * falling back to a cross-block combination. Fewest plots wins.
 */
export function suggestPlotCombination(
  plots: Plot[],
  target: number
): Plot[] | null {
  if (!Number.isInteger(target) || target <= 0 || target > MAX_TARGET) {
    return null;
  }

  const blocks = new Map<string, Plot[]>();
  for (const plot of plots) {
    const arr = blocks.get(plot.block_label) ?? [];
    arr.push(plot);
    blocks.set(plot.block_label, arr);
  }

  let best: Plot[] | null = null;
  for (const blockPlots of blocks.values()) {
    const picked = subsetSum(blockPlots, target);
    if (picked && (!best || picked.length < best.length)) {
      best = picked;
    }
  }

  return best ?? subsetSum(plots, target);
}
