# Admin FE — gaps to raise with abode-be-v2

**FE branch:** `admin-graphql-decoupling` · **BE ref:** `ccabca0` (wallet module uncommitted) · **2026-08-30**

The three stats endpoints are integrated and shipping. Comparing them field-by-field
against what `main` rendered, three things were missing and one needed no work.

**Two of the three have since been built and are now wired on the FE.** A fourth item (04)
was found while wiring the associate leaderboard and is added below.

| | Item | Status |
|---|---|---|
| 01 | New/recurring split per offer type | **Built** — wired |
| 02 | Users' wallet balance | **Built** — wired |
| 03 | A stats surface for top-ups — the only transaction screen with nothing to port onto | **Still open** |
| 04 | `GET /admin/associates/top` loses its row count to the response envelope | **Still open** |
| 05 | Associate Pro Tracker — no recruitment / upgrades / payment-plan / export routes | **Still open** |
| — | Commercial as an asset type — already complete end-to-end | No action |

---

## 01 — Split new vs recurring inside `by_offer_type` ✅ built

`OfferTypeBreakdownDto` now carries `new_count`, `new_amount`, `recurring_count` and
`recurring_amount`, and `toOfferTypeBreakdown` groups on `{asset_type, purchase_kind}`
while still zero-filling from the shared offer-type list. Wired on the FE: each offer-type
card shows the offer total with the cycle split beneath it.

The original ask follows, for the record.

Main's `GetAssetTransactionsStatistics` asked for 20 fields. `GET /admin/transactions/stats`
covers 13. The seven it doesn't are all the same shape: **offer type crossed with sales cycle**.

v2 returns both dimensions, but only as marginals — `by_offer_type` gives the per-offer
totals, `new_sales_*` / `recurring_payments_*` give the per-cycle totals. The intersection
can't be recovered from those on the client.

| main (v1 GraphQL) | abode-be-v2 | |
|---|---|---|
| `totalTransactions` | `total_count` | ok |
| `approvedTransactions` / `totalApprovedAmount` | `approved_count` / `approved_amount` | ok |
| `pendingTransactions` / `totalPendingAmount` | `pending_count` / `pending_amount` | ok |
| `declinedTransactions` / `totalDeclinedAmount` | `declined_count` / `declined_amount` | ok |
| `new_sales` / `total_new_sales` | `new_sales_count` / `new_sales_amount` | ok |
| `flexTransactions` / `totalFlexAmount` | `by_offer_type[flex]` | ok |
| `fullOwnershipTransactions` / `totalFullOwnershipAmount` | `by_offer_type[full-ownership]` | ok |
| `new_flex_sales` | — | **missing** |
| `flex_recurring_sales` / `total_flex_recurring_sales` | — | **missing** |
| `new_fullOwnership_sales` / `total_new_fullOwnership_sales` | — | **missing** |
| `fullOwnership_recurring_sales` / `total_fullOwnership_recurring_sales` | — | **missing** |

### Proposed shape

Four fields added to each `by_offer_type` row rather than seven new top-level keys — it
scales to commercial and to any offer type added later, without the naming going
combinatorial the way v1's did.

```json
"by_offer_type": [
  {
    "offer_type": "flex",
    "count": 128,
    "amount": 41250000,
    "new_count": 43,
    "new_amount": 18600000,
    "recurring_count": 85,
    "recurring_amount": 22650000
  }
]
```

**Why it matters.** This is the asset transactions screen's main summary. Without it we can
show "flex did ₦41m" and "recurring was ₦22m" but never "flex recurring was ₦22m" — which
is the number ops actually reads.

**The stopgap we'd rather not ship.** Because the endpoint is filter-aware, the FE could
derive each cell with `?asset_type=flex&sales_type=ap` and read `total_count`. That's four
extra round trips per page load against an already-cached aggregation, so we'd rather have
the one extra `$group`.

---

## 02 — An aggregate for users' wallet balance ✅ built

Shipped as `GET /admin/wallets/stats` → `{ users_wallet_balance }` — the separate-endpoint
option below. Wired back onto both the withdrawal and document screens as a sixth card, and
allowed to fail independently: if that call errors the other five still render.

The original ask follows, for the record.

Main showed a **Users' Wallet Balance** card on the withdrawal, document and top-up screens,
from v1's `users_wallet_balance`. Nothing in v2 sums wallet balances — `wallet-admin.service`
lists wallets but exposes no total, so there is no field to map it onto.

We've dropped the card rather than fake it. To bring it back, either works for us:

- a `users_wallet_balance` field on `QueueStatsDto`, so it rides along with the cards
  already on those screens; or
- a separate `GET /admin/wallets/stats`, which is arguably cleaner — it's a live sum over
  the wallets collection, not a transaction rollup, so it doesn't share a cache key or a
  date range with the queue stats.

**Also in the v1 type:** `commission_transaction` existed on v1's payload, but main's
commission screen never rendered the stats strip, so we can't confirm it was ever visible.
Treat it as low priority — we won't build against it unless you say it's wanted.

---

## 03 — Stats for the top-up ledger ⏳ still open

v2's three stats surfaces are asset purchases, withdrawals and documents. Top-ups have none
— and the top-up screen is the one transaction page still calling v1 through `fetchGraphql`.
Pointed at v2 that request fails, the component returns `null` on error, and the strip
silently disappears.

So this screen isn't regressed by our migration so much as stranded by it: there is nothing
to port it onto. Main rendered it as `type="credit"` against the same six-field payload the
withdrawal queue used.

**What we'd use:** `GET /admin/transactions/topup/stats` returning the existing
`QueueStatsDto`, scoped to credit transactions. If auto-approval doesn't apply to top-ups,
the two `auto_*` fields can stay at zero and we'll hide those cards — the shape matching the
other queues matters more than every field being populated.

---

## Commercial needs nothing

Flagging this so nobody picks up work that's already done. Commercial is wired end-to-end in v2:

- `PURCHASE_ASSET_TYPES` includes `commercial` — `transaction.schema.ts:65`
- Purchases stamp it via `tagsFor(variant).transaction` —
  `acquisition/full-ownership/purchase-variant.ts`
- The list filter accepts it through `PUBLIC_TO_STORED_ASSET_TYPE`, and `by_offer_type`
  enumerates it from the shared list, so it returns a row at zero even with no commercial
  transactions
- There's a full `acquisition/commercial/` module behind it — purchase, admin approval,
  settlement, signature

**The gap was on our side.** `features/asset-transactions` had
`ASSET_TYPES = ['flex', 'full-ownership']` while `features/assets`, `features/sales` and the
dashboard KPIs all carried commercial — so those lists could show commercial rows but never
filter to them, exactly as the comment in `transaction-kinds.ts` predicted. Fixed on our
branch; no BE change needed.

---

Integration lives in `features/asset-transactions` and `features/withdrawals` on
`admin-graphql-decoupling`. Compared against main's
`components/shared/TransactionDataPoints.tsx` and
`features/transactions/components/assets/AssetTransactionDataPoints.tsx`.

All endpoints named here are integrated and shipping — these were additions, not blockers.

### 04 — `GET /admin/associates/top` loses its row count

Separate surface, same envelope problem, found while wiring the associate leaderboard.

`TopAssociatesService.list` returns `{ count, data }`. The global `TransformInterceptor`
unwraps any payload with a `data` key and carries through only `meta` — so `count` is
dropped and never reaches the client. The leaderboard has no total to paginate against.

`AssociateManagerService.paginate` already solves this and says why in a comment:

```ts
return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 0 } };
```

Returning that shape from `list` would fix it; `apiGetPaged` on our side already reads
`meta` and needs no change. Until then the leaderboard's Next button is driven by whether a
full page came back, which can't know it's on the last page when the final page is exactly
full.

### 05 — Associate Pro Tracker is missing four routes

`ASSOCIATE-PRO-YEARLY-TRACKER-FE-DESIGN.md` (FE-APT-8) specifies seven page sections. The
tracker module exposes four routes — `GET /dashboard`, `GET /years`, `GET /goals/:year`,
`PUT /goals/:year` — which cover sections 1–4. Sections 5, 6 and 7 and the export have
nothing behind them:

| Design doc hook | Expected route | Status |
|---|---|---|
| `use-recruitment` | `GET /recruitment?year=` | missing |
| `use-upgrades` | `GET /upgrades?year=` | missing |
| `use-payment-plans` | `GET /payment-plans?year=` | missing |
| `use-export-recruitment` | `GET /export?year=` | missing |

`export_associate_pro_tracker` is already defined in `permissions.ts` but no route uses it.

`GET /admin/referrals/upgrades` is the closest existing endpoint, but it's the upgrade
*approval queue* filtered by status/method/tier — not a year-scoped list of who upgraded —
so it isn't a substitute.

The four backed sections are built and shipping at `/associate-pros/tracker`. The three
tables and the Export button are simply absent from the page rather than stubbed, so
nothing on screen is unbacked.

**Remaining:** asks 03, 04 and 05. `QueueStatsDto` is unchanged, which is consistent with the wallet
balance landing on its own endpoint rather than as a field on the queue payloads.
