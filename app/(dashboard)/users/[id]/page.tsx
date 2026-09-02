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
import {
  useUserAssociatePro,
  useUserBankDetails,
  useUserCampaignStandings,
  useUserDetailTransactions,
  useUserKyc,
} from "@/features/users/hooks/use-user-detail";
import { UserKycSection } from "@/features/users/components/detail/UserKycSection";
import { UserBankDetailsSection } from "@/features/users/components/detail/UserBankDetailsSection";
import { UserAssociateProCard } from "@/features/users/components/detail/UserAssociateProCard";
import { UserCampaignStandings } from "@/features/users/components/detail/UserCampaignStandings";
import { ViewClientAssetModal } from "@/features/users/components/modals/ViewClientAssetModal";
import { ManagerAssignmentCard } from "@/features/associate-managers/components/ManagerAssignmentCard";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";

export default function UserDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const permissions = useAdminPermissions();
  const canViewKyc = permissions.has("view_kyc");
  const canViewBank = permissions.has("view_user_bank_details");

  const { data: user, isLoading, error } = useUserDetails(id);
  const { data: referrals } = useUserReferrals(id);
  const { data: commissionTx } = useUserDetailTransactions(id, "commission");
  const { data: otherTx } = useUserDetailTransactions(id, "other");
  const { data: kyc, isLoading: kycLoading } = useUserKyc(id, canViewKyc);
  const { data: bank, isLoading: bankLoading } = useUserBankDetails(id, canViewBank);
  const { data: associatePro, isLoading: associateProLoading } = useUserAssociatePro(id);
  const { data: campaigns, isLoading: campaignsLoading } = useUserCampaignStandings(id);

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

  return (
    <main className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-20 sm:mt-6 sm:space-y-8 sm:px-4">
      <div>
        <h3 className="font-semibold font-noto_sans text-3xl text-abodeBlack text-[#101828]">User</h3>
        <h3 className="text-sm text-[#8A8B9F] ml-1">User &gt; <span className="text-[#7F56D9]">Details</span></h3>
      </div>

      <UserProfile user={user} />

      <UserInfo user={user} />

      <ManagerAssignmentCard user={user} />

      <UserAssociateProCard data={associatePro} isLoading={associateProLoading} />

      <UserStats user={user} />

      {canViewKyc ? <UserKycSection kyc={kyc} isLoading={kycLoading} /> : null}
      {canViewBank ? <UserBankDetailsSection accounts={bank} isLoading={bankLoading} /> : null}

      <UserAssetsList userId={id} userEmail={user.email} />

      <UserTransactions commission={commissionTx} other={otherTx} />

      <UserReferralsTable referrals={referrals ?? []} />

      <UserCampaignStandings standings={campaigns} isLoading={campaignsLoading} />

      <ViewClientAssetModal />
    </main>
  );
}
