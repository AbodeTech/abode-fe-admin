# Commission Admin — Frontend Design

Design for the commission administration surface in `abode-admin-fe`.

**Written against the target backend contract**, not today's. Several pieces
depend on tickets in `docs/BACKEND-REQUESTS.md` that haven't landed. Those are
marked `⛔ blocked on ticket N` rather than designed around — building to
today's gaps would bake them in permanently.

We are in a rewrite phase with no admins on the panel, so there is no
backwards compatibility to preserve, no feature flags, and no deprecation path.
v1 UI that has no place in this design is deleted, not carried.

---

## 1. What this surface is for

Commission answers two questions at two moments: **what rate does a referrer
earn** (resolved once, frozen onto the PaymentPlan at creation) and **how much
is owed on this payment** (computed per payment from that frozen rate).

Admins never touch the second. This surface exists to control the first, and to
explain it after the fact.

That splits into four jobs:

| Job | Screen | Question it answers |
|---|---|---|
| Set the defaults | Rates | "What does a founder earn on full-ownership?" |
| Set the exceptions | Overrides | "Can John get 15% on Aviation City?" |
| Explain a payout | Plan audit | "Why did this referrer get exactly ₦19,000?" |
| Trace a change | History | "When did we drop the premium rate, and who did it?" |

---

## 2. Routes and navigation

```
/commission                     → redirect to /commission/rates
/commission/rates               → current config, edit, publish, version history
/commission/overrides           → list, create, edit, revoke
/commission/audit               → plan lookup (paste an ID)
/commission/audit/[planId]      → per-plan resolution forensics
```

`/settings/commission-config` is deleted.

**Routes, not tabs.** The existing page uses three tabs on one route. Overrides
is becoming a CRUD surface with URL-driven filters and pagination, and nesting
that inside a tab means one URL carrying tab state *and* filter state. Audit
needs its own route regardless, to be deep-linkable.

**History is a section on `/commission/rates`, not its own route.** It is the
version trail of the thing on that page, and the backend caps it at 20 entries
with no pagination. It can graduate to a route if it grows.

### Sidebar

A new collapsible **Commission** section, placed directly after Transactions —
it is money-domain, and sitting next to the payouts list aids discovery.

```
Commission
  ├─ Rates       → /commission/rates
  └─ Overrides   → /commission/overrides
```

Two other nav changes fall out of this:

- **`/transactions/commission` is relabelled "Commission Payouts."** It lists
  commission payout transactions. Leaving it as "Commission" would put two
  identically-named items in the sidebar once this section exists — and
  "Payouts" is what it actually shows.
- **The Settings section is removed.** Its only item was Commission Config,
  which is moving. An empty section is worse than no section; Settings comes
  back when something genuinely belongs in it.

Audit is **not** in the nav. It is a destination reached from the records it
explains — see §3.3.

---

## 3. Screens

### 3.1 Rates — `/commission/rates`

The `default` step at the bottom of the resolution chain: what applies when no
override matches.

**Sections**

1. **Flex commission** — `direct` only, one rate per tier.
2. **Full-ownership commission** — `direct`, `upline`, `topline`, each per tier.
3. **Platform rates** — WHT rate, marketplace platform fee, upgrade commission
   percentage.
4. **Amounts** — associate-pro upgrade fee, high-commission alert threshold.
5. **Version history** — collapsible, below the fold.

Rates display as percentages (`12.00%`) and are stored as fractions (`0.12`).
The existing conversion in `EditCommissionConfigDialog` is correct and carries
over: admin types `12`, we send `0.12`.

**Publishing is versioned, not an edit.** The button says *Publish new version*,
not *Save*. Publishing creates version N+1; the previous version stays
queryable. The confirmation should say which version is being created and that
existing payment plans are unaffected.

**Deliberately absent:** removal rates (`flexRemoval`, `fullOwnershipRemoval`).
Dropped — v1 implemented clawback but never called it. See
`docs/BACKEND-REQUESTS.md` context and the decision log in §7.

`⛔ blocked on ticket 11` — the v1 form required a change description on every
edit. `CreateCommissionConfigDto` doesn't accept one, and `forbidNonWhitelisted`
makes sending it a hard 400. Until the backend accepts it, the field is not
rendered. It is not sent-and-ignored.

### 3.2 Overrides — `/commission/overrides`

Three backend collections, **one concept to the admin**: special rates that beat
the defaults.

**One list, not three tabs.** An admin asking "what special deals exist?" wants
one answer. Type is a column, not a navigation level.

**Columns**

| Column | Notes |
|---|---|
| Type | badge — Asset / User / Asset + User |
| Subject | asset name, user name, or both ⛔ ticket 9a |
| Offer type | Flex / Full ownership |
| Rates | only the legs actually set — `direct 12%` , `upline 3%` |
| Reason | truncated, full text on hover |
| Granted by | admin name ⛔ ticket 9a |
| Expires | date, or "Never" |
| Status | Active / Expiring soon / Expired / Revoked |
| — | edit, revoke |

**Filters:** type, offer type, user, asset, and an *Include inactive* toggle
mapping to `include_inactive`.

Note the backend applies one filter object across all three collections, so
filtering by user returns user and asset+user rows but no asset rows — asset
overrides aren't user-scoped. That is correct behaviour, but the empty result
will read as a bug unless the UI says *"Asset overrides aren't user-specific
and are excluded by this filter."*

**Status is derived, not stored.** `revoked_at` set → Revoked. `expires_at` in
the past → Expired. Within 7 days → Expiring soon. Otherwise Active.

#### Create / edit dialog

Upsert semantics — creating and editing are the same call. The dialog branches
on type:

| Type | Inputs |
|---|---|
| **Asset** | asset picker · offer type · per-tier maps for direct/upline/topline |
| **User** | user picker · offer type · optional `direct` / `upline` / `topline` |
| **Asset + user** | both pickers · offer type · optional `direct` / `upline` / `topline` |

Plus `reason` and an optional `expires_at` on all three.

**Asset overrides are per-tier tables; user and asset+user are three flat
numbers.** That asymmetry is real — asset overrides apply to whoever sells that
asset, so tier still matters; user overrides already name the person.

`⛔ blocked on ticket 8` — the backend currently accepts a single flat `rate` on
user and asset+user overrides. Until per-leg lands, `upline` and `topline`
inputs are **disabled with an explanatory label**, and only `direct` is
submitted. No adapter silently drops what the admin typed.

**Every override is scoped to one offer type.** "Give John 15%" is ambiguous —
flex or full-ownership? The form makes offer type a required, prominent choice.
Covering both is two rows and two saves; the form does not hide that behind a
"both" convenience that would then need two revokes.

#### Precedence panel

The chain resolves `asset+user → user → asset → default`, per leg. A flat list
cannot show that an override the admin is about to create is already beaten by
a more specific one.

The dialog shows a live resolved preview for the subject being edited:

```
John Okafor · Aviation City · Full ownership

  direct    12%   ← asset + user        (this override)
  upline     3%   ← user
  topline    1%   ← default
```

`⛔ blocked on ticket 9b` — this requires
`GET /admin/commission/resolve?user_id=&asset_id=&offer_type=`. **The frontend
must not reimplement the chain to fill this in.** Duplicating the resolution
rules puts them in two places where they will drift, which is the exact failure
this module's design exists to prevent. Until the endpoint exists, the panel is
absent — not approximated.

#### What the screen must say out loud

**Overrides apply to new payment plans only.** The rate freezes onto the plan at
creation, so changing or revoking an override never affects existing plans —
they keep paying the rate they were created with, for life. Revoking claws
nothing back.

This is correct by design and the opposite of what "set John's commission to
20%" sounds like. Without a persistent line of copy on both the list and the
dialog, it will be reported as a bug.

### 3.3 Plan audit — `/commission/audit/[planId]`

Read-only forensics for one payment plan. Answers *why is this the number?*

Shows, per leg: the frozen rate, the recipient, the tier they held at creation,
which override level produced it, the config version in force, and the WHT rate.
Plus whether commission is payable at all — a plan with no referrer and no
agency pays nobody, permanently, and the screen should say so plainly rather
than showing a row of nulls.

Fed by `GET /admin/commission/audit/:paymentPlanId`, which reads the plan's own
snapshot fields. No computation client-side.

#### How you get here

Not a browsable list — there is exactly one audit per payment plan, so an index
would just be the payment plans table under another name.

The search that matters already exists elsewhere. A complaint is never *"plan
665f1c0a is wrong"* — it is *"I was paid ₦19,000 and it should be more."* That
payout **is** a commission transaction, so the commission transactions table is
the natural entry point:

```
Transactions → Commission Payouts
  filter by referrer
  find the row (date, buyer, amount)
  click → /commission/audit/[planId]
```

The link is possible because every commission Transaction carries
`source_payment_plan` — one of the source pointers v2 added so a payout can be
traced back to the deal that produced it. In v1 those pointers were partial,
which is why answering "why this number" meant joining collections by hand.

Two secondary paths reach the same URL: the referrer's user detail page via
their commission transactions, and the buyer's detail page via their plan.

**`/commission/audit` with no ID is a lookup page**, not a 404 — a plan ID input
and a line saying the usual route is via a commission payout. That covers the
case where support hands an admin an ID directly.

**A page, not a drawer.** Opening this from a transaction row in a drawer would
mean fewer clicks, but support workflows run on *"send me the link"* and a
drawer has no address.

### 3.4 History — section on `/commission/rates`

The config's version trail: version number, published date, publishing admin.

`⛔ blocked on ticket 11` — v1 showed which fields changed and a free-text reason.
The backend returns the last 20 config documents, so version and date work, and
`last_modified_by` is present as a bare ObjectId (unpopulated — no name).
Changed-field diffing and change descriptions do not exist as data.

Designed as: version, date, admin, and a *Compare with previous* action that
diffs two config documents client-side. Diffing two full documents we already
hold is honest work; inventing change metadata is not.

---

## 4. Data contracts

Zod schemas in `features/commission/schemas/`, types via `z.infer`. **Target
shape** — where it differs from what the backend serves today, the ticket is
noted.

### Shared

```ts
export const OFFER_TYPES = ['flex', 'full-ownership'] as const;
export const COMMISSION_TIERS = ['founder', 'associate-pro', 'premium', 'default'] as const;
export const OVERRIDE_SOURCES = ['asset_user', 'user', 'asset', 'default', 'agency'] as const;
```

> **Tier keys use a hyphen** — `'associate-pro'`, matching the backend's map
> keys. The v1 frontend used `associate_pro` with an underscore, which would
> silently miss and fall through to `default`. This is the single most likely
> source of a wrong-but-plausible number on these screens.

### Config

Money fields are **decimal naira** (see the money memo). Rate fields are
fractions in `[0, 1]` and are **never rounded** — rounding `0.105` to two places
is a 5% error in the rate itself.

```ts
CommissionConfigSchema = {
  version: number
  flexCommission: { direct: Record<Tier, number> }
  fullOwnershipCommission: {
    direct: Record<Tier, number>
    upline: Record<Tier, number>
    topline: Record<Tier, number>
  }
  wht_rate: number                        // 0–1
  marketplace_platform_fee_pct: number    // 0–1
  upgrade_commission_pct: number          // 0–1
  associate_pro_fee: number               // naira
  high_commission_alert_threshold: number // naira
  last_modified_by: string | null
  createdAt / updatedAt: string
}

ConfigResponseSchema = { active: CommissionConfig, history: CommissionConfig[] }
```

### Overrides

```ts
OverrideBase = {
  _id: string
  offer_type: OfferType
  reason: string | null
  granted_by: AdminRef | null      // ⛔ 9a — ObjectId today
  expires_at: string | null
  revoked_at: string | null
  createdAt / updatedAt: string
}

AssetOverride     = OverrideBase & { asset: AssetRef, direct: Record<Tier, number>,
                                     upline?: …, topline?: … }
UserOverride      = OverrideBase & { user: UserRef,  direct?: number,
                                     upline?: number, topline?: number }  // ⛔ 8
AssetUserOverride = OverrideBase & { asset: AssetRef, user: UserRef,
                                     direct?: number, upline?: number, topline?: number }  // ⛔ 8

OverrideListResponse = { asset: [], user: [], asset_user: [] }
```

The list response is three arrays; the client normalises to one
`NormalisedOverride[]` with a discriminating `type` field. That normaliser is
the one mapper on this surface, so **it is typed from `z.infer`, never a
hand-written shape** — this is precisely where the migration's silent-empty-list
bug class lives.

### Resolve preview `⛔ 9b`

```ts
ResolvePreviewSchema = {
  direct:  { rate, override_source, tier } | null
  upline:  { rate, override_source, tier } | null
  topline: { rate, override_source, tier } | null
  config_version: number
  wht_rate: number
}
```

### Plan audit

```ts
PlanAuditSchema = {
  payment_plan_id, buyer, asset
  referrer_id, agency_id
  commission_rate, commission_tier_at_creation
  commission_config_version, wht_rate, commission_override_source
  commission_payable: boolean
  // ⛔ 6 — upline_/topline_ fields once multi-level lands
}
```

---

## 5. Feature structure

```
features/commission/
  components/
    rates/       RatesCard, EditRatesDialog, VersionHistory
    overrides/   OverridesTable, OverrideFilters, OverrideDialog,
                 PrecedencePanel, RevokeOverrideDialog
    audit/       PlanAuditView, PlanLookupForm
    shared/      RateInput, TierRateTable, OfferTypeSelect, OverrideStatusBadge
  hooks/
    query-keys.ts
    use-commission-config.ts     use-publish-config.ts
    use-overrides.ts             use-upsert-override.ts
    use-revoke-override.ts       use-resolve-preview.ts
    use-plan-audit.ts
  schemas/
    commission.schema.ts         override.schema.ts     override-form.schema.ts
  index.ts
```

Replaces `features/commission-config/` entirely.

**Component contracts** are `Pick<Entity, …>` from the schema-derived types.
`RateInput` takes `value: number` (a fraction) and handles percent display
internally — one place converts, so the ×100 confusion can't spread.

---

## 6. Conformance to the existing design system

These are the app's established patterns, not proposals. New commission
components follow them.

**The dashboard is monochrome.** `--primary` maps to `neutral-900` — near
black. The teal/orange brand palette exists only in `auth.css`. Emphasis on
these screens comes from weight and hierarchy, never colour. Colour is reserved
for status.

**Page shell** — identical to every other page:

```tsx
<div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
  <header>  h1.text-2xl.font-bold.tracking-tight  ·  p.text-muted-foreground  ·  action right  </header>
</div>
```

**Every table is built twice.** `AdminDesktopTableWrap` (`hidden lg:block`)
holds a real `<Table>`; `AdminMobileStack` (`lg:hidden`) holds `AdminMobileCard`
+ `AdminMobileField` rows. This applies to the overrides list and the version
history table.

**Table state lives in the URL.** Filters and pagination go through
searchParams — `FilterSelect` resets `page=1` on change, `Pagination` reads
`page`. The overrides list follows this, so a filtered view is linkable.

**Status pills use the `TransactionStatus` pattern** — a map of
`{ label, wrapper, dot, text }` with complete literal class strings, because
Tailwind's JIT cannot see concatenated ones. The override status badge
(Active / Expiring soon / Expired / Revoked) is built the same way.

**Numbers use `tabular-nums`.** Percent is `(val * 100).toFixed(2)`; naira is
`₦${val.toLocaleString()}`.

**Loading is `PageContentLoader`; skeleton rows inside tables.**

Three existing inconsistencies that new components should *not* copy:
`AdminMobileCard` hardcodes `border-[#E5EAEF]` rather than `border-border`;
error boxes use raw `red-*` utilities rather than the `destructive` token; and
status pills bypass tokens entirely. Where a commission component has the
choice, it uses the token.

### States

Every screen handles four, explicitly:

- **Loading** — `PageContentLoader` for full sections; skeleton rows in tables.
- **Error** — `ApiClientError.message`. A `SCHEMA_MISMATCH` here means real API
  drift and should surface loudly, not be swallowed into an empty state.
- **Empty** — distinguish *no overrides exist yet* (offer the create action)
  from *no overrides match these filters* (offer to clear filters). Rendering
  the same empty box for both is the difference between a working screen and a
  broken-looking one.
- **Blocked** — where a section depends on an unlanded ticket, it renders a
  short explanatory note. Not an error, not silently missing.

---

## 7. Decisions

| # | Decision | Why |
|---|---|---|
| D-1 | Top-level `/commission`, out of `/settings` | Four screens and a domain; settings was one page that outgrew it |
| D-2 | One overrides list, type as a column | Admins think "special rates", not three collections |
| D-3 | Overrides created from the overrides screen only | No contextual entry from user detail — one place, one flow |
| D-4 | Removal rates dropped entirely | v1 implemented `removeCommission` but never called it; nothing to preserve |
| D-5 | No client-side chain resolution | Duplicating resolution rules guarantees drift; wait for the resolve endpoint |
| D-6 | No lossy adapters for unlanded contracts | Disable the input rather than silently drop what the admin typed |
| D-7 | Money is decimal naira; rates are unrounded fractions | Rounding a rate to 2dp is a 5% error in the rate |
| D-8 | History diffs documents client-side | We hold both versions; inventing change metadata we don't have is worse |
| D-9 | Routes, not tabs | Overrides needs URL-driven filters + pagination; audit must be deep-linkable |
| D-10 | New "Commission" nav section; `/transactions/commission` relabelled "Commission Payouts"; Settings section removed | Avoids two identically-named nav items, and names the payouts list for what it shows |
| D-11 | `/commission/audit` (no ID) is a lookup page | Support gets handed plan IDs; a 404 there is a dead end |
| D-12 | Commission owns a minimal asset lookup for its pickers | `GET /admin/assets` is implemented; the *frontend* assets feature is still GraphQL, so there is no hook to reuse. Importing from an unmigrated feature would be worse. Delete `use-asset-options` when assets migrates. |
| D-13 | Asset, referrer and offer type are locked when editing an override | They form the upsert key. Changing one wouldn't move the override — the backend would create a second and leave the first untouched. See below. |

### D-13 in detail

Override endpoints upsert on a key, not on `_id`:

| Type | Key |
|---|---|
| Asset | `(asset_id, offer_type)` |
| User | `(user_id, offer_type)` |
| Asset + user | `(asset_id, user_id, offer_type)` |

So editing *Aviation City · Full ownership* and switching the asset to
*Harmony Gardens* would not move it. The backend looks for
"Harmony Gardens + full ownership", finds nothing, and **creates a new
override** — leaving the Aviation City one in place. The admin believes they
moved a deal and now has two.

The key fields are therefore disabled in edit mode, with copy directing the
admin to revoke and recreate. Rates, reason and expiry stay editable; they are
not part of the key, so saving updates the row on screen.

If moving an override is wanted later, that needs a backend update-by-`_id`
endpoint alongside the upsert. Not requested.

---

## 8. Out of scope

- **Commission transactions** — `features/transactions/components/commission`
  already lists commission payouts. Separate feature, separate migration. Those
  rows now carry far richer fields (source pointers, `rate_applied`,
  `override_source`) that the current table doesn't surface — worth revisiting
  when transactions migrate.
- **Reversal / clawback** — deliberately deferred. What happens to commission,
  WHT and coupon usage when a sale is reversed has no answer in v2, and v1's
  answer was never wired up.
- **Agency commission rates** — set on the Agency record via
  `commission_percentage`, owned by the agency feature. The chain short-circuits
  to it, but it isn't configured here.

---

## 9. Build order

1. Schemas + query keys — the contract, before anything renders
2. Rates read (`GET config`) + `RatesCard`
3. Rates publish (`POST config`) + `EditRatesDialog`
4. Overrides list + filters + normaliser
5. Asset override create/edit — the one type whose contract is already correct
6. User + asset+user override create/edit — direct-only until ticket 8
7. Revoke
8. Plan audit
9. Version history + compare
10. Precedence panel — when ticket 9b lands
11. Per-leg inputs enabled — when ticket 8 lands

### Status

Steps 1–7 are **done** — schemas, rates read/publish, the overrides list, all
three override dialogs, and revoke.

Steps 8 and 9 are **on hold**, both blocked on backend gaps rather than on
frontend work:

| Step | Blocked on | Why it isn't built |
|---|---|---|
| 8 — Plan audit | ticket 9a | Every identity field on the audit response is a bare ObjectId, and three of the four are users, so `GET /admin/users` (ticket 2) can't resolve them either. A screen whose job is explaining a payout to a person cannot do that with three ObjectIds. |
| 9 — Version history | ticket 11 | The backend records no change metadata — no changer name, no changed-field list, no reason, and the publish DTO won't accept one. History could show version and date and nothing else. |

Steps 10 and 11 remain blocked on tickets 9b and 8 as before.

**Not built rather than built-and-degraded.** Both were held deliberately: the
backend is mid-rebuild, so these are scheduling items for that team, not
frontend design problems to route around.
