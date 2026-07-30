"use client";

import { useParams } from "next/navigation";
import { Ban } from "lucide-react";

import { formatNaira } from "@/lib/utils/format";

import {
  TOPOGRAPHIES,
  VISIBILITY_LABELS,
  type Visibility,
} from "../../schemas/asset.schema";
import type { AssetDetail } from "../../schemas/asset-detail.schema";
import { useAssetDetail } from "../../hooks/use-asset-detail";
import { EditablePanel } from "./EditablePanel";
import {
  AssetAvailabilityFields,
  AssetDetailsFields,
  AssetMediaFields,
  useAssetAvailabilitySection,
  useAssetDetailsSection,
  useAssetMediaSection,
} from "./EditAssetSections";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm wrap-break-word">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

/** Read-only panel — used for value history, which has no edit endpoint. */
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="font-medium">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

const DOCUMENT_LABELS = {
  deed_of_assignment: "Deed of assignment",
  survey: "Survey",
  contract_of_sales: "Contract of sales",
  estate_layout: "Estate layout",
} as const;

function documentStatus(asset: AssetDetail) {
  return (Object.keys(DOCUMENT_LABELS) as (keyof typeof DOCUMENT_LABELS)[]).map((key) => ({
    key,
    label: DOCUMENT_LABELS[key],
    url: asset.documents?.[key] ?? null,
  }));
}

export function AssetOverview() {
  const params = useParams<{ id: string }>();
  const { data: asset } = useAssetDetail(params.id);

  // Called before the early return — hooks can't be conditional. Each seeds
  // itself from the asset when its section is opened for editing.
  const details = useAssetDetailsSection(asset);
  const availability = useAssetAvailabilitySection(asset);
  const media = useAssetMediaSection(asset);

  if (!asset) return null;

  const topography = asset.topography as (typeof TOPOGRAPHIES)[number] | null | undefined;

  return (
    <div className="space-y-4">
      <EditablePanel
        id="details"
        title="Asset details"
        isSaving={details.isSaving}
        onSave={details.submit}
        form={<AssetDetailsFields form={details.form} />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Location" value={asset.asset_location} />
          <Field label="Purpose" value={asset.asset_purpose} />
          <Field
            label="Topography"
            value={topography ? <span className="capitalize">{topography}</span> : null}
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
            label="Map"
            value={
              asset.google_map ? (
                <a
                  href={asset.google_map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4"
                >
                  Open in Google Maps
                </a>
              ) : null
            }
          />
        </div>

        {asset.description ? (
          <div className="mt-4 border-t pt-4">
            <Field label="Description" value={asset.description} />
          </div>
        ) : null}
      </EditablePanel>

      <EditablePanel
        id="availability"
        title="Availability"
        description="Sold and reserved counts are derived — they can't be edited."
        isSaving={availability.isSaving}
        onSave={availability.submit}
        form={<AssetAvailabilityFields form={availability.form} asset={asset} />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Sales cap" value={asset.sales_cap.toLocaleString()} />
          <Field label="Visibility" value={VISIBILITY_LABELS[asset.visibility as Visibility]} />
          <Field label="Sold" value={asset.sold_units.toLocaleString()} />
          <Field label="Reserved" value={asset.reserved_units.toLocaleString()} />
        </div>
      </EditablePanel>

      <EditablePanel
        id="media"
        title="Images and documents"
        isSaving={media.isSaving}
        onSave={media.submit}
        form={<AssetMediaFields form={media.form} />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Hero image"
            value={
              asset.hero_image ? (
                <a
                  href={asset.hero_image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4"
                >
                  View
                </a>
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

        <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {documentStatus(asset).map((doc) => (
            <Field
              key={doc.key}
              label={doc.label}
              value={
                doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                  >
                    View
                  </a>
                ) : null
              }
            />
          ))}
        </div>
      </EditablePanel>

      {asset.asset_history.length > 0 ? (
        <Panel title="Value history">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {asset.asset_history.map((entry) => (
              <Field key={entry.year} label={String(entry.year)} value={formatNaira(entry.value)} />
            ))}
          </div>
        </Panel>
      ) : null}

      {/*
        ⛔ ticket 17a — there is no Block or Plot model on the backend. Shown
        disabled so the slot is visible in the design, but never as a working
        form: an admin creating blocks that vanish on reload is worse than a
        blank space.
      */}
      <section className="rounded-lg border border-dashed">
        <div className="flex items-start gap-2.5 p-4">
          <Ban className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <h2 className="font-medium text-muted-foreground">Blocks and plots</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Plot-level allocation isn&apos;t available — the backend has no Block or Plot model.
              Whether it&apos;s part of v2 at all is an open question.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
