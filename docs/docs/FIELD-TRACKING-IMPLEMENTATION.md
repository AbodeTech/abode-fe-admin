# Implementation Plan: Site Manager and Surveyor Tracking

## Delivery goal

Build one field-operations foundation that supports restricted staff authentication, effective-dated asset assignments, flexible monthly scorecards, evidence-backed work submissions, one-step admin verification and atomic updates to performance, Site Setup, plot history and asset costs.

## Architecture decision

Use the existing Admin identity and role system for Site Managers and Surveyors.

Reasons grounded in the current backend:

- `AdminService.inviteAdmin` already creates an identity, assigns a role, emails temporary credentials and sets `must_change_password`.
- Admin JWT authentication already reloads roles and permissions.
- Permissions already protect controllers independently of role names.
- Associate Manager and CS Manager already model operational staff using Admin-linked records and management dashboards.

The separate field web application is therefore a restricted client of the same authentication system. It must not depend on hidden admin UI controls for security.

## Proposed backend modules

```text
src/modules/field-staff/
  field-staff.module.ts
  profiles/
  assignments/
  scorecards/
  submissions/
  verification/
  analytics/
  site-manager/
  surveyor/
```

Shared infrastructure belongs in `field-staff`; role-specific validation belongs in `site-manager` and `surveyor`. Do not force this work into Associate Manager or CS Manager collections.

## Core records

### FieldStaffProfile

- `admin_id`
- `staff_type: site_manager | surveyor`
- `status`
- optional employee/reference fields
- timestamps

### FieldAssetAssignment

- `staff_profile_id`
- `asset_id`
- `starts_on`
- `ends_on`
- `responsibility`
- `status`
- `created_by`
- history/audit metadata

### FieldMonthlyScorecard

- staff, role, asset, year, month and timezone
- `draft | published | finalised | restated`
- version and prior-version reference
- target rows containing metric key, target, unit and weight
- publication/finalisation actor and timestamps

### FieldSubmission

Shared envelope:

- staff, assignment, asset, scorecard/month
- metric type and role type
- work date
- draft/submitted/verified/rejected/withdrawn/corrected/reversed status
- evidence references
- amount spent, vendor/payee, reference and receipt
- submit/review/revision actors and timestamps
- idempotency key

Role-specific payload:

- Fencing: side, metres, new/repair, start/end references and note.
- Parcelation: exact plot IDs and derived plot count/sqm.
- Boundary: established metres, references and optional proposed side measurements.
- Clearing: exact plot mapping or unmapped area, actual sqm and full/partial details.

### FieldVerificationEffect

Store a unique effect record per submission and effect type:

- performance actual
- Site Setup/history
- plot operational history
- asset cost
- audit timeline

This makes retries idempotent and lets corrections reverse the precise derived records.

## Endpoint outline

### Admin

```text
POST   /admin/field-staff/invite
GET    /admin/field-staff
GET    /admin/field-staff/:id
POST   /admin/field-staff/:id/assignments
PATCH  /admin/field-staff/:id/assignments/:assignmentId/end
GET    /admin/field-staff/:id/assignments

POST   /admin/field-scorecards
GET    /admin/field-scorecards/:id
PATCH  /admin/field-scorecards/:id
POST   /admin/field-scorecards/:id/publish
POST   /admin/field-scorecards/:id/revise
POST   /admin/field-scorecards/:id/finalise
POST   /admin/field-scorecards/:id/restate

GET    /admin/field-submissions
GET    /admin/field-submissions/:id
POST   /admin/field-submissions/:id/verify
POST   /admin/field-submissions/:id/reject
POST   /admin/field-submissions/:id/correct
POST   /admin/field-submissions/:id/reverse

GET    /admin/field-performance/summary
GET    /admin/field-performance/staff/:staffId
GET    /admin/field-performance/assets/:assetId
```

### Field application

```text
GET    /field/me
GET    /field/me/assets
GET    /field/me/dashboard
GET    /field/me/scorecards/current
GET    /field/me/submissions
POST   /field/me/submissions
PATCH  /field/me/submissions/:id
POST   /field/me/submissions/:id/submit
POST   /field/me/submissions/:id/withdraw
GET    /field/assets/:assetId/plots/selectable
```

### Asset integration

```text
GET    /admin/assets/:assetId/site-setup
GET    /admin/assets/:assetId/plots
GET    /admin/assets/:assetId/field-history
POST   /admin/field-submissions/:id/link-plots
```

## Verification transaction

The verify command must:

1. Reload the submitted record and active reviewer permissions.
2. Reject an already reviewed or stale revision.
3. Revalidate the staff assignment on the work date.
4. Revalidate quantity, selected plots and duplicate warnings.
5. Mark the submission verified.
6. Create the performance actual effect.
7. Create the Site Setup or plot operational-history effect.
8. Create the verified asset-cost effect when amount spent is present.
9. Create AdminActionLog and asset-timeline references.
10. Commit once and invalidate affected caches after commit.

Every derived record uses the submission ID and effect type as a unique source key.

## Fencing implementation

- Use the approved Asset boundary as the comparison baseline.
- New fencing increases verified coverage by side.
- Repair creates history and cost but does not increase new coverage.
- Allow an admin to verify work beyond the monthly target; score remains capped, while the uncapped achievement is returned.
- Warn and require a note when cumulative new fencing exceeds the approved physical side length.
- Verification accepts metres, evidence and spending together.

## Parcelation implementation

- Load plot IDs from the existing Allocation module.
- Derive count and sqm on the server.
- Add operational parcelation history rather than reusing `allocated` status.
- Repeated parcelation is rework and requires a reason; it must not automatically increase the normal target actual.

## Clearing implementation

For mapped clearing:

- Derive combined selected plot area.
- Store actual sqm cleared.
- Maintain per-plot cumulative cleared sqm, capped at plot size for current-state display.
- Keep repeated/re-clearing work in history and cost without inventing new land.

For unmapped clearing:

- Store sqm, description, markers/coordinates, photos and sketch.
- Show `unmapped` until an admin links it.
- Linking plots changes mapping only; it does not create another score or cost.

## Boundary implementation

- Surveyor established metres are performance output.
- Optional proposed front/right/back/left changes are review inputs.
- Verification may accept the work but must explicitly indicate whether the proposed asset boundary version is also accepted.
- Fencing history remains unchanged when a boundary version changes; only remaining distance is recalculated.

## Performance read model

Compute verified actuals from verification effects, not mutable submission totals. Return:

- target and unit
- verified and pending actual
- uncapped achievement
- capped earned score
- weight
- source counts
- weekly buckets
- target version
- scorecard state

Finalised months store a snapshot. Later corrections require restatement.

## Frontend applications

### Admin frontend

Add Field Performance navigation with:

- Site Managers
- Surveyors
- Review Queue
- person/asset/month scorecards
- assignment and target management
- transaction-style verification detail

Asset Detail consumes verified field effects through Site Setup, Plot Inventory, Costs and Updates.

### Field frontend

Use a mobile-first shell with:

- Home
- Work
- History
- Profile

The field frontend shares authentication endpoints but has its own route map and permission gate. No admin sidebar or unrestricted asset API is included.

## Implementation order

1. Add roles, permissions and field-app authentication checks.
2. Add profiles and effective-dated asset assignments.
3. Add scorecard schemas, publication rules and admin setup APIs.
4. Add shared drafts, evidence and submission lifecycle.
5. Implement Site Manager fencing end to end.
6. Implement Surveyor parcelation with exact plots.
7. Implement Surveyor clearing with mapped and unmapped areas.
8. Implement Surveyor boundary work and optional boundary revision.
9. Add unified verification effects and asset-cost integration.
10. Add dashboards, weekly progress, finalisation and restatement.
11. Add asset Site Setup, Plot Inventory and timeline integration.
12. Complete migrations, authorization tests, transaction tests and rollout gates.

## Release gates

- Field roles cannot reach unrelated admin routes.
- An ended assignment cannot create new work.
- Published weights equal 100%.
- One submission cannot affect any total twice.
- Verification rolls back fully when any derived effect fails.
- Plot parcelation/clearing never changes commercial inventory or customer allocation.
- Unmapped clearing can be linked without recounting work.
- Costs always link back to the verified source submission.
- Physical allocation and Surveyor Inspection are absent.
