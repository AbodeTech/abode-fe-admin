/* Courses — the Academy domain.
 *
 * 🚧 Design preview, not integrated — abode-be-v2 has no courses endpoints
 * yet. All seven screens run entirely on the dummy-*.ts files in this
 * directory (see each file's header). The REST-shaped hooks/schemas/mocks
 * below are already written for when the BE ships /admin/courses (see
 * docs/REST-ENDPOINT-MAP.md), but nothing on any screen calls them right
 * now — swap the dummy data for useCourseList / useCourseDetail etc. at
 * that point.
 *
 * Screens (docs reference: course-system-admin.html):
 *  1. Courses list
 *  2. Course · Overview (details, first-sale path, credential, publishing)
 *  3. Course · Modules (drag-to-reorder, require-in-order)
 *  4. Module editor (content blocks, video upload/processing states)
 *  5. Course · Quiz (questions, options, grading settings)
 *  6. Course · Learners, inside one course
 *  7. Learners, across every course (the sidebar item)
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

// ── dummy data (every screen runs on this — see each file's header) ───────
export { DUMMY_COURSES, DUMMY_ACADEMY_SETTINGS } from './dummy-data';
export {
  getModulesForCourse,
  getQuizModuleForCourse,
  isModulePublishable,
  moduleStats,
  WOODGATE_QUIZ_MODULE_ID,
} from './dummy-modules';
export type { CourseModule, ContentBlock } from './dummy-modules';
export { getQuizForModule, getQuizSettingsForModule, getQuizStatsForModule } from './dummy-quiz';
export type { QuizQuestion, QuizSettings, QuizStats } from './dummy-quiz';
export { getLearnersForCourse, getLearnerStatsForCourse } from './dummy-learners';
export type { CourseLearner, CourseLearnerStats, Engagement } from './dummy-learners';
export { GLOBAL_LEARNERS, GLOBAL_LEARNER_STATS, GLOBAL_LEARNER_CHIP_COUNTS } from './dummy-global-learners';
export type { GlobalLearner, FirstSalePathProgress } from './dummy-global-learners';

// ── credential.state — derived, never stored (see credential-state.ts) ────
export { deriveCredentialState, credentialStateLabel, formatDate, formatDaysAgo } from './credential-state';
export type { CredentialState } from './credential-state';

// ── REST layer, written ahead of the BE — not yet wired to any screen ─────
export {
  useCourseList,
  useCourseSummary,
  useCreateCourse,
} from './hooks/use-course-list';
export {
  useCourseDetail,
  useUpdateCourse,
  useSetCourseStatus,
  useDeleteCourse,
  useAcademySettings,
  useSetFirstSalePath,
} from './hooks/use-course-detail';

export {
  COURSE_AUDIENCES,
  COURSE_AUDIENCE_LABELS,
  COURSE_STATUSES,
  COURSE_STATUS_LABELS,
  CREDENTIAL_RENEWALS,
  CREDENTIAL_RENEWAL_LABELS,
} from './schemas/course.schema';
export type { Course, CourseAudience, CourseStatus, CourseSummary, CredentialRenewal } from './schemas/course.schema';
export type { AcademySettings } from './schemas/academy-settings.schema';
