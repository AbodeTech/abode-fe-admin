# Frontend TODO: Site Manager and Surveyor Tracking

This covers the admin frontend and the separate restricted field web application.

## Shared contracts and authentication

- [ ] **Goal: Use the current Admin identity safely.** Integrate field login, forced password change, session refresh, logout and current-user responses without exposing admin navigation.
- [ ] **Goal: Send invited staff to the right application.** Route Site Manager and Surveyor roles into the field app after authentication.
- [ ] **Goal: Keep access assignment-aware.** Show only assets and actions returned by field-scoped APIs and handle ended/no-assignment states clearly.
- [ ] **Goal: Fail visibly on contract drift.** Add strict Zod schemas for invitations, profiles, assignments, targets, submissions, reviews, effects and analytics.

## Admin staff and invitation

- [ ] **Goal: Invite field staff from one clear screen.** Add Invite Staff with name, email, phone, role and invitation summary.
- [ ] **Goal: Explain access before sending.** Show that the invitee receives temporary credentials, must change password and gets restricted field-app access.
- [ ] **Goal: Manage the field roster.** Build Site Manager and Surveyor lists with invitation/account state, assignments, current month setup and pending reviews.
- [ ] **Goal: Preserve history when access changes.** Add disable/reactivate and assignment-ending controls with impact explanations.

## Admin assignments and targets

- [ ] **Goal: Assign one person to several assets.** Build create/end assignment flows with effective dates and assignment history.
- [ ] **Goal: Put people before assets in performance navigation.** Start with the role roster, then person, then assigned asset, then month.
- [ ] **Goal: Configure only relevant monthly work.** Build target rows with metric, target, unit and weight; show live 100% validation.
- [ ] **Goal: Keep unavailable metrics absent.** Do not show physical allocation in the Site Manager target picker and do not show Surveyor Inspection.
- [ ] **Goal: Make target lifecycle understandable.** Support draft, publish, revise with reason, history, finalise and restatement states.

## Admin dashboards

- [ ] **Goal: Explain each person's score.** Show target, verified actual, pending actual, achievement, weight, earned score, cap and source count.
- [ ] **Goal: Show weekly movement.** Add weekly bars/rows within the selected month without changing the monthly scoring basis.
- [ ] **Goal: Compare fairly.** Show metric composition and target coverage beside rankings and trends.
- [ ] **Goal: Surface action needed.** Show pending verification, old submissions, missing targets, invalid weights and below-target metrics.
- [ ] **Goal: Drill into every number.** Link actuals and scores to filtered source submissions.

## Admin verification

- [ ] **Goal: Match the asset-transaction review pattern.** Build a verification queue with role, staff, asset, metric, quantity, submitted time and evidence state.
- [ ] **Goal: Show the whole record before deciding.** Detail shows screenshots, receipt, work note, measurements, selected plots, current asset/plot state, proposed after-state, cost impact and score impact.
- [ ] **Goal: Verify everything in one decision.** Provide Verify Submission and Reject Submission with required rejection note; do not add a Finance handoff.
- [ ] **Goal: Prevent accidental duplicate approval.** Show duplicate warnings and an already-reviewed state, and disable repeat decisions.
- [ ] **Goal: Explain resulting changes.** Before approval, state exactly which Site Setup, plot history, cost and performance values will change.

## Field application shell

- [ ] **Goal: Keep the app focused.** Build mobile-first Home, Work, History and Profile navigation without admin modules.
- [ ] **Goal: Let staff switch assigned sites.** Add an assigned-site selector that persists locally but never bypasses backend authorization.
- [ ] **Goal: Make offline/network state explicit.** Preserve drafts locally where safe, show upload progress and do not claim submission success until the backend confirms it.
- [ ] **Goal: Keep allocation pinned.** Do not include an allocation scanner, allocation target, allocation progress or allocation score.

## Site Manager field experience

- [ ] **Goal: Show the current responsibility.** Display fencing target, verified and pending metres, side breakdown, score contribution and latest review results.
- [ ] **Goal: Submit one complete fencing record.** Build Report Fencing with five visible sections: site/date; side/metres/new-or-repair/start/end/note; photos; spending and receipt; review summary.
- [ ] **Goal: Keep evidence attached to work.** Remove standalone Upload Evidence and put every photo/receipt inside its submission.
- [ ] **Goal: Make drafts recoverable.** Support Save Draft, validation summary, submission confirmation and unsaved-change protection.
- [ ] **Goal: Explain submission state.** Build My Submissions with draft, submitted, verified, rejected, corrected and reversed states plus reviewer notes.
- [ ] **Goal: Show verified downstream effects.** Submission detail identifies the fencing history, performance actual and cost record created by verification.

## Surveyor field experience

- [ ] **Goal: Show three agreed measures only.** Display parcelated plots, established boundary metres and cleared sqm for each assigned site/month.
- [ ] **Goal: Make work type control the form.** Change quantity unit and required fields when Parcelation, Boundary Established or Land Cleared is selected.
- [ ] **Goal: Select exact parcelated plots.** Add searchable block/plot selection, selected plot chips/table, derived count and combined sqm.
- [ ] **Goal: Select cleared plots when they exist.** Show combined selected area, actual cleared sqm and full/partial clearing per plot.
- [ ] **Goal: Support pre-plot clearing.** Offer “Plots not created yet” with sqm, area description, markers/coordinates, photos and sketch upload.
- [ ] **Goal: Capture one complete Surveyor submission.** Include site/date, work type, quantity/mapping, evidence, spending/receipt and review summary.
- [ ] **Goal: Show weekly progress.** Present submitted, pending, verified and remaining quantity by week and month.
- [ ] **Goal: Explain later plot linking.** Show when an unmapped clearing record has been connected to plots without counting it again.

## Asset integration

- [ ] **Goal: Show operational plot history.** Add parcelated and cleared states, quantities, dates, Surveyor and source submission to Plot Inventory/detail.
- [ ] **Goal: Keep commercial inventory separate.** Do not change sold, available or customer allocation labels because a plot was cleared or parcelated.
- [ ] **Goal: Update Site Setup from verified work.** Refresh fencing, clearing, parcelation and boundary views after verification/correction.
- [ ] **Goal: Link costs to their field source.** Cost detail opens the verified submission, evidence and reviewer history.
- [ ] **Goal: Keep history understandable.** Add field-work events to the asset timeline without duplicating domain history.

## Responsive, accessibility and testing

- [ ] **Goal: Make field work practical on phones.** Keep inputs, photo capture, plot selection and submission actions usable at phone widths.
- [ ] **Goal: Make evidence accessible.** Provide file names, upload states, remove/replace actions and text alternatives.
- [ ] **Goal: Preserve keyboard access.** Make admin queues, plot selectors, dialogs and review decisions fully keyboard operable.
- [ ] **Goal: Prove complete workflows.** Test invite/login/password change, assignments, target publication, draft recovery, submission, verification, rejection, correction and asset refresh.
- [ ] **Goal: Prove pinned scope stays absent.** Test that allocation and Surveyor Inspection controls do not render.
