import type { PaymentPlanStatus } from '../schemas/payment-plan-row.schema';

export const STATUS_LABELS: Record<PaymentPlanStatus, string> = {
  active: 'Active',
  overdue: 'Overdue',
  suspended: 'Suspended',
  cancelled: 'Terminated',
  completed: 'Completed',
  closed: 'Closed',
};

export const STATUS_BADGE_CLASSES: Record<PaymentPlanStatus, string> = {
  active: 'bg-blue-100 text-blue-800',
  overdue: 'bg-amber-100 text-amber-800',
  suspended: 'bg-gray-200 text-gray-700',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
  closed: 'bg-slate-200 text-slate-800',
};
