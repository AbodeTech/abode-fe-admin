"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import { formatNairaCompact } from "@/lib/utils/format";

import { TOPOGRAPHIES } from "../../schemas/asset.schema";
import type { AssetDetail } from "../../schemas/asset-detail.schema";
import { useAssetDetail } from "../../hooks/use-asset-detail";
import { EditablePanel } from "./EditablePanel";
import { AssetEditFields, useAssetEditSection } from "./EditAssetSections";
import { AllocationEventReadinessCard } from "./AllocationEventReadinessCard";
import { AssetAttentionBanner } from "./AssetAttentionBanner";
import { FinancialPositionCard } from "./FinancialPositionCard";
import { LandAccountCard } from "./LandAccountCard";
import { ManagementSummaryCard } from "./ManagementSummaryCard";
import { PitchPackField } from "./PitchPackField";
import { ProductPositionTable } from "./ProductPositionTable";
import { SqmActivationNotice } from "./SqmActivationNotice";
import { LandAccountEditorDrawer } from "./LandAccountEditorDrawer";
import { LandConfigurationHistory } from "./LandConfigurationHistory";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm wrap-break-word">
        {value || <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
      {children}
    </a>
  );
}

/** Every document slot except the estate layout, which has its own field. */
const OTHER_DOCUMENT_LABELS = {
  deed_of_assignment: "Deed of assignment",
  survey: "Survey",
  contract_of_sales: "Contract of sales",
  brochure: "Brochure",
} as const;

function otherDocuments(asset: AssetDetail) {
  return (Object.keys(OTHER_DOCUMENT_LABELS) as (keyof typeof OTHER_DOCUMENT_LABELS)[]).flatMap((key) => {
    const url = asset.documents?.[key];
    return url ? [{ key, label: OTHER_DOCUMENT_LABELS[key], url }] : [];
  });
}

/**
 * The Overview tab, in the asset-detail design's order:
 *
 *   attention banner → Asset details → Land account | Management summary →
 *   Product position → Allocation event readiness | Financial position
 *
 * "Asset details" is the one editable panel. Its Edit form also carries
 * visibility, the sales cap, images and documents — all fields of the same
 * `PATCH /admin/assets/:id` — so they no longer need panels of their own.
 * The named roads & services rows live inside the land account's "Edit
 * breakdown" drawer, where they are edited.
 */
export function AssetOverview() {
  const params = useParams<{ id: string }>();
  const { data: asset } = useAssetDetail(params.id);

  // Called before the early return — hooks can't be conditional. It seeds
  // itself from the asset when the panel is opened for editing.
  const edit = useAssetEditSection(asset);

  const [landEditorOpen, setLandEditorOpen] = useState(false);
  const [landHistoryOpen, setLandHistoryOpen] = useState(false);

  if (!asset) return null;

  const topography = asset.topography as (typeof TOPOGRAPHIES)[number] | null | undefined;
  const documents = otherDocuments(asset);

  return (
    <div className="space-y-4">
      <AssetAttentionBanner assetId={asset._id} onReviewLand={() => setLandEditorOpen(true)} />

      <EditablePanel
        id="details"
        title="Asset details"
        isSaving={edit.isSaving}
        onSave={edit.submit}
        form={<AssetEditFields section={edit} asset={asset} />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Location" value={asset.asset_location} />
          <Field label="Purpose" value={asset.asset_purpose} />
          <Field
            label="Topography"
            value={topography ? <span className="capitalize">{topography}</span> : null}
          />
          <Field
            label="Map"
            value={asset.google_map ? <ExternalLink href={asset.google_map}>Open in Google Maps</ExternalLink> : null}
          />
          <Field
            label="Amenities"
            value={asset.amenities.length ? asset.amenities.join(" · ") : null}
          />
          <Field
            label="Landmarks"
            value={asset.landmark.length ? asset.landmark.join(" · ") : null}
          />
          <Field
            label="Estate layout"
            value={
              asset.documents?.estate_layout ? (
                <ExternalLink href={asset.documents.estate_layout}>View document</ExternalLink>
              ) : null
            }
          />
          <Field
            label="Gallery"
            value={
              asset.pictures.length
                ? `${asset.pictures.length} image${asset.pictures.length === 1 ? "" : "s"}`
                : null
            }
          />
        </div>

        {asset.description || documents.length > 0 || asset.asset_history.length > 0 ? (
          <div className="mt-4 grid gap-4 border-t pt-4 lg:grid-cols-2">
            {asset.description ? <Field label="Description" value={asset.description} /> : null}
            {documents.length > 0 ? (
              <Field
                label="Other documents"
                value={
                  <span className="flex flex-wrap gap-x-3 gap-y-1">
                    {documents.map((doc) => (
                      <ExternalLink key={doc.key} href={doc.url}>
                        {doc.label}
                      </ExternalLink>
                    ))}
                  </span>
                }
              />
            ) : null}
            {asset.asset_history.length > 0 ? (
              <Field
                label="Value history"
                value={asset.asset_history
                  .map((entry) => `${entry.year}: ${formatNairaCompact(entry.value)}`)
                  .join(" · ")}
              />
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 border-t pt-4">
          <PitchPackField asset={asset} />
        </div>
      </EditablePanel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(290px,0.75fr)]">
        <LandAccountCard
          assetId={asset._id}
          onEdit={() => setLandEditorOpen(true)}
          onViewHistory={() => setLandHistoryOpen(true)}
        />
        <ManagementSummaryCard assetId={asset._id} />
      </div>

      <SqmActivationNotice assetId={asset._id} />

      <ProductPositionTable assetId={asset._id} />

      <div className="grid gap-4 lg:grid-cols-2">
        <AllocationEventReadinessCard assetId={asset._id} />
        <FinancialPositionCard assetId={asset._id} />
      </div>

      <LandAccountEditorDrawer assetId={asset._id} open={landEditorOpen} onOpenChange={setLandEditorOpen} />
      <LandConfigurationHistory assetId={asset._id} open={landHistoryOpen} onOpenChange={setLandHistoryOpen} />
    </div>
  );
}
