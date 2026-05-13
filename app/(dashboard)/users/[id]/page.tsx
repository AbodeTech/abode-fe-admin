"use client";

import {
  useUserDetails,
  useUserReferrals,
  UserProfile,
  UserInfo,
  UserStats,
  UserTransactions,
  UserAssetsList,
  UserReferralsTable,
} from "@/features/users";
import { ViewClientAssetModal } from "@/features/users/components/modals/ViewClientAssetModal";
import type { UserDetail } from "@/features/users";
import type { UserReferralResponse } from "@/lib/api/admin/referrals.types";
import type { TransactionListResponse } from "@/lib/api/admin/transactions.types";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";

export default function UserDetailsPage() {
  const params = useParams<{ id: string }>();
  const { data: user, isLoading, error } = useUserDetails(params.id);
  const { data: referrals } = useUserReferrals(params.id);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-bold text-gray-900">User not found</h2>
        <p className="text-gray-500 mt-2">The user you are looking for does not exist or an error occurred.</p>
      </div>
    );
  }

  const userData = user as UserDetail;
  const referralRows: UserReferralResponse[] = (referrals || [])
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .map((item) => ({
      ...item,
      commission: item.commission ?? 0,
      amount: 0,
    })) as unknown as UserReferralResponse[];

  const transactionRows: TransactionListResponse[] = ((userData.transaction || []).filter(
    (item): item is NonNullable<typeof item> => item !== null
  ).map(t => ({
    ...t,
    amount: t.amount ? parseFloat(t.amount.toString().replace(/[^0-9.-]+/g, "")) : 0
  })) as unknown) as TransactionListResponse[];

  return (
    <main className="mx-6 mt-4 pb-20 space-y-8">
      <div>
        <h3 className="font-semibold font-noto_sans text-3xl text-abodeBlack text-[#101828]">User</h3>
        <h3 className="text-sm text-[#8A8B9F] ml-1">User &gt; <span className="text-[#7F56D9]">Details</span></h3>
      </div>

      <UserProfile user={userData} />

      <UserInfo user={userData} />

      <UserStats user={userData} />

      {/* Assets List Component - To be fully implemented with data logic */}
      <UserAssetsList userId={params.id} userEmail={userData.email} />

      <UserTransactions transactions={transactionRows} />

      <UserReferralsTable referrals={referralRows} />

      <ViewClientAssetModal />
    </main>
  );
}
