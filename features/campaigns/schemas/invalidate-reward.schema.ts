import { z } from 'zod';

export const InvalidateRewardSchema = z.object({
  reason: z.string().min(20).max(2000),
});

export type InvalidateRewardDto = z.infer<typeof InvalidateRewardSchema>;
