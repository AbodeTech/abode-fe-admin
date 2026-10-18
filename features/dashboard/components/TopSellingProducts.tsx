"use client";

import type { TopProduct } from "../schemas/dashboard-top.schema";

interface TopSellingProductsProps {
  data?: TopProduct[] | null;
  isLoading?: boolean;
}

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function TopSellingProducts({
  data,
  isLoading,
}: TopSellingProductsProps) {
  const products = data ?? [];

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
      <h3 className="mb-3 text-base font-bold sm:mb-4 sm:text-lg">
        Top Selling Products
      </h3>
      <div className="grid grid-cols-1 gap-y-4 sm:gap-y-6">
        {isLoading ? (
          <p className="py-4 text-center text-sm text-gray-500">Loading…</p>
        ) : (
          <>
            {products.map((product) => (
              <div
                key={product.asset_id}
                className="flex min-w-0 items-start gap-3 sm:gap-4"
              >
                <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100 text-xs text-gray-400">
                  {product.asset_type?.replace(/_/g, " ") || "Asset"}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-medium capitalize">
                    {product.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                    {product.asset_location || "—"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <h3 className="text-xs font-bold tabular-nums sm:text-sm">
                    {formatCurrency(product.total_collected)}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Plans: {product.plans_sold}
                  </p>
                </div>
              </div>
            ))}
            {products.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                No top selling products found.
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
