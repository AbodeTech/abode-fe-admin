/**
 * Recruitment Admin FE — ABO-5, ABO-11–17.
 * Consumes provisional `/api/v1/admin/academy/*` (mocked until BE ABO-33+).
 */

export { ProgrammesListPage } from './components/ProgrammesListPage';
export { ProgrammeCreatePage } from './components/ProgrammeCreatePage';
export { ProgrammeDetailPage } from './components/ProgrammeDetailPage';
export { CohortDashboardPage } from './components/CohortDashboardPage';
export { CohortRegistrantsPage } from './components/CohortRegistrantsPage';
export { CohortReferralsPage } from './components/CohortReferralsPage';
export { CohortSessionsPage } from './components/CohortSessionsPage';
export { CohortTestsPage } from './components/CohortTestsPage';
export { CohortSettingsPage } from './components/CohortSettingsPage';
export { CohortShell } from './components/CohortShell';
export { ScheduleBuilder } from './components/ScheduleBuilder';

export {
  useProgrammes,
  useProgramme,
  useProgrammesCohorts,
  useCreateProgramme,
  usePatchProgramme,
  useToggleProgrammeActive,
  useCreateCohort,
  useCohort,
  usePatchCohort,
  useToggleCohortRegistration,
  useSetDefaultCohort,
  useCohortDashboard,
  useCohortRegistrants,
  usePatchRegistrant,
  useDeleteRegistrant,
  useExportRegistrants,
  useCohortReferrals,
  useExportReferrals,
  useCohortTests,
  useCohortTest,
  useCreateCohortTest,
  useUpdateCohortTest,
  useReplaceTestQuestions,
  useToggleCohortTestActive,
  useCohortTestAttempts,
  useExportTestAttempts,
  DEFAULT_PROGRAMMES_LIMIT,
  DEFAULT_REGISTRANTS_LIMIT,
} from './hooks/use-recruitment';

export type {
  Programme,
  CohortSummary,
  Registrant,
  UpdateRegistrantInput,
  ReferralRow,
  CohortDashboard,
  Outcomes,
  ScheduleInput,
} from './schemas/programme.schema';
export type { RegistrantFilters } from './hooks/use-recruitment';
export type {
  CohortTest,
  TestAttempt,
  TestEligibilityType,
  CreateCohortTestInput,
  UpdateCohortTestInput,
} from './schemas/test.schema';
