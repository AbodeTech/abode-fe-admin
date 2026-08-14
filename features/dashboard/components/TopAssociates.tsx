"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { graphql } from '@/lib/gql';
import { FragmentType, useFragment } from '@/lib/gql';

export const TopAssociatesFragment = graphql(`
  fragment TopAssociates_data on UserReferralAdmin {
    userName
    email
    firstName
    lastName
    amount_brought
    no_of_referral
    phoneNumber
  }
`);

interface TopAssociatesProps {
  data?: (FragmentType<typeof TopAssociatesFragment> | null)[] | null;
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
  const topAssociatesRaw = safeData.filter((item): item is NonNullable<typeof item> => item !== null).slice(0, 15);
  // We need to map over the array and unwrap each item
  const topAssociates = useFragment(TopAssociatesFragment, topAssociatesRaw);

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h3 className="text-base font-bold sm:text-lg">Top Associates</h3>
        <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" asChild>
          <Link href="/associates">View All</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-y-4 sm:gap-y-6">
        {topAssociates.map((associate, idx) => (
          <div key={idx} className="flex min-w-0 items-start gap-3 sm:gap-4">
            <Avatar className="h-11 w-11 shrink-0 sm:h-12 sm:w-12">
              <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                {associate.lastName?.[0]?.toUpperCase()}
                {associate.firstName?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-sm font-medium capitalize">
                {associate.lastName} {associate.firstName}
              </h3>
              <p className="mt-1 truncate text-xs text-gray-500" title={associate.email ?? undefined}>
                {associate.email}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <h3 className="text-xs font-bold tabular-nums sm:text-sm">{formatCurrency(associate.amount_brought)}</h3>
              <p className="mt-1 text-xs text-gray-500">
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
