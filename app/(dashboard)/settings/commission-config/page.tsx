"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCommissionConfig,
  CommissionRatesCard,
  EditCommissionConfigDialog,
  ConfigHistoryTable,
  AssetOverrideList,
} from "@/features/commission-config";

export default function CommissionConfigPage() {
  const [activeTab, setActiveTab] = useState("current");
  const { data: config, isLoading, error } = useCommissionConfig();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading commission configuration</h3>
        <p>{(error as Error).message}</p>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commission Configuration</h1>
          <p className="text-muted-foreground">
            Manage commission rates, fees, and thresholds.
          </p>
        </div>
        {activeTab !== "overrides" && (
          <EditCommissionConfigDialog config={config} />
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="current">Current Config</TabsTrigger>
          <TabsTrigger value="history">Change History</TabsTrigger>
          <TabsTrigger value="overrides">Per-Asset Overrides</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4">
          <CommissionRatesCard config={config} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <ConfigHistoryTable />
        </TabsContent>

        <TabsContent value="overrides" className="mt-4">
          <AssetOverrideList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
