/* Commercial plot plans — admin list/detail against the endpoints that exist
 * on abode-be-v2:
 *
 *   GET /admin/commercial/purchase/plans
 *   GET /admin/commercial/purchase/plans/:id
 *
 * Suspend / unsuspend / allocate reuse POST /admin/acquisitions/plans/:planId/*
 * (the FO land-plan actions). There is no commercial transaction or document-
 * plan admin family on the spec.
 */

export { CommercialPlansTable } from './components/CommercialPlansTable';
export { CommercialPlansFilters } from './components/CommercialPlansFilters';
export { CommercialPlanDetail } from './components/CommercialPlanDetail';

export {
  useCommercialPlans,
  useCommercialPlan,
  DEFAULT_COMMERCIAL_PLANS_LIMIT,
} from './hooks/use-commercial-plans';

export type { CommercialPlan } from './schemas/commercial-plan.schema';
