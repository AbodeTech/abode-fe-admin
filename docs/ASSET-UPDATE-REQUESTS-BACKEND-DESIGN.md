# Asset Update Requests: Backend Design (MVP)

Status: working draft. Filled in ticket by ticket.
Source: *Asset Update Requests — MVP PRD* (Oct 20, 2026).
Module: `abode-be-v2/src/modules/requests/`

---

## 1. Current behaviour (checked against code, Oct 20, 2026)

### Submit: `RequestsService.createAssetUpdateRequest`
- **Fee:** `quoteFee` reads the flat `REQUEST_FEES.asset_update = 100_000` and doesn't know whether the change is up or down.
- **₦0 path already exists:** `resolvePayment` returns `payment_status: 'not_applicable'` and no proof when `processing_fee === 0`. `quoteFee` skips the coupon when `originalFee === 0`. For FR00, the main change is making `originalFee` depend on direction.
- **Live plan wins:** `current_size` / `current_units` come from `plan.size` / `plan.no_of_units`. The DTO's `current_*` fields are still **required** (`@IsInt`) but the service ignores them, so PRD Scenario 4 already holds.
- **Quote:** `computed_new_total_price = land_price_per_unit(new_size) × new_units`, and `computed_price_delta = that − plan.asset_price`. This is whole-plan re-pricing (Issue 2). The document fee isn't quoted.
- `quoteSize` only prices a size that is active on the plan's own tenor (`month_subscription`). Otherwise it throws `SIZE_NOT_AVAILABLE`. At tenor 0 it falls back to the first active plan.

### Approve: `RequestsAdminService.approve` → `executeAssetUpdate`
- If `processing_fee > 0` and payment isn't verified, approval verifies it and writes a `request_fee` debit transaction.
- The coupon is redeemed at approval (Issue 8).
- **`manual` mode never touches the plan.** Only `system` runs `executeAssetUpdate`.
- `executeAssetUpdate` re-quotes, then sets `size`, `no_of_units`, `asset_price = new whole total`, and `balance = max(0, total − amount_paid)`. For FO/commercial it also sets `land_price`, `document_price` and the doc plan's `document_fee_total` / `balance`.
- **Not updated:** `size_id`, `amount_payable` (monthly), `months_covered`, `month_remaining`, `next_date_of_payment`, `tenor_end_date`, `status`/`plan_completed_at` when the balance hits 0, the doc plan's instalment and months, the sqm inventory, and the audit log.
- The doc plan is found by `unique_asset_id`, while the admin edit flow uses `plan.linked_document_plan_id`.

### Reference: admin "edit plan": `AdminPlanMutationService.updateSpec`
Already does what approval is missing: resolves `size_id` with `assets.findSizeBySqm`, calls `sqm.relocate(from, to)`, recomputes `months_covered`/`month_remaining` with `monthsCoveredFor`/`monthsRemainingFor`, sets `next_date_of_payment`, flips the status to completed at balance 0, applies the same rules to the doc plan, and writes an audit entry. This is the candidate to reuse for Open Decisions 1 and 2.

### Notifications
`RequestNotificationsService.emit` enqueues `{ type: 'request_*', to, request_id, request_type, status, ...extra }`. PRD Issue 1 says these types have no template. This hasn't been checked against the notification module yet.

### Customer app today (`abode-fe-v2/.../AssetUpdateDrawer.tsx`)
`derivePricingChange` (l.528) computes its own comparison, and it doesn't match the backend:
- **Size change:** new total = one-unit `totalCost` for the new size, so the **unit count is ignored**.
- **Unit change:** new total = (price paid ÷ units) × new units. This uses the **price the customer paid**, not today's price.
- The fee is the hard-coded `ASSET_UPDATE_FEE`, and the payment step always runs.

So "fee shown ≠ fee charged" already applies to the price, not just the fee. This is the main reason for §3.

---

## 2. Open decisions: backend view

| # | Decision | Answer | Backend notes |
|---|---|---|---|
| 1 | Recalculate the instalment | **(a) Spread the new balance over the months left** | New monthly = new balance ÷ `month_remaining`, for both the land plan and the doc plan. The end date doesn't change. The quote returns `new_monthly`. |
| 2 | Move inventory on approval | **Open: needs Product + Backend** (see §2.1) | |
| 3 | Value the current size when it's no longer sold | **(a) Pro rata per sqm** | `P(cur) = P(new) ÷ new_size × current_size`, with `valuation_basis: 'pro_rata'`. Only needed for **size increases**. A **unit increase** on a size we no longer sell is blocked with `SIZE_NOT_AVAILABLE`, because we can't sell more of a size that's off sale. |
| 4 | Decreases priced on the removed portion | **(b) Keep today's rule** (PRD objective 3) | Decrease: `new_total = new_units × P(new_size)`, a whole-plan re-price as today, with the ₦100,000 fee and proof as today. |

### 2.1 Open question: move land inventory on approval? (Decision 2)

**Question:** when an asset update is approved, should the estate's land inventory (sold vs available sqm) move to match?

**Why it matters:** approval changes the plan's size or units but leaves inventory alone. If a customer goes from 300 to 500 sqm, they own 200 sqm more, yet the estate still lists that land as available, so it could be sold twice. The admin "edit plan" flow already moves inventory, via `SqmInventoryService.relocate` called from `AdminPlanMutationService.updateSpec`.

**Found in code:**
- `relocate` = `relocate_out` (release the old size) + `relocate_in` (take the new size).
- On an estate with `sqm_inventory_active !== true`, `relocate_out` is skipped but **`relocate_in` throws `LAND_CONFIGURATION_INCOMPLETE`** (`sqm-inventory.service.ts:295-301`). Reused as-is, it would fail every approval on estates that don't track inventory, so approval has to check `sqm_inventory_active` first and skip.
- If the new size has run out, `relocate_in` fails, so approval fails. Arguably that's correct: it stops us approving land we don't have.

**Options:**
| | Option | Effect |
|---|---|---|
| A | Move it where the estate tracks inventory (recommended) | Reuse `relocate` inside the approval transaction. Skip estates that don't track inventory. If land runs out, approval fails with a clear error and the admin declines. |
| B | A, plus warn early | Both quote endpoints also return `inventory_available: boolean`, so the customer and admin see "size sold out" before submit and approval. |
| C | Leave as today | No inventory move. Sold land can still show as available (Issue 6 stays open). |

**Also to confirm:** whether the existing edit-plan path has the same failure on estates that don't track inventory. It calls `relocate` without checking.

### Other decisions
| Topic | Answer |
|---|---|
| Customer quote endpoint | **Add it.** `GET /requests/asset-update/quote` (§4, Ticket 1) |
| `manual` approval | **Apply the quote too.** The plan is updated at approval and the request stays `approved` until marked complete. |
| Price guard at approval | **Add it.** Optional `expected_price_change` on approve; a mismatch returns `409 QUOTE_CHANGED`. |

---

## 3. Shared core: one asset-update quote

Every ticket below reads the same figures. Rather than three copies of the maths (backend submit, backend approval, customer app), the backend owns **one function**, and the apps only display what it returns.

### 3.1 `RequestsPricingService.quoteAssetUpdate(plan, change, session?)`

```
P(size) = today's price per unit for `size` on the plan's tenor   (quoteSize)
          land and document fee priced separately; document = 0 for flex

INCREASE (added portion only):
  size:  Δ = units × (P(new_size) − P(current_size))
  units: Δ = (new_units − current_units) × P(current_size)
  new_total = current_total + Δ                    (per component: land, document)

DECREASE (unchanged from today, Decision 4b):
  new_total = new_units × P(new_size)
  Δ = new_total − current_total
```
- The PRD examples check out: 300→500 sqm on 2 units gives +₦3,000,000 and ₦9,000,000. 2→3 units gives +₦3,500,000 and ₦9,500,000.
- `direction = new size/units > current ? 'increase' : 'decrease'`. It's judged on the change itself, **not** on the price sign.
- `P(current_size)` when that size is no longer sold (Decision 3): for a size increase, use pro rata `P(new_size) ÷ new_size × current_size`. For a unit increase, block with `SIZE_NOT_AVAILABLE`.
- Fee: `increase → 0`, `decrease → REQUEST_FEES.asset_update` (₦100,000). It replaces the flat lookup in `quoteFee`.
- Monthly (Decision 1a): `new_monthly = new_balance ÷ month_remaining`, done separately for the land plan and the doc plan. **To discuss:** what happens when `month_remaining = 0` (plan past its end date, or an outright plan)? Proposal: the whole new balance is due and `new_monthly = new_balance`.

### 3.2 Quote shape (returned by both endpoints and stored on the request)

```ts
AssetUpdateQuote {
  direction: 'increase' | 'decrease'
  update_type: 'size' | 'units'
  current_size, current_units, new_size, new_units
  current_total: { land, document, total }   // from the live plan: asset_price / land_price, document_price
  price_change:  { land, document, total }   // signed; negative on a decrease
  new_total:     { land, document, total }
  current_monthly: { land, document }         // amount_payable / document_monthly_installment
  new_monthly:     { land, document }         // new balance ÷ months_remaining (Decision 1a)
  months_remaining: { land, document }
  valuation_basis: 'catalogue' | 'pro_rata'   // how P(current_size) was found (Decision 3)
  fee: { original_fee, requires_payment }     // before any coupon
  overpaid_amount: number                     // > 0 only if a decrease drops new_total below amount_paid (info only, Issue 13)
  priced_at: ISO date
}
```

### 3.3 Where it's used
| Moment | Call | Stored? |
|---|---|---|
| Customer picks a size or unit count | `GET /requests/asset-update/quote` (new) | no |
| Customer submits | inside `createAssetUpdateRequest` | yes → `asset_update_details.quote_at_submit` |
| Admin opens approval | `GET /admin/requests/:request_id/asset-update-quote` (new) | no |
| Admin approves (system) | inside `executeAssetUpdate` | yes → `asset_update_details.quote_at_approval` |

`computed_new_total_price` and `computed_price_delta` stay on the schema for old requests. On new requests they're filled from the quote's `new_total.land` and `price_change.land`, so the admin table keeps working unchanged.

---

## 4. Tickets

### Ticket 1: Comparison step shows three figures (customer app)
**Needs from backend:** the preview endpoint.

`GET /api/v1/requests/asset-update/quote`
- Query: `unique_asset_id`, `update_type`, `new_size` (when size) or `new_units` (when units). `asset_id` comes from the plan, so the app doesn't send it.
- Auth: the customer. The plan must belong to them (`loadOwnedPlan`).
- Returns: `AssetUpdateQuote`.
- Errors: `PLAN_NOT_OWNED`, `PAYMENT_PLAN_MISSING`, `NO_CHANGE_REQUESTED`, `SIZE_NOT_AVAILABLE` (new size not on this tenor, or the current size has no price when Decision 3 is (c)).
- Has no side effects: no duplicate-request check and no coupon. It's GET so React Query can cache it per selection.

The three figures map to `current_total.total`, `price_change.total` and `new_total.total`. A decrease shows a negative `price_change`, `fee.original_fee = 100000` and `requires_payment = true`.

Decision 1 is (a), so the quote also returns `current_monthly`, `new_monthly` and `months_remaining`. The comparison can show the monthly change as a fourth line if design wants it.

### Ticket 2: Live fee label in the drawer; free path skips payment (customer app)
**Needs from backend:**
1. **Fee by direction (FR00)** in `createAssetUpdateRequest`. Direction comes from the live plan, and `quoteFee` takes the quote's `original_fee`. The ₦0 path already exists: `not_applicable`, no proof, coupon skipped.
2. **DTO relaxations, all backward-compatible:**
   - `current_size` and `current_units` become optional and are marked deprecated. They're ignored already.
   - Only the field that matches `update_type` is required (`new_size` for size, `new_units` for units).
   - `payment_proof` is already optional and is only checked when the fee is above 0.
   - `coupon_code` on a free request is ignored silently, not rejected.

**Free path, no receipt (customer app):** no backend work beyond FR00. `payment_proof` is already optional (`create-request.dto.ts:125`), and `resolvePayment` ignores it when the fee is 0. Notes for the app:
- Leave `payment_proof` out entirely. A partial or empty object fails `@ValidateNested` with a 400, even on a free request.
- If the app thinks the request is free but the backend says it's a decrease, the response is `PAYMENT_PROOF_REQUIRED`. Handle it by sending the customer back to the payment step.
- Until FR00 is deployed, every asset update still costs ₦100,000, so this can't ship before the backend.

**Fee label source:** the app keeps a one-line local rule (`new > current ? Free : ₦100,000`) so the header updates as soon as the customer picks. Once the Ticket 1 quote loads, its `fee` replaces the local result. The backend makes the final call at submit.

### Ticket 3: Admin type card copy (admin app)
**Needs from backend:** nothing. It's copy only, and there's no fee endpoint (PRD constraint).
*Optional:* `GET /admin/requests/statistics` could split `pending_asset_update` into increases and decreases. That isn't in the PRD, so I'd skip it for the MVP.

### Ticket 4: Success screen shows the backend's figures (customer app)
**Needs from backend:** the `POST /requests/asset-update` response (`ClientRequestView`) already returns `processing_fee`, `original_fee` and `payment_status`. Add:
- `asset_update_details.direction`
- `asset_update_details.quote_at_submit: AssetUpdateQuote`

**"No fee" rule for the FE:** use `original_fee === 0`, which means free because it's an increase. Don't use `processing_fee === 0`: a decrease with a 100% coupon also has `processing_fee === 0`.

Old requests have no `quote_at_submit`, so the FE falls back to `computed_*`.

**Depends on backend added-portion pricing (FR01).** Today `computed_price_delta` is still the whole-plan figure (`new_units × P(new) − asset_price`, `requests.service.ts:310`). A success screen that reads it before FR01 ships shows the old number. It's also land-only, so FO/commercial need `quote_at_submit.price_change.total` to include the document fee.

**`derivePricingChange` (customer app):** it should be replaced by the quote endpoint, not rewritten. The app can't reproduce the rule on its own:
- the size picker only lists active sizes, so it has no price for a discontinued current size (the pro-rata case);
- decreases follow a different formula (whole-plan re-price);
- the document fee is priced separately.

### Ticket 5: Quote at submit vs price at approval (admin app)
**Needs from backend:** a re-quote endpoint, plus optional changes to approval.

`GET /api/v1/admin/requests/:request_id/asset-update-quote`
```ts
{
  at_submit: AssetUpdateQuote | null   // null for requests made before release
  at_today:  AssetUpdateQuote | null   // null when it can't be priced today
  at_today_error: { code: 'SIZE_NOT_AVAILABLE', ... } | null
  price_moved: boolean                  // at_submit.price_change.total !== at_today.price_change.total
  plan_changed_since_submit: boolean    // live size/units ≠ the snapshot (e.g. an admin edited the plan)
}
```
- `400 NOT_ASSET_UPDATE` for other request types. Only works on `submitted`/`under_review`. Other statuses return `409 INVALID_TRANSITION` or just `at_submit`; to be decided.
- A pricing failure is **returned, not thrown**, so the dialog can still show the submitted quote and explain why approval will fail.

**Approval changes (`approve` / `executeAssetUpdate`):**
- Use `quoteAssetUpdate`, adding `price_change` to the plan instead of replacing the total (Issue 2).
- Store `quote_at_approval` on the request. Finance can then check that the plan moved by exactly the quoted amount (success metric).
- *Optional guard:* `AdminApproveRequestDto.expected_price_change?: number`. If it's sent and differs from the live re-quote, approval fails with `409 QUOTE_CHANGED`. This covers prices moving between the dialog opening and the confirm click.
- *To decide:* in `manual` mode the plan is never updated today. Should manual approval also apply the quote, or does manual mean "the admin edits the plan by hand"?

---

## 5. API contract changes (rolled up)

| Endpoint | Change | Breaking? |
|---|---|---|
| `GET /requests/asset-update/quote` | New | No |
| `POST /requests/asset-update` | Fee by direction; `current_*` optional; only the matching `new_*` required | No (fee value changes for increases) |
| `ClientRequestView.asset_update_details` | `+direction`, `+quote_at_submit`, `+quote_at_approval` | No (additive) |
| `GET /admin/requests/:request_id/asset-update-quote` | New | No |
| `POST /admin/requests/:request_id/approve` | `+expected_price_change?` (optional) | No |
| Schema `AssetUpdateDetails` | `+direction`, `+quote_at_submit`, `+quote_at_approval` (all nullable) | No migration needed |

---

## 6. Release and migration notes
- Requests created before deploy keep their stored fee. No backfill.
