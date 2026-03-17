"use client";

import { UserDetail } from "../../types/user.types";
import { format } from "date-fns";

interface UserInfoProps {
  user: UserDetail;
}

const formatDateWord = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch {
    return "N/A";
  }
};

export function UserInfo({ user }: UserInfoProps) {
  // Ordered fields to match typical display or legacy expectations where possible
  const infoItems = [
    { label: "Last Name", value: user.lastName },
    { label: "User Name", value: user.userName },
    { label: "First Name", value: user.firstName },
    { label: "Phone Number", value: user.phoneNumber },
    { label: "Country", value: user.country },
    { label: "Gender", value: user.gender },
    { label: "Occupation", value: user.occupation },
    { label: "Marital Status", value: user.marital_status },
    { label: "Address", value: user.address },
    { label: "Employment Status", value: user.employment_status },
    { label: "Status", value: user.referral_status },
    { label: "Email", value: user.email },
    { label: "Date of Birth", value: user.date_of_birth ? formatDateWord(user.date_of_birth) : "N/A" },
    { label: "Referrer", value: user.referral ? `${user.referral.firstName} ${user.referral.lastName}` : "No Referrer" },
    { label: "TIN", value: user.kyc?.tin || "Nil" },
  ];

  return (
    <div className="bg-white rounded-lg border border-[#E5EAEF] px-8 pt-6 pb-12 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-x-40 gap-y-8">
      <div>
        <h3 className="font-semibold text-lg font-noto_sans text-abodeBlack text-[#101828]">Personal Info</h3>
        <ul className="mt-5 w-full max-w-[450px] grid grid-cols-1 gap-y-4">
          {infoItems.map((item, index) => (
            <li key={index} className="flex justify-between items-center">
              <span className="text-sm font-medium text-[#8A8B9F]">{item.label}:</span>
              <span className="text-sm text-right font-medium text-[#101828] capitalize">
                {item.value || "Empty"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 
         The legacy component had a 2-column grid layout where the second column was mostly empty 
         or used for other sections. We'll keep the structure ready if more fields are needed 
         on the right side, or we can distribute the items. For now, following the single list 
         on the left side as seen in the legacy code's populated section.
      */}
    </div>
  );
}
