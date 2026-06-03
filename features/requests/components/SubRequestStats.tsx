"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SubRequestStatsProps {
  analytics?: Record<string, number> | null;
}

const iconMap: Partial<Record<string, LucideIcon>> = {
  totalRequests: ClipboardList,
  pendingRequests: Clock,
  approvedRequests: CheckCircle,
  rejectedRequests: XCircle,
  declinedRequests: XCircle,
  totalProcessingFees: DollarSign,
  feesCollected: DollarSign,
  flexRequests: ClipboardList,
  fullOwnershipRequests: ClipboardList,
};

export function SubRequestStats({ analytics }: SubRequestStatsProps) {
  const stats = analytics || {};
  const entries = Object.keys(stats);

  if (entries.length === 0) return null;

  return (
    <div className="mb-6 mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {entries.map((key) => {
        const title = key
          .replace(/([A-Z])/g, " $1")
          .trim()
          .replace(/^./, (str) => str.toUpperCase());

        const value = stats[key];
        const Icon = iconMap[key] || ClipboardList;

        return (
          <Card key={key} className="min-w-0 overflow-hidden bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <Icon className="h-6 w-6 text-gray-700" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
              <div className="text-xl font-bold wrap-break-word text-gray-900 sm:text-2xl">
                {typeof value === "number" ? value.toLocaleString() : value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
