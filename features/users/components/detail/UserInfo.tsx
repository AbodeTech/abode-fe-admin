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
    { label: "State", value: user.state },
    { label: "LGA", value: user.lga },
    { label: "Gender", value: user.gender },
    { label: "Occupation", value: user.occupation },
    { label: "Education", value: user.education_level },
    { label: "Experience", value: user.experience_level },
    { label: "Marital Status", value: user.marital_status },
    { label: "Address", value: user.address },
    { label: "Employment Status", value: user.employment_status },
    { label: "Status", value: user.referral_status },
    { label: "Verified", value: user.verified ? "Yes" : "No" },
    { label: "How they heard", value: user.acquisition_source },
    { label: "Email", value: user.email },
    { label: "Date of Birth", value: user.date_of_birth ? formatDateWord(user.date_of_birth) : "N/A" },
    {
      label: "Referrer chain",
      value: user.referrer_chain?.length
        ? user.referrer_chain
            .map((entry) => {
              const name = [entry.first_name, entry.last_name].filter(Boolean).join(" ").trim();
              return `L${entry.level}: ${name || entry.email || entry.id}${entry.tier ? ` (${entry.tier})` : ""}`;
            })
            .join(" → ")
        : user.referral
          ? `${user.referral.firstName} ${user.referral.lastName}`
          : "No Referrer",
    },
    { label: "TIN", value: user.kyc?.tin || "Nil" },
  ];

  return (
    <div className="mt-8 grid min-w-0 grid-cols-1 gap-x-8 gap-y-8 rounded-lg border border-[#E5EAEF] bg-white px-4 pb-12 pt-6 sm:px-6 lg:grid-cols-2 lg:gap-x-16 xl:gap-x-24">
      <div className="min-w-0">
        <h3 className="font-semibold text-lg font-noto_sans text-abodeBlack text-[#101828]">Personal Info</h3>
        <ul className="mt-5 grid w-full max-w-full grid-cols-1 gap-y-4 sm:max-w-[450px]">
          {infoItems.map((item, index) => (
            <li key={index} className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <span className="shrink-0 text-sm font-medium text-[#8A8B9F]">{item.label}:</span>
              <span className="min-w-0 wrap-break-word text-sm font-medium capitalize text-[#101828] sm:max-w-[60%] sm:text-right">
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
