'use client';

import { STATUS_BADGE_CLASSES, STATUS_LABELS } from '../constants/status-colors';
import type { PaymentPlanStatus } from '../schemas/payment-plan-row.schema';

export function PaymentPlansStatusBadge({ status }: { status: PaymentPlanStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
