# Assets Admin — Frontend Design

Design for the asset administration surface in `abode-admin-fe`.

**This is not a transport migration.** The backend's data model changed shape,
so the screens are rebuilt against a different structure rather than ported.
Read §1 before anything else — it is the decision every other choice follows
from.

Written against the target backend contract. Gaps are marked
`⛔ ticket N` (see `docs/BACKEND-REQUESTS.md`) rather than designed around.

---

## 1. The model changed: an asset is a place, not a product type

**v1.** An asset *is* a type — `asset_type: "flex"` or `"full-ownership"`. That
produced two of everything: two tables, two create forms, two edit forms, two
detail routes.

**v2.** An asset is a place. What it sells is an *offer*:

```
Asset             name · location · amenities · documents · sales_cap · visibility
  └─ AssetOffer   offer_type: flex | full-ownership · allocation_qualification_pct · payment_type
       └─ Size    size_sqm · units_available · document_fee?
            └─ Plan   tenor_months · land_price · initial_payment · monthly_installment
```

`AssetOffer` is unique on `(asset_id, offer_type)`, so **one asset can sell both
flex and full-ownership at the same time.** v1 could not express that at all.

Everything below follows from this. There is no flex table and no
full-ownership table — there is a table of assets, and offer type is a property
of the row.

---

## 2. Routes

Six routes collapse to two, plus sub-routes on the detail page:

```
/assets                       single list   was: one page, two tables
/assets/create                create        was: /create-flex + /create-full-ownership
/assets/[id]                  overview      was: /assets/flex/[id] + /assets/fullownership/[id]
/assets/[id]/offers           offers
/assets/[id]/performance      analytics     ⛔ sample data (ticket 17b)
/assets/[id]/customers        subscribers   ⛔ no endpoint  (ticket 17c)
```

**There is no `/edit` route.** Editing happens in place on the detail page —
each panel swaps between a read view and a form, and saves against its own
endpoint. The backend has six granular offer/size/plan endpoints plus a
`PATCH /admin/assets/:id`, so nothing needs a whole-asset edit screen; a panel
that owns one endpoint is the honest shape. Read-first, because the common
visit is to look something up.

Nav is unchanged — one "Assets" item, as today. Sub-routes give each tab a URL,
so a filtered view is linkable and the back button behaves.

---

## 3. The list — `/assets`

`GET /admin/assets`, paginated, sorted `createdAt: -1`.

Each row is the whole asset plus a per-offer summary the backend aggregates in
one query:

```ts
offers: [
  { offer_type: 'flex',           is_active, size_count, plan_count },
  { offer_type: 'full-ownership', is_active, size_count, plan_count },
]
```

### Columns

| Column | Content |
|---|---|
| **Asset** | Name, with location muted beneath |
| **Offers** | A badge per offer type — see below |
| **Inventory** | `available_units`, with sold and reserved beneath |
| **Status** | Visibility badge, plus a "Sold out" chip when `sold` |
| **Created** | Date |
| — | View · Edit · Delete |

**No price column.** The summary carries counts, not money, so price would need
a second request per row. Price lives on the detail page.

### The offers cell

```
● Flex              3 sizes · 9 plans
○ Full ownership    2 sizes · 4 plans     ← outlined = inactive
```

Filled badge when `is_active`, outlined and muted when not. One badge, two
badges, or — when every offer is inactive — the words "No active offers"
rather than two greyed badges with no explanation.

This cell is the whole reason a single table works.

### Inventory is real data

`sales_cap`, `sold_units` and `reserved_units` are real fields;
`available_units` is a backend virtual returned via `toJSON({ virtuals: true })`.
So the allocation figures here are genuine — unlike the analytics panels above
them (§4), which are not.

### Filters

All five map exactly to `AssetFilterDto`, all URL-driven:

| Filter | Notes |
|---|---|
| **Search** | Real and server-side — regex over `name` **and** `asset_location` |
| **Visibility** | draft · internal · public |
| **Offer type** | A facet, not a mode switch — see below |
| **Sold** | boolean |
| **Include deleted** | boolean; soft-deleted rows are hidden by default |

`offer_type` filters to assets that *have* that offer, and narrows each row's
`offers[]` to just that type. So "show me the flex catalogue" works without
reintroducing two tables.

Assets handles boolean query params correctly —
`@Transform(({ value }) => value === 'true' || value === true)` — so
ticket 12's coercion bug does not apply here.

### Deletion is soft

`DELETE /admin/assets/:id` sets `deleted_at`. The confirm dialog says the asset
is hidden from the catalogue and recoverable, not that it is destroyed — the
same honesty as the commission revoke dialog.

### No sorting

`findAllPaginated` sorts `createdAt: -1` with no sort parameter, so column
headers are not clickable. Fine at current volume; a real limitation on a
catalogue that grows. ⛔ ticket 16.

---

## 4. Analytics are sample data, and say so

Four panels have **no backend**. There is no asset analytics endpoint, no
subscriber endpoint, and no statements endpoint.

| Panel | Scope | Fixture |
|---|---|---|
| `InventoryHealthBar` | Portfolio, on `/assets` | `SAMPLE_PORTFOLIO` |
| `AssetCategoryHealth` | Portfolio, on `/assets` | `SAMPLE_CATEGORIES` |
| `AssetHealthBar` | One asset, on the Performance tab | `SAMPLE_ASSET_HEALTH` |
| `PaymentPlanMatrix` | One asset, on the Performance tab | `SAMPLE_SIZE_PLANS` |

They stay on the page so the design reads as a whole, fed by local fixtures —
and each panel carries a **"Sample data"** chip. The Performance tab carries a
banner as well, since every figure on it is invented.

The reasoning is the same as the em-dash rule: an em-dash says *unknown*, but a
chart reading "₦45m sold · 62% allocated" says something specific and
confident. Demo screenshots get pasted into decks, and unmarked figures get
believed.

The two per-asset fixtures reconcile with each other — `SAMPLE_ASSET_HEALTH`
totals equal the sum of `SAMPLE_SIZE_PLANS`. Figures that visibly disagree on
one screen read as a bug rather than as sample data.

Customers is the deliberate exception: **not** mocked (⛔ ticket 17c).
Fabricating an aggregate is one thing; inventing named customers with balances
owed is the kind of thing someone acts on.

All four moved off `FragmentType`/`useFragment` as part of this — those are
GraphQL-only and are gone, so the components take plain typed props.

---

## 5. Feature structure

```
features/assets/
  components/
    list/        AssetsTable · AssetFilters · AssetOffersCell · AssetStatusBadges
                 DeleteAssetDialog
    create/      CreateAssetForm · FormSection · OfferSection · PlanRow
                 PlanGeneratorDialog · UploadFields
    detail/      AssetDetailShell · AssetDetailNav · AssetOverview · AssetOffers
                 EditablePanel · EditAssetSections · OfferEditDialogs
                 SampleDataBanner · AssetHealthBar · PaymentPlanMatrix
    analytics/   SampleDataChip · sample-data.ts
    (root)       InventoryHealthBar · AssetCategoryHealth
  hooks/
    query-keys.ts · use-asset-list.ts · use-asset-detail.ts
    use-offer-mutations.ts · use-create-asset-v2.ts · use-asset-upload.ts
  schemas/
    asset.schema.ts         list entity + offer summary
    asset-detail.schema.ts  the full asset → offer → size → plan tree
    create-asset.schema.ts  create form + the six backend rules, derivePlan
    edit-asset.schema.ts    per-section edit forms + validateSalesCap
  store/
    asset-form-store.ts     section open/edit state, uploads, plan generator
```

Contracts are `Pick<Asset, …>` from the Zod-derived entity type.

Nothing in this feature uses GraphQL. The v1 flex/full-ownership routes, forms
and detail components were deleted once the rebuild landed — see §9.

---

## 6. Backend gaps

| Gap | Effect | Ticket |
|---|---|---|
| ~~An asset can never gain a second offer~~ | ✅ Resolved 2026-07-28 — `POST …/offers` exists and the offers tab has an Add offer action for the missing type | 18 |
| No add-plan endpoint ~~; tenor is immutable~~ | ✅ Add half resolved 2026-07-28 — `POST …/plans` adds atomically, 409 on duplicate tenor. **Re-tenoring still full-replaces `plans[]`** | 19 |
| No `Block` / `Plot` collection | `BlocksManager` has no backend, and `payment-plan.schema.ts` has `plotId: { ref: 'Plot' }` pointing at a model that was never built | 17 |
| No asset analytics endpoint | §4 panels are sample data | 17 |
| No subscribers endpoint | Customers tab states the position instead — deliberately not mocked | 17c |
| No statements endpoint | Only an `AdminLog` action name and an empty cron stub. Surface dropped | 17 |
| No sort parameter | Fixed `createdAt: -1` | 16 |
| Money is whole naira | Sub-naira precision unavailable — see below | 5 |

**Ticket 18 is the one that matters here.** The headline change in v2 is that an
asset can sell both offer types; being unable to add the second one later means
the create form is the only place that is ever decided.

**Ticket 5 turned out not to block this work**, contrary to an earlier draft of
this document. Money fields are `@IsInt()`, so whole naira only — but the plan
arithmetic carries a tolerance of `max(1, tenor)` months, and the worst-case
rounding error from whole-naira instalments is `0.5 × (tenor − 1)`. Whole naira
therefore always fits, at any tenor. Verified across 36 tenor/base
combinations; the largest observed drift was ₦56 against a ₦120 tolerance. What
is actually lost is sub-naira precision, which land pricing does not use.

---

## 7. Plan arithmetic

Create and edit both enforce the backend's rules client-side before submit,
because the backend validates the asset **atomically** — one bad plan rejects
the entire create:

```
tenor 0   →  monthly_installment must be 0, initial_payment must equal land_price
tenor n   →  initial_payment + monthly_installment × (n − 1) ≈ land_price
             tolerance: max(1, tenor_months)
```

**Tenor 1 is the trap.** The formula collapses to `initial_payment` at n = 1, so
a one-month plan must be paid in full up front — `derivePlan` treats tenor 0 and
tenor 1 identically. Generating `land_price / 1` as a monthly instalment instead
produces a plan the backend rejects, taking the whole asset with it.

Tenors are unique per size, and a plan has no `_id` — it is addressed by tenor.

**Write surfaces with no backend** are rendered but disabled, so the design
shows the slot without letting an admin type work into a void. Blocks and plots
is the remaining one (⛔ ticket 17a).

---

## 8. Build order

1. Entity schema + query keys
2. `use-asset-list` + mock route returning the real row shape
3. `AssetsTable` + offers cell + status badge
4. `AssetFilters`
5. Convert the portfolio analytics panels off `FragmentType`, add sample data
   and the "Sample data" chip
6. New `/assets` page; delete `AssetFlexTable` and `AssetFullOwnershipTable`
7. Delete asset — confirm dialog, soft-delete wording
8. Create — one form, collapsible sections, plan generator, Zustand-backed
9. Detail shell + sub-routes; per-section editing against the six nested
   endpoints
10. Convert the per-asset analytics panels; delete the v1 routes (§9)

---

## 9. What the rebuild replaced

Deleted once the v2 screens landed. Nothing was kept for compatibility — no
admins are on the panel yet, so there was nothing to keep working.

| Gone | Replaced by |
|---|---|
| `/assets/create-flex`, `/assets/create-full-ownership` | `/assets/create` — offer type is a section, not a route |
| `/assets/flex/[id]`, `/assets/fullownership/[id]` (+ `/edit`) | `/assets/[id]` and its four sub-routes |
| `CreateFlexAssetForm`, `CreateFullOwnershipAssetForm`, both `Edit*Form`s, both `*PageClient`s, `components/form/*` | `create/CreateAssetForm` + `detail/EditAssetSections` |
| `AssetDetailHeader`, `AssetDetailFilters`, `AssetInventory`, `AssetSizesInventory`, `AssetAnalyticsSection` | `detail/AssetDetailShell` + `AssetDetailNav` |
| `SubscribedCustomers`, `BlocksManager`, `SendAssetStatementsModal` | Disabled panels / stated-gap tabs — none of the three had a backend |
| `AssetInventoryOverview`, `AssetPageHeader`, `StatCard` | Folded into the new list page |
| `use-assets`, `use-create-asset`, `use-update-asset`, `use-blocks`, `use-plots`, `use-available-plots`, `use-asset-subscribers` | `use-asset-list`, `use-asset-detail`, `use-offer-mutations`, `use-create-asset-v2` |
| `lib/schemas/assets.ts` | `schemas/create-asset.schema.ts`, `schemas/edit-asset.schema.ts` |

One exception: `useAssetIdByName` and `useAvailablePlotsForAsset` moved to
`features/allocation/hooks/use-plots.ts` rather than being deleted.
`AllocationModal` was the only consumer outside this feature, allocation is
still on GraphQL, and plot allocation is an allocation concern — moving them
kept the assets feature GraphQL-free without holding the migration open. They
go when allocation is rebuilt.
