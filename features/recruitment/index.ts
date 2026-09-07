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
export { CohortPlaceholderPage } from './components/CohortPlaceholderPage';
export { CohortShell } from './components/CohortShell';

export {
  useProgrammes,
  useProgramme,
  useCreateProgramme,
  useCreateCohort,
  useCohort,
  useCohortDashboard,
  useCohortRegistrants,
  useCohortReferrals,
  useCohortTests,
  useCreateCohortTest,
  useToggleCohortTestActive,
  useCohortTestAttempts,
  DEFAULT_PROGRAMMES_LIMIT,
  DEFAULT_REGISTRANTS_LIMIT,
} from './hooks/use-recruitment';

export {
  PROGRAMME_TYPES,
  PROGRAMME_TYPE_LABELS,
} from './schemas/programme.schema';
export type {
  Programme,
  CohortSummary,
  Registrant,
  ReferralRow,
  CohortDashboard,
} from './schemas/programme.schema';
