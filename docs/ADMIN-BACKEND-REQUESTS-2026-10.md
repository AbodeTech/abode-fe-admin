# Backend Requests: Admin Frontend

**From:** Admin frontend
**Date:** 26 October 2026

This document holds three requests. Both only **add** fields to existing
responses. Nothing already returned needs to change, so the current frontend
keeps working until these ship.

| # | Request | Screen | Size |
|---|---|---|---|
| 1 | Split "Sold" into Active and Paid in Full | Asset detail → Product position | Medium |
| 2 | Payment completed date on each plan row | Customer Manager → Purchases (Due allocation) | Small |
| 3 | Date filter, and stats that follow the filters | Amaris Questions | Small–Medium |

---

## Request 1: Split "Sold" into Active and Paid in Full

**Screen:** Admin → Assets → asset detail → **Product position** table
**Endpoint:** `GET /admin/assets/:assetId/sqm-inventory`

### 1.1 What we're trying to do

The Product position table has a **Sold** column. It currently counts every
square metre held for a client on a plan, whether the client has paid a 10%
deposit or the full price.

The business wants that column split in two:

| New column | Meaning |
|---|---|
| **Active** | Land held for a client who is still paying |
| **Sold — Client paid 100%** | Land held for a client who has paid in full |

The two columns together must equal today's Sold figure.

The table has three views (SQM, Units and Value), and the split is needed in
all three.

### 1.2 Why the frontend can't do this alone

The endpoint returns one `sold_sqm` figure per row. It has no way of telling
which part of that land belongs to clients still paying and which belongs to
clients who have paid in full. Working it out on the frontend would mean
loading every client plan for the asset on each page view, and the result
could disagree with the ledger.

### 1.3 What we need added to the response

**`positions[]`, every row.** Add these to **both** the product pool rows
(`size_id: null`) **and** the size rows. The Units and Value views are built
from the size rows, so the split has to exist at size level too.

| Field | Type | Meaning |
|---|---|---|
| `active_sqm` | number | Committed sqm on plans the client is still paying for |
| `paid_in_full_sqm` | number | Committed sqm on plans paid 100% |

Rule: `active_sqm + paid_in_full_sqm === sold_sqm` on every row.

**`contract_values[]`, every product.**

| Field | Type | Meaning |
|---|---|---|
| `active_contract_value` | number \| null | Contract value of Active plans |
| `paid_in_full_contract_value` | number \| null | Contract value of paid-in-full plans |

These should follow the same rule as `sold_contract_value`: return `null` when
the held plans don't reconcile to the ledger, and the two should add up to
`sold_contract_value` when they do.

**`totals`.**

| Field | Type |
|---|---|
| `active_sqm` | number |
| `paid_in_full_sqm` | number |

**Example (one product pool row; the figures only show the shape):**

```json
{
  "offer_type": "flex",
  "size_id": null,
  "capacity_sqm": 40000,
  "selling_sqm": 1400,
  "sold_sqm": 5200,
  "active_sqm": 3600,
  "paid_in_full_sqm": 1600,
  "available_sqm": 33400
}
```

### 1.4 Questions to agree on

1. **What counts as "paid 100%"?** Is it plan status `completed`, or amount
   paid ≥ amount payable? These can differ, for example on a plan that has
   been fully paid but not yet marked complete.
2. **Document fees.** Does a client also need to have paid the document fee
   to count as paid in full, or only the land price?
3. **Defaulted and suspended plans.** We assume these stay under **Active**
   (land still held, not fully paid). Please confirm.
4. **Developer Plot.** This product has no sizes. We assume only the pool row
   carries the split. Please confirm.
5. **Moving between columns.** When a client makes their final payment, does
   their land move from `active_sqm` to `paid_in_full_sqm` straight away, or
   on a scheduled job?

### 1.5 What the frontend will do once this ships

- Replace the **Sold** column with **Active** and **Sold — Client paid 100%**
  in the SQM, Units and Value views.
- Read the new fields from the response, and update the mock data so the
  screen can be tested before the backend is deployed.

---

## Request 2: Payment completed date on each plan row

**Screen:** Admin → Customer Manager → **Purchases** table, with the
**Due allocation** filter selected
**Endpoints:**
- `GET /admin/cs-managers/:managerId/dashboard`
- `GET /admin/cs-managers/dashboard/all`

### 2.1 What we're trying to do

The **Due allocation** filter shows clients who have paid 100% but have not
yet been allocated a plot. With that filter on, the table should show an extra
**Payment completed** column: the date the client finished paying.

The table already has a **Bought** column (`purchase_date`), but that is when
the plan started. In the allocation queue, the CS team needs to know how long
each client has been waiting for a plot, and that wait starts on the day they
finished paying.

### 2.2 Why the frontend can't do this alone

The completion date is stored on the plan, but the dashboard's plan rows
(`plans[]`) don't include it. Each row only carries `purchase_date`.

### 2.3 What we need added to the response

On every row in `plans[]`:

| Field | Type | Meaning |
|---|---|---|
| `payment_completed_at` | ISO date string \| null | When the client finished paying for the land. `null` if not fully paid, or if the date is unknown |

**Example (one row, trimmed):**

```json
{
  "plan_id": "6650f1c2a9e4b2d1c8a1f001",
  "asset": "Abode Gardens",
  "purchase_date": "2026-01-14T09:30:00.000Z",
  "payment_status": "completed",
  "allocation": "awaiting",
  "payment_completed_at": "2026-07-02T15:12:00.000Z"
}
```

### 2.4 Questions to agree on

1. **Missing dates.** The dashboard treats a plan as fully paid when its
   balance reaches zero, but the stored completion date may not always be
   set, for example on plans migrated from the old system. Can it fall back
   to the date of the final payment? If not, we'll show "—".
2. **Land, not documents.** Full-ownership plans have a separate document plan
   with its own completion date. We assume this field is the **land**
   completion date. Please confirm.
3. **Optional extras (not required for this ticket):**
   - A sort option for the queue by this date (oldest completion first).
   - A `payment_completed_at` column in the CSV export
     (`GET /admin/cs-managers/:managerId/exports/plans`).

### 2.5 What the frontend will do once this ships

- Show a **Payment completed** column (the date, plus how long ago) only when
  the Due allocation filter is selected.
- Show "—" for rows where the date is `null`.
- Add the field to the mock data so the screen can be tested before the
  backend is deployed.

---

## Request 3: Date filter, and stats that follow the filters

**Screen:** Admin → **Amaris Questions**
**Endpoints:**
- `GET /admin/amaris/queries`
- `GET /admin/amaris/queries/counts`

### 3.1 What we're trying to do

The page has a row of stat cards (Total questions, Customer, Associate,
Answered, No answer, Web, WhatsApp), with Audience, Channel and Status filters
and a search box under them.

Two changes are wanted:

1. **A date filter**, so admins can look at a period (today, this week, this
   month, or a custom range) instead of all time.
2. **Stat cards that follow the filters.** Today the filters only change the
   table, and the cards always show all-time totals. With **No answer**
   selected, for example, the cards still show every question ever asked.

### 3.2 Why the frontend can't do this alone

- `GET /admin/amaris/queries` accepts `audience`, `channel`, `answered`, `q`,
  `page` and `limit`, but **no date range**.
- `GET /admin/amaris/queries/counts` accepts **no parameters at all**, so it
  can only return all-time totals.
- The frontend only ever holds one page (25 rows) of questions, so it can't
  count them itself.

### 3.3 What we need

**On `GET /admin/amaris/queries`, add:**

| Param | Type | Meaning |
|---|---|---|
| `start_date` | ISO date (`YYYY-MM-DD`) | Questions asked on or after this day |
| `end_date` | ISO date (`YYYY-MM-DD`) | Questions asked on or before this day (inclusive) |

**On `GET /admin/amaris/queries/counts`, accept the same filters as the list:**

| Param | Type |
|---|---|
| `audience` | `customer` \| `associate` |
| `channel` | `web` \| `whatsapp` |
| `answered` | `true` \| `false` |
| `q` | string (same search as the list) |
| `start_date` | ISO date |
| `end_date` | ISO date |

All parameters are optional. With none sent, the response should be what it
is today, so the current page keeps working. The response shape stays the
same:

```json
{
  "customer": 120,
  "associate": 310,
  "answered": 352,
  "noAnswer": 78,
  "web": 380,
  "whatsapp": 50,
  "total": 430
}
```

**Example:** `GET /admin/amaris/queries/counts?answered=false&start_date=2026-10-01&end_date=2026-10-26`
returns counts for unanswered questions asked in October only.

### 3.4 Questions to agree on

1. **Does a card ignore its own filter?** If the Associate filter is on,
   should the Customer card read **0**, or still show its number? We suggest
   each group ignores its own filter (Audience cards ignore `audience`,
   Channel cards ignore `channel`, Answered/No answer cards ignore
   `answered`), with **Total** applying every filter. That way the cards
   still help admins choose between options. If that's simpler to do as
   "apply everything everywhere", tell us and we'll match it.
2. **Time zone.** Should `start_date` / `end_date` be read as Lagos time
   (WAT)? We assume yes, so "today" matches what admins see on screen.
3. **Total for paging (related, optional).** The list currently comes back as
   a bare array and the total count is lost, so the page can only guess
   whether there's a next page. If the list could return the standard paged
   shape (`data` + `meta.total`), we'd also be able to show "Page 2 of 9".

### 3.5 What the frontend will do once this ships

- Add a date filter to the page, kept in the URL (`start_date` / `end_date`)
  like the other filters so a filtered view can be shared.
- Send the active filters to the counts request, so the cards refresh
  whenever a filter or the search changes.
- Update the mock data so the screen can be tested before the backend is
  deployed.

---

We can start building all three against mocks as soon as the field names are
agreed, so confirming the names alone unblocks the frontend.
