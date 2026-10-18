'use client';

import { Skeleton } from '@/components/ui/skeleton';

import type { AdminUserKyc } from '../../schemas/user-detail.schema';

function artifactState(value: unknown): string {
  if (!value || typeof value !== 'object') return 'Not started';
  const state = (value as { state?: unknown }).state;
  return typeof state === 'string' && state ? state.replace(/_/g, ' ') : 'Submitted';
}

/** Bare section — see the note on `UserAssociateProCard`. */
export function UserKycSection({
  kyc,
  isLoading,
}: {
  kyc: AdminUserKyc | undefined;
  isLoading: boolean;
}) {
  return (
    <section className="min-w-0">
      <h3 className="font-noto_sans text-lg font-semibold text-[#101828]">KYC</h3>
      <div className="mt-4">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : !kyc ? (
          <p className="text-sm text-[#8A8B9F]">No KYC record for this user.</p>
        ) : (
          // Label left, value right — the same row shape the Personal Info
          // list on the other side of this box uses.
          <ul className="grid gap-y-4">
            <li className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <span className="shrink-0 text-sm font-medium text-[#8A8B9F]">ID document:</span>
              <span className="text-sm font-medium capitalize text-[#101828] sm:text-right">
                {artifactState(kyc.id_document)}
              </span>
            </li>
            <li className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <span className="shrink-0 text-sm font-medium text-[#8A8B9F]">Facial:</span>
              <span className="text-sm font-medium capitalize text-[#101828] sm:text-right">
                {artifactState(kyc.facial)}
              </span>
            </li>
            <li className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <span className="shrink-0 text-sm font-medium text-[#8A8B9F]">TIN:</span>
              <span className="min-w-0 wrap-break-word text-sm font-medium text-[#101828] sm:text-right">
                {kyc.tin?.value_masked || '—'}
                {kyc.tin?.state ? ` (${kyc.tin.state})` : ''}
              </span>
            </li>
          </ul>
        )}
      </div>
    </section>
  );
}
