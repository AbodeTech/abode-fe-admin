/* ============================================================
 * credential.state — derived, never stored.
 *
 * The data contract is explicit about this: "Never stored — a stored status
 * goes stale the day it expires." Screens 6 and 7 hold raw earned_at /
 * expires_at / revoked_at on their dummy learner rows and call
 * `deriveCredentialState` at render time, rather than carrying a
 * pre-computed "certified" / "expired" field that would silently go wrong
 * the moment the clock crosses expires_at.
 * ============================================================ */

export type CredentialState = 'active' | 'expiring' | 'expired' | 'revoked' | 'none';

const EXPIRING_WINDOW_DAYS = 30;
const DAY_MS = 86_400_000;

export function deriveCredentialState(
  earnedAt: string | null,
  expiresAt: string | null,
  revokedAt: string | null,
  now: Date = new Date()
): CredentialState {
  if (revokedAt) return 'revoked';
  if (!earnedAt || !expiresAt) return 'none';

  const msLeft = new Date(expiresAt).getTime() - now.getTime();
  if (msLeft < 0) return 'expired';
  if (msLeft <= EXPIRING_WINDOW_DAYS * DAY_MS) return 'expiring';
  return 'active';
}

export function credentialStateLabel(
  state: CredentialState,
  expiresAt: string | null,
  now: Date = new Date()
): string {
  switch (state) {
    case 'active':
      return 'Certified';
    case 'expiring': {
      const days = Math.max(0, Math.ceil((new Date(expiresAt!).getTime() - now.getTime()) / DAY_MS));
      return `Lapses in ${days} day${days === 1 ? '' : 's'}`;
    }
    case 'expired':
      return 'Expired';
    case 'revoked':
      return 'Revoked';
    case 'none':
      return 'None';
  }
}

export function formatDate(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** "Today" / "Yesterday" / "N days ago" / "N months ago", from a plain day count — used where dummy rows store daysAgo rather than a timestamp. */
export function formatDaysAgo(daysAgo: number): string {
  if (daysAgo <= 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 60) return `${daysAgo} days ago`;
  const months = Math.round(daysAgo / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}
