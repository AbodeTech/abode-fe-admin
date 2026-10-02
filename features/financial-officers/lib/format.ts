import type { RecoveryPlanRow, RecoveryProduct } from '../schemas/financial-officer.schema';

const DAY_MS = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "9.8 h", or "—" when nothing was decided. */
export const formatHours = (hours: number | null) => (hours == null ? '—' : `${hours.toFixed(1)} h`);

/** ₦1,200,000 */
export const formatNaira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

/** ₦18.45m / ₦950k — for tiles, where the full figure is too wide. */
export const formatNairaCompact = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `₦${Number((n / 1_000_000).toFixed(2))}m`;
  if (Math.abs(n) >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${Math.round(n)}`;
};

export const formatShortDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/** "Mon 21 Sep, 09:12" — the decisions table, where the weekday is the point. */
export const formatDayTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Whole days from now to `iso`; negative when it has passed. */
export const daysUntil = (iso: string, now = Date.now()) =>
  Math.ceil((new Date(iso).getTime() - now) / DAY_MS);

export const PRODUCT_LABELS: Record<RecoveryProduct, string> = {
  flex: 'Flex',
  full_ownership: 'Full ownership',
  commercial: 'Commercial',
};

export const customerName = (c: RecoveryPlanRow['customer']) => `${c.first_name} ${c.last_name}`.trim();

export const customerInitials = (c: RecoveryPlanRow['customer']) =>
  `${c.first_name[0] ?? ''}${c.last_name[0] ?? ''}`.toUpperCase() || '?';

/** What the plan looks like today: "Final month · ₦1,000,000 behind", "21 days past final due date". */
export function recoveryStateLabel(plan: RecoveryPlanRow): string {
  switch (plan.state) {
    case 'cleared':
      return `Cleared ${formatShortDate(plan.left_book_at)}`;
    case 'suspended':
      return `Suspended ${formatShortDate(plan.left_book_at)}`;
    case 'past_due':
      return `${plan.days_past_due} day${plan.days_past_due === 1 ? '' : 's'} past final due date`;
    case 'final_month':
      return `Final month · ${formatNaira(Math.max(0, plan.balance - plan.installment_amount))} behind`;
  }
}

export type SuspensionTone = 'urgent' | 'soon' | 'later' | 'none';

/** How close suspension is, from the date the defaulting crons would suspend it. */
export function suspensionDisplay(plan: RecoveryPlanRow): { label: string; tone: SuspensionTone } {
  if (plan.state === 'cleared' || plan.state === 'suspended' || !plan.suspends_at) {
    return { label: '—', tone: 'none' };
  }
  const d = Math.max(0, daysUntil(plan.suspends_at));
  const label = d === 0 ? 'Today' : `In ${d} day${d === 1 ? '' : 's'}`;
  return { label, tone: d <= 14 ? 'urgent' : d <= 45 ? 'soon' : 'later' };
}
