"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AssociateData {
  userName?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  amount_brought?: number | null;
  no_of_referral?: number | null;
}

interface TopAssociatesProps {
  data?: (AssociateData | null)[] | null;
}

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export default function TopAssociates({ data }: TopAssociatesProps) {
  const safeData = data || [];
  const topAssociates = safeData.filter((item): item is AssociateData => item !== null).slice(0, 15);

  return (
    <section className="bg-white rounded-xl p-6 mt-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Top Associates</h3>
        {/* Placeholder link */}
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/dashboard/associates">View All</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-y-6">
        {topAssociates.map((associate, idx) => (
          <div key={idx} className="flex items-start">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {associate.firstName?.[0]?.toUpperCase()}{associate.lastName?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4">
              <h3 className="font-medium text-sm capitalize">
                {associate.firstName} {associate.lastName}
              </h3>
              <p className="text-xs text-gray-500">{associate.email}</p>
            </div>
            <div className="ml-auto text-right">
              <h3 className="font-bold text-sm">{formatCurrency(associate.amount_brought)}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Ref: {associate.no_of_referral}
              </p>
            </div>
          </div>
        ))}
        {topAssociates.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No top associates found.</p>
        )}
      </div>
    </section>
  );
}
