"use client";

import { PageContentLoader } from "@/components/shared/page-content-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCommissionConfig,
  CommissionRatesCard,
  EditCommissionConfigDialog,
  ConfigHistoryTable,
  AssetOverrideList,
} from "@/features/commission-config";

export default function CommissionConfigPage() {
  const { data: config, isLoading, error } = useCommissionConfig();

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-[1600px] flex-col px-3 sm:px-4">
        <PageContentLoader label="Loading commission configuration…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading commission configuration</h3>
          <p>{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Commission Configuration</h1>
          <p className="text-muted-foreground">
            Manage commission rates, fees, and thresholds.
          </p>
        </div>
        <div className="w-full sm:ml-auto sm:w-auto">
          <EditCommissionConfigDialog config={config} />
        </div>
      </div>

      <Tabs defaultValue="current" className="min-w-0">
        <TabsList className="h-auto min-h-9 w-full max-w-full flex-wrap justify-start gap-1 sm:w-fit">
          <TabsTrigger value="current">Current Config</TabsTrigger>
          <TabsTrigger value="history">Change History</TabsTrigger>
          <TabsTrigger value="overrides">Per-Asset Overrides</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4 min-w-0">
          <CommissionRatesCard config={config} />
        </TabsContent>

        <TabsContent value="history" className="mt-4 min-w-0">
          <ConfigHistoryTable />
        </TabsContent>

        <TabsContent value="overrides" className="mt-4 min-w-0">
          <AssetOverrideList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
