# Design — 3000 Plots Project: Anniversary Mega Offers admin additions

> **Status:** Draft pending review (2026-07-16). Scope: the admin-side additions for the Anniversary Mega Offers campaign, all landing on the existing campaign page at `/campaigns/1000plotsproject` (user-facing label renamed to "3000 Plots Project"; route and code names deliberately unchanged). Counterpart docs: `abode-fe-v2/docs/SHAPE-REALTOR-CAMPAIGN.md` (associate surface), the BE campaign plan (rules file, checkpoint checker, wheel, emails).

## What the page already does

Header + "Campaign Active" badge · sales/financial/promo metrics (`RaffleMetricsSection`) · asset breakdown map · transaction table · "Raffle & Referral System" (ticket metric cards, tickets tables, recent tickets). It is already the campaign control room; nothing existing is removed.

## The four additions

### 1. Tabs (structure)

The page is already long, and fulfillment work shouldn't require scrolling past dashboards. Convert the page body to shadcn Tabs, driven by URL param `?tab=`:

| Tab | Contents |
|---|---|
| **Overview** (default) | Everything the page shows today, campaign-window scoped |
| **Prize fulfillment** | The checkpoint + wheel-win delivery queue (addition #2) |
| **Wheel** | Inventory, spin stats, spin audit (addition #3) |
| **Draw** | The raffle draw tooling (addition #4) |

### 2. Prize fulfillment queue (ships first — associates are already crossing checkpoints)

One unified queue for everything the business owes someone, with a source chip per row rather than separate sections.

- **Stat strip:** Pending / Contacted / Delivered counts.
- **Filters:** status tabs (default **Pending**), prize filter (Hamper · Trip · Car · Wheel prizes), search (associate name/email).
- **Table:** Associate (name, email, phone) · Prize (chip) · Source (Checkpoint "1 Acre" / Wheel) · Earned date · Status · Action.
- **Update-status modal:** status select (**Pending → Contacted → Delivered**), required note ("Hamper delivered via dispatch, waybill 4412"), admin-logged. Sonner toasts. Same modal pattern as purchase-confirmations' Resolve.
- **CSV export** (house pattern).
- Statuses are workflow stamps only — no money, no reversals; corrections are a new status entry with a note (audit style).

### 3. Wheel administration (lands with the wheel)

- **Inventory panel:** one card per wheel prize — cap, won, remaining. Remaining 0 renders red "Exhausted" (the server already excludes exhausted prizes from verdicts; this is visibility, not control).
- **Spin stats:** spins issued, used, win rate.
- **Spin audit table:** timestamp · associate · outcome · prize, date-filtered, exportable. This is the complaints defense: every verdict has a row.
- Prize list and odds are code-defined (same philosophy as the BE rules file) — this tab reads state, it does not edit game rules.

### 4. Draw tooling (before September 30)

- **Eligibility card:** live count of tickets in the campaign window (June 27 → September 30), split user/referral — the exact pool the draw uses.
- **Run draw:** super-admin gated (`requiresSuperAdmin` pattern), confirm dialog, server-side seeded draw, winners recorded immutably. Never a manual raffle outside the system.
- **Winners table:** prize · ticket id · winner (name/email/phone) · drawn at · announced? Feeding the realtor hub's ended-state winners showcase.
- Draw cadence (one grand draw vs monthly minis) is a business decision — the tooling supports repeated draws either way, each with its own record.

## Campaign-window scoping (cross-cutting)

All ticket queries on this page default to the campaign window **read from the BE rules file** (June 27 → September 30). The Overview header shows the window next to the Active badge; the badge flips to "Campaign ended" after the end date. Rationale: wallet/card purchases mint tickets with no date gate, so unwindowed views can include out-of-campaign tickets — and the draw pool must be window-exact for fairness.

## Backend contract (admin-side)

- `checkpointFulfillmentList(status, prize, search, page, limit) → { count, data }`
- `updatePrizeFulfillment(entryId, status, note)` — admin-logged
- `wheelInventory` · `spinAudit(page, limit, dateRange)`
- `raffleDrawEligibility` · `runRaffleDraw` (super-admin) · `raffleWinners`
- Campaign-window args on the existing ticket queries
- New AdminLogs actions: `update-prize-fulfillment`, `run-raffle-draw`

## Open questions

1. Unified fulfillment queue with source chip (recommended) vs separate checkpoint/wheel queues.
2. Status set: is Pending → Contacted → Delivered enough, or does the trip need a "Booked" stage?
3. Draw cadence: one grand draw at campaign end (recommended for prize budget clarity) vs monthly mini-draws.
4. Who may run the draw: super-admin only (recommended).

## Build order

1. Tabs + Prize fulfillment (mock-first, pattern-reuse from features/purchase-confirmations)
2. Campaign-window scoping on Overview
3. Wheel tab (with the wheel's BE)
4. Draw tab (September, before end date)
