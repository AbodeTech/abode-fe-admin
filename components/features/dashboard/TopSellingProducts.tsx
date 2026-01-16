"use client";

import React from 'react';
import Image from 'next/image';

interface ProductData {
  asset_name?: string | null;
  asset_pictures?: (string | null)[] | null;
  asset_location?: string | null;
  units_subscribed?: number | null;
  amount_broughtin?: number | null;
}

interface TopSellingProductsProps {
  data?: (ProductData | null)[] | null;
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
  const topProducts = safeData.filter((item): item is ProductData => item !== null).slice(0, 15);

  return (
    <section className="bg-white rounded-xl p-6 mt-6 shadow-sm">
      <h3 className="text-lg font-bold mb-4">Top Selling Products</h3>
      <div className="grid grid-cols-1 gap-y-6">
        {topProducts.map((product, idx) => {
          const firstImage = product.asset_pictures?.[0];
          return (
            <div key={idx} className="flex items-start">
              <div className="relative w-16 h-12 rounded overflow-hidden bg-gray-100 shrink-0">
                {firstImage ? (
                  <Image
                    src={firstImage}
                    alt={product.asset_name || "Product image"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    No Img
                  </div>
                )}
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-sm capitalize">{product.asset_name}</h3>
                <p className="text-xs text-gray-500 mt-1">{product.asset_location}</p>
              </div>
              <div className="ml-auto text-right">
                <h3 className="font-bold text-sm">{formatCurrency(product.amount_broughtin)}</h3>
                <p className="text-xs text-gray-500 mt-1">Units: {product.units_subscribed}</p>
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
