"use client";

import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import type { TopAssociate } from "../schemas/dashboard-top.schema";

interface TopAssociatesProps {
  data?: TopAssociate[] | null;
  isLoading?: boolean;
}

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function TopAssociates({ data, isLoading }: TopAssociatesProps) {
  const associates = data ?? [];

  return (
    <section className="h-fit rounded-xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h3 className="text-base font-bold sm:text-lg">Top Associates</h3>
        <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" asChild>
          <Link href="/associates">View All</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-y-3 sm:gap-y-4">
        {isLoading ? (
          <p className="py-4 text-center text-sm text-gray-500">Loading…</p>
        ) : (
          <>
            {associates.map((associate) => (
              <div
                key={associate.user_id}
                className="flex min-w-0 items-start gap-3 sm:gap-4"
              >
                <Avatar className="h-11 w-11 shrink-0 sm:h-12 sm:w-12">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary sm:text-sm">
                    {initials(associate.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-medium capitalize">
                    {associate.name}
                  </h3>
                  <p
                    className="mt-1 truncate text-xs text-gray-500"
                    title={associate.email ?? undefined}
                  >
                    {associate.email || "—"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <h3 className="text-xs font-bold tabular-nums sm:text-sm">
                    {formatCurrency(associate.total_commission)}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Txns: {associate.commission_transactions}
                  </p>
                </div>
              </div>
            ))}
            {associates.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                No top associates found.
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
