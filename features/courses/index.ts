/* Courses — the Academy domain.
 *
 * abode-be-v2's `course` module (courses, learners, credentials, quizzes,
 * modules, content blocks, media upload — distinct from the older `academy`
 * module) is fully built on the BE as of staging `7fefe13` (confirmed
 * against source in Abode-Combine/Abode-Backend/abode-be-v2). All 7 screens
 * are wired to it. See docs/COURSE-LEARNERS-BACKEND-GAPS.md for the handful
 * of real backend gaps (credential data missing from learner rows, no
 * courses-summary aggregate, etc.) and docs/REST-ENDPOINT-MAP.md for the
 * full endpoint list.
 *
 * `POST /admin/credentials/:id/{revoke,reinstate}` need a `credential_id` the
 * learner-report endpoints don't return — those stay unreachable until that
 * gap closes, not from lack of wiring. `GET /admin/quiz-settings/:id` also
 * has a hook (`useQuizSettings`) with no call site — redundant with what
 * `useCourseQuiz` already fetches via the list route, so nothing calls it
 * yet. Every other route in the course module is consumed somewhere.
 *
 * Screens (docs reference: course-system-admin.html):
 *  1. Courses list — ✅ real
 *  2. Course · Overview (details, first-sale path, credential, publishing) — ✅ real
 *  3. Course · Modules (drag-to-reorder) — ✅ real
 *  4. Module editor (content blocks, media upload) — ✅ real
 *  5. Course · Quiz (questions, options, grading settings) — ✅ real
 *  6. Course · Learners, inside one course — ✅ real
 *  7. Learners, across every course (the sidebar item) — ✅ real
 */

// ── list ─────────────────────────────────────────────────────────────────
export { CoursesTable } from './components/list/CoursesTable';
export { CourseFilterChips } from './components/list/CourseFilterChips';
export { CourseSearch } from './components/list/CourseSearch';
export { CreateCourseDialog } from './components/list/CreateCourseDialog';

export { DEFAULT_COURSE_LIMIT } from './hooks/use-course-list';

// ── detail shell + tabs ────────────────────────────────────────────────────
export { CourseDetailShell } from './components/detail/CourseDetailShell';
export { CourseOverview } from './components/detail/CourseOverview';
export { CourseModules } from './components/detail/modules/CourseModules';
export { ModuleEditorShell } from './components/detail/modules/ModuleEditorShell';
export { ModuleEditor } from './components/detail/modules/ModuleEditor';
export { CourseQuiz } from './components/detail/quiz/CourseQuiz';
export { CourseLearners } from './components/detail/learners/CourseLearners';

// ── learners, across every course (screen 7) ───────────────────────────────
export { GlobalLearners } from './components/learners/GlobalLearners';

export type { CourseListFilters } from './hooks/query-keys';

// ── credential.state — derived, never stored (see credential-state.ts).
// Unused today: the BE row carries no credential fields yet
// (docs/COURSE-LEARNERS-BACKEND-GAPS.md §2). Kept for when it does. ──────────
export { deriveCredentialState, credentialStateLabel, formatDate, formatDaysAgo } from './credential-state';
export type { CredentialState } from './credential-state';

// ── learners (screens 6–7) ──────────────────────────────────────────────────
export {
  DEFAULT_LEARNERS_LIMIT,
  useCourseLearners,
  useAllLearners,
  useCourseLearnersExport,
  useAllLearnersExport,
} from './hooks/use-learners';
export type { CourseLearnersFilters, AllLearnersFilters } from './hooks/use-learners';
export type {
  LearnerRef,
  CourseProgress,
  LearnerQuizAttempts,
  EnrolmentRow,
  GlobalEnrolmentRow,
} from './schemas/learner.schema';

// ── list/detail/publish CRUD (screens 1-2) ─────────────────────────────────
export { useCourseList, useCourseSummary, useCreateCourse } from './hooks/use-course-list';
export type { CourseSummary } from './hooks/use-course-list';
export {
  useCourseDetail,
  useUpdateCourse,
  usePublishCourse,
  useUnpublishCourse,
  useDeleteCourse,
  useAcademySettings,
  useSetFirstSalePath,
} from './hooks/use-course-detail';

export { COURSE_AUDIENCES, COURSE_AUDIENCE_LABELS, COURSE_STATUSES, COURSE_STATUS_LABELS } from './schemas/course.schema';
export type {
  Course,
  CourseAudience,
  CourseStatus,
  CourseDetail,
  CourseModuleRef,
  ContentBlockRef,
} from './schemas/course.schema';
export type { AcademySettings } from './schemas/academy-settings.schema';

// ── modules & content blocks (screens 3-4) ─────────────────────────────────
export { useModules, useCreateModule, useUpdateModule, useDeleteModule, useReorderModules } from './hooks/use-modules';
export {
  BLOCK_TYPES,
  useBlocks,
  useCreateBlock,
  useUpdateBlock,
  useDeleteBlock,
  useReorderBlocks,
} from './hooks/use-blocks';
export type { BlockType, CreateBlockPayload } from './hooks/use-blocks';

// ── media upload pipeline (screen 4) ────────────────────────────────────────
export { useUploadMedia, useCreateExternalMedia, useMediaStatus, useDeleteMedia } from './hooks/use-media';
export type { UploadProgress } from './hooks/use-media';
export { MEDIA_KINDS, MEDIA_STATUSES } from './schemas/media.schema';
export type { MediaAsset, MediaKind, MediaStatus, UploadTicket } from './schemas/media.schema';

// ── quiz authoring, learner-preview, grade-preview (screen 5) ──────────────
export {
  useCourseQuiz,
  useModuleQuizzes,
  useQuizSettings,
  useCreateQuizSettings,
  useUpdateQuizSettings,
  useDeleteQuizSettings,
  useQuizQuestions,
  useCreateQuizQuestion,
  useUpdateQuizQuestion,
  useDeleteQuizQuestion,
  useLearnerPreview,
  useGradePreview,
} from './hooks/use-quiz';
export type { CourseQuizInfo, CreateQuizSettingsPayload, UpdateQuizSettingsPayload, QuizQuestionPayload, UpdateQuizQuestionPayload } from './hooks/use-quiz';
export type { QuizOption, QuizSettings, QuizQuestion, LearnerQuiz, GradeResult } from './schemas/quiz.schema';
