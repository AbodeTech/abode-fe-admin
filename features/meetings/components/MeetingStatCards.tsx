"use client";

import { Users, Percent, UserPlus, MapPin, Clock, TrendingUp } from "lucide-react";
import type { MeetingStats } from "../hooks/mock-meetings";

interface MeetingStatCardsProps {
  stats: MeetingStats;
}

export function MeetingStatCards({ stats }: MeetingStatCardsProps) {
  const cards = [
    {
      label: "Verified",
      value: stats.total_verified.toLocaleString(),
      hint: "Passed the email gate",
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Attendance rate",
      value: `${stats.attendance_rate}%`,
      hint: `Of ${stats.audience_total.toLocaleString()} in audience`,
      icon: Percent,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "New via gate",
      value: stats.new_signups.toLocaleString(),
      hint: "Registered during this session",
      icon: UserPlus,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      label: "Regions",
      value: stats.regions_covered.toLocaleString(),
      hint: "Geographic spread of attendees",
      icon: MapPin,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {card.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{card.hint}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${card.iconBg}`}>
                  <Icon size={18} className={card.iconColor} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(stats.peak_time || stats.verifications_per_hour > 0) && (
        <div className="flex flex-wrap gap-4 rounded-xl border border-gray-200 bg-gray-50/50 px-5 py-3">
          {stats.peak_time && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={15} className="text-gray-400" />
              <span>
                Peak join time:{" "}
                <span className="font-semibold text-gray-900">{stats.peak_time}</span>
              </span>
            </div>
          )}
          {stats.verifications_per_hour > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp size={15} className="text-gray-400" />
              <span>
                Avg pace:{" "}
                <span className="font-semibold text-gray-900">
                  {stats.verifications_per_hour}/hr
                </span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
