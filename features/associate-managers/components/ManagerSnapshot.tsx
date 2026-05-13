"use client";

import { Star, Award, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AssociateManager, ManagerMetrics } from "../mock-data";

interface Props {
  viewAs: "super-admin" | "manager";
  manager: AssociateManager;
  metrics: ManagerMetrics;
}

const formatCurrency = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

export function ManagerSnapshot({ viewAs, manager, metrics }: Props) {
  const { reviewCount, averageRating, score, rewardAmount } = metrics.performance;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {viewAs === "super-admin" && (
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="h-14 w-14 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center font-semibold text-lg">
            {manager.avatarInitials}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{manager.name}</p>
            <p className="text-sm text-gray-500">{manager.email}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs uppercase tracking-wide text-gray-500">Assigned Pros</p>
            <p className="text-2xl font-bold text-gray-900">{manager.assignedPros}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Score */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-sm text-gray-600">Performance Score</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  Number of customer reviews divided by the average rating from those reviews.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold text-gray-900">{score.toFixed(2)}</p>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i <= Math.round(averageRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span>
                {averageRating.toFixed(1)} · {reviewCount} reviews
              </span>
            </div>
          </div>
        </div>

        {/* Performance Reward */}
        <div className="md:border-l md:border-gray-100 md:pl-6">
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-sm text-gray-600">Performance Reward (this period)</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  25% of (10 × Associate Pro Revenue) + 0.5% of total deposits.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#E0F2F1]">
              <Award className="h-5 w-5 text-[#00695C]" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(rewardAmount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
