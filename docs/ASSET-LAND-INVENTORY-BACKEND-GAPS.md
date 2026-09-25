# Asset Land/Inventory — outstanding backend work

For the `abode-be-v2` team. Everything below was confirmed either by reading the current `asset`, `asset-cost`, and `asset/land` module source directly, or reproduced live against `https://api-v2-staging.abodeflex.ng` during a manual QA pass of the Land Inventory & Field Performance sprint. Each item says which.

The admin FE (`abode-fe-admin`) hides every widget/tab listed in §1 outside mock-mode dev, rather than show it permanently broken against the real API — see `lib/mocks/config.ts`'s `isMockApiEnabled()` and its call sites in `app/(dashboard)/assets/[id]/blocks/page.tsx`, `.../performance/page.tsx`, `.../customers/page.tsx`, `.../updates/page.tsx`, `AssetOffers.tsx`, and `AssetDetailNav.tsx` (which drops the Performance/Customers/Updates tabs from the nav entirely outside mock mode).

---

## 1. Endpoints that don't exist yet

Each of these has a real, working screen in the admin FE, built and tested against a mock server, with no matching real route. Confirmed live — each 404s against staging.

### 1.1 Offer configuration history

```
GET /admin/assets/:assetId/offers/history
```

**Confirmed live**:
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Cannot GET /api/v1/admin/assets/:assetId/offers/history?page=1&limit=50"
}
```
**Confirmed via source**: full-tree search for `offers/history` and for any history-shaped route in `asset-admin.controller.ts` — no such route exists anywhere. The nearest real analogue is `GET /admin/assets/:assetId/land-configuration/history` (and `/history/:version`), but that audits land pool/non-saleable changes, not offer/size/plan changes — a different resource entirely.

**Why it matters**: the Offers tab's "History" button (an activity log of every add-offer/add-size/add-plan/edit-plan action) has nowhere to read from. Not urgent, but if this is wanted for real, it needs a new audit-log endpoint on the offer/size/plan tree specifically — the land-configuration one can't be repurposed.

### 1.2 Asset-wide plot inventory — RESOLVED, was never actually missing

```
GET /admin/assets/:assetId/plots        ✅ real (field-staff module)
GET /admin/assets/:assetId/plots/summary ❌ genuinely doesn't exist
```

Re-verified directly against `abode-be-v2` staging source: `GET .../plots` is real, on `AssetSiteSetupController`/`SiteSetupService.plotInventory()` — the original "no asset-wide listing exists" claim here was wrong. What actually broke it was a shape mismatch, not a missing route: the real endpoint returns a field-ops readiness view (parcelation/clearing/allocation-readiness, nested as `{asset, plots, totals, filtered_totals, allocation_readiness}`) rather than the flat, customer/ground-confirmed-shaped paginated array this app had invented — and its params are `search/block/size/product/status/allocation/field_state`, not this app's old `block_id/min_size/max_size`. `PlotInventoryPanel` has been rebuilt against the real shape (see `plot-inventory.schema.ts`'s header) and now renders in real mode too, not just mock mode. `.../plots/summary` was this app's own invention and has been removed — the real endpoint returns its totals inline instead.

Its internal ground-confirmation badge (§1.3 below) is a separate, still-unverified feature and stays mock-only-gated within the panel.

### 1.3 Ground confirmation

```
GET/POST /admin/plots/:plotId/ground-confirmation
POST /admin/plots/:plotId/ground-confirmation/:id/verify
```

Fully greenfield on the FE side by its own doc comment (`ground-confirmation.schema.ts`) — a per-plot field submission, separate from `Plot.status`'s "system allocated" flag, meant to be confirmed on the ground by whoever visits it. No backend route exists for this at all.

**Why it matters**: this is a real, wanted capability (the underlying ticket was "separate system allocation from ground confirmation" — today `Plot.status` is set the instant a purchase is bound, with nothing behind whether anyone actually verified the plot in person). It needs to be built from scratch if the product still wants it — the FE model (`GroundConfirmationSchema`: `plot_id`, `submitted_by`, `verified_by`, `verified_at`, evidence) is a reasonable starting spec.

### 1.4 Inventory reconciliation (physical vs. commercial, by size)

```
GET /admin/assets/:assetId/inventory-reconciliation
```

A deliberately partial (by-size, not by-product) join between physical plot status and commercial sales data. Entirely provisional on the FE side — no backend module exists. Both status matrices (physical and commercial) and the reconciliation panel itself all read from this one endpoint, so all three are affected together.

**Why it matters**: this is separate from, and does not duplicate, §3 below (the real sqm-inventory reconciliation) — this one is about physical plots vs. commercial sales counts, not sqm capacity readiness. If wanted for real, it's new backend work; the FE's `InventoryReconciliationPanel` is otherwise usable as a spec for the shape (per-size physical/commercial rows, estate totals, exception codes for oversold/no-physical-plots/no-sales-data).

### 1.5 Asset subscribers (customer list per estate)

```
GET /admin/assets/:assetId/subscribers
```

**Confirmed live**: 404. **Confirmed via source**: there is no controller anywhere that serves this. The only trace of the idea on the real backend is two unused permission keys, `view_asset_subscribers` and `export_asset_subscribers` (`src/common/permissions.ts`, seeded onto roles in `role.seed.ts`) — never referenced by any `@AdminAuth(...)` on any controller. This was never built, not merely renamed or moved; there's no alternate real route for "list the customers who bought into this specific asset" anywhere (checked every controller under `admin/assets/...`).

**Why it matters**: the Customers tab on an asset's detail page has nothing to call at all. If this is still wanted, it needs a new controller/route built from scratch — the two permission keys already exist and are already seeded, so at minimum the access-control half is halfway done.

### 1.6 Estate updates (per-asset announcement feed)

```
GET/POST /admin/assets/:assetId/updates
```

**Confirmed live**: 404. **Confirmed via source**: no "estate-update"/"asset-update"/"announcement" module exists anywhere in `src/modules/` (the full module list has 45+ entries and none is update/announcement-shaped), and `AssetAdminController` has no such routes. Nothing to build on top of — this would be new backend work end to end if still wanted.

**Why it matters**: the Updates tab on an asset's detail page has nothing to call at all.

### 1.7 Per-asset analytics — the whole Performance tab

```
GET /admin/assets/:assetId/analytics?filter=all_time
```

**Confirmed live**: 404. **Confirmed via source**: this route is entirely fictitious. The real, and only, analytics endpoint is:

```
GET /admin/assets/analytics/portfolio
```

— note `analytics` is a fixed path segment before `portfolio`, not `:assetId/analytics`. It takes **no query params at all** (`filter` included — the FE's assumed param doesn't exist either) and is **portfolio-wide**: every asset rolled up, plus a breakdown by category (flex/full-ownership/commercial/developer-plot). It does carry an `asset_details[]` array with one row per asset (`asset_id, name, location, available_sizes, total_units, min_price, max_price`), but that's a flat inventory summary, not the per-asset time-series/health data this tab needs — there is no per-asset analytics endpoint on the real backend at all, in any shape.

**Why it matters**: this is the single biggest gap in this document. The entire Performance tab — health bar, date-range filters, the payment plan matrix's size/plan breakdown — is built on this one fictitious call; nothing on the tab can render without it, including the profit columns this sprint added on top (those come from the real Costs & Profitability endpoint and would still need something to merge into). If a real per-asset analytics endpoint is ever built, it should probably reuse `admin/assets/analytics/portfolio`'s existing metric definitions (`gross_revenue`, `total_capacity_sqm`, `collection_efficiency`, `occupancy_rate`, `defaulting{...}`, etc.) scoped to one asset rather than inventing a new shape.

---

## 2. Land Configuration — `non_saleable[].id` returns `null` on a PUT that creates new rows

**Confirmed via source**, `land-configuration.service.ts`:

- `replaceConfiguration()` maps the incoming PUT body into a `proposed` object, where a row with no submitted `land_use_id` (which `LandUseConfigDto` explicitly allows, for a brand-new row) becomes `land_use_id: null`.
- `calculateLandConfiguration(proposed)` runs on this **pre-persistence** snapshot and carries `land_use_id: null` through unchanged for that row.
- The transaction then does persist the new row for real via `upsertLandUse()` → `this.landUseModel.create(...)`, which does generate a real ObjectId — but the returned document is discarded, never assigned back into `proposed`/`calculation`.
- After the transaction commits, the service re-reads the asset but calls `this.present(saved, calculation)` using the **stale** `calculation` object from before the write — so the response's `non_saleable[]` array still has `id: null` for every row that was newly created in that same save, even though the DB row now has a real id.

A subsequent `GET .../land-configuration` is unaffected — `getConfiguration()` recomputes from a fresh DB read, so real ids show up correctly there. It's specifically the **PUT response** for newly-created rows that's wrong.

**Confirmed live**: saving a new "Roads & services" row against a real estate returns a response the FE's own schema rejected (`data.non_saleable.0.id: Invalid input: expected string, received null`) — the FE has since been updated to accept this shape, but the underlying response is still wrong, and it's a bigger practical problem than a display quirk:

**This causes real data duplication if the FE ever trusted this response as its new source of truth**, which it briefly did (fixed on the FE side, but worth the backend team understanding the actual failure mode): if a UI caches this PUT's own response instead of re-fetching, the newly-created row's id stays `null` client-side. The *next* save then resubmits that row with no `land_use_id` at all — which `LandUseConfigDto` correctly interprets as "create a new row" rather than "update this one" — silently duplicating it, while the original row (now orphaned from the client's perspective, since the client never learned its real id) can drop out of what gets resubmitted, and may get deactivated/removed if `replaceConfiguration()` treats an omitted existing row as retired. Confirmed live: adding a "Roads & services" row, saving, then re-opening the editor made the newly-added row silently stop persisting on the next save — exactly this mechanism. The FE now forces a fresh GET after any save whose response contains an unresolved `null` id, specifically to avoid this, but that's a client-side workaround for a real server-side correctness issue, not a fix for the root cause.

**Suggested fix**: after the transaction commits, recompute `calculation` from a fresh `loadCurrent(saved)` (the same call `getConfiguration()` already makes) before calling `present()`, instead of reusing the pre-persistence one — or thread the real inserted `_id`s back into `proposed` before the calculation step.

---

## 3. Selling Charges — no optimistic-concurrency guard on the PUT

**Confirmed via source**, `selling-charge.service.ts`'s `setCharges()`: it reads the current highest version and unconditionally supersedes it — no `expected_version` field on `SetSellingChargesDto`, no check against a stale read. Two admins editing the same estate's charges at once will have one silently overwrite the other with no conflict signal to either of them.

**Why it matters**: every other versioned write in this feature set (Land Configuration, Costs & Profitability allocation rules) carries some form of "you're not editing a stale version" protection. Selling Charges is buyer-facing pricing and currently has none. Worth the same `expected_version` pattern Land Configuration already uses if this is meant to be as safe as the rest.

---

## 4. No backend concept of a scheduled, multi-step future price change

Before this sprint, the admin FE had a mock-only "price-step schedule" feature: queue several future price points for one plan in a single save (e.g. ₦2.0M from Jan 1, ₦2.2M from Apr 1, ₦2.5M from Jul 1), with each step showing a computed "passed / current / upcoming" status. That entire per-plan pricing design was retired this sprint in favour of Selling Charges (§3's module) — but Selling Charges has no equivalent capability at all: every save takes effect as the current version immediately, with no way to queue a dated future change and no automatic activation-on-date logic anywhere in `SetSellingChargesDto`/`setCharges()`.

**Why it matters**: if the business still needs to plan and communicate a multi-step future price ramp, that capability doesn't exist anywhere in the current real contract and would need new backend work (a scheduled/pending version concept with either a cron-driven activation or an explicit "effective as of" query param on `current()`) — it is not something the FE can reconstruct on top of the existing single-current-version model.

---

## 5. A size's `configured_units` field is a stale, leaked internal duplicate of `units_available`

**Confirmed via source**, `asset.service.ts`: on create, `sizeFields()` sets both `units_available: dto.units_available` and `configured_units: dto.units_available` (line ~751) — the two start out identical. But `updateSize()` (line ~525) only ever writes `fields.units_available = dto.units_available` on an edit; `configured_units` is never touched again after creation. The two fields silently diverge the first time anyone edits a size's unit count.

This wouldn't matter if `configured_units` weren't visible to API consumers — but it is: `GET /admin/assets/:id` (`buildDetail()`) doesn't serialize sizes through the real, intentional `SizeDto` (which only ever declares `size_sqm, units_available, document_fee, plans` — no `configured_units` at all); it spreads the raw Mongoose document instead, so the internal, stale field leaks straight into the response alongside the real one.

**Confirmed live**: editing an existing size's units (`PATCH .../sizes/:sizeId` with a new `units_available`) succeeds and genuinely updates `units_available`, but the size's `configured_units` in the very next `GET /admin/assets/:id` still reads the old, pre-edit value — because it was never touched by the update. Any client (this one included, until now) that happens to read `configured_units` instead of `units_available` will show stale capacity data after every single size edit, with no error or signal that anything is wrong.

**Suggested fix**: either (a) serialize sizes through the real `SizeDto` on this endpoint too, so the unofficial internal field stops being visible to clients at all, or (b) have `updateSize()` mirror `configured_units` from `units_available` the same way creation does, so the two never diverge in the first place. Either closes the gap; (a) is probably the more correct one, since `configured_units` was never meant to be a public field.
