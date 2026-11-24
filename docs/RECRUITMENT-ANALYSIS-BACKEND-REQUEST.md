# Backend request: Recruitment Analysis redesign

Updated: 24 November 2026. This replaces the earlier mock-based requirements in this file.

## 1. What needs to be delivered

The redesigned admin page is `/recruitment/analysis`. The implementation is in `features/recruitment/components/RecruitmentAnalysisPage.tsx`, `RecruitmentAnalysisDashboard.tsx`, `RecruitmentCohortDrawer.tsx`, and `RecruitmentNeedsAttention.tsx`. The visual mock is `recruitment-analysis-redesign.html`; its example numbers must never become production data.

Priorities:

1. **Fix historical attendee counting using meeting verifications.** The affected programmes and cohorts are named in section 3. A false `checked_in` value must not erase valid Supabase meeting-verification attendance.
2. Extend the existing aggregate endpoint with sales values, explicit seller counts by source, outcome definitions, and maturity metadata.
3. Keep the aggregate, cohort drawer, and people drill-down consistent under the same filters.
4. Support outcome comparisons and Needs attention independently of registration goals.

The approved page contains:

| Area | Required data / behaviour |
| --- | --- |
| Filters | Programme, cohort, referral source, cohort stage, and Judge by: Became Pro / Pros selling / ₦ per registrant |
| Four summary cards | Registrants, Became Associate Pro, Now selling, Sales from recruits |
| Recruitment journey | Seven stages, four cards per desktop row, counts, availability, and conversion denominators |
| Goal progress chart | Registrants divided by the cohort's registration goal |
| Volume diagram | Registrants on the horizontal axis; registration-goal progress on the vertical axis |
| Needs attention | Closed comparable cohorts with outcome rates at least 15% below their programme median |
| All cohorts table | Cohort, programme, started date, stage, registrants, became Pro rate, Pros selling rate, ₦ per registrant, vs programme |
| Cohort drawer | Selected cohort metadata, outcome cards, journey, source breakdown, Open people list |
| People dialog | Actual people behind the selected cohort/stage, searchable and paginated |

The date filter, Follow-up queue section, and standalone Active Associate Pros section were removed from the design. Do not make new follow-up or export endpoints a dependency for this release. Existing follow-up response fields remain for backwards compatibility.

## 2. Existing endpoints and current gaps

Paths below are relative to `/api/v1` and require the existing authorized Academy admin read access.

| Endpoint | Status | Work needed |
| --- | --- | --- |
| `GET /admin/academy/recruitment-analysis` | Exists and is used by the frontend | Correct attendance; extend outcome, sales, coverage, and maturity fields |
| `GET /admin/academy/recruitment-analysis?cohort_id=<id>` | Already used by the cohort drawer | Return the same contract scoped to exactly that cohort; preserve selected source |
| `GET /admin/academy/recruitment-analysis/people` | Exists and is used by people dialogs | Apply the same corrected attendance and outcome membership rules; add attendance evidence metadata |

A separate drawer endpoint is **not required**. Reuse the existing aggregate endpoint with `cohort_id`. A separate filter endpoint is also unnecessary while `filter_options` is supplied by the aggregate.

Verified against the local backend source:

- `academy-recruitment-analysis.derive.ts` currently sets `attendee: Boolean(registration.checked_in)` and uses `checked_in_at` for its timestamp.
- `academy-recruitment-analysis.repository.ts` loads meetings but does not load `MeetingVerification` records.
- The service returns `stage_label: null`; the current frontend consequently shows registration-open/closed status, not invented maturity.
- Summary/cohort activity includes `confirmed_sale_only`, `approved_recruit_only`, and `both`. Source comparisons currently return only `active_associate_pros`, which includes sellers and recruiters.
- Sales amounts are not returned. The UI displays unavailable values and disables the monetary Judge by option.

These are source-code observations, not a verification of the current production deployment or database contents.

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

## 4. Aggregate endpoint contract

```http
GET /api/v1/admin/academy/recruitment-analysis?programme_id=<id>&cohort_id=<id>&source=<value>
```

### Filters and UI state

| Parameter | Current status | Required behaviour |
| --- | --- | --- |
| `programme_id` | Supported | Restrict to that programme |
| `cohort_id` | Supported | Restrict to that cohort; validate consistency with programme |
| `source` | Supported | Exact registration referral-source value; apply consistently to summary, journey, table, attention, and drawer |
| `cohort_stage` | Proposed backend addition | Use stable stage codes, including an explicit unknown state; document whether it means registration status or maturity |
| `judge_by` | Proposed backend addition | `upgrades`, `selling`, `sales_per_registrant`; changes comparison/attention metric, not underlying registration counts |

The current frontend sends only programme/cohort/source to the API. Its cohort-stage filter currently applies locally to the table, charts, and Needs attention. If backend stage filtering is implemented for the whole dashboard, update the UI and contract together so all sections have a clearly defined scope. Do not silently send new query fields before DTO support exists.

The date selector was removed. Existing optional `cohort_started_from` / `cohort_started_to` may remain for compatibility but are not new-design requirements.

`cohort_search`, `cohort_sort`, `cohort_direction`, and `cohort_page` are currently frontend URL state. Search and table pagination must not change summary totals or programme-median benchmarks. `people_page` maps to the people endpoint's `page` parameter.

### Preserve the current response structure

Keep the standard `{ success, data, message, meta }` API envelope. The frontend unwraps it once. Retain:

- `generated_at`, echoed `filters`, and `filter_options.programmes/cohorts/sources` with stable IDs/values and names.
- `summary`: `registrants`, `attendees`, `test_participants`, `test_passes`, `course_completions`, `approved_upgrades`, `active_associate_pros`.
- Stage metrics: `{ count, acquired, influenced, unclassified }`, nullable when unavailable. `active_associate_pros` also includes mutually exclusive `confirmed_sale_only`, `approved_recruit_only`, `both`.
- `coverage`: tracked and missing cohort/segment counts for every stage.
- `journey[]`: `stage`, `label`, `count`, `denominator_stage`, `denominator_count`, `conversion_rate`, `tracked_cohorts`, `missing_cohorts`.
- `cohorts[]`: existing identity, programme, event, created date, registration status, `stage_label`, goal, metric objects, activity split, and `missing_stages`.
- `comparison`: programme, event, source, and cohort groups; retain these fields even though the old comparison tabs are no longer rendered.

Stage codes are singular: `registrant`, `attendee`, `test_participant`, `test_pass`, `course_completion`, `approved_upgrade`, `active_associate_pro`. Percentages are numbers on a 0–100 scale; a zero denominator returns null.

The current Zod schemas are in `features/recruitment/schemas/recruitment-analysis.schema.ts`. Coordinate new fields and any definition changes with those schemas. Adding fields only on the backend will not automatically display them in the frontend.

### Required additions for summary, table, and drawer

| Data | Requested field / calculation | Notes |
| --- | --- | --- |
| People actually selling | `selling_associate_pros` count, including coverage | `confirmed_sale_only + both`; recruiter-only activity must not count as selling |
| Sales from recruits | `sales_from_recruits.amount_minor`, `currency`, `availability` | NGN integer kobo; null if unavailable; specify the authoritative confirmed-sale amount and refund/cancellation treatment |
| ₦ per registrant | `sales_per_registrant_minor` | Sales value divided by registrants, null for unavailable value or zero denominator |
| Source-level sellers | `comparison.sources[].selling_associate_pros` | Needed to label the drawer column “Selling”; current `active_associate_pros` is a broader metric |
| Source-level sales | `comparison.sources[].sales_from_recruits` | Same money and availability structure as summary/cohort |
| Cohort maturity | `started_at`, `registration_closed_at`, `maturity_code`, `stage_label`, `maturity_basis` | Use actual lifecycle dates; preserve existing `created_at` and registration `status` |
| Historical attendance | `attendance` metadata from section 3 | Scope to cohort and selected registration-source filter |
| Definition/freshness | `metric_definition_version`, data `generated_at` | Changing approval attribution or maturity rules must be distinguishable from a visual change |

Return seller and money fields at summary, cohort, and source levels so the four summary cards, table, and drawer agree. `Now selling` is a person count; `Sales from recruits` is money. Do not use number of transactions, gross user purchases, or recruiter counts as substitutes.

For amounts, document whether the metric is confirmed paid value or total contracted plan value and use that same definition everywhere. The existing API does not establish this yet. Do not turn unavailable revenue into zero while this is unresolved.

The reference uses maturity bands of under 30 days, 30–90 days, and over 90 days after closing. These are a proposed policy, not something to infer from `created_at`. Supply the true closing date and agree the thresholds before exposing these bands. Until then the implemented card uses explicit registration-closed eligibility and labels it that way.

### Outcome attribution

Keep existing metric definitions stable during an additive rollout. The reference's commercial view assumes an approved upgrade happened after cohort registration, excludes people already Pro on entry from new-Pro conversions, and credits a commercial outcome to one cohort. The existing analysis may count a person across multiple enrolled cohorts; do not silently change those existing counts.

Before enabling revenue totals, define and version the commercial attribution rule. Recommended: credit an approved upgrade and its subsequent eligible sales to the latest eligible cohort registration before that upgrade, with a deterministic tie-break. Each confirmed transaction is credited once. Keep raw cohort registration/attendance membership separately so attendance remains count-once-per-person-per-cohort. Return the attribution rule and already-Pro exclusions so numerator and denominator populations are explainable.

Both selling and approved-recruit activity must occur after the attributed Pro upgrade. Pending/declined upgrades and unconfirmed sales do not qualify. Return null/partial coverage when historical timestamps cannot establish that order.

## 5. Goal progress and Needs attention are different metrics

### Registration goal chart and volume diagram

```text
goal_progress_percent = registrants / registration_goal * 100
```

If the goal is zero/missing, progress is unavailable. Preserve a numeric value above 100% when the target is exceeded; the visual bar may cap at 100%. The volume diagram uses registrants and this goal percentage. It does not diagnose upgrade/sales performance.

### Needs attention

The current frontend calculates this from the complete returned cohort set. No separate endpoint is necessary while those rows remain complete. A backend-generated `needs_attention` block is preferable if cohort pagination or business-rule centralization is introduced.

Required algorithm, matching the implemented card:

1. Apply programme/cohort/source and the declared cohort-stage scope. Use closed cohorts with a valid tracked value and a positive denominator. Do not manufacture maturity from created dates.
2. For `upgrades`, use `approved_upgrades / registrants * 100`. For `selling`, use `selling_associate_pros / approved_upgrades * 100`. The monetary mode remains unavailable until sales data is supplied.
3. Group eligible cohorts by `programme_id`. At least two tracked comparable cohorts are required in a programme. Compute the unweighted median of their metric rates. Exclude null values; a measured zero remains a value.
4. Only compare against a positive median. Flag values at least 15% below that median: `(median - value) / median * 100 >= 15`.
5. Rank by the estimated people needed to reach the median: `(median_percent - value_percent) / 100 * denominator`. The denominator is registrants for upgrades and approved Pros for selling. Break ties by relative gap and then cohort name/ID. Show the top seven, with the total number flagged.
6. Clicking a result opens that cohort's drawer.

Do not rank by registration goal, raw cohort size alone, or raw conversion percentage alone. The reference HTML weights relative gap by cohort size; the current implementation uses the percentage-point difference times the denominator so its “more people at median rate” label is mathematically correct.

Example: two closed cohorts in the same programme each have 100 registrants. Cohort A reached its 100-registration goal but converted only 2 Pros. Cohort B reached 10% of a 1,000-registration goal but converted 30 Pros. Median conversion is 16%; A is flagged at 87.5% below median, representing approximately 14 more upgrades to reach that median. B is not flagged. Goal progress still shows A at 100% and B at 10%.

When there are fewer than two comparable cohorts, missing outcomes, or a zero median, return an insufficient-comparison state rather than claiming every cohort is healthy. Benchmark pools must be independent of table text search and pagination. A selected single cohort can legitimately leave too few peers under the current filter scope; do not silently compare it to a different global population.

Suggested optional aggregate block:

```json
{
  "needs_attention": {
    "metric": "upgrades",
    "eligibility_basis": "registration_closed",
    "threshold_percent": 15,
    "comparable_cohorts": 2,
    "total_flagged": 1,
    "items": [{
      "cohort_id": "cohort-id",
      "programme_id": "programme-id",
      "metric_value": 2,
      "programme_median": 16,
      "below_median_percent": 87.5,
      "denominator_count": 100,
      "estimated_people_gap": 14
    }]
  }
}
```

For the table's `vs programme`, return a signed relative difference if calculated server-side: `(value / median - 1) * 100`. This table currently uses all selected tracked cohort rows; Needs attention uses closed cohorts only. Expose the benchmark population if both calculations move to the backend, rather than implying their medians are always identical.

## 6. Cohort drawer

```http
GET /api/v1/admin/academy/recruitment-analysis?programme_id=<programme-id>&cohort_id=<cohort-id>&source=<optional-source>
```

Return only the requested cohort's summary, journey, source comparisons, coverage, and metadata. Preserve the source filter when opening from the table/charts/Needs attention. Summary cards must never retain all-cohort totals inside a single-cohort drawer.

The drawer needs:

- Cohort and programme names, opened/started date with the actual date basis, registration status/maturity.
- Became Pro percentage, percentage of approved Pros with confirmed sales, sales value/availability.
- All seven journey stages, counts and denominator metadata. Untracked stages stay unavailable.
- Source table with registrants, approved upgrades, confirmed sellers, and sales value. Until explicit seller-by-source values exist, the current UI labels the returned metric “Active APs”.
- Attendance coverage/provenance sufficient to explain migrated legacy cohorts.
- Open people list for this same cohort and source selection.

Missing/deleted cohorts must produce an explicit not-found result or an empty scoped result; never fall back to another cohort's data. Do not require one request per source to build the drawer.

## 7. People endpoint and attendance evidence

```http
GET /api/v1/admin/academy/recruitment-analysis/people?cohort_id=<id>&stage=attendee&page=1&limit=25
```

Keep supported `programme_id`, `cohort_id`, `source`, `stage`, `search`, `page`, and `limit`. Stage codes are listed in section 4. Existing `follow_up` remains compatible. Validate page >= 1 and limit 1–100.

Return the standard paged envelope with `meta.total`, `meta.page`, `meta.limit`, and `meta.totalPages`, and the existing person fields (`id`, `user_id`, name/email, programme/cohort/event, referral source, classification, furthest stage, stalled/follow-up metadata).

Proposed additive attendee fields:

```json
{
  "attendance_source": "meeting_verification",
  "attended_at": "2026-08-27T18:35:00.000Z",
  "attendance_evidence_count": 2,
  "meeting_ids": ["target-meeting-id"],
  "legacy_registration_id": "source-registration-uuid"
}
```

`attendance_source` can be `checkin`, `meeting_verification`, or `both`; use null for a non-attendee. Evidence count is qualifying session/check-in records, not unique attendees. Avoid returning unnecessary raw personal data or the entire verification history by default.

Most importantly, `/people?stage=attendee` must include the same deduplicated people used by `summary.attendees`, journey attendance, and cohort details. A valid legacy meeting verification must qualify even when `checked_in=false`. Keep `was_existing=null` as unclassified; `existing_registrant` in the verification CSV does not prove the person was an existing user before registration.

## 8. Implementation and acceptance checklist

- Load verification records in a bounded batch by relevant meeting IDs, then map identities within cohort. Avoid a per-registration or per-cohort N+1 query pattern.
- Index the meeting/cohort and verification identity joins appropriately; existing verification unique `(meeting, email)` protects session records but does not replace cohort deduplication.
- Reuse one attendance/outcome derivation for all views and filter paths. Invalidate cached aggregates after attendance reconciliation, verification, upgrade approval, and sale/refund changes.
- Preserve backend RBAC on aggregates and person-level lists. Return explicit error/partial coverage on source failures instead of an all-zero successful response.
- Verify source/programme/cohort filters scope every returned count and drawer correctly; keep table pagination from changing median benchmarks.
- Reconcile the four named legacy cohorts against the source counts above, documenting held/unresolved/administrative rows separately. Repeated sessions and combined check-in/verification must count a person once per cohort.
- Test check-in false plus valid verification, both evidence types, repeated sessions, null target user with a unique registration/email match, unresolved/conflicting identities, and a same-email registration in another cohort.
- Ensure an incomplete attendance import is not marked fully tracked solely because a meeting ended.
- Confirm people totals equal the aggregate count for the same stage and filters, including legacy attendance.
- Confirm sellers exclude recruiter-only APs and monetary metrics do not duplicate a transaction across cohorts.
- Confirm the goal-progress/Needs-attention example in section 5 returns different results; test the inclusive 15% boundary, zero/null denominators, zero medians, single-peer groups, and metric switching.
- Verify loading, empty, error, and unavailable-data responses remain renderable through the frontend Zod schema.

## 9. Evidence and references

Read-only source review; no imports or backend data changes were performed for this handoff.

- Supplied CSV: `C:/Users/Seymart/Documents/abode/abode-academy-export data/meet_verifications_rows.csv`.
- Join source: `meet_sessions_rows.csv` in the same folder.
- Registration joins in that folder: `cohort6_registrations_rows.csv`, `realtor_certification_program_rows.csv`, `realtor_certification_program_august_rows.csv`, `realtor_certification_program_october_rows.csv`.
- Programme/cohort mapping: `abode-be-v2/src/scripts/migrations/academy-migration.ts` and `academy-meetings-apply.ts`.
- Historical migration status: `abode-be-v2/docs/migration/ACADEMY-MIGRATION-README.md`, meeting migration section. Treat its staging import counts as historical evidence, not a live production query.
- Current analytics gap: `abode-be-v2/src/modules/academy/academy-recruitment-analysis.repository.ts` and `academy-recruitment-analysis.derive.ts`.
- Existing API contract: `abode-be-v2/src/modules/academy/dto/recruitment-analysis.dto.ts`, `academy-recruitment-analysis.service.ts`, and frontend `features/recruitment/schemas/recruitment-analysis.schema.ts`.
