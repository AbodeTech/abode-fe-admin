"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  FileText,
  Settings,
  MessageSquare,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment } from "@/lib/gql";

export const RequestStatsFragment = graphql(`
  fragment RequestStats_stats on RequestStatistics {
    totalRequests
    pendingRequests
    approvedRequests
    declinedRequests
    locationChangeRequests
    documentChangeRequests
    assetUpdateRequests
    customRequests
    totalFeesCollected
    paidRequests
    unpaidRequests
  }
`);

const cards: {
  key: string;
  label: string;
  icon: React.ElementType;
  tone: string;
  currency?: boolean;
}[] = [
    { key: "totalRequests", label: "Total Requests", icon: ClipboardList, tone: "text-gray-900" },
    { key: "pendingRequests", label: "Pending", icon: Clock, tone: "text-yellow-600" },
    { key: "approvedRequests", label: "Approved", icon: CheckCircle, tone: "text-green-600" },
    { key: "declinedRequests", label: "Declined", icon: XCircle, tone: "text-red-600" },
    { key: "locationChangeRequests", label: "Location Change", icon: MapPin, tone: "text-cyan-600" },
    { key: "documentChangeRequests", label: "Document Change", icon: FileText, tone: "text-blue-600" },
    { key: "assetUpdateRequests", label: "Asset Update", icon: Settings, tone: "text-purple-600" },
    { key: "customRequests", label: "Custom Request", icon: MessageSquare, tone: "text-orange-600" },
    { key: "totalFeesCollected", label: "Fees Collected", icon: TrendingUp, tone: "text-green-700", currency: true },
    { key: "paidRequests", label: "Paid Fees", icon: CheckCircle, tone: "text-green-600" },
    { key: "unpaidRequests", label: "Unpaid Fees", icon: DollarSign, tone: "text-red-600" },
  ];

interface RequestStatsProps {
  stats?: FragmentType<typeof RequestStatsFragment> | null;
}

export function RequestStats({ stats }: RequestStatsProps) {
  const data = useFragment(RequestStatsFragment, stats);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const value = (data as any)?.[card.key] ?? 0;

        const display =
          card.currency && typeof value === "number"
            ? `₦${Math.round(value).toLocaleString()}`
            : value;
        const Icon = card.icon;
        const bg = card.key === "pendingRequests" || card.key === "documentChangeRequests" || card.key === "customRequests" ? "bg-gray-50" : "bg-white";
        return (
          <Card key={card.key} className="border border-gray-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">{card.label}</div>
                <div className="text-xl font-bold text-gray-900 mt-1">{display}</div>
              </div>
              <div className={`p-2 rounded-full ${bg}`}>
                <Icon className={`h-5 w-5 ${card.tone}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
