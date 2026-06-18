export type PaymentStatus = 'Paid' | 'Still Paying' | 'Unpaid';

export interface PaymentStatusSource {
  amount_paid?: number | null;
  amount_payable?: number | null;
  balance?: number | null;
  price?: number | null;
}

// The API coerces zero values to null (a fully-paid plan comes back with
// balance: null), so a missing balance can't be read as "unknown" — the
// paid-vs-payable comparison is the tie-breaker.
export function derivePaymentStatus(record: PaymentStatusSource): PaymentStatus {
  const amountPaid = Number(record.amount_paid) || 0;
  if (amountPaid <= 0) return 'Unpaid';

  const balance = Number(record.balance) || 0;
  if (balance > 0) return 'Still Paying';

  const payable = Number(record.amount_payable) || Number(record.price) || 0;
  if (payable > 0 && amountPaid < payable) return 'Still Paying';

  return 'Paid';
}

export function paymentProgress(record: PaymentStatusSource): number | null {
  const payable = Number(record.amount_payable) || Number(record.price) || 0;
  if (payable <= 0) return null;
  const amountPaid = Number(record.amount_paid) || 0;
  return Math.min(Math.round((amountPaid / payable) * 100), 100);
}

export function outstandingBalance(record: PaymentStatusSource): number {
  const balance = Number(record.balance) || 0;
  if (balance > 0) return balance;
  const payable = Number(record.amount_payable) || Number(record.price) || 0;
  const amountPaid = Number(record.amount_paid) || 0;
  return Math.max(payable - amountPaid, 0);
}

export const PAYMENT_STATUS_ORDER: Record<PaymentStatus, number> = {
  Paid: 0,
  'Still Paying': 1,
  Unpaid: 2,
};

export const PAYMENT_STATUS_BADGE_CLASSES: Record<PaymentStatus, string> = {
  Paid: 'bg-green-100 text-green-800',
  'Still Paying': 'bg-blue-100 text-blue-800',
  Unpaid: 'bg-red-100 text-red-700',
};
