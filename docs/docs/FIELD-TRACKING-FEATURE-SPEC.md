# Site Manager and Surveyor Tracking: Feature Specification

## Purpose

This feature gives Abode a reliable record of physical work performed on every estate and a fair monthly performance view for the staff responsible for that work.

The system must answer four simple questions:

1. Who was responsible for this site during the month?
2. What target did the admin give them?
3. What work did they report, and what evidence did they provide?
4. What did an admin verify, and how did that verified work change the asset and the person's score?

Site Managers and Surveyors use a restricted field web application. They do not receive the full admin frontend. Both applications use the same backend and Admin identity/role system already present in `abode-be-v2`.

## Current-system basis

The current backend already has:

- Admin invitation at `POST /admin/invite`, which creates an Admin identity, assigns a role, emails temporary credentials and requires a password change.
- Editable roles and permissions.
- Admin JWT authentication and `must_change_password` enforcement.
- Associate Manager and CS Manager patterns for assignments, targets, dashboards, audit history and permissions.
- Assets, blocks and exact plots.
- Admin action logging.

The current system does not have Site Manager or Surveyor modules, asset assignments, field submissions, field verification, or dedicated permissions for these roles.

## People and access

### Admin

An authorised admin can:

- Invite a Site Manager or Surveyor.
- Assign one person to one or more assets with effective dates.
- Set monthly targets and weights per person and asset.
- Review complete field submissions, including screenshots, quantities, receipts and spending.
- Verify or reject the whole submission.
- See performance, trends, pending work and history.
- End or replace an assignment without rewriting historical ownership.

### Site Manager

A Site Manager can:

- Log in through the restricted field application.
- See only assigned assets.
- See published monthly targets.
- Report fencing work.
- Report project delivery when that metric is later activated.
- See assigned Site Inspection events and inspection progress when that metric is activated.
- View client-rating results when that workflow is activated and permissions allow it.
- See draft, submitted, verified, rejected and corrected submissions.

Physical allocation is deliberately excluded from the Site Manager performance score and field application for now. On-site connectivity is not reliable enough to prove allocation through live scanning. Existing allocation and plot information remains in the asset administration system.

### Surveyor

A Surveyor can:

- Log in through the restricted field application.
- Switch between assigned assets.
- See published monthly targets.
- Report plots parcelated.
- Report land boundary established in metres.
- Report land cleared in sqm.
- Select exact plots where those plots already exist.
- Submit an unmapped clearing area when clearing happens before plots exist.
- See weekly progress, monthly achievement and submission history.

Surveyor Inspection is not part of this feature.

## Shared lifecycle

### 1. Invite and activate

The admin chooses Site Manager or Surveyor, enters the staff member's identity details and sends an invitation using the existing Admin invite flow. The role limits the account to field APIs and the restricted frontend. The staff member logs in with the temporary credentials and must change the password before accessing operational screens.

### 2. Assign assets

The admin assigns the staff member to one or more assets. Each assignment stores start date, optional end date, responsibility and status. Ending an assignment does not delete earlier targets, submissions or scores.

### 3. Set monthly targets

Targets belong to a staff member, asset and month. The admin selects only relevant metrics. Included weights must total 100% before publication. Draft targets may remain incomplete. Published changes require a reason and create a new version.

### 4. Report work

The staff member creates a draft and submits one complete record. Evidence belongs to that record; there is no standalone Upload Evidence action.

### 5. Verify once

An authorised admin reviews the submission in a transaction-style screen. The screen shows the person, asset, work date, quantity, screenshots, receipt, spending and earlier asset position. One decision verifies or rejects the complete submission. There is no separate Finance handoff.

### 6. Apply verified effects

Verification must be atomic and idempotent. It updates:

- Submission status and review history.
- Monthly verified performance actual.
- Permanent Site Setup or plot operational history.
- Linked verified asset cost when an amount was reported.
- Asset audit timeline.

If any required update fails, none of them are committed.

## Site Manager metrics

### Fencing covered

The monthly target is measured in metres. It may be one total or include front, right, back and left targets.

The Report Fencing form contains:

1. Site and work date.
2. Boundary side, metres, new fencing or repair, start reference, end reference and work note.
3. Start-point, end-point and wide-view photos.
4. Amount spent, vendor/payee, reference, receipt and spending note.
5. Review summary.

Only verified new fencing increases boundary coverage and performance. Repair remains in history and cost reporting but does not create new boundary coverage.

### Projects delivered

Project Delivered remains a planned metric until project baseline, milestones, evidence and acceptance rules are agreed. It must not be implemented as a manually typed completed count.

### Client ratings and Site Inspections

These remain planned workflows to be defined in their own design pass. They do not block fencing and Surveyor delivery.

### Physical allocation

Pinned. It is not available as a target, submission, scan action or score. It may return only after an offline-safe or otherwise dependable confirmation method is approved.

## Surveyor metrics

### Plots parcelated

Where exact plots exist, the Surveyor selects the plot IDs, such as A-1, A-2 and B-2. The system derives plot count and total configured sqm. The Surveyor cannot type a different count.

A verified parcelation marks the selected plots as physically parcelated and adds a dated history entry. It does not allocate the plots to customers or change commercial sold/available inventory.

### Land boundary established

This records the distance the Surveyor physically surveyed or marked during the month. It is different from fencing construction.

The accepted asset boundary remains a versioned Site Setup fact. A Surveyor submission may propose a measurement change, but changing the approved boundary requires an explicit admin acceptance inside verification.

### Land cleared

When plots exist, the Surveyor selects them and the system shows their combined sqm. The Surveyor records actual sqm cleared and whether each selected plot was fully or partially cleared.

When plots do not exist, the Surveyor records an unmapped clearing area with sqm, description, reference markers or coordinates, photos and optional supporting sketch. An admin may link it to plots later without recreating or recounting the work.

## Plot operational history

Every plot should be able to show:

- Parcelated status, date, Surveyor and submission.
- Cleared sqm and whether clearing is partial or complete.
- Boundary work references where applicable.
- Verified amount spent allocated to that work.
- Evidence and correction/reversal history.

These are operational states. They do not change customer ownership, sale status or exact allocation.

## Performance calculation

For every published metric row:

```text
achievement = verified actual / target
score contribution = min(achievement, 1) × weight
monthly score = sum of included metric contributions
```

The UI also shows pending quantities and a separately labelled projected score. Pending work never enters the verified score.

## Corrections

- A draft may be edited or deleted by its creator.
- A submitted record may be withdrawn only before review.
- A rejected record may be corrected and resubmitted while preserving the original attempt.
- A verified record is never overwritten or deleted.
- An authorised correction creates an adjustment or reversal, recalculates the affected Site Setup, cost and performance views, and preserves the original history.

## Out of scope for this delivery

- Site Manager physical-allocation scoring or QR scanning.
- Surveyor Inspection.
- Site Inspection and client-rating implementation until their detailed workflow is approved.
- Project Delivered scoring until completion rules are approved.
- Requiring section hierarchies or layout versions for Surveyor reporting.

## Success criteria

The feature is successful when a newly invited field worker can activate an account, see only assigned sites, understand the month's responsibility, submit complete work with evidence and spending, receive a clear verification outcome, and see verified work reflected once in performance, asset physical history and asset cost.
