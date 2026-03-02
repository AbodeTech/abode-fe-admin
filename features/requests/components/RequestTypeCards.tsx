"use client";

import React from "react";
import Link from "next/link";
import { MapPin, FileText, Settings, MessageSquare } from "lucide-react";
import type { RequestStatistics } from "@/lib/gql/graphql";

const typeConfig: {
  statsKey: keyof RequestStatistics;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
}[] = [
  {
    statsKey: "locationChangeRequests",
    title: "Location Change",
    description: "Manage property location change requests",
    icon: MapPin,
    route: "/requests/location-change",
  },
  {
    statsKey: "documentChangeRequests",
    title: "Document Change",
    description: "Manage name and address document updates",
    icon: FileText,
    route: "/requests/document-change",
  },
  {
    statsKey: "assetUpdateRequests",
    title: "Asset Update",
    description: "Manage size and unit modification requests",
    icon: Settings,
    route: "/requests/asset-update",
  },
  {
    statsKey: "customRequests",
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {typeConfig.map((item) => {
        const Icon = item.icon;
        const count = (stats?.[item.statsKey] as number | null | undefined) ?? 0;

        return (
          <Link
            key={item.statsKey}
            href={item.route}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group block"
          >
            <div className="bg-black p-6">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{count.toLocaleString()}</h3>
                  <p className="text-white/90 text-sm">Pending Requests</p>
                </div>
                <div className="p-4 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                  <Icon className="w-8 h-8" />
                </div>
              </div>
            </div>
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h4>
              <p className="text-gray-600 text-sm mb-4">{item.description}</p>
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
