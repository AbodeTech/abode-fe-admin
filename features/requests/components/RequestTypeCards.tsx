"use client";

import React from "react";
import Link from "next/link";
import { FileText, Settings, MessageSquare } from "lucide-react";

import { formatNaira } from "@/lib/utils/format";

import { REQUEST_FEES, type RequestStatistics } from "../schemas/request.schema";

/**
 * Three types in v2 — location change was dropped. The black header shows the
 * count that needs an admin (`pending_*`, i.e. status=submitted); v1 showed
 * the type's total under a "Pending" label, which was a lie by column.
 */
const typeConfig: {
  pendingKey: keyof RequestStatistics;
  totalKey: keyof RequestStatistics;
  fee: number;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
}[] = [
  {
    pendingKey: "pending_document_change",
    totalKey: "document_change_requests",
    fee: REQUEST_FEES.document_change,
    title: "Document Change",
    description: "Manage name and address document updates",
    icon: FileText,
    route: "/requests/document-change",
  },
  {
    pendingKey: "pending_asset_update",
    totalKey: "asset_update_requests",
    fee: REQUEST_FEES.asset_update,
    title: "Asset Update",
    description: "Manage size and unit modification requests",
    icon: Settings,
    route: "/requests/asset-update",
  },
  {
    pendingKey: "pending_custom",
    totalKey: "custom_requests",
    fee: REQUEST_FEES.custom_request,
    title: "Custom Request",
    description: "Manage custom client requests",
    icon: MessageSquare,
    route: "/requests/custom",
  },
];

interface RequestTypeCardsProps {
  stats?: RequestStatistics | null;
}

export function RequestTypeCards({ stats }: RequestTypeCardsProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
      {typeConfig.map((item) => {
        const Icon = item.icon;
        const pending = stats?.[item.pendingKey] ?? 0;
        const total = stats?.[item.totalKey] ?? 0;

        return (
          <Link
            key={item.route}
            href={item.route}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group block"
          >
            <div className="bg-black p-4 sm:p-6">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 text-white">
                <div className="min-w-0">
                  <h3 className="text-xl font-bold mb-1 sm:text-2xl">{pending.toLocaleString()}</h3>
                  <p className="text-white/90 text-sm">
                    Pending · {total.toLocaleString()} total
                  </p>
                </div>
                <div className="shrink-0 rounded-xl bg-white/20 p-4 transition-colors group-hover:bg-white/30">
                  <Icon className="h-8 w-8" />
                </div>
              </div>
            </div>
            <div className="min-w-0 p-4 sm:p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h4>
              <p className="text-gray-600 text-sm mb-1">{item.description}</p>
              <p className="text-xs text-gray-500 mb-4">
                {item.fee > 0 ? `${formatNaira(item.fee)} processing fee` : "No fee"}
              </p>
              <div className="flex items-center text-gray-900 font-medium text-sm group-hover:text-gray-700">
                View All Requests
                <svg
                  className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
