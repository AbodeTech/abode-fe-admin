"use client";

import { Users } from "lucide-react";
import type { MeetingStats } from "../types";

interface MeetingStatCardsProps {
  stats: MeetingStats;
}

export function MeetingStatCards({ stats }: MeetingStatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Verified
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stats.total_verifications.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-gray-400">Passed the email gate</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-2.5">
            <Users size={18} className="text-blue-600" />
          </div>
        </div>
      </div>

      {stats.by_referral_status.map((row) => (
        <div
          key={row.referral_status ?? "unknown"}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {row.referral_status ?? "Unknown status"}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {row.count.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">By referral status</p>
        </div>
      ))}
    </div>
  );
}
