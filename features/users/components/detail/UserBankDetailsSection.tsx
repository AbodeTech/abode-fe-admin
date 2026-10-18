'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import type { AdminUserBankAccount } from '../../schemas/user-detail.schema';

/** Bare section — see the note on `UserAssociateProCard`. */
export function UserBankDetailsSection({
  accounts,
  isLoading,
}: {
  accounts: AdminUserBankAccount[] | undefined;
  isLoading: boolean;
}) {
  return (
    <section className="min-w-0">
      <h3 className="font-noto_sans text-lg font-semibold text-[#101828]">Bank details</h3>
      <div className="mt-4">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : !accounts?.length ? (
          <p className="text-sm text-[#8A8B9F]">No bank accounts on file.</p>
        ) : (
          <ul className="space-y-4">
            {accounts.map((account) => (
              <li key={account.id} className="flex min-w-0 items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="wrap-break-word text-sm font-medium text-[#101828]">
                    {account.bank_name || 'Bank'} · {account.account_number_masked}
                  </p>
                  <p className="mt-1 wrap-break-word text-sm text-[#8A8B9F]">
                    {account.account_name || '—'}
                  </p>
                </div>
                {account.is_default ? (
                  <Badge variant="outline" className="shrink-0">
                    Default
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
