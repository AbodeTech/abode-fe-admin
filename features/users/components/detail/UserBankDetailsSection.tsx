'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import type { AdminUserBankAccount } from '../../schemas/user-detail.schema';

export function UserBankDetailsSection({
  accounts,
  isLoading,
}: {
  accounts: AdminUserBankAccount[] | undefined;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Bank details</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : !accounts?.length ? (
          <p className="text-sm text-muted-foreground">No bank accounts on file.</p>
        ) : (
          <ul className="space-y-3">
            {accounts.map((account) => (
              <li
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {account.bank_name || 'Bank'} · {account.account_number_masked}
                  </p>
                  <p className="text-muted-foreground">{account.account_name || '—'}</p>
                </div>
                {account.is_default ? <Badge variant="outline">Default</Badge> : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
