"use client";

import type { MeetingStats } from "../hooks/mock-meetings";

interface MeetingStatsChartsProps {
  stats: MeetingStats;
}

export function MeetingStatsCharts({ stats }: MeetingStatsChartsProps) {
  const maxTimeline = Math.max(...stats.timeline.map((t) => t.count), 1);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">Verifications Over Time</h3>
        <p className="mt-0.5 text-xs text-gray-500">When attendees joined through the gate</p>
        {stats.timeline.length === 0 ? (
          <p className="mt-8 text-center text-sm text-gray-400">No verifications yet</p>
        ) : (
          <div className="mt-6 flex h-48 items-end gap-1">
            {stats.timeline.map((point, i) => (
              <div key={`${point.date}-${i}`} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-blue-500/80"
                  style={{
                    height: `${Math.max(8, (point.count / maxTimeline) * 100)}%`,
                    minHeight: 8,
                  }}
                  title={`${point.count} at ${new Date(point.date).toLocaleString()}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">Entry Source</h3>
        {stats.source_breakdown.length === 0 ? (
          <p className="mt-8 text-center text-sm text-gray-400">No verifications yet</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {stats.source_breakdown.map((item) => (
              <li key={item.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{item.name}</span>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {stats.region_breakdown.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Attendees by Region</h3>
          <ul className="mt-4 space-y-2">
            {stats.region_breakdown.map((item) => (
              <li key={item.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-600">{item.name}</span>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-violet-500"
                    style={{
                      width: `${Math.round((item.value / stats.total_verified) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {stats.status_breakdown.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Attendee Status</h3>
          <ul className="mt-4 space-y-3">
            {stats.status_breakdown.map((item) => (
              <li key={item.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{item.name}</span>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
