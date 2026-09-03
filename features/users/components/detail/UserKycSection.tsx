'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import type { AdminUserKyc } from '../../schemas/user-detail.schema';

function artifactState(value: unknown): string {
  if (!value || typeof value !== 'object') return 'Not started';
  const state = (value as { state?: unknown }).state;
  return typeof state === 'string' && state ? state.replace(/_/g, ' ') : 'Submitted';
}

export function UserKycSection({
  kyc,
  isLoading,
}: {
  kyc: AdminUserKyc | undefined;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">KYC</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : !kyc ? (
          <p className="text-sm text-muted-foreground">No KYC record for this user.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            <li className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">ID document</span>
              <span className="capitalize font-medium">{artifactState(kyc.id_document)}</span>
            </li>
            <li className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Facial</span>
              <span className="capitalize font-medium">{artifactState(kyc.facial)}</span>
            </li>
            <li className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">TIN</span>
              <span className="font-medium">
                {kyc.tin?.value_masked || '—'}
                {kyc.tin?.state ? ` (${kyc.tin.state})` : ''}
              </span>
            </li>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
