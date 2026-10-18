'use client';

import { Skeleton } from '@/components/ui/skeleton';

import type { AdminUserAssociatePro } from '../../schemas/user-detail.schema';

/**
 * Renders bare — no Card. This sits inside Personal Info's bordered box, so a
 * card of its own would nest a box in a box and read as a foreign object
 * beside the plain heading-and-list on the left.
 */
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
    <section className="min-w-0">
      <h3 className="font-noto_sans text-lg font-semibold text-[#101828]">Upline associate pro</h3>
      <div className="mt-4">
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : data?.agency ? (
          <p className="text-sm text-[#101828]">
            Agency member: <span className="font-medium">{data.agency.agency_name}</span>
            {data.agency.agency_code ? ` (${data.agency.agency_code})` : ''}
            {agencyId ? <span className="text-[#8A8B9F]"> · {agencyId}</span> : null}
          </p>
        ) : data?.associate_pro ? (
          <div className="text-sm">
            <p className="font-medium text-[#101828]">
              {[data.associate_pro.first_name, data.associate_pro.last_name].filter(Boolean).join(' ') ||
                data.associate_pro.email}
            </p>
            <p className="mt-1 text-[#8A8B9F]">
              Level {data.associate_pro.level}
              {data.associate_pro.email ? ` · ${data.associate_pro.email}` : ''}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[#8A8B9F]">No associate-pro in the three-level upline.</p>
        )}
      </div>
    </section>
  );
}
