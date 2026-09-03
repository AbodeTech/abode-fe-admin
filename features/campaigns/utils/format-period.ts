export function formatDate(value: string | undefined | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatPeriod(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

export function daysRemaining(endDate: string): number {
  const end = new Date(endDate).getTime();
  if (Number.isNaN(end)) return 0;
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}
