"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useCostItems } from "../../hooks/use-cost-items";
import { useCostObligations } from "../../hooks/use-cost-obligations";
import type { AssetCostItem, AssetCostObligation, CostGroup } from "../../schemas/asset-cost.schema";
import { AddCostDrawer } from "./AddCostDrawer";
import { AddCostItemDialog, type AddCostItemInitialValues } from "./AddCostItemDialog";
import { AllocationRuleDialog } from "./AllocationRuleDialog";
import { AssetCostGroupTable } from "./AssetCostGroupTable";
import { CostCoveragePanel } from "./CostCoveragePanel";
import { CostDetailSheet } from "./CostDetailSheet";
import { EstateProfitabilityCard } from "./EstateProfitabilityCard";
import { ProductProfitabilityComparison } from "./ProductProfitabilityComparison";
import { ProfitabilityCalculationDrawer } from "./ProfitabilityCalculationDrawer";

/**
 * The Costs & Profitability tab, rewired to the real abode-be-v2 3-layer
 * model (cost item → obligation → stage event) confirmed on staging (PR
 * #82). Replaces the old flat "one record, five stage snapshots" model and
 * the estate-wide singleton "profitability basis" (deleted — allocation is
 * per shared cost item now, via `AllocationRuleDialog`).
 */
export function AssetCosts({ assetId }: { assetId: string }) {
  const permissions = useAdminPermissions();
  const canView = permissions.has("view_asset_costs");
  const canManage = permissions.has("manage_asset_costs");
  const canApprove = permissions.has("approve_asset_costs");
  const canViewProfitability = permissions.has("view_asset_profitability");

  const { data: items, isLoading: itemsLoading, error } = useCostItems(assetId, { enabled: canView });
  const { data: obligationsPage, isLoading: obligationsLoading } = useCostObligations(assetId, {}, { enabled: canView });

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addItemInitial, setAddItemInitial] = useState<AddCostItemInitialValues | undefined>(undefined);
  const [addObligationOpen, setAddObligationOpen] = useState(false);
  const [addObligationCostItemId, setAddObligationCostItemId] = useState<string | undefined>(undefined);
  const [selectedObligation, setSelectedObligation] = useState<AssetCostObligation | null>(null);
  const [allocationItem, setAllocationItem] = useState<AssetCostItem | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);

  function openAddItem(group: CostGroup) {
    setAddItemInitial({ group });
    setAddItemOpen(true);
  }

  function openAddObligation(costItemId: string) {
    setAddObligationCostItemId(costItemId);
    setAddObligationOpen(true);
  }

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-medium">You do not have permission to view asset costs.</p>
          <p className="mt-1 text-sm text-muted-foreground">An admin can grant the view_asset_costs permission.</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading costs</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  if (itemsLoading || obligationsLoading || !items || !obligationsPage) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-medium">Asset costs</h2>
          <p className="text-sm text-muted-foreground">Cost items, their records, and every recorded financial stage.</p>
        </div>
        {canManage ? (
          <Button type="button" size="sm" onClick={() => openAddItem("acquisition")}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add cost item
          </Button>
        ) : null}
      </div>

      <AssetCostGroupTable
        items={items}
        obligations={obligationsPage.items}
        canManage={canManage}
        onSelectObligation={setSelectedObligation}
        onAddObligation={openAddObligation}
        onAddItem={openAddItem}
        onSetAllocationRule={setAllocationItem}
      />

      <CostCoveragePanel assetId={assetId} canManage={canManage} onAddObligation={openAddObligation} />

      {canViewProfitability ? (
        <>
          <EstateProfitabilityCard assetId={assetId} onViewCalculation={() => setCalcOpen(true)} />
          <ProductProfitabilityComparison assetId={assetId} />
        </>
      ) : null}

      <AddCostItemDialog
        assetId={assetId}
        open={addItemOpen}
        onOpenChange={(open) => {
          setAddItemOpen(open);
          if (!open) setAddItemInitial(undefined);
        }}
        initialValues={addItemInitial}
      />

      <AddCostDrawer
        assetId={assetId}
        open={addObligationOpen}
        onOpenChange={(open) => {
          setAddObligationOpen(open);
          if (!open) setAddObligationCostItemId(undefined);
        }}
        initialValues={{ costItemId: addObligationCostItemId }}
      />

      <CostDetailSheet
        assetId={assetId}
        obligationId={selectedObligation?.id ?? null}
        open={selectedObligation !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedObligation(null);
        }}
        canManage={canManage}
        canApprove={canApprove}
      />

      <AllocationRuleDialog
        assetId={assetId}
        item={allocationItem}
        open={allocationItem !== null}
        onOpenChange={(open) => {
          if (!open) setAllocationItem(null);
        }}
      />

      {canViewProfitability ? <ProfitabilityCalculationDrawer assetId={assetId} open={calcOpen} onOpenChange={setCalcOpen} /> : null}
    </div>
  );
}
