"use client";

import React from 'react';
import Image from 'next/image';

import { graphql } from '@/lib/gql';
import { FragmentType, useFragment } from '@/lib/gql';

export const TopSellingProductsFragment = graphql(`
  fragment TopSellingProducts_data on AssetDashBoard {
    asset_name
    asset_pictures
    asset_location
    units_subscribed
    amount_broughtin
  }
`);

interface TopSellingProductsProps {
  data?: (FragmentType<typeof TopSellingProductsFragment> | null)[] | null;
}

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export default function TopSellingProducts({ data }: TopSellingProductsProps) {
  const safeData = data || [];
  const topProductsRaw = safeData.filter((item): item is NonNullable<typeof item> => item !== null).slice(0, 15);
  const topProducts = useFragment(TopSellingProductsFragment, topProductsRaw);

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
      <h3 className="mb-3 text-base font-bold sm:mb-4 sm:text-lg">Top Selling Products</h3>
      <div className="grid grid-cols-1 gap-y-4 sm:gap-y-6">
        {topProducts.map((product, idx) => {
          const firstImage = product.asset_pictures?.[0];
          return (
            <div key={idx} className="flex min-w-0 items-start gap-3 sm:gap-4">
              <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-gray-100 sm:h-12 sm:w-16">
                {firstImage ? (
                  <Image
                    src={firstImage}
                    alt={product.asset_name || "Product image"}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                    No Img
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-medium capitalize">{product.asset_name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">{product.asset_location}</p>
              </div>
              <div className="shrink-0 text-right">
                <h3 className="text-xs font-bold tabular-nums sm:text-sm">{formatCurrency(product.amount_broughtin)}</h3>
                <p className="mt-1 text-xs text-gray-500">Units: {product.units_subscribed}</p>
              </div>
            </div>
          );
        })}
        {topProducts.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No top selling products found.</p>
        )}
      </div>
    </section>
  );
}
