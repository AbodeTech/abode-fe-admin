'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import type { AdminUserAssociatePro } from '../../schemas/user-detail.schema';

export function UserAssociateProCard({
  data,
  isLoading,
}: {
  data: AdminUserAssociatePro | undefined;
  isLoading: boolean;
}) {
  const agencyId =
    data?.agency && typeof data.agency._id === 'object' && data.agency._id
      ? String((data.agency._id as { toString?: () => string }).toString?.() ?? data.agency._id)
      : data?.agency?._id
        ? String(data.agency._id)
        : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Upline associate pro</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : data?.agency ? (
          <p className="text-sm">
            Agency member: <span className="font-medium">{data.agency.agency_name}</span>
            {data.agency.agency_code ? ` (${data.agency.agency_code})` : ''}
            {agencyId ? <span className="text-muted-foreground"> · {agencyId}</span> : null}
          </p>
        ) : data?.associate_pro ? (
          <div className="text-sm">
            <p className="font-medium">
              {[data.associate_pro.first_name, data.associate_pro.last_name].filter(Boolean).join(' ') ||
                data.associate_pro.email}
            </p>
            <p className="text-muted-foreground">
              Level {data.associate_pro.level}
              {data.associate_pro.email ? ` · ${data.associate_pro.email}` : ''}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No associate-pro in the three-level upline.</p>
        )}
      </CardContent>
    </Card>
  );
}
