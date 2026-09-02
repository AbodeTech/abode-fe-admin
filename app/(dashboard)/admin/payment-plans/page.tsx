"use client";

import { Suspense } from "react";

import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import { PaymentPlansPage } from "@/features/payment-plans";

export default function AdminPaymentPlansRoute() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <PaymentPlansPage />
    </Suspense>
  );
}
