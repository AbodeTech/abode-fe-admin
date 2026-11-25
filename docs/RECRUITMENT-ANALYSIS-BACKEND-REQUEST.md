# PRD: Recruitment Analytics — backend requirements

Updated: 25 November 2026. This document supersedes the earlier recruitment-analysis mock and drawer requirements.

## 1. Purpose and approved scope

Give business and sales teams a clear view of which recruitment cohorts produce approved Associate Pros, sellers, sales and new recruits, and what those outcomes cost. Keep every count explainable through the same cohort membership, source filters and evidence.

Design reference: `C:/Users/Seymart/Downloads/Recruitment Analytics.html`. Sample names, amounts, percentages and chart points in that file are layout examples, not data to seed or hard-code.

| Screen | Frontend route / behaviour | Backend responsibility |
| --- | --- | --- |
| Overview | `/recruitment/analysis` | Filter options, six summary metrics, return chart, Needs attention, all-cohorts table |
| Cohort detail | `/recruitment/analysis?detail=<cohort-id>` | Exact cohort results, journey, stopped-person groups, commercial results/costs, activities and Pro list |
| Compare | **`/recruitment/analysis/compare`** | Two to four selected cohorts with consistent definitions, source scope and observation metadata |
| Stage/follow-up lists | Dialog from the cohort detail page | Searchable, paginated people whose membership reconciles with the clicked count |

Comparison selection is stored in the frontend URL as `compare=<id1>,<id2>`. Show **all available cohorts** in the chooser; the former three suggestion buttons were a UI truncation, not a backend limit. Zero/one selections show the selection prompt; two to four render a comparison. Four is the current simultaneous comparison limit, not a cap on available cohorts or programmes.

### Latest layout

- Overview summary: cohorts, registrants, became Associate Pro, Pros selling, sales brought in, return on cost.
- Return by cohort: chronological bars for the latest 12 cohorts, sales per ₦1 spent, median and maturity context.
- Needs attention: actionable outcome shortfalls, linked to the relevant cohort.
- All cohorts: cohort/programme, actual start date, maturity/status, registrants, Pro rate, selling rate, sales, cost and return; search, sort, pagination and comparison selection.
- Detail: six headline metrics (including downstream Pros), journey, Where people stopped, sales/recruiting results, sales timeline, costs, activity-to-selling comparison and Associate Pro table.
- Compare: programme journey, outcomes after approval, costs/return, participation rates, first-sale timeline and evidence-backed highlights.

The active design has no cohort drawer, goal-progress chart, volume diagram or Judge by control. Keep registration goals as detail metadata. CSV download of each “Where people stopped” group is now explicitly required for marketing follow-up, superseding the earlier exclusion. General overview/transaction exports and date-filter work remain outside this request. Preserve existing optional date parameters for compatibility.

### Delivery priorities

1. **P0 — attendance correctness:** include authoritative legacy meeting verification, with named programme/cohort reconciliation in section 3.
2. **P1 — consistent live analytics and follow-up:** complete cohort choices, scoped detail/comparison results, exact people groups, downloadable follow-up contacts, coverage and versioned definitions.
3. **P1 — commercial metrics:** sales, costs, recruiting outcomes and return, once attribution and authoritative sources are agreed.
4. **P2 — deeper analysis:** activity comparisons, first-sale timelines, benchmark-driven alerts and enhanced Pro lists.

## 2. Existing API and proposed work

All paths below are relative to `/api/v1`. Existing reads require admin authentication and `view_academy`. Apply the same authorization to additions; retain any stricter existing permissions for financial data.

| Endpoint | Status | Required work |
| --- | --- | --- |
| `GET /admin/academy/recruitment-analysis` | Exists | Correct attendance; preserve response contract; add commercial results, lifecycle, coverage, chart and alert blocks |
| Same endpoint with `cohort_id=<id>` | Exists; detail and comparison use it | Return only that cohort's scoped metrics; include the detail blocks described in section 6 |
| `GET /admin/academy/recruitment-analysis/people` | Exists | Preserve stage/follow-up lists; add the three missing follow-up groups, nullable phone numbers and stable complete pagination; supports the current CSV fallback |
| `GET /admin/academy/recruitment-analysis/people/export` | **Proposed, recommended for consistent full-group exports; not implemented** | Export all matching contacts from one snapshot, using the exact same membership and scope as the people list (section 10.1) |
| `GET /admin/academy/recruitment-analysis/compare?cohort_ids=<id1>,<id2>` | **Optional proposed endpoint; does not currently exist** | Batch two to four cohorts under one observation snapshot, preserving selection order and per-cohort availability |

The frontend currently compares cohorts by calling the existing aggregate endpoint once per selected cohort, at most four requests. A new frontend URL does **not** require a new backend endpoint. Reusing the aggregate remains valid; a batch endpoint is useful for consistent snapshots and efficiency. No dedicated detail/filter endpoint is required while the aggregate supplies those blocks and complete `filter_options`.

### Verified local source behaviour

Read-only review on 24 November 2026, not a production/database verification:

- Controller exposes aggregate and people endpoints only.
- `RecruitmentAnalysisFilterDto` accepts programme/cohort/source and the legacy creation-date parameters. It does not accept status, maturity, comparison IDs, monetary sorts or Pro activity filters yet.
- People DTO accepts stage, existing follow-up, search, page (default 1), limit (default 25; maximum 100).
- Attendance is currently `Boolean(registration.checked_in)`; the repository loads meetings but not `MeetingVerification`.
- Cohorts expose `created_at`, registration open/closed and `stage_label: null`; they do not establish actual start/close dates or maturity.
- Seller evidence is returned through `confirmed_sale_only`, `approved_recruit_only`, `both`. Source comparisons expose broader active AP counts, not a seller-only count.
- Confirmed sales are queried as distinct users, without transaction values or dates. Cost, activity-to-sale and first-sale series are absent.

Proposed field names in this PRD are a requested additive contract, not implemented capabilities. Agree DTOs and frontend Zod schemas together before sending new parameters.

## 3. Attendance correction: historical Supabase meeting verification

### Business rule supplied by the product owner

Some cohorts used meeting verification as the attendance/check-in process in Supabase even though their registration tables contained `checked_in` and `checked_in_at` columns. Their attendees must be determined from meeting-verification evidence. The mere existence of a check-in column or check-in rows does not establish which process that cohort used.

**For the legacy cohorts below, meeting verification is an authoritative attendance source. Do not require `registration.checked_in === true` in addition to a valid verification.**

### Confirmed programmes and cohorts

The supplied verification CSV was joined to `meet_sessions_rows.csv` by `meet_session_id`, then to the appropriate registration CSV by `registration_id`. Programme names and target slugs were checked against the backend migration mappings.

| Programme | Cohort | Supabase meeting `cohort` key | Target cohort slug | Meeting rows | Verification rows | Distinct verified registrations in cohort | Verified registrations whose `checked_in` is false |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| **Abode Academy** | **Cohort 6** | `cohort6` | `cohort-6` | 3 | 4,420 | 2,216 | 1,815 |
| **Realtor Certification Program** | **July 2026 Edition** | `realtor_certification_program` | `rcp-july-2026` | 4 | 938 | 649 | 649 |
| **Realtor Certification Program** | **August 2026 Edition** | `realtor_certification_program_august` | `rcp-august-2026` | 5 | 3,520 | 1,903 | 1,903 |
| **Realtor Certification Program** | **October 2026 Edition** | `realtor_certification_program_october` | `rcp-october-2026` | 5 | 1,386 | 930 | 930 |
| **Total** | | | | **17** | **10,264** | **5,698 cohort-registration pairs** | **5,297** |

Only 401 of the 2,216 meeting-verified Cohort 6 registrations have `checked_in=true`. Every meeting-verified registration in the three listed RCP cohorts has `checked_in=false`. Check-in-only counting therefore misses 5,297 verified cohort-registration pairs in these exports.

These are **source-export reconciliation counts**, not promised live dashboard totals. Held registrations, identity resolution, excluded administrative sessions, and the selected source filter can affect the live count. Count unique people within each cohort after canonical identity mapping; do not show 10,264 as unique attendees.

The supplied meeting export has no cohort mapping for Abode Academy Cohort 5, Abode Webinar, or Jeffrey's Masterclass. Do not infer zero attendance or apply a meeting-verification-only policy to those programmes from this file alone. Their attendance source needs its own evidence.

### Source reconciliation findings

- All 10,264 verification rows have a matching exported meeting, matching registration in that meeting's cohort, matching normalized registration email, and a parseable `verified_at`.
- No duplicate `(meet_session_id, normalized email)` keys were found. Repeated attendance across multiple sessions still needs cohort-level deduplication.
- Three sessions are named `Testing` or `testing for october`, with one verification each. Their IDs are `4985b83f-26ae-499c-b476-3ebb62f067f0` (July), `0485a4a3-6587-44c6-a042-c5004ade7441` (August), and `572897e3-f65a-457d-9ae9-4526ddd6ec1d` (October). Mark these explicitly as administrative/test sessions in the attendance mapping after review; do not implement a general substring-name exclusion. Excluding these three sessions leaves 10,261 verification records and the same 5,698 unique cohort-registration pairs in this export.
- Several disabled/duplicate meeting links exist. `is_active=false` is not proof that historical attendance should be erased. Session eligibility must distinguish a disabled link from a cancelled/test event.
- The migration README records a historical staging import of all 17 meetings and 10,264 verifications. It also records 769 verification rows without a linked target user at that time. Reconcile against the actual target environment before re-importing; this task may require fixing analytics joins rather than importing the same data again.

### Required resolver and identity joins

Use one attendance resolver in dashboard aggregation, cohort details, people drill-down, and any existing cohort dashboard/list that reports attendance.

1. Record an explicit per-cohort attendance policy: `checkin`, `meeting_verification`, or `combined`.
2. For the four named legacy cohorts, valid meeting verification must qualify the registrant as an attendee. A false/empty check-in field must not override it.
3. For current check-in cohorts, use affirmative check-in evidence. For genuinely mixed cohorts, use the union of valid check-in and meeting-verification evidence and count each person once. Only combine evidence when both processes represent the same attendance definition; do not confuse an exam check-in with meeting attendance.
4. A registrant attending any eligible session in the cohort qualifies for the attendee stage. Multiple sessions do not multiply the cohort attendee count. Course completion remains a separate stage.
5. First resolve the meeting's cohort, then resolve the person within that cohort. Prefer preserved source-to-target registration mapping; otherwise use a validated target user within that cohort or one exact normalized email match in that cohort. Trim/lowercase emails. Do not fuzzy-match names, match email globally across cohorts, or silently pick one of multiple candidates.
6. `MeetingVerification.user` can be null for migrated records. A valid cohort-scoped registration/email mapping may still establish attendance. A verification with no resolvable canonical registration must be reported as unresolved; do not silently add it to the dashboard numerator without a corresponding person in the drill-down.
7. Preserve provenance: source verification ID, meeting ID, original registration ID where retained, match method, and `verified_at`. Keep the source check-in fields intact unless a separately authorized reconciliation changes them.
8. `attended_at` is the earliest valid timestamp from the selected attendance evidence. Preserve UTC timestamps and display dates in `Africa/Lagos`. Do not derive attendance time from migration/import time.
9. A verification's `source` (for example `existing_registrant`) describes verification provenance. It is not the acquisition/referral source filter and must not replace `Registration.referral_source` or `was_existing`.

In the current v2 model the fields are `MeetingVerification.meeting`, `MeetingVerification.user`, `email`, and `verified_at`; the parent `Meeting.cohort_id` identifies the cohort. There is no direct `registration_id` field on that verification schema. Legacy `meet_session_id` and `registration_id` require the migration mapping described above. The existing migration script validates cohort/email relationships; reuse its mappings, not a new global email join.

### Coverage and zero versus missing data

A completed meeting or a default `checked_in=false` column is not enough to prove complete attendance tracking. Report whether the relevant check-in/verification records were actually captured and migrated.

- Tracked with no qualifying attendees: count `0`.
- Required historical source unavailable/unmigrated: count `null`, availability `unavailable`.
- Some records resolved and others missing: known count plus availability `partial` and reconciliation counts.
- Both evidence sources present: deduplicate the union. Check-in count plus verification count must subtract the overlap.

Proposed additive cohort metadata (illustrative shape, not observed counts):

```json
{
  "attendance": {
    "policy": "meeting_verification",
    "availability": "partial",
    "count": 100,
    "checkin_only": 0,
    "meeting_verification_only": 95,
    "both": 5,
    "unresolved_verification_rows": 2,
    "excluded_verification_rows": 0,
    "earliest_attended_at": "2026-08-27T18:35:00.000Z"
  }
}
```

Evidence split fields count unique eligible cohort people; unresolved/excluded fields count verification records and must be labeled as such. The attendee count must reconcile with the attendance evidence included under the cohort's policy. When the policy excludes a type of evidence, do not include it in these contributing counts.

## 4. Scope, compatibility and response rules

### Filters and URL state

| Field | Current behaviour | Required contract |
| --- | --- | --- |
| `programme_id` | Sent to aggregate | Exact programme scope; validate against a supplied cohort |
| `cohort_id` | Sent to aggregate/people | Exact cohort scope; no fallback to a different cohort |
| `source` | Sent to aggregate/people and each compared cohort | Exact registration referral-source value, consistently applied to every membership and derived metric |
| `status` | Frontend-only `registration_open` / `registration_closed`; filters overview cohort totals/table/alerts | If moved server-side, agree a distinct `registration_status` DTO field; never interpret it as maturity |
| `maturity_code` | Not implemented | Separate proposed lifecycle filter; do not send before backend support |
| `compare`, `detail`, `view` | Frontend navigation/selection state | Not aggregate API parameters; do not forward them |
| `cohort_search`, `cohort_sort`, `cohort_page` | Frontend table state; eight rows/page | Search/pagination must not change summary, charts or benchmark pools |
| `people_page` | People dialog state | Maps to `page`, currently limit 25 |
| `pro_search`, `pro_page` | Detail Pro-list state | Map to people `search`/`page`, currently limit 10 and `stage=approved_upgrade` |

Current overview sorts: newest created, most registrants, lowest Pro rate. Requested additions are newest actual start, highest return and highest sales once data exists. Keep null values last and use a stable ID tie-break. Do not silently paginate `cohorts[]`: the current frontend derives totals and alerts from the complete set. If server-side table pagination is introduced, return independently computed full-scope summary, chart and benchmark blocks plus table pagination metadata in a coordinated contract change.

The reference's “Cohorts started” date selector is out of scope. Existing `cohort_started_from/to` actually filter cohort **creation dates** in the local backend; do not relabel or silently change those semantics. The UI uses `Created` until actual `started_at` is supplied.

Comparison must retain selected cohort IDs and source scope across navigation/refresh. Cohorts may belong to different programmes. An overview programme/status filter must not silently exclude an explicitly selected comparison cohort. The chooser must have the complete authorized cohort catalog, independent of selected items and table pagination; it currently comes from an unfiltered aggregate request.

### Preserve the existing contract

Keep the `{ success, data, message, meta }` envelope and paged people envelope. Retain existing `generated_at`, `filters`, `filter_options`, `summary`, `coverage`, `journey`, `cohorts`, `comparison` and `follow_up` blocks. Keep all existing singular stage codes:

`registrant`, `attendee`, `test_participant`, `test_pass`, `course_completion`, `approved_upgrade`, `active_associate_pro`.

Stage metrics remain `{ count, acquired, influenced, unclassified }`. Do not treat `was_existing=null` as either acquired or influenced. Adding backend fields alone is insufficient: update `features/recruitment/schemas/recruitment-analysis.schema.ts` and the consuming hooks/components in the same rollout.

For new metrics return `availability: tracked | partial | unavailable`, a nullable value/count and a machine-readable missing reason where relevant. A tracked zero is `0`; missing data is `null`; partial known totals must remain labelled partial and cannot win a comparison or establish a trustworthy benchmark. Return metric-specific coverage, not only one dashboard-wide flag.

Percentages use 0–100 numeric values; return null for zero/missing denominators. Rates should carry numerator, denominator and denominator label. Money uses NGN integer kobo (`amount_minor`, `currency: NGN`), with an agreed safe serialization range; no formatted strings as the source of truth. Ratios are numeric multiples, not percentages. Use full precision for calculation, round for display only. Timestamps are ISO-8601 UTC; calendar display is Africa/Lagos.

Include `metric_definition_version`, `generated_at`, `observation_ends_at` and attribution/benchmark basis. Cache keys must include scope and definition version; invalidate relevant results when reconciled attendance, approval, sales/refunds or costs change.

## 5. Metrics and commercial attribution

| Metric | Definition / denominator |
| --- | --- |
| Registrants | Unique eligible person within each cohort; overall legacy totals count cohort-person memberships, not automatically globally unique users |
| Became Associate Pro | Approved qualifying upgrades; rate = approved Pros / registrants under the declared conversion definition |
| Pros selling | Distinct approved Pros with an attributable confirmed sale after approval; rate = sellers / approved Pros |
| Active Associate Pros | Sellers OR approved recruiters; preserve existing broader metric but never label it “Pros selling” |
| Sales brought in | Sum of eligible confirmed sales attributed to those Pros and the cohort; never number of sales or user purchases substituted for money |
| Pros they brought in | Distinct downstream people with qualifying approved Pro upgrades; not the number of recruiting agents |
| Return on cost | Sales value / cohort cost; null for zero, missing or partial cost/revenue; this is sales per ₦1 spent, not profit ROI |
| Unit costs | Cohort cost / registrants, approved Pros or selling Pros, respectively; null for zero/missing denominator |
| Sales per selling Pro | Attributable sales value / selling Pros |
| Days to first sale | Days from approved upgrade to first qualifying confirmed sale; cohort summary uses the median among sellers and reports sample/coverage |

Keep the existing activity partition mutually exclusive: `confirmed_sale_only`, `approved_recruit_only`, `both`. Seller count = confirmed-sale-only + both; recruiting-agent count = approved-recruit-only + both. Neither expression supplies a downstream recruit total.

### Attribution decisions required before monetary release

These are proposed business rules for agreement, not silent changes to historical counts:

- Separate cohort attendance/registration membership from commercial credit. People can attend multiple cohorts, but the same sale must not be credited multiple times in commercial rollups.
- Recommended commercial credit: latest eligible cohort registration before qualifying Pro approval, with deterministic tie-break; subsequent eligible sales follow that attributed approval. Return the rule/version and exclusions.
- Distinguish people already Pro at cohort entry from newly approved Pros. Return already-Pro exclusions and the exact conversion denominator. Do not silently replace the existing registrant/upgrade metrics with a new population.
- Decide whether “sales value” means confirmed paid value or contracted plan value; define refunds, cancellations, instalments, multiple confirmations and currency treatment. Count the same economic sale once.
- Only post-approval sales/recruits qualify for post-upgrade outcomes. Missing historical dates produce partial/unavailable evidence, not an assumed order.
- Identify the authoritative cohort cost source and its completeness. Request actual total and category costs; do not estimate costs from reference figures. Cost-entry workflows are outside this read-only analytics scope unless separately agreed.
- For source-filtered cost/return, explicitly define cost allocation. Until a valid allocation exists, return cost-based metrics unavailable for source slices rather than dividing source revenue by an unexplained whole-cohort cost.

Add `started_at`, `closed_at`, `registration_closed_at` where distinct, `maturity_code`, `maturity_basis` and results age. Complete/maturing/unknown must be based on an agreed observation policy, not registration-open/closed or `created_at`. The latest reference does not establish a binding maturity threshold; older 30/90-day proposals are not accepted requirements.

## 6. Aggregate and cohort detail additions

```http
GET /api/v1/admin/academy/recruitment-analysis?programme_id=<id>&source=<value>
GET /api/v1/admin/academy/recruitment-analysis?cohort_id=<id>&source=<value>
```

Proposed additive blocks:

| Block | Required fields / use |
| --- | --- |
| `performance` at aggregate and cohort level | Seller count, confirmed-sale count/value, total/categorical cost, return multiple, cost per registrant/Pro/seller, sales per seller; coverage for each metric |
| `recruiting` at cohort level | Recruiting Pros, people recruited, approved downstream Pros, downstream Pros selling; eligibility window and coverage |
| `lifecycle` per cohort | Actual lifecycle dates, registration status, maturity basis/status and observation window |
| `return_by_cohort` | Last 12 eligible cohorts in oldest-to-newest order; IDs/names, actual start, maturity, return multiple/availability, median and benchmark membership |
| `needs_attention` | Full-scope alerts, total flagged, rule/version, threshold, benchmark and drill target (section 7) |
| `cohort_detail.sales_timeline` | Bucket start/end, confirmed sales value/count, currency, cumulative vs period basis, observation bounds and coverage |
| `cohort_detail.costs` | Total plus ads, events/venue, facilitators, tools/messaging and any other category; completeness, cost source and reconciliation |
| `cohort_detail.unit_cost_benchmarks` | Cost per registrant/Pro/seller, same-programme median, included peers and availability |
| `cohort_detail.activity_analysis` | Activity rows and participation/selling comparisons (section 8) |
| `cohort_detail.first_sale_timeline` | Day-since-approval series, eligible denominators and observation/censoring method (section 8) |

Only populate single-cohort detail blocks when scoped to a cohort; a detail request must never include global totals. A nonexistent/deleted cohort returns explicit not-found or an explicitly empty scoped result. Unauthorized data follows the existing authorization policy.

Illustrative **additive fragment**, not a complete response or observed dataset:

```json
{
  "performance": {
    "sales_brought_in": {
      "amount_minor": null,
      "currency": "NGN",
      "availability": "unavailable",
      "reason": "sales_value_not_supplied"
    },
    "cohort_cost": {
      "amount_minor": null,
      "currency": "NGN",
      "availability": "unavailable",
      "reason": "cost_not_recorded"
    },
    "return_on_cost": {
      "value": null,
      "availability": "unavailable",
      "reason": "cost_not_recorded"
    }
  }
}
```

Journey counts and rates must identify their denominators. Bars use registrants; next-stage transition annotations must use actual intersecting memberships, not assume every test-taker has an attendance record. Course completion is separate and must stay unavailable where not tracked. “Made a sale” uses sellers, never broader active APs. Do not show a programme-usual annotation without a valid peer benchmark.

## 7. Needs attention and programme benchmarks

### Current implemented rule — retain until a versioned replacement is agreed

- Use registration-closed cohorts with tracked Pro conversion and positive registrant denominators, within the declared overview programme/source/status scope.
- Group by programme; require at least two valid cohorts; take the unweighted median of their conversion rates. The current median includes the assessed cohort.
- For a positive median, flag `(median - value) / median * 100 >= 15` (inclusive).
- Estimate the upgrade shortfall as `(median_percent - value_percent) / 100 * registrants`. Rank descending by this estimate, then relative gap, then stable name/ID. Display the top **three** alerts plus the total flagged; this limit is unrelated to the all-cohort comparison chooser.
- Clicking an alert opens the cohort detail page. Summary, benchmark and alert inputs must be independent of table search/pagination.
- Fewer than two eligible cohorts, zero median or unavailable outcomes must produce an insufficient-comparison state, not “all healthy”.

### Additional rules requested by the latest reference

The design also calls for medians of **other finished editions**, passed-but-not-upgraded alerts and low-return alerts. This differs from the current rule; the backend must return an explicit rule/version and benchmark population before the frontend changes its interpretation.

For every alert supply `cohort_id`, `programme_id`, `reason_code`, metric value, denominator, benchmark, peer count/IDs or reproducible scope, relative/absolute gap, estimated people gap where applicable, availability, ranking basis and drill target. Agree minimum peer/sample requirements, maturity eligibility and low-return thresholds before enabling new alert types. Do not mix differently scaled alert types into an unexplained ranking.

Goal progress is **not** an attention signal. Example: two closed cohorts each have 100 registrants and convert 2 and 30 Pros. The current median is 16%; the first is 87.5% below median and about 14 upgrades short, regardless of whether it has already met its registration goal. A low registration-goal percentage alone does not mean poor conversion or return.

## 8. Activities and first-sale charts

### Activity rows

Support these keys with explicit coverage: `weekly_meeting_any`, `weekly_meetings_three_in_30_days`, `allocation_event`, `recruited_person`, `site_inspection`, `sales_marathon`.

For each activity return eligible Pros, participant count, nonparticipant count, seller counts for both groups, selling rates, percentage-point difference, unknown-participation count, data source and window. Unknown participation must not be silently counted as nonparticipation. Site inspection and sales marathon can be unavailable until attendance/event tracking exists.

The reference proposes activity from approval until first sale, or the first 60 days for nonsellers; the three-meeting metric also needs its first-30-day window. Agree how immature Pros and events after those windows are handled. Prevent post-sale activities from being credited as pre-sale exposure. These comparisons show association, not causation.

### Sales and first-sale series

- Sales-since-close chart: true cohort close date, interval boundaries, period sales/counts and optional cumulative totals; do not synthesize time points from an aggregate.
- First-sale comparison: align each cohort at day zero = individual Pro approval. Return day offsets, seller count, eligible denominator, percent and observation horizon for each point.
- Use a documented common observation window or censoring-aware method; newer cohorts must not be presented as worse simply because they have had less time to sell. Do not invent zero-valued future points.
- Median days-to-first-sale excludes nonsellers from the median but reports the number of observed sellers and coverage; do not treat nonsellers as zero days.
- Return explicit empty/unavailable series where dates or event histories are missing.

## 9. Comparison contract

The existing scoped aggregate requests can supply the same fields as detail. Use the selected cohorts in user order, with a common source definition and compatible snapshot/version metadata. Avoid per-person N+1 queries.

If implementing the optional batch endpoint:

```http
GET /api/v1/admin/academy/recruitment-analysis/compare?cohort_ids=<id1>,<id2>&source=<value>
```

- Validate two to four distinct, valid cohort IDs; return 400 for invalid size, duplicates or malformed IDs. No artificial limit of three available cohorts.
- Preserve input order. Return a result for each requested authorized cohort, with explicit unavailable/not-found/error state where permitted. Never substitute another cohort or collapse missing data to zero.
- Use one `observation_ends_at`/definition version where possible; expose partial failure. Do not claim a common snapshot when four separate requests were computed at different observation times.
- Recommended response blocks: `selected_cohort_ids`, snapshot/version, `items[]` (cohort metadata and same metric/detail blocks), `measures[]` (denominator, comparison direction, availability, winners), and optional structured `highlights` with supporting values.
- The chooser catalog is independent of the selected result list. Return all authorized choices or an explicitly paginated searchable catalog; a page of cohort table rows must not be the only available choices.

Measures: registration and journey counts/rates; upgrade count/rate; selling count/rate; median days-to-first-sale; sales; sales per seller; downstream approved Pros; total and unit costs; return multiple; activity participation shares; first-sale timelines.

Highlight higher conversion/selling rates, sales, return and participation where meaningful; lower days-to-first-sale and **unit** cost where meaningful. Total cohort cost and raw registrant volume are context, not automatically “best”. Show ties consistently. Mark no winner when required comparison data is incomplete, denominators are zero, or maturity/observation windows are not comparable. Narrative highlights must reference returned numbers and exclude unavailable measures; do not generate sample claims such as “best on 11 of 15 measures”.

## 10. People, follow-up and Pro list

```http
GET /api/v1/admin/academy/recruitment-analysis/people?cohort_id=<id>&stage=attendee&page=1&limit=25
GET /api/v1/admin/academy/recruitment-analysis/people?cohort_id=<id>&stage=approved_upgrade&page=1&limit=10
```

Preserve programme/cohort/source/stage/follow-up/search filters and existing identity, classification, furthest-stage and stalled/follow-up fields. Page >= 1; limit 1–100. Paged responses need total, page, limit and total pages under the existing envelope. Counts and person memberships must use the same snapshot/scope as the corresponding metric.

### Exact stopped-person groups

| Group | Existing or proposed `follow_up` | Required membership |
| --- | --- | --- |
| Registered, never attended | Existing `registered_without_attendance` | Registered AND not attended, only where attendance is sufficiently tracked |
| Attended, did not take test | Existing `attended_without_test_attempt` | Attended AND no eligible attempt |
| Took test, did not pass | Proposed `attempted_without_test_pass` | Has eligible attempt AND no qualifying pass across eligible attempts |
| Passed, not upgraded | Proposed `passed_without_approved_upgrade` | Has qualifying pass AND no qualifying approved Pro upgrade |
| Pros without a sale | Proposed `approved_without_confirmed_sale` | Has qualifying approved upgrade AND no eligible confirmed sale |

Retain existing `passed_without_course_completion` and `completed_without_approved_upgrade` for compatibility. They are **not substitutes** for passed-without-upgrade. Return exact set-membership counts and paginated lists; subtracting aggregate counts can produce wrong results when data is non-nested. Null/partial tracking must not become a definitive list of people who failed to progress. Groups can overlap when evidence permits; document that they are not necessarily a mutually exclusive funnel.

### Pro table additions

For `stage=approved_upgrade`, add approval date, meeting count, activity labels, first-sale date/days, confirmed-sale count/value, downstream approved recruit count, inactive-in-window flags and per-field coverage.

Proposed DTO extensions: `selling_status=all|selling|not_selling`, `sort_by=sales_value|approved_recruits|meetings_attended|approved_at`, `sort_direction=asc|desc`. Apply these before pagination; sort nulls last with stable ID ties. A nonselling filter requires tracked absence of sales, not unknown evidence. Do not use the broader active-AP stage to implement the selling tab.

Attendee rows need additive `attendance_source` (`checkin`, `meeting_verification`, `both` or null), earliest `attended_at`, evidence count, relevant meeting IDs and legacy registration ID where retained. Evidence count is records/sessions, not people. Avoid returning unnecessary raw verification history. The attendee list must reconcile with the same deduplicated aggregate, including valid legacy verification when check-in is false.

### 10.1 Download contacts for marketing follow-up

**User flow:** click a row under “Where people stopped” → review the cohort's people list → optionally search → click **Download CSV**. Download every matching person across all pages, not just the current visible page and not one aggregate row. Use the same selected cohort, follow-up group, source and search as the open list. The export is a file download only; it does not send messages or start an outreach campaign.

#### What works now and what needs backend changes

- The existing paged `/people` endpoint supports `registered_without_attendance` and `attended_without_test_attempt`. Frontend download now collects every matching page with `limit=100` and generates CSV. A new endpoint is not required to enable basic name/email exports for these two groups.
- Backend must implement **`attempted_without_test_pass`**, **`passed_without_approved_upgrade`**, and **`approved_without_confirmed_sale`** in both aggregate `follow_up` counts/availability and `/people` filtering. The frontend accepts these additive keys but keeps rows unavailable until the backend advertises them. Do not map them to existing course-completion groups or derive them by subtracting stage totals.
- Add **`phone_number: string | null`** to person records, from the authoritative user/registration contact source. The current API supplies names/emails but no phone numbers. Specify source precedence when registration and canonical-user contacts differ; do not infer a number or country code. Blank/unknown phones must not become `0`.
- Correct historical attendance before presenting “never attended” as a reliable marketing list. If tracking is incomplete, return `available=false` or explicit partial coverage, and do not present unknown attendance as confirmed nonattendance.
- Preserve all qualifying people with missing contact fields in the export; blank phone/email must not silently reduce the row count. Report missing-contact counts when available.

#### CSV contract

Exact initial columns, in order:

```text
User ID, First name, Last name, Email, Phone number, Programme, Cohort, Source, Follow-up group, Furthest stage, Stalled days
```

One record per canonical person within the selected cohort/group. `Follow-up group` identifies the clicked group even when a person also belongs to another group; it must not be replaced by a different single `follow_up_stage` label. `Stalled days` is blank if not tracked. Contact fields preserve international prefixes and leading zeros. Include no passwords, tokens, payment details or unrelated user-record fields.

Format: UTF-8 CSV with BOM, CRLF rows, correct escaping of commas, quotes and multiline text. Treat values beginning with spreadsheet formula characters as text, and keep phone numbers as text. Use a safe filename containing cohort, follow-up code and generation date. CSV count must match the complete scoped people result at the export's snapshot.

The current frontend snapshots the selected filters/search when downloading, disables selector/search changes during preparation, allows cancellation, and fetches sequential pages. It rejects changed totals, short pages, duplicate cohort-person identities, wrong-cohort/source records and failed requests; it saves no partial file. Existing pagination does **not** guarantee a consistent snapshot when membership changes without changing the total. That limitation is why the server export below is recommended.

#### Recommended backend export

```http
GET /api/v1/admin/academy/recruitment-analysis/people/export?cohort_id=<id>&follow_up=registered_without_attendance&source=<optional-value>&search=<optional-text>
```

- Require one valid `cohort_id` and one of the five requested follow-up codes. Optional programme must match that cohort. Source/search semantics must match `/people` exactly; do not accept table `page`/`limit` as a truncation instruction.
- Return `text/csv; charset=utf-8` with `Content-Disposition: attachment`, not CSV inside the normal JSON success envelope. Existing API errors remain structured; frontend must use a shared download helper when switching from the paged fallback.
- Generate from a single consistent membership snapshot. Use stable `(cohort_id, canonical person ID)` ordering for both people pagination and export. Capture scope, generation time, definition version and row count; expose export row count/time in response headers or agreed metadata.
- Export all records, regardless of UI pagination. If size/time limits require a background job, agree an explicit async contract with status, failure and authenticated expiring download URL. Never silently cap results or return a partial CSV as success.
- A fully tracked empty group returns a header-only CSV with row count zero; the frontend normally disables Download for an empty list. Unavailable/incomplete membership returns an explicit error/coverage reason instead of a misleading zero-row file.
- Apply the same admin/cohort/source authorization as person reads and existing export permission conventions. Record export actor, group, cohort, scope, row count and time in the audit log without copying contact values into logs. Downloads must not be exposed through a public permanent URL.
- Audit membership and contact resolution centrally; do not implement a separate export query whose attendee/follow-up logic can drift from the list and summary.

## 11. Acceptance and delivery checklist

- Preserve existing envelopes/fields and demonstrate additive responses parse with coordinated frontend Zod schemas. Document all new DTO fields before use.
- Reconcile the four named legacy cohorts in section 3 against export evidence, explaining held/unresolved/test-session exclusions separately. Never claim export counts were verified in production.
- Test false check-in plus verification, repeated sessions, both evidence types, null target user with unique cohort/email mapping, conflicting/unresolved identities, and the same email in another cohort. Verify detail, overview and people counts agree.
- Batch attendance/sales/approval joins and index cohort/meeting/identity lookups; avoid query-per-person patterns. Preserve `view_academy` and any applicable financial permissions.
- Return null/unavailable/partial for missing imports, unknown lifecycle, absent cost, unsupported activities or failed dependencies; measured zero remains zero.
- Ensure overview programme/source/status scope is consistent; table text search/page does not change summary or benchmark populations. No silent truncation of the cohort catalog or cohort totals.
- Compare two, three and four cohorts across programmes; verify user order/source persistence, complete chooser, partial failure, deleted/unauthorized cohort handling and stable observation metadata. Reject invalid optional batch requests.
- Confirm source-filtered cost allocation is explicit or unavailable. Confirm a confirmed transaction is not duplicated across commercial cohort totals; refunds/instalments follow the agreed definition.
- Validate all denominator-zero cases, precision, unit costs and return. A known zero cost produces null return, not infinity or zero return.
- Test the inclusive 15% attention boundary, goal-independent example, insufficient peers, zero median, partial data and the distinction between the current inclusive median and proposed other-edition median.
- Verify all five stopped-person counts reconcile with exact paginated memberships; multiple test attempts with one pass must not appear in failed-test follow-up.
- Pro table search, selling filter and sorts apply before pagination and respect coverage. Recruiter-only APs are excluded from sellers.
- For each of the five follow-up groups, export more than 100 matching people and verify cohort/source/search scope, no duplicates, exact membership and all-page row count. Missing contacts remain blank without dropping rows.
- Test exports with quotes, commas, newlines, non-ASCII names, formula-like text, international/leading-zero phone numbers, empty groups, missing groups, partial attendance, permission failures and concurrent membership changes. No failed/cancelled export may save a partial file.
- Activity windows exclude post-sale exposure and unknown attendance; first-sale series handle immature cohorts, zero sellers and missing dates without false winners.
- Supply schema-valid fixtures for tracked, zero, partial, unavailable and per-cohort failure results, plus field definitions and query examples for frontend integration.
- Before commercial/benchmark release, record decisions for attribution, revenue basis/refunds, cost source/allocation, maturity/observation windows and benchmark/alert thresholds. Keep unsupported sections unavailable until those decisions and data exist.

## 12. Evidence and references

Read-only source review; no imports or backend data changes were performed for this handoff.

- Supplied CSV: `C:/Users/Seymart/Documents/abode/abode-academy-export data/meet_verifications_rows.csv`.
- Join source: `meet_sessions_rows.csv` in the same folder.
- Registration joins in that folder: `cohort6_registrations_rows.csv`, `realtor_certification_program_rows.csv`, `realtor_certification_program_august_rows.csv`, `realtor_certification_program_october_rows.csv`.
- Programme/cohort mapping: `abode-be-v2/src/scripts/migrations/academy-migration.ts` and `academy-meetings-apply.ts`.
- Historical migration status: `abode-be-v2/docs/migration/ACADEMY-MIGRATION-README.md`, meeting migration section. Treat its staging import counts as historical evidence, not a live production query.
- Current analytics gap: `abode-be-v2/src/modules/academy/academy-recruitment-analysis.repository.ts` and `academy-recruitment-analysis.derive.ts`.
- Existing API contract: `abode-be-v2/src/modules/academy/dto/recruitment-analysis.dto.ts`, `academy-recruitment-analysis.service.ts`, and frontend `features/recruitment/schemas/recruitment-analysis.schema.ts`.




Backend requirement: add middle name to user signup
I checked the backend repo. Signup uses a NestJS DTO, a Mongoose User model, and AuthUserView to shape user data returned by authentication endpoints. The app rejects request fields that aren’t declared in a DTO, so middleName must be added through this full path to be accepted and saved.

Requirement
- Accept optional middleName in POST /auth/signup. Existing clients that omit it must continue to work.
- Validate it as a string when provided, and trim leading and trailing whitespace, following the existing firstName and lastName DTO pattern.
- Store it as an optional field on the User model. Existing user records should remain valid; no backfill is needed.
- Pass dto.middleName through AuthService.signupUser when creating the user.
- Expose the field in AuthUserView, so it can be returned consistently in authentication responses that use that view.
- Allow users to update it through the profile update endpoint by adding an optional middleName to UpdateProfileDto and the existing profile update flow.
Acceptance criteria
- Signup with a middle name succeeds and saves it.
- Signup without a middle name still succeeds, and existing users without one remain readable.
- Profile reads return the middle name when present.
- Profile updates can set or change it.
- A request with an invalid middle-name type is rejected using the existing DTO validation behavior.