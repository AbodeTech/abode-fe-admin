"use client";

import React from "react";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  CheckCheck,
  Eye,
  XCircle,
  FileText,
  Settings,
  MessageSquare,
  TrendingUp,
  DollarSign,
  RotateCcw,
} from "lucide-react";

import type { RequestStatistics } from "../schemas/request.schema";

const cards: {
  key: keyof RequestStatistics;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  currency?: boolean;
}[] = [
  // Volume — v2 splits the old "pending" into submitted + under_review, and
  // adds completed (manual approvals need a second step) and cancelled.
  { key: "total_requests", label: "Total Requests", icon: ClipboardList, iconColor: "text-gray-900" },
  { key: "submitted_requests", label: "Pending", icon: Clock, iconColor: "text-yellow-600" },
  { key: "under_review_requests", label: "Under Review", icon: Eye, iconColor: "text-sky-600" },
  { key: "approved_requests", label: "Approved", icon: CheckCircle, iconColor: "text-green-600" },
  { key: "completed_requests", label: "Completed", icon: CheckCheck, iconColor: "text-emerald-700" },
  { key: "declined_requests", label: "Declined", icon: XCircle, iconColor: "text-red-600" },
  { key: "cancelled_requests", label: "Cancelled", icon: RotateCcw, iconColor: "text-gray-500" },
  // By type — three in v2; location change was dropped.
  { key: "document_change_requests", label: "Document Change", icon: FileText, iconColor: "text-blue-600" },
  { key: "asset_update_requests", label: "Asset Update", icon: Settings, iconColor: "text-purple-600" },
  { key: "custom_requests", label: "Custom Request", icon: MessageSquare, iconColor: "text-orange-600" },
  // Money — whole naira.
  { key: "total_fees_collected", label: "Fees Collected", icon: TrendingUp, iconColor: "text-green-600", currency: true },
  { key: "total_fees_pending_verification", label: "Fees Awaiting Verification", icon: DollarSign, iconColor: "text-amber-600", currency: true },
  { key: "total_fees_refunded", label: "Fees Refunded", icon: RotateCcw, iconColor: "text-red-600", currency: true },
  { key: "paid_requests", label: "Paid Requests", icon: CheckCircle, iconColor: "text-green-600" },
  { key: "unpaid_requests", label: "Unpaid Requests", icon: DollarSign, iconColor: "text-red-600" },
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
