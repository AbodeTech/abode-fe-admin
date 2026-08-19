# Backend Requests — abode-be-v2

Gaps found while migrating `abode-admin-fe` from GraphQL to REST. Each entry
says what the frontend needs, what already exists to build it from, and what
breaks until it lands.

Target: `abode-be-v2`, branch `staging`, base path `/api/v1`.

---

## Confirmed against the live deployment — 2026-08-13

The source read below was checked against the running API's spec at
`https://abode-be-v2-production.up.railway.app/api/docs-json` (which tracks
`staging`). **139 paths, 156 operations, 69 schemas** — up from 93/103/49 on
2026-07-28.

Every query param and request DTO this frontend depends on is live:

| Checked | Deployed spec says |
|---|---|
| `GET /admin/referrals/upgrades` | `search, status, payment_method, to_tier, page, limit` — **ticket 14 live** |
| `GET /admin/withdrawals` | `admin_status, payment_provider, search, page, limit` — **the withdrawal queue has `search` too** |
| `GET /admin/users` | `search, referral_status, is_suspended, page, limit` — **ticket 2 live**, and this answers the open filter question: those five, nothing else |
| `ManualUpgradeDto` | `to_tier`, `fee_amount`, `pay_commission`, `reason`; required `[to_tier, reason]` — **ticket 15 live**, exactly as specified |
| `PATCH …/upgrades/:id/approve` | **no `requestBody`** — settles the tier-in-the-body question for good |

**Ticket 13 (populate) cannot be confirmed this way** — see the response-body
gap below. It only shows in the UI: names on the queue rows instead of
em-dashes. That is the one item here resting on a source read rather than an
observation.

**The response-body gap has not moved, and has grown in absolute terms:
0 of 156 operations declare a 2xx response schema** (it was 0 of 103). Every Zod
response schema in this repo is still a source read. Paths, query params and
request DTOs are trustworthy; response shapes are not documented anywhere.

---

## Re-checked against staging source — 2026-08-13

Read while auditing the associate upgrade page. **Four tickets landed since the
last check**, and the frontend was still built around two of them being open —
it was telling admins that data was unavailable while the backend was returning
it.

| Ticket | What shipped | Where |
|---|---|---|
| **2** | `GET /admin/users` and `/users/:id` are wired — `listUsers(dto)` / `getUser(id)` call `AdminService`, no more `{ message, dto }` stub | `admin/admin.controller.ts:75-87` |
| **13** | Populate landed on **both** remaining queues | see below |
| **14** | `UpgradeQueryDto.search` — matches name / email / username via `findUserIdsBySearch` (regex over `firstName`, `lastName`, `email`, `userName`) | `referral/dto/admin-referral.dto.ts`, `referral.repository.ts:255` |
| **15** | `ManualUpgradeDto` gained `fee_amount?` and `pay_commission?`, and `manualUpgrade` **writes the Transaction and fires commission** — not just the DTO fields | `referral.service.ts:351-418` |

Ticket 13 in detail — `findUpgradesPaginated` and `findTransactionsPaginated`
both take a `populate` flag and both callers pass `true`:

| Endpoint | Populated with |
|---|---|
| `GET /admin/referrals/upgrades` | `user` → `firstName lastName email userName phoneNumber referral_status`; `referrer` → `firstName lastName email userName` |
| `GET /admin/withdrawals` | `user` → `firstName lastName email`; `bank_details_id` → `bank_name account_number account_name`; `reviewed_by` → `firstName lastName` |

Ticket 15 is implemented as specified, including the part the ticket warned must
not be missed: when `fee_amount > 0` a `Transaction` is created inside the same
session and its id is passed to `fireForUpgrade`, so commission has the
`sourceTransactionId` its idempotency index needs. Two behaviours worth knowing
before building against it — neither is a defect, both need surfacing in the UI:

- Commission fires only when `pay_commission && fee > 0 && target.referred_by`.
  Asking for commission on a free tier change, or for a user with no referrer,
  silently pays nobody.
- A fee on a user with no wallet throws `PAYSTACK_INIT_FAILED` with
  `reason: 'User has no wallet'` — a confusing error code for that cause.

**Still open after this check:** the two fields in ticket 22, plus 3, 4, 5, 7,
10, 16, 17, 19 (edit-tenor half), 20 and 21.

---

## Verified against the deployment — 2026-07-28 (first check 2026-07-27)

Checked against the live Swagger spec at
`https://abode-be-v2-production.up.railway.app/api/docs-json`
(now 93 paths, 109 operations, 49 schemas — up from 87/103 the day before).

**Every path the migrated frontend calls exists and matches.** Asset filter
params, the nested offer/size/plan routes, the commission override family, the
upgrade queue and `/auth/refresh` all line up exactly.

### Resolved between 2026-07-27 and 2026-07-28

Six endpoints landed, each answering a ticket below:

| Ticket | What shipped | Smoke-checked live |
|---|---|---|
| **1** | `POST /auth/admin/forgot-password` → `{resetToken}`, `/verify-otp` (bearer: reset token), `/reset-password` (bearer: reset-grant token) | ✅ **Fully verified against source + live.** forgot-password returns `{resetToken, message}`, the JWT carries `purpose: "reset-password", aud: "admin"`, and staging's `auth.service.ts` confirms `adminVerifyResetOtp` returns `{resetGrantToken, message}` and reset revokes all sessions — every field name the FE's Zod schemas expect. Live: all three endpoints respond (401 for bad tokens, not 404); enumeration-safe (unknown emails still 200). Only OTP **email delivery** remains unverified — needs one real inbox |
| **9b** | `GET /admin/commission/preview?user_id&asset_id&offer_type` — the dry-run resolve | 401 without token (exists; shape unverified) |
| **18** | `POST /admin/assets/:assetId/offers` — an asset can now gain its second offer | 401 without token |
| **19** (add-plan half) | `POST …/sizes/:sizeId/plans`, 409 on duplicate tenor — adding a plan no longer requires full-replacing `plans[]` | 401 without token |

Schema changes: `AddPlanDto` added; `AdminUpdateUserDto` **removed** —
`PATCH /admin/users/{id}` now takes `UpdateProfileDto` (the user-facing
profile DTO). Whoever migrates the users feature should check whether
admin-only fields were lost in that swap.

### A second wave, invisible to the spec (found reading staging source, 2026-07-29)

The commission-fixes merge resolved five more tickets without adding paths, so
the spec diff missed them: **6** (multi-leg resolution + payout), **8**
(per-leg override rates), **9a** (populate), **11** (config history metadata),
**12** (`include_inactive` filter). Each heading below carries the detail.

Two of those were **breaking** for the FE, fixed same-day: publish now
*requires* `reason`, and the override DTOs dropped the flat `rate` field.

### Still open, confirmed present-tense against the 2026-07-28 spec

| Ticket | Confirmation |
|---|---|
| 14 | `GET /admin/referrals/upgrades` takes `status`, `payment_method`, `to_tier`, `page`, `limit` — **no `search`** *(resolved 2026-08-13)* |
| 16 | `GET /admin/assets` — **no sort** param |
| 17 | Nothing under `Admin — Assets` for analytics, subscribers or statements |
| 19 (edit-tenor half) | Changing an existing plan's tenor still means full-replacing `plans[]` |

**Ticket 2 may be resolved.** `GET /admin/users` is documented as "List all
users with filters" taking `search`, `referral_status`, `is_suspended`, `page`,
`limit`, alongside `PATCH /admin/users/{id}`, `/suspend` and `/unsuspend`.
Whether the handlers return real data needs an authenticated call — the spec
can't answer it.

### Frontend work the new endpoints unlock

- **Recovery**: nothing to build — the hooks were written against this exact
  contract and the provisional marker is now removed. Remaining check is OTP
  email delivery, which needs a real admin inbox.
- **Add offer** (ticket 18): the offers tab was designed around this absence
  ("an asset can never gain a second offer"). An "Add offer" action can now
  exist for whichever of flex/full-ownership the asset lacks.
- **Add plan** (ticket 19): `useUpdateSize`'s full-replace path is still how
  edits work, but *adding* should move to the new endpoint — it can 409 on a
  duplicate tenor instead of silently overwriting, and it can't drop plans.
- **Commission preview** (9b): the "what would this actually pay?" panel from
  the commission design doc is now buildable — held step 8/9 work partially
  unblocks (9a populate and 11 history are still missing).

### The spec documents no response bodies

**0 of 103 operations declare a 200/201 response schema** (39% declare a
request body). Paths, query params and request DTOs are trustworthy; response
shapes are not documented anywhere.

This matters for the migration: every Zod response schema in this repo was
written by reading the NestJS source, and nothing in the deployment can confirm
them. A schema that drifts from the real payload is the silent-mapper failure —
it passes `tsc`, passes Zod, and renders an empty list. **Response shapes must
be confirmed against a live authenticated call before each feature is
considered done.** Adding `@ApiOkResponse` types would remove the whole class
of problem, and is worth a ticket of its own if the migration continues at
this pace.

### Error envelope confirmed

```json
{ "success": false, "statusCode": 400, "error": "Bad Request",
  "message": ["email must be an email", "password should not be empty"],
  "timestamp": "…", "path": "/api/v1/auth/admin/login" }
```

`message` is a **string or a string array** — class-validator failures arrive
as an array. The discriminator field is named `error`, not `code`;
`lib/api-client.ts` now reads `code ?? error`.

---

## 1. Admin password recovery is missing (regression) — ✅ RESOLVED 2026-07-28

> Shipped as specified: three admin-scoped endpoints, `reset-password` →
> `reset-grant` token chain, enumeration-safe, sessions revoked on reset.
> Verified against staging source and the live deployment (see the table
> above). The original request is kept below for the record.

**Priority: high — this is a feature the current system has and v2 drops.**

### What exists today

The live GraphQL API has a complete admin recovery flow. `abode-admin-fe` uses
it on `/forgot-password` and `/reset-password`:

| Step | GraphQL mutation | Returns |
|------|------------------|---------|
| 1 | `sendAdminEmailVerification(emailInput)` | `{ message, authToken }` |
| 2 | `verifyAdminEmail(tokenInput)` | `{ message, authToken }` |
| 3 | `updateAdminPassword(passwordInput)` | `Boolean` |

### What abode-be-v2 has

Nothing equivalent. `AuthService.forgotPassword` calls `findUserByEmail`, and
`resetPassword` verifies a `'user'`-audience token and resolves the account
with `findUserById`. Admins are a separate collection with `'admin'`-audience
tokens, so neither endpoint can serve them. `findAdminByEmail` appears exactly
once in the service — inside `loginAdmin`.

`POST /auth/admin/change-password` does **not** cover this case: it requires
the current password, which is the thing a locked-out admin doesn't have.

### Consequence today

An admin who forgets their password cannot recover it. There is also no
admin-facing reset endpoint (`AdminController` has create / list / change-role
/ delete only), so another admin cannot reset it for them. The only route back
is deleting the account and recreating it — which needs `manage_admins`, i.e.
a full `admin`, and loses the original record.

### What we need

Three endpoints mirroring the existing **user** flow one-for-one. The frontend
is already written against exactly this contract
(`features/auth/hooks/use-password-recovery.ts`).

```
POST /auth/admin/forgot-password
  body:    { email: string }
  returns: { resetToken: string, message: string }
  notes:   enumeration-safe — 200 with a token even for an unknown address,
           same as the user endpoint

POST /auth/admin/verify-otp
  header:  Authorization: Bearer <resetToken>
  body:    { otp: string }            // 6 digits, as VerifyOtpDto
  returns: { resetGrantToken: string, message: string }

POST /auth/admin/reset-password
  header:  Authorization: Bearer <resetGrantToken>
  body:    { newPassword: string }    // min 8, as ResetPasswordDto
  returns: { message: string }
```

### Why this should be small

Every piece already exists and is working for users — `issueOtp`,
`OtpThrottleService`, `signResetPasswordToken` / `signResetGrantToken`, the
`otp-token` schema, and the `password-reset` email template. The admin variant
is largely swapping the repository lookup (`findUserByEmail` →
`findAdminByEmail`, `findUserById` → `findAdminById`) and pointing the password
write at the admin repository.

Two things to confirm while implementing:

- **Token audience.** The scoped-token helpers hardcode `aud: 'user'`
  (`signScopedUser`). The admin variants need `'admin'`, or a shared audience
  parameter.
- **Session revocation.** `changeAdminPassword` calls `sessions.revokeAll` and
  bumps `session_epoch`. A reset should do the same, or a stolen session
  survives the password change.

### Until it ships

The frontend calls these paths and they resolve in mock mode only. Against a
real backend they 404 and surface as an `ApiClientError` in the form. See
`lib/mocks/routes/auth.ts`.

---

## 2. `POST /admin/users*` handlers are stubs — ✅ RESOLVED 2026-08-13

> `@Get('users')` → `adminService.listUsers(dto)` and `@Get('users/:id')` →
> `adminService.getUser(id)`. The placeholder `{ message, dto }` responses are
> gone. **Response shapes are still unconfirmed against a live authenticated
> call**, so treat the Zod schemas as source-read, not verified.
>
> Frontend follow-up: `UserPicker`'s paste-an-ObjectId stopgap can stay as a
> convenience but is no longer load-bearing, and the "search is unavailable"
> copy in it is now wrong. The original request is kept below for the record.

**Priority: high — blocks migrating the `users` feature.**

Five routes in `AdminController` are guarded and validate their DTOs but never
touch the database:

```ts
@Get('users')            → { message: 'Endpoint connected to UserService', dto }
@Get('users/:id')        → { message: 'Endpoint connected to UserService', id }
@Patch('users/:id')      → { message: 'Endpoint connected to UserService', id, dto }
@Patch('users/:id/suspend')   → { message: 'Endpoint connected to UserService', id }
@Patch('users/:id/unsuspend') → { message: 'Endpoint connected to UserService', id }
```

These are the only stubs in the codebase. Note that user *referral* operations
under the same `/admin` prefix (`referral-admin.controller.ts`) **are**
implemented — it is user CRUD specifically that is unwired.

The admin frontend's largest feature is `users`. It cannot be migrated against
a real backend until `AdminController` is wired to `UserService`, because the
placeholder response fails Zod validation at the boundary
(`code: 'SCHEMA_MISMATCH'`).

### Also blocks: commission override referrer picker

`GET /admin/users` is the only way to find a referrer by name or email, so the
user and asset+user override dialogs cannot identify who an override is for.

`AdminListUsersDto` already declares everything the picker needs — `search`,
`referral_status`, `page`, `limit`. The handler just doesn't use them. What the
picker needs back, per row: `_id`, `firstName`, `lastName`, `email`,
`referral_status`.

**Frontend interim, to be removed when this ships:** `UserPicker` accepts a
pasted 24-character ObjectId so an admin arriving from a user's page can still
create an override. That is a stopgap, not a design — it allows an override to
be created against an id nobody has verified exists.

---

## 3. Confirm: is the GraphQL reset flow's token check enforced?

**Priority: low — a question, not a request. Worth answering before the
endpoints above are designed.**

In the current frontend, `ResetPasswordForm` obtains a reset token in step 1,
stores it, then passes it to steps 2 and 3 — through a wrapper that **discards
it**:

```ts
async function gqlRequest<T>(query, variables, _operationName, _authToken?) {
  return executeRaw<T>(query, variables);   // _authToken never used
}
```

The admin is signed out during a reset, so the cookie interceptor has nothing
to attach either. That means `verifyAdminEmail` and `updateAdminPassword` are
being called with no token at all.

Either the GraphQL backend doesn't require one — in which case
`updateAdminPassword` may be callable against any account and should be checked
— or that flow is already failing in production.

Whichever it is, the REST replacement above binds each step to a scoped token,
so the issue doesn't carry across.

---

## 4. Optional: httpOnly refresh cookie

**Priority: low — a hardening follow-up, not a blocker.**

`abode-admin-fe` is fully client-side, so it stores both tokens in
JavaScript-readable cookies (`lib/utils/cookies.ts`). The refresh token is
valid for 30 days, so an XSS yields 30 days of access rather than the 15
minutes an access token alone would give.

Moving refresh behind an `httpOnly` cookie needs a Next.js route handler to
proxy `POST /auth/refresh` server-side. No backend change is required — noted
here so the trade-off is recorded rather than forgotten.

---

## 5. Money is decimal naira everywhere; integers only at the Paystack boundary

**Priority: high — blocks the admin FE's money handling, and every module that
touches an amount. Settle before more financial code is written.**

### The decision

Amounts are **decimal naira** (`2500.50` = ₦2,500.50). This matches v1, and it
is what `abode-admin-fe` will assume when rendering and submitting every price,
fee, balance, commission and discount.

Integers are used in exactly **one** place: the Paystack request/response
boundary, where the conversion already exists and stays as-is.

### Why this needs a ticket: the codebase currently disagrees with itself

Three different conventions are live at once.

**(a) Asset prices are hard-enforced as integer kobo.**

```ts
// src/modules/asset/schemas/flex-size.schema.ts
const kobo = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer (kobo, not naira)',
};
```

Applied to seven fields:

| File | Fields |
|---|---|
| `asset/schemas/flex-size.schema.ts` | `initial_payment`, `monthly_installment`, `land_price` |
| `asset/schemas/full-ownership-size.schema.ts` | `initial_payment`, `monthly_installment`, `land_price`, `document_fee` |

**(b) The payment module treats amounts as naira.**
`payment.service.ts:30` does `Math.round(amount * 100)` before calling
Paystack. You only multiply by 100 if you started in naira.

**(c) Everything else is undeclared.** `Transaction.amount` and
`Wallet.balance` are bare `Number` props with no validator and no comment.
`CommissionConfig.associate_pro_fee` defaults to `20_000` — sensible as
₦20,000, nonsense as ₦200.

### Scenarios

**S1 — Admin creates a Flex plan priced at ₦2,500.50/month.**
Expected: `monthly_installment: 2500.5` saves successfully.
Actual today: **rejected** — `Number.isInteger(2500.5)` is false, so the
validator throws `monthly_installment must be an integer (kobo, not naira)`.
Half-naira pricing is currently impossible.

**S2 — Existing asset data.**
A ₦2,000,000 plot is stored today as `200000000`. After this change it must
read `2000000`. Existing documents need a one-off migration dividing the seven
fields above by 100. Anything created after the change is written in naira, so
running the migration twice must be safe (guard on a flag or a max-value
heuristic, and confirm which before running against production).

**S3 — Paystack outbound. Buyer pays ₦19,999.50.**
Stored: `19999.5`. Sent to Paystack: `Math.round(19999.5 * 100)` = `1999950`
kobo. ✅ Unchanged — this line stays exactly as it is.

**S4 — Paystack inbound.**
Paystack returns `amount: 1999950`. `payment.service.ts:53` divides by 100 →
`19999.5`. ✅ Unchanged.

**S5 — The float trap that must be handled.**
Commission of 10.5% on a ₦19,999 payment, in plain JavaScript:

```js
19999 * 0.105
// => 2099.8949999999995      ← not 2099.895
```

Persisted raw, that becomes the amount on a Transaction row and eventually
renders in the admin UI as `₦2,099.8949999999995`. **Every amount must be
rounded to 2 decimal places at the moment it is written.**

**S6 — Accumulation drift on wallet balance.**
A wallet credited ₦0.10 one hundred times:

```js
let b = 0; for (let i = 0; i < 100; i++) b += 0.1;
b            // => 10.000000000000002
b === 10     // => false
```

A withdrawal check of `balance >= amount`, or a "wallet is empty" check of
`balance === 0`, will eventually behave wrongly. Balance must be rounded to 2dp
after every mutation, and comparisons must use a tolerance rather than `===`.

### What we need

1. **Remove the `kobo` validator** from the seven fields listed above.
2. **Migrate existing asset documents** — divide those seven fields by 100.
3. **Declare the convention once**, in a shared place, and apply a
   `round2` helper at every write to a money field:
   `Math.round(value * 100) / 100`.
4. **Apply that rounding to**: `Transaction.amount`, `Wallet.balance`, all
   commission amounts (`gross_commission`, `wht_deducted`, `net_commission`),
   and any coupon discount amounts.
5. **Never compare money with `===` or `>=` without rounding first.** Use a
   tolerance of half a kobo (`0.005`) for equality checks.
6. **Leave `payment.service.ts` untouched** — the ×100 / ÷100 boundary is
   already correct.

### Known trade-off, accepted

Floating point is not exact, so this convention trades a small amount of
precision safety for consistency with v1 and simpler handling in the FE. The
rounding rules above are what keep it safe in practice; they are not optional
extras. See also ticket 6's rounding rule, which becomes more important under
this convention.

---

## 6. Upline and topline commission are configured but never paid — ✅ RESOLVED 2026-07-28

> `resolveCommissionForPlan` now walks the referral chain (with cycle
> protection) and writes a recipient per leg; the payout loop pays every
> recipient on each instalment. Verified in staging source.

> The original request is kept below for the record.

**Priority: high — admins can configure a payout that silently never happens.**

### What's wrong

`CommissionConfig.fullOwnershipCommission` carries three rate tables:

```ts
direct!:  Map<string, number>   // { default: 0.1, founder: 0.18, 'associate-pro': 0.15, premium: 0.17 }
upline!:  Map<string, number>   // { founder: 0.03, 'associate-pro': 0.02, premium: 0.02 }
topline!: Map<string, number>   // { founder: 0.01, 'associate-pro': 0.01 }
```

`Transaction.commissionType` accepts `'direct' | 'upline' | 'topline' |
'agency' | 'wht'`, and the idempotency index
`{wallet, source_transaction, commissionType}` already allows three separate
legs against one source payment.

But `CommissionService.creditCommission` only ever writes **one** leg:

```ts
const commissionType = isAgency ? 'agency' : 'direct';
```

`upline` and `topline` are never read and never paid. An admin can set them,
save them, see them persisted — and no money will ever move.

### Scenarios

**S1 — The main case. Full-ownership purchase, three-level chain.**

Setup: Buyer B is referred by R (tier `associate-pro`). R is referred by U
(tier `founder`). U is referred by T (tier `founder`). Config as above,
`wht_rate: 0.05`. B makes a payment of ₦1,000,000.

Expected:

| Leg | Recipient | Rate | Gross | WHT | Net |
|---|---|---|---|---|---|
| direct | R | 0.15 | ₦150,000 | ₦7,500 | ₦142,500 |
| upline | U | 0.03 | ₦30,000 | ₦1,500 | ₦28,500 |
| topline | T | 0.01 | ₦10,000 | ₦500 | ₦9,500 |
| wht | management | — | — | — | ₦9,500 total |

Actual today: only the **direct** leg is written. U and T receive nothing, and
nothing is logged to say they were skipped.

**S2 — Short chain.** B → R, and R has no referrer.
Expected: direct leg only. No upline, no topline, **no error**. The purchase
completes normally.

**S3 — Two-level chain.** B → R → U, U has no referrer.
Expected: direct + upline. No topline. No error.

**S4 — Flex purchase.** `flexCommission` has **only** a `direct` table.
Expected: direct leg only, regardless of how long the chain is. Upline and
topline are full-ownership concepts.

**S5 — Agency purchase.** Buyer came through an agency.
Expected: unchanged — the agency leg short-circuits the whole chain (C-B5). No
upline or topline.

**S6 — Self-referral / cycle in the data.** R's `referred_by` points back to B,
or a chain loops. Expected: traversal stops, no infinite loop, no duplicate
payment to the same wallet at the same `commissionType`.

**S7 — Retry safety.** The same source payment is processed twice.
Expected: exactly three commission rows still, not six. The existing
idempotency index covers this because `commissionType` differs per leg — worth
an explicit test.

### The part that needs a design decision first

This is not just a loop over three rates. Per **C-2**, rates are frozen onto
the `PaymentPlan` at creation and never re-read. The snapshot today holds
exactly one referrer and one rate:

```ts
referrer_id, agency_id, commission_rate, commission_tier_at_creation,
commission_config_version, wht_rate, commission_override_source
```

To pay three legs from a frozen snapshot, the snapshot has to carry all three
referrers and all three rates — otherwise `creditCommission` would have to walk
the referral chain live on every payment, which is exactly the behaviour C-2
exists to prevent (a referrer's tier changing mid-plan must not alter an
already-struck deal).

So this ticket implies **new PaymentPlan fields**:

```
upline_id?,  upline_rate?,  upline_tier_at_creation?,  upline_override_source?
topline_id?, topline_rate?, topline_tier_at_creation?, topline_override_source?
```

resolved once inside `resolveCommissionForPlan`, alongside the direct rate.

Note each leg carries **its own `override_source`**, not one shared value. See
"Resolution is per leg" below for why.

### Resolution is per leg, not per plan

This is a change to how `resolveCommissionForPlan` works, and it depends on
ticket 8 (per-leg override shape).

Today the chain runs once and produces a single rate. Once three legs exist,
**each leg resolves independently** — walking `asset+user → user → asset →
default` and taking the first level that defines *that leg*.

**Worked example.** Buyer B → R (direct) → U (upline) → T (topline), full
ownership. Overrides in place:

- Asset+user override on (Aviation City, R): `direct: 0.12` only
- User override on U: `upline: 0.04` only
- No override defines `topline`

Expected resolution:

| Leg | Recipient | Rate | Source |
|---|---|---|---|
| direct | R | 0.12 | `asset_user` |
| upline | U | 0.04 | `user` |
| topline | T | 0.01 | `default` |

Three different override sources on one plan. A single shared
`commission_override_source` field cannot express this, which is why each leg
needs its own.

### Open questions

1. **Whose tier keys the upline rate?** The `upline` table is keyed by tier
   (`founder: 0.03`). Is that the **upline's own** tier, or the direct
   referrer's? The two give different payouts and the code gives no clue.
   *(This only affects the `default` and `asset` levels — user and asset+user
   overrides are per-person, so tier doesn't enter into them.)*
2. **Is the chain `referred_by`?** `resolveReferrerId` uses
   `buyer.referred_by`. Confirm upline = `referrer.referred_by` and topline =
   `upline.referred_by`, and that there is no separate chain structure.
3. **Is WHT withheld per leg?** Assumed yes — each leg gets its own
   `wht` Transaction — but confirm, since it changes the management wallet's
   row count.
4. **Does an `asset` override's `direct` map still win over a `user`
   override's `direct`?** No — the chain order is unchanged
   (`asset_user → user → asset → default`), so a user override beats an asset
   override. Confirming because it is the one ordering that reads
   counter-intuitively: the more *specific subject* wins over the more
   specific *object*.

---

## 7. The commission email is sent before the money is real

**Priority: high — users are told about money that can then vanish.**

### What's wrong

`CommissionService.creditCommission` fires the "you earned a commission" email
from inside the caller's Mongo transaction, before it has committed:

```ts
// commission.service.ts, inside creditCommission
if (recipientUserId) {
  this.notifyCommission(recipientUserId, net).catch(() => undefined);
}
return tx.transaction;
```

The `.catch()` correctly stops a mail failure from breaking the financial
write. But it does not stop the reverse: the email leaving for a transaction
that then rolls back.

Every caller uses the established pattern:

```ts
await session.withTransaction(async (txn) => { ... });
```

Nothing inside that callback is durable until `withTransaction` resolves.
Anything that leaves the system — an email, an SMS, a webhook — must happen
after it returns, because it cannot be rolled back.

### Scenarios

**S1 — The failure case.**
1. Buyer's wallet is debited ₦1,000,000 ✏️
2. PaymentPlan is updated ✏️
3. Referrer is credited ₦142,500 ✏️
4. **Email sent: "You earned ₦142,500"** 📧 ← leaves the system here
5. A later write in the same transaction fails, or the commit fails
6. Steps 1–3 roll back. Buyer's money returns. Referrer's credit disappears.

Result: the referrer has an email saying they earned ₦142,500, and a wallet
balance that never changed. There is no correction and no second email.

**S2 — Write conflict retry.** MongoDB retries a `withTransaction` callback on
a transient error. The callback runs twice, so **two identical emails** are
sent for one payment. The financial write is protected by the idempotency
index; the email is not.

**S3 — The correct behaviour.** Same steps 1–3, commit succeeds, **then** the
email is sent. If the mail provider is down, the money is still correct and the
email can be retried independently.

### What we need

Move the notification out of `creditCommission` and fire it after the
transaction commits. Two workable shapes:

- **Return the intent.** `creditCommission` returns the transaction plus the
  notification it *would* send; the caller enqueues it after
  `withTransaction` resolves.
- **Enqueue to an outbox.** Write a notification row inside the transaction (so
  it rolls back with everything else) and have a worker send it after commit.
  Heavier, but it survives a process crash between commit and send.

Either is fine. The requirement is only that nothing leaves the system before
the commit.

### Related inconsistency

`fireForUpgrade` — the associate-pro upgrade commission path — sends **no
notification at all**. A referrer earning upgrade commission is never told.
Whether that is deliberate or an oversight is worth confirming while this area
is open.

---

## 8. User and asset+user overrides need a rate per leg, not one flat rate — ✅ RESOLVED 2026-07-28

> Both DTOs now extend `TierRatesDto` (`direct`/`upline`/`topline`, each
> optional), and a migration script rewrites stored `rate` into `direct`.
> **The old `rate` field is gone from the DTO — sending it is a 400.** The
> FE payload switched the same day.

> The original request is kept below for the record.

**Priority: high — pairs with ticket 6. Landing 6 without this makes the
existing overrides ambiguous.**

### What's wrong

`UserCommissionOverride` and `AssetUserCommissionOverride` each carry a single
flat rate:

```ts
@Prop({ type: Number, required: true, min: 0, max: 1 }) rate!: number;
```

Today that reads as "John gets 15%" and is unambiguous only because just one
commission leg is ever paid. The moment ticket 6 lands and upline/topline
actually disburse, the same field has three possible meanings and no way to
choose between them:

- Does John's 15% replace his **direct** rate?
- Whatever leg he **happens to occupy** on a given plan — direct on one sale,
  upline on another?
- **All three** legs at 15% each?

`AssetCommissionOverride` already solves this — it splits `direct` / `upline` /
`topline`. The two newer collections do not.

### What we need

Replace the flat `rate` on **both** collections with three optional numbers:

```ts
direct?:  number   // 0–1
upline?:  number   // 0–1
topline?: number   // 0–1
```

At least one is required. **An absent leg is not an override** — it falls
through to the next level of the chain for that leg only.

That single shape expresses every case:

| Admin intent | Fields set |
|---|---|
| Override everything | `direct`, `upline`, `topline` |
| Override direct only | `direct` |
| Override upline only | `upline` |
| Override topline only | `topline` |

No `'all'` sentinel value — "all" is just setting all three. One code path, no
special case.

Unique indexes are unchanged: `(user_id, offer_type)` and
`(asset_id, user_id, offer_type)`. One row per subject per offer type, now
carrying up to three rates.

### Scenarios

**S1 — Direct only, the common case.**
Admin sets a user override on John: `direct: 0.15`, nothing else.
John refers a buyer directly on a full-ownership plan.
Expected: John's direct leg pays 15% (`override_source: 'user'`). If John is
*also* someone's upline on a different plan, that upline leg falls through to
the default table — his override does not touch it.

**S2 — Upline only.**
Admin sets a user override on Uche: `upline: 0.04`, nothing else.
Uche sits one level above the direct referrer on a plan.
Expected: Uche's upline leg pays 4% (`override_source: 'user'`). When Uche
refers someone **directly**, that leg falls through to the default table — 4%
does not apply to his direct sales.

**S3 — Mixed sources on one plan.** See the worked example in ticket 6. Three
legs, three different `override_source` values, on a single plan.

**S4 — Partial asset+user override beats a full user override, per leg.**
User override on John: `direct: 0.15, upline: 0.03`.
Asset+user override on (Aviation City, John): `direct: 0.12` only.
John sells Aviation City, directly.
Expected: direct = **0.12** (`asset_user`), upline = **0.03** (`user`).
The asset+user row wins only for the leg it actually defines. It must **not**
mask John's user-level upline rate just because it is a more specific row.

**S5 — Flex purchase.** `flexCommission` has only a `direct` table.
Expected: a user override's `upline`/`topline` values are simply never
consulted on a flex plan. Not an error — no upline leg exists to pay.

**S6 — Empty override rejected.** Admin submits a user override with no legs
set. Expected: `400 INVALID_RATE` (or similar) — a row that overrides nothing
should not be creatable.

**S7 — Existing rows.** Any `UserCommissionOverride` /
`AssetUserCommissionOverride` documents already written carry `rate`. Migrate
them to `direct: <rate>`, since a single leg is what they meant when created.
This is a small, verifiable migration — unlike ticket 5's, the old and new
fields have different names, so it is idempotent by construction.

### DTO changes

`CreateUserOverrideDto` and `CreateAssetUserOverrideDto` lose `rate` and gain
`direct?` / `upline?` / `topline?`, each `@Min(0) @Max(1)`, with a
class-level check that at least one is present.

---

## 9. Commission admin screens need populated names and a resolve preview — ✅ RESOLVED 2026-07-28

> 9a: `listOverrides` populates asset (`name`) and user (`firstName lastName
> email referral_status`) refs; the audit shapes its refs via
> `commission.shape.ts` — note those use `id`, not `_id`. 9b:
> `GET /admin/commission/preview` resolves the chain server-side.

> The original request is kept below for the record.

**Priority: high — 9a blocks the plan audit screen entirely; the overrides list
is degraded without it.**

### 9a. Neither `listOverrides` nor `getPlanAudit` populates anything

```ts
const [asset, user, assetUser] = await Promise.all([
  this.assetOverrideModel.find(scope).exec(),
  this.userOverrideModel.find(scope).exec(),
  this.assetUserOverrideModel.find(scope).exec(),
]);
return { asset, user, asset_user: assetUser };
```

No `.populate()`. So `GET /admin/commission/overrides` hands back `user_id`,
`asset_id` and `granted_by` as bare ObjectIds.

**Scenario.** Admin opens the overrides screen expecting:

> Aviation City · John Okafor · full-ownership · direct 12% · set by Ada Okafor · expires 30 Sep

What the frontend can actually render:

> `665f1c0a...` · `665f1c0a...` · full-ownership · direct 12% · `665f1c0a...`

Resolving the names client-side means one lookup per row per field — an N+1
over three collections, on a screen whose whole job is scanning a list.

**Needed:** populate `user_id` (name + email), `asset_id` (asset name), and
`granted_by` (admin name) on the list response.

Two smaller notes on the same endpoint:

- It returns **three arrays** (`{asset, user, asset_user}`), so the client
  normalises them into one table with a type column. Workable — flagging only
  so the shape isn't mistaken for an oversight.
- There is **no pagination**. Fine at current volume; will need `page`/`limit`
  once override counts grow.

#### The same problem stops the plan audit screen being built at all

`getPlanAudit` reads the plan's snapshot and returns it verbatim.
`findPlanById` is a plain `findById` with no `.populate()`, so **every identity
field comes back as an ObjectId**:

```ts
return {
  buyer: plan.user,        // ObjectId
  asset: plan.asset,       // ObjectId
  referrer_id: …,          // ObjectId
  agency_id: …,            // ObjectId
  commission_rate, commission_tier_at_creation, commission_config_version,
  wht_rate, commission_override_source, commission_payable
};
```

**Scenario.** A referrer disputes a payout. An admin opens the audit for that
plan and sees:

```
Buyer               665fcccc00000000000000c1
Asset               665faaaa00000000000000a1
Earns commission    665fcccc00000000000000c2
Rate applied        2.00%
Where it came from  Default rate
Tier at creation    default
Config version      v3
```

Every figure is correct. Nothing on the page says who or what any of it is
about. This screen exists to answer *"why did this referrer earn exactly
₦19,000?"* to a person, and three ObjectIds do not answer it.

**It cannot be resolved client-side.** Three of the four identity fields are
users, and `GET /admin/users` is the stub in ticket 2 — so the names are not
fetchable by any route. Only the asset name is reachable. There is no honest
frontend version of this screen until the backend populates.

**Needed:** populate `user` (name + email), `asset` (name), `referrer_id`
(name + email) and `agency_id` (agency name) on
`GET /admin/commission/audit/:paymentPlanId`.

**Frontend status:** the plan audit screen is **not built** and is on hold
pending this. It was not shipped showing raw IDs.

### 9b. There is no way to ask "what would this actually pay?"

Resolution order is `asset+user → user → asset → default`, per leg after
ticket 8. An admin creating a user override at 15% has no way to see that an
asset+user override at 12% already beats it on one asset.

**Scenario.** Admin sets a user override on John at `direct: 0.15` and expects
John to earn 15% everywhere. He does not — on Aviation City he earns 12%,
because an asset+user row set three months ago still wins. Nothing on screen
says so. The admin concludes the override didn't save.

The frontend **must not** reimplement the chain to show this. That would put
the resolution rules in two places, and they would drift — which is the failure
this module's design exists to prevent.

**Needed:** expose the existing resolver read-only.

```
GET /admin/commission/resolve?user_id=&asset_id=&offer_type=

→ {
    direct:  { rate, override_source, tier },
    upline:  { rate, override_source, tier } | null,
    topline: { rate, override_source, tier } | null,
    config_version,
    wht_rate
  }
```

`resolveCommissionForPlan` already computes exactly this. The ask is a thin
admin-guarded wrapper that runs it **without** writing anything — a dry run, so
the admin UI can show the resolved chain before saving and after.

This is the highest-value small item in the commission area: it turns an
override screen that guesses into one that reports the truth, and it costs the
backend almost nothing because the logic is already written and tested.

---

## 10. No way to edit a plan's commission snapshot

**Priority: medium — the intended operational escape hatch does not exist.**

### Context

Commission rates are frozen onto the `PaymentPlan` at creation and never
re-read (C-2). That is correct and deliberate: a referrer's tier changing
mid-plan must not alter an already-struck deal.

The accepted consequence is that changing an override affects **new plans
only**. The agreed answer to "what if a rate on an existing plan is wrong?" is
that an admin edits that plan directly.

### The problem

That capability does not exist.

- `acquisition.controller.ts` exposes four routes. The only admin mutation is
  `PATCH /acquisitions/:id/suspend`.
- Grepping the entire backend, **nothing writes `commission_rate` or
  `referrer_id`** outside the schema definitions themselves.

There is currently no path — admin API or otherwise — to correct a plan's
commission snapshot.

### Scenarios

**S1 — Wrong referrer attributed.** A plan is created with `referrer_id` set to
the wrong person, or null when it should have been set. Every payment on that
plan pays the wrong party, or nobody, for the plan's entire life. Expected: an
admin can correct `referrer_id`. Actual: no route.

**S2 — Rate set from a stale override.** An override was due to be revoked and
wasn't; a plan snapshotted 20% instead of 12%. Expected: an admin can correct
`commission_rate`. Actual: no route.

**S3 — Correction must not be silent.** Editing a frozen financial record is
exactly the kind of action that needs an audit trail. Expected: the edit writes
an `AdminLog` entry capturing who changed it, from what to what, and why —
`reason` should be required, not optional.

**S4 — Already-paid commission is not retro-corrected.** Editing the snapshot
changes what **future** payments on that plan pay. Commission already credited
stays credited. Expected: that's the behaviour, and the endpoint's docs say so
plainly, so nobody assumes it reconciles history.

### What we need

An admin-guarded endpoint — something like
`PATCH /admin/commission/plans/:paymentPlanId/snapshot` — accepting the
commission snapshot fields (`referrer_id`, `agency_id`, `commission_rate`,
plus the upline/topline fields from ticket 6), with:

- `manage_commission` permission
- a **required** `reason`
- an `AdminLog` entry recording the before/after values
- explicit documentation that it affects future payments only

Placing it under `/admin/commission` rather than `/acquisitions` keeps
commission concerns in the module that owns them.

---

## 11. Commission config history records nothing about the change — ✅ RESOLVED 2026-07-28

> Publish now requires a `reason` (`@IsNotEmpty` — **a breaking change for
> any caller that omits it**), records `changed_fields`, and
> `GET /admin/commission/config` returns `{active, history}` with
> `last_modified_by` populated.

> The original request is kept below for the record.

**Priority: medium — the history screen exists but can only show dates.**

### What v1 had

The GraphQL config screen showed a change log: who edited the config, which
fields they changed, and a free-text description they were required to enter.
The frontend still expects that shape — `changedBy`, `changedByEmail`,
`changedFields`, `changeDescription`, plus pagination.

### What v2 has

`CommissionAdminService.getConfig` returns the active config plus the last 20
config documents:

```ts
return { active, history };   // history = findConfigVersions(20)
```

Those are raw `CommissionConfig` rows. From them the UI can derive a version
number and a publish date, and `last_modified_by` is present as a bare
ObjectId. Everything else is absent:

- **No admin name or email** — `last_modified_by` is not populated
- **No changed-field list** — nothing records which fields moved
- **No reason** — and see below, it cannot even be submitted
- **No pagination** — the count is hard-coded to 20

### The publish path can't accept a reason either

`CreateCommissionConfigDto` declares seven fields and no `changeDescription`.
Because the BE runs `forbidNonWhitelisted`, sending one is a hard 400 rather
than a silent ignore — so the frontend cannot capture a reason even to store
elsewhere.

### Scenarios

**S1 — "Why did commission drop last month?"** An admin opens history, sees
`v3 · 14 July` and `v2 · 1 June`, and cannot tell what changed or why without
diffing two documents by eye.

**S2 — "Who approved this?"** `last_modified_by` is an ObjectId. The screen
shows `665fbbbb…` where a name belongs.

**S3 — Audit request.** A payment plan snapshots
`commission_config_version: 3`. Someone asks what version 3 said and who
authorised it. The version is recoverable; the authorisation is not.

### What we need

1. **Accept `changeDescription`** (or `reason`) on `POST /admin/commission/config`,
   stored on the new version. Required rather than optional would match v1.
2. **Populate `last_modified_by`** on the history rows — name and email.
3. **Optionally, a changed-field list.** The service already holds both the
   current and next config when it publishes, so the diff is computable
   server-side at no extra cost.
4. **Pagination** on history — `page`/`limit` instead of a fixed 20.

Items 1 and 2 are the ones that matter. Without them the history screen can
show *when* something changed and nothing else.

**Frontend interim:** the reason field is not rendered at all rather than
submitted and rejected, and history diffs two config documents client-side to
show what moved. Client-side diffing is honest work — we hold both versions —
but it cannot recover intent.

---

## 12. `include_inactive=false` returns inactive overrides — ✅ RESOLVED 2026-07-28

> `listOverrides` now applies `activeFilter()` unless `include_inactive` is
> set. Verified in staging source.

> The original request is kept below for the record.

**Priority: low — one line, but it silently inverts a filter.**

`OverrideQueryDto` coerces the query string with `@Type`:

```ts
// src/modules/commission/dto/commission.dto.ts:121-124
@IsOptional()
@Type(() => Boolean)
@IsBoolean()
include_inactive?: boolean;
```

`@Type(() => Boolean)` calls `Boolean(value)` on the raw query string, and
every non-empty string is truthy:

```js
Boolean('false')  // true
Boolean('0')      // true
```

So `GET /admin/commission/overrides?include_inactive=false` is read as **true**
and returns revoked and expired overrides.

### Scenario

Admin loads the overrides screen with the "Active only" filter and sees an
override that was revoked last month sitting among the live ones. Nothing
errors; the filter simply did the opposite of what it says.

### The fix

The asset module already does this correctly, two files away:

```ts
// src/modules/asset/dto/asset-filter.dto.ts
@Transform(({ value }) => value === 'true' || value === true)
@IsBoolean()
sold?: boolean;
```

Swapping `@Type(() => Boolean)` for that `@Transform` fixes it. This is the
only occurrence of the pattern in the codebase — every other boolean query
param already uses `@Transform`.

**Frontend interim:** the client sends `include_inactive` only when it is true,
and omits it entirely otherwise, which sidesteps the coercion. That workaround
should be removed once this is fixed, so the parameter means what it says.

---

## 13. Admin list endpoints return bare ObjectIds — ✅ RESOLVED 2026-08-13

> The convention landed everywhere. `findUpgradesPaginated` and
> `findTransactionsPaginated` both take a `populate` flag, and
> `getAdminUpgrades` / `getAdminWithdrawalsQueue` both pass `true`. Fields
> match what this ticket asked for, including `phoneNumber` on the upgrade
> queue's `user` — see the 2026-08-13 section for the exact projections.
>
> Two references are still unpopulated and are now **ticket 22**: the upgrade
> queue's `referrer.phoneNumber` (never requested here — this ticket asked only
> for the applicant's) and the upgrade queue's `reviewed_by`.
>
> The original request is kept below for the record.

**Priority: highest of the outstanding items — this one blocks an approval
screen, where an admin authorises money against a person they cannot see.**

### It is a pattern, not three coincidences

Three admin endpoints now return references without populating them:

| Endpoint | Unpopulated | Consequence | Ticket |
|---|---|---|---|
| `listOverrides` | `user_id`, `asset_id`, `granted_by` | List shows ids | 9a |
| `getPlanAudit` | `buyer`, `asset`, `referrer_id`, `agency_id` | Audit screen unbuildable | 9a |
| `findUpgradesPaginated` | `user`, `referrer` | **Approval queue unbuildable** | this |
| `getAdminWithdrawalsQueue` *(added 2026-07-29)* | `user`, `bank_details_id`, `reviewed_by` | **Withdrawal review blind** — see below | this |

Fixing one and leaving the others is the likely outcome if these are read as
separate requests, so they are named together here. The underlying convention
worth adopting: **admin list endpoints populate the references they return**,
because an admin screen exists to be read by a person.

*Update 2026-07-28: `listOverrides` and `getPlanAudit` now populate — the
convention is landing. The upgrade queue and the new withdrawals queue are the
two still outstanding.*

### The withdrawals queue case (added 2026-07-29)

`findTransactionsPaginated` has no `.populate()`, so the withdrawal review
screen holds three ObjectIds where its three most important facts belong.

**Scenario.** An admin opens the withdrawal queue to release real money:

```
Requested by   —  (665fcccc00000000000000c1)
Amount         ₦1,200,000
Destination    —  (665fbbbb000000000000ba02)
                                 [ Approve and transfer ]
```

Approving initiates a bank transfer of ₦1.2m **to an account the screen
cannot name, for a person it cannot name**. The frontend ships the screen
with the em-dash + copyable-id pattern and the approve dialog states the
destination is unavailable — but "approve a seven-figure transfer to an
account you can't see" is not a workflow to leave in place long.

Needed on each queue row: `user` populated with
`firstName lastName email`, and `bank_details_id` populated with
`bank_name account_number account_name`. `reviewed_by` with
`firstName lastName` closes the audit trail.

Also missing on this queue, same family as ticket 14: **no `search` param**
(the old GraphQL screen searched by name — irrelevant until populate lands,
since rows carry no names to search), and no stats endpoint for the summary
cards the old screen showed. Both fine to sequence after populate.

The stats the old screen's cards carried, for when that endpoint is built
(v1's `adminTransactionDataPoint(type: "debit")`): counts of `pending`,
`approved`, `rejected`, `auto_approved` and `auto_failed` withdrawals, the
**₦ value of pending** (what an admin clearing the queue plans around), and
the total users' wallet balance. Until then the FE shows these as labelled
sample data.

### The upgrade queue case

```ts
// referral.repository.ts:183-186
this.upgradeModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec()
```

No `.populate()`, so `user` and `referrer` come back as ObjectIds.

**Scenario.** An admin opens the upgrade queue to work through pending
requests and sees:

```
Requested by   665fcccc00000000000000c1
Referrer       665fcccc00000000000000c2
associate → associate-pro     ₦20,000     transfer     pending
                                            [ Approve ]  [ Decline ]
```

Approving that changes someone's tier, completes a ₦20,000 transaction and
fires a commission payout to a second person. The admin is signing off money
for two people they cannot identify.

This is worse than the two commission cases. There the missing names make a
screen unhelpful; here they make an **approval** unsafe.

### It cannot be resolved client-side

Both fields are users, and `GET /admin/users` is the stub in ticket 2. There is
no route by which the frontend can turn those ids into names. This has to be
fixed server-side.

### What we need

Populate on `GET /admin/referrals/upgrades`:

- `user` → `_id`, `firstName`, `lastName`, `email`, `phoneNumber`, `userName`
- `referrer` → `_id`, `firstName`, `lastName`, `email`

`phoneNumber` matters here specifically: a transfer upgrade often needs the
admin to call the person about a mismatched payment reference.

Same treatment for the two endpoints in ticket 9a.

**Frontend status:** the upgrade queue is **not built** and is on hold pending
this. Unlike the commission screens, this gap blocks the whole feature — there
is no list, so there is nothing to approve or decline from.

---

## 14. The upgrade queue cannot be searched — ✅ RESOLVED 2026-08-13

> `UpgradeQueryDto.search` exists and `getAdminUpgrades` resolves it through
> `findUserIdsBySearch` — a case-insensitive regex over `firstName`,
> `lastName`, `email` and `userName`, filtering the queue by `user: { $in: ids }`.
> Exactly the shape requested.
>
> One characteristic to know rather than fix: search matches the **applicant
> only**, not the referrer. Searching a referrer's name returns nothing, which
> reads as "no upgrades" rather than "wrong field". The frontend labels the
> input for the applicant so the scope is visible.
>
> The original request is kept below for the record.

**Priority: medium — pairs with ticket 13.**

`UpgradeQueryDto` supports `status`, `payment_method`, `to_tier`, `page` and
`limit`. There is no `search`.

**Scenario.** A user emails support: *"I paid for my Associate Pro upgrade
three days ago and nothing has happened."* The admin opens the queue to find
their request. With 200 pending rows and no search, the only options are
paging through by hand or filtering to `pending` and scanning.

Searching client-side is not possible for the same reason as ticket 13 — the
names are not in the payload. Even after populate lands, filtering a single
page of 20 would only search that page, not the queue.

**Needed:** a `search` parameter on `UpgradeQueryDto` matching against the
requesting user's name, email and username — the same regex-over-several-fields
approach `AssetFilterDto` already uses.

---

## 15. Manual upgrade cannot record a fee or pay commission — ✅ RESOLVED 2026-08-13

> `ManualUpgradeDto` now carries `fee_amount?` (decimal naira, `@Min(0)`) and
> `pay_commission?` (boolean), `reason` stays required at 20 characters, and no
> receipt upload was added — as specified. The ledger requirement was honoured:
> `fee > 0` writes a `Transaction` in the same session and passes its id to
> `fireForUpgrade`.
>
> **The open question was answered by omission** — there is no separate
> `commissionableAmount`; commission comes off `fee_amount`. That is the simpler
> version this ticket specified, so the answer is taken as "one amount".
>
> Two rough edges, neither blocking, both now handled in the UI:
> commission silently pays nobody when the target has no `referred_by`, and a
> fee against a walletless user surfaces as `PAYSTACK_INIT_FAILED` —
> a misleading code for "User has no wallet".
>
> The original request is kept below for the record.

**Priority: high — an existing capability with no v2 equivalent.**

### What v1 does

`manualUpgradeToAssociatePro` lets an admin record an upgrade that was paid for
off-platform:

```
email                  who to upgrade
amount                 what they paid
payCommission          whether the referrer earns on it
commissionableAmount   what commission is calculated on
paymentUrl             uploaded receipt
```

### What v2 does

`manualUpgrade` is a different operation — a force-tier-change with an audit
reason:

```ts
const upgrade = await this.referralRepo.createUpgrade({
  user: target._id,
  referrer: target.referred_by ?? null,
  from_tier: target.referral_status,
  to_tier: dto.to_tier,
  fee_amount: 0,              // ← hardcoded
  payment_method: 'admin-manual',
  status: 'approved',
  reviewed_by: …, reviewed_at: …,
});
```

No fee, no Transaction, no commission. Useful in its own right, but it does not
cover "this person paid us ₦20,000 by bank transfer, upgrade them and pay their
referrer."

### What we need

Extend `ManualUpgradeDto` with:

- `fee_amount` — optional, decimal naira. Absent means today's behaviour: a
  free tier change.
- `pay_commission` — optional boolean, default false.

`reason` stays required at 20 characters.

**Deliberately not included: no receipt upload.** When an admin records the
payment, the admin is the evidence, and `reason` is the audit trail. Adding a
file upload duplicates what the admin log should capture and puts a Cloudinary
dependency on a money path. (User-initiated transfer upgrades still carry
`file_url` — that is unchanged and still required there.)

### The part that must not be missed

**A fee without a Transaction row is money that exists nowhere.**

If `fee_amount > 0`, the upgrade must also write a `Transaction`, the way an
approved transfer upgrade does. Two reasons:

1. The money has to be in the ledger. An upgrade record with `fee_amount:
   20000` and no transaction means ₦20,000 was received and the books don't
   show it.
2. `fireForUpgrade` requires a `sourceTransactionId` — it is what the
   commission idempotency index keys on. Without it, commission cannot be
   fired safely.

So the sequence should mirror `approveUpgrade`: create the transaction, create
the upgrade referencing it, set the tier, then fire commission — all in one
session.

### Open question for the backend team

v1 had `amount` **and** a separate `commissionableAmount`, so commission could
be calculated on a different base than the fee actually paid — e.g. a
discounted upgrade where the referrer still earns on the full price.

Was that deliberate, or accidental? If there is no business rule behind it, one
amount is simpler and commission comes off `fee_amount`. We have specified the
simpler version above; say if the split is needed and we will add it.

---

## 16. The assets list cannot be sorted — ✅ RESOLVED (staging `a364fdd`)

> `GET /admin/assets` now takes `sort` (`name | createdAt | units_sold | available_units`)
> and `order` (`asc | desc`); name sorts with a case-insensitive collation and
> `available_units` via an aggregation. FE not yet sending it — see the asset pass.

> The original request is kept below for the record.

**Priority: low — a growing-catalogue problem, not a blocker.**

`findAllPaginated` hard-codes the order and takes no sort parameter:

```ts
// asset.repository.ts:73
this.assetModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec()
```

**Scenario.** The catalogue reaches 200 assets. An admin wants the ones closest
to selling out, to decide what to restock — or simply to find "Palm Grove" by
scanning alphabetically. Neither is possible; the only order is newest-first,
and `available_units` is a virtual so it cannot even be sorted server-side
without an aggregation.

**Needed:** `sort` and `order` parameters on `AssetFilterDto`, covering at
least `name`, `createdAt` and `sold_units`. Sorting on `available_units` needs
an aggregation stage, so it is worth saying explicitly whether that is in
scope.

**Frontend status:** column headers are not clickable. The list ships
newest-first.

---

## 17. Four asset capabilities the frontend has and the backend doesn't

**Priority: mixed — the dangling `Plot` reference is the concerning one.**

### 17a. There is no `Block` or `Plot` collection

The v1 admin manages blocks and plots within an asset — `BlocksManager`,
`useAssetBlocks`, `useCreateBlock`, `useBlockPlots`, `useCreatePlots`,
`useAvailablePlotsForAsset`. None of it has a backend in v2.

**And the backend already references the missing model.**
`acquisition/schemas/payment-plan.schema.ts` declares:

```ts
plotId: { type: MongooseSchema.Types.ObjectId, ref: 'Plot' },
block_label: { type: String },
plot_number: { type: Number },
```

`ref: 'Plot'` points at a model that was never registered. A `.populate('plotId')`
on that field would throw at runtime — this is not just a missing feature, it
is a reference into nothing.

`MarketplaceListing` similarly carries `block` and `plot` as loose strings.

**Question for the backend team before anything is built:** is plot-level
allocation a v2 concept at all? If it is, it needs a model and an admin
surface. If it isn't, the dangling `ref: 'Plot'` and the loose block/plot
strings should come out, because they currently imply a system that doesn't
exist.

### 17b. No asset analytics endpoint

`AssetAnalyticsSection`, `InventoryHealthBar` and `AssetCategoryHealth` render
portfolio and per-category statistics — total value, capacity, collection
efficiency, occupancy, defaulting customers and amounts. There is no endpoint
producing any of it.

**Frontend interim:** those panels run on a local `sample-data.ts` fixture and
each carries a visible **"Sample data"** chip, so fabricated figures cannot be
mistaken for real ones in a screenshot.

### 17c. No asset subscribers endpoint

`SubscribedCustomers` lists who has bought into an asset. No controller in the
codebase exposes subscribers.

### 17d. No asset statements endpoint

`SendAssetStatementsModal` sends statements to an asset's customers. What
exists on the backend is an `AdminLog` action name (`'send-asset-statements'`)
and an empty scheduler stub:

```ts
@Cron('0 9 1 * *', { timeZone: 'Africa/Lagos', name: 'monthly-statements' })
async sendMonthlyStatements() {
  this.logger.log('[CRON] sendMonthlyStatements');   // ← that's the whole body
}
```

So the intent is recorded in two places and implemented in neither.

---

## 18. An asset can never gain a second offer — ✅ RESOLVED 2026-07-28

> `POST /admin/assets/:assetId/offers` — transactional, refuses
> `OFFER_ALREADY_EXISTS` on a duplicate type. The offers tab now has an
> Add offer action for the missing type.

> The original request is kept below for the record.

**Priority: high — it undercuts the main point of the v2 asset model.**

### What's missing

The offer endpoints are:

```
PATCH  /admin/assets/:assetId/offers/:offerType          update an existing offer
POST   /admin/assets/:assetId/offers/:offerType/sizes    add a size to an existing offer
```

There is **no `POST /admin/assets/:assetId/offers`**. Offers can only be
created as part of `CreateAssetDto`, in the same request as the asset.

### Why it matters

The headline change in v2 is that an asset is a place and what it sells is an
offer — so one asset can sell flex *and* full-ownership. `AssetOffer` is
uniquely indexed on `(asset_id, offer_type)` precisely to allow that.

But an asset created with one offer is locked to that offer permanently.

**Scenario.** Aviation City launches with flex instalment plans. It sells well,
and buyers start asking to purchase outright. Adding a full-ownership offer is
the obvious move — and there is no way to do it.

**And the workaround doesn't exist either.** Deleting and recreating is
impossible once any unit has sold, and the asset name is uniquely indexed on
non-deleted rows:

```ts
AssetSchema.index({ name: 1 }, { unique: true, collation: …,
  partialFilterExpression: { deleted_at: null } });
```

So an admin cannot even create a parallel "Aviation City" alongside the
original without soft-deleting the first, which hides it and strands everyone
already paying into it.

### What we need

```
POST /admin/assets/:assetId/offers
  body:    { offer_type, is_active?, allocation_qualification_pct, payment_type?, sizes[] }
  returns: the created offer
  errors:  409 when an offer of that type already exists on the asset
```

Body shape is `OfferInputDto`, which already exists — it is what `CreateAssetDto`
nests. The same validators apply: `payment_type` required for full-ownership,
sizes validated for offer type, at least one size with at least one plan.

**Frontend status:** the asset detail page shows no "Add offer" action, because
there is nothing to call. The create form is currently the only place both
offers can ever be defined, so it says so.

---

## 19. Plans can't be added, and a tenor can't be changed — ✅ FULLY RESOLVED (staging `a364fdd`)

> `POST …/sizes/:sizeId/plans` adds one plan atomically, 409
> `TENOR_ALREADY_EXISTS` on a duplicate. And as of `a364fdd`,
> `UpdatePlanDto extends PartialType(PlanInputDto)` — `PATCH …/plans/:tenor`
> accepts `tenor_months`, and `updatePlan` genuinely moves the plan (guards
> duplicates and flex-min-1, re-runs the arithmetic on the merged result).
> The FE's full-replace fallback for tenor edits can be deleted.

> The original request is kept below for the record.

**Priority: medium — a workaround exists, but it can lose data.**

### What's missing

The plan endpoints address a plan by its **tenor**:

```
PATCH   …/sizes/:sizeId/plans/:tenor
DELETE  …/sizes/:sizeId/plans/:tenor
```

There is no `POST …/plans`. And `UpdatePlanDto` explicitly excludes the tenor:

```ts
export class UpdatePlanDto extends PartialType(OmitType(PlanInputDto, ['tenor_months'] as const)) {}
```

So a plan's money can be edited in place, but **adding a plan** or **changing a
tenor** has only one route: `PATCH …/sizes/:sizeId` with a complete
replacement `plans[]`.

### Why the workaround is risky

Full-replacement makes every plan edit a read-modify-write over the size's
entire plan list.

**Scenario.** Two admins open the same 300sqm size. One adds a 48-month plan.
The other, seconds later, corrects the deposit on the 12-month plan. The second
save sends the plans array *as it was when they loaded the page* — without the
48-month plan. It is silently gone, no error, no conflict.

That is a lost update, and it gets more likely the more plans a size has.

### What we need

Either of:

1. **`POST …/sizes/:sizeId/plans`** to add one plan, leaving the others alone —
   the smaller change, and it removes the common case for full replacement.
2. **Allow `tenor_months` in `UpdatePlanDto`**, rejecting a change that would
   collide with an existing tenor on that size.

(1) alone covers most of it. Both together remove the need for full-replace
entirely.

**Frontend status:** "Add plan" and any tenor change go through the size's
full-replace endpoint. Because a tenor change is delete-and-recreate
underneath, the UI warns that changing a tenor replaces the plan — otherwise
the plan's history restarting later looks inexplicable.

---

## Not backend items — considered and dismissed

Recorded so they aren't mistaken for gaps someone missed.

These came out of the same review and are **frontend work**. Listed here only
so the backend team can see they were considered and dismissed.

- **Field renames.** `admin_status`→`status`, `transaction_type`→
  `payment_method`, `user_upgrade_type`→`from_tier`/`to_tier`,
  `associate`→`referrer`, and `file_Url`→`file_url` (the frontend spells it
  with a capital U). Ours to fix.
- **The payment receipt already exists.** `file_url`, `bank_name` and
  `reference_no` are on `ReferralUpgrade` and `findUpgradesPaginated` applies no
  projection, so they are already returned. The approval screen must display
  the receipt — that is a frontend requirement, not a backend one.
- **Change tier, reassign referrer, downline tree, force-upgrade.** All
  implemented and all currently unused by the frontend. They are
  user-management operations and belong on a user detail page rather than an
  approval queue, so they are deferred — not missing.
  *(Update 2026-08-13: force-upgrade is now built — it is the manual upgrade
  dialog on the upgrade queue, since ticket 15 turned it into "record a paid
  upgrade", which is queue work rather than user-detail work. Change tier,
  reassign referrer and downline tree remain deferred to a user detail page.)*

---

## 20. Full-ownership purchases don't exist — ✅ RESOLVED 2026-08-13

> The whole family shipped, confirmed in the deployed spec:
>
> ```
> POST /fo/purchase/paystack/initiate      POST /fo/purchase/recurring/paystack
> POST /fo/purchase/transfer/submit        POST /fo/purchase/recurring/transfer
> POST /fo/purchase/doc/paystack           POST /fo/purchase/doc/transfer
> POST /admin/fo/purchase/transactions/:txId/approve
> POST /admin/fo/purchase/transactions/:txId/decline
> ```
>
> Note the admin review pair **originally** sat under `/admin/fo/purchase/transactions/:txId/`,
> **not** the `/admin/acquisitions/full-ownership/:txId/` this ticket suggested —
> and separate document-fee routes exist (`/doc/paystack`, `/doc/transfer`),
> which this ticket folded into initiate.
>
> **Update 2026-08-17:** review unified to
> `POST /admin/acquisitions/transactions/:txId/approve|decline`. Approve is an
> empty body; decline is `{ reason }` (min 20). The BE routes by kind — do not
> call the old per-family paths. FO land-plan actions:
>
> ```
> GET   /admin/fo/purchase/payment-plans/:id
> PATCH /admin/fo/purchase/payment-plans/:id/suspend
> PATCH /admin/fo/purchase/payment-plans/:id/unsuspend
> POST  /admin/fo/purchase/payment-plans/:id/allocate
> ```
>
> **Frontend status: wired.** `features/asset-transactions` reviews both
> families through that unified pair. `fo_outright_doc` is not reviewable —
> the admin acts on the parent `fo_outright_land` row. Suspend / unsuspend /
> allocate sit on the land plan from the FO transaction detail page; FO
> allocate is also the assign path in the allocation modal.
>
> The original request is kept below for the record.

**Priority: high — this is a missing revenue path, not a missing admin screen.**

### What exists

The acquisition module has a complete **flex** family: Paystack initiate,
transfer submit, recurring variants, and the admin review pair
(`POST /admin/acquisitions/flex/:txId/approve|decline`). Purchases are
distinguished by `purchase_details.transaction_kind`
(`initial_flex_purchase`, `recurring_flex_payment`).

### What doesn't

There is no full-ownership equivalent anywhere — no initiate, no submit, no
kinds, no review endpoints. Searched `src/modules/acquisition` and
`src/modules/payment` on staging and the `flex` feature branch; the only
full-ownership traces are v1 carry-over fields on the PaymentPlan schema
(`fullownerhsip_landprice`, typo included).

### Scenario

An admin uses the new `POST /admin/assets/:assetId/offers` (ticket 18) to add
a full-ownership offer to Aviation City, sets its sizes, document fees and
plans, and publishes. A customer opens the app to buy one of those plots.
**There is no endpoint their purchase can go through.** The offer is a shop
window with no till: everything about it is configurable and nothing about it
is sellable.

### What we need

The full-ownership purchase family, mirroring flex's shape: initiate/submit
(with document-fee handling per the offer's `payment_type`), kinds on
`transaction_kind`, and an admin review pair (suggested:
`/admin/acquisitions/full-ownership/:txId/approve|decline`). The admin
transactions page is already built to absorb it — kinds are an open
vocabulary and the review action routes per family.

---

## 21. `GET /admin/transactions` — the filters an admin actually reaches for

> **Superseded by ticket 24c (2026-08-13)**, which restates this against the
> confirmed live param list and adds the populate ask. The `user` / `source_asset`
> populate line below is now ticket 24a. Kept for the stats detail at the end,
> which 24 does not cover.

**Priority: medium — the list works; working a queue with it is clumsy.**

The endpoint takes `type`, `status`, `user`, `page`, `limit`. The old asset
transactions screen also had, and the rebuilt page now renders **disabled**:

| Filter | Old behaviour | What's needed |
|---|---|---|
| Search | Asset name / buyer name | Blocked on populate (ticket 13) — there are no names in the rows to search |
| Date range | `start_date` / `end_date` | Two query params |
| Sales type | Initial vs recurring | A `transaction_kind` param |
| Payment method | transfer / wallet / paystack | A `payment_method` param — **this is the one that matters**: "show me transfer payments waiting for review" is the page's main workflow, currently served by scanning `status=pending` |

Also in ticket 13's table already: no populate on `user` / `source_asset`.
And no stats endpoint — v1's `adminTransactionDataPoint` summed approved /
pending / declined values and split new vs recurring and flex vs
full-ownership; the rebuilt page shows those cards as labelled sample data
until an equivalent exists.

---

## 22. Two fields the upgrade queue still can't show — ✅ RESOLVED 2026-08-13

> Both shipped in `6f2b2d8`. `findUpgradesPaginated` now populates `referrer`
> with `firstName lastName email userName phoneNumber` and adds
> `.populate('reviewed_by', 'firstName lastName')`.
>
> **Frontend wired the same day:** the queue has a Referrer phone column, and the
> reviewing admin's name sits under the status badge with the review date — a
> sub-line rather than a column, because it exists only for reviewed rows and
> answers "who set this status" rather than a fact about the upgrade.
>
> The original request is kept below for the record.

**Priority: low — two words of projection each. Raised now because ticket 13
resolved everything around them, so these are what's left of a column the
current admin screen has and the rebuilt one can't.**

Ticket 13 landed the populate convention on `GET /admin/referrals/upgrades`.
Two references it didn't reach:

### 22a. `referrer.phoneNumber`

```ts
// referral.repository.ts:245-246
.populate('user', 'firstName lastName email userName phoneNumber referral_status')
.populate('referrer', 'firstName lastName email userName')   // ← no phoneNumber
```

The applicant's phone is there; the referrer's is not. Ticket 13 only asked for
the applicant's, so this is a gap in the request, not in the implementation.

**Scenario.** A transfer upgrade arrives with a reference that matches no
payment we received. Before declining — which emails the applicant a rejection —
the admin calls the referrer, who usually collected the transfer on their
recruit's behalf and can confirm which account it went from. On the current
GraphQL admin screen that number is a column on the row. On the rebuilt screen
the admin has the referrer's name and no way to reach them.

**Needed:** add `phoneNumber` to the `referrer` projection. Same field, same
populate call, one word.

### 22b. `reviewed_by` isn't populated at all

`reviewed_by` is set on every approve, decline and manual upgrade, and comes
back as a bare ObjectId. It refs `Admin`, not `User`, so it needs its own
`.populate('reviewed_by', 'firstName lastName')` — the same line
`findTransactionsPaginated` already has for the withdrawals queue.

**Scenario.** A declined upgrade is escalated: the applicant insists their
transfer was genuine. The queue row shows the decline reason and the date, and
`665fbbbb…` where the reviewing admin's name belongs. Answering "who declined
this and can they explain the reason they wrote?" means a manual lookup in the
admin collection.

**Needed:** `.populate('reviewed_by', 'firstName lastName')` on
`findUpgradesPaginated`, matching the withdrawals queue.

### Frontend status

Both degrade rather than block. `PersonRefSchema` accepts a string or a
populated object on every reference, so each field starts rendering the moment
it's populated with no frontend change:

- **Referrer phone** — the column is not rendered. The applicant's phone column
  is, since that data exists. Rendering an always-empty second phone column
  would read as "this person has no number on file".
- **`reviewed_by`** — not displayed. The em-dash + copyable-id pattern
  (`UnresolvedRef`) is what it would use, and it is already wired for it.

---

## 23. Withdrawals list — one field short of production parity — ✅ RESOLVED 2026-08-13

> Solved with a nested hop, and better than asked: `TX_POPULATE.withdrawalQueue`
> keeps `kyc` in the user projection so it can populate `kyc` with
> **`tin.value tin.state`** — the state included, which answers the question this
> ticket raised about not presenting an unchecked TIN as a verified one.
>
> **Frontend wired the same day:** a TIN column after Requested by. An
> `approved` TIN renders plainly; anything else renders muted with its state
> ("Awaiting review", "Rejected"), and a missing one is an em-dash. The CSV
> export carries TIN and TIN status as two columns for the same reason — a
> reconciliation file showing the number alone would strip the caveat.
>
> The original request is kept below for the record.

**Priority: low — a single field. Raised because it is the only thing standing
between the v2 withdrawal queue and the columns the live admin has.**

Comparing the v2 queue against the production screen it replaces, column for
column. **Nine of ten need nothing from the backend** — populate (ticket 13) and
`search` (confirmed live 2026-08-13) already closed the real gaps:

| Production column | v2 backend status |
|---|---|
| Payer | ✅ `user` populated (`firstName lastName email`) |
| **TIN** | ⛔ **the ask — see below** |
| Bank / Account Number / Account Name | ✅ `bank_details_id` populated (`bank_name account_number account_name`) |
| Amount | ✅ `amount`, plus `fee_amount` / `total_debited` v1 never had |
| Date | ✅ `createdAt` |
| Method (Auto/Manual) | ✅ `processing_type: 'auto' \| 'manual'` |
| Status | ✅ `admin_status` + `status` — better than v1, which conflated them |
| Action | ✅ approve / decline / retry |

Everything else on that list is frontend work and is not a backend request.

### The one ask: the requester's TIN on the queue row

Production shows a TIN column. In v1 it was a plain field in two places —
`transaction.tin` and `user.tin`.

In v2 it exists, but it moved and changed shape: it is a **KYC artifact**,
`Kyc.tin` (`user/schemas/kyc.schema.ts`), where `TinArtifact extends KycReview`:

```ts
{ value?: string, state: KycState, submitted_at?, reviewed_at?,
  reviewed_by?, rejection_reason? }
```

So it is no longer a property of the user or the transaction — it is a
separately-collected, separately-reviewed document on the `Kyc` collection,
keyed by `user`.

**Scenario.** An admin releasing a payout checks the TIN against the account
holder for tax reporting. On the production screen it is a column. On the v2
queue there is no route by which the frontend can obtain it for the rows in the
list — `GET /admin/withdrawals` returns the transaction with `user` populated
from the `User` collection, which doesn't carry TIN, and fetching KYC per row
would be an N+1 over a 20-row page.

**Needed:** extend the queue's `user` populate to carry the TIN value, e.g. a
nested populate of the user's KYC selecting `tin.value` (and `tin.state`, so an
unverified TIN can be shown as such rather than as a verified one).

**Worth confirming while you're there:** is TIN meant to be visible to admins
pre-verification? If a `state` other than `approved` should read as "not
verified" on this screen, say so and the column will render it that way rather
than presenting an unchecked number as fact.

**Frontend status:** the column is not rendered. When the field lands it slots in
after Payer, matching production's order.

---

## 24. Asset transactions list — ⚠️ PARTLY RESOLVED 2026-08-13

> **24a (populate), 24b's referrer half, and 24d (filters) all shipped** in
> `196e325`, and the implementation took the more generous option on every
> judgement call:
>
> - `findTransactionsPaginated` now takes a **populate spec** rather than a
>   boolean (`TX_POPULATE.adminTransactionList`), which is the per-caller field
>   list this ticket asked for.
> - `user` → `firstName lastName email referred_by`, with `referred_by` itself
>   populated `firstName lastName` — the referrer column.
> - `source_asset` → `name asset_location`.
> - Search matches the asset **and** the payer, not one or the other, via a new
>   `findAssetIdsBySearch` over `name`/`asset_location`. It uses `escapeRegex`,
>   which the older `findUserIdsBySearch` still doesn't.
> - All six filters, plus a `dp` sales-type bucket for document fees that
>   production never had — without it those rows would match neither `ap` nor
>   `rap` and vanish from every filtered view.
>
> **Frontend wired the same day:** buyer and referrer columns (both linked to
> profiles), a Property column from `source_asset` with its location beneath,
> and every filter live including the date range. The review dialog now names
> the referrer being paid before the admin approves.
>
> **Still open: 24b's `property_owner` and 24e's decline floor** — both are
> questions this ticket put to the backend team rather than requests, and both
> are unanswered. The Property Owner column is not rendered.
>
> One consequence worth noting: full-ownership rows arrive in this list
> (ticket 20). Review is
> `POST /admin/acquisitions/transactions/:txId/approve|decline` for both
> families. `fo_outright_doc` carries no Review action — approve the parent
> land row.
>
> The original request is kept below for the record.

### The original request — populate, the filters, and two dead fields

**Priority: medium for the populate (four of production's ten columns are
unbuildable without it); low for the filters.**

`GET /admin/transactions` is the asset transactions list. This is a field-level
read of the production screen — its GraphQL fragment, both its desktop and mobile
renders, its filter set and its decline flow — not just its column headers.

Production requests exactly these fields:

```graphql
_id  amount  description  admin_status  plot_size  asset_type
referral  property_owner  transaction_type
transfer_file { file }
user { firstName lastName _id }
time_of_transaction
```

Mapped to v2, field by field:

| Production field | v2 | Status |
|---|---|---|
| `user.firstName/lastName/_id` | `user` ObjectId | ⛔ **not populated** — 24a |
| `referral` (referrer's name) | — | ⛔ **no field** — 24b |
| `property_owner` | — | ⛔ **no field, and no known equivalent** — 24b |
| `description` | `description` | ⚠️ **exists but is now useless** — 24c |
| asset name | `source_asset` ObjectId | ⛔ **not populated** — 24a, and now the *only* route to it |
| `plot_size` | `purchase_details.size_sqm` | ✅ |
| `asset_type` (flex / full-ownership) | derivable from `purchase_details.transaction_kind` | ✅ |
| `transaction_type` (transfer/wallet/paystack) | `payment_method` | ✅ |
| `transfer_file.file` | `purchase_details.transfer_receipt_url` | ✅ |
| `time_of_transaction` | `createdAt` | ✅ |
| `admin_status` | `admin_status` | ✅ |
| `amount` | `amount` | ✅ |

### 24a. The list doesn't populate anything

```ts
// wallet.service.ts:1180 — getAllTransactions
const { data, total } = await this.walletRepo.findTransactionsPaginated(filter, page, limit);
//                                                                     ↑ no populate flag
```

`findTransactionsPaginated` **already takes a `populate` flag** — the withdrawal
queue passes `true` (ticket 13). This caller doesn't, so `user` and
`source_asset` come back as bare ObjectIds.

**Scenario.** An admin opens the asset transactions queue to approve a bank
transfer and sees:

```
Payer            665fcccc00000000000000c1
Property         665faaaa00000000000000a1
₦1,500,000       transfer        pending      [ Approve ]
```

Approving creates a payment plan and pays referral commission. Two of the three
facts needed to judge it are hex strings.

**Needed on this endpoint:** `user` → `firstName lastName email`, and
`source_asset` → **`name` and `asset_location`** (the location is what the
search box needs — see 24d). Note the withdrawal queue's populate list
(`bank_details_id`, `reviewed_by`) is wrong for this caller — asset rows want
the asset, not a bank account — so the flag likely needs to become a
per-caller field list rather than a boolean.

### 24b. Two production columns have no v2 field at all

| Production column | v1 source | v2 |
|---|---|---|
| **Referrer** | `transaction.referral` (a name string) | nothing. `user.referred_by` exists on the User, so it is derivable — but not on this row |
| **Property Owner** | `transaction.property_owner` (a name string) | nothing, and no obvious equivalent |

For **Referrer**, the cheapest shape is a nested populate of the buyer's
`referred_by` (name only) on this endpoint. Commission on an asset purchase is
paid to that person, so an admin approving the transfer is approving their payout
too — it belongs on the row.

For **Property Owner**, we need to know what it means before asking for
anything. In v1 it was a free string on the transaction. Candidates in v2: the
asset's agency, a `property_owner` on the Asset, or something that was only ever
data-entry. **Question for the backend team: what is the v2 equivalent, or was
this a v1-only concept?** If it has no home in v2 the column should be dropped
rather than faked, and we will drop it.

### 24c. `description` still exists but no longer describes anything

This is the one that isn't visible from a schema diff, and it is why 24a's
`source_asset` populate is load-bearing rather than cosmetic.

Production builds its **Property Name** column out of `description`:

```tsx
{asset_type} - {description.replace("asset purchase", "AP")}({plot_size}sqm)
```

That works in v1 because `description` carries the property — something like
`"Aviation City asset purchase"`. The string replace exists purely to shorten it.

In v2 `description` is a fixed literal set at write time:

```ts
// acquisition/flex/flex-purchase.service.ts
description: 'AP: flex initial purchase'
description: 'AP: flex initial purchase (transfer)'
description: 'RAP: flex recurring payment'
description: 'RAP: flex recurring payment (transfer)'
```

Four constants, no property name in any of them. So the field survived the
migration while the information in it did not — a frontend reading `description`
gets the same string on every row and would render **"AP: flex initial purchase"
where the property belongs**. That is worse than a blank column, because it looks
like content.

Two consequences:

1. `source_asset` populate is the **only** route to the property name. Without
   24a there is no honest Property Name column at all.
2. Nothing needs adding to `description` — the AP/RAP prefix is genuinely useful
   and already agrees with `purchase_details.transaction_kind`. Just don't expect
   a property from it. Noting it here so nobody "fixes" the column by parsing
   that string.

### 24d. The filters

Confirmed live: `GET /admin/transactions` takes `type`, `status`, `user`, `page`,
`limit` — five params. Production's screen filters by seven, with these exact
vocabularies:

| Production filter | Its values | Needed on v2 |
|---|---|---|
| **Search** | placeholder: *"Search for asset by name, location…"* | `search` over the **asset's `name` and `asset_location`** — note this is the *asset*, not the payer. Unlike the upgrade and withdrawal queues, whose search is a user lookup, this one crosses into the Asset collection |
| Payment method | `transfer` / `wallet` / `paystack` | `payment_method` — **the one that matters most**: "show me transfer payments waiting for review" is the page's whole workflow, currently done by scanning `status=pending` by eye |
| Sales type | `ap` / `rap` | `transaction_kind` — already stored at `purchase_details.transaction_kind`, and the `description` constants already use the same AP/RAP vocabulary |
| Asset type | `flex` / `full-ownership` | derivable from `transaction_kind`, so likely free once that lands |
| Status | `completed` / `failed` / `pending` | ✅ `status` exists |
| Date range | `start_date` / `end_date` | two params |

**Worth flagging on search:** every other search we've asked for resolves user
ids. This one is the first that needs to filter transactions by a *joined asset's*
fields, so it can't reuse `findIdsBySearch`. If matching both the asset and the
payer is cheap, do both — an admin who knows the buyer but not the property is
just as common. If only one is affordable, the asset is what production had.

This supersedes the filter table in ticket 21, which was written before the param
list was confirmed.

### 24e. The 20-character decline minimum breaks production's canned reasons

`DeclineFlexTransferDto.reason` enforces `@MinLength(20)`. Production's decline
dialog offers six preset reasons plus a free-text "Other", and **two of the
presets are shorter than that**:

| Preset | Length | Under v2's rule |
|---|---|---|
| `System Error` | 12 | ❌ rejected |
| `Price Fluctuation` | 17 | ❌ rejected |
| `Account Restrictions` | 20 | ✅ exactly at the limit |
| `Invalid Asset Details` | 21 | ✅ |
| `Wrong Payment Receipt` | 21 | ✅ |
| `Payment Receipt uploaded twice` | 30 | ✅ |

So a like-for-like port of that dialog would hand an admin a dropdown where two
options fail on submit with `DECLINE_REASON_TOO_SHORT`.

**Question for the backend team, not a request:** is the 20-character floor there
to force a human explanation, or is it a default that a controlled vocabulary
could bypass? Two workable answers, and we'd rather you pick:

- **Keep the floor.** The frontend replaces the presets with longer canned
  sentences (the applicant sees these, so longer is arguably better anyway) —
  e.g. *"Payment declined: a system error prevented verification."* No backend
  change; we'll do it.
- **Accept a reason code.** The DTO takes an optional enum of decline reasons
  alongside free text, and the minimum applies only to free text. More work,
  but it makes declines reportable — "how many declines were duplicate receipts?"
  becomes answerable, which the free-text field can never be.

Same question applies to `DeclineWithdrawalDto` and the upgrade decline, which
carry the same 20-character rule and the same preset-reason history.

**Frontend status:** the rebuilt page renders the filters production has as
**disabled** controls, so their absence is visible rather than silent. Payer and
property render with the em-dash + copyable-id pattern. Decline is currently
free-text at 20 chars, so nothing is broken today — the question above only
matters when the presets come back.

---

## 25. Commercial offers: validated, then silently mis-stored (AC-ADD-08 missing)

**Priority: P0 — data loss on create, unrecoverable through the API. Must land before any commercial offer is created for real.**

Full write-up, in the addendum's own voice and numbering, is
`ASSET-CRUD-ADDITIONS v1.1` (delivered 2026-08-18) — this entry is the pointer
so it lives with the rest of our tickets.

### The short version

ASSET-CRUD-ADDITIONS v1.0 added `'commercial'` to the offer-type enum and
extended the `payment_type` / `document_fee` validators to require it for
commercial (AC-ADD-01..04, all shipped). Its task table has no service-layer
row, on the assumption that "service filter passes through naturally". The
filter does. The FO-shaped field handling does not — it is seven literal
`=== 'full-ownership'` comparisons in `asset.service.ts` (lines 244, 322,
354, 427, 583, 622, 634 as of `a364fdd`) that an enum extension cannot reach.

### Scenario

Admin creates a commercial offer, supplies `payment_type` and `document_fee`
because the API demands them, gets **201**. Stored offer has **no
`payment_type`**; every size has **`document_fee: 0`**. A later purchase reads
`payment_type` to decide whether to create a DocumentPlan (FO-PURCHASE §6.1)
and finds nothing; the fee charged is ₦0. The admin tries to fix it —
`PATCH …/offers/commercial {payment_type}` **throws** "only applies to
full-ownership offers"; `PATCH …/sizes/:id {document_fee}` is silently
ignored. There is no delete-offer endpoint. **The offer is unrecoverable.**

### The fix (AC-ADD-08)

Replace the seven comparisons with `usesFoModel(offerType)` — a helper that
already exists in `asset-offer.schema.ts`. ~30 minutes. Plus AC-ADD-06 must
**read back** the created asset and assert the two fields persisted; a 201
alone is what let this ship. Also recorded (AC-ADD-10): the admin list's
price aggregation excludes commercial when unfiltered — undocumented; decide
and name it.

**Frontend status:** holding the commercial UI (type picker, FO-like fee and
payment-type handling) until AC-ADD-08 lands — shipping it earlier produces
exactly the broken offers above. Widening the read-side enum now so a
commercial offer created server-side does not fail response validation.

---

## 26. Amaris query log loses its `count` to the envelope interceptor

**Priority: medium — the list works, but its total is destroyed on the wire,
so the admin log cannot show real pagination.**

### The mechanism

`AdminAmarisService.listQueries` returns `{ count, data }`. The global
`TransformInterceptor` wraps every response as:

```ts
return {
  success: true,
  data: data?.data ?? data,   // ← lifts the inner `data` key…
  message: data?.message ?? 'Success',
  ...(data?.meta && { meta: data.meta }),
};
```

Because the service's return value has a `.data` key, the interceptor lifts
the rows array into `envelope.data` and **silently discards `count`** (it
only carries `message` and `meta` through). Verified live 2026-08-18:

```
GET /admin/amaris/queries?limit=2
→ { success, data: [ …rows… ], message }     // no count, no meta
```

### Why flex-leads doesn't have this problem

`GET /admin/flex-leads` returns the `PaginatedResult` shape —
`{ data, message, meta: {total, page, limit, totalPages} }` — which the
interceptor is built for: rows land in `envelope.data`, totals survive in
`envelope.meta`. Same interceptor, right shape.

### Scenario

An admin filters the Amaris log to "No answer" to work the handbook-gap
backlog. The page can show 25 rows and a Next button, but never "142 gaps
total" — the number that says whether the backlog is shrinking. The FE
currently paginates on a full-page heuristic (a full page ⇒ probably a next
one) rather than inventing a total.

### The fix

One line in `amaris.service.ts` / repository: return the standard shape —

```ts
return { data, message: 'Amaris queries retrieved', meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) } };
```

The FE then switches one hook to `apiGetPaged` and real pagination returns.
Any other endpoint that returns an object with its own `data` key has the
same trap — worth a lint/convention note on the BE: **service returns either
a bare payload or the PaginatedResult shape, never a custom object with a
`data` key.**
