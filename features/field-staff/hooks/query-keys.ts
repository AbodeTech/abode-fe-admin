import type { FieldStaffStatus, FieldStaffType } from '../schemas/field-staff.schema';
import type { FieldMetricKey, ScorecardState } from '../schemas/scorecard.schema';
import type { SubmissionStatus } from '../schemas/submission.schema';

/** Mirrors ListFieldStaffDto — a param it doesn't declare is a hard 400. */
export type FieldStaffListFilters = {
  staff_type?: FieldStaffType;
  status?: FieldStaffStatus;
  search?: string;
  page?: number;
  limit?: number;
};

/** Mirrors ListScorecardsDto. `current_only` defaults to true on the server. */
export type ScorecardFilters = {
  field_staff_id?: string;
  asset_id?: string;
  year?: number;
  month?: number;
  state?: ScorecardState;
  current_only?: boolean;
  page?: number;
  limit?: number;
};

/** Mirrors ListSubmissionsDto. There is no staff_type filter on the server. */
export type SubmissionFilters = {
  field_staff_id?: string;
  asset_id?: string;
  status?: SubmissionStatus;
  metric_key?: FieldMetricKey;
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
};

export const fieldStaffKeys = {
  all: ['field-staff'] as const,

  metrics: () => [...fieldStaffKeys.all, 'metrics'] as const,
  assetOptions: () => [...fieldStaffKeys.all, 'asset-options'] as const,

  staff: () => [...fieldStaffKeys.all, 'staff'] as const,
  staffList: (filters: FieldStaffListFilters) => [...fieldStaffKeys.staff(), 'list', filters] as const,
  staffDetail: (id: string) => [...fieldStaffKeys.staff(), 'detail', id] as const,
  assignments: (staffId: string) => [...fieldStaffKeys.staffDetail(staffId), 'assignments'] as const,

  scorecards: () => [...fieldStaffKeys.all, 'scorecards'] as const,
  scorecardList: (filters: ScorecardFilters) => [...fieldStaffKeys.scorecards(), 'list', filters] as const,

  submissions: () => [...fieldStaffKeys.all, 'submissions'] as const,
  submissionList: (filters: SubmissionFilters) => [...fieldStaffKeys.submissions(), 'list', filters] as const,
  submission: (id: string) => [...fieldStaffKeys.submissions(), 'detail', id] as const,

  performance: () => [...fieldStaffKeys.all, 'performance'] as const,
  summary: (staffType: FieldStaffType, year: number, month: number) =>
    [...fieldStaffKeys.performance(), 'summary', staffType, year, month] as const,
  staffMonth: (staffId: string, year: number, month: number) =>
    [...fieldStaffKeys.performance(), 'staff', staffId, year, month] as const,
  siteSetup: (assetId: string) => [...fieldStaffKeys.performance(), 'site-setup', assetId] as const,
};
