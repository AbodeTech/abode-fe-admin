"use client";

import React from "react";
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
import type { RequestStatistics } from "@/lib/gql/graphql";

const cards: {
  key: keyof RequestStatistics;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  currency?: boolean;
}[] = [
  { key: "totalRequests", label: "Total Requests", icon: ClipboardList, iconColor: "text-gray-900" },
  { key: "pendingRequests", label: "Pending", icon: Clock, iconColor: "text-yellow-600" },
  { key: "approvedRequests", label: "Approved", icon: CheckCircle, iconColor: "text-green-600" },
  { key: "declinedRequests", label: "Declined", icon: XCircle, iconColor: "text-red-600" },
  { key: "locationChangeRequests", label: "Location Change", icon: MapPin, iconColor: "text-cyan-600" },
  { key: "documentChangeRequests", label: "Document Change", icon: FileText, iconColor: "text-blue-600" },
  { key: "assetUpdateRequests", label: "Asset Update", icon: Settings, iconColor: "text-purple-600" },
  { key: "customRequests", label: "Custom Request", icon: MessageSquare, iconColor: "text-orange-600" },
  { key: "totalFeesCollected", label: "Fees Collected", icon: TrendingUp, iconColor: "text-green-600", currency: true },
  { key: "paidRequests", label: "Paid Fees", icon: CheckCircle, iconColor: "text-green-600" },
  { key: "unpaidRequests", label: "Unpaid Fees", icon: DollarSign, iconColor: "text-red-600" },
];

interface RequestStatsProps {
  stats?: RequestStatistics | null;
}

export function RequestStats({ stats }: RequestStatsProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const raw = stats?.[card.key] ?? 0;
        const display =
          card.currency && typeof raw === "number"
            ? `₦${Math.round(raw as number).toLocaleString()}`
            : (raw as number).toLocaleString();
        const bg = index % 2 === 0 ? "bg-white" : "bg-gray-50";

        return (
          <div
            key={card.key}
            className={`${bg} min-w-0 rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-gray-100">
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">{card.label}</p>
            <p className="text-xl font-bold wrap-break-word text-gray-900 sm:text-2xl">{display}</p>
          </div>
        );
      })}
    </div>
  );
}
