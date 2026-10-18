import { TriangleAlert } from "lucide-react";

interface Props {
  overdueApprovals: number;
  suspendingSoon: number;
  /** "Tolu's" or "your". */
  bookOwner: string;
}

/** The two things that can't wait: stale approvals and imminent suspensions. */
export function AttentionBanner({ overdueApprovals, suspendingSoon, bookOwner }: Props) {
  if (overdueApprovals === 0 && suspendingSoon === 0) return null;

  const parts: string[] = [];
  if (overdueApprovals > 0) {
    parts.push(
      `${overdueApprovals} payment${overdueApprovals === 1 ? " has" : "s have"} waited over 24 hours for approval`
    );
  }
  if (suspendingSoon > 0) {
    parts.push(
      `${suspendingSoon} plan${suspendingSoon === 1 ? "" : "s"} in ${bookOwner} book will be suspended within 14 days`
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <TriangleAlert className="h-4 w-4 shrink-0 text-amber-700" />
      <span>{parts.join(", and ")}.</span>
    </div>
  );
}
