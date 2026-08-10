"use client";

import type { MeetingStats } from "../types";

interface MeetingStatsChartsProps {
  stats: MeetingStats;
}

export function MeetingStatsCharts({ stats }: MeetingStatsChartsProps) {
  const total = Math.max(stats.total_verifications, 1);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Attendee Status</h3>
      <p className="mt-0.5 text-xs text-gray-500">
        Breakdown of verified attendees by referral status
      </p>

      {stats.by_referral_status.length === 0 ? (
        <p className="mt-8 text-center text-sm text-gray-400">No verifications yet</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {stats.by_referral_status.map((item) => (
            <li key={item.referral_status ?? "unknown"}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.referral_status ?? "Unknown"}
                </span>
                <span className="font-semibold text-gray-900">{item.count}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{
                    width: `${Math.round((item.count / total) * 100)}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
