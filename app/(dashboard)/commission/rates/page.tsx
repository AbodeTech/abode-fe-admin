"use client";

import { PageContentLoader } from "@/components/shared/page-content-loader";
import {
  ConfigHistory,
  EditRatesDialog,
  RatesCard,
  useCommissionConfig,
} from "@/features/commission";

export default function CommissionRatesPage() {
  const { data, isLoading, error } = useCommissionConfig();

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-[1600px] flex-col px-3 sm:px-4">
        <PageContentLoader label="Loading commission rates…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading commission rates</h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Commission rates</h1>
          <p className="text-muted-foreground">
            The default rates, applied when no override matches. Publishing a new version does not
            change payment plans that already exist.
          </p>
        </div>
        <div className="w-full shrink-0 sm:w-auto">
          <EditRatesDialog config={data.active} />
        </div>
      </div>

      <RatesCard config={data.active} />
      <ConfigHistory history={data.history} />
    </div>
  );
}
