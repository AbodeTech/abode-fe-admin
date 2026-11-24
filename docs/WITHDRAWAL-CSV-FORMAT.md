# Withdrawal CSV format

The **Transactions → Withdrawal → Export CSV** action writes a comma-separated
file with this exact header order:

```csv
date,name,email,phone_number,status,referrer,amount,bank_name,account_number
```

Example row:

```csv
2026-09-01T00:11:42.164Z,Ibeade Sophia,udeojisophia@gmail.com,,Approved,,115000,GUARANTY TRUST BANK,113337960
```

CSV fields are escaped when values contain commas, quotes, or newlines. Empty
values remain empty fields, so the example has empty `phone_number` and
`referrer` cells.

## Field meanings

| CSV column | Source / formatting |
| --- | --- |
| `date` | Withdrawal transaction `createdAt` (ISO timestamp). |
| `name` | Populated requester's last name followed by first name; username/email fallback. |
| `email` | Requester's email. |
| `phone_number` | Requester's phone number, when returned by the API. |
| `status` | **Admin review status** (`admin_status`), human-readable. For example, `approved` becomes `Approved`, `pending` becomes `Pending review`, and `approved-retry-needed` becomes `Retry needed`. This matches the sample row. |
| `referrer` | Requester's referrer name, when returned by the API. |
| `amount` | Withdrawal amount in decimal naira, without currency symbols or thousands separators. |
| `bank_name` | Destination bank name. |
| `account_number` | Destination account number. |

The API also returns a separate transaction `status` describing the money
movement (`pending`, `processing`, `completed`, `failed`, `cancelled`). It is
not the CSV `status` column. If reconciliation needs both concepts, add a
separate `transaction_status` column rather than overloading `status`.

## Backend requirements

The frontend exports values returned by `GET /admin/withdrawals`. The backend
contract needed for the extra populated columns and date filtering is present
in the backend checkout's `staging` branch. The frontend's shared time-range
filter sends the selected date boundaries to both the list and export. The backend
should continue to:

1. Populate the requester's `phoneNumber` and `referred_by` (or an equivalent
   stable referrer field) in each withdrawal row. Return the referrer's name in
   a documented shape the frontend can read.
2. Preserve optional `start_date` and `end_date` query parameters on
   `GET /admin/withdrawals`, filtering by the withdrawal transaction's
   `createdAt`. This enables the time-range filter to affect the table and CSV export.
   The supported query parameters are `admin_status`, `payment_provider`,
   `search`, `start_date`, `end_date`, `page`, and `limit`.
3. Keep `admin_status` and transaction `status` as distinct response fields;
   the CSV `status` column uses `admin_status` to match the agreed sample.

If phone or referrer is missing on a particular user/transaction, its CSV cell
remains blank. The time-range filter uses the backend's inclusive date boundaries.

See [CSV-EXPORT-BACKEND-REQUIREMENTS.md](./CSV-EXPORT-BACKEND-REQUIREMENTS.md)
for the full response contract covering both commission and withdrawal CSVs.
