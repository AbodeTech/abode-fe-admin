import type { PaymentPlanReferrer, PaymentPlanUser } from '../schemas/payment-plan-row.schema';

function joinName(first: string | null | undefined, last: string | null | undefined): string {
  return [first, last].filter(Boolean).join(' ').trim();
}

export function buyerLabel(user: PaymentPlanUser): string {
  return joinName(user.first_name, user.last_name) || user.email || user.user_id || '—';
}

export function referrerLabel(referrer: PaymentPlanReferrer): string {
  return (
    joinName(referrer.referrer_first_name, referrer.referrer_last_name) ||
    referrer.referrer_email ||
    '—'
  );
}

export function hasReferrer(referrer: PaymentPlanReferrer): boolean {
  return Boolean(referrer.referrer_id);
}
