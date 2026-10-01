# Course module — backend gaps

For the `abode-be-v2` team, re: the `course` module (`src/modules/course/*`). Confirmed against source, staging `7fefe13`.

## 1. `GET /admin/courses/:id/learners` drops `course` and `quiz_stats` — bug

`LearnerReportService.courseLearners()` (`learner-report.service.ts:26-47`) returns `{ course, quiz_stats, data: rows, meta }`. The handler has no `@SkipTransform()`, so `TransformInterceptor`'s `data: data?.data ?? data` unwraps to the inner `data` (the rows) and silently drops the outer `course` and `quiz_stats` keys. The client never sees them.

**Impact:** no quiz struggle/pass-rate stats on the course-learners screen; course title/status has to come from a separate `GET /admin/courses/:id` call.

**Fix:** rename the service's inner key (e.g. `learners` instead of `data`), or add `@SkipTransform()` and shape the envelope in the handler.

## 2. Learner rows carry no credential data — bug / missing capability

`LearnerReportService.buildRows()` (`learner-report.service.ts:79-132`) never touches `CredentialRepository`. No `credential_id`, `state`, `issued_at`, `expires_at`, or `revoked_at` on `GET /admin/courses/:id/learners` or `GET /admin/learners`.

**Impact:** can't show real certified/expiring/expired status per learner. `POST /admin/credentials/:id/revoke` and `.../reinstate` need a credential id that's nowhere discoverable from an admin route — `CredentialRepository.findFor(userId, courseId)` exists but isn't exposed.

**Fix:** join credential state into `buildRows()` (per-row or batched lookup), or add `GET /admin/credentials?course_id=&user_id=`.

## 3. No `/admin/courses/summary` endpoint — missing capability

No summary/stats route on `CourseAdminController`. `shapeCourse()` also returns no module/learner/completion counts on the list or bare course record — the only real counts anywhere are `GET /admin/courses/:id`'s embedded `modules.length` and `GET /admin/courses/:id/learners`'s `meta.total`.

**Impact:** filter-chip counts need 5 separate `limit=1` list calls as a workaround instead of one request.

**Fix:** `GET /admin/courses/summary` → `{total, published, draft, realtor, buyer}`.

## 4. `LearnerReportQueryDto` has no status or search filter — missing capability

`dto/learner-requests.dto.ts` only accepts `page`, `limit`, `course_id`. No `status` (completed/in-progress), no `search` (learner name/email).

**Impact:** no server-correct way to filter learners by status or search by name — a client-side filter would only apply to the current page.

**Fix:** add `status?: 'completed' | 'in_progress'` (derived from `completed_at != null`) and `search?: string` to the DTO and `learner.repository.ts`.

## 5. No "last active" timestamp on enrolment — low priority

`Enrolment` has `started_at`/`completed_at`/`last_block_id` only, no `last_activity_at`. `BlockProgress` writes aren't surfaced on the learner row.

**Impact:** can't build a "stalled" (progress but gone quiet) segment.

**Fix:** low priority. `BlockProgress.updated_at` (max per enrolment) is the cheapest source if this becomes worth having.

## 6. `GET /admin/learners` is one row per enrolment, not per associate — open question

`LearnerReportService.allLearners()` paginates `listAllEnrolments()` directly, no `$group` by `user_id`. An associate in 3 courses = 3 rows. Not a bug, but worth confirming this flat shape (vs. a per-associate rollup) is the intended one — no BE action unless product asks for the rollup, which would need a new aggregating endpoint (client-side rollup across paginated enrolments doesn't work correctly).

## 7. `academy_settings` returns only an id, no title — minor

`CourseAdminService.getSettings()` returns `{first_sale_path_course_id}` only. A caller wanting the current holder's name needs a separate course lookup.

**Fix:** low priority. `getSettings()` could join `title` the way `updateSettings()` already loads the course to validate it.

## 8. First-sale-path has no audience check on the BE — open question

`updateSettings()` only checks `status === 'published'`; no `audience` check. A `buyer`-only course could technically be set as first-sale path, though the design describes that checkpoint as realtor-only. FE enforces this client-side only.

**Fix:** add an audience check to `updateSettings()` if this should be enforced server-side too; otherwise no action needed.

---

**Priority:** §2 blocks the most (real cert status + revoke/reinstate). §1 is a small fix losing real computed data. §3 and §4 are small and each unblock a real UI capability. §5–§8 are low priority or open questions.
