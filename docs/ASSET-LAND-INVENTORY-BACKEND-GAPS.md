# Asset Land/Inventory — outstanding backend work

For the `abode-be-v2` team. Everything below was confirmed either by reading the current `asset`, `asset-cost`, and `asset/land` module source directly, or reproduced live against `https://api-v2-staging.abodeflex.ng` during a manual QA pass of the Land Inventory & Field Performance sprint. Each item says which.

The admin FE (`abode-fe-admin`) hides every widget/tab listed in §1 that is still missing outside mock-mode dev, rather than show it permanently broken against the real API — see `lib/mocks/config.ts`'s `isMockApiEnabled()` and its call sites (e.g. `app/(dashboard)/assets/[id]/blocks/page.tsx`).

---

## 1. Endpoints that don't exist yet

Each of these has a real, working screen in the admin FE, built and tested against a mock server, with no matching real route. Confirmed live — each 404s against staging.

### 1.1 Offer configuration history — RESOLVED 8 Oct 2026

```
GET /admin/assets/:assetId/offers/history   ✅ real (asset-admin controller, `view_assets`)
```

This used to 404 on staging. It shipped with the Flex 2.0 work (`abode-be-v2` PR #95, `AssetService.offerHistory`), confirmed in source and in the live OpenAPI. It is paged (`?page=1&limit=50`, newest first) and each entry carries `version`, `action`, `summary`, `changed_by` (an email), `changed_at` and `size_id`; pricing entries (`publish-pricing`, `convert-pricing`) also carry `pricing_version`, `purchase_count`, `pending_transfer_count` and `superseded`. The admin FE's History button is no longer mock-only — `AssetOffers.tsx` no longer checks `isMockApiEnabled()` for it.

### 1.2 Asset-wide plot inventory — RESOLVED, was never actually missing

```
GET /admin/assets/:assetId/plots        ✅ real (field-staff module)
GET /admin/assets/:assetId/plots/summary ✅ real too (same controller; totals and readiness without the rows) — corrected 2026-10-01, not consumed by the FE yet
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

### 1.5–1.7 Subscribers, estate updates, per-asset analytics — RESOLVED, were never missing

```
GET  /admin/assets/:id/subscribers (+ /export)                    ✅ real (asset-analytics module)
GET  /admin/assets/:id/analytics                                  ✅ real (asset-analytics module)
GET/POST/PATCH /admin/assets/:id/updates (+ /publish, /archive)   ✅ real (estate-update module)
```

Corrected 2026-10-01. Earlier versions of this section said all three 404'd and had no backend module; that was wrong. Re-verified against `abode-be-v2` staging source (`asset-analytics.controller.ts`, on staging since 1 Sep; `estate-update-admin.controller.ts`, since 17 Sep) and the live OpenAPI document at `https://api-v2-staging.abodeflex.ng/api/docs-json`, which lists every route above. The FE schemas (`asset-analytics.schema.ts`, `asset-subscribers.schema.ts`, `estate-update.schema.ts`) match the backend DTOs field for field, so the Performance, Customers and Updates tabs are no longer gated behind mock mode.

One real gap remains here: the subscribers `aggregates` block is dropped by the global `TransformInterceptor` (see `asset-subscribers.schema.ts`'s header), so the Customers summary strip is still page-scoped.

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

---

## 6. Found while rebuilding the Overview tab against the asset-detail design (2026-10-01)

### 6.1 `GET .../sqm-inventory` — `totals` double-counts every sized purchase

**Confirmed via source**, `sqm-inventory.service.ts`: `keysFor()` returns `[poolKey, key]` for a sized purchase, so `move()` takes the same sqm out of both the product's pool row (`size_id: null`) and the size's own row. `positionFor()` then builds `totals` by reducing over **every** row, pool and size alike — so `totals.capacity_sqm`, `selling_sqm`, `sold_sqm` and `available_sqm` count each sized sale twice (and add size capacity on top of the pool capacity that already contains it).

The FE no longer reads `totals` for these; it rolls up the pool rows itself (`productPositions()`/`ledgerTotals()` in `sqm-inventory.schema.ts`, covered by `scripts/product-position-qa.ts`). **Suggested fix**: sum pool rows only for the commercial totals.

### 6.2 Design figures with no backend source

Each is drawn in the design and left out (or shown as an em-dash) on the Overview rather than faked:

- **Event reserved, per product** (Product position table) — an allocation event carries one `reserved_size` total, not a per-product split.
- **Value lens and per-status units** (Product position table) — the ledger reports one `purchase_snapshot_value` and one `units` figure per row across all live plans, not one per status (available/selling/sold/defaulted).
- **Defaulted-retained as its own bucket** (header bar) — `defaulted_sqm` is an overlay on live plans, a subset of selling/sold, so it can't be drawn as a separate slice of capacity.
- **Cost paid / committed cost totals** (Financial position) — profitability recognises one cost number; there is no estate-level total per financial stage. (The Costs tab's summary strip needs the same thing: budget, committed, incurred, paid.)
- **State** (Asset details) — the asset has `asset_location` only, no separate state field.
- **A single asset history feed** (the design's Updates tab) — history exists per module (`land-configuration/history`, `selling-charges/history`, `field-history`) but nothing merges land, price, cost and field changes into one timeline.

### 6.3 Sections 2, 3 and 4 above are resolved on the backend (commit 0f042ef, 28 Sep 2026)

- **Section 2** (land configuration PUT returning `id: null`): the response is now recomputed from a fresh read.
- **Section 3** (selling charges PUT with no concurrency guard): `expected_version` is now required; a stale save is a 409 `SELLING_CHARGE_VERSION_CONFLICT`.
- **Section 4** (no scheduled future price change): a version can now be approved for a future `effective_date`; `GET .../selling-charges` returns `in_force`, `scheduled[]` and `latest_version`.

The frontend was only brought up to this selling-charges contract on 2026-10-01. Until then every selling-charges read failed schema validation against the real API and was shown as an empty state. Other schemas (asset costs, profitability, site setup, plot inventory, land configuration) have not been re-compared with the backend since that commit.
