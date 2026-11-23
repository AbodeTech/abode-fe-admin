# Backend contract for admin CSV exports

This document defines the API response fields and filters the admin frontend
expects for its commission and withdrawal CSV exports. Keep the response
properties below stable so the frontend fills the agreed CSV columns as soon
as the backend change is deployed.

## Commission export

Endpoint: `GET /admin/commission/transactions` (paged list used by the CSV
export). Preserve the existing filters and pagination. Each row should include
these additional properties:

| JSON property | Type | Meaning |
| --- | --- | --- |
| `transaction_amount` | `number \| null` | Original source purchase/transaction amount in decimal naira. |
| `asset_type` | `string \| null` | Asset category/type, distinct from `asset_name` (the display name). Return the same human-readable type used elsewhere in the admin API. |
| `associate_status` | `string \| null` | Associate's status at the time represented by the commission row. |

The commission CSV columns and their mappings are:

```csv
Date,Client_name,Transaction_amount,Asset_type,Associate_name,Associate_status,Percentage_earned,Commission,Tax_Payer_ID,WHT_tax,Comission_earned,Commission_status
```

| CSV column | API field / rule |
| --- | --- |
| `Date` | `created_at` |
| `Client_name` | `source_user_name` |
| `Transaction_amount` | `transaction_amount` |
| `Asset_type` | `asset_type` |
| `Associate_name` | `referrer_name` |
| `Associate_status` | `associate_status` (falls back to `tier_at_creation` for older rows) |
| `Percentage_earned` | `rate_applied` is currently a fraction; export percentage points as a number (`0.05` → `5`, with no `%` sign). |
| `Commission` | `gross_commission` |
| `Tax_Payer_ID` | `referrer_tin` |
| `WHT_tax` | `wht_deducted` |
| `Comission_earned` | `net_commission` (keep the agreed header spelling). |
| `Commission_status` | `status` |

## Withdrawal export

Endpoint: `GET /admin/withdrawals`. Populate these fields on each withdrawal
row, while preserving the existing response properties:

| JSON property | Type | Meaning |
| --- | --- | --- |
| `user.phoneNumber` | `string \| null` | Requester's phone number. |
| `referrer` | populated person object or `null` | Requester's referrer; include `firstName`, `lastName`, and `userName` as available. |

The withdrawal CSV columns and their mappings are:

```csv
date,name,email,phone_number,status,referrer,amount,bank_name,account_number
```

| CSV column | API field / rule |
| --- | --- |
| `date` | `createdAt` (ISO timestamp) |
| `name` | `user.lastName`, `user.firstName`, with username/email fallback |
| `email` | `user.email` |
| `phone_number` | `user.phoneNumber` |
| `status` | `admin_status`, rendered as the readable review label. Do not substitute transaction `status`. |
| `referrer` | Populated `referrer` person's name |
| `amount` | `amount` in decimal naira |
| `bank_name` | `bank_details_id.bank_name` (or the existing camelCase equivalent) |
| `account_number` | `bank_details_id.account_number` (or the existing camelCase equivalent) |

`admin_status` is the review workflow (`pending`, `auto-approved`, `approved`,
`approved-retry-needed`, `declined`, `failed`). Transaction `status` is the
separate money movement state (`pending`, `processing`, `completed`, `failed`,
`cancelled`). Keep both properties distinct in the API response.

## Monthly withdrawal filtering

`GET /admin/withdrawals` supports optional `start_date` and `end_date` query
parameters with inclusive date-only boundaries over `createdAt`. They are
applied before pagination, and `meta.total` describes the filtered result. This
is implemented in the backend checkout on branch `staging`; the frontend's
shared time-range filter passes these parameters to both the withdrawal table
and CSV export.

The withdrawal list query parameters are `admin_status`, `payment_provider`,
`search`, `start_date`, `end_date`, `page`, and `limit`.

## Compatibility expectations

- Return the new properties as `null` when the value is unknown rather than
  omitting or inventing data.
- Keep amounts numeric in decimal naira; do not add currency symbols or
  thousands separators in API JSON.
- Keep paged list metadata accurate after all filters are applied.
- The frontend schemas accept the new fields as optional during rollout and
  will populate the corresponding CSV columns once they are returned.
