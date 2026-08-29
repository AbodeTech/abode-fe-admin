# Asset CRUD Module — Additions

**Version:** 1.1
**Date:** 2026-08-18
**Status:** Additive changes to the already-locked ASSET-CRUD-DESIGN.md (v1.0). Non-breaking. Safe to layer on top of in-flight implementation.
**Base doc:** ASSET-CRUD-DESIGN.md v1.0
**Driven by:** COMMERCIAL-PURCHASE-DESIGN.md (CP-1, CP-2)

**v1.1 change (2026-08-18):** v1.0 shipped AC-ADD-01..07 but omitted the service layer, on the assumption that "service filter passes through naturally". The filter does; the FO-specific field handling does not — it is seven literal `=== 'full-ownership'` comparisons that an enum extension cannot reach. Result: a commercial offer passes validation and then **loses `payment_type` and `document_fee` on the way to disk**. Adds AC-ADD-08 to close it, strengthens AC-ADD-06 so this class of gap fails a test, and records an undocumented list-aggregation rule (§3). No change to AC-ADD-1 / AC-ADD-2 as approved.

---

## 1. What this doc is

Two small additive changes enabling commercial plots as a peer product to Flex and Full Ownership. Both are enum extensions on the existing AssetOffer schema — no new collections, no breaking changes. B-24 in the base design doc already anticipated this: `offer_type` was explicitly built extensible.

---

## 2. Additions

### AC-ADD-1 — Extend `AssetOffer.offer_type` with `'commercial'`

**What:** `offer_type` currently accepts `'flex' | 'full-ownership'`. Add `'commercial'` as a third value.

**Base spec location:** ASSET-CRUD-DESIGN schema (`offer_type` prop), DTOs, filters, and response examples throughout §3/§5.

**Why:** COMMERCIAL-PURCHASE-DESIGN needs a first-class discriminator at the offer level (CP-1: "peer at API layer, shared at service layer"). This ships exactly what B-24 anticipated — an extensible enum, not a rebuild.

```typescript
@Prop({ required: true, enum: ['flex', 'full-ownership', 'commercial'] })
offer_type: string;
```

DTO and filter enums extend identically:

```typescript
@IsEnum(['flex', 'full-ownership', 'commercial'])
offer_type: string;
```

`GET /admin/assets?offer_type=commercial`

**Impact:** existing flex + FO offers unchanged. Commercial offers use the same shape as FO offers (size + tenor prices + payment_type) — see AC-ADD-2.

**Correction to a cross-doc reference:** COMMERCIAL-PURCHASE-DESIGN §6.1 originally described this as `Asset.asset_type`, assuming a top-level Asset field. The actual discriminator lives on `AssetOffer.offer_type` per ASSET-CRUD-DESIGN's real schema (D-2). This addendum implements it at the correct level; the reference table in COMMERCIAL-PURCHASE-DESIGN should be corrected to match on its next revision.

**Implementation cost:** <30 min.

### AC-ADD-2 — `payment_type` + `document_fee` validation extends to commercial

**What:** the existing `payment_type` (`'all-inclusive' | 'partially-inclusive'`) and `document_fee` fields currently apply only to `offer_type === 'full-ownership'`. Extend both to also require when `offer_type === 'commercial'`.

**Base spec location:** `payment_type` prop + D-21; `document_fee` DTO field.

**Why:** COMMERCIAL-PURCHASE-DESIGN CP-3 locks "reminders, defaults, penalties, suspension identical to FO" — commercial reuses FO's all-inclusive/partially-inclusive model verbatim, and that model is what governs whether a DocumentPlan is created at purchase (per FO-PURCHASE-DESIGN §6.1).

```typescript
@ValidateIf(o => o.offer_type === 'full-ownership' || o.offer_type === 'commercial')
@IsEnum(['all-inclusive', 'partially-inclusive'])
payment_type?: string;

// Same predicate change applies to document_fee's @ValidateIf
```

**Impact:** commercial offers must specify `payment_type` + `document_fee` at create, exactly like FO. Flex offers untouched.

**Implementation cost:** <15 min.

### AC-ADD-3 — Service layer: commercial takes the FO branch everywhere FO does *(new in v1.1)*

**What:** every place the asset service decides "does this offer type carry FO-shaped fields?" must answer yes for commercial. Today that decision is made by literal comparison in seven places, all of which say `full-ownership` alone. Replace each with the predicate that already exists in the schema file:

```typescript
// src/modules/asset/schemas/asset-offer.schema.ts — already shipped
export function usesFoModel(offerType: string): boolean {
  return offerType === 'full-ownership' || offerType === 'commercial';
}
```

**The seven sites (`src/modules/asset/asset.service.ts`, as of staging `a364fdd`):**

| Line | Method | What it decides | Effect on commercial today |
|---|---|---|---|
| 244 | `create` | whether to spread `payment_type` onto the offer | **silently dropped** — validator required it, service discards it |
| 354 | `addOffer` | same, for a later-added offer | **silently dropped** |
| 322 | `updateOffer` | whether `payment_type` may be set at all | **throws** `PAYMENT_TYPE_REQUIRED` "only applies to full-ownership offers" — so it can never be corrected after create either |
| 622 | `sizeFields` | whether to store `document_fee` | **silently dropped** → stored as schema default `0` |
| 427 | `updateSize` | whether `document_fee` may be updated | **silently ignored** |
| 583 | `assertSizeRulesForOfferType` | whether `document_fee` is required on add-size | **not enforced** — inconsistent with the create-DTO validator, which does enforce it |
| 634 | `planFields` | whether to store `is_promo` | **dropped** (low stakes — nothing reads `is_promo` yet — but the same class) |

**Why this was missed:** v1.0's task table has Schema, DTO, Endpoint, Docs and Tests rows and no Service row; AC-ADD-03 says "service filter passes through naturally". The *filter* does pass through — `?offer_type=commercial` works. The FO-shaped field handling is not a filter and does not.

**Scenario, as it stands today.** An admin creates a commercial offer on Aviation City. The API demands `payment_type` and `document_fee` (AC-ADD-04 works) — the admin supplies `partially-inclusive` and ₦150,000 — and receives **201**. The stored offer has **no `payment_type`** and every size has **`document_fee: 0`**. When a customer later buys a commercial plot, FO-PURCHASE-DESIGN §6.1 reads `payment_type` to decide whether to create a DocumentPlan and finds nothing; the document fee charged is ₦0. The admin, noticing, opens the offer to fix it — `PATCH …/offers/commercial {payment_type}` throws. There is no path back except deleting the offer, and there is no delete-offer endpoint — the admin controller exposes DELETE for assets, sizes and plans, never offers (by design: `is_active: false` is how an offer is retired). **The data is unrecoverable through the API.**

**Also correct while here:** the repository's `usesFoModel` should be the single predicate for model selection too — `asset.repository.ts:58` still branches `offerType === 'flex' ? flexSizeModel : foSizeModel`, which happens to be right (commercial falls to FO) but by accident of the else-branch rather than by intent. Make it explicit.

**Implementation cost:** ~30 min — seven one-line substitutions plus the repository line. No schema change, no migration.

---

## 3. Cross-module notes

**Consumer catalog visibility (deferred):** whether commercial should appear in the general catalog by default, or only via a dedicated route, is left to ASSET-USER-VIEWS-ADDITIONS to decide (see that doc's AUV-ADD-2) — no backend change required either way, since consumer catalog endpoints already filter by `offer_type` per whatever the FE requests.

**Admin list price aggregation excludes commercial by default** *(new in v1.1 — record of an existing, undocumented rule)*: `asset.repository.ts` (`findAllPaginated`, ~line 159) computes each row's price summary over offers matching the requested `offer_type`, or — when no `offer_type` filter is set — over **all offers except commercial**. This is a reasonable rule (commercial plot pricing should not blend into a residential summary) but it appears in no spec. Consequences the FE must know: a commercial-only asset shows **no price** on the unfiltered list; `?offer_type=commercial` shows it. Recorded here so it is a decision, not a surprise. If it is *not* intended, it is a one-line change; if it is, it should be named in the base doc's §3 list-response notes on the next bump.

**No `Asset.is_commercial` flag needed:** `AssetOffer.offer_type = 'commercial'` is itself the discriminator, consistent with the same reasoning applied to developer plot elsewhere in this series (a PaymentPlan-side concept, not an Asset-level flag). An asset can theoretically carry both a flex and a commercial offer simultaneously per base decision D-2, though this is unlikely in practice.

**Developer plot — no Asset addition needed:** developer plots are a PaymentPlan-side concern (ADMIN-USER-DETAIL-MUTATIONS §7.3). Admin picks any existing Asset at plan-create time and overrides size/price/units directly — the Asset row itself never changes.

---

## 4. TODO Additions

| ID | Task | Description | Endpoint | Area | Ref | Priority | Effort | Depends on |
|---|---|---|---|---|---|---|---|---|
| AC-ADD-01 | Extend `AssetOffer.offer_type` enum with `'commercial'` | Schema enum change. No backfill needed — existing rows keep their values. | POST /admin/assets, POST /admin/assets/:id/offers | Schema | AC-ADD-1 | P0 | S | — |
| AC-ADD-02 | Extend create/edit-offer DTOs with `'commercial'` | `@IsEnum` constraint updates. | POST /admin/assets, POST …/offers, PATCH …/offers/:offerType | DTO | AC-ADD-1 | P0 | S | — |
| AC-ADD-03 | Extend admin list filter `?offer_type=` to accept `'commercial'` | Controller validation update; service filter passes through naturally. | GET /admin/assets | Endpoint | AC-ADD-1 | P0 | XS | — |
| AC-ADD-04 | Extend `payment_type` + `document_fee` validation to include commercial | Change `@ValidateIf` predicate. Same required-when-FO logic, now also required-when-commercial. | POST/PATCH …/offers/:offerType | DTO | AC-ADD-2 | P0 | S | — |
| AC-ADD-05 | Update response DTO examples in docs | Non-functional. Example JSON responses gain a commercial offer example. | N/A | Docs | AC-ADD-1 | P1 | S | — |
| AC-ADD-06 | Integration test — create asset with commercial offer **and read it back** | Create asset with `offer_type: 'commercial'`, sizes + tenor prices + `payment_type` + `document_fee`. **Then `GET /admin/assets/:id` and assert `offers[].payment_type` and `offers[].sizes[].document_fee` equal what was sent** — a 201 alone does not prove persistence. Assert `?offer_type=commercial` returns it. | POST /admin/assets, GET /admin/assets/:id, POST …/offers | Tests | AC-ADD-1, 2, 3 | P0 | S | AC-ADD-01, 02, 08 |
| AC-ADD-07 | Integration test — commercial offer requires `payment_type` + `document_fee` | Create without `payment_type` → 400. Without `document_fee` → 400. With both → 201. Same as FO. | POST …/offers | Tests | AC-ADD-2 | P0 | S | AC-ADD-04 |
| **AC-ADD-08** | **Service layer: route commercial through the FO branches** | **Replace the seven `=== 'full-ownership'` comparisons in `asset.service.ts` (lines 244, 322, 354, 427, 583, 622, 634 as of `a364fdd`) with `usesFoModel(offerType)`. Make `asset.repository.ts:58` model selection use the same predicate. Without this, AC-ADD-04's required fields are validated then discarded, and cannot be set afterwards.** | POST /admin/assets, POST …/offers, PATCH …/offers/:offerType, POST/PATCH …/sizes/:sizeId | Service | AC-ADD-3 | **P0** | S | AC-ADD-01, 04 |
| AC-ADD-09 | Integration test — commercial offer is correctable after create | Create commercial offer; `PATCH …/offers/commercial {payment_type}` → 200 (today: throws). `PATCH …/sizes/:sizeId {document_fee}` → 200 and persisted (today: ignored). | PATCH …/offers/:offerType, PATCH …/sizes/:sizeId | Tests | AC-ADD-3 | P0 | S | AC-ADD-08 |
| AC-ADD-10 | Decide and document the list-aggregation commercial exclusion | Confirm whether the unfiltered admin list's price summary should exclude commercial (§3). Either way, name it in the base doc. | GET /admin/assets | Docs | §3 | P1 | XS | — |

**Total effort added:** ~1 engineering day for all additions + tests. (v1.1 adds ~1 hour: AC-ADD-08 + 09.)

**Status as of 2026-08-18 (staging `a364fdd`):** AC-ADD-01, 02, 03, 04 shipped. AC-ADD-06 either not written or asserting on status only. **AC-ADD-08 not done — this is the live gap.**

---

## 5. How to consume this doc

**For engineers implementing Asset CRUD:** AC-ADD-01..10 fold into the same PR set as base tasks if still in progress. If base already merged, ship as a follow-up PR — no breaking changes. **AC-ADD-08 should ship before any commercial offer is created in a real environment**; offers created before it exist with unrecoverable missing fields.

**For engineers implementing Commercial Purchase:** depends on AC-ADD-01 **and AC-ADD-08** landing first — commercial offers must be creatable *and correctly stored* before commercial purchases can happen, because CP-3's document-plan behaviour reads `payment_type` off the offer.

**For the admin FE:** hold the commercial UI (type picker on create/add-offer, FO-like fee + payment-type handling) until AC-ADD-08 lands; shipping it earlier produces offers the API accepts and then silently mis-stores. Widen the read-side enum now so a commercial offer created server-side does not fail response validation.

**For maintainers:** on next major spec bump, fold this into the base doc's Schema + DTOs + service notes + B-24 (update to say commercial is shipped, not just anticipated), then delete this file.

---

## 6. Sign-off

AC-ADD-1 and AC-ADD-2 approved (v1.0). **AC-ADD-3 proposed (v1.1)** — a completion of the approved scope, not a new capability. Ready for implementation as an additive PR.
