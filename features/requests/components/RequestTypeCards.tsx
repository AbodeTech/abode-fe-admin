"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, FileText, Settings, MessageSquare } from "lucide-react";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment } from "@/lib/gql";

export const RequestTypeCardFragment = graphql(`
  fragment RequestTypeCards_stats on RequestStatistics {
    locationChangeRequests
    documentChangeRequests
    assetUpdateRequests
    customRequests
  }
`);

const typeConfig = [
  { key: "location_change", title: "Location Change", icon: MapPin, route: "/requests/location-change" },
  { key: "document_change", title: "Document Change", icon: FileText, route: "/requests/document-change" },
  { key: "asset_update", title: "Asset Update", icon: Settings, route: "/requests/asset-update" },
  { key: "custom_request", title: "Custom Request", icon: MessageSquare, route: "/requests/custom" },
] as const;

interface RequestTypeCardsProps {
  stats?: FragmentType<typeof RequestTypeCardFragment> | null;
}

export function RequestTypeCards({ stats }: RequestTypeCardsProps) {
  const data = useFragment(RequestTypeCardFragment, stats);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {typeConfig.map((item) => {
        const Icon = item.icon as React.ElementType;
        // Map item.key to GraphQL field name (e.g. location_change -> locationChangeRequests)
        const gqlKey = `${item.key.replace('_', '')}Requests`;
        const count = (data as any)?.[gqlKey] ?? 0;

        return (
          <Card key={item.key} className="bg-black text-white">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm uppercase tracking-wide text-white/70">{item.title}</div>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-bold">{count}</div>
              <p className="text-sm text-white/80">Manage {item.title.toLowerCase()} requests</p>
              <Button variant="secondary" size="sm" asChild>
                <Link href={item.route}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
