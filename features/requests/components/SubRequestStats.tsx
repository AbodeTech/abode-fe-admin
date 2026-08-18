"use client";

import React from "react";
import {
  CheckCircle,
  CheckCheck,
  ClipboardList,
  Clock,
  DollarSign,
  Eye,
  RotateCcw,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils/format";

import type { ListAnalytics } from "../schemas/request.schema";

/**
 * The analytics block that rides on the list response. Computed in the same
 * `$facet` as the page, so these describe exactly the rows the filters
 * selected — narrow the status filter and the counts narrow with it.
 */
const cards: { key: keyof ListAnalytics; label: string; icon: LucideIcon; currency?: boolean }[] = [
  { key: "total_requests", label: "In this view", icon: ClipboardList },
  { key: "submitted_requests", label: "Pending", icon: Clock },
  { key: "under_review_requests", label: "Under review", icon: Eye },
  { key: "approved_requests", label: "Approved", icon: CheckCircle },
  { key: "completed_requests", label: "Completed", icon: CheckCheck },
  { key: "declined_requests", label: "Declined", icon: XCircle },
  { key: "cancelled_requests", label: "Cancelled", icon: RotateCcw },
  { key: "fees_collected", label: "Fees collected", icon: DollarSign, currency: true },
];

interface SubRequestStatsProps {
  analytics?: ListAnalytics | null;
}

export function SubRequestStats({ analytics }: SubRequestStatsProps) {
  if (!analytics) return null;

  return (
    <div className="mb-6 mt-4 grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map(({ key, label, icon: Icon, currency }) => {
        const value = Number(analytics[key] ?? 0);
        return (
          <Card key={key} className="min-w-0 overflow-hidden bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <Icon className="h-6 w-6 text-gray-700" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
              <div className="text-xl font-bold wrap-break-word tabular-nums text-gray-900 sm:text-2xl">
                {currency ? formatNaira(value) : value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
