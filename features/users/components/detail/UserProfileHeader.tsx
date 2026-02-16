"use client";

import { UserDetail } from "../../types/user.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Calendar, Edit2, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

interface UserProfileHeaderProps {
  user: UserDetail;
}

export function UserProfileHeader({ user }: UserProfileHeaderProps) {
  const getInitials = (first: string, last: string) => {
    return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="bg-white border border-[#E5EAEF] rounded-xl p-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 border-2 border-white shadow-sm">
            <AvatarImage src={user.profile_pic} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback className="bg-[#F2F4F7] text-[#475467] text-xl font-semibold">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#101828]">
                {user.firstName} {user.lastName}
              </h1>
              <Badge variant="outline" className={`
                ${user.is_suspended
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-green-50 text-green-700 border-green-200"}
              `}>
                {user.is_suspended ? "Suspended" : "Active"}
              </Badge>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                {user.referral_status}
              </Badge>
            </div>

            <p className="text-[#667085] text-sm mb-4">@{user.userName || user.firstName.toLowerCase()}</p>

            <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-[#475467]">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#98A2B3]" />
                {user.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#98A2B3]" />
                {user.phoneNumber}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#98A2B3]" />
                {user.country || "No Country"}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#98A2B3]" />
                DOB: {formatDate(user.date_of_birth)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </Button>
          {user.is_suspended ? (
            <Button variant="outline" className="gap-2 text-green-700 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-800">
              <ShieldAlert className="h-4 w-4" />
              Unsuspend User
            </Button>
          ) : (
            <Button variant="outline" className="gap-2 text-red-700 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-800">
              <ShieldAlert className="h-4 w-4" />
              Suspend User
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
